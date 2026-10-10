// Refuses to build from a stale export.
//
// The app's export (scripts/export-site-data.mjs in the app's repository)
// stamps every file it writes with a content version: a hash of the app's
// content and of the export itself. This runs before `astro build` and
// checks two things:
//
//   1. en-GB.json, en-US.json and glossary.json carry the same version, so
//      the three were written by one run of the export.
//   2. When the app's repository can be found, its current content version
//      (`node scripts/export-site-data.mjs --version`) is the one the site
//      has. If the app's content has moved on, the build stops and says to
//      export again.
//
// The app's repository is looked for at $APP_REPO, then ../dad-hair-hero.
// Where it isn't there (a CI runner without access to the private
// repository) the second check is skipped with a notice, unless
// REQUIRE_APP_CHECK=1, which makes its absence a failure too.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src', 'data');

const versions = Object.fromEntries(
  ['en-GB.json', 'en-US.json', 'glossary.json'].map((file) => {
    const full = path.join(DATA, file);
    if (!fs.existsSync(full)) {
      console.error(`check-export: ${file} is missing. Run the app's export: node scripts/export-site-data.mjs`);
      process.exit(1);
    }
    return [file, JSON.parse(fs.readFileSync(full, 'utf8')).contentVersion];
  }),
);

const distinct = new Set(Object.values(versions));
if (distinct.size !== 1 || distinct.has(undefined) || distinct.has(null)) {
  console.error('check-export: the exported files carry different content versions, so they are not from one export:');
  for (const [file, version] of Object.entries(versions)) console.error(`  ${file}: ${version ?? 'none'}`);
  console.error('Run the app\'s export again.');
  process.exit(1);
}
const siteVersion = [...distinct][0];

const candidates = [process.env.APP_REPO, path.join(ROOT, '..', 'dad-hair-hero')].filter(Boolean);
const appRepo = candidates.find((dir) => fs.existsSync(path.join(dir, 'scripts', 'export-site-data.mjs')));

if (!appRepo) {
  const message = `check-export: site content version ${siteVersion}. The app's repository was not found (${candidates.join(', ')}), so it was not compared with the app's current content.`;
  if (process.env.REQUIRE_APP_CHECK === '1') {
    console.error(message);
    process.exit(1);
  }
  console.log(message);
  process.exit(0);
}

let appVersion;
try {
  appVersion = execFileSync(process.execPath, ['scripts/export-site-data.mjs', '--version'], { cwd: appRepo, encoding: 'utf8' }).trim();
} catch (error) {
  console.error(`check-export: could not read the app's content version from ${appRepo}:\n${error.stderr ?? error.message}`);
  process.exit(1);
}

if (appVersion !== siteVersion) {
  console.error(`check-export: the site's exported content (${siteVersion}) is not the app's current content (${appVersion}).`);
  console.error(`Run the export in ${appRepo} and commit what it writes here:\n  node scripts/export-site-data.mjs`);
  process.exit(1);
}
console.log(`check-export: content version ${siteVersion} matches the app at ${appRepo}.`);
