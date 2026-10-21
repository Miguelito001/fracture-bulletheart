import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compiler = path.join(dir, 'node_modules', 'typescript', 'bin', 'tsc');
const built = ['index.html', 'game.js', 'style.css'].every(
  (file) => fs.existsSync(path.join(dir, 'dist', file))
);

if (fs.existsSync(compiler)) {
  const result = spawnSync(process.execPath, [path.join(dir, 'tools', 'build.mjs')], {
    cwd: dir,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message ?? 'Falha na compilação.');
    process.exit(result.status || 1);
  }
} else if (built) {
  console.log('TypeScript local não instalado: usando a versão compilada fornecida em dist/.');
  console.log('Para recompilar alterações em src/: execute npm install e depois npm run dev.');
} else {
  console.error('Não existe build pronto em dist/ e o TypeScript não está instalado.');
  console.error('Execute npm install e tente novamente.');
  process.exit(1);
}

await import('./serve.mjs');
