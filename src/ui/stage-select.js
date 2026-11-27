import { STAGES, stageName } from '../data/stages.js';
import { RETRO as R, ptext, pwrap, pixelBox, navyBackground } from '../render/retro-ui.js';
import { belemStageStatus, drawBelemPresentation } from '../render/belem-stage.js';
import { buildStage, drawStage } from '../render/stage.js';
import { stageArtStatus } from '../render/stage-packs.js';
import { drawStageThumb } from './story-screens.js';
import { controlsHint } from './retro-screens.js';

// Shared PC hit targets. Mobile reflows these same choices as native buttons.
export const stageCard = i => ({ x: 65 + i % 2 * 430, y: 195 + Math.floor(i / 2) * 175, w: 410, h: 150 });
export const stageConfirm = { x: 980, y: 890, w: 850, h: 76 };
const previews = new Map();
let fallback;
export function stagePreviewKey(id) {
  return `${id || 'random'}:${id === 'belem' ? belemStageStatus().ready : stageArtStatus(id).ready}`;
}
/** Cached, static preview; browsing maps never requests a complete arena pack. */
export function drawStagePreview(c, id, x, y, w, h) {
  const key = stagePreviewKey(id);
  let image = previews.get(key);
  if (!image) {
    image = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(640, 360)
      : Object.assign(document.createElement('canvas'), { width: 640, height: 360 });
    const g = image.getContext('2d');
    g.fillStyle = '#080b51'; g.fillRect(0, 0, 640, 360);
    if (!id) {
      ptext(g, '?', 320, 150, 12, 'gold');
      ptext(g, 'QUALQUER MAPA', 320, 285, 3, 'cream');
    } else if (!drawStageThumb(g, { stage: id }, 0, 0, 640, 360, { request: false })
      && !drawBelemPresentation(g, 'miniatura', 0, 0, 640, 360)) {
      g.save(); g.scale(640 / 1920, 360 / 1080);
      drawStage(g, fallback ??= buildStage(), 340, 0); g.restore();
    }
    previews.set(key, image);
  }
  c.drawImage(image, x, y, w, h);
}

export function drawStageSelect(c, app, keys) {
  navyBackground(c);
  ptext(c, 'ESCOLHA O MAPA', 960, 75, 9, 'gold');
  ptext(c, app.mode === 'training' ? 'TREINO' : app.mode === 'vs2' ? 'VERSUS • 2 JOGADORES' : 'VERSUS CPU', 960, 132, 4, 'silver');
  [...STAGES, { id: null, name: 'ALEATÓRIO' }].forEach((stage, i) => {
    const box = stageCard(i), selected = app.stageCur === i;
    pixelBox(c, box.x, box.y, box.w, box.h, selected ? '#25184e' : '#000428', selected ? R.yellow : '#5878ff', 5);
    ptext(c, stage.id ? String(i + 1).padStart(2, '0') : '?', box.x + 32, box.y + 28, 3, 'cyan');
    pwrap(stage.name, box.w - 35, 3).forEach((line, n, lines) =>
      ptext(c, line, box.x + box.w / 2, box.y + 82 + (n - (lines.length - 1) / 2) * 34, 3, selected ? 'gold' : 'cream'));
  });
  const id = STAGES[app.stageCur]?.id;
  pixelBox(c, 960, 195, 900, 530, '#000428', R.yellow, 6);
  drawStagePreview(c, id, 976, 211, 868, 498);
  pwrap(stageName(id), 850, 5).forEach((line, i) => ptext(c, line, 1410, 775 + i * 54, 5, 'gold'));
  const box = stageConfirm;
  pixelBox(c, box.x, box.y, box.w, box.h, '#25184e', R.yellow, 5);
  ptext(c, 'CONFIRMAR MAPA', box.x + box.w / 2, box.y + box.h / 2, 5, 'gold');
  controlsHint(c, 1045, keys, 'CONFIRMAR MAPA');
}
