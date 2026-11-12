/**
 * Biblioteca de poses do manequim. Cada pose é uma lista de ângulos em graus:
 * [inclinação do tronco, cabeça,
 *  ombro da frente, cotovelo da frente, ombro de trás, cotovelo de trás,
 *  quadril da frente, joelho da frente, quadril de trás, joelho de trás,
 *  rotação do corpo, no ar (0/1), altura do quadril quando no ar]
 *
 * Membros: 0° aponta para baixo, 90° para frente, 180° para cima.
 * Estas poses também servem de guia para a produção dos sprites finais.
 */
const P = (lean, head, aFs, aFe, aBs, aBe, lFh, lFk, lBh, lBk, rot = 0, air = 0, hipH = 215) => [lean, head, aFs, aFe, aBs, aBe, lFh, lFk, lBh, lBk, rot, air, hipH];

export const POSES = {
  idle: P(8, 0, 50, 95, 25, 110, 22, -25, -18, -20),
  walkA: P(8, 0, 50, 95, 25, 110, 34, -14, -26, -32),
  walkB: P(8, 0, 45, 100, 30, 105, -18, -26, 30, -18),
  crouch: P(20, -8, 55, 100, 35, 110, 78, -112, 22, -104),
  prejump: P(16, -4, 30, 60, 10, 70, 50, -70, 5, -60),
  jumpUp: P(4, 0, 120, 40, -30, 40, 55, -85, 12, -55, 0, 1, 230),
  jumpFall: P(-4, 0, 140, 25, 150, 25, 28, -30, -12, -28, 0, 1, 225),
  runA: P(30, -10, -45, 95, 65, 85, 60, -45, -48, -55),
  runB: P(30, -10, 65, 85, -45, 95, -40, -60, 55, -40),
  backdash: P(-16, 6, 40, 80, 20, 90, 32, -8, -30, -42),
  blockHi: P(-6, -4, 72, 112, 62, 116, 20, -22, -20, -18),
  blockAir: P(-4, -4, 74, 112, 64, 116, 58, -92, 22, -70, 0, 1, 228),
  blockLo: P(14, -10, 70, 112, 60, 116, 78, -112, 22, -104),
  hitHi: P(-26, -16, 12, 30, -22, 30, 12, -10, -26, -16),
  hitLo: P(34, 22, 42, 62, 30, 70, 30, -40, -20, -30),
  airHit: P(-20, -20, 150, 20, 120, 30, 60, -40, 20, -50, -55, 1, 220),
  lying: P(0, 0, 100, 10, 80, 10, 10, -5, -5, -5, -90, 1, 42),
  getup: P(42, 10, 20, 40, 10, 50, 85, -120, 30, -110),
  crumple: P(52, 30, 12, 12, 5, 15, 62, -104, 28, -100),
  slip: P(-32, -10, 150, 10, 130, 20, 72, -12, -32, -44),
  parry: P(0, 0, 76, 62, 44, 100, 30, -40, -20, -16),
  punchWind: P(4, 0, -22, 122, 52, 100, 22, -25, -18, -20),
  punchL: P(12, 0, 88, 4, 30, 120, 24, -25, -20, -18),
  punchM: P(20, 0, 92, 0, -22, 100, 36, -26, -30, -10),
  heavyWind: P(-8, 0, -52, 112, 60, 90, 18, -20, -30, -26),
  punchH: P(32, -4, 95, 0, -42, 62, 46, -36, -40, -5),
  kickLow: P(-4, 0, 50, 100, 30, 100, 82, -6, 22, -102),
  sweepM: P(-14, 4, 40, 90, -30, 20, 86, -2, 14, -108),
  sweep: P(-24, 8, 30, 90, -40, 10, 88, 0, 8, -112),
  upper: P(-10, -8, 168, 8, 20, 100, 16, -6, -16, -10),
  overWind: P(-6, -6, 192, -22, 40, 100, 20, -20, -20, -20),
  overhead: P(30, 8, 66, 12, 20, 100, 36, -30, -30, -8),
  kickM: P(-14, 0, 40, 100, -20, 70, 86, -4, -6, -12),
  kickHigh: P(-22, -4, 32, 100, -30, 62, 112, -4, -6, -10),
  jPunch: P(18, 4, 62, 2, 20, 110, 50, -90, 10, -60, 0, 1, 225),
  jKick: P(-8, 0, 40, 90, -20, 60, 72, -4, -22, -72, 0, 1, 225),
  jHeavy: P(28, 8, 46, 0, 42, 6, 52, -8, 40, -70, 0, 1, 225),
  throwReach: P(22, 0, 82, 10, 76, 12, 34, -26, -28, -10),
  throwHold: P(-10, -4, 104, 30, 96, 34, 22, -22, -22, -16),
  blindWind: P(-20, 0, -62, 100, -40, 92, 16, -18, -36, -22),
  blindHit: P(36, -4, 96, 0, 82, 10, 48, -38, -40, -4),
  castWind: P(-4, 0, -12, 102, 30, 100, 20, -22, -20, -18),
  cast: P(14, 0, 100, -4, 96, 8, 30, -26, -26, -10),
  spinWind: P(-12, 0, 150, 20, -40, 60, 20, -30, -10, -30),
  spin: P(-18, 0, 120, 10, -60, 20, 96, 0, -4, -14),
  flurryA: P(22, 0, 92, 0, -10, 112, 36, -28, -30, -10),
  flurryB: P(22, 0, -10, 112, 92, 0, 36, -28, -30, -10),
  riseWind: P(20, -8, 30, 100, 20, 100, 70, -100, 20, -96),
  rise: P(-8, -10, 172, 6, 24, 96, 52, -72, 4, -12, 0, 1, 225),
  superWind: P(-14, -8, 132, 30, 142, 22, 26, -20, -26, -20),
  burst: P(-10, -14, 162, 0, 204, 0, 36, -10, -36, -10),
  whipWind: P(-8, 0, 204, -40, 40, 90, 20, -20, -24, -18),
  whipHi: P(22, 0, 86, 0, -20, 80, 40, -30, -32, -8),
  whipLow: P(26, -6, 58, 4, 20, 90, 78, -108, 24, -100),
  shoot: P(6, 0, 90, 0, 62, 62, 24, -22, -22, -16),
  shootLow: P(24, -6, 62, 6, 40, 80, 78, -108, 24, -100),
  shootUp: P(-10, -10, 138, 0, 40, 80, 20, -20, -22, -16),
  reload: P(10, 12, 52, 112, 48, 104, 22, -24, -18, -20),
  stance: P(26, -8, 22, 72, 12, 84, 56, -72, -26, -42),
  slash: P(30, 0, 112, 0, -30, 60, 48, -38, -40, -6),
  slashUp: P(-10, -10, 172, 0, -20, 70, 20, -10, -20, -10),
  swingWind: P(-12, 0, 222, -30, 212, -32, 20, -20, -26, -22),
  swing: P(28, 0, 72, 0, 70, 6, 44, -34, -36, -8),
  swingUp: P(-8, -8, 152, 0, 148, 6, 20, -12, -20, -12),
  call: P(0, 6, 150, 130, 20, 100, 20, -22, -18, -20),
  win: P(-6, -8, 176, 0, 30, 100, 16, -14, -14, -14),
};

/** Mistura duas poses. t: 0 = a, 1 = b. */
export function lerpPose(a, b, t) {
  const o = new Array(a.length);
  for (let i = 0; i < a.length; i++) o[i] = a[i] + (b[i] - a[i]) * t;
  return o;
}

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const get = (n) => POSES[n] || POSES.punchM;

/**
 * Escolhe a pose do lutador no quadro atual.
 * @returns {{pose: number[], flip: boolean, tint: string|null}}
 */
export function poseFor(f, frame) {
  const s = f.state;
  const sf = f.sf;
  let pose = POSES.idle;
  let flip = false;
  let tint = null;
  const cyc = (a, b, speed) => lerpPose(get(a), get(b), 0.5 + 0.5 * Math.sin(frame * speed));
  switch (s) {
    case 'idle': {
      const br = Math.sin(frame * 0.08);
      pose = POSES.idle.slice();
      pose[0] += br * 1.5;
      pose[3] += br * 4;
      pose[5] -= br * 4;
      pose[7] -= br * 3;
      break;
    }
    case 'walk': pose = cyc('walkA', 'walkB', 0.22); break;
    case 'crouch': pose = lerpPose(POSES.idle, POSES.crouch, ease(sf / 4)); break;
    case 'prejump': pose = POSES.prejump; break;
    case 'air': pose = f.airGuard ? POSES.blockAir : lerpPose(POSES.jumpFall, POSES.jumpUp, ease((f.vy + 12) / 30)); break;
    case 'land': pose = lerpPose(POSES.prejump, POSES.idle, ease(sf / Math.max(1, f.landFrames))); break;
    case 'dash': case 'run': case 'rush': pose = cyc('runA', 'runB', s === 'rush' ? 0.5 : 0.36); break;
    case 'runstop': pose = lerpPose(POSES.runA, POSES.idle, ease(sf / 7)); break;
    case 'backdash': case 'tech': pose = POSES.backdash; break;
    case 'guard': pose = lerpPose(POSES.idle, f.crouchBlock ? POSES.blockLo : POSES.blockHi, ease(sf / 3)); break;
    case 'blockstun': pose = f.y > 0 ? POSES.blockAir : f.crouchBlock ? POSES.blockLo : POSES.blockHi; break;
    case 'dizzy': pose = lerpPose(POSES.crumple, POSES.hitLo, 0.5 + 0.5 * Math.sin(frame * 0.2)); tint = '#ffe14a'; break;
    case 'techroll': pose = POSES.crouch; flip = Math.floor(sf / 4) % 2 === 1; break;
    case 'hitstun': pose = f.crouchBlock ? POSES.hitLo : f.comboHits % 2 ? POSES.hitHi : POSES.hitLo; break;
    case 'frozen': pose = POSES.crumple; tint = '#ffe14a'; break;
    case 'slip': pose = POSES.slip; break;
    case 'crumple': pose = lerpPose(POSES.hitLo, POSES.crumple, ease(sf / 20)); break;
    case 'air_hit': pose = POSES.airHit.slice(); pose[10] = -55 - Math.max(-35, Math.min(35, -f.vy * 1.6)); break;
    case 'ko': pose = f.y > 0 ? POSES.airHit : POSES.lying; break;
    case 'knockdown': pose = POSES.lying; break;
    case 'wakeup': pose = lerpPose(POSES.getup, POSES.idle, ease(sf / 14)); break;
    case 'throwing': pose = POSES.throwHold; break;
    case 'throwEnd': pose = lerpPose(POSES.punchH, POSES.idle, ease(sf / 22)); break;
    case 'thrown': pose = POSES.hitHi; break;
    case 'win': pose = lerpPose(POSES.idle, POSES.win, ease(sf / 18)); break;
    case 'attack': {
      const m = f.move;
      const base = m.air ? POSES.jumpUp : m.crouch ? POSES.crouch : POSES.idle;
      const wind = get(m.anim[0]);
      let strikeName = m.anim[1];
      if (strikeName === 'flurry') strikeName = Math.floor(sf / 3) % 2 ? 'flurryA' : 'flurryB';
      if (strikeName === 'cast' && m.spawn.length > 2) strikeName = Math.floor(sf / 6) % 2 ? 'overWind' : 'cast';
      const strike = get(strikeName);
      const last = m.hits.length ? m.hits[m.hits.length - 1].to : m.startup + m.active;
      if (m.hold && sf === m.hold.at) pose = wind;
      else if (sf <= m.startup) {
        const t = sf / m.startup;
        pose = t < 0.55 ? lerpPose(base, wind, ease(t / 0.55)) : lerpPose(wind, strike, ease((t - 0.55) / 0.45));
      } else if (sf <= last) {
        pose = strike;
        if (m.anim[1] === 'spin') flip = Math.floor(sf / 3) % 2 === 1;
      } else pose = lerpPose(strike, base, ease((sf - last) / Math.max(1, m.total - last)));
      if (m.armor && sf <= m.armor.to) tint = '#ffb347';
      break;
    }
    default: break;
  }
  return { pose, flip, tint };
}
