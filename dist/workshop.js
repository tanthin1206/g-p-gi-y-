/* Physical-paper interactions layered over the textbook activities. */
const workshop = {
  cut: new Set(), cutId: null, cutNodes: [], cutIndex: 0, cutBusy: false,
  cutting: false, cutTimer: null, sound: false, audio: null, foldDrag: null,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  completed: false, mode: true
};
const workshopBase = { load, render, choose, snap, renderFold };
const boardDefs = $('#board defs');
$('#board').setAttribute('tabindex','0');
boardDefs.insertAdjacentHTML('beforeend', `<filter id="paper-grain" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".14"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter>`);

function soundNote(kind='pick') {
  if (!workshop.sound) return;
  try {
    workshop.audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const ctx=workshop.audio;
    if(ctx.state==='suspended')ctx.resume();
    const notes=kind==='complete'?[523.25,659.25,783.99,1046.5]:kind==='paste'?[659.25,880]:kind==='cut'?[150,110]:[380];
    notes.forEach((f,i)=>{let o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.075;o.type=kind==='cut'?'triangle':'sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(kind==='cut'?.035:.07,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.15)});
  } catch { /* Sound remains optional on browsers without Web Audio. */ }
}
$('#sound').onclick=()=>{workshop.sound=!workshop.sound;$('#sound').setAttribute('aria-pressed',String(workshop.sound));$('#sound').textContent=`♫ Âm thanh: ${workshop.sound?'bật':'tắt'}`;soundNote();};
$('#focus').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.workspace').requestFullscreen()}catch{say('Trình duyệt chưa hỗ trợ toàn màn hình. Có thể phóng lớn bằng chế độ hiển thị của trình duyệt.')}};
document.addEventListener('fullscreenchange',()=>$('#focus').textContent=document.fullscreenElement?'⛶ Thu nhỏ':'⛶ Phóng lớn');

function paperSVG(p,s,attrs={}) {return svgEl('polygon',{points:p.points,fill:p.fill,transform:transform(s),stroke:'#fff8','stroke-width':1,...attrs})}
function setPhase(phase){document.querySelectorAll('.process span').forEach(el=>el.classList.toggle('active',el.classList.contains(`process-${phase}`)))}
function paperBounds(n=current){return n===0?[750,350]:n===1?[750,500]:n===2?[400,175]:[800,520]}
function alignPaperGrid(){
  const[w,h]=paperBounds();$('#board').setAttribute('viewBox',`0 0 ${w} ${h}`);
  $('#board > rect').setAttribute('width',w);$('#board > rect').setAttribute('height',h);$('#board > rect').setAttribute('fill',current===3?'#fffdf2':'url(#grid)');
  $('#grid path').setAttribute('stroke','#89977c');$('#grid path').setAttribute('stroke-opacity','.65');
}
function updateModel(){
  const model=$('#modelSVG'),[w,h]=paperBounds();model.setAttribute('viewBox',`0 0 ${w} ${h}`);
  model.innerHTML=`<defs><pattern id="model-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#aab59c" stroke-width="1"/></pattern></defs><rect width="${w}" height="${h}" fill="${current===3?'#fffdf2':'url(#model-grid)'}"/>`;
  if(current<2){const group=svgEl('g',{});group.innerHTML=deco();model.appendChild(group);}
  if(current===1)house().forEach(p=>model.appendChild(paperSVG(p,targetState(p))));
  if(current===3){model.appendChild(svgEl('polygon',{points:silhouette.map(p=>p.join(',')).join(' '),fill:'#588843'}));}
  else parts.forEach(p=>model.appendChild(paperSVG(p,targetState(p))));
}
function materialRender(){
  const count=Object.values(states).filter(p=>p.done).length;
  document.querySelectorAll('#pieces .piece').forEach((el,i)=>{el.classList.toggle('cut',workshop.cut.has(i)||current===3||!workshop.mode);el.setAttribute('aria-pressed',String(selected===i));if(workshop.mode&&current!==3&&!workshop.cut.has(i))el.title=`Cắt giấy: ${parts[i].name}`;});
  document.querySelectorAll('#placed [data-piece]').forEach(el=>{const i=+el.dataset.piece;el.classList.toggle('glued',!!states[i]?.done);el.setAttribute('aria-label',parts[i].name)});
  const done=current===3?Object.keys(states).length:count;
  $('#progressFill').style.width=`${100*done/Math.max(1,parts.length)}%`;
  $('#progressLabel').textContent=current===3?`${done}/7 mảnh đã đặt trên bàn`:`${count}/${parts.length} mảnh đã dán đúng mẫu`;
  $('#boardPrompt').style.opacity=Object.keys(states).length?'0':'1';
  if(current===3)$('#boardPrompt').style.opacity='0';
  $('.status').classList.toggle('complete',count===parts.length&&current!==3);
  if(selected!==null&&states[selected]){
    $('#selectionNote').textContent=`Đang chọn: ${parts[selected].name} · Phím R: xoay · F: lật · Mũi tên: di chuyển`;
    $('#coachText').textContent=states[selected].done?'Mảnh giấy đã được dán vào mẫu. Chọn mảnh tiếp theo nhé!':'Kéo mảnh vào đường viền. Có thể xoay hoặc lật; thả gần đúng để dán.';
  }else{$('#selectionNote').textContent='Mẹo: Có thể chạm chọn mảnh, rồi chạm lên bàn để đặt.';$('#coachText').textContent=current===3?'Dùng đủ 7 mảnh. Xoay, lật và xếp theo hình trong sách.':workshop.mode?'Chọn giấy màu. Cắt theo đường viền, rồi ghép thành hình trong sách.':'Chọn mảnh đã cắt sẵn, kéo vào bàn và ghép theo mẫu bên cạnh.';}
  if(current<2&&!$('#decor .rays')){const rays=svgEl('g',{class:'rays'});for(let a=0;a<360;a+=45){let r=a*Math.PI/180;rays.appendChild(svgEl('path',{d:`M${600+31.25*Math.cos(r)} ${50+31.25*Math.sin(r)}l${6.25*Math.cos(r)} ${6.25*Math.sin(r)}`}));}$('#decor').prepend(rays);}
}
render=function(){workshopBase.render();materialRender()};
load=function(n){
  if(workshop.cutTimer)clearTimeout(workshop.cutTimer);
  clearCelebration();workshop.cutBusy=false;workshop.cutId=null;workshop.cut=new Set();workshop.completed=false;
  $('#cutDialog').close();workshopBase.load(n);
  $('.workshop-strip').hidden=n===4;
  $('.mode-label').hidden=n===3;
  $('#cutMode').checked=workshop.mode;
  if(n!==4){alignPaperGrid();updateModel();materialRender();setPhase(workshop.mode&&n!==3?'cut':'paste');}
};
choose=function(i){
  if(workshop.cutBusy)return;
  if(current!==3&&workshop.mode&&!workshop.cut.has(i)&&!states[i]){openCut(i);return;}
  const fresh=!states[i];workshopBase.choose(i);
  if(fresh){const coords=parts[i].points.split(' ').map(v=>v.split(',').map(Number)),[w,h]=paperBounds(),xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
    states[i].x=25-Math.min(...xs);states[i].y=Math.max(0,Math.min(Math.round(h/50)*25,Math.floor((h-25-Math.max(...ys)+Math.min(...ys))/25)*25))-Math.min(...ys);render();}
  setPhase('paste');soundNote();
};
snap=function(i){
  if(current===3){workshopBase.snap(i);soundNote();return;}
  const s=states[i],p=parts[i],was=s.done;
  s.x=Math.round(s.x/12.5)*12.5;s.y=Math.round(s.y/12.5)*12.5;
  const[w,h]=paperBounds(),bounds=world(p,s),xs=bounds.map(p=>p[0]),ys=bounds.map(p=>p[1]);
  s.x+=Math.max(0,-Math.min(...xs))+Math.min(0,w-Math.max(...xs));s.y+=Math.max(0,-Math.min(...ys))+Math.min(0,h-Math.max(...ys));
  const actual=world(p,s),expected=world(p,targetState(p));
  // Compare the geometry, accepting rotations that leave squares/circles unchanged.
  const discrepancy=Math.max(...actual.map(a=>Math.min(...expected.map(b=>Math.hypot(a[0]-b[0],a[1]-b[1])))));
  if(discrepancy<13){states[i]=targetState(p);render();if(!was){soundNote('paste');pasteSpark(p);say(`Đã dán ${p.name.toLowerCase()}! Chọn mảnh tiếp theo nhé.`)}
    if(Object.values(states).filter(v=>v.done).length===parts.length){setPhase('share');if(!workshop.completed){workshop.completed=true;celebrate();soundNote('complete');}say(current===1?'Hoàn thành! Hãy cùng chia sẻ ngôi nhà của em nhé!':'Con đã ghép đúng mẫu! Lưu lại sản phẩm để chia sẻ nhé.');localStorage.setItem('bai28-'+current,'done');}
  }else{s.done=false;render();say(discrepancy<80?'Gần đúng rồi! Điều chỉnh vị trí hoặc xoay thêm để khớp mẫu.':'Mảnh đã ở trên bàn. Kéo đến đường viền tương ứng để dán.');}
};
function pasteSpark(p){if(workshop.reduced)return;let pts=world(p,targetState(p)),cx=pts.reduce((a,v)=>a+v[0],0)/pts.length,cy=pts.reduce((a,v)=>a+v[1],0)/pts.length;let g=svgEl('g',{'data-effect':'true'}),ring=svgEl('circle',{cx,cy,r:15,class:'success-ring'});g.appendChild(ring);$('#placed').appendChild(g);setTimeout(()=>g.remove(),650);}
var celebrationTimer=null;
function clearCelebration(){if(celebrationTimer)clearTimeout(celebrationTimer);celebrationTimer=null;$('#celebration').replaceChildren();}
function celebrate(){
  clearCelebration();const host=$('#celebration');host.removeAttribute('aria-hidden');
  const notice=document.createElement('div');notice.className='completion-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const heading=document.createElement('strong');heading.textContent='🎉 Chúc mừng em!';
  const detail=document.createElement('span');detail.textContent=current===3?'Em đã ghép khớp đủ 7 mảnh!':current===4?'Em đã hoàn thành chiếc thuyền giấy!':'Em đã ghép xong tất cả các mảnh!';
  notice.append(heading,detail);host.appendChild(notice);
  const effects=document.createElement('div');effects.className='fireworks';effects.setAttribute('aria-hidden','true');host.appendChild(effects);
  const palette=['#ef6a62','#ffbd42','#53b88b','#8b78d1','#48b8d6','#ec82b1'];
  for(let burst=0;burst<4;burst++){
    const origin=document.createElement('div');origin.className='firework-burst';origin.style.left=`${[22,77,35,67][burst]}%`;origin.style.top=`${[35,30,60,56][burst]}%`;
    for(let i=0;i<20;i++){
      const spark=document.createElement('i'),angle=i*Math.PI*2/20,distance=workshop.reduced?35+(i%3)*8:55+(i%3)*24;
      spark.className='firework-spark';spark.style.setProperty('--fx',`${Math.cos(angle)*distance}px`);spark.style.setProperty('--fy',`${Math.sin(angle)*distance}px`);
      spark.style.setProperty('--delay',`${burst*.42}s`);spark.style.setProperty('--spark',palette[(i+burst)%palette.length]);origin.appendChild(spark);
    }effects.appendChild(origin);
  }
  celebrationTimer=setTimeout(clearCelebration,5500);
}

$('#cutMode').onchange=e=>{workshop.mode=e.target.checked;setPhase(workshop.mode?'cut':'paste');materialRender();say(workshop.mode?'Tự cắt: chọn giấy màu để cắt theo đường viền.':'Mảnh đã cắt sẵn: chọn và kéo vào bàn để ghép.');};
function turnPaper(flip=false){
  if(selected===null||!states[selected])return say('Chọn một mảnh giấy trước nhé.');
  snapshot();const p=parts[selected],s=states[selected],coords=p.points.split(' ').map(v=>v.split(',').map(Number));
  const cx=(Math.min(...coords.map(v=>v[0]))+Math.max(...coords.map(v=>v[0])))/2,cy=(Math.min(...coords.map(v=>v[1]))+Math.max(...coords.map(v=>v[1])))/2;
  const apply=(a,f)=>{let r=a*Math.PI/180;return[cx*f*Math.cos(r)-cy*Math.sin(r),cx*f*Math.sin(r)+cy*Math.cos(r)]};
  const before=apply(s.a,s.f);if(flip)s.f*=-1;else s.a=(s.a+45)%360;const after=apply(s.a,s.f);s.x+=before[0]-after[0];s.y+=before[1]-after[1];s.done=false;snap(selected);soundNote();
}
$('#rotate').onclick=()=>turnPaper();$('#flip').onclick=()=>turnPaper(true);
$('#board').addEventListener('pointerdown',()=>$('#board').classList.add('dragging'));
window.addEventListener('pointerup',()=>$('#board').classList.remove('dragging'));
window.addEventListener('pointercancel',()=>$('#board').classList.remove('dragging'));
document.addEventListener('keydown',e=>{
  if(e.target.closest('button,input,select,textarea')||document.querySelector('dialog[open]')||selected===null||!states[selected]||current===4)return;
  if(e.key.toLowerCase()==='r'){$('#rotate').click();e.preventDefault();return;}
  if(e.key.toLowerCase()==='f'){$('#flip').click();e.preventDefault();return;}
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(delta){e.preventDefault();snapshot();const s=states[selected],d=e.shiftKey?20:5;s.x=Math.max(0,Math.min(800,s.x+delta[0]*d));s.y=Math.max(0,Math.min(520,s.y+delta[1]*d));s.done=false;snap(selected);}
});

function buildCutGeometry(points){
  const original=points.trim().split(/\s+/).map(v=>v.split(',').map(Number));
  const xs=original.map(p=>p[0]),ys=original.map(p=>p[1]);
  const minx=Math.min(...xs),miny=Math.min(...ys),w=Math.max(...xs)-minx,h=Math.max(...ys)-miny;
  // A fixed viewport keeps scissors and touch targets the same size for every shape.
  const scale=Math.min(460/Math.max(w,1),230/Math.max(h,1));
  const left=(640-w*scale)/2,top=(360-h*scale)/2;
  const vertices=original.map(([x,y])=>[left+(x-minx)*scale,top+(y-miny)*scale]);
  const nodes=[vertices[0]],lengths=[0],corners=[0];let total=0;
  // Subdivide each edge separately: no sampled segment can cut across a corner.
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(length<1e-8)continue;
    const count=Math.ceil(length/14);
    for(let j=1;j<=count;j++){
      nodes.push(j===count?b:[a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count]);
      lengths.push(total+length*j/count);
    }
    total+=length;corners.push(nodes.length-1);
  }
  return{vertices,nodes,lengths,corners,total,left,top,width:w*scale,height:h*scale};
}
function openCut(i){
  workshop.cutId=i;workshop.cutIndex=0;workshop.cutBusy=false;setPhase('cut');
  const p=parts[i],geometry=buildCutGeometry(p.points),coords=geometry.vertices;
  const canvas=$('#cutCanvas');canvas.setAttribute('viewBox','0 0 640 360');canvas.setAttribute('preserveAspectRatio','xMidYMid meet');canvas.classList.remove('cutting');
  canvas.innerHTML=`<g class="cut-paper"><rect id="uncutPaper" x="${geometry.left-24}" y="${geometry.top-24}" width="${geometry.width+48}" height="${geometry.height+48}" fill="${p.fill}" rx="2"/><polygon id="cutShape" points="${coords.map(c=>c.join(',')).join(' ')}" fill="${p.fill}"/><path id="cutLine" d="M${coords.map(c=>c.join(',')).join('L')}Z" class="cut-boundary"/><path id="cutTrace" class="cut-traced"/></g><circle id="cutDot" class="cut-dot" r="7"/><g id="scissorHead" class="cut-scissors"><g class="scissor-blades"><path d="M-8 -5L17 -17M-8 5L17 17" fill="none" stroke="#e5e6dc" stroke-width="4" stroke-linecap="round"/><circle cx="-14" cy="-9" r="7" fill="none" stroke="#e9ae64" stroke-width="4"/><circle cx="-14" cy="9" r="7" fill="none" stroke="#e9ae64" stroke-width="4"/><circle r="3" fill="#a0aba0"/></g></g>`;
  workshop.cutNodes=geometry.nodes;workshop.cutLengths=geometry.lengths;workshop.cutCorners=geometry.corners;workshop.cutTotal=geometry.total;
  $('#cutTitle').textContent=`Cắt ${p.name.toLowerCase()}`;$('#cutNext').disabled=false;$('#cutNext').textContent='✂ Cắt đoạn tiếp theo';$('#cutDialog').classList.remove('cut-finished');
  updateCut();$('#cutDialog').showModal();
}
function updateCut(){
  const nodes=workshop.cutNodes,i=workshop.cutIndex,node=nodes[Math.min(i,nodes.length-1)];
  $('#cutDot').setAttribute('cx',node[0]);$('#cutDot').setAttribute('cy',node[1]);
  const prev=nodes[Math.max(0,i-1)],next=nodes[Math.min(i+1,nodes.length-1)],from=i<nodes.length-1?node:prev,to=i<nodes.length-1?next:node,angle=Math.atan2(to[1]-from[1],to[0]-from[0])*180/Math.PI;
  $('#scissorHead').setAttribute('transform',`translate(${node[0]} ${node[1]}) rotate(${angle})`);
  if(i>0)$('#cutTrace').setAttribute('d','M'+nodes.slice(0,i+1).map(p=>p.join(',')).join('L'));
  $('#cutProgress').textContent=`Đã cắt ${Math.round(workshop.cutLengths[i]/workshop.cutTotal*100)}% đường viền`;
}
function cutForward(nextIndex=workshop.cutIndex+1){
  if(workshop.cutBusy||workshop.cutId===null)return;
  workshop.cutIndex=Math.min(nextIndex,workshop.cutNodes.length-1);updateCut();soundNote('cut');
  if(workshop.cutIndex===workshop.cutNodes.length-1){
    workshop.cutBusy=true;workshop.cut.add(workshop.cutId);$('#cutDialog').classList.add('cut-finished');$('#uncutPaper').setAttribute('opacity','.15');$('#cutDot').style.opacity='0';$('#cutNext').disabled=true;$('#cutProgress').textContent='Cắt xong! Mang mảnh giấy sang bàn ghép…';
    const id=workshop.cutId;
    workshop.cutTimer=setTimeout(()=>{$('#cutDialog').close();workshop.cutId=null;workshop.cutBusy=false;workshop.cutTimer=null;choose(id);setPhase('paste');say('Mảnh giấy đã cắt xong. Kéo vào đường viền để dán nhé!');},workshop.reduced?50:750);
  }
}
$('#cutNext').onclick=()=>cutForward(workshop.cutCorners.find(i=>i>workshop.cutIndex)??workshop.cutNodes.length-1);
$('#closeCut').onclick=()=>{if(workshop.cutBusy)return;$('#cutDialog').close();workshop.cutId=null;setPhase('paste');};
$('#cutDialog').addEventListener('cancel',e=>{if(workshop.cutBusy)e.preventDefault();else{workshop.cutId=null;setPhase('paste')}});
function cutPoint(e){let p=$('#cutCanvas').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('#cutCanvas').getScreenCTM().inverse())}
function followCut(e){if(workshop.cutId===null||workshop.cutBusy)return;let p=cutPoint(e),node=workshop.cutNodes[workshop.cutIndex];if(Math.hypot(p.x-node[0],p.y-node[1])<22)cutForward();}
$('#cutCanvas').addEventListener('pointerdown',e=>{workshop.cutting=true;$('#cutCanvas').classList.add('cutting');$('#cutCanvas').setPointerCapture(e.pointerId);followCut(e);});
$('#cutCanvas').addEventListener('pointermove',e=>{if(workshop.cutting)followCut(e)});
for(const ev of ['pointerup','pointercancel'])$('#cutCanvas').addEventListener(ev,()=>{workshop.cutting=false;$('#cutCanvas').classList.remove('cutting')});

const foldCaptions=[
  'Đặt giấy hình chữ nhật trước mặt. Gấp đôi và miết nhẹ theo nếp gấp.',
  'Quan sát đường giữa. Gấp hai góc phía trên vào giữa để tạo hình tam giác.',
  'Gấp mép giấy phía dưới lên trên, thực hiện theo hình hướng dẫn trong sách.',
  'Gấp các góc thừa vào trong để mép giấy gọn lại.',
  'Mở phần giữa và ép hai góc lại để tạo hình vuông. Mở nhẹ hai mép giấy rồi miết phẳng theo nếp.',
  'Gấp phần dưới lên để tạo hình tam giác. Miết nhẹ nếp gấp.',
  'Mở phần giữa lần nữa, ép lại thành hình vuông theo hình trong sách.',
  'Kéo nhẹ hai góc phía trên sang hai bên, mở và chỉnh đáy để tạo thành thuyền.'
];
renderFold=function(){
  workshopBase.renderFold();
  const svg=$('.fold-picture svg');
  svg.innerHTML=`<style>.crease{fill:none;stroke-dasharray:8 7;stroke-width:2}</style>${step>0?`<g class="fold-before">${folds[step-1]}</g>`:''}<g class="fold-current ${step===7?'boat':''}">${folds[step]}</g>${step<7?'<path class="fold-arrow" d="M430 300Q520 205 440 130"/><path class="fold-arrow-head" d="M440 130L459 138L441 150Z"/>':''}<text x="30" y="390" stroke="none" fill="#95856e" font-size="13">BƯỚC ${step+1} / 8</text>`;
  const picture=$('.fold-picture');picture.insertAdjacentHTML('afterbegin','<div class="fold-control"><button id="replayFold">↻ Xem lại chuyển động</button><button id="readFold">♫ Nghe hướng dẫn</button></div>');picture.insertAdjacentHTML('beforeend',`<span class="fold-swipe">${step===7?'Thuyền của em đã sẵn sàng ra khơi!':'Vuốt lên trên tờ giấy hoặc bấm “Tiếp” để sang bước sau'}</span>`);
  $('.fold-nav').insertAdjacentHTML('afterend',`<p class="fold-caption"><b>Bước ${step+1}.</b> ${foldCaptions[step]}</p>`);
  $('#replayFold').onclick=()=>{renderFold();soundNote();};
  $('#readFold').onclick=()=>{if(!('speechSynthesis'in window)){say('Thiết bị chưa hỗ trợ đọc hướng dẫn. Hãy theo dõi lời hướng dẫn trên màn hình.');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(`Bước ${step+1}. ${steps[step]}`);u.lang='vi-VN';u.rate=.85;if(typeof setMusicDucking==='function'){setMusicDucking(false);u.onstart=()=>setMusicDucking(true);u.onend=u.onerror=()=>setMusicDucking(false);}speechSynthesis.speak(u);};
  picture.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;workshop.foldDrag={x:e.clientX,y:e.clientY};picture.setPointerCapture(e.pointerId)});
  picture.addEventListener('pointerup',e=>{if(!workshop.foldDrag)return;const dy=e.clientY-workshop.foldDrag.y;workshop.foldDrag=null;if(dy< -55&&step<7){step++;renderFold();soundNote('paste')}else if(dy>55&&step>0){step--;renderFold();soundNote()}});
  picture.addEventListener('pointercancel',()=>workshop.foldDrag=null);
  const next=$('#nextStep'),baseNext=next.onclick;next.onclick=()=>{const was=step;baseNext();soundNote(was===7?'complete':'paste');if(was===7)celebrate();};
};
$('#save').onclick=()=>{
  const board=$('#board'),[w,h]=paperBounds(),copy=board.cloneNode(true);
  copy.setAttribute('xmlns',NS);copy.setAttribute('width',w);copy.setAttribute('height',h);copy.removeAttribute('tabindex');copy.querySelector('#targets').remove();copy.querySelectorAll('[data-effect]').forEach(el=>el.remove());
  const bg=svgEl('rect',{width:w,height:h,fill:'#fffdf2'});copy.insertBefore(bg,copy.querySelector('rect'));
  copy.querySelectorAll('#placed polygon').forEach(el=>{el.setAttribute('stroke','#42543d');el.setAttribute('stroke-width','.7');el.setAttribute('filter','url(#paper-grain)')});
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'})),img=new Image();
  img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const link=document.createElement('a');link.download=`bai-28-trang-${lessons[current][0]}.png`;link.href=canvas.toDataURL();link.click();URL.revokeObjectURL(url)};
  img.onerror=()=>{URL.revokeObjectURL(url);say('Chưa lưu được ảnh. Hãy thử lại trên Chrome hoặc Edge.');};img.src=url;
};
load(0);
