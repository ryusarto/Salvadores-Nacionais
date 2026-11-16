import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { FUGA, isCornered } from '../../src/data/characters/fujao.js';
import { fight, run, tap, I, has } from './helpers.js';

const combo = (st) => {
  const ev = [];
  for (const b of ['L', 'L', 'M', 'H']) ev.push(...tap(st, { [b]: 1 }, 9));
  return ev;
};

test('Fujão — longe do canto, foge no segundo golpe do combo', () => {
  const st = fight('trunks', 'fujao', 150);
  const h = st.f[0];
  const p = st.f[1];
  assert.ok(!isCornered(p));
  const x0 = p.x;
  const ev = combo(st);
  assert.ok(has(ev, 'escape'), 'fugiu');
  assert.ok(p.res.escapeCD > 0);
  run(st, 30);
  assert.ok(p.x - x0 > 250, `correu para longe (${Math.round(p.x - x0)})`);
  assert.ok(st.ents.some((e) => e.kind === 'mala'), 'largou uma mala');
});

test('Fujão — encurralado, não foge e o combo entra inteiro', () => {
  const st = fight('trunks', 'fujao', 150);
  const h = st.f[0];
  const p = st.f[1];
  p.x = SYS.STAGE_W - SYS.WALL_PAD - 40;
  h.x = p.x - 150;
  run(st, 2);
  assert.ok(isCornered(p));
  const ev = combo(st);
  assert.ok(!has(ev, 'escape'));
  assert.ok(ev.filter((e) => e.t === 'hit' && e.side === 0).length >= 3);
});

test('Fujão — sozinho perto da escada, embarca e recupera vida; chegar perto nega', () => {
  const st = fight('trunks', 'fujao', 150);
  const h = st.f[0];
  const p = st.f[1];
  p.x = FUGA.stairsX;
  h.x = p.x - 900;
  p.hp = Math.round(p.maxHp * 0.5);
  const hp = p.hp;
  run(st, FUGA.boardFrames + 5);
  assert.equal(p.hp, hp + Math.round(p.maxHp * FUGA.boardHeal));
  // de novo, mas com o herói chegando perto no meio
  const st2 = fight('trunks', 'fujao', 150);
  const p2 = st2.f[1];
  p2.x = FUGA.stairsX;
  st2.f[0].x = p2.x - 900;
  p2.hp = Math.round(p2.maxHp * 0.5);
  run(st2, 40);
  st2.f[0].x = p2.x - 300;
  const ev = run(st2, 80);
  assert.ok(ev.some((e) => e.t === 'pop' && e.str === 'EMBARQUE NEGADO!'));
  assert.equal(p2.hp, Math.round(p2.maxHp * 0.5));
});

test('Fujão — quem corre por cima da mala esquecida tropeça', () => {
  const st = fight('trunks', 'fujao', 500);
  const h = st.f[0];
  run(st, 1, I(), I({ y: -1, S: 1 }));
  run(st, 20);
  const mala = st.ents.find((e) => e.kind === 'mala');
  assert.ok(mala);
  let slipped = false;
  for (let i = 0; i < 120 && !slipped; i++) slipped = has(run(st, 1, I({ x: 1 })), 'slip');
  assert.ok(slipped);
});
