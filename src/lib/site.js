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

// The app's Instagram account (Martin, 2026-11-10). A plain link only: no
// embed, widget, pixel or script from Instagram anywhere on the site.
export const INSTAGRAM = { url: 'https://www.instagram.com/dadhairhero/', handle: '@dadhairhero', label: 'Dad Hair Hero on Instagram' };

// How the site says what the app costs: free to download, with the optional
// one-time pack. Never just "free" for the app as a whole.
export const FREE_TO_DOWNLOAD = 'Free to download, with an optional one-time pack.';

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

// A sentence whose US wording the glossary doesn't cover (recognise and
// recognize, labelled and labeled, nits and lice): both written out.
export const say = (locale, uk, us) => (locale === US ? us : t(locale, uk));

// ─── Counts ──────────────────────────────────────────────────────────────────
//
// How many styles, pack styles and Kit things there are, counted from the
// export and written in words, so a sentence can't fall behind the app
// ("all eighteen styles" outlived 1.3 on six pages). Both languages count
// the same things.

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty',
];
export function inWords(n) {
  if (!NUMBER_WORDS[n]) throw new Error(`inWords: no word for ${n}`);
  return NUMBER_WORDS[n];
}
export const capitalised = (text) => text[0].toUpperCase() + text.slice(1);

export const COUNTS = {
  styles: inWords(gb.styles.length),
  free: inWords(gb.styles.filter((s) => !s.pack).length),
  pack: inWords(gb.styles.filter((s) => s.pack).length),
  kit: inWords(gb.kit.sections.reduce((n, section) => n + section.items.length, 0)),
  techniques: inWords(gb.techniques.length),
  // Care routines (1.4.0): free, and never counted as styles.
  guides: inWords(gb.guides.length),
};

// A sentence that names styles one by one can't be counted, so its page
// lists the ids it names and the build stops when they are no longer the
// export's: a style added to the app, or one moved in or out of the pack.
export function assertNames(page, ids, styles) {
  const named = [...ids].sort().join();
  const actual = styles.map((s) => s.id).sort().join();
  if (named !== actual) throw new Error(`${page}: the styles named in its text (${named}) are not the export's (${actual})`);
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

export const styleById = (locale, id) => locale.data.styles.find((s) => s.id === id);
export const techniqueById = (locale, id) => locale.data.techniques.find((t) => t.id === id);
export const kitItems = (locale) => locale.data.kit.sections.flatMap((s) => s.items);
export const kitItemById = (locale, id) => kitItems(locale).find((i) => i.id === id);
// A care routine (1.4.0). One the export marks `hold` is waiting for an
// expert's check and gets no page.
export const guideById = (locale, id) => locale.data.guides.find((g) => g.id === id);
export const publishedGuides = (locale) => locale.data.guides.filter((g) => !g.hold);
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
    description: 'Hairstyles for school that a dad can do before the bus: each one says how long it takes, and the free ones are here step by step with a picture for every step.',
    lede: 'The styles that get through a school day, quickest first. Each one says how long it takes.',
    // The app has no school tag (1.4.0): an ordinary school day is Everyday,
    // the day Today starts on each morning (src/data/occasions.ts).
    intro: 'A school morning has a clock on it. In the app, an ordinary school day is an Everyday day, which is where Today starts each morning, so these are the styles the app lists for Everyday, quickest first. The free ones are on this site in full. The rest are in Beyond the Ponytail, an optional one-time pack in the app, and their pages show what you would need and what the steps cover.',
    select: (styles) => sortByTime(styles.filter((s) => s.occasions.includes('everyday'))),
    ctaHeading: 'Pick by the clock, in the app',
    cta: 'Tell Dad Hair Hero how many minutes you have and what the day is, and it shows the styles that fit, with her hair type taken into account. Free to download, with an optional one-time pack. No account, no tracking.',
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
    cta: 'Tell Dad Hair Hero her age and hair type and it puts the styles written for her first. Free to download, with an optional one-time pack. No account, no tracking.',
  },
  {
    kind: 'sports',
    segment: 'sports-hairstyles',
    name: 'Sports hairstyles',
    h1: 'Hairstyles for sport and active days',
    title: 'Sports hairstyles for girls that stay put | Dad Hair Hero',
    description: 'Hairstyles for sport, swimming and PE that hold: the styles the app lists for sport, free swim day and sport day routines, and the fix for a bun that collapses.',
    lede: 'Hair that has to survive a match, a swimming lesson or a whole afternoon outside.',
    intro: 'An active day asks two things of a style: it holds, and it does not hurt. The styles here are the ones the app lists for Sport. For swimming lessons and sport at school, the app also has two free care routines, linked below. The techniques that matter most are holding tension and choosing elastics, and Fix It has a page for a style that falls out and one for a bun that collapses mid-game.',
    select: (styles) => sortByTime(styles.filter((s) => s.occasions.includes('sport'))),
    // The care routines for these days, from the export.
    guides: ['swim-day', 'sport-day'],
    techniques: ['holding-tension', 'choosing-elastics'],
    fixes: ['entry-falls-out', 'entry-sports-bun'],
    ctaHeading: 'The ones that hold, in the app',
    cta: 'Dad Hair Hero shows each step with what to check before you move on, so the elastic is right the first time. Free to download, with an optional one-time pack. No account, no tracking.',
  },
  {
    kind: 'party',
    segment: 'party-hairstyles',
    name: 'Party hairstyles',
    h1: 'Hairstyles for parties, picture day and dance',
    title: 'Party hairstyles for girls a dad can do | Dad Hair Hero',
    description: 'Hairstyles for a party, picture day or dance class: the styles the app lists for parties, the free ones step by step, and a free dance day routine.',
    lede: 'For the days a photo will be taken. Neat, a little more than everyday, and still something you can do.',
    // The app's occasions are Everyday, Sport, Party and Bedtime (1.4.0): no
    // dance or picture day tag. Dance has its own care routine instead.
    intro: 'These are the styles the app lists for a party. The app has no picture day setting, but the same list suits one: something tidy from the front, done the night before if it will last, or that morning if it will not. For a dance class or a show, the app has a free dance and drama day routine, linked below. The free styles are on this site in full; the rest are in Beyond the Ponytail, an optional one-time pack in the app.',
    select: (styles) => sortByTime(styles.filter((s) => s.occasions.includes('party'))),
    guides: ['dance-day'],
    techniques: ['making-a-part', 'holding-tension'],
    fixes: ['entry-looks-wrong'],
    // Near the top of the hub: the seasonal guides built from these styles.
    seasonal: [
      { kind: 'christmas-hair', lead: 'For Christmas:', link: 'Christmas concert and party hairstyles', after: ', from a half-up with a bow to bunches with ribbons, free step by step.' },
      { kind: 'halloween-hair', lead: 'For Halloween:', link: 'easy Halloween hairstyles', after: ', from a unicorn tail to scarecrow bunches, free step by step.' },
    ],
    ctaHeading: 'Practise it first, in the app',
    cta: 'Dad Hair Hero keeps a diary of what you have done and how it went, so the party style is one you have already tried. Free to download, with an optional one-time pack. No account, no tracking.',
  },
];

export const hubByKind = (kind) => HUBS.find((hub) => hub.kind === kind);

// ─── Seasonal guides ─────────────────────────────────────────────────────────
//
// Halloween: looks made from styles the app already has, described as looks
// and never as characters. The free styles come first, with every step on
// this site; a toddler look follows, then two more from Beyond the Ponytail,
// marked as pack styles. The address has no year in it, so the page builds
// up over seasons; each September, refresh the wording and dateModified and
// keep the address.
//
// The sentences are the guide's own, written in UK English and passed
// through t() for the US page, except where the two are searched for in
// different words (title, description, opening). How a free look goes is
// told from its steps; a pack look from its description and step titles,
// the only parts of a pack style the export carries. The "for the evening"
// lines are adapted from each style's make-it-last line in the app, with
// nothing added. The Fix It answers are read from the export by node id, so
// they are always the app's own words.

export const HALLOWEEN = {
  kind: 'halloween-hair',
  segment: 'halloween-hairstyles',
  name: 'Halloween hairstyles',
  h1: 'Easy Halloween hairstyles for kids',
  title: {
    uk: 'Halloween hairstyles for girls, made easy | Dad Hair Hero',
    us: 'Easy Halloween hairstyles for girls | Dad Hair Hero',
  },
  description: {
    uk: 'Halloween hairstyles for girls: a unicorn tail, scarecrow bunches and more, each from one simple style in 6 minutes or less. Every step free.',
    us: 'Easy Halloween hairstyles for girls: a unicorn tail, scarecrow pigtails and more, each from one simple style in 6 minutes or less. Every step free.',
  },
  // The first two sentences answer the search.
  lede: {
    uk: 'Four easy Halloween hairstyles for girls, each made from one simple style in 6 minutes or less, with every step free on this site and in the Dad Hair Hero app. They are written for anyone who hasn\'t done much hair, and two more looks from the app\'s optional pack come after them.',
    us: 'Four easy Halloween hairstyles for girls, each made from one simple style in 6 minutes or less, with every step free on this site and in the Dad Hair Hero app. They are written for anyone who hasn\'t done much hair, and two more looks from the app\'s optional pack come after them.',
  },
  intro: {
    uk: 'Easy Halloween hair for kids starts from styles you may already know: a ponytail, bunches and a half-up. The costume does the rest, so none of these needs a wig, and each one has a line on making it last the evening.',
    us: 'Halloween hairstyles for kids can start from styles you may already know: a ponytail, pigtails and a half-up. The costume does the rest, so none of these needs a wig, and each one has a line on making it last the evening.',
  },
  // The 1200×630 collage and the 2:3 pin are made by scripts/render-pins.mjs,
  // from the first three free looks.
  ogImage: '/images/guides/halloween-hairstyles-1200x630.jpg',
  ogImageSize: { width: 1200, height: 630 },
  datePublished: '2026-10-15',
  dateModified: '2026-10-15',
  // The page's other sentences (src/components/SeasonalGuide.astro).
  freeCount: 'The first four are free in the app, step by step.',
  toddlerHeading: 'Toddler Halloween hair',
  toddlerIntro: 'For a toddler with short, fine hair, start with the clip-back below; two even bunches suit toddlers too. More in',
  packIntro: 'These two are in Beyond the Ponytail, an optional one-time pack in the app. Each style\'s page shows the finished look, what you need and what the steps cover; the full steps, with a picture for each, are in the app.',
  lastLabel: 'For the evening:',
  ideaLead: 'A Halloween idea:',
  moreLead: 'More for dressing up:',
  allStyles: `all ${COUNTS.styles} styles`,
  // `section`: 'free' looks lead the page, 'toddler' sits with the under-three
  // line, 'pack' is "More looks in Beyond the Ponytail". `idea` is the line
  // on the style's own page: "A Halloween idea: …".
  looks: [
    {
      section: 'free',
      anchor: 'animal-tail',
      styleId: 'high-ponytail',
      heading: 'A horse, lion or unicorn tail from a high ponytail',
      alt: 'all the hair gathered into one ponytail at the very top of the head, back view',
      how: 'Sweep all the hair up to the very top of her head and check it sits right at the crown. Smooth the sides up to your holding hand with a soft brush, then loop the elastic around at least four times, asking her after the third wrap whether it feels tight.',
      last: 'Very clean, silky hair slides out of an elastic. A light mist of water before you gather gives it grip for the evening.',
      idea: 'a high ponytail makes a tail for a horse, a lion or a unicorn.',
    },
    {
      section: 'free',
      anchor: 'scarecrow-bunches',
      styleId: 'two-even-bunches',
      heading: 'Scarecrow or rag doll bunches',
      alt: 'hair parted down the middle into two ponytails, one each side level with the ears, back view',
      how: 'Draw a centre parting from her hairline to the back of her neck and lay one side over her shoulder. Gather each side level with the top of her ear, holding both at once so they match, and wrap each elastic at least three times. Check from the front that they are level.',
      last: 'Sit the bunches above her ears, not behind them, so a car seat on the way doesn\'t rub them loose.',
      idea: 'two even bunches for a scarecrow or a rag doll.',
    },
    {
      section: 'free',
      anchor: 'under-a-hat',
      styleId: 'half-up-half-down',
      heading: 'Half-up, half-down under a witch\'s hat or ears on a headband',
      alt: 'the top half of the hair gathered high on the back of the head, the bottom half loose, back view',
      how: 'Part the hair from ear to ear across the top of her head and gather everything above the line. Smooth the sides back, loop an elastic around it at least three times high on the back of her head, and let the bottom half hang loose.',
      last: 'The loose half tangles first. Brush it through when you get home, before it knots against her collar.',
      idea: 'a half-up, half-down under a witch\'s hat, or with ears on a headband.',
    },
    {
      section: 'toddler',
      anchor: 'toddler-wisps',
      styleId: 'clip-back-baby-wisps',
      heading: 'Wisps clipped back for a toddler\'s costume',
      alt: 'fine wisps at the front swept back and held with one soft snap clip, side view',
      how: 'Dampen the front wisps with a wet comb and sweep them back off her forehead without pulling. Slide a fabric-lined clip over them, front to back, with a finger underneath as it snaps shut.',
      last: 'Clip the wisps while they are still a little damp. They dry flat under the clip and hold it in.',
      idea: 'clip the wisps back for a toddler\'s costume.',
    },
    {
      section: 'pack',
      anchor: 'cat-ears',
      styleId: 'space-buns',
      heading: 'Cat, bear or mouse ears from space buns',
      alt: 'two round buns high on each side of the head, back view',
      how: 'Part the hair in two and make a ponytail high on one side. Twist it, wind it around its own base and pin it into a bun, then build the second to match and check them from the back.',
      last: 'Second-day hair holds a bun better, so they last the evening best on hair that wasn\'t washed that day. Take them down at bedtime.',
      idea: 'two space buns make cat, bear or mouse ears.',
    },
    {
      section: 'pack',
      anchor: 'witch-plaits',
      styleId: 'plaited-pigtails',
      heading: 'Witch plaits from plaited bunches',
      alt: 'two three-strand plaits, one each side of a centre parting, back view',
      how: 'Draw a centre parting and move the right side clear. Gather and plait the left side, plait the right side to match, then check both sides together.',
      last: 'Plaits survive a night\'s sleep, so an evening of trick-or-treating is no trouble.',
      idea: 'two plaits for a witch.',
    },
  ],
  // If it goes wrong: the question is the guide's, the answer is the Fix It
  // outcome's own title and text, and the link goes to its Fix It page.
  fixes: [
    { q: 'What if a bun or ponytail won\'t stay in?', node: 'outcome-falls-elastic-slip', entry: 'entry-falls-out' },
    { q: 'What if a plait comes undone at the end?', node: 'outcome-falls-braid-end', entry: 'entry-falls-out' },
    { q: 'What if she won\'t sit still?', node: 'outcome-sit-bored', entry: 'entry-wont-sit' },
    { q: 'What if she says it\'s too tight?', node: 'outcome-root-elastic', entry: 'entry-hurts' },
  ],
};

// Christmas: looks for a school concert or a party, built like Halloween.
// The free looks lead, each with a ribbon or bow added to a style the app
// has; the toddler look has no ribbon and sits with the under-three line;
// then two pack looks. Ribbons and bows are not in the app or the Kit, so
// the page names them and gives no advice about them. The "to make it
// last" lines are adapted from each style's make-it-last line in the app,
// with nothing added. Each September, refresh the wording and dateModified
// and keep the address.
export const CHRISTMAS = {
  kind: 'christmas-hair',
  segment: 'christmas-party-hairstyles',
  name: 'Christmas hairstyles',
  h1: 'Christmas hairstyles for concerts and parties',
  title: {
    uk: 'Christmas party and concert hairstyles | Dad Hair Hero',
    us: 'Easy Christmas party hairstyles for girls | Dad Hair Hero',
  },
  description: {
    uk: 'Christmas hairstyles for girls for a concert or party: a half-up with a bow, a ponytail with a ribbon and bunches, each 6 minutes or less. All free.',
    us: 'Easy Christmas hairstyles for girls for a concert or party: a half-up with a bow, a ponytail with a ribbon and pigtails, each 6 minutes or less. All free.',
  },
  // The first two sentences answer the search.
  lede: {
    uk: 'Four easy Christmas hairstyles for girls, for a school concert or a party, each made from one simple style in 6 minutes or less, with every step free on this site and in the Dad Hair Hero app. They are written for anyone who hasn\'t done much hair, and two more looks from the app\'s optional pack come after them.',
    us: 'Four easy Christmas hairstyles for girls, for a school concert or a party, each made from one simple style in 6 minutes or less, with every step free on this site and in the Dad Hair Hero app. They are written for anyone who hasn\'t done much hair, and two more looks from the app\'s optional pack come after them.',
  },
  intro: {
    uk: 'Christmas concert hair starts from styles you may already know: a half-up, a ponytail and bunches. The ribbon or bow goes on last, over the elastic, and each look has a line on making it last to the end of a long concert or party.',
    us: 'Christmas concert hair starts from styles you may already know: a half-up, a ponytail and pigtails. The ribbon or bow goes on last, over the elastic, and each look has a line on making it last to the end of a long concert or party.',
  },
  // The 1200×630 collage and the 2:3 pin are made by scripts/render-pins.mjs,
  // from the three free looks with a ribbon or bow.
  ogImage: '/images/guides/christmas-party-hairstyles-1200x630.jpg',
  ogImageSize: { width: 1200, height: 630 },
  datePublished: '2026-11-04',
  dateModified: '2026-11-04',
  freeCount: 'The first four are free in the app, step by step.',
  toddlerHeading: 'Toddler Christmas hair',
  toddlerIntro: 'For a toddler with short, fine hair, start with the clip-back below. More in',
  packIntro: 'These two are in Beyond the Ponytail, an optional one-time pack in the app. Each style\'s page shows the finished look, what you need and what the steps cover; the full steps, with a picture for each, are in the app.',
  lastLabel: 'To make it last:',
  ideaLead: 'A Christmas idea:',
  moreLead: 'More for parties:',
  allStyles: 'every style',
  // Only the free looks carry an `idea`: the line goes on free style pages.
  looks: [
    {
      section: 'free',
      anchor: 'half-up-with-a-bow',
      styleId: 'half-up-half-down',
      heading: 'Half-up, half-down with a ribbon or bow',
      alt: 'the top half of the hair gathered high on the back of the head, the bottom half loose, back view',
      how: 'Part the hair from ear to ear across the top of her head and gather everything above the line. Smooth the sides back, loop an elastic around it at least three times high on the back of her head, and let the bottom half hang loose.',
      last: 'The loose half tangles first. Brush it through when you get home, before it knots against her collar.',
      idea: 'a half-up, half-down with a ribbon or bow for a Christmas concert or party.',
    },
    {
      section: 'free',
      anchor: 'ponytail-with-a-ribbon',
      styleId: 'high-ponytail',
      heading: 'A high ponytail with a ribbon',
      alt: 'all the hair gathered into one ponytail at the very top of the head, back view',
      how: 'Sweep all the hair up to the very top of her head and check it sits right at the crown. Smooth the sides up to your holding hand with a soft brush, then loop the elastic around at least four times, asking her after the third wrap whether it feels tight.',
      last: 'Very clean, silky hair slides out of an elastic. A light mist of water before you gather gives it grip through a long concert.',
      idea: 'a high ponytail with a ribbon for a Christmas concert or party.',
    },
    {
      section: 'free',
      anchor: 'bunches-with-ribbons',
      styleId: 'two-even-bunches',
      heading: 'Two even bunches with ribbons',
      alt: 'hair parted down the middle into two ponytails, one each side level with the ears, back view',
      how: 'Draw a centre parting from her hairline to the back of her neck and lay one side over her shoulder. Gather each side level with the top of her ear, holding both at once so they match, and wrap each elastic at least three times. Check from the front that they are level.',
      last: 'Sit the bunches above her ears, not behind them, so a car seat on the way doesn\'t rub them loose.',
      idea: 'two even bunches with ribbons for a Christmas concert or party.',
    },
    {
      section: 'toddler',
      anchor: 'toddler-wisps',
      styleId: 'clip-back-baby-wisps',
      heading: 'Wisps clipped back for a toddler\'s concert or party',
      alt: 'fine wisps at the front swept back and held with one soft snap clip, side view',
      how: 'Dampen the front wisps with a wet comb and sweep them back off her forehead without pulling. Slide a fabric-lined clip over them, front to back, with a finger underneath as it snaps shut.',
      last: 'Clip the wisps while they are still a little damp. They dry flat under the clip and hold it in.',
      idea: 'clip the wisps back for a toddler\'s Christmas concert or party.',
    },
    {
      section: 'pack',
      anchor: 'top-knot',
      styleId: 'top-knot',
      heading: 'A top knot with a ribbon',
      alt: 'all the hair wound into a round bun at the very top of the head, back view',
      how: 'Gather all the hair to the very top of her head and secure it with an elastic. Twist the ponytail into a rope, wind it around its base, secure it with a second elastic and pin any loose ends.',
      last: 'Hair washed the day before holds a bun better than freshly washed hair. Take the bun down at bedtime: sleeping on it pulls at her crown.',
    },
    {
      section: 'pack',
      anchor: 'plaits-with-ribbons',
      styleId: 'plaited-pigtails',
      heading: 'Plaited bunches with ribbons',
      alt: 'two three-strand plaits, one each side of a centre parting, back view',
      how: 'Draw a centre parting and move the right side clear. Gather and plait the left side, plait the right side to match, then check both sides together.',
      last: 'Plaits survive a night\'s sleep, so a long concert or party is no trouble.',
    },
  ],
  fixes: HALLOWEEN.fixes,
};

export const SEASONAL_GUIDES = [HALLOWEEN, CHRISTMAS];

// The app's under-three line, word for word: UNDER_THREE_LINE in the app's
// src/data/safety.ts (wording approved 2026-10-14, release 1.2.1). It is not
// in the export yet; once it is, read it from there instead.
export const UNDER_THREE_LINE = "Under three? Use elastics and clips only while you're with her, and take them out before she sleeps.";

// The app's sleep note, word for word: SLEEP_NOTE in the app's
// src/data/safety.ts (wording approved 2026-10-14). The app shows it under a
// style or routine that suggests sleeping in it (sleepsInIt). The export
// doesn't carry that flag for styles, so the free styles it applies to are
// listed here; Bedtime Pineapple is the only free one (1.4.0). A routine's
// own flag is in the export (guide.sleepNote).
export const SLEEP_NOTE = {
  heading: 'Before she sleeps in it.',
  body: 'Under one: nothing on her head and nothing in the cot, so no bonnet and no pillow. Under three: take out every elastic and clip before naps and bed. Small hair things are a choking risk. Older children: check the bed in the morning for anything that has come loose.',
};
export const SLEEPS_IN_IT_FREE_STYLES = ['bedtime-pineapple'];

// The seasonal looks a style is used in, for the lines on its own page:
// "A Halloween idea: …", "A Christmas idea: …". A look with no `idea` has none.
export const seasonalLooksForStyle = (style) => SEASONAL_GUIDES.flatMap((guide) => guide.looks
  .filter((look) => look.styleId === style.id && look.idea)
  .map((look) => ({ ...look, guide })));

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
  // For outreach (2026-11-04): a page for journalists and groups, and one
  // asking what to fix, which opens the visitor's own email app.
  press: '/press/',
  tellUs: '/tell-us/',
  // The care routines (1.4.0), free in the app and in full here.
  guides: '/guides/',
  ...Object.fromEntries(HUBS.map((hub) => [hub.kind, `/${hub.segment}/`])),
  ...Object.fromEntries(SEASONAL_GUIDES.map((guide) => [guide.kind, `/${guide.segment}/`])),
};

// The path of a page in one language. `id` is the app's id, which is the
// same in both languages; the address uses that language's slug.
export function path(locale, kind, id) {
  if (kind === 'style') return `${locale.prefix}/styles/${styleById(locale, id).slug}/`;
  if (kind === 'technique') return `${locale.prefix}/techniques/${techniqueById(locale, id).slug}/`;
  if (kind === 'guide') return `${locale.prefix}/guides/${guideById(locale, id).slug}/`;
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
    ...publishedGuides(UK).map((g) => ({ kind: 'guide', id: g.id })),
  ];
}

// ─── Store links ─────────────────────────────────────────────────────────────

// A short name for the page a store link is on, so the store consoles can
// show which pages send installs. It travels in the link only: the site
// itself records nothing. Apple allows 40 characters.
export function campaign(locale, kind, id) {
  const short = { style: 's', technique: 't', fix: 'f', guide: 'g' }[kind];
  const name = short ? `${short}-${id}` : kind;
  return `${locale === US ? 'us-' : ''}${name}`.slice(0, 40);
}

// The provider token (pt) is what lets App Store Connect report installs by
// campaign (ct); without it the campaign name is ignored. It identifies the
// developer account, not a visitor.
export const APP_STORE_PROVIDER = '129433924';
export function appStoreUrl(campaignName) {
  return `https://apps.apple.com/app/apple-store/id${APP_STORE_ID}?pt=${APP_STORE_PROVIDER}&ct=${encodeURIComponent(campaignName)}&mt=8`;
}

// A printed QR code (src/pages/get.astro) is not a visit from the website, so
// its Play links say so: utm_source=qr, utm_medium=print.
export const QR_REFERRER = { source: 'qr', medium: 'print' };
export function playUrl(campaignName, { source = 'dadhairhero.com', medium = 'website' } = {}) {
  const referrer = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaignName}`;
  return `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}&referrer=${encodeURIComponent(referrer)}`;
}

// What "Send this to him" shares with the link, in the style's own name for
// this language.
export const shareText = (style) =>
  style.pack
    ? `Here's ${style.name}, one of the styles in Dad Hair Hero's optional pack, written for dads. The app is free to download and privacy-friendly, with no account.`
    : `Here's the ${style.name} step by step, written for dads. The app is free to download and privacy-friendly, with no account.`;

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
export const AGE_WORDS = {
  baby: 'babies',
  toddler: 'toddlers',
  'young-child': 'young children',
  'older-child': 'older children',
  'pre-teen': 'pre-teens',
};

// "Toddlers to pre-teens", from the age bands the style was written for.
export function ages(style) {
  return agesOf(style.ageBands);
}
export function agesOf(ageBands) {
  const bands = AGE_ORDER.filter((band) => ageBands.includes(band));
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
  'very-short': 'Very short hair, above her ears, upwards',
  short: 'Hair between her ears and her chin, or longer',
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
      a: `${ages(style)}, and ${lower(hairLength(style))}. In the app, Today suggests the styles written for her age and hair length, and Browse shows every style.`,
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
    INSTAGRAM.url,
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

// A seasonal guide: an Article by Martin, published by Dad Hair Hero.
export function article({ headline, description, image, datePublished, dateModified, url, locale }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image,
    datePublished,
    dateModified,
    inLanguage: locale.code,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: AUTHOR.name, url: `${SITE}/about/` },
    publisher: { '@type': 'Organization', name: 'Dad Hair Hero', url: `${SITE}/`, logo: { '@type': 'ImageObject', url: `${SITE}/assets/icon-512.png` } },
  };
}

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
