#!/usr/bin/env python3
"""Validação de inventário, proveniência, alpha, crops e pontos de apoio do cenário 04."""
from pathlib import Path
from PIL import Image
import json,hashlib,collections
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'production/stages/aeroporto';m=json.loads((P/'manifest.json').read_text());errors=[];stats=collections.Counter();strips=[]
def check(ok,message):
 if not ok:errors.append(message)
check(m['id']=='aeroporto' and not m['missing'],'Pack completo');check(len(m['assets'])==41,'41 assets')
check(m['ground']==dict(asset='asfalto',projection='flat'),'Asfalto opt-in');check(m['world']['feetY']==930 and m['world']['groundTopY']==826,'Linhas do piso/pés')
for k,a in m['assets'].items():
 p=P/a['path'];check(p.exists(),'Arquivo '+k)
 if not p.exists():continue
 b=p.read_bytes();check(len(b)==a['bytes'],'Tamanho '+k);check(hashlib.sha256(b).hexdigest()==a['sha256'],'SHA '+k);stats[a['origin']]+=1
 if a.get('source'):check((P/a['source']).exists(),'Fonte '+k)
 if a['origin']=='reused-banheiros':
  src=ROOT/'production/stages/banheiros'/a['path'];check(hashlib.sha256(src.read_bytes()).hexdigest()==a['sha256']==a['sourceSha256'],'Reuso exato '+k)
 if a['kind']=='audio':continue
 im=Image.open(p).convert('RGBA');check(im.size==(a['width'],a['height']),'Dimensões '+k)
 n=a['frames'];check(n in [1,6],'Quadros '+k)
 if n==6:
  check(im.size==(3000,500),'Tira3000x500 '+k);x,y,w,h=a['crop'];bounds=[];feet=[];hashes=[]
  for f in range(6):
   cell=im.crop((f*500,0,(f+1)*500,500));alpha=cell.getchannel('A');box=alpha.point(lambda v:255 if v>12 else 0).getbbox();opaque=alpha.point(lambda v:255 if v>128 else 0).getbbox();check(bool(box),'Quadro vazio '+k+str(f));hashes.append(hashlib.sha256(cell.tobytes()).hexdigest());bounds.append(box);feet.append(opaque[3])
   check(box[0]>=x and box[1]>=y and box[2]<=x+w and box[3]<=y+h,'Crop '+k+str(f));check(0<box[0]<box[2]<500 and 0<box[1]<box[3]<500,'Margem alpha '+k+str(f))
  check(len(set(hashes))==6,'Seis poses distintas '+k)
  if a['origin']=='generated':check(feet==[480]*6,'Registro plantado '+k)
  strips.append(dict(asset=k,frames=6,bounds=bounds,opaqueBase=feet))
 if a['origin']=='generated' and k not in ['ceu-entardecer','asfalto']:
  check(im.getchannel('A').getextrema()[0]==0,'Transparência real '+k)
ids=set(m['assets'])
for o in m['layers']+m['objects']+m['foreground']:check(o['asset'] in ids,'Referência '+o['asset'])
plane=next(o for o in m['foreground'] if o['asset']=='aviao-executivo');stairs=next(o for o in m['foreground'] if o['asset']=='escada-embarque')
check(plane['factor']==stairs['factor']==1,'Parallax solidário');check(stairs['y']==930,'Base escada no chão');check(m['anchors']['stairsTop']==m['anchors']['door'],'Encaixe porta/escada');check(m['anchors']['boarding']['x']==2300 and m['anchors']['boarding']['range']==280,'Embarque real')
check(len(list((P/'source/generated').glob('*.png')))==17,'17 mestres originais');check(len(strips)==9,'9 tiras ambientais');check(sum(a['frames']==6 for a in m['assets'].values())*6==54,'54 quadros ambientais');check(len([a for a in m['assets'].values() if a['kind']=='audio'])==6,'6 áudios')
check((P/'ui/FONTE-OFL.txt').exists(),'Licença da fonte')
report=dict(stage='aeroporto',assets=len(m['assets']),generatedMasters=17,origins=dict(stats),strips=strips,environmentFrames=54,anchors=m['anchors'],errors=errors,passed=not errors)
(ROOT/'production/qa/aeroporto-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ['strips','anchors']},ensure_ascii=False));raise SystemExit(bool(errors))
