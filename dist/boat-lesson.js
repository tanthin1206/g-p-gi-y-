/* The eight operations and their final silhouettes follow the supplied page 115. */
const BOAT_CAPTIONS=[
 'Chuẩn bị giấy hình chữ nhật. Gấp tờ giấy làm đôi và miết phẳng; đường giữa là nếp để căn hai góc ở bước sau.',
 'Gấp lần lượt góc trái rồi góc phải của mặt trước vào đường giữa. Giữ nguyên mặt giấy đang nhìn.',
 'Gấp mép dưới của mặt trước lên. Lật tờ giấy, gấp mép của mặt sau tương tự rồi miết nếp.',
 'Gấp các góc mép giấy vào trong. Thực hiện ở cả hai mặt để thu gọn thành hình tam giác.',
 'Luồn tay vào phía dưới, mở túi giấy rồi ép hai góc lại theo chiều ngược để tạo hình vuông.',
 'Gấp góc dưới lên trên thành tam giác. Lật giấy, gấp lớp còn lại tương tự rồi miết phẳng.',
 'Mở túi giấy từ phía dưới một lần nữa, đưa hai góc lại gần nhau và ép thành hình vuông.',
 'Giữ hai góc trên, kéo nhẹ sang hai bên, mở lòng thuyền và chỉnh đáy để tạo thuyền buồm.'
];
BOAT_CAPTIONS.forEach((text,i)=>foldCaptions[i]=text);
function bookBoatScene(n,t){
 const faces=[],creases=[],colors=[],smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)},q=smooth(t);
 const add=(p,z=0,color=null)=>{faces.push(p.map(v=>[v[0],v[1],(v[2]||0)+z]));colors.push(color)};
 const flap=(p,a,b,f,back=false,palette=null)=>{let shape=rotatePaper3D(p,a,b,f);if(back)shape=shape.map(v=>[v[0],v[1],-v[2]]);add(shape,back?-3:3,palette?palette[f>.5?1:0]:null);creases.push([a,b]);};
 const cap=()=>{add([[180,260],[300,140],[420,260]],0,'ae9ac9');};
 let turn=0,phase='',grips=null;
 if(n===0){
   add([[180,210],[420,210],[420,370],[180,370]],0,'e6b6c8');
   flap([[180,50],[420,50],[420,210],[180,210]],[180,210],[420,210],smooth(t/.78),false,['e6b6c8','ae9ac9']);
   const shift=70*smooth((t-.73)/.27);faces.forEach(p=>p.forEach(v=>v[1]-=shift));creases.forEach(p=>p.forEach(v=>v[1]-=shift));
   if(t===0){faces.length=0;colors.length=0;add([[180,50],[420,50],[420,370],[180,370]],0,'e6b6c8');creases.push([[300,50],[300,370]]);}
   phase=t<.8?'Gấp đôi tờ giấy hình chữ nhật':'Miết nếp và đặt giấy nằm ngang';
 }else if(n===1){
   add([[300,140],[420,260],[420,300],[180,300],[180,260]],0,'ae9ac9');
   flap([[180,140],[300,140],[180,260]],[300,140],[180,260],smooth(t/.43),false,['ae9ac9','ae9ac9']);
   flap([[300,140],[420,140],[420,260]],[300,140],[420,260],smooth((t-.45)/.43),false,['ae9ac9','ae9ac9']);
   creases.push([[300,140],[300,300]]);
   phase=t<.45?'Gấp góc trái của mặt trước vào giữa':t<.9?'Gấp góc phải của mặt trước vào giữa':'Hai mép gặp đường giữa · Giữ nguyên mặt giấy';
 }else if(n===2){
   cap();
   flap([[180,260],[420,260],[420,300],[180,300]],[180,260],[420,260],smooth(t/.27),false,['ae9ac9','e6b6c8']);
   flap([[180,260],[420,260],[420,300],[180,300]],[180,260],[420,260],smooth((t-.4)/.35),true,['ae9ac9','e6b6c8']);
   turn=Math.PI*(smooth((t-.27)/.12)-smooth((t-.78)/.15));
   phase=t<.27?'Gấp mép giấy mặt trước lên':t<.4?'Lật tờ giấy sang mặt sau':t<.78?'Gấp mép giấy mặt sau lên':'Miết cả hai nếp gấp';
 }else if(n===3){
   cap();add([[220,220],[380,220],[380,260],[220,260]],1,'e6b6c8');
   const left=[[180,220],[220,220],[180,260]],right=[[380,220],[420,220],[420,260]];
   flap(left,[220,220],[180,260],smooth(t/.2),false,['e6b6c8','ae9ac9']);flap(right,[380,220],[420,260],smooth((t-.2)/.2),false,['e6b6c8','ae9ac9']);
   flap(left,[220,220],[180,260],smooth((t-.53)/.17),true,['e6b6c8','ae9ac9']);flap(right,[380,220],[420,260],smooth((t-.7)/.17),true,['e6b6c8','ae9ac9']);
   turn=Math.PI*(smooth((t-.4)/.13)-smooth((t-.87)/.13));
   phase=t<.4?'Gấp các góc thừa của mặt trước vào trong':t<.53?'Lật giấy sang mặt sau':t<.87?'Gấp các góc của mặt sau vào trong':'Các góc đã gọn trong hình tam giác';
 }else if(n===4||n===6){
   // Four rigid triangular walls open around the apex, then rotate into a diamond.
   // The pocket construction preserves all three edge lengths of every wall.
   const l=n===4?120:120/Math.sqrt(2),theta=q*Math.PI/2;
   const h=l*Math.sqrt(1+Math.sin(theta)**2),d=l*l/h,z=Math.sqrt(Math.max(0,l*l-d*d));
   const spin=q*Math.PI/2,c=Math.cos(spin),s=Math.sin(spin);
   const map=v=>[300+v[0]*c+v[2]*s,140+v[1],-v[0]*s+v[2]*c];
   const A=[0,0,0],B=[-l*Math.cos(theta),h,0],C=[l*Math.cos(theta),h,0],F=[0,d,z],R=[0,d,-z];
   const walls=[[A,B,F],[A,F,C],[A,C,R],[A,R,B]];
   walls.forEach((wall,i)=>{
     // Subdivide the first pocket at the existing brim crease. Barycentric mapping
     // keeps the coloured strip attached to the same rigid wall throughout opening.
     const start=i<2?(i===0?[[0,0],[-l,l],[0,l]]:[[0,0],[0,l],[l,l]]):(i===2?[[0,0],[l,l],[0,l]]:[[0,0],[0,l],[-l,l]]);
     const split=poly=>{
       const cut=(keep)=>{const out=[];for(let j=0;j<poly.length;j++){
         const a=poly[j],b=poly[(j+1)%poly.length],va=a[1]-(l-40),vb=b[1]-(l-40);
         if(keep*va>=-1e-8)out.push(a);if(va*vb<0){const t=va/(va-vb);out.push(a.map((v,k)=>v+(b[k]-v)*t));}
       }return out;};return[cut(-1),cut(1)];
     };
     const transform=v=>{const v2=v[1]/l,u=v[0]/l;let weights;
       if(i===0)weights=[1-v2,-u,v2+u];else if(i===1)weights=[1-v2,v2-u,u];else if(i===2)weights=[1-v2,u,v2-u];else weights=[1-v2,v2+u,-u];
       return map([0,1,2].map(k=>wall.reduce((sum,p,j)=>sum+p[k]*weights[j],0)));
     };
     if(n===4)split(start).forEach((poly,j)=>{if(poly.length>=3)add(poly.map(transform),0,j?'e6b6c8':'ae9ac9');});
     else add(wall.map(map),0,i<2?'e6b6c8':'d5a0b7');
   });
   phase=t<.45?'Mở hai lớp giấy ở miệng túi':t<.9?'Đưa hai góc lại gần nhau và ép theo chiều mới':'Miết phẳng hình vuông';
 }else if(n===5){
   // Reuse the actual previous diamond, split at its horizontal crease.
   const base=bookBoatScene(4,1),y=140+120/Math.sqrt(2);
   base.faces.forEach((face,i)=>{
     const wall=Math.floor(i/2),back=wall===1||wall===2;
     const clip=sign=>{const out=[];for(let j=0;j<face.length;j++){
       const a=face[j],b=face[(j+1)%face.length],da=a[1]-y,db=b[1]-y;
       if(sign*da>=-1e-7)out.push(a);if(da*db<0){const f=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*f));}
     }return out;};
     const upper=clip(-1),lower=clip(1);
     if(upper.length>=3)add(upper,back?-1:1,base.colors[i]);
     if(lower.length>=3){let folded=rotatePaper3D(lower,[180,y],[420,y],smooth((t-(back?.43:0))/.4));
       if(back)folded=folded.map(v=>[v[0],v[1],-v[2]]);add(folded,back?-2:2,'e6b6c8');}
   });
   creases.push([[300-120/Math.sqrt(2),y],[300+120/Math.sqrt(2),y]]);
   phase=t<.43?'Gấp góc dưới của lớp trước lên':t<.88?'Gấp góc dưới của lớp sau lên':'Miết phẳng hai mặt thành tam giác';
 }else{
   // Separate the two folded layers from the small diamond into an open hull.
   const pull=smooth((t-.12)/.53),open=smooth((t-.64)/.28),settle=smooth((t-.92)/.08);
   const r=60,top=[300,140,0],bottom=[300,260,0],left=[240,200,0],right=[360,200,0];
   const mix=(a,b,f=pull)=>a.map((v,i)=>v+(b[i]-v)*(i===2?open:f));
   const bow=mix(top,[145,205,12]),stern=mix(top,[455,205,12]);
   const kl=mix(left,[225,280,0]),kr=mix(right,[375,280,0]);
   kl[2]+=8*open*(1-settle);kr[2]+=8*open*(1-settle);
   const front=mix(bottom,[300,250,38]),back=mix(bottom,[300,230,-34]);
   const peak=mix(top,[300,200,8]);
   grips=[bow,stern];
   // Keep each half continuous from apex to bottom. There is no left-to-right
   // triangulation edge across the diamond, even in the first moving frames.
   const keel=mix(bottom,[300,280,0]);
   add([bow,back,keel,kl],0,'d8a0b8');
   add([stern,kr,keel,back],0,'d8a0b8');
   add([bow,peak,back],0,'e6b6c8');add([back,peak,stern],0,'d8a0b8');
   add([kl,peak,front],0,'ae9ac9');add([front,peak,kr],0,'bda8d5');
   add([bow,kl,keel,front],0,'e6b6c8');
   add([stern,front,keel,kr],0,'e6b6c8');
   phase=t<.12?'Cầm hai lớp giấy rời ở hai bên đỉnh':t<.65?'Kéo nhẹ hai đầu sang trái và phải cùng lúc':t<.92?'Tách mạn trước và mạn sau để mở lòng thuyền':'Miết nhẹ đáy · Thuyền giấy đã hoàn thành';
 }

 if(turn){const c=Math.cos(turn),s=Math.sin(turn);faces.forEach(p=>p.forEach(v=>{const x=v[0]-300,z=v[2];v[0]=300+x*c+z*s;v[2]=-x*s+z*c;}));}
 return{faces,creases,colors,phase,grips,layered:n===7};
}
makePaperScene=bookBoatScene;
function boatResultSVG(n){
 const scene=bookBoatScene(n,1);
 return scene.faces.map((face,i)=>`<polygon points="${face.map(p=>p.slice(0,2).join(',')).join(' ')}" fill="#${scene.colors[i]||'e6b6c8'}" stroke="#756280" stroke-width="2" stroke-linejoin="round"/>`).join('');
}

const boatLessonRender=renderFold;
renderFold=function(){
 boatLessonRender();
 const initialPaper='<svg viewBox="140 20 320 390" aria-hidden="true"><rect x="180" y="50" width="240" height="320" rx="2" fill="#e6b6c8" stroke="#756280" stroke-width="3"/><path d="M300 50V370M180 210H420" fill="none" stroke="#a586aa" stroke-width="2" stroke-dasharray="8 7"/></svg>';
 $('.fold-layout>div:last-child').insertAdjacentHTML('afterbegin',`<button id="showInitialPaper" class="initial-paper-card">${initialPaper}<span><b>Tờ giấy ban đầu</b><small>Giấy hình chữ nhật · Chạm để xem lại</small></span></button>`);
 $('#showInitialPaper').onclick=()=>{stopFoldDemo();step=0;foldMotion.lastRenderedStep=null;foldMotion.advanceAfterStep=false;renderFold();};
 $('.fold-motion-track').insertAdjacentHTML('afterend','<label class="fold-scrub-label"><span>Kéo để xem từng chuyển động</span><input id="foldScrub" type="range" min="0" max="1000" value="0" step="1" aria-label="Tiến độ gấp của bước hiện tại"/></label>');
 $('#foldScrub').oninput=e=>{
   cancelFoldFrame();foldMotion.playing=false;foldMotion.paused=true;foldMotion.advanceAfterStep=false;
   const hold=step===0?Math.min(1000,foldMotion.duration*.2):0;
   foldMotion.elapsed=hold+(+e.target.value/1000)*(foldMotion.duration*.76-hold);
   updateFoldControls();drawFoldFrame(foldMotion.elapsed);
 };
 $('#replayFold').textContent='↻ Gấp bước này';$('#replayFold').onclick=()=>{foldMotion.replayRequested=true;renderFold();soundNote();};
 const next=$('#nextStep'),goNext=next.onclick;next.onclick=()=>{if(step<7&&foldMotion.elapsed<foldMotion.duration){foldMotion.advanceAfterStep=true;if(!foldMotion.playing)playFoldFrames();say('Đang gấp xong bước hiện tại rồi chuyển sang bước tiếp theo.');}else goNext();};
 document.querySelectorAll('#fold [data-step]').forEach((button,i)=>{button.classList.add('book-boat-step');button.innerHTML=`<svg class="boat-step-result" viewBox="100 110 400 260" aria-hidden="true">${boatResultSVG(i)}</svg><span><b>Bước ${i+1}.</b> ${steps[i]}</span>`;});
};
const boatLessonFrame=drawFoldFrame;
drawFoldFrame=function(elapsed){
 boatLessonFrame(elapsed);if(current!==4)return;
 const t=foldAnimationProgress(elapsed),phase=foldMotion.bridgeMs&&elapsed<foldMotion.bridgeMs?`Nối hình cuối bước ${foldMotion.bridgeFromStep+1} sang bước ${step+1}`:step===0&&elapsed===0?'Quan sát tờ giấy chữ nhật ban đầu':bookBoatScene(step,t).phase;
 const text=`${foldMotion.playing?'Tự gấp · ':''}Bước ${step+1}: ${phase}`;
 if($('#foldMotionStatus').textContent!==text)$('#foldMotionStatus').textContent=text;
};
const boatStartLoad=load;
load=function(n){if(n===4){step=foldMotion.restorePose?Math.max(0,Math.min(7,Number(foldMotion.restorePose.step)||0)):0;foldMotion.lastRenderedStep=null;foldMotion.advanceAfterStep=false;}boatStartLoad(n);};

/* Teaching marks stay outside the paper shader: edges remain legible while flaps move. */
const boatUnmarkedDrawing=foldDrawing;
foldDrawing=function(n,t){
 let out=boatUnmarkedDrawing(n,t);if(n!==1&&n!==7)return out;
 const scene=bookBoatScene(n,t),point=p=>projectPaper3D(p).slice(0,2),str=p=>p.join(',');
 const line=(a,b,dash=false,color='#654f7b')=>`<path d="M${str(point(a))}L${str(point(b))}" fill="none" stroke="${color}" stroke-width="2.5" ${dash?'stroke-dasharray="7 5"':''}/>`;
 const arrow=(a,c,b)=>{const A=point(a),C=point(c),B=point(b),angle=Math.atan2(B[1]-C[1],B[0]-C[0]);
   return `<path d="M${str(A)}Q${str(C)} ${str(B)}" fill="none" stroke="#bd5435" stroke-width="3.5"/><path d="M-9 -6L0 0L-9 6" transform="translate(${str(B)}) rotate(${angle*180/Math.PI})" fill="none" stroke="#bd5435" stroke-width="3.5" stroke-linecap="round"/>`;};
 const caption=text=>`<rect x="58" y="14" width="484" height="35" rx="12" fill="#fff9ec" stroke="#e5cfad"/><text x="300" y="37" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="17" font-weight="600" fill="#82452e">${text}</text>`;
 if(n===1){
   // Render only the two real moving flaps' edges on top; no invented outline.
   [1,2].forEach(i=>{const pts=scene.faces[i].map(p=>str(point(p))).join(' ');out+=`<polygon points="${pts}" fill="none" stroke="#563d70" stroke-width="2.8" stroke-linejoin="round"/>`;});
   out+=line([300,140,6],[300,300,6],true);
   out+=line([180,260,5],[300,140,5],true)+line([300,140,5],[420,260,5],true);
   if(t<.43)out+=arrow([190,150,12],[220,175,110],[284,232,8]);
   else if(t<.9)out+=arrow([410,150,12],[380,175,110],[316,232,8]);
   out+=caption('GẤP MẶT TRƯỚC · Giữ nguyên mặt giấy');
   out+='<text x="300" y="355" text-anchor="middle" fill="#654f7b" font-family="Segoe UI,Arial,sans-serif" font-size="15">Nét liền: mép giấy · Nét đứt: nếp gấp</text>';
 }else{
   const [bow,stern]=scene.grips;
   if(t<.65){
     [bow,stern].forEach(p=>{const v=point(p);v[0]+=p===bow?-5:5;out+=`<circle cx="${v[0]}" cy="${v[1]}" r="9" fill="#fff5cb" stroke="#bd5435" stroke-width="2.5"/>`;});
     out+=arrow([bow[0]-8,bow[1],12],[bow[0]-42,bow[1]-22,12],[bow[0]-70,bow[1]-8,12]);
     out+=arrow([stern[0]+8,stern[1],12],[stern[0]+42,stern[1]-22,12],[stern[0]+70,stern[1]-8,12]);
   }else if(t<.92){
     out+=arrow([300,242,12],[300,258,65],[300,277,65]);
     out+=arrow([300,230,-12],[300,210,-55],[300,190,-55]);
   }
   out+=caption(t<.12?'1 · Tách nhẹ hai lớp tại ĐỈNH TRÊN':t<.65?'2 · Kéo hai lớp ở đỉnh sang hai bên':t<.92?'3 · Tách hai mạn, mở lòng thuyền':'4 · Miết nhẹ đáy, chỉnh thuyền cân bằng');
 }
 return out;
};
