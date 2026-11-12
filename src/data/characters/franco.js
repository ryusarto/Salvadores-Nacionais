import { mv, bx, baseNormals } from '../movekit.js';

/**
 * FRANCO, THE SIR! — equilibrado.
 * Mecânica: COMPASSO. Cada especial diferente que conecta (acerto ou defesa)
 * marca uma nota. Com 2 notas, o próximo especial diferente sai como FINAL:
 * versão turbinada de graça e com dano extra.
 */
const NOTE_WINDOW = 300;
const FINALE_DMG = 1.25;

const moves = {
  ...baseNormals({ reach: 1 }),
  '5S': mv({ name: 'Flash', startup: 9, active: 3, recovery: 19, box: bx(40, 230, 250, 200), dmg: 500, hitstun: 22, blockstun: 22, push: [60, 50], ginga: 400, effects: [{ t: 'dazzle', n: 150, onBlock: true }], anim: ['castWind', 'cast'], fx: 'flash', tags: ['mid', 'pressure'],
    turbo: { startup: 7, dmg: 700, hitstun: 30, box: bx(40, 200, 330, 260) } }),
  '6S': mv({ name: 'Giro do Guetto', startup: 12, active: 10, recovery: 22, anim: ['spinWind', 'spin'], fx: 'spin',
    hits: [{ from: 13, to: 16, box: bx(-60, 200, 260, 150), dmg: 500, hitstun: 20 }, { from: 19, to: 22, box: bx(-60, 200, 280, 150), dmg: 600, launch: [8, 20], kd: 'soft' }],
    motion: [{ from: 6, to: 22, vx: 13 }], tags: ['mid', 'advance'],
    turbo: { hits: [{ from: 13, to: 15, box: bx(-60, 200, 260, 150), dmg: 450, hitstun: 20 }, { from: 17, to: 19, box: bx(-60, 200, 270, 150), dmg: 450, hitstun: 20 }, { from: 21, to: 23, box: bx(-60, 200, 290, 170), dmg: 650, launch: [4, 30] }], recovery: 18 } }),
  '2S': mv({ name: 'Pressão Nacional', startup: 10, active: 16, recovery: 16, anim: ['punchWind', 'flurry'], fx: 'flurry',
    hits: [0, 1, 2, 3].map((i) => ({ from: 11 + i * 4, to: 12 + i * 4, box: bx(30, 240, 210, 140), dmg: i === 3 ? 450 : 250, hitstun: 18, blockstun: 16, push: i === 3 ? [130, 90] : [25, 25], ginga: 450 })),
    motion: [{ from: 8, to: 24, vx: 7 }], tags: ['close', 'pressure'],
    turbo: { hits: [0, 1, 2, 3, 4, 5].map((i) => ({ from: 9 + i * 3, to: 10 + i * 3, box: bx(30, 240, 220, 140), dmg: i === 5 ? 500 : 230, hitstun: 20, blockstun: 16, push: i === 5 ? [120, 80] : [20, 20], ginga: 450, launch: i === 5 ? [5, 26] : null })), startup: 8, recovery: 14 } }),
  '4S': mv({ name: 'Sobe o Som', startup: 5, active: 10, recovery: 30, anim: ['riseWind', 'rise'], fx: 'rise', box: bx(0, 200, 170, 320), dmg: 1100, launch: [4, 30], kd: 'soft',
    inv: [{ from: 1, to: 9, type: 'strike' }], motion: [{ from: 5, to: 9, vx: 5, vy: 27 }], flags: { landEnds: true, landRecovery: 14 }, cancel: [], tags: ['antiair', 'reversal'],
    turbo: { dmg: 1400, inv: [{ from: 1, to: 12, type: 'all' }] } }),
  SA1: mv({ name: 'Finalização', btn: 'X', startup: 8, active: 22, recovery: 34, anim: ['superWind', 'flurry'], fx: 'beam', cost: { super: 1000 },
    hits: [0, 1, 2, 3, 4].map((i) => ({ from: 9 + i * 4, to: 10 + i * 4, box: bx(30, 200, 380, 200), dmg: i === 4 ? 900 : 350, hitstun: 26, launch: i === 4 ? [14, 22] : null, kd: 'hard', push: [20, 30] })),
    inv: [{ from: 1, to: 9, type: 'all' }], motion: [{ from: 6, to: 24, vx: 9 }], tags: ['super'] }),
  SA3: mv({ name: 'Libera Tudo!', btn: 'X', startup: 10, active: 30, recovery: 46, anim: ['superWind', 'burst'], fx: 'burst', cost: { super: 3000 },
    hits: [{ from: 11, to: 13, box: bx(-260, 0, 520, 520), dmg: 900, hitstun: 40, launch: [0, 10] }, { from: 22, to: 24, box: bx(-320, 0, 640, 620), dmg: 900, launch: [0, 14] }, { from: 34, to: 38, box: bx(-380, 0, 760, 720), dmg: 2400, launch: [12, 34], kd: 'hard' }],
    inv: [{ from: 1, to: 40, type: 'all' }], tags: ['super', 'big'] }),
};

const SPECIALS = ['5S', '6S', '2S', '4S'];

export default {
  id: 'franco',
  name: 'FRANCO, THE SIR!',
  style: 'Equilibrado',
  mechName: 'COMPASSO',
  mechDesc: 'Conecte 2 especiais diferentes: o terceiro sai como FINAL, turbinado de graça.',
  colors: { skin: '#b9794c', top: '#2f8a3a', top2: '#f2c318', bottom: '#3a3a44', accent: '#2a4fb8', hair: '#1c1512', shoe: '#f0f0f0' },
  look: { hair: 'afro', weapon: null, sleeves: 'none', pants: 'shorts', stripes: [[0.42, 0.56, '#f2c318'], [0.56, 0.7, '#2a4fb8']] },
  walkF: 6.6, walkB: 5, jumpScale: 1, hpScale: 1,
  moves,
  mech: {
    init(f) {
      f.res = { notes: [], noteT: 0, finale: false };
    },
    tick(st, f) {
      if (f.res.noteT > 0 && --f.res.noteT === 0) f.res.notes = [];
    },
    modifyMove(f, m, key) {
      f.res.finale = false;
      if (SPECIALS.includes(key) && f.res.notes.length >= 2 && !f.res.notes.includes(key)) {
        f.res.finale = true;
        return f.ch.moves[key].turbo || m;
      }
      return m;
    },
    onMoveStart(st, f, m, key) {
      if (f.res.finale) {
        f.res.notes = [];
        f.res.noteT = 0;
        st.events.push({ t: 'finale', side: f.side, x: f.x });
      }
    },
    note(f) {
      const key = f.moveKey;
      if (!SPECIALS.includes(key) || f.res.finale || f.res.notes.includes(key)) return;
      f.res.notes.push(key);
      f.res.noteT = NOTE_WINDOW;
    },
    onHit(st, f, d, h, src) {
      if (src.type === 'move') this.note(f);
    },
    onBlocked(st, f, d, h, src) {
      if (src.type === 'move') this.note(f);
    },
    dmgMul(f, h, src) {
      return f.res.finale && src.type === 'move' && src.m.type === 'special' ? FINALE_DMG : 1;
    },
    hud(f) {
      return { label: 'COMPASSO', pips: 2, value: f.res.notes.length, ready: f.res.notes.length >= 2, readyText: 'FINAL!' };
    },
  },
  ai: { aggression: 0.6, block: 0.5, antiAir: 0.6, range: 'mid' },
};
