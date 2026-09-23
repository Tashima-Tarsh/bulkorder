export function renderUi(){
return String.raw\`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BulkOrder Command Center</title>
<style>
:root{--bg:#07111f;--panel:#0d1b2a;--panel2:#11243a;--line:#20364f;--text:#f8fafc;--muted:#92a3b8;--blue:#5b8cff;--cyan:#52e0d3;--green:#35d07f;--amber:#f7b955;--red:#ff6b76;--white:#fff}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 90% 0,#173d67 0,transparent 30%),var(--bg);color:var(--text);min-height:100vh}
button,input{font:inherit}.app{display:grid;grid-template-columns:238px 1fr;min-height:100vh}.sidebar{border-right:1px solid var(--line);padding:26px 18px;background:rgba(6,15,28,.82);backdrop-filter:blur(18px);position:sticky;top:0;height:100vh}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;margin-bottom:28px}.logo{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,var(--blue),var(--cyan));display:grid;place-items:center;color:#06111f;font-weight:900}
.navLabel{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#61748a;margin:18px 10px 8px}.navItem{padding:11px 12px;border-radius:10px;color:#a9b8c8;margin:4px 0;font-size:14px}.navItem.active{background:#132844;color:#fff}.livePill{margin-top:24px;border:1px solid #2a4667;border-radius:12px;padding:12px;color:#9fb4ca;font-size:12px}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--amber);margin-right:7px}
.main{padding:28px 34px 60px;max-width:1500px;width:100%}.topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}.eyebrow{font-size:12px;color:#6f87a3;text-transform:uppercase;letter-spacing:.15em}.topbar h1{margin:6px 0 4px;font-size:30px}.sub{color:var(--muted);font-size:14px}.demoBadge{padding:9px 12px;border:1px solid #4b3d22;background:#241d10;color:#ffd78c;border-radius:999px;font-size:12px;font-weight:700}
.steps{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:22px 0}.step{background:#0a1726;border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:#7f93aa;display:flex;align-items:center;gap:10px;font-size:13px}.step strong{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#172a40;color:#8ca4bf}.step.done{border-color:#245847;color:#a7f3d0}.step.done strong{background:#174a38;color:#67e8a7}.step.current{border-color:#436db5;background:#10213a;color:#fff}.step.current strong{background:var(--blue);color:#fff}
.grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(320px,.7fr);gap:18px}.card{background:linear-gradient(180deg,rgba(17,36,58,.97),rgba(11,25,42,.97));border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.18);overflow:hidden}.cardHead{padding:20px 22px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}.cardHead h2{font-size:16px;margin:0}.cardBody{padding:22px}.field{margin-bottom:14px}.field label{display:block;color:#9fb0c3;font-size:12px;margin-bottom:7px}.input{width:100%;background:#071522;border:1px solid #29415e;color:#fff;border-radius:11px;padding:12px 13px;outline:none}.input:focus{border-color:#5b8cff;box-shadow:0 0 0 3px rgba(91,140,255,.12)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.btn{border:0;border-radius:11px;padding:11px 16px;font-weight:750;cursor:pointer}.btnPrimary{background:linear-gradient(135deg,#5b8cff,#735bff);color:#fff}.btnGhost{background:#13263d;color:#dce8f6;border:1px solid #29415e}.btnGreen{background:#1f9d62;color:#fff}.btnDanger{background:#3a1820;color:#ffabb3;border:1px solid #71313d}.btn:disabled{opacity:.45;cursor:not-allowed}.actionRow{display:flex;gap:10px;flex-wrap:wrap}
.productPreview{display:grid;grid-template-columns:96px 1fr;gap:15px;padding:14px;border:1px solid #24415e;background:#0a1828;border-radius:14px;margin:15px 0}.productPreview img{width:96px;height:96px;border-radius:10px;object-fit:contain;background:#fff}.productPlaceholder{width:96px;height:96px;border-radius:10px;background:linear-gradient(135deg,#1a3150,#213f65);display:grid;place-items:center;color:#6c8bad;font-weight:800}.price{font-size:26px;font-weight:850;margin-top:5px}.hint{font-size:12px;color:#8095ac;margin-top:6px}
.metricGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.metric{background:#091827;border:1px solid #1f3853;border-radius:13px;padding:13px}.metric .k{font-size:11px;color:#7890aa;text-transform:uppercase}.metric .v{font-size:23px;font-weight:800;margin-top:4px}
.upload{border:1.5px dashed #375675;border-radius:15px;padding:24px;text-align:center;background:#091725}.upload input{max-width:100%}.status{font-size:11px;font-weight:800;padding:5px 8px;border-radius:999px;white-space:nowrap}.s-QUEUED{background:#202d3d;color:#b9c7d7}.s-PRODUCT_CHECK,.s-CART,.s-ADDRESS,.s-CARD_READY,.s-PAYMENT,.s-CONFIRMING{background:#17375f;color:#a7c9ff}.s-OTP_REQUIRED,.s-PAYMENT_AUTH_REQUIRED{background:#4a3515;color:#ffd27d}.s-CONFIRMED{background:#123e2c;color:#7ce4ae}.s-FAILED{background:#441b24;color:#ff9ca6}
.ordersWrap{overflow:auto;max-height:560px;border:1px solid var(--line);border-radius:14px}table{width:100%;border-collapse:collapse;font-size:12px}th{position:sticky;top:0;background:#0c1b2c;color:#7e93aa;text-align:left;padding:10px;border-bottom:1px solid var(--line);z-index:1}td{padding:11px 10px;border-bottom:1px solid #182d43;color:#dce7f4;vertical-align:middle}tr:hover td{background:#102139}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.timeline{display:flex;gap:6px;align-items:center;margin:18px 0}.node{height:6px;flex:1;border-radius:999px;background:#1b334c}.node.on{background:linear-gradient(90deg,var(--blue),var(--cyan))}
.actionBox{border:1px solid #685020;background:#281f10;border-radius:14px;padding:16px;margin-top:12px}.actionBox h3{margin:0 0 6px;color:#ffd17a;font-size:15px}.actionBox p{color:#c9b98f;font-size:12px}.empty{padding:24px;text-align:center;color:#6f859d}.small{font-size:11px;color:#71879f}.divider{height:1px;background:var(--line);margin:18px 0}.success{color:#7ce4ae}.warn{color:#ffd27d}.error{color:#ff9ca6}
.drawer{position:fixed;right:0;top:0;width:min(450px,94vw);height:100vh;background:#091726;border-left:1px solid #2a4059;box-shadow:-20px 0 60px rgba(0,0,0,.35);transform:translateX(102%);transition:.25s;z-index:20;padding:24px;overflow:auto}.drawer.open{transform:translateX(0)}.drawerClose{float:right;background:#172a40;color:#fff;border:0;border-radius:8px;padding:7px 10px;cursor:pointer}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:#f8fafc;color:#0b1220;padding:11px 16px;border-radius:10px;opacity:0;pointer-events:none;transition:.2s;z-index:30;font-weight:700;font-size:13px}.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
@media(max-width:1050px){.app{grid-template-columns:1fr}.sidebar{display:none}.main{padding:20px}.grid{grid-template-columns:1fr}.steps{grid-template-columns:1fr 1fr}.metricGrid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.row{grid-template-columns:1fr}.steps{grid-template-columns:1fr}.metricGrid{grid-template-columns:1fr 1fr}.topbar{gap:10px}.main{padding:14px}.cardBody{padding:16px}}
</style>
</head>
<body>
<div class="app">
<aside class="sidebar">
  <div class="brand"><div class="logo">B</div>BulkOrder</div>
  <div class="navLabel">Workspace</div>
  <div class="navItem active">Command Center</div>
  <div class="navItem">Batches</div>
  <div class="navItem">Action Required</div>
  <div class="navItem">Funding</div>
  <div class="navItem">Reports</div>
  <div class="livePill"><span class="dot"></span>Demo connector mode<br><span class="small">No real card or retailer order is submitted.</span></div>
</aside>

<main class="main">
  <div class="topbar">
    <div><div class="eyebrow">Operations workspace</div><h1>Bulk ordering, one controlled flow.</h1><div class="sub">Product → funding → customers → checkout → confirmation</div></div>
    <div class="demoBadge">DEMO WORKFLOW</div>
  </div>

  <div class="steps" id="steps"></div>

  <div class="grid">
    <div>
      <section class="card" id="productCard">
        <div class="cardHead"><h2>1 · Product & quantity</h2><span id="productState" class="small">Not configured</span></div>
        <div class="cardBody">
          <div class="field"><label>Flipkart product link</label><input id="productUrl" class="input" placeholder="https://www.flipkart.com/..."></div>
          <div class="actionRow"><button class="btn btnPrimary" onclick="checkProduct()">Fetch product</button></div>
          <div id="productPreview"></div>
          <div class="row">
            <div class="field"><label>Current price per unit (₹)</label><input id="currentPrice" class="input" type="number" min="1" step=".01" placeholder="14999"></div>
            <div class="field"><label>Maximum price per unit (₹)</label><input id="maxPrice" class="input" type="number" min="1" step=".01" placeholder="15200"></div>
          </div>
          <div class="row">
            <div class="field"><label>Total units required</label><input id="quantity" class="input" type="number" min="1" max="10000" value="20"></div>
            <div class="field"><label>Estimated total</label><div id="estimated" class="price">₹0</div></div>
          </div>
          <button class="btn btnGreen" onclick="savePlan()">Lock product plan</button>
        </div>
      </section>

      <section class="card" style="margin-top:18px" id="fundingCard">
        <div class="cardHead"><h2>2 · Funding</h2><span id="fundingState" class="small">Waiting for product plan</span></div>
        <div class="cardBody">
          <div class="row">
            <div class="field"><label>Master funding label</label><input id="masterLabel" class="input" value="Corporate Mastercard"></div>
            <div class="field"><label>Master card last 4 only</label><input id="last4" class="input" maxlength="4" placeholder="1234"></div>
          </div>
          <div class="hint">For this UI build, virtual cards are demo references only. A real issuer API must replace this connector before real payments.</div>
          <div class="divider"></div>
          <button class="btn btnPrimary" onclick="prepareFunding()">Prepare virtual-card allocation</button>
        </div>
      </section>

      <section class="card" style="margin-top:18px" id="customersCard">
        <div class="cardHead"><h2>3 · Customer Excel</h2><span id="customerState" class="small">No file uploaded</span></div>
        <div class="cardBody">
          <div class="upload">
            <div style="font-size:30px">⇧</div>
            <h3 style="margin:6px 0">Upload customers</h3>
            <div class="small">user_id, name/mobile, address, city, state, pincode</div>
            <input id="excelFile" type="file" accept=".xlsx,.xls,.csv">
            <div class="actionRow" style="justify-content:center"><button class="btn btnPrimary" onclick="uploadCustomers()">Upload Excel</button><a class="btn btnGhost" href="/api/template.csv">Download template</a></div>
          </div>
          <div id="customerResult"></div>
        </div>
      </section>

      <section class="card" style="margin-top:18px" id="checkoutCard">
        <div class="cardHead"><h2>4 · Checkout command center</h2><div class="actionRow"><button class="btn btnGhost" onclick="createOrders()">Create child orders</button><button id="runBtn" class="btn btnGreen" onclick="toggleRun()">Run demo workflow</button></div></div>
        <div class="cardBody">
          <div id="metrics" class="metricGrid"></div>
          <div id="orders"></div>
        </div>
      </section>
    </div>

    <aside>
      <section class="card" style="position:sticky;top:20px">
        <div class="cardHead"><h2>Batch control</h2><button class="btn btnDanger" onclick="resetAll()">Reset</button></div>
        <div class="cardBody" id="batchSummary"></div>
      </section>
    </aside>
  </div>
</main>
</div>

<div class="drawer" id="drawer"><button class="drawerClose" onclick="closeDrawer()">Close</button><div id="drawerBody"></div></div>
<div class="toast" id="toast"></div>

<script>
var state=null;
var selectedProductTitle="";
var runner=null;
function money(minor){return '₹'+(Number(minor||0)/100).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2})}
function toast(message){var el=document.getElementById('toast');el.textContent=message;el.classList.add('show');setTimeout(function(){el.classList.remove('show')},2200)}
async function api(url,options){
  var r=await fetch(url,options||{});
  var j=await r.json().catch(function(){return{}});
  if(!r.ok)throw new Error(j.error||'Request failed');
  return j;
}
async function refresh(){
  state=await api('/api/state');
  render();
}
function stepState(){
  var p=!!state.plan,f=state.funding.prepared,c=state.recipients.length>0,o=state.orders.length>0;
  return [
    {n:1,t:'Product',done:p,current:!p},
    {n:2,t:'Funding',done:f,current:p&&!f},
    {n:3,t:'Customers',done:c,current:f&&!c},
    {n:4,t:'Checkout',done:o,current:c&&!o},
    {n:5,t:'Confirm',done:state.summary.confirmed>0,current:o}
  ];
}
function render(){
  document.getElementById('steps').innerHTML=stepState().map(function(s){return '<div class="step '+(s.done?'done ':'')+(s.current?'current':'')+'"><strong>'+s.n+'</strong>'+s.t+'</div>'}).join('');
  if(state.product){
    document.getElementById('productUrl').value=state.product.url||'';
    selectedProductTitle=state.product.title||'Flipkart product';
    if(state.product.priceMinor)document.getElementById('currentPrice').value=state.product.priceMinor/100;
    var img=state.product.image?'<img src="'+state.product.image+'" alt="">':'<div class="productPlaceholder">FK</div>';
    document.getElementById('productPreview').innerHTML='<div class="productPreview">'+img+'<div><div class="small">PRODUCT PREVIEW</div><b>'+escapeHtml(state.product.title||'Flipkart product')+'</b><div class="price">'+(state.product.priceMinor?money(state.product.priceMinor):'Price needed')+'</div><div class="hint">'+escapeHtml(state.product.message||'Product data loaded from the supplied link.')+'</div></div></div>';
  }
  if(state.plan){
    document.getElementById('quantity').value=state.plan.quantity;
    document.getElementById('maxPrice').value=state.plan.maxPriceMinor/100;
    document.getElementById('productState').innerHTML='<span class="success">Plan locked</span>';
  }
  recalc();
  document.getElementById('fundingState').innerHTML=state.funding.prepared?'<span class="success">Prepared · demo connector</span>':'Waiting for product plan';
  document.getElementById('customerState').innerHTML=state.uploadFile?'<span class="success">'+escapeHtml(state.uploadFile)+'</span>':'No file uploaded';
  document.getElementById('customerResult').innerHTML=state.uploadFile?'<div class="divider"></div><div class="actionRow"><span class="status s-CONFIRMED">'+state.recipients.length+' valid</span><span class="status s-FAILED">'+state.invalidRecipients.length+' invalid</span></div>':'';
  renderMetrics();
  renderOrders();
  renderSummary();
}
function renderMetrics(){
  var s=state.summary;
  document.getElementById('metrics').innerHTML=[
    ['Orders',s.totalOrders],['Units',s.totalUnits],['Action required',s.actionRequired],['Confirmed',s.confirmed]
  ].map(function(x){return '<div class="metric"><div class="k">'+x[0]+'</div><div class="v">'+x[1]+'</div></div>'}).join('');
}
function renderOrders(){
  if(!state.orders.length){document.getElementById('orders').innerHTML='<div class="empty">Create child orders after product, funding and Excel are ready.</div>';return}
  var rows=state.orders.map(function(o){
    return '<tr onclick="openOrder(\\''+o.id+'\\')" style="cursor:pointer"><td class="mono">#'+String(o.sequence).padStart(3,'0')+'</td><td><b>'+escapeHtml(o.userId)+'</b><br><span class="small">'+escapeHtml(o.recipient.city)+' · '+escapeHtml(o.recipient.pincode)+'</span></td><td>'+o.quantity+'</td><td>'+money(o.expectedMinor)+'</td><td class="mono">'+escapeHtml(o.virtualCardRef)+'</td><td><span class="status s-'+o.status+'">'+o.status.replaceAll('_',' ')+'</span></td><td><button class="btn btnGhost" onclick="event.stopPropagation();advance(\\''+o.id+'\\')">Advance</button></td></tr>';
  }).join('');
  document.getElementById('orders').innerHTML='<div class="ordersWrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Qty</th><th>Expected</th><th>Virtual card</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function renderSummary(){
  var s=state.summary;
  var product=state.product;
  var plan=state.plan;
  var html='<div class="small">CURRENT BATCH</div><h3 style="margin:7px 0 3px">'+escapeHtml(product?product.title:'No product selected')+'</h3>';
  if(plan&&product&&product.priceMinor){
    html+='<div class="divider"></div><div class="row"><div><div class="small">Units</div><b>'+plan.quantity+'</b></div><div><div class="small">Est. total</div><b>'+money(product.priceMinor*plan.quantity)+'</b></div></div>';
    html+='<div class="divider"></div><div class="small">Max price / unit</div><div style="font-size:18px;font-weight:800">'+money(plan.maxPriceMinor)+'</div>';
  }
  html+='<div class="divider"></div><div class="small">Funding</div><div style="margin-top:5px">'+(state.funding.prepared?'<span class="success">● Prepared</span> · '+escapeHtml(state.funding.masterLabel)+(state.funding.last4?' •••• '+state.funding.last4:''):'<span class="warn">○ Not prepared</span>')+'</div>';
  html+='<div class="divider"></div><div class="small">Customers</div><div style="margin-top:5px"><b>'+state.recipients.length+'</b> valid recipients</div>';
  html+='<div class="divider"></div><div class="small">Demo safety</div><p class="small">OTP/payment codes are not stored. Virtual cards and order references shown here are demo workflow references until a real issuer/retailer connector is configured.</p>';
  document.getElementById('batchSummary').innerHTML=html;
}
function recalc(){
  var p=Number(document.getElementById('currentPrice').value||0);
  var q=Number(document.getElementById('quantity').value||0);
  document.getElementById('estimated').textContent='₹'+(p*q).toLocaleString('en-IN',{maximumFractionDigits:2});
}
document.getElementById('currentPrice').addEventListener('input',recalc);
document.getElementById('quantity').addEventListener('input',recalc);

async function checkProduct(){
  try{
    var url=document.getElementById('productUrl').value.trim();
    toast('Fetching product…');
    var j=await api('/api/product/check',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:url})});
    if(j.product.priceMinor){document.getElementById('currentPrice').value=j.product.priceMinor/100;document.getElementById('maxPrice').value=Math.ceil(j.product.priceMinor/100)}
    await refresh();toast(j.product.priceMinor?'Product loaded':'Product loaded; enter price manually');
  }catch(e){toast(e.message)}
}
async function savePlan(){
  try{
    await api('/api/product/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      url:document.getElementById('productUrl').value.trim(),
      title:selectedProductTitle||'Flipkart product',
      price:document.getElementById('currentPrice').value,
      maxPrice:document.getElementById('maxPrice').value,
      quantity:Number(document.getElementById('quantity').value)
    })});
    await refresh();toast('Product plan locked');
  }catch(e){toast(e.message)}
}
async function prepareFunding(){
  try{
    await api('/api/funding/prepare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      masterLabel:document.getElementById('masterLabel').value,last4:document.getElementById('last4').value
    })});
    await refresh();toast('Funding workflow prepared');
  }catch(e){toast(e.message)}
}
async function uploadCustomers(){
  try{
    var f=document.getElementById('excelFile').files[0];if(!f)throw new Error('Choose an Excel or CSV file');
    var fd=new FormData();fd.append('file',f);
    await api('/api/recipients',{method:'POST',body:fd});
    await refresh();toast('Customers imported');
  }catch(e){toast(e.message)}
}
async function createOrders(){
  try{await api('/api/orders/create',{method:'POST'});await refresh();toast('Child orders created')}catch(e){toast(e.message)}
}
async function advance(id){
  try{await api('/api/orders/'+id+'/advance',{method:'POST'});await refresh();openOrder(id)}catch(e){toast(e.message)}
}
async function tick(){
  try{await api('/api/batch/tick',{method:'POST'});await refresh();if(state.summary.totalOrders&&state.summary.confirmed===state.summary.totalOrders&&state.summary.actionRequired===0)toggleRun()}catch(e){toast(e.message);toggleRun()}
}
function toggleRun(){
  var btn=document.getElementById('runBtn');
  if(runner){clearInterval(runner);runner=null;btn.textContent='Run demo workflow';return}
  runner=setInterval(tick,900);btn.textContent='Pause workflow';tick();
}
function openOrder(id){
  var o=state.orders.find(function(x){return x.id===id});if(!o)return;
  var stages=['PRODUCT_CHECK','CART','ADDRESS','CARD_READY','PAYMENT','CONFIRMING','CONFIRMED'];
  var idx=stages.indexOf(o.status);if(o.status==='OTP_REQUIRED'||o.status==='PAYMENT_AUTH_REQUIRED')idx=4;
  var timeline=stages.map(function(s,i){return '<div class="node '+(i<=idx?'on':'')+'" title="'+s+'"></div>'}).join('');
  var action='';
  if(o.status==='OTP_REQUIRED'||o.status==='PAYMENT_AUTH_REQUIRED'){
    action='<div class="actionBox"><h3>'+(o.status==='OTP_REQUIRED'?'Flipkart verification required':'Bank / 3DS verification required')+'</h3><p>This demo pauses only this child order. Enter a 4–8 digit code to demonstrate resuming the same checkout. The code is not stored.</p><input id="actionCode" class="input" inputmode="numeric" maxlength="8" placeholder="Enter verification code"><button class="btn btnPrimary" style="margin-top:9px" onclick="submitAction(\\''+o.id+'\\')">Verify & resume</button></div>';
  }
  document.getElementById('drawerBody').innerHTML='<div class="eyebrow">ORDER #'+String(o.sequence).padStart(3,'0')+'</div><h2>'+escapeHtml(o.userId)+'</h2><div class="status s-'+o.status+'" style="display:inline-block">'+o.status.replaceAll('_',' ')+'</div><div class="timeline">'+timeline+'</div>'+
    '<div class="card" style="box-shadow:none"><div class="cardBody"><div class="small">DELIVERY</div><b>'+escapeHtml(o.recipient.fullName||o.userId)+'</b><div class="hint">'+escapeHtml(o.recipient.addressLine1)+(o.recipient.addressLine2?', '+escapeHtml(o.recipient.addressLine2):'')+'<br>'+escapeHtml(o.recipient.city)+', '+escapeHtml(o.recipient.state)+' '+escapeHtml(o.recipient.pincode)+'</div><div class="divider"></div><div class="row"><div><div class="small">QUANTITY</div><b>'+o.quantity+'</b></div><div><div class="small">EXPECTED</div><b>'+money(o.expectedMinor)+'</b></div></div><div class="divider"></div><div class="small">VIRTUAL CARD</div><b class="mono">'+escapeHtml(o.virtualCardRef)+'</b><div class="hint">Demo reference · limit '+money(o.cardLimitMinor)+'</div></div></div>'+action+
    (o.demoOrderRef?'<div class="actionBox" style="background:#103123;border-color:#245b43"><h3 style="color:#7ce4ae">Confirmed</h3><p>Demo order reference: <b>'+escapeHtml(o.demoOrderRef)+'</b></p></div>':'');
  document.getElementById('drawer').classList.add('open');
}
async function submitAction(id){
  try{
    var code=document.getElementById('actionCode').value;
    await api('/api/orders/'+id+'/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:code})});
    await refresh();openOrder(id);toast('Verification accepted in demo workflow');
  }catch(e){toast(e.message)}
}
function closeDrawer(){document.getElementById('drawer').classList.remove('open')}
async function resetAll(){if(runner){clearInterval(runner);runner=null}await api('/api/reset',{method:'POST'});location.reload()}
function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
refresh();
</script>
</body></html>\`;
}
