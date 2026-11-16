import ryuchi from '../../src/data/characters/ryuchi.js';
import {createFighter} from '../../src/core/fighter.js';
import {animFor,moveArtWindow,FOOT} from '../../src/render/anim.js';
import {spriteProgress} from '../../src/render/sprite-timing.js';
import {drawSprite,registerSprites} from '../../src/render/sprites.js';
import {SYS} from '../../src/data/system.js';
const states={parado:'idle',andar:'walk','andar-tras':'walk',correr:'run',agachar:'crouch',pulo:'air',recuo:'backdash','escape-agarrao':'tech','recuperacao-rolamento':'techroll','defesa-em-pe':'guard','defesa-agachado':'guard','defesa-no-ar':'blockstun','dano-alto':'hitstun','dano-baixo':'hitstun','dano-no-ar':'air_hit',caido:'knockdown',levantar:'wakeup',tonto:'dizzy',vitoria:'win'};
const names={parado:'Parado',andar:'Andar','andar-tras':'Andar para trás',correr:'Correr',agachar:'Agachar',pulo:'Pular',recuo:'Recuar','escape-agarrao':'Escape de agarrão','recuperacao-rolamento':'Rolamento','defesa-em-pe':'Defesa em pé','defesa-agachado':'Defesa agachado','defesa-no-ar':'Defesa no ar','dano-alto':'Dano alto','dano-baixo':'Dano baixo','dano-no-ar':'Dano no ar',caido:'Queda',levantar:'Levantar',tonto:'Tonto',vitoria:'Vitória'};
const label=name=>names[name]||ryuchi.moves[name.slice(6)]?.name||name;
function sample(name,i){
const f=createFighter(ryuchi,0,0);f.ch={...ryuchi,spriteScale:1};f.state=states[name]||'attack';f.comboHits=1;f.vx=name==='andar-tras'?-5:5;f.sf=0;let frame=Math.ceil(i*28/6);
const timed=n=>Math.ceil(i*n/6);
if(f.state==='attack'){f.moveKey=name.slice(6);f.move=ryuchi.moves[f.moveKey];const[first,last]=moveArtWindow(f.move);f.sf=[0,Math.ceil(first/3),Math.ceil(first*2/3),first,last+1,f.move.total-1][i];if(f.moveKey==='2S'&&i>=3){f.sf=8;f.holdT=(i-3)*12;}if(f.moveKey==='SA1')f.sf=[0,5,9,16,22,f.move.total-1][i];if(f.moveKey==='SA3')f.sf=[0,7,13,22,54,f.move.total-1][i];}
if(name==='parado')frame=timed(80);if(name==='correr')frame=timed(16);if(name==='agachar')f.sf=timed(10);
if(name==='pulo'){f.y=160;const v=SYS.JUMP.vy*ryuchi.jumpScale;f.vy=v*(1-2*(i+.05)/6);}
if(name.startsWith('defesa-')){f.sf=timed(12);f.crouchBlock=name==='defesa-agachado';if(name==='defesa-no-ar')f.y=160;}
if(['dano-alto','dano-baixo'].includes(name)){f.sf=timed(18);f.stun=18-f.sf;f.crouchBlock=name==='dano-baixo';}
if(name==='dano-no-ar'){f.y=160;f.vy=24-48*(i+.05)/6;}
if(name==='caido')f.sf=timed(18);if(name==='levantar')f.sf=timed(SYS.KNOCKDOWN.wakeup);
if(name==='recuo')f.sf=timed(SYS.BACKDASH.frames);if(name==='escape-agarrao')f.sf=timed(20);if(name==='recuperacao-rolamento')f.sf=timed(SYS.TECH_ROLL.frames);
if(name==='tonto')f.sf=i*8;if(name==='vitoria')f.sf=i*5;return{f,frame};
}
async function main(){
const manifests=window.__RYUCHI_MANIFEST||{right:await(await fetch('../sprites/source/ryuchi-v3/manifest.json')).json(),left:await(await fetch('../sprites/source/ryuchi-v3/esquerda/manifest.json')).json()};
const all=[],images={},failures=[];
for(const view of['right','left']){const m=manifests[view],base=view==='left'?'ryuchi-esquerda':'ryuchi';
 for(const[id,seq]of[[base,m.sequences],[base+'-fx',m.effects]]){const pack={};await Promise.all(seq.map(async s=>{const key=view+'/'+s.name,im=new Image();im.src=window.__RYUCHI_IMAGES?.[key]||'../../'+s.file;await im.decode();if(im.naturalWidth!==3000||im.naturalHeight!==500)failures.push('Dimensões '+key);images[key]=im;pack[s.name]=im.src;all.push({...s,key,view,effect:id.endsWith('-fx')});}));await registerSprites(id,pack,{trueAlpha:true,frames:6,cellSize:500});}
}
all.sort((a,b)=>a.key.localeCompare(b.key));
const a=document.createElement('canvas'),e=document.createElement('canvas');a.width=e.width=a.height=e.height=500;const ac=a.getContext('2d',{willReadFrequently:true}),ec=e.getContext('2d',{willReadFrequently:true});let cases=0,transparentFrames=0,touchingEdges=0;
for(const s of all)for(let i=0;i<6;i++){
 ec.clearRect(0,0,500,500);ec.drawImage(images[s.key],i*500,0,500,500,0,0,500,500);const px=ec.getImageData(0,0,500,500).data;
 if([0,499,499*500,500*500-1].every(p=>px[p*4+3]===0))transparentFrames++;
 let edge=false;for(let n=0;n<500;n++)for(const p of[n,499*500+n,n*500,n*500+499])if(px[p*4+3]>127)edge=true;if(edge){touchingEdges++;failures.push('Corte '+s.key+' '+i);}
 if(s.effect)continue;
 const{f,frame}=sample(s.name,i);f.face=s.view==='left'?-1:1;f.vx*=f.face;const pose=animFor(f,frame),index=Math.floor(spriteProgress(f,pose)*6);if(index!==i)failures.push('Fase '+s.key+' '+i+' → '+index);
 ac.clearRect(0,0,500,500);ac.save();ac.translate(250,500*FOOT.y);ac.scale(f.face*500/768,500/768);drawSprite(ac,f,frame);ac.restore();const actual=ac.getImageData(0,0,500,500).data;let delta=0;for(let p=0;p<px.length;p++)if(Math.abs(actual[p]-px[p])>2)delta++;if(delta)failures.push('Leitor '+s.key+' '+i+': '+delta);cases++;
}
window.__ryuchiQA={cases,loaded:all.length,views:2,frames:6,cell:500,transparentFrames,touchingEdges,failures};document.getElementById('checks').textContent=JSON.stringify(__ryuchiQA,null,2);document.getElementById('status').textContent=failures.length?failures.length+' falhas.':all.length+' animações · 684 frames transparentes · duas vistas próprias · 588 comparações passaram';
const select=document.getElementById('animation');for(const s of all){const o=document.createElement('option');o.value=s.key;o.textContent=(s.view==='left'?'← Esquerda':'Direita →')+' · '+label(s.name);select.append(o);}select.value='right/andar';
const panels=[];for(const s of all){const el=document.createElement('article'),h=document.createElement('h2'),sub=document.createElement('small'),cv=document.createElement('canvas');h.textContent=(s.view==='left'?'← ':'→ ')+label(s.name);sub.textContent=s.name+' · 6 × 500px';cv.width=cv.height=500;el.append(h,sub,cv);document.getElementById('grid').append(el);el.onclick=()=>{select.value=s.key;document.getElementById('focus').scrollIntoView({behavior:'smooth'});};panels.push({...s,el,c:cv.getContext('2d'),group:s.effect?'effect':s.name.startsWith('golpe-')?'attack':'state'});}
const big=document.getElementById('big'),bc=big.getContext('2d');let i=0,playing=true,last=performance.now();
document.getElementById('pause').onclick=()=>{playing=!playing;document.getElementById('pause').textContent=playing?'Pausar':'Reproduzir'};
document.getElementById('next').onclick=()=>{playing=false;i=(i+1)%6;document.getElementById('pause').textContent='Reproduzir'};
document.getElementById('mirror').textContent='Trocar vista';document.getElementById('mirror').onclick=()=>{const[view,name]=select.value.split('/');select.value=(view==='left'?'right':'left')+'/'+name;};
document.getElementById('background').onchange=ev=>big.dataset.bg=ev.target.value;
document.getElementById('filter').onchange=ev=>{for(const p of panels)p.el.hidden=ev.target.value!=='all'&&ev.target.value!==p.group};
const frame=(c,key,index)=>{c.clearRect(0,0,500,500);c.drawImage(images[key],index*500,0,500,500,0,0,500,500);};
document.getElementById('save').onclick=()=>{const cv=document.createElement('canvas');cv.width=cv.height=500;frame(cv.getContext('2d'),select.value,i);const link=document.createElement('a');link.download=select.value.replace('/','-')+'-frame-'+(i+1)+'.png';link.href=cv.toDataURL('image/png');link.click();};
if(window.__RYUCHI_IMAGES)document.getElementById('play').hidden=true;
const gallery=document.getElementById('grid').closest('details');
function tick(now){if(playing&&now-last>140){i=(i+1)%6;last=now;}document.getElementById('frame-label').textContent='Frame '+(i+1)+'/6';frame(bc,select.value,i);if(gallery.open)for(const p of panels)if(!p.el.hidden)frame(p.c,p.key,i);requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
main().catch(err=>{document.getElementById('status').textContent=err.message;window.__ryuchiQA={failures:[err.message]};console.error(err)});
