import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));

const errors = [];
if (manifest.version !== packageJson.version) errors.push('manifest and package versions differ');
if (packageLock.version !== packageJson.version) errors.push('lockfile and package versions differ');
if (versions[manifest.version] !== manifest.minAppVersion) errors.push('versions.json does not map the current version to minAppVersion');

for (const file of ['main.js', 'manifest.json', 'styles.css']) {
  if (statSync(file).size === 0) errors.push(`${file} is empty`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

const digest = createHash('sha256').update(readFileSync('main.js')).digest('hex');
console.log(JSON.stringify({
  plugin: manifest.id,
  version: manifest.version,
  minAppVersion: manifest.minAppVersion,
  mainJsSha256: digest
}, null, 2));
