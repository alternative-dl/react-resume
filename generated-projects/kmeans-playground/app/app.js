(function(){
  "use strict";
  const $ = function(id){ return document.getElementById(id); };
  const canvas = $("board"), ctx = canvas.getContext("2d");
  const kSlider = $("k"), kVal = $("kVal");
  const speedSlider = $("speed"), speedVal = $("speedVal");
  const playBtn = $("play"), stepBtn = $("step"), resetBtn = $("reset");
  const clearBtn = $("clear"), randomBtn = $("random"), hint = $("hint");
  const iterEl = $("iter"), countEl = $("count"), inertiaEl = $("inertia"), statusEl = $("status");

  const PALETTE = ["#ff6b6b","#4dabf7","#51cf66","#ffd43b","#cc5de8","#20c997","#ff922b","#f783ac"];
  const SPEED_LABELS = ["","Slowest","Slow","Slow","Relaxed","Normal","Brisk","Fast","Fast","Faster","Fastest"];

  let points = [];        // {x,y} normalized 0..1
  let centroids = [];     // {x,y,rx,ry} logical + rendered
  let assign = [];        // centroid index per point
  let K = parseInt(kSlider.value,10);
  let iterations = 0, converged = false, playing = false;
  let lastStep = 0, W = 1, H = 1;

  function clamp01(v){ return v<0.01?0.01:(v>0.99?0.99:v); }

  function resize(){
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = rect.width; H = rect.height;
    canvas.width = Math.max(1, Math.round(W*dpr));
    canvas.height = Math.max(1, Math.round(H*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  // ---- data ----
  function gaussian(){
    let u=0,v=0;
    while(u===0)u=Math.random();
    while(v===0)v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function randomBlobs(){
    points = [];
    const blobs = 2 + Math.floor(Math.random()*3);
    for(let b=0;b<blobs;b++){
      const cx = 0.18 + Math.random()*0.64;
      const cy = 0.18 + Math.random()*0.64;
      const spread = 0.05 + Math.random()*0.06;
      const n = 14 + Math.floor(Math.random()*16);
      for(let i=0;i<n;i++){
        points.push({ x: clamp01(cx + gaussian()*spread), y: clamp01(cy + gaussian()*spread) });
      }
    }
    initCentroids();
  }

  // ---- k-means ----
  function dist2(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; }

  function initCentroids(){
    centroids = [];
    iterations = 0; converged = false;
    if(points.length===0){
      for(let i=0;i<K;i++){
        const a=i/K*6.283185;
        const p={x:0.5+0.28*Math.cos(a),y:0.5+0.28*Math.sin(a)};
        centroids.push({x:p.x,y:p.y,rx:p.x,ry:p.y});
      }
    } else {
      const first = points[Math.floor(Math.random()*points.length)];
      const chosen = [{x:first.x,y:first.y}];
      while(chosen.length<K){
        let sum=0; const d=[];
        for(const p of points){
          let m=Infinity;
          for(const c of chosen){ const dd=dist2(p,c); if(dd<m)m=dd; }
          d.push(m); sum+=m;
        }
        let idx=0;
        if(sum===0){ idx=Math.floor(Math.random()*points.length); }
        else { let r=Math.random()*sum; for(let i=0;i<d.length;i++){ r-=d[i]; if(r<=0){idx=i;break;} } }
        chosen.push({x:points[idx].x,y:points[idx].y});
      }
      centroids = chosen.map(function(c){ return {x:c.x,y:c.y,rx:c.x,ry:c.y}; });
    }
    assignPoints();
    updateStats();
  }

  function assignPoints(){
    assign = new Array(points.length);
    for(let i=0;i<points.length;i++){
      let best=0,bm=Infinity;
      for(let c=0;c<centroids.length;c++){
        const dd=dist2(points[i],centroids[c]);
        if(dd<bm){bm=dd;best=c;}
      }
      assign[i]=best;
    }
  }

  function step(){
    if(centroids.length===0 || points.length===0) return;
    assignPoints();
    const sx=new Array(K).fill(0), sy=new Array(K).fill(0), cnt=new Array(K).fill(0);
    for(let i=0;i<points.length;i++){
      const c=assign[i]; sx[c]+=points[i].x; sy[c]+=points[i].y; cnt[c]++;
    }
    let maxMove=0;
    for(let c=0;c<K;c++){
      let nx,ny;
      if(cnt[c]>0){ nx=sx[c]/cnt[c]; ny=sy[c]/cnt[c]; }
      else { const p=points[Math.floor(Math.random()*points.length)]; nx=p.x; ny=p.y; }
      const mv=Math.hypot(nx-centroids[c].x,ny-centroids[c].y);
      if(mv>maxMove)maxMove=mv;
      centroids[c].x=nx; centroids[c].y=ny;
    }
    iterations++;
    assignPoints();
    if(maxMove<0.0008){ converged=true; setPlaying(false); }
    updateStats();
  }

  function inertia(){
    let s=0;
    for(let i=0;i<points.length;i++){ s+=dist2(points[i],centroids[assign[i]]); }
    return s;
  }

  function updateStats(){
    iterEl.textContent = iterations;
    countEl.textContent = points.length;
    inertiaEl.textContent = (points.length && centroids.length)? (inertia()*1000).toFixed(1) : "\u2014";
    statusEl.textContent = converged? "Converged" : (playing? "Running" : (points.length? "Ready":"Idle"));
    statusEl.style.color = converged? "#51cf66" : "var(--text)";
  }

  // ---- render ----
  function hexA(hex,a){
    const n=parseInt(hex.slice(1),16);
    return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";
  }
  function diamond(x,y,r){
    ctx.beginPath();
    ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath();
  }
  function render(){
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=1;
    for(let i=1;i<10;i++){
      const g=i/10;
      ctx.beginPath();ctx.moveTo(g*W,0);ctx.lineTo(g*W,H);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,g*H);ctx.lineTo(W,g*H);ctx.stroke();
    }
    if(centroids.length){
      ctx.lineWidth=1;
      for(let i=0;i<points.length;i++){
        const c=centroids[assign[i]]; if(!c)continue;
        ctx.strokeStyle=hexA(PALETTE[assign[i]%PALETTE.length],0.18);
        ctx.beginPath();ctx.moveTo(points[i].x*W,points[i].y*H);ctx.lineTo(c.rx*W,c.ry*H);ctx.stroke();
      }
    }
    for(let i=0;i<points.length;i++){
      const col = centroids.length? PALETTE[assign[i]%PALETTE.length] : "#9aa0bd";
      ctx.fillStyle=col;
      ctx.beginPath();ctx.arc(points[i].x*W,points[i].y*H,4.5,0,6.2832);ctx.fill();
    }
    for(let c=0;c<centroids.length;c++){
      const col=PALETTE[c%PALETTE.length];
      const x=centroids[c].rx*W,y=centroids[c].ry*H;
      ctx.fillStyle=hexA(col,0.18);
      ctx.beginPath();ctx.arc(x,y,16,0,6.2832);ctx.fill();
      ctx.fillStyle=col; ctx.strokeStyle="#fff"; ctx.lineWidth=2.5;
      diamond(x,y,7);
      ctx.fill(); ctx.stroke();
    }
  }

  // ---- loop ----
  function frame(t){
    for(const c of centroids){
      c.rx += (c.x-c.rx)*0.18;
      c.ry += (c.y-c.ry)*0.18;
    }
    if(playing && !converged){
      const interval = 1000 - (parseInt(speedSlider.value,10)-1)*100;
      if(t-lastStep>=interval){ lastStep=t; step(); }
    }
    render();
    requestAnimationFrame(frame);
  }

  // ---- ui ----
  function setPlaying(v){
    playing=v;
    playBtn.textContent = v? "Pause":"Run";
    updateStats();
  }
  function pointerToNorm(e){
    const rect=canvas.getBoundingClientRect();
    const cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    const cy=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
    return {x:clamp01(cx/rect.width),y:clamp01(cy/rect.height)};
  }
  function addPoint(e){
    e.preventDefault();
    points.push(pointerToNorm(e));
    converged=false;
    if(centroids.length) assignPoints();
    hint.style.opacity="0";
    updateStats();
  }

  canvas.addEventListener("mousedown",addPoint);
  canvas.addEventListener("touchstart",addPoint,{passive:false});

  kSlider.addEventListener("input",function(){
    K=parseInt(kSlider.value,10); kVal.textContent=K;
    initCentroids();
  });
  speedSlider.addEventListener("input",function(){
    speedVal.textContent=SPEED_LABELS[parseInt(speedSlider.value,10)]||"Normal";
  });
  playBtn.addEventListener("click",function(){
    if(points.length===0){ randomBlobs(); hint.style.opacity="0"; }
    if(converged){ setPlaying(false); return; }
    lastStep=0; setPlaying(!playing);
  });
  stepBtn.addEventListener("click",function(){
    if(points.length===0){ randomBlobs(); hint.style.opacity="0"; return; }
    if(!converged){ setPlaying(false); step(); }
  });
  resetBtn.addEventListener("click",function(){ setPlaying(false); initCentroids(); });
  randomBtn.addEventListener("click",function(){ setPlaying(false); randomBlobs(); hint.style.opacity="0"; });
  clearBtn.addEventListener("click",function(){
    setPlaying(false); points=[]; centroids=[]; assign=[]; iterations=0; converged=false;
    hint.style.opacity="1"; updateStats();
  });

  window.addEventListener("resize",resize);

  // init
  resize();
  kVal.textContent=K;
  speedVal.textContent=SPEED_LABELS[parseInt(speedSlider.value,10)];
  randomBlobs();
  hint.style.opacity="0";
  requestAnimationFrame(frame);
})();
