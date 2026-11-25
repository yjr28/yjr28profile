/** Browser acceptance for the Japan Line. See docs/DEVELOPMENT_STATE.md for invocation. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const output = process.env.ARTIFACT_DIR || '/tmp/japan-line-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
const instrumentation = `
// Test-only inspection, appended by Playwright's route handler; never shipped to visitors.
window.__japanTest = {
 snapshot(){return {camera:camera.position.toArray(),yaw:look.targetYaw,pitch:look.targetPitch,target:look.target.toArray(),distance:look.targetDistance,actors:stationActors.map(a=>({id:a.id,pose:a.figure.children[0].rotation.x})),motion:animated.motion,ride:animated.ride,
  trains:trains.map((t,i)=>{const p=t.cars[0].localToWorld(V(0,2.1,0));const ndc=p.clone().project(camera);const r=trainLabels[i].getBoundingClientRect();return {
   world:p.toArray(),x:(ndc.x*.5+.5)*viewport.width,y:(-ndc.y*.5+.5)*viewport.height,
   visible:getComputedStyle(trainLabels[i]).visibility==='visible',left:r.left,right:r.right,top:r.top,bottom:r.bottom,
   leader:parseFloat(trainLabels[i].style.getPropertyValue('--leader')),stemX:parseFloat(trainLabels[i].style.getPropertyValue('--stem-x')),stemY:parseFloat(trainLabels[i].style.getPropertyValue('--stem-y')),angle:parseFloat(trainLabels[i].style.getPropertyValue('--stem-angle'))};})};},
 testRouteCoverage(){const old=trains.map(t=>t.start);const failures=[];try{for(let i=0;i<128;i++){trains.forEach((t,k)=>{t.start=(old[k]+i/128)%1;positionTrain(t)});updateMarkers();trains.forEach((t,k)=>{const point=projectAnchor(t.cars[0].localToWorld(V(0,2.1,0))),label=trainLabels[k],size=labelSizes.get(label),visible=getComputedStyle(label).visibility==='visible';if(visible!==!!(point&&size)){failures.push({phase:i,train:k,reason:'unexpected visibility'});return}if(!visible)return;const x=parseFloat(label.style.left)+size.width/2,y=parseFloat(label.style.top)+size.height;if(Math.abs(x-point.x)>.05||Math.abs(y+12-point.y)>.05||parseFloat(label.style.getPropertyValue('--leader'))!==12||parseFloat(label.style.getPropertyValue('--stem-angle'))!==0)failures.push({phase:i,train:k,reason:'anchor moved independently'})});}return failures}finally{trains.forEach((t,k)=>{t.start=old[k];positionTrain(t)});updateMarkers()}},
 freeze(){animated.motion=false;},
 sampleRoute(t){const p=railwayCurve.getPointAt(t).project(camera);return {x:(p.x*.5+.5)*viewport.width,y:(-p.y*.5+.5)*viewport.height};},
 hit(x,y){return rayHit({clientX:x,clientY:y});},
 trainPoint(i){const p=trains[i].cars[0].localToWorld(V(0,1.8,0)).project(camera);return {x:(p.x*.5+.5)*viewport.width,y:(-p.y*.5+.5)*viewport.height};},
 hideBehindCamera(){camera.lookAt(camera.position.clone().multiplyScalar(2));camera.updateMatrixWorld();updateMarkers();return trainLabels.every(l=>getComputedStyle(l).visibility==='hidden');},
 hideOutsideViewport(){camera.lookAt(camera.position.clone().add(V(1000,0,0)));camera.updateMatrixWorld();updateMarkers();return trainLabels.every(l=>getComputedStyle(l).visibility==='hidden');}
};`;
function record(name, data = {}) { results.push({ name, ...data }); console.log(`PASS ${name}`); }
async function ready(page) {
 await page.goto(base);
 await page.locator('#world-loading.done').waitFor({state:'attached'});
 assert.equal(await page.locator('#no-webgl').isVisible(),false,'WebGL renderer initialized');
 await page.evaluate(() => document.fonts.ready);
 await page.waitForTimeout(850);
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true }); }
async function geometry(page) {
 return page.evaluate(() => {
  const visible = el => getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
  const rect = el => { const r = el.getBoundingClientRect(); return { name:el.className, left:r.left, right:r.right, top:r.top, bottom:r.bottom }; };
  const labels = [...document.querySelectorAll('.world-marker')].filter(visible).map(rect); // Moving train signs deliberately may pass in front of station signs.
  const controls = [...document.querySelectorAll('.global-nav,.world-intro,.tiny-footer,.project-info.visible')].filter(visible).map(rect);
  const overlap = (a,b) => a.left < b.right-1 && a.right > b.left+1 && a.top < b.bottom-1 && a.bottom > b.top+1;
  return { overflow:document.documentElement.scrollWidth > innerWidth,
   collisions:labels.flatMap((l,i)=>[...labels.slice(i+1),...controls].filter(c=>overlap(l,c)).map(c=>[l.name,c.name])),
   controlCollisions:controls.flatMap((l,i)=>controls.slice(i+1).filter(c=>overlap(l,c)).map(c=>[l.name,c.name])), labels:labels.length };
 });
}
async function checkLayout(page, label) {
 const g=await geometry(page);
 assert.equal(g.overflow,false,label+' horizontal overflow');
 assert.deepEqual(g.collisions,[],label+' projected labels overlap');
 assert.deepEqual(g.controlCollisions,[],label+' controls overlap');
 record(label+' layout',g);
}
async function popup(context, action, label) {
 const opened=context.waitForEvent('page');
 await action();
 const tab=await opened;
 await tab.waitForURL('https://lastride.jp/en/');
 await tab.close();
 record(label);
}
try {
 for (const viewport of [{width:1440,height:900},{width:390,height:844}].filter(v=>!process.env.VIEWPORT||String(v.width)===process.env.VIEWPORT)) {
  const mobile=viewport.width===390, name=mobile?'mobile':'desktop';
  const context=await browser.newContext({viewport,hasTouch:mobile,deviceScaleFactor:1});
  // Assert navigation to the real external destination without running the unrelated site.
  await context.route('https://lastride.jp/en/',route=>route.fulfill({contentType:'text/html',body:'<title>LastRide navigation target</title>'}));
  await context.route('https://waseda-study-hub.vercel.app/',route=>route.fulfill({contentType:'text/html',body:'<title>Official Study Hub navigation target</title>'}));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(name+': '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(name+': '+m.text());});
  await page.route('**/japan-world.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+instrumentation});});
  await ready(page);
  assert.equal(await page.locator('h1').count(),1);
  assert.match(await page.locator('h1').innerText(),/^The Japan Line/);
  assert.equal(await page.locator('.global-nav .brand').count(),0);
  assert.equal(await page.locator('#begin-exploring').count(),0);
  assert.ok(await page.locator('.world-intro').evaluate(el=>el.getBoundingClientRect().top>innerHeight*.65),'Intro is a compact bottom caption');
  assert.equal(await page.locator('nav.station-line').count(),0);
  assert.equal(await page.locator('.world-marker .pixel-click-hand').count(),6);
  assert.equal(await page.locator('.train-label .pixel-click-hand').count(),2);
  assert.equal(await page.locator('.world-marker[href]').count(),6);
  assert.deepEqual(await page.locator('.marker-emblem').allTextContents(),['✦','⚙','❀','富','学','鍵']);
  if(!mobile){assert.equal(await page.locator('.world-marker:visible').count(),6,'all six permanent project signs visible');assert.equal(await page.locator('.train-label:visible').count(),2,'both LastRide signs visible');}
  if(!mobile)assert.deepEqual(await page.evaluate(()=>window.__japanTest.testRouteCoverage()),[],'Train signs maintain an exact roof anchor and 12px gap across 128 railway phases');
  const initial=await page.evaluate(()=>window.__japanTest.snapshot());
  assert.equal(initial.actors.length,8,'all seven project vignettes are present');
  if(!mobile){assert.equal(initial.yaw,-.375);assert.equal(initial.pitch,.566);assert.equal(initial.distance,106.25);assert.deepEqual(initial.target,[16,-1.5,-8.7]);}
  await checkLayout(page,name+' initial');
  await screenshot(page,name);
  let first;
  for(let i=0;i<8;i++){
   const snap=await page.evaluate(()=>window.__japanTest.snapshot());
   if(!first) first=snap;
   snap.trains.forEach(t=>{if(t.visible){assert.ok(Math.abs((t.left+t.right)/2-t.x)<.6,'sign stays centered on actual carriage');assert.ok(Math.abs(t.bottom+12-t.y)<.6,'fixed 12px gap above train roof');assert.equal(t.leader,12);assert.equal(t.angle,0);}});
   if(!mobile){assert.equal(await page.locator('.world-marker:visible').count(),6,'station signs stay visible');assert.equal(await page.locator('.train-label:visible').count(),2,'moving train signs stay visible');}
   await checkLayout(page,name+' tracking '+i);
   await page.waitForTimeout(180);
  }
  const moved=await page.evaluate(()=>window.__japanTest.snapshot());
  first.trains.forEach((t,i)=>assert.notDeepEqual(t.world,moved.trains[i].world));
  assert.notDeepEqual(first.actors,moved.actors,'miniature gestures animate');
  record(name+' both trains and their projected labels move together');
  await page.evaluate(()=>window.__japanTest.freeze());
  await page.waitForTimeout(100);
  for(let i=0;i<2;i++){
   if(await page.locator('.train-label').nth(i).isVisible())await popup(context,()=>page.locator('.train-label').nth(i).click({timeout:3000}),name+' train label '+(i+1)+' opens LastRide');
  }
  for(let i=0;i<2;i++){
   const p=await page.evaluate(i=>window.__japanTest.trainPoint(i),i);
   if(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id==='world-canvas',p)){assert.equal((await page.evaluate(p=>window.__japanTest.hit(p.x,p.y),p))?.route,'https://lastride.jp/en/');await popup(context,()=>page.mouse.click(p.x,p.y),name+' carriage '+(i+1)+' opens LastRide');}
  }
  const rail=await page.evaluate(()=>{
   for(let i=0;i<100;i++){
    const p=window.__japanTest.sampleRoute(i/100),el=document.elementFromPoint(p.x,p.y);
    if(el?.id==='world-canvas'&&window.__japanTest.hit(p.x,p.y)?.route)return p;
   }
  });
  assert.ok(rail,'find exposed clickable railway');
  await popup(context,()=>page.mouse.click(rail.x,rail.y),name+' railway opens LastRide');
  await page.waitForTimeout(2800);
  const before=await page.evaluate(()=>window.__japanTest.snapshot());
  await page.mouse.move(mobile?90:900,mobile?590:620);await page.mouse.down();await page.mouse.move(mobile?160:1000,mobile?610:650,{steps:8});await page.mouse.up();
  await page.waitForTimeout(350);
  assert.notEqual((await page.evaluate(()=>window.__japanTest.snapshot())).yaw,before.yaw);
  await page.mouse.wheel(0,150);await page.waitForTimeout(100);
  assert.notEqual((await page.evaluate(()=>window.__japanTest.snapshot())).distance,before.distance);
  record(name+' orbit and wheel zoom');
  if(mobile){
   const client=await context.newCDPSession(page), distance=(await page.evaluate(()=>window.__japanTest.snapshot())).distance;
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:130,y:580},{x:230,y:580}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:580},{x:260,y:580}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.ok((await page.evaluate(()=>window.__japanTest.snapshot())).distance<distance);
   record('mobile two-finger pinch zoom');
  }
  await page.locator('#overview-toggle').click();await page.waitForTimeout(950);
  assert.equal(await page.locator('#overview-toggle').getAttribute('aria-pressed'),'true');
  await checkLayout(page,name+' map');await screenshot(page,name+'-map');
  const ids=['northstar','axon','aster','kestrel','studyhub','kagi'];
  for(const [i,id] of ids.entries()){
   assert.equal(await page.locator('.world-marker[data-station="'+id+'"]').getAttribute('href'),'projects/'+id+'/');
   await page.keyboard.press(String(i+1));await page.waitForTimeout(700);
   assert.equal(await page.locator('#info-stop').innerText(),'Selected stop');
   assert.equal(await page.locator('#info-primary').getAttribute('href'),'projects/'+id+'/');
   assert.equal(await page.locator('#project-info').getAttribute('aria-hidden'),'false');
   await checkLayout(page,name+' '+id);
   if(i===0)await screenshot(page,name+'-project');
   await page.locator('#info-primary').click();await page.waitForURL(id==='studyhub'?'https://waseda-study-hub.vercel.app/':id==='kestrel'?'**/projects/kestrel/native/':'**/projects/'+id+'/');
   assert.equal((await page.request.get(page.url())).status(),200);
   record(name+' '+id+' destination');
   await ready(page);
  }
  await page.keyboard.press('1');assert.equal(await page.locator('#info-title').innerText(),'NorthStar');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#project-info').evaluate(el=>el.inert),true);
  await page.keyboard.press('3');assert.equal(await page.locator('#info-title').innerText(),'Aster');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#project-info').evaluate(el=>el.inert),true);
  await page.locator('.archive-link').focus();await page.keyboard.press('Enter');await page.waitForURL('**/projects.html');await ready(page);
  await page.locator('.about-toggle').click();assert.equal(await page.locator('#about-panel').evaluate(el=>el.inert),false);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#about-panel').evaluate(el=>el.inert),true);
  record(name+' keyboard, panel focus and dismissal');
  await page.locator('#ride-toggle').click();await page.waitForTimeout(900);
  const ride1=await page.evaluate(()=>window.__japanTest.snapshot());await page.waitForTimeout(400);const ride2=await page.evaluate(()=>window.__japanTest.snapshot());
  assert.equal(ride1.ride,true);assert.notDeepEqual(ride1.camera,ride2.camera);
  await checkLayout(page,name+' ride');await screenshot(page,name+'-ride');
  await page.locator('#ride-toggle').click();assert.equal(await page.locator('#ride-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#quality-toggle').click();assert.equal(await page.locator('#quality-toggle').getAttribute('aria-pressed'),'true');
  record(name+' train-follow camera and lite mode');
  assert.equal(await page.evaluate(()=>window.__japanTest.hideBehindCamera()),true);
  record(name+' labels culled behind camera');
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.__japanTest.hideOutsideViewport()),true);
  record(name+' labels culled outside viewport');
  await context.close();
 }
 const reducedContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const reducedPage=await reducedContext.newPage();reducedPage.on('pageerror',e=>errors.push(e.message));
 await reducedPage.route('**/japan-world.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+instrumentation});});
 await ready(reducedPage);const still=await reducedPage.evaluate(()=>window.__japanTest.snapshot());
 assert.equal(still.motion,false);assert.notDeepEqual(still.trains[0].world,still.trains[1].world);// Moving ads may be culled when a permanent station occupies the space.
 await reducedPage.waitForTimeout(400);assert.deepEqual((await reducedPage.evaluate(()=>window.__japanTest.snapshot())).trains,still.trains);
 await checkLayout(reducedPage,'reduced-motion');await screenshot(reducedPage,'mobile-reduced-motion');
 await reducedPage.keyboard.press('4');assert.equal(await reducedPage.locator('#info-title').innerText(),'Kestrel');
 await reducedPage.locator('#info-close').click();await reducedPage.locator('#overview-toggle').click();
 await reducedPage.locator('#motion-toggle').click();assert.equal((await reducedPage.evaluate(()=>window.__japanTest.snapshot())).motion,true);
 record('reduced motion initializes separate trains, stays still, allows navigation and explicit resume');
 for(const [width,height] of [[320,740],[760,900],[1024,768],[1440,900]]){
  await reducedPage.setViewportSize({width,height});await ready(reducedPage);await checkLayout(reducedPage,width+'px responsive');
 }
 await reducedContext.close();
 assert.deepEqual(errors,[],'JavaScript/console runtime errors');record('no JavaScript or console runtime errors');
} finally {
 await writeFile(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));
 await browser.close();
}
