import {loadBelemStage,drawBelemStage,belemStageStatus} from '../../src/render/belem-stage.js';
const root=new URL('../stages/belem/',location.href),pack=await(await fetch(new URL('manifest.json',root))).json();
for(const a of Object.values(pack.assets))a.url=new URL(a.path,root).href;
const result=await loadBelemStage(pack),canvas=document.getElementById('stage'),c=canvas.getContext('2d');
let frame=0,playing=true;const images=new Map(),actors=[];
for(const [name,x,face]of[['ryuchi',760,1],['belga',1160,-1]]){const img=new Image();img.src=new URL('../../sprites/final/'+name+'/parado.webp',root).href;await img.decode();actors.push({img,x,face});}
document.getElementById('palette').innerHTML=pack.palette.map(p=>`<i style="background:${p}"></i>`).join('');
document.getElementById('status').textContent=`${pack.assetGroups.filter(g=>g.status==='produced').length}/36 grupos · ${result.loaded} arquivos visuais`;
for(const group of pack.assetGroups){const card=document.createElement('article');card.className='asset';const title=document.createElement('strong');title.textContent=group.id;card.append(title);const meta=document.createElement('p');meta.textContent=group.files.length+' arquivo(s) · '+group.kind;card.append(meta);
 for(const path of group.files){const a=Object.values(pack.assets).find(a=>a.path===path);if(a.kind==='audio'){const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src=a.url;card.append(audio);}else if(a.frames===6){const cv=document.createElement('canvas');cv.width=cv.height=500;const img=new Image();img.src=a.url;await img.decode();images.set(cv,img);card.append(cv);}else{const img=document.createElement('img');img.src=a.url;img.alt=group.id;img.loading='lazy';card.append(img);}}
 const a=document.createElement('a');a.textContent='Abrir arquivo';a.href=new URL(group.files[0],root);a.target='_blank';card.append(a);document.getElementById('gallery').append(card);
}
function render(){const cam=+document.getElementById('camera').value;c.clearRect(0,0,1920,1080);drawBelemStage(c,cam,frame);
 if(document.getElementById('fighters').checked)for(const a of actors){c.save();c.translate(a.x,930);c.scale(a.face,1);c.fillStyle='#1a172644';c.beginPath();c.ellipse(0,0,72,14,0,0,Math.PI*2);c.fill();c.drawImage(a.img,Math.floor(frame/12)%6*500,0,500,500,-250,-456,500,500);c.restore();}
 for(const[cv,img]of images){const cc=cv.getContext('2d');cc.clearRect(0,0,500,500);cc.drawImage(img,Math.floor(frame/12)%6*500,0,500,500,0,0,500,500);}
 document.getElementById('camValue').textContent=String(cam);
}
document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'Pausar':'Continuar';};document.getElementById('step').onclick=()=>{playing=false;document.getElementById('play').textContent='Continuar';frame++;render();};
document.getElementById('download').onclick=()=>{const a=document.createElement('a');a.download='belem-ver-o-peso.png';a.href=canvas.toDataURL();a.click();};
window.__belemPreview={pack,status:belemStageStatus,render:(cam=340,t=0,fighters=false)=>{playing=false;frame=t;document.getElementById('camera').value=cam;document.getElementById('fighters').checked=fighters;render();},canvas};
let last=performance.now(),acc=0;function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){if(playing)frame++;acc-=1000/60;}render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
