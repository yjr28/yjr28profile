import * as T from "./assets/three.module.js";
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function rng(n){return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
const r=rng(241113),range=(a,b)=>a+(b-a)*r(),pick=a=>a[Math.floor(r()*a.length)];
function texture(w,h,fn){const c=document.createElement("canvas");c.width=w;c.height=h;fn(c.getContext("2d"),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t}
const timber=texture(256,256,(c,w,h)=>{c.fillStyle="#a97848";c.fillRect(0,0,w,h);for(let i=0;i<900;i++){const y=r()*h;c.strokeStyle=r()<.5?"#532c1935":"#ffdfad36";c.lineWidth=.4+r()*1.5;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(70,y+range(-5,5),185,y+range(-5,5),w,y+range(-3,3));c.stroke()}});
const masonry=texture(256,256,(c)=>{c.fillStyle="#615d55";c.fillRect(0,0,256,256);for(let y=0;y<256;y+=32)for(let x=-64;x<256;x+=64){const xx=x+(y%64?32:0),v=Math.floor(range(120,176));c.fillStyle="rgb("+v+","+(v-7)+","+(v-14)+")";c.fillRect(xx+1,y+1,62,30);c.fillStyle="#fff3";c.fillRect(xx+1,y+1,62,2);c.fillStyle="#0002";c.fillRect(xx+1,y+28,62,2)}for(let i=0;i<5200;i++){c.fillStyle=r()<.5?"#fff2":"#241c1726";c.fillRect(r()*256,r()*256,1+r()*2,1+r()*2)}});
const tile=texture(256,256,(c)=>{for(let x=0;x<256;x+=16){const g=c.createLinearGradient(x,0,x+16,0);g.addColorStop(0,"#24313a");g.addColorStop(.29,"#879399");g.addColorStop(.58,"#535f64");g.addColorStop(1,"#242e34");c.fillStyle=g;c.fillRect(x,0,16,256);for(let y=0;y<256;y+=40){c.fillStyle="#202a2f88";c.fillRect(x,y,16,2)}}});
const shoji=texture(128,128,(c)=>{c.fillStyle="#4c2b19";c.fillRect(0,0,128,128);const g=c.createRadialGradient(65,64,4,64,64,80);g.addColorStop(0,"#fff8c6");g.addColorStop(.6,"#ffd176");g.addColorStop(1,"#cc7529");c.fillStyle=g;c.fillRect(6,6,116,116);c.strokeStyle="#60391f";c.lineWidth=5;for(let i=6;i<128;i+=38){c.beginPath();c.moveTo(i,0);c.lineTo(i,128);c.moveTo(0,i);c.lineTo(128,i);c.stroke()}c.strokeStyle="#cf9c58";c.lineWidth=2;c.strokeRect(4,4,120,120)});
const glow=texture(64,64,c=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,"#fff6ccdf");g.addColorStop(.2,"#ffc663aa");g.addColorStop(.55,"#ffb2342b");g.addColorStop(1,"#ffb23400");c.fillStyle=g;c.fillRect(0,0,64,64)});
const grass=texture(256,256,c=>{c.fillStyle="#7e904d";c.fillRect(0,0,256,256);for(let i=0;i<12000;i++){c.fillStyle=pick(["#53693d55","#d5c57b44","#395d3244","#acb76566"]);c.fillRect(r()*256,r()*256,1+r()*3,1+r()*2)}});
const mat=(color,more={})=>new T.MeshStandardMaterial({color,roughness:.9,...more});
const M={wood:mat(0xcda376,{map:timber}),dark:mat(0x65432c,{map:timber}),wall:mat(0xf4dbac),red:mat(0xb34b2b),gold:mat(0xe8b65b,{metalness:.5,roughness:.35}),roof:mat(0x9ca3a3,{map:tile,side:T.DoubleSide}),greenRoof:mat(0x708d80,{map:tile,side:T.DoubleSide}),stone:mat(0xc8c0b4,{map:masonry}),rock:mat(0xffffff),grass:mat(0xffffff,{map:grass,side:T.DoubleSide}),bark:mat(0x67472e),leaf:mat(0xffffff),petal:mat(0xffffff),window:mat(0xffffff,{map:shoji,emissiveMap:shoji,emissive:0xffbd57,emissiveIntensity:1.5,side:T.DoubleSide}),lamp:mat(0xffdb83,{emissive:0xffa83b,emissiveIntensity:2}),brick:mat(0xc98259,{map:masonry}),cream:mat(0xffe9bd),iron:mat(0x48545a,{metalness:.5,roughness:.5})};
const G={box:new T.BoxGeometry(1,1,1),cyl:new T.CylinderGeometry(1,1,1,16),taper:new T.CylinderGeometry(.53,1,1,16),rock:new T.IcosahedronGeometry(1,2),leaf:new T.IcosahedronGeometry(1,2),plane:new T.PlaneGeometry(1,1),ring:new T.TorusGeometry(1,.11,8,24)};
function roofGeo(){const p=[],uv=[],idx=[],n=40,m=24;for(let j=0;j<=m;j++){const z=j/m*2-1;for(let i=0;i<=n;i++){const x=i/n*2-1,y=Math.pow(1-Math.abs(z),1.55)*.8+.13*Math.pow(Math.abs(x),6)*Math.pow(Math.abs(z),3);p.push(x*.5,y,z*.5);uv.push(i/n,j/m)}}for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1)}const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}G.roof=roofGeo();
// Shared miniature botanical geometry. Each blossom has five separately modeled
// notched, cupped petals, a recessed heart and fine stamens, not a sphere.
function botanicalGeometry(kind){
 const p=[],colors=[],indices=[];const col=new T.Color();
 const vertex=(x,y,z,c)=>{p.push(x,y,z);col.set(c);colors.push(col.r,col.g,col.b);return p.length/3-1};
 const tri=(a,b,c)=>indices.push(a,b,c);
 if(kind==="flower"){
  for(let k=0;k<5;k++){
   const a=k*Math.PI*2/5,cs=Math.cos(a),sn=Math.sin(a);
   const v=(u,w,y,c)=>vertex(u*cs-w*sn,y,u*sn+w*cs,c);
   const root=v(.06,0,0,0xffa5b9),mid=v(.52,0,.10,0xffe2e6);
   const edge=[[.30,-.29],[.68,-.38],[.97,-.20],[.88,0],[.97,.20],[.68,.38],[.30,.29]].map(([u,w],i)=>v(u,w,.13+.12*Math.abs(w),i===3?0xffc8d5:0xfff5f3));
   for(let i=0;i<edge.length-1;i++)tri(mid,edge[i+1],edge[i]);tri(root,mid,edge[0]);tri(root,edge[6],mid);
  }
  const heart=vertex(0,.16,0,0xffc46c);
  for(let k=0;k<10;k++){const a=k*Math.PI/5,b=a+Math.PI/5;tri(heart,vertex(.13*Math.cos(a),.09,.13*Math.sin(a),0xffb675),vertex(.13*Math.cos(b),.09,.13*Math.sin(b),0xffd995))}
 }else{
  // A feathery spray of narrow tapered leaves with midrib shading.
  for(let k=0;k<18;k++){const a=k*2.39996,rad=.13+.38*(k%4)/3,y=(k%5)*.065,dx=Math.cos(a),dz=Math.sin(a),len=.35+.42*(k%3)/2;
   const x=dx*rad,z=dz*rad,w=kind==="needle"?.035:.09;
   const root=vertex(x,y,z,0x668346),mid=vertex(x+dx*len*.52,y+.11,z+dz*len*.52,0xc1d78b),tip=vertex(x+dx*len,y+.025,z+dz*len,0xa5bd72);
   const l=vertex(x+dx*len*.42-dz*w,y+.04,z+dz*len*.42+dx*w,0x7d9c55),r=vertex(x+dx*len*.42+dz*w,y+.045,z+dz*len*.42-dx*w,0xe0e7a4);
   tri(root,l,mid);tri(root,mid,r);tri(mid,l,tip);tri(mid,tip,r);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(p,3));g.setAttribute("color",new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
G.blossom=botanicalGeometry("flower");G.needle=botanicalGeometry("needle");G.spray=botanicalGeometry("leaf");
M.flower=mat(0xffffff,{vertexColors:true,side:T.DoubleSide,roughness:.95});
M.foliage=mat(0xffffff,{vertexColors:true,side:T.DoubleSide,roughness:.95});

const obj=new T.Object3D(),q0=new T.Quaternion(),up=V(0,1,0);
function batch(parent){const buckets=new Map(),lights=[];function put(g,m,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,color=null,q=null){const key=g+":"+m;if(!buckets.has(key))buckets.set(key,{g,m,items:[]});obj.position.set(x,y,z);obj.scale.set(sx,sy,sz);obj.rotation.set(rx,ry,rz);if(q)obj.quaternion.copy(q);obj.updateMatrix();buckets.get(key).items.push({matrix:obj.matrix.clone(),color})}
function box(m,x,y,z,w,h,d,ry=0){put("box",m,x,y,z,w,h,d,0,ry)}
function beam(m,a,b,r){const d=b.clone().sub(a),p=a.clone().add(b).multiplyScalar(.5);q0.setFromUnitVectors(up,d.clone().normalize());put("cyl",m,p.x,p.y,p.z,r,d.length(),r,0,0,0,null,q0)}
function finish(){for(const {g,m,items} of buckets.values()){const mesh=new T.InstancedMesh(G[g],M[m],items.length);for(let i=0;i<items.length;i++){const a=items[i];mesh.setMatrixAt(i,a.matrix);if(a.color!==null)mesh.setColorAt(i,new T.Color(a.color))}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=!["petal","leaf","flower","foliage","window","lamp"].includes(m);mesh.receiveShadow=!["window","lamp"].includes(m);parent.add(mesh)}if(lights.length){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(lights.flat(),3));const p=new T.Points(g,new T.PointsMaterial({size:2.2,map:glow,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending}));p.renderOrder=3;parent.add(p)}}return {put,box,beam,finish,lights}}
function island(world,id,x,z,rx,rz,mark){const g=new T.Group();g.position.set(x,0,z);world.add(g);if(id)mark(g,"station",id);const b=batch(g),shape=new T.Shape(),n=80;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,f=1+.033*Math.sin(a*7+x)+.023*Math.cos(a*13+z),px=Math.cos(a)*rx*f,pz=Math.sin(a)*rz*f;if(i===0)shape.moveTo(px,pz);else shape.lineTo(px,pz)}shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.65,bevelEnabled:true,bevelThickness:.25,bevelSize:.25,bevelSegments:2,steps:1});geo.rotateX(-Math.PI/2);const land=new T.Mesh(geo,[M.grass,M.stone]);land.position.y=.75;land.castShadow=land.receiveShadow=true;g.add(land);const colors=[0x96928a,0x737b78,0xaea79a,0x646f73,0x89857c];for(let j=0;j<3;j++){const count=Math.ceil((rx+rz)*3);for(let i=0;i<count;i++){const a=(i+j*.5)/count*6.283,f=1+.033*Math.sin(a*7+x)+.023*Math.cos(a*13+z)-j*.012,s=range(.6,1);b.put("rock","rock",Math.cos(a)*rx*f,-1.75+j*1.04,Math.sin(a)*rz*f,s,range(.55,.9),s*range(.8,1.2),range(-.3,.3),range(0,6.28),range(-.3,.3),pick(colors));if(j===2&&i%3===0)b.put("spray","foliage",Math.cos(a)*rx*f,1.15,Math.sin(a)*rz*f,s*.7,.25,s*.7,0,a,0,0x607645)}}return {g,b,rx,rz}}
function roof(b,x,y,z,w,d,h=1,green=false){b.put("roof",green?"greenRoof":"roof",x,y,z,w,h,d);b.box("dark",x,y-.07,z,w,.13,d);b.put("cyl","roof",x,y+h*.8,z,.105,w*.98,.105,0,0,Math.PI/2);for(const side of [-1,1]){b.box("wood",x,y-.17,z+side*d*.46,w,.10,.11);b.box("gold",x,y-.10,z+side*d*.49,w,.035,.04);for(let i=0;i<Math.floor(w/.56);i++){const xx=x-w*.44+i*.56;b.box("wood",xx,y-.25,z+side*d*.40,.11,.21,.27);b.box("dark",xx,y-.35,z+side*d*.43,.15,.08,.20)}}}
function win(b,x,y,z,w,h,ry=0){b.put("plane","window",x,y,z,w,h,1,0,ry);b.put("box","dark",x,y-h*.52,z,w*1.12,.10,.13,0,ry)}
function house(b,x,z,w,d,h,floors=2,style="wood",base=1.45){const fh=h/floors;for(let f=0;f<floors;f++){const s=1-f*.035,y=base+f*fh,ww=w*s,dd=d*s;b.box(style==="brick"?"brick":"wall",x,y+fh*.49,z,ww,fh*.98,dd);b.box("dark",x,y+.07,z,ww+.13,.14,dd+.13);b.box("wood",x,y+fh-.1,z,ww+.20,.18,dd+.20);for(const side of [-1,1]){for(const k of [-1,1]){b.box("dark",x+k*ww*.48,y+fh*.48,z+side*dd*.5,.13,fh,.15);b.box("dark",x+side*ww*.5,y+fh*.48,z+k*dd*.48,.15,fh,.13)}let cols=Math.max(2,Math.floor(ww/1.45));for(let i=0;i<cols;i++){let xx=x-ww*.5+(i+.5)*ww/cols;win(b,xx,y+fh*.53,z+side*(dd*.5+.02),ww/cols*.76,fh*.64,side>0?0:Math.PI)}cols=Math.max(1,Math.floor(dd/1.6));for(let i=0;i<cols;i++)win(b,x+side*(ww*.5+.025),y+fh*.53,z-dd*.5+(i+.5)*dd/cols,dd/cols*.72,fh*.6,side*Math.PI/2)}if(f<floors-1&&style!=="brick")roof(b,x,y+fh,z,ww+.45,dd+.45,.33)}roof(b,x,base+h,z,w*1.16,d*1.17,Math.max(.68,w*.18),style==="green")}
function lamp(b,x,z,base=1.45,s=1){const y=base+1.5*s;b.box("stone",x,base+.12*s,z,.46*s,.24*s,.46*s);b.box("dark",x,base+.7*s,z,.13*s,1.2*s,.13*s);b.box("gold",x,y-.34*s,z,.64*s,.10*s,.64*s);b.box("lamp",x,y,z,.45*s,.60*s,.45*s);for(const dx of [-1,1])for(const dz of [-1,1])b.box("dark",x+dx*.245*s,y,z+dz*.245*s,.05*s,.66*s,.05*s);b.put("roof","roof",x,y+.34*s,z,.83*s,.35*s,.83*s);b.lights.push([x,y,z])}
function path(b,p,w=1.5){for(let i=1;i<p.length;i++){const [x,z]=p[i-1],[a,d]=p[i],dx=a-x,dz=d-z,n=Math.ceil(Math.hypot(dx,dz)/.62);for(let j=0;j<n;j++){const t=(j+.5)/n;b.box("stone",x+dx*t,1.49,z+dz*t,w,.07,Math.hypot(dx,dz)/n*.97,Math.atan2(dx,dz))}}}
function sakura(parent,x,z,s,swayers){
 const g=new T.Group();g.position.set(x,1.45,z);g.scale.setScalar(s);parent.add(g);const b=batch(g),turn=range(0,6.28);
 const trunk=[V(0,0,0),V(-.12,.8,.08),V(.10,1.65,.13),V(-.17,2.42,-.06),V(.05,3.18,.05)];
 for(let i=1;i<trunk.length;i++)b.beam("bark",trunk[i-1],trunk[i],.22-i*.034);
 for(let k=0;k<5;k++){const a=turn+k*1.256;b.beam("bark",V(0,.32,0),V(Math.cos(a)*.52,.02,Math.sin(a)*.52),.09)}
 const palette=[0xff9bb8,0xffb8cd,0xffd6e3,0xffeaf0,0xf49fba,0xffc1d5];
 const tiers=innerWidth<760?7:10,flowers=innerWidth<760?10:18;
 for(let k=0;k<tiers;k++){
  const a=turn+k*2.399963,level=1.4+k/tiers*1.5,reach=1.3+.65*Math.sin(k/tiers*Math.PI),base=V(.02,level,0);
  const elbow=V(Math.cos(a)*reach*.54,level+.62,Math.sin(a)*reach*.54);
  const tip=V(Math.cos(a)*reach,level+.95,Math.sin(a)*reach);
  b.beam("bark",base,elbow,.10);b.beam("bark",elbow,tip,.062);
  for(let n=0;n<5;n++){
   const aa=a+(n-2)*.47,l=range(.43,.84);
   const twig=V(tip.x+Math.cos(aa)*l,tip.y+range(-.21,.55),tip.z+Math.sin(aa)*l);
   b.beam("bark",n%2?elbow.clone().lerp(tip,.7):tip,twig,.024);
   for(let m=0;m<flowers;m++){
    const theta=range(0,6.28),u=range(-1,1),radius=Math.cbrt(r())*.52,rr=Math.sqrt(1-u*u)*radius;
    const size=range(.105,.205);
    b.put("blossom","flower",twig.x+Math.cos(theta)*rr,twig.y+u*radius,twig.z+Math.sin(theta)*rr,size,size,size,range(-1.3,1.3),range(0,6.28),range(-1.3,1.3),pick(palette));
   }
   if(n%2===0)b.put("spray","foliage",twig.x,twig.y-.2,twig.z,.25,.25,.25,.4,aa,.3,0x78934b);
  }
 }
 b.finish();swayers.push({g,phase:range(0,6.28),scale:range(.004,.011)});
}
function pine(b,x,z,s=.9){
 const p=(a,y,d)=>V(x+a*s,1.45+y*s,z+d*s);
 const trunk=[p(0,0,0),p(-.18,.8,.1),p(.10,1.65,0),p(-.25,2.45,.09),p(.02,3.5,0)];
 for(let i=1;i<trunk.length;i++)b.beam("bark",trunk[i-1],trunk[i],(.19-i*.032)*s);
 for(let k=0;k<7;k++){const a=k*2.39996,yy=1.3+k*.31,reach=1.3-k*.10,base=p(0,yy,0),tip=p(Math.cos(a)*reach,yy+.39,Math.sin(a)*reach);
  b.beam("bark",base,tip,.065*s);
  for(let n=0;n<7;n++){const aa=a+(n-3)*.30,twig=tip.clone().add(V(Math.cos(aa)*.48*s,.12*s,Math.sin(aa)*.48*s));b.beam("bark",tip,twig,.025*s);
   for(let m=0;m<7;m++){const f=range(.19,.38)*s;b.put("needle","foliage",twig.x+range(-.34,.34)*s,twig.y+range(-.05,.20)*s,twig.z+range(-.34,.34)*s,f,f*.65,f,range(-.4,.4),range(0,6.28),range(-.4,.4),pick([0x345d35,0x507b3e,0x74954b,0x426e3d]))}
  }
 }
}
function garden(b,rx,rz,count=32){for(let i=0;i<count;i++){const a=range(0,6.28),f=range(.72,.95),x=Math.cos(a)*rx*f,z=Math.sin(a)*rz*f;for(let j=0;j<9;j++){const s=range(.18,.40);b.put("spray","foliage",x+range(-.55,.55),1.48+s*.3,z+range(-.55,.55),s,s*.9,s,range(-.4,.4),range(0,6.28),range(-.4,.4),pick([0x628441,0x87984d,0x50723e,0x3b693e]));if(i%3===0)b.put("blossom","flower",x+range(-.4,.4),1.65+s*.3,z+range(-.4,.4),.11,.11,.11,range(-.7,.7),range(0,6.28),range(-.7,.7),pick([0xe790c8,0xffc9d4,0xf1dfb0,0xc18be3]))}}}
function pagoda(b,x,z,s=1.3){b.box("stone",x,1.7,z,4.8*s,.5,4.5*s);for(let i=0;i<5;i++){const f=s*(1-i*.125),y=2+i*1.73*s;b.box("red",x,y+.59*s,z,3.85*f,1.2*s,3.6*f);for(const side of [-1,1]){for(const j of [-1,0,1]){win(b,x+j*1.05*f,y+.62*s,z+side*1.81*f,.82*f,.75*s,side>0?0:Math.PI);win(b,x+side*1.93*f,y+.62*s,z+j*.98*f,.74*f,.72*s,side*Math.PI/2)}for(const dx of [-1,1])b.box("red",x+dx*1.91*f,y+.59*s,z+side*1.82*f,.17*f,1.25*s,.17*f);b.box("gold",x,y+.12*s,z+side*1.86*f,4.05*f,.09,.16)}roof(b,x,y+1.24*s,z,5.35*f,5.1*f,.73*s)}const y=2+5*1.73*s;b.put("cyl","gold",x,y+.8*s,z,.055*s,2.2*s,.055*s);for(let i=0;i<8;i++)b.put("ring","gold",x,y+i*.21*s,z,(.32-i*.023)*s,(.32-i*.023)*s,(.32-i*.023)*s,Math.PI/2)}
function bridge(b,x,z,w=5){for(let i=0;i<24;i++){const t=(i+.5)/24-.5,y=1.52+Math.cos(t*Math.PI)*.9,dx=t*w;b.box("wood",x+dx,y,z,w/24+.02,.13,1.7);for(const side of [-1,1]){b.box("red",x+dx,y+.62,z+side*.87,w/24+.05,.12,.13);if(i%4===0)b.box("red",x+dx,y+.31,z+side*.87,.12,.65,.12)}}}
function torii(b,x,z,s=1){for(const side of [-1,1])b.put("cyl","red",x+side*1.2*s,1.45+1.7*s,z,.15*s,3.4*s,.15*s);b.box("red",x,1.45+2.9*s,z,3.5*s,.23*s,.28*s);b.box("red",x,1.45+3.45*s,z,4*s,.25*s,.43*s);b.box("dark",x,1.45+3.64*s,z,4.15*s,.15*s,.52*s)}
function mountain(world){const g=new T.Group();g.position.set(11,-2.5,-58);world.add(g);const n=160,levels=76,p=[],colors=[],ids=[],rock=new T.Color(0x4b759f),snow=new T.Color(0xfff7ec),dark=new T.Color(0x31577f),snowblue=new T.Color(0x9fbbd8),aC=new T.Color(),bC=new T.Color();for(let j=0;j<=levels;j++){const t=j/levels,R=1.8+37*Math.pow(1-t,1.75);for(let i=0;i<=n;i++){const a=i/n*6.283185,fold=(Math.sin(a*12+t*2)+.55*Math.sin(a*24-t*4)+.24*Math.sin(a*49+t*7))/1.8,rad=R*(1+fold*.10);p.push(Math.cos(a)*rad,t*36+fold*Math.sin(t*Math.PI),Math.sin(a)*rad*.75);aC.copy(rock).lerp(dark,T.MathUtils.clamp(.4-fold*.45,0,1));bC.copy(snow).lerp(snowblue,T.MathUtils.clamp(.30-fold*.68,0,.95));const line=.66+.075*Math.sin(a*8)+.045*Math.sin(a*19)+.047*fold;aC.lerp(bC,T.MathUtils.smoothstep(t,line-.015,line+.025));colors.push(aC.r,aC.g,aC.b)}}for(let j=0;j<levels;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;ids.push(a,a+1,b,b,a+1,b+1)}const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(p,3));geo.setAttribute("color",new T.Float32BufferAttribute(colors,3));geo.setIndex(ids);geo.computeVertexNormals();g.add(new T.Mesh(geo,mat(0xffffff,{vertexColors:true,side:T.DoubleSide})));const cap=new T.Mesh(new T.CircleGeometry(1.82,64),mat(0xf8f7ef));cap.rotation.x=-Math.PI/2;cap.scale.y=.75;cap.position.y=36;g.add(cap)}
export const locations={northstar:[-34,2,-4],axon:[-14,2,20],aster:[-7,2,-20],kestrel:[20,2,-22],studyhub:[39,2,-2],kagi:[65,3,27]};
export const anchors={northstar:[-34,12,-3],axon:[-14,9,20],aster:[-7,9,-20],kestrel:[20,16,-22],studyhub:[39,19,-2],kagi:[65,13,27]};
export const routeNodes=[[-47,-4],[-44,3],[-35,8],[-26,10],[-20,16],[-13,27],[-2,27],[11,23],[24,17],[39,12],[49,6],[49,-6],[41,-12],[29,-13],[18,-15],[6,-13],[-8,-12],[-21,-14],[-34,-15],[-45,-10]];
// Kagi: a navigable water entrance, inspired by a traditional floating torii.
function waterGate(world,mark){
 const g=new T.Group();g.position.set(65,0,27);g.rotation.y=-.12;g.scale.setScalar(1.55);world.add(g);mark(g,"station","kagi");const b=batch(g);
 // Two independent pile-supported wharves leave an open navigable water channel.
 for(const side of [-1,1]){
  const x=side*4.1;
  for(const z of [-2.8,.1,3,6])for(const dx of [-1.35,1.35]){b.put("cyl","dark",x+dx,-1.1,z,.21,3.15,.21);b.put("cyl","stone",x+dx,-1.92,z,.35,.55,.35)}
  b.box("wood",x,.36,1.4,3.25,.36,9.9);
  for(let n=0;n<30;n++)b.box("dark",x,.55,-3.4+n*.33,3.18,.025,.045);
  for(const zz of [-3.2,1.3,5.8]){lamp(b,x+side*1.3,zz,.56,.78);b.put("cyl","dark",x-side*1.36,.9,zz,.12,.72,.12)}
  for(let n=0;n<8;n++){const z=-3.2+n*1.25;b.box("red",x+side*1.5,.96,z,.13,.8,.13);if(n<7){b.box("gold",x+side*1.5,1.24,z+.625,.07,.07,1.25);b.box("dark",x+side*1.5,.77,z+.625,.08,.08,1.25)}}
  // Side shrine pavilions: real eaves, shoji and gold edge accents.
  house(b,x+side*.3,-2.1,2.75,3.4,2.45,1,"wood",.54);
  b.box("gold",x+side*.3,3.03,-.28,2.9,.08,.10);
 }
 for(const side of [-1,1]){
  const x=side*3.12;b.put("cyl","stone",x,-1.25,0,.84,2.45,.84);b.put("cyl","dark",x,.17,0,.66,.64,.66);b.put("cyl","red",x,3.05,0,.48,6.25,.48);b.put("cyl","gold",x,.62,0,.51,.17,.51);b.put("cyl","gold",x,5.63,0,.54,.14,.54);b.put("cyl","dark",x,6.1,0,.60,.33,.60);
  b.box("gold",x,3.45,.485,.28,1.05,.05);
  for(const zz of [-.43,.43]){b.box("wood",x,5.93,zz,1.05,.22,.16);b.box("red",x,5.65,zz,.86,.24,.28)}
 }
 b.box("red",0,4.78,0,8.85,.46,.66);b.box("gold",0,4.99,.34,8.85,.065,.065);b.box("red",0,6.16,0,10.35,.55,.92);
 roof(b,0,6.47,0,11.8,2.55,1.0);
 for(let i=0;i<46;i++){const x=(i-22.5)*.254,y=6.48+.28*Math.pow(Math.abs(x)/5.8,5);for(const side of [-1,1]){b.box("gold",x,y-.04,side*1.28,.27,.075,.075);b.box("wood",x,y-.22,side*.95,.085,.25,.32)}}
 b.box("dark",0,5.53,.51,1.55,1.08,.15);b.box("gold",0,5.53,.61,1.28,.85,.045);b.box("red",0,5.53,.65,1.06,.64,.04);b.put("ring","gold",0,5.53,.68,.27,.27,.06);b.box("gold",0,5.21,.69,.07,.44,.04);b.box("gold",.12,5.05,.69,.20,.07,.04);
 for(const x of [-2,-1,1,2]){b.put("cyl","gold",x,4.39,0,.036,.55,.036);b.box("lamp",x,3.99,0,.19,.30,.19);b.box("dark",x,3.80,0,.24,.055,.24)}
 // Traditional covered boat moored alongside, separate from the central passage.
 const boat=new T.Group();boat.position.set(.3,-1.38,5.1);boat.rotation.y=-.18;g.add(boat);const bb=batch(boat);
 for(let i=0;i<28;i++){const z=(i-13.5)*.22,w=.28+1.18*Math.sin((i+.5)/28*Math.PI);bb.box("wood",0,-.64,z,w,.30,.23);for(const side of [-1,1]){bb.box("dark",side*w*.48,-.46,z,.075,.35,.23);bb.box("gold",side*w*.49,-.25,z,.05,.055,.23)}}
 bb.box("wood",0,-.30,0,1.23,.13,3.9);
 for(const x of [-.56,.56])for(const z of [-1.35,1.35])bb.box("dark",x,.26,z,.085,1.05,.085);
 roof(bb,0,.79,0,1.62,3.1,.38);for(const z of [-1.25,1.25]){bb.box("lamp",0,.22,z,.27,.38,.27);bb.box("dark",0,.45,z,.30,.07,.30)}
 for(const z of [-2.05,2.05])bb.box("wood",0,-.12,z,1.05,.11,.32);
 bb.finish();b.finish();
}
export function buildScenery({world,mark,swayers,pulses}){mountain(world);waterGate(world,mark);function district(id,rx,rz,fn){const [x,,z]=locations[id],{g,b}=island(world,id,x,z,rx,rz,mark);fn(g,b);garden(b,rx,rz);b.finish()}const trees=(g,coords)=>coords.forEach(([x,z,s])=>sakura(g,x,z,s,swayers));
district("northstar",15,12,(g,b)=>{for(const [x,z,w,d,h,f] of [[-9,-6,4.7,4.1,7.7,3],[-3,-7,5.5,4.8,10,4],[4,-6,5,4.2,8.6,3],[9,-3,4.2,3.7,6.7,3],[-9,0,4.7,3.8,5.6,2],[-3,0,5.3,4.5,6.5,2],[4,0,5,4.2,6.6,3],[-7,5,4.8,3.8,4.5,2],[-1,5.5,4.8,3.6,4.8,2],[6,5,4.5,3.9,4.1,2]])house(b,x,z,w,d,h,f);path(b,[[-12,8],[-2,8],[10,7]],2.1);for(const x of [-11,-5,1,7,11])lamp(b,x,8.8,1.45,.85);trees(g,[[-13,-2,.9],[-11,7,1],[-5,10,.9],[9,7,1.05],[13,0,.9],[-13,-7,.8]])});
district("axon",17,12,(g,b)=>{house(b,-1,-2,12,7.2,6.2,2);house(b,-9,3,5.8,4.8,3.6,1);house(b,8,-4,4.6,4.8,4.2,2);b.box("dark",-1,3.8,1.71,8.4,4.4,.18);for(const x of [-4,-1,2])win(b,x,3.8,1.84,2.4,3.8);const gear=new T.Group();gear.position.set(-6.4,7.2,2);g.add(gear);const gb=batch(gear);gb.put("ring","gold",0,0,0,1.25,1.25,.45);for(let i=0;i<12;i++){const a=i/12*6.283;gb.put("box","gold",Math.sin(a)*1.3,Math.cos(a)*1.3,0,.25,.48,.22,0,0,-a)}gb.finish();pulses.push({object:gear,kind:"rotateZ",speed:.13});path(b,[[-13,7],[-5,7],[3,6],[13,5]],2);for(const x of [-12,-6,1,8,13])lamp(b,x,7.7,1.45,1);trees(g,[[-14,-3,1],[-12,8,1.18],[-6,9,.9],[10,6,1.1],[13,0,1],[12,-7,.86]]);for(const [x,z] of [[-7,7],[7,8],[14,2]])pine(b,x,z,.84)});
district("aster",15,12,(g,b)=>{house(b,-6,-4,6.6,5,3.6,1,"green");house(b,4,-6,5.4,4.4,4.1,2,"green");torii(b,10,-1,.76);const p=new T.Mesh(new T.CircleGeometry(4.4,64),mat(0x3c899e,{roughness:.22,metalness:.4}));p.rotation.x=-Math.PI/2;p.scale.set(1.2,.78,1);p.position.set(2,1.46,3);g.add(p);for(let i=0;i<36;i++){const a=i/36*6.283;b.put("rock","rock",2+5.3*Math.cos(a),1.64,3+3.5*Math.sin(a),.48,.3,.38,0,a,0,pick([0x9b9d91,0x69716a,0xb1a89a]))}bridge(b,2,3,6);path(b,[[-12,6],[-6,4],[-4,0]],1.65);for(const [x,z] of [[-11,5],[-5,6],[7,6],[11,3],[-10,-7]])lamp(b,x,z,1.45,.7);trees(g,[[-12,-3,1],[-12,6,1.1],[-4,8,.85],[10,6,1],[10,-6,1.05],[0,-9,.8]]);for(const [x,z] of [[-7,4],[7,-4],[-2,-6],[11,0],[6,8]])pine(b,x,z,.8)});
district("kestrel",15,12,(g,b)=>{pagoda(b,4,-5,1.35);house(b,-5,-5,6.6,4.8,3.9,1,"green");house(b,9,1,4.6,4.3,3.6,1,"green");path(b,[[-11,4],[-5,6],[2,6],[10,4]],1.7);torii(b,-8,1,.8);bridge(b,-5,5,4.3);for(const [x,z] of [[-11,6],[-5,8],[2,8],[10,5],[11,-3]])lamp(b,x,z,1.45,.8);trees(g,[[-11,-5,1.1],[-10,7,.95],[-1,8,1.05],[11,6,1.04],[12,-4,.9]]);for(const [x,z] of [[-6,2],[7,5],[9,-8],[-11,-1]])pine(b,x,z,.9)});
district("studyhub",14,12,(g,b)=>{house(b,0,-3,13,5.5,5.4,2,"brick");house(b,-7,1,4.5,5.7,4.3,2,"brick");house(b,7,1,4.5,5.7,4.3,2,"brick");house(b,0,-4.5,3.8,3.7,12.2,4,"brick");const clock=new T.Mesh(new T.CircleGeometry(.95,48),mat(0xffe7ba,{emissive:0x7a421d,emissiveIntensity:.35}));clock.position.set(0,11.6,-2.45);g.add(clock);b.put("ring","gold",0,11.6,-2.36,1.02,1.02,.25);b.put("box","dark",0,11.88,-2.30,.07,.52,.06,0,0,-.26);b.put("box","dark",.23,11.52,-2.30,.07,.70,.06,0,0,-1.15);path(b,[[-11,6],[0,7],[11,6]],2);for(const x of [-10,-5,0,5,10])lamp(b,x,8,1.45,.78);trees(g,[[-11,-4,.9],[-11,6,1.1],[-5,9,.8],[10,8,1.1],[12,0,.98],[11,-7,.86]]);for(const [x,z] of [[-7,6],[7,6],[-10,0]])pine(b,x,z,.8)});
const {g,b}=island(world,null,29,22,8,5.7,mark);path(b,[[-5,0],[0,1],[5,0]],1.2);lamp(b,-5,1,1.45,.8);lamp(b,4,1,1.45,.8);sakura(g,0,-1,1.22,swayers);pine(b,-5,-1,.8);pine(b,5,-2,.8);garden(b,8,5.7,20);b.finish()}
export function buildViaduct(world,curve,length){const b=batch(world),count=Math.floor(length/4.8),top=3.32,foot=-2.55;for(let i=0;i<count;i++){const p=curve.getPointAt((i+.5)/count),v=curve.getTangentAt((i+.5)/count),angle=Math.atan2(v.x,v.z),side=V(-v.z,0,v.x).normalize(),span=length/count;const at=(l,s,y)=>p.clone().addScaledVector(v,l).addScaledVector(side,s).setY(y);const pier=at(-span*.5,0,(foot+top-2.2)*.5);b.box("stone",pier.x,pier.y,pier.z,2.7,top-2.2-foot,.64,angle);
for(let k=0;k<15;k++){const t=(k+.5)/15*Math.PI,u=Math.cos(t)*(span*.5-.1),y=top-2.05+Math.sin(t)*2,pos=at(u,0,y);b.put("box","stone",pos.x,pos.y,pos.z,2.67,.46,Math.max(.4,span*.14),0,angle,0)}const deck=at(0,0,top-.15);b.box("stone",deck.x,deck.y,deck.z,2.85,.37,span+.09,angle);for(const s of [-1,1]){const edge=at(0,s*1.38,top+.17);b.box("cream",edge.x,edge.y,edge.z,.13,.3,span+.05,angle)}}b.finish()}
export function buildWaterSurface(world,scene,renderer,camera){const y=-2.45,target=new T.WebGLRenderTarget(768,512,{minFilter:T.LinearFilter,magFilter:T.LinearFilter}),mirror=new T.PerspectiveCamera(),matrix=new T.Matrix4(),uniforms={reflected:{value:target.texture},projector:{value:matrix},time:{value:0},quality:{value:1}};
const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,vertexShader:`varying vec3 wpos;varying vec4 projected;uniform mat4 projector;void main(){vec4 p=modelMatrix*vec4(position,1.);wpos=p.xyz;projected=projector*p;gl_Position=projectionMatrix*viewMatrix*p;}`,fragmentShader:`varying vec3 wpos;varying vec4 projected;uniform sampler2D reflected;uniform float time;uniform float quality;void main(){vec2 p=wpos.xz;vec2 uv=projected.xy/projected.w*.5+.5;float wave=sin(p.x*2.9+p.y*.61+time*1.6)+sin(p.y*4.5-p.x*.46-time*1.1)*.45;float wave2=sin(p.y*2.1+p.x*.37-time*1.3)+sin(p.x*5.8+p.y*2.2+time)*.22;vec4 ref=texture2D(reflected,clamp(uv+vec2(wave*.0027,wave2*.0065),.002,.998));float edge=1.-smoothstep(64.,105.,length((p-vec2(12.,4.))*vec2(.9,1.05)));float f=pow(1.-clamp(normalize(cameraPosition-wpos).y,0.,1.),2.);vec3 blue=mix(vec3(.10,.29,.48),vec3(.25,.52,.73),f);float ribbons=pow(.5+.5*sin(p.y*9.5+sin(p.x*.82+time*.55)*2.+wave*.6),22.);float glitter=pow(max(0.,sin(p.x*13.7+p.y*4.1+time*.38)*.5+.5),15.)*ribbons;float sun=exp(-abs(p.x-36.)*.061)*smoothstep(-45.,10.,p.y);vec3 col=mix(blue,ref.rgb,ref.a*quality*(.61+.18*f));col+=vec3(.035,.056,.075)*ribbons+vec3(.42,.27,.13)*glitter*sun;gl_FragColor=vec4(col,edge*.96);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
const mesh=new T.Mesh(new T.PlaneGeometry(210,175),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(6,y,0);mesh.renderOrder=-1;world.add(mesh);
const plane=new T.Plane(V(0,1,0),-y+.05),direction=V(),pos=V(),look=V(),oldClear=new T.Color(),size=new T.Vector2();let frame=0,lastW=0,lastH=0;
return {update(t,lite){uniforms.time.value=t;uniforms.quality.value=lite?0:1;if(lite||frame++%3!==0)return;renderer.getSize(size);const w=innerWidth<760?448:1024,h=Math.round(w*size.y/size.x);if(w!==lastW||h!==lastH){target.setSize(w,h);lastW=w;lastH=h}mirror.copy(camera,false);pos.copy(camera.position);pos.y=2*y-pos.y;camera.getWorldDirection(direction);direction.y*=-1;mirror.position.copy(pos);mirror.up.set(0,-1,0);look.copy(pos).add(direction);mirror.lookAt(look);mirror.updateMatrixWorld(true);matrix.multiplyMatrices(mirror.projectionMatrix,mirror.matrixWorldInverse);const oldTarget=renderer.getRenderTarget(),oldPlanes=renderer.clippingPlanes,oldAlpha=renderer.getClearAlpha(),oldShadow=renderer.shadowMap.autoUpdate;renderer.getClearColor(oldClear);mesh.visible=false;try{renderer.clippingPlanes=[plane];renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(target);renderer.setClearColor(0x75b5d6,0);renderer.clear();renderer.render(scene,mirror)}finally{renderer.setRenderTarget(oldTarget);renderer.setClearColor(oldClear,oldAlpha);renderer.clippingPlanes=oldPlanes;renderer.shadowMap.autoUpdate=oldShadow;mesh.visible=true}}}}
export function addClouds(scene,clouds){const map=texture(512,256,(c,w)=>{for(let i=0;i<75;i++){const x=75+r()*360,y=90-Math.sin(x/w*Math.PI)*25+r()*75,rad=18+r()*46,g=c.createRadialGradient(x,y,rad*.12,x,y,rad);g.addColorStop(0,"#fff8ed9c");g.addColorStop(.45,"#f8f5f0a0");g.addColorStop(1,"#fcf8f000");c.fillStyle=g;c.fillRect(x-rad,y-rad,2*rad,2*rad)}});for(const [x,y,z,s] of [[-65,35,-67,22],[-34,40,-75,19],[-4,46,-83,21],[45,44,-75,18],[75,37,-60,26],[-95,31,-57,20]]){const g=new T.Group();g.position.set(x,y,z);scene.add(g);const sprite=new T.Sprite(new T.SpriteMaterial({map,transparent:true,opacity:.92,depthWrite:false}));sprite.scale.set(s,s*.5,1);g.add(sprite);clouds.push({g,speed:.09,direction:x>0?1:-1})}}
