/** Inicializador portável: usa somente arquivos desta pasta e portas loopback. */
import { spawn, execFile } from 'node:child_process';
import { createServer } from 'node:net';
import { access, readFile, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const nextCli = path.join(root, 'node_modules/next/dist/bin/next');
const statePath = path.join(root, 'runtime/servidor-local.json');
const manifest = JSON.parse(await readFile(path.join(root, 'public/site-local-manifest.json'), 'utf8'));
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function marker(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/site-local-manifest.json`, { signal: AbortSignal.timeout(700), cache: 'no-store' });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

function freePort(port) {
  return new Promise(resolve => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen({ host: '127.0.0.1', port, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

function openBrowser(url) {
  if (process.env.SITE_LOCAL_NO_BROWSER === '1') return;
  // A URL é construída somente com localhost e uma porta numérica escolhida abaixo.
  execFile('cmd.exe', ['/d', '/c', `start "" "${url}"`], { windowsHide: true }, error => {
    if (error) console.log(`Abra este endereço no navegador: ${url}`);
  });
}

async function launch() {
await Promise.all([access(nextCli), access(path.join(root, '.next/BUILD_ID')), access(path.join(root, 'public/world/index.html'))]);
let port;
for (let candidate = 3077; candidate <= 3097; candidate++) {
  const existing = await marker(candidate);
  if (existing?.packageId === manifest.packageId) {
    const url = `http://127.0.0.1:${candidate}/`;
    console.log(`Este site já está aberto: ${url}`);
    openBrowser(url);
    return;
  }
  if (await freePort(candidate)) { port = candidate; break; }
}
if (!port) throw new Error('As portas locais 3077 a 3097 estão ocupadas. Nenhum processo foi encerrado.');

const url = `http://127.0.0.1:${port}/`;
const server = spawn(process.execPath, [nextCli, 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: root, stdio: 'inherit', windowsHide: true,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});
let exited = false;
let failed = false;
server.once('error', error => { failed = true; console.error(error.message); });
server.once('exit', async code => {
  exited = true;
  try {
    const state = JSON.parse(await readFile(statePath, 'utf8'));
    if (state.pid === server.pid) await unlink(statePath);
  } catch { /* Não remove estado pertencente a outro processo. */ }
  process.exitCode = failed ? 1 : (code ?? 0);
});
await writeFile(statePath, JSON.stringify({ packageId: manifest.packageId, root, pid: server.pid, port, url, startedAt: new Date().toISOString() }, null, 2));

let ready = false;
for (let elapsed = 0; elapsed < 45000 && !exited && !failed; elapsed += 300) {
  if ((await marker(port))?.packageId === manifest.packageId) { ready = true; break; }
  await delay(300);
}
if (!ready) {
  console.error('O servidor não ficou pronto. Nenhum outro servidor foi alterado.');
  failed = true;
  server.kill();
} else {
  console.log(`\nSITE PRONTO: ${url}`);
  console.log('Para parar o servidor, pressione Ctrl+C nesta janela.\n');
  await writeFile(path.join(root, 'runtime/ULTIMO-ENDERECO.txt'), url + '\r\n');
  openBrowser(url);
}
// O processo filho mantém esta janela aberta. Ctrl+C encerra apenas este filho.
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { if (!exited) server.kill(); });
}

await launch();
