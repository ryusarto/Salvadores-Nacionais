"""Verify every planned asset, actual file, dimensions, transparency and frame count."""
from pathlib import Path
from PIL import Image,ImageFilter
import json,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'production/stages/palco'
plan=json.loads((P/'PLANO.json').read_text());m=json.loads((P/'manifest.json').read_text())
contracts={g['slug']+(f'-{n}' if g['variants']>1 else ''):g for g in plan['groups'] for n in range(1,g['variants']+1)}
expected=set(contracts)
summary=plan['summary']
planned_files=sum(g['variants'] for g in plan['groups'])
planned_strips=sum(g['variants'] for g in plan['groups'] if g['framesPerVariant']>1)
planned_frames=sum(g['variants']*g['framesPerVariant'] for g in plan['groups'] if g['framesPerVariant']>1)
assert len(expected)==planned_files, 'duplicate asset IDs in plan'
assert len(plan['groups'])==summary['groups']==m['groups'], 'group inventory differs'
assert planned_files==summary.get('runtimeFiles',summary.get('proposedRuntimeFiles')), 'runtime inventory differs'
assert (planned_strips,planned_frames)==(summary['animatedStrips'],summary['animationFrames']), 'planned animation inventory differs'
assert set(m['assets'])==expected,(expected-set(m['assets']),set(m['assets'])-expected)
def dance_npc_metrics(strip):
 # Inspect the decoded runtime; this does not modify the export or its alpha.
 bright_exterior=[];opaque_feet=[]
 for frame in range(6):
  cell=strip.crop((frame*500,0,(frame+1)*500,500)).convert('RGBA')
  core=cell.getchannel('A').point(lambda alpha:255 if alpha>=240 else 0)
  bounds=core.getbbox();assert bounds, f'npc-danca-1: empty opaque core in frame {frame}'
  opaque_feet.append(bounds[3]-1)
  dilated=core.filter(ImageFilter.MaxFilter(9)).tobytes();rgba=cell.tobytes()
  count=sum(1 for pixel in range(500*500) if dilated[pixel]==0
            and rgba[pixel*4+3]>12
            and rgba[pixel*4]+rgba[pixel*4+1]+rgba[pixel*4+2]>270)
  bright_exterior.append(count)
  assert count<=10, f'npc-danca-1: bright exterior halo in frame {frame}: {count} pixels exceeds 10'
 span=max(opaque_feet)-min(opaque_feet)
 assert span<=2, f'npc-danca-1: opaque foot height varies {span}px (maximum 2px)'
 return {'asset':'npc-danca-1','brightExteriorPixelsPerFrame':bright_exterior,
         'opaqueFootYPerFrame':opaque_feet,'opaqueFootYSpan':span,
         'coreAlphaThreshold':240,'coreDilationKernel':[9,9],
         'exteriorAlphaThresholdExclusive':12,'exteriorMeanRGBThresholdExclusive':90,
         'maximumBrightExteriorPixelsPerFrame':10,'maximumOpaqueFootYSpan':2}

strips=0;frames=0;decoded=0;npc_metrics=None
for key,a in m['assets'].items():
 assert a['frames']==contracts[key]['framesPerVariant'],key
 p=P/a['path'];assert p.is_file(),key
 assert p.stat().st_size==a['bytes'],key
 assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'],key
 if a['kind']=='audio':continue
 if p.suffix=='.svg':ET.parse(p);continue
 with Image.open(p) as im:
  im.load();assert im.size==(a['width'],a['height']),key
  decoded+=im.width*im.height*4
  if key=='npc-danca-1':
   assert a['frames']==6 and im.size==(3000,500), 'npc-danca-1: six 500px runtime cells required'
   npc_metrics=dance_npc_metrics(im)
  if a['frames']==6:
   assert im.size==(3000,500) and 'A' in im.getbands(),key
   strips+=1;frames+=6
   if a.get('origin')=='generated':
    hashes={hashlib.sha256(im.crop((i*500,0,(i+1)*500,500)).tobytes()).hexdigest() for i in range(6)}
    assert len(hashes)==6,key
   x,y,w,h=a['crop'];assert x>=0 and y>=0 and x+w<=500 and y+h<=500,key
for o in m['layers']+m['objects']+m['foreground']+m['alternatives']:assert o['asset'] in m['assets'],o
assert (strips,frames)==(planned_strips,planned_frames), 'runtime animation inventory differs'
assert m['world']['feetY']==930 and m['world']['cameraMax']==680
assert npc_metrics is not None, 'npc-danca-1: missing runtime for halo/feet validation'
report={'npcHalo':'pass','stableFeet':'pass','npcMetrics':npc_metrics,'groups':len(plan['groups']),'assets':len(expected),'animatedStrips':strips,'animationFrames':frames,'runtimeBytes':sum(a['bytes'] for a in m['assets'].values()),'decodedRGBABytesEstimate':decoded,'hashes':'pass','dimensions':'pass','alphaAndFrames':'pass','missing':m['missing']}
(ROOT/'production/qa/palco-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
