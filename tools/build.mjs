import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// On Windows a CLI installed by npm may be exposed as tsc.cmd,
// which cannot reliably be spawned as a bare executable. Run its
// JavaScript entrypoint through Node instead, on every platform.
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectDir, 'dist');
const typescriptCli = path.join(projectDir, 'node_modules', 'typescript', 'bin', 'tsc');

if (!fs.existsSync(typescriptCli)) {
  console.error('\nTypeScript não está instalado neste projeto.');
  console.error('Execute "npm install" na pasta que contém package.json e tente novamente.');
  console.error('Para jogar sem instalar dependências, abra dist/index.html ou use "npm run dev".\n');
  process.exit(1);
}

const args = [
  typescriptCli, 'src/main.ts',
  '--target', 'ES2022', '--module', 'None',
  '--lib', 'ES2022,DOM', '--strict', '--skipLibCheck',
  '--outDir', outDir, '--pretty', 'false',
];
const result = spawnSync(process.execPath, args, {
  cwd: projectDir,
  stdio: 'inherit',
  windowsHide: true,
});
if (result.error) {
  console.error('Falha ao executar o compilador TypeScript:', result.error.message);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

const compiled = path.join(outDir, 'main.js');
if (!fs.existsSync(compiled)) {
  console.error('A compilação terminou sem gerar dist/main.js.');
  process.exit(1);
}
fs.renameSync(compiled, path.join(outDir, 'game.js'));
for (const file of ['index.html', 'style.css']) {
  fs.copyFileSync(path.join(projectDir, file), path.join(outDir, file));
}
fs.cpSync(path.join(projectDir, 'assets'), path.join(outDir, 'assets'), { recursive: true, force: true });
console.log('Build concluído:', outDir);
