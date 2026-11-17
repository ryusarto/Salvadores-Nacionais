"""Original 104 BPM rap/carimbó score and restrained sanitary ambience; stdlib only."""
from pathlib import Path
from array import array
import math,random,subprocess,shutil,json,os,hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'production/stages/banheiros/audio';OUT.mkdir(parents=True,exist_ok=True)
SR=22050;BPM=104;BEAT=60/BPM;TAU=2*math.pi
RNG=random.Random(2026111703)
FFMPEG=os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
if not FFMPEG:raise RuntimeError('Set FFMPEG_PATH or install FFmpeg.')
def add(out,samples,start,gain):
 at=round(start*SR);n=len(out)
 for i,x in enumerate(samples):out[(at+i)%n]+=x*gain
def tone(f,d,decay=8,brass=False):
 result=array('f')
 for i in range(round(d*SR)):
  t=i/SR;v=math.sin(TAU*f*t)+.13*math.sin(TAU*2*f*t)
  if brass:v+=.22*math.sin(TAU*3*f*t)+.08*math.sin(TAU*4*f*t)
  result.append(v*min(t/.008,1)*math.exp(-decay*t))
 return result
def kick():
 return array('f',(math.sin(TAU*(46*i/SR+2.5*(1-math.exp(-31*i/SR))))*math.exp(-17*i/SR) for i in range(round(.32*SR))))
def snare():
 return array('f',((RNG.uniform(-1,1)*.65+.35*math.sin(TAU*174*i/SR))*math.exp(-31*i/SR) for i in range(round(.16*SR))))
def hat():
 result=array('f');prev=0
 for i in range(round(.055*SR)):
  v=RNG.uniform(-1,1);result.append((v-prev)*math.exp(-85*i/SR));prev=v
 return result
def score(bars,intro=False):
 out=array('f',[0])*round(bars*4*BEAT*SR)
 for bar in range(bars):
  at=bar*4*BEAT;root=[82.407,82.407,73.416,77.782][bar%4]
  for beat in [0,1.75,2.5]:add(out,kick(),at+beat*BEAT,.21)
  for beat in [1,3]:add(out,snare(),at+beat*BEAT,.085 if intro else .115)
  for eighth in range(8):add(out,hat(),at+(eighth*.5+(.035 if eighth%2 else 0))*BEAT,.022)
  for beat,ratio,gain in [(0,1,.16),(1.5,1,.12),(2.75,.75,.12)]:add(out,tone(root*ratio,.44,6),at+beat*BEAT,gain)
  # Carimbó-like hand-drum syncopation; the dry taps evoke the villain's bureaucracy.
  for beat in [.5,1.25,2.75,3.5]:add(out,tone(147,.12,28),at+beat*BEAT,.05)
  if not intro:
   phrase=[(.25,4),(1.5,4),(2.25,4.75),(3.25,4.5)] if bar%2==0 else [(.5,4.75),(1.75,4.5),(2.5,4),(3.5,3.5)]
   for beat,ratio in phrase:add(out,tone(root*ratio,.19,15,True),at+beat*BEAT,.036)
   for beat in [.75,2.5]:
    for ratio in [2,2.375,3]:add(out,tone(root*ratio,.16,15),at+beat*BEAT,.018)
 return out

def sanitary():
 # No voices, toilet jokes or bodily sounds: faucet flow, drips and restrained hardware taps.
 out=array('f',[0])*(16*SR)
 for start,duration in [(1.2,2.6),(7.4,2.0),(12.6,1.8)]:
  sound=array('f');slow=0;prev=0
  for i in range(round(duration*SR)):
   t=i/SR;v=RNG.uniform(-1,1);slow=.94*slow+.06*v
   env=min(t/.25,1,(duration-t)/.3)
   sound.append(((v-prev)*.16+slow*.7)*env);prev=v
  add(out,sound,start,.035)
 for k in range(22):
  duration=.12;f=RNG.uniform(780,1320)
  drop=array('f',(math.sin(TAU*(f*i/SR-120*(i/SR)**2))*math.exp(-40*i/SR) for i in range(round(duration*SR))))
  add(out,drop,RNG.uniform(0,16),.009)
 for start in [1.0,3.9,7.1,9.7,12.3,14.7]:
  sound=array('f',(sum(math.sin(TAU*920*r*i/SR)*math.exp(-(35+18*r)*i/SR)/r for r in [1,1.73,2.41]) for i in range(round(.12*SR))))
  add(out,sound,start,.008)
 return out

def stats(samples):
 return {'peak':max(abs(x) for x in samples),'rms':math.sqrt(sum(x*x for x in samples)/len(samples))}

def decoded_stats(path):
 raw=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-f','f32le','-ar','44100','-ac','1','pipe:1'],stdout=subprocess.PIPE,check=True).stdout
 decoded=array('f');decoded.frombytes(raw)
 return {**stats(decoded),'seconds':len(decoded)/44100}

report={}
for name,builder in [('trilha-intro',lambda:score(2,True)),('trilha-loop',lambda:score(16)),('ambiente-sanitario',sanitary)]:
 samples=builder();target=OUT/(name+'.ogg')
 source=stats(samples)
 subprocess.run([FFMPEG,'-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','pipe:0','-ar','44100','-ac','2','-c:a','libvorbis','-q:a','5',str(target)],input=samples.tobytes(),check=True)
 report[name]={'file':'audio/'+name+'.ogg','sampleRate':44100,'channels':2,'sourceRate':SR,**decoded_stats(target),'sourcePeak':source['peak'],'sourceRms':source['rms'],'loop':name!='trilha-intro','origin':'original deterministic synthesis; no recordings or intelligible speech','bpm':BPM if name.startswith('trilha') else None,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
 print(name,round(report[name]['seconds'],3),flush=True);del samples
for key,stage in [('ambiente-publico','palco'),('ambiente-agua','belem'),('vento-tecido','belem')]:
 old=ROOT/'production/stages'/stage/'audio';target=OUT/(key+'.ogg')
 shutil.copy2(old/(key+'.ogg'),target)
 meta=json.loads((old/'manifest.json').read_text())[key]
 report[key]={**meta,'file':'audio/'+key+'.ogg',**decoded_stats(target),'origin':'explicit reuse of '+stage+' original synthetic ambience','sourceFile':'production/stages/'+stage+'/audio/'+key+'.ogg','sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
report['_generation_note']='New score and sanitary ambience synthesized locally with Python stdlib and FFmpeg. No external recordings. Intro 2 bars, loop 16 bars at104BPM; sample tails wrap across the loop boundary. Shared ambience retains source provenance.'
(OUT/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
