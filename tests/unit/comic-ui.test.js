import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import sharp from'sharp';
import{HEROES,ALL}from'../../src/data/characters/index.js';import{CELL,FOOT}from'../../src/render/anim.js';import{SYS}from'../../src/data/system.js';
import{createHud,hudValues,updateHud}from'../../src/render/hud.js';import{applyFighterMaterial,configureFighterMaterial}from'../../src/render/fighter-material.js';
import{fight}from'./helpers.js';
import{TITLE_CAST}from'../../src/ui/comic-screens.js';
import{ryuchiAttackArt}from'../../src/render/ryuchi-art.js';import{belgaAttackArt}from'../../src/render/belga-art.js';
const root=new URL('../../',import.meta.url),ui=new URL('production/ui/comic-v1/',root);
test('The opening poster includes all eight heroes without duplicates',()=>assert.deepEqual(TITLE_CAST.map(p=>p[0]).sort(),HEROES.map(h=>h.id).sort()));
test('The whole roster has matching original portrait and HUD icon deliveries',async()=>{
 const m=JSON.parse(readFileSync(new URL('manifest.json',ui)));assert.deepEqual([...m.characters].sort(),Object.keys(ALL).sort());
 for(const id of m.characters)for(const kind of['portrait','icon']){const a=m.assets[kind+'-'+id],bytes=readFileSync(new URL(a.path,ui));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);
  const meta=await sharp(bytes).metadata();assert.ok(meta.hasAlpha,id);assert.equal(meta.width,kind==='icon'?256:768);assert.equal(meta.height,kind==='icon'?256:1024);
 }
 assert.ok(readFileSync(new URL('fonts/OFL.txt',ui),'utf8').includes('SIL OPEN FONT LICENSE'));
});
test('Approved fighters share the same measured standing height and ground plane',async()=>{
 const heights=[];
 for(const ch of HEROES){const file=readFileSync(new URL('production/sprites/final/'+ch.id+'/parado.'+(ch.id==='mdep'?'png':'webp'),root)),meta=await sharp(file).metadata();
  const raw=await sharp(file).extract({left:0,top:0,width:meta.height,height:meta.height}).ensureAlpha().raw().toBuffer();let top=meta.height,bottom=-1;
  for(let y=0;y<meta.height;y++)for(let x=0;x<meta.height;x++)if(raw[(y*meta.height+x)*4+3]>127){top=Math.min(top,y);bottom=Math.max(bottom,y);}
  const scale=CELL*(ch.spriteScale||1)/meta.height,height=(bottom-top+1)*scale,foot=(bottom+1-meta.height*FOOT.y)*scale;heights.push(height);
  assert.ok(height>=460&&height<=480,ch.id+' '+height);assert.ok(Math.abs(foot)<4,ch.id+' ground offset '+foot);
 }
 assert.ok(Math.max(...heights)-Math.min(...heights)<14);
 for(const id of['ryuchi','trunks','belga'])assert.ok(ALL[id].spriteScale<.78);
 assert.equal(SYS.BODY.stand.h,480);
});
test('HUD meters clamp safely and preserve partial stock and partial Ginga',()=>{
 const st=fight(),f=st.f[0];f.hp=-1;f.super=5000;f.ginga=SYS.GINGA.pip*2.5;
 assert.equal(hudValues(f).hp,0);assert.equal(hudValues(f).super,1);assert.equal(hudValues(f).stocks,3);assert.deepEqual(hudValues(f).ginga,[1,1,.5,0,0,0]);
 f.super=1500;assert.equal(hudValues(f).stocks,1);assert.equal(hudValues(f).super,.5);
 f.super=-10;assert.equal(hudValues(f).stocks,0);
});
test('Damage trail holds during a combo and animation advances once per game frame',()=>{
 const st=fight(),hud=createHud();st.f[0].hp=st.f[0].maxHp*.5;st.f[0].comboHits=3;st.f[0].comboDmg=1200;
 updateHud(st,hud);assert.equal(hud.lag[0],1);assert.equal(hud.combo[1].n,3);assert.equal(hud.combo[1].dmg,1200);
 st.f[0].comboHits=0;st.frame++;updateHud(st,hud);const lag=hud.lag[0],time=hud.combo[1].t;assert.ok(lag<1&&lag>.5);
 updateHud(st,hud);assert.equal(hud.lag[0],lag);assert.equal(hud.combo[1].t,time);
 st.f[0].hp=st.f[0].maxHp;st.frame++;updateHud(st,hud);assert.equal(hud.lag[0],1);
});
test('Render material leaves original images available when disabled or outside a browser',()=>{
 const source={width:500,height:500};configureFighterMaterial(false);assert.equal(applyFighterMaterial(source,'ryuchi'),source);configureFighterMaterial(true);assert.equal(applyFighterMaterial(source,'ryuchi'),source);assert.equal(applyFighterMaterial(source,'ryuchi-fx'),source);
});
test('Body-attached charge and evasion art follow the corrected character scale',()=>{
 const st=fight('ryuchi','belga');const r=st.f[0];r.state='attack';r.moveKey='2S';r.move=r.ch.moves['2S'];r.sf=r.move.hold.at;
 assert.equal(ryuchiAttackArt(r).box.y,-230*r.ch.spriteScale/.92);
 const b=st.f[1];b.state='attack';b.moveKey='2S';b.move=b.ch.moves['2S'];b.sf=b.move.inv[0].from;
 assert.equal(belgaAttackArt(b).box.y,-190*(b.ch.spriteScale/.92));
});
