import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import franco from '../../src/data/characters/franco.js';
import { animFor, STATE_ANIMS } from '../../src/render/anim.js';
import { createFx, fxEvents } from '../../src/render/fx.js';

test('Franco has dedicated art for every move, state and turbo', () => {
  for (const name of [...Object.keys(STATE_ANIMS), ...Object.keys(franco.moves).map(k => 'golpe-' + k), ...Object.keys(franco.moves).filter(k => franco.moves[k].turbo).map(k => 'golpe-' + k + '-turbo')]) {
    assert.ok(existsSync(new URL('../../production/sprites/final/franco/' + name + '.webp', import.meta.url)), name);
    assert.ok(!franco.spriteAlias[name]);
  }
  for (const [key, m] of Object.entries(franco.moves)) {
    for (const sf of [m.hits[0]?.from ?? m.startup + 1, m.hits.at(-1)?.to ?? m.startup + m.active]) {
      assert.equal(animFor({ ch:franco, state:'attack', move:m, moveKey:key, sf },0).index,2,key);
    }
    if (m.turbo) assert.equal(animFor({ ch:franco,state:'attack',move:m.turbo,moveKey:key,sf:1 },0).name,'golpe-'+key+'-turbo');
  }
});

test('suction is triggered by a confirmed Obra-Prima hit, never a miss or block', () => {
  const actor={ch:franco,x:1000,y:0,side:0,face:1,sf:20};
  const st={f:[actor,{x:1300,y:0}],events:[{t:'block',side:0,key:'SA3',x:1300,y:300}]};
  const fx=createFx(); fxEvents(fx,st);
  assert.ok(!fx.parts.some(p=>p.k==='absorb'));
  st.events=[{t:'hit',side:0,key:'SA3',x:1300,y:300}];fxEvents(fx,st);
  assert.equal(fx.parts.filter(p=>p.k==='absorb').length,1);
  fxEvents(fx,st);assert.equal(fx.parts.filter(p=>p.k==='absorb').length,1);
  assert.equal(fx.parts.find(p=>p.k==='absorb').side,1);
});
