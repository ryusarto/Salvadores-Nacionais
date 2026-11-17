import { createApp } from './ui/app.js';
import { createDevices } from './ui/devices.js';
import { registerSprites } from './render/sprites.js';
import { setStageImage } from './render/stage.js';
import { loadBelemStage, belemStageStatus } from './render/belem-stage.js';
import { configureStageAudio, stageAudioStatus, sfx } from './ui/audio.js';
import { createTouch } from './ui/touch.js';
import { spriteLoadOptions } from './render/sprite-profile.js';
import {configureFighterMaterial,fighterMaterialStatus} from './render/fighter-material.js';
import {loadComicUi,comicUiStatus} from './render/comic-ui.js';

const canvas = document.getElementById('game');
const devices = createDevices(window);
const q = new URLSearchParams(location.search);
configureFighterMaterial(q.get('material')!=='off');
window.__fighterMaterialStatus=fighterMaterialStatus;
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
window.__comicUiStatus=comicUiStatus;
const uiReady=window.__COMIC_UI?loadComicUi(window.__COMIC_UI):Promise.resolve();

// Sprites embutidos pelo empacotador (production/sprites/final). ?sprites=off força o manequim.
const packs = q.get('sprites') === 'off' ? {} : window.__SPRITES || {};
const belemPack = (window.__STAGEPACKS || {}).belem;
window.__stageStatus = belemStageStatus;
window.__stageAudioStatus = stageAudioStatus;
if (belemPack && q.get('stage') !== 'off') {
  loadBelemStage(belemPack);
  configureStageAudio(belemPack);
}
const belem = (window.__STAGES || {}).belem;
if (!belemPack && belem && q.get('stage') !== 'off') {
  const img = new Image();
  img.onload = () => setStageImage(img);
  img.src = belem;
}
const soundButton=document.getElementById('sound');
soundButton?.addEventListener('click',()=>{const muted=sfx.toggleMute();soundButton.textContent=muted?'SOM: DESLIGADO':'SOM: LIGADO';soundButton.setAttribute('aria-pressed',String(muted));});
Promise.all(Object.entries(packs).map(([id, sheets]) => {
  return registerSprites(id, sheets, { ...spriteLoadOptions(id), posters: (window.__SPRITEPOSTERS || {})[id] });
})).then(()=>uiReady).then(() => {
  document.getElementById('loading')?.remove();
  app.run();
});
