/* Keep the learner's current screen and work across F5, including offline files. */
const RESUME_KEY='bai28-resume-v1';
function saveCurrentPlace(){
 try{localStorage.setItem(RESUME_KEY,JSON.stringify({version:1,screen:document.body.dataset.screen,lesson:current,tangram,states,selected,cuts:[...workshop.cut],mode:workshop.mode,tray:trayPages.page,solution:tgShowSolution,step,elapsed:foldMotion.elapsed,duration:foldMotion.duration,camera:paperView.tilt}));}catch{}
}
function restoreCurrentPlace(){
 let saved;try{saved=JSON.parse(localStorage.getItem(RESUME_KEY));}catch{return;}
 if(!saved||saved.version!==1||saved.screen!=='game'||!Number.isInteger(saved.lesson)||saved.lesson<0||saved.lesson>4)return;
 tangram=saved.tangram===1?1:0;
 if(saved.lesson===4)foldMotion.restorePose=saved;
 load(saved.lesson);delete foldMotion.restorePose;
 if(current===4){
   cancelFoldFrame();step=Math.max(0,Math.min(7,Number(saved.step)||0));
   foldMotion.duration=[3500,6500,9000].includes(saved.duration)?saved.duration:6500;
   foldMotion.elapsed=Math.max(0,Math.min(foldMotion.duration,Number(saved.elapsed)||0));
   foldMotion.playing=false;foldMotion.paused=foldMotion.elapsed>0;
   paperView.tilt=[.08,.48,.85].includes(saved.camera)?saved.camera:.48;
   $('#paperCamera').value=String(paperView.tilt);$('#foldSpeed').value=String(foldMotion.duration);
   updateFoldControls();drawFoldFrame(foldMotion.elapsed);
 }else{
   states={};for(const [key,value]of Object.entries(saved.states||{})){
     if(Number.isInteger(+key)&&+key>=0&&+key<parts.length&&value&&['x','y','a','f'].every(k=>Number.isFinite(value[k])))states[key]=value;
   }
   selected=Number.isInteger(saved.selected)&&states[saved.selected]?saved.selected:null;
   workshop.cut=new Set((saved.cuts||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<parts.length));
   workshop.mode=saved.mode!==false;$('#cutMode').checked=workshop.mode;
   trayPages.page=Math.max(0,Number(saved.tray)||0);render();
   if(current===3&&saved.solution)$('#tgSolutionButton').click();
 }
}
try{restoreCurrentPlace();}finally{document.documentElement?.removeAttribute('data-resume-pending');}
// pagehide saves the exact animation frame; events cover environments that skip it.
window.addEventListener('pagehide',saveCurrentPlace);
window.addEventListener('beforeunload',saveCurrentPlace);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrentPlace();});
for(const event of ['click','change','pointerup','keyup'])document.addEventListener(event,()=>setTimeout(saveCurrentPlace,0));
