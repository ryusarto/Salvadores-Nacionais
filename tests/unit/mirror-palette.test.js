import test from 'node:test';
import assert from 'node:assert/strict';
import { recolorAlt } from '../../src/render/sprites.js';

test('mirror palette keeps skin and outlines, shifts clothes and whites', () => {
  const px = new Uint8ClampedArray([
    196, 140, 104, 255, // pele
    20, 16, 22, 255,    // contorno
    200, 40, 40, 255,   // camisa vermelha
    240, 240, 240, 255, // camisa branca
    0, 0, 0, 0,         // transparente
  ]);
  recolorAlt(px);
  assert.deepEqual([...px.slice(0, 8)], [196, 140, 104, 255, 20, 16, 22, 255]);
  const [r, g, b] = px.slice(8, 11);
  assert.ok(g > r || b > r, `vermelho deve mudar de cor: ${[r, g, b]}`);
  const [wr, , wb] = px.slice(12, 15);
  assert.ok(wb > wr, `branco deve ficar azulado: ${[...px.slice(12, 15)]}`);
  assert.deepEqual([...px.slice(16)], [0, 0, 0, 0]);
});
