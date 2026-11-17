"""Generate original instrumental stage audio with a small memory footprint."""
from pathlib import Path
from array import array
import math,random,subprocess,shutil,json,os
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'production/stages/palco/audio';OUT.mkdir(parents=True,exist_ok=True)
SR=22050;BPM=110;BEAT=60/BPM;TAU=2*math.pi
RNG=random.Random(20261117)
FFMPEG=os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
if not FFMPEG:raise RuntimeError('Set FFMPEG_PATH or install FFmpeg.')
def add(out,samples,start,gain):
 at=round(start*SR);n=len(out)
 for i,x in enumerate(samples):out[(at+i)%n]+=x*gain
def note(f,d,decay=8):
 return array('f',((math.sin(TAU*f*i/SR)+.13*math.sin(TAU*2*f*i/SR))*min(i/(SR*.006),1)*math.exp(-decay*i/SR) for i in range(round(d*SR))))
def kick():
 return array('f',(math.sin(TAU*(48*i/SR+2.8*(1-math.exp(-30*i/SR))))*math.exp(-17*i/SR) for i in range(round(.32*SR))))
def snare():
 return array('f',((RNG.uniform(-1,1)*.7+.3*math.sin(TAU*185*i/SR))*math.exp(-30*i/SR) for i in range(round(.16*SR))))
def hat():
 result=array('f');prev=0
 for i in range(round(.06*SR)):
  v=RNG.uniform(-1,1);result.append((v-prev)*math.exp(-80*i/SR));prev=v
 return result
def score(bars,intro=False):
 out=array('f',[0])*round(bars*4*BEAT*SR)
 for bar in range(bars):
  at=bar*4*BEAT;root=[73.416,65.406,58.270,65.406][bar%4]
  for beat in [0,1.75,2.5]:add(out,kick(),at+beat*BEAT,.21)
  for beat in [1,3]:add(out,snare(),at+beat*BEAT,.09 if intro else .12)
  for eighth in range(8):add(out,hat(),at+(eighth*.5+(.035 if eighth%2 else 0))*BEAT,.025)
  for beat,ratio,gain in [(0,1,.19),(1.5,1,.13),(2.75,1.5,.12)]:add(out,note(root*ratio,.42,6),at+beat*BEAT,gain)
  for beat in [.75,1.5,2.75,3.5]:add(out,note(155,.15,24),at+beat*BEAT,.06)
  if not intro:
   for beat in [.5,2.25,3.5]:
    for ratio in [2,2.4,3]:add(out,note(root*ratio,.22,12),at+beat*BEAT,.025)
   phrase=[(0,4),(1.5,4.8),(2.5,6),(3.25,5.33)] if bar%2==0 else [(.5,6),(1.75,5.33),(2.5,4.8),(3.5,4)]
   for beat,ratio in phrase:add(out,note(root*ratio,.26,8),at+beat*BEAT,.045)
 return out
def ambience(kind):
 out=array('f',[0])*(16*SR)
 if kind=='publico':
  for k in range(65):
   dur=RNG.uniform(.18,.6);f=RNG.uniform(105,260);phase=RNG.uniform(0,TAU)
   sound=array('f',((math.sin(TAU*f*i/SR+phase)+.35*math.sin(TAU*f*2*i/SR)+.17*math.sin(TAU*f*3*i/SR))*math.sin(math.pi*i/SR/dur)**2 for i in range(round(dur*SR))))
   add(out,sound,RNG.uniform(0,16),.008)
 else:
  for k in range(24):
   dur=RNG.uniform(.05,.15);f=RNG.uniform(750,1700)
   sound=array('f',(sum(math.sin(TAU*f*r*i/SR)*math.exp(-(25+15*r)*i/SR)/r for r in [1,1.73,2.41]) for i in range(round(dur*SR))))
   add(out,sound,RNG.uniform(0,16),.016)
 return out
report={}
for name,builder in [
 ('trilha-intro',lambda:score(2,True)),('trilha-loop',lambda:score(16)),
 ('ambiente-publico',lambda:ambience('publico')),('ambiente-cozinha',lambda:ambience('cozinha'))
]:
 samples=builder();peak=max(abs(x) for x in samples);rms=math.sqrt(sum(x*x for x in samples)/len(samples))
 target=OUT/(name+'.ogg')
 subprocess.run([FFMPEG,'-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','pipe:0','-ar','44100','-ac','2','-c:a','libvorbis','-q:a','5',str(target)],input=samples.tobytes(),check=True)
 report[name]={'seconds':len(samples)/SR,'sampleRate':44100,'channels':2,'sourceRate':SR,'peak':peak,'rms':rms,'loop':name!='trilha-intro','origin':'original deterministic synthesis; no recordings or intelligible speech','bpm':BPM if name.startswith('trilha') else None}
 print(name,round(len(samples)/SR,3),flush=True);del samples
old=ROOT/'production/stages/belem/audio'
for key in ['ambiente-agua','vento-tecido']:
 shutil.copy2(old/(key+'.ogg'),OUT/(key+'.ogg'))
 report[key]={**json.loads((old/'manifest.json').read_text())[key],'origin':'explicit reuse of original Belem synthetic ambience'}
report['_generation_note']='ElevenLabs generation did not start; new score and ambience were synthesized locally.'
(OUT/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
