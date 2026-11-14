let tgModel=null,tgTurning=null,tgShowSolution=false;
const tgPreviousLoad=load,tgPreviousRender=render,tgPreviousSnap=snap,tgPreviousChoose=choose;
load=function(n){
  tgTurning=null;tgShowSolution=false;tgPreviousLoad(n);
  $('#guides').closest('label').hidden=n===3;$('#tgSolutionButton')?.remove();
  if(n!==3){tgModel=null;return;}
  if(tangram>1)tangram=0;
  tgModel=makeTangramModel(tangram);states={};history=[];selected=null;
  parts=tgModel.local.map((points,i)=>poly(points.map(p=>p.join(',')).join(' '),colors[i],tgModel.targets[i].x,tgModel.targets[i].y,tgModel.names[i],tgModel.targets[i].a));
  const solutionButton=document.createElement('button');solutionButton.id='tgSolutionButton';solutionButton.textContent='◈ Hiện cách ghép';solutionButton.setAttribute('aria-pressed','false');solutionButton.onclick=()=>{tgShowSolution=!tgShowSolution;solutionButton.textContent=tgShowSolution?'◈ Ẩn cách ghép':'◈ Hiện cách ghép';solutionButton.setAttribute('aria-pressed',String(tgShowSolution));render();};$('.board-label').appendChild(solutionButton);
  workshop.completed=false;render();say(tgModel.customFrame?'Hình thứ ba dùng bộ 7 mảnh riêng: ghép kín phần xanh, giữ trống mũi tên.':'Dùng đủ 7 mảnh. Chọn mảnh rồi kéo vào mẫu; chạm hoặc kéo nút ↻ để xoay.');
};
function tgDrawModel(){
  $('#targets').innerHTML='';const group=svgEl('g',{fill:'#4d8c3e'});
  tgModel.polygons.forEach((points,i)=>group.appendChild(svgEl('polygon',{points:points.map(p=>p.join(',')).join(' '),'data-target':i,fill:tgShowSolution?colors[i]:'#4d8c3e',stroke:tgShowSolution?'#fffdf2':'#4d8c3e','stroke-width':tgShowSolution?1.3:.5})));
  $('#targets').appendChild(group);
  const model=$('#modelSVG');model.setAttribute('viewBox','300 20 440 480');model.innerHTML='';
  tgModel.polygons.forEach((points,i)=>model.appendChild(svgEl('polygon',{points:points.map(p=>p.join(',')).join(' '),fill:tgShowSolution?colors[i]:'#4d8c3e',stroke:tgShowSolution?'#fffdf2':'#4d8c3e','stroke-width':tgShowSolution?1.3:.5})));
}
function tgDrawHandle(){
  $('#rotationUI')?.remove();if(selected===null||!states[selected])return;
  const c=tgCenter(tgModel.local[selected],states[selected]),matrix=$('#board').getScreenCTM(),pixel=matrix?1/Math.hypot(matrix.a,matrix.b):1,r=Math.min(150,Math.max(60,44*pixel)),hit=22*pixel,visible=14*pixel;
  let angle=tgTurning?.pointerAngle??-Math.PI/2;
  if(!tgTurning&&c[1]<90)angle=0;
  if(!tgTurning&&c[0]>730)angle=Math.PI;
  const h=[Math.max(hit,Math.min(800-hit,c[0]+r*Math.cos(angle))),Math.max(hit,Math.min(520-hit,c[1]+r*Math.sin(angle)))],group=svgEl('g',{id:'rotationUI','data-effect':'true'});
  group.appendChild(svgEl('path',{d:`M${c[0]},${c[1]}L${h[0]},${h[1]}`,stroke:'#466e55','stroke-width':1.5,'stroke-dasharray':'4 4','pointer-events':'none'}));
  group.appendChild(svgEl('circle',{cx:c[0],cy:c[1],r:3,fill:'#466e55','pointer-events':'none'}));
  const knob=svgEl('g',{'data-rotation-handle':'true',role:'button','aria-label':'Kéo để xoay mảnh hoặc chạm để xoay 45 độ',tabindex:0,style:'cursor:grab;touch-action:none'});
  knob.appendChild(svgEl('circle',{cx:h[0],cy:h[1],r:hit,fill:'transparent'}));
  knob.appendChild(svgEl('circle',{cx:h[0],cy:h[1],r:visible,fill:'#fffdf2',stroke:'#39785b','stroke-width':2*pixel}));
  const text=svgEl('text',{x:h[0],y:h[1]+6*pixel,'text-anchor':'middle','font-size':21*pixel,fill:'#39785b','pointer-events':'none'});text.textContent='↻';knob.appendChild(text);group.appendChild(knob);$('#placed').appendChild(group);
}
render=function(){
  tgPreviousRender();if(current!==3||!tgModel)return;
  tgDrawModel();tgDrawHandle();
  const done=Object.values(states).filter(s=>s.done).length;
  $('#progress').textContent=`${done}/7 mảnh khớp mẫu`;
  $('#progressLabel').textContent=`${done}/7 mảnh đã ghép đúng`;
  $('#progressFill').style.width=`${done/7*100}%`;
  $('#selectionNote').textContent='Chạm ↻: xoay 45° · Giữ và kéo ↻: xoay bằng chuột hoặc ngón tay · ⇄: lật mảnh';
  $('#coachText').textContent=tgModel.customFrame?'Bộ 7 mảnh riêng cho hình xanh. Ghép phần nền xanh, giữ nguyên khoảng trống mũi tên.':'Mỗi mẫu được tạo từ đúng 7 mảnh này. Thả gần đúng vị trí để mảnh tự khớp.';
};
choose=function(i){tgPreviousChoose(i);if(current===3&&tgModel)tgDrawHandle();};
function tgComplete(){
  if(!workshop.completed){workshop.completed=true;celebrate();soundNote('complete');}
  say('Hoàn thành! Cả 7 mảnh đã ghép kín hình, không chồng lên nhau.');localStorage.setItem('bai28-3','done');setPhase('share');
}
snap=function(i){
  if(current!==3||!tgModel)return tgPreviousSnap(i);
  const before=states[i];states[i]=tgMagnetAngle(tgModel,i,before);
  const occupied=Object.entries(states).filter(([k,s])=>+k!==i&&s.done).map(([,s])=>s.slot),match=tgFindMatch(tgModel,i,states[i],occupied),best=match.slot,error=match.error;
  if(best>=0&&error<Math.max(18,tgModel.unit*.22)){
    states[i]={...tgModel.targets[best],slot:best,done:true};soundNote('paste');
    say(`Đã khớp ${parts[i].name.toLowerCase()}! Tiếp tục ghép nhé.`);
  }else{
    const s=states[i],p=tgTransform(tgModel.local[i],s),xs=p.map(v=>v[0]),ys=p.map(v=>v[1]);
    s.x+=Math.max(0,8-Math.min(...xs))+Math.min(0,792-Math.max(...xs));s.y+=Math.max(0,8-Math.min(...ys))+Math.min(0,512-Math.max(...ys));
    s.slot=null;s.done=false;say('Đã đặt mảnh. Kéo vào mẫu hoặc kéo nút ↻ để xoay cho khớp.');
  }
  render();if(Object.values(states).filter(s=>s.done).length===7)tgComplete();
};
checkTangram=function(){
  if(current!==3||!tgModel)return;
  if(Object.keys(states).length!==7)return say('Hãy dùng đủ cả 7 mảnh ghép nhé.');
  if(Object.values(states).every(s=>s.done)){tgComplete();return;}
  const polygons=parts.map((p,i)=>tgTransform(tgModel.local[i],states[i]));let target=0,miss=0,spill=0,overlap=0;
  for(let x=1.1;x<800;x+=3)for(let y=1.7;y<520;y+=3){const insideTarget=tgModel.polygons.some(p=>inside(x,y,p)),count=polygons.filter(p=>inside(x,y,p)).length;if(insideTarget){target++;if(!count)miss++;}else if(count)spill++;if(count>1)overlap++;}
  if((miss+spill+overlap)/target<.025)tgComplete();else say('Chưa kín hình: kiểm tra khoảng trống, mảnh chồng nhau hoặc nằm ngoài mẫu.');
};
function tgPoint(e){const p=$('#board').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('#board').getScreenCTM().inverse());}
$('#board').addEventListener('pointerdown',e=>{
  if(current!==3||!tgModel||!e.target.closest('[data-rotation-handle]')||selected===null)return;
  e.preventDefault();e.stopImmediatePropagation();snapshot();
  const p=tgPoint(e),center=tgCenter(tgModel.local[selected],states[selected]);
  tgTurning={i:selected,center,start:Math.atan2(p.y-center[1],p.x-center[0]),state:{...states[selected]},down:[e.clientX,e.clientY],moved:false,pointerAngle:Math.atan2(p.y-center[1],p.x-center[0])};
  $('#board').setPointerCapture(e.pointerId);
},{capture:true});
$('#board').addEventListener('pointermove',e=>{
  if(!tgTurning)return;e.preventDefault();e.stopImmediatePropagation();
  const p=tgPoint(e),r=tgTurning,angle=Math.atan2(p.y-r.center[1],p.x-r.center[0]);
  r.moved ||=Math.hypot(e.clientX-r.down[0],e.clientY-r.down[1])>6;r.pointerAngle=angle;
  const delta=Math.atan2(Math.sin(angle-r.start),Math.cos(angle-r.start))*180/Math.PI;
  states[r.i]=tgRotateAtCenter(tgModel.local[r.i],r.state,r.state.a+delta);
  $(`#placed [data-piece="${r.i}"]`)?.setAttribute('transform',transform(states[r.i]));tgDrawHandle();
},{capture:true});
function finishTangramTurn(e,cancel=false){
  if(!tgTurning)return;e.preventDefault();e.stopImmediatePropagation();const r=tgTurning;tgTurning=null;
  if(cancel){states[r.i]=r.state;render();return;}
  if(!r.moved)states[r.i]=tgRotateAtCenter(tgModel.local[r.i],r.state,r.state.a+45);
  snap(r.i);
}
$('#board').addEventListener('pointerup',e=>finishTangramTurn(e),{capture:true});
$('#board').addEventListener('pointercancel',e=>finishTangramTurn(e,true),{capture:true});
$('#board').addEventListener('keydown',e=>{if(e.target.closest('[data-rotation-handle]')&&['Enter',' '].includes(e.key)){e.preventDefault();$('#rotate').click();}});
