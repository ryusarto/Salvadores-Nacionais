import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * CHAPUH — truques. Bate com a lata de spray de pixo.
 * Super: ATAQUE DO PINSCHER — o cachorro vem correndo e ataca o rival.
 * Mecânica: TINTA e PINSCHER. O spray deixa poças no chão (até 2): o rival que
 * andar ou correr por cima escorrega. O pinscher é um ajudante que ataca sob
 * comando e precisa de um tempo para voltar.
 */
const DOG_CD = 170;
const PUDDLE_MAX = 2;
const PUDDLE = { kind: 'paint', behavior: 'puddle', y: 0, w: 200, h: 40, vx: 0, life: 420, hitsLeft: 0, hit: null, color: '#ee547a', slip: 40, delay: 0 };

const puddle = (x) => ({
  make: (st, f) => {
    const mine = st.ents.filter((e) => e.owner === f.side && e.behavior === 'puddle');
    if (mine.length >= PUDDLE_MAX) mine[0].dead = true;
    return { ...PUDDLE, x };
  },
});
const dog = (o = {}) => ({
  make: (st, f) => {
    if (f.res.dog > 0 && !o.force) {
      st.events.push({ t: 'pop', str: 'CADÊ O CACHORRO?', x: f.x, color: '#d8d0dc', size: 40 });
      return null;
    }
    if (!o.force) f.res.dog = DOG_CD;
    return proj({ kind: 'dog', behavior: 'fly', x: 90, y: 0, w: 120, h: 90, vx: 19, life: 80, dmg: 700, hitstun: 24, guard: 'low', color: '#a86f46', ...o });
  },
});

const moves = {
  ...baseNormals({ reach: 1.04, speed: -1, dmg: 0.92, anims: { L: 'cast', M: 'cast', H: 'overhead' } }),
  // O botão Médio é um jato de spray preto de média distância.
  '5M': mv({ name: 'Jato de Spray', btn: 'M', startup: 8, active: 5, recovery: 15, box: bx(50, 230, 330, 130), dmg: 620, anim: ['castWind', 'cast'], fx: 'spray', tags: ['poke', 'mid', 'far'] }),
  '2M': mv({ name: 'Jato Rasteiro', btn: 'M', startup: 9, active: 5, recovery: 16, crouch: true, guard: 'low', box: bx(50, 10, 320, 110), dmg: 560, anim: ['crouch', 'whipLow'], fx: 'spray', tags: ['poke', 'mid', 'low'] }),
  '5S': mv({ name: 'Spray', startup: 9, active: 12, recovery: 18, anim: ['castWind', 'cast'],
    hits: [0, 1, 2].map((i) => ({ from: 10 + i * 5, to: 11 + i * 5, box: bx(40, 170, 270, 210), dmg: 260, hitstun: 20, push: i === 2 ? [110, 90] : [15, 20] })),
    spawn: [{ at: 22, ...puddle(240) }], flags: { mash: { btn: 'S', from: 10, to: 21, max: 2 } }, tags: ['mid', 'pressure'],
    turbo: { hits: [0, 1, 2].map((i) => ({ from: 9 + i * 4, to: 10 + i * 4, box: bx(40, 150, 300, 250), dmg: 360, hitstun: 22, push: [15, 20], launch: i === 2 ? [7, 24] : null })), spawn: [{ at: 20, ...puddle(260) }] } }),
  '2S': mv({ name: 'Bomba de Tinta', startup: 14, active: 1, recovery: 22, anim: ['overWind', 'overhead'], range: 620, tags: ['zone', 'far'],
    spawn: [{ at: 14, ...proj({ kind: 'paint', x: 70, y: 380, w: 64, h: 64, vx: 13, vy: 20, g: 1.5, life: 120, dmg: 500, color: '#ee547a', extra: { landSpawn: PUDDLE } }) }],
    turbo: { startup: 10, spawn: [{ at: 10, ...proj({ kind: 'paint', x: 70, y: 380, w: 80, h: 80, vx: 17, vy: 20, g: 1.5, life: 120, dmg: 750, launch: [5, 20], color: '#6fc2ef', extra: { landSpawn: PUDDLE } }) }] } }),
  '6S': mv({ name: 'Pega, Pinscher!', startup: 12, active: 1, recovery: 20, anim: ['castWind', 'cast'], spawn: [{ at: 12, ...dog() }], range: 1400, tags: ['zone', 'far', 'low'],
    turbo: { spawn: [{ at: 10, ...dog({ hits: 2, dmg: 520, vx: 23 }) }] } }),
  '4S': mv({ name: 'Pula, Pinscher!', startup: 10, active: 1, recovery: 22, anim: ['castWind', 'upper'], spawn: [{ at: 10, ...dog({ vx: 11, vy: 31, g: 1.6, y: 10, dmg: 900, guard: 'mid', launch: [3, 26], life: 60 }) }], range: 420, tags: ['antiair'],
    turbo: { spawn: [{ at: 8, ...dog({ vx: 12, vy: 33, g: 1.6, y: 10, dmg: 1200, guard: 'mid', launch: [3, 30], life: 60 }) }] } }),
  c1: mv({ name: 'Rolamento', startup: 3, active: 17, recovery: 9, anim: ['crouch', 'crouch'], crouch: true, motion: [{ from: 4, to: 20, vx: 22 }],
    inv: [{ from: 3, to: 20, type: 'upper' }, { from: 3, to: 20, type: 'throw' }], flags: { phase: true }, cancel: [], tags: ['evade'] }),
  c2: mv({ name: 'Jato de Tinta', startup: 11, active: 5, recovery: 22, box: bx(50, 220, 520, 90), dmg: 750, hitstun: 22, anim: ['castWind', 'cast'], spawn: [{ at: 16, ...puddle(380) }], tags: ['far', 'poke'] }),
  SA1: mv({ name: 'Grafite Total', btn: 'X', startup: 8, active: 22, recovery: 32, anim: ['castWind', 'cast'], cost: { super: 1000 }, inv: [{ from: 1, to: 9, type: 'all' }],
    hits: [0, 1, 2, 3, 4].map((i) => ({ from: 9 + i * 4, to: 10 + i * 4, box: bx(30, 80, 420, 380), dmg: i === 4 ? 800 : 340, hitstun: 26, push: [15, 25], launch: i === 4 ? [10, 24] : null, kd: 'hard' })),
    spawn: [{ at: 30, ...puddle(330) }], tags: ['super'] }),
  // O pinscher vem correndo e ataca o oponente: várias mordidas e uma última que derruba.
  SA3: mv({ name: 'Ataque do Pinscher', btn: 'X', startup: 12, active: 30, recovery: 40, anim: ['superWind', 'cast'], cost: { super: 3000 }, inv: [{ from: 1, to: 18, type: 'all' }],
    spawn: [{ at: 6, ...dog({ force: true, x: 20, w: 170, h: 140, vx: 32, hits: 5, dmg: 640, guard: 'mid', hitstun: 36, push: [10, 20], chip: 0.3, life: 100 }) },
      { at: 34, ...dog({ force: true, x: -40, y: 60, w: 190, h: 170, vx: 36, hits: 1, dmg: 1600, guard: 'mid', launch: [14, 28], kd: 'hard', chip: 0.3, life: 100 }) }],
    range: 1500, tags: ['super', 'big'] }),
};

export default {
  id: 'chapuh',
  name: 'CHAPUH',
  style: 'Truques e armadilhas',
  mechName: 'TINTA E PINSCHER',
  mechDesc: 'O spray deixa poças: o rival que andar por cima escorrega. O pinscher ataca sob comando e leva um tempo para voltar.',
  colors: { skin: '#d9a47a', top: '#6a4a2a', bottom: '#22222a', accent: '#ffb62a', hair: '#141016', shoe: '#d8d8d8' },
  look: { hair: 'spikes', weapon: 'spray', sleeves: 'long' },
  walkF: 7.2, walkB: 5.5, jumpScale: 1.03, hpScale: 0.93,
  moves,
  mech: {
    init(f) {
      f.res = { dog: 0 };
    },
    tick(st, f) {
      if (f.res.dog > 0) f.res.dog--;
    },
    onHit(st, f, d, h, src) {
      if (src.type === 'proj' && src.ent.kind === 'dog') st.events.push({ t: 'pop', str: h.launch ? 'NHAC!' : 'AU!', x: d.x, y: 430, color: '#ffb62a', size: 44 });
    },
    hud(f) {
      return { label: 'PINSCHER', pips: 0, value: 0, text: f.res.dog > 0 ? `VOLTA EM ${Math.ceil(f.res.dog / 60)}s` : 'PRONTO', ready: f.res.dog <= 0, color: '#ffb62a' };
    },
    aiPlan(st, f, o, dist, rnd) {
      if (f.res.dog <= 0 && dist > 320 && rnd() < 0.35) return { key: '6S' };
      return dist > 380 && rnd() < 0.15 ? { key: '2S' } : null;
    },
  },
  ai: { aggression: 0.6, block: 0.5, antiAir: 0.5, range: 'mid' },
};
