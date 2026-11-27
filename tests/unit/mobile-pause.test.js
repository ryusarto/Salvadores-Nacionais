import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES } from '../../src/data/characters/index.js';

import { setup } from '../helpers/inert-app.js';

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
