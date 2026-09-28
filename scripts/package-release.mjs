import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const releaseRoot = path.resolve('release');
const packageDir = path.join(releaseRoot, `canvas-studio-${manifest.version}`);
const archive = path.join(releaseRoot, `canvas-studio-${manifest.version}.zip`);

mkdirSync(releaseRoot, { recursive: true });
rmSync(packageDir, { recursive: true, force: true });
rmSync(archive, { force: true });
mkdirSync(packageDir, { recursive: true });

for (const file of ['main.js', 'manifest.json', 'styles.css']) {
  copyFileSync(file, path.join(packageDir, file));
}

execFileSync('zip', ['-X', '-q', '-j', archive,
  path.join(packageDir, 'main.js'),
  path.join(packageDir, 'manifest.json'),
  path.join(packageDir, 'styles.css')
]);

const digest = createHash('sha256').update(readFileSync(archive)).digest('hex');
writeFileSync(path.join(releaseRoot, 'SHA256SUMS'), `${digest}  ${path.basename(archive)}\n`);
console.log(JSON.stringify({ archive, sha256: digest }, null, 2));
