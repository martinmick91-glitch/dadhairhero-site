// Renders one short vertical video (1080×1920, no sound) for each free
// style, in each language, from the step photos and captions the export
// wrote, and records them in public/videos/videos.json. The pages embed a
// video only when it is in that manifest.
//
//   npm run videos
//
// Each video is a title card, one card per step (the step's photo, its
// title and instruction, and what to check), and the finished look. The
// cards are composed with sharp, then joined by ffmpeg. The length is set
// per style so that every video lands between 30 and 45 seconds.
//
// The files are committed, so the videos are also there for YouTube and
// Pinterest later: public/videos/<language>/<slug>.mp4, with a poster
// beside each. Run this again after an export that changes a free style.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'videos');
const W = 1080;
const H = 1920;
const FPS = 24;

const PEACH = '#FCEBDD';
const INDIGO = '#1E293B';
const APRICOT_TEXT = '#A85A28';
const BLUSH = '#FBCFE8';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Segoe UI", Arial, Helvetica, sans-serif';

const LOCALES = [
  { code: 'en-GB', file: 'en-GB.json' },
  { code: 'en-US', file: 'en-US.json' },
];

const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Wraps text to lines of about `chars` characters, at most `max` lines; a
// cut line ends in an ellipsis rather than mid-word.
function wrap(text, chars, max) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > chars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    kept[max - 1] = kept[max - 1].replace(/[,;:]?\s*\S*$/, '') + '…';
    return kept;
  }
  return lines;
}

function textBlock({ lines, x, y, size, family, fill, weight = 'normal', lineHeight = 1.25, anchor = 'start' }) {
  return lines
    .map((line, i) =>
      `<text x="${x}" y="${y + i * size * lineHeight}" font-family='${family}' font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(line)}</text>`)
    .join('');
}

const svg = (inner) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`);

async function card({ photo, top, bottom }) {
  // A square photo in the middle, text above and below it.
  const layers = [];
  const bg = sharp({ create: { width: W, height: H, channels: 3, background: PEACH } });
  let photoTop = 420;
  if (photo) {
    const img = await sharp(photo).resize(920, 920).png().toBuffer();
    layers.push({ input: img, left: 80, top: photoTop });
  }
  layers.push({ input: svg(top), left: 0, top: 0 });
  if (bottom) layers.push({ input: svg(bottom), left: 0, top: 0 });
  return bg.composite(layers).png().toBuffer();
}

function brand(y = H - 110) {
  return textBlock({ lines: ['Dad Hair Hero'], x: W / 2, y, size: 44, family: SERIF, fill: INDIGO, anchor: 'middle' })
    + textBlock({ lines: ['dadhairhero.com'], x: W / 2, y: y + 52, size: 30, family: SANS, fill: APRICOT_TEXT, anchor: 'middle' });
}

const photoFile = (ref) => path.join(ROOT, 'public', `${ref.base}-${Math.max(...ref.widths)}.webp`);

async function render(locale, style, tmp) {
  const n = style.steps.length;
  // Title 3 s, finished look 4 s, and the steps share the rest so the whole
  // thing lands between 30 and 45 seconds.
  const perStep = Math.min(9, Math.max(4, Math.round(29 / n)));
  const frames = [];
  const add = async (buffer, seconds) => {
    const file = path.join(tmp, `frame-${String(frames.length).padStart(2, '0')}.png`);
    fs.writeFileSync(file, buffer);
    frames.push({ file, seconds });
  };

  await add(await card({
    photo: photoFile(style.image),
    top:
      textBlock({ lines: wrap(style.name, 22, 2), x: W / 2, y: 190, size: 92, family: SERIF, fill: INDIGO, anchor: 'middle' })
      + textBlock({ lines: [`${n} steps, about ${style.targetMinutes} minute${style.targetMinutes === 1 ? '' : 's'}`], x: W / 2, y: 330, size: 40, family: SANS, fill: APRICOT_TEXT, anchor: 'middle' }),
    bottom:
      textBlock({ lines: wrap(style.description, 44, 3), x: W / 2, y: 1440, size: 38, family: SANS, fill: INDIGO, anchor: 'middle', lineHeight: 1.3 })
      + brand(),
  }), 3);

  for (const [i, step] of style.steps.entries()) {
    const check = wrap(step.endState, 46, 2);
    await add(await card({
      photo: step.photo ? photoFile(step.photo) : null,
      top:
        textBlock({ lines: [`STEP ${i + 1} OF ${n}`], x: 80, y: 150, size: 30, family: SANS, fill: APRICOT_TEXT, weight: 'bold' })
        + textBlock({ lines: wrap(step.title, 26, 2), x: 80, y: 250, size: 64, family: SERIF, fill: INDIGO, lineHeight: 1.15 }),
      bottom:
        textBlock({ lines: wrap(step.instruction, 50, 4), x: 80, y: 1410, size: 36, family: SANS, fill: INDIGO, lineHeight: 1.3 })
        + `<rect x="80" y="${1600}" width="${W - 160}" height="${80 + check.length * 44}" rx="20" fill="${BLUSH}"/>`
        + textBlock({ lines: ['BEFORE YOU MOVE ON'], x: 110, y: 1645, size: 24, family: SANS, fill: APRICOT_TEXT, weight: 'bold' })
        + textBlock({ lines: check, x: 110, y: 1700, size: 34, family: SANS, fill: INDIGO, lineHeight: 1.3 }),
    }), perStep);
  }

  const outro = await card({
    photo: photoFile(style.image),
    top:
      textBlock({ lines: ['DONE'], x: W / 2, y: 150, size: 30, family: SANS, fill: APRICOT_TEXT, weight: 'bold', anchor: 'middle' })
      + textBlock({ lines: wrap(style.name, 22, 2), x: W / 2, y: 260, size: 84, family: SERIF, fill: INDIGO, anchor: 'middle' }),
    bottom:
      textBlock({ lines: ['Every step, with the check, in the free app.', 'No account. No tracking.'], x: W / 2, y: 1440, size: 38, family: SANS, fill: INDIGO, anchor: 'middle', lineHeight: 1.35 })
      + textBlock({ lines: ['Dad Hair Hero on the App Store and Google Play'], x: W / 2, y: 1580, size: 32, family: SANS, fill: APRICOT_TEXT, anchor: 'middle' })
      + brand(),
  });
  await add(outro, 4);

  const total = frames.reduce((sum, f) => sum + f.seconds, 0);
  const list = frames.map((f) => `file '${f.file.replace(/\\/g, '/')}'\nduration ${f.seconds}`).join('\n')
    + `\nfile '${frames[frames.length - 1].file.replace(/\\/g, '/')}'\n`;
  const listFile = path.join(tmp, 'list.txt');
  fs.writeFileSync(listFile, list);

  const dir = path.join(OUT, locale.code);
  fs.mkdirSync(dir, { recursive: true });
  const mp4 = path.join(dir, `${style.slug}.mp4`);
  const poster = path.join(dir, `${style.slug}-poster.jpg`);
  execFileSync(ffmpeg, [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', `fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-tune', 'stillimage',
    '-movflags', '+faststart', '-an',
    mp4,
  ]);
  await sharp(outro).resize(540, 960).jpeg({ quality: 80 }).toFile(poster);

  return {
    styleId: style.id,
    locale: locale.code,
    slug: style.slug,
    src: `/videos/${locale.code}/${style.slug}.mp4`,
    poster: `/videos/${locale.code}/${style.slug}-poster.jpg`,
    durationSeconds: total,
    width: W,
    height: H,
    bytes: fs.statSync(mp4).size,
  };
}

const today = new Date().toISOString().slice(0, 10);
const previous = fs.existsSync(path.join(OUT, 'videos.json'))
  ? JSON.parse(fs.readFileSync(path.join(OUT, 'videos.json'), 'utf8'))
  : { videos: [] };
const videos = [];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dhh-video-'));
try {
  for (const locale of LOCALES) {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', locale.file), 'utf8'));
    for (const style of data.styles.filter((s) => !s.pack)) {
      const video = await render(locale, style, tmp);
      // The upload date is the day the video first appeared, kept across
      // re-renders of the same style.
      const before = previous.videos.find((v) => v.styleId === video.styleId && v.locale === video.locale);
      video.uploadDate = before?.uploadDate ?? today;
      video.contentVersion = data.contentVersion;
      videos.push(video);
      console.log(`${locale.code} ${style.name}: ${video.durationSeconds}s, ${(video.bytes / 1024).toFixed(0)} KB`);
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
fs.writeFileSync(path.join(OUT, 'videos.json'), JSON.stringify({ renderedAt: today, videos }, null, 2) + '\n');
console.log(`${videos.length} videos in ${path.relative(ROOT, OUT)}`);
