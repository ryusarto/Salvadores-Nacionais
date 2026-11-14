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
  if (f.state === 'knockdown' || (f.state === 'ko' && f.y <= 0)) return 0.999;
  return animation.p;
}
