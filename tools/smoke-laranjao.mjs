import { completedStoryFixture, confirmMap } from './menu-smoke-helpers.mjs';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { STATE_ANIMS } from '../src/render/anim.js';
const out=process.env.LARANJAO_ARTIFACT_DIR||'artifacts/laranjao',base=process.env.LARANJAO_BASE_URL||'http://127.0.0.1:8783';
await mkdir(out,{recursive:true});let server,browser;const errors=[],scenes=[],checks={};
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
 if(!process.env.LARANJAO_BASE_URL){let output='';server=spawn(process.execPath,['tools/dev-server.mjs','--port=8783'],{stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>output+=b);server.stderr.on('data',b=>output+=b);for(let n=0;n<200&&!output.includes('Servidor de desenvolvimento');n++){if(server.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,50));}assert.ok(output.includes('Servidor de desenvolvimento'),output);}
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(r.status()+' '+r.url());});
 await completedStoryFixture(page);await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__app?.frame>10&&!document.getElementById('loading'));
 checks.inventory=await page.evaluate(()=>Object.fromEntries(['laranjao','laranjao-fx','fujao','fujao-esquerda','pai-fujao','chupetinha'].map(id=>[id,Object.keys(window.__SPRITES[id]||{}).length])));assert.deepEqual(checks.inventory,{laranjao:40,'laranjao-fx':24,fujao:42,'fujao-esquerda':42,'pai-fujao':40,chupetinha:41});
 const tap=async id=>page.locator(`[data-action="${id}"]`).click();await tap('versus');await page.waitForFunction(()=>window.__app.screen==='select');await tap('pick-0');await tap('confirm-selection');await page.waitForFunction(()=>window.__app.screen==='selectFoe');await page.locator('[data-action^="pick-"]').filter({hasText:'LARANJÃO'}).click();await tap('confirm-selection');await confirmMap(page, 'washington');await page.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight');await page.evaluate(()=>{const a=window.__app;a.mode='training';a.dummy=0;a.st.training=true;cancelAnimationFrame(a.raf);});
 // Every animation must be requested through the real game renderer, on both facings.
 const m=JSON.parse(await readFile('production/sprites/source/laranjao-v1/runtime-manifest.json'));
 for(const face of[1,-1])for(const action of m.sequences.map(a=>a.name)){
  await page.evaluate(({face,action,states})=>{
   const a=window.__app,st=a.st,f=st.f[1],o=st.f[0],state=states[action];st.phase='fight';st.freeze=st.hitstop=0;st.ents=[];a.fx.parts=[];a.fx.pops=[];a.fx.shake=0;a.fx.banner=a.fx.big=null;a.fx.dark=0;
   Object.assign(o,{x:face>0?2050:350,y:0,state:'idle',sf:0,move:null,moveKey:null,stun:0,hp:10000});o.status.banished=0;
   Object.assign(f,{hp:10000,x:1200,y:state?.y||0,vy:0,vx:action==='andar-tras'?-face:face,face,super:3000,ginga:10000,state:state?.state||'attack',sf:state?.frames?.at(-1)||0,move:null,moveKey:null,stun:0,airGuard:false,crouchBlock:state?.crouchBlock||false,comboHits:state?.combo||1,hitDone:[],connected:null});f.status.banished=0;f.res.armor=0;
   if(action.startsWith('golpe-')){const key=action.slice(6).replace('-turbo',''),move=action.endsWith('-turbo')?f.ch.moves[key].turbo:f.ch.moves[key];Object.assign(f,{move,moveKey:key,sf:move.hits[0]?.from??move.spawn[0]?.at??move.startup+1,y:key.startsWith('j')?220:0});}
   a.render();
  },{face,action,states:STATE_ANIMS});
  console.log('scene',face,action);
  await page.waitForFunction(action=>window.__spriteLoadStatus('laranjao')[action]==='decoded',action);
  await page.evaluate(()=>window.__app.render());scenes.push({face,action});
  if(['parado','golpe-6S','golpe-4S','golpe-SA3','golpe-2S-turbo'].includes(action))await page.screenshot({path:`${out}/${face}-${action}.png`});
 }
 // Tick actual abilities, rather than only drawing synthetic effects.
 const fixture=async key=>page.evaluate(key=>{
  const a=window.__app,st=a.st,f=st.f[1],o=st.f[0];st.ents=[];st.events=[];st.phase='fight';st.freeze=st.hitstop=0;a.fx.parts=[];a.fx.pops=[];a.fx.shake=0;a.fx.big=a.fx.banner=null;
  Object.assign(o,{hp:10000,x:key==='4S'?1260:1000,y:0,vx:0,vy:0,state:'idle',sf:0,move:null,moveKey:null,stun:0});o.status.banished=0;
  const turbo=key.endsWith('-turbo'),k=key.replace('-turbo',''),move=turbo?f.ch.moves[k].turbo:f.ch.moves[k];Object.assign(f,{hp:10000,x:1400,y:0,vx:0,vy:0,face:-1,state:'attack',sf:0,moveKey:k,move,hitDone:[],connected:null,armorLeft:move.armor?.hits||0,super:3000,ginga:10000});Object.assign(f.res,{armor:0,taxAcc:0,prevGinga:o.ginga,prevSuper:o.super});f.status.banished=0;
 },key);
 for(const key of ['5S','2S','2S-turbo','6S','6S-turbo','4S','SA1','SA3']){
  await fixture(key);let result=await page.evaluate(key=>{const a=window.__app,events=[],kinds=new Set(),names=new Set();for(let n=0;n<90;n++){a.tick();for(const e of a.st.events)events.push(e.t);for(const e of a.st.ents)kinds.add(e.kind);for(const p of a.fx.parts)if(p.k==='laranjao')names.add(p.name);a.render();if(key==='SA3'&&events.includes('banish'))break;const f=a.st.f[1],m=f.move;const target=key==='2S-turbo'?16:(m?.hits[0]?.from??m?.spawn[0]?.at??8)+1;if(key!=='SA3'&&f.sf>=target)break;}return{events,kinds:[...kinds],names:[...names]};},key);
  if(key==='5S')assert.ok(result.kinds.includes('clone'));if(key.startsWith('2S'))assert.ok(result.kinds.includes('tuite'));if(key==='SA1')assert.ok(result.kinds.includes('muralha'));if(key==='SA3')assert.ok(result.events.includes('banish'));if(key==='4S')assert.ok(result.events.includes('hit'));checks[key]=result;
  await page.waitForTimeout(100);await page.evaluate(()=>window.__app.render());await page.screenshot({path:`${out}/ability-${key}.png`});
 }
 checks.return=await page.evaluate(()=>{const a=window.__app,states=[];let returned=false,landed=false,early=false;for(let n=0;n<250;n++){a.tick();const f=a.st.f[0];if(a.st.events.some(e=>e.t==='unbanish'))returned=true;if(returned&&f.y===0)landed=true;if(f.y>0&&a.fx.parts.some(p=>p.k==='laranjao'&&p.landed))early=true;a.render();if(returned)states.push(f.y);}return{returned,landed,early,airFrames:states.filter(y=>y>0).length};});assert.ok(checks.return.returned&&checks.return.landed&&!checks.return.early&&checks.return.airFrames>10);
 // Armor, damage stages, clone display and destruction in the live render pipeline.
 await fixture('5S');await page.evaluate(()=>{const a=window.__app;for(let n=0;n<14;n++)a.tick();a.st.f[1].res.armor=3;a.render();});await page.waitForTimeout(150);await page.evaluate(()=>window.__app.render());await page.screenshot({path:out+'/clones-armor.png'});
 await fixture('SA1');await page.evaluate(()=>{for(let n=0;n<35;n++)window.__app.tick();});
 for(let hp=6;hp>=1;hp--){await page.evaluate(hp=>{const a=window.__app,e=a.st.ents.find(e=>e.kind==='muralha');if(!e)throw Error('Missing wall');e.hp=hp;a.tick();a.render();},hp);await page.waitForTimeout(80);await page.evaluate(()=>window.__app.render());await page.screenshot({path:`${out}/wall-${hp}.png`});}
 await page.evaluate(()=>{const a=window.__app;a.st.ents=[];a.tick();a.render();});await page.waitForTimeout(80);await page.evaluate(()=>{for(let n=0;n<24;n++)window.__app.tick();window.__app.render();});await page.screenshot({path:out+'/wall-destruction.png'});
 checks.decoded=await page.evaluate(async()=>{let n=0;for(const id of ['laranjao','laranjao-fx'])for(const url of Object.values(window.__SPRITES[id])){const im=new Image();im.src=url;await im.decode();if(im.naturalWidth!==3000||im.naturalHeight!==500)throw Error('Invalid atlas '+url);n++;}return n;});assert.equal(checks.decoded,64);
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));window.__app.render();});await page.screenshot({path:out+'/mobile.png'});
 assert.deepEqual(errors,[]);const report={passed:true,scenes:scenes.length,checks,errors,date:new Date().toISOString()};await writeFile(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser?.close();server?.kill('SIGTERM');}
