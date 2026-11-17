import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('production/stages/palco/manifest.json','utf8'));
const offline=process.argv.includes('--offline');
const data=(path,mime)=>'data:'+mime+';base64,'+readFileSync(path).toString('base64');
if(offline)for(const a of Object.values(manifest.assets))a.url=data('production/stages/palco/'+a.path,a.kind==='audio'?'audio/ogg':a.path.endsWith('.svg')?'image/svg+xml':'image/webp');
const heroUrls=['belga','ryuchi'].map(id=>offline?data('production/sprites/final/'+id+'/parado.webp','image/webp'):'../sprites/final/'+id+'/parado.webp');
const code=`
import {loadStageArt,drawStageArt,stageArtStatus,stageAnimationFrame} from './src/render/stage-packs.js';
(async()=>{
const pack=${JSON.stringify(manifest)};
for(const a of Object.values(pack.assets))a.url??='../stages/palco/'+a.path;
const original=[...pack.objects],front=[...pack.foreground];
const cv=document.querySelector('#stage'),ctx=cv.getContext('2d'),images=new Map(),cards=[];
let frame=0,paused=false,cam=340,last=performance.now(),solo=null;
const hero=new Image();hero.src=${JSON.stringify(heroUrls[0])};
const hero2=new Image();hero2.src=${JSON.stringify(heroUrls[1])};
const controls={camera:document.querySelector('#camera'),pause:document.querySelector('#pause'),feet:document.querySelector('#feet'),heroes:document.querySelector('#heroes'),reduce:document.querySelector('#reduce'),objects:document.querySelector('#objects'),fx:document.querySelector('#effects'),ground:document.querySelector('#ground')};
function picture(c,a,img,x,y,w,h,at=frame){
 const n=a.frames||1,cw=a.cellWidth||img.width/n;
 const [sx,sy,sw,sh]=a.crop||[0,0,cw,img.height];
 const scale=Math.min(w/sw,h/sh),f=n>1?stageAnimationFrame(at,5,n):0;
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
  pack.foreground=controls.objects.checked?front:[];
  const savedGround=pack.ground;if(!controls.ground.checked)pack.ground=null;
  drawStageArt(ctx,'palco',cam,Math.floor(frame),{reducedEffects:controls.reduce.checked});
  pack.ground=savedGround;
  if(controls.heroes.checked){fighter(hero2,950);fighter(hero,1650,true);}
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
document.querySelector('#step').onclick=()=>{paused=true;frame+=12;controls.pause.textContent='Continuar';draw();};
document.querySelector('#scene').onclick=()=>{solo=null;draw();};
document.querySelector('#download').onclick=()=>{draw();const a=document.createElement('a');a.download='palco-camera-'+cam+'.png';a.href=cv.toDataURL();a.click();};
for(const el of Object.values(controls))if(el.tagName==='INPUT'&&el.type==='checkbox')el.onchange=draw;
await Promise.all(Object.entries(pack.assets).filter(([,a])=>a.kind!=='audio').map(async([id,a])=>{
 const im=new Image();im.src=a.url;try{await im.decode();images.set(id,im);}catch{return;}
 const card=document.createElement('article'),label=document.createElement('h3'),canvas=document.createElement('canvas'),button=document.createElement('button'),link=document.createElement('a'),small=document.createElement('p');
 canvas.width=240;canvas.height=180;label.textContent=id;small.textContent=(a.frames||1)+' quadro(s) · '+(a.origin||a.kind);
 button.textContent='Ver isolado';button.onclick=()=>{solo=id;window.scrollTo({top:0,behavior:'smooth'});draw();};
 link.textContent='Baixar arquivo';link.href=a.url;link.download=id;
 card.append(canvas,label,small,button,link);document.querySelector('#gallery').append(card);cards.push({canvas,a,im});
}));
await loadStageArt({palco:pack});
await Promise.all([hero.decode(),hero2.decode()]);
document.querySelector('#status').textContent=Object.keys(pack.assets).length+' assets · '+images.size+' imagens carregadas · '+(stageArtStatus('palco').ready?'cenário pronto':'falha de carga');
for(const[id,a]of Object.entries(pack.assets).filter(([,a])=>a.kind==='audio')){
 const label=document.createElement('label'),audio=document.createElement('audio');label.textContent=id;audio.controls=true;audio.src=a.url;audio.loop=id!=='trilha-intro';document.querySelector('#audio').append(label,audio);
}
let galleryTick=0;
function loop(now){
 if(!paused)frame+=Math.min(100,now-last)*.06;last=now;draw();
 if(now-galleryTick>180){galleryTick=now;for(const{canvas,a,im}of cards){const c=canvas.getContext('2d');c.clearRect(0,0,240,180);picture(c,a,im,5,5,230,170);}}
 requestAnimationFrame(loop);
}
window.palcoPreview={pack,status:()=>stageArtStatus('palco'),setFrame:n=>{paused=true;frame=n;draw();},setCamera:n=>{cam=n;controls.camera.value=n;draw();},showScene:()=>{solo=null;draw();}};
document.body.dataset.ready='true';requestAnimationFrame(loop);
})();
`;
const bundle=await build({stdin:{contents:code,resolveDir:process.cwd(),sourcefile:'palco-preview-entry.js'},bundle:true,format:'iife',target:'es2022',write:false});
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Belém — Frente do Palco | Assets separados</title><style>
*{box-sizing:border-box}body{margin:0;background:#101a23;color:#eee5d2;font:15px system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:24px}h1{font:42px Georgia,serif;margin:4px 0 8px}.eyebrow{color:#e7b767;letter-spacing:2px;font-size:12px}p{color:#abb6bf}canvas#stage{width:100%;height:auto;display:block;background:#1d2232;border-radius:8px}.bar{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:15px 0}button,a{font:inherit}button{background:#e8c583;border:0;border-radius:5px;padding:9px 13px;color:#18202a;cursor:pointer}a{color:#e8c583}label{display:inline-flex;gap:6px;align-items:center}#camera{width:200px}#gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}article{background:#1e2a34;padding:12px;border-radius:7px;min-width:0}article canvas{width:100%;height:180px;background:repeating-conic-gradient(#293742 0% 25%,#31404b 0% 50%) 50%/18px 18px}article h3{font-size:15px;overflow-wrap:anywhere}article p{font-size:12px}article a{display:inline-block;margin:12px}#audio{display:grid;grid-template-columns:200px 1fr;gap:15px}#audio audio{width:100%;max-width:500px}h2{font:28px Georgia,serif;margin-top:35px}#status{font-size:13px}@media(max-width:600px){main{padding:12px}h1{font-size:29px}#audio{grid-template-columns:1fr}#camera{width:160px}}
</style><main><div class="eyebrow">SALVADORES NACIONAIS · CENÁRIO 02</div><h1>Belém — Frente do Palco</h1><p>Palco, som, cozinha e público em peças independentes. Cada arquivo pode ser inspecionado e baixado na galeria.</p><p id="status">Carregando os assets…</p><canvas id="stage" width="1920" height="1080"></canvas>
<div class="bar"><button id="pause">Pausar</button><button id="step">+1 pose</button><label>Câmera <input id="camera" type="range" min="0" max="680" value="340"><span id="cameraValue">340</span></label><span>Quadro <span id="frame">0</span></span><button id="scene">Ver cenário</button><button id="download">Baixar composição</button></div>
<div class="bar"><label><input id="heroes" type="checkbox" checked>Lutadores em escala</label><label><input id="feet" type="checkbox">Linha dos pés</label><label><input id="objects" type="checkbox" checked>Objetos e público</label><label><input id="effects" type="checkbox" checked>Efeitos</label><label><input id="ground" type="checkbox" checked>Piso</label><label><input id="reduce" type="checkbox">Efeitos reduzidos</label></div><p id="selected">Composição completa</p>
<h2>Assets separados</h2><div id="gallery"></div><h2>Trilha e ambientes</h2><p>Áudio original sintetizado, com água e vento reaproveitados explicitamente do primeiro cenário.</p><div id="audio"></div></main><script>${bundle.outputFiles[0].text.replaceAll('</script>','<\\/script>')}</script></html>`;
const out=offline?'production/qa/palco-cenario-offline.html':'production/qa/palco-cenario.html';
mkdirSync('production/qa',{recursive:true});writeFileSync(out,html);
console.log(out);
