import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSprites,prepareSprites,decodedSpriteNames,drawSprite} from '../../src/render/sprites.js';
import {registerStageArt,requestStageArt,loadStageArt,drawStageArt,drawStageProp,stageArtStatus} from '../../src/render/stage-packs.js';

function imageFixture(t){
 const previous={Image:globalThis.Image,fetch:globalThis.fetch,OffscreenCanvas:globalThis.OffscreenCanvas};
 t.after(()=>Object.assign(globalThis,previous));
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});
 globalThis.Image=class {
  naturalWidth=3000;naturalHeight=500;width=3000;height=500;
  set src(url){this.url=url;queueMicrotask(()=>this.onload?.());}
  async decode(){}
 };
}
const drawing=()=>({calls:[],globalAlpha:1,save(){},restore(){},translate(){},scale(){},drawImage(...a){this.calls.push(a);},fillRect(){},createLinearGradient(){return {addColorStop(){}};}});
const spriteOpts={lazy:true,trueAlpha:true,frames:6,cellSize:500,preload:[],prefetch:false,material:false};

test('supplemental empty or FX-only preparation keeps both selected bodies drawable',async t=>{
 imageFixture(t);
 const hero='selected-hero',boss='selected-boss',fx=boss+'-fx';
 await registerSprites(hero,{parado:'hero-idle'},spriteOpts);
 await registerSprites(boss,{parado:'boss-idle'},spriteOpts);
 await registerSprites(fx,{'fx-impacto':'boss-impact'},spriteOpts);
 await prepareSprites([hero,boss,fx]);
 // Non-Zanata fights have no extra FX list; Zanata warms a subset after the body.
 await prepareSprites([],['fx-impacto'],{activate:false});
 await prepareSprites([fx],['fx-impacto'],{activate:false});
 for(const [id,url] of [[hero,'hero-idle'],[boss,'boss-idle']]){
  assert.deepEqual(decodedSpriteNames(id),['parado']);
  const c=drawing();
  assert.equal(drawSprite(c,{ch:{id,spriteProfile:'six-frame'},state:'idle',face:1,sf:0},0),true);
  assert.equal(c.calls[0][0].url,url);
 }
 assert.deepEqual(decodedSpriteNames(fx),['fx-impacto']);
});

test('a late supplemental preload cannot reactivate a cancelled fighter or discard the next selection',async t=>{
 imageFixture(t);
 const old='old-boss',fx=old+'-fx',current='next-hero';
 await registerSprites(old,{parado:'old-idle'},spriteOpts);
 await registerSprites(fx,{'fx-impacto':'old-impact'},spriteOpts);
 await registerSprites(current,{parado:'next-idle'},spriteOpts);
 await prepareSprites([old,fx]);
 await prepareSprites([current]);
 await prepareSprites([fx],['fx-impacto'],{activate:false});
 assert.deepEqual(decodedSpriteNames(old),[]);
 assert.deepEqual(decodedSpriteNames(fx),[]);
 assert.deepEqual(decodedSpriteNames(current),['parado']);
});

function canvasFixture(){
 globalThis.OffscreenCanvas=class {
  constructor(width,height){this.width=width;this.height=height;this.ctx=drawing();}
  getContext(){return this.ctx;}
 };
}
const stagePack=()=>({
 layers:[{asset:'sky',factor:0,width:1920,height:1080}],essential:['sky'],
 objects:[{asset:'decor',x:500,y:820,w:200}],foreground:[],
 interactive:['cabin'],
 assets:{sky:{url:'sky'},decor:{url:'decor'},cabin:{url:'cabin',crop:[20,10,230,480]},floor:{url:'floor'}},
});

test('runtime baking releases decorative atlases but keeps independently drawn gameplay props',async t=>{
 imageFixture(t);canvasFixture();
 registerStageArt({baked:stagePack()});
 await requestStageArt('baked');
 assert.equal(stageArtStatus('baked').prepared,true,'exercise the real prepared branch');
 const c=drawing();assert.equal(drawStageArt(c,'baked',340,0),true);
 assert.equal(c.calls.length,2,'one backdrop and one preassembled decorative layer');
 const prop=drawing();
 assert.equal(drawStageProp(prop,'baked','cabin',{x:2500,y:930,w:190,h:420}),true);
 assert.equal(prop.calls[0][0].url,'cabin');
 assert.deepEqual(prop.calls[0].slice(1),[20,10,230,480,2405,510,190,420]);
 assert.equal(drawStageProp(drawing(),'baked','decor',{x:100,y:930,w:100,h:100}),false,'the original decorative atlas is no longer retained');
});

test('explicit art previews remain editable after loading even when browser baking is available',async t=>{
 imageFixture(t);canvasFixture();
 const pack=stagePack();pack.ground={asset:'floor'};
 await loadStageArt({editable:pack});
 assert.equal(stageArtStatus('editable').prepared,false);
 const complete=drawing();drawStageArt(complete,'editable',340,0);
 assert.ok(complete.calls.some(([image])=>image.url==='decor'));
 assert.ok(complete.calls.some(([image])=>image.url==='floor'));
 pack.objects=[];pack.ground=null;
 const filtered=drawing();drawStageArt(filtered,'editable',340,0);
 assert.deepEqual(filtered.calls.map(([image])=>image.url),['sky'],'object and floor preview controls affect the next frame');
});
