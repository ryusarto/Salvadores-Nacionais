import test from 'node:test';
import assert from 'node:assert/strict';
import { SYS } from '../../src/data/system.js';
import { fight, run, tap, I, has, BACK2 } from './helpers.js';

const dmgOf = (st, key) => st.f[0].ch.moves[key].hits[0].dmg;

test('Garra: com pouca vida o lutador recebe menos dano', () => {
  const full = fight();
  tap(full, { L: 1 }, 8);
  const normal = full.f[1].maxHp - full.f[1].hp;
  const low = fight();
  low.f[1].hp = Math.round(low.f[1].maxHp * 0.1);
  const before = low.f[1].hp;
  tap(low, { L: 1 }, 8);
  assert.equal(normal, dmgOf(full, '5L'));
  assert.equal(before - low.f[1].hp, Math.round(dmgOf(low, '5L') * SYS.GUTS[0][1]));
});

test('Tontura: apanhar muito em sequência deixa tonto; a barra esvazia sozinha', () => {
  const st = fight();
  const d = st.f[1];
  d.dizzyM = SYS.DIZZY_METER.max - 100;
  d.dizzyT = 50;
  const ev = tap(st, { L: 1 }, 8);
  assert.ok(has(ev, 'dizzy'));
  assert.equal(d.state, 'dizzy');
  assert.ok(d.dizzyImmune > 0, 'ganha imunidade a ficar tonto de novo');
  const s2 = fight();
  s2.f[1].dizzyM = 1000;
  run(s2, 200);
  assert.equal(s2.f[1].dizzyM, 0);
});

test('Empurrão na defesa: Leve + Médio afasta o atacante e gasta Ginga', () => {
  const st = fight();
  run(st, 6, I(), I({ G: 1 }));
  run(st, 1, I({ M: 1 }), I({ G: 1 }));
  run(st, 9, I(), I({ G: 1 }));
  assert.equal(st.f[1].state, 'blockstun');
  const gap = st.f[1].x - st.f[0].x;
  const g = st.f[1].ginga;
  const ev = run(st, 1, I(), I({ G: 1, T: 1 }));
  ev.push(...run(st, 16, I(), I({ G: 1 }))); // o comando espera a pausa de impacto terminar
  assert.ok(has(ev, 'pushblock'));
  assert.ok(st.f[1].x - st.f[0].x > gap + 100, 'o atacante é afastado');
  assert.ok(st.f[1].ginga < g);
});

test('Rolamento: apertar um botão ao cair levanta rolando; queda forte não permite', () => {
  const st = fight();
  tap(st, { y: -1, H: 1 }, 20, undefined, I({ y: -1 })); // Gancho lança
  assert.equal(st.f[1].state, 'air_hit');
  let ev = [];
  for (let i = 0; i < 80 && st.f[1].state === 'air_hit'; i++) ev.push(...run(st, 1, I(), I({ L: i % 2 })));
  assert.equal(st.f[1].state, 'techroll');
  run(st, SYS.TECH_ROLL.frames + 2);
  assert.ok(['idle', 'crouch'].includes(st.f[1].state));

  const s2 = fight();
  tap(s2, { y: -1, x: 1, H: 1 }, 20, undefined, I({ y: -1 })); // Rasteira: queda forte
  for (let i = 0; i < 80 && s2.f[1].state === 'air_hit'; i++) run(s2, 1, I(), I({ L: i % 2 }));
  assert.equal(s2.f[1].state, 'knockdown');
});

test('Combo aéreo: Gancho + ↑ dá pulo alto e os golpes aéreos emendam', () => {
  const st = fight('franco', 'zanata', 170);
  const f = st.f[0];
  tap(st, { y: -1, H: 1 }, 12, undefined, I({ y: -1 }));
  assert.equal(f.connected, 'hit');
  for (let i = 0; i < 40 && !f.sj; i++) run(st, 1, I({ y: 1 }));
  assert.equal(f.sj, true, 'pulo alto');
  assert.ok(f.y > 0);
  let keys = [];
  for (const b of ['L', 'M', 'H']) {
    for (let i = 0; i < 40; i++) {
      run(st, 1, I({ [b]: i % 3 === 0 ? 1 : 0 }));
      if (f.moveKey === 'j' + b && f.connected === 'hit') break;
    }
    keys.push(f.moveKey);
  }
  assert.deepEqual(keys, ['jL', 'jM', 'jH']);
  assert.ok(st.f[1].comboHits >= 4, 'gancho + três golpes aéreos no mesmo combo');
  // num pulo comum os golpes aéreos não emendam
  const s2 = fight('franco', 'zanata', 170);
  run(s2, 12, I({ y: 1 }));
  s2.f[1].y = s2.f[0].y;
  s2.f[1].state = 'air';
  tap(s2, { L: 1 }, 6);
  tap(s2, { M: 1 }, 8);
  assert.equal(s2.f[0].sj, false);
  assert.notEqual(s2.f[0].moveKey, 'jM');
});

test('Defesa no ar: segura um golpe por pulo, o seguinte quebra a guarda', () => {
  const st = fight();
  const d = st.f[1];
  d.y = 150;
  d.vy = 14;
  d.state = 'air';
  run(st, 1, I({ H: 1 }), I({ G: 1 }));
  run(st, 16, I(), I({ G: 1 }));
  assert.equal(d.hp, d.maxHp);
  assert.equal(d.airBlocked, true);
  for (let i = 0; i < 30; i++) {
    d.y = 150; // mantém no ar: ainda é o mesmo pulo
    d.vy = 0;
    d.x = st.f[0].x + 180;
    run(st, 1, I(), I({ G: 1 }));
  }
  d.vy = 14;
  run(st, 1, I({ H: 1 }), I({ G: 1 }));
  run(st, 22, I(), I({ G: 1 }));
  assert.ok(d.hp < d.maxHp, 'o segundo golpe no mesmo pulo acerta');
});

test('Agarrões seguidos: cada agarrão sofrido aumenta a imunidade ao levantar', () => {
  const st = fight('franco', 'zanata', 140);
  run(st, 1, I({ T: 1 }));
  run(st, 30);
  assert.equal(st.f[1].thrownN, 1);
  for (let i = 0; i < 200 && st.f[1].state !== 'idle'; i++) run(st, 1);
  assert.equal(st.f[1].throwInv >= SYS.KNOCKDOWN.wakeThrowInv + SYS.THROW_PROTECT.extra - 1, true);
});

test('Golpe de apertar repetido: apertar Especial várias vezes aumenta os acertos da Pressão Nacional', () => {
  const hits = (mash) => {
    const st = fight('franco', 'zanata', 170);
    let n = 0;
    run(st, 1, I({ y: -1, S: 1 }));
    for (let i = 0; i < 90; i++) {
      const ev = run(st, 1, I(mash && i % 2 ? { S: 1 } : {}), I());
      n += ev.filter((e) => e.t === 'hit').length;
      st.f[1].x = st.f[0].x + 170;
      if (st.f[0].state !== 'attack') break;
    }
    return n;
  };
  assert.equal(hits(false), 4);
  assert.ok(hits(true) > 4);
});
