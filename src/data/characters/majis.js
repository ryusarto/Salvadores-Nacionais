import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * MAJIS — controle de média distância com a guitarra.
 * Mecânica: FRIO. Cada especial de guitarra que acerta acumula frio no rival:
 * cada acúmulo deixa ele 12% mais lento; com 3, ele congela.
 */
const frost = (n = 1, freeze) => [{ t: 'frost', n, freeze }];
const note = (o = {}) => proj({ kind: 'note', x: 120, y: 270, w: 70, h: 80, vx: 13, life: 46, dmg: 500, color: '#9df0ff', effects: frost(), ...o });

const moves = {
  ...baseNormals({ reach: 1.16, speed: 1, anims: { M: 'swing', H: 'swing', up: 'swingUp' } }),
  '5S': mv({ name: 'Riff', startup: 13, active: 1, recovery: 24, anim: ['castWind', 'cast'], spawn: [{ at: 13, ...note() }], range: 600, tags: ['zone', 'far'],
    turbo: { spawn: [{ at: 11, ...note({ hits: 2, life: 74, vx: 15 }) }], range: 1000 } }),
  '6S': mv({ name: 'Power Chord', startup: 16, active: 5, recovery: 24, box: bx(40, 170, 330, 270), dmg: 1000, push: [190, 150], effects: frost(), anim: ['swingWind', 'swing'], motion: [{ from: 6, to: 18, vx: 8 }], tags: ['mid', 'advance', 'far'],
    turbo: { startup: 13, dmg: 1200, launch: [9, 20] } }),
  '2S': mv({ name: 'Pedal de Gelo', startup: 15, active: 1, recovery: 22, crouch: true, anim: ['crouch', 'whipLow'], range: 520, tags: ['zone', 'low', 'far'],
    spawn: [{ at: 15, ...proj({ kind: 'ice', behavior: 'trap', x: 420, y: 0, w: 210, h: 120, vx: 0, delay: 22, life: 150, dmg: 500, guard: 'low', color: '#aeeeff', effects: frost() }) }],
    turbo: { spawn: [{ at: 12, ...proj({ kind: 'ice', behavior: 'trap', x: 0, y: 0, w: 240, h: 140, vx: 0, delay: 16, life: 170, dmg: 700, guard: 'low', color: '#aeeeff', effects: frost(), extra: { at_opponent: true } }) }], range: 1400 } }),
  '4S': mv({ name: 'Solo Ascendente', startup: 7, active: 6, recovery: 27, box: bx(0, 220, 230, 360), dmg: 1000, launch: [4, 29], effects: frost(), anim: ['swingWind', 'swingUp'], inv: [{ from: 3, to: 12, type: 'air' }], cancel: [], tags: ['antiair'],
    turbo: { dmg: 1300, inv: [{ from: 1, to: 12, type: 'strike' }] } }),
  c1: mv({ name: 'Palhetada', startup: 14, active: 1, recovery: 22, anim: ['backdash', 'cast'], motion: [{ from: 1, to: 10, vx: -11 }], spawn: [{ at: 14, ...note({ vx: 10, life: 80 }) }], range: 800, tags: ['zone', 'far'] }),
  c2: mv({ name: 'Slide Gelado', startup: 9, active: 12, recovery: 18, crouch: true, guard: 'low', box: bx(20, 0, 230, 90), dmg: 700, launch: [4, 12], effects: frost(), anim: ['crouch', 'sweep'], motion: [{ from: 6, to: 22, vx: 15 }], cancel: [], tags: ['low', 'advance', 'mid'] }),
  SA1: mv({ name: 'Feedback', btn: 'X', startup: 10, active: 1, recovery: 34, anim: ['swingWind', 'swing'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }],
    spawn: [{ at: 10, ...note({ w: 150, h: 260, y: 120, vx: 26, life: 60, hits: 3, dmg: 650, hitstun: 26, kd: 'hard' }) }], range: 1400, tags: ['super'] }),
  SA3: mv({ name: 'Acorde Glacial', btn: 'X', startup: 12, active: 44, recovery: 40, anim: ['swingWind', 'swing'], fx: 'ice', cost: { super: 3000 }, inv: [{ from: 1, to: 56, type: 'all' }],
    hits: [{ from: 13, to: 16, box: bx(0, 0, 720, 520), dmg: 1500, hitstun: 50, effects: frost(3, 120) }, { from: 52, to: 56, box: bx(0, 0, 760, 560), dmg: 2400, launch: [14, 30], kd: 'hard' }], tags: ['super', 'big'] }),
};

export default {
  id: 'majis',
  name: 'MAJIS',
  style: 'Controle de média distância',
  mechName: 'FRIO',
  mechDesc: 'Especiais de guitarra acumulam frio no rival e o deixam lento. Com 3 acúmulos, ele congela.',
  colors: { skin: '#6b4630', top: '#e9e4da', bottom: '#3a3f5c', accent: '#b16afc', hair: '#141016', shoe: '#f0f0f0' },
  look: { hair: 'spikes', weapon: 'guitar' },
  walkF: 6.2, walkB: 4.8, jumpScale: 1, hpScale: 1,
  moves,
  mech: {
    init(f) {
      f.res = {};
    },
    hud(f, o) {
      const n = o ? o.status.frost : 0;
      return { label: 'FRIO NO RIVAL', pips: 3, value: n, ready: o?.state === 'frozen', readyText: 'CONGELADO!', color: '#9df0ff' };
    },
  },
  ai: { aggression: 0.55, block: 0.5, antiAir: 0.6, range: 'mid' },
};
