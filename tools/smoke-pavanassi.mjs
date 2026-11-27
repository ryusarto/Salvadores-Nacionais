import { completedStoryFixture, confirmMap } from './menu-smoke-helpers.mjs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';

// Exercises the built game, including lazy decoding. PAVANASSI_BASE_URL also
// allows the same check against Pages after deployment, without interception.
const base=process.env.PAVANASSI_BASE_URL||'http://127.0.0.1:8770';
const out='artifacts/pavanassi';mkdirSync(out,{recursive:true});
let server,browser,output='';const errors=[],snapshots=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 if(!process.env.PAVANASSI_BASE_URL){server=spawn(process.execPath,['tools/dev-server.mjs','--port=8770'],{stdio:['ignore','pipe','pipe']});server.stdout.on('data',s=>output+=s);server.stderr.on('data',s=>output+=s);for(let n=0;n<100&&!output.includes('Servidor de desenvolvimento');n++){if(server.exitCode!==null)throw Error(output);await pause(50)}assert.ok(output.includes('Servidor de desenvolvimento'),output)}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`)});
 await completedStoryFixture(page);await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__app?.frame>10&&!document.getElementById('loading'));
 const inventory=await page.evaluate(()=>Object.fromEntries(['pavanassi','pavanassi-esquerda','pavanassi-fx'].map(id=>[id,Object.keys(window.__SPRITES[id]||{}).length])));
 assert.deepEqual(inventory,{pavanassi:41,'pavanassi-esquerda':41,'pavanassi-fx':16});
 const tap=async id=>page.locator(`[data-action="${id}"]`).click();
 await tap('versus');await page.waitForFunction(()=>window.__app.screen==='select');await tap('pick-0');await tap('confirm-selection');await page.waitForFunction(()=>window.__app.screen==='selectFoe');
 await page.locator('[data-action^="pick-"]').filter({hasText:'PAVANASSI'}).click();await tap('confirm-selection');await confirmMap(page, 'banheiros');await page.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight');
 assert.equal(await page.evaluate(()=>window.__app.foe.id),'pavanassi');
 await page.evaluate(()=>{const a=window.__app;a.mode='training';a.dummy=0;a.st.training=true;cancelAnimationFrame(a.raf)});
 for(const face of [1,-1])for(const key of ['idle','5L','5H','5S','6S','6S-turbo','2S','4S','SA1','SA3']){
  await page.evaluate(({key,face})=>{
   const a=window.__app,st=a.st,f=st.f[1],o=st.f[0],base=key.replace('-turbo',''),m=key.endsWith('-turbo')?f.ch.moves[base].turbo:f.ch.moves[base];
   st.phase='fight';st.phaseT=0;st.freeze=0;st.hitstop=0;st.ents=[];a.fx.parts=[];a.fx.shake=0;a.fx.banner=null;a.fx.dark=0;a.fx.big=null;
   Object.assign(o,{hp:10000,x:face>0?1550:850,y:0,vy:0,state:'idle',sf:0,move:null,moveKey:null,stun:0});
   Object.assign(f,{hp:12200,x:1200,y:0,vy:0,face,super:3000,ginga:10000,state:key==='idle'?'idle':'attack',sf:0,move:m||null,moveKey:base,hitDone:[],connected:null,armorLeft:m?.armor?.hits||0,holdT:0,mashN:0,mashLoops:0});
   f.res.prevBtn={};f.res.emotionalArt=false;o.status.ban=null;o.status.queue=null;
   if(key!=='idle'){const target=base==='4S'?8:base==='SA3'?48:base==='SA1'?10:base==='2S'?34:base==='6S'?m.startup+12:m.startup;let n=0;while(f.state==='attack'&&f.sf<target&&n++<500)a.tick()}
   a.render();
  },{key,face});
  const action=key==='idle'?'parado':'golpe-'+key,pack=face>0?'pavanassi':'pavanassi-esquerda';
  await page.waitForFunction(({pack,action})=>window.__spriteLoadStatus(pack)[action]==='decoded',{pack,action});
  // Entity and impact layers requested by the actual render must finish decoding.
  await page.waitForFunction(()=>Object.values(window.__spriteLoadStatus('pavanassi-fx')).every(s=>s==='registered'||s==='decoded'));
  const state=await page.evaluate(()=>{window.__app.render();const f=window.__app.st.f[1];return{state:f.state,sf:f.sf,face:f.face,entities:window.__app.st.ents.map(e=>({kind:e.kind,hp:e.hp}))}});
  assert.equal(state.face,face);assert.equal(state.state,key==='idle'?'idle':'attack');snapshots.push({key,pack,action,...state});
  await page.screenshot({path:`${out}/${face>0?'right':'left'}-${key}.png`});
 }
 // Every published strip, including unused reactions and break layers, decodes.
 const decoded=await page.evaluate(async()=>{let count=0;for(const id of ['pavanassi','pavanassi-esquerda','pavanassi-fx'])for(const url of Object.values(window.__SPRITES[id])){const image=new Image();image.src=url;await image.decode();if(image.naturalWidth!==3000||image.naturalHeight!==500)throw Error(url);image.src='';count++}return count});assert.equal(decoded,98);
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{window.dispatchEvent(new Event('resize'));window.__app.render()});await page.screenshot({path:`${out}/mobile.png`});
 const gallery=new URL('../production/qa/pavanassi-v1.html',page.url()).href;
 await page.goto(gallery);assert.match(await page.locator('#status').innerText(),/98 \/ 98/);
 await page.selectOption('#side','fx');await page.waitForFunction(()=>cards.every(({im})=>im.complete&&im.naturalWidth===3000));
 assert.equal(await page.locator('article').count(),8);await page.screenshot({path:`${out}/gallery.png`});
 assert.deepEqual(errors,[]);const report={url:base,date:new Date().toISOString(),inventory,decoded,snapshots,errors};writeFileSync(`${out}/result.json`,JSON.stringify(report,null,2)+'\n');
 console.log(`PASS: Pavanassi — ${snapshots.length} cenas nos dois sentidos; ${decoded} tiras decodificadas; desktop/celular; sem erros HTTP ou JavaScript.`);
}finally{await browser?.close();server?.kill('SIGTERM')}
