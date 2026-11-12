import { SYS } from '../data/system.js';
import { newBuffer, take, peek, takeDash } from './input.js';
import { spawnEntity } from './entities.js';

const NEUTRAL = new Set(['idle', 'walk', 'crouch', 'run', 'runstop']);
const RANK = { L: 1, M: 2, H: 3 };

/** Cria um lutador a partir da ficha do personagem. */
export function createFighter(ch, side, x) {
  const hp = Math.round(SYS.HP * (ch.hpScale || 1));
  const f = {
    ch, side, x, y: 0, vx: 0, vy: 0,
    face: side === 0 ? 1 : -1,
    hp, maxHp: hp,
    ginga: SYS.GINGA.max, burnout: false, gingaPause: 0,
    super: 0,
    state: 'idle', sf: 0,
    move: null, moveKey: null, hitDone: [], connected: null, armorLeft: 0, holdT: 0,
    hitstop: 0, stun: 0, pushV: 0,
    comboHits: 0, comboDmg: 0, juggle: 0, juggleLock: false,
    throwInv: 0, kd: 'soft', jumpDir: 0, airUsed: false, airJumps: 0,
    rushBonus: 0, chainL: 0, landFrames: 0, crouchBlock: false, techable: true, throwDir: 1,
    buf: newBuffer(),
    res: {},
    status: { frost: 0, frostT: 0, dazzle: 0 },
    rounds: 0,
  };
  ch.mech?.init?.(f);
  return f;
}

export const isNeutral = (f) => NEUTRAL.has(f.state);
export const isAirborne = (f) => f.y > 0;
export const emit = (st, e) => st.events.push(e);

/** Muda de estado zerando o contador de quadros. */
export function setState(f, s) {
  f.state = s;
  f.sf = 0;
  if (s !== 'attack') {
    f.move = null;
    f.moveKey = null;
  }
}

/** Volta ao estado livre e encerra o combo sofrido. */
export function toNeutral(f) {
  setState(f, f.buf.down ? 'crouch' : 'idle');
  f.comboHits = 0;
  f.comboDmg = 0;
  f.juggle = 0;
  f.juggleLock = false;
  f.vx = 0;
  f.chainL = 0;
}

/** Caixa do corpo conforme o estado. */
export function hurtbox(f) {
  const B = SYS.BODY;
  if (f.state === 'knockdown' || (f.state === 'ko' && f.y <= 0)) return B.down;
  if (f.y > 0) return B.air;
  if (f.state === 'crouch' || (f.state === 'attack' && f.move.crouch) || ((f.state === 'blockstun' || f.state === 'hitstun' || f.state === 'guard') && f.crouchBlock)) return B.crouch;
  return B.stand;
}

/** Converte uma caixa relativa em coordenadas do mundo {l, r, b, t}. */
export function worldBox(f, box) {
  const l = f.face > 0 ? f.x + box.x : f.x - box.x - box.w;
  return { l, r: l + box.w, b: f.y + box.y, t: f.y + box.y + box.h };
}

export const overlap = (a, b) => a.l < b.r && a.r > b.l && a.b < b.t && a.t > b.b;

/** O lutador está imune a este tipo de ataque agora? kind: 'strike' | 'throw' | 'proj'. */
export function invulnTo(f, kind, attackerAir = false, guard = 'mid') {
  const s = f.state;
  if (s === 'knockdown' || s === 'wakeup' || s === 'tech' || s === 'thrown' || s === 'throwing' || s === 'ko' || s === 'win') return true;
  if (s === 'air_hit' && f.juggleLock) return true;
  if (kind === 'throw') {
    if (f.throwInv > 0 || f.y > 0) return true;
    if (s === 'hitstun' || s === 'blockstun' || s === 'air_hit' || s === 'crumple' || s === 'frozen' || s === 'prejump' || s === 'dizzy' || s === 'slip') return true;
  }
  if (s === 'attack') {
    for (const w of f.move.inv) {
      if (f.sf < w.from || f.sf > w.to) continue;
      if (w.type === 'all' || w.type === kind) return true;
      if (w.type === 'air' && attackerAir && kind === 'strike') return true;
      if (w.type === 'low' && guard === 'low') return true;
      if (w.type === 'upper' && guard !== 'low' && kind !== 'throw') return true;
    }
  }
  return false;
}

/** Gasta Ginga. Retorna false se o lutador está Sem Fôlego. */
export function spendGinga(st, f, n) {
  if (f.burnout) return false;
  f.ginga -= n;
  f.gingaPause = SYS.GINGA.regenPause;
  if (f.ginga <= 0) enterBurnout(st, f);
  return true;
}

export function enterBurnout(st, f) {
  f.ginga = 0;
  if (!f.burnout) {
    f.burnout = true;
    emit(st, { t: 'burnout', side: f.side });
  }
}

/** Inicia um golpe. Retorna true se começou. */
export function startMove(st, f, key, opts = {}) {
  const mech = f.ch.mech || {};
  if (mech.remap) key = mech.remap(f, key) || key;
  let m = f.ch.moves[key];
  if (!m) return false;
  if (opts.turbo && m.turbo) m = m.turbo;
  if (mech.modifyMove) m = mech.modifyMove(f, m, key) || m;
  if (m.cost.super && f.super < m.cost.super) return false;
  if (m.cost.ginga && !spendGinga(st, f, m.cost.ginga)) return false;
  if (m.cost.super) f.super -= m.cost.super;
  const o = st.f[1 - f.side];
  if (f.y <= 0 && !m.air) {
    f.face = Math.sign(o.x - f.x) || f.face;
    f.vx = 0;
  }
  f.state = 'attack';
  f.sf = 0;
  f.move = m;
  f.moveKey = key;
  f.hitDone = [];
  f.connected = null;
  f.armorLeft = m.armor ? m.armor.hits : 0;
  f.holdT = 0;
  if (m.air) f.airUsed = true;
  if (m.type === 'super') {
    st.freeze = key === 'SA3' ? 50 : 32;
    emit(st, { t: 'super', side: f.side, name: m.name, level: key === 'SA3' ? 3 : 1 });
  } else if (m.type === 'special') {
    f.super = Math.min(SYS.SUPER.max, f.super + SYS.SUPER.whiffSpecial);
  }
  mech.onMoveStart?.(st, f, m, key);
  emit(st, { t: 'move', side: f.side, key, name: m.name, turbo: m.isTurbo, type: m.type });
  return true;
}

function startJump(f, dir) {
  setState(f, 'prejump');
  f.jumpDir = dir;
  f.vx = 0;
}

/**
 * Tenta transformar os botões guardados em uma ação.
 * ctx: 'neutral' | 'air' | 'cancel' | 'rush' | 'parry'
 */
export function tryActions(st, f, o, ctx) {
  const b = f.buf;
  const moves = f.ch.moves;
  const mech = f.ch.mech || {};
  const cur = f.move;
  const air = ctx === 'air';
  const canc = ctx === 'cancel';
  const G = SYS.GINGA;
  const allow = (cat) => !canc || (cur.cancel.includes(cat) && (f.connected || cur.flags.freeCancel));

  if (mech.tryCustom?.(st, f, o, ctx)) return true;

  // Super
  if (!air && peek(b, 'X') && allow('super') && !(canc && cur.type === 'super')) {
    const dx = b.dirAt.X || b;
    const key = dx.down && f.super >= 3 * SYS.SUPER.stock && moves.SA3 ? 'SA3' : f.super >= SYS.SUPER.stock && moves.SA1 ? 'SA1' : f.super >= 3 * SYS.SUPER.stock && moves.SA3 ? 'SA3' : null;
    if (key && startMove(st, f, key)) {
      take(b, 'X');
      return true;
    }
  }
  // Agarrão
  if ((ctx === 'neutral' || ctx === 'rush') && take(b, 'T')) return startMove(st, f, 'throw');
  // Golpe Blindado: Ginga + Forte
  if ((ctx === 'neutral' || ctx === 'parry') && b.cur.G && peek(b, 'H') && !f.burnout && moves.blindado) {
    take(b, 'H');
    return startMove(st, f, 'blindado');
  }
  // Especiais
  if (peek(b, 'S')) {
    const ds = b.dirAt.S || b;
    let key = air ? 'jS' : ds.down ? '2S' : ds.fwd ? '6S' : ds.back ? '4S' : '5S';
    if (!moves[key] && !air) key = '5S';
    const m = moves[key];
    const extra = canc && cur.type !== 'super' && mech.extraCancel?.(st, f, cur, key);
    if (m && (!canc || extra || (allow('special') && cur.type === 'normal')) && (!air || !f.airUsed)) {
      const wantTurbo = b.cur.G && m.turbo && !f.burnout && f.ginga > 0;
      take(b, 'S');
      if (wantTurbo) spendGinga(st, f, G.turbo);
      if (startMove(st, f, key, { turbo: wantTurbo })) return true;
    }
  }
  if (ctx === 'parry') {
    if (take(b, 'T')) return startMove(st, f, 'throw');
    if (takeDash(b, 'F') && spendGinga(st, f, G.rushRaw)) {
      setState(f, 'rush');
      emit(st, { t: 'rush', side: f.side });
      return true;
    }
    return false;
  }
  // Normais
  for (const btn of ['H', 'M', 'L']) {
    if (!peek(b, btn)) continue;
    // Golpes de sequência (→ ← + Leve, ↓ → + Médio)
    const cmd = b.cmdAt[btn];
    if (cmd && SYS.CMD_BTN[cmd] === btn && moves[cmd] && !air) {
      const extra = canc && cur.type !== 'super' && mech.extraCancel?.(st, f, cur, cmd);
      if (!canc || extra || (allow('special') && cur.type === 'normal')) {
        take(b, btn);
        if (startMove(st, f, cmd)) return true;
      }
    }
    const dn = b.dirAt[btn] || b;
    let key;
    if (air) key = 'j' + btn;
    else if (dn.down && dn.fwd && moves['3' + btn]) key = '3' + btn;
    else if (dn.down) key = '2' + btn;
    else if (dn.fwd && moves['6' + btn]) key = '6' + btn;
    else if (dn.back && moves['4' + btn]) key = '4' + btn;
    else key = '5' + btn;
    const m = moves[key];
    if (!m) continue;
    if (air && f.airUsed) continue;
    if (canc && !cur.flags.followNormals) {
      if (cur.type !== 'normal' || !cur.cancel.includes('chain') || !f.connected) continue;
      const up = RANK[btn] > RANK[cur.btn];
      const same = btn === 'L' && cur.btn === 'L' && f.chainL < 2;
      if (!up && !same) continue;
      if (same) f.chainL++;
    }
    take(b, btn);
    if (startMove(st, f, key)) return true;
  }
  // Arrancada cancelando um golpe que acertou: → + Ginga. (Livre: →→ durante a defesa.)
  if (!air && canc && peek(b, 'G', 3) && !f.burnout) {
    if (canc) {
      if (cur.cancel.includes('rush') && f.connected && b.fwd) {
        take(b, 'G');
        spendGinga(st, f, G.rushCancel);
        setState(f, 'rush');
        emit(st, { t: 'rush', side: f.side, cancel: true });
        return true;
      }
    }
  }
  // Defesa: segurar o botão de Ginga
  if (ctx === 'neutral' && b.cur.G) {
    take(b, 'G');
    setState(f, 'guard');
    f.crouchBlock = b.down;
    f.vx = 0;
    return true;
  }
  if (canc && cur.cancel.includes('jump') && f.connected && b.up) {
    startJump(f, b.fwd ? 1 : b.back ? -1 : 0);
    return true;
  }
  return false;
}

function neutralUpdate(st, f, o) {
  if (tryActions(st, f, o, 'neutral')) return;
  const b = f.buf;
  const slow = 1 - 0.12 * f.status.frost;
  if (b.up) return startJump(f, b.fwd ? 1 : b.back ? -1 : 0);
  if (f.state === 'run') {
    if (b.fwd && !b.down) {
      f.vx = SYS.DASH.runSpeed * slow * f.face;
      return;
    }
    return setState(f, 'runstop');
  }
  if (f.state === 'runstop') {
    f.vx *= 0.7;
    if (f.sf >= SYS.DASH.runStop) setState(f, 'idle');
    return;
  }
  if (takeDash(b, 'F')) return setState(f, 'dash');
  if (takeDash(b, 'B')) {
    setState(f, 'backdash');
    f.throwInv = SYS.BACKDASH.throwInv;
    return;
  }
  let next = 'idle';
  f.vx = 0;
  if (b.down) next = 'crouch';
  else if (b.fwd) {
    next = 'walk';
    f.vx = f.ch.walkF * slow * f.face;
  } else if (b.back) {
    next = 'walk';
    f.vx = -f.ch.walkB * slow * f.face;
  }
  if (next !== f.state) setState(f, next);
}

function attackUpdate(st, f, o) {
  const m = f.move;
  const mech = f.ch.mech || {};
  // Golpes que podem ser segurados (postura, recarga)
  if (m.hold && f.sf === m.hold.at + 1) {
    const held = f.buf.cur[m.hold.btn];
    if (held && f.holdT < m.hold.max) {
      f.sf--;
      f.holdT++;
      mech.onHold?.(st, f, m);
      if (m.hold.follow) {
        for (const [btn, key] of Object.entries(m.hold.follow)) {
          if (btn !== 'release' && take(f.buf, btn)) {
            f.holdLevel = f.holdT;
            return startMove(st, f, key);
          }
        }
      }
    } else if (m.hold.follow?.release) {
      f.holdLevel = f.holdT;
      startMove(st, f, m.hold.follow.release);
      return;
    }
  }
  let moved = false;
  for (const mo of m.motion) {
    if (f.sf < mo.from || f.sf > mo.to) continue;
    if (mo.vx != null) f.vx = mo.vx * f.face;
    if (mo.vy != null) {
      f.vy = mo.vy;
      if (f.y <= 0 && mo.vy > 0) f.y = 1;
    }
    moved = true;
  }
  if (!moved && f.y <= 0) f.vx *= 0.5;
  for (const s of m.spawn) if (s.at === f.sf) spawnEntity(st, f, s);
  mech.onMoveFrame?.(st, f, o, m);
  if (f.state !== 'attack' || f.move !== m) return;
  if ((f.connected || m.flags.freeCancel) && f.sf > m.startup && tryActions(st, f, o, 'cancel')) return;
  if (f.sf >= m.total) {
    mech.onMoveEnd?.(st, f, m);
    if (f.y > 0) {
      setState(f, 'air');
      f.airUsed = true;
    } else {
      setState(f, f.buf.down ? 'crouch' : 'idle');
      f.chainL = 0;
    }
  }
}

function land(st, f) {
  f.y = 0;
  f.vy = 0;
  const s = f.state;
  if (s === 'air_hit') {
    setState(f, 'knockdown');
    f.vx = 0;
    emit(st, { t: 'land', side: f.side, x: f.x, hard: true });
  } else if (s === 'ko') {
    f.vx *= 0.3;
    emit(st, { t: 'land', side: f.side, x: f.x, hard: true });
  } else if (s === 'attack') {
    const m = f.move;
    if (m.air || m.flags.landEnds) {
      f.landFrames = m.flags.landRecovery ?? SYS.JUMP.landAttack;
      setState(f, 'land');
      f.vx = 0;
    }
  } else if (s === 'air') {
    f.landFrames = SYS.JUMP.land;
    setState(f, 'land');
    f.vx = 0;
    emit(st, { t: 'land', side: f.side, x: f.x });
  }
}

/** Avança um quadro do lutador (estado, movimento e física). */
export function updateFighter(st, f, o) {
  f.sf++;
  if (f.throwInv > 0) f.throwInv--;
  if (f.rushBonus > 0) f.rushBonus--;
  if (f.status.dazzle > 0) f.status.dazzle--;
  if (f.status.frost > 0 && --f.status.frostT <= 0) {
    f.status.frost--;
    f.status.frostT = 300;
  }
  const b = f.buf;
  const J = SYS.JUMP;
  if ((isNeutral(f) || f.state === 'guard') && f.y <= 0) f.face = Math.sign(o.x - f.x) || f.face;

  switch (f.state) {
    case 'idle': case 'walk': case 'crouch': case 'run': case 'runstop':
      neutralUpdate(st, f, o);
      break;
    case 'prejump':
      if (f.sf >= J.pre) {
        setState(f, 'air');
        f.vy = J.vy * (f.ch.jumpScale || 1);
        f.y = 1;
        f.vx = (f.jumpDir > 0 ? J.vxF : f.jumpDir < 0 ? J.vxB : 0) * f.face;
        f.airUsed = false;
        f.airJumps = f.ch.airJumps || 0;
        emit(st, { t: 'jump', side: f.side, x: f.x });
      }
      break;
    case 'air':
      f.airGuard = false;
      if (tryActions(st, f, o, 'air')) break;
      f.airGuard = !!b.cur.G && !f.burnout;
      if (f.airJumps > 0 && b.upPress <= 2 && f.sf > 8) {
        f.airJumps--;
        f.vy = J.vy * 0.82;
        f.vx = (b.fwd ? J.vxF : b.back ? J.vxB : 0) * f.face;
        b.upPress = 99;
        emit(st, { t: 'jump', side: f.side, x: f.x, air: true });
      }
      break;
    case 'land':
      f.vx = 0;
      if (f.sf >= f.landFrames) toNeutral(f);
      break;
    case 'dash': {
      const D = SYS.DASH;
      f.vx = D.speed * (1 - 0.35 * (f.sf / D.frames)) * f.face;
      if (f.sf >= 10 && tryActions(st, f, o, 'neutral')) break;
      if (f.sf >= D.frames) setState(f, b.fwd ? 'run' : 'idle');
      break;
    }
    case 'backdash': {
      const D = SYS.BACKDASH;
      f.vx = -D.speed * (1 - 0.5 * (f.sf / D.frames)) * f.face;
      if (f.sf >= D.frames) toNeutral(f);
      break;
    }
    case 'rush': {
      const R = SYS.RUSH;
      f.vx = R.speed * f.face;
      f.rushBonus = R.bonusFrames;
      if (f.sf >= 9 && tryActions(st, f, o, 'rush')) break;
      if (f.sf >= R.frames) toNeutral(f);
      break;
    }
    case 'attack':
      attackUpdate(st, f, o);
      break;
    case 'guard':
      f.vx = 0;
      f.crouchBlock = b.down;
      if (tryActions(st, f, o, 'parry')) break;
      if (b.up) startJump(f, b.fwd ? 1 : b.back ? -1 : 0);
      else if (!b.cur.G) toNeutral(f);
      break;
    case 'blockstun':
      if (f.y <= 0) f.vx = 0;
      if (--f.stun <= 0) {
        if (f.y > 0) {
          setState(f, 'air');
          f.airUsed = true;
        } else if (b.cur.G) {
          setState(f, 'guard');
          f.crouchBlock = b.down;
        } else toNeutral(f);
      }
      break;
    case 'hitstun': case 'frozen': case 'dizzy': case 'slip':
      f.vx = 0;
      if (--f.stun <= 0) toNeutral(f);
      break;
    case 'crumple':
      f.vx = 0;
      if (f.sf >= SYS.CRUMPLE) {
        setState(f, 'knockdown');
        f.kd = 'soft';
      }
      break;
    case 'knockdown':
      f.vx = 0;
      if (f.sf >= SYS.KNOCKDOWN[f.kd]) setState(f, 'wakeup');
      break;
    case 'wakeup':
      if (f.sf >= SYS.KNOCKDOWN.wakeup) {
        toNeutral(f);
        f.throwInv = SYS.KNOCKDOWN.wakeThrowInv;
      }
      break;
    case 'throwing':
      f.vx = 0;
      break; // resolvido em combat.js
    case 'throwEnd':
      if (f.sf >= 22) toNeutral(f);
      break;
    case 'thrown':
      f.vx = 0;
      if (o.state !== 'throwing') toNeutral(f);
      break;
    case 'tech':
      if (f.sf >= 20) toNeutral(f);
      break;
    case 'ko':
      if (f.y <= 0) f.vx *= 0.85;
      break;
    default:
      break;
  }

  // Física
  if (f.y > 0 || f.vy > 0) {
    const float = f.state === 'attack' && f.move.flags.float && f.sf <= f.move.flags.float;
    if (!float) f.vy -= SYS.GRAVITY * (f.state === 'air_hit' ? 1 + 0.08 * f.juggle : 1);
    f.y += f.vy;
    if (f.y <= 0) land(st, f);
  }
  f.x += f.vx + f.pushV;
  f.pushV *= SYS.PUSH_DECAY;
  if (Math.abs(f.pushV) < 0.5) f.pushV = 0;
}
