/* Original prerecorded instrumental loop: audio playback is independent of game frames. */
const backgroundMusic={enabled:true,volume:.85,ctx:null,gain:null,buffer:null,loading:null,source:null,offset:0,started:0,duckTimer:null,lastLevel:null};
try{backgroundMusic.enabled=localStorage.getItem('bai28-music')!=='off';const v=localStorage.getItem('bai28-music-volume');if(v!==null)backgroundMusic.volume=Math.max(0,Math.min(1,Number(v)||0));}catch{}
const musicSettings=document.createElement('div');musicSettings.className='music-settings';
const musicSummary=document.createElement('button');musicSummary.className='music-trigger';musicSummary.type='button';musicSummary.setAttribute('aria-label','Điều chỉnh nhạc nền');musicSummary.setAttribute('aria-haspopup','dialog');musicSettings.append(musicSummary);$('#sound').before(musicSettings);
const musicDialog=document.createElement('dialog');musicDialog.className='music-dialog';musicDialog.setAttribute('aria-labelledby','musicDialogTitle');
musicDialog.innerHTML='<div class="music-dialog-head"><h2 id="musicDialogTitle">♪ Nhạc nền</h2><button type="button" class="music-close" aria-label="Đóng điều chỉnh nhạc">✕</button></div><p class="music-description">Điều chỉnh ngay khi chơi</p>';
const musicButton=document.createElement('button');musicButton.id='backgroundMusic';musicButton.type='button';
const volumeLabel=document.createElement('label');volumeLabel.className='music-volume-label';volumeLabel.textContent='Âm lượng nhạc';
const musicVolume=document.createElement('input');musicVolume.id='musicVolume';musicVolume.type='range';musicVolume.min='0';musicVolume.max='100';musicVolume.step='1';musicVolume.value=String(Math.round(backgroundMusic.volume*100));musicVolume.setAttribute('aria-label','Âm lượng nhạc nền');
const volumeValue=document.createElement('output');volumeValue.setAttribute('for','musicVolume');volumeValue.textContent=musicVolume.value+'%';volumeLabel.append(musicVolume,volumeValue);
const musicStatus=document.createElement('p');musicStatus.className='music-playback-status';musicStatus.setAttribute('role','status');musicDialog.append(musicButton,volumeLabel,musicStatus);document.body.append(musicDialog);
function updateMusicButton(){const m=backgroundMusic,text=`Nhạc nền: ${m.enabled?'bật':'tắt'}`;musicSummary.textContent=`♪ Nhạc nền · ${Math.round(m.volume*100)}%`;musicSummary.title='Điều chỉnh nhạc nền';musicButton.textContent=`♪ ${text}`;musicButton.setAttribute('aria-pressed',String(m.enabled));musicSummary.setAttribute('aria-expanded',String(musicDialog.open));}
function setMusicLevel(){const m=backgroundMusic;if(!m.ctx||!m.gain)return;const talking='speechSynthesis'in window&&window.speechSynthesis.speaking,level=m.enabled?m.volume*(talking?.35:1.25):0;if(level!==m.lastLevel){m.gain.gain.setTargetAtTime(level,m.ctx.currentTime,.18);m.lastLevel=level;}}
async function startBackgroundMusic(){
 const m=backgroundMusic;if(!m.enabled||document.hidden||m.source)return;
 try{
  if(!m.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){musicStatus.textContent='Trình duyệt chưa hỗ trợ phát nhạc.';return;}m.ctx=new Audio();m.gain=m.ctx.createGain();m.gain.gain.value=0;m.gain.connect(m.ctx.destination);}
  await m.ctx.resume();
  if(!m.loading)m.loading=fetch('assets/audio/background.mp3').then(r=>{if(!r.ok)throw Error('music');return r.arrayBuffer();}).then(bytes=>m.ctx.decodeAudioData(bytes)).then(buffer=>m.buffer=buffer).catch(error=>{m.loading=null;throw error;});
  await m.loading;if(!m.enabled||document.hidden||m.source)return;
  const source=m.ctx.createBufferSource();source.buffer=m.buffer;source.loop=true;source.connect(m.gain);source.onended=()=>source.disconnect();
  m.source=source;m.started=m.ctx.currentTime-m.offset;source.start(0,m.offset);m.lastLevel=null;setMusicLevel();if(!m.duckTimer)m.duckTimer=setInterval(setMusicLevel,250);musicStatus.textContent='Đang phát nhạc';
 }catch{musicStatus.textContent='Chạm nút bật nhạc để phát lại.';}
}
function pauseBackgroundMusic(){const m=backgroundMusic;if(m.duckTimer)clearInterval(m.duckTimer);m.duckTimer=null;if(m.source){m.offset=(m.ctx.currentTime-m.started)%m.buffer.duration;const source=m.source;m.source=null;m.gain.gain.cancelScheduledValues(m.ctx.currentTime);m.gain.gain.setTargetAtTime(.0001,m.ctx.currentTime,.025);source.stop(m.ctx.currentTime+.14);}m.lastLevel=null;}
musicVolume.oninput=()=>{backgroundMusic.volume=Number(musicVolume.value)/100;volumeValue.textContent=musicVolume.value+'%';try{localStorage.setItem('bai28-music-volume',String(backgroundMusic.volume));}catch{}updateMusicButton();setMusicLevel();if(backgroundMusic.enabled)startBackgroundMusic();};
musicButton.onclick=()=>{backgroundMusic.enabled=!backgroundMusic.enabled;try{localStorage.setItem('bai28-music',backgroundMusic.enabled?'on':'off');}catch{}updateMusicButton();if(backgroundMusic.enabled)startBackgroundMusic();else{pauseBackgroundMusic();musicStatus.textContent='Đã tắt nhạc';}};
musicSummary.onclick=()=>{if(musicDialog.open)return;const surface=document.fullscreenElement||document.body;if(musicDialog.parentElement!==surface)surface.append(musicDialog);musicDialog.showModal();updateMusicButton();};
musicDialog.querySelector('.music-close').onclick=()=>musicDialog.close();musicDialog.addEventListener('close',updateMusicButton);musicDialog.addEventListener('cancel',e=>e.stopPropagation());
musicDialog.addEventListener('click',e=>{if(e.target===musicDialog){const r=musicDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)musicDialog.close();}});
function positionMusicControls(){const dialog=$('#cutDialog'),fs=document.fullscreenElement;musicSettings.classList.remove('music-in-cut','music-in-fullscreen');if(dialog.open){dialog.querySelector('.modal-head').insertBefore(musicSettings,$('#closeCut'));musicSettings.classList.add('music-in-cut');}else if(fs&&!fs.contains($('#sound'))){fs.append(musicSettings);musicSettings.classList.add('music-in-fullscreen');}else $('#sound').before(musicSettings);}
new MutationObserver(positionMusicControls).observe($('#cutDialog'),{attributes:true,attributeFilter:['open']});$('#cutDialog').addEventListener('close',positionMusicControls);document.addEventListener('fullscreenchange',positionMusicControls);
document.addEventListener('pointerdown',()=>{if(backgroundMusic.enabled&&!backgroundMusic.source)startBackgroundMusic();},{passive:true});document.addEventListener('keydown',()=>{if(backgroundMusic.enabled&&!backgroundMusic.source)startBackgroundMusic();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBackgroundMusic();else if(backgroundMusic.ctx)startBackgroundMusic();});window.addEventListener('pagehide',pauseBackgroundMusic);positionMusicControls();updateMusicButton();
