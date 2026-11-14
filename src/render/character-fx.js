import { drawEffect } from './sprites.js';

// Pure presentation: hitboxes, damage and movement remain in the simulation.
export function drawCharacterFx(c, f) {
  if (f.state !== 'attack') return false;
  const m = f.move, key = f.moveKey, t = f.sf;
  const first = m.hits[0]?.from ?? m.startup;
  const last = m.hits.at(-1)?.to ?? m.startup + m.active;
  const p = Math.max(0, Math.min(.999, (t - first) / Math.max(1, last - first + 8)));
  const fx = (name, x, y, w, h = w, progress = p) => drawEffect(c, f.ch.id, name, progress, x, y, w, h);
  if (f.ch.id === 'franco') {
    if (key === 'SA3') {
      const q = Math.min(.999, t / m.total);
      c.save();
      c.globalAlpha = Math.min(1, t / 8, (m.total - t) / 12);
      fx('quadro-obra-prima', 270, -640, 500, 680, q);
      if (t < 18) fx('quadro-abertura', 290, -600, 460, 580, t / 18);
      if (t >= 18 && t <= 62) fx('quadro-succao', 40, -550, 640, 500, (t - 18) / 45);
      if (t > 62) fx('quadro-fechamento', 290, -600, 460, 580, (t - 62) / Math.max(1, m.total - 62));
      c.restore();
      return true;
    }
    if (t < first || t > last + 7) return true;
    const map = { '5L':'tinta-pincelada-curta', '5M':'tinta-pincelada-larga', '6S':'tinta-giro', '2S':'tinta-pressao', '4S':'tinta-sobe-som', SA1:'tinta-libera-tudo', '5H':'flash-horizontal', '2H':'flash-cima', jH:'flash-aereo', '5S':'flash-horizontal' };
    if (/^(5H|2H|jH|5S)$/.test(key)) fx('flash-obturador', 30, -470, 180);
    if (map[key]) fx(map[key], key === 'SA1' ? -420 : -80, -640, key === 'SA1' ? 900 : 650);
    if (f.res?.finale) fx('tinta-final-turbo', -200, -600, 700);
    return !!map[key];
  }
  if (f.ch.id === 'dney') {
    if (key === 'SA3') {
      if (t < first) fx('laser-carga', -55, -490, 200, 200, t / first);
      else if (t <= last + 4) {
        fx('laser-carga', -55, -490, 200, 200, .75);
        fx('laser-feixe', -150, -495, 2450, 210, p);
      }
      return true;
    }
    return false; // Muzzle flashes are driven by actual projectile spawns.
  }
  return false;
}
