const fragments = [
  ['experienceSlot','experience.html'],
  ['projectsSlot','projects.html'],
  ['skillsSlot','skills.html'],
  ['aboutSlot','about.html'],
  ['contactSlot','contact.html']
];

const cases = {
  northstar: {
    kicker:'SYSTEMS / HYBRID CLOUD',
    title:'Northstar',
    text:'A hybrid-cloud server management platform built as a reusable control plane rather than a one-off dashboard. Host-side telemetry, server APIs, persistence, virtualization, cloud deployment, integration tests, and delivery all live in one measurable system.',
    list:[
      '100 simulated hosts managed through a C firmware telemetry module and C++ Linux agent',
      'Java server application with 12 documented REST/JSON endpoints over HTTP/TCP',
      'PostgreSQL persistence with Dockerized services and Python integration tests',
      'Deployment paths across KVM/Linux and AWS EC2, Elastic Beanstalk, and RDS with Git/Jenkins CI/CD'
    ]
  },
  relay: {
    kicker:'BACKEND / DISTRIBUTED DATA',
    title:'Relay',
    text:'A production-style event and analytics pipeline built to make failure handling part of the architecture instead of an afterthought.',
    list:[
      'Django API with a React/TypeScript client',
      'Kafka event backbone with Go workers and explicit backpressure',
      'MySQL for transactional state, ClickHouse for analytics, and Redis for low-latency access',
      'Retries, dead-letter handling, tracing, and Terraform/AWS infrastructure'
    ]
  },
  stinger: {
    kicker:'ROUTING / REAL-TIME TRANSIT',
    title:'GTStinger',
    text:'A multimodal Georgia Tech navigator built around arrival-time usefulness rather than static directions. It combines live transit data, calibration, personalized walking speeds, transfer buffers, failover, and offline behavior.',
    list:[
      'ETA mean absolute error reduced from 6.8 to 1.9 minutes across 300 campus routes',
      '99% valid-route rate with provider failover',
      '184 ms median route recomputation',
      'Offline caching and optimized routing graphs for graceful degradation'
    ]
  },
  lastride: {
    kicker:'PRODUCT / SHIPATON GRAND PRIZE',
    title:'LastRide',
    text:'A Japan-focused night-out companion that works backward from the last useful train. The product is designed around the moment a normal navigation app becomes least helpful: when the plan is about to fail.',
    list:[
      'Location-aware nearby station and route context',
      'Walking-time estimation and leave-by reminders',
      'Missed-train recovery alternatives instead of a dead-end warning',
      'Built with TypeScript, Expo, Mapbox, location services, and notifications; Shipaton Grand Prize, 1st of 52'
    ]
  },
  studyhub: {
    kicker:'LEADERSHIP / COLLABORATIVE PRODUCT',
    title:'Waseda Study Hub',
    text:'A student matching and study-discovery product developed in a five-person GDGoC Waseda team, spanning product flows, frontend implementation, backend integration, review, and release coordination.',
    list:[
      '1,200+ students and 3,500+ study connections',
      'Profiles, course/topic search, study-buddy discovery, study spots, and onboarding flows',
      'React/Next.js/TypeScript frontend with FastAPI/Firebase integration',
      'Reported 48% 8-week retention, 42% lower onboarding drop-off, and 99.9% uptime'
    ]
  }
};

async function loadFragments(){
  await Promise.all(fragments.map(async ([id,file]) => {
    const target = document.getElementById(id);
    const response = await fetch(file,{cache:'no-cache'});
    if(!response.ok) throw new Error(`${file}: ${response.status}`);
    target.innerHTML = await response.text();
  }));
}

function boot(){
  requestAnimationFrame(() => document.body.classList.add('loaded'));
  setTimeout(() => document.querySelector('.boot')?.remove(), 900);
}

function smoothLinks(){
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]');
    if(!a) return;
    const href=a.getAttribute('href');
    if(!href || href==='#') return;
    const target=document.querySelector(href);
    if(!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
}

function reveals(){
  const nodes=[...document.querySelectorAll('.reveal')];
  if(matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)){
    nodes.forEach(n=>n.classList.add('visible'));
    return;
  }
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  },{threshold:.08,rootMargin:'0px 0px -4% 0px'});
  nodes.forEach(n=>io.observe(n));
}

function activeNav(){
  const links=[...document.querySelectorAll('.nav a')];
  const map=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  const sections=[...map.keys()].map(id=>document.getElementById(id)).filter(Boolean);
  if(!sections.length || !('IntersectionObserver' in window)) return;
  const io=new IntersectionObserver(entries=>{
    const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible) return;
    links.forEach(a=>a.classList.toggle('active',a===map.get(visible.target.id)));
  },{rootMargin:'-22% 0px -62% 0px',threshold:[0,.1,.3,.6]});
  sections.forEach(s=>io.observe(s));
}

function pointerAtmosphere(){
  if(matchMedia('(pointer: coarse)').matches) return;
  addEventListener('pointermove',e=>{
    document.documentElement.style.setProperty('--mx',`${e.clientX}px`);
    document.documentElement.style.setProperty('--my',`${e.clientY}px`);
  },{passive:true});
}

function scrollProgress(){
  const update=()=>{
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    document.documentElement.style.setProperty('--scroll',Math.min(1,scrollY/max));
  };
  update();
  addEventListener('scroll',update,{passive:true});
  addEventListener('resize',update,{passive:true});
}

function sceneParallax(){
  const scene=document.getElementById('heroScene');
  if(!scene || matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const parts=[
    ['.scene-sign',.22],['.scene-terminal',.32],['.rack-a',.12],['.rack-b',.15],
    ['.rack-c',.08],['.lamp-a',.18],['.lamp-b',.11],['.label-a',.25],['.label-b',.2],['.label-c',.17]
  ].map(([selector,factor])=>[scene.querySelector(selector),factor]).filter(([node])=>node);
  scene.addEventListener('pointermove',e=>{
    const r=scene.getBoundingClientRect();
    const dx=(e.clientX-(r.left+r.width/2))/r.width*30;
    const dy=(e.clientY-(r.top+r.height/2))/r.height*24;
    parts.forEach(([node,f])=>node.style.translate=`${(dx*f).toFixed(2)}px ${(dy*f).toFixed(2)}px`);
  });
  scene.addEventListener('pointerleave',()=>parts.forEach(([node])=>node.style.translate='0 0'));
}

function magnetic(){
  if(matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.magnetic').forEach(el=>{
    el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2)*.08;
      const y=(e.clientY-r.top-r.height/2)*.12;
      el.style.translate=`${x}px ${y}px`;
    });
    el.addEventListener('pointerleave',()=>el.style.translate='0 0');
  });
}

function palette(){
  const modal=document.getElementById('palette');
  const shade=document.getElementById('shade');
  const open=()=>{
    shade.hidden=false;
    document.body.classList.add('modal-open');
    if(!modal.open) modal.showModal();
  };
  const close=()=>{
    if(modal.open) modal.close();
    shade.hidden=true;
    document.body.classList.remove('modal-open');
  };
  document.getElementById('cmd')?.addEventListener('click',open);
  document.getElementById('close')?.addEventListener('click',close);
  shade?.addEventListener('click',close);
  modal.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  addEventListener('keydown',e=>{
    const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
    if(e.key==='/' && !typing){
      e.preventDefault();
      open();
    }
    if(e.key==='Escape') close();
    if(modal.open && ['1','2','3','4'].includes(e.key)){
      const targets=['#experience','#projects','#skills','#about'];
      close();
      document.querySelector(targets[Number(e.key)-1])?.scrollIntoView({behavior:'smooth'});
    }
  });
}

function caseStudy(){
  const modal=document.getElementById('case');
  if(!modal) return;
  const close=()=>{if(modal.open) modal.close();document.body.classList.remove('modal-open')};
  modal.querySelector('.case-close')?.addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal) close()});
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-case]');
    if(!button) return;
    const item=cases[button.dataset.case];
    if(!item) return;
    document.getElementById('case-kicker').textContent=item.kicker;
    document.getElementById('case-title').textContent=item.title;
    document.getElementById('case-text').textContent=item.text;
    document.getElementById('case-list').innerHTML=item.list.map(v=>`<div><span>${v}</span></div>`).join('');
    document.body.classList.add('modal-open');
    modal.showModal();
  });
}

function projectFilters(){
  const controls=[...document.querySelectorAll('[data-filter]')];
  const projects=[...document.querySelectorAll('.project-row')];
  if(!controls.length) return;
  controls.forEach(button=>button.addEventListener('click',()=>{
    const filter=button.dataset.filter;
    controls.forEach(b=>b.classList.toggle('active',b===button));
    projects.forEach(project=>{
      const show=filter==='all' || project.dataset.tags?.split(/\s+/).includes(filter);
      if(show){
        project.hidden=false;
        requestAnimationFrame(()=>{project.style.opacity='1';project.style.transform='none'});
      }else{
        project.style.opacity='0';
        project.style.transform='translateY(8px)';
        setTimeout(()=>{if(button.classList.contains('active')) project.hidden=true},220);
      }
    });
  }));
}

function signalNode(){
  const node=document.getElementById('berry');
  const tip=document.getElementById('tip');
  if(!node || !tip) return;
  const lines=['Press / to jump anywhere.','Systems > screenshots.','Benchmark the failure mode.','Tokyo ⇄ Atlanta.','Make behavior measurable.'];
  let i=0,timer;
  node.addEventListener('click',()=>{
    i=(i+1)%lines.length;
    tip.querySelector('span').textContent=lines[i];
    tip.classList.add('show');
    clearTimeout(timer);
    timer=setTimeout(()=>tip.classList.remove('show'),2300);
  });
}

function network(){
  const canvas=document.getElementById('net');
  if(!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx=canvas.getContext('2d');
  let pts=[];
  let dpr=1;
  const resize=()=>{
    dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=innerWidth*dpr;
    canvas.height=innerHeight*dpr;
    canvas.style.width=`${innerWidth}px`;
    canvas.style.height=`${innerHeight}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.max(18,Math.min(42,Math.floor(innerWidth/42)));
    pts=Array.from({length:count},()=>({
      x:Math.random()*innerWidth,
      y:Math.random()*innerHeight,
      vx:(Math.random()-.5)*.12,
      vy:(Math.random()-.5)*.12
    }));
  };
  const frame=()=>{
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of pts){
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>innerWidth)p.vx*=-1;
      if(p.y<0||p.y>innerHeight)p.vy*=-1;
    }
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const a=pts[i],b=pts[j],dist=Math.hypot(a.x-b.x,a.y-b.y);
        if(dist<145){
          const alpha=(1-dist/145)*.12;
          ctx.strokeStyle=`rgba(139,92,255,${alpha})`;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }
    }
    for(const p of pts){
      ctx.fillStyle='rgba(88,232,255,.16)';
      ctx.beginPath();ctx.arc(p.x,p.y,1.1,0,Math.PI*2);ctx.fill();
    }
    requestAnimationFrame(frame);
  };
  resize();
  addEventListener('resize',resize,{passive:true});
  requestAnimationFrame(frame);
}

(async function init(){
  boot();
  pointerAtmosphere();
  scrollProgress();
  network();
  smoothLinks();
  palette();
  signalNode();
  sceneParallax();

  try{
    await loadFragments();
  }catch(error){
    console.error('Portfolio fragments failed to load:',error);
  }

  reveals();
  activeNav();
  caseStudy();
  projectFilters();
  magnetic();

  if(location.hash){
    requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView({block:'start'}));
  }
})();