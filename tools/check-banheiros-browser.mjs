import {chromium} from 'playwright-core';
import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const executablePath=process.env.BROWSER_EXECUTABLE || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
assert.ok(executablePath,'Set BROWSER_EXECUTABLE to an installed Chromium browser');
let browser;
try{
 browser=await chromium.launch({executablePath,headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('production/qa/banheiros-cenario-offline.html')).href);
 await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
 await page.evaluate(()=>window.banheirosPreview.setFrame(0));
 const status=await page.evaluate(()=>window.banheirosPreview.status());
 assert.ok(status.ready);assert.deepEqual(status.errors,[]);
 assert.deepEqual(await page.evaluate(()=>window.banheirosPreview.errors),[]);
 mkdirSync('production/qa/evidence',{recursive:true});
 const canvas=()=>page.locator('#stage').evaluate(c=>c.toDataURL('image/png'));
 const save=async name=>writeFileSync('production/qa/evidence/banheiros-'+name+'.png',Buffer.from((await canvas()).split(',')[1],'base64'));
 for(const camera of [0,340,680]){await page.evaluate(n=>window.banheirosPreview.setCamera(n),camera);await save('camera-'+camera);}
 await page.locator('#heroes').uncheck();
 await page.evaluate(()=>window.banheirosPreview.setCamera(340));await save('composicao');
 await page.screenshot({path:'production/qa/evidence/banheiros-preview.png',fullPage:false});
 const before=await canvas();await page.waitForTimeout(150);assert.ok((await canvas())===before,'fixed preview frame must freeze');
 const stats=await page.evaluate(()=>({assets:Object.keys(window.banheirosPreview.pack.assets).length,images:Object.values(window.banheirosPreview.pack.assets).filter(a=>a.kind!=='audio').length,gallery:document.querySelectorAll('#gallery article').length,canvas:[document.querySelector('#stage').width,document.querySelector('#stage').height]}));
 assert.equal(stats.assets,69);assert.equal(stats.gallery,stats.images);assert.deepEqual(stats.canvas,[1920,1080]);
 // Isolate one animated item, rather than a static thumbnail only.
 const article=page.locator('#gallery article').filter({has:page.getByRole('heading',{name:'npc-acolhimento',exact:true})});
 await article.getByRole('button',{name:'Ver isolado'}).click();
 assert.equal(await page.locator('#selected').textContent(),'npc-acolhimento');
 await save('asset-isolado');await page.locator('#scene').click();
 assert.equal(await page.locator('#selected').textContent(),'Composição completa');
 // Reduced effects must freeze environmental motion at any simulation frame.
 await page.locator('#reduce').check();
 await page.evaluate(()=>window.banheirosPreview.setFrame(0));const reduced=await canvas();
 await page.evaluate(()=>window.banheirosPreview.setFrame(120));assert.ok((await canvas())===reduced,'reduced effects must freeze all environmental motion');
 await page.locator('#reduce').uncheck();await page.evaluate(()=>window.banheirosPreview.setFrame(24));
 assert.ok((await canvas())!==reduced,'normal environmental animation should advance');
 await page.locator('#effects').uncheck();const withoutFx=await canvas();
 await page.locator('#effects').check();assert.ok((await canvas())!==withoutFx,'effects toggle should affect composition');
 await page.evaluate(()=>window.banheirosPreview.setInteractive(true,5));const intact=await canvas();await save('interativos-inteiros');
 await page.evaluate(()=>window.banheirosPreview.setInteractive(true,1));assert.ok((await canvas())!==intact,'damage overlay should change');await save('interativos-danificados');
 await page.evaluate(()=>window.banheirosPreview.setInteractive(false));
 await page.setViewportSize({width:844,height:390});await page.locator('#heroes').check();
 await page.locator('#stage').screenshot({path:'production/qa/evidence/banheiros-mobile.png'});
 const audio=await page.locator('audio').evaluateAll(async nodes=>Promise.all(nodes.map(async n=>{
  n.preload='auto';n.load();
  if(!n.readyState)await new Promise((yes,no)=>{const timer=setTimeout(()=>no(Error('audio metadata timeout')),20000);n.addEventListener('loadedmetadata',()=>{clearTimeout(timer);yes();},{once:true});n.addEventListener('error',()=>{clearTimeout(timer);no(Error(n.error?.message||'audio error'));},{once:true});});
  return {name:n.previousSibling?.textContent,ready:n.readyState,duration:n.duration,error:n.error?.message||null};
 })));
 assert.equal(audio.length,6);assert.ok(audio.every(a=>!a.error&&a.duration>0));assert.deepEqual(errors,[]);
 const report={status,errors,audio,stats,pause:'pass',isolation:'pass',reducedEffects:'pass',effectsToggle:'pass',interactiveDamageOverlay:'pass',camera:[0,340,680],mobileViewport:[844,390],limitation:'Viewport emulation only; physical-device performance and human playtest not assessed.'};
 writeFileSync('production/qa/banheiros-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();}
