import { SYS } from '../data/system.js';
import { take } from './input.js';
import { hurtbox, worldBox, overlap, invulnTo, isNeutral, setState, toNeutral, enterBurnout, emit, startMove } from './fighter.js';

const atWall = (f) => f.x <= SYS.WALL_PAD + 4 || f.x >= SYS.STAGE_W - SYS.WALL_PAD - 4;

/** O defensor está defendendo um golpe que vem da posição attX? */
export function isBlocking(def, attX, guard) {
  if (guard === 'unblock' || guard === 'throw') return false;
  if (def.y > 0) return false;
  if (!(isNeutral(def) || def.state === 'blockstun')) return false;
  const dir = Math.sign(attX - def.x) || def.face;
  if (def.buf.cur.x !== -dir) return false;
  const crouch = def.buf.down;
  if (guard === 'low' && !crouch) return false;
  if (guard === 'high' && crouch) return false;
  return true;
}

function applyEffects(st, att, def, effects, blocked) {
  for (const e of effects) {
    if (blocked && !e.onBlock) continue;
    if (e.t === 'frost') {
      def.status.frost += e.n || 1;
      def.status.frostT = 300;
      if (def.status.frost >= 3 && def.y <= 0 && def.hp > 0 && !blocked) {
        def.status.frost = 0;
        setState(def, 'frozen');
        def.stun = e.freeze || 80;
        emit(st, { t: 'freeze', side: def.side, x: def.x });
      }
      def.status.frost = Math.min(def.status.frost, 2 + (blocked ? 0 : 1));
    } else if (e.t === 'dazzle') {
      def.status.dazzle = e.n || 120;
      emit(st, { t: 'dazzle', side: def.side, x: def.x });
    }
  }
}

/**
 * Aplica um acerto do atacante no defensor.
 * @returns {'hit'|'block'|'parry'|'perfect'|'armor'|'miss'}
 */
export function applyHit(st, att, def, h, src) {
  const G = SYS.GINGA;
  const isProj = src.type === 'proj';
  const attX = isProj ? src.x - (src.ent.dir || 0) * 10 : att.x;
  const kind = isProj ? 'proj' : 'strike';
  if (invulnTo(def, kind, !isProj && att.y > 0, h.guard)) return 'miss';
  const dir = Math.sign(def.x - attX) || att.face;
  const hx = isProj ? src.x : (att.x + def.x) / 2 + att.face * 30;
  const hy = isProj ? src.ent.y + src.ent.h / 2 : def.y + (h.box ? Math.min(h.box.y + h.box.h / 2, 420) : 250);
  const stopA = (n) => { if (!isProj) att.hitstop = Math.max(att.hitstop, n); };
  const super_ = src.m?.type === 'super';

  // Aparar (Esquiva de Ginga)
  if (def.state === 'parry' && h.guard !== 'unblock') {
    const perfect = def.sf <= G.perfectWindow;
    def.ginga = Math.min(G.max, def.ginga + (perfect ? G.pip : G.parryGain));
    if (!isProj) att.connected = 'block';
    if (perfect) {
      stopA(SYS.HITSTOP.H + G.perfectFreeze);
      toNeutral(def);
      def.hitstop = 4;
      emit(st, { t: 'perfect', side: def.side, x: hx, y: hy });
      return 'perfect';
    }
    stopA(SYS.HITSTOP.M);
    def.hitstop = SYS.HITSTOP.M;
    def.sf = Math.min(def.sf, 4);
    emit(st, { t: 'parry', side: def.side, x: hx, y: hy });
    return 'parry';
  }

  // Contra-ataque (golpes com janela de contragolpe)
  const ctrWin = def.state === 'attack' && def.move.flags.counter;
  if (ctrWin && !isProj && !super_ && def.sf >= ctrWin.from && def.sf <= ctrWin.to) {
    att.connected = 'block';
    stopA(SYS.HITSTOP.H + 6);
    emit(st, { t: 'parry', side: def.side, x: hx, y: hy });
    startMove(st, def, ctrWin.into);
    return 'armor';
  }

  // Blindagem
  if (def.state === 'attack' && def.move.armor && def.armorLeft > 0 && def.sf >= def.move.armor.from && def.sf <= def.move.armor.to && !super_) {
    def.armorLeft--;
    def.hp = Math.max(1, def.hp - Math.round(h.dmg * 0.5));
    stopA(h.stop);
    def.hitstop = h.stop;
    if (!isProj) att.connected = 'block';
    emit(st, { t: 'armor', side: def.side, x: hx, y: hy });
    return 'armor';
  }

  // Defesa
  if (isBlocking(def, attX, h.guard)) {
    const crouch = def.buf.down;
    setState(def, 'blockstun');
    def.crouchBlock = crouch;
    def.stun = h.blockstun + (def.burnout ? G.burnoutBlockstun : 0);
    def.face = -dir;
    const chip = def.burnout ? Math.max(h.chip, SYS.CHIP) : h.chip;
    if (chip > 0) def.hp = Math.max(def.burnout ? 0 : 1, def.hp - Math.round(h.dmg * chip));
    if (!def.burnout) {
      def.ginga -= h.ginga;
      def.gingaPause = G.blockPause;
      if (def.ginga <= 0) enterBurnout(st, def);
    }
    if (atWall(def) && !isProj) att.pushV = (-dir * h.push[1]) / 5;
    else def.pushV = (dir * h.push[1]) / 5;
    const stop = Math.max(2, h.stop + SYS.HITSTOP.block);
    stopA(stop);
    def.hitstop = stop;
    if (!isProj) att.connected = 'block';
    att.super = Math.min(SYS.SUPER.max, att.super + h.dmg * SYS.SUPER.perDmgDealt * 0.5);
    applyEffects(st, att, def, h.effects, true);
    att.ch.mech?.onBlocked?.(st, att, def, h, src);
    emit(st, { t: 'block', side: def.side, x: hx, y: hy, power: src.m?.btn || 'S' });
    if (def.hp <= 0) ko(st, att, def, dir);
    return 'block';
  }

  // Acerto
  let ctr = null;
  if (def.state === 'attack') ctr = def.sf > def.move.startup + def.move.active ? 'punish' : 'counter';
  else if (def.state === 'parryRec' || def.state === 'throwEnd') ctr = 'punish';
  if (def.status.dazzle > 0) {
    ctr = ctr || 'counter';
    def.status.dazzle = 0;
  }
  let scale = SYS.SCALING[Math.min(def.comboHits, SYS.SCALING.length - 1)];
  if (super_) scale = Math.max(scale, SYS.SUPER_MIN_SCALE);
  const mul = (ctr ? SYS.COUNTER.dmg : 1) * (att.ch.mech?.dmgMul?.(att, h, src) || 1);
  const dmg = Math.max(1, Math.round(h.dmg * scale * mul));
  const wasAir = def.y > 0 || def.state === 'air_hit';
  const wasCrouch = hurtbox(def) === SYS.BODY.crouch;
  def.hp -= dmg;
  def.comboHits++;
  def.comboDmg += dmg;
  def.face = wasAir ? def.face : -dir;
  def.pushV = 0;
  let stun = h.hitstun + (ctr === 'counter' ? SYS.COUNTER.stun : ctr === 'punish' ? SYS.COUNTER.punishStun : 0);
  if (!isProj && att.rushBonus > 0 && src.m.type === 'normal') stun += SYS.RUSH.bonusStun;

  att.super = Math.min(SYS.SUPER.max, att.super + (super_ ? 0 : dmg * SYS.SUPER.perDmgDealt));
  def.super = Math.min(SYS.SUPER.max, def.super + dmg * SYS.SUPER.perDmgTaken);
  if (!att.burnout) att.ginga = Math.min(G.max, att.ginga + G.onHitGain);

  if (def.hp <= 0) {
    ko(st, att, def, dir);
  } else if (h.crumple && !wasAir) {
    setState(def, 'crumple');
  } else if (wasAir || h.launch) {
    const L = h.launch || [5, 17];
    setState(def, 'air_hit');
    def.vx = dir * L[0];
    def.vy = L[1] * Math.max(0.55, 1 - 0.07 * def.juggle);
    def.y = Math.max(def.y, 1);
    def.juggle += h.juggle;
    def.kd = h.kd || 'soft';
    if (def.juggle >= SYS.JUGGLE_MAX) def.juggleLock = true;
  } else {
    setState(def, 'hitstun');
    def.stun = stun;
    def.crouchBlock = wasCrouch;
    if (h.pull) def.pushV = (-dir * h.pull) / 5;
    else if (atWall(def) && !isProj) att.pushV = (-dir * h.push[0]) / 5;
    else def.pushV = (dir * h.push[0]) / 5;
  }
  stopA(h.stop);
  def.hitstop = h.stop;
  if (!isProj) att.connected = 'hit';
  if (def.hp > 0) applyEffects(st, att, def, h.effects, false);
  att.ch.mech?.onHit?.(st, att, def, h, src);
  def.ch.mech?.onGotHit?.(st, def, att, h);
  emit(st, { t: 'hit', side: att.side, x: hx, y: hy, power: src.m?.btn || 'S', ctr, dmg, combo: def.comboHits, launch: wasAir || !!h.launch, super: super_ });
  return 'hit';
}

function ko(st, att, def, dir) {
  def.hp = 0;
  setState(def, 'ko');
  def.vx = dir * 9;
  def.vy = 24;
  def.y = Math.max(def.y, 1);
  emit(st, { t: 'ko', side: def.side, x: def.x });
}

function startThrow(st, att, def, h, m) {
  att.connected = 'hit';
  att.throwDmg = h.dmg;
  def.techable = m.type === 'throw' && def.state !== 'attack' && def.state !== 'parryRec';
  setState(att, 'throwing');
  att.throwDir = att.buf.back ? -1 : 1;
  setState(def, 'thrown');
  def.vx = 0;
  def.pushV = 0;
  def.x = att.x + att.face * 105;
  emit(st, { t: 'grab', side: att.side, x: (att.x + def.x) / 2, y: 300 });
}

function updateThrow(st, att, def) {
  const T = SYS.THROW;
  if (def.state !== 'thrown') return toNeutral(att);
  if (def.techable && att.sf <= T.tech && take(def.buf, 'T')) {
    setState(att, 'tech');
    setState(def, 'tech');
    att.pushV = -att.face * 26;
    def.pushV = att.face * 26;
    emit(st, { t: 'tech', x: (att.x + def.x) / 2, y: 300 });
    return;
  }
  if (att.sf < T.hold) return;
  const back = att.throwDir < 0;
  const dir = back ? -att.face : att.face;
  if (back) def.x = att.x - att.face * 90;
  const dmg = Math.round((att.throwDmg || T.dmg) * (att.ch.mech?.dmgMul?.(att, null, { type: 'throw' }) || 1));
  def.hp -= dmg;
  def.comboHits = 1;
  def.comboDmg = dmg;
  att.super = Math.min(SYS.SUPER.max, att.super + dmg * SYS.SUPER.perDmgDealt);
  setState(att, 'throwEnd');
  if (def.hp <= 0) ko(st, att, def, dir);
  else {
    setState(def, 'air_hit');
    def.vx = dir * 10;
    def.vy = 17;
    def.y = 1;
    def.kd = 'hard';
    def.juggleLock = true;
  }
  att.hitstop = def.hitstop = SYS.HITSTOP.H;
  att.ch.mech?.onHit?.(st, att, def, att.ch.moves.throw.hits[0], { type: 'throw' });
  emit(st, { t: 'hit', side: att.side, x: def.x, y: 250, power: 'H', dmg, combo: 1, launch: true, thrown: true });
}

/** Confere todos os golpes ativos do quadro e resolve acertos e agarrões. */
export function resolveCombat(st) {
  const [a, b] = st.f;
  for (const [att, def] of [[a, b], [b, a]]) if (att.state === 'throwing') updateThrow(st, att, def);
  const pend = [];
  for (const [att, def] of [[a, b], [b, a]]) {
    if (att.state !== 'attack') continue;
    const m = att.move;
    m.hits.forEach((h, i) => {
      if (att.hitDone[i] || att.sf < h.from || att.sf > h.to) return;
      if (overlap(worldBox(att, h.box), worldBox(def, hurtbox(def)))) pend.push({ att, def, h, i, m });
    });
  }
  const struck = new Set();
  for (const p of pend) {
    if (p.h.guard === 'throw') continue;
    const res = applyHit(st, p.att, p.def, p.h, { type: 'move', m: p.m });
    if (res !== 'miss') {
      p.att.hitDone[p.i] = true;
      if (res === 'hit') struck.add(p.def.side);
    }
  }
  for (const p of pend) {
    if (p.h.guard !== 'throw') continue;
    if (struck.has(p.att.side) || struck.has(p.def.side)) continue;
    if (p.att.state !== 'attack' || invulnTo(p.def, 'throw')) continue;
    p.att.hitDone[p.i] = true;
    startThrow(st, p.att, p.def, p.h, p.m);
  }
}
