import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { HEROES, BOSSES } from '../../src/data/characters/index.js';
import { createMatch, step } from '../../src/core/match.js';
import { createBrain, aiInput } from '../../src/core/ai.js';
import { fight, run, tap, I, has, BACK2 } from './helpers.js';

test('dados: todo golpe de todo personagem é válido', () => {
  for (const ch of [...HEROES, ...BOSSES]) {
    for (const k of ['5L', '5M', '5H', '2L', '2M', '2H', 'jL', 'jM', 'jH', 'throw', 'blindado', '5S', 'SA1', 'SA3']) assert.ok(ch.moves[k], `${ch.id} sem ${k}`);
    if (!ch.boss) for (const k of ['c1', 'c2']) assert.ok(ch.moves[k], `${ch.id} sem ${k}`);
    for (const [key, m] of Object.entries(ch.moves)) {
      for (const v of [m, m.turbo].filter(Boolean)) {
        assert.ok(v.startup >= 1 && v.total > v.startup, `${ch.id}.${key} tempos`);
        for (const h of v.hits) {
          assert.ok(h.box && h.box.w > 0 && h.box.h > 0, `${ch.id}.${key} caixa`);
          assert.ok(h.from >= 1 && h.to >= h.from && h.to < v.total, `${ch.id}.${key} janela`);
          assert.ok(h.dmg >= 0 && h.hitstun > 0);
        }
      }
    }
  }
});

test('acerto: Leve de perto causa dano e atordoa; de longe erra', () => {
  let st = fight();
  tap(st, { L: 1 }, 8);
  assert.equal(st.f[1].hp, st.f[1].maxHp - st.f[0].ch.moves['5L'].hits[0].dmg);
  assert.equal(st.f[1].state, 'hitstun');
  st = fight('franco', 'zanata', 700);
  tap(st, { L: 1 }, 20);
  assert.equal(st.f[1].hp, st.f[1].maxHp);
});

test('defesa: segurar para trás defende; baixo e de cima exigem a defesa certa', () => {
  let st = fight();
  run(st, 1, I({ L: 1 }), BACK2);
  const ev = run(st, 8, I(), BACK2);
  assert.ok(has(ev, 'block'));
  assert.equal(st.f[1].hp, st.f[1].maxHp, 'golpe normal não tira vida na defesa');
  st = fight();
  run(st, 1, I({ y: -1, M: 1 }), BACK2);
  run(st, 12, I({ y: -1 }), BACK2);
  assert.ok(st.f[1].hp < st.f[1].maxHp, 'golpe baixo acerta defesa em pé');
  st = fight();
  run(st, 1, I({ x: 1, M: 1 }), I({ x: 1, y: -1 }));
  run(st, 26, I(), I({ x: 1, y: -1 }));
  assert.ok(st.f[1].hp < st.f[1].maxHp, 'golpe de cima acerta defesa agachada');
  st = fight();
  run(st, 1, I({ y: -1, M: 1 }), I({ x: 1, y: -1 }));
  run(st, 12, I({ y: -1 }), I({ x: 1, y: -1 }));
  assert.equal(st.f[1].hp, st.f[1].maxHp, 'defesa agachada segura golpe baixo');
});

test('combo: Leve > Médio > Forte emenda e o dano escala', () => {
  const st = fight('franco', 'zanata', 170);
  tap(st, { L: 1 }, 6);
  tap(st, { M: 1 }, 10);
  const ev = tap(st, { H: 1 }, 36);
  const hits = ev.filter((e) => e.t === 'hit');
  assert.equal(st.f[1].comboHits >= 3 || hits.some((h) => h.combo === 3), true);
  const third = hits.find((h) => h.combo === 3);
  assert.equal(third.dmg, Math.round(st.f[0].ch.moves['5H'].hits[0].dmg * SYS.SCALING[2]));
});

test('agarrão: vence a defesa e pode ser escapado', () => {
  let st = fight('franco', 'zanata', 140);
  run(st, 1, I({ T: 1 }), BACK2);
  run(st, 40, I(), BACK2);
  assert.equal(st.f[1].hp, st.f[1].maxHp - SYS.THROW.dmg);
  st = fight('franco', 'zanata', 140);
  run(st, 1, I({ T: 1 }));
  run(st, 7);
  assert.equal(st.f[1].state, 'thrown');
  const ev = run(st, 2, I(), I({ T: 1 }));
  assert.ok(has(ev, 'tech'));
  assert.equal(st.f[1].hp, st.f[1].maxHp);
});

test('defesa no botão: em pé, agachado e no ar; no tempo exato é perfeita', () => {
  const G = I({ G: 1 });
  let st = fight();
  run(st, 6, I(), G); // já está defendendo
  run(st, 1, I({ L: 1 }), G);
  let ev = run(st, 10, I(), G);
  assert.ok(has(ev, 'block'));
  assert.equal(st.f[1].hp, st.f[1].maxHp);
  assert.ok(st.f[1].ginga < SYS.GINGA.max, 'defender gasta Ginga');

  st = fight();
  run(st, 6, I(), G);
  run(st, 1, I({ y: -1, M: 1 }), G);
  run(st, 12, I({ y: -1 }), G);
  assert.ok(st.f[1].hp < st.f[1].maxHp, 'defesa em pé não segura golpe baixo');
  st = fight();
  run(st, 6, I(), I({ G: 1, y: -1 }));
  run(st, 1, I({ y: -1, M: 1 }), I({ G: 1, y: -1 }));
  ev = run(st, 12, I({ y: -1 }), I({ G: 1, y: -1 }));
  assert.ok(has(ev, 'block'), 'defesa agachada segura golpe baixo');

  st = fight();
  st.f[1].y = 120;
  st.f[1].vy = 6;
  st.f[1].state = 'air';
  run(st, 1, I({ H: 1 }), G);
  ev = run(st, 16, I(), G);
  assert.ok(has(ev, 'block') || has(ev, 'perfect'), 'defesa no ar');
  assert.equal(st.f[1].hp, st.f[1].maxHp);

  st = fight();
  run(st, 1, I({ L: 1 }));
  run(st, 2);
  ev = run(st, 6, I(), G);
  assert.ok(has(ev, 'perfect'), 'defender nos 3 quadros antes do golpe é perfeito');

  st = fight('franco', 'zanata', 140);
  run(st, 6, I(), G);
  run(st, 1, I({ T: 1 }), G);
  run(st, 40, I(), G);
  assert.ok(st.f[1].hp < st.f[1].maxHp, 'agarrão vence a defesa');
});

test('Sem Fôlego: defender demais zera a Ginga e passa a tomar dano na defesa', () => {
  const st = fight();
  st.f[1].ginga = 300;
  run(st, 1, I({ H: 1 }), BACK2);
  const ev = run(st, 20, I(), BACK2);
  assert.ok(has(ev, 'burnout'));
  assert.equal(st.f[1].burnout, true);
  const hp = st.f[1].hp;
  run(st, 30, I(), BACK2);
  st.f[1].x = st.f[0].x + 180;
  run(st, 1, I({ H: 1 }), BACK2);
  run(st, 20, I(), BACK2);
  assert.ok(st.f[1].hp < hp, 'Sem Fôlego toma dano mesmo defendendo');
});

test('Golpe Blindado: aguenta um golpe e derruba', () => {
  const st = fight('franco', 'zanata', 200);
  run(st, 2, I({ G: 1 }));
  run(st, 1, I({ G: 1, H: 1 }));
  assert.equal(st.f[0].moveKey, 'blindado');
  run(st, 6, I(), I());
  run(st, 1, I(), I({ L: 1 }));
  const ev = run(st, 40);
  assert.ok(has(ev, 'armor'));
  assert.equal(st.f[1].state === 'crumple' || has(ev, 'hit'), true);
});

test('Arrancada: →→ durante a defesa gasta Ginga e avança', () => {
  const st = fight('franco', 'zanata', 900);
  const x = st.f[0].x;
  run(st, 3, I({ G: 1 }));
  run(st, 1, I({ G: 1, x: 1 }));
  run(st, 2, I({ G: 1 }));
  run(st, 1, I({ G: 1, x: 1 }));
  assert.equal(st.f[0].state, 'rush');
  run(st, 10, I({ x: 1 }));
  assert.ok(st.f[0].x > x + 150);
  assert.ok(st.f[0].ginga < SYS.GINGA.max);
});

test('super: só sai com barra, gasta a barra e congela a tela', () => {
  const st = fight();
  tap(st, { X: 1 }, 2);
  assert.notEqual(st.f[0].moveKey, 'SA1');
  st.f[0].super = 1000;
  const ev = tap(st, { X: 1 }, 0);
  assert.ok(has(ev, 'super'));
  assert.equal(st.f[0].super, 0);
  assert.ok(st.freeze > 0);
  const st2 = fight();
  st2.f[0].super = 3000;
  tap(st2, { y: -1, X: 1 }, 0);
  assert.equal(st2.f[0].moveKey, 'SA3');
});

test('movimento: pulo, corrida e recuo', () => {
  const st = fight('franco', 'zanata', 900);
  run(st, 6, I({ y: 1 }));
  assert.ok(st.f[0].y > 0);
  run(st, 60);
  assert.equal(st.f[0].y, 0);
  const x = st.f[0].x;
  tap(st, { x: 1 }, 2);
  tap(st, { x: 1 }, 0);
  run(st, 12, I({ x: 1 }));
  assert.ok(['dash', 'run'].includes(st.f[0].state));
  assert.ok(st.f[0].x > x + 120);
  run(st, 20);
  const x2 = st.f[0].x;
  tap(st, { x: -1 }, 2);
  tap(st, { x: -1 }, 0);
  run(st, 10);
  assert.ok(st.f[0].x < x2 - 60);
});

test('nocaute e rounds: quem zera a vida perde o round; 2 rounds vencem a luta', () => {
  const st = fight();
  for (let r = 0; r < 2; r++) {
    st.phase = 'fight';
    st.f[0].x = 1200;
    st.f[1].x = 1380;
    st.f[1].hp = 100;
    tap(st, { L: 1 }, 10);
    assert.equal(st.f[1].state, 'ko');
    run(st, SYS.KO_FRAMES + 5);
  }
  assert.equal(st.phase, 'over');
  assert.equal(st.winner, 0);
});

test('paredes: ninguém sai do cenário nem atravessa o outro', () => {
  const st = fight('franco', 'zanata', 200);
  run(st, 400, I({ x: 1 }));
  assert.ok(st.f[1].x <= SYS.STAGE_W - SYS.WALL_PAD);
  assert.ok(st.f[0].x < st.f[1].x);
  assert.ok(st.f[1].x - st.f[0].x >= SYS.BODY.push - 1);
});

test('determinismo: mesma semente, mesma luta', () => {
  const play = () => {
    const st = createMatch({ chars: [HEROES[0], BOSSES[0]], seed: 42 });
    const b = [createBrain(2), createBrain(1)];
    for (let i = 0; i < 3000; i++) step(st, aiInput(st, 0, b[0]), aiInput(st, 1, b[1]));
    return JSON.stringify(st.f.map((f) => [Math.round(f.x), f.hp, f.state, f.rounds]));
  };
  assert.equal(play(), play());
});

test('IA: todos os personagens terminam uma luta contra a chefe', () => {
  for (const h of HEROES) {
    const st = createMatch({ chars: [h, BOSSES[0]], seed: 9 });
    const b = [createBrain(1), createBrain(1)];
    for (let i = 0; i < 60 * 400 && st.phase !== 'over'; i++) {
      step(st, aiInput(st, 0, b[0]), aiInput(st, 1, b[1]));
      for (const f of st.f) assert.ok(Number.isFinite(f.x + f.y + f.hp + f.ginga + f.super), `${h.id} valor inválido`);
    }
    assert.equal(st.phase, 'over', `${h.id} não terminou`);
  }
});

test('sequências: → ← + Leve e ↓ → + Médio soltam os golpes de comando de todo herói', () => {
  for (const h of HEROES) {
    let st = fight(h.id, 'zanata', 900);
    run(st, 3, I({ x: 1 }));
    run(st, 3, I({ x: -1 }));
    run(st, 1, I({ x: -1, L: 1 }));
    assert.equal(st.f[0].moveKey, 'c1', `${h.id} c1`);
    st = fight(h.id, 'zanata', 900);
    run(st, 3, I({ y: -1 }));
    run(st, 2, I({ x: 1 }));
    run(st, 1, I({ x: 1, M: 1 }));
    assert.equal(st.f[0].moveKey, 'c2', `${h.id} c2`);
    st = fight(h.id, 'zanata', 900);
    run(st, 3, I({ x: -1 }));
    run(st, 1, I({ x: -1, L: 1 }));
    assert.notEqual(st.f[0].moveKey, 'c1', 'só ← + Leve não é a sequência');
    st = fight(h.id, 'zanata', 900);
    run(st, 40, I({ x: 1 }));
    run(st, 1, I({ x: 1, M: 1 }));
    assert.notEqual(st.f[0].moveKey, 'c2', 'só → + Médio não é a sequência');
  }
});
