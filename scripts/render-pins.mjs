// Renders the share images that need the site's own fonts, which sharp
// can't draw: each is a small HTML page, laid out with Instrument Serif and
// Hanken Grotesk from node_modules and the finished-look photos from
// public/images, and screenshotted at its exact size in Chrome.
//
//   node scripts/render-pins.mjs
//
// Writes:
//   public/images/guides/halloween-hairstyles-1200x630.jpg  the guide's og:image
//   public/pins/halloween-hair-in-ten-minutes.png           a 1000×1500 pin
//
// Chrome is found by chrome-launcher, or set CHROME_PATH. puppeteer-core and
// chrome-launcher come with @lhci/cli. The files are committed; run this
// again only to change a design.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const { Launcher } = require('chrome-launcher');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (...parts) => pathToFileURL(path.join(ROOT, ...parts)).href;
const SERIF = file('node_modules', '@fontsource', 'instrument-serif', 'files', 'instrument-serif-latin-400-normal.woff2');
const SANS = file('node_modules', '@fontsource-variable', 'hanken-grotesk', 'files', 'hanken-grotesk-latin-wght-normal.woff2');
const photo = (slug) => file('public', 'images', 'styles', `${slug}-finished-800.webp`);

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

// Three of the five looks, the ones done in ten minutes or less, so the
// pin's headline holds for every look it shows.
const LOOKS = [
  { slug: 'space-buns', label: 'Ears' },
  { slug: 'bubble-ponytail', label: 'A tail' },
  { slug: 'top-knot', label: 'A ballerina bun' },
];

const images = [
  {
    out: path.join('public', 'images', 'guides', 'halloween-hairstyles-1200x630.jpg'),
    width: 1200,
    height: 630,
    type: 'jpeg',
    html: `
      <style>${BASE_CSS}
        body { padding: 46px 48px 0; }
        h1 { font-size: 92px; }
        .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 34px; height: 410px; }
        .site { position: absolute; right: 48px; top: 76px; font-size: 26px; }
      </style>
      <h1>Easy Halloween hairstyles</h1>
      <p class="site">dadhairhero.com</p>
      <div class="row">${LOOKS.map((l) => `<img src="${photo(l.slug)}" alt="">`).join('')}</div>`,
  },
  {
    out: path.join('public', 'pins', 'halloween-hair-in-ten-minutes.png'),
    width: 1000,
    height: 1500,
    type: 'png',
    html: `
      <style>${BASE_CSS}
        body { padding: 84px 70px 0; display: flex; flex-direction: column; }
        h1 { font-size: 132px; }
        .sub { font-size: 38px; margin-top: 26px; color: rgba(30, 41, 59, 0.78); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 22px; margin-top: 46px; height: 860px; }
        .grid figure { position: relative; margin: 0; }
        .note { background: #fff; border-radius: 28px; padding: 40px 36px; display: flex; flex-direction: column; justify-content: center; }
        .note h2 { font-family: 'Instrument Serif', serif; font-weight: 400; font-size: 64px; line-height: 1.02; }
        .note p { font-size: 30px; margin-top: 18px; color: rgba(30, 41, 59, 0.78); }
        figcaption { position: absolute; left: 16px; bottom: 16px; background: #fff; border-radius: 999px; padding: 8px 20px; font-size: 28px; font-weight: 600; }
        .site { margin-top: auto; margin-bottom: 52px; text-align: center; font-size: 34px; }
      </style>
      <h1>Halloween hair in ten minutes</h1>
      <p class="sub">Easy looks made from simple styles.</p>
      <div class="grid">${LOOKS.map((l) => `<figure><img src="${photo(l.slug)}" alt=""><figcaption>${l.label}</figcaption></figure>`).join('')}
        <div class="note"><h2>Ears, a tail or a bun</h2><p>5 to 10 minutes each, from styles you can learn.</p></div></div>
      <p class="site">dadhairhero.com</p>`,
  },
];

const executablePath = process.env.CHROME_PATH || Launcher.getInstallations()[0];
if (!executablePath) throw new Error('No Chrome found: set CHROME_PATH');
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pins-'));
try {
  for (const image of images) {
    const page = await browser.newPage();
    await page.setViewport({ width: image.width, height: image.height, deviceScaleFactor: 1 });
    const html = path.join(tmp, 'page.html');
    fs.writeFileSync(html, `<!doctype html><meta charset="utf-8">${image.html}`);
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
    if (!fonts.includes('Instrument Serif')) throw new Error(`${image.out}: Instrument Serif did not load`);
    fs.mkdirSync(path.join(ROOT, path.dirname(image.out)), { recursive: true });
    await page.screenshot({ path: path.join(ROOT, image.out), type: image.type, ...(image.type === 'jpeg' ? { quality: 85 } : {}) });
    await page.close();
    console.log(`${image.out} (${image.width}×${image.height})`);
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
