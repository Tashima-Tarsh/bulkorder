import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { loadConfig } from "./config.js";
import { createDb } from "./db.js";
import { refreshImportStatus } from "./status.js";

const config=loadConfig();
const db=createDb(config);
const connection=new Redis(config.REDIS_URL,{maxRetriesPerRequest:null});

async function dispatchRow(row:any){
  if(!config.DOWNSTREAM_ORDER_API_URL)return {status:"READY_FOR_EXECUTION",ref:null};
  const payload={
    source:"bulkorder_excel",
    rowId:row.id,
    importId:row.import_id,
    userId:row.user_id,
    customer:{fullName:row.full_name,mobile:row.mobile},
    delivery:{addressLine1:row.address_line1,addressLine2:row.address_line2,city:row.city,state:row.state,pincode:row.pincode},
    product:{url:row.product_url,quantity:Number(row.quantity),maxPriceMinor:Number(row.max_price_minor)}
  };
  const headers:Record<string,string>={
    "content-type":"application/json",
    "x-idempotency-key":row.idempotency_key
  };
  if(config.DOWNSTREAM_ORDER_API_TOKEN)headers.authorization=`Bearer ${config.DOWNSTREAM_ORDER_API_TOKEN}`;
  const response=await fetch(config.DOWNSTREAM_ORDER_API_URL,{method:"POST",headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(20_000)});
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(String(body?.message||body?.error||`downstream_http_${response.status}`).slice(0,250));
  return {status:"DISPATCHED",ref:String(body?.orderId||body?.taskId||body?.id||"accepted")};
}

const worker=new Worker("bulkorder-rows",async job=>{
  const rowId=String(job.data.rowId),importId=String(job.data.importId);
  const claimed=await db.query("update import_rows set status='PROCESSING',error_message=null,updated_at=now() where id=$1 and status='QUEUED' returning *",[rowId]);
  if(!claimed.rows[0]){
    const existing=await db.query("select status from import_rows where id=$1",[rowId]);
    if(["READY_FOR_EXECUTION","DISPATCHED"].includes(String(existing.rows[0]?.status)))return existing.rows[0];
    throw new Error("row_not_claimable");
  }
  const row=claimed.rows[0];
  try{
    const result=await dispatchRow(row);
    await db.query("update import_rows set status=$2,downstream_ref=$3,error_message=null,updated_at=now() where id=$1",[rowId,result.status,result.ref]);
    await refreshImportStatus(db,importId);
    return result;
  }catch(error:any){
    await db.query("update import_rows set status='QUEUED',error_message=$2,updated_at=now() where id=$1",[rowId,String(error?.message||error).slice(0,250)]);
    await refreshImportStatus(db,importId);
    throw error;
  }
},{connection,concurrency:8,lockDuration:120000});

worker.on("failed",async(job,error)=>{
  if(!job)return;
  const max=Number(job.opts.attempts||1);
  if(job.attemptsMade>=max){
    const rowId=String(job.data.rowId),importId=String(job.data.importId);
    await db.query("update import_rows set status='FAILED',error_message=$2,updated_at=now() where id=$1",[rowId,String(error.message).slice(0,250)]).catch(()=>{});
    await refreshImportStatus(db,importId).catch(()=>{});
  }
});

const shutdown=async()=>{await worker.close();connection.disconnect();await db.end();process.exit(0)};
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
console.log("BulkOrder worker listening on bulkorder-rows");
