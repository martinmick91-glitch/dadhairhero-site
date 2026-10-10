# dadhairhero-site

The website at [dadhairhero.com](https://dadhairhero.com): guides to
hairstyles for girls, written for dads, that send readers to the Dad Hair
Hero app. Built with [Astro](https://astro.build) and hosted on GitHub Pages.

## How it fits together

- **The content comes from the app.** `src/data/en-GB.json`,
  `src/data/en-US.json` and `public/images/{styles,techniques,kit}/` are
  written by `scripts/export-site-data.mjs` in the app's repository. Don't
  edit them here: change the app's content and export again.

  ```
  cd ../dad-hair-hero
  node scripts/export-site-data.mjs
  ```

  Then review the diff here and commit it. The export is run by hand when
  content changes; no build reads the app's repository.
- **The six free styles and the eight techniques are published in full.**
  The twelve Beyond the Ponytail styles are previews: finished look, time,
  kit and step titles. The export never writes their instructions or step
  photos, and `npm run check` fails if it ever does.
- **Two languages.** UK English at the root, US English under `/us/`, which
  is also where a reader in Canada is sent. Every page in `src/pages/[...lang]/`
  is built once for each. A page's address uses that language's words
  (`/styles/french-plait/`, `/us/styles/french-braid/`); `src/lib/site.js`
  holds the addresses and the hreflang pairs, and the sitemap is built from
  the same list.
- **Buying happens on one page.** Amazon links are only on the Kit page,
  after the disclosure, with `rel="sponsored"`: amazon.co.uk for UK English
  and amazon.com for US English.
- **No tracking.** The site loads no script and nothing from any other
  site. Store badge links carry the name of the page they are on, which the
  store consoles report; the site records nothing.

## Working on it

```
npm install
npm run dev        # http://localhost:4321
npm test           # build, then check the result
```

`npm run check` (`scripts/check-site.mjs`) checks the built site: links and
anchors, alt text, titles and descriptions, canonical and hreflang pairs,
structured data, the affiliate rules, the store links and the sitemap. The
GitHub Action runs it on every push and deploys from `main` only when it
passes.

## Deploying

Pushing to `main` builds, checks and deploys through `.github/workflows/site.yml`.
GitHub Pages must be set to deploy from **GitHub Actions** (Settings → Pages
→ Source). The custom domain is `public/CNAME`.
