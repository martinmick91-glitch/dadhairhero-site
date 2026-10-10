// Everything the pages share: the two languages, the address of every page,
// the hreflang pairs, the store links and a few data lookups.
//
// The content itself is src/data/en-GB.json and en-US.json, written by
// scripts/export-site-data.mjs in the app's repository. Nothing here edits
// it; to change a style's wording, change it in the app and export again.

import gb from '../data/en-GB.json';
import us from '../data/en-US.json';

export const SITE = 'https://dadhairhero.com';
export const APP_STORE_ID = '6810375103';
export const PLAY_PACKAGE = 'com.dadhairhero.app';
export const EMAIL = 'hello@dadhairhero.com';

// UK English is the site's root; US English lives under /us/ and is also
// what a reader in Canada is sent to, as in the app.
export const LOCALES = [
  { code: 'en-GB', prefix: '', og: 'en_GB', label: 'UK English', currency: 'GBP', hreflang: ['en-gb'], data: gb },
  { code: 'en-US', prefix: '/us', og: 'en_US', label: 'US English', currency: 'USD', hreflang: ['en-us', 'en-ca'], data: us },
];

export const UK = LOCALES[0];
export const US = LOCALES[1];

// The [...lang] folder in src/pages: nothing for UK English, "us" for US.
export const localeFromParam = (lang) => (lang === 'us' ? US : UK);
export const langParam = (locale) => (locale === US ? 'us' : undefined);

// A sentence that differs between the two: w(locale, 'plaits', 'braids').
export const w = (locale, uk, usText) => (locale === US ? usText : uk);

// ─── Addresses ───────────────────────────────────────────────────────────────

const FIXED = {
  home: '/',
  styles: '/styles/',
  techniques: '/techniques/',
  kit: '/kit/',
  curly: '/curly-hair/',
  easy: '/easy-hairstyles/',
};

export const styleById = (locale, id) => locale.data.styles.find((s) => s.id === id);
export const techniqueById = (locale, id) => locale.data.techniques.find((t) => t.id === id);
export const kitItems = (locale) => locale.data.kit.sections.flatMap((s) => s.items);
export const kitItemById = (locale, id) => kitItems(locale).find((i) => i.id === id);

// The path of a page in one language. `id` is the app's id, which is the
// same in both languages; the address uses that language's slug.
export function path(locale, kind, id) {
  if (kind === 'style') return `${locale.prefix}/styles/${styleById(locale, id).slug}/`;
  if (kind === 'technique') return `${locale.prefix}/techniques/${techniqueById(locale, id).slug}/`;
  if (kind === 'kitItem') return `${locale.prefix}/kit/#${id}`;
  if (!(kind in FIXED)) throw new Error(`No such page kind: ${kind}`);
  return `${locale.prefix}${FIXED[kind]}`;
}

export const absolute = (pathname) => `${SITE}${pathname}`;

// hreflang for a page that exists in both languages. Every page lists
// itself and its twin, and UK English is the default for everyone else.
export function alternates(kind, id) {
  return [
    ...LOCALES.flatMap((locale) =>
      locale.hreflang.map((hreflang) => ({ hreflang, href: absolute(path(locale, kind, id)) })),
    ),
    { hreflang: 'x-default', href: absolute(path(UK, kind, id)) },
  ];
}

// Every page that exists in both languages, for the sitemap.
export function pairedRoutes() {
  return [
    ...Object.keys(FIXED).map((kind) => ({ kind })),
    ...UK.data.styles.map((s) => ({ kind: 'style', id: s.id })),
    ...UK.data.techniques.map((t) => ({ kind: 'technique', id: t.id })),
  ];
}

// ─── Store links ─────────────────────────────────────────────────────────────

// A short name for the page a store link is on, so the store consoles can
// show which pages send installs. It travels in the link only: the site
// itself records nothing. Apple allows 40 characters.
export function campaign(locale, kind, id) {
  const short = { style: 's', technique: 't' }[kind];
  const name = short ? `${short}-${id}` : kind;
  return `${locale === US ? 'us-' : ''}${name}`.slice(0, 40);
}

export function appStoreUrl(campaignName) {
  return `https://apps.apple.com/app/id${APP_STORE_ID}?ct=${encodeURIComponent(campaignName)}&mt=8`;
}

export function playUrl(campaignName) {
  const referrer = `utm_source=dadhairhero.com&utm_medium=website&utm_campaign=${campaignName}`;
  return `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}&referrer=${encodeURIComponent(referrer)}`;
}

// ─── Words ───────────────────────────────────────────────────────────────────

export const minutes = (n) => (n === 1 ? '1 minute' : `${n} minutes`);

export function list(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// A line of content with its full stop, whether or not it came with one.
export const sentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);

export const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1);

const AGE_ORDER = ['baby', 'toddler', 'young-child', 'older-child', 'pre-teen'];
const AGE_WORDS = {
  baby: 'babies',
  toddler: 'toddlers',
  'young-child': 'young children',
  'older-child': 'older children',
  'pre-teen': 'pre-teens',
};

// "Toddlers to pre-teens", from the age bands the style was written for.
export function ages(style) {
  const bands = AGE_ORDER.filter((band) => style.ageBands.includes(band));
  const first = AGE_WORDS[bands[0]];
  const last = AGE_WORDS[bands[bands.length - 1]];
  const text = bands.length === 1 ? first : bands.length === 2 ? `${first} and ${last}` : `${first} to ${last}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function hairTypes(locale, style) {
  if (style.curlyOnly) return 'Curly and coily';
  if (style.hairTypes.length === 5) return 'Every hair type';
  const text = list(style.hairTypes.map((type) => locale.data.labels.hairTypes[type]));
  return text.charAt(0) + text.slice(1).toLowerCase();
}

const LENGTH_WORDS = {
  short: 'Any length, short hair included',
  medium: 'Hair that touches her shoulders, or longer',
  long: 'Long hair',
};
export const hairLength = (style) => LENGTH_WORDS[style.minLength];

const DIFFICULTY_WORDS = { easy: 'Easy', normal: 'Takes some practice', difficult: 'Takes real practice' };
export const difficulty = (style) => DIFFICULTY_WORDS[style.difficulty];

export const offersCurly = (style) => style.hairTypes.includes('curly') || style.hairTypes.includes('coily');

// The first title that fits a search result, so a long name loses its tail
// rather than being cut off by Google.
export function pageTitle(...candidates) {
  return candidates.find((title) => title.length <= 60) ?? candidates[candidates.length - 1];
}

// A description of at most 158 characters, never cut mid-sentence: whole
// sentences are added while they fit.
export function pageDescription(...sentences) {
  let out = '';
  for (const sentence of sentences.filter(Boolean)) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > 158) break;
    out = next;
  }
  return out || sentences[0];
}

// ─── Structured data ─────────────────────────────────────────────────────────

export function breadcrumbs(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

export const imageUrl = (photo) => (photo ? absolute(`${photo.base}-${photo.widths[0]}.webp`) : undefined);

export function itemList(name, entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: entries.map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: entry.name,
      url: absolute(entry.path),
    })),
  };
}
