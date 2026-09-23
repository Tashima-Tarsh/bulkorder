import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { parseRecipients } from "../src/importer.js";
import { validateFlipkartUrl } from "../src/product.js";

function workbookBuffer(rows:Record<string,unknown>[]){
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Customers");
  return XLSX.write(wb,{type:"buffer",bookType:"xlsx"}) as Buffer;
}

test("valid customer row is accepted without product data in Excel",()=>{
  const rows=parseRecipients(workbookBuffer([{
    user_id:"U001",full_name:"Amit",mobile:"9999999999",address:"House 1",
    city:"Jalandhar",state:"Punjab",pincode:"144001"
  }]));
  assert.equal(rows.length,1);
  assert.equal(rows[0]?.ok,true);
  assert.equal(rows[0]?.data?.userId,"U001");
  assert.equal(rows[0]?.data?.pincode,"144001");
});

test("invalid pincode is rejected",()=>{
  const rows=parseRecipients(workbookBuffer([{
    user_id:"U002",address:"House 2",city:"Delhi",state:"Delhi",pincode:"123"
  }]));
  assert.equal(rows[0]?.ok,false);
  assert.match(rows[0]?.error||"",/Pincode|6 digits/i);
});

test("Flipkart URL validator only accepts HTTPS Flipkart hosts",()=>{
  assert.equal(validateFlipkartUrl("https://www.flipkart.com/example/p/itm123"),true);
  assert.equal(validateFlipkartUrl("http://www.flipkart.com/example"),false);
  assert.equal(validateFlipkartUrl("https://example.com/product"),false);
});
