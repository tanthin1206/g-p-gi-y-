/* Eight textbook steps with hinge-based paper flaps and a pausable demonstration. */
const foldMotion={playing:false,paused:false,advancing:false,raf:0,elapsed:0,start:0,duration:6500};
const foldOriginalRender=renderFold,foldOriginalLoad=load;
const foldLerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function hingeFold(points,a,b,t){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/length,uy=(b[1]-a[1])/length,nx=-uy,ny=ux;
  return points.map(p=>{const dx=p[0]-a[0],dy=p[1]-a[1],along=dx*ux+dy*uy,normal=dx*nx+dy*ny,c=Math.cos(Math.PI*t),lift=Math.abs(normal)*Math.sin(Math.PI*t);
    return[a[0]+along*ux+normal*nx*c,a[1]+along*uy+normal*ny*c-lift*.22];});
}
function foldDrawing(n,t){
  const front='#b5a1ce',back='#e7b5c4',edge='#756382';let out='';
  const polygon=(pts,color=front)=>{out+=`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${color}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>`;};
  const line=(a,b)=>{out+=`<path d="M${a.join(',')}L${b.join(',')}" fill="none" stroke="#89748f" stroke-width="1.6" stroke-dasharray="6 5"/>`;};
  const flap=(pts,a,b,q)=>{polygon(hingeFold(pts,a,b,q),q>.5?back:front);line(a,b);};
  const arrow=(d,end,rotation=0)=>{if(t<.92)out+=`<path d="${d}" class="fold-arrow"/><path d="M-8 8L0 0L8 8" transform="translate(${end}) rotate(${rotation})" fill="none" stroke="#bd6a50" stroke-width="3"/>`;};
  const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},q=ease(t);
  if(n===0){
    polygon([[180,200],[420,200],[420,340],[180,340]],back);
    flap([[180,60],[420,60],[420,200],[180,200]],[180,200],[420,200],q);
    line([300,200],[300,340]);arrow('M455 95Q515 190 455 295','455 295',180);
  }else if(n===1){
    polygon([[180,160],[420,160],[420,300],[180,300]],back);
    flap([[180,160],[300,160],[180,280]],[300,160],[180,280],ease(t*1.6));
    flap([[300,160],[420,160],[420,280]],[300,160],[420,280],ease((t-.35)*1.6));
    line([300,160],[300,300]);arrow('M200 125Q255 110 285 225','285 225',180);arrow('M400 125Q345 110 315 225','315 225',180);
  }else if(n===2){
    polygon([[180,280],[300,150],[420,280]],front);
    flap([[180,280],[420,280],[420,310],[180,310]],[180,280],[420,280],q);
    line([300,150],[300,280]);arrow('M455 315Q510 270 455 235','455 235',-40);
  }else if(n===3){
    polygon([[180,280],[300,150],[420,280]],front);polygon([[180,250],[420,250],[420,280],[180,280]],back);
    flap([[180,250],[210,250],[180,280]],[210,250],[180,280],ease(t*1.6));
    flap([[390,250],[420,250],[420,280]],[390,250],[420,280],ease((t-.35)*1.6));
    arrow('M145 230Q145 290 220 290','220 290',90);arrow('M455 230Q455 290 380 290','380 290',-90);
  }else if(n===4||n===6){
    const from=[[300,130],[420,280],[300,280],[180,280]],to=[[300,70],[420,210],[300,350],[180,210]],p=from.map((v,i)=>foldLerp(v,to[i],q));
    polygon([p[0],p[1],p[2]],back);polygon([p[0],p[2],p[3]],front);
    const spread=30*Math.sin(Math.PI*q);polygon([p[0],[300+spread,210],p[2],[300-spread,210]],'#d8b2d1');
    line(p[0],p[2]);arrow('M275 245Q210 230 175 190','175 190',-55);arrow('M325 245Q390 230 425 190','425 190',55);
  }else if(n===5){
    polygon([[300,70],[420,210],[180,210]],front);
    flap([[180,210],[420,210],[300,350]],[180,210],[420,210],q);
    line([300,70],[300,210]);arrow('M465 310Q525 215 465 125','465 125',-30);
  }else{
    const leftStart=[[300,70],[180,210],[300,350],[300,210]],rightStart=[[300,70],[420,210],[300,350],[300,210]],leftEnd=[[80,190],[190,310],[280,310],[280,270]],rightEnd=[[480,190],[370,310],[280,310],[280,270]];
    polygon(leftStart.map((p,i)=>foldLerp(p,leftEnd[i],q)),back);
    polygon(rightStart.map((p,i)=>foldLerp(p,rightEnd[i],q)),'#db9fb7');
    polygon([[300,260],[300,100],[300,260]].map((p,i)=>foldLerp(p,[[190,310],[280,160],[370,310]][i],q)),front);
    line(foldLerp([300,100],[280,160],q),foldLerp([300,260],[280,270],q));
    arrow('M265 120Q200 115 145 170','145 170',-70);arrow('M335 120Q400 115 455 170','455 170',70);
  }
  out+=`<text x="30" y="390" fill="#95856e" stroke="none" font-size="13">BƯỚC ${n+1} / 8 · ${Math.round(t*100)}%</text>`;
  return out;
}
function cancelFoldFrame(){if(foldMotion.raf)cancelAnimationFrame(foldMotion.raf);foldMotion.raf=0;}
function stopFoldDemo(){cancelFoldFrame();foldMotion.playing=false;foldMotion.paused=false;foldMotion.elapsed=0;foldMotion.advanceAfterStep=false;}
function updateFoldControls(){
  const button=$('#autoFold');if(!button)return;
  button.textContent=foldMotion.playing?'Ⅱ Tạm dừng':foldMotion.paused?'▶ Tiếp tục tự gấp':step===7?'↻ Tự gấp lại từ đầu':'▶ Tự gấp';
  button.setAttribute('aria-pressed',String(foldMotion.playing));
}
function foldAnimationProgress(elapsed){
  const bridge=foldMotion.bridgeMs||0,hold=step===0?Math.min(1000,foldMotion.duration*.2):0;
  return Math.max(0,Math.min(1,(elapsed-bridge-hold)/Math.max(1,foldMotion.duration*.76-bridge-hold)));
}
function namespaceFoldSVG(svg,prefix){return svg.replace(/\bid="([^"]+)"/g,`id="${prefix}$1"`).replace(/url\(#([^)]+)\)/g,`url(#${prefix}$1)`);}
function drawFoldFrame(elapsed){
  const t=foldAnimationProgress(elapsed),svg=$('.fold-picture > svg');
  if(!svg||current!==4)return;
  // Adjacent textbook poses share coordinates; keep a single opaque sheet on screen.
  svg.innerHTML=foldDrawing(step,t);
  const scrub=$('#foldScrub');if(scrub)scrub.value=String(Math.round(t*1000));
  $('#foldMotionFill').style.width=`${100*(step+Math.min(1,elapsed/foldMotion.duration))/8}%`;
  $('#foldMotionStatus').textContent=foldMotion.playing?`Đang tự gấp · Bước ${step+1}/8`:foldMotion.paused?'Đã tạm dừng':t<1?'Quan sát chiều gấp và nếp gấp trên giấy':'Đã minh họa xong bước này. Làm theo bằng giấy thật nhé!';
}
function playFoldFrames(){
  cancelFoldFrame();foldMotion.start=performance.now()-foldMotion.elapsed;let lastPaint=-Infinity;
  const tick=now=>{
    if(current!==4){stopFoldDemo();return;}
    foldMotion.elapsed=Math.min(foldMotion.duration,now-foldMotion.start);
    if(typeof innerWidth==='number'&&innerWidth<=760&&foldMotion.elapsed<foldMotion.duration&&now-lastPaint<33){foldMotion.raf=requestAnimationFrame(tick);return;}
    lastPaint=now;drawFoldFrame(foldMotion.elapsed);
    if(foldMotion.elapsed<foldMotion.duration){foldMotion.raf=requestAnimationFrame(tick);return;}
    foldMotion.raf=0;
    if(foldMotion.playing){
      if(step<7){foldMotion.advanceAfterStep=false;step++;foldMotion.advancing=true;renderFold();foldMotion.advancing=false;soundNote('paste');}
      else{foldMotion.playing=false;foldMotion.paused=false;updateFoldControls();$('#foldMotionStatus').textContent='Đã tự gấp xong 8 bước. Thuyền của em đã hoàn thành!';say('Đã minh họa đủ 8 bước gấp thuyền buồm.');soundNote('complete');celebrate();}
    }else if(foldMotion.advanceAfterStep&&step<7){foldMotion.advanceAfterStep=false;step++;renderFold();}
  };
  foldMotion.raf=requestAnimationFrame(tick);
}
renderFold=function(){
  cancelFoldFrame();
  const previous=foldMotion.lastRenderedStep,replay=!!foldMotion.replayRequested;foldMotion.replayRequested=false;
  foldMotion.bridgeFromStep=previous;foldMotion.bridgeMs=0;foldMotion.lastRenderedStep=step;
  if(!foldMotion.advancing){foldMotion.playing=false;foldMotion.paused=false;}
  const restored=foldMotion.restorePose;
  if(restored){
    foldMotion.duration=[3500,6500,9000].includes(restored.duration)?restored.duration:6500;
    foldMotion.elapsed=Math.max(0,Math.min(foldMotion.duration,Number(restored.elapsed)||0));
    paperView.tilt=[.08,.48,.85].includes(restored.camera)?restored.camera:.48;
    foldMotion.paused=foldMotion.elapsed>0;
  }else foldMotion.elapsed=0;
  foldOriginalRender();
  const picture=$('.fold-picture');
  picture.insertAdjacentHTML('beforebegin',`<div class="fold-auto-bar"><button id="autoFold" aria-pressed="false">▶ Tự gấp</button><label>Tốc độ <select id="foldSpeed"><option value="9000">Chậm</option><option value="6500">Vừa</option><option value="3500">Nhanh</option></select></label><span>Phát lần lượt 8 bước theo sách</span></div>`);
  picture.insertAdjacentHTML('afterend','<div class="fold-motion-track"><div id="foldMotionFill"></div></div><p id="foldMotionStatus" role="status" aria-live="polite"></p>');
  const svg=picture.querySelector(':scope > svg');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Hoạt ảnh gấp giấy bước ${step+1}: ${steps[step]}`);
  $('#foldSpeed').value=String(foldMotion.duration);
  $('#autoFold').onclick=()=>{
    if(foldMotion.playing){cancelFoldFrame();foldMotion.playing=false;foldMotion.paused=true;updateFoldControls();drawFoldFrame(foldMotion.elapsed);return;}
    if(foldMotion.paused){foldMotion.playing=true;foldMotion.paused=false;updateFoldControls();playFoldFrames();return;}
    step=0;foldMotion.playing=true;foldMotion.advancing=true;renderFold();foldMotion.advancing=false;
  };
  $('#foldSpeed').onchange=e=>{const fraction=foldMotion.elapsed/foldMotion.duration;foldMotion.duration=+e.target.value;foldMotion.elapsed=fraction*foldMotion.duration;if(foldMotion.paused)drawFoldFrame(foldMotion.elapsed);else playFoldFrames();};
  updateFoldControls();drawFoldFrame(foldMotion.elapsed);
  if(!restored&&(step!==0||foldMotion.playing||replay))playFoldFrames();
  else if(!restored)$('#foldMotionStatus').textContent='Tờ giấy chữ nhật ban đầu · Bấm “Gấp bước này” hoặc “Tự gấp” để bắt đầu.';
};
load=function(n){stopFoldDemo();foldOriginalLoad(n);};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&foldMotion.playing){cancelFoldFrame();foldMotion.playing=false;foldMotion.paused=true;updateFoldControls();drawFoldFrame(foldMotion.elapsed);}});
