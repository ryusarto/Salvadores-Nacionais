import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { DJ, demon } from '../../src/data/characters/djabo.js';
import { applyHit } from '../../src/core/combat.js';
import { fight, run, tap, I, has } from './helpers.js';

const hitDjabo = (st, dmg = 99999) => {
  const [h, d] = st.f;
  const m = h.ch.moves['5L'];
  st.events = [];
  return applyHit(st, h, d, { ...m.hits[0], dmg }, { type: 'move', m });
};

test('Djabo — zerar a vida na primeira forma vira o Demônio com a vida cheia', () => {
  const st = fight('trunks', 'djabo', 160);
  const d = st.f[1];
  assert.equal(d.ch.form, 1);
  hitDjabo(st);
  assert.ok(has(st.events, 'transform'));
  assert.notEqual(d.state, 'ko');
  assert.equal(d.ch, demon);
  assert.equal(d.hp, d.maxHp);
  assert.equal(d.ch.look.hair, 'horns');
  // durante a transformação, nada acerta
  assert.equal(hitDjabo(st, 500), 'miss');
  run(st, DJ.transformFrames + 5);
  // na segunda forma, zerar a vida derruba de verdade
  hitDjabo(st);
  assert.ok(has(st.events, 'ko'));
  assert.equal(d.state, 'ko');
});

test('Djabo — golpes roubados: o Carimbo proíbe golpes e a Sugada rouba Ginga', () => {
  const st = fight('trunks', 'djabo', 500);
  const [h, d] = st.f;
  run(st, 1, I(), I({ S: 1 }));
  run(st, 60);
  assert.ok(h.status.ban, 'carimbado');
  const st2 = fight('trunks', 'djabo', 160);
  const [h2, d2] = st2.f;
  d2.ginga = SYS.GINGA.max - 2 * SYS.GINGA.pip;
  const g0 = h2.ginga;
  const m = d2.ch.moves['4S'];
  st2.events = [];
  applyHit(st2, d2, h2, m.hits[0], { type: 'move', m });
  assert.ok(h2.ginga <= g0 - DJ.suck);
  assert.ok(d2.ginga > SYS.GINGA.max - 2 * SYS.GINGA.pip);
});

test('Djabo — Coluna do Inferno avisa no chão antes de subir', () => {
  const st = fight('trunks', 'djabo', 600);
  const d = st.f[1];
  d.ch = demon;
  run(st, 1, I(), I({ y: -1, S: 1 }));
  run(st, 16);
  const col = st.ents.find((e) => e.kind === 'coluna');
  assert.ok(col && col.delay > 0, 'o aviso aparece antes');
  assert.ok(Math.abs(col.x - st.f[0].x) < 5, 'em cima do herói');
});

test('Djabo — Inferno Nacional: fogo no chão inteiro, menos o trecho seguro', () => {
  const st = fight('trunks', 'djabo', 400);
  const [h, d] = st.f;
  d.super = SYS.SUPER.max;
  run(st, 1, I(), I({ X: 1 }));
  run(st, 70);
  const fire = st.ents.filter((e) => e.kind === 'chao-fogo');
  assert.ok(fire.length > 3);
  const [sl, sr] = d.res.safe;
  for (const e of fire) assert.ok(e.x + e.w / 2 <= sl + 1 || e.x - e.w / 2 >= sr - 1, 'nenhum fogo no trecho seguro');
  // no trecho seguro, não toma dano; fora dele, toma
  h.x = (sl + sr) / 2;
  const hp = h.hp;
  run(st, 60);
  assert.equal(h.hp, hp);
  h.x = sl - 200 > SYS.WALL_PAD ? sl - 200 : sr + 200;
  run(st, 60);
  assert.ok(h.hp < hp);
});
