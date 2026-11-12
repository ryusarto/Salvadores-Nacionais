import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * RYUCHI — espadachim de longo alcance.
 * Mecânica: POSTURA DA LÂMINA. Segure ↓+Especial para guardar a espada e
 * carregar o Fio (3 níveis). Soltar = corte carregado. Na postura, Leve = corte
 * instantâneo e Médio = contra-ataque.
 */
const FIO_STEP = 25;
const fio = (t) => Math.min(3, Math.floor((t || 0) / FIO_STEP));
const REL = [[700, 320, 20], [1000, 400, 22], [1400, 480, 24], [1900, 580, 26]];

const slashWave = (o = {}) => proj({ kind: 'slash', x: 120, y: 190, w: 70, h: 190, vx: 17, life: 90, dmg: 600, color: '#d2edf8', ...o });

const moves = {
  ...baseNormals({ reach: 1.26, speed: 1, anims: { M: 'slash', H: 'slash', up: 'slashUp' } }),
  '2S': mv({ name: 'Postura da Lâmina', startup: 8, active: 1, recovery: 12, anim: ['stance', 'stance'], weapon: 'sheath', cancel: [], hold: { at: 8, btn: 'S', max: 150, follow: { L: 'stL', M: 'stM', release: 'stRel' } }, tags: ['setup'] }),
  stL: mv({ name: 'Corte Relâmpago', startup: 5, active: 3, recovery: 17, box: bx(30, 210, 360, 130), dmg: 650, hitstun: 20, anim: ['stance', 'slash'], cancel: ['super'], tags: [] }),
  stM: mv({ name: 'Contra-Lâmina', startup: 2, active: 14, recovery: 20, anim: ['stance', 'parry'], weapon: 'sheath', cancel: [], flags: { counter: { from: 3, to: 16, into: 'stCtr' } }, tags: [] }),
  stCtr: mv({ name: 'Contra-Lâmina', startup: 3, active: 4, recovery: 22, box: bx(-40, 150, 440, 300), dmg: 1500, launch: [10, 22], kd: 'hard', anim: ['stance', 'slash'], inv: [{ from: 1, to: 8, type: 'all' }], cancel: [], tags: [] }),
  ...Object.fromEntries(REL.map(([dmg, w, stun], i) => [`stRel${i}`, mv({ name: i === 3 ? 'Corte do Fio Pleno' : 'Corte Carregado', startup: 6, active: 4, recovery: 22, box: bx(30, 190, w, 170), dmg, hitstun: stun, crumple: i === 3, push: [160, 140], anim: ['stance', 'slash'], motion: [{ from: 3, to: 9, vx: 10 + i * 3 }], cancel: ['super'], tags: [] })])),
  '5S': mv({ name: 'Onda Cortante', startup: 15, active: 1, recovery: 26, anim: ['heavyWind', 'slash'], spawn: [{ at: 15, ...slashWave() }], range: 1400, tags: ['zone', 'far'],
    turbo: { spawn: [{ at: 12, ...slashWave({ vx: 22, hits: 2, dmg: 500 }) }] } }),
  '6S': mv({ name: 'Passo Cortante', startup: 10, active: 7, recovery: 22, box: bx(-110, 200, 320, 150), dmg: 900, hitstun: 24, anim: ['stance', 'slash'], motion: [{ from: 10, to: 17, vx: 36 }], flags: { phase: true }, range: 330, tags: ['mid', 'advance', 'far'],
    turbo: { dmg: 1100, launch: [-6, 24] } }),
  '4S': mv({ name: 'Lua Crescente', startup: 5, active: 9, recovery: 30, box: bx(0, 200, 240, 380), dmg: 1200, launch: [4, 30], anim: ['riseWind', 'slashUp'], inv: [{ from: 1, to: 7, type: 'strike' }], motion: [{ from: 5, to: 9, vx: 5, vy: 26 }], flags: { landEnds: true, landRecovery: 15 }, cancel: [], tags: ['antiair', 'reversal'],
    turbo: { dmg: 1500, inv: [{ from: 1, to: 11, type: 'all' }] } }),
  SA1: mv({ name: 'Agudo', btn: 'X', startup: 8, active: 16, recovery: 34, anim: ['superWind', 'burst'], cost: { super: 1000 }, inv: [{ from: 1, to: 12, type: 'all' }],
    hits: [{ from: 9, to: 12, box: bx(-220, 0, 540, 520), dmg: 700, hitstun: 30 }, { from: 20, to: 24, box: bx(-260, 0, 620, 560), dmg: 1300, launch: [12, 26], kd: 'hard' }], tags: ['super'] }),
  SA3: mv({ name: 'Agudo Supremo', btn: 'X', startup: 10, active: 40, recovery: 40, anim: ['stance', 'slash'], cost: { super: 3000 }, inv: [{ from: 1, to: 50, type: 'all' }],
    hits: [{ from: 11, to: 14, box: bx(0, 100, 820, 300), dmg: 900, hitstun: 40 }, { from: 26, to: 29, box: bx(0, 100, 820, 320), dmg: 900, hitstun: 40 }, { from: 46, to: 50, box: bx(-200, 0, 1100, 620), dmg: 2700, launch: [14, 32], kd: 'hard' }], tags: ['super', 'big'] }),
};

export default {
  id: 'ryuchi',
  name: 'RYUCHI',
  style: 'Espadachim de longo alcance',
  mechName: 'POSTURA DA LÂMINA',
  mechDesc: 'Segure ↓+Especial para carregar o Fio. Soltar = corte carregado. Na postura: Leve = corte instantâneo, Médio = contra-ataque.',
  colors: { skin: '#e0b08a', top: '#2c3140', bottom: '#3a3530', accent: '#d2edf8', hair: '#1a1418', hat: '#e8e4dc', shoe: '#f0f0f0' },
  look: { hair: 'bucket', weapon: 'katana', sleeves: 'long', glasses: true },
  walkF: 7.1, walkB: 5.4, jumpScale: 1.02, hpScale: 1,
  moves,
  mech: {
    init(f) {
      f.res = {};
    },
    remap(f, key) {
      return key === 'stRel' ? `stRel${fio(f.holdLevel)}` : key;
    },
    hud(f) {
      const n = f.state === 'attack' && f.moveKey === '2S' ? fio(f.holdT) : 0;
      return { label: 'FIO', pips: 3, value: n, ready: n >= 3, readyText: 'PLENO!', color: '#d2edf8' };
    },
    aiPlan(st, f, o, dist, rnd) {
      return dist > 520 && rnd() < 0.25 ? { key: '5S' } : null;
    },
  },
  ai: { aggression: 0.6, block: 0.5, antiAir: 0.65, range: 'mid' },
};
