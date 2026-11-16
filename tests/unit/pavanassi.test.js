import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { PAV } from '../../src/data/characters/pavanassi.js';
import { spawnEntity } from '../../src/core/entities.js';
import { proj } from '../../src/data/movekit.js';
import { fight, run, tap, I, has } from './helpers.js';

const ents = (st, kind) => st.ents.filter((e) => e.kind === kind);

test('Pavanassi — o Carimbo de Decreto proíbe especiais, depois pulo; a proibição passa', () => {
  const st = fight('trunks', 'pavanassi', 500);
  const h = st.f[0];
  const p = st.f[1];
  run(st, 1, I(), I({ S: 1 }));
  run(st, 60);
  assert.equal(h.status.ban?.what, 'S');
  // com especiais proibidos, apertar Especial não faz nada
  run(st, 30);
  tap(st, { S: 1 }, 3);
  assert.notEqual(h.state, 'attack');
  run(st, PAV.banFrames);
  assert.equal(h.status.ban, null);
  // o segundo carimbo proíbe o pulo
  p.x = h.x + 500;
  run(st, 1, I(), I({ S: 1 }));
  run(st, 60);
  assert.equal(h.status.ban?.what, 'jump');
  run(st, 10, I({ y: 1 }));
  assert.equal(h.y, 0, 'não pula');
});

test('Pavanassi — a Cerca de Separação segura o herói a pé e cai com 3 golpes', () => {
  const st = fight('trunks', 'pavanassi', 520);
  const h = st.f[0];
  const p = st.f[1];
  spawnEntity(st, p, p.ch.moves['6S'].spawn[0]);
  const cerca = ents(st, 'cerca')[0];
  run(st, 120, I({ x: 1 }));
  assert.ok(h.x < cerca.x, 'não atravessou andando');
  for (let i = 0; i < PAV.fenceHp; i++) {
    h.x = cerca.x - 140;
    run(st, 20);
    tap(st, { M: 1 }, 30);
  }
  assert.equal(ents(st, 'cerca').length, 0, 'a cerca caiu');
});

test('Pavanassi — dá para pular a Cerca de Separação', () => {
  const st = fight('trunks', 'pavanassi', 700);
  const h = st.f[0];
  spawnEntity(st, st.f[1], st.f[1].ch.moves['6S'].spawn[0]);
  const cerca = ents(st, 'cerca')[0];
  h.x = cerca.x - 120;
  run(st, 1, I({ y: 1, x: 1 }));
  run(st, 60, I({ x: 1 }));
  assert.ok(h.x > cerca.x, 'passou por cima');
});

test('Pavanassi — encostar na cabine prende na fila; apertar botões solta mais rápido', () => {
  const stA = fight('trunks', 'pavanassi', 600);
  const stB = fight('trunks', 'pavanassi', 600);
  const frames = [];
  for (const [st, mash] of [[stA, false], [stB, true]]) {
    const h = st.f[0];
    st.f[1].ch.moves['2S'].spawn[0].make; // garante a ficha carregada
    run(st, 1, I(), I({ y: -1, S: 1 }));
    run(st, 40);
    const cab = ents(st, 'cabine')[0];
    assert.ok(cab, 'a cabine apareceu');
    let n = 0;
    while (h.state !== 'frozen' && n++ < 200) run(st, 1, I({ x: 1 }));
    assert.equal(h.state, 'frozen', 'ficou preso na fila');
    let t = 0;
    while (h.state === 'frozen' && t < 400) {
      run(st, 1, mash && t % 2 === 0 ? I({ L: 1 }) : I());
      t++;
    }
    frames.push(t);
  }
  assert.ok(frames[1] < frames[0] - 20, `apertando: ${frames[1]} quadros; parado: ${frames[0]}`);
});

test('Pavanassi — A PERGUNTA perto da cabine: dano emocional, tontura e a cabine desaba', () => {
  const st = fight('trunks', 'pavanassi', 700);
  const h = st.f[0];
  const p = st.f[1];
  spawnEntity(st, p, { kind: 'cabine', behavior: 'barrier', x: 300, y: 0, w: 190, h: 420, vx: 0, life: 900, hp: PAV.cabinHp, hit: null, delay: 0 });
  const cab = ents(st, 'cabine')[0];
  h.x = cab.x - 200;
  run(st, 10);
  const hp = p.hp;
  const ev = run(st, 2, I({ G: 1, T: 1 }));
  assert.ok(has(ev, 'emotional'));
  assert.equal(hp - p.hp, PAV.emotional);
  assert.equal(p.state, 'dizzy');
  run(st, 2);
  assert.equal(ents(st, 'cabine').length, 0);
  // longe da cabine, a pergunta não vale
  const st2 = fight('trunks', 'pavanassi', 700);
  spawnEntity(st2, st2.f[1], { kind: 'cabine', behavior: 'barrier', x: 100, y: 0, w: 190, h: 420, vx: 0, life: 900, hp: 5, hit: null, delay: 0 });
  st2.f[0].x = ents(st2, 'cabine')[0].x - 600;
  assert.ok(!has(run(st2, 2, I({ G: 1, T: 1 })), 'emotional'));
});

test('Pavanassi — barreiras seguram os projéteis do herói', () => {
  const st = fight('dney', 'pavanassi', 700);
  const p = st.f[1];
  spawnEntity(st, p, { kind: 'cabine', behavior: 'barrier', x: 300, y: 0, w: 190, h: 420, vx: 0, life: 900, hp: PAV.cabinHp, hit: null, delay: 0 });
  const hp = p.hp;
  spawnEntity(st, st.f[0], proj({ x: 100, y: 250, vx: 16, dmg: 500 }));
  run(st, 60);
  assert.equal(p.hp, hp, 'o projétil não passou');
  assert.ok(ents(st, 'cabine')[0].hp < PAV.cabinHp);
});
