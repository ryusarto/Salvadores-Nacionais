import { SYS } from '../data/system.js';
const clamp = p => Math.max(0, Math.min(.999, p));
/** Art-only timeline: preparation 0–3, contact 4–8, recovery 9–11. */
export function twelveFrameProgress(f, animation) {
  const sf = Math.max(0, f.sf || 0);
  if (f.state === 'attack' && f.move) {
    const m = f.move;
    const first = m.hits[0]?.from ?? (m.spawn.length ? Math.min(...m.spawn.map(s => s.at)) : m.startup + 1);
    const last = m.hits.at(-1)?.to ?? (m.spawn.length ? Math.max(...m.spawn.map(s => s.at)) : m.startup + m.active);
    if (sf < first) return Math.min(1 / 3 - .001, sf / Math.max(1, first) / 3);
    if (sf <= last) return 1 / 3 + (sf - first) / Math.max(1, last - first + 1) * (5 / 12);
    return clamp(.75 + (sf - last - 1) / Math.max(1, m.total - last - 2) * .25);
  }
  const cycle = { parado: 80, andar: 28, 'andar-tras': 28, correr: 16 }[animation.name];
  if (animation.loop && cycle) return (sf % cycle) / cycle;
  if (f.state === 'prejump') return clamp(sf / SYS.JUMP.pre / 3);
  if (f.state === 'land') return clamp(.75 + sf / Math.max(1, f.landFrames || SYS.JUMP.land) * .25);
  if (['crouch', 'guard', 'blockstun'].includes(f.state) || (f.state === 'air' && f.airGuard)) return clamp(sf / 12);
  if (['hitstun', 'frozen', 'slip', 'thrown'].includes(f.state)) return clamp(sf / Math.max(1, sf + (f.stun || 0)));
  if (f.state === 'air') {
    const vy = SYS.JUMP.vy * (f.ch.jumpScale || 1) * (f.sj ? SYS.SUPER_JUMP.vy : 1);
    return clamp(1 / 3 + Math.max(0, Math.min(1, (vy - f.vy) / (vy * 2))) * (5 / 12 - .001));
  }
  if (f.state === 'air_hit' || (f.state === 'ko' && f.y > 0)) return clamp((24 - f.vy) / 48);
  const duration = { knockdown: 18, ko: 18, wakeup: SYS.KNOCKDOWN.wakeup, crumple: SYS.CRUMPLE, win: 36, backdash: SYS.BACKDASH.frames, tech: 20, techroll: SYS.TECH_ROLL.frames }[f.state];
  if (duration) return clamp(sf / duration);
  if (f.state === 'dizzy') return (sf % 48) / 48;
  if (f.state === 'throwing') return 1 / 3 + Math.min(.332, sf / SYS.THROW.hold / 3);
  if (f.state === 'throwEnd') return clamp(.75 + sf / 22 * .25);
  return animation.p;
}
