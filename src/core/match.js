import { SYS } from '../data/system.js';
import { EMPTY_INPUT, feed } from './input.js';
import { createFighter, updateFighter, setState, emit } from './fighter.js';
import { resolveCombat } from './combat.js';
import { updateEntities } from './entities.js';

/** Gerador de números pseudoaleatórios com semente (determinístico). */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Cria uma luta.
 * @param {object} o { chars: [fichaP1, fichaP2], seed, training }
 */
export function createMatch(o) {
  const mid = SYS.STAGE_W / 2;
  const st = {
    f: [createFighter(o.chars[0], 0, mid - SYS.START_GAP / 2), createFighter(o.chars[1], 1, mid + SYS.START_GAP / 2)],
    ents: [],
    events: [],
    nextId: 1,
    frame: 0,
    freeze: 0,
    phase: 'intro',
    pf: 0,
    round: 1,
    timer: SYS.ROUND_SECONDS * SYS.FPS,
    winner: null,
    roundWinner: null,
    training: !!o.training,
    rng: makeRng(o.seed ?? 1),
  };
  return st;
}

function resetRound(st) {
  const mid = SYS.STAGE_W / 2;
  const old = st.f;
  st.f = [createFighter(old[0].ch, 0, mid - SYS.START_GAP / 2), createFighter(old[1].ch, 1, mid + SYS.START_GAP / 2)];
  st.f.forEach((f, i) => {
    f.rounds = old[i].rounds;
    f.super = old[i].super;
  });
  st.ents = [];
  st.timer = SYS.ROUND_SECONDS * SYS.FPS;
  st.phase = 'intro';
  st.pf = 0;
  st.round++;
  st.roundWinner = null;
}

function bodies(st) {
  const [a, b] = st.f;
  const P = SYS.BODY.push;
  const solid = (f) => f.state !== 'thrown' && f.state !== 'throwing' && f.state !== 'knockdown' && f.state !== 'ko';
  if (solid(a) && solid(b) && Math.abs(a.y - b.y) < 260) {
    const d = b.x - a.x;
    const ov = P - Math.abs(d);
    if (ov > 0) {
      const s = d === 0 ? (a.side === 0 ? 1 : -1) : Math.sign(d);
      a.x -= (s * ov) / 2;
      b.x += (s * ov) / 2;
    }
  }
  const lo = SYS.WALL_PAD;
  const hi = SYS.STAGE_W - SYS.WALL_PAD;
  for (const f of st.f) f.x = Math.max(lo, Math.min(hi, f.x));
  // Depois de encostar na parede, quem sobrou em cima do outro é empurrado de volta
  if (solid(a) && solid(b) && Math.abs(a.y - b.y) < 260) {
    const d = b.x - a.x;
    const ov = P - Math.abs(d);
    if (ov > 0) {
      const s = d === 0 ? 1 : Math.sign(d);
      if (a.x <= lo + 1 || a.x >= hi - 1) b.x += s * ov;
      else a.x -= s * ov;
    }
  }
  const dist = Math.abs(a.x - b.x);
  if (dist > SYS.MAX_DIST) {
    const ex = (dist - SYS.MAX_DIST) / 2;
    const s = Math.sign(b.x - a.x);
    a.x += s * ex;
    b.x -= s * ex;
  }
}

function meters(st) {
  const G = SYS.GINGA;
  for (const f of st.f) {
    if (f.burnout) {
      f.ginga += G.burnoutRegen;
      if (f.ginga >= G.max) {
        f.ginga = G.max;
        f.burnout = false;
        emit(st, { t: 'recover', side: f.side });
      }
    } else if (f.gingaPause > 0) f.gingaPause--;
    else if (f.state !== 'parry') f.ginga = Math.min(G.max, f.ginga + G.regen);
    f.ch.mech?.tick?.(st, f, st.f[1 - f.side]);
    if (st.training) {
      const o = st.f[1 - f.side];
      if (f.comboHits === 0 && f.state !== 'ko') f.hp = Math.min(f.maxHp, f.hp + 60);
      if (o.comboHits === 0) f.super = Math.min(SYS.SUPER.max, f.super + 6);
    }
  }
}

/**
 * Avança a luta um quadro.
 * @param {object} st estado da luta
 * @param {object} in0 entrada do jogador 1
 * @param {object} in1 entrada do jogador 2
 */
export function step(st, in0 = EMPTY_INPUT, in1 = EMPTY_INPUT) {
  st.events = [];
  st.frame++;
  st.pf++;
  const live = st.phase === 'fight';
  const ins = live ? [in0, in1] : [EMPTY_INPUT, EMPTY_INPUT];
  const [a, b] = st.f;

  if (st.freeze > 0) {
    st.freeze--;
    feed(a.buf, ins[0], a.face, true);
    feed(b.buf, ins[1], b.face, true);
    return st;
  }
  st.f.forEach((f, i) => feed(f.buf, ins[i], f.face, f.hitstop > 0));
  st.f.forEach((f, i) => {
    if (f.hitstop > 0) f.hitstop--;
    else updateFighter(st, f, st.f[1 - i]);
  });
  bodies(st);
  updateEntities(st);
  resolveCombat(st);
  meters(st);

  if (st.phase === 'intro') {
    if (st.pf >= SYS.INTRO_FRAMES) {
      st.phase = 'fight';
      st.pf = 0;
      emit(st, { t: 'fight' });
    }
  } else if (st.phase === 'fight') {
    if (!st.training) st.timer--;
    const dead = st.f.filter((f) => f.hp <= 0);
    if (st.training) {
      for (const f of dead) {
        f.hp = f.maxHp;
      }
    } else if (dead.length || st.timer <= 0) {
      let w = null;
      if (dead.length === 1) w = 1 - dead[0].side;
      else if (!dead.length) {
        const ra = a.hp / a.maxHp;
        const rb = b.hp / b.maxHp;
        w = ra > rb ? 0 : rb > ra ? 1 : null;
        emit(st, { t: 'timeup' });
      }
      st.roundWinner = w;
      if (w === null) st.f.forEach((f) => f.rounds++);
      else st.f[w].rounds++;
      st.phase = 'ko';
      st.pf = 0;
    }
  } else if (st.phase === 'ko') {
    if (st.pf === 70 && st.roundWinner !== null) {
      const w = st.f[st.roundWinner];
      if (w.y <= 0 && w.hp > 0) setState(w, 'win');
    }
    if (st.pf >= SYS.KO_FRAMES) {
      const need = SYS.ROUNDS_TO_WIN;
      if (a.rounds >= need || b.rounds >= need) {
        st.phase = 'over';
        st.winner = a.rounds > b.rounds ? 0 : b.rounds > a.rounds ? 1 : null;
        emit(st, { t: 'over', winner: st.winner });
      } else {
        resetRound(st);
        emit(st, { t: 'round', n: st.round });
      }
    }
  }
  return st;
}
