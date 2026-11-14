"""Create an original seamless, bright and gently playful instrumental loop."""
from pathlib import Path
import numpy as np
import wave, subprocess
root=Path(__file__).resolve().parents[1];rate=44100;beat=60/92;duration=64*beat;size=round(duration*rate)
mix=np.zeros(size,dtype=np.float64)
def note(midi,start,length,level,pad=False):
 count=round(length*rate);t=np.arange(count)/rate;freq=440*2**((midi-69)/12)
 attack=.65 if pad else .065;release=1.2 if pad else .65
 env=np.minimum(1,t/attack);env=np.sin(env*np.pi/2)**2
 env*=np.sin(np.minimum(1,np.maximum(0,length-t)/release)*np.pi/2)**2
 wave=np.sin(2*np.pi*freq*t)+(.08 if pad else .22)*np.sin(2*np.pi*freq*2*t)+(.0 if pad else .045)*np.sin(2*np.pi*freq*3*t)
 sig=level*wave*env;start=round(start*rate)%size;first=min(count,size-start)
 mix[start:start+first]+=sig[:first]
 if first<count:mix[:count-first]+=sig[first:]
chords=[[48,55,60,64],[53,60,65,69],[55,62,67,71],[48,55,60,64],[53,60,65,69],[48,55,60,64],[53,60,65,69],[55,62,67,71]]
phrases=[[72,76,79,81,79,76],[77,81,79,77,76,72],[74,79,83,81,79,74],[76,79,84,83,79,76],[77,81,84,81,79,77],[76,79,84,79,76,72],[77,79,81,84,81,77],[79,83,86,83,79,72]]
for i,chord in enumerate(chords):
 for j,n in enumerate(chord):note(n,i*8*beat+j*.035,9.2*beat,.017,True)
 # A quiet, rounded accompaniment adds gentle motion without a drum beat.
 for j,k in enumerate([0,1,2,1]):note(chord[k]+12,(i*8+j*2+.08)*beat,2.5*beat,.028)
 for j,(offset,n) in enumerate(zip([0,1,2,3.5,5,6.5],phrases[i])):
  length=(1.65 if j<2 else 2.1)*beat
  note(n,(i*8+offset)*beat+.06,length,.084)

dry=mix.copy()
for delay,level in [(.113,.14),(.229,.1),(.373,.07),(.541,.04)]:mix+=np.roll(dry,round(delay*rate))*level
# A static scaling retains dynamics without a compressor pumping at each note.
scale=min(.82/np.max(np.abs(mix)),.18/np.sqrt(np.mean(mix**2)));mix*=scale
out=root/'dist/assets/audio';out.mkdir(parents=True,exist_ok=True);wav=out/'background.wav'
with wave.open(str(wav),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','128k',str(out/'background.mp3')],check=True)
wav.unlink()
print('Music loop:',round(duration,2),'seconds; peak:',round(float(np.max(np.abs(mix))),3),'RMS:',round(float(np.sqrt(np.mean(mix**2))),3))
