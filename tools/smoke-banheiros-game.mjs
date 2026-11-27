import { completedStoryFixture, confirmMap } from './menu-smoke-helpers.mjs';
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const executablePath=process.env.BROWSER_EXECUTABLE || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
assert.ok(executablePath,'Set BROWSER_EXECUTABLE to an installed Chromium browser');
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1'],{stdio:['ignore','pipe','pipe']});
let port,output='',browser;
server.stdout.on('data',d=>{output+=d;port=+(output.match(/port (\d+)/)?.[1]||0);});
server.stderr.on('data',d=>{output+=d;});
try{
 for(let i=0;i<400&&!port;i++){if(server.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,50));}
 assert.ok(port,output);
 browser=await chromium.launch({executablePath,headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await completedStoryFixture(page);await page.goto('http://127.0.0.1:'+port+'/production/qa/banheiros-game.html');
 await page.waitForFunction(()=>window.__app?.frame>10&&!document.getElementById('loading'),null,{timeout:90000});
 const stageRequests=()=>requests.filter(x=>x.includes('/stages/banheiros/'));
 assert.equal(stageRequests().length,0,'banheiros must not download in title menu');
 const tap=async id=>page.locator('[data-action="'+id+'"]').click();
 await tap('versus');await page.waitForFunction(()=>window.__app.screen==='select');
 await tap('pick-1');await tap('confirm-selection');await page.waitForFunction(()=>window.__app.screen==='selectFoe');
 assert.equal(stageRequests().length,0,'banheiros must not download before foe selection');
 await tap('pick-10');await tap('confirm-selection');await confirmMap(page, 'banheiros');
 await page.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight');
 await page.waitForFunction(()=>window.__stageArtStatus('banheiros').ready,null,{timeout:90000});
 await page.waitForFunction(()=>window.__stageAudioStatus().decoded===6,null,{timeout:90000});
 const info=await page.evaluate(()=>({stage:window.__stageArtStatus('banheiros'),audio:window.__stageAudioStatus(),foe:window.__app.foe.id,hasPavanassiSprites:!!Object.keys(window.__SPRITES?.pavanassi||{}).length}));
 assert.equal(info.foe,'pavanassi');assert.equal(info.audio.stage,'banheiros');assert.equal(info.audio.decoded,6);assert.deepEqual(info.stage.errors,[]);assert.deepEqual(info.audio.errors,[]);
 await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__app.paused);
 const before=await page.evaluate(()=>window.__app.st.frame);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__app.st.frame),before);
 // Freeze the app loop; exercise the actual core modules, with explicit fixture positions.
 // No gameplay function or rule is patched. Render these real states in the built game.
 await page.evaluate(async()=>{
  cancelAnimationFrame(window.__app.raf);
  const {createMatch,step}=await import('/src/core/match.js');
  const {ALL}=await import('/src/data/characters/index.js');
  const {spawnEntity}=await import('/src/core/entities.js');
  const {proj}=await import('/src/data/movekit.js');
  const {PAV}=await import('/src/data/characters/pavanassi.js');
  const {createFx}=await import('/src/render/fx.js');
  const {encounterStage}=await import('/src/data/stages.js');
  const empty={x:0,y:0,L:0,M:0,H:0,S:0,G:0,T:0,X:0};
  const fresh=(gap=700)=>{const st=createMatch({chars:[ALL.belga,ALL.pavanassi],seed:1});st.phase='fight';st.f[0].x=1200;st.f[1].x=1200+gap;return st;};
  const run=(st,n,i0={},i1={})=>{const events=[];for(let i=0;i<n;i++){step(st,{...empty,...i0},{...empty,...i1});events.push(...st.events);}return events;};
  const cabin=()=>{const st=fresh();run(st,1,{}, {y:-1,S:1});run(st,40);if(!st.ents.some(e=>e.kind==='cabine'))throw Error('real 2S did not generate a cabin');return st;};
  const show=st=>{const a=window.__app;a.st=st;a.mode='training';a.dummy=0;a.paused=false;a.cam=340;a.fx=createFx();st.training=true;st.pf=240;a.render();};
  const scenes={},result={};
  const intact=cabin();const cab=intact.ents.find(e=>e.kind==='cabine');
  if(cab.hp!==PAV.cabinHp)throw Error('initial cabin hp');scenes.intact=intact;
  // Keep character definitions (functions) by using fresh actual states for every capture.
  const damaged=cabin(),dc=damaged.ents.find(e=>e.kind==='cabine');damaged.f[0].x=dc.x-200;
  spawnEntity(damaged,damaged.f[0],proj({x:100,y:250,vx:16,dmg:500}));run(damaged,20);
  if(!(dc.hp>0&&dc.hp<PAV.cabinHp))throw Error('projectile did not damage cabin');result.cabinHP={initial:PAV.cabinHp,damaged:dc.hp};scenes.damaged=damaged;
  const trapped=cabin(),tc=trapped.ents.find(e=>e.kind==='cabine');trapped.f[0].x=tc.x-100;run(trapped,1);
  if(trapped.f[0].state!=='frozen'||trapped.f[0].status.queue!==tc.id)throw Error('cabin queue trap failed');result.queue='pass';scenes.trapped=trapped;
  const fence=fresh(520);run(fence,1,{}, {x:-1,S:1});run(fence,40);
  const fe=fence.ents.find(e=>e.kind==='cerca');if(!fe||fe.hp!==PAV.fenceHp)throw Error('real 6S did not generate fence');scenes.fence=fence;result.fence='pass';
  const banned=fresh(500);run(banned,1,{}, {S:1});run(banned,60);
  if(banned.f[0].status.ban?.what!=='S')throw Error('stamp ban failed');result.ban='pass';scenes.banned=banned;
  const asked=cabin(),ac=asked.ents.find(e=>e.kind==='cabine');asked.f[0].x=ac.x-200;run(asked,10);const hp=asked.f[1].hp;
  const events=run(asked,2,{G:1,T:1});run(asked,2);
  if(!events.some(e=>e.t==='emotional')||hp-asked.f[1].hp!==PAV.emotional||asked.f[1].state!=='dizzy'||asked.ents.some(e=>e.kind==='cabine'))throw Error('A PERGUNTA failed');
  result.pergunta={damage:hp-asked.f[1].hp,state:asked.f[1].state,cabinRemoved:true};scenes.asked=asked;
  const a=window.__app;if(encounterStage(a)!=='banheiros')throw Error('incorrect arena routing');
  window.__banheirosQA={scenes,result,show};
 });
 mkdirSync('production/qa/evidence',{recursive:true});
 for(const scene of ['intact','damaged','trapped','fence','banned','asked']){
  await page.evaluate(name=>window.__banheirosQA.show(window.__banheirosQA.scenes[name]),scene);
  const png=await page.locator('#game').evaluate(c=>c.toDataURL('image/png'));
  writeFileSync('production/qa/evidence/banheiros-pavanassi-'+scene+'.png',Buffer.from(png.split(',')[1],'base64'));
 }
 const mechanics=await page.evaluate(()=>window.__banheirosQA.result);
 assert.deepEqual(errors,[]);
 const report={info,errors,lazyTitle:'pass',lazySelection:'pass',pause:'pass',mechanics,fixtures:'Real 2S/6S/5S core moves, deterministic step; hero positions adjusted for trap/question and a real projectile used for damage. Captures rendered by the built game after stopping its loop.',pavanassiArt:info.hasPavanassiSprites?'sprite pack present':'Expected procedural mannequin fallback; no Pavanassi sprite pack delivered.'};
 writeFileSync('production/qa/banheiros-game-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{try{await browser?.close();}finally{server.kill('SIGTERM');}}
