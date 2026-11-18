import test from 'node:test';
import assert from 'node:assert/strict';
import { warmSprites } from '../../src/render/sprites.js';

test('warming sprites tolerates unknown packs and strips that are not decoded yet', () => {
 const c = { calls: 0, save() {}, restore() {}, drawImage() { this.calls++; } };
 warmSprites(c, ['nao-existe']);
 assert.equal(c.calls, 0);
});
