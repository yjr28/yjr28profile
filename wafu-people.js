import * as T from "./assets/three.module.js";
// Shared meshes keep the tiny articulated figures inexpensive to draw.
// These are symbolic diorama vignettes, not interactive application simulations.
const M=(color)=>new T.MeshStandardMaterial({color,roughness:.78});
const skin=M(0xeac5a3),ink=M(0x263845),wood=M(0x855532),gold=M(0xe5b455),paper=M(0xffefd0),teal=M(0x4f9c92),red=M(0xc85b48);
const boxGeo=new T.BoxGeometry(1,1,1),round=new T.SphereGeometry(1,12,10),limbGeo=new T.CylinderGeometry(1,1,1,9);
const clothes=[M(0x315c7e),M(0xa34946),M(0x6e7450),M(0x71618d)];
function mesh(parent,geo,mat,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const box=(p,m,x,y,z,w,h,d)=>mesh(p,boxGeo,m,x,y,z,w,h,d);
function joint(p,x,y,z){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
function figure(p,x,y,z,angle,coat=0){
 const g=joint(p,x,y,z);g.rotation.y=angle;
 const body=joint(g,0,.58,0);mesh(body,limbGeo,clothes[coat],0,.20,0,.15,.42,.12);
 box(body,gold,0,.04,0,.29,.065,.245);
 mesh(body,round,skin,0,.53,0,.135,.15,.13);
 mesh(body,round,ink,0,.595,-.017,.141,.10,.132);
 for(const side of [-1,1])mesh(body,round,ink,side*.047,.545,.117,.013,.013,.012);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const a=joint(body,side*.18,.35,0),elbow=joint(a,0,-.16,0);
  mesh(a,limbGeo,clothes[coat],0,-.08,0,.05,.16,.05);mesh(elbow,limbGeo,skin,0,-.08,0,.037,.16,.037);mesh(elbow,round,skin,0,-.165,0,.045,.045,.045);arms.push({a,elbow});
  const l=joint(g,side*.08,.55,0);mesh(l,limbGeo,ink,0,-.20,0,.052,.40,.052);box(l,ink,0,-.45,.045,.12,.09,.21);legs.push(l);
 }
 return {g,body,arms,legs};
}
function pose(f,t,mode){
 const wave=Math.sin(t*3),slow=Math.sin(t*1.7);f.body.rotation.x=.04*slow;
 f.arms.forEach(({a,elbow},i)=>{a.rotation.z=(i?1:-1)*.13;a.rotation.x=-.48+.10*Math.sin(t*2+i);elbow.rotation.x=-.48});
 if(mode==="type"){f.arms[0].a.rotation.x=-.92+.14*wave;f.arms[1].a.rotation.x=-.92-.14*wave;f.arms.forEach(v=>v.elbow.rotation.x=-.45)}
 if(mode==="point"){f.arms[1].a.rotation.x=-1.4+.23*slow;f.arms[1].elbow.rotation.x=-.24}
 if(mode==="read"){f.arms.forEach(v=>{v.a.rotation.x=-.8;v.elbow.rotation.x=-.82});f.body.rotation.x=.13+.04*slow}
 if(mode==="key"){f.arms[1].a.rotation.x=-1.1+.55*slow;f.arms[1].elbow.rotation.x=-.65}
 if(mode==="signal"){f.arms[1].a.rotation.z=1.5+.35*slow;f.arms[1].a.rotation.x=-.15;f.arms[1].elbow.rotation.x=-.2}
}
function stand(g,x,z,width=1.2){box(g,wood,x,.47,z,width,.075,.43);for(const dx of [-.4,.4])box(g,wood,x+dx,.22,z,.07,.44,.09)}
function display(g,x,z,kind){stand(g,x,z,1.1);box(g,ink,x,.75,z,.91,.53,.08);const content=joint(g,x,.75,z+.049);
 if(kind==="trace"){for(let i=0;i<4;i++)box(content,i===2?red:teal,-.29+i*.12,.16-i*.105,0,.28+i*.025,.035,.016)}
 else if(kind==="plans"){for(let i=0;i<3;i++)box(content,i===1?teal:gold,-.2,.15-i*.15,0,[.34,.57,.45][i],.055,.014)}
 else{for(let i=0;i<3;i++){box(content,paper,-.22,.15-i*.15,0,.24,.029,.015);box(content,i===1?gold:teal,.29,.15-i*.15,0,.055,.055,.015)}}
 return content;
}
export function addStationPeople(world,locations,actors){
 function scene(id,x,z,angle){const [cx,,cz]=locations[id],g=joint(world,cx+x,1.57,cz+z);g.name="miniature-"+id;g.rotation.y=angle;return g}
 function register(id,f,mode,phase,extra=()=>{}){actors.push({id,figure:f.g,update(t){pose(f,t+phase,mode);extra(t+phase)}})}
 // NorthStar: operator monitoring and typing at a miniature server console.
 let g=scene("northstar",-4,8,Math.PI),f=figure(g,0,0,.48,Math.PI,0),panel=display(g,0,-.18,"fleet");panel.rotation.y=Math.PI;
 const fleetLight=panel.children[1];register("northstar",f,"type",.5,t=>{fleetLight.scale.x=.055*(1+.16*Math.sin(t*2))});
 // AXON: a participant alternating taps on a two-choice cognitive exercise.
 g=scene("axon",3,6,0);f=figure(g,0,0,.55,Math.PI,3);stand(g,0,-.02);const padA=box(g,teal,-.24,.54,-.02,.24,.06,.23),padB=box(g,gold,.24,.54,-.02,.24,.06,.23);
 register("axon",f,"type",1,t=>{padA.position.y=.54-.025*Math.max(0,Math.sin(t*3));padB.position.y=.54-.025*Math.max(0,-Math.sin(t*3))});
 // Aster: inspect candidate plan costs and point to the chosen plan.
 g=scene("aster",-9,5,0);f=figure(g,-.65,0,.38,Math.PI,2);panel=display(g,.17,-.16,"plans");register("aster",f,"point",2);
 // Kestrel: trace investigator identifies the highlighted fault span.
 g=scene("kestrel",2,6,0);f=figure(g,-.62,0,.45,Math.PI,0);display(g,.13,-.13,"trace");register("kestrel",f,"point",3);
 // Study Hub: two students facing each other, sharing an open book.
 g=scene("studyhub",0,7,0);stand(g,0,0,1.15);const book=joint(g,0,.535,0);box(book,paper,-.16,.03,0,.31,.04,.29);box(book,paper,.16,.03,0,.31,.04,.29);box(book,ink,0,.055,0,.025,.012,.29);
 f=figure(g,-.62,0,.08,Math.PI/2,1);register("studyhub",f,"read",1.2);f=figure(g,.62,0,.08,-Math.PI/2,2);register("studyhub-peer",f,"read",2.4);
 // Kagi: present a tiny hardware key to a verifier on the actual pier.
 const harbor=joint(world,65,0,27);harbor.rotation.y=-.12;harbor.scale.setScalar(1.55);harbor.name="miniature-kagi";
 g=joint(harbor,4.1,.55,2.4);g.scale.setScalar(.85);f=figure(g,-.4,0,.2,Math.PI/2,0);const key=joint(f.arms[1].elbow,0,-.20,0);box(key,gold,0,0,0,.10,.18,.04);box(key,ink,0,-.08,.02,.06,.03,.04);box(g,ink,.5,.48,.2,.22,.95,.23);const lamp=box(g,teal,.5,.96,.2,.16,.07,.16);register("kagi",f,"key",2,t=>{lamp.scale.y=.07*(1+.3*Math.sin(t*1.7))});
}
export function addConductor(platform,actors){
 const f=figure(platform,.68,.18,1.7,-Math.PI/2,1);f.g.name="miniature-lastride";const flag=joint(f.arms[1].elbow,0,-.19,0);box(flag,wood,0,-.10,0,.025,.27,.025);box(flag,red,.12,-.20,0,.24,.16,.025);
 actors.push({id:"lastride",figure:f.g,update(t){pose(f,t,"signal")}});
}
