// Presentation only: the simulation retains all movement, spawn and hit windows.
export function fujaoProgress(f) {
  if (f.state !== 'attack' || !f.move) return null;
  const t = f.sf;
  if (f.moveKey === '4S') return (t < 2 ? 0 : t < 3 ? 1 : t <= 22 ? 2 + Math.floor((t - 3) / 3) % 2 : t < 27 ? 4 : 5) / 6;
  if (f.moveKey === '6S') return (t < 4 ? 0 : t < 8 ? 1 : t <= 26 ? 2 + Math.floor((t - 8) / 4) % 3 : 5) / 6;
  return null;
}
