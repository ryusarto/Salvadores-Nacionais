// UI regression in Chromium. Combat result injection below tests unlock boundaries, not player skill/balance.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.STAGE_MENU_BASE_URL || 'http://127.0.0.1:8792';
const output = 'artifacts/stage-selection', errors = [], requests = [], checks = [];
await mkdir(output, { recursive: true });
let browser, server, currentPage;
const screen = (p, name) => p.waitForFunction(name => __app.screen === name, name);
const click = (p, id) => p.locator(`[data-action="${id}"]`).click();
async function chooseRival(p, mode, index = 1) {
  await click(p, mode); await screen(p, 'select');
  await click(p, 'pick-0'); await click(p, 'confirm-selection'); await screen(p, 'selectFoe');
  await click(p, `pick-${index}`); await click(p, 'confirm-selection'); await screen(p, 'selectStage');
}
async function fightOn(p, id) {
  await click(p, `stage-${id}`); await click(p, 'confirm-stage');
  await p.waitForFunction(() => __app.screen === 'fight' && __app.st.phase === 'fight');
  assert.equal(await p.evaluate(() => __app.stageId), id);
  await p.waitForFunction(id => __stageAudioStatus().stage === id, id);
}
async function exitFight(p, touch = false) {
  if (touch) await p.locator('#tpause').tap(); else await p.keyboard.press('Enter');
  await p.waitForFunction(() => __app.paused);
  await click(p, 'pause-6'); await screen(p, 'title');
}
async function rivals(p, count, unlocked = []) {
  const names = await p.locator('[data-action^="pick-"] .menu-button-text').allTextContents();
  assert.equal(names.length, count);
  assert.deepEqual(await p.evaluate(() => __app.foes.filter(ch => ch?.boss).map(ch => ch.id)), unlocked);
  if (!unlocked.length) assert.ok(!names.some(name => /ZANATA|CHUPETINHA|PAVANASSI|FUJÃO|LARANJÃO|DJABO/.test(name)), names.join(','));
}
async function storyPages(p, from) {
  await screen(p, from);
  const pages = await p.evaluate(() => __app.storyPages.length);
  for (let i = 0; i < pages; i++) {
    await click(p, 'next');
    await p.waitForFunction(({ from, i }) => __app.screen !== from || __app.story.page !== i, { from, i });
  }
  await screen(p, 'storyMap');
}
try {
  if (!process.env.STAGE_MENU_BASE_URL) {
    let logs = '';
    server = spawn(process.execPath, ['tools/dev-server.mjs', '--port=8792'], { stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', data => logs += data); server.stderr.on('data', data => logs += data);
    for (let n = 0; n < 200 && !logs.includes('Servidor de desenvolvimento'); n++) {
      if (server.exitCode !== null) throw Error(logs); await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.ok(logs.includes('Servidor de desenvolvimento'), logs);
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = currentPage = await context.newPage(); p.setDefaultTimeout(90000);
  p.on('pageerror', error => errors.push(error.message)); p.on('request', request => requests.push(request.url()));
  await p.goto(base); await p.waitForFunction(() => __app?.frame > 5 && !document.getElementById('loading'));
  await click(p, 'versus'); await screen(p, 'select'); await click(p, 'confirm-selection'); await screen(p, 'selectFoe');
  await rivals(p, 9); await click(p, 'pick-1'); await click(p, 'confirm-selection'); await screen(p, 'selectStage');
  assert.equal(await p.locator('[data-action^="stage-"]').count(), 8);
  for (const id of ['belem', 'palco', 'banheiros', 'aeroporto', 'mansao', 'washington', 'inferno', 'random']) {
    await click(p, `stage-${id}`);
    await p.locator(`[data-action="stage-${id}"][aria-pressed="true"]`).waitFor();
  }
  assert.ok(!requests.some(url => /\/stages\/(palco|banheiros|aeroporto|mansao|washington|inferno)\//.test(url)), 'browsing must not download full arena packs');
  await click(p, 'stage-washington'); await p.screenshot({ path: `${output}/desktop-maps.png` });
  await click(p, 'back'); await screen(p, 'selectFoe'); await rivals(p, 9);
  await click(p, 'confirm-selection'); await screen(p, 'selectStage');
  await fightOn(p, 'washington'); assert.equal(await p.evaluate(() => __app.foe.id), 'belga');
  await p.waitForFunction(() => __stageArtStatus('washington').ready);
  assert.ok(!requests.some(url => /\/stages\/(palco|banheiros|aeroporto|mansao|inferno)\//.test(url)));
  await exitFight(p); checks.push('fresh save hides all bosses; seven maps/random and lazy preview; selected arena/audio independent of rival');
  await chooseRival(p, 'training'); await fightOn(p, 'inferno');
  await p.keyboard.press('Enter'); await p.waitForFunction(() => __app.paused);
  await click(p, 'pause-5'); await p.waitForFunction(() => !__app.paused && __app.st.phase === 'fight');
  assert.equal(await p.evaluate(() => __app.stageId), 'inferno'); await exitFight(p);
  checks.push('training selects a rival and map; restart preserves map');
  // Reach the first real campaign fight via the existing HUD; only the outcome is a fixture.
  await click(p, 'story'); await screen(p, 'select'); await click(p, 'confirm-selection'); await storyPages(p, 'storyIntro');
  await click(p, 'next'); await screen(p, 'storyTalk');
  for (let n = 0; n < 12 && await p.evaluate(() => __app.screen === 'storyTalk'); n++) {
    const page = await p.evaluate(() => __app.story.page);
    await click(p, 'next'); await p.waitForFunction(page => __app.screen !== 'storyTalk' || __app.story.page !== page, page);
  }
  await p.waitForFunction(() => __app.screen === 'fight');
  assert.equal(await p.evaluate(() => __app.foe.id), 'zanata');
  await p.evaluate(() => { __app.st.phase = 'over'; __app.st.winner = 0; __app.overT = 100; });
  await screen(p, 'storyEnd'); assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('sn-historia')).franco), 1);
  await storyPages(p, 'storyEnd'); await click(p, 'previous'); await screen(p, 'title');
  await p.reload(); await p.waitForFunction(() => __app?.frame > 5 && !document.getElementById('loading'));
  for (const mode of ['versus', 'training']) {
    await click(p, mode); await screen(p, 'select'); await click(p, 'confirm-selection'); await screen(p, 'selectFoe');
    await rivals(p, 10, ['zanata']);
    assert.ok(await p.locator('[data-action="pick-8"]').textContent().then(text => text.includes('ZANATA')));
    await click(p, 'back'); await screen(p, 'select'); await click(p, 'back'); await screen(p, 'title');
  }
  checks.push('campaign victory unlocks only Zanata in both selectors and survives reload; campaign keeps its chapter arena');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await context.storageState() });
  const m = currentPage = await mobile.newPage(); m.setDefaultTimeout(90000); m.on('pageerror', error => errors.push(error.message));
  await m.goto(base); await m.waitForFunction(() => __app?.frame > 5 && !document.getElementById('loading'));
  await click(m, 'training'); await screen(m, 'select'); await click(m, 'confirm-selection'); await screen(m, 'selectFoe'); await rivals(m, 10, ['zanata']);
  await m.screenshot({ path: `${output}/mobile-unlocked-rival.png` });
  await click(m, 'pick-8'); await click(m, 'confirm-selection'); await screen(m, 'selectStage');
  await click(m, 'stage-aeroporto');
  const layout = await m.locator('#accessible-menu').evaluate(root => ({ width: root.clientWidth, scroll: root.scrollWidth,
    heights: [...root.querySelectorAll('button')].map(button => button.getBoundingClientRect().height) }));
  assert.ok(layout.scroll <= layout.width && layout.heights.every(height => height >= 44));
  await m.screenshot({ path: `${output}/mobile-maps-portrait.png` });
  await m.setViewportSize({ width: 844, height: 390 }); await m.screenshot({ path: `${output}/mobile-maps-landscape.png` });
  await m.locator('[data-action="confirm-stage"]').tap(); await m.waitForFunction(() => __app.screen === 'fight' && __app.st.phase === 'fight');
  assert.equal(await m.evaluate(() => __app.stageId), 'aeroporto'); assert.equal(await m.evaluate(() => __app.foe.id), 'zanata');
  await exitFight(m, true); checks.push('mobile portrait/landscape map chooser, boss unlock UI, touch confirm and selected arena in training');
  assert.deepEqual(errors, []);
  await writeFile(`${output}/result.json`, JSON.stringify({ passed: true, checks, errors, combatOutcome: 'injected victory; does not certify gameplay balance', physicalMobile: false }, null, 2));
  console.log(JSON.stringify({ passed: true, checks, errors }));
} catch (error) {
  await currentPage?.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  const state = await currentPage?.evaluate(() => ({ screen: __app.screen, mode: __app.mode, stage: __app.stageId, sub: __app.sub, text: document.querySelector('#accessible-menu')?.innerText })).catch(() => null);
  console.error(JSON.stringify({ error: String(error), checks, state })); throw error;
} finally { await browser?.close(); server?.kill('SIGTERM'); }
