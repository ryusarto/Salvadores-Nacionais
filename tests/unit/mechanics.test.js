import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { fight, run, tap, I, has, BACK2 } from './helpers.js';

const ents = (st, kind) => st.ents.filter((e) => e.kind === kind);

test('Franco — Compasso: 2 especiais diferentes liberam o FINAL turbinado e mais forte', () => {
  const st = fight('franco', 'zanata', 200);
  const f = st.f[0];
  tap(st, { S: 1 }, 50); // Flash
  assert.deepEqual(f.res.notes, ['5S']);
  st.f[1].x = f.x + 200;
  tap(st, { S: 1 }, 50); // repetir não conta
  assert.equal(f.res.notes.length, 1);
  st.f[1].x = f.x + 200;
  tap(st, { y: -1, S: 1 }, 70, undefined, I()); // Pressão Nacional
  assert.equal(f.res.notes.length, 2);
  st.f[1].x = f.x + 220;
  run(st, 40);
  const g = f.ginga;
  const ev = tap(st, { x: 1, S: 1 }, 3);
  assert.ok(has(ev, 'finale'));
  assert.equal(f.move.isTurbo, true, 'o FINAL usa a versão turbinada');
  assert.ok(f.ginga >= g, 'e não gasta Ginga');
  assert.equal(f.res.notes.length, 0);
});

test('Belga — BPM: acertos sobem o ritmo, encurtam a recuperação e levar golpe derruba', () => {
  const st = fight('belga', 'zanata', 150);
  const f = st.f[0];
  const base = f.ch.moves['5L'].total;
  for (let i = 0; i < 3; i++) {
    st.f[1].x = f.x + 150;
    tap(st, { L: 1 }, 40);
  }
  assert.equal(f.res.bpm, 3);
  st.f[1].x = f.x + 150;
  tap(st, { L: 1 }, 0);
  assert.equal(f.move.total, base - 3);
  run(st, 60);
  st.f[1].x = f.x + 150;
  run(st, 1, I(), I({ L: 1 }));
  run(st, 12);
  assert.ok(f.res.bpm <= 2);
});

test('Majis — Frio: 3 acúmulos congelam o rival', () => {
  const st = fight('majis', 'zanata', 260);
  const d = st.f[1];
  for (let i = 0; i < 2; i++) {
    d.x = st.f[0].x + 260;
    tap(st, { x: 1, S: 1 }, 70, undefined, I());
    assert.equal(d.status.frost, i + 1);
  }
  d.x = st.f[0].x + 260;
  const ev = tap(st, { x: 1, S: 1 }, 30, undefined, I());
  assert.ok(has(ev, 'freeze'));
  assert.equal(d.state, 'frozen');
});

test('Trunks — Chamada: uma marca por vez, e o ataque cai depois do tempo', () => {
  const st = fight('trunks', 'zanata', 500);
  tap(st, { y: -1, S: 1 }, 40, undefined, I());
  assert.equal(ents(st, 'mark').length, 1);
  tap(st, { y: -1, S: 1 }, 40, undefined, I());
  assert.equal(ents(st, 'mark').length, 1, 'não cria segunda marca');
  const hp = st.f[1].hp;
  const ev = run(st, 110);
  assert.ok(has(ev, 'strike'));
  assert.ok(st.f[1].hp < hp, 'quem fica na marca é atingido');
});

test('Ryuchi — Postura: o Fio carrega com o tempo e o contra-ataque responde a um golpe', () => {
  let st = fight('ryuchi', 'zanata', 320);
  const f = st.f[0];
  run(st, 1, I({ y: -1, S: 1 }));
  run(st, 100, I({ S: 1 }));
  assert.equal(f.moveKey, '2S');
  run(st, 2);
  assert.equal(f.moveKey, 'stRel3', 'segurar tudo solta o corte do Fio pleno');
  run(st, 12);
  assert.equal(st.f[1].state, 'crumple');

  st = fight('ryuchi', 'zanata', 320);
  run(st, 1, I({ y: -1, S: 1 }));
  run(st, 12, I({ S: 1 }));
  run(st, 1, I({ S: 1 }));
  run(st, 2);
  assert.equal(st.f[0].moveKey, 'stRel0', 'soltar cedo dá o corte fraco');

  st = fight('ryuchi', 'zanata', 180);
  run(st, 1, I({ y: -1, S: 1 }));
  run(st, 12, I({ S: 1 }));
  run(st, 1, I({ S: 1, M: 1 }), I({ L: 1 }));
  const ev = run(st, 30, I({ S: 1 }));
  assert.equal(st.f[0].hp, st.f[0].maxHp, 'o contra-ataque não toma dano');
  assert.ok(ev.some((e) => e.t === 'hit' && e.side === 0));
});

test("M'Dep — Rajada: Embalo emenda um especial em outro; pulo duplo", () => {
  const st = fight('mdep', 'zanata', 170);
  const f = st.f[0];
  tap(st, { L: 1 }, 30);
  assert.equal(f.res.embalo, 1);
  st.f[1].x = f.x + 200;
  tap(st, { S: 1 }, 12); // Bicuda acerta
  assert.equal(f.connected, 'hit');
  const ev = tap(st, { x: 1, S: 1 }, 14, undefined, I());
  assert.equal(f.moveKey, '6S', 'cancelou Bicuda em Rajada');
  assert.equal(f.res.embalo, 0);
  assert.ok(ev.some((e) => e.t === 'pop'));

  const s2 = fight('mdep', 'zanata', 900);
  run(s2, 20, I({ y: 1 }));
  run(s2, 2);
  const vy = s2.f[0].vy;
  run(s2, 2, I({ y: 1 }));
  assert.ok(s2.f[0].vy > vy + 10, 'segundo pulo no ar');
});

test('Chapuh — Tinta e Pinscher: poça faz escorregar; cachorro tem tempo de volta', () => {
  const st = fight('chapuh', 'zanata', 700);
  const f = st.f[0];
  tap(st, { S: 1 }, 45);
  assert.equal(ents(st, 'paint').length, 1);
  const p = ents(st, 'paint')[0];
  st.f[1].x = p.x + 160;
  const ev = run(st, 40, I(), I({ x: -1 }));
  assert.ok(has(ev, 'slip'));
  assert.equal(ents(st, 'paint').length, 0);

  tap(st, { x: 1, S: 1 }, 40, undefined, I());
  assert.ok(f.res.dog > 0);
  const n = st.ents.length;
  const ev2 = tap(st, { x: 1, S: 1 }, 20, undefined, I());
  assert.ok(ev2.some((e) => e.t === 'pop'), 'sem cachorro disponível');
});

test('Dney — Munição: tiros gastam balas, sem bala falha, recarga e Tiro Certeiro', () => {
  const st = fight('dney', 'zanata', 800);
  const f = st.f[0];
  for (let i = 0; i < 5; i++) tap(st, { S: 1 }, 45);
  assert.equal(f.res.ammo, 1);
  const hp = st.f[1].hp;
  const ev = tap(st, { S: 1 }, 45);
  assert.ok(ev.some((e) => e.t === 'pop' && e.str === 'TIRO CERTEIRO!'));
  assert.equal(f.res.ammo, 0);
  assert.equal(hp - st.f[1].hp, Math.round(480 * 1.5 * SYS.SCALING[0]));
  run(st, 80);
  tap(st, { S: 1 }, 2);
  assert.equal(f.moveKey, 'click');
  run(st, 40);
  run(st, 1, I({ y: -1, S: 1 }));
  run(st, 70, I({ y: -1, S: 1 }));
  run(st, 20);
  assert.equal(f.res.ammo, 6, 'segurar recarrega tudo');
});

test('Zanata — Fúria: com pouca vida o chicote recupera mais rápido', () => {
  const st = fight('zanata', 'franco', 900);
  const f = st.f[0];
  const base = f.ch.moves['5S'].total;
  f.hp = f.maxHp * 0.3;
  const ev = run(st, 2);
  assert.ok(has(ev, 'fury'));
  tap(st, { S: 1 }, 0);
  assert.equal(f.move.total, base - 5);
});
