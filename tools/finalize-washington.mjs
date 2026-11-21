import{readFileSync,writeFileSync}from'node:fs';
const dir='production/stages/washington',report=JSON.parse(readFileSync(dir+'/source/exports.json')),assets=report.assets,objects=[],foreground=[];
function add(asset,x,y,w,h,opts={}){if(!assets[asset])return;const o={id:asset+'-'+objects.length,asset,x,y,...(w?{w}:{}),...(h?{h}:{}),factor:.78,...opts};objects.push(o);return o;}
add('obelisco',1510,735,null,590,{factor:.15});add('palacio-branco',1300,799,1500,null,{factor:.45});
for(const x of [80,570,1060,1550,2040,2530])add('sebe',x,826,510,74,{factor:.65});
for(const x of [300,880,1460,2040,2620])add('cerca-baixa',x,826,590,105,{factor:.72});
const fa=assets['bandeira-mastro-vento'];if(fa)for(const x of [260,1180,2150]){const s=460/fa.crop[3],w=fa.crop[2]*s;add('bandeira-mastro-vento',x-(fa.pivot[0]-fa.crop[0])*s+w/2,826,w,460,{factor:.9,fps:4,support:{type:'integral-mast-base',base:{x,y:826},pivot:fa.pivot}});}
// Community support stays behind the fight and predominantly at the sides.
add('tenda-apoio',400,826,600,null);add('aviso-mesas',295,505,190,45);add('aviso-rap',515,505,220,45);
add('npc-voluntario',380,826,null,235,{fps:4});add('mesa-comunitaria',400,826,330,null);add('panela',320,688,76,null);add('marmitas',455,688,105,null);
add('caixa-som',535,826,null,195);add('microfone',475,688,65,null);add('npc-publico-1',720,826,null,230,{fps:4,phase:1});add('npc-publico-2',905,826,null,225,{fps:4,phase:3});
add('banco',2300,826,285,null);add('poste-jardim',45,826,null,490);add('poste-jardim',2530,826,null,490);
// Fountain origin anchors both effect layers to the physical top bowl.
const fountain=add('chafariz-base',1900,826,290,null);let nozzle={x:1900,y:690};if(fountain){const a=assets['chafariz-base'],h=290*a.height/a.width;nozzle={x:1900,y:826-h+8};}
add('jatos-chafariz',nozzle.x,nozzle.y,140,null,{fps:4});add('gotas-agua',1900,796,215,30,{fps:4,opacity:.45});
const anchors={fountainNozzle:nozzle,fountainBase:{x:1900,y:826},communityTable:{x:400,y:688},fightFeet:{x:1300,y:930}};
const manifest={id:'washington',version:1,status:report.missing.length?'in-production':'delivered-v1',groups:33,world:{width:2600,height:1080,viewWidth:1920,cameraMax:680,feetY:930,groundTopY:826},essential:['ceu-washington','palacio-branco','gramado','bandeira-mastro-vento'],interactive:['muralha-interativa'].filter(k=>assets[k]),layers:[{asset:'ceu-washington',factor:0,width:1920,height:1080},{asset:'gramado',x:-100,y:730,width:2900,height:96,factor:.2}],objects,ground:{asset:'gramado',projection:'flat'},foreground,anchors,assets,missing:report.missing,notes:['Arena do capítulo06 em Washington. Cenário separado das entidades de gameplay.','O gramado não contém sombras pintadas de pessoas; o verdadeiro Laranjão mantém sua sombra dinâmica e os clones continuam sem sombra.','A muralha interativa não aparece no fundo: drawGoldWall usa o asset somente na entidade, preservando HP/rachaduras/dimensões e fallback.','Bandeiras incluem mastros, base e amarrações em todos os seis quadros.','Apoio comunitário mantém público, comida e som atrás da luta, sem novas colisões.','Mestres PNG e prompts preservados em source/. Reusos têm origem e hash por asset.','Áudio original e medições em audio/manifest.json.']};
writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
writeFileSync(dir+'/PLANO.json',JSON.stringify({chapter:6,boss:'laranjao',stage:'washington',status:manifest.status,groups:Object.entries(assets).map(([slug,a])=>({slug,path:a.path,kind:a.kind,frames:a.frames,origin:a.origin,status:'exportado'})),pending:report.missing},null,2));console.log(JSON.stringify({assets:Object.keys(assets).length,objects:objects.length,missing:report.missing}));
