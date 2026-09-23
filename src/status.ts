import type { Db } from "./db.js";

export async function refreshImportStatus(db:Db, importId:string) {
  const {rows} = await db.query(`
    select
      count(*)::int total,
      count(*) filter(where status='INVALID')::int invalid,
      count(*) filter(where status in ('QUEUED','PROCESSING'))::int pending,
      count(*) filter(where status in ('READY_FOR_EXECUTION','DISPATCHED'))::int processed,
      count(*) filter(where status='FAILED')::int failed
    from import_rows where import_id=$1
  `,[importId]);
  const r=rows[0];
  const done = Number(r.pending)===0;
  const status = done ? (Number(r.invalid)+Number(r.failed)>0 ? "COMPLETED_WITH_ERRORS":"COMPLETED") : "PROCESSING";
  await db.query(`
    update imports set status=$2,total_rows=$3,invalid_rows=$4,processed_rows=$5,failed_rows=$6,updated_at=now()
    where id=$1
  `,[importId,status,r.total,r.invalid,r.processed,r.failed]);
}
