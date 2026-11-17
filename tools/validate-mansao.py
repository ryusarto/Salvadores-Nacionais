#!/usr/bin/env python3
"""Verifica a entrega da mansão, sem substituir inspeção visual/execução do jogo."""
from pathlib import Path
from PIL import Image
import json,hashlib,collections
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'production/stages/mansao';m=json.loads((P/'manifest.json').read_text());errors=[];stats=collections.Counter();strips=[]
def check(ok,msg):
 if not ok:errors.append(msg)
check(m['id']=='mansao' and not m['missing'],'Pack completo');check(len(m['assets'])==30,'30 assets');check(m['ground']==dict(asset='marmore',projection='flat'),'Piso próprio sem zona pintada');check(m['world']['feetY']==930 and m['world']['groundTopY']==826,'Pés/piso')
for k,a in m['assets'].items():
 p=P/a['path'];check(p.exists(),'Arquivo '+k)
 if not p.exists():continue
 b=p.read_bytes();check(len(b)==a['bytes'],'Bytes '+k);check(hashlib.sha256(b).hexdigest()==a['sha256'],'SHA '+k);stats[a['origin']]+=1
 if a.get('source'):check((P/a['source']).exists(),'Fonte '+k)
 if a['origin']=='reused-banheiros':check(hashlib.sha256((ROOT/'production/stages/banheiros'/a['path']).read_bytes()).hexdigest()==a['sha256']==a['sourceSha256'],'Reuso exato '+k)
 if a['kind']=='audio':continue
 im=Image.open(p).convert('RGBA');check(im.size==(a['width'],a['height']),'Dimensões '+k)
 if a['frames']==6:
  check(im.size==(3000,500),'Tira3000x500 '+k);x,y,w,h=a['crop'];bounds=[];bases=[];baseCenters=[];mounts=[];hashes=[]
  for f in range(6):
   cell=im.crop((f*500,0,(f+1)*500,500));alpha=cell.getchannel('A');box=alpha.point(lambda v:255 if v>12 else 0).getbbox();mask=alpha.point(lambda v:255 if v>128 else 0);opaque=mask.getbbox();check(bool(box),'Quadro vazio '+k+str(f));hashes.append(hashlib.sha256(cell.tobytes()).hexdigest());bounds.append(box);bases.append(opaque[3]);check(box[0]>=x and box[1]>=y and box[2]<=x+w and box[3]<=y+h,'Crop '+k+str(f));check(0<box[0]<box[2]<500 and 0<box[1]<box[3]<500,'Margens '+k+str(f))
   base=mask.crop((0,opaque[3]-40,500,opaque[3])).getbbox();baseCenters.append((base[0]+base[2])/2)
   band=mask.crop((0,opaque[1],500,opaque[1]+40)).getbbox();mounts.append([(band[0]+band[2])/2,opaque[1]])
  check(len(set(hashes))==6,'Seis poses distintas '+k)
  if a['registration']=='planted-base':check(bases==[480]*6,'Base plantada '+k)
  else:check(all(abs(x-250)<=1 and y==20 for x,y in mounts),'Montagem fixa '+k)
  if k=='relogio-pendulo':check(all(abs(x-250)<=1 for x in baseCenters),'Registro horizontal relógio')
  if k=='cortinas-vento':check(max(im.getpixel((f*500+250,250))[3] for f in range(6))<=2,'Centro cortina realmente transparente');check(a['source'].endswith('-v2.png'),'Selecionada correçãoalpha')
  strips.append(dict(asset=k,bounds=bounds,opaqueBases=bases,baseCenters=baseCenters,upperMounts=mounts,registration=a['registration']))
 elif a['origin']=='generated' and k not in ['parede-bordo','marmore','vista-jardim']:check(im.getchannel('A').getextrema()[0]==0,'Alpha real '+k)
for o in m['layers']+m['objects']+m['foreground']:check(o['asset'] in m['assets'],'Referência '+o['asset']);check(o.get('factor',1)==1,'Parallax físico '+o['asset'])
zone=m['anchors']['ankleZone'];check(zone==dict(x=1560,y=940,rx=420,ry=34),'Zona real');check(not any('zone' in k or 'tornozeleira' in k for k in m['assets']),'Zona não está pintada')
for o in m['objects']:
 if o['asset'] in ['lustre-balanco','cortinas-vento']:check(o.get('support',{}).get('pivot')==[250,20],'Apoio explícito '+o['asset'])
phone=next(o for o in m['objects'] if o['asset']=='telefone-preto');check(abs(phone['y']-m['anchors']['tabletop']['y'])<.01,'Telefone apoiado')
check(len(list((P/'source/generated').glob('*.png')))==19,'19 mestres incluindo revisão');check(len(strips)==4,'4 tiras/24 quadros');check(sum(a['kind']=='audio' for a in m['assets'].values())==6,'6 áudios');check((P/'ui/FONTE-OFL.txt').exists(),'Licença Bangers')
prompts=json.loads((P/'source/prompts-completos.json').read_text());portrait=next(p for p in prompts if p['slug']=='retrato-fujao');check(hashlib.sha256((P/portrait['reference']).read_bytes()).hexdigest()==portrait['referenceSha256'],'Referência do retrato')
report=dict(stage='mansao',assets=len(m['assets']),generatedMasters=19,selectedGenerated=18,environmentFrames=24,origins=dict(stats),strips=strips,zone=zone,errors=errors,passed=not errors);(ROOT/'production/qa/mansao-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='strips'},ensure_ascii=False));raise SystemExit(bool(errors))
