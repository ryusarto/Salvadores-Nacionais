import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readRgbaPng, alphaBounds, upperSkinLandmark } from '../../tools/lib/png-rgba.js';
import { fight, run, I } from './helpers.js';
import { animFor } from '../../src/render/anim.js';
const root=new URL('../../production/sprites/source/majis-v2/quadros-768/',import.meta.url);
const frame=(name,i=1)=>readRgbaPng(readFileSync(new URL(`${name}-${i}.png`,root)));

test('forward plus keyboard L uses the corrected Majis heavy strip',()=>{
  const st=fight('majis','zanata',700);
  // Keyboard L maps to logical H; forward has no 6H and therefore selects 5H.
  run(st,1,I({x:1,H:1}));
  assert.equal(st.f[0].moveKey,'5H');
  assert.equal(animFor(st.f[0],0).name,'golpe-5H');
});

test('Majis heavy wind-up, overhead and victory keep the actual idle pixel height',()=>{
  const reference=alphaBounds(frame('parado'));
  for(const name of ['golpe-5H','golpe-6M','vitoria']){
    const first=alphaBounds(frame(name));
    assert.ok(Math.abs(first.h-reference.h)<=reference.h*.03,`${name}: ${first.h}px versus idle ${reference.h}px`);
    for(let i=1;i<=4;i++){
      const bounds=alphaBounds(frame(name,i));
      assert.ok(bounds.h<=reference.h*1.05,`${name} frame ${i} grows to ${bounds.h}px`);
      assert.ok(bounds.bottom>=698&&bounds.bottom<=702,`${name} frame ${i} lost the foot pivot`);
    }
  }
});

test('corrected compact poses do not enlarge the Majis head to fill a cell',()=>{
  const reference=upperSkinLandmark(frame('parado'));
  for(const name of ['golpe-5H','golpe-6M','vitoria','golpe-jH','golpe-2S','pulo','defesa-no-ar']){
    const landmark=upperSkinLandmark(frame(name));
    assert.ok(landmark,`${name}: missing color landmark`);
    assert.ok(landmark.w<=reference.w*1.1,`${name}: head landmark ${landmark.w}px versus idle ${reference.w}px`);
    assert.ok(landmark.w>=reference.w*.85,`${name}: overcorrected head scale`);
  }
});
