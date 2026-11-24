import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||"playwright");
const base=process.env.BASE_URL||"http://127.0.0.1:4173",dir=process.env.ARTIFACT_DIR||"/tmp/portfolio-review/native";
await mkdir(dir,{recursive:true});
const b=await chromium.launch({headless:true});
const failures=[];
async function test(name,fn){const p=await b.newPage({viewport:{width:1440,height:900}});try{await fn(p);await p.screenshot({path:dir+"/"+name+".png",fullPage:true});console.log("PASS native "+name)}catch(e){failures.push(name+": "+e.message);console.error(e);await p.screenshot({path:dir+"/"+name+"-failure.png",fullPage:true}).catch(()=>{})}finally{await p.close()}}
try{
await test("northstar",async p=>{await p.goto(base+"/projects/northstar/");await p.getByRole("heading",{name:"edge-atl-01",exact:true}).waitFor({timeout:60000});await p.getByRole("combobox",{name:"Select host"}).selectOption("h-iad-02");await p.getByRole("heading",{name:"api-iad-02",exact:true}).waitFor();await p.getByRole("button",{name:"Miss heartbeat",exact:true}).click();await p.getByText("Heartbeat missed",{exact:true}).waitFor();await p.getByRole("button",{name:"Send heartbeat",exact:true}).click();await p.getByText("Host online",{exact:true}).waitFor();await p.getByRole("button",{name:"Collect diagnostics",exact:true}).click();await p.getByText("ACKNOWLEDGED",{exact:true}).waitFor({timeout:12000});});
await test("aster",async p=>{await p.goto(base+"/projects/aster/");const f=p.frameLocator('iframe[title="Unmodified Dalibo PEV2 standalone visualizer"]');await f.locator("textarea").first().waitFor({timeout:45000});await p.getByRole("link",{name:"Candidate ranking ↗"}).waitFor();});
await test("kestrel",async p=>{await p.goto(base+"/projects/kestrel/");await p.waitForURL("**/projects/kestrel/native/**");await p.locator("#jaeger-ui-root > *").first().waitFor({timeout:45000});await p.waitForFunction(()=>location.pathname.includes("/trace/")||Array.from(document.querySelectorAll("a[href]")).some(a=>a.href.includes("/trace/")),{},{timeout:45000});assert.ok(await p.locator("#jaeger-ui-root").innerText());});
await test("axon",async p=>{await p.goto(base+"/projects/axon/");await p.locator("#start").click();await p.locator("#running").waitFor({state:"visible"});assert.ok(await p.locator("link[href='./benchmark-upstream.css']").count());for(let i=0;i<10;i++){await p.waitForTimeout(160);await p.locator("#options button").first().click()}await p.locator("#results").waitFor({state:"visible"});assert.ok(Number(await p.locator("#score").innerText())>=0);});
}finally{await b.close()}if(failures.length)throw Error(failures.join("\n"));
