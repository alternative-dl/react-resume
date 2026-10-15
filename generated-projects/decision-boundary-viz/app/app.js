'use strict';
(function(){
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const PAPER=[245,241,232], SIGNAL=[255,77,0];
const BAYER=[0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
const DESC={knn:'Votes among the K nearest points.',logreg:'Linear split; raise degree to curve it.',tree:'Axis-aligned splits carve boxes.',mlp:'Two tanh layers fold smooth curves.'};
const NAME={knn:'K-Nearest',logreg:'Logistic',tree:'Decision Tree',mlp:'Neural Net'};

let spare=null;
function randn(){ if(spare!==null){const s=spare;spare=null;return s;} let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random(); const m=Math.sqrt(-2*Math.log(u)); spare=m*Math.sin(2*Math.PI*v); return m*Math.cos(2*Math.PI*v); }

const state={dataset:'moons',algo:'knn',n:220,noise:0.15,params:{k:12,degree:1,depth:5,units:10},brush:1,showPoints:true,showGrid:true,showHalftone:true,showLine:true,points:[],model:null,grid:null,GRID:160,acc:0,ms:0};

function genRaw(){
 const n=state.n, noise=state.noise, pts=[];
 const push=(x,y,c)=>pts.push({x:x,y:y,c:c});
 if(state.dataset==='blobs'){
   const s=0.35+noise*0.9;
   for(let i=0;i<n;i++){const c=i<n/2?0:1; const cx=c?2:-2, cy=c?-1:1; push(cx+randn()*s,cy+randn()*s,c);}
 } else if(state.dataset==='moons'){
   const half=Math.floor(n/2), j=noise*0.35;
   for(let i=0;i<n;i++){const c=i<half?0:1; const t=Math.PI*((i%half)/Math.max(1,half-1)); let x,y;
     if(c===0){x=Math.cos(t);y=Math.sin(t);} else {x=1-Math.cos(t);y=0.5-Math.sin(t);}
     push(x+randn()*j,y+randn()*j,c);}
 } else if(state.dataset==='circles'){
   const s=0.06+noise*0.30;
   for(let i=0;i<n;i++){const c=i<n/2?0:1; const a=Math.random()*Math.PI*2; const r=(c?1.6:0.7)+randn()*s; push(Math.cos(a)*r,Math.sin(a)*r,c);}
 } else if(state.dataset==='xor'){
   const j=noise*0.6;
   for(let i=0;i<n;i++){const x=(Math.random()*2-1)*2, y=(Math.random()*2-1)*2; const c=((x>0)!==(y>0))?1:0; push(x+randn()*j*0.3,y+randn()*j*0.3,c);}
 } else {
   const half=Math.floor(n/2), j=noise*0.5;
   for(let i=0;i<n;i++){const c=i<half?0:1; const t=(i%half)/Math.max(1,half-1); const r=0.2+t*2.0; const ang=t*3.3*Math.PI+(c?Math.PI:0); push(Math.cos(ang)*r+randn()*j,Math.sin(ang)*r+randn()*j,c);}
 }
 return pts;
}
function normalize(pts){
 if(!pts.length)return pts;
 let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
 for(const p of pts){if(p.x<minx)minx=p.x;if(p.x>maxx)maxx=p.x;if(p.y<miny)miny=p.y;if(p.y>maxy)maxy=p.y;}
 const cx=(minx+maxx)/2, cy=(miny+maxy)/2, span=Math.max(maxx-minx,maxy-miny)||1, sc=0.82/span;
 for(const p of pts){p.x=clamp(0.5+(p.x-cx)*sc,0.02,0.98); p.y=clamp(0.5+(p.y-cy)*sc,0.02,0.98);}
 return pts;
}
function regenerate(){ state.points=normalize(genRaw()); }

function makeKNN(){
 const pts=state.points, k=clamp(state.params.k,1,Math.max(1,pts.length));
 return {prob:function(x,y){
   const best=[];
   for(let n=0;n<pts.length;n++){const dx=pts[n].x-x,dy=pts[n].y-y,d=dx*dx+dy*dy;
     if(best.length<k){best.push({d:d,c:pts[n].c}); if(best.length===k)best.sort((a,b)=>a.d-b.d);}
     else if(d<best[k-1].d){let i=k-1; best[i]={d:d,c:pts[n].c}; while(i>0&&best[i].d<best[i-1].d){const t=best[i];best[i]=best[i-1];best[i-1]=t;i--;}}}
   let s=0; for(const b of best)s+=b.c; return s/best.length;
 }};
}
function featOf(x,y,D){const xc=(x-0.5)*2,yc=(y-0.5)*2,a=[]; for(let d=1;d<=D;d++)for(let i=d;i>=0;i--){a.push(Math.pow(xc,i)*Math.pow(yc,d-i));} return a;}
function makeLogReg(){
 const pts=state.points, D=clamp(state.params.degree,1,4), X=pts.map(p=>featOf(p.x,p.y,D)), F=X[0].length, w=new Array(F).fill(0); let b=0;
 const lr=0.5, lam=0.002, iters=700, N=pts.length;
 for(let it=0;it<iters;it++){const gw=new Array(F).fill(0); let gb=0;
   for(let n=0;n<N;n++){let z=b; for(let f=0;f<F;f++)z+=w[f]*X[n][f]; const p=1/(1+Math.exp(-z)), e=p-pts[n].c; for(let f=0;f<F;f++)gw[f]+=e*X[n][f]; gb+=e;}
   for(let f=0;f<F;f++)w[f]-=lr*(gw[f]/N+lam*w[f]); b-=lr*gb/N;}
 return {prob:function(x,y){const f=featOf(x,y,D); let z=b; for(let i=0;i<F;i++)z+=w[i]*f[i]; return 1/(1+Math.exp(-z));}};
}
function makeTree(){
 const pts=state.points, maxD=clamp(state.params.depth,1,12);
 function gini(c1,tot){if(tot===0)return 0; const p=c1/tot; return 1-p*p-(1-p)*(1-p);}
 function build(idx,depth){
   let c1=0; for(const i of idx)c1+=pts[i].c; const prob=c1/idx.length;
   if(depth>=maxD||idx.length<4||c1===0||c1===idx.length)return{leaf:true,prob:prob};
   let best=null;
   for(let f=0;f<2;f++){const key=f===0?'x':'y', s=idx.slice().sort((a,b)=>pts[a][key]-pts[b][key]); let lc1=0; const tot=s.length;
     for(let i=0;i<tot-1;i++){lc1+=pts[s[i]].c; const ln=i+1,rn=tot-ln,rc1=c1-lc1,va=pts[s[i]][key],vb=pts[s[i+1]][key]; if(va===vb)continue;
       const g=(ln*gini(lc1,ln)+rn*gini(rc1,rn))/tot; if(!best||g<best.g)best={g:g,f:f,key:key,thr:(va+vb)/2};}}
   if(!best)return{leaf:true,prob:prob};
   const L=[],R=[]; for(const i of idx){(pts[i][best.key]<=best.thr?L:R).push(i);} if(!L.length||!R.length)return{leaf:true,prob:prob};
   return{leaf:false,f:best.f,thr:best.thr,L:build(L,depth+1),R:build(R,depth+1)};
 }
 const root=build(pts.map((_,i)=>i),0);
 return {prob:function(x,y){let node=root; while(!node.leaf){const v=node.f===0?x:y; node=v<=node.thr?node.L:node.R;} return node.prob;}};
}
function makeMLP(){
 const pts=state.points, H=clamp(state.params.units,2,20), sizes=[2,H,H,1], acts=['tanh','tanh','sig'], W=[],B=[];
 for(let l=0;l<3;l++){const inn=sizes[l],out=sizes[l+1],sc=Math.sqrt(1/inn),w=[]; for(let o=0;o<out;o++){const row=[]; for(let i=0;i<inn;i++)row.push(randn()*sc); w.push(row);} W.push(w); B.push(new Array(out).fill(0));}
 const th=v=>Math.tanh(v), sg=v=>1/(1+Math.exp(-v));
 function fwd(inp){const as=[inp]; let a=inp; for(let l=0;l<3;l++){const out=[]; for(let o=0;o<sizes[l+1];o++){let z=B[l][o]; const row=W[l][o]; for(let i=0;i<a.length;i++)z+=row[i]*a[i]; out.push(acts[l]==='tanh'?th(z):sg(z));} a=out; as.push(a);} return as;}
 const N=pts.length, lr=0.5, epochs=240, mom=0.9, inputs=pts.map(p=>[(p.x-0.5)*2,(p.y-0.5)*2]);
 const mW=W.map(w=>w.map(r=>r.map(()=>0))), mB=B.map(b=>b.map(()=>0));
 for(let ep=0;ep<epochs;ep++){
   const gW=W.map(w=>w.map(r=>r.map(()=>0))), gB=B.map(b=>b.map(()=>0));
   for(let n=0;n<N;n++){const as=fwd(inputs[n]), y=pts[n].c; let delta=[as[3][0]-y];
     for(let l=2;l>=0;l--){const a_in=as[l]; for(let o=0;o<sizes[l+1];o++){const d=delta[o]; gB[l][o]+=d; for(let i=0;i<a_in.length;i++)gW[l][o][i]+=d*a_in[i];}
       if(l>0){const nd=new Array(sizes[l]).fill(0); for(let i=0;i<sizes[l];i++){let s=0; for(let o=0;o<sizes[l+1];o++)s+=W[l][o][i]*delta[o]; const av=as[l][i]; nd[i]=s*(1-av*av);} delta=nd;}}}
   for(let l=0;l<3;l++)for(let o=0;o<sizes[l+1];o++){mB[l][o]=mom*mB[l][o]-lr*gB[l][o]/N; B[l][o]+=mB[l][o]; for(let i=0;i<sizes[l];i++){mW[l][o][i]=mom*mW[l][o][i]-lr*gW[l][o][i]/N; W[l][o][i]+=mW[l][o][i];}}
 }
 return {prob:function(x,y){const as=fwd([(x-0.5)*2,(y-0.5)*2]); return as[3][0];}};
}
function bothClasses(){let a=false,b=false; for(const p of state.points){if(p.c===0)a=true; else b=true; if(a&&b)return true;} return false;}

function rebuild(){
 const t0=performance.now();
 if(state.points.length<2||!bothClasses()){state.model=null;state.grid=null;state.acc=0;state.ms=0;draw();updateStats();return;}
 let m; switch(state.algo){case 'knn':m=makeKNN();break;case 'logreg':m=makeLogReg();break;case 'tree':m=makeTree();break;default:m=makeMLP();}
 state.model=m;
 const G=state.GRID, grid=new Float32Array(G*G);
 for(let j=0;j<G;j++){const y=(j+0.5)/G; for(let i=0;i<G;i++)grid[j*G+i]=m.prob((i+0.5)/G,y);}
 state.grid=grid;
 let correct=0; for(const p of state.points){if((m.prob(p.x,p.y)>=0.5?1:0)===p.c)correct++;} state.acc=correct/state.points.length;
 state.ms=performance.now()-t0; draw(); updateStats();
}

const canvas=$('#plot'), ctx=canvas.getContext('2d'); let off=document.createElement('canvas'), offctx=off.getContext('2d'); let W=0,Hh=0,DPR=1;
function resize(){ const box=$('#stageBox'); let size=box.clientWidth||400; size=clamp(Math.floor(size),240,660); DPR=Math.min(window.devicePixelRatio||1,2); canvas.style.width=size+'px'; canvas.style.height=size+'px'; W=canvas.width=Math.round(size*DPR); Hh=canvas.height=Math.round(size*DPR); draw(); }

const MS={0:[],1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,0],[1,2]],6:[[0,2]],7:[[3,2]],8:[[3,2]],9:[[0,2]],10:[[0,1],[3,2]],11:[[1,2]],12:[[3,1]],13:[[0,1]],14:[[3,0]],15:[]};

function draw(){
 ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='rgb(245,241,232)'; ctx.fillRect(0,0,W,Hh);
 if(state.grid&&state.showHalftone)renderHalftone();
 if(state.showGrid)drawGrid();
 if(state.grid&&state.showLine)drawContour();
 if(state.showPoints)drawPoints();
 if(!state.model)drawEmpty();
}
function renderHalftone(){
 const G=state.GRID; if(off.width!==G){off.width=G;off.height=G;} const img=offctx.createImageData(G,G), d=img.data, grid=state.grid;
 for(let j=0;j<G;j++)for(let i=0;i<G;i++){const p=grid[j*G+i], th=(BAYER[(i%8)+(j%8)*8]+0.5)/64, on=p>th, k=(j*G+i)*4, col=on?SIGNAL:PAPER; d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255;}
 offctx.putImageData(img,0,0); ctx.imageSmoothingEnabled=false; ctx.drawImage(off,0,0,G,G,0,0,W,Hh);
}
function drawGrid(){ ctx.save(); ctx.strokeStyle='rgba(10,10,10,0.10)'; ctx.lineWidth=Math.max(1,DPR); const N=10; for(let i=1;i<N;i++){const x=Math.round(i/N*W)+0.5; ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,Hh);ctx.stroke(); const y=Math.round(i/N*Hh)+0.5; ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();} ctx.restore(); }
function drawContour(){
 const G=state.GRID, grid=state.grid, t=0.5; ctx.save(); ctx.strokeStyle='rgb(10,10,10)'; ctx.lineWidth=Math.max(3,W/210); ctx.lineJoin='round'; ctx.lineCap='round'; ctx.beginPath();
 for(let j=0;j<G-1;j++)for(let i=0;i<G-1;i++){
   const TL=grid[j*G+i],TR=grid[j*G+i+1],BR=grid[(j+1)*G+i+1],BL=grid[(j+1)*G+i];
   const idx=(TL>t?1:0)|(TR>t?2:0)|(BR>t?4:0)|(BL>t?8:0), segs=MS[idx]; if(!segs.length)continue;
   const x0=(i+0.5)/G,x1=(i+1.5)/G,y0=(j+0.5)/G,y1=(j+1.5)/G;
   const pt=e=>{let f; if(e===0){f=(t-TL)/(TR-TL);return[(x0+(x1-x0)*f)*W,y0*Hh];} if(e===1){f=(t-TR)/(BR-TR);return[x1*W,(y0+(y1-y0)*f)*Hh];} if(e===2){f=(t-BR)/(BL-BR);return[(x1+(x0-x1)*f)*W,y1*Hh];} f=(t-BL)/(TL-BL);return[x0*W,(y1+(y0-y1)*f)*Hh];};
   for(const s of segs){const a=pt(s[0]),b=pt(s[1]); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]);}
 }
 ctx.stroke(); ctx.restore();
}
function drawPoints(){
 const r=clamp(W*0.014,5,11), halo=r+Math.max(3,DPR*2);
 for(const p of state.points){const x=p.x*W,y=p.y*Hh;
   ctx.beginPath();ctx.arc(x,y,halo,0,7);ctx.fillStyle='rgb(245,241,232)';ctx.fill();
   ctx.beginPath();ctx.arc(x,y,r,0,7); ctx.fillStyle=p.c===1?'rgb(255,77,0)':'rgb(10,10,10)'; ctx.fill(); ctx.lineWidth=Math.max(2,DPR*1.5); ctx.strokeStyle='rgb(10,10,10)'; ctx.stroke();}
}
function drawEmpty(){
 ctx.save(); ctx.textAlign='center'; const big=Math.max(16,W*0.05); ctx.fillStyle='rgb(10,10,10)'; ctx.font='800 '+big+'px '+'system-ui,sans-serif';
 const msg=state.points.length?'NEED BOTH CLASSES':'AWAITING DATA'; ctx.fillText(msg,W/2,Hh/2);
 ctx.fillStyle='rgb(255,77,0)'; const sm=Math.max(10,W*0.021); ctx.font=sm+'px ui-monospace,monospace'; ctx.fillText('CLICK TO ADD '+(state.brush===1?'CLASS B':'CLASS A'),W/2,Hh/2+big*0.95); ctx.restore();
}
function updateStats(){
 $('#statModel').textContent=NAME[state.algo]; $('#statAcc').textContent=state.model?(state.acc*100).toFixed(1)+'%':'\u2014'; $('#statPts').textContent=state.points.length; $('#statMs').textContent=state.model?state.ms.toFixed(1)+' ms':'\u2014'; $('#algoDesc').textContent=DESC[state.algo];
}

let pending=false, needRegen=false;
function schedule(regen){ if(regen)needRegen=true; if(pending)return; pending=true; requestAnimationFrame(()=>{pending=false; if(needRegen){regenerate();needRegen=false;} rebuild();}); }

function selectChip(group,val){ $$('[data-group='+group+']').forEach(b=>{const on=b.dataset.value===val; b.classList.toggle('on',on); b.setAttribute('aria-checked',on);}); }
function syncParamRows(){ $$('.param-row').forEach(r=>{r.hidden=r.dataset.algo!==state.algo;}); }
function setLabel(r,v){const l=$('[data-out='+r.dataset.key+']'); if(l)l.textContent=v;}
function updateBrush(){const b=$('#brush'); b.querySelector('.swatch').style.background=state.brush===1?'var(--signal)':'var(--ink)'; b.querySelector('.blab').textContent='Class '+(state.brush===1?'B':'A');}
function canvasPos(e){const rect=canvas.getBoundingClientRect(), x=(e.clientX-rect.left)/rect.width, y=(e.clientY-rect.top)/rect.height; if(x<0||x>1||y<0||y>1)return null; return{x:clamp(x,0.01,0.99),y:clamp(y,0.01,0.99)};}

function wire(){
 $$('[data-group=dataset]').forEach(b=>b.addEventListener('click',()=>{state.dataset=b.dataset.value;selectChip('dataset',state.dataset);schedule(true);}));
 $$('[data-group=algo]').forEach(b=>b.addEventListener('click',()=>{state.algo=b.dataset.value;selectChip('algo',state.algo);syncParamRows();schedule(false);}));
 $$('input[type=range]').forEach(r=>r.addEventListener('input',()=>{const key=r.dataset.key,v=parseFloat(r.value);
   if(key==='n'){state.n=v;setLabel(r,v);schedule(true);} else if(key==='noise'){state.noise=v/100;setLabel(r,v+'%');schedule(true);} else {state.params[key]=v;setLabel(r,v);schedule(false);}}));
 $$('[data-toggle]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.toggle; state[k]=!state[k]; b.classList.toggle('on',state[k]); b.setAttribute('aria-pressed',state[k]); draw();}));
 $('#brush').addEventListener('click',()=>{state.brush=state.brush===1?0:1; updateBrush();});
 $('#regen').addEventListener('click',()=>schedule(true));
 $('#clear').addEventListener('click',()=>{state.points=[];schedule(false);});
 canvas.addEventListener('click',e=>{const p=canvasPos(e); if(!p)return; state.points.push({x:p.x,y:p.y,c:state.brush}); schedule(false);});
 canvas.addEventListener('contextmenu',e=>{e.preventDefault(); const p=canvasPos(e); if(!p)return; state.points.push({x:p.x,y:p.y,c:state.brush===1?0:1}); schedule(false);});
 let rt; window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(resize,120);});
}

function init(){
 regenerate(); selectChip('dataset',state.dataset); selectChip('algo',state.algo); syncParamRows(); wire(); updateBrush();
 $$('input[type=range]').forEach(r=>{const k=r.dataset.key,v=parseFloat(r.value); setLabel(r,k==='noise'?v+'%':v);});
 resize(); rebuild();
}
if(document.readyState!=='loading')init(); else document.addEventListener('DOMContentLoaded',init);
})();
