"""Create an original seamless, softly sustained instrumental loop."""
from pathlib import Path
import numpy as np
import wave, subprocess
root=Path(__file__).resolve().parents[1];rate=44100;beat=60/68;duration=64*beat;size=round(duration*rate)
mix=np.zeros(size,dtype=np.float64)
def note(midi,start,length,level,pad=False):
 count=round(length*rate);t=np.arange(count)/rate;freq=440*2**((midi-69)/12)
 attack=.85 if pad else .22;release=1.65 if pad else .95
 env=np.minimum(1,t/attack);env=np.sin(env*np.pi/2)**2
 env*=np.sin(np.minimum(1,np.maximum(0,length-t)/release)*np.pi/2)**2
 wave=np.sin(2*np.pi*freq*t)+(.08 if pad else .16)*np.sin(2*np.pi*freq*2*t)
 sig=level*wave*env;start=round(start*rate)%size;first=min(count,size-start)
 mix[start:start+first]+=sig[:first]
 if first<count:mix[:count-first]+=sig[first:]
chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59],[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]]
for i,chord in enumerate(chords):
 for j,n in enumerate(chord):note(n,i*8*beat+j*.06,9.5*beat,.022,True)
melody=[72,76,79,76,69,72,76,72,69,72,77,76,71,74,79,74,72,76,79,81,76,72,69,72,77,76,72,69,71,74,72,67]
for i,n in enumerate(melody):note(n,i*2*beat+.12,3.1*beat,.11)
dry=mix.copy()
for delay,level in [(.113,.14),(.229,.1),(.373,.07),(.541,.04)]:mix+=np.roll(dry,round(delay*rate))*level
# A static scaling retains dynamics without a compressor pumping at each note.
scale=min(.82/np.max(np.abs(mix)),.18/np.sqrt(np.mean(mix**2)));mix*=scale
out=root/'dist/assets/audio';out.mkdir(parents=True,exist_ok=True);wav=out/'background.wav'
with wave.open(str(wav),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','128k',str(out/'background.mp3')],check=True)
wav.unlink()
print('Music loop:',round(duration,2),'seconds; peak:',round(float(np.max(np.abs(mix))),3),'RMS:',round(float(np.sqrt(np.mean(mix**2))),3))
