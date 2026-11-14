"""Create an original seamless, bright and gently playful instrumental loop."""
from pathlib import Path
import numpy as np
import wave, subprocess
root=Path(__file__).resolve().parents[1];rate=44100;beat=60/100;duration=64*beat;size=round(duration*rate)
mix=np.zeros(size,dtype=np.float64)
def note(midi,start,length,level,pad=False):
 count=round(length*rate);t=np.arange(count)/rate;freq=440*2**((midi-69)/12)
 attack=.16 if pad else .025;release=.24 if pad else .14
 env=np.minimum(1,t/attack);env=np.sin(env*np.pi/2)**2
 env*=np.sin(np.minimum(1,np.maximum(0,length-t)/release)*np.pi/2)**2
 wave=np.sin(2*np.pi*freq*t)+(.08 if pad else .22)*np.sin(2*np.pi*freq*2*t)+(.0 if pad else .045)*np.sin(2*np.pi*freq*3*t)
 sig=level*wave*env;start=round(start*rate)%size;first=min(count,size-start)
 mix[start:start+first]+=sig[:first]
 if first<count:mix[:count-first]+=sig[first:]
chords=[[48,55,60,64],[53,60,65,69],[55,62,67,71],[48,55,60,64],[53,60,65,69],[48,55,60,64],[53,60,65,69],[55,62,67,71]]
phrases=[[72,74,76,79,76,74,72,67],[69,72,77,76,77,72,69,72],[71,74,79,77,74,71,74,67],[72,76,79,84,79,76,74,72],[69,72,77,81,77,76,72,69],[72,74,76,79,84,79,76,72],[69,72,77,79,81,77,72,69],[71,74,79,77,74,71,67,71]]
melody_onsets=[]
for i,chord in enumerate(chords):
 # Two clean 4/4 bars per phrase. Every main note occupies one equal beat.
 for half in [0,4]:
  for n in chord[1:]:note(n,(i*8+half)*beat,3.65*beat,.008,True)
 for j in range(8):
  onset=(i*8+j)*beat;melody_onsets.append(onset)
  note(phrases[i][j],onset,.84*beat,.085)
  if j%2==0:note(chord[0],onset,.68*beat,.033)
  else:
   for n in chord[1:]:note(n,onset,.60*beat,.015)
assert np.allclose(np.diff(melody_onsets),beat),'Melody must keep equal beat spacing'
# No long echoes or overlapping melody tails: only a tiny room reflection.
dry=mix.copy();mix+=np.roll(dry,round(.035*rate))*.045
# A static scaling retains dynamics without a compressor pumping at each note.
scale=min(.82/np.max(np.abs(mix)),.18/np.sqrt(np.mean(mix**2)));mix*=scale
out=root/'dist/assets/audio';out.mkdir(parents=True,exist_ok=True);wav=out/'background.wav'
with wave.open(str(wav),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','128k',str(out/'background.mp3')],check=True)
wav.unlink()
print('Music loop:',round(duration,2),'seconds; peak:',round(float(np.max(np.abs(mix))),3),'RMS:',round(float(np.sqrt(np.mean(mix**2))),3))
