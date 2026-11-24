import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||"playwright");
const base=process.env.BASE_URL||"http://127.0.0.1:4173",dir=process.env.ARTIFACT_DIR||"/tmp/portfolio-review/projects";
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
const screenshot=(page,name)=>page.screenshot({path:path.join(dir,name+".png"),fullPage:true});
async function waitText(page,selector,text,timeout=15000){await page.waitForFunction(({selector,text})=>document.querySelector(selector)?.textContent.includes(text),{selector,text},{timeout})}
async function test(name,fn){
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 try{await fn(page);assert.deepEqual(errors,[],"Page errors");results.push({name,status:"passed"});console.log("PASS",name)}
 catch(e){results.push({name,status:"failed",error:String(e)});console.error("FAIL",name,e);await screenshot(page,name+"-failure").catch(()=>{})}
 finally{await context.close()}
}
async function visit(page,project){const r=await page.goto(base+"/projects/"+project+"/",{waitUntil:"domcontentloaded"});assert.equal(r?.status(),200)}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"No page-wide horizontal overflow")}
try{
 await test("northstar",async page=>{
  await visit(page,"northstar");await page.locator("#hostList [data-host]").first().waitFor();
  assert.equal(await page.locator("#hostList [data-host]").count(),4);
  await page.locator("#hostList [data-host]").nth(1).click();await waitText(page,"#selectedHostName","api-iad-02");
  await page.locator("#offlineButton").click();await waitText(page,"#statusMetric","OFFLINE");
  await page.locator("#statusFilter").selectOption("offline");assert.equal(await page.locator("#hostList [data-host]").count(),1);
  await page.locator("#heartbeatButton").click();await waitText(page,"#statusMetric","ONLINE");
  await page.locator("#statusFilter").selectOption("all");await page.locator("#queueButton").click();
  await waitText(page,"#commandList","ACKNOWLEDGED",15000);
  await noOverflow(page);await screenshot(page,"northstar-desktop");
  await page.setViewportSize({width:390,height:844});await noOverflow(page);await screenshot(page,"northstar-mobile");
 });
 await test("aster",async page=>{
  await visit(page,"aster");const frame=page.frameLocator("#pevFrame");
  await frame.locator("#status").filter({hasText:"Plan loaded for visualization"}).waitFor({timeout:90000});
  await frame.locator("#app").locator("button").first().waitFor({timeout:30000});
  await screenshot(page,"aster-explorer-desktop");
  const plan=[{Plan:{"Node Type":"Aggregate","Total Cost":12.51,"Plan Rows":1,Plans:[{"Node Type":"Seq Scan","Total Cost":10,"Plan Rows":1000}]}}];
  await frame.locator("#plan").fill(JSON.stringify(plan));await frame.locator("#candidate").selectOption("0");await frame.locator("#import").click();
  await page.locator("#rankerPane").waitFor({state:"visible"});
  assert.equal(await page.locator("#candidateTable [data-key=postgres_cost]").first().inputValue(),"12.51");
  assert.equal(await page.locator("#candidateTable [data-key=seq_scans]").first().inputValue(),"1");
  await waitText(page,"#runtimeText","Python ranker ready",90000);
  await page.locator("#rankButton").click();await page.waitForFunction(()=>["PostgreSQL retained","Aster override"].includes(document.querySelector("#decisionStatus").textContent));
  await noOverflow(page);await screenshot(page,"aster-ranker-desktop");
  await page.setViewportSize({width:390,height:844});await noOverflow(page);await screenshot(page,"aster-ranker-mobile");
 });
 await test("kestrel",async page=>{
  await visit(page,"kestrel");await waitText(page,"#runtimeText","Go/WASM verified",60000);
  await page.locator("#traceRows [data-index]").first().waitFor({timeout:30000});assert.ok(await page.locator(".SpanBar--bar").count()>0);
  await waitText(page,"#replayValue","MATCH");
  await page.locator("[data-trace=healthy]").click();await page.locator("#traceRows [data-index]").first().click();
  assert.notEqual(await page.locator("#eventJSON").textContent(),"No event selected.");
  await page.locator("[data-trace=failing]").click();
  const downloadPromise=page.waitForEvent("download");await page.locator("#exportTrace").click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),"kestrel-failing.json");
  await noOverflow(page);await screenshot(page,"kestrel-desktop");
  await page.setViewportSize({width:390,height:844});await noOverflow(page);await screenshot(page,"kestrel-mobile");
 });
 await test("axon",async page=>{
  await visit(page,"axon");await page.locator("#start").click();await page.locator("#running").waitFor({state:"visible"});
  for(let i=0;i<10;i++){await waitText(page,"#trialCounter",(i+1)+" / 10");await page.waitForTimeout(150);await page.locator("#options button").first().click()}
  await page.locator("#results").waitFor({state:"visible"});const score=Number(await page.locator("#score").textContent());assert.ok(score>=0&&score<=1000);
  assert.equal(await page.locator("#historyRows tr").count(),1);assert.match(await page.locator("#historyRows").textContent(),/Processing speed/);
  await noOverflow(page);await screenshot(page,"axon-results-desktop");
  await page.locator("#again").click();await page.locator("[data-family=spatial_rotation]").click();await page.locator("#start").click();await page.locator("#running").waitFor({state:"visible"});assert.equal(await page.locator("#options button").count(),4);await page.locator("#cancel").click();
  await page.setViewportSize({width:390,height:844});await noOverflow(page);await screenshot(page,"axon-mobile");
 });
 await test("studyhub",async page=>{
  await visit(page,"studyhub");assert.ok(await page.locator('a[href="https://waseda-study-hub.vercel.app/"]').count()>=2);
  assert.ok(await page.locator('a[href="https://github.com/Waseda-Study-Hub/frontend"]').count());
  assert.ok(await page.locator('a[href="https://github.com/Waseda-Study-Hub/backend"]').count());
  await noOverflow(page);await screenshot(page,"studyhub-desktop");
  await page.setViewportSize({width:390,height:844});await noOverflow(page);await screenshot(page,"studyhub-mobile");
 });
}finally{await browser.close();await writeFile(path.join(dir,"results.json"),JSON.stringify(results,null,2))}
if(results.some(r=>r.status==="failed"))process.exitCode=1;