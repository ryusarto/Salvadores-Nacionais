import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * MAJIS — controle de média distância. Bate com a guitarra.
 * Mecânica: TREMOR. Cada especial de guitarra que acerta acumula tremor no
 * rival: cada acúmulo deixa ele 12% mais lento; com 3, ele fica atordoado.
 * Super: TERREMOTO — toca a guitarra e a vibração sacode o cenário inteiro.
 */
const frost = (n = 1, freeze) => [{ t: 'frost', n, freeze }];
const note = (o = {}) => proj({ kind: 'note', x: 120, y: 270, w: 70, h: 80, vx: 13, life: 46, dmg: 500, color: '#9df0ff', effects: frost(), ...o });

const moves = {
  ...baseNormals({ reach: 1.16, speed: 1, anims: { L: 'swing', M: 'swing', H: 'swing', up: 'swingUp', over: 'swing' } }),
  '5S': mv({ name: 'Riff', startup: 13, active: 1, recovery: 24, anim: ['castWind', 'cast'], spawn: [{ at: 13, ...note() }], range: 600, tags: ['zone', 'far'],
    turbo: { spawn: [{ at: 11, ...note({ hits: 2, life: 74, vx: 15 }) }], range: 1000 } }),
  '6S': mv({ name: 'Power Chord', startup: 16, active: 5, recovery: 24, box: bx(40, 170, 330, 270), dmg: 1000, push: [190, 150], effects: frost(), anim: ['swingWind', 'swing'], motion: [{ from: 6, to: 18, vx: 8 }], tags: ['mid', 'advance', 'far'],
    turbo: { startup: 13, dmg: 1200, launch: [9, 20] } }),
  '2S': mv({ name: 'Onda Grave', startup: 15, active: 1, recovery: 22, crouch: true, anim: ['crouch', 'whipLow'], range: 520, tags: ['zone', 'low', 'far'],
    spawn: [{ at: 15, ...proj({ kind: 'ice', behavior: 'trap', x: 420, y: 0, w: 210, h: 120, vx: 0, delay: 22, life: 150, dmg: 500, guard: 'low', color: '#aeeeff', effects: frost() }) }],
    turbo: { spawn: [{ at: 12, ...proj({ kind: 'ice', behavior: 'trap', x: 0, y: 0, w: 240, h: 140, vx: 0, delay: 16, life: 170, dmg: 700, guard: 'low', color: '#aeeeff', effects: frost(), extra: { at_opponent: true } }) }], range: 1400 } }),
  '4S': mv({ name: 'Solo Ascendente', startup: 7, active: 6, recovery: 27, box: bx(0, 220, 230, 360), dmg: 1000, launch: [4, 29], effects: frost(), anim: ['swingWind', 'swingUp'], inv: [{ from: 3, to: 12, type: 'air' }], cancel: [], tags: ['antiair'],
    turbo: { dmg: 1300, inv: [{ from: 1, to: 12, type: 'strike' }] } }),
  c1: mv({ name: 'Palhetada', startup: 14, active: 1, recovery: 22, anim: ['backdash', 'cast'], motion: [{ from: 1, to: 10, vx: -11 }], spawn: [{ at: 14, ...note({ vx: 10, life: 80 }) }], range: 800, tags: ['zone', 'far'] }),
  c2: mv({ name: 'Slide de Palco', startup: 9, active: 12, recovery: 18, crouch: true, guard: 'low', box: bx(20, 0, 230, 90), dmg: 700, launch: [4, 12], effects: frost(), anim: ['crouch', 'sweep'], motion: [{ from: 6, to: 22, vx: 15 }], cancel: [], tags: ['low', 'advance', 'mid'] }),
  SA1: mv({ name: 'Feedback', btn: 'X', startup: 10, active: 1, recovery: 34, anim: ['swingWind', 'swing'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }],
    spawn: [{ at: 10, ...note({ w: 150, h: 260, y: 120, vx: 26, life: 60, hits: 3, dmg: 650, hitstun: 26, kd: 'hard' }) }], range: 1400, tags: ['super'] }),
  SA3: mv({ name: 'Terremoto', btn: 'X', startup: 16, active: 50, recovery: 36, anim: ['swingWind', 'reload'], fx: 'quake', cost: { super: 3000 }, inv: [{ from: 1, to: 66, type: 'all' }],
    // Toca a guitarra e o chão treme no cenário inteiro: só escapa quem pular ou defender agachado.
    hits: [...[0, 1, 2].map((i) => ({ from: 17 + i * 12, to: 19 + i * 12, box: bx(-2600, 0, 5200, 130), dmg: 650, hitstun: 34, guard: 'low', push: [10, 20], effects: frost(1, 110) })), { from: 60, to: 64, box: bx(-2600, 0, 5200, 160), dmg: 2200, guard: 'low', launch: [10, 32], kd: 'hard' }],
    range: 1500, tags: ['super', 'big'] }),
};

export default {
  id: 'majis',
  name: 'MAJIS',
  style: 'Controle de média distância',
  mechName: 'TREMOR',
  mechDesc: 'Especiais de guitarra acumulam tremor no rival e o deixam lento. Com 3 acúmulos, ele fica atordoado.',
  colors: { skin: '#6b4630', top: '#e9e4da', bottom: '#3a3f5c', accent: '#b16afc', hair: '#141016', shoe: '#f0f0f0' },
  look: { hair: 'spikes', weapon: 'guitar' },
  walkF: 6.2, walkB: 4.8, jumpScale: 1, hpScale: 1,
  moves,
  mech: {
    init(f) {
      f.res = {};
    },
    onMoveFrame(st, f, o, m) {
      if (f.moveKey === 'SA3' && f.sf > m.startup && f.sf % 4 === 0) st.events.push({ t: 'shake', n: 16, x: f.x });
    },
    hud(f, o) {
      const n = o ? o.status.frost : 0;
      return { label: 'TREMOR NO RIVAL', pips: 3, value: n, ready: o?.state === 'frozen', readyText: 'ATORDOADO!', color: '#9df0ff' };
    },
  },
  ai: { aggression: 0.55, block: 0.5, antiAir: 0.6, range: 'mid' },
};
