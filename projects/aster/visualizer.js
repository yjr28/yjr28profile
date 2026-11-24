"use strict";
// Integration follows Dalibo's documented UMD embedding example (PostgreSQL license).
const input=document.getElementById("plan"),status=document.getElementById("status");
let app;
function render(){
 if(!window.Vue||!window.pev2?.Plan){status.textContent="PEV2 could not load. Check your connection and reload.";return;}
 const plan=input.value.trim();if(!plan){status.textContent="Paste an EXPLAIN plan.";return;}
 try{
 if(app)app.unmount();
 app=Vue.createApp({data(){return {plan}},template:'<pev2 :plan-source="plan" plan-query="" />'});
 app.component("pev2",pev2.Plan);app.mount("#app");
 status.textContent="Plan loaded for visualization. No database query was executed.";
 }catch(error){status.textContent="Unable to render plan: "+error.message;}
}
function parseFeatures(source){
 const parsed=JSON.parse(source);
 const root=Array.isArray(parsed)?parsed[0]?.Plan:parsed?.Plan;
 if(!root||typeof root!=="object")throw new Error("Use PostgreSQL EXPLAIN (FORMAT JSON) output.");
 const postgres_cost=root["Total Cost"],estimated_rows=root["Plan Rows"];
 if(!Number.isFinite(postgres_cost)||postgres_cost<0||!Number.isSafeInteger(estimated_rows)||estimated_rows<0)throw new Error("Missing valid Total Cost or Plan Rows.");
 let seq_scans=0,nested_loops=0;const nodes=[root];let count=0;
 while(nodes.length){const n=nodes.pop();if(++count>20000)throw new Error("Plan exceeds the browser import limit.");if(!n||typeof n!=="object")throw new Error("Malformed plan node.");
 if(n["Node Type"]==="Seq Scan")seq_scans++;
 if(n["Node Type"]==="Nested Loop")nested_loops++;
 if(Array.isArray(n.Plans))for(const child of n.Plans)nodes.push(child);}
 return {postgres_cost,estimated_rows,seq_scans,nested_loops};
}
document.getElementById("visualize").addEventListener("click",render);
document.getElementById("import").addEventListener("click",()=>{
 try{const features=parseFeatures(input.value);if(parent===window)throw new Error("Open the visualizer from Aster to import estimates.");
 parent.postMessage({type:"aster-plan-input",features,index:Number(document.getElementById("candidate").value)},location.origin);
 status.textContent="Estimates imported. Set uncertainty separately and compare plans.";
 }catch(error){status.textContent=error.message;}
});
render();