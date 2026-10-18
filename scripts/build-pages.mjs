import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const env = {
  ...process.env,
  GITHUB_PAGES: 'true',
  NEXT_PUBLIC_BASE_PATH: process.env.PAGES_BASE_PATH || '/meu-site-3d',
};
for (const args of [['scripts/build-world.mjs'], ['node_modules/next/dist/bin/next', 'build']]) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
await writeFile(new URL('../out/.nojekyll', import.meta.url), '');
console.log('GitHub Pages ready in out/');
