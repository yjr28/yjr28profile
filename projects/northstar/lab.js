
const now=()=>Date.now();
let idSeq=100;
const makeId=(prefix)=>prefix+"-"+(++idSeq).toString(16).padStart(4,"0");
const hosts=[
  {id:"h-atl-01",name:"edge-atl-01",region:"ATL",os:"linux",arch:"amd64",agent:"0.3.0",cpu:37,mem:56,load:1.2,lastSeen:now(),offline:false,phase:.2,telemetry:[]},
  {id:"h-iad-02",name:"api-iad-02",region:"IAD",os:"linux",arch:"amd64",agent:"0.3.0",cpu:62,mem:71,load:2.4,lastSeen:now(),offline:false,phase:1.4,telemetry:[]},
  {id:"h-nrt-01",name:"worker-nrt-01",region:"NRT",os:"linux",arch:"arm64",agent:"0.3.0",cpu:24,mem:48,load:.8,lastSeen:now(),offline:false,phase:2.8,telemetry:[]},
  {id:"h-fra-03",name:"batch-fra-03",region:"FRA",os:"linux",arch:"amd64",agent:"0.2.8",cpu:79,mem:66,load:3.1,lastSeen:now(),offline:false,phase:4.1,telemetry:[]}
];
const commands=[];
let selectedHostId=hosts[0].id;
let agentOn=true;
let tick=0;

const hostList=document.getElementById("hostList");
const apiLog=document.getElementById("apiLog");
const commandList=document.getElementById("commandList");
const agentToggle=document.getElementById("agentToggle");

function hostOnline(h){return !h.offline && now()-h.lastSeen<=90000}
window.northstarIsHostOnline=id=>{const host=hosts.find(h=>h.id===id);return Boolean(host&&hostOnline(host))};
window.northstarSelectedHost=()=>selectedHostId;
window.northstarSelectHost=id=>{if(hosts.some(h=>h.id===id)){selectedHostId=id;renderAll()}};
function selectedHost(){return hosts.find(h=>h.id===selectedHostId)}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function logAPI(method,path,status,detail){
  const node=document.createElement("div");
  node.className="ns-log";
  node.innerHTML="<strong>"+esc(method+" "+path)+" <span class='"+(status<400?"status-ok":"status-warn")+"'>"+status+"</span></strong><span>"+esc(detail||"")+"</span>";
  apiLog.prepend(node);
  while(apiLog.children.length>14)apiLog.lastChild.remove();
}
function renderFleet(){
  const search=document.getElementById("hostSearch").value.toLowerCase().trim();
  const status=document.getElementById("statusFilter").value;
  const visible=hosts.filter(h=>{
    if(status==="online"&&!hostOnline(h))return false;
    if(status==="offline"&&hostOnline(h))return false;
    return [h.name,h.region,h.os,h.arch,h.agent].some(value=>String(value).toLowerCase().includes(search));
  });
  document.getElementById("fleetCount").textContent=visible.length===hosts.length
    ?hosts.length+" hosts":visible.length+" of "+hosts.length+" hosts";
  hostList.innerHTML=visible.length?visible.map(h=>{
    const online=hostOnline(h),active=h.id===selectedHostId;
    return '<button type="button" class="ns-host'+(active?' active':'')+(online?'':' offline')+'"'
      +' data-host="'+esc(h.id)+'" aria-pressed="'+active+'">'
      +'<span class="ns-host-main"><b>'+esc(h.name)+'</b><small>linux · '+esc(h.arch)+' · agent '+esc(h.agent)+'</small></span>'
      +'<span class="ns-host-region">'+esc(h.region)+'</span>'
      +'<span class="ns-host-value">'+h.cpu.toFixed(0)+'%</span>'
      +'<span class="ns-host-value">'+h.mem.toFixed(0)+'%</span>'
      +'<span class="ns-host-state"><i class="ns-status-dot"></i>'+(online?'Online':'Offline')+'</span>'
      +'</button>';
  }).join(""):'<div class="pl-empty">No hosts match these filters.</div>';
  hostList.querySelectorAll("[data-host]").forEach(btn=>btn.addEventListener("click",()=>{
    selectedHostId=btn.dataset.host;renderAll();
  }));
}
function chartPath(samples,key){
  if(samples.length<2)return "";
  const pts=samples.slice(-36);
  return pts.map((s,i)=>((i===0?"M":"L")+" "+(i/(pts.length-1)*700).toFixed(1)+" "+(115-(s[key]/100)*105).toFixed(1))).join(" ");
}
function renderChart(h){
  const samples=h.telemetry.length?h.telemetry:[{cpu:h.cpu},{cpu:h.cpu}];
  const line=chartPath(samples,"cpu");
  document.getElementById("cpuLine").setAttribute("d",line);
  if(line){
    const pts=samples.slice(-36);
    const lastX=700;
    const area=line+" L "+lastX+" 120 L 0 120 Z";
    document.getElementById("cpuArea").setAttribute("d",area);
  }
}
function renderHost(){
  const h=selectedHost();
  document.getElementById("selectedHostName").textContent=h.name;
  document.getElementById("selectedHostMeta").textContent=h.os+" · "+h.arch+" · agent "+h.agent+" · "+h.region;
  document.getElementById("cpuMetric").textContent=h.cpu.toFixed(0)+"%";
  document.getElementById("memMetric").textContent=h.mem.toFixed(0)+"%";
  document.getElementById("loadMetric").textContent=h.load.toFixed(2);
  document.getElementById("statusMetric").textContent=hostOnline(h)?"ONLINE":"OFFLINE";
  document.getElementById("statusMetric").className=hostOnline(h)?"ok":"bad";
  renderChart(h);
}
function renderCommands(){
  const rows=commands.filter(c=>c.hostId===selectedHostId).slice().reverse();
  if(!rows.length){commandList.innerHTML='<div class="pl-empty">No commands for this host. Queue one to see the lifecycle.</div>';return}
  commandList.innerHTML=rows.map(c=>`
    <div class="ns-command-row">
      <div><b>${esc(c.type)}</b><span style="display:block;margin-top:4px">${esc(c.id)} · attempt ${c.attempts}</span></div>
      <span>${new Date(c.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
      <span class="ns-command-state ${c.state}">${c.state}</span>
    </div>`).join("");
}
function renderAll(){
  const focusedHost=document.activeElement?.dataset?.host;
  renderFleet();renderHost();renderCommands();
  if(focusedHost)hostList.querySelector('[data-host="'+focusedHost+'"]')?.focus({preventScroll:true});
}
function sampleTelemetry(){
  tick++;
  hosts.forEach((h,i)=>{
    if(h.offline)return;
    const wave=Math.sin(tick*.34+h.phase)*8+Math.sin(tick*.11+h.phase*2)*4;
    h.cpu=Math.max(4,Math.min(96,h.cpu*.84+(38+i*8+wave)*.16));
    h.mem=Math.max(20,Math.min(94,h.mem+Math.sin(tick*.08+h.phase)*.35));
    h.load=Math.max(.1,h.cpu/28+Math.sin(tick*.2+h.phase)*.18);
    h.lastSeen=now();
    h.telemetry.push({at:now(),cpu:h.cpu,mem:h.mem,load:h.load});
    if(h.telemetry.length>48)h.telemetry.shift();
  });
  renderAll();
}
function processAgent(){
  if(!agentOn)return;
  const t=now();
  commands.forEach(c=>{
    const host=hosts.find(h=>h.id===c.hostId);
    if(!host||!hostOnline(host))return;
    if(c.state==="QUEUED"&&t-c.updatedAt>900){
      c.state="LEASED";c.updatedAt=t;c.leaseToken=makeId("lease");c.attempts++;
      logAPI("POST","/api/v1/hosts/"+c.hostId+"/commands/lease",200,c.id+" leased for 30 s");
    }else if(c.state==="LEASED"&&t-c.updatedAt>1100){
      c.state="ACKNOWLEDGED";c.updatedAt=t;
      logAPI("POST","/api/v1/commands/"+c.id+"/ack",200,"matching lease token acknowledged");
    }
  });
  renderCommands();
}

document.getElementById("commandPayload").addEventListener("input",()=>{
  document.getElementById("commandError").hidden=true;
  document.getElementById("commandPayload").removeAttribute("aria-invalid");
});
document.getElementById("hostSearch").addEventListener("input",renderFleet);
document.getElementById("statusFilter").addEventListener("change",renderFleet);
document.getElementById("commandForm").addEventListener("submit",event=>{event.preventDefault();
  const h=selectedHost();
  let payload=document.getElementById("commandPayload").value.trim()||"{}";
  const error=document.getElementById("commandError");
  error.hidden=true;
  document.getElementById("commandPayload").removeAttribute("aria-invalid");
  try{JSON.parse(payload)}catch{
    error.textContent="Enter valid JSON before queuing a command.";
    error.hidden=false;
    document.getElementById("commandPayload").setAttribute("aria-invalid","true");
    document.getElementById("commandPayload").focus();
    logAPI("POST","/api/v1/commands",400,"payload must be valid JSON");return
  }
  const command={id:makeId("cmd"),hostId:h.id,type:document.getElementById("commandType").value,payload,state:"QUEUED",createdAt:now(),updatedAt:now(),attempts:0,leaseToken:null};
  commands.push(command);
  logAPI("POST","/api/v1/commands",201,command.id+" queued for "+h.name);
  renderCommands();
});
document.getElementById("offlineButton").addEventListener("click",()=>{
  const h=selectedHost();h.offline=true;h.lastSeen=now()-100000;
  logAPI("GET","/api/v1/hosts/"+h.id+"/status",200,"online=false · ageSeconds=100");
  renderAll();
});
document.getElementById("heartbeatButton").addEventListener("click",()=>{
  const h=selectedHost();h.offline=false;h.lastSeen=now();
  logAPI("POST","/api/v1/hosts/"+h.id+"/heartbeat",204,"agent heartbeat accepted");
  renderAll();
});
agentToggle.addEventListener("click",()=>{
  agentOn=!agentOn;
  agentToggle.classList.toggle("on",agentOn);
  agentToggle.setAttribute("aria-pressed",String(agentOn));
  agentToggle.textContent=agentOn?"Agent running":"Agent paused";
  document.getElementById("agentLabel").textContent=agentOn?"Polling every 1.5 seconds":"Paused · work stays queued";
  logAPI("AGENT","poll loop",200,agentOn?"resumed":"paused");
});

hosts.forEach(h=>{
  for(let i=0;i<26;i++){
    const wave=Math.sin(i*.34+h.phase)*8;
    h.telemetry.push({at:now()-(25-i)*1500,cpu:Math.max(4,Math.min(96,h.cpu+wave)),mem:h.mem,load:h.load});
  }
});
logAPI("GET","/api/v1/hosts",200,"Simulated: 4 hosts returned");
logAPI("GET","/api/v1/hosts/"+hosts[0].id+"/telemetry?limit=50",200,"Simulated: 26 samples");
renderAll();
setInterval(sampleTelemetry,1500);
setInterval(processAgent,450);
