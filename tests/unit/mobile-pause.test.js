import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../src/ui/app.js';
import { createDevices } from '../../src/ui/devices.js';
import { createTouch } from '../../src/ui/touch.js';
import { HEROES } from '../../src/data/characters/index.js';

// Real menu/input/core logic with inert DOM/Canvas, not a browser or touch-physics test.
function setup(t) {
  const noop = () => {}, events = new Map(), classes = new Set(['touch']);
  const context = new Proxy({}, {
    get: (object, key) => key === 'measureText' ? () => ({ width: 100 })
      : ['createLinearGradient', 'createRadialGradient'].includes(key) ? () => ({ addColorStop: noop })
      : key === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : object[key] ?? noop,
    set: (object, key, value) => (object[key] = value, true),
  });
  class Element {
    constructor() { this.style = {}; this.dataset = {}; this.children = []; this.nodes = new Map(); this.classList = { remove: noop }; }
    setAttribute() {}
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    getContext() { return context; }
    addEventListener() {}
    querySelectorAll() { return []; }
    querySelector(key) { if (!this.nodes.has(key)) this.nodes.set(key, new Element()); return this.nodes.get(key); }
  }
  const keys = ['document', 'window', 'OffscreenCanvas', 'innerWidth', 'innerHeight'];
  const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
  t.after(() => Object.assign(globalThis, previous));
  const listen = (key, cb) => { if (!events.has(key)) events.set(key, []); events.get(key).push(cb); };
  globalThis.document = { hidden: false, createElement: () => new Element(), body: new Element(), getElementById: () => null,
    addEventListener: listen, documentElement: { classList: { contains: key => classes.has(key), add: key => classes.add(key), toggle: (key, on) => on ? classes.add(key) : classes.delete(key) } } };
  globalThis.window = { addEventListener: listen, matchMedia: () => ({ matches: true }) };
  globalThis.innerWidth = 375; globalThis.innerHeight = 667;
  globalThis.OffscreenCanvas = class extends Element { constructor(width, height) { super(); this.width = width; this.height = height; } };
  const devices = createDevices(window), app = createApp(new Element(), devices), touch = createTouch(devices);
  touch.bind(app);
  return { app, devices, touch, emit: key => events.get(key)?.forEach(cb => cb()) };
}

test('portrait menus remain usable; fight, blur and hidden tab retain the correct suspension', t => {
  const { app, devices, touch, emit } = setup(t);
  assert.equal(app.systemPaused, false, 'portrait title is not combat');
  app.mode = 'training'; app.foe = HEROES[1]; app.startFight(); touch.sync();
  assert.equal(app.systemPaused, true); assert.equal(app.paused, true);
  const frame = app.st.frame;
  emit('blur'); touch.sync(); assert.equal(app.systemPaused, true, 'blur cannot clear portrait suspension');
  devices.pressed.ok = true; app.tick(); assert.equal(app.paused, true, 'keyboard cannot resume in portrait');
  assert.equal(app.st.frame, frame);
  app.pcur = 3; devices.pressed.ok = true; app.tick(); assert.equal(app.sub, 'controls', 'pause submenus stay usable');
  devices.pressed.back = true; app.tick(); assert.equal(app.sub, null);
  app.pcur = 6; devices.pressed.ok = true; app.tick(); touch.sync();
  assert.equal(app.screen, 'title'); assert.equal(app.systemPaused, false, 'portrait Exit returns to a usable title');
  document.hidden = true; emit('visibilitychange'); assert.equal(app.systemPaused, true);
  document.hidden = false; emit('visibilitychange'); assert.equal(app.systemPaused, false);
});

test('restart, combo practice and demo cannot bypass portrait pause via keyboard/controller', t => {
  const { app, devices, touch, emit } = setup(t);
  app.mode = 'training'; app.foe = HEROES[1]; app.startFight(); touch.sync();
  const match = app.st, positions = match.f.map(f => f.x);
  app.pcur = 5; devices.pressed.ok = true; app.tick();
  assert.equal(app.st, match); assert.equal(app.paused, true);
  app.sub = 'combos'; app.ccur = 0;
  devices.pressed.ok = true; app.tick(); devices.pressed.L = true; app.tick();
  assert.equal(app.sub, 'combos'); assert.equal(app.paused, true);
  assert.deepEqual(match.f.map(f => f.x), positions); assert.equal(app.trial, null); assert.equal(app.demo, null);
  innerWidth = 667; innerHeight = 375; emit('resize');
  assert.equal(app.systemPaused, false); assert.equal(app.paused, true, 'rotation requires explicit resume');
  app.sub = null; app.pcur = 0; devices.pressed.ok = true; app.tick(); assert.equal(app.paused, false);
});
