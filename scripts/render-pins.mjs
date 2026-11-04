// Renders the share images that need the site's own fonts, which sharp
// can't draw: each is a small HTML page, laid out with Instrument Serif and
// Hanken Grotesk from node_modules and the finished-look photos from
// public/images, and screenshotted at its exact size in Chrome.
//
//   node scripts/render-pins.mjs [name …]
//
// Writes:
//   public/images/guides/<guide>-1200x630.jpg               each seasonal guide's og:image
//   public/pins/halloween-hair-in-ten-minutes.png           the Halloween pin, 1000×1500
//   public/pins/christmas-concert-hair-in-minutes.png       the Christmas pin, 1000×1500
//   public/pins/<file>                                      batch 1's pins, 1000×1500
//                                                           (scripts/pins-batch-1.mjs)
//
// With names, only the images whose file names contain one of them.
//
// Chrome is found by chrome-launcher, or set CHROME_PATH. puppeteer-core and
// chrome-launcher come with @lhci/cli. The files are committed; run this
// again only to change a design.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PINS } from './pins-batch-1.mjs';
import { stylePin, stepStrip, guideCollage, guidePin } from './pin-designs.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const { Launcher } = require('chrome-launcher');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (...parts) => pathToFileURL(path.join(ROOT, ...parts)).href;
const SERIF = file('node_modules', '@fontsource', 'instrument-serif', 'files', 'instrument-serif-latin-400-normal.woff2');
const SANS = file('node_modules', '@fontsource-variable', 'hanken-grotesk', 'files', 'hanken-grotesk-latin-wght-normal.woff2');
// A style's finished-look picture, as the export names it (Half-Up,
// Half-Down's is its last step).
const US_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'en-US.json'), 'utf8'));
const photo = (id) => {
  const style = US_DATA.styles.find((s) => s.id === id);
  if (!style || style.pack) throw new Error(`${id}: not a free style in the export`);
  return file('public', `${style.image.base}-800.webp`);
};

// The site's colours (src/styles/site.css).
const BASE_CSS = `
  @font-face { font-family: 'Instrument Serif'; src: url('${SERIF}') format('woff2'); }
  @font-face { font-family: 'Hanken Grotesk'; src: url('${SANS}') format('woff2'); font-weight: 100 900; }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 100%; height: 100%; }
  body { background: #fcebdd; color: #1e293b; font-family: 'Hanken Grotesk', sans-serif; }
  h1 { font-family: 'Instrument Serif', serif; font-weight: 400; line-height: 1; letter-spacing: -0.01em; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 28px; }
  .site { color: #a85a28; font-weight: 600; letter-spacing: 0.02em; }
`;

// Each seasonal guide's first three free looks (HALLOWEEN and CHRISTMAS in
// src/lib/site.js), each done in ten minutes or less, so the pin's
// headline holds for every look it shows. US English: the pins are for the
// US pages. The Christmas pictures are the app's, with no ribbon, so their
// labels name the style rather than the ribbon.
const GUIDES = [
  {
    slug: 'halloween-hairstyles',
    pin: 'halloween-hair-in-ten-minutes.png',
    collage: 'Easy Halloween hairstyles',
    headline: 'Halloween hair in ten minutes',
    looks: [
      { id: 'high-ponytail', label: 'A tail' },
      { id: 'two-even-bunches', label: 'Pigtails' },
      { id: 'half-up-half-down', label: 'Under a hat' },
    ],
  },
  {
    slug: 'christmas-party-hairstyles',
    pin: 'christmas-concert-hair-in-minutes.png',
    collage: 'Easy Christmas hairstyles',
    headline: 'Christmas concert hair in minutes',
    looks: [
      { id: 'half-up-half-down', label: 'Half-up' },
      { id: 'high-ponytail', label: 'High ponytail' },
      { id: 'two-even-bunches', label: 'Pigtails' },
    ],
  },
];
const guideImages = GUIDES.flatMap((guide) => [
  {
    out: path.join('public', 'images', 'guides', `${guide.slug}-1200x630.jpg`),
    width: 1200,
    height: 630,
    type: 'jpeg',
    html: guideCollage(BASE_CSS, { headline: guide.collage, pictures: guide.looks.map((l) => photo(l.id)) }),
  },
  {
    out: path.join('public', 'pins', guide.pin),
    width: 1000,
    height: 1500,
    type: 'png',
    html: guidePin(BASE_CSS, {
      headline: guide.headline,
      sub: 'Easy looks made from simple styles.',
      looks: guide.looks.map((l) => ({ picture: photo(l.id), label: l.label })),
      note: 'Free, step by step',
      noteSub: '4 to 6 minutes each, every step on dadhairhero.com.',
    }),
  },
]);

// Batch 1: free styles only, so every picture is one the site already
// shows on that style's page.
const minutes = (n) => `${n} minute${n === 1 ? '' : 's'}`;
const batch1 = PINS.map((pin) => {
  const style = US_DATA.styles.find((s) => s.id === pin.styleId);
  const html = pin.pillar === 'step strip'
    ? stepStrip(BASE_CSS, {
      headline: pin.headline,
      steps: [
        ...pin.steps.map((n) => ({ title: style.steps[n - 1].title, picture: file('public', `${style.steps[n - 1].photo.base}-800.webp`) })),
        { title: `Done in ${minutes(style.targetMinutes)}`, picture: photo(pin.styleId), done: true },
      ],
    })
    : stylePin(BASE_CSS, { headline: pin.headline, picture: photo(pin.styleId) });
  return { out: path.join('public', 'pins', pin.file), width: 1000, height: 1500, type: 'png', html };
});

const images = [
  ...guideImages,
  ...batch1,
];

const only = process.argv.slice(2);
const executablePath = process.env.CHROME_PATH || Launcher.getInstallations()[0];
if (!executablePath) throw new Error('No Chrome found: set CHROME_PATH');
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pins-'));
try {
  for (const image of images.filter((i) => !only.length || only.some((n) => i.out.split(path.sep).join('/').includes(n)))) {
    const page = await browser.newPage();
    await page.setViewport({ width: image.width, height: image.height, deviceScaleFactor: 1 });
    const html = path.join(tmp, 'page.html');
    fs.writeFileSync(html, `<!doctype html><meta charset="utf-8">${image.html}`);
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
    if (!fonts.includes('Instrument Serif')) throw new Error(`${image.out}: Instrument Serif did not load`);
    const small = await page.evaluate(() => [...document.querySelectorAll('h1')].some((h) => parseFloat(getComputedStyle(h).fontSize) < 60));
    if (small) throw new Error(`${image.out}: the headline is under 60px`);
    const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
    if (broken.length) throw new Error(`${image.out}: missing ${broken.join(', ')}`);
    fs.mkdirSync(path.join(ROOT, path.dirname(image.out)), { recursive: true });
    await page.screenshot({ path: path.join(ROOT, image.out), type: image.type, ...(image.type === 'jpeg' ? { quality: 85 } : {}) });
    await page.close();
    console.log(`${image.out} (${image.width}×${image.height})`);
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
