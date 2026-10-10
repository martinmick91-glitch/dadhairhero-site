// sitemap.xml: every page in both languages, each with its hreflang pair,
// its photos (an image sitemap, in the same file), and the privacy page.
// Built from the same list of pages and the same alternates() the page
// heads use, so the two can't disagree.
import { LOCALES, UK, absolute, alternates, pairedRoutes, path, styleById, techniqueById, videoFor } from '../lib/site.js';

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const photoUrl = (photo) => absolute(`${photo.base}-${Math.max(...photo.widths)}.webp`);

// The photos a page shows, with what each one is, for the image sitemap.
function imagesOf(locale, kind, id) {
  if (kind === 'style') {
    const style = styleById(locale, id);
    const out = [{ loc: photoUrl(style.image), title: `${style.name}, the finished style` }];
    if (style.curlyImage) out.push({ loc: photoUrl(style.curlyImage), title: `${style.name}, the finished style, curly hair` });
    if (!style.pack) {
      style.steps.forEach((step, i) => {
        if (step.photo) out.push({ loc: photoUrl(step.photo), title: `${style.name}, step ${i + 1}: ${step.title}` });
        if (step.curly?.photo && step.curly.photo.base !== step.photo?.base) {
          out.push({ loc: photoUrl(step.curly.photo), title: `${style.name}, step ${i + 1}, curly hair: ${step.curly.title}` });
        }
      });
    }
    return out;
  }
  if (kind === 'technique') {
    const technique = techniqueById(locale, id);
    return technique.image ? [{ loc: photoUrl(technique.image), title: technique.title }] : [];
  }
  return [];
}

function videoOf(locale, kind, id) {
  if (kind !== 'style') return null;
  const style = styleById(locale, id);
  const video = videoFor(locale, style);
  if (!video) return null;
  return {
    thumbnail: absolute(video.poster),
    title: `${style.name}, step by step`,
    description: `Every step of ${style.name} from the Dad Hair Hero app, then the finished look. No sound.`,
    content: absolute(video.src),
    duration: video.durationSeconds,
    date: video.uploadDate,
  };
}

export function GET() {
  const urls = pairedRoutes().flatMap(({ kind, id }) =>
    LOCALES.map((locale) => {
      const lines = [`    <loc>${escape(absolute(path(locale, kind, id)))}</loc>`];
      for (const link of alternates(kind, id)) {
        lines.push(`    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${escape(link.href)}"/>`);
      }
      // Images are the same files in both languages; listing them once,
      // on the UK page, is enough for an image sitemap.
      if (locale === UK) {
        for (const image of imagesOf(locale, kind, id)) {
          lines.push(`    <image:image><image:loc>${escape(image.loc)}</image:loc><image:title>${escape(image.title)}</image:title></image:image>`);
        }
      }
      const video = videoOf(locale, kind, id);
      if (video) {
        lines.push(
          '    <video:video>',
          `      <video:thumbnail_loc>${escape(video.thumbnail)}</video:thumbnail_loc>`,
          `      <video:title>${escape(video.title)}</video:title>`,
          `      <video:description>${escape(video.description)}</video:description>`,
          `      <video:content_loc>${escape(video.content)}</video:content_loc>`,
          `      <video:duration>${video.duration}</video:duration>`,
          `      <video:publication_date>${video.date}</video:publication_date>`,
          '      <video:family_friendly>yes</video:family_friendly>',
          '    </video:video>',
        );
      }
      return `  <url>\n${lines.join('\n')}\n  </url>`;
    }),
  );
  urls.push(`  <url>\n    <loc>${absolute('/privacy/')}</loc>\n  </url>`);

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' +
    ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' +
    ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n' +
    urls.join('\n') +
    '\n</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
