# dadhairhero-site

The website at [dadhairhero.com](https://dadhairhero.com): guides to
hairstyles for girls, written for dads, that send readers to the Dad Hair
Hero app. Built with [Astro](https://astro.build) and hosted on GitHub Pages.

## How it fits together

- **The content comes from the app.** `src/data/en-GB.json`,
  `src/data/en-US.json`, `src/data/glossary.json` and
  `public/images/{styles,techniques,kit}/` are written by
  `scripts/export-site-data.mjs` in the app's repository. Don't edit them
  here: change the app's content and export again.

  ```
  cd ../dad-hair-hero
  node scripts/export-site-data.mjs
  ```

  Then review the diff here, re-render the videos if a free style changed
  (`npm run videos`), and commit. The export is run by hand when content
  changes; no build reads the app's repository.
- **A stale export does not build.** The export stamps every file with a
  content version (a hash of the app's content). `npm run build` first
  runs `scripts/check-export.mjs`, which refuses to build if the three data
  files disagree, or if the app's repository is beside this one and its
  current content version differs. In CI the app check runs when the
  `APP_REPO_TOKEN` secret gives the workflow read access to the private
  app repository; without it the comparison is skipped and the log says so.
- **The six free styles and the eight techniques are published in full.**
  The twelve Beyond the Ponytail styles are previews: finished look, time,
  kit and step titles. The export never writes their instructions or step
  photos, and `npm run check` fails if it ever does.
- **Two languages, one glossary.** UK English at the root, US English under
  `/us/`, which is also where a reader in Canada is sent. Content arrives
  already converted by the app; the site's own sentences are written in UK
  English and put through `t()` in `src/lib/site.js`, which uses the app's
  exported glossary, not a copy. A page's address uses that language's
  words (`/styles/french-plait/`, `/us/styles/french-braid/`).
  `src/lib/site.js` holds the addresses and the hreflang pairs, and the
  sitemap (with images and videos) is built from the same list.
- **Pages.** Home; the six free style guides and twelve pack previews;
  eight technique guides; hubs for easy hairstyles, curly and coily hair,
  school, toddlers, sport and parties (`HUBS` in `src/lib/site.js`, built
  from the app's occasion and age tags); Fix It, one page per problem from
  the app's tree; the Kit; About; privacy; 404.
- **Videos.** `npm run videos` renders a 30 to 45 second vertical video for
  each free style in each language from its step photos
  (`scripts/render-videos.mjs`, sharp and ffmpeg), into `public/videos/`,
  with a poster and a manifest. The files are committed, for the pages and
  for YouTube and Pinterest later.
- **Buying happens on one page.** Amazon links are only on the Kit page,
  after the disclosure, with `rel="sponsored"`: amazon.co.uk for UK English
  and amazon.com for US English.
- **No tracking.** The site loads no script file and nothing from any other
  site. The one inline script runs the phone app bar: it picks the store
  for the phone and remembers a dismissal in the browser's own
  sessionStorage. Store badge links carry the name of the page they are
  on, which the store consoles report; the site records nothing. No
  analytics is added unless Martin says so.

## Working on it

```
npm install
npm run dev        # http://localhost:4321
npm test           # build (with the export check), then check the result
npm run lighthouse # Lighthouse on seven pages, mobile, 90 or better each
```

`npm run check` runs `scripts/check-site.mjs` on the built site (links and
anchors, alt text, titles and descriptions, canonical and hreflang pairs,
structured data by page type, orphan pages, the affiliate rules, the store
links, the videos and the sitemap) and then `html-validate`. The GitHub
Action runs all of it plus Lighthouse on every push, and deploys from
`main` only when everything passes.

## Deploying

Pushing to `main` builds, checks and deploys through `.github/workflows/site.yml`.
GitHub Pages must be set to deploy from **GitHub Actions** (Settings → Pages
→ Source) before the first merge. The custom domain is `public/CNAME`.
