import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { parseSpreadsheet } from "../src/importer.js";

function workbookBuffer(rows:Record<string,unknown>[]){
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Orders");
  return XLSX.write(wb,{type:"buffer",bookType:"xlsx"}) as Buffer;
}

test("valid spreadsheet row becomes an executable import row",()=>{
  const rows=parseSpreadsheet(workbookBuffer([{
    user_id:"U001",full_name:"Amit",address:"House 1",city:"Jalandhar",state:"Punjab",pincode:"144001",
    flipkart_link:"https://www.flipkart.com/example/p/itm123",quantity:1,max_price:14999
  }]));
  assert.equal(rows.length,1);
  assert.equal(rows[0]?.ok,true);
  assert.equal(rows[0]?.data?.userId,"U001");
  assert.equal(rows[0]?.data?.maxPriceMinor,1499900);
});

test("rejects non-Flipkart product URLs and invalid pincodes",()=>{
  const rows=parseSpreadsheet(workbookBuffer([{
    user_id:"U002",address:"House 2",city:"Delhi",state:"Delhi",pincode:"123",
    flipkart_link:"https://example.com/product",quantity:1,max_price:1000
  }]));
  assert.equal(rows[0]?.ok,false);
  assert.match(rows[0]?.error||"",/Flipkart|Invalid/i);
});
