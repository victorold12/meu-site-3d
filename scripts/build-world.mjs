import { build, mergeConfig } from '../upstream/node_modules/vite/dist/node/index.js';
import originalConfig from '../upstream/vite.config.js';
import { fileURLToPath } from 'node:url';
import { writeFile, mkdir, copyFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const upstream = path.join(root, 'upstream');
const worldBase = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/world/`;
// Valores do ambiente de estudo. Sem conexão ao backend ou analytics do autor.
// Não fixe ciclo diário/anual: eles fazem parte do runtime e são descritos no README.
Object.assign(process.env, {
  VITE_SERVER_URL: '', VITE_ANALYTICS_TAG: '', VITE_COMPRESSED: '1',
  VITE_GAME_PUBLIC: '1', VITE_LOG: '', VITE_MUSIC: '1', VITE_WHISPERS_COUNT: '30',
});
const config = mergeConfig(originalConfig, {
  configFile: false,
  root: path.join(upstream, 'sources'), envDir: upstream,
  publicDir: path.join(upstream, 'static'), base: worldBase,
  build: { outDir: path.join(root, 'public/world'), emptyOutDir: true },
});
// O plugin de restart é útil apenas no Vite dev. Mantêm-se WASM, TLA e polyfills.
config.plugins = config.plugins.filter(plugin => plugin?.name !== 'vite-plugin-restart');
config.plugins.push({
  name: 'local-study-document',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html
        .replace(/<!-- Analytics -->[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>/, '')
        .replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">')
        .replace(/(href|src)="\/(?!\/)/g, `$1="${worldBase}`);
    },
  },
});
await build(config);
// Web manifests resolvem seus ícones independentemente do HTML: preserve o prefixo local.
const manifestPath = path.join(root, 'public/world/favicons/site.webmanifest');
await writeFile(manifestPath, (await readFile(manifestPath, 'utf8')).replaceAll('"/favicons/', `"${worldBase}favicons/`));
await copyFile(path.join(upstream, 'license.md'), path.join(root, 'public/world/license.md'));
// Fallback solicitado por navegadores mesmo quando o documento filho tem favicon.
await copyFile(path.join(upstream, 'static/favicons/favicon.ico'), path.join(root, 'public/favicon.ico'));
await mkdir(path.join(root, 'docs'), { recursive: true });
await writeFile(path.join(root, 'docs/build-info.json'), JSON.stringify({
  builtAt: new Date().toISOString(),
  upstreamCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(),
  node: process.version, runtime: 'Three.js + Rapier + GSAP + Howler (upstream lockfile)',
  localOnly: process.env.GITHUB_PAGES !== 'true', basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  analytics: false, server: false,
}, null, 2) + '\n');
