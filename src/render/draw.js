/** Utilidades de desenho no estilo HQ: texto com contorno, faixas inclinadas e retícula. */
export const FONT = "Impact, 'Arial Black', 'Anton', sans-serif";

/** Texto itálico com contorno preto. */
export function text(c, str, x, y, size, color = '#fff', align = 'center', stroke = '#12080c', lw = null) {
  c.font = `italic 900 ${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw ?? Math.max(4, size * 0.16);
    c.strokeText(str, x, y);
  }
  c.fillStyle = color;
  c.fillText(str, x, y);
}

/** Faixa inclinada (paralelogramo), marca visual das referências. */
export function slab(c, x, y, w, h, color, skew = 14, stroke = '#12080c') {
  c.beginPath();
  c.moveTo(x + skew, y);
  c.lineTo(x + w + skew, y);
  c.lineTo(x + w - skew, y + h);
  c.lineTo(x - skew, y + h);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 4;
    c.stroke();
  }
}

/** Retícula de pontos (halftone) sobre um retângulo. */
export function halftone(c, x, y, w, h, color, step = 14, maxR = 4.5, fade = 'down') {
  c.fillStyle = color;
  for (let j = 0; j * step < h; j++) {
    const t = j / (h / step);
    const r = maxR * (fade === 'down' ? 1 - t : t);
    if (r < 0.4) continue;
    for (let i = 0; i * step < w + step; i++) {
      c.beginPath();
      c.arc(x + i * step + (j % 2) * (step / 2), y + j * step, r, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/** Estrela de impacto. */
export function burst(c, x, y, r, spikes, color, inner = 0.45, rot = 0) {
  c.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + (i * Math.PI) / spikes;
    const rr = i % 2 ? r * inner : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.strokeStyle = '#12080c';
  c.lineWidth = 4;
  c.stroke();
}
