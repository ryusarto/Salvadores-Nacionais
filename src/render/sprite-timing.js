import { SYS } from '../data/system.js';

const progress = value => Math.max(0, Math.min(0.999, value));

/** Art-only timeline. Combat windows and simulation state remain authoritative. */
export function spriteProgress(f, animation) {
  if (f.ch?.spriteProfile === 'six-frame') return sixFrameProgress(f, animation);
  if (f.ch?.spriteProfile !== 'ten-frame') return animation.p;
  if (f.state === 'attack' && f.move) {
    const m = f.move;
    const first = m.hits.length ? m.hits[0].from : m.spawn.length ? Math.min(...m.spawn.map(s => s.at)) : m.startup + 1;
    if (m.weapon === 'ak' && m.spawn.length) {
      const lastShot = Math.max(...m.spawn.map(s => s.at)) + 3;
      if (f.sf < first) return Math.min(0.399, f.sf / Math.max(1, first) * 0.4);
      if (f.sf <= lastShot) return Math.min(0.599, 0.4 + (f.sf - first) / Math.max(1, lastShot - first + 1) * 0.2);
      return Math.min(0.999, 0.6 + (f.sf - lastShot) / Math.max(1, m.total - lastShot - 1) * 0.4);
    }
    const last = m.hits.length ? m.hits.at(-1).to : Math.max(first, m.startup + m.active);
    if (f.sf < first) return Math.min(0.499, f.sf / Math.max(1, first) * 0.5);
    if (f.sf <= last) return Math.min(0.699, 0.5 + (f.sf - first) / Math.max(1, last - first + 1) * 0.2);
    return Math.min(0.999, 0.7 + (f.sf - last) / Math.max(1, m.total - last - 1) * 0.3);
  }
  // A held crouch must not advance into the later standing recovery drawings.
  if (f.state === 'crouch') return Math.min(0.499, Math.max(0, f.sf) / 8 * 0.5);
  if (f.state === 'prejump') return Math.min(0.499, f.sf / SYS.JUMP.pre * 0.5);
  if (f.state === 'land') return Math.max(0, 0.499 * (1 - f.sf / Math.max(1, f.landFrames || SYS.JUMP.land)));
  if (f.state === 'guard') return Math.min(0.499, f.sf / 8 * 0.5);
  if (f.state === 'blockstun') return Math.min(0.899, 0.45 + f.sf / Math.max(1, f.sf + f.stun) * 0.45);
  if (['hitstun', 'frozen', 'slip'].includes(f.state)) return progress(f.sf / Math.max(1, f.sf + f.stun));
  if (f.state === 'air' && !f.airGuard) {
    const velocity = SYS.JUMP.vy * (f.ch.jumpScale || 1) * (f.sj ? SYS.SUPER_JUMP.vy : 1);
    return progress((velocity - f.vy) / (velocity * 2));
  }
  if (f.state === 'air' && f.airGuard) return Math.min(0.699, f.sf / 12);
  if (f.state === 'air_hit' || (f.state === 'ko' && f.y > 0)) return progress((24 - f.vy) / 48);
  if (f.state === 'knockdown' || (f.state === 'ko' && f.y <= 0)) return f.sf == null ? 0.999 : progress(f.sf / 18);
  if (f.state === 'wakeup') return progress(f.sf / SYS.KNOCKDOWN.wakeup);
  if (f.state === 'crumple') return progress(f.sf / SYS.CRUMPLE);
  if (f.state === 'dizzy') return (f.sf % 40) / 40;
  if (f.state === 'win') return progress(f.sf / 28);
  return animation.p;
}

/** Six drawings: ready, wind-up, approach, contact, follow-through, recovery. */
function sixFrameProgress(f, animation) {
  if (f.state === 'attack' && f.move) {
    const m = f.move;
    const contacts = f.ch.spriteHitFrames?.[f.moveKey];
    if (contacts && m.hits.length === contacts.length) {
      const first = m.hits[0].from;
      if (f.sf < first) return Math.min(1.999, f.sf / Math.max(1, first) * 2) / 6;
      for (let i = 0; i < m.hits.length; i++) {
        if (f.sf <= m.hits[i].to) return contacts[i] / 6;
        if (i + 1 < m.hits.length && f.sf < m.hits[i + 1].from) return (contacts[i] + 1) / 6;
      }
      return 5 / 6;
    }
    const releases = f.ch.spriteSpawnFrames?.[f.moveKey];
    if (releases && m.spawn.length) {
      const shots = [...m.spawn].sort((a, b) => a.at - b.at);
      if (f.sf < shots[0].at) return Math.min(1.999, f.sf / Math.max(1, shots[0].at) * 2) / 6;
      if (f.sf > shots.at(-1).at + 3) return 5 / 6;
      const index = shots.findLastIndex(s => s.at <= f.sf);
      return releases[index % releases.length] / 6;
    }
    const first = m.hits[0]?.from ?? (m.spawn.length ? Math.min(...m.spawn.map(s => s.at)) : m.startup + 1);
    const last = m.hits.at(-1)?.to ?? (m.spawn.length ? Math.max(...m.spawn.map(s => s.at)) : m.startup + m.active);
    if (f.sf < first) return Math.min(.499, f.sf / Math.max(1, first) * .5);
    if (f.sf <= last) return .5;
    return Math.min(.999, 4 / 6 + (f.sf - last - 1) / Math.max(1, m.total - last - 2) / 3);
  }
  if (f.state === 'crouch') return progress(f.sf / 10);
  if (f.state === 'prejump') return progress(f.sf / SYS.JUMP.pre);
  if (f.state === 'land') return progress(1 - f.sf / Math.max(1, f.landFrames || SYS.JUMP.land));
  if (f.state === 'guard' || f.state === 'blockstun' || (f.state === 'air' && f.airGuard)) return progress(f.sf / 12);
  if (['hitstun', 'frozen', 'slip', 'thrown'].includes(f.state)) return progress(f.sf / Math.max(1, f.sf + f.stun));
  if (f.state === 'air') {
    const v = SYS.JUMP.vy * (f.ch.jumpScale || 1) * (f.sj ? SYS.SUPER_JUMP.vy : 1);
    return progress((v - f.vy) / (v * 2));
  }
  if (f.state === 'air_hit' || (f.state === 'ko' && f.y > 0)) return progress((24 - f.vy) / 48);
  if (f.state === 'knockdown' || (f.state === 'ko' && f.y <= 0)) return progress(f.sf / 18);
  if (f.state === 'wakeup') return progress(f.sf / SYS.KNOCKDOWN.wakeup);
  if (f.state === 'crumple') return progress(f.sf / SYS.CRUMPLE);
  if (f.state === 'dizzy') return (f.sf % 48) / 48;
  if (f.state === 'win') return progress(f.sf / 30);
  if (f.state === 'backdash') return progress(f.sf / SYS.BACKDASH.frames);
  if (f.state === 'tech') return progress(f.sf / 20);
  if (f.state === 'techroll') return progress(f.sf / SYS.TECH_ROLL.frames);
  if (f.state === 'throwing') return 2 / 6;
  if (f.state === 'throwEnd') return Math.min(.999, .5 + f.sf / 22 * .5);
  return animation.p;
}
