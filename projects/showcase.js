/* Three distinct interactive project worlds. No mock backend or invented production metrics. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const byId = id => document.getElementById(id);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const seedRand = n => { const s=Math.sin(n*91.913+3.5)*43758.5453;return s-Math.floor(s); };
  const motion = (button, initial=true) => {
    let enabled=initial&&!reduce;
    if(button){
      button.setAttribute("aria-pressed",String(enabled));
      button.textContent=enabled?"Pause ambience":"Resume ambience";
      button.addEventListener("click",()=>{
        enabled=!enabled;button.setAttribute("aria-pressed",String(enabled));
        button.textContent=enabled?"Pause ambience":"Resume ambience";
      });
    }
    return () => enabled && !document.hidden;
  };
  const fitCanvas = (canvas,ctx) => {
    const bounds=canvas.getBoundingClientRect();
    const w=Math.max(1,bounds.width),h=Math.max(1,bounds.height);
    const ratio=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
      canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    }
    ctx.setTransform(ratio,0,0,ratio,0,0);
    return {w,h};
  };

  function kestrelWorld(){
    const canvas=byId("kOrbitCanvas"),ctx=canvas?.getContext("2d");
    if(!ctx)return;
    const isMoving=motion(byId("kMotion"));
    const services=[
      ["gateway",-3.65,.45,0],["auth",-2.45,.72,-.35],["account",-1.3,.13,.28],
      ["order",-.12,.57,-.35],["inventory",1.12,.22,.45],["pricing",2.3,.74,-.3],
      ["payment",3.6,.26,.25],["notification",-1.7,-1.18,2.2],
      ["audit",.3,-1.1,2.6],["analytics",2.2,-1.12,2.2]
    ];
    const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,7],[3,8],[3,9]];
    let yaw=-.13,pitch=.27,phase=0,drag=null,hover=-1,chosen=-1,positions=[],last=performance.now();
    const project=(x,y,z,w,h)=>{
      const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
      const rx=x*cy-z*sy,rz=x*sy+z*cy;
      const ry=y*cp-rz*sp,depth=y*sp+rz*cp;
      const unit=Math.min(w/9.8,74);
      const perspective=7/(7+depth*.22);
      return {x:w/2+rx*unit*perspective,y:h*.48-ry*unit*perspective,
        scale:perspective,depth};
    };
    const getColor=i=>{
      const el=document.querySelector('.k-node[data-service="'+services[i][0]+'"],.k-worker[data-service="'+services[i][0]+'"]');
      if(el?.classList.contains("failed"))return "#ff856e";
      if(el?.classList.contains("active"))return "#ffce98";
      if(el?.classList.contains("success"))return "#83e9c5";
      return i===4?"#f5a58b":"#74bbd8";
    };
    const draw=now=>{
      const {w,h}=fitCanvas(canvas,ctx);
      const dt=Math.min(45,now-last);last=now;
      if(isMoving())phase+=dt*.001;
      if(drag===null && isMoving())yaw+=dt*.000015;
      ctx.clearRect(0,0,w,h);
      const stars=87;
      for(let i=0;i<stars;i++){
        const x=seedRand(i+11)*w,y=seedRand(i+431)*h*.8;
        const blink=.23+.25*Math.sin(phase*.7+i),rad=i%13===0?1.5:.6;
        ctx.fillStyle="rgba(145,211,230,"+blink+")";
        ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();
      }
      // A perspective floor makes the graph readable as a physical space.
      for(let i=-5;i<=5;i++){
        const a=project(i,-1.75,-3.5,w,h),b=project(i,-1.75,4,w,h);
        ctx.strokeStyle="#3b789340";ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      for(let i=-3;i<=4;i++){
        const a=project(-5,-1.75,i,w,h),b=project(5,-1.75,i,w,h);
        ctx.strokeStyle="#3b789334";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      positions=services.map(s=>project(s[1],s[2],s[3],w,h));
      edges.forEach(([a,b],i)=>{
        const p=positions[a],q=positions[b],fault=i===3 && document.querySelector('.k-node[data-service="inventory"]')?.classList.contains("failed");
        const col=fault?"#ee866f":"#5db8c2";
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo((p.x+q.x)/2,(p.y+q.y)/2-18,p.x+(q.x-p.x),q.y);
        ctx.strokeStyle=fault?"#f28a738c":"#5c9cb46b";ctx.lineWidth=1.6;ctx.stroke();
        const t=(phase*.25+i*.13)%1;
        const xx=lerp(p.x,q.x,t),yy=lerp(p.y,q.y,t)-18*4*t*(1-t);
        const glow=ctx.createRadialGradient(xx,yy,1,xx,yy,13);
        glow.addColorStop(0,col+"dc");glow.addColorStop(1,"#00000000");
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(xx,yy,13,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(xx,yy,2.5,0,Math.PI*2);ctx.fill();
      });
      const order=services.map((_,i)=>i).sort((a,b)=>positions[b].depth-positions[a].depth);
      order.forEach(i=>{
        const p=positions[i],color=getColor(i),size=clamp(19*p.scale,13,26),isHover=i===hover||i===chosen;
        const g=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,size*2.8);
        g.addColorStop(0,color+"6e");g.addColorStop(1,"#00000000");
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,size*2.8,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#0d2231";ctx.strokeStyle=color;ctx.lineWidth=isHover?2.8:1.6;
        ctx.beginPath();ctx.moveTo(p.x,p.y-size);
        ctx.lineTo(p.x+size*.9,p.y-size*.4);ctx.lineTo(p.x+size*.9,p.y+size*.5);
        ctx.lineTo(p.x,p.y+size);ctx.lineTo(p.x-size*.9,p.y+size*.5);
        ctx.lineTo(p.x-size*.9,p.y-size*.4);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,3.8,0,Math.PI*2);ctx.fill();
        ctx.textAlign="center";ctx.font="600 "+(isHover?12:11)+"px 'IBM Plex Mono',monospace";
        ctx.fillStyle=isHover?"#ffffff":"#c5dce4";ctx.fillText(services[i][0],p.x,p.y+size+16);
        if(isHover){ctx.font="9px 'IBM Plex Mono',monospace";ctx.fillStyle="#f8ae94";
          ctx.fillText(i<7?"synchronous request":"async consumer",p.x,p.y+size+30);}
      });
      if(reduce)setTimeout(()=>requestAnimationFrame(draw),180);else requestAnimationFrame(draw);
    };
    const hit=(x,y)=>{let best=-1,dist=35;positions.forEach((p,i)=>{const dd=Math.hypot(x-p.x,y-p.y);if(dd<dist){best=i;dist=dd}});return best;};
    canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{
      if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
        if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
        yaw+=dx*.0055;pitch=clamp(pitch+dy*.003,-.45,.75);drag.x=e.clientX;drag.y=e.clientY;
      }else{const r=canvas.getBoundingClientRect();hover=hit(e.clientX-r.left,e.clientY-r.top);}
    });
    canvas.addEventListener("pointerup",e=>{
      const r=canvas.getBoundingClientRect();
      if(drag&&!drag.moved){chosen=hit(e.clientX-r.left,e.clientY-r.top);
        if(chosen>=0){
          const service=services[chosen][0];
          byId("eventTitle").textContent=service+" / node selected";
          byId("eventJSON").textContent="Service: "+service+"\nInspect its recorded events below after running the Go replay.";
          const row=[...document.querySelectorAll(".k-trace-row")].find(el=>el.firstElementChild?.textContent===service);
          row?.click();
        }
      }
      drag=null;
    });
    canvas.addEventListener("pointerleave",()=>hover=-1);
    canvas.addEventListener("keydown",e=>{
      if(e.key==="ArrowLeft"||e.key==="ArrowRight"){yaw+=(e.key==="ArrowLeft"?-.16:.16);e.preventDefault()}
      if(e.key==="ArrowUp"||e.key==="ArrowDown"){pitch=clamp(pitch+(e.key==="ArrowUp"?-.12:.12),-.45,.75);e.preventDefault()}
      if(e.key==="Home"){yaw=-.13;pitch=.27;e.preventDefault()}
      if(e.key==="Enter"&&hover>=0){chosen=hover;e.preventDefault()}
    });
    document.addEventListener("keydown",e=>{
      if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)||e.altKey||e.metaKey||e.ctrlKey)return;
      if(e.code==="Space"){e.preventDefault();byId("runButton")?.click();}
      if(["1","2","3","4"].includes(e.key))document.querySelectorAll(".k-preset")[Number(e.key)-1]?.click();
    });
    requestAnimationFrame(draw);
  }

  function asterWorld(){
    const stage=byId("asterStage"),table=byId("candidateTable");
    if(!stage||!table)return;
    let ranking=null,selection=null,mode="inputs";
    const format=v=>Number.isFinite(v)?(v>=1000?Math.round(v).toLocaleString():v.toFixed(v<1?4:2)):"—";
    const build=()=>{
      const els=[...table.querySelectorAll(".a-candidate")];
      const values=els.map((el,i)=>{
        const name=el.querySelector(".a-candidate-name b")?.textContent||String(i);
        const cost=Number(el.querySelector('[data-key="postgres_cost"]')?.value||0);
        const matched=ranking?.find(x=>x.name===name);
        return {name,v:mode==="ranking"&&matched?matched.score:cost,idx:i};
      });
      const numbers=values.map(x=>x.v).filter(Number.isFinite);
      const mn=Math.min(...numbers),mx=Math.max(...numbers),span=Math.max(.0001,mx-mn);
      byId("asterStageMode").textContent=mode==="ranking"?"PYTHON RANKER OUTPUT":"POSTGRES COST INPUTS";
      byId("asterStageLabel").textContent=mode==="ranking"?"Model score · lower is better":"Estimated cost · lower is better";
      stage.querySelector(".a-stage-platform").innerHTML=values.map(({name,v,idx})=>{
        const height=32+120*(v-mn)/span;
        const active=mode==="ranking"&&selection===name;
        const short=name==="postgres_default"?"pg_default":name;
        return '<button class="a-tower '+(active?"active":"")+'" type="button" data-plan="'+idx+'" title="Inspect '+name+'" style="--tower-height:'+Math.round(height)+'px"><span class="tower-stack" aria-hidden="true"></span><strong>'+short+'</strong><em>'+format(v)+'</em></button>';
      }).join("");
      stage.querySelectorAll("[data-plan]").forEach(btn=>btn.addEventListener("click",()=>{
        const input=els[Number(btn.dataset.plan)]?.querySelector("input");
        input?.focus({preventScroll:true});input?.scrollIntoView({behavior:"smooth",block:"center"});
      }));
    };
    table.addEventListener("input",()=>{ranking=null;selection=null;mode="inputs";build()});
    byId("scenario").addEventListener("change",()=>{ranking=null;selection=null;mode="inputs";queueMicrotask(build)});
    window.addEventListener("aster:result",e=>{ranking=e.detail.result.ranking;selection=e.detail.result.selected_plan;mode="ranking";build()});
    build();
    document.addEventListener("keydown",e=>{
      if(e.ctrlKey&&e.key==="Enter"){e.preventDefault();byId("rankButton")?.click()}
      if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;
      if(["1","2","3"].includes(e.key)){byId("scenario").value=["clear","uncertain","close"][Number(e.key)-1];byId("scenario").dispatchEvent(new Event("change"));}
    });
  }

  function northstarWorld(){
    const canvas=byId("nsGlobeCanvas"),ctx=canvas?.getContext("2d");
    if(!ctx)return;
    const isMoving=motion(byId("nsMotion"));
    const locs=[
      {id:"h-atl-01",code:"ATL",lat:33.75,lon:-84.39},
      {id:"h-iad-02",code:"IAD",lat:38.95,lon:-77.45},
      {id:"h-nrt-01",code:"NRT",lat:35.77,lon:140.39},
      {id:"h-fra-03",code:"FRA",lat:50.04,lon:8.56}
    ];
    // Stylized low-resolution coastlines. Decorative geography; host coordinates are labeled.
    const land=[
      [[-169,64],[-150,70],[-129,61],[-126,49],[-117,32],[-105,25],[-96,15],[-83,9],[-79,25],[-66,44],[-63,51],[-82,62],[-105,72],[-137,73]],
      [[-81,13],[-75,5],[-80,-6],[-74,-16],[-70,-34],[-65,-55],[-52,-52],[-43,-23],[-35,-8],[-50,5],[-64,11]],
      [[-12,36],[-8,49],[1,56],[19,60],[29,68],[41,58],[38,44],[29,36],[12,35]],
      [[-17,35],[3,37],[23,31],[36,12],[50,12],[42,-12],[30,-34],[17,-35],[12,-19],[-1,-2],[-17,11]],
      [[33,35],[44,50],[64,57],[94,72],[129,70],[157,61],[147,45],[134,33],[120,26],[106,13],[95,7],[76,7],[68,20],[51,18]],
      [[112,-11],[131,-12],[152,-24],[152,-37],[135,-42],[115,-30]],
      [[-53,80],[-40,82],[-20,75],[-45,61],[-58,66]]
    ];
    let center=-36,target=null,last=performance.now(),phase=0,drag=null,markers=[];
    const projection=(lat,lon,w,h)=>{
      const R=Math.min(w*.29,h*.445),cX=w*.50,cY=h*.53;
      const la=lat*Math.PI/180,lo=(lon-center)*Math.PI/180,tilt=15*Math.PI/180;
      const cosc=Math.sin(tilt)*Math.sin(la)+Math.cos(tilt)*Math.cos(la)*Math.cos(lo);
      return {x:cX+R*Math.cos(la)*Math.sin(lo),y:cY-R*(Math.cos(tilt)*Math.sin(la)-Math.sin(tilt)*Math.cos(la)*Math.cos(lo)),z:cosc,R,cX,cY};
    };
    const drawLine=(coords,color,width,w,h)=>{
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();let started=false;
      for(const [lon,lat] of coords){
        const p=projection(lat,lon,w,h);
        if(p.z>0){if(!started)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);started=true}
        else started=false;
      }
      ctx.stroke();
    };
    const frame=t=>{
      const {w,h}=fitCanvas(canvas,ctx),dt=Math.min(45,t-last);last=t;
      if(isMoving()){phase+=dt*.001;if(drag===null){if(target!==null){let delta=((target-center+540)%360)-180;center+=delta*.035;if(Math.abs(delta)<.4)target=null;}else center+=dt*.0025;}}
      ctx.clearRect(0,0,w,h);
      for(let i=0;i<90;i++){
        const x=seedRand(i+109)*w,y=seedRand(i+917)*h;
        ctx.fillStyle="rgba(158,227,217,"+(.14+.22*Math.sin(phase*.3+i))+")";
        ctx.beginPath();ctx.arc(x,y,i%17===0?1.3:.6,0,Math.PI*2);ctx.fill();
      }
      const {R,cX,cY}=projection(0,0,w,h);
      const glow=ctx.createRadialGradient(cX,cY,R*.7,cX,cY,R*1.42);
      glow.addColorStop(0,"#2d8f9c00");glow.addColorStop(.56,"#3bafa71d");glow.addColorStop(1,"#78e9c900");
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cX,cY,R*1.42,0,Math.PI*2);ctx.fill();
      const globe=ctx.createRadialGradient(cX-R*.35,cY-R*.5,R*.05,cX,cY,R*1.05);
      globe.addColorStop(0,"#2c6674");globe.addColorStop(.55,"#102d40");globe.addColorStop(.95,"#081825");globe.addColorStop(1,"#05111a");
      ctx.beginPath();ctx.arc(cX,cY,R,0,Math.PI*2);ctx.fillStyle=globe;ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(cX,cY,R,0,Math.PI*2);ctx.clip();
      for(let lat=-75;lat<=75;lat+=15){const line=[];for(let lon=-180;lon<=180;lon+=2)line.push([lon,lat]);drawLine(line,"#5eb5b322",.8,w,h)}
      for(let lon=-180;lon<180;lon+=20){const line=[];for(let lat=-90;lat<=90;lat+=2)line.push([lon,lat]);drawLine(line,"#5eb5b322",.8,w,h)}
      land.forEach(poly=>{const closed=poly.concat([poly[0]]);drawLine(closed,"#7ac5ae88",1.3,w,h)});
      ctx.restore();
      ctx.strokeStyle="#6eebd57a";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cX,cY,R,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle="#62bfae26";ctx.beginPath();ctx.ellipse(cX,cY,R*1.24,R*.42,-.24,0,Math.PI*2);ctx.stroke();
      markers=[];
      const online=window.northstarIsHostOnline || (()=>true);
      locs.forEach(l=>{
        const p=projection(l.lat,l.lon,w,h);if(p.z<=0)return;
        const selected=window.northstarSelectedHost?.()===l.id;
        const ok=online(l.id),col=ok?"#a1ffe2":"#ffad95";
        markers.push({...p,...l});
        const halo=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,selected?30:18);
        halo.addColorStop(0,ok?"#64ffdeb0":"#ff977ca8");halo.addColorStop(1,"#00000000");
        ctx.fillStyle=halo;ctx.beginPath();ctx.arc(p.x,p.y,selected?30:18,0,Math.PI*2);ctx.fill();
        if(selected){ctx.strokeStyle="#b3ffe9";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(p.x,p.y,13+2*Math.sin(phase*2),0,Math.PI*2);ctx.stroke();}
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#c5f8ed";ctx.font="600 10px 'IBM Plex Mono',monospace";ctx.textAlign="left";
        ctx.fillText(l.code,p.x+13,p.y-8);
      });
      if(reduce)setTimeout(()=>requestAnimationFrame(frame),180);else requestAnimationFrame(frame);
    };
    const pick=(x,y)=>{
      let best=null,dist=22;
      for(const p of markers){const dd=Math.hypot(p.x-x,p.y-y);if(dd<dist){dist=dd;best=p}}
      return best;
    };
    const select=id=>{
      window.northstarSelectHost?.(id);
      const l=locs.find(x=>x.id===id);
      if(l)target=l.lon;
    };
    canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x;
      if(Math.abs(dx)+Math.abs(e.clientY-drag.y)>2)drag.moved=true;
      center-=dx*.42;drag.x=e.clientX;drag.y=e.clientY;target=null;});
    canvas.addEventListener("pointerup",e=>{
      const bounds=canvas.getBoundingClientRect();
      if(drag&&!drag.moved){const l=pick(e.clientX-bounds.left,e.clientY-bounds.top);if(l)select(l.id)}
      drag=null;
    });
    canvas.addEventListener("keydown",e=>{
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"){center+=e.key==="ArrowRight"?15:-15;target=null;e.preventDefault()}
      if(e.key==="Home"){center=-36;target=null;e.preventDefault()}
    });
    byId("hostList")?.addEventListener("click",e=>{
      const b=e.target.closest("[data-host]");if(b){const l=locs.find(x=>x.id===b.dataset.host);if(l)target=l.lon;}
    });
    document.addEventListener("keydown",e=>{
      if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)||e.metaKey||e.ctrlKey||e.altKey)return;
      if(e.key==="h"||e.key==="H")byId("heartbeatButton")?.click();
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"){
        if(e.target===canvas)return;
        const current=locs.findIndex(x=>x.id===window.northstarSelectedHost?.());
        select(locs[(current+(e.key==="ArrowRight"?1:3))%4].id);e.preventDefault();
      }
    });
    requestAnimationFrame(frame);
  }

  if(document.body.classList.contains("theme-kestrel"))kestrelWorld();
  if(document.body.classList.contains("theme-aster"))asterWorld();
  if(document.body.classList.contains("theme-northstar"))northstarWorld();
})();