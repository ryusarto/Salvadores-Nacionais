import { mv, bx, baseNormals, proj } from '../movekit.js';
import { SYS } from '../system.js';

/**
 * FUJÃO — chefe do Capítulo 4 (aeroporto, na pista, com o avião atrás).
 * Bate com a mala de viagem, joga malas e larga malas esquecidas no chão
 * (quem correr por cima tropeça).
 *
 * Mecânica: FUGA.
 * - Longe do canto, no segundo golpe de um combo ele foge: corre para trás,
 *   intocável, e larga uma mala. A fuga recarrega em 5 s.
 * - Encurralado (perto de uma parede), não foge: é ali que se bate de verdade.
 * - Embarque: perto da escada do avião e sem ninguém por perto, ele embarca
 *   aos poucos; se completar, recupera vida. Chegar perto interrompe.
 */
export const FUGA = {
  corner: 300, // distância da parede que conta como encurralado
  cooldown: 300, // quadros entre duas fugas
  comboHits: 2, // foge no segundo golpe do combo
  stairsX: SYS.STAGE_W - 300, // escada do avião
  stairsRange: 280,
  calm: 480, // distância do herói para conseguir embarcar
  boardFrames: 90,
  boardHeal: 0.1, // fração da vida máxima
  boardCD: 600,
};

export const isCornered = (f) => f.x < SYS.WALL_PAD + FUGA.corner || f.x > SYS.STAGE_W - SYS.WALL_PAD - FUGA.corner;

const MALA = { kind: 'mala', behavior: 'puddle', y: 0, w: 120, h: 60, vx: 0, life: 480, hitsLeft: 0, hit: null, color: '#8a5a2a', slip: 46, delay: 0 };
const dropBag = (x) => ({
  make: (st, f) => {
    const mine = st.ents.filter((e) => e.owner === f.side && e.kind === 'mala' && e.behavior === 'puddle');
    if (mine.length >= 2) mine[0].dead = true;
    return { ...MALA, x };
  },
});
const thrownBag = (o = {}) => proj({ kind: 'mala-voando', x: 80, y: 300, w: 80, h: 60, vx: 14, vy: 12, g: 0.9, life: 110, dmg: 780, color: '#8a5a2a', ...o });
const fallingBag = (delay, dx) => ({
  make: (st, f) => {
    const o = st.f[1 - f.side];
    return proj({ kind: 'mala-caindo', behavior: 'strike', x: 0, y: 0, w: 170, h: 700, vx: 0, delay, life: 8, dmg: 520, hitstun: 26, blockstun: 18, push: [0, 40], launch: dx === 0 ? [2, 22] : null, kd: dx === 0 ? 'hard' : null, color: '#8a5a2a',
      extra: { at_opponent: true, delay0: delay, ox: dx * Math.sign(o.x - f.x || 1) } });
  },
});

const moves = {
  ...baseNormals({ reach: 1.0, dmg: 1.2, speed: -1, anims: { H: 'kickHigh' } }),
  '5H': mv({ name: 'Malada', btn: 'H', startup: 11, active: 5, recovery: 22, box: bx(30, 220, 260, 150), dmg: 900, anim: ['swingWind', 'swing'], motion: [{ from: 4, to: 11, vx: 8 }], weapon: 'mala', tags: ['poke', 'mid', 'heavy'] }),
  '5S': mv({ name: 'Mala Arremessada', startup: 12, active: 1, recovery: 22, anim: ['castWind', 'cast'], spawn: [{ at: 12, ...thrownBag() }], range: 900, tags: ['zone', 'far'],
    turbo: { startup: 9, spawn: [{ at: 9, ...thrownBag({ vx: 17, dmg: 800 }) }] } }),
  '2S': mv({ name: 'Mala Esquecida', startup: 8, active: 1, recovery: 16, crouch: true, anim: ['crouch', 'crouch'], spawn: [{ at: 8, ...dropBag(60) }], range: 300, tags: ['zone', 'trap'] }),
  // Fuga: corre para trás sem levar golpe e larga uma mala no caminho.
  '4S': mv({ name: 'Fuga', type: 'special', startup: 1, active: 22, recovery: 8, anim: ['backdash', 'backdash'], motion: [{ from: 1, to: 22, vx: -26 }],
    inv: [{ from: 1, to: 24, type: 'all' }], spawn: [{ at: 2, ...dropBag(-20) }], flags: { phase: true }, cancel: [], tags: ['evade'] }),
  // Carrinho de bagagem: avança empurrando o carrinho.
  '6S': mv({ name: 'Carrinho de Bagagem', startup: 13, active: 14, recovery: 22, box: bx(30, 0, 220, 260), dmg: 850, launch: [8, 14], kd: 'hard', anim: ['runA', 'punchH'], motion: [{ from: 8, to: 26, vx: 17 }], tags: ['far', 'rush'],
    turbo: { startup: 10, dmg: 1050 } }),
  SA1: mv({ name: 'Pista Livre', btn: 'X', startup: 8, active: 20, recovery: 34, anim: ['runA', 'punchH'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }], motion: [{ from: 8, to: 26, vx: 22 }],
    hits: [0, 1, 2, 3].map((i) => ({ from: 9 + i * 5, to: 11 + i * 5, box: bx(20, 60, 240, 360), dmg: i === 3 ? 900 : 340, hitstun: 26, push: [8, 24], launch: i === 3 ? [10, 22] : null, kd: 'hard' })),
    tags: ['super'] }),
  // Esteira Despencando: malas caem do céu em cima do herói.
  SA3: mv({ name: 'Esteira Despencando', btn: 'X', startup: 10, active: 1, recovery: 50, anim: ['castWind', 'cast'], cost: { super: 3000 }, inv: [{ from: 1, to: 20, type: 'all' }],
    spawn: [{ at: 10, ...fallingBag(18, -170) }, { at: 12, ...fallingBag(24, 170) }, { at: 14, ...fallingBag(30, -90) }, { at: 16, ...fallingBag(36, 90) }, { at: 18, ...fallingBag(46, 0) }],
    range: 1500, tags: ['super', 'big'] }),
};

export default {
  id: 'fujao',
  spriteProfile: 'six-frame', spriteScale: 0.7631, spriteRecovery: true,
  spriteFacingPacks: { right: 'fujao', left: 'fujao-esquerda' },
  spriteStatePhases: true, spritePhasedMoves: Object.keys(moves),
  spriteTurboMoves: ['5S', '6S'],
  spriteHitFrames: { SA1: [1, 2, 3, 4] },
  spriteHitGapFrames: { SA1: [1, 2, 3] },
  spriteSpawnFrames: { SA3: [2, 2, 3, 3, 4] },
  name: 'FUJÃO',
  style: 'Chefe — fuga e armadilhas',
  mechName: 'FUGA',
  mechDesc: 'Longe do canto, foge no meio do combo e larga malas. Encurrale perto da parede e não deixe ele embarcar.',
  colors: { skin: '#e6b892', top: '#39353b', top2: '#ffffff', bottom: '#39353b', accent: '#8a5a2a', hair: '#3e302a', shoe: '#52372a' },
  look: { hair: 'short', weapon: 'mala', sleeves: 'long' },
  walkF: 7.0, walkB: 7.4, jumpScale: 1.0, hpScale: 1.4,
  boss: true,
  place: 'AEROPORTO',
  stage: 'aeroporto', // cenário próprio (src/render/airport-stage.js)
  moves,
  mech: {
    init(f) {
      f.res = { escapeCD: 0, cornered: false, board: 0, boardCD: 0 };
    },
    escape(st, f, o) {
      if (f.res.escapeCD > 0 || f.y > 0 || isCornered(f) || f.comboHits < FUGA.comboHits) return null;
      f.res.escapeCD = FUGA.cooldown;
      st.events.push({ t: 'pop', str: 'FUGIU!', x: f.x, y: 560, color: '#ffcf2a', size: 48 });
      st.events.push({ t: 'escape', side: f.side, x: f.x });
      return '4S';
    },
    tick(st, f, o) {
      const r = f.res;
      if (r.escapeCD > 0) r.escapeCD--;
      if (r.boardCD > 0) r.boardCD--;
      const cornered = isCornered(f);
      if (cornered && !r.cornered && f.hp > 0) st.events.push({ t: 'pop', str: 'ENCURRALADO!', x: f.x, y: 600, color: '#ff5a4a', size: 46 });
      r.cornered = cornered;
      // Embarque: perto da escada, sem ninguém por perto
      const atStairs = Math.abs(f.x - FUGA.stairsX) < FUGA.stairsRange && f.y <= 0 && f.state !== 'ko';
      const calm = Math.abs(o.x - f.x) > FUGA.calm;
      if (atStairs && calm && !r.boardCD && f.hp > 0 && f.hp < f.maxHp) {
        if (r.board === 0) st.events.push({ t: 'pop', str: 'EMBARCANDO…', x: f.x, y: 600, color: '#9ff5e8', size: 38 });
        if (++r.board >= FUGA.boardFrames) {
          f.hp = Math.min(f.maxHp, f.hp + Math.round(f.maxHp * FUGA.boardHeal));
          r.board = 0;
          r.boardCD = FUGA.boardCD;
          st.events.push({ t: 'pop', str: 'QUASE EMBARCOU! +VIDA', x: f.x, y: 600, color: '#9ff5e8', size: 40 });
        }
      } else if (r.board > 0) {
        if (!calm) st.events.push({ t: 'pop', str: 'EMBARQUE NEGADO!', x: f.x, y: 600, color: '#ffcf2a', size: 40 });
        r.board = 0;
      }
    },
    hud(f) {
      const r = f.res;
      if (r.board > 0) return { label: 'EMBARQUE', pips: 3, value: Math.floor((3 * r.board) / FUGA.boardFrames), ready: false, text: 'EMBARCANDO', color: '#9ff5e8' };
      if (r.cornered) return { label: 'FUGA', pips: 0, value: 0, ready: true, readyText: 'ENCURRALADO', color: '#ff5a4a' };
      return { label: 'FUGA', pips: 0, value: 0, ready: r.escapeCD <= 0, readyText: 'PRONTA', text: `VOLTA EM ${Math.ceil(r.escapeCD / 60)}s`, color: '#ffcf2a' };
    },
    aiPlan(st, f, o, dist, rnd) {
      // tropeçou na mala: atropela com o carrinho
      if ((o.state === 'slip' || o.state === 'frozen') && dist < 700) return { key: '6S' };
      if (!isCornered(f) && dist < 200 && rnd() < 0.04) return { key: '4S' };
      if (dist > 350 && dist < 900 && rnd() < 0.12) return { key: '5S' };
      if (dist > 250 && dist < 500 && rnd() < 0.02) return { key: '2S' };
      if (dist > 380 && dist < 650 && rnd() < 0.08) return { key: '6S' };
      return null;
    },
  },
  ai: { aggression: 0.65, block: 0.6, antiAir: 0.65, range: 'mid' },
};
