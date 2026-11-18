#!/usr/bin/env python3
"""Exporta o cenário 04 preservando PNGs gerados; só crop, registro, escala e codificação."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PACK=ROOT/'production/stages/aeroporto';SOURCE=PACK/'source';assets={};missing=[]
for folder in ['layers','ground','props','animations','fx','graphics','ui','source/pranchas']: (PACK/folder).mkdir(parents=True,exist_ok=True)
def record(k,path,kind,frames=1,**more):
 p=PACK/path;b=p.read_bytes();a=dict(path=path,kind=kind,frames=frames,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),**more)
 if kind!='audio':
  im=Image.open(p);a.update(width=im.width,height=im.height,alpha='A' in im.getbands())
 assets[k]=a
static={'ceu-entardecer':('layers',1920),'asfalto':('ground',2600),'aviao-executivo':('props',2048),'escada-embarque':('props',1024),'terminal':('props',2048),'torre-controle':('props',1024),'hangar':('props',1200),'trator-bagagem':('props',768),'carreta-bagagem':('props',768),'pilha-malas':('props',600),'cerca-aeroporto':('props',1024),'poste-refletores':('props',1024),'placa-embarque':('props',768)}
for k,(folder,maxsize) in static.items():
 src=SOURCE/'generated'/f'{k}.png';im=Image.open(src).convert('RGBA');box=im.getchannel('A').point(lambda v:255 if v>3 else 0).getbbox()
 if k=='ceu-entardecer': im=im.resize((1920,1080),Image.Resampling.LANCZOS)
 elif k=='asfalto':
  # Wide painted band; fixed crop, not tiled or regenerated.
  box=(0,360,1536,720);im=im.crop(box).resize((2600,610),Image.Resampling.LANCZOS)
 else: im=im.crop(box);im.thumbnail((maxsize,maxsize),Image.Resampling.LANCZOS)
 path=folder+'/'+k+'.webp';im.save(PACK/path,'WEBP',quality=92,method=4,exact=True)
 record(k,path,'layer' if folder=='layers' else 'ground' if folder=='ground' else 'prop',origin='generated',source=str(src.relative_to(PACK)),sourceCrop=box,sourceWidth=Image.open(src).width,sourceHeight=Image.open(src).height)
for k in ['npc-equipe-pista','npc-seguranca','biruta-vento','baliza-pista']:
 src=SOURCE/'generated'/f'{k}.png';im=Image.open(src).convert('RGBA');strip=Image.new('RGBA',(3000,500));sheet=Image.new('RGBA',(1500,1000));bounds=[];hashes=[];registrations=[]
 for n in range(6):
  x=n%3;y=n//3;cell=im.crop((round(x*im.width/3),round(y*im.height/2),round((x+1)*im.width/3),round((y+1)*im.height/2))).resize((480,480),Image.Resampling.LANCZOS)
  padded=Image.new('RGBA',(500,500));padded.paste(cell,(10,10));cell=padded
  mask=cell.getchannel('A').point(lambda v:255 if v>128 else 0);b=mask.getbbox()
  if not b: raise ValueError('Empty cell '+k)
  # Align planted feet/base, never independently crop/rescale frames.
  dx=0;dy=480-b[3]
  registered=Image.new('RGBA',(500,500));registered.paste(cell,(dx,dy));cell=registered
  bb=cell.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox();bounds.append(bb);hashes.append(hashlib.sha256(cell.tobytes()).hexdigest());registrations.append([dx,dy])
  strip.paste(cell,(n*500,0));sheet.paste(cell,(x*500,y*500))
 l=min(b[0] for b in bounds);t=min(b[1] for b in bounds);r=max(b[2] for b in bounds);b=max(b[3] for b in bounds)
 folder='fx' if k=='baliza-pista' else 'animations';path=folder+'/'+k+'.webp';strip.save(PACK/path,'WEBP',quality=92,method=4,exact=True);sheet.save(SOURCE/'pranchas'/f'{k}.png')
 if len(set(hashes))!=6:raise ValueError('Duplicate frames '+k)
 record(k,path,'fx' if folder=='fx' else 'animation',6,cellWidth=500,cellHeight=500,crop=[l,t,r-l,b-t],frameBounds=bounds,frameHashes=hashes,registrations=registrations,pivot=[250,480],fps=4,origin='generated',source=str(src.relative_to(PACK)))
old=json.loads((ROOT/'production/stages/banheiros/manifest.json').read_text())
for k in ['nuvem-1','nuvem-2','npc-fila-1','npc-fila-2','npc-torcedor-2','poeira','papel-vento','cone-servico','lixeira']:
 a=old['assets'][k];path=a['path'];src=ROOT/'production/stages/banheiros'/path;(PACK/path).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,PACK/path)
 record(k,path,a['kind'],a['frames'],origin='reused-banheiros',sourceManifest='../banheiros/manifest.json',sourceAsset=k,sourceSha256=a['sha256'],**{key:a[key] for key in ['crop','cellWidth','cellHeight','fps'] if key in a})
fontpath=ROOT/'production/ui/comic-v1/fonts/Bangers-Regular.ttf';shutil.copy2(fontpath,PACK/'ui/Bangers-Regular.ttf');licensepath=ROOT/'production/stages/banheiros/ui/FONTE-OFL.txt';shutil.copy2(licensepath,PACK/'ui/FONTE-OFL.txt')
def label(k,lines,size,color,bg=None):
 w,h=size;im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
 if bg:d.rectangle((0,0,w-1,h-1),fill=bg)
 for i,line in enumerate(lines):
  fs=int(h/len(lines)*.78);f=ImageFont.truetype(str(fontpath),fs)
  while d.textbbox((0,0),line,font=f)[2]>w-28:fs-=1;f=ImageFont.truetype(str(fontpath),fs)
  d.text((w/2,(i+.5)*h/len(lines)),line,font=f,fill=color,anchor='mm')
 folder='ui' if k=='titulo' else 'graphics';path=folder+'/'+k+'.webp';im.save(PACK/path,'WEBP',lossless=True);record(k,path,'graphic',origin='typeset',text=lines,font='ui/Bangers-Regular.ttf')
label('nome-terminal',['AEROPORTO'],(1100,140),'#24394e')
label('texto-embarque',['EMBARQUE  >'],(640,160),'#f2ddb2')
label('texto-restrito',['ÁREA RESTRITA'],(640,160),'#f2ddb2')
label('portao-04',['04'],(140,160),'#f2ddb2','#293443')
label('titulo',['AEROPORTO — A FUGA'],(1200,150),'#21172b','#f4e9c9')
# Deterministic code-native floor markings, kept as their own editable SVG master.
for k in ['faixa-pista','seta-pista']:
 if k=='faixa-pista':
  svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="28"><path d="M0 4H400V24H0Z" fill="#d9ad4c"/></svg>';im=Image.new('RGBA',(400,28));ImageDraw.Draw(im).rectangle((0,4,399,24),fill='#d9ad4c')
 else:
  svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120"><path d="M0 42H260V0L400 60 260 120V78H0Z" fill="#cfab5d"/></svg>';im=Image.new('RGBA',(400,120));ImageDraw.Draw(im).polygon([(0,42),(260,42),(260,0),(400,60),(260,120),(260,78),(0,78)],fill='#cfab5d')
 (SOURCE/f'{k}.svg').write_text(svg);path='graphics/'+k+'.webp';im.save(PACK/path,'WEBP',lossless=True);record(k,path,'graphic',origin='code-native',source='source/'+k+'.svg')
for p in sorted((PACK/'audio').glob('*.ogg')):record(p.stem,str(p.relative_to(PACK)),'audio',origin='original-synthesis',sourceManifest='audio/manifest.json')
for k in ['miniatura','carregamento']:
 path='ui/'+k+'.webp'
 if (PACK/path).exists(): record(k,path,'image',origin='derived-composition')
 else:missing.append(k)
(SOURCE/'exports.json').write_text(json.dumps(dict(assets=assets,missing=missing),ensure_ascii=False,indent=2))
print(json.dumps(dict(exported=len(assets),missing=missing),ensure_ascii=False))
if missing and '--partial' not in sys.argv:sys.exit(1)
