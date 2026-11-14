"""Original warm piano-style classroom background, with three musical variations."""
from pathlib import Path
import numpy as np
import wave, subprocess
root=Path(__file__).resolve().parents[1];rate=44100;beat=60/88;duration=192*beat;size=round(duration*rate)
mix=np.zeros(size,dtype=np.float64)
def note(midi,start,length,level):
 count=round(length*rate);t=np.arange(count)/rate;freq=440*2**((midi-69)/12)
 # Rounded electric-piano partials decay independently, with no hard note edges.
 tone=np.zeros(count)
 for h,weight,decay in [(1,1,2.8),(2,.24,1.5),(3,.10,.8),(4,.025,.4)]:tone+=weight*np.sin(2*np.pi*freq*h*t)*np.exp(-t/decay)
 env=np.sin(np.minimum(1,t/.025)*np.pi/2)**2*np.sin(np.minimum(1,np.maximum(0,length-t)/.20)*np.pi/2)**2
 sig=level*tone*env;start=round(start*rate);stop=min(size,start+count)
 if start<size:mix[start:stop]+=sig[:stop-start]
chords=[[48,55,60,64],[53,57,60,65],[48,55,60,64],[55,59,62,67],[45,52,57,60],[53,57,60,65],[55,59,62,67],[48,55,60,64]]
phrases=[[72,76,79,76,74,72,76],[72,77,76,72,69,72,77],[76,79,76,74,72,67,72],[74,79,77,74,71,74,67],[72,76,72,69,72,76,72],[72,77,79,77,76,72,69],[71,74,79,77,74,71,74],[76,74,72,67,72,76,72]]
for section in range(3):
 for i,chord in enumerate(chords):
  bar=section*64+i*8
  # Soft broken chords, rather than repeated simultaneous chord strikes.
  for j,k in enumerate([1,2,3,2,1,2,3,2]):note(chord[k],(bar+j)*beat,1.65*beat,.025 if j%2==0 else .021)
  for j in [0,4]:note(chord[0],(bar+j)*beat,3.2*beat,.028)
  melody=phrases[i][:]
  if section==1:melody[0],melody[1]=melody[1],melody[0]
  for j,(offset,length) in enumerate(zip([0,1,2,4,5,6,7],[.88,.88,1.78,.88,.88,.88,.88])):
   note(melody[j],(bar+offset)*beat,length*beat,.070*(.95 if section==1 else 1))
# A quiet, short room tail supplies space without long repeating echoes.
dry=mix.copy()
for delay,weight in [(.047,.055),(.091,.025)]:
 shift=round(delay*rate);mix[shift:]+=dry[:-shift]*weight
# A musical breath at the repeat, never a discontinuous waveform jump.
fade=round(.10*rate);mix[:fade]*=np.sin(np.linspace(0,np.pi/2,fade))**2;mix[-fade:]*=np.cos(np.linspace(0,np.pi/2,fade))**2
scale=min(.72/np.max(np.abs(mix)),.17/np.sqrt(np.mean(mix**2)));mix*=scale
out=root/'dist/assets/audio';out.mkdir(parents=True,exist_ok=True);wav=out/'background.wav'
with wave.open(str(wav),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','128k',str(out/'background.mp3')],check=True);wav.unlink()
print('Music:',round(duration,2),'seconds; peak:',round(float(np.max(np.abs(mix))),3),'RMS:',round(float(np.sqrt(np.mean(mix**2))),3))
