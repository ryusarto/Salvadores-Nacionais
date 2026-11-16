import { SYS } from '../data/system.js';
import { phoneBox, LIVE } from '../data/characters/chupetinha.js';

const OUT = '#12080c';
const GY = SYS.GROUND_Y;

/** Chupeta gigante: escudo rosa, argola e bico. */
export function drawPacifier(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineWidth = 5;
  c.strokeStyle = OUT;
  c.fillStyle = '#ffe9a8';
  c.beginPath();
  c.ellipse(26, 0, 22, 16, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#ff8fc0';
  c.beginPath();
  c.ellipse(0, 0, 16, 34, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.beginPath();
  c.lineWidth = 7;
  c.arc(-22, 0, 18, Math.PI * 0.5, Math.PI * 1.5);
  c.stroke();
  c.lineWidth = 3;
  c.strokeStyle = '#ff8fc0';
  c.stroke();
  c.restore();
}

/**
 * Celular da live do Chupetinha, preso num pau de selfie sobre a cabeça.
 * A posição vem de phoneBox, a mesma caixa que o combate usa.
 */
export function drawLivePhone(c, f, frame) {
  const r = f.res;
  if (!r || f.state === 'ko') return;
  const b = phoneBox(f);
  const cx = (b.l + b.r) / 2;
  const cy = GY - (b.b + b.t) / 2 + Math.sin(frame / 14) * 6;
  c.save();
  // pau de selfie saindo das costas
  c.strokeStyle = OUT;
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(f.x - f.face * 40, GY - f.y - 300);
  c.lineTo(cx, cy + 40);
  c.stroke();
  c.strokeStyle = '#8a8590';
  c.lineWidth = 4;
  c.stroke();
  // aparelho
  c.translate(cx, cy);
  c.rotate(Math.sin(frame / 22) * 0.06);
  c.fillStyle = '#1c1820';
  c.strokeStyle = OUT;
  c.lineWidth = 5;
  c.beginPath();
  c.roundRect(-34, -50, 68, 100, 10);
  c.fill();
  c.stroke();
  const live = r.live;
  c.fillStyle = live ? '#ffd6ea' : '#4a4652';
  c.fillRect(-26, -40, 52, 78);
  if (live) {
    // selo AO VIVO e barras de sinal
    c.fillStyle = '#e8243c';
    c.fillRect(-46, -86, 92, 28);
    c.strokeRect(-46, -86, 92, 28);
    c.fillStyle = '#fff';
    c.font = "bold 18px Impact, 'Arial Black', sans-serif";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(frame % 40 < 28 ? '● AO VIVO' : 'AO VIVO', 0, -72);
    for (let i = 0; i < LIVE.signal; i++) {
      c.fillStyle = i < r.signal ? '#2a9d4a' : '#a59c92';
      c.fillRect(-20 + i * 14, 24 - i * 9, 10, 10 + i * 9);
    }
    // corações subindo
    for (let k = 0; k < 3; k++) {
      const t = ((frame + k * 23) % 70) / 70;
      c.globalAlpha = 1 - t;
      c.fillStyle = '#ff4fa0';
      c.font = "bold 22px Impact, sans-serif";
      c.fillText('♥', 34 + k * 8, -40 - t * 90);
    }
    c.globalAlpha = 1;
  } else {
    // tela rachada
    c.strokeStyle = '#d8d0dc';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-20, -30); c.lineTo(4, -2); c.lineTo(-10, 18); c.moveTo(4, -2); c.lineTo(22, 10);
    c.stroke();
    if (r.offT > 0) {
      c.fillStyle = '#9ff5e8';
      c.font = "bold 16px Impact, 'Arial Black', sans-serif";
      c.textAlign = 'center';
      c.fillText('SEM SINAL', 0, -66);
    }
  }
  c.restore();
}
