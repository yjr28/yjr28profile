"use strict";
const frame=document.getElementById("pevFrame"), explorer=document.getElementById("explorerPane"), ranker=document.getElementById("rankerPane");
function workspace(name){
 const show=name==="explorer"; explorer.hidden=!show;ranker.hidden=show;
 document.getElementById("showExplorer").setAttribute("aria-pressed",String(show));
 document.getElementById("showRanker").setAttribute("aria-pressed",String(!show));
}
document.getElementById("showExplorer").addEventListener("click",()=>workspace("explorer"));
document.getElementById("showRanker").addEventListener("click",()=>workspace("ranker"));
window.addEventListener("message",event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=="aster-plan-input")return;
 const {features,index}=event.data;
 if(!Number.isInteger(index)||index<0||index>2||!features)return;
 const keys=["postgres_cost","estimated_rows","seq_scans","nested_loops"];
 if(!keys.every(k=>Number.isFinite(features[k])&&features[k]>=0))return;
 const row=document.querySelectorAll("#candidateTable .a-candidate")[index];if(!row)return;
 for(const k of keys){const input=row.querySelector('[data-key="'+k+'"]');if(input){input.value=String(features[k]);input.dispatchEvent(new Event("input",{bubbles:true}));}}
 workspace("ranker");
 row.querySelector("input")?.focus({preventScroll:true});
});