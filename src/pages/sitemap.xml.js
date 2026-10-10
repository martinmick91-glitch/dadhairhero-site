// sitemap.xml: every page in both languages, each with its hreflang pair,
// and the privacy page. Built from the same list of pages and the same
// alternates() the page heads use, so the two can't disagree.
import { LOCALES, absolute, alternates, pairedRoutes, path } from '../lib/site.js';

const escape = (text) => text.replace(/&/g, '&amp;');

export function GET() {
  const urls = pairedRoutes().flatMap(({ kind, id }) =>
    LOCALES.map((locale) => {
      const links = alternates(kind, id)
        .map((link) => `    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${escape(link.href)}"/>`)
        .join('\n');
      return `  <url>\n    <loc>${escape(absolute(path(locale, kind, id)))}</loc>\n${links}\n  </url>`;
    }),
  );
  urls.push(`  <url>\n    <loc>${absolute('/privacy/')}</loc>\n  </url>`);

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') +
    '\n</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
