// Lighthouse, run by `npm run lighthouse` and by the GitHub Action against
// the built site in dist/. Mobile is Lighthouse's default device. One page
// of each kind is scored, and every category must reach 90.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/',
        'http://localhost/styles/classic-ponytail/',
        'http://localhost/us/styles/french-braid/',
        'http://localhost/techniques/holding-tension/',
        'http://localhost/school-hairstyles/',
        'http://localhost/fix-it/falls-out/',
        'http://localhost/kit/',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    // Reports stay on the runner (.lighthouseci/); nothing is uploaded.
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
