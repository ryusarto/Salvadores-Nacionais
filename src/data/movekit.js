import { SYS } from './system.js';

/**
 * Ferramentas para declarar golpes.
 *
 * Um golpe tem: startup (preparação), active (quadros que acertam) e recovery
 * (recuperação), em quadros. `hits` lista cada acerto com sua caixa
 * {x, y, w, h}: x para frente a partir do centro do lutador, y a partir do chão.
 *
 * guard: 'mid' (qualquer defesa), 'low' (só defesa agachada), 'high' (só em pé),
 *        'throw' (agarrão), 'unblock' (indefensável).
 */

const STRENGTH = {
  L: { hitstun: 14, blockstun: 11, push: [70, 60], ginga: 200, stop: SYS.HITSTOP.L },
  M: { hitstun: 18, blockstun: 14, push: [105, 95], ginga: 350, stop: SYS.HITSTOP.M },
  H: { hitstun: 22, blockstun: 17, push: [150, 135], ginga: 550, stop: SYS.HITSTOP.H },
  S: { hitstun: 22, blockstun: 17, push: [140, 130], ginga: 600, stop: SYS.HITSTOP.S },
  X: { hitstun: 30, blockstun: 22, push: [200, 180], ginga: 0, stop: SYS.HITSTOP.X },
};

const DEFAULT_CANCEL = {
  L: ['chain', 'special', 'super', 'rush'],
  M: ['chain', 'special', 'super', 'rush'],
  H: ['special', 'super', 'rush'],
  S: ['super'],
  X: [],
};

/** Normaliza a definição de um golpe (preenche padrões e calcula totais). */
export function mv(def) {
  const btn = def.btn || 'S';
  const base = STRENGTH[btn] || STRENGTH.S;
  const m = {
    name: def.name || '?',
    type: def.type || (btn === 'X' ? 'super' : btn === 'S' ? 'special' : 'normal'),
    btn,
    startup: def.startup ?? 6,
    active: def.active ?? 3,
    recovery: def.recovery ?? 12,
    anim: def.anim || ['punchWind', 'punchM'],
    air: !!def.air,
    crouch: !!def.crouch,
    cancel: def.cancel || DEFAULT_CANCEL[btn] || [],
    motion: def.motion || [],
    inv: def.inv || [],
    armor: def.armor || null,
    spawn: def.spawn || [],
    hold: def.hold || null,
    cost: def.cost || {},
    tags: def.tags || [],
    fx: def.fx || null,
    weapon: def.weapon || null,
    landCancel: def.landCancel ?? true,
    flags: def.flags || {},
  };
  const raw = def.hits || (def.box ? [{}] : []);
  m.hits = raw.map((h, idx) => ({
    from: h.from ?? m.startup + 1,
    to: h.to ?? m.startup + m.active,
    box: h.box || def.box,
    dmg: h.dmg ?? def.dmg ?? 0,
    hitstun: h.hitstun ?? def.hitstun ?? base.hitstun,
    blockstun: h.blockstun ?? def.blockstun ?? base.blockstun,
    push: h.push || def.push || base.push,
    guard: h.guard || def.guard || 'mid',
    launch: h.launch || def.launch || null,
    kd: h.kd || def.kd || null,
    crumple: h.crumple ?? def.crumple ?? false,
    ginga: h.ginga ?? def.ginga ?? base.ginga,
    chip: h.chip ?? def.chip ?? (m.type === 'normal' ? 0 : SYS.CHIP),
    // em golpes de vários acertos, só o último tem a pausa de impacto cheia
    stop: h.stop ?? def.stop ?? (idx < raw.length - 1 ? Math.min(base.stop, 5) : base.stop),
    effects: h.effects || def.effects || [],
    juggle: h.juggle ?? def.juggle ?? 1,
    pull: h.pull ?? def.pull ?? 0,
  }));
  m.total = def.total ?? m.startup + m.active + m.recovery;
  for (const h of m.hits) m.total = Math.max(m.total, h.to + 1);
  m.range = def.range ?? (m.hits.length ? Math.max(...m.hits.map((h) => h.box.x + h.box.w)) : 0);
  if (def.turbo) m.turbo = mv({ ...def, ...def.turbo, turbo: null, isTurbo: true });
  m.isTurbo = !!def.isTurbo;
  return m;
}

/** Caixa de acerto: bx(x, y, largura, altura). */
export const bx = (x, y, w, h) => ({ x, y, w, h });

/**
 * Golpes básicos compartilhados. Cada personagem recebe este conjunto e
 * sobrescreve o que for diferente.
 * @param {object} o { reach: multiplicador de alcance, dmg: multiplicador de dano,
 *   speed: quadros somados à preparação (negativo = mais rápido), anims: troca de animações }
 */
export function baseNormals(o = {}) {
  const r = o.reach ?? 1;
  const d = o.dmg ?? 1;
  const s = o.speed ?? 0;
  const a = { L: 'punchL', M: 'punchM', H: 'punchH', lowL: 'kickLow', lowM: 'sweepM', up: 'upper', sweep: 'sweep', over: 'overhead', jL: 'jPunch', jM: 'jKick', jH: 'jHeavy', ...(o.anims || {}) };
  const W = (n) => Math.round(n * r);
  const D = (n) => Math.round(n * d);
  return {
    '5L': mv({ name: 'Leve', btn: 'L', startup: 4 + s, active: 3, recovery: 8, box: bx(30, 290, W(160), 80), dmg: D(300), anim: ['punchWind', a.L], tags: ['poke', 'close'] }),
    '5M': mv({ name: 'Médio', btn: 'M', startup: 7 + s, active: 4, recovery: 14, box: bx(30, 270, W(215), 100), dmg: D(600), anim: ['punchWind', a.M], motion: [{ from: 3, to: 8, vx: 5 }], tags: ['poke', 'mid'] }),
    '5H': mv({ name: 'Forte', btn: 'H', startup: 11 + s, active: 5, recovery: 21, box: bx(30, 250, W(250), 130), dmg: D(900), anim: ['heavyWind', a.H], motion: [{ from: 5, to: 12, vx: 7 }], tags: ['poke', 'mid', 'heavy'] }),
    '2L': mv({ name: 'Leve Baixo', btn: 'L', startup: 5 + s, active: 3, recovery: 9, crouch: true, guard: 'low', box: bx(30, 30, W(170), 80), dmg: D(250), anim: ['crouch', a.lowL], tags: ['poke', 'close', 'low'] }),
    '2M': mv({ name: 'Médio Baixo', btn: 'M', startup: 8 + s, active: 4, recovery: 15, crouch: true, guard: 'low', box: bx(30, 20, W(240), 80), dmg: D(550), anim: ['crouch', a.lowM], tags: ['poke', 'mid', 'low'] }),
    '2H': mv({ name: 'Gancho', btn: 'H', startup: 8 + s, active: 6, recovery: 24, crouch: true, box: bx(10, 240, 150, 330), dmg: D(850), launch: [3, 31], anim: ['crouch', a.up], inv: [{ from: 4, to: 13, type: 'air' }], cancel: ['special', 'super'], tags: ['antiair', 'launcher'] }),
    '3H': mv({ name: 'Rasteira', btn: 'H', startup: 10 + s, active: 4, recovery: 26, crouch: true, guard: 'low', box: bx(30, 0, W(270), 70), dmg: D(800), kd: 'hard', launch: [6, 12], anim: ['crouch', a.sweep], cancel: ['super'], tags: ['low', 'knockdown', 'mid'] }),
    '6M': mv({ name: 'Golpe de Cima', btn: 'M', startup: 20, active: 3, recovery: 17, guard: 'high', box: bx(30, 230, W(190), 230), dmg: D(600), anim: ['overWind', a.over], cancel: ['super'], motion: [{ from: 8, to: 20, vx: 5 }], tags: ['overhead', 'close'] }),
    jL: mv({ name: 'Aéreo Leve', btn: 'L', air: true, startup: 4, active: 9, recovery: 4, guard: 'high', box: bx(10, 130, W(160), 130), dmg: D(300), anim: ['jumpUp', a.jL], cancel: [], tags: ['air'] }),
    jM: mv({ name: 'Aéreo Médio', btn: 'M', air: true, startup: 6, active: 7, recovery: 5, guard: 'high', box: bx(0, 80, W(200), 150), dmg: D(500), anim: ['jumpUp', a.jM], cancel: [], tags: ['air', 'crossup'] }),
    jH: mv({ name: 'Aéreo Forte', btn: 'H', air: true, startup: 8, active: 6, recovery: 6, guard: 'high', box: bx(10, 20, W(190), 220), dmg: D(800), hitstun: 24, anim: ['jumpUp', a.jH], cancel: [], tags: ['air', 'jumpin'] }),
    throw: mv({ name: 'Agarrão', btn: 'L', type: 'throw', startup: 5, active: 3, recovery: 23, guard: 'throw', box: bx(20, 140, SYS.THROW.range, 260), dmg: SYS.THROW.dmg, anim: ['throwReach', 'throwReach'], cancel: [], tags: ['throw'] }),
    blindado: mv({ name: 'Golpe Blindado', btn: 'H', type: 'utility', startup: 26, active: 4, recovery: 32, box: bx(20, 220, W(250), 170), dmg: D(800), crumple: true, ginga: 1000, push: [60, 260], hitstun: 30, blockstun: 22, anim: ['blindWind', 'blindHit'], armor: { from: 1, to: 26, hits: 2 }, motion: [{ from: 18, to: 28, vx: 9 }], cancel: [], cost: { ginga: SYS.GINGA.blindado }, tags: ['armor'] }),
  };
}

/** Definição padrão de projétil; sobrescreva o que precisar. */
export function proj(def) {
  return {
    kind: def.kind || 'shot',
    x: def.x ?? 110,
    y: def.y ?? 300,
    vx: def.vx ?? 14,
    vy: def.vy ?? 0,
    g: def.g ?? 0,
    w: def.w ?? 70,
    h: def.h ?? 60,
    life: def.life ?? 120,
    delay: def.delay ?? 0,
    hitsLeft: def.hits ?? 1,
    behavior: def.behavior || 'fly',
    color: def.color || '#ffe27a',
    hit: {
      dmg: def.dmg ?? 600,
      hitstun: def.hitstun ?? 20,
      blockstun: def.blockstun ?? 15,
      push: def.push || [90, 80],
      guard: def.guard || 'mid',
      launch: def.launch || null,
      kd: def.kd || null,
      crumple: false,
      ginga: def.ginga ?? 500,
      chip: def.chip ?? SYS.CHIP,
      stop: def.stop ?? SYS.HITSTOP.proj,
      effects: def.effects || [],
      juggle: def.juggle ?? 1,
      pull: 0,
    },
    ...(def.extra || {}),
  };
}
