// Pinterest batch 1: the six free styles, each as a style pin, a step strip
// and a handoff pin (one a dad is sent). Pack styles are left out, and no
// pack step picture is ever published.
//
// One list feeds both scripts: render-pins.mjs draws the images from it and
// write-pin-csvs.mjs writes pins/batch-1-part-1.csv and part-2.csv.
// check-site.mjs checks the CSVs. The text is US English, for the /us/
// pages the pins link to.
//
// Every fact here is the site's: times are each style's targetMinutes,
// step titles and pictures are the export's, and the "make it last" tips are
// each style's own line in the app (src/data/styles.json, makeItLast, in its
// US spelling), quoted whole. Two Even Pigtails' line ends with the app's
// "Under three, take them out before a nap.", kept word for word.

const END = 'Free app for iPhone and Android, no ads, no account.';
const SEND = "Send him the page, or tap 'Send this to him' on it.";

// Boards, as named on Pinterest.
const SCHOOL = '5-minute school hairstyles';
const TODDLER = 'Easy toddler hairstyles';
const DADS = 'Hair tips for dads';

export const PINS = [
  // ─── Style pins ───────────────────────────────────────────────────────────
  {
    pillar: 'style', styleId: 'tangle-free-brushing', file: 'tangle-free-brushing-in-2-minutes.png',
    headline: 'Tangle-free brushing in 2 minutes',
    title: 'Tangle-free brushing in 2 minutes: a no-tears detangling method for every hair type',
    description: 'Tangle-free brushing: the foundation skill. Done right it takes two minutes and causes no pain. Written for straight, thick, wavy, curly and coily hair, from toddlers to pre-teens, with every step free. To make it last: "Two minutes with the brush at bedtime, ends first, makes the morning brush much shorter." ' + END,
    alt: 'Long, smooth brushed hair on a mannequin head seen from behind, under the headline Tangle-free brushing in 2 minutes.',
    board: DADS,
  },
  {
    pillar: 'style', styleId: 'classic-ponytail', file: 'classic-ponytail-in-3-minutes.png',
    headline: 'A classic ponytail in 3 minutes',
    title: 'Classic ponytail in 3 minutes: an easy everyday style for toddlers to pre-teens',
    description: 'A classic ponytail: all the hair gathered and secured at the back of the head, level with the tops of the ears. It takes 3 minutes, suits straight, thick, wavy, curly and coily hair, and every step is free. To make it last: "Put a spare elastic in her bag, so she or her teacher can put it back up in seconds if it slips." ' + END,
    alt: 'A smooth classic ponytail with a pink elastic on a mannequin head seen from behind, under the headline A classic ponytail in 3 minutes.',
    board: SCHOOL,
  },
  {
    pillar: 'style', styleId: 'high-ponytail', file: 'high-ponytail-in-4-minutes.png',
    headline: 'A high ponytail in 4 minutes',
    title: 'High ponytail in 4 minutes: a centered, neck-clear style for school, sports and dance',
    description: 'A high ponytail: all the hair gathered at the very top of her head, for more height and a neck kept completely clear. It takes 4 minutes, suits straight, thick, wavy, curly and coily hair, and every step is free. To make it last: "Very clean, silky hair slides out of an elastic. A light mist of water before you gather gives it grip." ' + END,
    alt: 'A high ponytail with a pink elastic on a mannequin head seen from behind, under the headline A high ponytail in 4 minutes.',
    board: SCHOOL,
  },
  {
    pillar: 'style', styleId: 'two-even-bunches', file: 'two-even-pigtails-in-6-minutes.png',
    headline: 'Two even pigtails in 6 minutes',
    title: 'Two even pigtails in 6 minutes: a matching style for babies, toddlers and school age',
    description: 'Two even pigtails: the hair divided down the middle and gathered into one ponytail on each side, level with the ears. It takes 6 minutes, suits straight, thick, wavy, curly and coily hair, and every step is free. To make it last: "Sit the pigtails above her ears, not behind them, so a car seat doesn\'t rub them loose. Under three, take them out before a nap." ' + END,
    alt: 'Two even pigtails with pink elastics on either side of a center part, on a mannequin head seen from behind, under the headline Two even pigtails in 6 minutes.',
    board: TODDLER,
  },
  {
    pillar: 'style', styleId: 'half-up-half-down', file: 'half-up-half-down-in-4-minutes.png',
    headline: 'Half-up, half-down in 4 minutes',
    title: 'Half-up, half-down in 4 minutes: an easy school style for medium and long hair',
    description: 'Half-up, half-down: the top half of the hair gathered at the very top of her head, the bottom half left loose. It looks harder than it is. It takes 4 minutes, suits straight, thick, wavy, curly and coily hair of medium length or longer, and every step is free. To make it last: "The loose half tangles first. Brush it through when she gets home, before it knots against her collar." ' + END,
    alt: 'A half-up, half-down style with the top section tied in a pink elastic and the rest loose, on a mannequin head seen from behind, under the headline Half-up, half-down in 4 minutes.',
    board: SCHOOL,
  },
  {
    pillar: 'style', styleId: 'clip-back-baby-wisps', file: 'clip-back-baby-wisps-in-1-minute.png',
    headline: 'Baby wisps clipped back in 1 minute',
    title: 'Clip back baby wisps in 1 minute: a first hairstyle for babies and toddlers',
    description: 'Clip-back for baby wisps: fine wisps clipped back from a baby or toddler\'s face with a single soft snap clip. It takes 1 minute, suits straight, thick, wavy, curly and coily hair, and every step is free. To make it last: "Clip the wisps while they are still a little damp. They dry flat under the clip and hold it in." ' + END,
    alt: 'Short hair with the front wisps held back by a pink snap clip, on a mannequin head seen from the side, under the headline Baby wisps clipped back in 1 minute.',
    board: TODDLER,
  },

  // ─── Step strips ──────────────────────────────────────────────────────────
  // `steps` are step numbers in the export; the strip ends with the finished
  // look, captioned with the style's time.
  {
    pillar: 'step strip', styleId: 'tangle-free-brushing', file: 'tangle-free-brushing-step-by-step.png',
    headline: 'Tangle-free brushing, step by step', steps: [2, 3, 4],
    title: 'Tangle-free brushing step by step: detangle any hair type in 2 minutes, without tears',
    description: 'Tangle-free brushing in pictures: set your anchor hand, clear the ends first, then work upward in stages. Two minutes, for straight, thick, wavy, curly and coily hair, from toddlers to pre-teens. Every step is free on the page. To make it last: "Two minutes with the brush at bedtime, ends first, makes the morning brush much shorter." ' + END,
    alt: 'Three numbered pictures of hands combing long hair on a mannequin head, from the ends upward, then the smooth finished hair.',
    board: DADS,
  },
  {
    pillar: 'step strip', styleId: 'classic-ponytail', file: 'classic-ponytail-step-by-step.png',
    headline: 'Classic ponytail, step by step', steps: [2, 3, 5],
    title: 'Classic ponytail step by step: a smooth 3-minute ponytail for toddlers and up',
    description: 'A classic ponytail in pictures: gather the hair, set the height, secure with the elastic. Three minutes, for straight, thick, wavy, curly and coily hair, from toddlers to pre-teens. Every step is free on the page. To make it last: "Put a spare elastic in her bag, so she or her teacher can put it back up in seconds if it slips." ' + END,
    alt: 'Three numbered pictures of hands gathering, positioning and tying a ponytail on a mannequin head, then the finished classic ponytail.',
    board: DADS,
  },
  {
    pillar: 'step strip', styleId: 'high-ponytail', file: 'high-ponytail-step-by-step.png',
    headline: 'High ponytail, step by step', steps: [2, 3, 5],
    title: 'High ponytail step by step: gather, check and secure in 4 minutes, for school and sports',
    description: 'A high ponytail in pictures: gather upward to the very top of her head, check the position, secure firmly. Four minutes, for straight, thick, wavy, curly and coily hair. Every step is free on the page. To make it last: "Very clean, silky hair slides out of an elastic. A light mist of water before you gather gives it grip." ' + END,
    alt: 'Three numbered pictures of hands gathering hair to the top of a mannequin head, checking it and tying it, then the finished high ponytail.',
    board: DADS,
  },
  {
    pillar: 'step strip', styleId: 'two-even-bunches', file: 'two-even-pigtails-step-by-step.png',
    headline: 'Two even pigtails, step by step', steps: [2, 4, 6],
    title: 'Two even pigtails step by step: a center part and matching pigtails in 6 minutes',
    description: 'Two even pigtails in pictures: draw the center part, gather one side, secure both pigtails. Six minutes, for straight, thick, wavy, curly and coily hair, from babies to school age. Every step is free on the page. To make it last: "Sit the pigtails above her ears, not behind them, so a car seat doesn\'t rub them loose. Under three, take them out before a nap." ' + END,
    alt: 'Three numbered pictures of hands parting hair down the middle and tying a pigtail on each side of a mannequin head, then the finished pigtails.',
    board: SCHOOL,
  },
  {
    pillar: 'step strip', styleId: 'half-up-half-down', file: 'half-up-half-down-step-by-step.png',
    headline: 'Half-up, half-down, step by step', steps: [2, 3, 5],
    title: 'Half-up, half-down step by step: a 4-minute style for medium and long hair',
    description: 'Half-up, half-down in pictures: find the dividing line, gather the top section, secure it at the very top of her head. Four minutes, for straight, thick, wavy, curly and coily hair of medium length or longer. Every step is free on the page. To make it last: "The loose half tangles first. Brush it through when she gets home, before it knots against her collar." ' + END,
    alt: 'Three numbered pictures of hands dividing off the top half of the hair on a mannequin head and tying it, then the finished half-up, half-down.',
    board: DADS,
  },
  {
    pillar: 'step strip', styleId: 'clip-back-baby-wisps', file: 'clip-back-baby-wisps-step-by-step.png',
    headline: 'Clip back baby wisps, step by step', steps: [1, 2, 3],
    title: 'Clip back baby wisps step by step: a 1-minute style for babies and toddlers',
    description: 'Clip-back for baby wisps in pictures: dampen the wisps, gather them, clip in place with one soft snap clip. One minute, for straight, thick, wavy, curly and coily hair. Every step is free on the page. To make it last: "Clip the wisps while they are still a little damp. They dry flat under the clip and hold it in." ' + END,
    alt: 'Three numbered pictures of a hand combing, gathering and clipping the front wisps on a mannequin head, then the finished clip-back.',
    board: TODDLER,
  },

  // ─── Handoff pins ─────────────────────────────────────────────────────────
  // Headlines, titles and boards as given; descriptions: the style and its
  // time, why it works for someone new, the nudge to send it, the ending.
  {
    pillar: 'handoff', styleId: 'classic-ponytail', file: 'send-him-classic-ponytail.png',
    headline: "Dad's on the school run? Send him this",
    title: 'Classic ponytail in 3 minutes: a school-morning style dads can learn',
    description: 'A classic ponytail in 3 minutes, with every step written for dads. Each step says what it should look like before he moves on, so he knows it\'s right the first time. ' + SEND + ' ' + END,
    alt: 'A smooth classic ponytail with a pink elastic on a mannequin head seen from behind, under the headline Dad\'s on the school run? Send him this.',
    board: SCHOOL,
  },
  {
    pillar: 'handoff', styleId: 'high-ponytail', file: 'send-him-high-ponytail.png',
    headline: 'Hand him the hairbrush',
    title: 'High ponytail in 4 minutes, step by step for dads',
    description: 'A high ponytail in 4 minutes, step by step for dads. It\'s the classic ponytail gathered higher, with a step to check it sits centered before he ties it. ' + SEND + ' ' + END,
    alt: 'A high ponytail with a pink elastic on a mannequin head seen from behind, under the headline Hand him the hairbrush.',
    board: DADS,
  },
  {
    pillar: 'handoff', styleId: 'two-even-bunches', file: 'send-him-two-even-pigtails.png',
    headline: 'Weekend with dad: a style he can do',
    title: 'Two even pigtails in 6 minutes: easy hairstyle written for dads',
    description: 'Two even pigtails in 6 minutes, written for dads. A center part first, then one side at a time, and a check from the front so they match. ' + SEND + ' ' + END,
    alt: 'Two even pigtails with pink elastics on a mannequin head seen from behind, under the headline Weekend with dad: a style he can do.',
    board: DADS,
  },
  {
    pillar: 'handoff', styleId: 'half-up-half-down', file: 'send-him-half-up-half-down.png',
    headline: 'Away for a few days? Leave him this',
    title: 'Half-up, half-down in 4 minutes: a step-by-step style for dads',
    description: 'Half-up, half-down in 4 minutes, step by step for dads. A line from the top of one ear to the other marks where to divide the hair, so there\'s no guessing. ' + SEND + ' ' + END,
    alt: 'A half-up, half-down style with a pink elastic on a mannequin head seen from behind, under the headline Away for a few days? Leave him this.',
    board: SCHOOL,
  },
  {
    pillar: 'handoff', styleId: 'clip-back-baby-wisps', file: 'send-him-clip-back-baby-wisps.png',
    headline: 'A first style for dad: 1 minute',
    title: 'Clip back baby wisps in 1 minute: a first toddler hairstyle for dads',
    description: 'Clip back baby wisps in 1 minute: three steps and one soft snap clip. A gentle first style for a dad who has never done hair. ' + SEND + ' ' + END,
    alt: 'Short hair with the front wisps held back by a pink snap clip, on a mannequin head seen from the side, under the headline A first style for dad: 1 minute.',
    board: TODDLER,
  },
  {
    pillar: 'handoff', styleId: 'tangle-free-brushing', file: 'send-him-tangle-free-brushing.png',
    headline: 'Tears at brushing time? Send him the method',
    title: 'Tangle-free brushing in 2 minutes: detangling without tears, for dads',
    description: 'Tangle-free brushing in 2 minutes, written for dads. One hand holds the hair halfway down as a shield and he clears the ends first, so the tugging never reaches her scalp. ' + SEND + ' ' + END,
    alt: 'Long, smooth brushed hair on a mannequin head seen from behind, under the headline Tears at brushing time? Send him the method.',
    board: DADS,
  },
];

// ─── Schedule ─────────────────────────────────────────────────────────────
// Mon, Wed and Fri at 8pm Irish time from Monday 19 October 2026: each week
// a style pin on Monday, a handoff pin on Wednesday and that week's style's
// step strip on Friday, so the week alternates style pin and step strip and
// never sends him the style it shows that week.
export const FIRST_MONDAY = '2026-10-19';
const WEEKS = [
  ['two-even-bunches', 'classic-ponytail'],
  ['classic-ponytail', 'high-ponytail'],
  ['half-up-half-down', 'two-even-bunches'],
  ['high-ponytail', 'half-up-half-down'],
  ['tangle-free-brushing', 'clip-back-baby-wisps'],
  ['clip-back-baby-wisps', 'tangle-free-brushing'],
];
// Pinterest's scheduler takes dates up to about 30 days ahead, so the
// schedule goes up in two files: weeks 1–4 in October, weeks 5–6 in
// November (see pins/README.md for the upload windows).
export const PART_1_WEEKS = 4;

// 8pm in Dublin as a UTC time: Irish Summer Time (UTC+1) ends on the last
// Sunday of October, 25 October 2026.
function eightPmDublin(day) {
  const noonUtc = new Date(`${day}T12:00:00Z`);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Dublin', hour: '2-digit', hourCycle: 'h23' }).format(noonUtc));
  const offset = hour - 12;
  return `${day}T${String(20 - offset).padStart(2, '0')}:00:00`;
}
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const find = (pillar, styleId) => PINS.find((p) => p.pillar === pillar && p.styleId === styleId);

export const SCHEDULE = WEEKS.flatMap(([styleId, handoffId], week) => {
  const monday = addDays(FIRST_MONDAY, week * 7);
  return [
    [find('style', styleId), monday],
    [find('handoff', handoffId), addDays(monday, 2)],
    [find('step strip', styleId), addDays(monday, 4)],
  ].map(([pin, day]) => ({ ...pin, day, publishDate: eightPmDublin(day), part: week < PART_1_WEEKS ? 1 : 2 }));
});

export const campaign = (pin) => (pin.pillar === 'handoff' ? `pin-ho-${pin.styleId}` : `pin-${pin.styleId}`);
