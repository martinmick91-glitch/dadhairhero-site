import { defineConfig } from 'astro/config';

// A static site for GitHub Pages. Every page is a folder with an index.html,
// so every address ends in a slash, which is also what the canonical and
// hreflang links say.
export default defineConfig({
  site: 'https://dadhairhero.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
