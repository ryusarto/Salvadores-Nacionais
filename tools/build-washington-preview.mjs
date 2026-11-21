import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('production/stages/washington/manifest.json','utf8'));
const offline=process.argv.includes('--offline');
const data=(path,mime)=>'data:'+mime+';base64,'+readFileSync(path).toString('base64');
if(offline)for(const a of Object.values(manifest.assets))a.url=data('production/stages/washington/'+a.path,a.kind==='audio'?'audio/ogg':a.path.endsWith('.svg')?'image/svg+xml':'image/webp');
const heroUrls=['belga','ryuchi'].map(id=>{const path='production/sprites/final/'+id+'/parado.webp';return existsSync(path)?offline?data(path,'image/webp'):'../sprites/final/'+id+'/parado.webp':null;});
const code=`
import {loadStageArt,drawStageArt,stageArtStatus,stageAnimationFrame} from './src/render/stage-packs.js';
import laranjao,{LAR} from './src/data/characters/laranjao.js';
import belga from './src/data/characters/belga.js';
import {createMatch} from './src/core/match.js';
import {drawFighter} from './src/render/mannequin.js';
import {drawGoldWall,drawGoldArmor,drawHeadline} from './src/render/boss-art.js';
(async()=>{
const pack=${JSON.stringify(manifest)};
for(const a of Object.values(pack.assets))a.url??='../stages/washington/'+a.path;
const original=[...pack.objects],front=[...pack.foreground];
const cv=document.querySelector('#stage'),ctx=cv.getContext('2d'),images=new Map(),cards=[],errors=[];
let frame=0,paused=false,cam=340,last=performance.now(),solo=null;
const hero=new Image();const heroURL=${JSON.stringify(heroUrls[0])};
const hero2=new Image();const hero2URL=${JSON.stringify(heroUrls[1])};
if(heroURL)hero.src=heroURL;if(hero2URL)hero2.src=hero2URL;
const controls={camera:document.querySelector('#camera'),pause:document.querySelector('#pause'),feet:document.querySelector('#feet'),heroes:document.querySelector('#heroes'),reduce:document.querySelector('#reduce'),objects:document.querySelector('#objects'),fx:document.querySelector('#effects'),ground:document.querySelector('#ground'),clones:document.querySelector('#clones'),wall:document.querySelector('#wall'),wallHP:document.querySelector('#wall-hp'),armor:document.querySelector('#armor'),anchors:document.querySelector('#anchors')};
const demoMatch=createMatch({chars:[belga,laranjao],seed:20261118,training:true}),demoBoss=demoMatch.f[1];
demoBoss.x=1680;demoBoss.face=-1;demoBoss.state='idle';
laranjao.moves['5S'].spawn[0].make(demoMatch,demoBoss);
function picture(c,a,img,x,y,w,h,at=controls.reduce.checked?0:frame){
 const n=a.frames||1,cw=a.cellWidth||img.width/n;
 const [sx,sy,sw,sh]=a.crop||[0,0,cw,img.height];
 const scale=Math.min(w/sw,h/sh),f=n>1?stageAnimationFrame(at,4,n):0;
 c.drawImage(img,sx+f*cw,sy,sw,sh,x+(w-sw*scale)/2,y+(h-sh*scale)/2,sw*scale,sh*scale);
}
function fighter(img,x,flip=false){
 if(!img.complete||!img.width)return;
 ctx.save();ctx.translate(x-cam,930);if(flip)ctx.scale(-1,1);
 ctx.fillStyle='rgba(10,5,15,.30)';ctx.beginPath();ctx.ellipse(0,4,86,16,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(img,0,0,500,500,-250,-456,500,500);ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,1920,1080);
 if(solo){
  ctx.fillStyle='#28313b';ctx.fillRect(0,0,1920,1080);
  const a=pack.assets[solo],im=images.get(solo);if(im)picture(ctx,a,im,150,80,1620,900);
 }else{
  pack.objects=original.filter(o=>controls.objects.checked||pack.assets[o.asset].kind==='layer').filter(o=>controls.fx.checked||!(pack.assets[o.asset].path?.startsWith('fx/')||['fx','environment-fx'].includes(pack.assets[o.asset].kind)));
  pack.foreground=controls.objects.checked?front.filter(o=>controls.fx.checked||!(pack.assets[o.asset].path?.startsWith('fx/')||['fx','environment-fx'].includes(pack.assets[o.asset].kind))):[];
  const savedGround=pack.ground;if(!controls.ground.checked)pack.ground=null;
  drawStageArt(ctx,'washington',cam,Math.floor(frame),{reducedEffects:controls.reduce.checked});
  pack.ground=savedGround;
  const demoActive=controls.clones.checked||controls.armor.checked,at=Math.floor(controls.reduce.checked?0:frame);
  if(controls.heroes.checked){fighter(hero2,demoActive?720:950);if(!demoActive)fighter(hero,1650,true);}
  ctx.save();ctx.translate(-cam,0);
  if(demoActive){
   if(controls.clones.checked)for(const e of demoMatch.ents.filter(e=>e.kind==='clone')){
    drawFighter(ctx,{...demoBoss,x:e.x,ghost:true},at+7);
    drawHeadline(ctx,e.x,370,e.headline);
   }
   demoBoss.res.armor=controls.armor.checked?LAR.armorMax:0;
   drawGoldArmor(ctx,demoBoss,at);drawFighter(ctx,demoBoss,at+17);
   if(controls.clones.checked)drawHeadline(ctx,demoBoss.x,370,demoBoss.res.headline);
  }
  if(controls.wall.checked)drawGoldWall(ctx,{x:1300,w:120,h:640,age:20,hp:+controls.wallHP.value},930);
  ctx.restore();
  if(controls.anchors.checked){
   ctx.save();ctx.translate(-cam,0);ctx.strokeStyle='#ffd76e';ctx.fillStyle='#ffd76e';ctx.lineWidth=3;ctx.font='20px sans-serif';
   for(const[label,a]of Object.entries(pack.anchors||{})){
    const p=Array.isArray(a)?{x:a[0],y:a[1]}:a;
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
    ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.stroke();ctx.fillText(label,p.x+12,p.y-12);
   }
   ctx.restore();
  }
  if(controls.feet.checked){
   ctx.strokeStyle='#57e4d0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,930);ctx.lineTo(1920,930);ctx.stroke();
   ctx.font='24px sans-serif';ctx.fillStyle='#57e4d0';ctx.fillText('PÉS Y=930',25,920);
  }
 }
 document.querySelector('#frame').textContent=Math.floor(frame);
 document.querySelector('#cameraValue').textContent=cam;
 document.querySelector('#selected').textContent=solo||'Composição completa';
}
controls.camera.oninput=()=>{cam=+controls.camera.value;draw();};
controls.pause.onclick=()=>{paused=!paused;controls.pause.textContent=paused?'Continuar':'Pausar';};
document.querySelector('#step').onclick=()=>{paused=true;frame+=15;controls.pause.textContent='Continuar';draw();};
document.querySelector('#scene').onclick=()=>{solo=null;draw();};
document.querySelector('#download').onclick=()=>{draw();const a=document.createElement('a');a.download='washington-camera-'+cam+'.png';a.href=cv.toDataURL();a.click();};
for(const el of Object.values(controls))if((el.tagName==='INPUT'&&el.type==='checkbox')||el.tagName==='SELECT')el.onchange=draw;
await Promise.all(Object.entries(pack.assets).filter(([,a])=>a.kind!=='audio').map(async([id,a])=>{
 const im=new Image();im.src=a.url;try{await im.decode();images.set(id,im);}catch{errors.push(id);return;}
 const card=document.createElement('article'),label=document.createElement('h3'),canvas=document.createElement('canvas'),button=document.createElement('button'),link=document.createElement('a'),small=document.createElement('p');
 canvas.width=240;canvas.height=180;label.textContent=id;small.textContent=(a.frames||1)+' quadro(s) · '+(a.origin||a.kind);
 button.textContent='Ver isolado';button.onclick=()=>{solo=id;window.scrollTo({top:0,behavior:'smooth'});draw();};
 link.textContent='Baixar arquivo';link.href=a.url;link.download=id+'.'+a.path.split('.').pop();
 card.append(canvas,label,small,button,link);document.querySelector('#gallery').append(card);cards.push({canvas,a,im});
}));
await loadStageArt({washington:pack});
await Promise.allSettled([...(heroURL?[hero.decode()]:[]),...(hero2URL?[hero2.decode()]:[])]);
document.querySelector('#status').textContent=Object.keys(pack.assets).length+' assets · '+images.size+' imagens carregadas · '+(stageArtStatus('washington').ready?'cenário pronto':'falha de carga')+(errors.length?' · falhas: '+errors.join(', '):'');
for(const[id,a]of Object.entries(pack.assets).filter(([,a])=>a.kind==='audio')){
 const label=document.createElement('label'),audio=document.createElement('audio');label.textContent=id;audio.controls=true;audio.src=a.url;audio.loop=id!=='trilha-intro';document.querySelector('#audio').append(label,audio);
}
let galleryTick=0;
function loop(now){
 if(!paused)frame+=Math.min(100,now-last)*.06;last=now;draw();
 if(now-galleryTick>180){galleryTick=now;for(const{canvas,a,im}of cards){const c=canvas.getContext('2d');c.clearRect(0,0,240,180);picture(c,a,im,5,5,230,170);}}
 requestAnimationFrame(loop);
}
window.washingtonPreview={pack,status:()=>stageArtStatus('washington'),setFrame:n=>{paused=true;frame=Math.max(0,n);draw();},setCamera:n=>{cam=Math.max(0,Math.min(680,n));controls.camera.value=cam;draw();},showScene:()=>{solo=null;draw();},setClones:active=>{controls.clones.checked=!!active;solo=null;draw();},setWall:(active,hp=6)=>{controls.wall.checked=!!active;controls.wallHP.value=[6,3,1].includes(+hp)?String(hp):'6';solo=null;draw();},setArmor:active=>{controls.armor.checked=!!active;solo=null;draw();},demo:{real:demoBoss,clones:demoMatch.ents},errors};
document.body.dataset.ready='true';requestAnimationFrame(loop);
})();
`;
const bundle=await build({stdin:{contents:code,resolveDir:process.cwd(),sourcefile:'washington-preview-entry.js'},bundle:true,format:'iife',target:'es2022',write:false});
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Washington — Gramado do palácio | Assets separados</title><style>
*{box-sizing:border-box}body{margin:0;background:#101a23;color:#eee5d2;font:15px system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:24px}h1{font:42px Georgia,serif;margin:4px 0 8px}.eyebrow{color:#e7b767;letter-spacing:2px;font-size:12px}p{color:#abb6bf}canvas#stage{width:100%;height:auto;display:block;background:#1d2232;border-radius:8px}.bar{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:15px 0}button,a{font:inherit}button{background:#e8c583;border:0;border-radius:5px;padding:9px 13px;color:#18202a;cursor:pointer}a{color:#e8c583}label{display:inline-flex;gap:6px;align-items:center}#camera{width:200px}#gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}article{background:#1e2a34;padding:12px;border-radius:7px;min-width:0}article canvas{width:100%;height:180px;background:repeating-conic-gradient(#293742 0% 25%,#31404b 0% 50%) 50%/18px 18px}article h3{font-size:15px;overflow-wrap:anywhere}article p{font-size:12px}article a{display:inline-block;margin:12px}#audio{display:grid;grid-template-columns:200px 1fr;gap:15px}#audio audio{width:100%;max-width:500px}h2{font:28px Georgia,serif;margin-top:35px}#status{font-size:13px}@media(max-width:600px){main{padding:12px}h1{font-size:29px}#audio{grid-template-columns:1fr}#camera{width:160px}}
</style><main><div class="eyebrow">SALVADORES NACIONAIS · CENÁRIO 06</div><h1>Washington — Gramado do palácio</h1><p>Palácio, gramado, monumento, chafariz e apoio comunitário em peças independentes. Cada arquivo pode ser inspecionado e baixado na galeria.</p><p id="status">Carregando os assets…</p><canvas id="stage" width="1920" height="1080"></canvas>
<div class="bar"><button id="pause">Pausar</button><button id="step">+15 quadros</button><label>Câmera <input id="camera" type="range" min="0" max="680" value="340"><span id="cameraValue">340</span></label><span>Quadro <span id="frame">0</span></span><button id="scene">Ver cenário</button><button id="download">Baixar composição</button></div>
<div class="bar"><label><input id="heroes" type="checkbox" checked>Lutadores em escala</label><label><input id="feet" type="checkbox">Linha dos pés</label><label><input id="objects" type="checkbox" checked>Objetos e comunidade</label><label><input id="effects" type="checkbox" checked>Efeitos</label><label><input id="ground" type="checkbox" checked>Piso</label><label><input id="reduce" type="checkbox">Efeitos reduzidos</label></div><div class="bar"><label><input id="clones" type="checkbox">Demonstrar Fake News e sombras</label><label><input id="wall" type="checkbox">Demonstrar THE WALL</label><label>HP da muralha <select id="wall-hp"><option value="6">6 — Inteira</option><option value="3">3 — Danificada</option><option value="1">1 — Último golpe</option></select></label><label><input id="armor" type="checkbox">Armadura dourada</label><label><input id="anchors" type="checkbox">Pontos de apoio</label></div><p>Demonstração visual dos renderers reais: duas cópias sem sombra, verdadeiro com sombra e muralha de 120×640 com até seis HP. Os estados são fixos e não simulam combate ou dano. O Laranjão usa a representação corporal já existente no jogo; Belga e Ryuchi são referências de escala.</p><p id="selected">Composição completa</p>
<h2>Assets separados</h2><div id="gallery"></div><h2>Trilha e ambientes</h2><p>Tema original a 116 BPM e ambientes discretos de gramado, vento, água do chafariz e público sintetizado sem fala inteligível. Sem gravações externas ou vozes. Use os controles abaixo para ouvir cada arquivo.</p><div id="audio"></div></main><script>${bundle.outputFiles[0].text.replaceAll('</script>','<\\/script>')}</script></html>`;
const out=offline?'production/qa/washington-cenario-offline.html':'production/qa/washington-cenario.html';
mkdirSync('production/qa',{recursive:true});writeFileSync(out,html);
console.log(out);
