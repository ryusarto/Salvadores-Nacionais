import { createApp } from '../../src/ui/app.js';
import { createDevices } from '../../src/ui/devices.js';
import { createTouch } from '../../src/ui/touch.js';

// Real menu/input/core logic with inert DOM/Canvas, not a browser or touch-physics test.
export function setup(t, progress = {}) {
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
  const keys = ['document', 'window', 'OffscreenCanvas', 'innerWidth', 'innerHeight', 'localStorage'];
  const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
  t.after(() => Object.assign(globalThis, previous));
  const listen = (key, cb) => { if (!events.has(key)) events.set(key, []); events.get(key).push(cb); };
  globalThis.document = { hidden: false, createElement: () => new Element(), body: new Element(), getElementById: () => null,
    addEventListener: listen, documentElement: { classList: { contains: key => classes.has(key), add: key => classes.add(key), toggle: (key, on) => on ? classes.add(key) : classes.delete(key) } } };
  globalThis.window = { addEventListener: listen, matchMedia: () => ({ matches: true }) };
  const values = new Map([['sn-historia', JSON.stringify(progress)]]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  globalThis.innerWidth = 375; globalThis.innerHeight = 667;
  globalThis.OffscreenCanvas = class extends Element { constructor(width, height) { super(); this.width = width; this.height = height; } };
  const devices = createDevices(window), app = createApp(new Element(), devices), touch = createTouch(devices);
  touch.bind(app);
  return { app, devices, touch, emit: key => events.get(key)?.forEach(cb => cb()) };
}
