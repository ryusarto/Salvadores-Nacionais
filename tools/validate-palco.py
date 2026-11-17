"""Verify every planned asset, actual file, dimensions, transparency and frame count."""
from pathlib import Path
from PIL import Image
import json,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'production/stages/palco'
plan=json.loads((P/'PLANO.json').read_text());m=json.loads((P/'manifest.json').read_text())
expected={g['slug']+(f'-{n}' if g['variants']>1 else '') for g in plan['groups'] for n in range(1,g['variants']+1)}
assert set(m['assets'])==expected,(expected-set(m['assets']),set(m['assets'])-expected)
strips=0;frames=0;decoded=0
for key,a in m['assets'].items():
 p=P/a['path'];assert p.is_file(),key
 assert p.stat().st_size==a['bytes'],key
 assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256'],key
 if a['kind']=='audio':continue
 if p.suffix=='.svg':ET.parse(p);continue
 with Image.open(p) as im:
  im.load();assert im.size==(a['width'],a['height']),key
  decoded+=im.width*im.height*4
  if a['frames']==6:
   assert im.size==(3000,500) and 'A' in im.getbands(),key
   strips+=1;frames+=6
   if a.get('origin')=='generated':
    hashes={hashlib.sha256(im.crop((i*500,0,(i+1)*500,500)).tobytes()).hexdigest() for i in range(6)}
    assert len(hashes)==6,key
   x,y,w,h=a['crop'];assert x>=0 and y>=0 and x+w<=500 and y+h<=500,key
for o in m['layers']+m['objects']+m['foreground']+m['alternatives']:assert o['asset'] in m['assets'],o
assert strips==18 and frames==108
assert m['world']['feetY']==930 and m['world']['cameraMax']==680
report={'groups':len(plan['groups']),'assets':len(expected),'animatedStrips':strips,'animationFrames':frames,'runtimeBytes':sum(a['bytes'] for a in m['assets'].values()),'decodedRGBABytesEstimate':decoded,'hashes':'pass','dimensions':'pass','alphaAndFrames':'pass','missing':m['missing']}
(ROOT/'production/qa/palco-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
