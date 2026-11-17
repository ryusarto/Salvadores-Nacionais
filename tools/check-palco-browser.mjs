import {chromium} from 'playwright-core';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const plan=JSON.parse(readFileSync('production/stages/palco/PLANO.json','utf8'));
const expectedAssets=plan.groups.reduce((n,g)=>n+g.variants,0);
const expectedAudio=plan.groups.filter(g=>g.folder==='audio').reduce((n,g)=>n+g.variants,0);
assert.equal(expectedAssets,plan.summary.runtimeFiles??plan.summary.proposedRuntimeFiles,'planned inventory');
const executablePath=process.env.BROWSER_EXECUTABLE || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
assert.ok(executablePath,'Set BROWSER_EXECUTABLE to an installed Chromium browser');
let browser;
try{
browser=await chromium.launch({executablePath,headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(resolve('production/qa/palco-cenario-offline.html')).href);
await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
await page.evaluate(()=>window.palcoPreview.setFrame(0));
const status=await page.evaluate(()=>window.palcoPreview.status());
assert.ok(status.ready,'stage not ready');assert.deepEqual(status.errors,[]);
mkdirSync('production/qa/evidence',{recursive:true});
for(const camera of [0,340,680]){
 await page.evaluate(n=>window.palcoPreview.setCamera(n),camera);
 const image=await page.locator('#stage').evaluate(c=>c.toDataURL('image/png'));
 writeFileSync('production/qa/evidence/palco-camera-'+camera+'.png',Buffer.from(image.split(',')[1],'base64'));
}
await page.locator('#heroes').uncheck();
await page.evaluate(()=>window.palcoPreview.setCamera(340));
const clean=await page.locator('#stage').evaluate(c=>c.toDataURL('image/png'));
writeFileSync('production/qa/evidence/palco-composicao.png',Buffer.from(clean.split(',')[1],'base64'));
await page.screenshot({path:'production/qa/evidence/palco-preview.png',fullPage:false});
const before=await page.locator('#stage').evaluate(c=>c.toDataURL());
await page.waitForTimeout(100);
const after=await page.locator('#stage').evaluate(c=>c.toDataURL());
if(before!==after)throw Error('preview did not freeze after setFrame');
await page.locator('#gallery button').first().click();
await page.waitForTimeout(100);
if(await page.locator('#selected').textContent()==='Composição completa')throw Error('isolation failed');
await page.locator('#scene').click();
await page.setViewportSize({width:844,height:390});
await page.locator('#heroes').check();
await page.locator('#stage').screenshot({path:'production/qa/evidence/palco-mobile.png'});
const audio=await page.locator('audio').evaluateAll(async nodes=>Promise.all(nodes.map(async n=>{
 n.preload='auto';n.load();
 if(!n.readyState)await new Promise((yes,no)=>{const timer=setTimeout(()=>no(Error('audio metadata timeout')),20000);n.addEventListener('loadedmetadata',()=>{clearTimeout(timer);yes();},{once:true});n.addEventListener('error',()=>{clearTimeout(timer);no(Error(n.error?.message||'audio error'));},{once:true});});
 return {name:n.previousSibling?.textContent,ready:n.readyState,duration:n.duration,error:n.error?.message||null};
})));
const stats=await page.evaluate(()=>({assets:Object.keys(window.palcoPreview.pack.assets).length,images:Object.values(window.palcoPreview.pack.assets).filter(a=>a.kind!=='audio').length,gallery:document.querySelectorAll('#gallery article').length,canvas:[document.querySelector('#stage').width,document.querySelector('#stage').height]}));
assert.equal(stats.assets,expectedAssets);assert.equal(stats.gallery,stats.images);assert.deepEqual(stats.canvas,[1920,1080]);
assert.equal(audio.length,expectedAudio);assert.ok(audio.every(a=>!a.error&&a.duration>0));assert.deepEqual(errors,[]);
writeFileSync('production/qa/palco-browser.json',JSON.stringify({status,errors,audio,stats,pause:'pass',isolation:'pass',camera:[0,340,680]},null,2));
console.log(JSON.stringify({status,stats,errors}));
}finally{await browser?.close();}
