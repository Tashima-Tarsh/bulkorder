import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import { parseRecipients, templateCsv } from "./importer.js";
import { fetchFlipkartProduct, validateFlipkartUrl } from "./product.js";
import { renderUi } from "./ui.js";

type OrderStatus=
  |"QUEUED"|"PRODUCT_CHECK"|"CART"|"ADDRESS"|"CARD_READY"|"PAYMENT"
  |"OTP_REQUIRED"|"PAYMENT_AUTH_REQUIRED"|"CONFIRMING"|"CONFIRMED"|"FAILED";

type Recipient={
  id:string; rowNumber:number; userId:string; fullName:string; mobile:string;
  addressLine1:string; addressLine2:string; city:string; state:string; pincode:string;
};

type Order={
  id:string; sequence:number; userId:string; recipient:Recipient; quantity:number;
  expectedMinor:number; maxMinor:number; cardLimitMinor:number; virtualCardRef:string;
  cardStatus:"DEMO_READY"|"CONNECTOR_REQUIRED"; status:OrderStatus; authCleared:boolean;
  demoOrderRef:string|null; updatedAt:string; history:{status:OrderStatus;at:string}[];
};

const state:{
  product:null|{url:string;title:string;image:string|null;priceMinor:number|null;source:string;message?:string};
  plan:null|{quantity:number;maxPriceMinor:number};
  funding:{prepared:boolean;masterLabel:string;last4:string;provider:string;mode:"demo"};
  recipients:Recipient[];
  invalidRecipients:{rowNumber:number;error:string}[];
  uploadFile:string|null;
  orders:Order[];
}={
  product:null,
  plan:null,
  funding:{prepared:false,masterLabel:"",last4:"",provider:"Demo issuer connector",mode:"demo"},
  recipients:[],
  invalidRecipients:[],
  uploadFile:null,
  orders:[]
};

const app=Fastify({logger:true});
await app.register(multipart,{limits:{files:1,fileSize:8*1024*1024}});

function moneyMinor(value:unknown){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)throw new Error("Amount must be greater than zero");
  return Math.round(n*100);
}

function snapshot(){
  const counts:Record<string,number>={};
  for(const order of state.orders)counts[order.status]=(counts[order.status]||0)+1;
  return {
    ...state,
    summary:{
      totalOrders:state.orders.length,
      totalUnits:state.orders.reduce((n,o)=>n+o.quantity,0),
      expectedMinor:state.orders.reduce((n,o)=>n+o.expectedMinor,0),
      actionRequired:(counts.OTP_REQUIRED||0)+(counts.PAYMENT_AUTH_REQUIRED||0),
      confirmed:counts.CONFIRMED||0,
      counts
    }
  };
}

function setStatus(order:Order,status:OrderStatus){
  order.status=status;
  order.updatedAt=new Date().toISOString();
  order.history.push({status,at:order.updatedAt});
}

function advanceOrder(order:Order){
  if(["OTP_REQUIRED","PAYMENT_AUTH_REQUIRED","CONFIRMED","FAILED"].includes(order.status))return;
  switch(order.status){
    case "QUEUED": return setStatus(order,"PRODUCT_CHECK");
    case "PRODUCT_CHECK": return setStatus(order,"CART");
    case "CART": return setStatus(order,"ADDRESS");
    case "ADDRESS": return setStatus(order,"CARD_READY");
    case "CARD_READY": return setStatus(order,"PAYMENT");
    case "PAYMENT":
      if(order.authCleared)return setStatus(order,"CONFIRMING");
      if(order.sequence%7===0)return setStatus(order,"OTP_REQUIRED");
      if(order.sequence%5===0)return setStatus(order,"PAYMENT_AUTH_REQUIRED");
      return setStatus(order,"CONFIRMING");
    case "CONFIRMING":
      order.demoOrderRef="DEMO-ORDER-"+String(order.sequence).padStart(4,"0");
      return setStatus(order,"CONFIRMED");
  }
}

app.get("/health",async()=>({status:"ok",mode:"local-workflow-demo"}));
app.get("/api/state",async()=>snapshot());
app.get("/api/template.csv",async(_req,reply)=>{
  reply.header("content-type","text/csv; charset=utf-8");
  reply.header("content-disposition",'attachment; filename="bulkorder-customers.csv"');
  return templateCsv;
});

app.post("/api/product/check",async(req,reply)=>{
  const url=String((req.body as any)?.url||"").trim();
  if(!validateFlipkartUrl(url))return reply.code(400).send({error:"Enter a valid https://flipkart.com product link"});
  const product=await fetchFlipkartProduct(url);
  state.product=product;
  state.plan=null;
  state.orders=[];
  return {product};
});

app.post("/api/product/plan",async(req,reply)=>{
  const body=(req.body as any)||{};
  const url=String(body.url||state.product?.url||"").trim();
  if(!validateFlipkartUrl(url))return reply.code(400).send({error:"Valid Flipkart URL required"});
  const title=String(body.title||state.product?.title||"Flipkart product").trim().slice(0,240);
  let priceMinor:number;
  let maxPriceMinor:number;
  try{
    priceMinor=moneyMinor(body.price);
    maxPriceMinor=moneyMinor(body.maxPrice);
  }catch(error:any){return reply.code(400).send({error:error.message})}
  const quantity=Number(body.quantity);
  if(!Number.isInteger(quantity)||quantity<1||quantity>10000)return reply.code(400).send({error:"Quantity must be 1 to 10000"});
  if(maxPriceMinor<priceMinor)return reply.code(400).send({error:"Maximum price cannot be below current price"});
  state.product={url,title,image:state.product?.image||null,priceMinor,source:state.product?.source||"manual",message:state.product?.message};
  state.plan={quantity,maxPriceMinor};
  state.orders=[];
  return snapshot();
});

app.post("/api/funding/prepare",async(req,reply)=>{
  const body=(req.body as any)||{};
  if(!state.plan||!state.product?.priceMinor)return reply.code(409).send({error:"Configure product and quantity first"});
  const last4=String(body.last4||"").trim();
  if(last4&&!/^\d{4}$/.test(last4))return reply.code(400).send({error:"Enter only the last 4 digits of the master funding card"});
  state.funding={
    prepared:true,
    masterLabel:String(body.masterLabel||"Master corporate funding").trim().slice(0,80),
    last4,
    provider:"Demo issuer connector",
    mode:"demo"
  };
  state.orders=[];
  return snapshot();
});

app.post("/api/recipients",async(req,reply)=>{
  const file=await req.file();
  if(!file)return reply.code(400).send({error:"Excel/CSV file required"});
  if(!/\.(xlsx|xls|csv)$/i.test(file.filename||""))return reply.code(415).send({error:"Use .xlsx, .xls or .csv"});
  let rows;
  try{rows=parseRecipients(await file.toBuffer())}
  catch(error:any){return reply.code(422).send({error:String(error?.message||"Could not read spreadsheet")})}
  const recipients:Recipient[]=[];
  const invalid:{rowNumber:number;error:string}[]=[];
  for(const row of rows){
    if(!row.ok||!row.data){invalid.push({rowNumber:row.rowNumber,error:row.error||"Invalid row"});continue}
    const d=row.data;
    recipients.push({
      id:randomUUID(),rowNumber:row.rowNumber,userId:d.userId,fullName:d.fullName,mobile:d.mobile,
      addressLine1:d.addressLine1,addressLine2:d.addressLine2,city:d.city,state:d.state,pincode:d.pincode
    });
  }
  state.recipients=recipients;
  state.invalidRecipients=invalid;
  state.uploadFile=file.filename||"customers.xlsx";
  state.orders=[];
  return snapshot();
});

app.post("/api/orders/create",async(_req,reply)=>{
  if(!state.product?.priceMinor||!state.plan)return reply.code(409).send({error:"Product plan is not ready"});
  if(!state.funding.prepared)return reply.code(409).send({error:"Prepare funding first"});
  if(!state.recipients.length)return reply.code(409).send({error:"Upload at least one valid customer"});
  const allocations=state.recipients.map(()=>0);
  for(let i=0;i<state.plan.quantity;i++)allocations[i%allocations.length]++;
  const orders:Order[]=[];
  let sequence=1;
  allocations.forEach((qty,index)=>{
    if(qty<1)return;
    const recipient=state.recipients[index];
    const expectedMinor=state.product!.priceMinor!*qty;
    const absoluteMax=state.plan!.maxPriceMinor*qty;
    const buffered=Math.ceil(expectedMinor*1.03/100)*100;
    const cardLimitMinor=Math.min(absoluteMax,buffered);
    const now=new Date().toISOString();
    orders.push({
      id:randomUUID(),sequence,userId:recipient.userId,recipient,quantity:qty,
      expectedMinor,maxMinor:absoluteMax,cardLimitMinor,
      virtualCardRef:"DEMO-VC-"+String(sequence).padStart(4,"0"),
      cardStatus:"DEMO_READY",status:"QUEUED",authCleared:false,demoOrderRef:null,
      updatedAt:now,history:[{status:"QUEUED",at:now}]
    });
    sequence++;
  });
  state.orders=orders;
  return snapshot();
});

app.post("/api/orders/:id/advance",async(req,reply)=>{
  const order=state.orders.find(x=>x.id===String((req.params as any).id));
  if(!order)return reply.code(404).send({error:"Order not found"});
  advanceOrder(order);
  return {order};
});

app.post("/api/batch/tick",async()=>{
  const candidates=state.orders.filter(o=>!["OTP_REQUIRED","PAYMENT_AUTH_REQUIRED","CONFIRMED","FAILED"].includes(o.status)).slice(0,4);
  for(const order of candidates)advanceOrder(order);
  return snapshot();
});

app.post("/api/orders/:id/action",async(req,reply)=>{
  const order=state.orders.find(x=>x.id===String((req.params as any).id));
  if(!order)return reply.code(404).send({error:"Order not found"});
  if(!["OTP_REQUIRED","PAYMENT_AUTH_REQUIRED"].includes(order.status))return reply.code(409).send({error:"This order is not waiting for verification"});
  const code=String((req.body as any)?.code||"").trim();
  if(!/^\d{4,8}$/.test(code))return reply.code(400).send({error:"Enter the verification code shown for this checkout"});
  // Demo only: the code is deliberately not stored or logged.
  order.authCleared=true;
  setStatus(order,"CONFIRMING");
  return {order};
});

app.post("/api/reset",async()=>{
  state.product=null;state.plan=null;state.funding={prepared:false,masterLabel:"",last4:"",provider:"Demo issuer connector",mode:"demo"};
  state.recipients=[];state.invalidRecipients=[];state.uploadFile=null;state.orders=[];
  return snapshot();
});

app.get("/",async(_req,reply)=>{
  reply.type("text/html; charset=utf-8");
  return renderUi();
});

const port=Number(process.env.PORT||3000);
await app.listen({host:"0.0.0.0",port});
console.log("BulkOrder running at http://localhost:"+port);
