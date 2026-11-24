import * as THREE from "./assets/three.module.js";
import {buildScenery,locations,anchors,routeNodes,buildViaduct,buildWaterSurface,addClouds} from "./wafu-scene.js";

/* THE JAPAN LINE.
   Every part of this world is generated as real 3D geometry, not a flat image.
   The destinations are the engineering projects themselves; the railway is LastRide.
   Controls: drag = orbit, shift/right drag = pan, scroll/pinch = zoom,
   click a landmark or railway, use the station bar for direct navigation. */
const $ = (id) => document.getElementById(id);
const canvas = $("world-canvas");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const app = $("world-app");
const stationData = {
  northstar:{number:"1",name:"NorthStar",place:"東京・秋葉原 / Tokyo after dark",tagline:"Control the fleet. Understand the failure.",description:"A hybrid-cloud server management system with native Linux telemetry, a C++ agent, and a Java/Spring control plane. Try the interactive command lifecycle: make a host go offline, queue work, and bring the agent back.",meta:["C++ agent","Spring / Java","PostgreSQL","Telemetry"],url:"projects/northstar/",source:"https://github.com/yjr28/NorthStar",pos:[-34,2,-4],camera:[-27,22,28]},
  axon:{number:"2",name:"AXON",place:"認知訓練 / Cognitive training lab",tagline:"Train. Measure. Improve.",description:"A competitive cognitive training application built with Expo, Go, PostgreSQL, Redis and Python. Play a timed exercise using the actual client task engine and inspect your results.",meta:["Expo / Go","PostgreSQL / Redis","Python","Seeded tasks"],url:"projects/axon/",source:"https://github.com/yjr28/Axon",pos:[-14,2,20],camera:[-13,20,42]},
  aster:{number:"3",name:"Aster",place:"京都・庭園 / Kyoto gardens",tagline:"Choose a plan. Know when to abstain.",description:"A PostgreSQL query-plan ranking prototype that scores candidate plans while enforcing uncertainty and decision-margin thresholds. The demo runs its Python ranker inside your browser.",meta:["PostgreSQL","Python","Query planning","Confidence gates"],url:"projects/aster/",source:"https://github.com/yjr28/aster-pg-optimizer",pos:[-7,2,-20],camera:[12,21,16]},
  kestrel:{number:"4",name:"Kestrel",place:"富士山 / The Fuji observatory",tagline:"Find the first divergence, not the loudest symptom.",description:"A Go distributed-systems flight recorder with causal traces and replayable seeded faults. Inject latency and follow the events through a ten-service request using the actual Go core compiled to WebAssembly.",meta:["Go / WebAssembly","Causal traces","Fault injection","Replay"],url:"projects/kestrel/",source:"https://github.com/yjr28/kestrel-replay",pos:[20,2,-22],camera:[34,25,21]},
  studyhub:{number:"5",name:"Waseda Study Hub",place:"早稲田・東京 / Waseda campus",tagline:"Build campus software with a trust boundary.",description:"A student discovery and study-buddy product with verified university sign-in, private conversations, and AI-assisted matching. Explore the authorization and ranking decisions in its case study.",meta:["Next.js","Firebase","Auth / privacy","AI matching"],url:"projects/studyhub/",source:"https://github.com/Waseda-Study-Hub/frontend",pos:[39,2,-2],camera:[29,22,49]}
};
const LASTRIDE = "https://lastride.jp/en/";
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const ease = (t) => t*t*(3-2*t);
let seedValue = 123521;
function random(){seedValue=(seedValue*1664525+1013904223)>>>0;return seedValue/4294967296}
function range(a,b){return a+(b-a)*random()}
function pick(list){return list[Math.floor(random()*list.length)]}
const V = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const reusable = new THREE.Object3D();
const matte = (c,roughness=.88,metalness=0)=>new THREE.MeshStandardMaterial({color:c,roughness,metalness});
const glow = (c,e=c,intensity=.9)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:intensity,roughness:.55});
const material = {
  dirt:matte(0x826c66),stone:matte(0xaeb6af),stoneDark:matte(0x51636d),
  nightGrass:matte(0x416f72),fujiGrass:matte(0x83ac91),campusGrass:matte(0x7eb5a1),
  templeGrass:matte(0x88a687),workGrass:matte(0x668a86),
  deepBlue:matte(0x172c46),slate:matte(0x233957),nightFacade:matte(0x29344c),
  sakura1:matte(0xf5b1c2),sakura2:matte(0xe793ae),sakura3:matte(0xffd9dd),
  bark:matte(0x705a5d),bamboo:matte(0x5d997a),
  red:matte(0xad404c),vermillion:matte(0xc95547),vermillionLight:matte(0xe9785c),
  roof:matte(0x3b4c5b),roofGreen:matte(0x476f65),gold:matte(0xe4b77d),
  cream:matte(0xf2e9d5),snow:matte(0xdceff3),water:matte(0x6babb9),
  neonPink:glow(0xf2a2ca,0xe36ba2,1.5),neonBlue:glow(0x7cdbe4,0x3ba8e2,1.4),
  lantern:glow(0xffd2a0,0xf4a764,1.7),warmWindow:glow(0xffe0a7,0xd99353,1.2),
  rail:matte(0xdce0db,.36,.43),railTie:matte(0x52666c)
};
let renderer,scene,camera,world,raycaster,waWater;
const interactables=[],petals=[],trains=[],swayers=[],clouds=[],pulses=[],waterRipples=[],fireflies=[];
const staticMeshes={};
const animated={clock:0,motion:!reduced,lite:false,focused:null,overview:false,sceneReady:false,railHovered:false,ride:false};
const look={center:V(0,0,0),target:V(0,0,0),yaw:0.14,pitch:0.98,distance:125,targetYaw:0.14,targetPitch:0.98,targetDistance:125};
const minDistance=20,maxDistance=170;
const pointer={down:false,dragged:false,x:0,y:0,x0:0,y0:0,mode:"orbit"};
const viewport={width:0,height:0,left:0,top:0};
const touchPoints=new Map();
let pinchDistance=0;
const dummy = new THREE.Object3D();

function add(parent,geometry,mat,x=0,y=0,z=0,cast=true){
  const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);
  if(cast){m.castShadow=true;m.receiveShadow=true}
  parent.add(m);return m;
}
function box(parent,w,h,d,mat,x=0,y=0,z=0,cast=true){
  return add(parent,new THREE.BoxGeometry(w,h,d),mat,x,y,z,cast)
}
function cyl(parent,top,bottom,h,mat,x=0,y=0,z=0,segments=8){
  return add(parent,new THREE.CylinderGeometry(top,bottom,h,segments),mat,x,y,z)
}
function sphere(parent,r,mat,x=0,y=0,z=0,detail=1){
  return add(parent,new THREE.IcosahedronGeometry(r,detail),mat,x,y,z)
}
function mark(root,type,id){root.userData[type]=id;interactables.push(root);return root}
function getInteraction(object){
  let o=object;
  while(o){if(o.userData.route)return {route:o.userData.route};if(o.userData.station)return {station:o.userData.station};o=o.parent}
  return null;
}
function lantern(parent,x,z,s=1){
 const g=new THREE.Group();g.position.set(x,1.55,z);g.scale.setScalar(s);parent.add(g);
 cyl(g,.10,.16,2.4,material.roof,0,1.2,0,6);
 box(g,.91,.88,.91,material.lantern,0,2.48,0);
 box(g,1.1,.15,1.1,material.roof,0,3.01,0);
 box(g,1.08,.16,1.08,material.roof,0,2.0,0);
 return g;
}

let railwayCurve,railLength,railCollision;
function buildRailway(){
 // This is the shared LastRide express line. Even the distant bridges are clickable.
 const nodes=routeNodes;
 railwayCurve=new THREE.CatmullRomCurve3(nodes.map(([x,z])=>V(x,3.65,z)),true,"catmullrom",.35);
 railLength=railwayCurve.getLength();
 const N=500;
 const offsets=[-.73,.73,-1.16,1.16];
 for(const offset of offsets){
  const railPts=[];
  for(let i=0;i<=N;i++){
   const t=i/N,p=railwayCurve.getPointAt(t),v=railwayCurve.getTangentAt(t);
   const side=V(-v.z,0,v.x).normalize().multiplyScalar(offset);
   railPts.push(p.add(side));
  }
  const railCurve=new THREE.CatmullRomCurve3(railPts,false,"centripetal");
  const rail=add(world,new THREE.TubeGeometry(railCurve,N,Math.abs(offset)>1?.14:.11,6,false),Math.abs(offset)>1?material.vermillion:material.rail,0,0,0,false);
  mark(rail,"route",LASTRIDE);rail.name="Clickable LastRide rail";
 }
 // Invisible to the eye, but large enough to hit with a mouse or touch.
 railCollision=add(world,new THREE.TubeGeometry(railwayCurve,N,1.06,6,true),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,0,0,false);
 mark(railCollision,"route",LASTRIDE);
 const sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(2.2,.19,.46),material.railTie,370);
 sleepers.castShadow=false;sleepers.receiveShadow=true;world.add(sleepers);
 for(let i=0;i<370;i++){
  const t=i/370,p=railwayCurve.getPointAt(t),tan=railwayCurve.getTangentAt(t);
  dummy.position.copy(p).add(V(0,-.21,0));
  dummy.rotation.set(0,Math.atan2(tan.x,tan.z),0);dummy.scale.setScalar(1);dummy.updateMatrix();sleepers.setMatrixAt(i,dummy.matrix);
 }
 sleepers.instanceMatrix.needsUpdate=true;
 buildViaduct(world,railwayCurve,railLength);
 // Deliberately contrasting cream shinkansen that remain animated even when the camera rests.
 function addTrain(start,accent){
  const cars=[];
  for(let k=0;k<3;k++){
   const g=new THREE.Group();world.add(g);g.userData.route=LASTRIDE;interactables.push(g);
   const body=box(g,1.98,1.78,4.5,material.cream,0,1.02,0);
   box(g,2.05,.21,4.58,accent,0,1.89,0);
   for(const side of [-1,1]){
    box(g,.09,.72,4.22,accent,side*1.01,1.2,0,false);
    box(g,.09,.08,4.4,material.gold,side*1.04,.83,0,false);
    for(let j=0;j<4;j++){
     const window=box(g,.13,.33,.61,material.warmWindow,side*1.04,1.2,-1.32+j*.88,false);
     window.castShadow=false;
    }
   }
   box(g,2.08,.14,4.55,accent,0,.39,0,false);
   for(const side of [-1,1])for(const z of [-1.52,1.52]){const wheel=add(g,new THREE.CylinderGeometry(.33,.33,.16,16),material.stoneDark,side*.82,.20,z,false);wheel.rotation.z=Math.PI/2;}
   box(g,1.35,.14,3.5,material.roof,0,1.99,0,false);
   if(k===0){
    const nose=sphere(g,1,material.cream,0,.98,2.18,3);nose.scale.set(.99,.88,1.17);
    const windshield=sphere(g,.65,material.deepBlue,0,1.31,2.88,2);windshield.scale.set(1.18,.47,.40);
    for(const x of [-.55,.55]){const l=sphere(g,.15,material.lantern,x,.74,3.15,2);l.scale.set(1,.7,.65);}
   }
   cars.push(g);
  }
  const train={cars,start,speed:start<.6?.011:-.0095};
  trains.push(train);
  positionTrain(train);
 }
 addTrain(.39,material.vermillion);
 addTrain(.84,material.vermillion);
 // Architectural train platforms, placed along the route near the islands.
 for(const t of [.06,.23,.37,.55,.76]){
  const p=railwayCurve.getPointAt(t),dir=railwayCurve.getTangentAt(t),lateral=V(-dir.z,0,dir.x);
  const platform=new THREE.Group();platform.position.copy(p).add(lateral.multiplyScalar(2.1));platform.position.y=3.36;
  platform.rotation.y=Math.atan2(dir.x,dir.z);world.add(platform);
  box(platform,2.3,.31,5.5,material.stone,0,0,0);
  for(const zz of [-2.2,2.2])cyl(platform,.08,.08,2.1,material.red,-.75,1.05,zz,6);
  box(platform,2.5,.2,5.8,material.roofGreen,-.75,2.12,0);
  lantern(platform,-.83,1.5,.22);
 }
}
function positionTrain(train){
 const direction=Math.sign(train.speed);
 train.cars.forEach((car,i)=>{
  const k=(train.start-direction*i*4.85/railLength+1)%1;
  const p=railwayCurve.getPointAt(k),tan=railwayCurve.getTangentAt(k);
  car.position.copy(p);car.position.y+=.24;
  car.rotation.set(0,Math.atan2(tan.x*direction,tan.z*direction),0);
 });
}
function buildPetals(){
 const count=window.innerWidth<650?185:350;
 const geo=new THREE.PlaneGeometry(.46,.26);
 const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:false});
 const mesh=new THREE.InstancedMesh(geo,mat,count);mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);
 const colors=[new THREE.Color(0xfce1e8),new THREE.Color(0xf7b4cb),new THREE.Color(0xf0a0bb),new THREE.Color(0xffe6ec)];
 for(let i=0;i<count;i++){
  const d={x:range(-75,85),y:range(3,46),z:range(-58,45),speed:range(.45,1.15),spin:range(.3,1.5),phase:range(0,6.28)};
  petals.push(d);
  mesh.setColorAt(i,pick(colors));
  dummy.position.set(d.x,d.y,d.z);dummy.rotation.set(.4,i*2,0);dummy.scale.setScalar(range(.65,1.4));dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 staticMeshes.petals=mesh;
 const fireflyG=new THREE.SphereGeometry(.13,5,5);
 const fireflyMat=new THREE.MeshBasicMaterial({color:0xfedc9c,transparent:true,opacity:.9});
 const fmesh=new THREE.InstancedMesh(fireflyG,fireflyMat,58);fmesh.frustumCulled=false;scene.add(fmesh);
 for(let i=0;i<58;i++){
  const d={x:range(-52,-18),y:range(2.5,10),z:range(-18,14),phase:range(0,6.28)};
  fireflies.push(d);dummy.position.set(d.x,d.y,d.z);dummy.scale.setScalar(range(.5,1.5));dummy.updateMatrix();fmesh.setMatrixAt(i,dummy.matrix);
 }
 fmesh.instanceMatrix.needsUpdate=true;staticMeshes.fireflies=fmesh;
}
function buildWorld(){
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(43,1,.15,550);
 world=new THREE.Group();scene.add(world);
 scene.add(new THREE.HemisphereLight(0xfff3df,0x486b82,1.17));
 scene.add(new THREE.AmbientLight(0xbcdfff,.22));
 const sun=new THREE.DirectionalLight(0xffdfac,3.0);sun.position.set(55,60,16);sun.castShadow=true;
 sun.shadow.mapSize.set(window.innerWidth<760?1024:2048,window.innerWidth<760?1024:2048);
 sun.shadow.camera.left=-82;sun.shadow.camera.right=82;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;
 sun.shadow.camera.near=2;sun.shadow.camera.far=210;sun.shadow.normalBias=.08;sun.shadow.bias=-.0003;sun.shadow.radius=3;
 scene.add(sun);
 const fill=new THREE.DirectionalLight(0xc0dfff,1.1);fill.position.set(-45,24,-45);scene.add(fill);
 buildScenery({world,mark,swayers,pulses});
 buildRailway();addClouds(scene,clouds);buildPetals();
 waWater=buildWaterSurface(world,scene,renderer,camera);
 scene.fog=new THREE.FogExp2(0xa7cbe2,.0022);
}

let toastTimeout=null,frameCount=0,lastFrame=0,lastHover=0;
const markerButtons=Array.from(document.querySelectorAll(".world-marker"));
const stationButtons=markerButtons;
function toast(message){
 const el=$("world-toast");el.textContent=message;el.classList.add("visible");
 clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove("visible"),2700);
}
function openLastRide(){
 window.open(LASTRIDE,"_blank","noopener,noreferrer");
 toast("All aboard the LastRide express.");
}
function closeAbout(){
 $("about-panel").inert=true;
 $("about-panel").classList.remove("open");$("about-panel").setAttribute("aria-hidden","true");
}
function exitRide(){animated.ride=false;const b=$("ride-toggle");b.setAttribute("aria-pressed","false");b.textContent="Ride the line"}
function closeInfo(){
 const hadFocus=$("project-info").contains(document.activeElement);
 $("project-info").inert=true;
 $("project-info").classList.remove("visible");$("project-info").setAttribute("aria-hidden","true");
 app.classList.remove("station-selected");
 if(hadFocus&&animated.focused){const marker=markerButtons.find(b=>b.dataset.station===animated.focused);const fallback=document.querySelector(".archive-link");(marker&&getComputedStyle(marker).visibility==="visible"?marker:fallback)?.focus({preventScroll:true});}
 animated.focused=null;
 if(camera)resize();
 stationButtons.forEach(b=>b.classList.remove("active"));
 markerButtons.forEach(b=>b.removeAttribute("aria-current"));
}
function resetOverview({animate=true}={}){
 exitRide();closeInfo();closeAbout();
 animated.overview=true;
 look.target.set(0,1,0);look.targetYaw=.08;look.targetPitch=1.14;look.targetDistance=window.innerWidth<760?115:124;
 $("overview-toggle").setAttribute("aria-pressed","true");$("overview-label").textContent="Free camera";
 if(!animate){look.center.copy(look.target);look.yaw=look.targetYaw;look.pitch=look.targetPitch;look.distance=look.targetDistance}
}
function focusStation(id){
 exitRide();const d=stationData[id];if(!d)return;
 closeAbout();
 animated.overview=false;animated.focused=id;
 look.target.set(...d.pos);
 look.targetYaw=id==="northstar"?.24:id==="studyhub"?-.18:id==="kestrel"?-.12:.28;
 look.targetPitch=id==="kestrel"?.60:.75;
 look.targetDistance=id==="northstar"?38:id==="kestrel"?45:37;
 $("overview-toggle").setAttribute("aria-pressed","false");$("overview-label").textContent="Map view";
 $("info-stop").textContent="Selected stop";
 $("info-place").textContent=d.place;
 $("info-title").textContent=d.name;
 $("info-tagline").textContent=d.tagline;
 $("info-description").textContent=d.description;
 $("info-meta").replaceChildren();
 for(const tag of d.meta){const span=document.createElement("span");span.textContent=tag;$("info-meta").appendChild(span)}
 const primary=$("info-primary");primary.href=d.url;primary.querySelector("span").textContent="↗";
 const secondary=$("info-secondary");
 if(d.source){secondary.href=d.source;secondary.style.display="flex"}else{secondary.style.display="none"}
 $("project-info").inert=false;
 $("project-info").setAttribute("aria-hidden","false");$("project-info").classList.add("visible");
 app.classList.add("station-selected");
 resize();
 $("control-hint").classList.add("hidden");
 stationButtons.forEach(b=>b.classList.toggle("active",b.dataset.station===id));
 markerButtons.forEach(b=>{if(b.dataset.station===id)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current")});
 $("info-close").focus({preventScroll:true});
 // Details and links are available before the camera settles.
}
function toggleMap(){
 if(animated.overview){animated.overview=false;$("overview-toggle").setAttribute("aria-pressed","false");$("overview-label").textContent="Map view";look.target.set(1,5,-1);look.targetYaw=.035;look.targetPitch=.60;look.targetDistance=128;return}
 resetOverview();
}
function bindUI(){
 $("ride-toggle").addEventListener("click",()=>{
  if(animated.ride){resetOverview();return}
  closeInfo();closeAbout();animated.ride=true;app.classList.add("station-selected");resize();
  $("ride-toggle").setAttribute("aria-pressed","true");$("ride-toggle").textContent="Exit the ride";
  $("control-hint").classList.add("hidden");toast("A moving postcard from the LastRide express.");
 });
 // Project signs are native links. Clicking a 3D landmark or using 1–5 still opens its camera/detail view.
 $("info-close").addEventListener("click",closeInfo);
 $("overview-toggle").addEventListener("click",toggleMap);
 document.querySelectorAll("[data-about]").forEach(b=>b.addEventListener("click",()=>{
  const panel=$("about-panel");
  if(panel.classList.contains("open")){closeAbout();document.querySelector(".about-toggle").focus({preventScroll:true})}
  else{closeInfo();panel.inert=false;panel.classList.add("open");panel.setAttribute("aria-hidden","false");panel.querySelector(".about-close").focus({preventScroll:true})}
 }));
 $("dismiss-hint").addEventListener("click",()=>$("control-hint").classList.add("hidden"));
 $("motion-toggle").addEventListener("click",()=>{
  animated.motion=!animated.motion;
  $("motion-toggle").textContent=animated.motion?"Pause motion":"Resume motion";
  $("motion-toggle").setAttribute("aria-pressed",String(!animated.motion));
  toast(animated.motion?"The trains are running again.":"Scenery paused. Keep exploring.");
 });
 $("quality-toggle").addEventListener("click",()=>{
  animated.lite=!animated.lite;
  $("quality-toggle").textContent=animated.lite?"Full quality":"Lite mode";
  $("quality-toggle").setAttribute("aria-pressed",String(animated.lite));
  renderer.setPixelRatio(animated.lite?Math.min(window.devicePixelRatio||1,1):Math.min(window.devicePixelRatio||1,1.6));
  renderer.shadowMap.enabled=!animated.lite;
  renderer.setSize(viewport.width,viewport.height,false);
  toast(animated.lite?"Lite mode saves GPU power.":"Full-quality rendering enabled.");
 });
 if(reduced){$("motion-toggle").textContent="Resume motion";$("motion-toggle").setAttribute("aria-pressed","true")}
 document.addEventListener("keydown",e=>{
  const tag=document.activeElement?.tagName;
  if(tag==="INPUT"||tag==="TEXTAREA"||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="Escape"){const aboutOpen=$("about-panel").classList.contains("open");closeInfo();closeAbout();if(aboutOpen)document.querySelector(".about-toggle").focus({preventScroll:true});return}
  if(e.key.toLowerCase()==="t"){$("ride-toggle").click();e.preventDefault();return}
  if(e.key.toLowerCase()==="m"){toggleMap();e.preventDefault();return}
  if(e.key.toLowerCase()==="r"){resetOverview();e.preventDefault();return}
  if(/^[1-5]$/.test(e.key)){focusStation(Object.keys(stationData)[Number(e.key)-1]);e.preventDefault();return}
  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a"){look.targetYaw-=.16;e.preventDefault()}
  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d"){look.targetYaw+=.16;e.preventDefault()}
  if(e.key==="ArrowUp"||e.key.toLowerCase()==="w"){look.targetDistance=clamp(look.targetDistance*.91,minDistance,maxDistance);e.preventDefault()}
  if(e.key==="ArrowDown"||e.key.toLowerCase()==="s"){look.targetDistance=clamp(look.targetDistance*1.1,minDistance,maxDistance);e.preventDefault()}
 });
 canvas.addEventListener("contextmenu",e=>e.preventDefault());
 canvas.addEventListener("pointerdown",e=>{
  if(e.button!==0&&e.button!==2)return;
  if(e.pointerType==="touch"){
   touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
   canvas.setPointerCapture(e.pointerId);
   if(touchPoints.size===2){
    const [a,b]=[...touchPoints.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);
    pointer.dragged=true;return;
   }
  }
  if(animated.ride)resetOverview();
  pointer.down=true;pointer.dragged=false;pointer.x=e.clientX;pointer.y=e.clientY;pointer.x0=e.clientX;pointer.y0=e.clientY;pointer.mode=(e.button===2||e.shiftKey)?"pan":"orbit";
  canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener("pointermove",e=>{
  if(touchPoints.has(e.pointerId)){
   touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(touchPoints.size===2){
    const [a,b]=[...touchPoints.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
    if(pinchDistance>0&&distance>0)look.targetDistance=clamp(look.targetDistance*pinchDistance/distance,minDistance,maxDistance);
    pinchDistance=distance;pointer.dragged=true;return;
   }
  }
  if(pointer.down){
   const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
   pointer.x=e.clientX;pointer.y=e.clientY;
   if(Math.hypot(e.clientX-pointer.x0,e.clientY-pointer.y0)>6)pointer.dragged=true;
   if(pointer.dragged){
    if(pointer.mode==="orbit"){
     look.targetYaw-=dx*.006;look.targetPitch=clamp(look.targetPitch+dy*.0045,.23,1.5);
    }else{
     const speed=look.targetDistance*.0026;
     look.target.x-=dx*Math.cos(look.targetYaw)*speed;
     look.target.z+=dx*Math.sin(look.targetYaw)*speed;
     look.target.z+=dy*Math.cos(look.targetYaw)*speed;
     look.target.x+=dy*Math.sin(look.targetYaw)*speed;
     look.target.x=clamp(look.target.x,-60,60);look.target.z=clamp(look.target.z,-51,47);
    }
    $("control-hint").classList.add("hidden");
   }
  }else if(performance.now()-lastHover>80){
   lastHover=performance.now();
   const hit=rayHit(e);
   canvas.style.cursor=hit?"pointer":"grab";
   if(hit?.route!==undefined&&!animated.railHovered)toast("Click the railway to visit LastRide.");
   animated.railHovered=!!hit?.route;
  }
 });
 canvas.addEventListener("pointerup",e=>{
  touchPoints.delete(e.pointerId);
  if(pinchDistance){pinchDistance=0;pointer.down=false;return}
  if(!pointer.down)return;
  pointer.down=false;
  if(!pointer.dragged){
   const hit=rayHit(e);
   if(hit?.route){openLastRide();return}
   if(hit?.station){focusStation(hit.station);return}
  }
 });
 canvas.addEventListener("pointercancel",()=>{pointer.down=false;touchPoints.clear();pinchDistance=0});
 canvas.addEventListener("wheel",e=>{
  e.preventDefault();
  look.targetDistance=clamp(look.targetDistance*Math.exp(e.deltaY*.00135),minDistance,maxDistance);
  $("control-hint").classList.add("hidden");
 },{passive:false});
 // Keep native page focus and screen-reader navigation on every station.
}
function rayHit(e){
 if(!raycaster||!camera)return null;
 const rect=canvas.getBoundingClientRect();
 const point=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 raycaster.setFromCamera(point,camera);
 const hits=raycaster.intersectObjects(interactables,true);
 for(const h of hits){
  const found=getInteraction(h.object);if(found)return found;
 }
 return null;
}
function resize(){
 const bounds=canvas.getBoundingClientRect();
 viewport.width=bounds.width;viewport.height=bounds.height;viewport.left=0;viewport.top=0;
 if(!renderer)return;
 renderer.setSize(viewport.width,viewport.height,false);
 const mobile=window.innerWidth<760;
 // The diorama is the hero: equal side margins and a small reserved footer.
 // Keep the sky, water and particles full bleed; no desktop sidebar offset.
 const margin=mobile?8:Math.max(24,viewport.width*.035);
 const stage={left:margin,top:mobile?70:76,
  width:Math.max(1,viewport.width-2*margin),
  height:Math.max(1,viewport.height-(mobile?195:174))};
 if(animated.focused&&!mobile){
  stage.left=30;stage.top=100;stage.width=viewport.width-430;
 }else if(animated.ride){
  stage.left=0;stage.top=mobile?94:80;stage.width=viewport.width;stage.height=viewport.height-(mobile?172:150);
 }
 const stageAspect=stage.width/stage.height;
 const stageFov=Math.max(mobile?56:43,THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(56)/2)/stageAspect)));
 camera.aspect=viewport.width/viewport.height;
 camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(stageFov)/2)*viewport.height/stage.height));
 camera.setViewOffset(viewport.width,viewport.height,viewport.width/2-stage.left-stage.width/2,viewport.height/2-stage.top-stage.height/2,viewport.width,viewport.height);
 camera.updateProjectionMatrix();
}

function animateWorld(dt,now){
 if(animated.motion){
  const t=animated.clock+=dt;
  for(const train of trains){
   train.start=(train.start+train.speed*dt+1)%1;
   positionTrain(train);
  }
  const mesh=staticMeshes.petals;
  if(mesh){
   for(let i=0;i<petals.length;i++){
    const p=petals[i];
    p.y-=dt*p.speed*1.9;
    p.x+=dt*(.85+Math.sin(t*.3+p.phase)*.26);
    p.z+=dt*(.36+Math.cos(t*.35+p.phase)*.35);
    if(p.y<.15){p.y=range(25,44);p.x=range(-80,68);p.z=range(-60,40)}
    if(p.x>87)p.x=-85;
    dummy.position.set(p.x,p.y,p.z);
    dummy.rotation.set(t*.8+p.phase,t*.35+p.phase,t*1.2+p.phase);
    dummy.scale.setScalar(.85);
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   }
   mesh.instanceMatrix.needsUpdate=true;
  }
  const dots=staticMeshes.fireflies;
  if(dots){
   for(let i=0;i<fireflies.length;i++){
    const p=fireflies[i];
    dummy.position.set(p.x+Math.sin(t*.27+p.phase)*.5,p.y+Math.sin(t*.8+p.phase)*.45,p.z+Math.cos(t*.34+p.phase)*.38);
    dummy.rotation.set(0,0,0);dummy.scale.setScalar(.5+.4*(1+Math.sin(t*2+p.phase)));dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);
   }
   dots.instanceMatrix.needsUpdate=true;
  }
  for(const c of clouds){c.g.position.x+=dt*c.speed*c.direction;if(c.g.position.x>125)c.g.position.x=-125;if(c.g.position.x< -125)c.g.position.x=125}
  for(const s of swayers){s.g.rotation.z=Math.sin(t*.8+s.phase)*s.scale;s.g.rotation.x=Math.cos(t*.55+s.phase)*s.scale*.5}
  for(const p of pulses){
   if(p.kind==="rotate")p.object.rotation.y+=dt*p.speed;
   if(p.kind==="rotateZ")p.object.rotation.z+=dt*p.speed;
   if(p.kind==="sweep")p.object.rotation.y=Math.sin(t*p.speed*4)*.5;
   if(p.kind==="birds"){p.object.position.x+=Math.sin(t*.25)*dt*.2;p.object.position.y=19+Math.sin(t*.4)*1.7}
   if(p.kind==="glimmer")p.object.scale.setScalar(.83+.17*Math.sin(t*2+p.phase));
  }
  waterRipples.forEach(p=>{p.o.material.opacity=.08+.05*(1+Math.sin(t*.7+p.phase))});
 }
 // A cinematic rail-follow mode turns a static portfolio into a journey.
 if(animated.ride && trains.length){
  const t=trains[0].start,at=railwayCurve.getPointAt(t),dir=railwayCurve.getTangentAt(t);
  const side=V(-dir.z,0,dir.x);
  const chase=at.clone().addScaledVector(dir,-23).addScaledVector(side,11).add(V(0,18,0));
  camera.position.lerp(chase,1-Math.exp(-2.9*Math.min(dt,.05)));
  const ahead=at.clone().addScaledVector(dir,13).add(V(0,3,0));
  camera.lookAt(ahead);camera.updateMatrixWorld();return;
 }
 // Exponential damping makes the camera settle naturally without feeling slippery.
 const damp=reduced?1:1-Math.exp(-4.6*Math.min(dt,.05));
 look.center.lerp(look.target,damp);
 look.yaw=mix(look.yaw,look.targetYaw,damp);
 look.pitch=mix(look.pitch,look.targetPitch,damp);
 look.distance=mix(look.distance,look.targetDistance,damp);
 const horizontal=Math.cos(look.pitch)*look.distance;
 camera.position.set(look.center.x+Math.sin(look.yaw)*horizontal,look.center.y+Math.sin(look.pitch)*look.distance,look.center.z+Math.cos(look.yaw)*horizontal);
 camera.lookAt(look.center);
 camera.updateMatrixWorld();
}
const trainLabels=Array.from(document.querySelectorAll(".train-label"));
const projected=V(),cameraSpace=V();
const labelSizes=new WeakMap();
const labelObserver=new ResizeObserver(entries=>{
 for(const entry of entries)labelSizes.set(entry.target,{width:entry.borderBoxSize[0].inlineSize,height:entry.borderBoxSize[0].blockSize});
});
for(const label of [...markerButtons,...trainLabels]){
 label.hidden=false;
 labelObserver.observe(label);
}
const overlaySelectors=[".global-nav",".world-intro",".tiny-footer",".project-info.visible",".about-panel.open",".world-control-hint:not(.hidden)",".world-toast.visible"];
function overlaps(a,b,gap=7){return a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap}
function projectAnchor(position){
 cameraSpace.copy(position).applyMatrix4(camera.matrixWorldInverse);
 projected.copy(position).project(camera);
 if(cameraSpace.z>=0||projected.z< -1||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1)return null;
 return {x:viewport.left+(projected.x*.5+.5)*viewport.width,y:viewport.top+(-projected.y*.5+.5)*viewport.height};
}
function placeLabel(label,point,occupied,lifts,slide=false){
 const size=labelSizes.get(label);
 let placed=null;
 if(point&&size){
  placement: for(const lift of lifts){
   for(const shift of slide?[0,-size.width*.4,size.width*.4]:[0]){
   const rect={left:point.x-size.width/2+shift,right:point.x+size.width/2+shift,top:point.y-size.height-lift,bottom:point.y-lift};
   if(rect.left<8||rect.right>app.clientWidth-8||rect.top<8||rect.bottom>app.clientHeight-8)continue;
   if(occupied.some(other=>overlaps(rect,other)))continue;
   placed=rect;break placement;
   }
  }
 }
 // Visibility also removes offscreen signs from keyboard navigation.
 label.classList.toggle("marker-hidden",!placed);
 label.style.visibility=placed?"visible":"hidden";
 if(placed){
  label.style.left=placed.left+"px";label.style.top=placed.top+"px";
  label.style.transform="none";
  label.style.setProperty("--leader",(point.y-placed.bottom)+"px");
  label.style.setProperty("--stem-x",(point.x-placed.left)+"px");
  occupied.push(placed);
 }
}
function updateMarkers(){
 const appBounds=app.getBoundingClientRect();
 const occupied=Array.from(document.querySelectorAll(overlaySelectors.join(",")))
  .filter(el=>getComputedStyle(el).visibility!=="hidden")
  .map(el=>{const r=el.getBoundingClientRect();return {left:r.left-appBounds.left,right:r.right-appBounds.left,top:r.top-appBounds.top,bottom:r.bottom-appBounds.top}});
 // The roof point comes from the very same lead carriage that is rendered this frame.
 // No independent CSS animation or route approximation can drift away from the train.
 trains.forEach((train,i)=>{
  const roof=train.cars[0].localToWorld(V(0,2.1,0));
  placeLabel(trainLabels[i],projectAnchor(roof),occupied,[9,25,45]);
 });
 for(const marker of markerButtons){
  const d=stationData[marker.dataset.station];
  placeLabel(marker,projectAnchor(V(...anchors[marker.dataset.station])),occupied,[9,25,43,62,82],true);
 }
}

function startWorld(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance",preserveDrawingBuffer:false});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<760?1.5:2));
  raycaster=new THREE.Raycaster();
  buildWorld();
  resize();bindUI();
  resetOverview({animate:false});
  animated.overview=false;
  // Center the complete diorama, including Fuji and the outer rail curve.
  look.target.set(1,5,-1);look.center.copy(look.target);look.targetPitch=.60;look.pitch=.60;look.targetDistance=window.innerWidth<760?128:128;look.distance=look.targetDistance;look.targetYaw=.035;look.yaw=.035;
  $("overview-toggle").setAttribute("aria-pressed","false");$("overview-label").textContent="Map view";
  window.addEventListener("resize",resize,{passive:true});
  window.addEventListener("visibilitychange",()=>{lastFrame=performance.now()});
  const startupHash=window.location.hash.replace("#","");
  if(startupHash in stationData)focusStation(startupHash);
  else if(["about","contact","experience"].includes(startupHash)){
    const panel=$("about-panel");panel.inert=false;panel.classList.add("open");panel.setAttribute("aria-hidden","false");panel.querySelector(".about-close").focus({preventScroll:true});
  }
  function tick(time){
   requestAnimationFrame(tick);
   const dt=lastFrame?Math.min(.055,(time-lastFrame)/1000):.016;
   lastFrame=time;
   if(document.hidden)return;
   animateWorld(dt,time);
   waWater?.update(animated.clock,animated.lite);
   renderer.render(scene,camera);
   updateMarkers();
   frameCount++;
   if(frameCount===2){animated.sceneReady=true;$("world-loading").classList.add("done")}
  }
  requestAnimationFrame(tick);
 }catch(error){
  console.error("The Japan Line could not initialize:",error);
  $("world-loading").classList.add("done");
  $("no-webgl").hidden=false;
 }
}
startWorld();
