import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, CHAPTER_STAGES, encounterStage } from '../../src/data/stages.js';
import { ALL, HEROES, BOSSES } from '../../src/data/characters/index.js';
import { availableRivals } from '../../src/ui/rivals.js';
import { createRunAt, loadProgress } from '../../src/ui/story.js';
import { setup } from '../helpers/inert-app.js';

const press = (app, devices, key = 'ok') => { devices.pressed[key] = true; app.tick(); };
function selectRival(app, devices, mode) {
  app.mode = mode; app.screen = 'select';
  press(app, devices); assert.equal(app.screen, 'selectFoe');
  app.foeCur = 1; press(app, devices); assert.equal(app.screen, 'selectStage');
}

test('seven arenas override the opponent only in versus/training; story stays canonical', () => {
  assert.equal(new Set(STAGES.map(s => s.id)).size, 7);
  for (const stage of STAGES) {
    for (const mode of ['versus', 'vs2', 'training']) assert.equal(encounterStage({ mode, stageId: stage.id, foe: ALL.zanata }), stage.id);
    for (let chapter = 0; chapter < 7; chapter++) assert.equal(encounterStage({ mode: 'story', story: { chapter }, stageId: stage.id }), CHAPTER_STAGES[chapter]);
  }
  assert.equal(encounterStage({ mode: 'tutorial', stageId: 'inferno', foe: ALL.belga }), 'belem');
  assert.equal(encounterStage({ mode: 'versus', stageId: 'bad', foe: ALL.fujao }), 'aeroporto');
});

test('bosses appear only after chapter wins with any known hero, including existing saves', () => {
  assert.deepEqual(availableRivals({}).filter(Boolean), HEROES);
  for (let done = 0; done <= 7; done++) {
    const list = availableRivals({ belga: done });
    assert.deepEqual(list.filter(ch => ch?.boss), BOSSES.slice(0, done));
    assert.equal(list.at(-1), null, 'random is always last');
  }
  assert.deepEqual(availableRivals({ franco: 1, belga: 2 }).filter(ch => ch?.boss), BOSSES.slice(0, 2), 'progress is shared, not summed');
  assert.deepEqual(availableRivals({ unknown: 7, franco: '7', belga: -1 }).filter(Boolean), HEROES);
});

test('versus and training choose rival, then map, before entering VS; back preserves the route', t => {
  const { app, devices } = setup(t);
  for (const mode of ['versus', 'training']) {
    selectRival(app, devices, mode);
    press(app, devices, 'back'); assert.equal(app.screen, 'selectFoe');
    press(app, devices); assert.equal(app.screen, 'selectStage');
    for (let i = 0; i < STAGES.length; i++) {
      app.stageCur = i; press(app, devices);
      assert.equal(app.screen, 'vs'); assert.equal(encounterStage(app), STAGES[i].id);
      press(app, devices, 'back'); assert.equal(app.screen, 'selectStage');
    }
    app.stageCur = 0; press(app, devices, 'left'); assert.equal(app.stageCur, STAGES.length);
    press(app, devices, 'down'); assert.equal(app.stageCur, 1);
  }
});

test('random chooses a valid map once; restart and rematch preserve it', t => {
  const { app, devices } = setup(t);
  selectRival(app, devices, 'training'); app.stageCur = STAGES.length;
  press(app, devices); const id = app.stageId; assert.ok(CHAPTER_STAGES.includes(id));
  app.startFight(); assert.equal(encounterStage(app), id);
  const previous = app.st; app.paused = true; app.pcur = 5; press(app, devices);
  assert.notEqual(app.st, previous); assert.equal(encounterStage(app), id);
  app.screen = 'result'; app.cur = 0; press(app, devices); assert.equal(encounterStage(app), id);
});

test('two-player map choice preserves both device slots; back unconfirms both players', t => {
  const { app, devices } = setup(t);
  Object.assign(app, { mode: 'vs2', screen: 'select2', slots: ['kb', 3], ready: [true, true] });
  app.tick(); assert.equal(app.screen, 'selectStage');
  press(app, devices, 'back'); assert.equal(app.screen, 'select2');
  assert.deepEqual(app.ready, [false, false]); assert.deepEqual(app.slots, ['kb', 3]);
});

test('only a story victory unlocks the defeated boss; a loss and training do not', t => {
  const { app, devices } = setup(t);
  const finish = (mode, winner) => {
    app.mode = mode; app.story = createRunAt('franco', 0); app.foe = ALL.zanata; app.startFight();
    app.st.phase = 'over'; app.st.winner = winner; app.overT = 100; app.tick();
  };
  finish('story', 1); assert.equal(app.screen, 'storyLose'); assert.equal(app.foes.filter(ch => ch?.boss).length, 0);
  finish('training', 0); assert.equal(app.screen, 'result'); assert.equal(app.foes.filter(ch => ch?.boss).length, 0);
  finish('story', 0); assert.equal(app.screen, 'storyEnd'); assert.equal(loadProgress().franco, 1);
  assert.deepEqual(app.foes.filter(ch => ch?.boss).map(ch => ch.id), ['zanata']);
  selectRival(app, devices, 'training'); assert.equal(app.foes.length, HEROES.length + 2);
});

test('random opponent selection never bypasses boss unlocks', t => {
  const { app } = setup(t);
  const random = Math.random; t.after(() => { Math.random = random; });
  app.mode = 'versus';
  for (let i = 0; i < 40; i++) { Math.random = () => i / 40; app.pickFoe(); assert.ok(HEROES.includes(app.foe)); }
});

test('a boss remains unlocked in this session when browser storage rejects writes', t => {
  const { app, devices } = setup(t);
  globalThis.localStorage = { getItem() { throw Error('unavailable'); }, setItem() { throw Error('unavailable'); } };
  app.mode = 'story'; app.story = createRunAt('franco', 0); app.foe = ALL.zanata; app.startFight();
  app.st.phase = 'over'; app.st.winner = 0; app.overT = 100; app.tick();
  selectRival(app, devices, 'training');
  assert.deepEqual(app.foes.filter(ch => ch?.boss).map(ch => ch.id), ['zanata']);
});
