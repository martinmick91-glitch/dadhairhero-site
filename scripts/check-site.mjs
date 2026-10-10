// Checks the built site in dist/. Run after `astro build`; the GitHub Action
// runs it on every push and refuses to deploy if anything fails.
//
//   npm run check
//
// What it checks, page by page:
//   links        every internal link, image and anchor points at something built
//   alt text     every image has alt text, a width and a height
//   titles       one title, one description and one h1 each, of a sensible
//                length, and no two pages share a title or description
//   hreflang     every paired page names itself and its twin, the twin
//                names it back, and the canonical is the page's own address
//   structured   every JSON-LD block parses and has what its type needs
//   data
// and four rules of this site's own:
//   - Amazon links are rel="sponsored", only on the Kit page, on the right
//     country's store, and after the disclosure;
//   - every store badge link carries its campaign name;
//   - a Beyond the Ponytail page shows step titles and nothing more;
//   - the sitemap lists exactly the pages that should be indexed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://dadhairhero.com';

const TITLE_MAX = 65;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;
const HREFLANGS = ['en-gb', 'en-us', 'en-ca', 'x-default'];

if (!fs.existsSync(DIST)) {
  console.error('check-site: dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const failures = [];
const fail = (page, message) => failures.push(`${page}: ${message}`);

// ─── The pages ───────────────────────────────────────────────────────────────

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(DIST);
const built = new Set(files.map((file) => '/' + path.relative(DIST, file).replace(/\\/g, '/')));

// /styles/x/index.html is the page /styles/x/
const pages = new Map();
for (const file of files.filter((f) => f.endsWith('.html'))) {
  const relative = '/' + path.relative(DIST, file).replace(/\\/g, '/');
  const url = relative.endsWith('/index.html') ? relative.slice(0, -'index.html'.length) : relative;
  pages.set(url, parse(fs.readFileSync(file, 'utf8')));
}

const en = (code) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', `${code}.json`), 'utf8'));
const content = { uk: en('en-GB'), us: en('en-US') };

const isUS = (url) => url === '/us/' || url.startsWith('/us/');
const meta = (doc, selector, attribute = 'content') => doc.querySelector(selector)?.getAttribute(attribute) ?? null;

// ─── Links ───────────────────────────────────────────────────────────────────

function checkInternal(page, target, what) {
  const [pathname, anchor] = target.split('#');
  if (!pathname.startsWith('/')) return fail(page, `${what} "${target}" is relative; internal links start with /`);
  const file = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  if (!built.has(file)) return fail(page, `${what} "${target}" points at nothing in the build`);
  if (anchor) {
    const doc = pages.get(pathname);
    if (doc && !doc.querySelector(`[id="${anchor}"]`)) fail(page, `${what} "${target}": no element with id "${anchor}"`);
  }
}

function checkLinks(page, doc) {
  for (const a of doc.querySelectorAll('a')) {
    const href = a.getAttribute('href');
    if (!href) { fail(page, `a link has no href ("${a.text.trim().slice(0, 40)}")`); continue; }
    if (!a.text.trim() && !a.querySelector('img[alt]')) fail(page, `link to "${href}" has no text`);
    if (href.startsWith('mailto:')) continue;
    if (/^https?:\/\//.test(href)) {
      if (href.startsWith(SITE)) fail(page, `link "${href}" should be a path, not an absolute address on this site`);
      continue;
    }
    if (href.startsWith('#')) {
      if (!doc.querySelector(`[id="${href.slice(1)}"]`)) fail(page, `link "${href}": no such id on the page`);
      continue;
    }
    checkInternal(page, href, 'link');
  }
  for (const link of doc.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="stylesheet"]')) {
    checkInternal(page, link.getAttribute('href'), 'head link');
  }
}

// ─── Images ──────────────────────────────────────────────────────────────────

function checkImages(page, doc) {
  for (const img of doc.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    const alt = img.getAttribute('alt');
    if (alt === null || alt === undefined || alt.trim().length < 4) fail(page, `image ${src} has no alt text`);
    if (!img.getAttribute('width') || !img.getAttribute('height')) fail(page, `image ${src} has no width and height`);
    checkInternal(page, src, 'image');
    for (const candidate of (img.getAttribute('srcset') ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
      checkInternal(page, candidate.split(/\s+/)[0], 'srcset image');
    }
  }
  const og = meta(doc, 'meta[property="og:image"]');
  if (!og) fail(page, 'no og:image');
  else if (!og.startsWith(SITE)) fail(page, `og:image "${og}" must be an absolute address on this site`);
  else checkInternal(page, og.slice(SITE.length), 'og:image');
}

// ─── Titles and descriptions ─────────────────────────────────────────────────

const titles = new Map();
const descriptions = new Map();

function checkTitles(page, doc, indexed) {
  const all = doc.querySelectorAll('title');
  const title = all[0]?.text.trim() ?? '';
  if (all.length !== 1) fail(page, `${all.length} <title> elements; there must be one`);
  if (!title) fail(page, 'empty title');
  if (title.length > TITLE_MAX) fail(page, `title is ${title.length} characters (limit ${TITLE_MAX}): "${title}"`);

  const description = meta(doc, 'meta[name="description"]') ?? '';
  if (!description) fail(page, 'no meta description');
  if (indexed && (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX)) {
    fail(page, `description is ${description.length} characters (${DESCRIPTION_MIN} to ${DESCRIPTION_MAX}): "${description}"`);
  }

  const h1 = doc.querySelectorAll('h1');
  if (h1.length !== 1) fail(page, `${h1.length} h1 headings; there must be one`);

  if (indexed) {
    // The UK and US versions of a page may share a title only when the words
    // really are the same in both; two different pages never may.
    const key = (text) => `${isUS(page) ? 'us' : 'uk'}|${text}`;
    if (titles.has(key(title))) fail(page, `same title as ${titles.get(key(title))}: "${title}"`);
    titles.set(key(title), page);
    if (descriptions.has(key(description))) fail(page, `same description as ${descriptions.get(key(description))}`);
    descriptions.set(key(description), page);
  }

  if (meta(doc, 'meta[property="og:title"]') !== title) fail(page, 'og:title differs from the title');
  if (meta(doc, 'meta[property="og:description"]') !== description) fail(page, 'og:description differs from the description');
}

// ─── Canonical and hreflang ──────────────────────────────────────────────────

const alternatesOf = (doc) =>
  doc.querySelectorAll('link[rel="alternate"][hreflang]').map((link) => ({
    hreflang: link.getAttribute('hreflang'),
    href: link.getAttribute('href'),
  }));

function checkHreflang(page, doc, indexed) {
  const lang = doc.querySelector('html')?.getAttribute('lang');
  const expectedLang = isUS(page) ? 'en-US' : 'en-GB';
  if (lang !== expectedLang) fail(page, `<html lang="${lang}">, expected ${expectedLang}`);

  const canonical = meta(doc, 'link[rel="canonical"]', 'href');
  if (!indexed) {
    if (canonical) fail(page, 'a noindex page must not have a canonical');
    return;
  }
  if (canonical !== SITE + page) fail(page, `canonical is "${canonical}", expected its own address ${SITE + page}`);
  if (meta(doc, 'meta[property="og:url"]') !== canonical) fail(page, 'og:url differs from the canonical');

  const links = alternatesOf(doc);
  if (page === '/privacy/') {
    if (links.length) fail(page, 'the privacy page has one language and must not have hreflang links');
    return;
  }

  for (const hreflang of HREFLANGS) {
    const matching = links.filter((link) => link.hreflang === hreflang);
    if (matching.length !== 1) fail(page, `${matching.length} hreflang="${hreflang}" links; there must be one`);
  }
  for (const link of links) {
    if (!HREFLANGS.includes(link.hreflang)) fail(page, `unexpected hreflang "${link.hreflang}"`);
    if (!link.href.startsWith(SITE)) { fail(page, `hreflang href "${link.href}" must be absolute`); continue; }
    const target = link.href.slice(SITE.length);
    const twin = pages.get(target);
    if (!twin) { fail(page, `hreflang "${link.hreflang}" points at ${target}, which was not built`); continue; }
    // The other page must say the same thing about this one.
    const back = alternatesOf(twin);
    if (JSON.stringify(back) !== JSON.stringify(links)) fail(page, `${target} does not list the same hreflang links back`);
    if (meta(twin, 'link[rel="canonical"]', 'href') !== link.href) fail(page, `hreflang target ${target} is not its own canonical`);
  }
  const own = links.filter((link) => link.href === SITE + page).map((link) => link.hreflang);
  const expected = isUS(page) ? ['en-us', 'en-ca'] : ['en-gb', 'x-default'];
  if (JSON.stringify(own.sort()) !== JSON.stringify(expected.sort())) {
    fail(page, `lists itself as ${own.join(', ') || 'nothing'}; expected ${expected.join(', ')}`);
  }
}

// ─── Structured data ─────────────────────────────────────────────────────────

const REQUIRED = {
  MobileApplication: ['name', 'operatingSystem', 'applicationCategory', 'offers', 'url'],
  HowTo: ['name', 'step'],
  BreadcrumbList: ['itemListElement'],
  ItemList: ['itemListElement'],
  WebPage: ['name', 'url'],
};

function checkStructuredData(page, doc, indexed) {
  const blocks = doc.querySelectorAll('script[type="application/ld+json"]');
  if (indexed && blocks.length === 0) fail(page, 'no structured data');
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block.text);
    } catch (error) {
      fail(page, `structured data does not parse: ${error.message}`);
      continue;
    }
    const type = data['@type'];
    if (data['@context'] !== 'https://schema.org') fail(page, `${type}: @context must be https://schema.org`);
    if (!REQUIRED[type]) { fail(page, `structured data of an unexpected type: ${type}`); continue; }
    for (const key of REQUIRED[type]) {
      const value = data[key];
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        fail(page, `${type} has no ${key}`);
      }
    }
    // No ratings until there are real ones to quote.
    if (/aggregateRating|"review"/.test(block.text)) fail(page, `${type} carries a rating or review`);

    if (type === 'HowTo') {
      data.step?.forEach((step, i) => {
        if (step['@type'] !== 'HowToStep' || !step.name || !step.text) fail(page, `HowTo step ${i + 1} needs a name and text`);
        if (step.image) checkInternal(page, step.image.slice(SITE.length), 'HowTo step image');
      });
    }
    if (type === 'MobileApplication') {
      if (data.offers?.price !== '0' || !data.offers?.priceCurrency) fail(page, 'MobileApplication offer must be price 0 with a currency');
    }
    if (type === 'BreadcrumbList' || type === 'ItemList') {
      data.itemListElement.forEach((item, i) => {
        if (item.position !== i + 1) fail(page, `${type} item ${i + 1} has position ${item.position}`);
        const target = item.item ?? item.url;
        if (!item.name || !target) { fail(page, `${type} item ${i + 1} needs a name and an address`); return; }
        checkInternal(page, target.slice(SITE.length), `${type} item`);
      });
      if (type === 'BreadcrumbList' && data.itemListElement.at(-1).item !== SITE + page) {
        fail(page, 'the last breadcrumb is not this page');
      }
    }
    for (const key of ['image', 'screenshot', 'primaryImageOfPage']) {
      if (typeof data[key] === 'string') checkInternal(page, data[key].slice(SITE.length), `${type} ${key}`);
    }
  }
}

// ─── This site's own rules ───────────────────────────────────────────────────

function checkOutboundLinks(page, doc) {
  const kitPage = page === '/kit/' || page === '/us/kit/';
  let amazon = 0;
  let stores = 0;
  for (const a of doc.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? '';
    if (/^https?:\/\/([a-z0-9-]+\.)*(amazon\.[a-z.]+|amzn\.to)\//i.test(href)) {
      amazon += 1;
      const host = new URL(href).hostname.replace(/^www\./, '');
      const expected = isUS(page) ? 'amazon.com' : 'amazon.co.uk';
      const tag = isUS(page) ? 'dadhairhero-20' : 'dadhairhero-21';
      if (!kitPage) fail(page, `Amazon link outside the Kit page: ${href}`);
      if (host !== expected) fail(page, `Amazon link goes to ${host}; this page's readers get ${expected}`);
      if (new URL(href).searchParams.get('tag') !== tag) fail(page, `Amazon link without the ${tag} tag: ${href}`);
      if (!(a.getAttribute('rel') ?? '').split(/\s+/).includes('sponsored')) fail(page, `Amazon link without rel="sponsored": ${href}`);
    }
    if (href.startsWith('https://apps.apple.com/')) {
      stores += 1;
      const url = new URL(href);
      if (!url.searchParams.get('ct')) fail(page, `App Store link without a campaign (ct): ${href}`);
      else if (url.searchParams.get('ct').length > 40) fail(page, `App Store campaign over 40 characters: ${href}`);
    }
    if (href.startsWith('https://play.google.com/')) {
      stores += 1;
      const referrer = new URL(href).searchParams.get('referrer') ?? '';
      if (!/utm_source=dadhairhero\.com/.test(referrer) || !/utm_campaign=.+/.test(referrer)) {
        fail(page, `Google Play link without a referrer campaign: ${href}`);
      }
    }
  }
  if (stores < 2) fail(page, 'both store badges must be on every page');
  if (kitPage) {
    if (amazon === 0) fail(page, 'the Kit page has no Buy links');
    const html = doc.toString();
    const disclosure = html.search(/affiliate links/i);
    const firstLink = html.search(/href="https?:\/\/(www\.)?amazon\./i);
    if (disclosure === -1 || disclosure > firstLink) fail(page, 'the affiliate disclosure must come before the first Buy link');
    if (!/As an Amazon Associate/.test(html)) fail(page, 'the Amazon Associates notice is missing');
  }
  if (doc.querySelector('script[src]')) fail(page, 'a page loads a script; the site ships none');
  for (const node of doc.querySelectorAll('script[src], link[rel="stylesheet"], img, iframe')) {
    const address = node.getAttribute('src') ?? node.getAttribute('href') ?? '';
    if (/^(https?:)?\/\//.test(address)) fail(page, `loads something from another site: ${address}`);
  }
}

// A pack page is a preview. If a sentence of a pack style's steps ever
// reached the export, the page would show it; the export must not have it.
function checkPackPreviews() {
  for (const [region, data] of Object.entries(content)) {
    for (const style of data.styles.filter((s) => s.pack)) {
      const extra = style.steps.flatMap((step) => Object.keys(step)).filter((key) => key !== 'title');
      if (extra.length) fail(`src/data (${region})`, `pack style ${style.id} was exported with more than step titles: ${[...new Set(extra)].join(', ')}`);
      if ('theFix' in style || 'commonFailure' in style) fail(`src/data (${region})`, `pack style ${style.id} was exported with its fix`);
      const page = `${region === 'us' ? '/us' : ''}/styles/${style.slug}/`;
      const doc = pages.get(page);
      if (!doc) { fail(page, 'pack style page was not built'); continue; }
      if (doc.querySelector('.steps')) fail(page, 'a pack style page shows full steps');
      if (doc.toString().includes('"HowTo"')) fail(page, 'a pack style page has HowTo structured data');
    }
  }
}

function checkSitemap(indexedPages) {
  const file = path.join(DIST, 'sitemap.xml');
  if (!fs.existsSync(file)) return fail('/sitemap.xml', 'not built');
  const xml = fs.readFileSync(file, 'utf8');
  const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  const expected = indexedPages.map((page) => SITE + page);
  for (const url of expected) if (!listed.includes(url)) fail('/sitemap.xml', `missing ${url}`);
  for (const url of listed) if (!expected.includes(url)) fail('/sitemap.xml', `lists ${url}, which is not an indexed page`);
  if (new Set(listed).size !== listed.length) fail('/sitemap.xml', 'lists an address twice');

  const robots = path.join(DIST, 'robots.txt');
  if (!fs.existsSync(robots) || !fs.readFileSync(robots, 'utf8').includes(`Sitemap: ${SITE}/sitemap.xml`)) {
    fail('/robots.txt', 'must name the sitemap');
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const indexedPages = [];
for (const [page, doc] of pages) {
  const indexed = !/noindex/.test(meta(doc, 'meta[name="robots"]') ?? '');
  if (indexed) indexedPages.push(page);
  checkLinks(page, doc);
  checkImages(page, doc);
  checkTitles(page, doc, indexed);
  checkHreflang(page, doc, indexed);
  checkStructuredData(page, doc, indexed);
  checkOutboundLinks(page, doc);
}
checkPackPreviews();
checkSitemap(indexedPages);
if (!pages.has('/404.html')) fail('/404.html', 'not built');
if (!built.has('/CNAME')) fail('/CNAME', 'not in the build; the custom domain depends on it');

if (failures.length) {
  console.error(`check-site: ${failures.length} problem${failures.length === 1 ? '' : 's'} in ${pages.size} pages\n`);
  for (const line of failures) console.error('  ' + line);
  process.exit(1);
}
console.log(`check-site: ${pages.size} pages, ${indexedPages.length} indexed. Links, alt text, titles, hreflang and structured data all pass.`);
