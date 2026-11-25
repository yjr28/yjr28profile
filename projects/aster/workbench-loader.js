// Transpile the pinned upstream TypeScript components as one browser module.
// No registry authentication or build service required at runtime.
try {
 const paths=["components/card.tsx","components/table.tsx","components/chart.tsx","workbench.tsx"];
 const parts=await Promise.all(paths.map(async p=>{const r=await fetch(new URL(p+"?v=1",document.baseURI));if(!r.ok)throw Error(p+" could not load");return r.text()}));
 const upstream=parts.slice(0,3).map(s=>s.replace(/^"use client"\s*/m,"").replace(/^import \* as React from "react"\s*$/m,"").replace(/^import \{ cn \} from "cn"\s*$/m,"").replace('from "recharts"','from "https://esm.sh/recharts@3.2.1?deps=react@19.1.1,react-dom@19.1.1"')).join("\n");
 const code='import * as React from "https://esm.sh/react@19.1.1";\nimport {createRoot} from "https://esm.sh/react-dom@19.1.1/client?deps=react@19.1.1";\nimport {flushSync} from "https://esm.sh/react-dom@19.1.1?deps=react@19.1.1";\nimport {clsx} from "https://esm.sh/clsx@2.1.1";\nimport {twMerge} from "https://esm.sh/tailwind-merge@3.3.1";\nconst cn=(...x)=>twMerge(clsx(x));\n'+upstream+"\n"+parts[3];
 const js=Babel.transform(code,{filename:"aster.tsx",presets:[["typescript",{isTSX:true,allExtensions:true}],["react",{runtime:"classic"}]],sourceType:"module"}).code;
 const url=URL.createObjectURL(new Blob([js],{type:"text/javascript"}));try{await import(url)}finally{URL.revokeObjectURL(url)}
}catch(e){console.error(e);const el=document.getElementById("boot-status");if(el)el.textContent="Workbench could not initialize: "+e.message;}
