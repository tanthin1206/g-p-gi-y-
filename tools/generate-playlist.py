"""Generate three original playful alternatives without runtime synthesis."""
from pathlib import Path
import numpy as np, wave, subprocess
root=Path(__file__).resolve().parents[1];rate=44100
songs=[('sunny-garden',108,'pluck',0),('happy-workshop',102,'wood',0),('little-voyage',96,'flute',-2)]
chords=[[48,55,60,64],[53,57,60,65],[48,55,60,64],[55,59,62,67],[45,52,57,60],[53,57,60,65],[55,59,62,67],[48,55,60,64]]
melodies=[[72,76,79,76,74,72,67,72],[72,77,81,77,76,72,69,72],[76,79,84,79,76,74,72,76],[74,79,83,79,77,74,71,67],[72,76,81,76,72,69,72,76],[72,77,79,81,79,77,76,72],[71,74,79,77,74,71,74,67],[72,76,79,76,74,72,67,72]]
for filename,bpm,style,transpose in songs:
 beat=60/bpm;size=round(128*beat*rate);mix=np.zeros(size)
 def note(midi,onset,duration,amp,voice):
  count=round(duration*rate);t=np.arange(count)/rate;freq=440*2**((midi+transpose-69)/12)
  if voice=='pluck':
   sound=sum(w*np.sin(2*np.pi*freq*h*t)*np.exp(-t/tau) for h,w,tau in [(1,1,.65),(2,.24,.30),(3,.09,.18)])
  elif voice=='wood':sound=np.sin(2*np.pi*freq*t)*np.exp(-t/.4)+.12*np.sin(2*np.pi*freq*4*t)*np.exp(-t/.09)
  else:sound=np.sin(2*np.pi*freq*t)+.07*np.sin(2*np.pi*freq*2*t)+.02*np.sin(2*np.pi*freq*3*t)
  attack=.055 if voice=='flute' else .018;release=.12
  env=np.sin(np.minimum(1,t/attack)*np.pi/2)**2*np.sin(np.minimum(1,np.maximum(0,duration-t)/release)*np.pi/2)**2
  signal=amp*sound*env;start=round(onset*rate);end=min(size,start+count)
  if start<size:mix[start:end]+=signal[:end-start]
 for section in range(2):
  for i,chord in enumerate(chords):
   bar=section*64+i*8
   for j,n in enumerate(melodies[i]):
    offset=j if style!='flute' else [0,1,2,3,4,5,6,7][j]
    duration=(.88 if style!='flute' else .94)*beat
    pitch=n if style!='wood' else n-12
    note(pitch,(bar+offset)*beat,duration,.10,style)
   for j,k in enumerate([1,2,3,2,1,2,3,2]):note(chord[k],(bar+j+.5)*beat,.82*beat,.028,'pluck')
   for j in [0,4]:note(chord[0],(bar+j)*beat,1.8*beat,.03,'pluck')
   if style=='pluck':
    for j in [1,3,5,7]:
     for n in chord[1:]:note(n,(bar+j)*beat,.62*beat,.013,'pluck')
 dry=mix.copy();shift=round(.045*rate);mix[shift:]+=dry[:-shift]*.055
 fade=round(.08*rate);mix[:fade]*=np.linspace(0,1,fade)**2;mix[-fade:]*=np.linspace(1,0,fade)**2
 mix*=min(.68/max(abs(mix)),.17/np.sqrt(np.mean(mix**2)))
 out=root/'dist/assets/audio';out.mkdir(parents=True,exist_ok=True);temp=out/(filename+'.wav')
 with wave.open(str(temp),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mix*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(temp),'-codec:a','libmp3lame','-b:a','128k',str(out/(filename+'.mp3'))],check=True);temp.unlink()
 print(filename,round(size/rate,1),'seconds')
