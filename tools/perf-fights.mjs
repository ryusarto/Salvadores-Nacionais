// Mede a fluidez de cada luta num Chrome de verdade (GPU e vsync reais).
//
// Uso (depois de `npm run build`):
//   node tools/perf-fights.mjs [--secs=15] [--cpu=1] [--headless] [--fights=0:franco,5:laranjao]
//
// --cpu=4 simula um aparelho 4x mais lento. Sem --fights, mede cada herói contra
// o próprio espelho (paleta alternativa) e cada chefe na sua arena. O Chrome vem
// de CHROMIUM_PATH ou da instalação padrão do macOS. A meta é: nenhum quadro
// acima de 20 ms e nenhuma tarefa longa (> 50 ms) na thread do jogo.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';

const arg = (k, d) => process.argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const secs = Number(arg('secs', '15')), cpu = Number(arg('cpu', '1'));
const headless = process.argv.includes('--headless');
const chrome = process.env.CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Servidor estático mínimo na raiz do projeto (o jogo carrega as artes de production/).
const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.ogg': 'audio/ogg', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!path.startsWith(root + sep) || !statSync(path).isFile()) throw 0;
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
    createReadStream(path).pipe(res);
  } catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath: chrome, headless, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', e => console.error('erro na página:', e.message));
const cdp = await page.context().newCDPSession(page);
await page.goto(`${base}/dist/salvadores-nacionais.html?auto`);
await page.waitForFunction(() => window.__app && __app.screen === 'title' && !document.getElementById('loading') && __comicUiStatus().loaded, null, { timeout: 60000 });
if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });

const roster = await page.evaluate(() => ({ heroes: __roster.HEROES.map(c => c.id), bosses: __roster.BOSSES.map(c => c.id) }));
const fights = arg('fights') ? arg('fights').split(',').map(s => { const [h, f] = s.split(':'); return [Number(h), f]; })
  : [...roster.heroes.map((id, i) => [i, id]), ...roster.bosses.map((id, i) => [i % roster.heroes.length, id])];

let worst = 0;
console.log(`Chrome ${headless ? 'headless' : 'em janela'}, CPU ${cpu}x, ${secs} s por luta\n`);
for (const [hero, foe] of fights) {
  const r = await page.evaluate(async ([hero, foe, secs]) => {
    const app = __app, all = Object.fromEntries([...__roster.HEROES, ...__roster.BOSSES].map(c => [c.id, c]));
    const wait = async (f, ms = 30000) => { const t = performance.now(); while (!f() && performance.now() - t < ms) await new Promise(r => setTimeout(r, 30)); };
    app.screen = 'title'; app.mode = 'versus'; app.hero = hero; app.foe = all[foe];
    app.enterVs();
    // Como no jogo: a luta só começa depois de a tela de versus aquecer cenário e sprites.
    await wait(() => app.vsReady && app.arenaWarm);
    app.startFight();
    const long = []; const po = new PerformanceObserver(l => { for (const e of l.getEntries()) long.push(e.duration); }); po.observe({ type: 'longtask' });
    const frames = []; let last = performance.now(), run = true;
    (function f(n) { frames.push(n - last); last = n; if (run) requestAnimationFrame(f); })(performance.now());
    const f0 = app.st.frame, t0 = performance.now();
    await new Promise(r => setTimeout(r, secs * 1000));
    run = false; po.disconnect();
    const s = frames.slice(2);
    const out = { ticks: +((app.st.frame - f0) / ((performance.now() - t0) / 1000)).toFixed(1), slow: s.filter(x => x > 20).length, worst: Math.round(Math.max(...s)), longMs: Math.round(long.reduce((a, b) => a + b, 0)) };
    app.screen = 'title';
    return out;
  }, [hero, foe, secs]);
  const name = `${roster.heroes[hero]} x ${foe}`.padEnd(22);
  const ok = r.slow === 0 && r.longMs === 0;
  worst = Math.max(worst, r.worst);
  console.log(`${ok ? 'ok  ' : 'LENTO'} ${name} quadros > 20 ms: ${String(r.slow).padStart(3)}   pior: ${String(r.worst).padStart(3)} ms   travado: ${r.longMs} ms   lógica: ${r.ticks}/s`);
}
console.log(`\nPior quadro de todas as lutas: ${worst} ms (60 fps = 16,7 ms por quadro).`);
await browser.close();
server.close();
