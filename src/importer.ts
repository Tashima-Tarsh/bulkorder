import * as XLSX from "xlsx";
import { z } from "zod";

const recipientSchema = z.object({
  user_id: z.string().trim().min(1).max(120),
  full_name: z.string().trim().max(160).optional().default(""),
  mobile: z.string().trim().max(20).optional().default(""),
  address_line1: z.string().trim().min(3).max(300),
  address_line2: z.string().trim().max(300).optional().default(""),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits")
});

const aliases: Record<string,string[]> = {
  user_id:["user_id","userid","user id","customer_id","customer id"],
  full_name:["full_name","full name","name"],
  mobile:["mobile","phone","phone_number","phone number"],
  address_line1:["address_line1","address line1","address","delivery_address","delivery address"],
  address_line2:["address_line2","address line2"],
  city:["city"],
  state:["state"],
  pincode:["pincode","pin","pin code","postal_code","postal code"]
};

function normaliseKey(key:string){
  return key.trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
}

function valueFor(row:Record<string,unknown>,target:string){
  const map=new Map(Object.entries(row).map(([k,v])=>[normaliseKey(k),v]));
  for(const alias of aliases[target]??[target]){
    const value=map.get(normaliseKey(alias));
    if(value!==undefined&&value!==null&&String(value).trim()!=="") return value;
  }
  return "";
}

export type RecipientRow={
  rowNumber:number;
  ok:boolean;
  data?:{
    userId:string;
    fullName:string;
    mobile:string;
    addressLine1:string;
    addressLine2:string;
    city:string;
    state:string;
    pincode:string;
  };
  error?:string;
  rawRow:Record<string,unknown>;
};

export function parseRecipients(buffer:Buffer):RecipientRow[]{
  const workbook=XLSX.read(buffer,{type:"buffer"});
  const first=workbook.SheetNames[0];
  if(!first)throw new Error("spreadsheet_has_no_sheet");
  const sheet=workbook.Sheets[first];
  const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:"",raw:false});
  if(rows.length>5000)throw new Error("spreadsheet_row_limit_exceeded");

  return rows.map((rawRow,index)=>{
    const candidate=Object.fromEntries(Object.keys(aliases).map(key=>[key,valueFor(rawRow,key)]));
    const parsed=recipientSchema.safeParse(candidate);
    if(!parsed.success){
      return {rowNumber:index+2,ok:false,error:parsed.error.issues.map(x=>x.message).join("; "),rawRow};
    }
    const d=parsed.data;
    return {
      rowNumber:index+2,
      ok:true,
      rawRow,
      data:{
        userId:d.user_id,
        fullName:d.full_name,
        mobile:d.mobile,
        addressLine1:d.address_line1,
        addressLine2:d.address_line2,
        city:d.city,
        state:d.state,
        pincode:d.pincode
      }
    };
  });
}

export const templateCsv=[
  "user_id,full_name,mobile,address_line1,address_line2,city,state,pincode",
  "U001,Amit Kumar,9999999999,House 1 Example Road,,Jalandhar,Punjab,144001",
  "U002,Neha Sharma,9888888888,Flat 12 Example Towers,Near Market,Delhi,Delhi,110001"
].join("\n");
