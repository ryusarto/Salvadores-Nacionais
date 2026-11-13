import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * M'DEP — chutes e pressão aérea. Bate com as botas: chuta em frente e pisoteia.
 * Super: RAJADA DE AK-47.
 * Mecânica: RAJADA. Golpes normais que acertam dão Embalo (até 3). Cada Embalo
 * permite cancelar um especial em outro especial diferente. Tem pulo duplo e um
 * mergulho que muda o ângulo do pulo.
 */
const EMBALO_MAX = 3;

const moves = {
  ...baseNormals({ reach: 1.06, anims: { L: 'kickM', M: 'kickM', H: 'kickHigh', jH: 'jKick', over: 'overhead' } }),
  // O botão Forte é a pisada da bota: levanta a perna e esmaga.
  '5H': mv({ name: 'Pisada Bottega', btn: 'H', startup: 13, active: 5, recovery: 20, box: bx(10, 0, 260, 230), dmg: 1000, hitstun: 24, push: [120, 120], anim: ['kickHigh', 'overhead'], fx: 'stomp', motion: [{ from: 6, to: 13, vx: 7 }], tags: ['poke', 'mid', 'heavy'] }),
  jH: mv({ name: 'Pisada Aérea', btn: 'H', air: true, startup: 8, active: 8, recovery: 6, guard: 'high', box: bx(-10, -20, 200, 230), dmg: 850, hitstun: 24, anim: ['jumpUp', 'jHeavy'], fx: 'stomp', cancel: [], tags: ['air', 'jumpin'] }),
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
  c1: mv({ name: 'Machado de Bota', startup: 19, active: 4, recovery: 18, guard: 'high', box: bx(30, 120, 270, 340), dmg: 850, hitstun: 26, anim: ['kickHigh', 'overhead'], motion: [{ from: 8, to: 19, vx: 5 }], tags: ['overhead', 'mid'] }),
  c2: mv({ name: 'Joelhada Voadora', startup: 9, active: 8, recovery: 16, box: bx(20, 120, 195, 230), dmg: 850, launch: [6, 26], anim: ['prejump', 'jKick'],
    motion: [{ from: 5, to: 18, vx: 13 }, { from: 5, to: 7, vy: 20 }], flags: { landEnds: true, landRecovery: 10 }, tags: ['close', 'advance', 'launcher'] }),
  SA1: mv({ name: 'Rajada Curta de AK', btn: 'X', startup: 12, active: 16, recovery: 30, anim: ['castWind', 'shoot'], weapon: 'ak', cost: { super: 1000 }, inv: [{ from: 1, to: 12, type: 'all' }],
    spawn: [0, 1, 2, 3].map((i) => ({ at: 13 + i * 4, ...proj({ kind: 'shot', x: 150, y: 300 + (i % 2) * 24, w: 60, h: 30, vx: 50, life: 60, dmg: i === 3 ? 800 : 400, hitstun: 28, push: [20, 30], chip: 0.3, launch: i === 3 ? [12, 20] : null, kd: 'hard', color: '#ffd27a' }) })),
    range: 1500, tags: ['super'] }),
  // Puxa uma AK-47 e solta uma rajada.
  SA3: mv({ name: 'Rajada de AK-47', btn: 'X', startup: 16, active: 40, recovery: 34, anim: ['castWind', 'shoot'], weapon: 'ak', cost: { super: 3000 }, inv: [{ from: 1, to: 20, type: 'all' }],
    spawn: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({ at: 17 + i * 4, ...proj({ kind: 'shot', x: 150, y: 300 + (i % 3) * 22, w: 60, h: 30, vx: 50, life: 60, dmg: i === 9 ? 1300 : 430, hitstun: 30, push: [20, 30], chip: 0.3, launch: i === 9 ? [15, 22] : null, kd: 'hard', color: '#ffd27a' }) })),
    range: 1500, tags: ['super', 'big'] }),
};

// Nomes dos golpes conforme a prancheta de sprites
moves['5L'].name = 'Chute de Bota';
moves['5M'].name = 'Chute Alto';

export default {
  id: 'mdep',
  name: "M'DEP",
  style: 'Chutes e pressão aérea',
  mechName: 'RAJADA',
  mechDesc: 'Golpes normais que acertam dão Embalo. Gaste Embalo para emendar um especial em outro. Tem pulo duplo e mergulho.',
  colors: { skin: '#5c3a28', top: '#272a36', bottom: '#2e2e36', accent: '#ff6063', hair: '#201418', hat: '#c8323a', shoe: '#3b2a20' },
  look: { hair: 'bandana', weapon: null, sleeves: 'long', bigBoots: true },
  walkF: 6.5, walkB: 5, jumpScale: 1.04, hpScale: 0.97, airJumps: 1,
  moves,
  // Qual tira do kit de sprites cada animação usa (production/sprites/final/mdep)
  spriteAlias: { 'golpe-SA1': 'golpe-SA3', 'golpe-jH': 'golpe-5H' },
  mech: {
    init(f) {
      f.res = { embalo: 0 };
    },
    onHit(st, f, d, h, src) {
      if (src.type === 'move' && src.m.fx === 'stomp') st.events.push({ t: 'shake', n: 12 });
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
