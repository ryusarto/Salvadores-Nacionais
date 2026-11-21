#!/usr/bin/env python3
"""Cenário07: exportação técnica, preservando PNGs e prompts originais."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,sys,os
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'production/stages/inferno';S=P/'source'
DEFAULT=Path('/Users/henriqueryusartorelliuchiyama/Library/CloudStorage/Dropbox/T&H/Salvadores-Nacionais/arte-revisao/cenario-07-inferno-v2')
external=Path(os.environ.get('INFERNO_SOURCE',str(DEFAULT)));assets={};missing=[]
for d in ['source/generated','source/pranchas','layers','ground','props','animations','fx','graphics','ui']:(P/d).mkdir(parents=True,exist_ok=True)
source_folder=external/'source/generated' if (external/'source/generated').exists() else S/'generated'
for f in source_folder.glob('*.png'):
 out=S/'generated'/f.name
 if out.exists() and f.read_bytes()!=out.read_bytes():raise ValueError('Different original '+f.name)
 if not out.exists():shutil.copy2(f,out)
if (external/'source/prompts-completos.json').exists():shutil.copy2(external/'source/prompts-completos.json',S/'prompts-completos.json')
def record(k,path,kind,frames=1,**more):
 p=P/path;b=p.read_bytes();a=dict(path=path,kind=kind,frames=frames,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),**more)
 if a.get('source'):a['sourceSha256']=hashlib.sha256((P/a['source']).read_bytes()).hexdigest()
 if kind!='audio':
  im=Image.open(p);a.update(width=im.width,height=im.height,alpha='A' in im.getbands())
 assets[k]=a
static={'ceu-infernal':('layers',1920),'rochedos':('props',1600),'basalto':('ground',2600),'trono':('props',1024),'escadaria':('props',1100),'portal':('props',1024),'coluna-braseiro':('props',900),'teto-rochoso':('props',1600),'grilhao-rompido':('props',600)}
for k,(folder,limit) in static.items():
 src=S/'generated'/f'{k}.png'
 if not src.exists():missing.append(k);continue
 im=Image.open(src).convert('RGBA');original=im.size;box=im.getchannel('A').point(lambda v:255 if v>3 else 0).getbbox()
 if not box:raise ValueError('Empty '+k)
 if k=='ceu-infernal':im=im.resize((1920,1080),Image.Resampling.LANCZOS)
 elif k=='basalto':im=im.resize((2600,610),Image.Resampling.LANCZOS)
 else:im=im.crop(box);im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
 path=folder+'/'+k+'.webp';im.save(P/path,'WEBP',quality=92,method=4,exact=True);record(k,path,'layer' if folder=='layers' else 'ground' if folder=='ground' else 'prop',origin='generated',source='source/generated/'+src.name,sourceCrop=list(box),sourceWidth=original[0],sourceHeight=original[1])
for k in ['corrente-balanco','fogo-braseiro','lava-distante','almas-coro']:
 name='esqueletos-coro.png' if k=='almas-coro' else k+'.png'
 src=S/'generated'/name
 if not src.exists():missing.append(k);continue
 im=Image.open(src).convert('RGBA');strip=Image.new('RGBA',(3000,500));sheet=Image.new('RGBA',(1500,1000));boxes=[];offsets=[];hashes=[];pivots=[];thresholds=[];hanging=k=='corrente-balanco'
 for n in range(6):
  x=n%3;y=n//3;cell=im.crop((round(x*im.width/3),round(y*im.height/2),round((x+1)*im.width/3),round((y+1)*im.height/2))).resize((480,480),Image.Resampling.LANCZOS)
  padded=Image.new('RGBA',(500,500));padded.paste(cell,(10,10));cell=padded;alpha=cell.getchannel('A');threshold=min(128,max(12,alpha.getextrema()[1]//2));mask=alpha.point(lambda v:255 if v>threshold else 0);box=mask.getbbox()
  if not box:raise ValueError('Empty frame '+k+str(n))
  if hanging:
   band=mask.crop((0,box[1],500,box[1]+40)).getbbox();dx=round(250-(band[0]+band[2])/2);dy=20-box[1]
  else:
   band=mask.crop((0,box[3]-30,500,box[3])).getbbox();dx=round(250-(band[0]+band[2])/2);dy=480-box[3]
  out=Image.new('RGBA',(500,500));out.paste(cell,(dx,dy));cell=out;bb=cell.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox();boxes.append(bb);offsets.append([dx,dy]);thresholds.append(threshold);hashes.append(hashlib.sha256(cell.tobytes()).hexdigest());strip.paste(cell,(n*500,0));sheet.paste(cell,(x*500,y*500))
 l=min(b[0] for b in boxes);t=min(b[1] for b in boxes);r=max(b[2] for b in boxes);b=max(b[3] for b in boxes)
 if len(set(hashes))!=6:raise ValueError('Duplicate poses '+k)
 folder='animations' if k in ['corrente-balanco','almas-coro'] else 'fx';path=folder+'/'+k+'.webp';strip.save(P/path,'WEBP',quality=92,method=4,exact=True);sheet.save(S/'pranchas'/f'{k}.png')
 record(k,path,'animation' if folder=='animations' else 'fx',6,origin='generated',source='source/generated/'+src.name,cellWidth=500,cellHeight=500,crop=[l,t,r-l,b-t],frameBounds=boxes,registrations=offsets,frameHashes=hashes,registrationThresholds=thresholds,pivot=[250,20 if hanging else 480],registration='fixed-ceiling-mount' if hanging else 'fixed-base',fps=4)
font=ROOT/'production/ui/comic-v1/fonts/Bangers-Regular.ttf';shutil.copy2(font,P/'ui/Bangers-Regular.ttf');shutil.copy2(ROOT/'production/stages/banheiros/ui/FONTE-OFL.txt',P/'ui/FONTE-OFL.txt')
size=(1400,150);im=Image.new('RGBA',size,'#f4e9c9');d=ImageDraw.Draw(im);text='INFERNO — O ÚLTIMO REFRÃO';fs=110;f=ImageFont.truetype(str(font),fs)
while d.textbbox((0,0),text,font=f)[2]>size[0]-40:fs-=1;f=ImageFont.truetype(str(font),fs)
d.text((700,75),text,font=f,fill='#29121f',anchor='mm');im.save(P/'ui/titulo.webp','WEBP',lossless=True);record('titulo','ui/titulo.webp','graphic',origin='typeset',text=text,font='ui/Bangers-Regular.ttf')
for k in ['trilha-intro','trilha-loop','ambiente-caverna','vento-profundo','lava-distante','correntes']:
 path='audio/'+k+'.ogg';key='audio-'+k if k=='lava-distante' else k
 if (P/path).exists():record(key,path,'audio',origin='original-synthesis',sourceManifest='audio/manifest.json')
 else:missing.append(key)
for k in ['miniatura','carregamento']:
 path='ui/'+k+'.webp'
 if (P/path).exists():record(k,path,'image',origin='derived-composition')
 else:missing.append(k)
(S/'exports.json').write_text(json.dumps(dict(assets=assets,missing=missing),ensure_ascii=False,indent=2));print(json.dumps(dict(assets=len(assets),missing=missing),ensure_ascii=False))
if missing and '--partial' not in sys.argv:raise SystemExit(1)
