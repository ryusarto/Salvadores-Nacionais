import test from 'node:test';
import assert from 'node:assert/strict';
import franco from '../../src/data/characters/franco.js';
import {registerSprites,prepareSprites,drawSprite,decodedSpriteNames} from '../../src/render/sprites.js';

function imageFixture(t) {
  const previous={Image:globalThis.Image,fetch:globalThis.fetch};
  t.after(()=>Object.assign(globalThis,previous));
  const pending=[];
  let hold=false;
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});
  globalThis.Image=class {
    naturalHeight=768;
    set src(url) {
      this.url=url;this.naturalWidth=url.endsWith('-first')?768:9216;
      if(hold)pending.push(this);else queueMicrotask(()=>this.onload());
    }
  };
  return {pending,hold(){hold=true;},release(){hold=false;pending.splice(0).forEach(img=>img.onload());}};
}
const options={lazy:true,trueAlpha:true,frames:12,cellSize:768,preload:[],prefetch:false,pinIdle:false,maxDecoded:1,material:false,warmAll:true};
const context=()=>{const drawn=[];return {drawn,save(){},restore(){},translate(){},scale(){},drawImage(...args){drawn.push(args);}};};

test('the exact full-resolution first drawing replaces the previous action while its strip decodes',async t=>{
  const images=imageFixture(t),id='dense-poster-test';
  await registerSprites(id,{parado:'idle',andar:'walk','golpe-5L':'attack'},{...options,posters:{parado:'idle-first',andar:'walk-first','golpe-5L':'attack-first'}});
  await prepareSprites([id]);
  assert.deepEqual(decodedSpriteNames(id),['golpe-5L']);
  const f={ch:{...franco,id,spriteProfile:'twelve-frame'},state:'attack',move:franco.moves['5L'],moveKey:'5L',sf:5,face:1,vx:0,vy:0,y:0};
  const c=context();
  assert.equal(drawSprite(c,f,0),true);
  assert.equal(c.drawn.at(-1)[0].url,'attack');
  images.hold();f.state='idle';f.sf=0;
  assert.equal(drawSprite(c,f,0),true);
  assert.equal(c.drawn.at(-1)[0].url,'idle-first');
  assert.deepEqual(c.drawn.at(-1).slice(1,5),[0,0,768,768]);
  assert.equal(images.pending.length,1);
  images.release();await Promise.resolve();
  drawSprite(c,f,0);
  assert.equal(c.drawn.at(-1)[0].url,'idle');
  assert.deepEqual(decodedSpriteNames(id),['parado']);
});

test('a late image from a cancelled selection cannot restore an inactive decoded pack',async t=>{
  const images=imageFixture(t);
  await registerSprites('cancelled-pack',{parado:'cancelled'},options);
  await registerSprites('selected-pack',{parado:'selected'},options);
  images.hold();
  const old=prepareSprites(['cancelled-pack']);
  const current=prepareSprites(['selected-pack']);
  images.release();await Promise.all([old,current]);
  assert.deepEqual(decodedSpriteNames('cancelled-pack'),[]);
  assert.deepEqual(decodedSpriteNames('selected-pack'),['parado']);
  await prepareSprites(['cancelled-pack']);
  assert.deepEqual(decodedSpriteNames('cancelled-pack'),['parado']);
  assert.deepEqual(decodedSpriteNames('selected-pack'),[]);
});

test('independently drawn directions use the same alternate costume colors',async()=>{
  const {recolorAlt}=await import('../../src/render/sprites.js');
  const colors=new Uint8ClampedArray([180,180,180,255,150,90,60,255,80,65,90,255]);
  assert.deepEqual(recolorAlt(colors.slice(),'franco-esquerda'),recolorAlt(colors.slice(),'franco'));
});
