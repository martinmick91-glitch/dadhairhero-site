// Refuses to build from a stale export.
//
// The app's export (scripts/export-site-data.mjs in the app's repository)
// stamps every file it writes with a content version: a hash of the app's
// content and of the export itself. This runs before `astro build` and
// checks two things:
//
//   1. en-GB.json, en-US.json and glossary.json carry the same version, so
//      the three were written by one run of the export.
//   2. When the app's repository can be found, the content version of the
//      app at the ref named in app-ref.txt (`node scripts/export-site-data.mjs
//      --version`, run on the app as it is at that ref) is the one the site
//      has. If they differ, the build stops and says to export again.
//
// app-ref.txt names the app's commit, branch or tag this site describes. It
// is normally `master`. It names an older commit only while the site must
// describe the version live in the stores and master has moved on (a release
// waiting for review): a site pull request for the live version then still
// passes this check, and the pull request for the next version sets it back
// to master. The check is exactly as strict either way: the export must be
// the app's content at that ref, byte for byte.
//
// How the app at that ref is read:
//   - If the app checkout's HEAD is that commit, its working tree is used, as
//     before (so an uncommitted change in the app counts too). The GitHub
//     Action checks the app out at the ref, so it always takes this path.
//   - Otherwise the ref's files are copied out of the app's git history
//     (`git archive`, which only reads the app's repository) into a temporary
//     folder and the version is worked out there, with the app checkout's
//     node_modules for the export's typescript and sharp.
//   A ref the app's repository doesn't have is a failure, not a skip.
//
// The app's repository is looked for at $APP_REPO, then ../dad-hair-hero.
// Where it isn't there (a CI runner without access to the private
// repository) the second check is skipped with a notice, unless
// REQUIRE_APP_CHECK=1, which makes its absence a failure too.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src', 'data');

// The app ref this site describes: the first line of app-ref.txt that isn't
// blank or a # comment.
const APP_REF_FILE = path.join(ROOT, 'app-ref.txt');
if (!fs.existsSync(APP_REF_FILE)) {
  console.error('check-export: app-ref.txt is missing. It names the app ref the site describes, normally master.');
  process.exit(1);
}
const appRef = fs.readFileSync(APP_REF_FILE, 'utf8').split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith('#'));
if (!appRef || !/^[\w./-]+$/.test(appRef)) {
  console.error(`check-export: app-ref.txt must name one app ref (a branch, tag or commit), found "${appRef ?? ''}".`);
  process.exit(1);
}

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

const git = (...args) => execFileSync('git', args, { cwd: appRepo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const resolve = (ref) => {
  try {
    return git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
  } catch {
    return null;
  }
};

// The ref as given, then the remote's branch of that name (a local branch
// can be behind origin; a ref that only exists on the remote still counts).
const commit = resolve(appRef) ?? resolve(`origin/${appRef}`);
if (!commit) {
  console.error(`check-export: app-ref.txt names "${appRef}", which the app's repository at ${appRepo} doesn't have. Fetch it there, or fix app-ref.txt.`);
  process.exit(1);
}
const head = resolve('HEAD');

// The parts of the app the export reads (its data and modules, the photos,
// the expert-check list, package.json and the export itself), copied out
// of the app's history at `commit` into `dir`. Streamed from git archive
// into tar, so nothing large is held in memory. Anything the export needs
// that isn't here makes it fail, never pass.
const EXPORT_READS = ['package.json', 'src', 'assets', 'scripts'];
function extract(commitId, dir) {
  return new Promise((resolvePromise, reject) => {
    const archive = spawn('git', ['archive', '--format=tar', commitId, ...EXPORT_READS], { cwd: appRepo, stdio: ['ignore', 'pipe', 'pipe'] });
    const untar = spawn('tar', ['-x', '-f', '-', '-C', dir], { stdio: ['pipe', 'ignore', 'pipe'] });
    let errors = '';
    archive.stderr.on('data', (d) => { errors += d; });
    untar.stderr.on('data', (d) => { errors += d; });
    archive.stdout.pipe(untar.stdin);
    const codes = [];
    const done = (name) => (code) => {
      codes.push([name, code]);
      if (codes.length < 2) return;
      const bad = codes.filter(([, c]) => c !== 0);
      if (bad.length) reject(new Error(`${bad.map(([n, c]) => `${n} exited ${c}`).join(', ')}\n${errors}`));
      else resolvePromise();
    };
    archive.on('error', reject);
    untar.on('error', reject);
    archive.on('close', done('git archive'));
    untar.on('close', done('tar'));
  });
}

// The export also asks git for its commit id (metadata only, not part of the
// version), so a copy read from history is pointed at the app's own git
// directory, read-only, for that.
const versionIn = (dir, gitDir) => execFileSync(process.execPath, ['scripts/export-site-data.mjs', '--version'], {
  cwd: dir,
  encoding: 'utf8',
  env: gitDir ? { ...process.env, GIT_DIR: gitDir } : process.env,
}).trim();

let appVersion;
let where;
try {
  if (commit === head) {
    appVersion = versionIn(appRepo);
    where = `${appRepo} (${appRef}, ${commit.slice(0, 7)}, its checkout)`;
  } else {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dhh-app-ref-'));
    try {
      await extract(commit, temp);
      const modules = path.join(appRepo, 'node_modules');
      if (!fs.existsSync(modules)) throw new Error(`no node_modules in ${appRepo}: run npm ci there for the export's typescript and sharp`);
      fs.symlinkSync(modules, path.join(temp, 'node_modules'), 'junction');
      appVersion = versionIn(temp, git('rev-parse', '--absolute-git-dir'));
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
    where = `${appRepo} at ${appRef} (${commit.slice(0, 7)}, read from its history)`;
  }
} catch (error) {
  console.error(`check-export: could not read the app's content version at ${appRef} from ${appRepo}:\n${error.stderr ?? error.message}`);
  process.exit(1);
}

if (appVersion !== siteVersion) {
  console.error(`check-export: the site's exported content (${siteVersion}) is not the app's content at ${appRef} (${appVersion}, ${where}).`);
  console.error(`Export from the app at that ref and commit what it writes here, or set app-ref.txt to the ref the export came from:\n  node scripts/export-site-data.mjs`);
  process.exit(1);
}
console.log(`check-export: content version ${siteVersion} matches the app at ${where}.`);
