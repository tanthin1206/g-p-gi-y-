/* Original quiet instrumental loop, synthesized offline with Web Audio. */
const backgroundMusic={enabled:true,volume:.85,ctx:null,bus:null,timer:null,next:0,beat:0,nodes:new Set()};
try{backgroundMusic.enabled=localStorage.getItem('bai28-music')!=='off';}catch{}
try{const stored=localStorage.getItem('bai28-music-volume');if(stored!==null)backgroundMusic.volume=Math.max(0,Math.min(1,Number(stored)||0));}catch{}
const musicButton=document.createElement('button');musicButton.id='backgroundMusic';musicButton.type='button';
const musicSettings=document.createElement('details');musicSettings.className='music-settings';
const musicSummary=document.createElement('summary');musicSummary.textContent='♪ Nhạc nền';musicSummary.setAttribute('aria-label','Điều chỉnh nhạc nền');
const musicPanel=document.createElement('div');musicPanel.className='music-panel';
const volumeLabel=document.createElement('label');volumeLabel.textContent='Âm lượng nhạc';
const musicVolume=document.createElement('input');musicVolume.type='range';musicVolume.min='0';musicVolume.max='100';musicVolume.step='1';musicVolume.value=String(Math.round(backgroundMusic.volume*100));musicVolume.setAttribute('aria-label','Âm lượng nhạc nền');
const volumeValue=document.createElement('output');volumeValue.textContent=musicVolume.value+'%';
volumeLabel.append(musicVolume,volumeValue);musicPanel.append(musicButton,volumeLabel);musicSettings.append(musicSummary,musicPanel);$('#sound').before(musicSettings);
musicVolume.oninput=()=>{backgroundMusic.volume=Number(musicVolume.value)/100;volumeValue.textContent=musicVolume.value+'%';updateMusicButton();try{localStorage.setItem('bai28-music-volume',String(backgroundMusic.volume));}catch{}if(backgroundMusic.enabled){startBackgroundMusic();scheduleMusic();}};
document.addEventListener('pointerdown',e=>{if(!musicSettings.contains(e.target))musicSettings.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&musicSettings.open){musicSettings.open=false;musicSummary.focus();}});
function updateMusicButton(){
 const text=`Nhạc nền: ${backgroundMusic.enabled?'bật':'tắt'}`;musicSummary.textContent=`♪ Nhạc nền · ${Math.round(backgroundMusic.volume*100)}%`;musicSummary.title=`${text} · Chạm để chỉnh âm lượng`;musicButton.textContent=`♪ ${text}`;musicButton.title=text;musicButton.setAttribute('aria-label',text);musicButton.setAttribute('aria-pressed',String(backgroundMusic.enabled));
}
function musicTone(midi,time,length,volume,pad=false){
 const m=backgroundMusic,ctx=m.ctx,voice=ctx.createGain();voice.connect(m.bus);
 voice.gain.setValueAtTime(0,time);voice.gain.linearRampToValueAtTime(volume,time+(pad?.7:.025));voice.gain.linearRampToValueAtTime(volume*.5,time+(pad?length*.45:Math.min(.45,length*.4)));voice.gain.exponentialRampToValueAtTime(.0001,time+length);
 for(const [ratio,level]of(pad?[[1,1]]:[[1,.85],[2,.18],[3,.07]])){
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(midi-69)/12)*ratio;gain.gain.value=level;
   osc.connect(gain);gain.connect(voice);m.nodes.add(osc);osc.onended=()=>{m.nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(time);osc.stop(time+length+.05);
 }
 setTimeout(()=>voice.disconnect(),Math.max(0,(time+length+.2-ctx.currentTime)*1000));
}
function scheduleMusic(){
 const m=backgroundMusic;if(!m.enabled||document.hidden||!m.ctx||m.ctx.state!=='running')return;
 const ctx=m.ctx,unit=60/72,chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]];
 const melody=[72,null,76,79,76,null,74,72,69,null,72,76,72,null,69,67,69,null,72,77,76,null,72,69,71,null,74,79,77,74,72,null];
 const talking='speechSynthesis'in window&&window.speechSynthesis.speaking;m.bus.gain.setTargetAtTime(backgroundMusic.volume*(talking?1.5:8),ctx.currentTime,.3);
 if(m.next<ctx.currentTime)m.next=ctx.currentTime+.08;
 while(m.next<ctx.currentTime+.35){
   const index=m.beat%32,chord=chords[Math.floor(index/8)];
   if(index%8===0)chord.slice(0,3).forEach(note=>musicTone(note,m.next,unit*7.7,.018,true));
   musicTone(chord[[0,1,2,1,0,2,3,1][index%8]]+12,m.next,unit*1.8,.045);
   if(melody[index]!==null)musicTone(melody[index],m.next,unit*2.1,.065);
   m.next+=unit;m.beat++;
 }
}
async function startBackgroundMusic(){
 const m=backgroundMusic;if(!m.enabled||document.hidden)return;
 try{
   if(!m.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;m.ctx=new Audio();m.bus=m.ctx.createGain();m.bus.gain.value=m.volume*8;const compressor=m.ctx.createDynamicsCompressor();compressor.threshold.value=-10;compressor.knee.value=16;compressor.ratio.value=4;compressor.attack.value=.01;compressor.release.value=.25;m.bus.connect(compressor);compressor.connect(m.ctx.destination);}
   await m.ctx.resume();if(!m.enabled||document.hidden)return;
   if(!m.timer){m.next=m.ctx.currentTime+.08;scheduleMusic();m.timer=setInterval(scheduleMusic,120);}
 }catch{ /* The next user gesture retries the browser's audio unlock. */ }
}
function pauseBackgroundMusic(){
 const m=backgroundMusic;if(m.timer)clearInterval(m.timer);m.timer=null;
 if(m.ctx){m.bus.gain.cancelScheduledValues(m.ctx.currentTime);m.bus.gain.setTargetAtTime(.0001,m.ctx.currentTime,.04);for(const node of m.nodes){try{node.stop(m.ctx.currentTime+.2);}catch{}}}
}
musicButton.onclick=()=>{
 backgroundMusic.enabled=!backgroundMusic.enabled;try{localStorage.setItem('bai28-music',backgroundMusic.enabled?'on':'off');}catch{}
 updateMusicButton();if(backgroundMusic.enabled)startBackgroundMusic();else pauseBackgroundMusic();
};
// Browsers unlock audio on a real click/tap; no network or downloaded track is needed.
document.addEventListener('pointerdown',()=>{if(backgroundMusic.enabled&&!backgroundMusic.timer)startBackgroundMusic();},{passive:true});
document.addEventListener('keydown',()=>{if(backgroundMusic.enabled&&!backgroundMusic.timer)startBackgroundMusic();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBackgroundMusic();else if(backgroundMusic.ctx)startBackgroundMusic();});
window.addEventListener('pagehide',pauseBackgroundMusic);updateMusicButton();
