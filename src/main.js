import { createApp } from './ui/app.js';
import { createDevices } from './ui/devices.js';

const canvas = document.getElementById('game');
const devices = createDevices(window);
const q = new URLSearchParams(location.search);
const app = createApp(canvas, devices, { boxes: q.has('boxes'), autoplay: q.has('auto') });

function fit() {
  const r = Math.min(innerWidth / 1920, innerHeight / 1080);
  canvas.style.width = `${Math.floor(1920 * r)}px`;
  canvas.style.height = `${Math.floor(1080 * r)}px`;
}
addEventListener('resize', fit);
fit();
window.__app = app; // acesso para testes automáticos
app.run();
