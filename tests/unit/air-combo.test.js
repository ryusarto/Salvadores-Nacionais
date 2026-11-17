import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES } from '../../src/data/characters/index.js';
import { createMatch, step } from '../../src/core/match.js';
import { EMPTY_INPUT } from '../../src/core/input.js';
import { SYS } from '../../src/data/system.js';

const hero = (id) => HEROES.find((h) => h.id === id);

/** Gancho a `dist`, persegue com o pulo alto e aperta os botões aéreos na ordem dada. */
function launchAndJuggle(h, order, dist = 240) {
  const st = createMatch({ chars: [h, hero(h.id === 'franco' ? 'belga' : 'franco')], seed: 1, training: true });
  st.phase = 'fight';
  st.f[0].x = 1000;
  st.f[1].x = 1000 + dist;
  let phase = 'open', k = 0, prev = {}, airHits = 0, jumps = 0;
  for (let i = 0; i < 300; i++) {
    const me = st.f[0];
    const inp = { ...EMPTY_INPUT };
    if (phase === 'open') { inp.y = -1; inp.H = i < 3 ? 1 : 0; if (me.connected === 'hit') phase = 'chase'; }
    else if (phase === 'chase') { inp.y = 1; if (me.state === 'air' && me.sj) phase = 'air'; }
    else {
      const ready = me.state === 'air' || (me.state === 'attack' && me.move.air && me.connected && me.sf > me.move.startup);
      const want = order[k % order.length];
      if (ready && !prev[want]) inp[want] = 1;
      if (i % 9 === 0) inp.y = 1; // tenta pular de novo no ar: não pode
      if (me.state === 'attack' && me.move.air && me.sf === 1) k++;
      if (me.y <= 0 && i > 20) break;
    }
    prev = inp;
    const hp = st.f[1].hp;
    step(st, inp, EMPTY_INPUT);
    for (const e of st.events) if (e.t === 'jump' && e.side === 0) jumps++;
    if (st.f[1].hp < hp && phase === 'air') airHits++;
  }
  return { phase, airHits, jumps };
}

test('o Gancho levanta, o pulo alto persegue e o combo aéreo é livre (qualquer ordem)', () => {
  for (const order of [['L', 'M', 'H'], ['M', 'L', 'M', 'L', 'H'], ['L', 'L', 'L', 'L', 'L', 'L']]) {
    const r = launchAndJuggle(hero('belga'), order);
    assert.equal(r.phase, 'air', order.join(''));
    assert.ok(r.airHits >= 3, `${order.join('')}: ${r.airHits} acertos`);
  }
});

test('combo aéreo tem limite: nada passa do teto de acertos no ar, e só existe um pulo', () => {
  for (const h of HEROES) for (const order of [['L'], ['L', 'M'], ['M', 'L', 'H']]) {
    const r = launchAndJuggle(h, order);
    assert.ok(r.airHits <= SYS.JUGGLE_MAX - 1, `${h.id} ${order.join('')}: ${r.airHits}`);
    assert.equal(r.jumps, 1, `${h.id}: um pulo só (sem pulo extra no combo)`);
  }
});

test('todo golpe que levanta alto abre combo aéreo (cancela em pulo ou persegue ao cair)', () => {
  for (const h of HEROES) for (const [k, m] of Object.entries(h.moves)) for (const mm of [m, m.turbo].filter(Boolean)) {
    if (mm.type === 'super' || !mm.hits.some((x) => x.launch && x.launch[1] >= 20)) continue;
    assert.ok(mm.cancel.includes('jump') || mm.flags.chase, `${h.id} ${k}${mm.isTurbo ? '+T' : ''}`);
  }
});

test('o Gancho alcança mais longe (rival a 280 de distância)', () => {
  for (const id of ['belga', 'majis', 'dney']) assert.equal(launchAndJuggle(hero(id), ['L'], 280).phase !== 'open', true, id);
});

test('o super de 3 barras vale a pena: mais dano e escala mínima maior no combo', () => {
  assert.ok(SYS.SUPER.bigDmg > 1);
  assert.ok(SYS.SUPER.bigMinScale > SYS.SUPER_MIN_SCALE);
});
