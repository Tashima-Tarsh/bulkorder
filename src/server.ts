import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import { parseSpreadsheet, templateCsv } from "./importer.js";

type TaskStatus="INVALID"|"READY"|"STARTED";
type Task={
  id:string; rowNumber:number; userId:string; fullName:string; mobile:string;
  address:string; city:string; state:string; pincode:string; productUrl:string;
  quantity:number; maxPriceMinor:number; status:TaskStatus; error?:string;
};
type ImportRecord={
  id:string; filename:string; createdAt:string; tasks:Task[];
};

const imports:ImportRecord[]=[];
const app=Fastify({logger:true});

await app.register(multipart,{limits:{files:1,fileSize:8*1024*1024}});

app.get("/health",async()=>({status:"ok",mode:"local-demo"}));

app.get("/api/template.csv",async(_req,reply)=>{
  reply.header("content-type","text/csv; charset=utf-8");
  reply.header("content-disposition",'attachment; filename="bulkorder-template.csv"');
  return templateCsv;
});

app.post("/api/imports",async(req,reply)=>{
  const file=await req.file();
  if(!file)return reply.code(400).send({error:"file_required"});
  if(!/\.(xlsx|xls|csv)$/i.test(file.filename||""))return reply.code(415).send({error:"unsupported_file_type"});
  const buffer=await file.toBuffer();
  let rows;
  try{rows=parseSpreadsheet(buffer)}
  catch(error:any){return reply.code(422).send({error:String(error?.message||"spreadsheet_parse_failed")})}
  if(!rows.length)return reply.code(422).send({error:"spreadsheet_has_no_data_rows"});

  const record:ImportRecord={
    id:randomUUID(),
    filename:file.filename||"upload.xlsx",
    createdAt:new Date().toISOString(),
    tasks:rows.map(row=>{
      if(!row.ok||!row.data){
        return {
          id:randomUUID(),rowNumber:row.rowNumber,userId:"INVALID",fullName:"",mobile:"",
          address:"",city:"",state:"",pincode:"",productUrl:"",quantity:0,maxPriceMinor:0,
          status:"INVALID" as const,error:row.error||"Invalid row"
        };
      }
      const d=row.data;
      return {
        id:randomUUID(),rowNumber:row.rowNumber,userId:d.userId,fullName:d.fullName,mobile:d.mobile,
        address:[d.addressLine1,d.addressLine2].filter(Boolean).join(", "),city:d.city,state:d.state,pincode:d.pincode,
        productUrl:d.productUrl,quantity:d.quantity,maxPriceMinor:d.maxPriceMinor,status:"READY" as const
      };
    })
  };
  imports.unshift(record);
  return reply.code(201).send(summary(record));
});

app.get("/api/imports",async()=>({imports:imports.map(summary)}));

app.get("/api/imports/:id",async(req,reply)=>{
  const id=String((req.params as any).id);
  const found=imports.find(x=>x.id===id);
  if(!found)return reply.code(404).send({error:"import_not_found"});
  return {import:summary(found),tasks:found.tasks};
});

app.post("/api/tasks/:id/start",async(req,reply)=>{
  const id=String((req.params as any).id);
  for(const item of imports){
    const task=item.tasks.find(x=>x.id===id);
    if(!task)continue;
    if(task.status==="INVALID")return reply.code(409).send({error:"invalid_task"});
    task.status="STARTED";
    return {ok:true,task};
  }
  return reply.code(404).send({error:"task_not_found"});
});

function summary(record:ImportRecord){
  const valid=record.tasks.filter(x=>x.status!=="INVALID").length;
  const invalid=record.tasks.length-valid;
  const started=record.tasks.filter(x=>x.status==="STARTED").length;
  return {id:record.id,filename:record.filename,createdAt:record.createdAt,total:record.tasks.length,valid,invalid,started};
}

app.get("/",async(_req,reply)=>{
  reply.type("text/html; charset=utf-8");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BulkOrder</title><style>
body{font-family:Arial,sans-serif;background:#f4f6f8;margin:0;color:#111}.wrap{max-width:1100px;margin:40px auto;padding:0 18px}
.card{background:#fff;border:1px solid #ddd;border-radius:14px;padding:22px;margin-bottom:18px}.drop{border:2px dashed #bbb;border-radius:12px;padding:28px;text-align:center}
button,.btn{background:#111;color:#fff;border:0;border-radius:8px;padding:10px 14px;text-decoration:none;cursor:pointer}input{margin:12px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #eee;padding:9px;text-align:left;vertical-align:top}
.bad{color:#b42318}.good{color:#08783f}.muted{color:#667085;font-size:13px}.stats{display:flex;gap:12px;flex-wrap:wrap}.stat{background:#f7f7f8;padding:10px 14px;border-radius:10px}
a{color:#175cd3}
</style></head><body><div class="wrap">
<div class="card"><h1>BulkOrder</h1><p>Upload Excel/CSV and see one backend task created for every valid row.</p>
<div class="drop"><form id="form"><input id="file" type="file" accept=".xlsx,.xls,.csv" required><br>
<button>Upload Excel</button> <a class="btn" href="/api/template.csv">Download template</a></form><p id="msg" class="muted"></p></div></div>
<div class="card"><h2>Imports</h2><div id="imports">No uploads yet.</div></div>
<div class="card" id="detailCard" style="display:none"><h2>Rows / Tasks</h2><div id="detail"></div></div>
</div><script>
const money=n=>'₹'+(Number(n||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
async function load(){
 const d=await fetch('/api/imports').then(r=>r.json());
 if(!d.imports.length){imports.innerHTML='<p>No uploads yet.</p>';return}
 imports.innerHTML='<table><tr><th>File</th><th>Total</th><th>Valid</th><th>Invalid</th><th>Started</th></tr>'+
 d.imports.map(x=>`<tr onclick="showImport('${x.id}')" style="cursor:pointer"><td>${x.filename}</td><td>${x.total}</td><td>${x.valid}</td><td>${x.invalid}</td><td>${x.started}</td></tr>`).join('')+'</table>';
}
async function showImport(id){
 const d=await fetch('/api/imports/'+id).then(r=>r.json());detailCard.style.display='block';
 detail.innerHTML='<div class="stats"><div class="stat">Total <b>'+d.import.total+'</b></div><div class="stat">Valid <b>'+d.import.valid+'</b></div><div class="stat">Invalid <b>'+d.import.invalid+'</b></div><div class="stat">Started <b>'+d.import.started+'</b></div></div><br>'+
 '<table><tr><th>Row</th><th>User</th><th>Address</th><th>Pin</th><th>Product</th><th>Qty</th><th>Max</th><th>Status</th><th></th></tr>'+
 d.tasks.map(t=>`<tr><td>${t.rowNumber}</td><td>${t.userId}</td><td>${t.address||''}<br>${t.city||''} ${t.state||''}</td><td>${t.pincode||''}</td><td>${t.productUrl?'<a href="'+t.productUrl+'" target="_blank">Open Flipkart</a>':''}</td><td>${t.quantity||''}</td><td>${t.maxPriceMinor?money(t.maxPriceMinor):''}</td><td class="${t.status==='INVALID'?'bad':'good'}">${t.status}${t.error?'<br>'+t.error:''}</td><td>${t.status==='READY'?'<button onclick="startTask(\''+t.id+'\')">Start</button>':''}</td></tr>`).join('')+'</table>';
}
async function startTask(id){await fetch('/api/tasks/'+id+'/start',{method:'POST'});const current=document.querySelector('#detailCard');await load();current.scrollIntoView()}
form.onsubmit=async e=>{e.preventDefault();msg.textContent='Reading file…';const fd=new FormData();fd.append('file',file.files[0]);const r=await fetch('/api/imports',{method:'POST',body:fd});const j=await r.json();msg.textContent=r.ok?'Uploaded. '+j.valid+' valid rows, '+j.invalid+' invalid rows.':(j.error||'Upload failed');await load();if(r.ok)showImport(j.id)};
load();
</script></body></html>`;
});

const port=Number(process.env.PORT||3000);
await app.listen({host:"0.0.0.0",port});
console.log(`BulkOrder running at http://localhost:${port}`);
