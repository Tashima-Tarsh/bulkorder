import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { loadConfig } from "./config.js";
import { createDb } from "./db.js";
import { parseSpreadsheet, templateCsv } from "./importer.js";
import { createImportQueue } from "./queue.js";
import { refreshImportStatus } from "./status.js";

const config=loadConfig();
const db=createDb(config);
const {connection,queue}=createImportQueue(config.REDIS_URL);
const app=Fastify({logger:{redact:["req.headers.authorization"]}});

await app.register(multipart,{
  limits:{files:1,fileSize:8*1024*1024,fields:10}
});

app.get("/health",async()=>{
  const [dbOk,redisOk]=await Promise.all([
    db.query("select 1").then(()=>true).catch(()=>false),
    connection.ping().then(()=>true).catch(()=>false)
  ]);
  return {status:dbOk&&redisOk?"ok":"degraded",database:dbOk?"ok":"down",redis:redisOk?"ok":"down",downstreamConfigured:Boolean(config.DOWNSTREAM_ORDER_API_URL)};
});

app.get("/api/template.csv",async(_req,reply)=>{
  reply.header("content-type","text/csv; charset=utf-8");
  reply.header("content-disposition",'attachment; filename="bulkorder-template.csv"');
  return templateCsv;
});

app.post("/api/imports",async(req,reply)=>{
  const part=await req.file();
  if(!part)return reply.code(400).send({error:"file_required"});
  const filename=part.filename||"upload.xlsx";
  if(!/\.(xlsx|xls|csv)$/i.test(filename))return reply.code(415).send({error:"unsupported_file_type"});
  const buffer=await part.toBuffer();

  let parsed;
  try{parsed=parseSpreadsheet(buffer)}
  catch(error:any){return reply.code(422).send({error:String(error?.message||"spreadsheet_parse_failed")})}
  if(!parsed.length)return reply.code(422).send({error:"spreadsheet_has_no_data_rows"});

  const client=await db.connect();
  let importId="";
  const queuedIds:string[]=[];
  try{
    await client.query("begin");
    const imp=await client.query("insert into imports(filename,status) values($1,'PROCESSING') returning id",[filename]);
    importId=String(imp.rows[0].id);
    let valid=0,invalid=0;
    for(const row of parsed){
      if(!row.ok||!row.data){
        invalid++;
        await client.query(`
          insert into import_rows(import_id,row_number,user_id,address_line1,city,state,pincode,product_url,quantity,max_price_minor,status,error_message,idempotency_key,raw_row)
          values($1,$2,$3,$4,$5,$6,$7,$8,1,1,'INVALID',$9,$10,$11)
        `,[importId,row.rowNumber,"INVALID","","","","","https://www.flipkart.com/",row.error??"Invalid row",`${importId}:invalid:${row.rowNumber}`,JSON.stringify(row.rawRow)]);
        continue;
      }
      valid++;
      const d=row.data;
      const inserted=await client.query(`
        insert into import_rows(
          import_id,row_number,user_id,full_name,mobile,address_line1,address_line2,city,state,pincode,
          product_url,quantity,max_price_minor,status,idempotency_key,raw_row
        ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'QUEUED',$14,$15)
        returning id
      `,[importId,row.rowNumber,d.userId,d.fullName||null,d.mobile||null,d.addressLine1,d.addressLine2||null,d.city,d.state,d.pincode,d.productUrl,d.quantity,d.maxPriceMinor,`${importId}:${d.idempotencyKey}`,JSON.stringify(d.rawRow)]);
      queuedIds.push(String(inserted.rows[0].id));
    }
    await client.query("update imports set total_rows=$2,valid_rows=$3,invalid_rows=$4,queued_rows=$3,updated_at=now() where id=$1",[importId,parsed.length,valid,invalid]);
    await client.query("commit");
  }catch(error){
    await client.query("rollback");
    throw error;
  }finally{client.release()}

  for(const rowId of queuedIds){
    await queue.add("process-row",{rowId,importId},{jobId:rowId});
  }
  await refreshImportStatus(db,importId);
  return reply.code(201).send({importId,totalRows:parsed.length,queuedRows:queuedIds.length,invalidRows:parsed.length-queuedIds.length});
});

app.get("/api/imports",async()=>{
  const {rows}=await db.query("select * from imports order by created_at desc limit 100");
  return {imports:rows};
});

app.get("/api/imports/:id",async(req,reply)=>{
  const id=String((req.params as any).id);
  const imp=await db.query("select * from imports where id=$1",[id]);
  if(!imp.rows[0])return reply.code(404).send({error:"import_not_found"});
  const rows=await db.query(`
    select id,row_number,user_id,full_name,city,state,pincode,product_url,quantity,max_price_minor,status,error_message,downstream_ref,updated_at
    from import_rows where import_id=$1 order by row_number
  `,[id]);
  return {import:imp.rows[0],rows:rows.rows};
});

app.get("/",async(_req,reply)=>{
  reply.type("text/html; charset=utf-8");
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BulkOrder Excel Intake</title>
<style>
body{font-family:Inter,system-ui,sans-serif;margin:0;background:#f6f7f9;color:#15171a}.wrap{max-width:1050px;margin:48px auto;padding:0 20px}
.card{background:#fff;border:1px solid #e1e4e8;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 8px 24px rgba(0,0,0,.04)}
h1{margin:0 0 8px;font-size:34px}p{color:#5b6470}.drop{border:2px dashed #c9ced6;border-radius:14px;padding:30px;text-align:center}
button,.btn{background:#111827;color:#fff;border:0;border-radius:10px;padding:11px 16px;cursor:pointer;text-decoration:none;display:inline-block}
input[type=file]{margin:14px}.muted{font-size:13px;color:#68707d}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:18px 0}
.stat{background:#f7f8fa;padding:12px;border-radius:10px}.stat b{display:block;font-size:22px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:9px;border-bottom:1px solid #eee;text-align:left}th{color:#68707d}
.ok{color:#08783f}.bad{color:#b42318}@media(max-width:700px){.stats{grid-template-columns:1fr 1fr}.wrap{margin-top:20px}}
</style></head><body><div class="wrap">
<div class="card"><h1>BulkOrder</h1><p>Upload one Excel/CSV file. Each valid row becomes a durable backend job.</p>
<div class="drop"><form id="upload"><input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required><br>
<button type="submit">Upload & start jobs</button> <a class="btn" href="/api/template.csv">Download template</a></form>
<div id="msg" class="muted"></div></div></div>
<div class="card"><h2>Latest imports</h2><div id="imports">Loading…</div></div>
<div class="card" id="detailCard" style="display:none"><h2>Import details</h2><div id="detail"></div></div>
</div>
<script>
const money=n=>'₹'+(Number(n||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
async function load(){
 const data=await fetch('/api/imports').then(r=>r.json());
 if(!data.imports.length){imports.innerHTML='<p>No imports yet.</p>';return}
 imports.innerHTML='<table><thead><tr><th>File</th><th>Status</th><th>Total</th><th>Valid</th><th>Invalid</th><th>Processed</th><th>Failed</th></tr></thead><tbody>'+
 data.imports.map(x=>`<tr style="cursor:pointer" onclick="showImport('${x.id}')"><td>${x.filename}</td><td>${x.status}</td><td>${x.total_rows}</td><td>${x.valid_rows}</td><td>${x.invalid_rows}</td><td>${x.processed_rows}</td><td>${x.failed_rows}</td></tr>`).join('')+'</tbody></table>';
}
async function showImport(id){
 const d=await fetch('/api/imports/'+id).then(r=>r.json()); detailCard.style.display='block';
 detail.innerHTML='<div class="stats"><div class="stat"><span>Total</span><b>'+d.import.total_rows+'</b></div><div class="stat"><span>Valid</span><b>'+d.import.valid_rows+'</b></div><div class="stat"><span>Invalid</span><b>'+d.import.invalid_rows+'</b></div><div class="stat"><span>Processed</span><b>'+d.import.processed_rows+'</b></div><div class="stat"><span>Failed</span><b>'+d.import.failed_rows+'</b></div></div>'+
 '<table><thead><tr><th>Row</th><th>User</th><th>Pincode</th><th>Qty</th><th>Max price</th><th>Status</th><th>Error/ref</th></tr></thead><tbody>'+
 d.rows.map(r=>`<tr><td>${r.row_number}</td><td>${r.user_id}</td><td>${r.pincode}</td><td>${r.quantity}</td><td>${money(r.max_price_minor)}</td><td class="${r.status==='FAILED'||r.status==='INVALID'?'bad':'ok'}">${r.status}</td><td>${r.error_message||r.downstream_ref||''}</td></tr>`).join('')+'</tbody></table>';
}
upload.onsubmit=async e=>{e.preventDefault();msg.textContent='Uploading…';const fd=new FormData();fd.append('file',file.files[0]);const r=await fetch('/api/imports',{method:'POST',body:fd});const j=await r.json();msg.textContent=r.ok?`Import started: ${j.importId} · ${j.queuedRows} jobs queued · ${j.invalidRows} invalid`:(j.error||'Upload failed');await load();if(r.ok)showImport(j.importId)};
load();setInterval(load,5000);
</script></body></html>`;
});

const shutdown=async()=>{await app.close();await queue.close();connection.disconnect();await db.end();process.exit(0)};
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
await app.listen({port:config.PORT,host:"0.0.0.0"});
