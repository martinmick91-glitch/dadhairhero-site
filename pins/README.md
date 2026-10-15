# Pins

Bulk-create files for Pinterest (Create > Bulk create Pins > upload a .csv).
The columns are Pinterest's own template, in its order: Title, Media URL,
Pinterest board, Thumbnail, Description, Link, Publish date, Keywords. An
empty Publish date publishes on upload.

The pin images are in `public/pins/`, so they are served from
`https://dadhairhero.com/pins/` once the site is deployed. Upload a batch only
after that, or Pinterest can't fetch the Media URL.

Each Link carries `utm_source=pinterest&utm_campaign=pin-<id>`, which the
store badges pass on to the stores (src/components/ShareCampaign.astro). Pin
ids are lowercase letters, digits and hyphens, at most 36 characters after
`pin-`.

## Alt text

Pinterest's template has no alt text column, so add it to each pin after the
upload (Edit Pin > Alt text).

### batch-1.csv

1. halloween-hair-in-ten-minutes.png: Three mannequin heads from behind wearing a high ponytail, two even pigtails and a half-up, half-down, under the headline Halloween hair in ten minutes.
