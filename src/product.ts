export type ProductLookup={
  url:string;
  title:string;
  image:string|null;
  priceMinor:number|null;
  source:"live"|"partial";
  message?:string;
};

function isFlipkartUrl(value:string){
  try{
    const u=new URL(value);
    const host=u.hostname.toLowerCase();
    return u.protocol==="https:"&&(host==="flipkart.com"||host==="www.flipkart.com"||host.endsWith(".flipkart.com"));
  }catch{return false}
}

function decodeHtml(value:string){
  return value
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">");
}

function firstMatch(html:string,patterns:RegExp[]){
  for(const p of patterns){
    const m=html.match(p);
    if(m?.[1])return decodeHtml(m[1].trim());
  }
  return null;
}

function parsePrice(raw:string|null){
  if(!raw)return null;
  const n=Number(raw.replace(/[₹,\s]/g,"").replace(/[^\d.]/g,""));
  return Number.isFinite(n)&&n>0?Math.round(n*100):null;
}

export async function fetchFlipkartProduct(url:string):Promise<ProductLookup>{
  if(!isFlipkartUrl(url))throw new Error("Only https://flipkart.com product links are accepted");
  try{
    const response=await fetch(url,{
      redirect:"follow",
      headers:{
        "user-agent":"Mozilla/5.0 (compatible; BulkOrderProductPreview/1.0)",
        "accept":"text/html,application/xhtml+xml"
      },
      signal:AbortSignal.timeout(10000)
    });
    if(!response.ok)throw new Error("Flipkart returned HTTP "+response.status);
    if(!isFlipkartUrl(response.url))throw new Error("Unexpected redirect outside Flipkart");
    const html=(await response.text()).slice(0,2_000_000);
    const title=firstMatch(html,[
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<title[^>]*>([^<]+)<\/title>/i
    ])||"Flipkart product";
    const image=firstMatch(html,[
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    ]);
    const priceRaw=firstMatch(html,[
      /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
      /"price"\s*:\s*"?(₹?[\d,]+(?:\.\d{1,2})?)/i
    ]);
    const priceMinor=parsePrice(priceRaw);
    return {url:response.url,title,image,priceMinor,source:priceMinor?"live":"partial",message:priceMinor?undefined:"Product page opened, but price could not be read automatically. Enter it manually."};
  }catch(error:any){
    return {url,title:"Flipkart product",image:null,priceMinor:null,source:"partial",message:String(error?.message||"Could not fetch product automatically. Enter price manually.")};
  }
}

export function validateFlipkartUrl(url:string){
  return isFlipkartUrl(url);
}
