import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];
const canvas = $('#world');
const drawer = $('#drawer');
const drawerContent = $('#drawerContent');
const drawerIndex = $('#drawerIndex');
const drawerKicker = $('#drawerKicker');
const hoverLabel = $('#hoverLabel');
const zoneName = $('#zoneName');
const hint = $('#interactionHint');
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = matchMedia('(pointer: coarse)').matches;

const PANELS = {
  projects: {
    index:'01', kicker:'PROJECT ARCHIVE', zone:'PROJECTS ALLEY',
    html:`
      <div class="panel-intro"><span class="kicker">BUILT / BENCHMARKED / SHIPPED</span><h2>Projects as systems,<br>not screenshots.</h2><p>Different constraints, same rule: make the behavior measurable. The major projects below each emphasize architecture, failure modes, and observed results.</p></div>
      <article class="project-feature"><div class="project-label"><span>P01 / SYSTEMS + CLOUD</span><em>2026</em></div><h3>Northstar</h3><p>Hybrid-cloud server management for 100 simulated hosts, joining C firmware telemetry, a C++ Linux agent, Java control plane, REST/JSON services over HTTP/TCP, PostgreSQL, Docker, KVM, AWS, and Jenkins delivery.</p><div class="record-metrics"><span><b>100</b>hosts</span><span><b>12</b>endpoints</span><span><b>2</b>deploy targets</span></div><footer><span>C/C++ · Java · PostgreSQL · Docker · AWS · Jenkins</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>P02 / DISTRIBUTED SYSTEMS</span><em>2026</em></div><h3>Kestrel</h3><p>A Linux distributed-systems flight recorder that joins application traces with low-level runtime and network evidence for deterministic failure replay.</p><div class="record-metrics"><span><b>97%</b>failures replayed</span><span><b>25k+</b>req/s</span><span><b>&lt;4.2%</b>p95 overhead</span><span><b>−85%</b>root-cause time</span></div><footer><span>Go · Rust/eBPF · gRPC · OpenTelemetry</span><a href="https://github.com/yjr28/kestrel-replay" target="_blank" rel="noreferrer">GITHUB ↗</a></footer></article>
      <article class="project-feature"><div class="project-label"><span>P03 / DATABASES + ML</span><em>2026</em></div><h3>Aster</h3><p>A learned PostgreSQL query-plan ranker trained on 180k+ plans with uncertainty-aware fallback and a focus on keeping model-selection overhead low.</p><div class="record-metrics"><span><b>180k+</b>plans</span><span><b>2.34×</b>geo-mean</span><span><b>−41%</b>p95</span><span><b>&lt;7 ms</b>selection</span></div><footer><span>PostgreSQL · Graph ML · PyTorch · Evaluation</span><a href="https://github.com/yjr28/aster-pg-optimizer" target="_blank" rel="noreferrer">GITHUB ↗</a></footer></article>
      <article class="project-feature"><div class="project-label"><span>P04 / ROUTING + PRODUCT</span><em>2026 —</em></div><h3>GTStinger</h3><p>A multimodal Georgia Tech navigator built around useful arrival estimates rather than static directions: GTFS-Realtime, calibration, personalized walking speeds, transfer buffers, provider failover, and offline behavior.</p><div class="record-metrics"><span><b>−72%</b>ETA MAE</span><span><b>99%</b>valid routes</span><span><b>184 ms</b>recompute</span></div><footer><span>GTFS-RT · Routing graphs · Offline cache · Failover</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>P05 / DISTRIBUTED ROUTING + MOBILE</span><em>🏆 SHIPATON</em></div><h3>LastRide</h3><p>A deadline-constrained routing system for the latest safe departure home: the Expo client streams foreground/background location, evaluates nearby stations and walking paths concurrently, and continuously replans through Go services backed by PostgreSQL/PostGIS, Redis, Kafka, WebSockets, and gRPC. The execution layer adds idempotent workers, bounded retry/backoff, stale-update protection, recovery routes, OpenTelemetry/Prometheus observability, Dockerized CI, and k6 horizontal-load testing.</p><div class="record-metrics"><span><b>1st / 52</b>Shipaton</span><span><b>PostGIS</b>geospatial state</span><span><b>Kafka</b>replanning</span><span><b>WebSockets</b>live updates</span></div><footer><span>TypeScript · React Native/Expo · Go · PostgreSQL/PostGIS · Redis · Kafka · gRPC</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>P06 / COLLABORATIVE PRODUCT</span><em>2026 —</em></div><h3>Waseda Study Hub</h3><p>Student matching and study discovery across profiles, course/topic search, study-buddy discovery, study spots, onboarding, and FastAPI/Firebase integration.</p><div class="record-metrics"><span><b>1,200+</b>students</span><span><b>3,500+</b>connections</span><span><b>48%</b>8-week retention</span></div><footer><span>Next.js · TypeScript · FastAPI · Firebase</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>P07 / BACKEND PIPELINE</span><em>2026</em></div><h3>Relay</h3><p>A production-style event and analytics pipeline with a Django API, React/TypeScript client, Kafka event backbone, Go workers, MySQL, ClickHouse, Redis, tracing, retries, dead-letter handling, and Terraform/AWS infrastructure.</p><footer><span>Django · Kafka · Go · ClickHouse · Redis · Terraform</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>P08 / SCIENTIFIC ML + EVALUATION</span><em>2026</em></div><h3>BioHub Cell Tracking</h3><p>A reproducible competition-research system for developmental cell tracking, built around the pinned organizer evaluator, leave-one-embryo-out validation, immutable experiment manifests, provenance checks, and exact fold reporting so model comparisons cannot silently mix data, code, or scoring states.</p><div class="record-metrics"><span><b>Official</b>evaluator pinned</span><span><b>LOEO</b>validation</span><span><b>Fail-closed</b>provenance</span></div><footer><span>Python · Experiment tracking · Validation design · Evaluation tooling</span><a href="https://github.com/yjr28/biohub" target="_blank" rel="noreferrer">GITHUB ↗</a></footer></article>
      <article class="project-feature"><div class="project-label"><span>P09 / AUTOMATION + PRODUCT</span><em>PRIVATE BUILD</em></div><h3>ScholarshipOS</h3><p>A local-first scholarship discovery and application workflow that treats aggregators as leads, resolves opportunities to official sponsor evidence, applies fail-closed eligibility rules, ranks opportunities by value and effort, and keeps applicant documents and profile data outside the repository.</p><div class="record-metrics"><span><b>Local</b>SQLite state</span><span><b>SHA-256</b>change detection</span><span><b>0</b>extension permissions</span></div><footer><span>Python · SQLite · Crawling · Rule engine · Chrome MV3 · CI</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>P10 / GEOSPATIAL + EVIDENCE SYSTEMS</span><em>PRIVATE PROTOTYPE</em></div><h3>PaddyProof</h3><p>A ground-truth-adaptive AWD evidence QA prototype that reconciles field observations with multi-sensor SAR, surfaces uncertainty instead of hiding it, dispatches new ground-truth work where evidence is weakest, and exports provenance-backed evidence packets.</p><div class="record-metrics"><span><b>AWD</b>cycle detection</span><span><b>SAR ↔ ground</b>reconciliation</span><span><b>Synthetic</b>demo data</span></div><footer><span>Python · Remote sensing · Uncertainty · Provenance · LoRa-style ingestion</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>P11 / AGENTIC AUTOMATION</span><em>PRIVATE BUILD</em></div><h3>Hackathon Factory</h3><p>A persistent control plane for an autonomous hackathon pipeline: discover and rank opportunities, research official rules, generate and red-team ideas, build and deploy, prepare submission assets, enforce compliance gates, and resume work from durable state instead of starting each run from scratch.</p><div class="record-metrics"><span><b>Persistent</b>run state</span><span><b>Human-only</b>consent gates</span><span><b>CI</b>state validation</span></div><footer><span>Python · Agent orchestration · State machines · GitHub Actions · Compliance gates</span></footer></article>
      <article class="project-feature"><div class="project-label"><span>LAB / RESEARCH ARCHIVE</span><em>12—14</em></div><h3>Engineering experiments</h3><p>Edge inference compression with INT8/pruning benchmarks; change-point detection benchmarking across varied data conditions; and chronology-safe investment research designed to defend against look-ahead bias.</p><footer><span>PyTorch · Quantization · Statistical evaluation · Data provenance</span></footer></article>
    `
  },
  experience: {
    index:'02', kicker:'PRODUCTION + LEADERSHIP', zone:'PRODUCTION BAY',
    html:`
      <div class="panel-intro"><span class="kicker">WORK THAT HAD TO SURVIVE CONTACT WITH REALITY</span><h2>Experience.</h2><p>I care about the full path from architecture to rollout: interfaces, data correctness, deployment, observability, and the humans who depend on the system.</p></div>
      <div class="record-list">
        <article class="record"><div class="record-index">E01</div><div class="record-body"><div class="record-head"><div><small>SOFTWARE ENGINEERING INTERN</small><h3>Green Carbon, Inc.</h3></div><span>MAY 2026 — PRESENT<br>TOKYO, JAPAN</span></div><p>Backend systems, cloud migration, internal tooling, and operational workflows for data-heavy carbon-project work.</p><div class="record-metrics"><span><b>−81%</b>monthly report prep</span><span><b>250k+</b>records/day</span><span><b>1,200+</b>automated tests</span><span><b>14</b>permission-scoped tools</span><span><b>8</b>backend modules</span></div><p>Led a four-person Apps Script → containerized AWS migration across five countries and 50+ users; refactored ingestion/reconciliation into idempotent services with tracing and parity gates; and built a secure MCP gateway with project RBAC and PII-safe handling.</p><div class="tech-line">AWS · Docker · Python · PostgreSQL · REST/JSON · RBAC · MCP · CI/CD</div></div></article>
        <article class="record"><div class="record-index">E02</div><div class="record-body"><div class="record-head"><div><small>GDG ON CAMPUS — WASEDA</small><h3>Waseda Study Hub</h3></div><span>2026 — PRESENT<br>TOKYO, JAPAN</span></div><p>Engineering and team contribution across student matching, discovery, onboarding, responsive product flows, backend integration, review, and release coordination.</p><div class="record-metrics"><span><b>5</b>engineers</span><span><b>1,200+</b>students</span><span><b>3,500+</b>connections</span><span><b>48%</b>8-week retention</span><span><b>99.9%</b>reported uptime</span></div><p>Worked across Git reviews, API-contract discussions, Next.js/TypeScript implementation, FastAPI/Firebase integration, and handoffs. The work gradually pulled me from frontend-only contribution toward backend and systems ownership.</p><div class="tech-line">Next.js · TypeScript · React · FastAPI · Firebase · Git</div></div></article>
      </div>
    `
  },
  stack: {
    index:'03', kicker:'ENGINEERING WORKBENCH', zone:'TOOL RACK',
    html:`
      <div class="panel-intro"><span class="kicker">TOOLS FROM THE PROBLEM BACKWARD</span><h2>Working set.</h2><p>Not a logo wall. These are the technologies I use to move from low-level behavior to reliable services to usable products.</p></div>
      <div class="stack-bank">
        <div class="stack-row"><b>LANGUAGES</b><div><span>C</span><span>C++</span><span>Java</span><span>Go</span><span>Python</span><span>TypeScript</span><span>Rust</span><span>SQL</span></div></div>
        <div class="stack-row"><b>BACKEND + SYSTEMS</b><div><span>Linux</span><span>REST/JSON</span><span>gRPC</span><span>PostgreSQL</span><span>Redis</span><span>Kafka</span><span>eBPF</span><span>OpenTelemetry</span><span>Networking</span></div></div>
        <div class="stack-row"><b>CLOUD + DELIVERY</b><div><span>AWS</span><span>Docker</span><span>Kubernetes</span><span>Terraform</span><span>Jenkins</span><span>Git</span><span>CI/CD</span><span>KVM</span></div></div>
        <div class="stack-row"><b>PRODUCT</b><div><span>React</span><span>Next.js</span><span>FastAPI</span><span>Django</span><span>Firebase</span><span>Expo</span><span>Mapbox</span><span>GTFS-RT</span></div></div>
        <div class="stack-row"><b>ML + EVALUATION</b><div><span>PyTorch</span><span>scikit-learn</span><span>Graph ML</span><span>Quantization</span><span>Pruning</span><span>Benchmarking</span><span>Adversarial testing</span></div></div>
        <div class="stack-row"><b>LANGUAGES SPOKEN</b><div><span>English — Native</span><span>Japanese — Native</span><span>Korean — Fluent</span></div></div>
      </div>
    `
  },
  about: {
    index:'04', kicker:'TOKYO ⇄ ATLANTA', zone:'TRANSIT PLATFORM',
    html:`
      <div class="panel-intro"><span class="kicker">BACKGROUND / ROUTE</span><h2>Tokyo foundation.<br>Atlanta year.</h2><p>I’m most interested in engineering where software architecture, performance, and real user constraints collide.</p></div>
      <div class="route-map">
        <article class="route-stop"><small>BASE / TOKYO</small><h3>Waseda University</h3><p>B.Eng. · Computer Science & Communications Engineering</p><b>Graduating Sep 2028</b></article>
        <article class="route-stop"><small>EXCHANGE / ATLANTA</small><h3>Georgia Institute of Technology</h3><p>Computer Science exchange</p><b>Aug 2026 — May 2027</b></article>
      </div>
      <div class="panel-intro"><span class="kicker">SELECTED SIGNALS</span><h2>Honors.</h2></div>
      <div class="award-line"><span>2026</span><b>Shipaton Grand Prize</b><em>1st / 52</em></div>
      <div class="award-line"><span>2025</span><b>Korea × Japan SW-AI Hackathon</b><em>Special Award</em></div>
      <div class="award-line"><span>2026</span><b>Home Credit Default Risk</b><em>16 / 1,842 · top 0.9%</em></div>
    `
  },
  contact: {
    index:'05', kicker:'OPEN CHANNEL', zone:'EXIT TERMINAL',
    html:`
      <div class="contact-block"><span class="kicker">SUMMER 2027</span><h2>BUILD SOMETHING<br><span>THAT HOLDS UP.</span></h2><p>I’m looking for software engineering opportunities across backend systems, infrastructure, distributed software, and ML engineering.</p><div class="contact-actions"><a href="mailto:yryu43@gatech.edu"><span>EMAIL</span><b>yryu43@gatech.edu ↗</b></a><a href="https://github.com/yjr28" target="_blank" rel="noreferrer"><span>GITHUB</span><b>github.com/yjr28 ↗</b></a><a href="https://www.linkedin.com/in/youngjun-ryu-845618256/" target="_blank" rel="noreferrer"><span>LINKEDIN</span><b>youngjun-ryu ↗</b></a><a href="resume.html" target="_blank"><span>RESUME</span><b>OPEN ↗</b></a></div></div>
    `
  }
};

const renderer = new THREE.WebGLRenderer({canvas, antialias:!coarsePointer, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarsePointer ? 1.35 : 1.8));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030107);
scene.fog = new THREE.FogExp2(0x05020b, coarsePointer ? 0.045 : 0.034);

const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, .1, 80);
const root = new THREE.Group();
scene.add(root);

const homeView = {yaw:.36,pitch:.25,distance:14.2,target:new THREE.Vector3(.7,2.25,0)};
const view = {yaw:homeView.yaw,pitch:homeView.pitch,distance:homeView.distance,target:homeView.target.clone()};
const desired = {yaw:view.yaw,pitch:view.pitch,distance:view.distance,target:view.target.clone()};
const focusViews = {
  projects:{yaw:.53,pitch:.23,distance:11.5,target:new THREE.Vector3(-1.1,2.25,-.3)},
  experience:{yaw:-.26,pitch:.24,distance:10.8,target:new THREE.Vector3(2.6,2.2,-.5)},
  stack:{yaw:.18,pitch:.36,distance:10.7,target:new THREE.Vector3(1.5,3.15,-1.6)},
  about:{yaw:.05,pitch:.17,distance:11.6,target:new THREE.Vector3(.8,1.55,.9)},
  contact:{yaw:-.48,pitch:.25,distance:11.4,target:new THREE.Vector3(3.2,2.2,.55)}
};

function box(w,h,d,color,metal=.18,rough=.68){
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough}));
}
function cyl(r,h,color,segments=20){
  return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.15}));
}
function add(parent,...objects){objects.forEach(o=>parent.add(o));return objects.at(-1)}
function textTexture(text,{w=1024,h=256,fg='#ffffff',bg='rgba(0,0,0,0)',font=120,weight=900,align='center',family='monospace'}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.clearRect(0,0,w,h);if(bg!=='transparent'){x.fillStyle=bg;x.fillRect(0,0,w,h)}
  x.fillStyle=fg;x.font=`${weight} ${font}px ${family}`;x.textAlign=align;x.textBaseline='middle';
  x.shadowColor=fg;x.shadowBlur=24;const tx=align==='left'?36:align==='right'?w-36:w/2;x.fillText(text,tx,h/2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;
}
function textPlane(text,width,height,opts={}){
  const mat=new THREE.MeshBasicMaterial({map:textTexture(text,opts),transparent:true,depthWrite:false,toneMapped:false});
  return new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
}
function neonMaterial(color,intensity=2.2){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.34,metalness:.15})}

scene.add(new THREE.HemisphereLight(0x6b5cff,0x120318,.72));
const key = new THREE.DirectionalLight(0x9e86ff,1.1);key.position.set(-5,10,8);scene.add(key);
const magentaLight = new THREE.PointLight(0xff36b2,38,14,2);magentaLight.position.set(-2.5,3.4,3.2);scene.add(magentaLight);
const cyanLight = new THREE.PointLight(0x48e9ff,32,12,2);cyanLight.position.set(4.1,4.1,1.5);scene.add(cyanLight);
const violetLight = new THREE.PointLight(0x7c48ff,28,11,2);violetLight.position.set(1,5,-3);scene.add(violetLight);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(44,32),new THREE.MeshStandardMaterial({color:0x0a0710,roughness:.32,metalness:.38}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.03;root.add(ground);
const grid = new THREE.GridHelper(38,38,0x3c2461,0x18101f);grid.position.y=.01;grid.material.opacity=.28;grid.material.transparent=true;root.add(grid);

// Main cyberpunk systems stall.
const shop = new THREE.Group();shop.position.set(1.6,0,-.35);root.add(shop);
const shopBase=box(5.5,.4,3.2,0x140a20,.25,.5);shopBase.position.y=.2;shop.add(shopBase);
const backWall=box(5.25,3.2,.28,0x0c0712,.15,.78);backWall.position.set(0,2,-1.27);shop.add(backWall);
const counter=box(5.15,.32,1.05,0x2b1535,.2,.55);counter.position.set(0,1.05,1);shop.add(counter);
const counterGlow=box(4.85,.07,.07,0xff3fb9,.1,.25);counterGlow.material=neonMaterial(0xff3fb9,3.3);counterGlow.position.set(0,1.23,1.52);shop.add(counterGlow);
const roof=box(5.7,.24,3.1,0x241034,.3,.5);roof.position.set(0,3.78,0);roof.rotation.z=-.025;shop.add(roof);
for(let i=-2;i<=2;i++){
  const strip=box(.82,.11,3.22,i%2===0?0x5c2b83:0x35134f,.18,.5);strip.position.set(i*.96,3.72,0);strip.rotation.z=-.025;shop.add(strip);
}

const mainSign=box(4.6,1,.22,0x120720,.15,.48);mainSign.position.set(0,4.48,.36);mainSign.material=new THREE.MeshStandardMaterial({color:0x170923,emissive:0x3c0e51,emissiveIntensity:1.3,roughness:.42});shop.add(mainSign);
const mainText=textPlane('YJ SYSTEMS LAB',4.15,.66,{fg:'#ff7ad5',font:104,weight:950});mainText.position.set(0,4.49,.49);shop.add(mainText);
const subtitle=textPlane('BACKEND  /  INFRA  /  ML  /  PRODUCT',3.6,.23,{fg:'#62efff',font:51,weight:800});subtitle.position.set(0,4.12,.5);shop.add(subtitle);

// Workstation monitors.
function monitor(x,y,z,w,h,label,accent){
  const g=new THREE.Group();g.position.set(x,y,z);
  const frame=box(w+.16,h+.16,.18,0x07040b,.35,.4);g.add(frame);
  const screen=box(w,h,.03,0x050509,.05,.3);screen.position.z=.105;screen.material=new THREE.MeshStandardMaterial({color:0x050509,emissive:accent,emissiveIntensity:.32,roughness:.4});g.add(screen);
  const txt=textPlane(label,w*.84,h*.5,{fg:accent===0xff3fb9?'#ff7ad5':'#6aeeff',font:72,weight:850});txt.position.z=.125;g.add(txt);
  const stem=box(.12,.48,.12,0x17101b,.45,.4);stem.position.y=-(h/2+.28);g.add(stem);
  const foot=box(.62,.07,.32,0x17101b,.45,.4);foot.position.y=-(h/2+.51);g.add(foot);
  shop.add(g);return g;
}
const monitorA=monitor(-.72,2.67,1.05,2.15,1.18,'SYSTEM STATUS',0x57ecff);
const monitorB=monitor(1.15,2.08,1.16,1.2,.7,'25K REQ/S',0xff3fb9);

// Server racks on shop right.
const rackGroup=new THREE.Group();rackGroup.position.set(2.05,1.12,-.65);shop.add(rackGroup);
for(let r=0;r<3;r++){
  const rack=box(.78,2.25,.7,0x0a0710,.5,.35);rack.position.set(r*.86,1.35,0);rackGroup.add(rack);
  for(let j=0;j<6;j++){
    const blade=box(.59,.19,.05,0x15101a,.45,.35);blade.position.set(r*.86,2.05-j*.31,.37);rackGroup.add(blade);
    const led=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),neonMaterial((j+r)%3===0?0x57ecff:(j+r)%3===1?0xff3fb9:0xb7ff75,2.8));led.position.set(r*.86-.22,2.05-j*.31,.405);rackGroup.add(led);
  }
}

// Keyboard / bowls / desk objects to preserve the playful workshop feel.
const keyboard=box(1.05,.05,.38,0x17101d,.25,.5);keyboard.position.set(-.55,1.26,1.27);keyboard.rotation.x=-.08;shop.add(keyboard);
for(const x of [-1.82,1.78]){const mug=cyl(.16,.28,0x6a255b,18);mug.position.set(x,1.36,1.15);shop.add(mug)}
for(const x of [-1.15,.45]){const stoolTop=cyl(.34,.12,0x5a274b,22);stoolTop.position.set(x,.66,1.63);shop.add(stoolTop);const leg=cyl(.08,.65,0x19101e,12);leg.position.set(x,.33,1.63);shop.add(leg)}

// Hanging neon lamps.
const animated=[];
function lantern(x,z,color,phase){
  const g=new THREE.Group();g.position.set(x,4.55,z);root.add(g);
  const cable=box(.035,2.2,.035,0x1a1025,.3,.5);cable.position.y=1.08;g.add(cable);
  const cap=cyl(.32,.24,0x24102d,18);cap.position.y=-.02;g.add(cap);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.43,24,18),new THREE.MeshStandardMaterial({color:0xffffff,emissive:color,emissiveIntensity:4.5,roughness:.15}));bulb.position.y=-.43;g.add(bulb);
  const light=new THREE.PointLight(color,31,7,2);light.position.y=-.43;g.add(light);
  animated.push({type:'lantern',group:g,phase});
  return g;
}
lantern(-3.15,1.8,0xff3fb9,0);
lantern(-1.4,1.35,0x8e5cff,1.3);
lantern(5.2,.4,0x57ecff,2.1);

// Overhead utility cables + moving packets.
function cable(points,color){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.035,7,false),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.8,roughness:.52}));root.add(tube);
  const packets=[];
  for(let i=0;i<5;i++){
    const p=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),neonMaterial(color,4));root.add(p);packets.push({mesh:p,offset:i/5});
  }
  animated.push({type:'packets',curve,packets,speed:.035+Math.random()*.025});
  return curve;
}
cable([[-4,6,-2],[-2,6.8,-1],[1.2,6.3,-2.4],[4.8,7.1,-1.6]],0x8b5cff);
cable([[-3.5,5.5,-3],[0,5.2,-2],[3.4,5.8,-3],[6,5.1,-2]],0x57ecff);

// Navigation signpost — the primary 3D UI.
const interactives=[];
function signMesh(label,section,color,width=2.25){
  const g=new THREE.Group();
  const bg=box(width,.48,.14,0x13091e,.2,.45);bg.material=new THREE.MeshStandardMaterial({color:0x13091e,emissive:color,emissiveIntensity:.55,roughness:.48});
  bg.userData={section,label,baseIntensity:.55,kind:'sign'};interactives.push(bg);g.add(bg);
  const text=textPlane(label,width*.88,.3,{fg:`#${new THREE.Color(color).getHexString()}`,font:92,weight:950});text.position.z=.081;g.add(text);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.24,.42,3),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.8,roughness:.35}));tip.rotation.z=-Math.PI/2;tip.position.x=width/2+.18;g.add(tip);
  return g;
}
const signpost=new THREE.Group();signpost.position.set(-3.55,0,.15);signpost.rotation.y=.08;root.add(signpost);
const post=box(.12,4.45,.12,0x20102a,.4,.45);post.position.y=2.2;signpost.add(post);
const signDefs=[
  ['PROJECTS','projects',0xff3fb9,3.25,2.05, .02],
  ['EXPERIENCE','experience',0x8a5cff,2.72,1.88,-.035],
  ['STACK','stack',0x57ecff,2.2,1.58,.025],
  ['ABOUT','about',0xb7ff75,1.68,1.95,-.02],
  ['CONTACT','contact',0xffc85f,1.18,1.72,.03]
];
signDefs.forEach(([label,section,color,y,width,rz])=>{const s=signMesh(label,section,color,width);s.position.set(.12,y,0);s.rotation.z=rz;signpost.add(s)});

// Side billboards add world identity.
function billboard(text,sub,x,y,z,rotationY,color){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotationY;root.add(g);
  const plate=box(2.6,1.35,.12,0x0c0613,.3,.45);plate.material=new THREE.MeshStandardMaterial({color:0x0c0613,emissive:color,emissiveIntensity:.28,roughness:.5});g.add(plate);
  const t=textPlane(text,2.25,.55,{fg:`#${new THREE.Color(color).getHexString()}`,font:86,weight:900});t.position.z=.07;t.position.y=.2;g.add(t);
  const s=textPlane(sub,2.1,.24,{fg:'#8f819c',font:44,weight:750});s.position.set(0,-.32,.071);g.add(s);
  return g;
}
billboard('TOKYO ⇄ ATLANTA','WASEDA  /  GEORGIA TECH',5.4,2.9,-2.4,-.65,0x57ecff);
billboard('250K+ / DAY','PRODUCTION DATA FLOW',-5.4,2.15,-2.2,.65,0xff3fb9);

// Small floor labels and props.
const floorLabel=textPlane('YOUNGJUN RYU  —  SOFTWARE ENGINEER',5.4,.5,{fg:'#b8a8c8',font:55,weight:850});floorLabel.rotation.x=-Math.PI/2;floorLabel.rotation.z=.08;floorLabel.position.set(2.6,.025,3.2);root.add(floorLabel);
for(let i=0;i<12;i++){
  const crate=box(.42+Math.random()*.28,.35+Math.random()*.5,.42+Math.random()*.28,0x12091a,.25,.72);crate.position.set(-6+Math.random()*12,.18+crate.geometry.parameters.height/2,-4+Math.random()*1.6);crate.rotation.y=Math.random();root.add(crate);
}

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2(2,2);
let hovered=null, dragging=false, moved=false, downX=0, downY=0, lastX=0, lastY=0;

function updatePointer(e){
  const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;
}
function hitTest(){
  raycaster.setFromCamera(pointer,camera);
  return raycaster.intersectObjects(interactives,false)[0]?.object || null;
}
function setHover(next,e){
  if(hovered===next) return;
  if(hovered){hovered.material.emissiveIntensity=hovered.userData.baseIntensity;hovered.scale.setScalar(1)}
  hovered=next;
  if(hovered){
    hovered.material.emissiveIntensity=2.2;hovered.scale.setScalar(1.035);canvas.style.cursor='pointer';
    hoverLabel.hidden=false;hoverLabel.textContent=`OPEN ${hovered.userData.label}`;
  }else{canvas.style.cursor=dragging?'grabbing':'grab';hoverLabel.hidden=true}
  if(e){hoverLabel.style.left=`${Math.min(innerWidth-150,e.clientX+16)}px`;hoverLabel.style.top=`${Math.min(innerHeight-40,e.clientY+14)}px`}
}

canvas.addEventListener('pointerdown',e=>{
  dragging=true;moved=false;downX=lastX=e.clientX;downY=lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor='grabbing';hint.classList.add('hide');
});
canvas.addEventListener('pointermove',e=>{
  updatePointer(e);
  if(dragging){
    const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)>6)moved=true;
    desired.yaw=THREE.MathUtils.clamp(desired.yaw-dx*.0045,-.92,.95);
    desired.pitch=THREE.MathUtils.clamp(desired.pitch+dy*.0034,.08,.58);
    setHover(null,e);
  }else setHover(hitTest(),e);
});
canvas.addEventListener('pointerup',e=>{
  dragging=false;canvas.releasePointerCapture?.(e.pointerId);updatePointer(e);
  if(!moved){const hit=hitTest();if(hit?.userData.section)openPanel(hit.userData.section)}
  canvas.style.cursor=hovered?'pointer':'grab';
});
canvas.addEventListener('pointercancel',()=>{dragging=false;canvas.style.cursor='grab'});
canvas.addEventListener('wheel',e=>{
  if(document.body.classList.contains('drawer-open')) return;
  desired.distance=THREE.MathUtils.clamp(desired.distance+e.deltaY*.008,9.4,17.2);hint.classList.add('hide');
},{passive:true});

function focus(section){
  const f=focusViews[section]||homeView;desired.yaw=f.yaw;desired.pitch=f.pitch;desired.distance=f.distance;desired.target.copy(f.target);
}
function resetView(){desired.yaw=homeView.yaw;desired.pitch=homeView.pitch;desired.distance=homeView.distance;desired.target.copy(homeView.target);zoneName.textContent='ENTRY PLATFORM'}
function openPanel(section){
  const data=PANELS[section];if(!data)return;
  drawerIndex.textContent=data.index;drawerKicker.textContent=data.kicker;drawerContent.innerHTML=data.html;drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.classList.add('drawer-open');
  $$('[data-open]').forEach(b=>b.classList.toggle('active',b.dataset.open===section));zoneName.textContent=data.zone;focus(section);hint.classList.add('hide');
}
function closePanel(){
  drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('drawer-open');$$('[data-open]').forEach(b=>b.classList.remove('active'));resetView();
}
$$('[data-open]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();const section=el.dataset.open;if(section==='home')closePanel();else openPanel(section)}));
$('#drawerClose').addEventListener('click',closePanel);
addEventListener('keydown',e=>{
  if(e.key==='Escape')closePanel();
  const keys={1:'projects',2:'experience',3:'stack',4:'about',5:'contact'};if(keys[e.key]&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))openPanel(keys[e.key]);
});

function resize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarsePointer?1.35:1.8));
}
addEventListener('resize',resize,{passive:true});

let firstFrame=true;
const clock=new THREE.Clock();
function animate(){
  const t=clock.getElapsedTime();
  const lerp=prefersReducedMotion?1:.075;
  view.yaw=THREE.MathUtils.lerp(view.yaw,desired.yaw,lerp);view.pitch=THREE.MathUtils.lerp(view.pitch,desired.pitch,lerp);view.distance=THREE.MathUtils.lerp(view.distance,desired.distance,lerp);view.target.lerp(desired.target,lerp);
  const cp=Math.cos(view.pitch);camera.position.set(view.target.x+Math.sin(view.yaw)*cp*view.distance,view.target.y+Math.sin(view.pitch)*view.distance,view.target.z+Math.cos(view.yaw)*cp*view.distance);camera.lookAt(view.target);

  if(!prefersReducedMotion){
    animated.forEach(item=>{
      if(item.type==='lantern'){item.group.rotation.z=Math.sin(t*.65+item.phase)*.015;item.group.position.y=Math.sin(t*.8+item.phase)*.025}
      if(item.type==='packets'){item.packets.forEach((p,i)=>{const u=(t*item.speed+p.offset)%1;p.mesh.position.copy(item.curve.getPointAt(u))})}
    });
    mainSign.material.emissiveIntensity=1.2+Math.sin(t*2.15)*.18;
    monitorA.rotation.y=Math.sin(t*.32)*.012;monitorB.rotation.y=-Math.sin(t*.28)*.014;
  }

  renderer.render(scene,camera);
  if(firstFrame){firstFrame=false;$('#bootStatus').textContent='environment online';requestAnimationFrame(()=>document.body.classList.add('ready'))}
  requestAnimationFrame(animate);
}

canvas.style.cursor='grab';
if(coarsePointer)$('#mobileFallback').hidden=false;
animate();
