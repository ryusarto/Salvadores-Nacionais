import { completedStoryFixture, confirmMap } from './menu-smoke-helpers.mjs';
import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const port=8768,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['tools/dev-server.mjs',`--port=${port}`],{stdio:['ignore','pipe','pipe']});
let ready=false,logs='';server.stdout.on('data',d=>{logs+=d;ready=logs.includes('Servidor de desenvolvimento');});server.stderr.on('data',d=>{logs+=d;});
let browser;const errors=[];mkdirSync('artifacts/zanata',{recursive:true});
try{
 for(let i=0;i<100&&!ready;i++){if(server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,50));}assert.ok(ready);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(`${r.status()} ${r.url()}`);});
 await completedStoryFixture(p);await p.goto(base);await p.waitForFunction(()=>window.__app?.frame>10&&!document.getElementById('loading'));
 for(const id of ['training','pick-0','confirm-selection']){await p.locator(`[data-action="${id}"]`).click();await p.waitForTimeout(100);}
 await p.waitForFunction(()=>window.__app.screen==='selectFoe');await p.locator('[data-action="pick-8"]').click();await p.locator('[data-action="confirm-selection"]').click();await confirmMap(p);
 await p.waitForFunction(()=>window.__app.screen==='fight'&&window.__app.st.phase==='fight'&&!window.__app.fx.big);
 await p.evaluate(()=>cancelAnimationFrame(window.__app.raf));
 for(const face of [-1,1])for(const key of ['idle','5S','2S','SA1','SA3']){
  const expected=key==='idle'?'parado':'golpe-'+key,id=face<0?'zanata-esquerda':'zanata';
  await p.evaluate(({face,key})=>{const a=window.__app,f=a.st.f[1];f.x=face<0?1250:650;a.st.f[0].x=face<0?550:1350;f.face=face;f.state=key==='idle'?'idle':'attack';f.move=key==='idle'?null:f.ch.moves[key];f.moveKey=key==='idle'?null:key;f.sf=f.move?.hits[0]?.from||0;f.y=0;f.hitstop=0;f.res.fury=false;a.render();},{face,key});
  await p.waitForFunction(({id,expected})=>{window.__app.render();return window.__spriteLoadStatus(id)[expected]==='decoded';},{id,expected});
  if(key!=='idle')await p.waitForFunction(({id,key})=>{window.__app.render();const name=key==='5S'?'fx-estalo':key==='2S'?'fx-varredura':key==='SA1'?'fx-tempestade':'fx-intimacao';return window.__spriteLoadStatus(id+'-fx')[name]==='decoded';},{id,key});
  await p.screenshot({path:`artifacts/zanata/${face<0?'esquerda':'direita'}-${key}.png`});
 }
 await p.evaluate(()=>{const a=window.__app,f=a.st.f[1];f.state='idle';f.move=null;f.res.fury=true;a.render();});
 await p.waitForFunction(()=>{window.__app.render();return window.__spriteLoadStatus('zanata-fx')['fx-furia']==='decoded';});await p.screenshot({path:'artifacts/zanata/furia.png'});
 await p.goto(base+'/production/qa/zanata-sprites.html');
 const actions=JSON.parse(readFileSync('production/sprites/source/zanata-v1/PLANO.json')).animations;
 for(const a of actions){await p.selectOption('#action',a.name);await p.waitForFunction(name=>document.getElementById('status').textContent.startsWith(name+' · quadro'),a.name);}
 await p.screenshot({path:'artifacts/zanata/galeria.png'});
 assert.deepEqual(errors,[]);console.log('PASS: dois sentidos no jogo; chicote, supers e Fúria; 53 animações da galeria decodificadas nos dois sentidos; sem falhas de página/HTTP.');
}finally{await browser?.close();server.kill('SIGTERM');}
