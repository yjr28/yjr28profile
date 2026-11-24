import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log(m.text())});
 await page.route('**/japan-world.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__smoke=()=>({ready:animated.sceneReady,frames:frameCount,positions:trains.map(t=>t.cars[0].position.toArray())});'});});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173');
 await page.waitForFunction(()=>document.getElementById('world-loading').classList.contains('done'),{},{timeout:45000});
 assert.equal(await page.locator('#no-webgl').isVisible(),false,await page.locator('#startup-error').textContent());
 const first=await page.evaluate(()=>window.__smoke());
 assert.equal(first.ready,true);
 await page.waitForFunction(n=>window.__smoke().frames>n+2,first.frames,{timeout:30000});
 const next=await page.evaluate(()=>window.__smoke());
 assert.notDeepEqual(first.positions,next.positions);
 assert.deepEqual(errors,[]);
 console.log('PASS: 3D initialized and trains move in the centered homepage.');
}finally{await browser.close()}
