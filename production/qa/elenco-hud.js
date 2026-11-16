import{ALL,HEROES}from'../../src/data/characters/index.js';import{createFighter}from'../../src/core/fighter.js';
import{registerSprites}from'../../src/render/sprites.js';import{drawFighter}from'../../src/render/mannequin.js';
import{comicText,loadComicUi}from'../../src/render/comic-ui.js';import{fighterMaterialStatus}from'../../src/render/fighter-material.js';
const root=new URL('../ui/comic-v1/',location.href),pack=await(await fetch(new URL('manifest.json',root))).json();for(const a of Object.values(pack.assets))a.url=new URL(a.path,root).href;await loadComicUi(pack);
await Promise.all([...HEROES.map(ch=>({id:ch.id,frames:ch.spriteProfile==='six-frame'?6:ch.spriteProfile==='ten-frame'?10:4,ext:ch.id==='mdep'?'png':'webp'})),{id:'ryuchi-esquerda',frames:6,ext:'webp'}].map(async ch=>registerSprites(ch.id,{parado:new URL('../sprites/final/'+ch.id+'/parado.'+ch.ext,new URL('../',root)).href},{trueAlpha:true,lazy:true,frames:ch.frames,maxDecoded:1})));
const canvas=document.getElementById('roster'),c=canvas.getContext('2d');let frame=0,playing=true,face=1;
const fighters=HEROES.map((ch,i)=>createFighter(ch,i%2,120+i*240));
function render(){c.fillStyle='#f4e9c9';c.fillRect(0,0,1920,680);c.strokeStyle='#b69d79';c.lineWidth=1;c.beginPath();c.moveTo(0,110);c.lineTo(1920,110);c.stroke();c.fillStyle='#17131b';c.fillRect(0,580,1920,3);
 for(const[i,f]of fighters.entries()){f.face=face;c.save();c.translate(0,-350);drawFighter(c,f,frame+i*7);c.restore();comicText(c,f.ch.name.split(',')[0],120+i*240,631,31,'#17131b','center');}
}
for(const ch of Object.values(ALL)){const card=document.createElement('article'),img=document.createElement('img');img.className='portrait';img.src=pack.assets['portrait-'+ch.id].url;img.alt=ch.name;card.append(img);const label=document.createElement('div');label.className='label';const icon=document.createElement('img');icon.className='icon';icon.src=pack.assets['icon-'+ch.id].url;icon.alt='Ícone de '+ch.name;const title=document.createElement('h3');title.textContent=ch.name;label.append(icon,title);card.append(label);document.getElementById('gallery').append(card);}
document.getElementById('status').textContent='8 heróis · 9 retratos · 9 ícones';document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'Pausar':'Continuar';};document.getElementById('facing').onclick=()=>{face*=-1;render();};
window.__rosterQa={render:(f=0,direction=1)=>{playing=false;frame=f;face=direction;render();},material:fighterMaterialStatus};
let last=performance.now(),acc=0;function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){if(playing)frame++;acc-=1000/60;}render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
