// Writes batch 1's bulk-create files from scripts/pins-batch-1.mjs:
//
//   node scripts/write-pin-csvs.mjs
//
//   pins/batch-1-part-1.csv  weeks 1–4, uploaded in October
//   pins/batch-1-part-2.csv  weeks 5–6, uploaded in November
//
// In Pinterest's own columns and order. Alt text has no column there; it is
// listed in pins/README.md. pins/batch-1.csv is the record of the Halloween
// pin, already published, and is not written here.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEDULE, campaign } from './pins-batch-1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://dadhairhero.com';
const US_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'en-US.json'), 'utf8'));

const COLUMNS = ['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'];
const cell = (value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export const link = (pin) => {
  const { slug } = US_DATA.styles.find((s) => s.id === pin.styleId);
  return `${SITE}/us/styles/${slug}/?utm_source=pinterest&utm_medium=social&utm_campaign=${campaign(pin)}`;
};

for (const part of [1, 2]) {
  const rows = SCHEDULE.filter((pin) => pin.part === part).map((pin) => ({
    Title: pin.title,
    'Media URL': `${SITE}/pins/${pin.file}`,
    'Pinterest board': pin.board,
    Thumbnail: '',
    Description: pin.description,
    Link: link(pin),
    'Publish date': pin.publishDate,
    Keywords: '',
  }));
  const csv = [COLUMNS, ...rows.map((row) => COLUMNS.map((c) => row[c]))].map((r) => r.map(cell).join(',')).join('\n') + '\n';
  const out = path.join('pins', `batch-1-part-${part}.csv`);
  fs.writeFileSync(path.join(ROOT, out), csv);
  console.log(`${out}: ${rows.length} pins, ${rows[0]['Publish date']} to ${rows.at(-1)['Publish date']} UTC`);
}
