import {readFileSync,writeFileSync} from 'node:fs';
import {FUGA} from '../src/data/characters/fujao.js';
const dir='production/stages/aeroporto',report=JSON.parse(readFileSync(dir+'/source/exports.json')),assets=report.assets,objects=[],foreground=[];
function add(list,asset,x,y,w,h,opts={}) {if(!assets[asset])throw Error('Missing '+asset);list.push({id:asset+'-'+list.length,asset,x,y,...(w?{w}:{}),...(h?{h}:{}),factor:1,...opts});return list.at(-1);}
const obj=(...args)=>add(objects,...args),front=(...args)=>add(foreground,...args);
obj('nuvem-1',350,325,580,null,{factor:.06,opacity:.24});obj('nuvem-2',1550,370,700,null,{factor:.08,opacity:.20});
obj('torre-controle',230,720,null,540,{factor:.24});
obj('hangar',2090,805,1100,null,{factor:.24});
obj('terminal',900,818,1800,null,{factor:.30});
// The sign lettering follows the same building plane; no lettering is painted into architecture.
obj('nome-terminal',690,525,230,45,{factor:.30});
obj('portao-04',706,762,35,40,{factor:.30});
for(const x of [250,800,1350,1900,2450])obj('cerca-aeroporto',x,826,570,null,{factor:.48,opacity:.68});
obj('poste-refletores',45,826,null,560,{factor:.78});obj('poste-refletores',2580,826,null,560,{factor:.78});
obj('biruta-vento',740,826,null,370,{factor:.78,fps:4});
// Ground-service equipment sits behind the fight. The hitch points meet at x335.
obj('carreta-bagagem',170,825,330,null,{factor:.78});obj('trator-bagagem',505,825,340,null,{factor:.78});obj('pilha-malas',155,752,230,null,{factor:.78});
for(const [key,x,h,phase] of [['npc-fila-1',700,218,0],['npc-fila-2',875,220,1],['npc-torcedor-2',1060,215,3]])obj(key,x,825,null,h,{factor:.78,fps:4,phase});
obj('npc-seguranca',580,825,null,245,{factor:.78,fps:4});
obj('placa-embarque',1600,825,null,190,{factor:1});obj('texto-embarque',1600,705,220,54,{factor:1});
obj('placa-embarque',300,825,null,150,{factor:.78});obj('texto-restrito',300,730,178,44,{factor:.78});
for(const x of [80,550,1040,1580,2090,2520])obj('baliza-pista',x,826,null,32,{factor:.78,fps:4,phase:Math.floor(x/500)});
for(const x of [50,650,1880,2550])obj('cone-servico',x,826,null,67,{factor:.78});
obj('lixeira',-10,826,null,104,{factor:.78});
// Markings are independent graphics and remain in world coordinates.
for(const x of [100,480,860,1240,1620,2000,2380])front('faixa-pista',x,1018,230,11,{opacity:.6});
front('seta-pista',1750,1055,250,40,{opacity:.45});
const planeWidth=1700;
const plane=assets['aviao-executivo'],pc=plane.sourceCrop,ps=planeWidth/(pc[2]-pc[0]),ph=(pc[3]-pc[1])*ps;
const doorSource=[1492,582],planeLeft=2420-(doorSource[0]-pc[0])*ps,planeTop=885-ph;
const door={x:2420,y:planeTop+(doorSource[1]-pc[1])*ps};
front('aviao-executivo',planeLeft+planeWidth/2,885,planeWidth,ph,{factor:1});
const stair=assets['escada-embarque'],sc=stair.sourceCrop,topSource=[1390,310],ss=(930-door.y)/(sc[3]-topSource[1]);
const sw=(sc[2]-sc[0])*ss,sh=(sc[3]-sc[1])*ss,sl=door.x-(topSource[0]-sc[0])*ss;
for(const key of ['placa-embarque','texto-embarque']) {const i=objects.findIndex(o=>o.asset===key && o.factor===1);foreground.push(objects.splice(i,1)[0]);}
// People wait in front of the wing, not hidden by it.
for(const key of ['npc-fila-1','npc-fila-2','npc-torcedor-2']) {const i=objects.findIndex(o=>o.asset===key);foreground.push(objects.splice(i,1)[0]);}
front('escada-embarque',sl+sw/2,930,sw,sh,{factor:1});
front('npc-equipe-pista',1910,884,null,245,{factor:1,fps:4});
front('papel-vento',890,860,75,70,{factor:1,fps:4,opacity:.55});front('poeira',1400,881,420,36,{factor:1,fps:4,opacity:.1});
const anchors={boarding:{x:FUGA.stairsX,y:930,range:FUGA.stairsRange},door,stairsTop:{...door},stairsBase:{x:sl+(430-sc[0])*ss,y:930},planeWheels:{y:885},attachments:[{asset:'biruta-vento',support:'integral-mast',frames:6},{asset:'poste-refletores',support:'integral-pole'},{asset:'placa-embarque',support:'integral-two-post-base'}]};
const manifest={id:'aeroporto',version:1,status:report.missing.length?'in-production':'delivered-v1',groups:Object.keys(assets).length+report.missing.length,world:{width:2600,height:1080,viewWidth:1920,cameraMax:680,feetY:930,groundTopY:826},essential:['ceu-entardecer','asfalto','aviao-executivo','escada-embarque','terminal','torre-controle'],interactive:[],layers:[{asset:'ceu-entardecer',factor:0,width:1920,height:1080},{asset:'asfalto',x:-100,y:760,width:2900,height:66,factor:.20,opacity:.9}],objects,ground:{asset:'asfalto',projection:'flat'},foreground,anchors,assets,missing:report.missing,notes:['Cenário do capítulo 04: luta na pista ao entardecer, avião atrás e escada no embarque.','PNG masters and prompts retained, with one ImageGen call per distinct asset/six-frame sheet.','Ground marks and lettering are editable code-native graphics, distinct from painted masters.','FUGA rules, damage, stairsX and stairsRange are unchanged. Decorative props have no new collisions.','Plane and stairs share factor1; source anchor registration is explicit in this exporter. Nose intentionally extends beyond right world boundary as in the existing airport staging.','Staff, windsock and beacon use six independently drawn poses; reusable community NPCs follow the tour.','No automatic airplane takeoff or arrest animation is claimed; victory narration remains in story.','Original audio synthesis and measurements: audio/manifest.json.']};
writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
writeFileSync(dir+'/PLANO.json',JSON.stringify({stage:'aeroporto',chapter:4,boss:'fujao',basis:'docs/MODO-HISTORIA.md and src/data/characters/fujao.js',groups:Object.entries(assets).map(([slug,a])=>({slug,path:a.path,kind:a.kind,frames:a.frames,origin:a.origin})),pending:report.missing},null,2));
console.log(JSON.stringify({assets:Object.keys(assets).length,objects:objects.length,foreground:foreground.length,door,missing:report.missing}));
