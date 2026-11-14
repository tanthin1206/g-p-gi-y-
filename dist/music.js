/* Original prerecorded instrumental loop: audio playback is independent of game frames. */
const musicAppleMobile=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const MUSIC_TRACKS=[
 {id:'piano',name:'Piano ấm áp',file:'background.mp3',audio:'assets/audio/background.mp3',description:'Piano nhẹ nhàng, đệm rải mềm.'},
 {id:'garden',name:'Khu vườn nắng',file:'sunny-garden.mp3',audio:'assets/audio/sunny-garden.mp3',description:'Tiếng dây gảy tươi sáng, nhịp vui nhẹ.'},
 {id:'workshop',name:'Xưởng khéo tay',file:'happy-workshop.mp3',audio:'assets/audio/happy-workshop.mp3',description:'Tiếng mộc lanh lảnh, tiết tấu nhí nhảnh.'},
 {id:'voyage',name:'Chuyến thuyền nhỏ',file:'little-voyage.mp3',audio:'assets/audio/little-voyage.mp3',description:'Giai điệu sáo mềm, vui và thư thái.'}
];
const backgroundMusic={enabled:true,volume:.85,track:0,generation:0,ctx:null,gain:null,player:null,starting:null,pauseTimer:null,ducked:false,lastLevel:null};
try{backgroundMusic.enabled=localStorage.getItem('bai28-music')!=='off';const v=localStorage.getItem('bai28-music-volume');if(v!==null)backgroundMusic.volume=Math.max(0,Math.min(1,Number(v)||0));}catch{}
try{const saved=localStorage.getItem('bai28-music-track');const i=MUSIC_TRACKS.findIndex(t=>t.id===saved);if(i>=0)backgroundMusic.track=i;}catch{}
function musicTrackURL(){const t=MUSIC_TRACKS[backgroundMusic.track];if(!/^https?:$/.test(location.protocol))return t.audio;const script=document.querySelector('script[src$="music.js"]'),relative=['assets','audio',t.file].join('/');return new URL(script?relative:'dist/'+relative,script?.src||document.baseURI).href;}
const musicSettings=document.createElement('div');musicSettings.className='music-settings';
const musicSummary=document.createElement('button');musicSummary.className='music-trigger';musicSummary.type='button';musicSummary.setAttribute('aria-label','Điều chỉnh nhạc nền');musicSummary.setAttribute('aria-haspopup','dialog');musicSettings.append(musicSummary);$('#sound').before(musicSettings);
const musicDialog=document.createElement('dialog');musicDialog.className='music-dialog';musicDialog.setAttribute('aria-labelledby','musicDialogTitle');
musicDialog.innerHTML='<div class="music-dialog-head"><h2 id="musicDialogTitle">♪ Nhạc nền</h2><button type="button" class="music-close" aria-label="Đóng điều chỉnh nhạc">✕</button></div><p class="music-description">Điều chỉnh ngay khi chơi</p>';
const musicButton=document.createElement('button');musicButton.id='backgroundMusic';musicButton.type='button';
const volumeLabel=document.createElement('label');volumeLabel.className='music-volume-label';volumeLabel.textContent='Âm lượng nhạc';
const musicVolume=document.createElement('input');musicVolume.id='musicVolume';musicVolume.type='range';musicVolume.min='0';musicVolume.max='100';musicVolume.step='1';musicVolume.value=String(Math.round(backgroundMusic.volume*100));musicVolume.setAttribute('aria-label','Âm lượng nhạc nền');
const volumeValue=document.createElement('output');volumeValue.setAttribute('for','musicVolume');volumeValue.textContent=musicVolume.value+'%';volumeLabel.append(musicVolume,volumeValue);if(musicAppleMobile){volumeLabel.hidden=true;const hint=document.createElement('p');hint.className='music-description';hint.textContent='iPhone/iPad: dùng nút âm lượng bên hông máy để chỉnh tiếng nhạc.';musicDialog.append(hint);}
const trackLabel=document.createElement('label');trackLabel.className='music-track-label';trackLabel.textContent='Chọn bài nhạc';
const musicTrackSelect=document.createElement('select');musicTrackSelect.id='musicTrack';musicTrackSelect.setAttribute('aria-label','Chọn bài nhạc');
MUSIC_TRACKS.forEach((t,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=t.name;musicTrackSelect.append(option);});musicTrackSelect.value=String(backgroundMusic.track);
const trackDescription=document.createElement('p');trackDescription.className='music-track-description';trackDescription.textContent=MUSIC_TRACKS[backgroundMusic.track].description;
trackLabel.append(musicTrackSelect);musicDialog.append(trackLabel,trackDescription);
const musicStatus=document.createElement('p');musicStatus.className='music-playback-status';musicStatus.setAttribute('role','status');musicDialog.append(musicButton,volumeLabel,musicStatus);document.body.append(musicDialog);
function updateMusicButton(){const m=backgroundMusic,playing=m.enabled&&m.player&&!m.player.paused,text=playing?'Tắt nhạc':'Phát nhạc';musicSummary.textContent=musicAppleMobile?'♪ Nhạc nền':`♪ Nhạc nền · ${Math.round(m.volume*100)}%`;musicSummary.title='Điều chỉnh nhạc nền';musicButton.textContent=`${playing?'Ⅱ':'▶'} ${text}`;musicButton.setAttribute('aria-label',text);musicButton.setAttribute('aria-pressed',String(!!playing));musicSummary.setAttribute('aria-expanded',String(musicDialog.open));}
function setMusicLevel(){
 const m=backgroundMusic,level=m.enabled?m.volume*(m.ducked?.40:1.2):0;
 if(m.ctx&&m.gain&&level!==m.lastLevel){m.gain.gain.cancelScheduledValues(m.ctx.currentTime);m.gain.gain.setTargetAtTime(level,m.ctx.currentTime,.45);m.lastLevel=level;}
 else if(!m.ctx&&m.player)m.player.volume=Math.max(0,Math.min(1,level));
}
function setMusicDucking(active){backgroundMusic.ducked=!!active;setMusicLevel();}
async function startBackgroundMusic(){
 const m=backgroundMusic;if(!m.enabled||document.hidden)return;if(m.starting)return m.starting;
 if(m.pauseTimer){clearTimeout(m.pauseTimer);m.pauseTimer=null;}
 const generation=m.generation;
 m.starting=(async()=>{
  try{
   if(!m.player){
    const track=musicTrackURL();
    const player=new window.Audio(track);player.id='backgroundMusicAudio';player.hidden=true;player.loop=true;player.preload='auto';player.setAttribute('playsinline','');document.body.append(player);m.player=player;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext&&!musicAppleMobile){m.ctx=new AudioContext({latencyHint:'playback'});const source=m.ctx.createMediaElementSource(player);m.gain=m.ctx.createGain();m.gain.gain.value=0;source.connect(m.gain);m.gain.connect(m.ctx.destination);}
    player.addEventListener('playing',()=>{musicStatus.textContent='Đang phát nhạc';updateMusicButton();});player.addEventListener('pause',updateMusicButton);
    player.addEventListener('error',()=>{musicStatus.textContent='Chạm bật nhạc để thử phát lại.';});
   }
   m.lastLevel=null;setMusicLevel();
   // Start decoding through the browser's media pipeline, not a large JS audio buffer.
   const resume=m.ctx&&m.ctx.state!=='running'?m.ctx.resume():Promise.resolve();
   const play=m.player.paused?m.player.play():Promise.resolve();
   await Promise.all([resume,play]);
   if(!m.enabled||document.hidden)pauseBackgroundMusic();
  }catch{if(generation===m.generation){musicStatus.textContent='Bấm ▶ Phát nhạc để cho phép trình duyệt phát âm thanh.';updateMusicButton();}}
 })();
 try{await m.starting;}finally{if(generation===m.generation)m.starting=null;}
}
function pauseBackgroundMusic(){
 const m=backgroundMusic;if(m.pauseTimer)clearTimeout(m.pauseTimer);
 if(m.ctx&&m.gain){m.gain.gain.cancelScheduledValues(m.ctx.currentTime);m.gain.gain.setTargetAtTime(.0001,m.ctx.currentTime,.025);}
 if(m.player)m.pauseTimer=setTimeout(()=>{m.player.pause();m.pauseTimer=null;},110);
 m.lastLevel=null;
}

musicTrackSelect.onchange=()=>{
 const m=backgroundMusic,index=Number(musicTrackSelect.value);if(!Number.isInteger(index)||!MUSIC_TRACKS[index])return;
 m.track=index;m.generation++;m.starting=null;if(m.pauseTimer){clearTimeout(m.pauseTimer);m.pauseTimer=null;}
 try{localStorage.setItem('bai28-music-track',MUSIC_TRACKS[index].id);}catch{}
 trackDescription.textContent=MUSIC_TRACKS[index].description;musicStatus.textContent='Đã chọn '+MUSIC_TRACKS[index].name;
 if(m.player){m.player.pause();m.player.src=musicTrackURL();m.player.load();}
 updateMusicButton();if(m.enabled)startBackgroundMusic();
};
musicVolume.oninput=()=>{backgroundMusic.volume=Number(musicVolume.value)/100;volumeValue.textContent=musicVolume.value+'%';try{localStorage.setItem('bai28-music-volume',String(backgroundMusic.volume));}catch{}updateMusicButton();setMusicLevel();if(backgroundMusic.enabled)startBackgroundMusic();};
musicButton.onclick=()=>{const m=backgroundMusic;if(m.enabled&&m.player&&!m.player.paused){m.enabled=false;pauseBackgroundMusic();musicStatus.textContent='Đã tắt nhạc';}else{m.enabled=true;startBackgroundMusic();}try{localStorage.setItem('bai28-music',m.enabled?'on':'off');}catch{}updateMusicButton();};
musicSummary.onclick=()=>{if(musicDialog.open)return;const surface=document.fullscreenElement||document.body;if(musicDialog.parentElement!==surface)surface.append(musicDialog);musicDialog.showModal();updateMusicButton();if(backgroundMusic.enabled)startBackgroundMusic();};
musicDialog.querySelector('.music-close').onclick=()=>musicDialog.close();musicDialog.addEventListener('close',updateMusicButton);musicDialog.addEventListener('cancel',e=>e.stopPropagation());
musicDialog.addEventListener('click',e=>{if(e.target===musicDialog){const r=musicDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)musicDialog.close();}});
function positionMusicControls(){const dialog=$('#cutDialog'),fs=document.fullscreenElement;musicSettings.classList.remove('music-in-cut','music-in-fullscreen');if(dialog.open){dialog.querySelector('.modal-head').insertBefore(musicSettings,$('#closeCut'));musicSettings.classList.add('music-in-cut');}else if(fs&&!fs.contains($('#sound'))){fs.append(musicSettings);musicSettings.classList.add('music-in-fullscreen');}else $('#sound').before(musicSettings);}
new MutationObserver(positionMusicControls).observe($('#cutDialog'),{attributes:true,attributeFilter:['open']});$('#cutDialog').addEventListener('close',positionMusicControls);document.addEventListener('fullscreenchange',positionMusicControls);
document.addEventListener('click',()=>{if(backgroundMusic.enabled&&(!backgroundMusic.player||backgroundMusic.player.paused||(backgroundMusic.ctx&&backgroundMusic.ctx.state!=='running')))startBackgroundMusic();},{passive:true});document.addEventListener('keydown',()=>{if(backgroundMusic.enabled&&(!backgroundMusic.player||backgroundMusic.player.paused||(backgroundMusic.ctx&&backgroundMusic.ctx.state!=='running')))startBackgroundMusic();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBackgroundMusic();else if(backgroundMusic.player)startBackgroundMusic();});window.addEventListener('pagehide',pauseBackgroundMusic);positionMusicControls();updateMusicButton();
