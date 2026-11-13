
const presets={
  clear:[
    {name:"postgres_default",postgres_cost:1200,estimated_rows:50000,seq_scans:2,nested_loops:0,uncertainty:.10},
    {name:"index_join",postgres_cost:180,estimated_rows:2500,seq_scans:0,nested_loops:0,uncertainty:.08},
    {name:"nested_loop",postgres_cost:700,estimated_rows:12000,seq_scans:0,nested_loops:3,uncertainty:.12}
  ],
  uncertain:[
    {name:"postgres_default",postgres_cost:600,estimated_rows:9000,seq_scans:1,nested_loops:0,uncertainty:.05},
    {name:"index_join",postgres_cost:90,estimated_rows:1000,seq_scans:0,nested_loops:0,uncertainty:.90},
    {name:"nested_loop",postgres_cost:760,estimated_rows:11000,seq_scans:0,nested_loops:2,uncertainty:.10}
  ],
  close:[
    {name:"postgres_default",postgres_cost:100,estimated_rows:1000,seq_scans:0,nested_loops:0,uncertainty:.10},
    {name:"index_join",postgres_cost:101,estimated_rows:1000,seq_scans:0,nested_loops:0,uncertainty:.10},
    {name:"nested_loop",postgres_cost:900,estimated_rows:12000,seq_scans:0,nested_loops:3,uncertainty:.15}
  ]
};

const table=document.getElementById("candidateTable");
const scenario=document.getElementById("scenario");
const rankButton=document.getElementById("rankButton");
const runtimeChip=document.getElementById("runtimeChip");
const runtimeText=document.getElementById("runtimeText");
const runtimeLog=document.getElementById("runtimeLog");
const consoleEl=document.getElementById("console");
const steps=[];
let pyodide=null;
let runtimeReady=false;

function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderCandidates(rows){
  table.innerHTML=rows.map((p,i)=>`
    <div class="a-candidate" data-row="${i}">
      <div class="a-candidate-name"><b>${escapeHTML(p.name)}</b><span>candidate ${i+1}</span></div>
      <div class="a-mini"><label>PG cost<input aria-label="${p.name} PG cost" data-key="postgres_cost" type="number" min="0" step="1" value="${p.postgres_cost}"></label></div>
      <div class="a-mini"><label>Rows<input aria-label="${p.name} Rows" data-key="estimated_rows" type="number" min="0" step="1" value="${p.estimated_rows}"></label></div>
      <div class="a-mini"><label>Seq scans<input aria-label="${p.name} Seq scans" data-key="seq_scans" type="number" min="0" step="1" value="${p.seq_scans}"></label></div>
      <div class="a-mini"><label>Nested loops<input aria-label="${p.name} Nested loops" data-key="nested_loops" type="number" min="0" step="1" value="${p.nested_loops}"></label></div>
      <div class="a-mini"><label>Uncertainty<input aria-label="${p.name} Uncertainty" data-key="uncertainty" type="number" min="0" max="1" step=".01" value="${p.uncertainty}"></label></div>
      <div class="a-score" data-score>—</div>
    </div>`).join("");
}

function readCandidates(){
  return [...table.querySelectorAll(".a-candidate")].map((row,i)=>{
    const base=presets[scenario.value][i];
    const read=(key)=>{
      const val=row.querySelector('[data-key="'+key+'"]').value.trim();
      if(val==="")throw new Error(base.name+": "+key+" cannot be empty.");
      return Number(val);
    };
    const plan={name:base.name,postgres_cost:read("postgres_cost"),estimated_rows:Math.round(read("estimated_rows")),seq_scans:Math.round(read("seq_scans")),nested_loops:Math.round(read("nested_loops")),uncertainty:read("uncertainty")};
    if(Object.entries(plan).some(([k,v])=>k!=="name"&&(!Number.isFinite(v)||v<0))||plan.uncertainty>1)
      throw new Error("Enter non-negative plan values and uncertainty from 0 to 1.");
    if(["estimated_rows","seq_scans","nested_loops"].some(k=>!Number.isInteger(plan[k])))
      throw new Error("Rows, scans and loops must be whole numbers.");
    return plan;
  });
}

function setStep(index){
  steps.forEach((el,i)=>el.classList.toggle("active",i===index));
}


async function executeRanker(payload){
  pyodide.globals.set("aster_payload_json",JSON.stringify(payload));
  try{
    const raw=pyodide.runPython(`
import json
_payload = json.loads(aster_payload_json)
_plans = [
    CandidatePlan(
        name=p["name"],
        postgres_cost=float(p["postgres_cost"]),
        estimated_rows=int(p["estimated_rows"]),
        seq_scans=int(p["seq_scans"]),
        nested_loops=int(p["nested_loops"]),
        uncertainty=float(p["uncertainty"]),
    )
    for p in _payload["candidates"]
]
_decision = rank_plans(
    _plans,
    postgres_choice=_payload["postgres_choice"],
    min_margin=float(_payload["min_margin"]),
    max_uncertainty=float(_payload["max_uncertainty"]),
)
json.dumps({
    "selected_plan": _decision.selected_plan,
    "model_choice": _decision.model_choice,
    "postgres_choice": _decision.postgres_choice,
    "fallback": _decision.fallback,
    "reason": _decision.reason,
    "margin": _decision.margin,
    "ranking": [
        {"name": r.plan.name, "score": r.score, "uncertainty": r.plan.uncertainty}
        for r in _decision.ranking
    ],
})
`);
    return JSON.parse(raw);
  }finally{
    pyodide.globals.delete("aster_payload_json");
  }
}

function renderScoreComparison(result){
  const scoreRoot=document.getElementById("scoreComparison");
  const max=Math.max(.0001,...result.ranking.map(row=>row.score));
  scoreRoot.innerHTML=result.ranking.map(row=>{
    const selected=row.name===result.selected_plan;
    const label=selected?(result.fallback?"PostgreSQL kept":"Selected"):row.name===result.model_choice?"Model first":"";
    return '<button type="button" class="a-score-row'+(selected?' is-selected':'')+'" data-plan="'+escapeHTML(row.name)+'">'
      +'<span class="a-score-name">'+escapeHTML(row.name)+'</span>'
      +'<span class="a-score-track"><span class="a-score-fill" style="width:'+Math.max(1,row.score/max*100).toFixed(1)+'%"></span></span>'
      +'<strong>'+row.score.toFixed(4)+'</strong><em>'+escapeHTML(label)+'</em></button>';
  }).join("");
  scoreRoot.querySelectorAll("[data-plan]").forEach(btn=>btn.addEventListener("click",()=>{
    const row=[...table.querySelectorAll(".a-candidate")].find(el=>el.querySelector(".a-candidate-name b").textContent===btn.dataset.plan);
    row?.querySelector("input")?.focus({preventScroll:true});
    row?.scrollIntoView({behavior:"auto",block:"nearest"});
  }));
}

async function runAster(){
  if(!runtimeReady)return;
  rankButton.disabled=true;
  rankButton.textContent="Running Python…";
  document.querySelectorAll(".a-candidate").forEach(r=>r.classList.remove("winner"));
  try{
    const payload={
      candidates:readCandidates(),
      postgres_choice:document.getElementById("pgChoice").value,
      min_margin:Number(document.getElementById("minMargin").value),
      max_uncertainty:Number(document.getElementById("maxUncertainty").value)
    };
    if(!Number.isFinite(payload.min_margin)||payload.min_margin<0||!Number.isFinite(payload.max_uncertainty)||payload.max_uncertainty<0||payload.max_uncertainty>1
      ||document.getElementById("minMargin").value.trim()===""||document.getElementById("maxUncertainty").value.trim()==="")
      throw new Error("Check the margin and uncertainty thresholds.");
    setStep(0);
    const result=await executeRanker(payload);
    setStep(1);
    setStep(2);
    renderScoreComparison(result);

    result.ranking.forEach(item=>{
      const row=[...table.querySelectorAll(".a-candidate")].find(r=>r.querySelector("b").textContent===item.name);
      if(row){
        row.querySelector("[data-score]").textContent=item.score.toFixed(4);
        if(item.name===result.selected_plan)row.classList.add("winner");
      }
    });

    document.getElementById("decisionTitle").textContent=result.selected_plan+(result.fallback?" · PostgreSQL retained":" · selected by Aster");
    document.getElementById("decisionReason").textContent=result.reason;
    document.getElementById("decisionStatus").textContent=result.fallback?"PostgreSQL retained":"Aster override";
    document.getElementById("decisionStatus").className="pl-small-status "+(result.fallback?"is-cautious":"is-positive");
    document.getElementById("modelChoice").textContent=result.model_choice;
    document.getElementById("defaultChoice").textContent=result.postgres_choice;
    document.getElementById("marginValue").textContent=result.margin.toFixed(4);
    document.getElementById("minimumMarginValue").textContent=payload.min_margin.toFixed(4);
    document.getElementById("uncertaintyValue").textContent=payload.max_uncertainty.toFixed(2);
    consoleEl.textContent=result.ranking.map((r,i)=>(i+1)+". "+r.name.padEnd(18)+" score="+r.score.toFixed(4)+" uncertainty="+r.uncertainty.toFixed(2)).join("\n")+"\n\nselected_plan="+result.selected_plan+"\nfallback="+result.fallback+"\nreason="+result.reason;
  }catch(err){
    document.getElementById("decisionStatus").textContent="Invalid input";
    document.getElementById("decisionStatus").className="pl-small-status is-error";
    document.getElementById("decisionTitle").textContent="Unable to compare plans";
    document.getElementById("scoreComparison").innerHTML='<div class="pl-empty">Correct the input and run the ranker again.</div>';
    document.getElementById("decisionReason").textContent=err.message;
    consoleEl.textContent="ERROR: "+err.message;
  }finally{
    rankButton.disabled=false;
    rankButton.textContent="Compare plans";
  }
}

function markDirty(){
  document.getElementById("decisionStatus").textContent="Inputs changed";
  document.getElementById("decisionStatus").className="pl-small-status";
  document.getElementById("decisionTitle").textContent="Result is out of date";
  document.getElementById("decisionReason").textContent="Compare plans to use the updated values.";
  document.getElementById("scoreComparison").innerHTML='<div class="pl-empty">Run the ranker to update the scores.</div>';
  table.querySelectorAll(".a-candidate").forEach(row=>{
    row.classList.remove("winner");
    const score=row.querySelector("[data-score]");if(score)score.textContent="—";
  });
}
scenario.addEventListener("change",()=>{
  renderCandidates(presets[scenario.value]);markDirty();
  if(runtimeReady)runAster();
});
table.addEventListener("input",markDirty);
for(const id of ["pgChoice","maxUncertainty","minMargin"])document.getElementById(id).addEventListener("change",markDirty);
rankButton.addEventListener("click",runAster);
renderCandidates(presets.clear);

(async()=>{
  try{
    pyodide=await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v314.0.7/full/"});
    const sourceResponse=await fetch("https://cdn.jsdelivr.net/gh/yjr28/aster-pg-optimizer@main/aster_ranker.py",{cache:"no-store"});
    if(!sourceResponse.ok)throw new Error("Could not load aster_ranker.py");
    const source=await sourceResponse.text();
    pyodide.runPython(source);
    runtimeReady=true;
    runtimeChip.classList.remove("busy");
    runtimeChip.classList.add("ready");
    runtimeText.textContent="Python ranker ready";
    runtimeChip.classList.add("ready");
    runtimeLog.textContent="Running the repository Python module with Pyodide.";
    rankButton.disabled=false;
    rankButton.textContent="Compare plans";
    await runAster();
  }catch(err){
    runtimeChip.classList.remove("busy");
    runtimeChip.classList.add("error");
    runtimeText.textContent="Python runtime unavailable";
    runtimeChip.classList.add("failed");
    runtimeLog.textContent=err.message;
    rankButton.textContent="Python runtime unavailable";
    consoleEl.textContent="The live Python runtime could not initialize. Source links remain available above.";
  }
})();
