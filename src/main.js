import { createApp } from './ui/app.js';
import { createDevices } from './ui/devices.js';
import { registerSprites } from './render/sprites.js';
import { setStageImage } from './render/stage.js';
import { createTouch } from './ui/touch.js';

const canvas = document.getElementById('game');
const devices = createDevices(window);
const q = new URLSearchParams(location.search);
const touch = createTouch(devices);
if (q.has('touch')) touch.show();
const app = createApp(canvas, devices, { boxes: q.has('boxes'), autoplay: q.has('auto') });

function fit() {
  const r = Math.min(innerWidth / 1920, innerHeight / 1080);
  app.touchUI = document.documentElement.classList.contains('touch');
  canvas.style.width = `${Math.floor(1920 * r)}px`;
  canvas.style.height = `${Math.floor(1080 * r)}px`;
}
addEventListener('resize', fit);
addEventListener('touchstart', () => setTimeout(fit, 50), { once: true, passive: true });
fit();
window.__app = app; // acesso para testes automáticos

// Sprites embutidos pelo empacotador (production/sprites/final). ?sprites=off força o manequim.
const packs = q.get('sprites') === 'off' ? {} : window.__SPRITES || {};
const belem = (window.__STAGES || {}).belem;
if (belem && q.get('stage') !== 'off') {
  const img = new Image();
  img.onload = () => setStageImage(img);
  img.src = belem;
}
Promise.all(Object.entries(packs).map(([id, sheets]) => registerSprites(id, sheets))).then(() => app.run());
