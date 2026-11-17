#!/usr/bin/env python3
"""Export modular Palco artwork without repainting or overwriting generated masters."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, shutil, sys

ROOT=Path(__file__).resolve().parents[1]
PACK=ROOT/'production/stages/palco'
PLAN=PACK/'PLANO.json'
BELEM=ROOT/'production/stages/belem'
M=json.loads((BELEM/'manifest.json').read_text())
ASSETS={}
REUSE={
 'barco-1':'barco-1','barco-2':'barco-2','calcamento':'calcamento',
 'caixa-1':'caixas-1','caixa-2':'caixas-2','cesto-1':'cestos-1','cesto-2':'cestos-2',
 'poste':'poste-1','bandeirolas-1':'bandeirolas-1','bandeirolas-2':'bandeirolas-2',
 'folhagem-1':'folhagem-1','folhagem-2':'folhagem-2','parapeito':'parapeito',
 'npc-torcedor-1':'npc-torcedor','npc-fila-1':'npc-cliente',
 'agua-ondulacao':'agua-ondulacao','barco-balanco':'barco-balanco',
 'bandeirolas-vento':'bandeirolas-vento','poeira':'poeira-ambiente',
 'reflexos-agua':'reflexos-agua','halo-poste':'luz-poste',
}
def record(key,path,kind,frames=1,**extra):
 p=PACK/path
 a={'path':path,'kind':kind,'frames':frames,'bytes':p.stat().st_size,
    'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),**extra}
 if kind!='audio':
  im=Image.open(p)
  a.update(width=im.width,height=im.height,alpha='A' in im.getbands())
 ASSETS[key]=a
def static(key,folder,src):
 im=Image.open(src).convert('RGBA')
 if key not in ['ceu-noite','agua']:
  box=im.getchannel('A').point(lambda a:255 if a>3 else 0).getbbox()
  if not box: raise ValueError('Empty alpha: '+key)
  im=im.crop(box)
 maxside=1600 if key in ['tablado','trelica-horizontal','cobertura-palco','mercado-ferro','horizonte','faixa-base'] else (768 if key=='agua' else 512)
 if key=='ceu-noite': im=im.resize((1920,1080),Image.Resampling.LANCZOS)
 elif max(im.size)>maxside: im.thumbnail((maxside,maxside),Image.Resampling.LANCZOS)
 path=folder+'/'+key+'.webp';im.save(PACK/path,'WEBP',quality=92,method=0,exact=True)
 record(key,path,'layer' if folder=='layers' else 'prop',origin='generated',source=str(src.relative_to(PACK)))
def animation(key,folder,src):
 im=Image.open(src).convert('RGBA');strip=Image.new('RGBA',(3000,500));sheet=Image.new('RGBA',(1500,1000))
 union=None;hashes=[]
 for n in range(6):
  x=n%3;y=n//3
  cell=im.crop((round(x*im.width/3),round(y*im.height/2),round((x+1)*im.width/3),round((y+1)*im.height/2))).resize((500,500),Image.Resampling.LANCZOS)
  box=cell.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox()
  if not box:raise ValueError('Empty frame '+key+' '+str(n))
  union=box if union is None else (min(union[0],box[0]),min(union[1],box[1]),max(union[2],box[2]),max(union[3],box[3]))
  hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
  strip.paste(cell,(n*500,0));sheet.paste(cell,(x*500,y*500))
 if len(set(hashes))!=6:raise ValueError('Duplicate animation frame '+key)
 (PACK/'source/pranchas').mkdir(exist_ok=True)
 sheet.save(PACK/'source/pranchas'/f'{key}.png')
 path=folder+'/'+key+'.webp';strip.save(PACK/path,'WEBP',quality=92,method=0,exact=True)
 l,t,r,b=union
 record(key,path,'fx' if folder=='fx' else 'animation',6,cellWidth=500,cellHeight=500,crop=[l,t,r-l,b-t],origin='generated',frameHashes=hashes,source=str(src.relative_to(PACK)))
def main():
 plan=json.loads(PLAN.read_text());missing=[]
 for g in plan['groups']:
  if g['folder'] in ['audio','ui','graphics']:continue
  for n in range(1,g['variants']+1):
   key=g['slug']+(f'-{n}' if g['variants']>1 else '')
   if key in REUSE:
    srcid=REUSE[key];a=M['assets'].get(srcid,{'path':'props/parapeito.webp','kind':'prop','frames':1});src=BELEM/a['path']
    path=g['folder']+'/'+key+'.webp';shutil.copy2(src,PACK/path)
    extra={k:v for k,v in a.items() if k in ['crop','cellWidth','cellHeight']}
    if a['frames']==6:extra.update(cellWidth=500,cellHeight=500)
    record(key,path,a['kind'],a['frames'],origin='reused-belem',sourceAsset=srcid,**extra)
   else:
    selected='agua-v2' if key=='agua' and (PACK/'source/generated/agua-v2.png').exists() else key
    src=PACK/'source/generated'/f'{selected}.png'
    if not src.exists():missing.append(key);continue
    if g['framesPerVariant']==6:animation(key,g['folder'],src)
    else:static(key,g['folder'],src)
 # SVG title has explicit dimensions; avoid raster decoder.
 fontpath=ROOT/'production/ui/comic-v1/fonts/Bangers-Regular.ttf'
 font=ImageFont.truetype(str(fontpath),112)
 im=Image.new('RGBA',(1400,170));d=ImageDraw.Draw(im);label='TURNÊ CONTRA A FOME'
 box=d.textbbox((0,0),label,font=font);d.text(((1400-box[2]+box[0])/2,10),label,font=font,fill='#21172b')
 (PACK/'graphics').mkdir(exist_ok=True);im.save(PACK/'graphics/faixa-texto.webp','WEBP',lossless=True)
 record('faixa-texto','graphics/faixa-texto.webp','graphic',origin='typeset')
 svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="150"><rect width="1200" height="150" rx="12" fill="#f5e4bb"/><text x="600" y="98" text-anchor="middle" font-family="Bangers, sans-serif" font-size="65" fill="#21172b">BELÉM — FRENTE DO PALCO</text></svg>'
 (PACK/'ui/titulo.svg').write_text(svg)
 ASSETS['titulo']={'path':'ui/titulo.svg','kind':'graphic','frames':1,'width':1200,'height':150,'origin':'typeset','bytes':len(svg.encode()),'sha256':hashlib.sha256(svg.encode()).hexdigest()}
 (PACK/'source/exports.json').write_text(json.dumps({'assets':ASSETS,'missing':missing},ensure_ascii=False,indent=2))
 print(json.dumps({'exported':len(ASSETS),'missing':missing},ensure_ascii=False))
 if missing and '--partial' not in sys.argv:sys.exit(1)
if __name__=='__main__':main()
