/** Capture the actual Belém composition without fighter references. */
import{chromium}from'playwright-core';import{writeFileSync,existsSync}from'node:fs';import{resolve}from'node:path';import{pathToFileURL}from'node:url';import sharp from'sharp';
const executablePath=process.env.BROWSER_EXECUTABLE||['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium'].find(existsSync);let browser;
try{
 browser=await chromium.launch({executablePath,headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('production/qa/belem-cenario-offline.html')).href);await page.waitForFunction(()=>!!window.__belemPreview);
 await page.evaluate(()=>window.__belemPreview.render(340,0,false));if(errors.length)throw Error(errors.join('\n'));
 const buffer=Buffer.from(await page.locator('#stage').evaluate(c=>c.toDataURL().split(',')[1]),'base64');writeFileSync('production/stages/belem/source/composicao.png',buffer);
 await sharp(buffer).webp({quality:95}).toFile('production/stages/belem/ui/carregamento.webp');await sharp(buffer).resize(960,540).webp({quality:93}).toFile('production/stages/belem/ui/miniatura.webp');
 console.log(JSON.stringify({stage:'belem',camera:340,frame:0,fighters:false,errors}));
}finally{await browser?.close();}
