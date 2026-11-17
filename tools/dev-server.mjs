import { createServer } from 'node:http';
import { createReadStream, watch, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';
const root = process.cwd();
const arg = (name, fallback) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const port = Number(arg('port', '8000'));
const file = arg('out', 'dist/salvadores-nacionais.html');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.ogg':'audio/ogg', '.ttf':'font/ttf' };
createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname === '/' ? `/${file}` : pathname}`);
    if (!path.startsWith(root + sep) || !statSync(path).isFile()) { res.writeHead(404); res.end('Arquivo não encontrado'); return; }
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    const stream = createReadStream(path); stream.on('error', () => res.destroy()); stream.pipe(res);
  } catch { res.writeHead(404); res.end('Arquivo não encontrado'); }
}).listen(port, '0.0.0.0', () => console.log(`Servidor de desenvolvimento na porta ${port}. Recarregue a página após editar src/.`));
let timer, child, pending = false;
function rebuild() {
  if (child) { pending = true; return; }
  child = spawn(process.execPath, ['tools/build.mjs', '--external-assets', `--out=${file}`], { stdio:'inherit' });
  child.on('exit', () => { child = null; if (pending) { pending = false; rebuild(); } });
}
watch(resolve(root, 'src'), { recursive:true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 120); });
