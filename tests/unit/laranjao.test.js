import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { LAR } from '../../src/data/characters/laranjao.js';
import { applyHit } from '../../src/core/combat.js';
import { fight, run, tap, I, has } from './helpers.js';

const clones = (st) => st.ents.filter((e) => e.kind === 'clone');

test('Laranjão — Fake News: duas cópias; golpe na cópia é gasto e não machuca o verdadeiro', () => {
  const st = fight('trunks', 'laranjao', 300);
  const [h, l] = st.f;
  run(st, 1, I(), I({ S: 1 }));
  run(st, 20);
  assert.equal(clones(st).length, LAR.clones);
  // o herói ataca a cópia mais perto
  const c = clones(st).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
  if (Math.abs(c.x - h.x) > Math.abs(l.x - h.x)) l.x = c.x + 400; // garante a cópia na frente
  h.x = c.x - 150;
  h.face = 1;
  const hp = l.hp;
  const ev = tap(st, { M: 1 }, 20);
  assert.ok(ev.some((e) => e.t === 'decoy'), 'acertou a cópia');
  assert.equal(clones(st).length, LAR.clones - 1);
  assert.equal(l.hp, hp, 'o verdadeiro não apanhou');
});

test('Laranjão — Tarifa Suprema: o Super gasto pelo herói vira armadura que anula golpes', () => {
  const st = fight('chapuh', 'laranjao', 200);
  const [h, l] = st.f;
  h.super = 3000;
  run(st, 2);
  const ev = [...tap(st, { X: 1 }, 2), ...run(st, 120)]; // 3000 gastos: metade vira 1 carga e meia
  assert.ok(ev.some((e) => e.t === 'pop' && e.str === 'TARIFA SUPREMA! +1 ARMADURA'));
  // o próprio super acertou e gastou a carga; com uma carga, o golpe seguinte é anulado
  l.res.armor = 1;
  const armor = l.res.armor;
  const m = h.ch.moves['5M'];
  l.state = 'idle';
  l.comboHits = 0;
  st.events = [];
  applyHit(st, h, l, m.hits[0], { type: 'move', m });
  assert.equal(st.events.find((e) => e.t === 'hit').dmg, 1);
  assert.equal(l.res.armor, armor - 1);
});

test('Laranjão — THE WALL: a muralha não dá para pular', () => {
  const st = fight('trunks', 'laranjao', 600);
  const [h, l] = st.f;
  l.super = 1000;
  run(st, 1, I(), I({ y: -1, X: 1 }));
  run(st, 80); // pausa do super + preparação
  const wall = st.ents.find((e) => e.kind === 'muralha');
  assert.ok(wall, 'a muralha caiu');
  h.x = wall.x - 150;
  run(st, 1, I({ y: 1, x: 1 }));
  run(st, 60, I({ x: 1 }));
  assert.ok(h.x < wall.x, 'não passou por cima');
});

test("Laranjão — You're Fired!: o herói some, não apanha e cai de volta tomando dano", () => {
  const st = fight('trunks', 'laranjao', 300);
  const [h, l] = st.f;
  const m = l.ch.moves.SA3;
  applyHit(st, l, h, m.hits[0], { type: 'move', m });
  assert.ok(h.status.banished > 0);
  const hp = h.hp;
  // enquanto demitido, nada acerta
  const m5 = l.ch.moves['5M'];
  assert.equal(applyHit(st, l, h, m5.hits[0], { type: 'move', m: m5 }), 'miss');
  const ev = run(st, LAR.banish + 2);
  assert.ok(has(ev, 'unbanish'));
  assert.equal(hp - h.hp, LAR.banishDmg);
  assert.ok(h.y > 0 || h.state === 'air_hit' || h.state === 'knockdown');
});
