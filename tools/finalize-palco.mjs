import{makeMast,tie,hang,MAST_TIES}from'./stage-hangings.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const dir='production/stages/palco';
const report=JSON.parse(readFileSync(dir+'/source/exports.json','utf8'));
const assets=report.assets, objects=[], foreground=[];
const add=(asset,x,y,size,opts={})=>{
  if(!assets[asset]) return;
  const name=asset+'-'+objects.length;
  objects.push({id:name,asset,x,y,factor:.65,...size,...opts});
};
const wide=(asset,x,y,w,opts={})=>add(asset,x,y,{w},opts);
const tall=(asset,x,y,h,opts={})=>add(asset,x,y,{h},opts);
wide('nuvem-1',340,330,700,{factor:.08,opacity:.35});
wide('nuvem-2',1240,260,630,{factor:.08,opacity:.30});
wide('nuvem-3',2150,370,700,{factor:.08,opacity:.30});
add('horizonte',1021.5,650,{w:2043,h:145},{factor:.18,opacity:.8});
add('agua',1021.5,826,{w:2043,h:210},{factor:.18});
tall('catedral',115,754,430,{factor:.42,opacity:.75});
wide('mercado-ferro',430,767,900,{factor:.42,opacity:.75});
for(const [n,x] of [[1,1980],[2,2290],[3,2530]]) tall('casario-'+n,x,780,350,{factor:.42,opacity:.75});
wide('barco-1',250,796,220,{factor:.30,opacity:.8});
wide('barco-2',2250,798,240,{factor:.30,opacity:.8});
wide('barco-balanco',1950,787,210,{factor:.30,fps:4,opacity:.8});
add('agua-ondulacao',390,804,{w:420,h:48},{factor:.18,fps:5,opacity:.25});
add('reflexos-agua',2020,810,{w:400,h:90},{factor:.18,fps:5,opacity:.15});
const supportHeight=(826-260)/(1-MAST_TIES.right[1]);
const mastLeft=makeMast(assets,objects,{id:'mastro-palco-esquerdo',x:300,h:supportHeight,factor:.65});
const mastRight=makeMast(assets,objects,{id:'mastro-palco-direito',x:2300,h:supportHeight,factor:.65});
add('tablado',1280,822,{w:1370,h:180});
add('saia-palco',1280,822,{w:1320,h:100});
tall('trelica-vertical-1',625,732,505);
tall('trelica-vertical-2',1935,732,505);
add('trelica-horizontal',1280,268,{w:1400,h:62});
add('cobertura-palco',1280,255,{w:1490,h:155});
tall('cortina-1',770,723,405,{hidden:!!assets['cortina-vento']});
tall('cortina-2',1795,723,405);
tall('cortina-vento',775,723,405,{fps:4,opacity:1});
add('faixa-base',1280,405,{w:1050,h:125});
add('faixa-texto',1280,383,{w:900,h:109});
tall('torre-som-1',590,820,340);
tall('torre-som-2',1985,820,340);
wide('subwoofer-1',730,818,165);
wide('subwoofer-2',1820,818,165);
wide('retorno-1',1020,715,115);
wide('retorno-2',1560,715,115);
wide('escada-palco',2070,825,185);
tall('pedestal-1',1190,714,210);
tall('pedestal-2',1450,713,205);
tall('microfone-palco',1220,535,33);
wide('bancada-tecnica',1685,713,230);
wide('mesa-mixagem',1685,612,205);
tall('npc-tecnico',1700,710,230,{fps:4,phase:2});
wide('cabos-1',1630,727,82);
add('cabos-2',1310,727,{w:270,h:25});
wide('cabos-3',2040,826,170);
for(const [n,x] of [[1,820],[2,1740],[3,1280]]) tall('refletor-'+n,x,300,75);
add('feixe-palco-1',1000,730,{w:470,h:440},{fps:4,opacity:.12});
add('feixe-palco-2',1570,730,{w:470,h:440},{fps:4,opacity:.12});
wide('gradil-1',740,824,220,{factor:.78});
wide('gradil-2',1790,824,220,{factor:.78});
const trussLeft=objects.find(o=>o.asset==='trelica-vertical-1'),trussRight=objects.find(o=>o.asset==='trelica-vertical-2');
hang(assets,objects,'bandeirolas-1',tie(mastLeft,MAST_TIES.right),tie(trussLeft,[.5,33/505]));
hang(assets,objects,'bandeirolas-vento',tie(trussRight,[.5,33/505]),tie(mastRight,MAST_TIES.left),{fps:4});
hang(assets,objects,'bandeirolas-2',tie(trussRight,[.5,173/505]),tie(mastRight,[.5,(400-(826-supportHeight))/supportHeight]));
tall('poste',2430,827,470,{factor:.78});
tall('halo-poste',2430,490,150,{factor:.78,fps:4,opacity:.2});
for(const [asset,x,h,phase] of [
 ['npc-danca-1',920,210,0],['npc-danca-2',1510,215,2],
 ['npc-torcedor-1',730,215,1],['npc-torcedor-2',1825,215,4],
 ['npc-fila-1',700,213,0],['npc-fila-2',2260,210,3],
 ['npc-voluntario',430,232,2]
])tall(asset,x,823,h,{factor:.78,fps:4,phase});
wide('mesa-comida-1',500,824,320,{factor:.78});
wide('mesa-comida-2',2140,824,350,{factor:.78});
tall('panela-1',420,701,85,{factor:.78});
tall('panela-2',2200,713,80,{factor:.78});
wide('marmitas-1',560,708,115,{factor:.78});
wide('marmitas-2',2340,711,120,{factor:.78});
tall('vapor-panelas',420,635,100,{factor:.78,fps:5,opacity:.4});
for(const [asset,x,y,w] of [['caixa-1',52,826,100],['caixa-2',2540,826,105],['cesto-1',430,826,80],['cesto-2',2430,827,80]])wide(asset,x,y,w,{factor:.78});
add('poeira',1320,827,{w:390,h:55},{factor:.78,fps:4,opacity:.12});
for(const [asset,x,y,w] of [['folhagem-1',-90,1090,300],['folhagem-2',2720,1090,300],['parapeito',-90,890,360]]){
 if(assets[asset])foreground.push({id:asset,asset,x,y,w,factor:1.05,opacity:.65});
}
const audioNames=['trilha-intro','trilha-loop','ambiente-publico','ambiente-cozinha','ambiente-agua','vento-tecido'];
for(const key of audioNames){
 const path='audio/'+key+'.ogg';
 if(existsSync(dir+'/'+path)){
  const buf=readFileSync(dir+'/'+path);
  assets[key]={path,kind:'audio',frames:1,bytes:buf.length,sha256:createHash('sha256').update(buf).digest('hex')};
 }
}
for(const key of ['miniatura','carregamento']){
 const path='ui/'+key+'.webp';
 if(existsSync(dir+'/'+path)){
  const b=readFileSync(dir+'/'+path);
  assets[key]={path,kind:'image',frames:1,width:key==='miniatura'?960:1920,height:key==='miniatura'?540:1080,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),origin:'derived-composition'};
 }
}
const manifest={
 id:'palco',version:2,status:report.missing.length?'in-production':'delivered-v2',
 groups:JSON.parse(readFileSync(dir+'/PLANO.json')).groups.length,world:{width:2600,height:1080,viewWidth:1920,cameraMax:680,feetY:930,groundTopY:826},
 essential:['ceu-noite','agua','tablado','trelica-horizontal','trelica-vertical-1','trelica-vertical-2','torre-som-1','torre-som-2','calcamento'],
 layers:[{asset:'ceu-noite',factor:0,width:1920,height:1080}],
 objects:objects.filter(o=>!o.hidden),alternatives:objects.filter(o=>o.hidden),
 ground:{asset:'calcamento',shade:'rgba(19,16,46,.20)'},foreground,
 assets,missing:report.missing,
 notes:['Separate generated masters and individual runtime assets.','Animated alternatives replace their static instance; never stack both.','Combat phone/weapon remains in boss renderer.','Audio origin and loop data in audio/manifest.json.']
};
writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({assets:Object.keys(assets).length,objects:manifest.objects.length,missing:report.missing}));
