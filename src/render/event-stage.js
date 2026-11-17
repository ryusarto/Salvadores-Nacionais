import { drawStage } from './stage.js';

/** Temporary event scenery; replace via a stage manifest when painted art is delivered. */
export function drawEventStage(c, layers, cam, frame, variant) {
  drawStage(c, layers, cam, frame);
  c.save(); c.translate(-cam * .65, 0);
  if (variant === 'palco') {
    c.fillStyle = '#261c30'; c.fillRect(500, 700, 1500, 110);
    c.fillStyle = '#f3c426'; c.fillRect(550, 420, 1400, 110);
    c.fillStyle = '#17131b'; c.font = '54px SNComic, sans-serif'; c.textAlign = 'center';
    c.fillText('TURNÊ CONTRA A FOME', 1250, 495);
    for (const x of [450, 1900]) { c.fillStyle = '#17131b'; c.fillRect(x, 540, 150, 260); c.strokeStyle = '#a59c92'; c.lineWidth = 6; for (const y of [610, 730]) { c.beginPath(); c.arc(x + 75, y, 48, 0, Math.PI * 2); c.stroke(); } }
  } else {
    for (let i = 0; i < 5; i++) { const x = 600 + i * 250; c.fillStyle = i % 2 ? '#3c7582' : '#566d92'; c.fillRect(x, 470, 210, 345); c.strokeStyle = '#17131b'; c.lineWidth = 7; c.strokeRect(x, 470, 210, 345); c.strokeRect(x + 20, 510, 170, 285); c.fillStyle = '#f4e9c9'; c.fillRect(x + 80, 550, 50, 60); c.fillStyle = '#17131b'; c.fillRect(x + 160, 680, 15, 12); }
  }
  c.restore();
}
