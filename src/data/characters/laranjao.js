import { mv, bx, baseNormals, proj } from '../movekit.js';
import { SYS } from '../system.js';

/**
 * LARANJÃO — chefe do Capítulo 6 (Washington, D.C., em frente ao palácio).
 *
 * 1. FAKE NEWS — Escudo de Desinformação: cria cópias contraditórias de si
 *    mesmo, cada uma com uma manchete, e troca de lugar com uma delas. Golpe ou
 *    projétil que acerta uma cópia é gasto. A verdadeira é a única com sombra.
 * 2. TARIFA SUPREMA — Roubo de Atributos (mecânica): 50% de toda Ginga e de
 *    todo Super que o herói gasta vira armadura dourada para ele. Cada carga
 *    de armadura anula o dano de um golpe.
 * 3. THE WALL — Fortaleza Absoluta (super de 1 barra): uma muralha dourada
 *    cai entre os dois. Alta demais para pular; quebra com 6 golpes.
 * 4. YOU'RE FIRED! — Banimento Existencial (super de 3 barras): o herói é
 *    demitido da realidade, some por 2 s e cai de volta tomando dano. Dá para
 *    pular ou defender.
 */
export const LAR = {
  clones: 2,
  cloneLife: 360,
  spread: 260,
  tax: 0.5,
  armorMax: 3,
  wallHp: 6,
  banish: 120,
  banishDmg: 1500,
};

export const HEADLINES = ['EU VENCI!', 'NUNCA DISSE ISSO', 'MAIOR DA HISTÓRIA', 'É TUDO FAKE', 'TODO MUNDO CONCORDA', 'NINGUÉM FAZ MELHOR'];

/** Fake News: cria as cópias e troca de lugar com uma delas (sorteio da luta). */
const fakeNews = {
  make: (st, f) => {
    for (const e of st.ents) if (e.owner === f.side && e.kind === 'clone') e.dead = true;
    const slots = [0, -LAR.spread, LAR.spread].map((d) => Math.max(SYS.WALL_PAD + 20, Math.min(SYS.STAGE_W - SYS.WALL_PAD - 20, f.x + d)));
    const real = Math.floor(st.rng() * slots.length);
    const head = Math.floor(st.rng() * HEADLINES.length);
    f.x = slots[real];
    f.res.headline = HEADLINES[head % HEADLINES.length];
    slots.forEach((x, i) => {
      if (i === real) return;
      st.ents.push({ kind: 'clone', behavior: 'decoy', x, y: 0, w: 150, h: 470, vx: 0, life: LAR.cloneLife, hit: null, delay: 0, age: 0, hitCD: 0,
        id: st.nextId++, owner: f.side, dir: f.face, popText: 'FAKE NEWS!', headline: HEADLINES[(head + i + 1) % HEADLINES.length] });
    });
    st.events.push({ t: 'pop', str: 'FAKE NEWS!', x: f.x, y: 640, color: '#ff8a3a', size: 48 });
    return null;
  },
};

const tweet = (o = {}) => proj({ kind: 'tuite', x: 90, y: 330, w: 110, h: 60, vx: 13, life: 110, dmg: 650, color: '#5ab0f0', ...o });

const theWall = {
  make: (st, f) => {
    const old = st.ents.find((e) => e.owner === f.side && e.kind === 'muralha');
    if (old) old.dead = true;
    const o = st.f[1 - f.side];
    const gap = Math.abs(o.x - f.x);
    return { kind: 'muralha', behavior: 'barrier', x: Math.max(150, Math.min(gap - 80, 320)), y: 0, w: 120, h: 640, hitH: 640, vx: 0, life: 420, hp: LAR.wallHp, hit: null, delay: 0, breakText: 'A MURALHA CAIU!' };
  },
};

const moves = {
  ...baseNormals({ reach: 1.05, dmg: 1.15, speed: 1, anims: { H: 'punchH' } }),
  '5S': mv({ name: 'Fake News', startup: 12, active: 1, recovery: 20, anim: ['superWind', 'burst'], spawn: [{ at: 12, ...fakeNews }], range: 300, tags: ['evade'] }),
  '2S': mv({ name: 'Tuitada', startup: 13, active: 1, recovery: 22, anim: ['castWind', 'cast'], spawn: [{ at: 13, ...tweet() }], range: 1400, tags: ['zone', 'far'],
    turbo: { startup: 9, spawn: [{ at: 9, ...tweet({ vx: 17, dmg: 550 }) }, { at: 15, ...tweet({ vx: 17, dmg: 550, y: 200 }) }] } }),
  // Tarifaço: soco blindado que avança.
  '6S': mv({ name: 'Tarifaço', startup: 15, active: 6, recovery: 26, box: bx(30, 200, 260, 200), dmg: 1150, crumple: true, anim: ['blindWind', 'blindHit'], motion: [{ from: 6, to: 16, vx: 12 }],
    armor: { from: 1, to: 15, hits: 1 }, tags: ['close', 'armor'], turbo: { armor: { from: 1, to: 15, hits: 2 }, dmg: 1350 } }),
  '4S': mv({ name: 'Veto Presidencial', startup: 6, active: 9, recovery: 28, box: bx(0, 200, 200, 340), dmg: 1000, launch: [5, 28], anim: ['riseWind', 'upper'], fx: 'rise',
    inv: [{ from: 1, to: 9, type: 'strike' }], motion: [{ from: 6, to: 11, vx: 3, vy: 22 }], flags: { landEnds: true, landRecovery: 16 }, cancel: [], tags: ['antiair', 'reversal'] }),
  SA1: mv({ name: 'THE WALL', btn: 'X', startup: 14, active: 1, recovery: 30, anim: ['superWind', 'burst'], cost: { super: 1000 }, inv: [{ from: 1, to: 16, type: 'all' }],
    spawn: [{ at: 14, ...theWall }], range: 500, tags: ['super', 'zone'] }),
  SA3: mv({ name: "You're Fired!", btn: 'X', startup: 16, active: 6, recovery: 46, anim: ['superWind', 'cast'], cost: { super: 3000 }, inv: [{ from: 1, to: 16, type: 'all' }],
    hits: [{ from: 17, to: 22, box: bx(40, 0, 900, 300), dmg: 300, hitstun: 30, guard: 'mid', effects: [{ t: 'banish', frames: LAR.banish, dmg: LAR.banishDmg }] }],
    range: 900, tags: ['super', 'big'] }),
};

export default {
  id: 'laranjao',
  name: 'LARANJÃO',
  style: 'Chefe — enganação e muralhas',
  mechName: 'TARIFA SUPREMA',
  mechDesc: 'Metade da Ginga e do Super que você gasta vira armadura para ele. Nas Fake News, só o verdadeiro tem sombra.',
  colors: { skin: '#f0a050', top: '#1f2a4a', top2: '#f4f0ea', bottom: '#1f2a4a', accent: '#c8102e', hair: '#f3d26a', shoe: '#141016' },
  look: { hair: 'long', weapon: null, sleeves: 'long' },
  walkF: 4.8, walkB: 4.2, jumpScale: 0.85, hpScale: 1.3,
  boss: true,
  place: 'WASHINGTON, D.C.',
  stage: 'washington', // cenário próprio (src/render/washington-stage.js)
  moves,
  mech: {
    init(f) {
      f.res = { armor: 0, taxAcc: 0, prevGinga: SYS.GINGA.max, prevSuper: 0, headline: null };
    },
    tick(st, f, o) {
      const r = f.res;
      // Tarifa Suprema: o que o herói gasta (não o que perde defendendo) vira armadura
      let spent = 0;
      if (o.super < r.prevSuper) spent += r.prevSuper - o.super;
      if (o.ginga < r.prevGinga && o.gingaPause === SYS.GINGA.regenPause) spent += r.prevGinga - o.ginga;
      r.prevSuper = o.super;
      r.prevGinga = o.ginga;
      if (spent > 0 && f.hp > 0) {
        r.taxAcc += spent * LAR.tax;
        let gained = 0;
        while (r.taxAcc >= 1000 && r.armor < LAR.armorMax) {
          r.taxAcc -= 1000;
          r.armor++;
          gained++;
        }
        if (r.armor >= LAR.armorMax) r.taxAcc = 0;
        if (gained) st.events.push({ t: 'pop', str: `TARIFA SUPREMA! +${gained} ARMADURA`, x: f.x, y: 620, color: '#f3c426', size: 40 });
      }
    },
    dmgTakenMul(st, f) {
      if (f.res.armor <= 0) return 1;
      f.res.armor--;
      st.events.push({ t: 'pop', str: 'TARIFADO!', x: f.x, y: 520, color: '#f3c426', size: 40 });
      return 0;
    },
    hud(f) {
      return { label: 'ARMADURA', pips: LAR.armorMax, value: f.res.armor, ready: f.res.armor > 0, readyText: 'TARIFADO', text: 'SEM TARIFA', color: '#f3c426' };
    },
    aiPlan(st, f, o, dist, rnd) {
      const clones = st.ents.some((e) => e.owner === f.side && e.kind === 'clone');
      if (o.status.banished) return null;
      if (!clones && dist < 330 && rnd() < 0.06) return { key: '5S' };
      if (dist > 420 && rnd() < 0.16) return { key: '2S' };
      if (dist < 280 && rnd() < 0.06) return { key: '6S' };
      return null;
    },
  },
  ai: { aggression: 0.6, block: 0.6, antiAir: 0.7, range: 'mid' },
};
