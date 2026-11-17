/** Derive UI images from the actual assembled scene, never a separate mockup. */
import{chromium}from'playwright-core';import{writeFileSync,existsSync}from'node:fs';import{resolve}from'node:path';import{pathToFileURL}from'node:url';import sharp from'sharp';
const executablePath=process.env.BROWSER_EXECUTABLE||['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium'].find(existsSync);
const stage='mansao';if(!['mansao'].includes(stage))throw Error('Unknown stage '+stage);
let browser;try{
 browser=await chromium.launch({executablePath,headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('production/qa/'+stage+'-cenario-offline.html')).href);await page.waitForFunction(()=>document.body.dataset.ready==='true');
 await page.evaluate(stage=>{const p=window[stage+'Preview'];p.setZone?.(false);p.setFrame(0);p.setCamera(340);const h=document.querySelector('#heroes');h.checked=false;h.dispatchEvent(new Event('change'));},stage);
 if(errors.length)throw Error(errors.join('\n'));const buf=Buffer.from(await page.locator('#stage').evaluate(c=>c.toDataURL().split(',')[1]),'base64');
 writeFileSync('production/stages/'+stage+'/source/composicao.png',buf);
 await sharp(buf).webp({quality:90}).toFile('production/stages/'+stage+'/ui/carregamento.webp');await sharp(buf).resize(960,540).webp({quality:90}).toFile('production/stages/'+stage+'/ui/miniatura.webp');
 console.log(JSON.stringify({stage,frame:0,camera:340,heroes:false,ui:['carregamento','miniatura'],errors}));
}finally{await browser?.close();}
