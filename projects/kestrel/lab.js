const $ = id => document.getElementById(id);
const presets = [...document.querySelectorAll(".k-preset")];
const delayRange = $("delayRange");
const jitterRange = $("jitterRange");
const runButton = $("runButton");
const traceRows = $("traceRows");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[ch]));
let runtimeReady = false;
let running = false;
let activeTrace = "failing";
let result = null;
let currentEvents = [];
let selectedIndex = -1;

function updateControls() {
  $("delayValue").textContent = delayRange.value + " ms";
  $("jitterValue").textContent = jitterRange.value + "%";
  for(const preset of presets) {
    const active = preset.dataset.delay === delayRange.value && preset.dataset.jitter === jitterRange.value;
    preset.classList.toggle("active", active);
    preset.setAttribute("aria-pressed", String(active));
  }
}
for(const slider of [delayRange, jitterRange]) slider.addEventListener("input", updateControls);
for(const preset of presets) preset.addEventListener("click", () => {
  delayRange.value = preset.dataset.delay;
  jitterRange.value = preset.dataset.jitter;
  updateControls();
});
updateControls();

function eventDurationMs(e) {
  const raw = e.kind === "fault" ? e.attributes?.delay_us : e.attributes?.duration_us;
  return Math.max(0, Number(raw || 0) / 1000);
}
function anomalous(e) { return e.kind === "fault" || e.status === "error" || e.status === "injected"; }
function eventLabel(e) {
  if(e.kind === "fault") return "latency injected";
  return e.operation || e.kind || "event";
}
function timeFrame(events) {
  const valid = events.map(e => Date.parse(e.timestamp)).filter(Number.isFinite);
  const first = valid.length ? Math.min(...valid) : 0;
  const end = Math.max(1, ...events.map(e => {
    const t = Date.parse(e.timestamp);
    return (Number.isFinite(t) ? (t - first) : 0) + eventDurationMs(e);
  }));
  return {first, end};
}
function selectEvent(index) {
  const e = currentEvents[index];
  if(!e) return;
  selectedIndex = index;
  traceRows.querySelectorAll("[data-index]").forEach(button => {
    const selected = Number(button.dataset.index) === index;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $("eventTitle").textContent = (e.service || "system") + " / " + eventLabel(e);
  $("eventBadge").textContent = e.status || e.kind || "recorded";
  $("eventBadge").className = "pl-small-status" + (anomalous(e) ? " is-error" : "");
  const attrs = e.attributes || {};
  const fields = [
    ["Kind", e.kind || "—"],
    ["Status", e.status || "—"],
    ["Duration", eventDurationMs(e) ? eventDurationMs(e).toFixed(2) + " ms" : "—"],
    ["Span ID", e.span_id || "—"],
    ["Parent span", e.parent_span_id || "—"],
    ["Timestamp", e.timestamp || "—"]
  ];
  $("eventSummary").innerHTML = fields.map(([label,value]) =>
    '<div class="k-detail-field"><span>' + escapeHTML(label) + '</span><strong>' + escapeHTML(value) + '</strong></div>'
  ).join("");
  $("eventJSON").textContent = JSON.stringify(e, null, 2);
}
function renderTrace() {
  if(!result) return;
  const events = result[activeTrace]?.events || [];
  const search = $("traceSearch").value.toLowerCase().trim();
  const errorsOnly = $("errorsOnly").checked;
  const {first,end} = timeFrame(events);
  const visible = events.map((e,i) => ({e,i})).filter(({e}) => {
    return (!errorsOnly || anomalous(e)) && (!search || [e.service,e.operation,e.kind,e.status].some(x => (x||"").toLowerCase().includes(search)));
  });
  currentEvents = events;
  const suffix = activeTrace === "healthy" ? "Baseline" : activeTrace === "failing" ? "Injected run" : "Replay";
  $("timelineScale").textContent = suffix + " · " + end.toFixed(1) + " ms";
  $("timeAxis").textContent = "0 ms  —  " + (end/2).toFixed(1) + " ms  —  " + end.toFixed(1) + " ms    ·    Relative to the first recorded event";
  if(!visible.length) {
    traceRows.innerHTML = '<div class="pl-empty">No matching events. Clear the search or switch off the anomaly filter.</div>';
    $("eventTitle").textContent = "No matching events";
    $("eventBadge").textContent = "—";
    $("eventSummary").textContent = "Try a different filter.";
    $("eventJSON").textContent = "No event selected.";
    return;
  }
  traceRows.innerHTML = visible.map(({e,i}) => {
    const start = Math.max(0,(Date.parse(e.timestamp)-first)/end);
    const duration = Math.max(.007,eventDurationMs(e)/end);
    const label = e.service || "system";
    const ms = eventDurationMs(e);
    const problem = anomalous(e);
    return '<button type="button" class="k-trace-row' + (problem?' is-anomaly':'') + '"'
      + ' data-index="' + i + '" aria-pressed="false">'
      + '<span class="k-trace-name"><b>' + escapeHTML(label) + '</b><small>' + escapeHTML(eventLabel(e)) + '</small>'
      + (problem?'<em>issue</em>':'') + '</span>'
      + '<span class="k-timeline-track"><i class="k-timeline-bar" style="--from:' + start + ';--length:' + duration + '"></i></span>'
      + '<span class="k-trace-ms">' + (ms ? ms.toFixed(ms>=10?1:2) + ' ms' : '—') + '</span></button>';
  }).join("");
  traceRows.querySelectorAll("[data-index]").forEach(button => button.addEventListener("click", () => {
    selectEvent(Number(button.dataset.index));
  }));
  const selectionIsVisible = visible.some(item=>item.i===selectedIndex);
  selectEvent(selectionIsVisible?selectedIndex:(visible.find(item=>anomalous(item.e)) || visible[0]).i);
}
document.querySelectorAll("[data-trace]").forEach(button => button.addEventListener("click", () => {
  activeTrace=button.dataset.trace;
  selectedIndex=-1;
  document.querySelectorAll("[data-trace]").forEach(b => {
    const on=b===button;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));
  });
  renderTrace();
}));
$("traceSearch").addEventListener("input",renderTrace);
$("errorsOnly").addEventListener("change",renderTrace);
traceRows.addEventListener("keydown",event => {
  if(!["ArrowDown","ArrowUp"].includes(event.key)) return;
  const rows=[...traceRows.querySelectorAll("[data-index]")];
  const index=rows.indexOf(document.activeElement);
  if(index===-1)return;
  const next=rows[Math.max(0,Math.min(rows.length-1,index+(event.key==="ArrowDown"?1:-1)))];
  if(next){next.focus();next.click();event.preventDefault();}
});

async function runKestrel() {
  if(!runtimeReady || running) return;
  running=true;runButton.disabled=true;runButton.textContent="Running…";
  $("phaseText").textContent="Executing request with the Go runtime…";
  try {
    const seed = Number($("seedInput").value) || 20260903;
    const data = window.runKestrelGo(JSON.stringify({
      delay_ms:Number(delayRange.value),jitter:Number(jitterRange.value)/100,seed
    }));
    const response=JSON.parse(data);
    if(response.error) throw new Error(response.error);
    result=response;
    const outcome=response.failing.outcome;
    $("outcomeValue").textContent=(outcome.http_status || "—")+" · "+(outcome.error_code || outcome.classification || "success");
    $("divergenceValue").textContent=response.has_divergence ? response.divergence.service+" / "+response.divergence.reason : "None";
    $("eventValue").textContent=String(response.failing.events.length);
    $("replayValue").textContent=response.replay_match?"MATCH":"DIVERGED";
    $("replayValue").className=response.replay_match?"pl-good":"pl-bad";
    $("phaseText").textContent=response.replay_match ? "Replay reproduced the recorded result." : "Replay outcome diverged.";
    selectedIndex=-1;renderTrace();
  } catch(error) {
    $("phaseText").textContent="Could not run the trace.";
    traceRows.innerHTML='<div class="pl-empty error">The replay failed. Check the source or try again.</div>';
    $("eventTitle").textContent="Runtime error";
    $("eventJSON").textContent=String(error.message || error);
  } finally {
    running=false;runButton.disabled=!runtimeReady;runButton.textContent="Run replay";
  }
}
runButton.addEventListener("click",runKestrel);

(async()=>{
  try{
    const [wasmResponse,hashResponse]=await Promise.all([
      fetch("https://raw.githubusercontent.com/yjr28/kestrel-replay/main/web/kestrel.wasm",{cache:"no-store"}),
      fetch("https://raw.githubusercontent.com/yjr28/kestrel-replay/main/web/kestrel.wasm.sha256",{cache:"no-store"})
    ]);
    if(!wasmResponse.ok)throw new Error("WebAssembly artifact is unavailable");
    const go=new Go();
    const bytes=await wasmResponse.arrayBuffer();
    const instance=await WebAssembly.instantiate(bytes,go.importObject);
    go.run(instance.instance).catch(error=>console.error("Go runtime exited",error));
    for(let i=0;i<100&&!window.runKestrelGo;i++)await sleep(20);
    if(!window.runKestrelGo)throw new Error("Go runtime did not initialize");
    runtimeReady=true;
    $("runtimeChip").classList.add("ready");
    $("runtimeText").textContent="Go/WASM ready";
    runButton.disabled=false;
    runButton.textContent="Run replay";
    if(hashResponse.ok) {
      const hash=(await hashResponse.text()).trim().split(/\s+/)[0];
      $("runtimeChip").title="WebAssembly SHA-256: "+hash;
    }
    await runKestrel();
  }catch(error){
    $("runtimeChip").classList.add("failed");
    $("runtimeText").textContent="Go/WASM unavailable";
    $("phaseText").textContent=String(error.message||error);
    traceRows.innerHTML='<div class="pl-empty error">The Go engine could not load. The source code is linked above.</div>';
    runButton.disabled=true;runButton.textContent="Runtime unavailable";
  }
})();