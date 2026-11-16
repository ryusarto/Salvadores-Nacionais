import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { LIVE } from '../../src/data/characters/chupetinha.js';
import { fight, run, tap, I, has } from './helpers.js';

const liveOn = (d) => Object.assign(d.res, { live: true, signal: LIVE.signal, offT: 0, lastHp: d.hp });

test('Chupetinha — ao apanhar, liga a live: ESTÃO ME CENSURANDO!', () => {
  const st = fight('trunks', 'chupetinha', 150);
  const d = st.f[1];
  assert.equal(d.res.live, false);
  const ev = tap(st, { L: 1 }, 20);
  assert.ok(has(ev, 'hit'));
  assert.equal(d.res.live, true);
  assert.equal(d.res.signal, LIVE.signal);
  assert.ok(ev.some((e) => e.t === 'pop' && e.str === 'ESTÃO ME CENSURANDO!'));
});

test('Chupetinha — com a live no ar, 25% do dano volta como vida', () => {
  const st = fight('trunks', 'chupetinha', 150);
  const d = st.f[1];
  liveOn(d);
  const before = d.hp;
  const ev = tap(st, { L: 1 }, 20);
  const dmg = ev.filter((e) => e.t === 'hit').reduce((s, e) => s + e.dmg, 0);
  assert.ok(dmg > 0);
  assert.equal(before - d.hp, dmg - Math.round(dmg * LIVE.heal));
});

test('Chupetinha — cada golpe no celular derruba uma barra; sem sinal, a live cai', () => {
  const st = fight('trunks', 'chupetinha', 120);
  const d = st.f[1];
  liveOn(d);
  tap(st, { y: -1, H: 1 }, 50); // Gancho alcança o celular sobre a cabeça
  assert.equal(d.res.signal, LIVE.signal - 1);
  d.res.signal = 1;
  st.f[1].x = st.f[0].x + 120;
  run(st, 30);
  const ev = tap(st, { y: -1, H: 1 }, 30);
  assert.equal(d.res.live, false);
  assert.ok(d.res.offT > 0);
  assert.ok(ev.some((e) => e.t === 'live' && e.on === false));
  // sem sinal, apanhar não religa a live nem cura
  const hp = d.hp;
  st.f[1].x = st.f[0].x + 150;
  run(st, 30);
  const ev2 = tap(st, { L: 1 }, 20);
  const dmg = ev2.filter((e) => e.t === 'hit').reduce((s, e) => s + e.dmg, 0);
  assert.equal(d.res.live, false);
  assert.equal(hp - d.hp, dmg);
});

test('Chupetinha — o flash da câmera do Franco derruba a live de uma vez', () => {
  const st = fight('franco', 'chupetinha', 200);
  const d = st.f[1];
  liveOn(d);
  const ev = tap(st, { H: 1 }, 40);
  assert.equal(d.res.live, false);
  assert.ok(ev.some((e) => e.t === 'pop' && e.str === 'FLASH! SEM SINAL!'));
});

test('Chupetinha — a Sugada rouba um gomo de Ginga', () => {
  const st = fight('chupetinha', 'franco', 170);
  const f = st.f[0];
  const d = st.f[1];
  f.ginga = SYS.GINGA.max - 2 * SYS.GINGA.pip;
  const g0 = d.ginga;
  const ev = tap(st, { x: 1, S: 1 }, 2);
  run(st, 30);
  assert.ok(has(ev, 'hit') || d.ginga < g0, 'a Sugada acertou');
  assert.ok(d.ginga <= g0 - LIVE.suck + SYS.GINGA.regen * 40, 'o rival perdeu um gomo');
  assert.ok(f.ginga > SYS.GINGA.max - 2 * SYS.GINGA.pip, 'o Chupetinha ganhou Ginga');
});
