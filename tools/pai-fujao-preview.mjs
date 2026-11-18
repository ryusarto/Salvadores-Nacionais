import fs from 'node:fs';
const r='production/sprites/source/pai-fujao-v1';
const m=JSON.parse(fs.readFileSync(r+'/manifest.json'));
// Embed the manifest so this review also works from a local file.
const records=[...m.animations,...m.effects].map(a=>({...a,file:'../sprites/source/pai-fujao-v1/'+a.file}));
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pai do Fujão · 360 quadros</title><style>body{margin:24px;background:#211e23;color:#f1e9dc;font:16px system-ui}main{max-width:1000px;margin:auto}canvas{width:min(100%,650px);background:repeating-conic-gradient(#35333a 0 25%,#29272e 0 50%) 0/30px 30px;display:block}button,select{font:inherit;padding:8px;margin:5px}a{color:#e1b85c}</style><main><h1>Pai do Fujão</h1><p>40 animações de corpo · 20 efeitos · seis quadros por ação</p><select id="action" aria-label="Ação"></select><button id="play">Pausar</button><button id="mirror">Espelhar</button><button id="next">Próximo quadro</button><output id="label"></output><canvas id="canvas" width="650" height="530"></canvas><p><a id="strip">Abrir tira PNG</a></p></main><script>
const A=${JSON.stringify(records).replaceAll('<','\\u003c')},sel=document.getElementById('action'),cv=document.getElementById('canvas'),ctx=cv.getContext('2d');let image=new Image(),frame=0,playing=true,mirror=false,last=0;
for(const a of A){const o=document.createElement('option');o.textContent=a.action;o.value=A.indexOf(a);sel.append(o)}
function draw(){ctx.clearRect(0,0,650,530);if(image.complete&&image.naturalWidth){ctx.save();if(mirror){ctx.translate(650,0);ctx.scale(-1,1)}const s=A[sel.value].runtimeScale||1;ctx.drawImage(image,frame*500,0,500,500,325-250*s,480-456*s,500*s,500*s);ctx.restore()}document.getElementById('label').textContent=(frame+1)+' / 6'}
function choose(){image=new Image();image.onload=draw;image.src=A[sel.value].file;document.getElementById('strip').href=image.src;frame=0}sel.onchange=choose;document.getElementById('play').onclick=()=>playing=!playing;document.getElementById('mirror').onclick=()=>{mirror=!mirror;draw()};document.getElementById('next').onclick=()=>{playing=false;frame=(frame+1)%6;draw()};function tick(t){if(playing&&t-last>125){frame=(frame+1)%6;last=t;draw()}requestAnimationFrame(tick)}choose();requestAnimationFrame(tick);
</script></html>`;
fs.mkdirSync('production/qa',{recursive:true});fs.writeFileSync('production/qa/pai-fujao-v1.html',html);
console.log('Prévia Pai: '+records.length+' sequências.');
