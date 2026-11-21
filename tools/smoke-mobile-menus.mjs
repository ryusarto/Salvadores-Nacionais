// Browser regression for responsive menus; viewport/touch emulation, not physical-device certification.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const port = 8791, base = process.env.MOBILE_MENU_BASE_URL || `http://127.0.0.1:${port}`;
const output = process.env.MOBILE_MENU_ARTIFACT_DIR || 'artifacts/mobile-menus';
await mkdir(output, { recursive: true });
let server, browser, mobilePage;
const errors = [], checks = [];
const screen = (page, expected) => page.waitForFunction(value => __app.screen === value, expected);
const tap = (page, id) => page.locator(`[data-action="${id}"]`).tap();
async function swipeMenu(page) {
  const body = page.locator('.mobile-menu-body'), box = await body.boundingBox();
  const before = await body.evaluate(el => el.scrollTop), session = await page.context().newCDPSession(page);
  const x = box.x + box.width * .7, from = box.y + box.height - 25, to = box.y + 25;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] });
  for (let i = 1; i <= 8; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from + (to - from) * i / 8 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(top => document.querySelector('.mobile-menu-body').scrollTop > top, before);
  await session.detach();
}
async function usable(page) {
  const bounds = await page.locator('#accessible-menu').evaluate(root => ({ width: root.clientWidth, scrollWidth: root.scrollWidth,
    buttons: [...root.querySelectorAll('button')].map(b => ({ id: b.dataset.action, height: b.getBoundingClientRect().height, width: b.getBoundingClientRect().width })) }));
  assert.ok(bounds.scrollWidth <= bounds.width + 1, 'menu must not overflow horizontally');
  assert.ok(bounds.buttons.every(b => b.height >= 44 && b.width >= 44), JSON.stringify(bounds.buttons));
  const footer = page.locator('.mobile-menu-actions');
  if (await footer.isVisible()) {
    const r = await footer.boundingBox(), v = page.viewportSize();
    assert.ok(r.y >= 0 && r.y + r.height <= v.height + 1, 'navigation stays in viewport');
  }
}
try {
  if (!process.env.MOBILE_MENU_BASE_URL) {
    let ready = '';
    server = spawn(process.execPath, ['tools/dev-server.mjs', `--port=${port}`], { stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', s => ready += s); server.stderr.on('data', s => ready += s);
    for (let i = 0; i < 200 && !ready.includes('Servidor de desenvolvimento'); i++) {
      if (server.exitCode !== null) throw Error(ready); await new Promise(r => setTimeout(r, 50));
    }
    assert.ok(ready.includes('Servidor de desenvolvimento'), ready);
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = mobilePage = await context.newPage(); p.setDefaultTimeout(90000);
  p.on('pageerror', e => errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base); await p.waitForFunction(() => __app?.frame > 5 && !document.getElementById('loading'));
  assert.equal(await p.evaluate(() => __app.systemPaused), false, 'portrait title must remain interactive');
  assert.ok(await p.locator('.mobile-menu-logo').isVisible()); await usable(p);
  await p.screenshot({ path: `${output}/portrait-title.png` }); checks.push('portrait title and pixel artwork');
  await tap(p, 'settings'); await screen(p, 'settings'); await usable(p);
  await tap(p, 'controls'); await screen(p, 'controls'); assert.ok(await p.locator('[data-action="control-reset"]').isVisible()); await usable(p);
  await tap(p, 'back'); await screen(p, 'settings');
  await tap(p, 'gallery'); await screen(p, 'gallery'); await usable(p);
  await tap(p, 'back'); await screen(p, 'settings'); await tap(p, 'back'); await screen(p, 'title'); checks.push('options, controls/reset and endings');
  await tap(p, 'versus'); await screen(p, 'select'); assert.equal(await p.locator('[data-action^="pick-"]').count(), 8); await usable(p);
  await tap(p, 'pick-7'); assert.equal(await p.evaluate(() => __app.hero), 7); await tap(p, 'confirm-selection'); await screen(p, 'selectFoe');
  assert.equal(await p.locator('[data-action^="pick-"]').count(), 16); await usable(p);
  await swipeMenu(p); await screen(p, 'selectFoe'); checks.push('touch swipe scrolls rivals without navigating');
  await tap(p, 'pick-14'); assert.equal(await p.evaluate(() => __app.foeCur), 14); await p.screenshot({ path: `${output}/portrait-rivals.png` });
  await tap(p, 'back'); await screen(p, 'select'); await tap(p, 'back'); await screen(p, 'title'); checks.push('complete hero/rival selectors and fixed confirm/back');
  await tap(p, 'training'); await screen(p, 'select'); await tap(p, 'pick-0'); await tap(p, 'confirm-selection'); await screen(p, 'fight');
  await p.waitForFunction(() => __app.systemPaused && __app.paused);
  const frozen = await p.evaluate(() => __app.st.frame); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(() => __app.st.frame), frozen); assert.ok(await p.locator('[data-action="pause-0"]').isDisabled());
  await tap(p, 'pause-2');
  await p.waitForFunction(() => __app.sub === 'moves' && document.querySelectorAll('.mobile-menu-details dt').length > 5); await usable(p);
  await p.screenshot({ path: `${output}/portrait-moves.png` });
  await tap(p, 'back'); await p.waitForFunction(() => !__app.sub);
  await tap(p, 'pause-3'); await p.locator('[data-action="control-reset"]').waitFor({ state: 'visible' });
  await tap(p, 'back'); await p.waitForFunction(() => !__app.sub);
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForFunction(() => !__app.systemPaused);
  await tap(p, 'pause-0'); await p.waitForFunction(() => !__app.paused && __app.st.phase === 'fight' && __app.st.frame > 2);
  await p.locator('#tpause').tap(); await p.waitForFunction(() => __app.paused); await usable(p);
  await tap(p, 'pause-1'); await p.waitForFunction(() => __app.sub === 'combos'); await usable(p);
  await p.screenshot({ path: `${output}/landscape-combos.png` });
  await tap(p, 'back'); await p.waitForFunction(() => !__app.sub); await tap(p, 'pause-6'); await screen(p, 'title'); checks.push('portrait pause navigation, frozen combat, rotation and landscape resume');
  await p.screenshot({ path: `${output}/landscape-title.png` }); await usable(p);
  await p.setViewportSize({ width: 320, height: 568 });
  await tap(p, 'story'); await screen(p, 'select'); await usable(p); await tap(p, 'confirm-selection'); await screen(p, 'storyIntro');
  await usable(p); await tap(p, 'next'); await usable(p); await tap(p, 'previous'); await usable(p);
  checks.push('small portrait and campaign pages');
  // UI fixture only: physical controllers/joins are covered separately, not simulated by touch.
  await p.evaluate(() => { Object.assign(__app, { screen: 'select2', mode: 'vs2', hero: 0, hero2: 1, slots: ['kb', 99], ready: [true, false] }); __app.render(); });
  assert.ok((await p.locator('.mobile-menu-details').textContent()).includes('JOGADOR 1'));
  assert.ok((await p.locator('.mobile-menu-details').textContent()).includes('PRONTO'));
  assert.ok((await p.locator('.mobile-menu-details').textContent()).includes('BELGA'));
  checks.push('two-player selection status UI fixture, without synthetic touch joins');
  // PC retains the exact transparent canvas hit areas, without a touch overlay.
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await desktop.goto(base); await desktop.waitForFunction(() => __app?.frame > 5 && !document.getElementById('loading'));
  assert.equal(await desktop.evaluate(() => document.documentElement.classList.contains('touch')), false);
  assert.equal(await desktop.locator('.mobile-menu-logo').isVisible(), false);
  await desktop.locator('[data-action="settings"]').click(); await screen(desktop, 'settings');
  checks.push('desktop canvas menu regression');
  assert.deepEqual(errors, []);
  const report = { passed: true, scope: 'Chrome viewport/touch emulation only', checks, errors, date: new Date().toISOString() };
  await writeFile(`${output}/result.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} catch (error) {
  if (mobilePage) {
    await mobilePage.screenshot({ path: `${output}/failure.png` }).catch(() => {});
    await writeFile(`${output}/failure.json`, JSON.stringify({ error: String(error), checks, errors,
      state: await mobilePage.evaluate(() => ({ screen: __app.screen, sub: __app.sub, paused: __app.paused, phase: __app.st?.phase,
        menu: document.querySelector('#accessible-menu')?.innerText })).catch(() => null) }, null, 2));
  }
  throw error;
} finally { await browser?.close(); server?.kill('SIGTERM'); }
