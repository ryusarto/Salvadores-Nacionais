import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
const port=Number(process.env.SMOKE_PORT||8767),base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['tools/dev-server.mjs',`--port=${port}`],{stdio:['ignore','pipe','pipe']});
let output='',ready=false;server.stdout.on('data',s=>{output+=s;ready=output.includes('Servidor de desenvolvimento');});server.stderr.on('data',s=>{output+=s;});
let browser;
mkdirSync('artifacts/smoke',{recursive:true});
const errors=[];
async function load(context){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});await page.goto(base);await page.waitForFunction(()=>window.__app?.frame>10&&!document.getElementById('loading'));return page;}
async function tap(page,id){await page.locator(`[data-action="${id}"]`).click();}
try{
 for(let i=0;i<100&&!ready;i++){if(server.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,50));}assert.ok(ready,output);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const desktop=await browser.newContext({viewport:{width:1280,height:720}}),p=await load(desktop);
 await tap(p,'story');await p.waitForFunction(()=>window.__app.screen==='select');await tap(p,'pick-0');await tap(p,'confirm-selection');
 await p.waitForFunction(()=>window.__app.screen==='storyIntro');
 assert.deepEqual(await p.evaluate(()=>window.__app.story.fights),[{foe:'zanata',kind:'boss'}]);
 // Advance the actual page/menu inputs; the very first opponent must be Zanata.
 for(let i=0;i<4;i++){await tap(p,'next');await p.waitForTimeout(70);}
 await p.waitForFunction(()=>window.__app.screen==='storyMap');await tap(p,'next');await p.waitForFunction(()=>window.__app.screen==='storyTalk');
 for(let i=0;i<4;i++){await tap(p,'next');await p.waitForTimeout(70);}
 await p.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight');
 assert.equal(await p.evaluate(()=>window.__app.foe.id),'zanata');
 await p.screenshot({path:'artifacts/smoke/story-zanata.png'});
 await p.keyboard.press('Enter');await p.waitForFunction(()=>window.__app.paused);await tap(p,'pause-6');await p.waitForFunction(()=>window.__app.screen==='title');
 await tap(p,'versus');await p.waitForFunction(()=>window.__app.screen==='select');await tap(p,'pick-0');await tap(p,'confirm-selection');await p.waitForFunction(()=>window.__app.screen==='selectFoe');
 // All sixteen choices must fit above the description panel in desktop coordinates.
 const rects=await p.locator('[data-action^="pick-"]').evaluateAll(items=>items.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,bottom:r.bottom}}));
 assert.equal(rects.length,16);assert.ok(rects.every(r=>r.bottom<746*720/1080));
 await p.screenshot({path:'artifacts/smoke/rival-selector.png'});
 await tap(p,'pick-14');await tap(p,'confirm-selection');await p.waitForFunction(()=>window.__app.screen==='fight');assert.equal(await p.evaluate(()=>window.__app.foe.id),'djabo');
 const audio=await p.evaluate(()=>window.__stageAudioStatus());assert.equal(audio.stage,'inferno');assert.equal(audio.started,false,'não reutiliza música/ambiente de Belém');
 const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}),m=await load(mobile);
 await m.screenshot({path:'artifacts/smoke/mobile-title.png'});
 assert.equal(await m.locator('#dpad').isVisible(),false);await tap(m,'training');await m.waitForFunction(()=>window.__app.screen==='select');await tap(m,'pick-0');await tap(m,'confirm-selection');
 await m.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight');
 await m.locator('#training-tools [data-k="dummy"]').tap();await m.waitForFunction(()=>window.__app.dummy===1);
 await m.locator('#training-tools [data-k="boxes"]').tap();await m.waitForFunction(()=>window.__app.boxes);
 assert.ok(await m.locator('[data-k="T"]').isVisible());await m.screenshot({path:'artifacts/smoke/mobile-training.png'});
 await m.setViewportSize({width:390,height:844});await m.waitForFunction(()=>window.__app.systemPaused);
 const before=await m.evaluate(()=>window.__app.st.frame);await m.waitForTimeout(500);assert.equal(await m.evaluate(()=>window.__app.st.frame),before);
 await m.setViewportSize({width:844,height:390});await m.waitForFunction(()=>!window.__app.systemPaused);assert.ok(await m.evaluate(()=>window.__app.paused));
 await tap(m,'pause-0');await m.waitForFunction(()=>!window.__app.paused);
 await m.locator('#tpause').tap();await m.waitForFunction(()=>window.__app.paused);await tap(m,'pause-6');await m.waitForFunction(()=>window.__app.screen==='title');
 await tap(m,'settings');await m.waitForFunction(()=>window.__app.screen==='settings');await tap(m,'leftHanded');await tap(m,'largeButtons');await tap(m,'reducedEffects');await tap(m,'back');await m.waitForFunction(()=>window.__app.screen==='title');
 await m.reload();await m.waitForFunction(()=>window.__app?.frame>10&&!document.getElementById('loading'));
 assert.deepEqual(await m.evaluate(()=>window.__app.preferences),{reducedEffects:true,leftHanded:true,largeButtons:true});
 await tap(m,'tutorial');await m.waitForFunction(()=>window.__app.screen==='select');await tap(m,'pick-0');await tap(m,'confirm-selection');await m.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight');
 assert.equal(await m.evaluate(()=>window.__app.lesson.index),0);
 // Tutorial completion cannot be manufactured by skipping: skipped steps remain separate.
 await m.locator('[data-k="skip"]').tap();await m.waitForFunction(()=>window.__app.lesson.index===1);
 assert.deepEqual(await m.evaluate(()=>window.__app.lesson.skipped),[0]);assert.equal(await m.evaluate(()=>window.__app.lesson.passed.length),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: campanha começa na Zanata; seletor completo; áudio por arena; menus e ferramentas touch; pausa por orientação; opções persistidas; tutorial distingue etapas puladas.');
}finally{await browser?.close();server.kill('SIGTERM');}
