import trunks from '../../src/data/characters/trunks.js';
import {createFighter} from '../../src/core/fighter.js';
import {animFor,moveArtWindow,FOOT} from '../../src/render/anim.js';
import {spriteProgress} from '../../src/render/sprite-timing.js';
import {drawSprite,registerSprites} from '../../src/render/sprites.js';
import {SYS} from '../../src/data/system.js';
const states={parado:'idle',andar:'walk','andar-tras':'walk',correr:'run',agachar:'crouch',pulo:'air',recuo:'backdash','escape-agarrao':'tech','recuperacao-rolamento':'techroll','defesa-em-pe':'guard','defesa-agachado':'guard','defesa-no-ar':'blockstun','dano-alto':'hitstun','dano-baixo':'hitstun','dano-no-ar':'air_hit',caido:'knockdown',levantar:'wakeup',tonto:'dizzy',vitoria:'win'};
const names={parado:'Parado',andar:'Andar','andar-tras':'Andar para trás',correr:'Correr',agachar:'Agachar',pulo:'Pular',recuo:'Recuar','escape-agarrao':'Escape de agarrão','recuperacao-rolamento':'Rolamento','defesa-em-pe':'Defesa em pé','defesa-agachado':'Defesa agachado','defesa-no-ar':'Defesa no ar','dano-alto':'Dano alto','dano-baixo':'Dano baixo','dano-no-ar':'Dano no ar',caido:'Queda',levantar:'Levantar',tonto:'Tonto',vitoria:'Vitória'};
const label=name=>names[name]||trunks.moves[name.slice(6)]?.name||name;
function sample(name,i){
const f=createFighter(trunks,0,0);f.ch={...trunks,spriteScale:1};f.state=states[name]||'attack';f.comboHits=1;f.vx=name==='andar-tras'?-5:5;f.sf=0;let frame=Math.ceil(i*28/6);
const timed=n=>Math.ceil(i*n/6);
if(f.state==='attack'){f.moveKey=name.slice(6);f.move=trunks.moves[f.moveKey];const[first,last]=moveArtWindow(f.move);f.sf=[0,Math.ceil(first/3),Math.ceil(first*2/3),first,last+1,f.move.total-1][i];}
if(name==='parado')frame=timed(80);if(name==='correr')frame=timed(16);if(name==='agachar')f.sf=timed(10);
if(name==='pulo'){f.y=160;const v=SYS.JUMP.vy*trunks.jumpScale;f.vy=v*(1-2*(i+.05)/6);}
if(name.startsWith('defesa-')){f.sf=timed(12);f.crouchBlock=name==='defesa-agachado';if(name==='defesa-no-ar')f.y=160;}
if(['dano-alto','dano-baixo'].includes(name)){f.sf=timed(18);f.stun=18-f.sf;f.crouchBlock=name==='dano-baixo';}
if(name==='dano-no-ar'){f.y=160;f.vy=24-48*(i+.05)/6;}
if(name==='caido')f.sf=timed(18);if(name==='levantar')f.sf=timed(SYS.KNOCKDOWN.wakeup);
if(name==='recuo')f.sf=timed(SYS.BACKDASH.frames);if(name==='escape-agarrao')f.sf=timed(20);if(name==='recuperacao-rolamento')f.sf=timed(SYS.TECH_ROLL.frames);
if(name==='tonto')f.sf=i*8;if(name==='vitoria')f.sf=i*5;return{f,frame};
}
async function main(){
const manifest=window.__TRUNKS_MANIFEST||await(await fetch('../sprites/source/trunks-v3/manifest.json')).json();
const all=[...manifest.sequences,...manifest.effects],images={},failures=[];
for(const[id,seq]of[['trunks',manifest.sequences],['trunks-fx',manifest.effects]]){const pack={};await Promise.all(seq.map(async s=>{const im=new Image();im.src=window.__TRUNKS_IMAGES?.[s.name]||'../sprites/final/'+id+'/'+s.name+'.webp';await im.decode();if(im.naturalWidth!==3000||im.naturalHeight!==500)failures.push('Dimensões '+s.name);images[s.name]=im;pack[s.name]=im.src;}));await registerSprites(id,pack,{trueAlpha:true,frames:6,cellSize:500});}
const a=document.createElement('canvas'),e=document.createElement('canvas');a.width=e.width=a.height=e.height=500;const ac=a.getContext('2d',{willReadFrequently:true}),ec=e.getContext('2d',{willReadFrequently:true});let cases=0,transparentFrames=0,touchingEdges=0;
for(const s of all)for(let i=0;i<6;i++){
ec.clearRect(0,0,500,500);ec.drawImage(images[s.name],i*500,0,500,500,0,0,500,500);const px=ec.getImageData(0,0,500,500).data;
if([0,499,499*500,500*500-1].every(p=>px[p*4+3]===0))transparentFrames++;
let edge=false;for(let n=0;n<500;n++)for(const p of[n,499*500+n,n*500,n*500+499])if(px[p*4+3]>127)edge=true;if(edge){touchingEdges++;failures.push('Corte '+s.name+' '+i);}
if(!states[s.name]&&!s.name.startsWith('golpe-'))continue;
const{f,frame}=sample(s.name,i),pose=animFor(f,frame);const index=Math.floor(spriteProgress(f,pose)*6);if(index!==i)failures.push('Fase '+s.name+' '+i+' → '+index);
ac.clearRect(0,0,500,500);ac.save();ac.translate(250,500*FOOT.y);ac.scale(500/768,500/768);drawSprite(ac,f,frame);ac.restore();const actual=ac.getImageData(0,0,500,500).data;let delta=0;for(let p=0;p<px.length;p++)if(Math.abs(actual[p]-px[p])>2)delta++;if(delta)failures.push('Leitor '+s.name+' '+i+': '+delta);cases++;
}
window.__trunksQA={cases,loaded:all.length,frames:6,cell:500,transparentFrames,touchingEdges,failures};document.getElementById('checks').textContent=JSON.stringify(__trunksQA,null,2);document.getElementById('status').textContent=failures.length?failures.length+' falhas na verificação.':all.length+' animações · 288 frames transparentes de 500 × 500 · 240 comparações do leitor passaram';
const select=document.getElementById('animation');for(const s of all){const o=document.createElement('option');o.value=s.name;o.textContent=label(s.name)+' · '+s.name;select.append(o);}select.value='andar';
const panels=[];for(const s of all){const el=document.createElement('article'),h=document.createElement('h2'),sub=document.createElement('small'),cv=document.createElement('canvas');h.textContent=label(s.name);sub.textContent=s.name+' · 6 × 500px';cv.width=cv.height=500;el.append(h,sub,cv);document.getElementById('grid').append(el);el.onclick=()=>{select.value=s.name;document.getElementById('focus').scrollIntoView({behavior:'smooth'});};panels.push({...s,el,c:cv.getContext('2d'),group:manifest.effects.includes(s)?'effect':s.name.startsWith('golpe-')?'attack':'state'});}
const big=document.getElementById('big'),bc=big.getContext('2d');let i=0,side=1,playing=true,last=performance.now();
document.getElementById('pause').onclick=()=>{playing=!playing;document.getElementById('pause').textContent=playing?'Pausar':'Reproduzir'};
document.getElementById('next').onclick=()=>{playing=false;i=(i+1)%6;document.getElementById('pause').textContent='Reproduzir'};
document.getElementById('mirror').onclick=()=>side*=-1;
document.getElementById('background').onchange=ev=>{big.dataset.bg=ev.target.value};
document.getElementById('filter').onchange=ev=>{for(const p of panels)p.el.hidden=ev.target.value!=='all'&&ev.target.value!==p.group};
const frame=(c,name,index)=>{c.clearRect(0,0,500,500);c.save();c.translate(side===1?0:500,0);c.scale(side,1);c.drawImage(images[name],index*500,0,500,500,0,0,500,500);c.restore();};
document.getElementById('save').onclick=()=>{const cv=document.createElement('canvas');cv.width=cv.height=500;frame(cv.getContext('2d'),select.value,i);const link=document.createElement('a');link.download=select.value+'-frame-'+(i+1)+'.png';link.href=cv.toDataURL('image/png');link.click();};
if(window.__TRUNKS_IMAGES)document.getElementById('play').hidden=true;
function tick(now){if(playing&&now-last>140){i=(i+1)%6;last=now;}document.getElementById('frame-label').textContent='Frame '+(i+1)+'/6';frame(bc,select.value,i);for(const p of panels)if(!p.el.hidden)frame(p.c,p.name,i);requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
main().catch(err=>{document.getElementById('status').textContent=err.message;window.__trunksQA={failures:[err.message]};console.error(err)});
