// Operações de pixel das tiras, sem DOM e sem nada de fora da própria função.
// O mesmo código roda na thread do jogo (reserva) e dentro do worker de sprites,
// que recebe estas funções como texto: não referencie variáveis de módulo aqui.

/**
 * Remove o fundo liso de uma tira: apaga, a partir das bordas e das divisas
 * entre células, a cor do canto de baixo à esquerda.
 * @returns {boolean} true se alterou algum pixel
 */
export function keyOutPixels(p, W, H) {
  const k = (H - 3) * W * 4 + 3 * 4; // canto de baixo à esquerda
  if (p[k + 3] < 250) return false; // já é transparente
  const r0 = p[k], g0 = p[k + 1], b0 = p[k + 2];
  const TOL = 46;
  const seen = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const n = y * W + x;
    if (seen[n]) return;
    seen[n] = 1;
    const i = n * 4;
    if (Math.abs(p[i] - r0) + Math.abs(p[i + 1] - g0) + Math.abs(p[i + 2] - b0) < TOL) stack.push(n);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  const cell = H;
  for (let x = cell; x < W; x += cell) for (let y = 0; y < H; y++) { push(x - 1, y); push(x, y); }
  while (stack.length) {
    const n = stack.pop();
    p[n * 4 + 3] = 0;
    const x = n % W;
    const y = (n / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return true;
}

/**
 * Paleta alternativa para a luta espelhada. Pele e tons bege ficam; cores
 * saturadas giram de matiz; branco e cinza ganham o tom neutro da paleta;
 * contorno e sombras profundas não mudam.
 * @param {{rotation:number, neutralHue:number, saturation:number}} palette
 */
export function recolorPixels(px, palette) {
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (l < 0.12) continue; // contorno e sombras profundas
    let h = 0, s = 0;
    if (d > 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    if (s >= 0.15 && h >= 5 && h <= 50 && l >= 0.2 && l <= 0.88) continue; // pele, bege, marrom claro
    let nh, ns;
    if (s < 0.15) { nh = palette.neutralHue; ns = palette.saturation; }
    else { nh = (h + palette.rotation) % 360; ns = s; }
    const c = (1 - Math.abs(2 * l - 1)) * ns, x = c * (1 - Math.abs((nh / 60) % 2 - 1)), m = l - c / 2;
    let r1, g1, b1;
    if (nh < 60) { r1 = c; g1 = x; b1 = 0; } else if (nh < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (nh < 180) { r1 = 0; g1 = c; b1 = x; } else if (nh < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (nh < 300) { r1 = x; g1 = 0; b1 = c; } else { r1 = c; g1 = 0; b1 = x; }
    px[i] = Math.round((r1 + m) * 255); px[i + 1] = Math.round((g1 + m) * 255); px[i + 2] = Math.round((b1 + m) * 255);
  }
  return px;
}
