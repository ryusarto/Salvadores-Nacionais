#!/usr/bin/env python3
"""Export the individual arena-three assets; preserve every generated PNG master."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];PACK=ROOT/'production/stages/banheiros';OLD=ROOT/'production/stages/palco'
plan=json.loads((PACK/'PLANO.json').read_text());old=json.loads((OLD/'manifest.json').read_text());assets={};missing=[]
def record(k,path,kind,frames=1,**more):
 p=PACK/path;b=p.read_bytes();a=dict(path=path,kind=kind,frames=frames,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),**more)
 if kind!='audio':
  im=Image.open(p);a.update(width=im.width,height=im.height,alpha='A' in im.getbands())
 assets[k]=a
for g in plan['groups']:
 k=g['slug'];folder=g['folder'];path=folder+'/'+k+('.ogg' if folder=='audio' else '.webp');out=PACK/path;out.parent.mkdir(exist_ok=True,parents=True)
 if g['origin']=='reused-palco':
  a=old['assets'][g['sourceAsset']];src=OLD/a['path']
  if not out.exists():subprocess.run(['/bin/cp','-c',str(src),str(out)],check=True)
  record(k,path,a['kind'],a['frames'],origin='reused-palco',sourceAsset=k,sourceManifest='../palco/manifest.json',**{x:a[x] for x in ['crop','cellWidth','cellHeight'] if x in a})
 elif g['origin']=='generated':
  src=PACK/'source/generated'/f'{k}.png'
  if k in ['banheiro-acessivel','papel-vento'] and (PACK/'source/generated'/f'{k}-v2.png').exists():src=PACK/'source/generated'/f'{k}-v2.png'
  if not src.exists():missing.append(k);continue
  im=Image.open(src).convert('RGBA')
  if g['framesPerVariant']==6:
   strip=Image.new('RGBA',(3000,500));sheet=Image.new('RGBA',(1500,1000));bounds=[];hashes=[]
   for n in range(6):
    x=n%3;y=n//3
    cell=im.crop((round(x*im.width/3),round(y*im.height/2),round((x+1)*im.width/3),round((y+1)*im.height/2))).resize((500,500),Image.Resampling.LANCZOS)
    box=cell.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
    if not box:raise ValueError('Empty frame '+k+' '+str(n))
    bounds.append(box);hashes.append(hashlib.sha256(cell.tobytes()).hexdigest());strip.paste(cell,(n*500,0));sheet.paste(cell,(x*500,y*500))
   if len(set(hashes))!=6:raise ValueError('Duplicate frames '+k)
   l=min(b[0] for b in bounds);t=min(b[1] for b in bounds);r=max(b[2] for b in bounds);b=max(b[3] for b in bounds)
   strip.save(out,'WEBP',quality=92,method=0,exact=True);sheet.save(PACK/'source/pranchas'/f'{k}.png')
   record(k,path,'fx' if folder=='fx' else 'animation',6,cellWidth=500,cellHeight=500,crop=[l,t,r-l,b-t],frameBounds=bounds,frameHashes=hashes,origin='generated',source=str(src.relative_to(PACK)),fps=5)
  else:
   box=im.getchannel('A').point(lambda v:255 if v>3 else 0).getbbox()
   if not box:raise ValueError('Empty alpha '+k)
   im=im.crop(box);im.thumbnail((768,768) if k=='tenda-servico' else (600,600) if k=='banheiro-acessivel' else (512,512),Image.Resampling.LANCZOS);im.save(out,'WEBP',quality=92,method=0,exact=True)
   record(k,path,'prop',origin='generated',source=str(src.relative_to(PACK)),sourceCrop=box)
 elif folder=='audio':
  if out.exists():record(k,path,'audio',origin='see audio/manifest.json')
  else:missing.append(k)
 elif g['origin']=='derived-composition':
  if out.exists():record(k,path,'image',origin='derived-composition')
  else:missing.append(k)
# Editable, correctly spelled signage stays separate from painted scenery.
fontpath=ROOT/'production/ui/comic-v1/fonts/Bangers-Regular.ttf'
def label(k,lines,size,color='#21172b'):
 w,h=size;im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
 if k=='titulo':d.rounded_rectangle((4,4,w-5,h-5),radius=12,fill='#f4e9c9',outline=color,width=6)
 for i,line in enumerate(lines):
  fs=int((h-20)/len(lines)*.78);f=ImageFont.truetype(str(fontpath),fs)
  while d.textbbox((0,0),line,font=f)[2]>w-28:fs-=1;f=ImageFont.truetype(str(fontpath),fs)
  d.text((w/2,12+i*(h-20)/len(lines)),line,font=f,fill=color,anchor='mt')
 folder='ui' if k=='titulo' else 'graphics';path=folder+'/'+k+'.webp';im.save(PACK/path,'WEBP',lossless=True);record(k,path,'graphic',origin='typeset',text=lines)
for k,lines,sz,col in [
 ('aviso-bem-vindos',['BEM-VINDOS!','TODO MUNDO TEM LUGAR'],(640,180),'#214e50'),
 ('aviso-banheiros',['BANHEIROS','ACESSO LIVRE'],(500,160),'#214e50'),
 ('aviso-acessivel',['ACESSÍVEL'],(420,120),'#214e50'),
 ('aviso-decreto',['POR DECRETO','CADA UM NO SEU LUGAR'],(640,190),'#a61734'),
 ('aviso-agua',['ÁGUA PARA','LAVAR AS MÃOS'],(500,180),'#214e50'),
 ('titulo',['BELÉM — BANHEIROS QUÍMICOS'],(1200,150),'#21172b')]:label(k,lines,sz,col)
report=dict(assets=assets,missing=missing)
(PACK/'source/exports.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(dict(exported=len(assets),missing=missing),ensure_ascii=False))
if missing and '--partial' not in sys.argv:sys.exit(1)
