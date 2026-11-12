import { mv, bx, baseNormals } from '../movekit.js';

/**
 * M'DEP — chutes e pressão aérea.
 * Mecânica: RAJADA. Golpes normais que acertam dão Embalo (até 3). Cada Embalo
 * permite cancelar um especial em outro especial diferente. Tem pulo duplo e um
 * mergulho que muda o ângulo do pulo.
 */
const EMBALO_MAX = 3;

const moves = {
  ...baseNormals({ reach: 1.06, anims: { M: 'kickM', H: 'kickHigh', jH: 'jKick' } }),
  '5S': mv({ name: 'Bicuda', startup: 9, active: 4, recovery: 18, box: bx(30, 200, 310, 130), dmg: 800, anim: ['punchWind', 'kickM'], tags: ['mid', 'poke'],
    turbo: { startup: 7, dmg: 1000, hitstun: 28 } }),
  '6S': mv({ name: 'Rajada', startup: 11, active: 15, recovery: 20, anim: ['punchWind', 'kickHigh'],
    hits: [0, 1, 2].map((i) => ({ from: 12 + i * 6, to: 13 + i * 6, box: bx(30, 180, 260, 200), dmg: i === 2 ? 600 : 350, hitstun: 20, push: i === 2 ? [150, 110] : [20, 20] })),
    motion: [{ from: 8, to: 26, vx: 9 }], tags: ['mid', 'advance', 'pressure'],
    turbo: { hits: [0, 1, 2, 3, 4].map((i) => ({ from: 10 + i * 4, to: 11 + i * 4, box: bx(30, 180, 270, 200), dmg: i === 4 ? 600 : 300, hitstun: 20, push: [15, 20], launch: i === 4 ? [6, 27] : null })), startup: 9, recovery: 17 } }),
  '2S': mv({ name: 'Rasteira Giratória', startup: 12, active: 6, recovery: 26, crouch: true, guard: 'low', box: bx(-90, 0, 390, 80), dmg: 900, launch: [5, 12], kd: 'hard', anim: ['crouch', 'sweep'], tags: ['low', 'knockdown', 'mid'],
    turbo: { startup: 9, dmg: 1100 } }),
  '4S': mv({ name: 'Chute Mola', startup: 5, active: 9, recovery: 30, box: bx(0, 180, 190, 380), dmg: 1100, launch: [3, 32], anim: ['riseWind', 'kickHigh'], inv: [{ from: 1, to: 7, type: 'strike' }], motion: [{ from: 5, to: 9, vx: 4, vy: 28 }], flags: { landEnds: true, landRecovery: 13 }, cancel: [], tags: ['antiair', 'reversal'],
    turbo: { dmg: 1400, inv: [{ from: 1, to: 11, type: 'all' }] } }),
  jS: mv({ name: 'Voadora Mergulho', air: true, startup: 8, active: 26, recovery: 2, guard: 'mid', box: bx(0, -10, 180, 170), dmg: 700, hitstun: 22, anim: ['jumpUp', 'jKick'], motion: [{ from: 8, to: 60, vx: 15, vy: -21 }], flags: { landRecovery: 9 }, cancel: [], tags: ['air'],
    turbo: { dmg: 900, hitstun: 28, flags: { landRecovery: 5 } } }),
  SA1: mv({ name: 'Sola de Bota', btn: 'X', startup: 7, active: 22, recovery: 32, anim: ['punchWind', 'kickHigh'], cost: { super: 1000 },
    hits: [0, 1, 2, 3, 4].map((i) => ({ from: 8 + i * 4, to: 9 + i * 4, box: bx(30, 160, 300, 240), dmg: i === 4 ? 900 : 330, hitstun: 26, push: [15, 25], launch: i === 4 ? [10, 26] : null, kd: 'hard' })),
    inv: [{ from: 1, to: 8, type: 'all' }], motion: [{ from: 5, to: 24, vx: 9 }], tags: ['super'] }),
  SA3: mv({ name: 'Rajada do Dep', btn: 'X', startup: 9, active: 44, recovery: 40, anim: ['punchWind', 'flurry'], cost: { super: 3000 }, inv: [{ from: 1, to: 20, type: 'all' }],
    hits: [...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ from: 10 + i * 4, to: 11 + i * 4, box: bx(20, 100, 340, 340), dmg: 300, hitstun: 30, push: [8, 20] })), { from: 48, to: 52, box: bx(0, 100, 380, 460), dmg: 1900, launch: [12, 34], kd: 'hard' }],
    motion: [{ from: 6, to: 40, vx: 6 }], tags: ['super', 'big'] }),
};

export default {
  id: 'mdep',
  name: "M'DEP",
  style: 'Chutes e pressão aérea',
  mechName: 'RAJADA',
  mechDesc: 'Golpes normais que acertam dão Embalo. Gaste Embalo para emendar um especial em outro. Tem pulo duplo e mergulho.',
  colors: { skin: '#5c3a28', top: '#272a36', bottom: '#2e2e36', accent: '#ff6063', hair: '#201418', hat: '#c8323a', shoe: '#f0f0f0' },
  look: { hair: 'bandana', weapon: null, sleeves: 'long' },
  walkF: 6.5, walkB: 5, jumpScale: 1.04, hpScale: 0.97, airJumps: 1,
  moves,
  mech: {
    init(f) {
      f.res = { embalo: 0 };
    },
    onHit(st, f, d, h, src) {
      if (src.type === 'move' && src.m.type === 'normal') f.res.embalo = Math.min(EMBALO_MAX, f.res.embalo + 1);
    },
    extraCancel(st, f, cur, key) {
      if (cur.type !== 'special' || !f.connected || f.res.embalo <= 0 || key === f.moveKey) return false;
      f.res.embalo--;
      st.events.push({ t: 'pop', str: 'RAJADA!', x: f.x, color: '#ff6063' });
      return true;
    },
    hud(f) {
      return { label: 'EMBALO', pips: EMBALO_MAX, value: f.res.embalo, ready: f.res.embalo >= EMBALO_MAX, readyText: 'CHEIO!', color: '#ff6063' };
    },
  },
  ai: { aggression: 0.7, block: 0.45, antiAir: 0.6, range: 'close' },
};
