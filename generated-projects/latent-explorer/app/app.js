(function(){
'use strict';
const $=function(s){return document.querySelector(s);};

// ---- palette (rgb) ----
const PAPER=[245,241,232], INK=[10,10,10], SIGNAL=[255,77,0];

// ---- seeded rng ----
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(rng){let u=0,v=0;while(u<=1e-9)u=rng();while(v<=1e-9)v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(6.28318530718*v);}

// ---- compositional pattern network ----
const ZDIM=6, IN=3+ZDIM, ARCH=[IN,20,20,14,2], ACTS=['tanh','sin','sin','tanh'];
let layers=[], layerBufs=[], anchors=[];
function buildNet(seed){
  const rng=mulberry32(((seed*2654435761)>>>0)^0x9e3779b9);
  layers=[]; layerBufs=[];
  for(let l=0;l<ARCH.length-1;l++){
    const inN=ARCH[l], outN=ARCH[l+1];
    const w=new Float32Array(inN*outN), b=new Float32Array(outN);
    const sc=(l===0)?1.6:1.05;
    for(let k=0;k<w.length;k++)w[k]=gauss(rng)*sc;
    for(let k=0;k<outN;k++)b[k]=gauss(rng)*0.25;
    layers.push({inN:inN,outN:outN,w:w,b:b,sin:ACTS[l]==='sin'});
    layerBufs.push(new Float32Array(outN));
  }
}
function buildAnchors(seed){
  const rng=mulberry32((seed^0x1a2b3c4d)>>>0);
  anchors=[];
  for(let c=0;c<4;c++){const a=new Float32Array(ZDIM);for(let k=0;k<ZDIM;k++)a[k]=gauss(rng);anchors.push(a);}
}
const inBuf=new Float32Array(IN);
function forward(){
  let a=inBuf;
  for(let li=0;li<layers.length;li++){
    const L=layers[li], out=layerBufs[li], w=L.w, b=L.b, inN=L.inN, sin=L.sin;
    for(let o=0;o<L.outN;o++){
      let s=b[o]; const base=o*inN;
      for(let i=0;i<inN;i++)s+=a[i]*w[base+i];
      out[o]=sin?Math.sin(s*1.5):Math.tanh(s);
    }
    a=out;
  }
  return a;
}

// ---- latent vector (bilinear over 4 anchors) ----
const zVec=new Float32Array(ZDIM);
function computeZ(u,v,spread){
  const w00=(1-u)*(1-v), w10=u*(1-v), w01=(1-u)*v, w11=u*v;
  for(let k=0;k<ZDIM;k++){
    zVec[k]=(anchors[0][k]*w00+anchors[1][k]*w10+anchors[2][k]*w01+anchors[3][k]*w11)*spread;
  }
}

// ---- state ----
const state={seed:3172,u:0.32,v:0.68,detail:2,spread:1.0,sym:1,tone:1,anim:false};
const RES=[64,96,128,176], RESLBL=['COARSE','MEDIUM','FINE','ULTRA'], SYMLBL=['OFF','MIRROR','QUAD'];
const COORD=1.7;

// ---- canvas ----
const art=$('#art'), ctx=art.getContext('2d');
ctx.imageSmoothingEnabled=false;
const buf=document.createElement('canvas'), bctx=buf.getContext('2d');

function renderArt(){
  const res=RES[state.detail];
  computeZ(state.u,state.v,state.spread);
  for(let k=0;k<ZDIM;k++)inBuf[3+k]=zVec[k];
  if(buf.width!==res){buf.width=res;buf.height=res;}
  const img=bctx.createImageData(res,res), d=img.data;
  const sym=state.sym, tri=(state.tone===1), inv=2/(res-1);
  let p=0;
  for(let j=0;j<res;j++){
    let y=j*inv-1;
    for(let i=0;i<res;i++){
      let x=i*inv-1, xx=x, yy=y;
      if(sym===1)xx=Math.abs(xx);
      else if(sym===2){xx=Math.abs(xx);yy=Math.abs(yy);}
      const r=Math.sqrt(xx*xx+yy*yy);
      inBuf[0]=xx*COORD; inBuf[1]=yy*COORD; inBuf[2]=r*COORD-0.85;
      const o=forward();
      const s=o[0], acc=o[1];
      let col;
      if(tri&&acc>0.5)col=SIGNAL; else col=(s>0)?INK:PAPER;
      d[p]=col[0];d[p+1]=col[1];d[p+2]=col[2];d[p+3]=255;p+=4;
    }
  }
  bctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(buf,0,0,art.width,art.height);
  updateReadouts();
}

// ---- readouts ----
function fmt(n){return (n<0?'\u2212':'+')+Math.abs(n).toFixed(2);}
function pad4(n){let s=String(n);while(s.length<4)s='0'+s;return s;}
let zbarEls=[];
function buildZBars(){
  const c=$('#zbars');c.innerHTML='';zbarEls=[];
  for(let k=0;k<ZDIM;k++){
    const row=document.createElement('div');row.className='zrow';
    row.innerHTML="<span class='zl'>z"+k+"</span><span class='ztrack'><span class='zfill'></span></span><span class='zval'>+0.00</span>";
    c.appendChild(row);
    zbarEls.push({fill:row.querySelector('.zfill'),val:row.querySelector('.zval')});
  }
}
function updateZBars(){
  const M=1.6;
  for(let k=0;k<ZDIM;k++){
    const z=zVec[k], mag=Math.min(Math.abs(z)/M,1)*50, f=zbarEls[k].fill;
    if(z>=0){f.style.left='50%';f.style.right='auto';f.style.width=mag+'%';}
    else{f.style.right='50%';f.style.left='auto';f.style.width=mag+'%';}
    zbarEls[k].val.textContent=fmt(z);
  }
}
function updateReadouts(){
  $('#resChip').textContent=RES[state.detail]+' \u00d7 '+RES[state.detail];
  $('#coord').textContent='U '+state.u.toFixed(2)+' \u00b7 V '+state.v.toFixed(2);
  $('#seedVal').textContent=pad4(state.seed);
  $('#detailVal').textContent=RESLBL[state.detail];
  $('#spreadVal').textContent=state.spread.toFixed(2)+'\u00d7';
  let zs='';for(let k=0;k<ZDIM;k++)zs+=(k?' ':'')+fmt(zVec[k]);
  $('#status').innerHTML='SEED <b>'+pad4(state.seed)+'</b> \u00b7 U '+state.u.toFixed(3)+' V '+state.v.toFixed(3)+' \u00b7 SPREAD '+state.spread.toFixed(2)+'\u00d7<br>Z ['+zs+']';
  updateZBars();
  const knob=$('#knob'); knob.style.left=(state.u*100)+'%'; knob.style.top=((1-state.v)*100)+'%';
  $('#pad').setAttribute('aria-valuetext','U '+state.u.toFixed(2)+' V '+state.v.toFixed(2));
  drawPadGrid();
}

// ---- pad grid ----
const padGrid=$('#padGrid'), pctx=padGrid.getContext('2d'), padEl=$('#pad');
let padW=0;
function sizePad(){
  const r=padEl.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  padW=r.width;
  padGrid.width=Math.max(1,Math.round(r.width*dpr));
  padGrid.height=Math.max(1,Math.round(r.height*dpr));
  pctx.setTransform(dpr,0,0,dpr,0,0);
  drawPadGrid();
}
function drawPadGrid(){
  const W=padW, H=padW; if(!W)return;
  pctx.clearRect(0,0,W,H);
  pctx.fillStyle='#f5f1e8';pctx.fillRect(0,0,W,H);
  pctx.strokeStyle='#0a0a0a';pctx.lineWidth=1;
  pctx.beginPath();
  for(let k=1;k<4;k++){const gx=Math.round(k/4*W)+0.5;pctx.moveTo(gx,0);pctx.lineTo(gx,H);const gy=Math.round(k/4*H)+0.5;pctx.moveTo(0,gy);pctx.lineTo(W,gy);}
  pctx.stroke();
  const kx=state.u*W, ky=(1-state.v)*H;
  pctx.strokeStyle='#ff4d00';pctx.lineWidth=1.5;
  pctx.beginPath();pctx.moveTo(kx,0);pctx.lineTo(kx,H);pctx.moveTo(0,ky);pctx.lineTo(W,ky);pctx.stroke();
}

// ---- render scheduling ----
let scheduled=false;
function requestRender(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;renderArt();});}
function setUV(u,v){state.u=Math.max(0,Math.min(1,u));state.v=Math.max(0,Math.min(1,v));requestRender();}
function setSeed(s){state.seed=((s%10000)+10000)%10000;buildNet(state.seed);buildAnchors(state.seed);requestRender();}

// ---- pad interaction ----
let dragging=false;
function padPos(e){const r=padEl.getBoundingClientRect();return{u:(e.clientX-r.left)/r.width,v:1-(e.clientY-r.top)/r.height};}
padEl.addEventListener('pointerdown',function(e){dragging=true;padEl.setPointerCapture(e.pointerId);stopAnim();const p=padPos(e);setUV(p.u,p.v);});
padEl.addEventListener('pointermove',function(e){if(!dragging)return;const p=padPos(e);setUV(p.u,p.v);});
padEl.addEventListener('pointerup',function(){dragging=false;});
padEl.addEventListener('pointercancel',function(){dragging=false;});
padEl.addEventListener('keydown',function(e){const st=0.03;let h=true;if(e.key==='ArrowLeft')setUV(state.u-st,state.v);else if(e.key==='ArrowRight')setUV(state.u+st,state.v);else if(e.key==='ArrowUp')setUV(state.u,state.v+st);else if(e.key==='ArrowDown')setUV(state.u,state.v-st);else h=false;if(h){stopAnim();e.preventDefault();}});

// ---- controls ----
$('#detail').addEventListener('input',function(e){state.detail=+e.target.value;requestRender();});
$('#spread').addEventListener('input',function(e){state.spread=(+e.target.value)/100;requestRender();});
$('#seedRnd').addEventListener('click',function(){setSeed(Math.floor(Math.random()*10000));});
$('#seedUp').addEventListener('click',function(){setSeed(state.seed+1);});
$('#seedDown').addEventListener('click',function(){setSeed(state.seed-1);});
$('#symBtn').addEventListener('click',function(){state.sym=(state.sym+1)%3;const b=$('#symBtn');b.textContent='SYM \u00b7 '+SYMLBL[state.sym];b.classList.toggle('active',state.sym!==0);requestRender();});
$('#toneBtn').addEventListener('click',function(){state.tone=state.tone===1?0:1;const b=$('#toneBtn');b.textContent='TONE \u00b7 '+(state.tone?'TRI':'MONO');b.classList.toggle('active',state.tone===1);requestRender();});
$('#rndBtn').addEventListener('click',function(){stopAnim();setUV(Math.random(),Math.random());});
$('#resetBtn').addEventListener('click',function(){stopAnim();state.detail=2;state.spread=1;state.sym=1;state.tone=1;$('#detail').value=2;$('#spread').value=100;$('#symBtn').textContent='SYM \u00b7 MIRROR';$('#symBtn').classList.add('active');$('#toneBtn').textContent='TONE \u00b7 TRI';$('#toneBtn').classList.add('active');state.u=0.32;state.v=0.68;setSeed(3172);});
$('#exportBtn').addEventListener('click',function(){const a=document.createElement('a');a.download='latent-'+pad4(state.seed)+'-u'+Math.round(state.u*100)+'-v'+Math.round(state.v*100)+'.png';a.href=art.toDataURL('image/png');a.click();});

// ---- auto-tour ----
let animId=0, animT=0;
function animStep(){
  animT+=0.006;
  state.u=0.5+0.42*Math.sin(animT*1.0);
  state.v=0.5+0.42*Math.sin(animT*1.37+1.1);
  renderArt();
  animId=requestAnimationFrame(animStep);
}
function startAnim(){if(state.anim)return;state.anim=true;const b=$('#animBtn');b.textContent='\u25a0 STOP TOUR';b.classList.add('active');animId=requestAnimationFrame(animStep);}
function stopAnim(){if(!state.anim)return;state.anim=false;cancelAnimationFrame(animId);const b=$('#animBtn');b.textContent='\u25b6 AUTO-TOUR';b.classList.remove('active');}
$('#animBtn').addEventListener('click',function(){state.anim?stopAnim():startAnim();});

window.addEventListener('resize',sizePad);

// ---- init ----
function init(){
  buildZBars();
  buildNet(state.seed);buildAnchors(state.seed);
  $('#detail').value=state.detail;$('#spread').value=Math.round(state.spread*100);
  $('#symBtn').classList.add('active');
  $('#toneBtn').classList.add('active');
  sizePad();
  renderArt();
}
init();
})();
