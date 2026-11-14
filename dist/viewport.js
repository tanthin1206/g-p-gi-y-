/* One fixed classroom screen, with explicit tray pagination. */
const trayPages={page:0,size:6};
function getTrayPageSize(width,height){return width<=760?4:height<560?4:height<760?6:8}
function updateTrayPages(){
  const tray=$('#pieces'),buttons=[...tray.querySelectorAll('button')];
  trayPages.size=getTrayPageSize(innerWidth,innerHeight);
  const count=Math.max(1,Math.ceil(buttons.length/trayPages.size));trayPages.page=Math.max(0,Math.min(trayPages.page,count-1));
  buttons.forEach((button,i)=>button.hidden=i<trayPages.page*trayPages.size||i>=(trayPages.page+1)*trayPages.size);
  tray.style.setProperty('--tray-rows',Math.ceil(trayPages.size/2));
  let pager=$('#piecePager');if(!pager){pager=document.createElement('div');pager.id='piecePager';pager.setAttribute('aria-label','Chuyển trang mảnh ghép');tray.after(pager);}
  pager.innerHTML=`<button id="trayPrev" aria-label="Trang mảnh ghép trước" ${trayPages.page===0?'disabled':''}>‹</button><span aria-live="polite">${trayPages.page+1}/${count}</span><button id="trayNext" aria-label="Trang mảnh ghép tiếp theo" ${trayPages.page===count-1?'disabled':''}>›</button>`;
  $('#trayPrev').onclick=()=>{trayPages.page--;updateTrayPages()};$('#trayNext').onclick=()=>{trayPages.page++;updateTrayPages()};
}
const viewportRender=render,viewportLoad=load,viewportFold=renderFold;
render=function(){viewportRender();updateTrayPages()};
load=function(n){trayPages.page=0;viewportLoad(n);if(n!==4)updateTrayPages();};
renderFold=function(){viewportFold();$('#fold').setAttribute('aria-label','Bàn gấp giấy vừa màn hình');};
$('#focus').textContent='⛶ Toàn màn hình';$('#focus').title='Mở toàn màn hình; nhấn Esc để thoát';
$('#focus').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{say('Có thể dùng phím F11 để mở toàn màn hình.')}};
document.addEventListener('fullscreenchange',()=>$('#focus').textContent=document.fullscreenElement?'⛶ Thoát toàn màn hình':'⛶ Toàn màn hình');
window.addEventListener('resize',updateTrayPages);
window.addEventListener('wheel',e=>{if(!e.ctrlKey)e.preventDefault()},{passive:false});
document.addEventListener('keydown',e=>{if(['PageDown','PageUp'].includes(e.key)&&!e.target.closest('input,textarea,select'))e.preventDefault()});
updateTrayPages();
