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
//   structured   every JSON-LD block parses and has what its type needs; a
//   data         free style page carries HowTo, FAQPage and (with a video)
//                VideoObject, a technique HowTo and FAQPage, About Person
//                and Organization
//   orphans      every indexed page is linked from the body of at least one
//                other page, not only from the header or footer
// and five rules of this site's own:
//   - Amazon links are rel="sponsored", only on the Kit page, on the right
//     country's store, and after the disclosure;
//   - every store badge link carries its campaign name;
//   - a Beyond the Ponytail page shows step titles and nothing more;
//   - the sitemap lists exactly the pages that should be indexed;
//   - a page opened from the app's share link passes its campaign on to
//     the store links, and touches no cookie or storage.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
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
    const decorative = alt === '' && img.closest('.app-bar');
    if (!decorative && (alt === null || alt === undefined || alt.trim().length < 4)) fail(page, `image ${src} has no alt text`);
    if (!decorative && alt && /^(image|photo|picture)$/i.test(alt.trim())) fail(page, `image ${src} has alt text that says nothing: "${alt}"`);
    if (!img.getAttribute('width') || !img.getAttribute('height')) fail(page, `image ${src} has no width and height`);
    checkInternal(page, src, 'image');
    for (const candidate of (img.getAttribute('srcset') ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
      checkInternal(page, candidate.split(/\s+/)[0], 'srcset image');
    }
  }
  for (const video of doc.querySelectorAll('video')) {
    const poster = video.getAttribute('poster');
    const source = video.querySelector('source')?.getAttribute('src');
    if (!poster) fail(page, 'a video has no poster');
    else checkInternal(page, poster, 'video poster');
    if (!source) fail(page, 'a video has no source');
    else checkInternal(page, source, 'video source');
    if (video.getAttribute('preload') !== 'none') fail(page, 'a video must not preload');
    if (!video.getAttribute('width') || !video.getAttribute('height')) fail(page, 'a video has no width and height');
    if (!doc.toString().includes('"VideoObject"')) fail(page, 'a video without VideoObject structured data');
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
  HowTo: ['name', 'step', 'author'],
  BreadcrumbList: ['itemListElement'],
  ItemList: ['itemListElement'],
  WebPage: ['name', 'url'],
  FAQPage: ['mainEntity'],
  VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate', 'contentUrl', 'duration'],
  Organization: ['name', 'url', 'logo'],
  Person: ['name', 'url'],
  WebSite: ['name', 'url'],
  ImageObject: ['contentUrl', 'width', 'height', 'description'],
  Article: ['headline', 'description', 'image', 'datePublished', 'dateModified', 'author', 'publisher'],
};

// What each kind of page must carry.
const EXPECTED_TYPES = [
  [/^(\/us)?\/styles\/[^/]+\/$/, (doc) => (doc.querySelector('.steps') ? ['HowTo', 'FAQPage'] : ['WebPage'])],
  [/^(\/us)?\/techniques\/[^/]+\/$/, () => ['HowTo', 'FAQPage']],
  [/^(\/us)?\/about\/$/, () => ['Person', 'Organization']],
  [/^(\/us)?\/$/, () => ['MobileApplication', 'Organization', 'WebSite']],
  [/^(\/us)?\/halloween-hairstyles\/$/, () => ['Article', 'BreadcrumbList', 'ItemList']],
];

function checkStructuredData(page, doc, indexed) {
  const blocks = doc.querySelectorAll('script[type="application/ld+json"]');
  if (indexed && blocks.length === 0) fail(page, 'no structured data');
  const types = [];
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block.text);
    } catch (error) {
      fail(page, `structured data does not parse: ${error.message}`);
      continue;
    }
    const type = data['@type'];
    types.push(type);
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
    if (type === 'FAQPage') {
      if (data.mainEntity.length < 3 || data.mainEntity.length > 5) fail(page, `FAQPage has ${data.mainEntity.length} questions; it should have 3 to 5`);
      const visible = doc.querySelectorAll('.faq summary').map((el) => el.text.trim());
      for (const q of data.mainEntity) {
        if (q['@type'] !== 'Question' || !q.name || !q.acceptedAnswer?.text) fail(page, 'FAQPage question without a name or answer');
        else if (!visible.includes(q.name)) fail(page, `FAQ question not visible on the page: "${q.name}"`);
      }
    }
    if (type === 'VideoObject') {
      for (const key of ['thumbnailUrl', 'contentUrl']) checkInternal(page, data[key].slice(SITE.length), `VideoObject ${key}`);
      if (!/^PT\d+S$/.test(data.duration)) fail(page, `VideoObject duration "${data.duration}" is not ISO 8601`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.uploadDate)) fail(page, `VideoObject uploadDate "${data.uploadDate}" is not a date`);
    }
    if (type === 'Article') {
      for (const key of ['datePublished', 'dateModified']) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data[key] ?? '')) fail(page, `Article ${key} "${data[key]}" is not a date`);
      }
      if (data.dateModified < data.datePublished) fail(page, 'Article was modified before it was published');
      if (data.author?.['@type'] !== 'Person' || data.author?.url !== `${SITE}/about/`) fail(page, 'Article author must be Martin, linking to the About page');
      if (data.publisher?.['@type'] !== 'Organization' || data.publisher?.name !== 'Dad Hair Hero') fail(page, 'Article publisher must be Dad Hair Hero');
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
    for (const key of ['image', 'screenshot', 'primaryImageOfPage', 'logo']) {
      if (typeof data[key] === 'string') checkInternal(page, data[key].slice(SITE.length), `${type} ${key}`);
    }
  }
  for (const [pattern, expected] of EXPECTED_TYPES) {
    if (!pattern.test(page)) continue;
    for (const type of expected(doc)) if (!types.includes(type)) fail(page, `no ${type} structured data`);
  }
}

// ─── Orphans ─────────────────────────────────────────────────────────────────

// Every indexed page must be linked from the body (<main>) of some other
// page. Header and footer links don't count: a page only a menu knows about
// is a page nobody is sent to.
function checkOrphans(indexedPages) {
  const inbound = new Map(indexedPages.map((page) => [page, new Set()]));
  for (const [page, doc] of pages) {
    for (const a of doc.querySelectorAll('main a[href]')) {
      const target = a.getAttribute('href').split('#')[0];
      if (target !== page && inbound.has(target)) inbound.get(target).add(page);
    }
  }
  for (const [page, from] of inbound) {
    if (page === '/' || page === '/us/') continue;
    if (from.size === 0) fail(page, 'orphan: no other page links to it from its body');
  }
}

// ─── Placeholders ────────────────────────────────────────────────────────────

// Text left for a person to write. A warning, not a failure, so the site
// can be built and reviewed with it in; it is listed at the end of every run.
const warnings = [];
function checkPlaceholders(page, doc) {
  if (/\[PLACEHOLDER/.test(doc.querySelector('main')?.text ?? '')) warnings.push(`${page}: has a [PLACEHOLDER] still to be written`);
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
      if (url.pathname !== '/app/apple-store/id6810375103') fail(page, `App Store link to the wrong address: ${href}`);
      if (url.searchParams.get('pt') !== '129433924') fail(page, `App Store link without the provider token (pt): ${href}`);
      if (url.searchParams.get('mt') !== '8') fail(page, `App Store link without mt=8: ${href}`);
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
  if (doc.querySelector('script[src]')) fail(page, 'a page loads a script file; the only script is the inline app bar');
  for (const script of doc.querySelectorAll('script:not([type="application/ld+json"])')) {
    if (/fetch\(|XMLHttpRequest|sendBeacon|new Image\(|localStorage/.test(script.text)) fail(page, 'an inline script sends or stores something; the site records nothing');
  }
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

// ─── The app's share campaign ────────────────────────────────────────────────

// A page opened from the app's "Send the steps" passes its share-<style>
// campaign on to the store links, a page opened from a Pinterest pin its
// pin-<id> campaign, and one opened from the site's own "Send this to him"
// its fwd-<id> campaign (src/components/ShareCampaign.astro). Every page
// carries the script; run here against a page's real store links, it
// rewrites them for those and leaves them alone for anything else.
// It touches no cookie and no storage.
function checkShareCampaign() {
  const marker = "var source = params.get('utm_source');";
  let source = null;
  for (const [url, doc] of pages) {
    const script = doc.querySelectorAll('script').map((s) => s.textContent).find((t) => t.includes(marker));
    if (!script) { fail(url, 'no share-campaign script'); continue; }
    source ??= script;
  }
  if (!source) return;
  if (/cookie|localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/.test(source)) {
    fail('ShareCampaign.astro', 'the share-campaign script must not store or send anything');
  }
  // A real style page (the one a share links to), with its own copy of the
  // script and its store links.
  const storeLinks = (doc) => doc.querySelectorAll('a').map((a) => a.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('https://apps.apple.com/') || href.startsWith('https://play.google.com/'));
  const page = [...pages.entries()].find(([url, doc]) => url === '/styles/classic-ponytail/' && storeLinks(doc).length >= 2);
  if (!page) { fail('/styles/classic-ponytail/', 'not built with store links, so the share campaign could not be checked'); return; }
  source = page[1].querySelectorAll('script').map((s) => s.textContent).find((t) => t.includes(marker)) ?? source;
  const original = storeLinks(page[1]);
  const run = (search) => {
    const links = original.map((href) => ({ href }));
    const sandbox = {
      location: { search }, URL, URLSearchParams,
      document: { querySelectorAll: () => links, querySelector: () => null },
    };
    vm.runInNewContext(source, sandbox);
    return links.map((l) => l.href);
  };
  const longestFwd = 'fwd-' + 'b'.repeat(36);
  const longest = 'pin-' + 'a'.repeat(36); // 40 characters, the most allowed
  const carried = [
    ['?utm_source=app&utm_campaign=share-classic-ponytail', 'share-classic-ponytail', 'share'],
    ['?utm_source=pinterest&utm_campaign=pin-school-ponytail-2', 'pin-school-ponytail-2', 'social'],
    [`?utm_source=pinterest&utm_campaign=${longest}`, longest, 'social'],
    // The longest step-strip and handoff campaigns in pins/ (pin-st-, pin-ho-).
    ['?utm_source=pinterest&utm_medium=social&utm_campaign=pin-st-clip-back-baby-wisps', 'pin-st-clip-back-baby-wisps', 'social'],
    ['?utm_source=pinterest&utm_medium=social&utm_campaign=pin-ho-clip-back-baby-wisps', 'pin-ho-clip-back-baby-wisps', 'social'],
    // Forwarded with "Send this to him": from a pin, and from a direct visit.
    ['?utm_source=share&utm_medium=web&utm_campaign=fwd-pin-halloween-hair', 'fwd-pin-halloween-hair', 'web'],
    ['?utm_source=share&utm_medium=web&utm_campaign=fwd-classic-ponytail', 'fwd-classic-ponytail', 'web'],
    [`?utm_source=share&utm_campaign=${longestFwd}`, longestFwd, 'web'],
  ];
  for (const [search, campaign, medium] of carried) {
    const source = new URLSearchParams(search).get('utm_source');
    for (const href of run(search)) {
      const url = new URL(href);
      const ok = url.hostname === 'apps.apple.com'
        ? url.searchParams.get('ct') === campaign && url.searchParams.get('pt') !== null
        : url.searchParams.get('referrer') === `utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;
      if (!ok) fail(page[0], `a visit with "${search}" did not carry its campaign to ${href}`);
    }
  }
  for (const search of [
    '', '?utm_campaign=share-classic-ponytail', '?utm_source=app&utm_campaign=newsletter', '?utm_source=app&utm_campaign=share-%22%3E%3Cscript%3E',
    // A pin campaign without Pinterest as its source, or from the app; a
    // share campaign from Pinterest; and malformed pin campaigns: capitals,
    // a space, markup, one character too long, no id.
    '?utm_campaign=pin-school-ponytail', '?utm_source=app&utm_campaign=pin-school-ponytail',
    '?utm_source=Pinterest&utm_campaign=pin-school-ponytail', '?utm_source=pinterest&utm_campaign=share-classic-ponytail',
    '?utm_source=pinterest&utm_campaign=Pin-School', '?utm_source=pinterest&utm_campaign=pin-school%20ponytail',
    '?utm_source=pinterest&utm_campaign=pin-%22%3E%3Cscript%3E', `?utm_source=pinterest&utm_campaign=${longest}a`,
    '?utm_source=pinterest&utm_campaign=pin-',
    // A forward campaign from another source, a forward one character too
    // long, and malformed ones: capitals, markup, no id.
    '?utm_campaign=fwd-classic-ponytail', '?utm_source=app&utm_campaign=fwd-classic-ponytail', '?utm_source=pinterest&utm_campaign=fwd-classic-ponytail',
    `?utm_source=share&utm_campaign=${longestFwd}b`, '?utm_source=share&utm_campaign=Fwd-Classic',
    '?utm_source=share&utm_campaign=fwd-%22%3E%3Cscript%3E', '?utm_source=share&utm_campaign=fwd-',
    '?utm_source=share&utm_campaign=share-classic-ponytail',
  ]) {
    if (run(search).some((href, i) => href !== original[i])) fail(page[0], `store links changed for "${search}"`);
  }
}

// ─── "Send this to him" ──────────────────────────────────────────────────────

// Every style page, and only a style page, has one share button beside its
// store badges, hidden until the script runs, carrying the style's id, its
// name as the page's h1 shows it, and the share text. Then the script from
// a real page is run in a sandbox and the button tapped: it shares the
// page's own address with fwd-<pin campaign> when the visit has one that
// fits in 40 characters and fwd-<style id> otherwise, reads the address at
// the tap, and falls back to copying, then to showing the link.
const SHARE_LABEL = 'Send this to him';
// A free style's page has every step; a pack style's says where it is.
const shareText = (name, pack = false) => (pack
  ? `Here's ${name}, one of the styles in Dad Hair Hero's optional pack, written for dads. The app is free: no ads, no account.`
  : `Here's the ${name} step by step, written for dads. The app is free: no ads, no account.`);
async function checkShareButton() {
  const isStyle = (url) => /^(\/us)?\/styles\/[^/]+\/$/.test(url);
  for (const [url, doc] of pages) {
    const boxes = doc.querySelectorAll('[data-share-id]');
    if (!isStyle(url)) { if (boxes.length) fail(url, 'a share button on a page that is not a style'); continue; }
    if (boxes.length !== 1) { fail(url, `${boxes.length} share buttons; a style page has one`); continue; }
    const box = boxes[0];
    const name = doc.querySelector('h1')?.text.trim();
    if (box.getAttribute('data-share-title') !== name) fail(url, `share title "${box.getAttribute('data-share-title')}" is not the style's name as the page shows it`);
    const pack = content[isUS(url) ? 'us' : 'uk'].styles.find((st) => st.id === box.getAttribute('data-share-id'))?.pack;
    if (box.getAttribute('data-share-text') !== shareText(name, pack)) fail(url, `share text is "${box.getAttribute('data-share-text')}"`);
    if (!url.endsWith(`/${content[isUS(url) ? 'us' : 'uk'].styles.find((s) => s.id === box.getAttribute('data-share-id'))?.slug}/`)) fail(url, 'share button carries another style\'s id');
    if (!box.hasAttribute('hidden')) fail(url, 'the share button must be hidden until the script runs');
    if (!box.closest('.badges')) fail(url, 'the share button is not beside the store badges');
    const button = box.querySelector('button');
    if (!button || button.getAttribute('type') !== 'button' || button.text.trim() !== SHARE_LABEL) fail(url, `the share button must be a <button type="button"> saying "${SHARE_LABEL}"`);
    if (!box.querySelector('.share-status[role="status"]')) fail(url, 'the share button has no status for "Link copied"');
  }

  const marker = "var source = params.get('utm_source');";
  const tap = async (page, search, navigator, changeTo) => {
    const doc = pages.get(page);
    const real = doc.querySelector('[data-share-id]');
    const source = doc.querySelectorAll('script').map((s) => s.textContent).find((t) => t.includes(marker));
    let onClick = null;
    const status = { textContent: '' };
    const box = {
      hidden: true,
      getAttribute: (key) => real.getAttribute(key),
      querySelector: (selector) => (selector === 'button' ? { addEventListener: (_, fn) => { onClick = fn; } } : status),
    };
    const location = { search, origin: SITE, pathname: page };
    const canonical = { href: meta(doc, 'link[rel="canonical"]', 'href') };
    vm.runInNewContext(source, {
      location, navigator, URL, URLSearchParams, setTimeout: () => 0, clearTimeout: () => {},
      document: {
        querySelectorAll: () => [],
        querySelector: (selector) => (selector === '[data-share-id]' ? box : selector.startsWith('link') ? canonical : null),
      },
    });
    if (box.hidden) fail(page, 'the script did not show the share button');
    if (!onClick) { fail(page, 'the share button does nothing when tapped'); return {}; }
    if (changeTo !== undefined) location.search = changeTo;
    onClick();
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setImmediate(resolve));
    return { status: status.textContent };
  };
  const sharing = () => {
    const nav = { shared: null };
    nav.share = async (data) => { nav.shared = data; };
    return nav;
  };
  const campaignOf = (link) => new URL(link).searchParams.get('utm_campaign');
  const pin32 = 'pin-' + 'c'.repeat(32); // fwd-pin-… is exactly 40 characters
  const pin33 = 'pin-' + 'c'.repeat(33); // one too many
  const cases = [
    ['a forward from a pin', '?utm_source=pinterest&utm_campaign=pin-halloween-hair', 'fwd-pin-halloween-hair'],
    ['a forward from a step-strip pin', '?utm_source=pinterest&utm_medium=social&utm_campaign=pin-st-clip-back-baby-wisps', 'fwd-pin-st-clip-back-baby-wisps'],
    ['a forward from a handoff pin', '?utm_source=pinterest&utm_medium=social&utm_campaign=pin-ho-clip-back-baby-wisps', 'fwd-pin-ho-clip-back-baby-wisps'],
    ['a forward from a direct visit', '', 'fwd-classic-ponytail'],
    ['a forward from a pin at exactly 40 characters', `?utm_source=pinterest&utm_campaign=${pin32}`, `fwd-${pin32}`],
    ['a pin campaign that would pass 40 characters', `?utm_source=pinterest&utm_campaign=${pin33}`, 'fwd-classic-ponytail'],
    ['a malformed pin campaign', '?utm_source=pinterest&utm_campaign=Pin-Halloween', 'fwd-classic-ponytail'],
    ['a pin campaign with markup', '?utm_source=pinterest&utm_campaign=pin-%22%3E%3Cscript%3E', 'fwd-classic-ponytail'],
    ['a forward of a forward', '?utm_source=share&utm_campaign=fwd-classic-ponytail', 'fwd-classic-ponytail'],
    // A pin campaign counts only when it came from Pinterest, as for the badges.
    ['a pin campaign from another source', '?utm_source=app&utm_campaign=pin-halloween-hair', 'fwd-classic-ponytail'],
    ['a pin campaign with no source', '?utm_campaign=pin-halloween-hair', 'fwd-classic-ponytail'],
    ['a pin campaign from "Pinterest" with a capital', '?utm_source=Pinterest&utm_campaign=pin-halloween-hair', 'fwd-classic-ponytail'],
  ];
  for (const [what, search, expected] of cases) {
    const nav = sharing();
    await tap('/styles/classic-ponytail/', search, nav);
    const link = nav.shared?.url;
    if (!link) { fail('/styles/classic-ponytail/', `${what}: nothing was shared`); continue; }
    const url = new URL(link);
    if (url.origin + url.pathname !== `${SITE}/styles/classic-ponytail/`) fail('/styles/classic-ponytail/', `${what}: shared ${link}, not the page's own address`);
    if (url.searchParams.get('utm_source') !== 'share' || url.searchParams.get('utm_medium') !== 'web') fail('/styles/classic-ponytail/', `${what}: shared ${link} without utm_source=share&utm_medium=web`);
    if (campaignOf(link) !== expected) fail('/styles/classic-ponytail/', `${what}: shared campaign ${campaignOf(link)}, expected ${expected}`);
    if (campaignOf(link).length > 40) fail('/styles/classic-ponytail/', `${what}: campaign longer than 40 characters`);
  }
  // The address is read at the tap: a campaign that arrives after load counts.
  const late = sharing();
  await tap('/styles/classic-ponytail/', '', late, '?utm_source=pinterest&utm_campaign=pin-halloween-hair');
  if (campaignOf(late.shared?.url ?? 'https://x/') !== 'fwd-pin-halloween-hair') fail('/styles/classic-ponytail/', 'the share link was not read at the moment of the tap');
  // The US page shares its own address, with its own name for the style.
  const us = sharing();
  await tap('/us/styles/two-even-pigtails/', '', us);
  if (!us.shared?.url?.startsWith(`${SITE}/us/styles/two-even-pigtails/?`) || us.shared.title !== 'Two Even Pigtails' || us.shared.text !== shareText('Two Even Pigtails')) {
    fail('/us/styles/two-even-pigtails/', `shared ${JSON.stringify(us.shared)}`);
  }
  // No share sheet: copy, and say so. Share sheet closed: nothing else.
  // Share sheet refused: copy. Neither works: show the link.
  const copied = { value: null };
  const clipboard = { writeText: async (text) => { copied.value = text; } };
  let result = await tap('/styles/classic-ponytail/', '', { clipboard });
  if (result.status !== 'Link copied' || campaignOf(copied.value ?? 'https://x/') !== 'fwd-classic-ponytail') fail('/styles/classic-ponytail/', 'without a share sheet the link is not copied with "Link copied"');
  copied.value = null;
  result = await tap('/styles/classic-ponytail/', '', { clipboard, share: async () => { throw Object.assign(new Error('closed'), { name: 'AbortError' }); } });
  if (copied.value !== null || result.status !== '') fail('/styles/classic-ponytail/', 'closing the share sheet should do nothing more');
  result = await tap('/styles/classic-ponytail/', '', { clipboard, share: async () => { throw Object.assign(new Error('no'), { name: 'NotAllowedError' }); } });
  if (result.status !== 'Link copied') fail('/styles/classic-ponytail/', 'a refused share sheet should fall back to copying');
  result = await tap('/styles/classic-ponytail/', '', {});
  if (campaignOf(result.status?.startsWith('https://') ? result.status : 'https://x/') !== 'fwd-classic-ponytail') fail('/styles/classic-ponytail/', 'with no share sheet and no clipboard the link is not shown');
  result = await tap('/styles/classic-ponytail/', '', { clipboard: { writeText: async () => { throw new Error('denied'); } } });
  if (!result.status?.startsWith(`${SITE}/styles/classic-ponytail/?`)) fail('/styles/classic-ponytail/', 'a refused copy should show the link');
}

// ─── Seasonal guides ─────────────────────────────────────────────────────────

// The Halloween guide links to the Kit for anything to buy, and carries no
// prices, no shop links, and no HowTo or FAQ structured data. Its share
// image is at least 1200 pixels wide, as an Article image should be, and
// its sitemap entry has a lastmod.
function checkSeasonalGuides() {
  const sitemap = fs.existsSync(path.join(DIST, 'sitemap.xml')) ? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8') : '';
  for (const page of ['/halloween-hairstyles/', '/us/halloween-hairstyles/']) {
    const doc = pages.get(page);
    if (!doc) { fail(page, 'not built'); continue; }
    const main = doc.querySelector('main');
    const links = main.querySelectorAll('a[href]').map((a) => a.getAttribute('href'));
    if (links.some((href) => /amazon\.|amzn\.|[?&]tag=/.test(href))) fail(page, 'a seasonal guide must not carry shop links');
    if (!links.includes(page.startsWith('/us/') ? '/us/kit/' : '/kit/')) fail(page, 'a seasonal guide links to the Kit page');
    if (/[£$€]\s?\d/.test(main.text)) fail(page, 'a seasonal guide must not show prices');
    if (/"(HowTo|FAQPage)"/.test(doc.toString())) fail(page, 'a seasonal guide carries no HowTo or FAQ structured data');
    if (Number(meta(doc, 'meta[property="og:image:width"]')) < 1200) fail(page, 'the share image must be at least 1200 pixels wide');
    // Its ItemList is the free looks: each one a style page with every step.
    const list = doc.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.text)).find((d) => d['@type'] === 'ItemList');
    for (const item of list?.itemListElement ?? []) {
      const target = pages.get(item.url.slice(SITE.length));
      if (!target?.querySelector('.steps')) fail(page, `ItemList lists ${item.url}, which is not a free style with its steps`);
    }
    const entry = sitemap.match(new RegExp(`<loc>${SITE}${page}</loc>\\s*<lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`));
    if (!entry) fail('/sitemap.xml', `${page} has no lastmod`);
  }
}

// ─── Pin batches ─────────────────────────────────────────────────────────────

// Every row in pins/*.csv: an image on this site that is built, Pinterest's
// length limits, a link to an indexed page carrying a pin campaign the store
// badges accept, and no hashtags or prices.
const PIN_COLUMNS = ['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'];
function parseCsv(text) {
  const rows = [[]];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { rows.at(-1).push(field); field = ''; }
    else if (c === '\n') { rows.at(-1).push(field.replace(/\r$/, '')); field = ''; rows.push([]); }
    else field += c;
  }
  if (field || rows.at(-1).length) rows.at(-1).push(field);
  return rows.filter((row) => row.length > 1);
}
// Scheduled pins go out at 8pm Irish time on a Monday, Wednesday or Friday.
// Pinterest reads the Publish date as UTC, so this is 19:00 or 20:00 UTC
// depending on Irish Summer Time.
const dublin = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
// Pinterest's scheduler takes dates up to about 30 days ahead, so one file's
// dates must fit inside 30 days to be uploaded in one go.
const SCHEDULE_DAYS = 30;
// A PNG's size, from its header.
function pngSize(file) {
  const head = fs.readFileSync(file).subarray(0, 24);
  if (head.toString('latin1', 1, 4) !== 'PNG') return null;
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}
function checkPins(indexedPages) {
  const dir = path.join(ROOT, 'pins');
  if (!fs.existsSync(dir)) return;
  const images = new Map(); // Media URL → the file and row that use it
  const slots = new Map(); // Publish date → the file and row that use it
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.csv'))) {
    const where = `pins/${name}`;
    const [header, ...rows] = parseCsv(fs.readFileSync(path.join(dir, name), 'utf8'));
    if (header.join() !== PIN_COLUMNS.join()) { fail(where, `columns must be Pinterest's: ${PIN_COLUMNS.join(', ')}`); continue; }
    const dates = [];
    rows.forEach((cells, i) => {
      const row = Object.fromEntries(PIN_COLUMNS.map((key, j) => [key, cells[j] ?? '']));
      const at = `${where} row ${i + 1}`;
      // One pin per image across every file, so no upload repeats a pin
      // that's already out (the Halloween pin is only in batch-1.csv).
      if (images.has(row['Media URL'])) fail(at, `${row['Media URL']} is already pinned in ${images.get(row['Media URL'])}`);
      images.set(row['Media URL'], at);
      const date = row['Publish date'];
      if (!date) return;
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date)) { fail(at, `publish date "${date}" must be YYYY-MM-DDTHH:MM:SS (UTC)`); return; }
      const when = new Date(`${date}Z`);
      const local = dublin.format(when);
      if (!/^(Mon|Wed|Fri) 20:00$/.test(local)) fail(at, `publishes ${local} Irish time, not 8pm on a Monday, Wednesday or Friday`);
      if (slots.has(date)) fail(at, `publishes at the same time as ${slots.get(date)}`);
      slots.set(date, at);
      if (dates.length && when <= dates.at(-1)) fail(at, 'publish dates must run in order');
      dates.push(when);
    });
    if (dates.length > 1 && (dates.at(-1) - dates[0]) / 864e5 > SCHEDULE_DAYS) {
      fail(where, `its dates span more than ${SCHEDULE_DAYS} days, more than Pinterest schedules in one upload`);
    }
    rows.forEach((cells, i) => {
      const row = Object.fromEntries(PIN_COLUMNS.map((key, j) => [key, cells[j] ?? '']));
      const at = `${where} row ${i + 1}`;
      if (!row['Media URL'].startsWith(`${SITE}/pins/`) || !built.has(row['Media URL'].slice(SITE.length))) fail(at, `image ${row['Media URL']} is not in public/pins/`);
      if (!row.Title || row.Title.length >= 100) fail(at, 'title must be under 100 characters');
      if (!row.Description || row.Description.length >= 500) fail(at, 'description must be under 500 characters');
      if (!row['Pinterest board']) fail(at, 'no board');
      if (/#\w|[£$€]\s?\d/.test(`${row.Title} ${row.Description}`)) fail(at, 'no hashtags or prices');
      let link;
      try { link = new URL(row.Link); } catch { fail(at, `link "${row.Link}" is not an address`); return; }
      if (link.origin !== SITE || !indexedPages.includes(link.pathname)) fail(at, `link ${row.Link} is not an indexed page`);
      if (link.searchParams.get('utm_source') !== 'pinterest' || !/^pin-[a-z0-9-]{1,36}$/.test(link.searchParams.get('utm_campaign') ?? '')) {
        fail(at, 'link must carry utm_source=pinterest and a pin-<id> campaign');
      }
      // Each kind of pin has its own prefix, so the stores count them apart:
      // pin-st- for a step strip (…-step-by-step.png), pin-ho- for a handoff
      // pin (send-him-….png), plain pin- for everything else.
      const image = row['Media URL'].split('/').pop();
      const kind = /-step-by-step\.png$/.test(image) ? 'st' : /^send-him-/.test(image) ? 'ho' : null;
      const prefix = (link.searchParams.get('utm_campaign') ?? '').match(/^pin-(st|ho)-/)?.[1] ?? null;
      if (kind !== prefix) fail(at, `${image} needs a ${kind ? `pin-${kind}-` : 'pin-'} campaign, not ${link.searchParams.get('utm_campaign')}`);
    });
  }
  // Every pin image is 1000×1500 and in a batch: nothing sits in
  // public/pins/ unscheduled.
  for (const file of fs.readdirSync(path.join(ROOT, 'public', 'pins'))) {
    const where = `public/pins/${file}`;
    if (!images.has(`${SITE}/pins/${file}`)) fail(where, 'is in no pins/*.csv');
    const size = pngSize(path.join(ROOT, 'public', 'pins', file));
    if (!size || size.width !== 1000 || size.height !== 1500) fail(where, 'must be a 1000×1500 PNG');
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
  checkPlaceholders(page, doc);
}
// Every video in the manifest is on its style's page. The build once read
// the manifest from a path that didn't exist and every page quietly lost
// its video, with nothing failing.
function checkVideosEmbedded() {
  const manifestPath = path.join(DIST, 'videos', 'videos.json');
  if (!fs.existsSync(manifestPath)) {
    warnings.push('/videos/: no videos rendered (npm run videos)');
    return;
  }
  const { videos } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const video of videos) {
    const page = `${video.locale === 'en-GB' ? '' : '/us'}/styles/${video.slug}/`;
    const file = path.join(DIST, page, 'index.html');
    if (!fs.existsSync(file)) fail(page, `the page for the ${video.locale} video is not built`);
    else if (!fs.readFileSync(file, 'utf8').includes(`src="${video.src}"`)) fail(page, `the ${video.locale} video ${video.src} is in the manifest but not on the page`);
  }
}

checkPackPreviews();
checkSitemap(indexedPages);
checkOrphans(indexedPages);
checkVideosEmbedded();
checkShareCampaign();
await checkShareButton();
checkSeasonalGuides();
checkPins(indexedPages);
if (!pages.has('/404.html')) fail('/404.html', 'not built');
if (!built.has('/CNAME')) fail('/CNAME', 'not in the build; the custom domain depends on it');

if (failures.length) {
  console.error(`check-site: ${failures.length} problem${failures.length === 1 ? '' : 's'} in ${pages.size} pages\n`);
  for (const line of failures) console.error('  ' + line);
  process.exit(1);
}
for (const line of warnings) console.log('  warning: ' + line);
console.log(`check-site: ${pages.size} pages, ${indexedPages.length} indexed. Links, alt text, titles, hreflang, structured data and orphans all pass.`);
