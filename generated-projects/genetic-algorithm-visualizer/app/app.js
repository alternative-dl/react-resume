'use strict';
(function(){
const PAPER='#f5f1e8',INK='#0a0a0a',SIGNAL='#ff4d00',INK_SOFT='rgba(10,10,10,0.12)';

/* ---------------- WORLD ---------------- */
const W=1000,H=600;
const START={x:64,y:300},TARGET={x:940,y:300},TARGET_R=26;
const OBSTACLES=[
  {x:300,y:0,w:36,h:410},
  {x:560,y:190,w:36,h:410},
  {x:808,y:0,w:36,h:388}
];
const START_DIST=Math.hypot(TARGET.x-START.x,TARGET.y-START.y);
const LIFESPAN=300;

const EDGES=[];
function addRect(r){
  EDGES.push([r.x,r.y,r.x+r.w,r.y]);
  EDGES.push([r.x+r.w,r.y,r.x+r.w,r.y+r.h]);
  EDGES.push([r.x+r.w,r.y+r.h,r.x,r.y+r.h]);
  EDGES.push([r.x,r.y+r.h,r.x,r.y]);
}
OBSTACLES.forEach(addRect);
EDGES.push([0,0,W,0],[W,0,W,H],[W,H,0,H],[0,H,0,0]);

/* ---------------- NEURAL NET ---------------- */
const N_IN=7,N_HID=10,N_OUT=2;
const L1=N_HID*(N_IN+1),L2=N_OUT*(N_HID+1);
function randn(){let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function makeBrain(){const w1=new Float32Array(L1),w2=new Float32Array(L2);for(let i=0;i<L1;i++)w1[i]=randn()*0.8;for(let i=0;i<L2;i++)w2[i]=randn()*0.8;return{w1,w2};}
function cloneBrain(b){return{w1:b.w1.slice(),w2:b.w2.slice()};}
function forward(b,inp,act){
  const hid=act.hid;
  for(let h=0;h<N_HID;h++){const base=h*(N_IN+1);let s=b.w1[base+N_IN];for(let i=0;i<N_IN;i++)s+=b.w1[base+i]*inp[i];hid[h]=Math.tanh(s);}
  const out=act.out;
  for(let o=0;o<N_OUT;o++){const base=o*(N_HID+1);let s=b.w2[base+N_HID];for(let h=0;h<N_HID;h++)s+=b.w2[base+h]*hid[h];out[o]=Math.tanh(s);}
}
function crossover(a,b){const w1=new Float32Array(L1),w2=new Float32Array(L2);for(let i=0;i<L1;i++)w1[i]=Math.random()<0.5?a.w1[i]:b.w1[i];for(let i=0;i<L2;i++)w2[i]=Math.random()<0.5?a.w2[i]:b.w2[i];return{w1,w2};}
function mutate(b,rate){for(let i=0;i<L1;i++)if(Math.random()<rate)b.w1[i]+=randn()*0.5;for(let i=0;i<L2;i++)if(Math.random()<rate)b.w2[i]+=randn()*0.5;return b;}

/* ---------------- CREATURES ---------------- */
const RAY_ANG=[-1.0,-0.5,0,0.5,1.0];
const MAXRAY=220,MAXSPEED=4.3,TURN=0.22;
function makeCreature(brain){return{brain,x:START.x,y:START.y,angle:(Math.random()-0.5)*0.6,speed:0,dead:false,reached:false,fitness:0,
  act:{hid:new Float32Array(N_HID),out:new Float32Array(N_OUT)},inp:new Float32Array(N_IN),rays:new Float32Array(5)};}
function resetCreature(c){c.x=START.x;c.y=START.y;c.angle=(Math.random()-0.5)*0.6;c.speed=0;c.dead=false;c.reached=false;c.fitness=0;}

function raySeg(px,py,dx,dy,ax,ay,bx,by){
  const ex=bx-ax,ey=by-ay;const den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)return Infinity;
  const t=((ax-px)*ey-(ay-py)*ex)/den;const u=((ax-px)*dy-(ay-py)*dx)/den;
  if(t>=0&&u>=0&&u<=1)return t;return Infinity;
}
function raycast(px,py,ang){const dx=Math.cos(ang),dy=Math.sin(ang);let best=MAXRAY;for(let i=0;i<EDGES.length;i++){const e=EDGES[i];const t=raySeg(px,py,dx,dy,e[0],e[1],e[2],e[3]);if(t<best)best=t;}return best;}
function collides(x,y){if(x<2||x>W-2||y<2||y>H-2)return true;for(let i=0;i<OBSTACLES.length;i++){const o=OBSTACLES[i];if(x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h)return true;}return false;}

function stepCreature(c,step){
  if(c.dead)return;
  for(let i=0;i<5;i++){const d=raycast(c.x,c.y,c.angle+RAY_ANG[i]);c.rays[i]=d;c.inp[i]=d/MAXRAY;}
  const ta=Math.atan2(TARGET.y-c.y,TARGET.x-c.x);let rel=ta-c.angle;while(rel>Math.PI)rel-=2*Math.PI;while(rel<-Math.PI)rel+=2*Math.PI;
  c.inp[5]=Math.sin(rel);c.inp[6]=Math.cos(rel);
  forward(c.brain,c.inp,c.act);
  const turn=c.act.out[0],thrust=(c.act.out[1]+1)/2;
  c.angle+=turn*TURN;
  c.speed+=(thrust*MAXSPEED-c.speed)*0.3;
  const nx=c.x+Math.cos(c.angle)*c.speed,ny=c.y+Math.sin(c.angle)*c.speed;
  if(collides(nx,ny)){c.dead=true;c.speed=0;}else{c.x=nx;c.y=ny;}
  const d=Math.hypot(TARGET.x-c.x,TARGET.y-c.y);
  const progress=START_DIST-d;if(progress>c.fitness)c.fitness=progress;
  if(d<TARGET_R&&!c.reached){c.reached=true;c.dead=true;c.fitness=START_DIST+400+(LIFESPAN-step)*1.0;}
}

/* ---------------- GA STATE ---------------- */
let population=[],generation=1,step=0,running=true;
let mutationRate=0.08,stepsPerFrame=3,popSize=60,showSensors=true;
let genBest=[],genAvg=[],allTimeBest=0;

function initPopulation(n){population=[];for(let i=0;i<n;i++)population.push(makeCreature(makeBrain()));}
function advanceStep(){for(let i=0;i<population.length;i++)stepCreature(population[i],step);step++;}
function allDone(){for(let i=0;i<population.length;i++)if(!population[i].dead)return false;return true;}
function leader(){let best=-Infinity,c=population[0];for(const p of population){if(p.fitness>best){best=p.fitness;c=p;}}return c;}

function evolve(){
  let best=0,sum=0;for(const c of population){const f=c.fitness;sum+=f;if(f>best)best=f;}
  genBest.push(best);genAvg.push(sum/population.length);
  if(best>allTimeBest)allTimeBest=best;
  const weights=population.map(c=>Math.pow(Math.max(0.01,c.fitness),1.6));
  let total=0;for(const w of weights)total+=w;
  function pick(){let r=Math.random()*total;for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0)return population[i];}return population[population.length-1];}
  const order=population.map((c,i)=>i).sort((a,b)=>population[b].fitness-population[a].fitness);
  const next=[];
  next.push(makeCreature(cloneBrain(population[order[0]].brain)));
  next.push(makeCreature(mutate(cloneBrain(population[order[0]].brain),mutationRate*0.5)));
  if(population.length>2&&order[1]!==undefined)next.push(makeCreature(mutate(cloneBrain(population[order[1]].brain),mutationRate)));
  while(next.length<population.length){const a=pick(),b=pick();next.push(makeCreature(mutate(crossover(a.brain,b.brain),mutationRate)));}
  population=next;generation++;step=0;
}

function runHeadless(){step=0;for(const c of population)resetCreature(c);while(step<LIFESPAN&&!allDone())advanceStep();evolve();}

/* ---------------- CANVAS ---------------- */
const simC=document.getElementById('sim'),simX=simC.getContext('2d');
const brainC=document.getElementById('brain'),brainX=brainC.getContext('2d');
const chartC=document.getElementById('chart'),chartX=chartC.getContext('2d');
let simSize={w:1000,h:600},simScale=1;
function fit(cv,cx){const dpr=window.devicePixelRatio||1;const w=cv.clientWidth||300,h=cv.clientHeight||180;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);cx.setTransform(dpr,0,0,dpr,0,0);return{w,h};}
function resizeAll(){simSize=fit(simC,simX);simScale=simSize.w/W;fit(brainC,brainX);fit(chartC,chartX);}
window.addEventListener('resize',resizeAll);
window.addEventListener('load',resizeAll);

function drawCreature(c,isLead,s){
  simX.save();simX.translate(c.x*s,c.y*s);simX.rotate(c.angle);
  const sz=isLead?9:6;
  simX.beginPath();simX.moveTo(sz,0);simX.lineTo(-sz*0.7,sz*0.6);simX.lineTo(-sz*0.7,-sz*0.6);simX.closePath();
  if(c.reached||isLead)simX.fillStyle=SIGNAL;else if(c.dead)simX.fillStyle='rgba(10,10,10,0.16)';else simX.fillStyle='rgba(10,10,10,0.72)';
  simX.fill();
  if(isLead){simX.strokeStyle=INK;simX.lineWidth=2;simX.stroke();}
  simX.restore();
}
function drawSim(){
  const s=simScale;
  simX.fillStyle=PAPER;simX.fillRect(0,0,simSize.w,simSize.h);
  simX.fillStyle=INK_SOFT;for(let gx=0;gx<=W;gx+=50)for(let gy=0;gy<=H;gy+=50)simX.fillRect(gx*s-1,gy*s-1,2,2);
  simX.fillStyle=INK;for(const o of OBSTACLES)simX.fillRect(o.x*s,o.y*s,o.w*s,o.h*s);
  simX.strokeStyle=INK;simX.lineWidth=2;simX.strokeRect((START.x-14)*s,(START.y-14)*s,28*s,28*s);
  simX.save();simX.translate(TARGET.x*s,TARGET.y*s);
  simX.fillStyle=SIGNAL;simX.strokeStyle=INK;simX.lineWidth=3;
  simX.beginPath();simX.arc(0,0,TARGET_R*s,0,2*Math.PI);simX.fill();simX.stroke();
  simX.fillStyle=INK;simX.beginPath();simX.arc(0,0,5*s,0,2*Math.PI);simX.fill();simX.restore();
  const lead=leader();
  if(showSensors&&lead&&!lead.dead){simX.strokeStyle='rgba(255,77,0,0.5)';simX.lineWidth=1.5;for(let i=0;i<5;i++){const a=lead.angle+RAY_ANG[i];const d=lead.rays[i]||MAXRAY;simX.beginPath();simX.moveTo(lead.x*s,lead.y*s);simX.lineTo((lead.x+Math.cos(a)*d)*s,(lead.y+Math.sin(a)*d)*s);simX.stroke();}}
  for(const c of population)if(c!==lead)drawCreature(c,false,s);
  if(lead)drawCreature(lead,true,s);
}

function drawBrain(){
  const w=brainC.clientWidth,h=brainC.clientHeight;
  brainX.fillStyle=PAPER;brainX.fillRect(0,0,w,h);
  const lead=leader();if(!lead)return;
  const padX=58,padY=26;const layers=[N_IN,N_HID,N_OUT];const xs=[padX,w/2,w-padX];const pos=[];
  for(let l=0;l<3;l++){const n=layers[l];const arr=[];const gap=(h-2*padY)/(n>1?n-1:1);for(let i=0;i<n;i++)arr.push({x:xs[l],y:n>1?padY+gap*i:h/2});pos.push(arr);}
  const b=lead.brain;
  function conns(from,to,weights,nIn){for(let j=0;j<to.length;j++)for(let i=0;i<from.length;i++){const wv=weights[j*(nIn+1)+i];const mag=Math.min(1,Math.abs(wv)/2);if(mag<0.06)continue;brainX.strokeStyle=wv>=0?'rgba(255,77,0,'+(0.14+mag*0.6)+')':'rgba(10,10,10,'+(0.12+mag*0.5)+')';brainX.lineWidth=0.4+mag*2.2;brainX.beginPath();brainX.moveTo(from[i].x,from[i].y);brainX.lineTo(to[j].x,to[j].y);brainX.stroke();}}
  conns(pos[0],pos[1],b.w1,N_IN);conns(pos[1],pos[2],b.w2,N_HID);
  function node(p,a,r){const v=Math.min(1,Math.abs(a));brainX.beginPath();brainX.arc(p.x,p.y,r,0,2*Math.PI);brainX.fillStyle=a>=0?'rgba(255,77,0,'+(0.12+v*0.88)+')':'rgba(10,10,10,'+(0.08+v*0.5)+')';brainX.fill();brainX.lineWidth=2.5;brainX.strokeStyle=INK;brainX.stroke();}
  for(let i=0;i<N_IN;i++)node(pos[0][i],lead.inp[i],7);
  for(let i=0;i<N_HID;i++)node(pos[1][i],lead.act.hid[i],7);
  for(let i=0;i<N_OUT;i++)node(pos[2][i],lead.act.out[i],9);
  brainX.fillStyle=INK;brainX.font='700 9px '+'ui-monospace,monospace';brainX.textBaseline='middle';
  const inLab=['S1','S2','S3','S4','S5','\u2192X','\u2192Y'];brainX.textAlign='right';for(let i=0;i<N_IN;i++)brainX.fillText(inLab[i],pos[0][i].x-12,pos[0][i].y);
  const outLab=['TRN','THR'];brainX.textAlign='left';for(let i=0;i<N_OUT;i++)brainX.fillText(outLab[i],pos[2][i].x+14,pos[2][i].y);
  brainX.textAlign='center';
}

function drawChart(){
  const w=chartC.clientWidth,h=chartC.clientHeight;
  chartX.fillStyle=PAPER;chartX.fillRect(0,0,w,h);
  const padL=44,padR=16,padT=18,padB=26;const x0=padL,x1=w-padR,y0=h-padB,y1=padT;
  chartX.strokeStyle=INK;chartX.lineWidth=2;chartX.beginPath();chartX.moveTo(x0,y1);chartX.lineTo(x0,y0);chartX.lineTo(x1,y0);chartX.stroke();
  if(genBest.length<1){chartX.fillStyle=INK;chartX.font='700 11px ui-monospace,monospace';chartX.textAlign='center';chartX.textBaseline='middle';chartX.fillText('AWAITING GENERATION 001\u2026',w/2,h/2);return;}
  let maxV=Math.max(START_DIST*0.4,...genBest,...genAvg)*1.08;const n=genBest.length;
  const px=i=>n>1?x0+(x1-x0)*i/(n-1):(x0+x1)/2;const py=v=>y0-(y0-y1)*(v/maxV);
  chartX.strokeStyle=INK_SOFT;chartX.lineWidth=1;chartX.fillStyle=INK;chartX.font='600 8px ui-monospace,monospace';chartX.textAlign='right';chartX.textBaseline='middle';
  for(let g=0;g<=4;g++){const v=maxV*g/4;const yy=py(v);chartX.beginPath();chartX.moveTo(x0,yy);chartX.lineTo(x1,yy);chartX.stroke();chartX.fillText(Math.round(v),x0-6,yy);}
  chartX.strokeStyle=INK;chartX.lineWidth=2;chartX.beginPath();for(let i=0;i<n;i++){const X=px(i),Y=py(genAvg[i]);i?chartX.lineTo(X,Y):chartX.moveTo(X,Y);}chartX.stroke();
  chartX.strokeStyle=SIGNAL;chartX.lineWidth=2.5;chartX.beginPath();for(let i=0;i<n;i++){const X=px(i),Y=py(genBest[i]);i?chartX.lineTo(X,Y):chartX.moveTo(X,Y);}chartX.stroke();
  chartX.fillStyle=SIGNAL;for(let i=0;i<n;i++)chartX.fillRect(px(i)-2,py(genBest[i])-2,4,4);
  chartX.fillStyle=INK;chartX.font='700 8px ui-monospace,monospace';chartX.textAlign='center';chartX.textBaseline='top';chartX.fillText('GEN 1',x0,y0+6);chartX.fillText('GEN '+n,x1,y0+6);
}

/* ---------------- STATS ---------------- */
function pad(n){return String(n).padStart(3,'0');}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}
function updateStats(){
  let alive=0,reached=0,best=0;for(const c of population){if(!c.dead)alive++;if(c.reached)reached++;if(c.fitness>best)best=c.fitness;}
  setText('stGen',pad(generation));
  setText('stAlive',alive+' / '+population.length);
  setText('stBestAll',Math.round(allTimeBest));
  setText('stBestGen',Math.round(best));
  setText('stAvg',genAvg.length?Math.round(genAvg[genAvg.length-1]):'\u2014');
  setText('stReached',reached);
  const pct=Math.min(100,Math.round(step/LIFESPAN*100));
  setText('arenaMeta','GEN '+pad(generation)+' \u00b7 '+pct+'%');
  const pb=document.getElementById('progFill');if(pb)pb.style.width=pct+'%';
}

/* ---------------- LOOP ---------------- */
function tick(){
  if(running){let n=stepsPerFrame;while(n-->0){if(step>=LIFESPAN||allDone()){evolve();break;}advanceStep();}}
  drawSim();drawBrain();drawChart();updateStats();
  requestAnimationFrame(tick);
}

/* ---------------- CONTROLS ---------------- */
const playBtn=document.getElementById('playBtn');
playBtn.addEventListener('click',()=>{running=!running;playBtn.textContent=running?'PAUSE':'RESUME';playBtn.classList.toggle('btn--primary',running);});
document.getElementById('stepBtn').addEventListener('click',()=>{runHeadless();step=0;for(const c of population)resetCreature(c);});
document.getElementById('resetBtn').addEventListener('click',()=>{popSize=+document.getElementById('pop').value;initPopulation(popSize);generation=1;step=0;genBest=[];genAvg=[];allTimeBest=0;for(let i=0;i<2;i++)runHeadless();step=0;for(const c of population)resetCreature(c);document.getElementById('popHint').textContent='';});
const sb=document.getElementById('sensorBtn');
sb.addEventListener('click',()=>{showSensors=!showSensors;sb.setAttribute('aria-pressed',showSensors);sb.textContent='SENSORS: '+(showSensors?'ON':'OFF');});
const speed=document.getElementById('speed');
speed.addEventListener('input',()=>{stepsPerFrame=+speed.value;document.getElementById('speedVal').textContent=speed.value+'\u00d7';});
const mut=document.getElementById('mut');
mut.addEventListener('input',()=>{mutationRate=+mut.value/100;document.getElementById('mutVal').textContent=mutationRate.toFixed(2);});
const pop=document.getElementById('pop');
pop.addEventListener('input',()=>{document.getElementById('popVal').textContent=pop.value;document.getElementById('popHint').textContent='\u25b8 APPLIES ON RESET';});

/* ---------------- BOOT ---------------- */
function boot(){
  initPopulation(popSize);
  for(let i=0;i<3;i++)runHeadless();
  step=0;for(const c of population)resetCreature(c);
  resizeAll();
  requestAnimationFrame(tick);
}
boot();
})();
