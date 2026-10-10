// Everything the pages share: the two languages, the address of every page,
// the hreflang pairs, the store links, the hubs, and the few lookups and
// sentences the templates build from the exported content.
//
// The content itself is src/data/en-GB.json and en-US.json, written by
// scripts/export-site-data.mjs in the app's repository, along with the
// app's glossary in src/data/glossary.json. Nothing here edits them; to
// change a style's wording, change it in the app and export again.

import fs from 'node:fs';
import { join as joinPath } from 'node:path';
import gb from '../data/en-GB.json';
import us from '../data/en-US.json';
import glossary from '../data/glossary.json';

export const SITE = 'https://dadhairhero.com';
export const APP_STORE_ID = '6810375103';
export const PLAY_PACKAGE = 'com.dadhairhero.app';
export const EMAIL = 'hello@dadhairhero.com';

// The person behind the app, for the About page and the author line.
export const AUTHOR = { name: 'Martin', role: 'The dad behind Dad Hair Hero' };

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
export const otherLocale = (locale) => (locale === US ? UK : US);

// ─── UK to US English, with the app's glossary ───────────────────────────────
//
// The same rule as the app's toUSEnglish(): one alternation, longest entry
// first, whole words only, the matched text's capitalisation carried onto
// the replacement. The site's own sentences are written in UK English and
// pass through t() for the US pages; content from the app arrives already
// converted by the app.

const ENTRIES = { ...glossary.words, ...glossary.phrases };
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERN = new RegExp(
  '\\b(' +
    Object.keys(ENTRIES)
      .sort((a, b) => b.length - a.length)
      .map((k) => escapeRegExp(k).replace(/ /g, '\\s+'))
      .join('|') +
    ')\\b',
  'gi',
);

const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);

function matchCase(original, replacement) {
  const letters = original.replace(/[^A-Za-z]/g, '');
  if (letters.length > 1 && letters === letters.toUpperCase()) return replacement.toUpperCase();
  const words = original.split(/\s+/);
  if (words.length > 1 && words.every((w) => /^[A-Z]/.test(w))) return replacement.split(' ').map(capitalise).join(' ');
  if (/^[A-Z]/.test(original)) return capitalise(replacement);
  return replacement;
}

export function toUS(text) {
  return text.replace(PATTERN, (match) => {
    const replacement = ENTRIES[match.toLowerCase().replace(/\s+/g, ' ')];
    return replacement === undefined ? match : matchCase(match, replacement);
  });
}

// A sentence of the site's own, in this language.
export const t = (locale, text) => (locale === US ? toUS(text) : text);

// ─── Lookups ─────────────────────────────────────────────────────────────────

export const styleById = (locale, id) => locale.data.styles.find((s) => s.id === id);
export const techniqueById = (locale, id) => locale.data.techniques.find((t) => t.id === id);
export const kitItems = (locale) => locale.data.kit.sections.flatMap((s) => s.items);
export const kitItemById = (locale, id) => kitItems(locale).find((i) => i.id === id);
export const fixEntryById = (locale, id) => locale.data.fixIt.entries.find((e) => e.id === id);
export const fixNodeById = (locale, id) => locale.data.fixIt.nodes.find((n) => n.id === id);
export const offersCurly = (style) => style.hairTypes.includes('curly') || style.hairTypes.includes('coily');

// ─── Hubs ────────────────────────────────────────────────────────────────────
//
// A hub is a list of styles cut one way people search, from the tags each
// style carries in the app (its occasions and age bands). The sentences are
// the hub's own; the list is never.

const sortByTime = (styles) => [...styles].sort((a, b) => a.targetMinutes - b.targetMinutes);

export const HUBS = [
  {
    kind: 'school',
    segment: 'school-hairstyles',
    name: 'School hairstyles',
    h1: 'School hairstyles for girls',
    title: 'School hairstyles for girls, timed for mornings | Dad Hair Hero',
    description: 'Hairstyles for school that a dad can do before the bus: each one says how long it takes, and the free ones are here step by step with a photo for every step.',
    lede: 'The styles that get through a school day, quickest first. Each one says how long it takes.',
    intro: 'A school morning has a clock on it, so every style here is tagged for school in the app and listed by time. The six free ones are on this site in full. The rest are in Beyond the Ponytail, an optional one-time pack in the app, and their pages show what you would need and what the steps cover.',
    select: (styles) => sortByTime(styles.filter((s) => s.occasions.includes('school'))),
    ctaHeading: 'Pick by the clock, in the app',
    cta: 'Tell Dad Hair Hero how many minutes you have and it shows the styles that fit, with her hair type taken into account. Free, no account, no tracking.',
  },
  {
    kind: 'toddler',
    segment: 'toddler-hairstyles',
    name: 'Toddler hairstyles',
    h1: 'Toddler hairstyles for dads',
    title: 'Toddler hairstyles: quick, gentle, step by step | Dad Hair Hero',
    description: 'Hairstyles for toddlers with short, fine hair and no patience: clip-backs, bunches and ponytails a dad can do, and what to do when she won\'t sit still.',
    lede: 'Short hair, fine hair, and a child who will give you about two minutes. These are written for her.',
    intro: 'Each style in the app is tagged with the ages it was written for. These are the ones tagged for babies and toddlers: short and fine hair, nothing that needs length, and nothing that takes long. Keeping her still is its own technique, and it is linked below.',
    select: (styles) => sortByTime(styles.filter((s) => s.ageBands.includes('baby') || s.ageBands.includes('toddler'))),
    techniques: ['keeping-her-still', 'detangling', 'choosing-elastics'],
    ctaHeading: 'Set her age once, in the app',
    cta: 'Tell Dad Hair Hero her age and hair type and it puts the styles written for her first. Free, no account, no tracking.',
  },
  {
    kind: 'sports',
    segment: 'sports-hairstyles',
    name: 'Sports hairstyles',
    h1: 'Hairstyles for sport and active days',
    title: 'Sports hairstyles for girls that stay put | Dad Hair Hero',
    description: 'Hairstyles for sport, swimming and PE that hold: ponytails and plaits tagged for active days in the app, with the fix for a bun that collapses mid-game.',
    lede: 'Hair that has to survive a match, a swimming lesson or a whole afternoon outside.',
    intro: 'An active day asks two things of a style: it holds, and it does not hurt. The styles here are tagged for sport or swimming in the app. The techniques that matter most for them are holding tension and choosing elastics, both linked below, and Fix It has a page for a style that falls out and one for a bun that collapses mid-game.',
    select: (styles) => sortByTime(styles.filter((s) => s.occasions.includes('sport') || s.occasions.includes('swimming'))),
    techniques: ['holding-tension', 'choosing-elastics'],
    fixes: ['entry-falls-out', 'entry-sports-bun'],
    ctaHeading: 'The ones that hold, in the app',
    cta: 'Dad Hair Hero shows each step with what to check before you move on, so the elastic is right the first time. Free, no account, no tracking.',
  },
  {
    kind: 'party',
    segment: 'party-hairstyles',
    name: 'Party hairstyles',
    h1: 'Hairstyles for parties, picture day and dance',
    title: 'Party hairstyles for girls a dad can do | Dad Hair Hero',
    description: 'Hairstyles for a party, picture day or dance class: bunches, half-up styles, plaits and buns tagged for occasions in the app, the free ones step by step.',
    lede: 'For the days a photo will be taken. Neat, a little more than everyday, and still something you can do.',
    intro: 'These are the styles tagged for parties or dance in the app. For a school picture day the same list applies: something tidy from the front, done the night before if it will last, or that morning if it will not. The free ones are on this site in full; the rest are in Beyond the Ponytail, an optional one-time pack in the app.',
    select: (styles) => sortByTime(styles.filter((s) => s.occasions.includes('party') || s.occasions.includes('dance'))),
    techniques: ['making-a-part', 'holding-tension'],
    fixes: ['entry-looks-wrong'],
    ctaHeading: 'Practise it first, in the app',
    cta: 'Dad Hair Hero keeps a diary of what you have done and how it went, so the party style is one you have already tried. Free, no account, no tracking.',
  },
];

export const hubByKind = (kind) => HUBS.find((hub) => hub.kind === kind);

// The hubs a style appears on, for its "Good for" line.
export function hubsForStyle(locale, style) {
  const hubs = HUBS.filter((hub) => hub.select(locale.data.styles).some((s) => s.id === style.id))
    .map((hub) => ({ name: t(locale, hub.name), path: path(locale, hub.kind) }));
  if (!style.pack) hubs.unshift({ name: t(locale, 'Easy hairstyles'), path: path(locale, 'easy') });
  if (offersCurly(style)) hubs.push({ name: t(locale, 'Curly and coily hair'), path: path(locale, 'curly') });
  return hubs;
}

// ─── Addresses ───────────────────────────────────────────────────────────────

const FIXED = {
  home: '/',
  styles: '/styles/',
  techniques: '/techniques/',
  kit: '/kit/',
  curly: '/curly-hair/',
  easy: '/easy-hairstyles/',
  fixIt: '/fix-it/',
  about: '/about/',
  ...Object.fromEntries(HUBS.map((hub) => [hub.kind, `/${hub.segment}/`])),
};

// The path of a page in one language. `id` is the app's id, which is the
// same in both languages; the address uses that language's slug.
export function path(locale, kind, id) {
  if (kind === 'style') return `${locale.prefix}/styles/${styleById(locale, id).slug}/`;
  if (kind === 'technique') return `${locale.prefix}/techniques/${techniqueById(locale, id).slug}/`;
  if (kind === 'fix') return `${locale.prefix}/fix-it/${fixEntryById(locale, id).slug}/`;
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
    ...UK.data.fixIt.entries.map((e) => ({ kind: 'fix', id: e.id })),
  ];
}

// ─── Store links ─────────────────────────────────────────────────────────────

// A short name for the page a store link is on, so the store consoles can
// show which pages send installs. It travels in the link only: the site
// itself records nothing. Apple allows 40 characters.
export function campaign(locale, kind, id) {
  const short = { style: 's', technique: 't', fix: 'f' }[kind];
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

export const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1);
export const upper = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// A line of content with its full stop, whether or not it came with one.
export const sentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);

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
  return upper(text);
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

// ─── Related content ─────────────────────────────────────────────────────────

// Two or three styles to read next: the one this style leans on, the ones
// that lean on it (from the app's teaching order), then anything sharing an
// occasion, free styles first.
export function relatedStyles(locale, style, count = 3) {
  const all = locale.data.styles;
  const picked = [];
  const add = (id) => {
    const s = id && all.find((x) => x.id === id);
    if (s && s.id !== style.id && !picked.includes(s)) picked.push(s);
  };
  add(style.buildsOn);
  style.leadsTo.forEach(add);
  const shares = all
    .filter((s) => s.occasions.some((o) => style.occasions.includes(o)))
    .sort((a, b) => Number(a.pack) - Number(b.pack) || a.targetMinutes - b.targetMinutes);
  shares.forEach((s) => add(s.id));
  return picked.slice(0, count);
}

// The techniques a free style's steps use, in the order they first appear.
export function techniquesUsed(locale, style) {
  const ids = [];
  for (const step of style.steps) {
    for (const id of [step.techniqueId, step.curly?.techniqueId]) {
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids.map((id) => techniqueById(locale, id)).filter(Boolean);
}

// ─── Fix It ──────────────────────────────────────────────────────────────────

// The whole branch under an entry, as a tree of questions and outcomes.
export function fixTree(locale, entry) {
  const seen = new Set();
  const walk = (id) => {
    const node = fixNodeById(locale, id);
    if (!node) throw new Error(`Fix It: no node "${id}"`);
    if (seen.has(id)) return { ...node, repeat: true };
    seen.add(id);
    if (node.type === 'outcome') return node;
    return { ...node, answers: node.answers.map((a) => ({ ...a, node: walk(a.next) })) };
  };
  return walk(entry.startNodeId);
}

export function fixOutcomes(locale, entry) {
  const out = [];
  const walk = (node) => {
    if (node.repeat) return;
    if (node.type === 'outcome') out.push(node);
    else node.answers.forEach((a) => walk(a.node));
  };
  walk(fixTree(locale, entry));
  return out;
}

// Where an outcome's link goes on this site. The app's "manual-section" is
// a technique; "equipment" is a Kit item.
export function fixLinkTarget(locale, link) {
  if (!link) return null;
  if (link.type === 'style' && styleById(locale, link.id)) return { href: path(locale, 'style', link.id), label: link.label };
  if (link.type === 'manual-section' && techniqueById(locale, link.id)) return { href: path(locale, 'technique', link.id), label: link.label };
  if (link.type === 'equipment' && kitItemById(locale, link.id)) return { href: path(locale, 'kitItem', link.id), label: link.label };
  if (link.type === 'troubleshooter-entry' && fixEntryById(locale, link.id)) return { href: path(locale, 'fix', link.id), label: link.label };
  throw new Error(`Fix It: link to unknown ${link.type} "${link.id}"`);
}

// The styles whose "If it goes wrong" points at this entry.
export const stylesForFix = (locale, entryId) => locale.data.styles.filter((s) => s.relatedFixIds.includes(entryId));

// ─── FAQ ─────────────────────────────────────────────────────────────────────
//
// Three to five questions a reader would ask, answered from the style's or
// technique's own data: nothing is written here that the content does not
// say. The same list feeds the FAQPage structured data.

export function styleFaq(locale, style) {
  const faq = [];
  const name = style.name;
  const kit = style.equipmentIds.map((id) => kitItemById(locale, id)).filter(Boolean).map((i) => lower(i.name));
  faq.push({
    q: `How long does ${name} take?`,
    a: `About ${minutes(style.targetMinutes)} once you know it, in ${style.steps.length} steps. The first few times take longer; the steps tell you what to check before you move on, so you are never guessing.`,
  });
  faq.push({
    q: style.curlyOnly
      ? `Does ${name} work on straight hair?`
      : `Does ${name} work on curly or coily hair?`,
    a: style.curlyOnly
      ? `${name} is written for curly and coily hair, and the app only offers it for those. The steps here are the curly and coily method.`
      : offersCurly(style)
        ? `Yes. ${name} suits ${lower(hairTypes(locale, style))}. ${style.steps.some((s) => s.curly) ? 'Where the method changes for curly and coily hair, the step above gives that version: detangle it damp, work in sections and keep the hairline soft.' : 'The method is the same for every hair type; detangle curly hair damp rather than dry.'} In the app, choosing Curly or Coily shows only the steps for her hair.`
        : `${name} is written for ${lower(hairTypes(locale, style))}. For curly and coily hair the app offers its counterpart instead.`,
  });
  faq.push({
    q: `What do I need for ${name}?`,
    a: `${upper(list(kit))}.${style.curlyEquipmentIds.length > style.equipmentIds.length ? ` For curly and coily hair, add ${list(style.curlyEquipmentIds.filter((id) => !style.equipmentIds.includes(id)).map((id) => lower(kitItemById(locale, id)?.name ?? id)))}.` : ''} Each one is on the Kit page with what it is for and what to avoid.`,
  });
  if (style.commonFailure && style.theFix) {
    faq.push({
      q: `What usually goes wrong with ${name}?`,
      a: `${sentence(style.commonFailure)} ${sentence(style.theFix)}`,
    });
  }
  const falls = style.relatedFixIds.includes('entry-falls-out') && fixEntryById(locale, 'entry-falls-out');
  if (falls) {
    const first = fixOutcomes(locale, falls)[0];
    faq.push({
      q: `What if ${name} won't stay in?`,
      a: `${sentence(first.body)} Fix It has the full set of checks for a style that falls out.`,
    });
  } else {
    faq.push({
      q: `What age is ${name} for?`,
      a: `${ages(style)}, and ${lower(hairLength(style))}. In the app her age and hair length put the styles written for her first, and never hide one.`,
    });
  }
  return faq.slice(0, 5);
}

export function techniqueFaq(locale, technique) {
  const used = technique.usedInStyleIds.map((id) => styleById(locale, id)).filter(Boolean);
  const faq = [
    { q: `Why does ${lower(technique.title)} matter?`, a: technique.whyItMatters },
    { q: `How do I know I'm doing it right?`, a: technique.howToCheck.map(sentence).join(' ') },
    { q: `What is the most common mistake?`, a: sentence(technique.commonMistakes[0]) },
  ];
  if (used.length) {
    faq.push({
      q: `Which styles use ${lower(technique.title)}?`,
      a: technique.usedInAllStyles
        ? 'Every style in the app. It is the one technique that applies to all of them.'
        : `${list(used.slice(0, 5).map((s) => s.name))}${used.length > 5 ? ` and ${used.length - 5} more` : ''}. Each step that uses it links back here.`,
    });
  }
  if (technique.impliesHairType) {
    faq.push({
      q: `Is this only for curly and coily hair?`,
      a: `It is written for curly and coily hair, where it matters most. Choosing Curly or Coily in the app shows this method inside each style's steps.`,
    });
  }
  return faq.slice(0, 5);
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

export function faqPage(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'Dad Hair Hero',
  url: `${SITE}/`,
  logo: `${SITE}/assets/icon-512.png`,
  email: EMAIL,
  sameAs: [
    `https://apps.apple.com/app/id${APP_STORE_ID}`,
    `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`,
  ],
};

export const PERSON = {
  '@type': 'Person',
  '@id': `${SITE}/about/#person`,
  name: AUTHOR.name,
  description: AUTHOR.role,
  url: `${SITE}/about/`,
  worksFor: { '@id': `${SITE}/#organization` },
};

// The author and publisher a guide's HowTo carries.
export const AUTHORSHIP = {
  author: { '@type': 'Person', name: AUTHOR.name, url: `${SITE}/about/` },
  publisher: { '@type': 'Organization', name: 'Dad Hair Hero', url: `${SITE}/` },
};

// ─── Videos ──────────────────────────────────────────────────────────────────
//
// scripts/render-videos.mjs writes one vertical video per free style, from
// its step photos, to public/videos/. videos.json beside them records what
// was made, and a page only embeds a video that is listed there.

let videoManifest;
export function videoFor(locale, style) {
  if (videoManifest === undefined) {
    try {
      // Read at build time, not imported: the manifest may not exist yet.
      // The path is from the project root, not from this file: the build
      // bundles this module into a chunk elsewhere, where a relative path
      // found nothing and every page quietly lost its video.
      videoManifest = JSON.parse(fs.readFileSync(joinPath(process.cwd(), 'public', 'videos', 'videos.json'), 'utf8'));
    } catch {
      videoManifest = null;
    }
  }
  return videoManifest?.videos.find((v) => v.styleId === style.id && v.locale === locale.code) ?? null;
}
