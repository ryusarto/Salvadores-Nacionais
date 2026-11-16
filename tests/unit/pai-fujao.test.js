import test from 'node:test';
import assert from 'node:assert/strict';
import { PAI } from '../../src/data/characters/pai-fujao.js';
import { fight, run, tap, I, has } from './helpers.js';
import { applyHit } from '../../src/core/combat.js';

const place = (st, gap = 150) => {
  st.f[1].x = PAI.zoneX;
  st.f[0].x = PAI.zoneX - gap;
  run(st, 2);
};
const hits = (ev) => ev.filter((e) => e.t === 'hit' && e.side === 0);

test('Pai do Fujão — Foro Privilegiado: os 3 primeiros golpes do combo não fazem dano', () => {
  const st = fight('trunks', 'pai-fujao', 150);
  place(st);
  const [h, p] = st.f;
  const m = h.ch.moves['5M'];
  const dmg = [];
  for (let i = 0; i < 4; i++) {
    st.events = [];
    applyHit(st, h, p, m.hits[0], { type: 'move', m });
    dmg.push(hits(st.events)[0].dmg);
  }
  assert.deepEqual(dmg.slice(0, 3), [1, 1, 1]);
  assert.ok(dmg[3] > 100, `quarto golpe: ${dmg[3]}`);
  // e o super fura a imunidade desde o primeiro golpe
  const st2 = fight('chapuh', 'pai-fujao', 150);
  const sa = st2.f[0].ch.moves.SA1;
  applyHit(st2, st2.f[0], st2.f[1], sa.hits[0], { type: 'move', m: sa });
  assert.ok(hits(st2.events)[0].dmg > 100);
});

test('Pai do Fujão — o agarrão fura a imunidade', () => {
  const st = fight('trunks', 'pai-fujao', 120);
  place(st, 120);
  const hp = st.f[1].hp;
  tap(st, { T: 1 }, 60);
  assert.ok(hp - st.f[1].hp > 500);
});

test('Pai do Fujão — andando, não sai da área; empurrado para fora, a tornozeleira dá choque', () => {
  const st = fight('trunks', 'pai-fujao', 150);
  const p = st.f[1];
  place(st, 900);
  run(st, 200, I(), I({ x: 1 }));
  assert.ok(Math.abs(p.x - PAI.zoneX) <= PAI.zoneR + 1, 'parou na borda');
  // empurrado para fora
  const st2 = fight('trunks', 'pai-fujao', 150);
  const p2 = st2.f[1];
  p2.x = PAI.zoneX + PAI.zoneR + 40;
  p2.state = 'hitstun';
  p2.stun = 20;
  const hp = p2.hp;
  const ev = run(st2, 2);
  assert.ok(has(ev, 'shock'));
  assert.equal(hp - p2.hp, PAI.shockDmg);
  assert.equal(p2.state, 'dizzy');
});

test('Pai do Fujão — Vingança Paterna abaixo de metade da vida', () => {
  const st = fight('trunks', 'pai-fujao', 150);
  const p = st.f[1];
  assert.equal(p.ch.mech.dmgMul(p), 1);
  p.hp = Math.floor(p.maxHp * PAI.furyHp) - 1;
  const ev = run(st, 2);
  assert.ok(has(ev, 'fury'));
  assert.equal(p.ch.mech.dmgMul(p), PAI.furyDmg);
});

test('Pai do Fujão — a ligação manda um capanga; a linha fica ocupada', () => {
  const st = fight('trunks', 'pai-fujao', 700);
  place(st, 700);
  run(st, 1, I(), I({ S: 1 }));
  run(st, 20);
  assert.ok(st.ents.some((e) => e.kind === 'capanga'));
  assert.ok(st.f[1].res.callT > 0);
  run(st, 60);
  const ev = run(st, 1, I(), I({ S: 1 }));
  ev.push(...run(st, 20));
  assert.ok(ev.some((e) => e.t === 'pop' && e.str === 'LINHA OCUPADA'));
});

test('Pai do Fujão — depois de segurar 6 golpes, o foro é cassado e volta depois', () => {
  const st = fight('trunks', 'pai-fujao', 150);
  place(st);
  const [h, p] = st.f;
  const m = h.ch.moves['5L'];
  const dmg = [];
  for (let i = 0; i < 7; i++) {
    p.comboHits = i % 3; // vários combos curtos
    st.events = [];
    applyHit(st, h, p, m.hits[0], { type: 'move', m });
    dmg.push(hits(st.events)[0].dmg);
  }
  assert.deepEqual(dmg.slice(0, 6), [1, 1, 1, 1, 1, 1]);
  assert.ok(dmg[6] > 100, 'com o foro cassado, o primeiro golpe já faz dano');
  p.state = 'idle';
  p.comboHits = 0;
  run(st, PAI.foroDown + 2);
  assert.equal(p.res.foro, PAI.foroCharges);
});
