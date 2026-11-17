#!/usr/bin/env python3
"""Exporta os assets da sala; preserva mestres e só aplica crop/escala/registro/encoding."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,sys
ROOT=Path(__file__).resolve().parents[1];PACK=ROOT/'production/stages/mansao';SOURCE=PACK/'source';assets={};missing=[]
for folder in ['layers','ground','props','animations','fx','graphics','ui','source/pranchas','source/referencias']: (PACK/folder).mkdir(parents=True,exist_ok=True)
def record(k,path,kind,frames=1,**more):
 p=PACK/path;b=p.read_bytes();a=dict(path=path,kind=kind,frames=frames,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),**more)
 if kind!='audio':
  im=Image.open(p);a.update(width=im.width,height=im.height,alpha='A' in im.getbands())
 assets[k]=a
static={'parede-bordo':('layers',2600),'marmore':('ground',2600),'lambri':('props',1600),'porta-capangas':('props',1024),'moldura-janela':('props',1200),'vista-jardim':('props',1200),'sofa-bordo':('props',1024),'mesa-telefone':('props',700),'telefone-preto':('props',512),'retrato-fujao':('props',768),'sanca-dourada':('props',1600),'palmeira-vaso':('props',768),'lareira-marmore':('props',900),'arandela':('props',512)}
for k,(folder,maxsize) in static.items():
 src=SOURCE/'generated'/f'{k}.png';im=Image.open(src).convert('RGBA');box=im.getchannel('A').point(lambda v:255 if v>3 else 0).getbbox()
 if k=='parede-bordo':box=(0,0,1536,488);im=im.crop(box).resize((2600,826),Image.Resampling.LANCZOS)
 elif k=='marmore':box=(0,240,1536,900);im=im.crop(box).resize((2600,610),Image.Resampling.LANCZOS)
 else:im=im.crop(box);im.thumbnail((maxsize,maxsize),Image.Resampling.LANCZOS)
 path=folder+'/'+k+'.webp';im.save(PACK/path,'WEBP',quality=92,method=4,exact=True)
 record(k,path,'layer' if folder=='layers' else 'ground' if folder=='ground' else 'prop',origin='generated',source=str(src.relative_to(PACK)),sourceCrop=box)
for k in ['lustre-balanco','cortinas-vento','fogo-lareira','relogio-pendulo']:
 src=SOURCE/'generated'/('cortinas-vento-v2.png' if k=='cortinas-vento' else k+'.png');im=Image.open(src).convert('RGBA');strip=Image.new('RGBA',(3000,500));sheet=Image.new('RGBA',(1500,1000));bounds=[];hashes=[];registrations=[];hanging=k in ['lustre-balanco','cortinas-vento']
 for n in range(6):
  x=n%3;y=n//3;cell=im.crop((round(x*im.width/3),round(y*im.height/2),round((x+1)*im.width/3),round((y+1)*im.height/2))).resize((480,480),Image.Resampling.LANCZOS)
  padded=Image.new('RGBA',(500,500));padded.paste(cell,(10,10));cell=padded;mask=cell.getchannel('A').point(lambda v:255 if v>128 else 0);b=mask.getbbox()
  if not b:raise ValueError('Empty frame '+k)
  if hanging:
   top=mask.crop((0,b[1],500,min(500,b[1]+40))).getbbox();anchor=(top[0]+top[2])/2;dx=round(250-anchor);dy=20-b[1]
  else:
   dy=480-b[3];dx=0
   if k=='relogio-pendulo':
    base=mask.crop((0,b[3]-40,500,b[3])).getbbox();dx=round(250-(base[0]+base[2])/2)
  registered=Image.new('RGBA',(500,500));registered.paste(cell,(dx,dy));cell=registered
  bb=cell.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox();bounds.append(bb);hashes.append(hashlib.sha256(cell.tobytes()).hexdigest());registrations.append([dx,dy]);strip.paste(cell,(n*500,0));sheet.paste(cell,(x*500,y*500))
 l=min(b[0] for b in bounds);t=min(b[1] for b in bounds);r=max(b[2] for b in bounds);b=max(b[3] for b in bounds);folder='fx' if k=='fogo-lareira' else 'animations';path=folder+'/'+k+'.webp'
 strip.save(PACK/path,'WEBP',quality=92,method=4,exact=True);sheet.save(SOURCE/'pranchas'/f'{k}.png')
 if len(set(hashes))!=6:raise ValueError('Duplicate frames '+k)
 record(k,path,'fx' if folder=='fx' else 'animation',6,cellWidth=500,cellHeight=500,crop=[l,t,r-l,b-t],frameBounds=bounds,frameHashes=hashes,registrations=registrations,pivot=[250,20 if hanging else 480],registration='fixed-upper-mount' if hanging else 'planted-base',fps=4,origin='generated',source=str(src.relative_to(PACK)))
old=json.loads((ROOT/'production/stages/banheiros/manifest.json').read_text())
for k in ['documentos','prancheta']:
 a=old['assets'][k];path=a['path'];shutil.copy2(ROOT/'production/stages/banheiros'/path,PACK/path);record(k,path,a['kind'],a['frames'],origin='reused-banheiros',sourceManifest='../banheiros/manifest.json',sourceAsset=k,sourceSha256=a['sha256'])
fontpath=ROOT/'production/ui/comic-v1/fonts/Bangers-Regular.ttf';shutil.copy2(fontpath,PACK/'ui/Bangers-Regular.ttf');shutil.copy2(ROOT/'production/stages/banheiros/ui/FONTE-OFL.txt',PACK/'ui/FONTE-OFL.txt')
for k,text,size,color,bg in [('legenda-retrato','MEU FILHO',(400,85),'#e6c47c','#19141c'),('titulo','MANSÃO — PRISÃO DOMICILIAR',(1200,150),'#21172b','#f4e9c9')]:
 w,h=size;im=Image.new('RGBA',size,bg);d=ImageDraw.Draw(im);fs=int(h*.72);f=ImageFont.truetype(str(fontpath),fs)
 while d.textbbox((0,0),text,font=f)[2]>w-28:fs-=1;f=ImageFont.truetype(str(fontpath),fs)
 d.text((w/2,h/2),text,font=f,fill=color,anchor='mm');folder='ui' if k=='titulo' else 'graphics';path=folder+'/'+k+'.webp';im.save(PACK/path,'WEBP',lossless=True);record(k,path,'graphic',origin='typeset',text=text,font='ui/Bangers-Regular.ttf')
for p in sorted((PACK/'audio').glob('*.ogg')):record(p.stem,str(p.relative_to(PACK)),'audio',origin='original-synthesis',sourceManifest='audio/manifest.json')
for k in ['miniatura','carregamento']:
 path='ui/'+k+'.webp'
 if (PACK/path).exists():record(k,path,'image',origin='derived-composition')
 else:missing.append(k)
(SOURCE/'exports.json').write_text(json.dumps(dict(assets=assets,missing=missing),ensure_ascii=False,indent=2));print(json.dumps(dict(exported=len(assets),missing=missing),ensure_ascii=False))
if missing and '--partial' not in sys.argv:sys.exit(1)
