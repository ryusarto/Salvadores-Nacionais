import { completedStoryFixture, confirmMap } from './menu-smoke-helpers.mjs';
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const server=spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1'],{stdio:['ignore','pipe','pipe']});
let port,output='',browser;
server.stdout.on('data',d=>{output+=d;port=+(output.match(/port (\d+)/)?.[1]||0);});
server.stderr.on('data',d=>{output+=d;});
try{
 for(let i=0;i<400&&!port;i++){if(server.exitCode!==null)throw Error(output);await new Promise(r=>setTimeout(r,50));}
 assert.ok(port,output);
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>requests.push(r.url()));
 await completedStoryFixture(page);await page.goto('http://127.0.0.1:'+port+'/production/qa/palco-game.html');
 await page.waitForFunction(()=>window.__app?.frame>10&&!document.getElementById('loading'));
 assert.equal(requests.filter(x=>x.includes('/stages/palco/')).length,0,'palco should not download in title menu');
 const tap=async id=>page.locator('[data-action="'+id+'"]').click();
 await tap('versus');await page.waitForFunction(()=>window.__app.screen==='select');
 await tap('pick-1');await tap('confirm-selection');
 await page.waitForFunction(()=>window.__app.screen==='selectFoe');
 await tap('pick-9');await tap('confirm-selection');await confirmMap(page, 'palco');
 await page.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight');
 await page.waitForFunction(()=>window.__stageArtStatus('palco').ready);
 await page.evaluate(()=>{
  const a=window.__app;a.mode='training';a.dummy=0;a.st.training=true;a.st.pf=180;
  a.st.f[0].x=850;a.st.f[1].x=1700;
  const r=a.st.f[1].res;r.live=true;r.signal=3;r.offT=0;r.lastHp=a.st.f[1].hp;
 });
 await page.waitForTimeout(200);
 mkdirSync('production/qa/evidence',{recursive:true});
 const png=await page.locator('#game').evaluate(c=>c.toDataURL());
 writeFileSync('production/qa/evidence/palco-chupetinha-ao-vivo.png',Buffer.from(png.split(',')[1],'base64'));
 await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__app.paused);
 const before=await page.evaluate(()=>window.__app.st.frame);await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>window.__app.st.frame),before);
 const info=await page.evaluate(()=>({stage:window.__stageArtStatus('palco'),audio:window.__stageAudioStatus(),foe:window.__app.foe.id}));
 assert.equal(info.foe,'chupetinha');assert.equal(info.audio.stage,'palco');
 assert.equal(info.stage.errors.length,0);assert.equal(errors.length,0);
 writeFileSync('production/qa/palco-game-browser.json',JSON.stringify({info,errors,lazyTitle:'pass',pause:'pass',phone:'captured active with three signal bars'},null,2));
 console.log(JSON.stringify({info,errors,pause:'pass',lazyTitle:'pass'}));
}finally{await browser?.close();server.kill('SIGTERM');}
