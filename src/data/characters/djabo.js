import { mv, bx, baseNormals, proj } from '../movekit.js';
import { SYS } from '../system.js';

/**
 * DJABO — chefe final (Capítulo 7, inferno). O político por trás de todos.
 *
 * Fase 1, O POLÍTICO: de terno, tridente como cetro. Usa um golpe roubado de
 * cada chefe anterior: o Laço da Zanata, a Sugada do Chupetinha, o Carimbo do
 * Pavanassi, a Mala do Fujão e a Muralha do Laranjão.
 * Fase 2, O DEMÔNIO: quando a vida zera na fase 1, ele não cai. O terno queima,
 * surgem chifres e asas, e a luta recomeça com a vida cheia: Tridente de Fogo,
 * Bola de Fogo, Coluna do Inferno e Mergulho.
 * Super de 3 barras, INFERNO NACIONAL: o chão inteiro pega fogo, menos um trecho.
 */
export const DJ = {
  transformFrames: 100,
  suck: SYS.GINGA.pip,
  fireDmg: 70,
  fireLife: 260,
  safeW: 360, // largura do trecho seguro no Inferno Nacional
};

// ---------- peças roubadas e de fogo ----------
const stamp = (o = {}) => proj({ kind: 'carimbo', x: 100, y: 300, w: 70, h: 60, vx: 14, life: 100, dmg: 600, color: '#c8102e',
  effects: [{ t: 'ban', frames: 200 }], ...o });
const bag = { make: (st, f) => ({ kind: 'mala', behavior: 'puddle', x: 90, y: 0, w: 120, h: 60, vx: 0, life: 420, hitsLeft: 0, hit: null, color: '#8a5a2a', slip: 46, delay: 0 }) };
const wall = {
  make: (st, f) => {
    const old = st.ents.find((e) => e.owner === f.side && e.kind === 'muralha');
    if (old) old.dead = true;
    return { kind: 'muralha', behavior: 'barrier', x: 220, y: 0, w: 110, h: 640, hitH: 640, vx: 0, life: 300, hp: 4, hit: null, delay: 0, breakText: 'A MURALHA CAIU!' };
  },
};
const fireball = (o = {}) => proj({ kind: 'fogo', x: 100, y: 300, w: 90, h: 80, vx: 15, life: 110, dmg: 750, color: '#ff6a1a', ...o });
const column = (delay, dx = 0) => ({
  make: (st, f) => proj({ kind: 'coluna', behavior: 'strike', x: 0, y: 0, w: 200, h: 760, vx: 0, delay, life: 10, dmg: 1100, hitstun: 30, blockstun: 22, push: [0, 50],
    launch: [3, 28], kd: 'hard', color: '#ff6a1a', extra: { at_opponent: true, delay0: delay, ox: dx } }),
});

/** Inferno Nacional: fogo no chão do cenário inteiro, menos um trecho seguro sorteado. */
const nationalHell = {
  make: (st, f) => {
    for (const e of st.ents) if (e.owner === f.side && e.kind === 'chao-fogo') e.dead = true;
    const left = SYS.WALL_PAD;
    const right = SYS.STAGE_W - SYS.WALL_PAD;
    const safeL = left + st.rng() * (right - left - DJ.safeW);
    const safeR = safeL + DJ.safeW;
    f.res.safe = [safeL, safeR];
    const W = 240;
    for (let x = left; x < right; x += W) {
      const a = Math.max(x, left);
      const b = Math.min(x + W, right);
      // corta o pedaço que cai no trecho seguro
      for (const [l, r] of [[a, Math.min(b, safeL)], [Math.max(a, safeR), b]]) {
        if (r - l < 30) continue;
        st.ents.push({ kind: 'chao-fogo', behavior: 'fly', x: (l + r) / 2, y: 0, w: r - l, h: 90, vx: 0, vy: 0, g: 0, life: DJ.fireLife, delay: 20, delay0: 20, age: 0, hitCD: 0,
          hitsLeft: 99, id: st.nextId++, owner: f.side, dir: f.face,
          hit: { dmg: DJ.fireDmg, hitstun: 2, blockstun: 2, push: [0, 0], guard: 'unblock', launch: null, kd: null, crumple: false, ginga: 0, chip: 0, stop: 0, effects: [], juggle: 0, pull: 0 } });
      }
    }
    st.events.push({ t: 'pop', str: 'INFERNO NACIONAL!', x: f.x, y: 680, color: '#ff6a1a', size: 56 });
    return null;
  },
};

const hellSuper = mv({ name: 'Inferno Nacional', btn: 'X', startup: 14, active: 1, recovery: 40, anim: ['superWind', 'burst'], cost: { super: 3000 }, inv: [{ from: 1, to: 20, type: 'all' }],
  spawn: [{ at: 14, ...nationalHell }], range: 2600, tags: ['super', 'big'] });

// ---------- fase 1: o Político ----------
const politicianMoves = {
  ...baseNormals({ reach: 1.1, dmg: 1.15, anims: { H: 'swing' } }),
  '5H': mv({ name: 'Cetro', btn: 'H', startup: 12, active: 5, recovery: 23, box: bx(30, 230, 300, 140), dmg: 1000, anim: ['swingWind', 'swing'], weapon: 'tridente', tags: ['poke', 'mid', 'heavy'] }),
  '5S': mv({ name: 'Carimbo Roubado', startup: 13, active: 1, recovery: 24, anim: ['castWind', 'cast'], spawn: [{ at: 13, ...stamp() }], range: 1400, tags: ['zone', 'far'] }),
  '6S': mv({ name: 'Laço Roubado', weapon: 'whip', startup: 18, active: 4, recovery: 26, box: bx(80, 240, 620, 100), dmg: 500, hitstun: 38, pull: 520, anim: ['whipWind', 'whipHi'], fx: 'lasso', tags: ['far', 'pull'] }),
  '4S': mv({ name: 'Sugada Roubada', startup: 11, active: 5, recovery: 24, box: bx(40, 220, 230, 140), dmg: 750, hitstun: 26, anim: ['punchWind', 'punchH'], motion: [{ from: 4, to: 13, vx: 11 }], tags: ['close', 'suck'] }),
  '2S': mv({ name: 'Mala Roubada', startup: 8, active: 1, recovery: 16, crouch: true, anim: ['crouch', 'crouch'], spawn: [{ at: 8, ...bag }], range: 300, tags: ['zone', 'trap'] }),
  SA1: mv({ name: 'Muralha Roubada', btn: 'X', startup: 14, active: 1, recovery: 30, anim: ['superWind', 'burst'], cost: { super: 1000 }, inv: [{ from: 1, to: 16, type: 'all' }], spawn: [{ at: 14, ...wall }], range: 500, tags: ['super', 'zone'] }),
  SA3: hellSuper,
};

// ---------- fase 2: o Demônio ----------
const demonMoves = {
  ...baseNormals({ reach: 1.15, dmg: 1.1, speed: -1, anims: { H: 'swing' } }),
  '5H': mv({ name: 'Tridente de Fogo', btn: 'H', startup: 11, active: 6, recovery: 22, box: bx(30, 220, 380, 120), dmg: 1100, anim: ['swingWind', 'swing'], weapon: 'tridente', fx: 'crack', tags: ['poke', 'mid', 'heavy', 'far'] }),
  '5S': mv({ name: 'Bola de Fogo', startup: 12, active: 1, recovery: 20, anim: ['castWind', 'cast'], spawn: [{ at: 12, ...fireball() }], range: 1400, tags: ['zone', 'far'],
    turbo: { startup: 9, spawn: [{ at: 9, ...fireball({ vx: 19, dmg: 850 }) }] } }),
  '6S': mv({ name: 'Arremesso do Tridente', startup: 15, active: 1, recovery: 24, anim: ['swingWind', 'swing'], spawn: [{ at: 15, ...proj({ kind: 'tridente', x: 100, y: 280, w: 160, h: 50, vx: 22, life: 70, hits: 2, dmg: 600, color: '#ff6a1a' }) }], range: 1500, tags: ['zone', 'far'] }),
  '2S': mv({ name: 'Coluna do Inferno', startup: 14, active: 1, recovery: 26, anim: ['superWind', 'burst'], spawn: [{ at: 14, ...column(34) }], range: 1500, tags: ['zone', 'far'] }),
  // Mergulho: sobe batendo as asas e cai em cima do herói.
  '4S': mv({ name: 'Mergulho', startup: 6, active: 20, recovery: 22, box: bx(0, 0, 220, 300), dmg: 1100, launch: [6, 18], kd: 'hard', anim: ['riseWind', 'jHeavy'],
    inv: [{ from: 1, to: 10, type: 'strike' }], motion: [{ from: 6, to: 14, vx: 9, vy: 26 }], flags: { landEnds: true, landRecovery: 18 }, cancel: [], tags: ['antiair', 'reversal'] }),
  SA1: mv({ name: 'Chamas do Djabo', btn: 'X', startup: 9, active: 24, recovery: 34, anim: ['superWind', 'burst'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }],
    spawn: [{ at: 10, ...column(14, -220) }, { at: 12, ...column(20, 0) }, { at: 14, ...column(26, 220) }], range: 1500, tags: ['super'] }),
  SA3: hellSuper,
};

const base = {
  id: 'djabo',
  name: 'DJABO',
  boss: true,
  place: 'INFERNO',
  stage: 'inferno', // cenário próprio (src/render/inferno-stage.js)
  walkF: 5.2, walkB: 4.6, jumpScale: 0.95, hpScale: 0.9, // cada forma tem uma barra; as duas somam 1,8×
  ai: { aggression: 0.62, block: 0.6, antiAir: 0.7, range: 'mid' },
};

/** Forma de demônio: troca a ficha inteira (golpes, cores e chifres) e mantém a mesma mecânica. */
export const demon = {
  ...base,
  style: 'Chefe final — o Demônio',
  mechName: 'O DEMÔNIO',
  mechDesc: 'Fogo, tridente e voo. No Inferno Nacional, procure o trecho do chão sem fogo.',
  colors: { skin: '#c8342a', top: '#2a0e12', top2: '#5a1a1e', bottom: '#2a0e12', accent: '#f3c426', hair: '#1c0a0c', shoe: '#1c0a0c' },
  look: { hair: 'horns', weapon: 'tridente', sleeves: 'none' },
  walkF: 6.2,
  moves: demonMoves,
  form: 2,
};

const djabo = {
  ...base,
  style: 'Chefe final — o Político',
  mechName: 'O POLÍTICO',
  mechDesc: 'Usa um golpe de cada chefe. Zerou a vida? Ainda não acabou.',
  colors: { skin: '#e2a88a', top: '#141018', top2: '#f4f0ea', bottom: '#141018', accent: '#c8102e', hair: '#1c1418', shoe: '#0c0a0c' },
  look: { hair: 'spikes', weapon: 'tridente', sleeves: 'long' },
  moves: politicianMoves,
  form: 1,
  mech: {
    init(f) {
      f.res = { safe: null };
    },
    beforeKo(st, f) {
      if (f.ch.form !== 1) return false;
      // O terno queima: vira o Demônio com a vida cheia
      f.ch = demon;
      f.hp = f.maxHp;
      f.state = 'frozen';
      f.sf = 0;
      f.move = null;
      f.moveKey = null;
      f.stun = DJ.transformFrames;
      f.y = 0;
      f.vx = 0;
      f.vy = 0;
      f.comboHits = 0;
      f.comboDmg = 0;
      f.juggle = 0;
      f.status.invuln = DJ.transformFrames;
      f.super = SYS.SUPER.max;
      st.events.push({ t: 'pop', str: 'O TERNO QUEIMA!', x: f.x, y: 640, color: '#ff6a1a', size: 56 });
      st.events.push({ t: 'transform', side: f.side, x: f.x });
      return true;
    },
    onHit(st, f, d, h, src) {
      if (src.type !== 'move' || !src.m.tags.includes('suck') || d.hp <= 0) return;
      const stolen = Math.min(DJ.suck, Math.max(0, d.ginga));
      d.ginga -= DJ.suck;
      d.gingaPause = SYS.GINGA.regenPause;
      if (d.ginga <= 0) {
        d.ginga = 0;
        if (!d.burnout) {
          d.burnout = true;
          st.events.push({ t: 'burnout', side: d.side });
        }
      }
      if (!f.burnout) f.ginga = Math.min(SYS.GINGA.max, f.ginga + stolen);
      st.events.push({ t: 'pop', str: 'SUGADA ROUBADA!', x: d.x, y: 480, color: '#ff8fc0', size: 40 });
    },
    hud(f, o, st) {
      const fire = st && st.ents.some((e) => e.owner === f.side && e.kind === 'chao-fogo');
      if (fire) return { label: 'INFERNO', pips: 0, value: 0, ready: true, readyText: 'ACHE O CHÃO SEM FOGO', color: '#ff6a1a' };
      return f.ch.form === 1
        ? { label: 'FASE', pips: 2, value: 1, ready: false, text: 'O POLÍTICO', color: '#c8102e' }
        : { label: 'FASE', pips: 2, value: 2, ready: true, readyText: 'O DEMÔNIO', color: '#ff6a1a' };
    },
    aiPlan(st, f, o, dist, rnd) {
      if (f.ch.form === 1) {
        if (dist > 420 && !o.status.ban && rnd() < 0.14) return { key: '5S' };
        if (dist > 300 && dist < 650 && rnd() < 0.08) return { key: '6S' };
        if (dist < 230 && rnd() < 0.1) return { key: '4S' };
        if (dist > 250 && dist < 450 && rnd() < 0.02) return { key: '2S' };
        return null;
      }
      if (dist > 400 && rnd() < 0.14) return { key: '5S' };
      if (dist > 350 && rnd() < 0.06) return { key: '2S' };
      if (dist > 500 && rnd() < 0.05) return { key: '6S' };
      return null;
    },
  },
};
demon.mech = djabo.mech;

export default djabo;
