import { SYS } from '../data/system.js';

const progress = value => Math.max(0, Math.min(0.999, value));

/** Art-only timeline. Combat windows and simulation state remain authoritative. */
export function spriteProgress(f, animation) {
  if (f.ch?.spriteProfile !== 'ten-frame') return animation.p;
  if (f.state === 'attack' && f.move) {
    const m = f.move;
    const first = m.hits.length ? m.hits[0].from : m.spawn.length ? Math.min(...m.spawn.map(s => s.at)) : m.startup + 1;
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
