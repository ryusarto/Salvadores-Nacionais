import {fight,run,tap,I} from '../../../../tests/unit/helpers.js';
import {spawnEntity} from '../../../../src/core/entities.js';
import {applyHit} from '../../../../src/core/combat.js';
import {LIVE} from '../../../../src/data/characters/chupetinha.js';
import {PAV} from '../../../../src/data/characters/pavanassi.js';
import {FUGA} from '../../../../src/data/characters/fujao.js';
import {PAI} from '../../../../src/data/characters/pai-fujao.js';
import {LAR} from '../../../../src/data/characters/laranjao.js';
import {DJ} from '../../../../src/data/characters/djabo.js';
const snapshot=(x,seen=new Map())=>{if(x===null||typeof x!=='object')return x;if(seen.has(x))return seen.get(x);if(x instanceof Set)return new Set([...x].map(v=>snapshot(v,seen)));if(x instanceof Map)return new Map([...x].map(([k,v])=>[k,snapshot(v,seen)]));const y=Array.isArray(x)?[]:{};seen.set(x,y);for(const[k,v]of Object.entries(x))y[k]=snapshot(v,seen);return y;};
const ok=(b,m)=>{if(!b)throw Error(m);};
export function probe(id){
 const checks=[],shots=[];const check=(b,label,data)=>{ok(b,label);checks.push({label,passed:true,...data});};
 if(id==='zanata'){
  const s=fight('trunks',id,700),b=s.f[1];b.hp=Math.floor(b.maxHp*.39);const e=run(s,2);check(b.res.fury&&e.some(x=>x.t==='fury'),'Fúria abaixo de40%');shots.push({name:'fury',state:s});
 }
 if(id==='chupetinha'){
  const s=fight('trunks',id,150),b=s.f[1];tap(s,{L:1},20);check(b.res.live&&b.res.signal===LIVE.signal,'Dano liga live');run(s,40);b.x=s.f[0].x+150;const hp=b.hp;const e=tap(s,{L:1},20),dmg=e.filter(x=>x.t==='hit').reduce((n,x)=>n+x.dmg,0);check(dmg>0&&hp-b.hp===dmg-Math.round(dmg*LIVE.heal),'Live cura25% do dano',{damage:dmg,netLoss:hp-b.hp});shots.push({name:'live-phone',state:s});
  const f=fight('franco',id,200),d=f.f[1];Object.assign(d.res,{live:true,signal:LIVE.signal,offT:0,lastHp:d.hp});const e2=tap(f,{H:1},40);check(!d.res.live&&e2.some(x=>x.t==='pop'&&x.str==='FLASH! SEM SINAL!'),'Flash derruba celular');
 }
 if(id==='pavanassi'){
  const s=fight('trunks',id,520),[h,b]=s.f;spawnEntity(s,b,b.ch.moves['6S'].spawn[0]);const fence=s.ents.find(x=>x.kind==='cerca');run(s,120,I({x:1}));check(h.x<fence.x,'Cerca impede caminhada');shots.push({name:'fence',state:snapshot(s)});
  for(let i=0;i<PAV.fenceHp;i++){h.x=fence.x-140;run(s,20);tap(s,{M:1},30);}check(!s.ents.some(x=>x.kind==='cerca'),'Cerca cai após golpes');
  const c=fight('trunks',id,700),[ch,cb]=c.f;spawnEntity(c,cb,{kind:'cabine',behavior:'barrier',x:300,y:0,w:190,h:420,vx:0,life:900,hp:PAV.cabinHp,hit:null,delay:0});const cabin=c.ents.find(x=>x.kind==='cabine');ch.x=cabin.x-200;run(c,10);shots.push({name:'cabin',state:snapshot(c)});const hp=cb.hp,e=run(c,2,I({G:1,T:1}));run(c,2);check(e.some(x=>x.t==='emotional')&&hp-cb.hp===PAV.emotional&&!c.ents.some(x=>x.kind==='cabine'),'Questionar cabine causa dano e derruba cabine',{damage:hp-cb.hp});
 }
 if(id==='fujao'){
  const s=fight('trunks',id,150),[h,b]=s.f;b.x=FUGA.stairsX;h.x=b.x-900;b.hp=Math.round(b.maxHp*.5);const hp=b.hp;run(s,40);shots.push({name:'boarding',state:snapshot(s)});run(s,FUGA.boardFrames-40+5);check(b.hp===hp+Math.round(b.maxHp*FUGA.boardHeal),'Embarque sozinho recupera vida',{stairsX:FUGA.stairsX,heal:b.hp-hp});
  const n=fight('trunks',id,150),nb=n.f[1];nb.x=FUGA.stairsX;n.f[0].x=nb.x-900;nb.hp=Math.round(nb.maxHp*.5);run(n,40);n.f[0].x=nb.x-300;const ev=run(n,80);check(ev.some(x=>x.t==='pop'&&x.str==='EMBARQUE NEGADO!')&&nb.hp===Math.round(nb.maxHp*.5),'Aproximação nega embarque');
 }
 if(id==='pai-fujao'){
  const s=fight('trunks',id,150),[h,b]=s.f;b.x=PAI.zoneX;h.x=PAI.zoneX-700;run(s,2);shots.push({name:'ankle-zone',state:snapshot(s)});b.x=PAI.zoneX+PAI.zoneR+40;b.state='hitstun';b.stun=20;const hp=b.hp,e=run(s,2);check(e.some(x=>x.t==='shock')&&hp-b.hp===PAI.shockDmg&&b.state==='dizzy','Empurrão fora da zona aciona choque',{zoneX:PAI.zoneX,zoneR:PAI.zoneR,damage:hp-b.hp});
  const f=fight('trunks',id,150),[a,p]=f.f,m=a.ch.moves['5M'],ds=[];for(let i=0;i<4;i++){f.events=[];applyHit(f,a,p,m.hits[0],{type:'move',m});ds.push(f.events.find(x=>x.t==='hit').dmg);}check(ds.slice(0,3).every(x=>x===1)&&ds[3]>100,'Foro absorve três primeiros golpes',{damage:ds});
 }
 if(id==='laranjao'){
  const s=fight('trunks',id,300),b=s.f[1];run(s,1,I(),I({S:1}));run(s,20);check(s.ents.filter(x=>x.kind==='clone').length===LAR.clones,'Fake News cria duas cópias');shots.push({name:'clones-shadow',state:s});
  const w=fight('trunks',id,600),[h,l]=w.f;l.super=1000;run(w,1,I(),I({y:-1,X:1}));run(w,80);const wall=w.ents.find(x=>x.kind==='muralha');check(!!wall,'The Wall materializa muralha');shots.push({name:'wall',state:snapshot(w)});h.x=wall.x-150;run(w,1,I({y:1,x:1}));run(w,60,I({x:1}));check(h.x<wall.x,'Muralha impede travessia por salto',{hp:wall.hp});
  l.res.armor=1;l.state='idle';l.comboHits=0;w.events=[];const m=h.ch.moves['5M'];applyHit(w,h,l,m.hits[0],{type:'move',m});check(w.events.some(x=>x.t==='hit'&&x.dmg===1)&&l.res.armor===0,'Armadura absorve golpe e consome carga');
 }
 if(id==='djabo'){
  const make=active=>{const s=fight('trunks',id,700);s.f[0].x=950;s.f[1].x=1900;s.f[1].super=3000;run(s,1,I(),I({X:1}));let n=0;while(!s.ents.some(x=>x.kind==='chao-fogo')&&n++<150)run(s,1);ok(s.ents.some(x=>x.kind==='chao-fogo'),'SA3 não nasceu');const safe=s.f[1].res.safe;s.f[0].x=(safe[0]+safe[1])/2;if(active){let k=0;while(s.ents.some(x=>x.kind==='chao-fogo'&&x.delay>0)&&k++<30)run(s,1);run(s,1);}return s;};
  const warning=make(false),active=make(true),safe=active.f[1].res.safe,segments=active.ents.filter(x=>x.kind==='chao-fogo').map(x=>[x.x-x.w/2,x.x+x.w/2]);check(safe[1]-safe[0]===DJ.safeW&&DJ.safeW===360&&segments.every(([l,r])=>r<=safe[0]+1e-6||l>=safe[1]-1e-6),'Inferno Nacional preserva faixa segura360',{safe,segments});shots.push({name:'warning',state:warning},{name:'active',state:active});
 }
 return{checks,shots};
}
