import { SYS } from '../data/system.js';

const clamp = n => Math.max(0, Math.min(.999, n));
const pose = i => i / 6;

/** The v3 drawings have contact at pose 3, followed by pose 4. Visual only. */
export function chupetinhaProgress(f, animation) {
  if (f.state === 'attack' && f.move) {
    const m = f.move, sf = f.sf;
    const shots = m.spawn;
    const first = m.hits[0]?.from ?? shots[0]?.at ?? m.startup + 1;
    const last = m.hits.at(-1)?.to ?? shots.at(-1)?.at ?? m.startup + m.active;
    const doubleSpit = f.moveKey === '5S' && shots.length === 2;
    if (sf < first) return pose(Math.min(.999, sf / Math.max(1, first)) * (doubleSpit ? 1 : 2));
    if (doubleSpit && sf <= last + 2) {
      if (sf < shots[0].at + 2) return pose(1);
      return pose(sf < last ? 2 : 3);
    }
    if (shots.length && sf <= last + 2) {
      const shot = shots.findLastIndex(s => s.at <= sf);
      return pose(shots.length === 1 ? 2 + Math.min(1, Math.floor((sf - first) / 2)) : 2 + (shot % 2));
    }
    if (sf <= last) {
      if (f.moveKey === 'SA3') return pose(2 + (m.hits.findLastIndex(h => h.from <= sf) % 2));
      return pose(2 + Math.min(1.999, (sf - first) / Math.max(1, last - first + 1) * 2));
    }
    const recoveryStart = last + (shots.length ? 3 : 1);
    return pose(Math.min(5.999, 4 + Math.max(0, sf - recoveryStart) / Math.max(1, m.total - recoveryStart - 1) * 2));
  }
  if (f.state === 'crouch') return clamp(f.sf / 10);
  if (f.state === 'prejump') return pose(Math.min(2.999, f.sf / SYS.JUMP.pre * 3));
  if (f.state === 'land') return pose(Math.max(0, 2.999 * (1 - f.sf / Math.max(1, f.landFrames || SYS.JUMP.land))));
  if (f.state === 'guard' || f.state === 'blockstun' || (f.state === 'air' && f.airGuard)) return clamp(f.sf / 12);
  if (['hitstun', 'frozen', 'slip', 'thrown'].includes(f.state)) return clamp(f.sf / Math.max(1, f.sf + f.stun));
  if (f.state === 'air') {
    const v = SYS.JUMP.vy * (f.ch.jumpScale || 1) * (f.sj ? SYS.SUPER_JUMP.vy : 1);
    return clamp((v - f.vy) / (v * 2));
  }
  if (f.state === 'air_hit' || (f.state === 'ko' && f.y > 0)) return clamp((24 - f.vy) / 48);
  if (f.state === 'knockdown' || (f.state === 'ko' && f.y <= 0)) return clamp((f.sf || 0) / 18);
  if (f.state === 'wakeup') return clamp(f.sf / SYS.KNOCKDOWN.wakeup);
  if (f.state === 'crumple') return clamp(f.sf / SYS.CRUMPLE);
  if (f.state === 'dizzy') return (f.sf % 48) / 48;
  if (f.state === 'win') return clamp(f.sf / 30);
  if (f.state === 'backdash') return clamp(f.sf / SYS.BACKDASH.frames);
  if (f.state === 'tech') return clamp(f.sf / 20);
  if (f.state === 'techroll') return clamp(f.sf / SYS.TECH_ROLL.frames);
  if (f.state === 'throwing') return pose(2);
  if (f.state === 'throwEnd') return clamp(.5 + f.sf / 22 * .5);
  return animation.p;
}
