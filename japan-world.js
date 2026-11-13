import * as THREE from "./assets/three.module.js";

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
  northstar:{number:"1",name:"NorthStar",place:"東京・秋葉原 / Tokyo after dark",tagline:"Control the fleet. Understand the failure.",description:"A hybrid-cloud server management system with native Linux telemetry, a C++ agent, and a Java/Spring control plane. Try the interactive command lifecycle: make a host go offline, queue work, and bring the agent back.",meta:["C++ agent","Spring / Java","PostgreSQL","Telemetry"],url:"projects/northstar/",source:"https://github.com/yjr28/NorthStar",pos:[-35,2,-3],camera:[-27,22,28]},
  axon:{number:"2",name:"AXON",place:"鉄道工房 / The developer workshop",tagline:"The development loop is infrastructure.",description:"A Go/Python tool platform built around MCP and REST. Trace a request through its entry point, tool gateway, execution boundary, and CI feedback loop.",meta:["Go / Python","MCP + REST","CI pipelines","Tooling"],url:"projects/axon/",source:null,pos:[-19,2,18],camera:[-13,20,42]},
  aster:{number:"3",name:"Aster",place:"京都・庭園 / Kyoto gardens",tagline:"Choose a plan. Know when to abstain.",description:"A PostgreSQL query-plan ranking prototype that scores candidate plans while enforcing uncertainty and decision-margin thresholds. The demo runs its Python ranker inside your browser.",meta:["PostgreSQL","Python","Query planning","Confidence gates"],url:"projects/aster/",source:"https://github.com/yjr28/aster-pg-optimizer",pos:[0,2,-19],camera:[12,21,16]},
  kestrel:{number:"4",name:"Kestrel",place:"富士山 / The Fuji observatory",tagline:"Find the first divergence, not the loudest symptom.",description:"A Go distributed-systems flight recorder with causal traces and replayable seeded faults. Inject latency and follow the events through a ten-service request using the actual Go core compiled to WebAssembly.",meta:["Go / WebAssembly","Causal traces","Fault injection","Replay"],url:"projects/kestrel/",source:"https://github.com/yjr28/kestrel-replay",pos:[30,2,-18],camera:[34,25,21]},
  studyhub:{number:"5",name:"Waseda Study Hub",place:"早稲田・東京 / Waseda campus",tagline:"Build campus software with a trust boundary.",description:"A student discovery and study-buddy product with verified university sign-in, private conversations, and AI-assisted matching. Explore the authorization and ranking decisions in its case study.",meta:["Next.js","Firebase","Auth / privacy","AI matching"],url:"projects/studyhub/",source:"https://github.com/Waseda-Study-Hub/frontend",pos:[29,2,18],camera:[29,22,49]}
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
let renderer,scene,camera,world,raycaster;
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
function signTexture(text,{background="#e9deca",foreground="#273b40",height=128,width=512,secondary=""}={}){
  const el=document.createElement("canvas");el.width=width;el.height=height;
  const c=el.getContext("2d");c.fillStyle=background;c.fillRect(0,0,width,height);
  c.fillStyle=foreground;c.textAlign="center";c.textBaseline="middle";
  c.font="700 "+Math.round(height*.37)+"px sans-serif";c.fillText(text,width/2,height*.48,width*.92);
  if(secondary){c.font="500 "+Math.round(height*.14)+"px sans-serif";c.fillText(secondary,width/2,height*.81)}
  const t=new THREE.CanvasTexture(el);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function signPlane(parent,text,w,h,x,y,z,background,foreground,secondary=""){
 const mat=new THREE.MeshBasicMaterial({map:signTexture(text,{background,foreground,secondary}),side:THREE.DoubleSide,transparent:false});
 return add(parent,new THREE.PlaneGeometry(w,h),mat,x,y,z,false);
}
function createIsland(key,x,z,rx,rz,grass,soil=material.dirt){
 const holder=new THREE.Group();holder.position.set(x,0,z);holder.name=key+" island";holder.userData.station=key;world.add(holder);
 const shape=new THREE.Shape();
 const total=36;
 for(let i=0;i<total;i++){
  const a=(i/total)*Math.PI*2;
  const irregular=1+.045*Math.sin(a*7+rx)+.04*Math.cos(a*11+rz)+range(-.035,.035);
  const px=Math.cos(a)*rx*irregular,pz=Math.sin(a)*rz*irregular;
  if(i===0)shape.moveTo(px,pz);else shape.lineTo(px,pz);
 }
 shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{steps:1,depth:2,bevelEnabled:true,bevelThickness:.25,bevelSize:.25,bevelSegments:1,curveSegments:2});
 geo.rotateX(-Math.PI/2);
 const mesh=add(holder,geo,[grass,soil],0,-.53,0);mesh.receiveShadow=true;
 for(let i=0;i<23;i++){
  const a=range(0,Math.PI*2),radius=range(.86,1.04),px=Math.cos(a)*rx*radius,pz=Math.sin(a)*rz*radius;
  const rock=sphere(holder,range(.3,.75),pick([material.stone,material.stoneDark,soil]),px,1.45,pz,0);
  rock.scale.set(range(.8,1.3),range(.4,.85),range(.6,1.4));
 }
 return holder;
}
function createStonePath(parent,positions,width=.9,mat=material.stone){
 for(let i=0;i<positions.length-1;i++){
  const [x1,z1]=positions[i],[x2,z2]=positions[i+1];
  const dx=x2-x1,dz=z2-z1,dist=Math.hypot(dx,dz),count=Math.max(1,Math.ceil(dist/.9));
  for(let n=0;n<count;n++){
   const t=(n+.5)/count,p=box(parent,width,.10,dist/count*.88,mat,x1+dx*t,1.52,z1+dz*t);
   p.rotation.y=Math.atan2(dx,dz);
  }
 }
}
function createGrass(parent,rx,rz,count=50){
 for(let i=0;i<count;i++){
  const a=range(0,6.283),r=Math.sqrt(random())*.9;
  const x=Math.cos(a)*rx*r,z=Math.sin(a)*rz*r;
  const tuft=add(parent,new THREE.ConeGeometry(range(.16,.29),range(.4,.85),3),pick([material.bamboo,material.templeGrass,material.fujiGrass]),x,1.75,z,false);
  tuft.rotation.z=range(-.2,.2);
 }
}
function cherryTree(parent,x,z,s=1,palette=null){
 const g=new THREE.Group();g.position.set(x,1.55,z);g.scale.setScalar(s);parent.add(g);
 cyl(g,.19,.30,2.7,material.bark,0,1.32,0,7);
 const branches=[[.75,3.1,.1],[-.85,2.8,.2],[.2,3.6,-.6]];
 for(const [bx,by,bz] of branches){
  const start=V(0,2.2,0),end=V(bx,by,bz),d=end.clone().sub(start);
  const b=cyl(g,.075,.12,d.length(),material.bark,...start.clone().add(end).multiplyScalar(.5).toArray(),6);
  b.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());
 }
 const flowers=palette||[material.sakura1,material.sakura2,material.sakura3];
 for(let i=0;i<9;i++){
  const a=range(0,6.283),r=range(.4,1.7);
  const leaf=sphere(g,range(.75,1.25),pick(flowers),Math.cos(a)*r,range(2.9,4.2),Math.sin(a)*r,1);
  leaf.scale.set(range(.85,1.3),range(.55,.95),range(.85,1.35));
 }
 swayers.push({g,phase:range(0,6.28),scale:range(.006,.026)});
 return g;
}
function lantern(parent,x,z,s=1){
 const g=new THREE.Group();g.position.set(x,1.55,z);g.scale.setScalar(s);parent.add(g);
 cyl(g,.10,.16,2.4,material.roof,0,1.2,0,6);
 box(g,.91,.88,.91,material.lantern,0,2.48,0);
 box(g,1.1,.15,1.1,material.roof,0,3.01,0);
 box(g,1.08,.16,1.08,material.roof,0,2.0,0);
 return g;
}
function torii(parent,x,z,s=1){
 const g=new THREE.Group();g.position.set(x,1.57,z);g.scale.setScalar(s);parent.add(g);
 for(const dx of [-1.5,1.5])cyl(g,.22,.27,4.2,material.vermillion,dx,2.1,0,8);
 box(g,4.5,.44,.69,material.vermillion,-0,4.18,0);
 box(g,3.6,.28,.42,material.red,0,3.38,0);
 box(g,4.85,.14,.84,material.roof,0,4.47,0);
 return g;
}
function pagoda(parent,x,z,s=1){
 const g=new THREE.Group();g.position.set(x,1.55,z);g.scale.setScalar(s);parent.add(g);
 cyl(g,3.7,3.9,.38,material.stone,0,.18,0,8);
 for(let i=0;i<4;i++){
  const y=.5+i*2.05,f=1-i*.13;
  box(g,4.3*f,1.7,4*f,material.cream,0,y+.85,0);
  for(const dx of [-1,1])for(const dz of [-1,1])cyl(g,.12,.12,1.65,material.vermillion,dx*1.55*f,y+.86,dz*1.47*f,6);
  const roof=add(g,new THREE.ConeGeometry(3.85*f,1.1,4),material.roofGreen,0,y+1.99,0);
  roof.rotation.y=Math.PI/4;roof.scale.z=.95;
  box(g,4.4*f,.13,4.2*f,material.roof,0,y+1.61,0);
 }
 cyl(g,.08,.12,2.1,material.gold,0,9.37,0,6);
 sphere(g,.22,material.gold,0,10.35,0,0);
 return g;
}
function bench(parent,x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,1.55,z);g.rotation.y=rot;parent.add(g);
 box(g,2.4,.23,.8,material.bark,0,.73,0);
 box(g,2.4,.23,.3,material.bark,0,1.35,-.31);
 for(const dx of [-.94,.94])box(g,.15,.73,.55,material.stoneDark,dx,.36,0);
 return g;
}

function drawWindows(parent,x,z,w,d,h,rows,cols,color=material.warmWindow){
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const lit=(r+c)%5!==0;
  const y=2.35+r*((h-1.25)/Math.max(1,rows));
  const px=x-w/2+(c+.5)*(w/cols);
  const front=box(parent,w/cols*.46,h/rows*.43,.085,lit?color:material.nightFacade,px,y,z+d/2+.04,false);
  front.castShadow=false;
  if(c%2===0){
   const back=box(parent,w/cols*.46,h/rows*.43,.085,lit?color:material.nightFacade,px,y,z-d/2-.04,false);
   back.castShadow=false;
  }
 }
}
function nightCity(){
 const x=-35,z=-3, g=createIsland("northstar",x,z,17,13,material.nightGrass,material.stoneDark);
 // An illuminated intersection between real blocky towers.
 box(g,25,.09,3.0,material.stoneDark,0,1.62,0,false);
 box(g,3.5,.1,21,material.stoneDark,2,1.62,0,false);
 const buildings=[
  [-11,-5,3.3,4,7.5],[-7,-7,3.5,4.3,12],[-1,-8,5,4.5,15], [7,-7,3.8,4,9],
  [11,-3,3.4,3.8,11],[-11,5,4.2,4.5,8],[-6,7,4.2,4,10.5],[9,6,4.2,4.8,13]
 ];
 for(let i=0;i<buildings.length;i++){
  const [bx,bz,w,d,h]=buildings[i];
  box(g,w,h,d,pick([material.slate,material.deepBlue,material.nightFacade]),bx,1.55+h/2,bz);
  box(g,w+.35,.25,d+.35,material.roof,bx,1.55+h+.14,bz);
  drawWindows(g,bx,bz,w,d,h,Math.max(3,Math.floor(h/1.6)),Math.max(2,Math.floor(w/1.08)),i%2?material.neonBlue:material.warmWindow);
 }
 const facade=box(g,7,8.6,4.4,material.deepBlue,-3,5.85,4);
 drawWindows(g,-3,4,7,4.4,8.6,4,4,material.neonBlue);
 signPlane(g,"NORTHSTAR",6.5,1.18,-3,10,6.28,"#152b4c","#bfeef6","fleet control / telemetry");
 signPlane(g,"秋葉原",3.1,1.35,10,5.3,9.0,"#bb315e","#ffe9eb","AKIHABARA");
 // Antenna and rotating radar ring, showing this is the live fleet district.
 const radar=new THREE.Group();radar.position.set(-3,10.25,4);g.add(radar);
 cyl(radar,.13,.18,1.8,material.rail,0,.9,0,6);
 const dish=add(radar,new THREE.CylinderGeometry(1.25,.3,.39,16),material.rail,0,2,0);
 dish.rotation.z=.32;
 const light=sphere(radar,.23,material.neonPink,0,3.13,0,0);
 pulses.push({object:radar,kind:"rotate",speed:.21});
 for(let i=0;i<5;i++)lantern(g,range(-13,13),pick([-2,2,11]),.6);
 for(const [tx,tz,s] of [[-13,9,.65],[13,9,.72],[12,-10,.7],[-14,-11,.75]])cherryTree(g,tx,tz,s);
 // Elevated city signage.
 torii(g,12,0,.63);
 createGrass(g,16,13,36);
 mark(g,"station","northstar");
 return g;
}
function workshop(){
 const x=-19,z=18,g=createIsland("axon",x,z,15,12,material.workGrass);
 box(g,22,.13,3,material.stone,0,1.64,-3,false);
 const hall=new THREE.Group();hall.position.set(0,1.55,1);g.add(hall);
 box(hall,11,5.2,7.6,material.cream,0,2.6,-1);
 box(hall,11.8,.35,8.5,material.roofGreen,0,5.3,-1);
 // Sloped roof with an intentional industrial silhouette.
 const pitch1=box(hall,6,.38,8.7,material.roof,2.65,6.1,-1);pitch1.rotation.z=.39;
 const pitch2=box(hall,6,.38,8.7,material.roof,-2.65,6.1,-1);pitch2.rotation.z=-.39;
 box(hall,6.3,4.1,.17,material.deepBlue,0,2.55,2.85);
 for(let i=0;i<4;i++){box(hall,.16,4.15,.19,material.stone,(-2.4+i*1.6),2.56,2.97)}
 signPlane(hall,"AXON",5.2,1.24,0,5.1,3.04,"#1d4b42","#f4dfb2","software tooling / MCP");
 // Freight crates and spools play the role of tangible tool nodes.
 for(let i=0;i<7;i++){
  const bx=range(-12,12),bz=range(-10,10),size=range(.7,1.6);
  if(Math.abs(bx)<6&&Math.abs(bz)<5)continue;
  box(g,size,size,size,pick([material.red,material.cream,material.stoneDark,material.roofGreen]),bx,1.55+size/2,bz);
 }
 for(const dx of [-8.2,8.2]){
  const scaffold=box(g,.34,6.6,.4,material.vermillion,dx,4.9,4.5);
  box(g,3.3,.35,.7,material.roof,dx,8.1,4.5);
  lantern(g,dx,8.8,.55);
 }
 const gear=new THREE.Group();gear.position.set(-10,3.6,-1.5);g.add(gear);
 add(gear,new THREE.TorusGeometry(1.45,.34,8,12),material.gold);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,teeth=box(gear,.55,.76,.6,material.gold,Math.sin(a)*1.62,Math.cos(a)*1.62,0);teeth.rotation.z=-a}
 pulses.push({object:gear,kind:"rotateZ",speed:.28});
 for(const [tx,tz,s] of [[-11,8,.8],[11,8,.78],[-11,-7,.9],[12,-6,.67]])cherryTree(g,tx,tz,s);
 createStonePath(g,[[-9,-9],[-7,-3],[0,-2],[9,-2]],1.3);
 bench(g,-3,9,.1);bench(g,4,9,-.2);
 createGrass(g,15,12,50);
 mark(g,"station","axon");return g;
}
function zenGarden(){
 const x=0,z=-19,g=createIsland("aster",x,z,17,14,material.templeGrass);
 const garden=box(g,17,.12,10,material.cream,1,1.6,3);
 // Raked gravel arcs: readable from the aerial camera.
 for(let r=2.3;r<7.5;r+=1.2){
  const pts=[];
  for(let i=0;i<=32;i++){
   const a=Math.PI*.14+i/32*Math.PI*.72;
   pts.push(V(1+Math.cos(a)*r,1.72,3+Math.sin(a)*r*.46));
  }
  const line=add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.045,4,false),material.stone,false,false,false,false);
  line.castShadow=false;
 }
 pagoda(g,-8,-5,1);
 torii(g,10,-7,.82);
 const pond=add(g,new THREE.CircleGeometry(4.5,28),new THREE.MeshStandardMaterial({color:0x6c9b9d,roughness:.21,metalness:.3,transparent:true,opacity:.94}),8,1.63,5,false);
 pond.rotation.x=-Math.PI/2;pond.scale.set(1.3,.8,1);
 for(let i=0;i<6;i++){
  const pebble=sphere(g,range(.35,.7),material.stone,range(-6,10),1.63,range(0,10),0);
  pebble.scale.y=.24;
 }
 for(let i=0;i<8;i++){
  const a=i/8*Math.PI*2;
  const rock=sphere(g,range(.55,.85),pick([material.stone,material.stoneDark]),Math.cos(a)*6,1.7,Math.sin(a)*5,0);
  rock.scale.y=.34;
 }
 for(const [cx,cz,s] of [[-14,0,.88],[-13,9,1],[13,9,.84],[14,-4,.88],[-3,11,.96],[6,-11,.78],[11,-10,.73]])cherryTree(g,cx,cz,s);
 for(let i=0;i<4;i++)lantern(g,-4+i*2.6,11,.65);
 signPlane(g,"ASTER",4.5,1.1,2,4.1,-7.5,"#f2ecdb","#305448","the query garden");
 createGrass(g,16,14,28);
 mark(g,"station","aster");return g;
}
function mountainGroup(){
 const g=new THREE.Group();g.position.set(39,-1.6,-55);world.add(g);
 // Fuji is behind the islands, layered in the perspective rather than pasted onto the sky.
 const foot=add(g,new THREE.ConeGeometry(21,14,40),matte(0x6489a1),0,6.5,0);
 foot.scale.z=.85;
 const mountain=add(g,new THREE.ConeGeometry(15.5,19,36),matte(0x617c95),0,12.6,1.2);
 const snow=add(g,new THREE.ConeGeometry(6.05,7.2,36),material.snow,0,18.6,1.2);
 snow.rotation.y=.11;
 for(let i=0;i<11;i++){
  const a=i/11*6.283;
  const peak=add(g,new THREE.ConeGeometry(range(1.9,3.5),range(5,9),5),matte(pick([0x70949e,0x6c879b,0x829cb1])),Math.cos(a)*17,2,Math.sin(a)*12);
  peak.rotation.y=range(0,6.28);
 }
 return g;
}
function observatory(){
 const x=30,z=-18,g=createIsland("kestrel",x,z,18,14,material.fujiGrass);
 createStonePath(g,[[-12,5],[-7,3],[-3,0],[3,-2],[10,-7]],1.15,material.stone);
 const hub=box(g,9,4,7.5,material.cream,1,3.55,-3);
 const roof=box(g,10,.5,8.6,material.roofGreen,1,5.8,-3);
 signPlane(g,"KESTREL",6,1.05,1,4.4,1.01,"#243d4c","#e6edf0","traces / replay");
 // An actual radial observing dish, aimed toward Fuji.
 const tower=cyl(g,.43,.68,9,material.stoneDark,-8,6.05,-6,8);
 const dish=new THREE.Group();dish.position.set(-8,11.1,-6);g.add(dish);
 const dishBody=add(dish,new THREE.CylinderGeometry(3,.4,1.1,18),material.rail,0,.2,0);
 dishBody.rotation.z=-.38;
 cyl(dish,.10,.10,3,material.roof,0,2,0,8);
 sphere(dish,.28,material.neonBlue,0,3.55,0,0);
 pulses.push({object:dish,kind:"sweep",speed:.13});
 // Signal traces: the legend is physical light hopping between nodes.
 const nodes=[[5,5],[-3,7],[12,3],[7,-10]];
 for(let i=0;i<nodes.length;i++){
  const [nx,nz]=nodes[i],beacon=cyl(g,.14,.2,3.4,material.stoneDark,nx,3.3,nz);
  const dot=sphere(g,.35,material.neonBlue,nx,5.35,nz,1);
  pulses.push({object:dot,kind:"glimmer",phase:i*1.1});
 }
 torii(g,12,-7,.66);
 pagoda(g,-10,8,.62);
 for(const [tx,tz,s] of [[-14,0,.85],[-12,11,.84],[11,10,.88],[14,4,.75],[-5,-10,.72]])cherryTree(g,tx,tz,s);
 for(let i=0;i<8;i++){
  const px=range(-14,14),pz=range(-10,10);
  const pine=new THREE.Group();pine.position.set(px,1.55,pz);g.add(pine);
  cyl(pine,.13,.18,2.7,material.bark,0,1.25,0,6);
  for(let n=0;n<3;n++)add(pine,new THREE.ConeGeometry(1.35-n*.22,1.9,6),material.roofGreen,0,2.4+n*.72,0);
 }
 createGrass(g,18,14,35);
 mark(g,"station","kestrel");return g;
}
function campus(){
 const x=29,z=18,g=createIsland("studyhub",x,z,17,13,material.campusGrass);
 const main=new THREE.Group();main.position.set(0,1.55,-2);g.add(main);
 const front=box(main,15,5.8,6.2,matte(0xa65c55),0,3.05,0);
 for(const xx of [-5.2,-2.5,0,2.5,5.2]){
  box(main,1.45,2.1,.12,material.deepBlue,xx,3.8,3.19);
  box(main,1.65,.12,.19,material.cream,xx,2.7,3.31);
  box(main,.1,2.1,.2,material.cream,xx,3.8,3.34);
 }
 box(main,16,.45,7.4,material.roofGreen,0,6.15,0);
 for(let i=0;i<5;i++)box(main,.22,6,.6,material.cream,-6.2+i*3.1,3.12,3.4);
 const clockTower=box(main,3.3,9.1,3.3,material.cream,0,9.5,-2.1);
 const clock=add(main,new THREE.CircleGeometry(.93,32),material.cream,0,10.7,-.40,false);
 const bezel=add(main,new THREE.TorusGeometry(.94,.065,8,32),material.gold,0,10.7,-.35,false);
 const handH=box(main,.09,.55,.09,material.deepBlue,0,10.90,-.29,false);handH.rotation.z=-.37;
 const handM=box(main,.07,.72,.09,material.deepBlue,.18,10.68,-.28,false);handM.rotation.z=.90;
 sphere(main,.11,material.gold,0,10.7,-.25,0);
 signPlane(main,"早稲田",5.8,1.1,0,5,3.55,"#8b4146","#f8e8d3","WASEDA / STUDY HUB");
 box(main,4.3,.28,4.4,material.roofGreen,0,14.15,-2.1);
 add(main,new THREE.ConeGeometry(2.7,2,4),material.roofGreen,0,15.1,-2.1).rotation.y=Math.PI/4;
 // A landscaped central path and study benches.
 createStonePath(g,[[0,10],[0,7],[0,3],[0,1]],2);
 const quad=add(g,new THREE.CircleGeometry(5,24),material.stone,0,1.57,8,false);quad.rotation.x=-Math.PI/2;
 for(const [px,pz,s] of [[-13,7,.98],[13,8,1],[-11,-7,.92],[12,-7,.94],[-7,11,.8],[7,11,.8]])cherryTree(g,px,pz,s);
 for(let i=0;i<4;i++)bench(g,-5+i*3.3,9.6,i%2?Math.PI:0);
 for(let i=0;i<4;i++)lantern(g,-8+i*5,6,.55);
 createGrass(g,17,13,37);
 mark(g,"station","studyhub");return g;
}

let railwayCurve,railLength,railCollision;
function buildRailway(){
 // This is the shared LastRide express line. Even the distant bridges are clickable.
 const nodes=[
  [-47,-7],[-42,-10],[-32,-8],[-25,4],[-21,15],[-12,22],
  [0,22],[16,19],[28,16],[39,7],[38,-8],[31,-17],
  [22,-23],[8,-25],[-5,-24],[-18,-19],[-31,-14],[-44,-8]
 ];
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
 for(let i=0;i<53;i++){
  const t=i/53,p=railwayCurve.getPointAt(t),tan=railwayCurve.getTangentAt(t);
  if(i%2===0){
   const pillar=cyl(world,.26,.42,4.5,material.stoneDark,p.x,.85,p.z,8);
   box(world,2.2,.4,1.5,material.stone,p.x,3.05,p.z).rotation.y=Math.atan2(tan.x,tan.z);
  }
 }
 // Deliberately contrasting cream shinkansen that remain animated even when the camera rests.
 function addTrain(start,accent){
  const cars=[];
  for(let k=0;k<3;k++){
   const g=new THREE.Group();world.add(g);g.userData.route=LASTRIDE;interactables.push(g);
   const body=box(g,1.98,1.78,4.5,material.cream,0,1.02,0);
   box(g,2.05,.21,4.58,accent,0,1.89,0);
   for(const side of [-1,1]){
    box(g,.09,.45,3.6,material.deepBlue,side*1.01,1.2,0,false);
    for(let j=0;j<4;j++){
     const window=box(g,.13,.33,.61,material.neonBlue,side*1.04,1.2,-1.32+j*.88,false);
     window.castShadow=false;
    }
   }
   box(g,2.08,.14,4.55,accent,0,.39,0,false);
   if(k===0){
    const nose=add(g,new THREE.ConeGeometry(.97,2.1,8),material.cream,0,1.0,2.8);nose.rotation.x=Math.PI/2;
    box(g,1.18,.32,.18,material.lantern,0,1.12,3.5,false);
   }
   cars.push(g);
  }
  const train={cars,start,speed:accent===material.vermillion?.011:-.0095};
  trains.push(train);
  positionTrain(train);
 }
 addTrain(.29,material.vermillion);
 addTrain(.74,material.roofGreen);
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
function buildSkyObjects(){
 // The sky itself is a CSS gradient. The objects here cast real shadows and move through it.
 // Continuous daylight: no night sky stars.
 for(let i=0;i<7;i++){
  const g=new THREE.Group();
  const xx=range(-92,100),yy=range(24,46),zz=range(-95,-40);
  g.position.set(xx,yy,zz);scene.add(g);
  const cloudMat=new THREE.MeshBasicMaterial({color:pick([0xffffff,0xf7fbff,0xe9f7fc]),transparent:true,opacity:range(.44,.67),depthWrite:false});
  for(let j=0;j<5;j++){
   const puff=sphere(g,range(2.8,6.1),cloudMat,j*3.6-7,range(-1.0,1.1),range(-1.4,1.4),1);
   puff.scale.y=.42;
   puff.castShadow=false;puff.receiveShadow=false;
  }
  clouds.push({g,speed:range(.07,.20),direction:i%2?-1:1});
 }
 const gulls=new THREE.Group();gulls.position.set(45,19,-36);world.add(gulls);
 for(let j=0;j<6;j++){
  const bird=new THREE.Group();bird.position.set((j-2)*3,range(-1,4),range(-3,3));gulls.add(bird);
  for(const side of [-1,1]){
   const wing=box(bird,1.1,.06,.09,material.deepBlue,side*.54,0,0,false);
   wing.rotation.z=side*.22;
  }
 }
 pulses.push({object:gulls,kind:"birds",phase:0});
}
function buildPetals(){
 const count=window.innerWidth<650?185:350;
 // A range of vivid sakura pinks stays legible against the clear daytime sky.
 // Keep petal sizes and movement natural instead of adding more visual clutter.
 const geo=new THREE.PlaneGeometry(.49,.29);
 const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false});
 const mesh=new THREE.InstancedMesh(geo,mat,count);mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);
 const colors=[new THREE.Color(0xdc4d87),new THREE.Color(0xe86b98),new THREE.Color(0xf184aa),new THREE.Color(0xf39abc),new THREE.Color(0xe15b91)];
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
function buildWater(){
 const geo=new THREE.PlaneGeometry(360,270,1,1);
 // A soft sea edge avoids a rectangular horizon when orbiting or riding the train.
 const fade=document.createElement("canvas");fade.width=fade.height=64;
 const ctx=fade.getContext("2d"),gradient=ctx.createRadialGradient(32,32,10,32,32,32);
 gradient.addColorStop(0,"white");gradient.addColorStop(1,"black");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const mat=new THREE.MeshBasicMaterial({color:0x65a9bf,transparent:true,opacity:.13,alphaMap:new THREE.CanvasTexture(fade),depthWrite:false});
 const plane=add(world,geo,mat,0,-2.85,0,false);plane.rotation.x=-Math.PI/2;
 for(const p of [[-35,-3,16,13],[-19,18,15,12],[0,-19,17,14],[30,-18,18,14],[29,18,17,13]]){
  for(let k=0;k<2;k++){
   const shape=add(world,new THREE.RingGeometry(p[2]+1.8+k*1.05,p[2]+1.89+k*1.05,48),new THREE.MeshBasicMaterial({color:0xaad8d8,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}),p[0],-2.57,p[1],false);
   shape.rotation.x=-Math.PI/2;shape.scale.y=p[3]/p[2];
   waterRipples.push({o:shape,phase:k*2});
  }
 }
}
function buildWorld(){
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(43,1,.15,550);
 world=new THREE.Group();scene.add(world);
 scene.add(new THREE.HemisphereLight(0xf8fdff,0x80aa9a,1.85));
 scene.add(new THREE.AmbientLight(0xc4e8f4,.68));
 const sun=new THREE.DirectionalLight(0xfff3dd,2.65);sun.position.set(65,93,45);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);
 sun.shadow.camera.left=-115;sun.shadow.camera.right=115;sun.shadow.camera.top=115;sun.shadow.camera.bottom=-115;
 sun.shadow.camera.near=2;sun.shadow.camera.far=240;sun.shadow.normalBias=.03;sun.shadow.bias=-.00015;
 scene.add(sun);
 const cityLight=new THREE.PointLight(0x83bde9,12,78,1.7);cityLight.position.set(-35,25,-8);scene.add(cityLight);
 const warm=new THREE.PointLight(0xffe1b6,12,55,1.7);warm.position.set(15,23,20);scene.add(warm);
 buildWater();
 mountainGroup();
 // The districts share visual rules but are not repeats of the same building.
 nightCity();workshop();zenGarden();observatory();campus();
 buildRailway();buildSkyObjects();buildPetals();
 scene.fog=new THREE.FogExp2(0xb6dfe9,.0013);
}

let toastTimeout=null,frameCount=0,lastFrame=0,lastHover=0;
const markerButtons=Array.from(document.querySelectorAll(".world-marker"));
const stationButtons=Array.from(document.querySelectorAll("[data-station]"));
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
 if(hadFocus&&animated.focused)document.querySelector(`.station[data-station="${animated.focused}"]`).focus({preventScroll:true});
 animated.focused=null;
 if(camera)resize();
 stationButtons.forEach(b=>b.classList.remove("active"));
 markerButtons.forEach(b=>b.setAttribute("aria-pressed","false"));
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
 $("info-stop").textContent="Station "+d.number;
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
 markerButtons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.station===id)));
 $("info-close").focus({preventScroll:true});
 // Details and links are available before the camera settles.
}
function toggleMap(){
 if(animated.overview){animated.overview=false;$("overview-toggle").setAttribute("aria-pressed","false");$("overview-label").textContent="Map view";look.targetPitch=.83;look.targetDistance=window.innerWidth<760?110:102;return}
 resetOverview();
}
function bindUI(){
 $("ride-toggle").addEventListener("click",()=>{
  if(animated.ride){resetOverview();return}
  closeInfo();closeAbout();animated.ride=true;app.classList.add("station-selected");resize();
  $("ride-toggle").setAttribute("aria-pressed","true");$("ride-toggle").textContent="Exit the ride";
  $("control-hint").classList.add("hidden");toast("A moving postcard from the LastRide express.");
 });
 stationButtons.forEach(b=>b.addEventListener("click",()=>focusStation(b.dataset.station)));
 $("info-close").addEventListener("click",closeInfo);
 $("begin-exploring").addEventListener("click",()=>focusStation("northstar"));
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
 // Compose the world beside the introduction on desktop and below it on mobile.
 // Render the sky and petals edge to edge; an optical shift avoids a clipped canvas.
 const stage={left:mobile?0:window.innerWidth<=1100?245:270,top:mobile?278:100,
  width:mobile?viewport.width:viewport.width-(window.innerWidth<=1100?255:285),
  height:viewport.height-(mobile?466:280)};
 if(animated.focused&&!mobile){
  stage.left=30;stage.top=100;stage.width=viewport.width-430;
 }else if(animated.ride){
  stage.left=0;stage.top=mobile?94:80;stage.width=viewport.width;stage.height=viewport.height-(mobile?290:260);
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
const overlaySelectors=[".global-nav",".world-intro",".station-line",".tiny-footer",".project-info.visible",".about-panel.open",".world-control-hint:not(.hidden)",".world-toast.visible"];
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
  placeLabel(trainLabels[i],projectAnchor(roof),occupied,[17,39,61]);
 });
 for(const marker of markerButtons){
  const d=stationData[marker.dataset.station];
  placeLabel(marker,projectAnchor(V(d.pos[0],9.8,d.pos[2])),occupied,[16,38,60,82],true);
 }
}

function startWorld(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance",preserveDrawingBuffer:false});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  raycaster=new THREE.Raycaster();
  buildWorld();
  resize();bindUI();
  resetOverview({animate:false});
  animated.overview=false;
  // About 12% closer on the initial landing; all other camera presets remain unchanged.
  look.targetPitch=.80;look.pitch=.80;look.targetDistance=window.innerWidth<760?98:90;look.distance=look.targetDistance;look.targetYaw=.14;look.yaw=.14;
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
