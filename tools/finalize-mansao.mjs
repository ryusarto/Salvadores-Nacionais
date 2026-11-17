import{readFileSync,writeFileSync}from'node:fs';
import{PAI}from'../src/data/characters/pai-fujao.js';
const dir='production/stages/mansao',report=JSON.parse(readFileSync(dir+'/source/exports.json')),assets=report.assets,objects=[],foreground=[];
function add(asset,x,y,w,h,opts={}){const a=assets[asset];if(!a)throw Error('Missing '+asset);const o={id:asset+'-'+objects.length,asset,x,y,...(w?{w}:{}),...(h?{h}:{}),factor:1,...opts};objects.push(o);return o;}
function hanging(asset,x,top,h){const a=assets[asset],[l,t,w0,h0]=a.crop,s=h/h0,w=w0*s;const left=x-(a.pivot[0]-l)*s,y0=top-(a.pivot[1]-t)*s;return add(asset,left+w/2,y0+h,w,h,{fps:4,support:{type:'wall-or-ceiling-mount',point:{x,y:top},pivot:a.pivot}});}
add('lambri',650,826,1320,null);add('lambri',1950,826,1320,null);
for(let i=0;i<4;i++)add('sanca-dourada',325+i*650,74,680,74);
add('porta-capangas',250,826,null,620);
// The opaque courtyard view sits only inside the frame. All room attachments share factor1.
add('vista-jardim',900,586,570,330);
add('moldura-janela',900,650,680,null);
hanging('cortinas-vento',900,96,700);
add('lareira-marmore',2240,826,340,null);
add('fogo-lareira',2240,801,124,null,{fps:4});
add('relogio-pendulo',2480,826,null,640,{fps:4});
add('retrato-fujao',1860,512,null,420);
add('legenda-retrato',1860,553,170,36);
for(const x of [510,1410,2150])add('arandela',x,367,null,125);
add('sofa-bordo',1570,826,630,null);
const table=add('mesa-telefone',1980,826,null,190);
// Register tabletop through its source image so telephone/papers rest on its painted surface.
const ta=assets['mesa-telefone'],tc=ta.sourceCrop,ts=190/(tc[3]-tc[1]),tableTop=826-190+(200-tc[1])*ts;
add('telefone-preto',2002,tableTop,100,null);
add('documentos',1925,tableTop,72,null);
add('prancheta',1926,tableTop-3,null,53);
add('palmeira-vaso',-10,826,null,405);add('palmeira-vaso',2670,826,null,430);
const chandelier=hanging('lustre-balanco',1300,35,345);
const anchors={ankleZone:{x:PAI.zoneX,y:940,rx:PAI.zoneR,ry:34},chandelier:{x:1300,y:35},curtainRod:{x:900,y:96},portrait:{x:1860,y:92},telephone:{x:2002,y:tableTop},tabletop:{x:1980,y:tableTop},fireplace:{x:2240,y:801}};
const manifest={id:'mansao',version:1,status:report.missing.length?'in-production':'delivered-v1',groups:Object.keys(assets).length+report.missing.length,world:{width:2600,height:1080,viewWidth:1920,cameraMax:680,feetY:930,groundTopY:826},essential:['parede-bordo','marmore','porta-capangas','sofa-bordo','telefone-preto','retrato-fujao','lustre-balanco'],interactive:[],layers:[{asset:'parede-bordo',factor:1,width:2600,height:826}],objects,ground:{asset:'marmore',projection:'flat'},foreground,anchors,assets,missing:report.missing,notes:['Chapter05 takes place inside the mansion; allies mobilize outside in the existing story.','The ankle zone is never baked into the floor; drawAnkleZone uses the real PAI.zoneX/zoneR after the scene.','All physical room pieces share parallax1, including window/garden, curtain rod and ceiling fixtures.','Each generated PNG master and full prompt is retained. The first curtains output had an opaque matte; selected ImageGen alpha correction is cortinas-vento-v2.png.','Hanging sheets register the fixed upper mounting point, standing clock/fire grate register the base. No per-frame rescaling.','Portrait uses the approved local Fujão character reference; no changes to his fighter art are included.','Telephone and paperwork sit on the painted tabletop source anchor. Gameplay phone/capanga/Foro/fury/shock logic and timings are unchanged.','Decoration has no new collisions. Curtain, fire, clock and chandelier animation freezes with match clock/reduced effects.','Original synthesized audio and measurements: audio/manifest.json.']};
writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));writeFileSync(dir+'/PLANO.json',JSON.stringify({stage:'mansao',chapter:5,boss:'pai-fujao',basis:['docs/MODO-HISTORIA.md','docs/PRODUCAO-ARTE.md','src/data/characters/pai-fujao.js'],groups:Object.entries(assets).map(([slug,a])=>({slug,path:a.path,kind:a.kind,frames:a.frames,origin:a.origin})),pending:report.missing},null,2));console.log(JSON.stringify({assets:Object.keys(assets).length,objects:objects.length,anchors,missing:report.missing}));
