/* Each visualization represents the demo's state. No idle effects or fake traffic. */
(() => {
  const $=id=>document.getElementById(id);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const fit=(c,ctx)=>{
    const r=c.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);
    const dpr=Math.min(devicePixelRatio||1,2);
    if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){
      c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {w,h};
  };
  const resize=(node,render)=>{
    if("ResizeObserver" in window)new ResizeObserver(render).observe(node);
    else addEventListener("resize",render);
  };

  function kestrel(){
    const canvas=$("kOrbitCanvas"),ctx=canvas?.getContext("2d");
    if(!ctx)return;
    const services=[
      ["gateway",-3.65,.45,0],["auth",-2.45,.72,-.35],["account",-1.3,.13,.28],
      ["order",-.12,.57,-.35],["inventory",1.12,.22,.45],["pricing",2.3,.74,-.3],
      ["payment",3.6,.26,.25],["notification",-1.7,-1.18,2.2],
      ["audit",.3,-1.1,2.6],["analytics",2.2,-1.12,2.2]
    ];
    const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,7],[3,8],[3,9]];
    let yaw=-.13,pitch=.27,hover=-1,selected=-1,drag=null,positions=[];
    const project=(x,y,z,w,h)=>{
      const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
      const rx=x*cy-z*sy,rz=x*sy+z*cy,ry=y*cp-rz*sp,depth=y*sp+rz*cp;
      const u=Math.min(w/9.8,74),persp=7/(7+depth*.22);
      return {x:w*.5+rx*u*persp,y:h*.53-ry*u*persp,scale:persp,depth};
    };
    const nodeState=name=>{
      const el=document.querySelector('[data-service="'+name+'"]');
      if(el?.classList.contains("failed"))return "failed";
      if(el?.classList.contains("active"))return "active";
      if(el?.classList.contains("success"))return "success";
      return "idle";
    };
    const color=(i)=>{
      const state=nodeState(services[i][0]);
      if(state==="failed")return "#FF9999";
      if(state==="active")return "#F6D083";
      if(state==="success")return "#9BDCB1";
      return "#B9C6D0";
    };
    const render=()=>{
      const {w,h}=fit(canvas,ctx);
      ctx.clearRect(0,0,w,h);
      // Perspective grid exists only to explain the graph's spatial orientation.
      for(let i=-4;i<=4;i++){
        const a=project(i,-1.6,-3.5,w,h),b=project(i,-1.6,4,w,h);
        ctx.strokeStyle="#334550";ctx.lineWidth=.8;ctx.beginPath();
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      for(let i=-3;i<=4;i++){
        const a=project(-5,-1.6,i,w,h),b=project(5,-1.6,i,w,h);
        ctx.strokeStyle="#334550";ctx.beginPath();
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      positions=services.map(s=>project(s[1],s[2],s[3],w,h));
      edges.forEach(([a,b])=>{
        const p=positions[a],q=positions[b];
        const isFailure=nodeState(services[b][0])==="failed";
        ctx.beginPath();ctx.moveTo(p.x,p.y);
        ctx.quadraticCurveTo((p.x+q.x)/2,(p.y+q.y)/2-15,q.x,q.y);
        ctx.strokeStyle=isFailure?"#FF9999":"#627683";
        ctx.lineWidth=isFailure?2:1.2;ctx.stroke();
      });
      services.map((_,i)=>i).sort((a,b)=>positions[b].depth-positions[a].depth).forEach(i=>{
        const p=positions[i],s=clamp(19*p.scale,13,24),current=i===selected||i===hover;
        ctx.beginPath();ctx.moveTo(p.x,p.y-s);
        ctx.lineTo(p.x+s*.9,p.y-s*.4);ctx.lineTo(p.x+s*.9,p.y+s*.5);
        ctx.lineTo(p.x,p.y+s);ctx.lineTo(p.x-s*.9,p.y+s*.5);
        ctx.lineTo(p.x-s*.9,p.y-s*.4);ctx.closePath();
        ctx.fillStyle=current?"#2A3B46":"#16242E";ctx.fill();
        ctx.lineWidth=current?2.5:1.5;ctx.strokeStyle=color(i);ctx.stroke();
        ctx.fillStyle=color(i);ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();
        ctx.font="500 11px 'IBM Plex Mono',monospace";
        ctx.fillStyle="#F2F5F6";ctx.textAlign="center";
        ctx.fillText(services[i][0],p.x,p.y+s+17);
        if(current){ctx.fillStyle="#F6D083";ctx.font="500 10px 'IBM Plex Sans',sans-serif";
          ctx.fillText(i<7?"request":"consumer",p.x,p.y+s+32);}
      });
    };
    const hit=(x,y)=>{
      let idx=-1,dist=32;positions.forEach((p,i)=>{
        const d=Math.hypot(p.x-x,p.y-y);if(d<dist){dist=d;idx=i}
      });return idx;
    };
    const choose=i=>{
      if(i<0)return;
      selected=i;render();
      const name=services[i][0];
      $("eventTitle").textContent=name+" / service";
      $("eventJSON").textContent="Select a trace event for "+name+" to view its recorded fields.";
      const row=[...document.querySelectorAll(".k-trace-row")]
        .find(el=>el.firstElementChild?.textContent===name);
      if(row)row.click();
    };
    canvas.addEventListener("pointerdown",e=>{
      drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove",e=>{
      if(drag){
        const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
        if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
        yaw+=dx*.0055;pitch=clamp(pitch+dy*.003,-.45,.75);
        drag.x=e.clientX;drag.y=e.clientY;
      }else{
        const r=canvas.getBoundingClientRect();
        hover=hit(e.clientX-r.left,e.clientY-r.top);
      }
      render();
    });
    canvas.addEventListener("pointerup",e=>{
      const r=canvas.getBoundingClientRect();
      if(drag&&!drag.moved)choose(hit(e.clientX-r.left,e.clientY-r.top));
      drag=null;
    });
    canvas.addEventListener("pointerleave",()=>{hover=-1;render()});
    canvas.addEventListener("keydown",e=>{
      if(e.key==="ArrowLeft"||e.key==="ArrowRight"){
        yaw+=(e.key==="ArrowLeft"?-.16:.16);e.preventDefault();
      }else if(e.key==="ArrowUp"||e.key==="ArrowDown"){
        pitch=clamp(pitch+(e.key==="ArrowUp"?-.12:.12),-.45,.75);e.preventDefault();
      }else if(e.key==="Home"){yaw=-.13;pitch=.27;e.preventDefault();}
      render();
    });
    $("kMotion")?.addEventListener("click",()=>{yaw=-.13;pitch=.27;render()});
    window.kestrelRenderGraph=render;
    resize(canvas,render);render();
  }

  function aster(){
    const stage=$("asterStage"),table=$("candidateTable");
    if(!stage||!table)return;
    let ranked=null,selected=null;
    const print=v=>Number.isFinite(v)?(v>=1000?Math.round(v).toLocaleString():v.toFixed(v<1?4:2)):"—";
    const render=()=>{
      const rows=[...table.querySelectorAll(".a-candidate")];
      const data=rows.map((row,i)=>{
        const name=row.querySelector(".a-candidate-name b")?.textContent||String(i);
        const cost=Number(row.querySelector('[data-key="postgres_cost"]')?.value)||0;
        const result=ranked?.find(x=>x.name===name);
        return {name,val:ranked&&result?result.score:cost,i};
      });
      const values=data.map(x=>x.val);
      const min=Math.min(...values),max=Math.max(...values),span=Math.max(.00001,max-min);
      $("asterStageMode").textContent=ranked?"RANKER SCORE":"INPUT COST";
      $("asterStageLabel").textContent=ranked?"Python score · lower wins":"Estimated cost · lower wins";
      stage.querySelector(".a-stage-platform").innerHTML=data.map(({name,val,i})=>{
        const height=Math.round(28+92*(val-min)/span);
        const winner=ranked&&selected===name;
        return '<button type="button" class="a-tower '+(winner?"active":"")+'"'
          +' data-plan="'+i+'" title="Edit plan inputs"'
          +' style="--tower-height:'+height+'px"><span class="tower-stack" aria-hidden="true"></span>'
          +'<strong>'+name.replace("postgres_default","pg_default")+'</strong>'
          +'<em>'+print(val)+'</em></button>';
      }).join("");
      stage.querySelectorAll("[data-plan]").forEach(btn=>btn.addEventListener("click",()=>{
        const target=rows[Number(btn.dataset.plan)]?.querySelector("input");
        target?.focus({preventScroll:true});
        target?.scrollIntoView({behavior:"auto",block:"center",inline:"center"});
      }));
    };
    table.addEventListener("input",()=>{
      ranked=null;selected=null;
      $("decisionTitle").textContent="Inputs changed";
      $("decisionReason").textContent="Run the ranker to update the result.";
      $("confidenceFill").style.transform="scaleX(0)";
      $("confidenceLabel").textContent="—";
      rowsReset();render();
    });
    const rowsReset=()=>{
      table.querySelectorAll(".a-candidate").forEach(row=>{
        row.classList.remove("winner");
        const score=row.querySelector("[data-score]");if(score)score.textContent="—";
      });
      document.querySelectorAll(".a-rank-step").forEach(step=>step.classList.remove("active"));
    };
    $("scenario")?.addEventListener("change",()=>{ranked=null;selected=null;queueMicrotask(render)});
    window.addEventListener("aster:result",e=>{
      ranked=e.detail.result.ranking;selected=e.detail.result.selected_plan;render();
    });
    render();
  }

  function northstar(){
    const canvas=$("nsGlobeCanvas"),ctx=canvas?.getContext("2d");
    if(!ctx)return;
    const locs=[
      {id:"h-atl-01",code:"ATL",lat:33.75,lon:-84.39},
      {id:"h-iad-02",code:"IAD",lat:38.95,lon:-77.45},
      {id:"h-nrt-01",code:"NRT",lat:35.77,lon:140.39},
      {id:"h-fra-03",code:"FRA",lat:50.04,lon:8.56}
    ];
    // Simplified outlines are a geographical locator, not a live satellite map.
    const land=[
      [[-169,64],[-150,70],[-129,61],[-126,49],[-117,32],[-105,25],[-96,15],[-83,9],[-79,25],[-66,44],[-63,51],[-82,62],[-105,72],[-137,73]],
      [[-81,13],[-75,5],[-80,-6],[-74,-16],[-70,-34],[-65,-55],[-52,-52],[-43,-23],[-35,-8],[-50,5],[-64,11]],
      [[-12,36],[-8,49],[1,56],[19,60],[29,68],[41,58],[38,44],[29,36],[12,35]],
      [[-17,35],[3,37],[23,31],[36,12],[50,12],[42,-12],[30,-34],[17,-35],[12,-19],[-1,-2],[-17,11]],
      [[33,35],[44,50],[64,57],[94,72],[129,70],[157,61],[147,45],[134,33],[120,26],[106,13],[95,7],[76,7],[68,20],[51,18]],
      [[112,-11],[131,-12],[152,-24],[152,-37],[135,-42],[115,-30]],
      [[-53,80],[-40,82],[-20,75],[-45,61],[-58,66]]
    ];
    let center=-36,drag=null,markers=[];
    const projection=(lat,lon,w,h)=>{
      const R=Math.min(w*.3,h*.445),cX=w*.5,cY=h*.53;
      const la=lat*Math.PI/180,lo=(lon-center)*Math.PI/180,tilt=15*Math.PI/180;
      const z=Math.sin(tilt)*Math.sin(la)+Math.cos(tilt)*Math.cos(la)*Math.cos(lo);
      return {x:cX+R*Math.cos(la)*Math.sin(lo),
        y:cY-R*(Math.cos(tilt)*Math.sin(la)-Math.sin(tilt)*Math.cos(la)*Math.cos(lo)),
        z,R,cX,cY};
    };
    const line=(coords,color,width,w,h)=>{
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();let started=false;
      for(const [lon,lat] of coords){
        const p=projection(lat,lon,w,h);
        if(p.z>0){if(started)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);started=true;}
        else started=false;
      }
      ctx.stroke();
    };
    const render=()=>{
      const {w,h}=fit(canvas,ctx);
      ctx.clearRect(0,0,w,h);
      const {R,cX,cY}=projection(0,0,w,h);
      ctx.fillStyle="#1D303B";ctx.beginPath();ctx.arc(cX,cY,R,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(cX,cY,R,0,Math.PI*2);ctx.clip();
      for(let lat=-75;lat<=75;lat+=15){
        const coords=[];for(let lon=-180;lon<=180;lon+=3)coords.push([lon,lat]);
        line(coords,"#435B65",.8,w,h);
      }
      for(let lon=-180;lon<180;lon+=20){
        const coords=[];for(let lat=-90;lat<=90;lat+=3)coords.push([lon,lat]);
        line(coords,"#435B65",.8,w,h);
      }
      land.forEach(poly=>line(poly.concat([poly[0]]),"#91A1A6",1.25,w,h));
      ctx.restore();
      ctx.strokeStyle="#A9B6B8";ctx.lineWidth=1;ctx.beginPath();
      ctx.arc(cX,cY,R,0,Math.PI*2);ctx.stroke();
      markers=[];
      const online=window.northstarIsHostOnline||(()=>true);
      locs.forEach(loc=>{
        const p=projection(loc.lat,loc.lon,w,h);if(p.z<=0)return;
        const chosen=window.northstarSelectedHost?.()===loc.id,ok=online(loc.id);
        markers.push({...loc,...p});
        if(chosen){
          ctx.strokeStyle="#F4C77A";ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.stroke();
        }
        ctx.fillStyle=ok?"#F4C77A":"#FFA19A";ctx.beginPath();
        ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#F4F5F0";ctx.font="600 11px 'IBM Plex Mono',monospace";
        ctx.textAlign="left";ctx.fillText(loc.code,p.x+14,p.y-8);
      });
    };
    const hit=(x,y)=>{
      let result=null,best=26;
      for(const p of markers){
        const d=Math.hypot(x-p.x,y-p.y);if(d<best){best=d;result=p;}
      }
      return result;
    };
    const select=id=>{
      window.northstarSelectHost?.(id);
      const loc=locs.find(l=>l.id===id);
      if(loc)center=loc.lon;render();
    };
    canvas.addEventListener("pointerdown",e=>{
      drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove",e=>{
      if(!drag)return;
      const dx=e.clientX-drag.x;
      if(Math.abs(dx)+Math.abs(e.clientY-drag.y)>2)drag.moved=true;
      center-=dx*.45;drag.x=e.clientX;drag.y=e.clientY;render();
    });
    canvas.addEventListener("pointerup",e=>{
      if(drag&&!drag.moved){
        const r=canvas.getBoundingClientRect();
        const marker=hit(e.clientX-r.left,e.clientY-r.top);
        if(marker)select(marker.id);
      }
      drag=null;
    });
    canvas.addEventListener("keydown",e=>{
      if(e.key==="ArrowLeft"||e.key==="ArrowRight"){
        center+=e.key==="ArrowLeft"?-15:15;e.preventDefault();render();
      }else if(e.key==="Home"){center=-36;e.preventDefault();render();}
    });
    $("nsMotion")?.addEventListener("click",()=>{center=-36;render()});
    $("hostList")?.addEventListener("click",e=>{
      const row=e.target.closest("[data-host]");
      if(row){const loc=locs.find(l=>l.id===row.dataset.host);if(loc){center=loc.lon;render()}}
    });
    window.northstarRenderMap=render;
    resize(canvas,render);render();
  }

  if(document.body.classList.contains("theme-kestrel"))kestrel();
  if(document.body.classList.contains("theme-aster"))aster();
  if(document.body.classList.contains("theme-northstar"))northstar();
})();