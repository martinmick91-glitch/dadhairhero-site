# Pins

Bulk-create files for Pinterest (Create > Bulk create Pins > upload a .csv).
The columns are Pinterest's own template, in its order: Title, Media URL,
Pinterest board, Thumbnail, Description, Link, Publish date, Keywords.
Publish dates are UTC, as Pinterest reads them; an empty one publishes on
upload.

The pin images are in `public/pins/`, so they are served from
`https://dadhairhero.com/pins/` once the site is deployed. Upload a file only
after that, or Pinterest can't fetch the Media URL.

Each Link carries `utm_source=pinterest&utm_campaign=pin-<id>`, which the
store badges pass on to the stores (src/components/ShareCampaign.astro). Pin
ids are lowercase letters, digits and hyphens, at most 36 characters after
`pin-`.

## The files

| File | What it is | Upload |
|---|---|---|
| `batch-1.csv` | The Halloween pin. | Already published. Keep it as the record; don't upload it again. |
| `batch-1-part-1.csv` | Batch 1, weeks 1 to 4: 12 pins, Mon 19 Oct to Fri 13 Nov. | After this branch is merged and deployed, and before 8pm Irish time on Monday 19 October. |
| `batch-1-part-2.csv` | Batch 1, weeks 5 and 6: 6 pins, Mon 16 Nov to Fri 27 Nov. | Between 1 and 15 November. |

Pinterest schedules pins up to about 30 days ahead, so the schedule is in two
files. Part 2 can't go up before 28 October (27 November would be more than
30 days away) and must go up before its first pin on 16 November. Neither
part file has the Halloween row, so uploading them can't duplicate it.

After each upload, check under Scheduled Pins that every row became a pin
with its date and board, then add each pin's alt text (below).

## Batch 1

Free styles only: each of the six free styles as a style pin (the headline
and the finished look), a step strip (three numbered steps from the style's
page, ending in the finished look) and a handoff pin (one to send to him).
Three a week, at 8pm Irish time (19:00 UTC until the clocks go back on
25 October, 20:00 UTC after): a style pin on Monday, a handoff pin on
Wednesday and that style's step strip on Friday.

Each kind of pin has its own campaign, so the stores count them apart:
style pins link with `pin-<style id>`, step strips with `pin-st-<style id>`
and handoff pins with `pin-ho-<style id>`. check-site holds each image to
its prefix. Every link goes to the style's US page, since the pins are in
US English.

The three Two Even Pigtails pins can point to the UK page instead, for UK and
Ireland boards. The images and text say "pigtails", as on the US page.
Pinterest's template has no column for a second link, so use one of these in
place of the Link:

| Pin | UK link |
|---|---|
| two-even-pigtails-in-6-minutes.png | https://dadhairhero.com/styles/two-even-bunches/?utm_source=pinterest&utm_medium=social&utm_campaign=pin-two-even-bunches |
| two-even-pigtails-step-by-step.png | https://dadhairhero.com/styles/two-even-bunches/?utm_source=pinterest&utm_medium=social&utm_campaign=pin-st-two-even-bunches |
| send-him-two-even-pigtails.png | https://dadhairhero.com/styles/two-even-bunches/?utm_source=pinterest&utm_medium=social&utm_campaign=pin-ho-two-even-bunches |

The images, titles, descriptions, boards and dates all come from
`scripts/pins-batch-1.mjs`. To change one, edit it there, then run
`node scripts/render-pins.mjs` and `node scripts/write-pin-csvs.mjs`.

### batch-1-part-1.csv

| Publishes (8pm Irish) | Pin | Pillar | Campaign | Board |
|---|---|---|---|---|
| Mon 19 Oct | two-even-pigtails-in-6-minutes.png | style | pin-two-even-bunches | Easy toddler hairstyles |
| Wed 21 Oct | send-him-classic-ponytail.png | handoff | pin-ho-classic-ponytail | 5-minute school hairstyles |
| Fri 23 Oct | two-even-pigtails-step-by-step.png | step strip | pin-st-two-even-bunches | 5-minute school hairstyles |
| Mon 26 Oct | classic-ponytail-in-3-minutes.png | style | pin-classic-ponytail | 5-minute school hairstyles |
| Wed 28 Oct | send-him-high-ponytail.png | handoff | pin-ho-high-ponytail | Hair tips for dads |
| Fri 30 Oct | classic-ponytail-step-by-step.png | step strip | pin-st-classic-ponytail | Hair tips for dads |
| Mon 2 Nov | half-up-half-down-in-4-minutes.png | style | pin-half-up-half-down | 5-minute school hairstyles |
| Wed 4 Nov | send-him-two-even-pigtails.png | handoff | pin-ho-two-even-bunches | Hair tips for dads |
| Fri 6 Nov | half-up-half-down-step-by-step.png | step strip | pin-st-half-up-half-down | Hair tips for dads |
| Mon 9 Nov | high-ponytail-in-4-minutes.png | style | pin-high-ponytail | 5-minute school hairstyles |
| Wed 11 Nov | send-him-half-up-half-down.png | handoff | pin-ho-half-up-half-down | 5-minute school hairstyles |
| Fri 13 Nov | high-ponytail-step-by-step.png | step strip | pin-st-high-ponytail | Hair tips for dads |

### batch-1-part-2.csv

| Publishes (8pm Irish) | Pin | Pillar | Campaign | Board |
|---|---|---|---|---|
| Mon 16 Nov | tangle-free-brushing-in-2-minutes.png | style | pin-tangle-free-brushing | Hair tips for dads |
| Wed 18 Nov | send-him-clip-back-baby-wisps.png | handoff | pin-ho-clip-back-baby-wisps | Easy toddler hairstyles |
| Fri 20 Nov | tangle-free-brushing-step-by-step.png | step strip | pin-st-tangle-free-brushing | Hair tips for dads |
| Mon 23 Nov | clip-back-baby-wisps-in-1-minute.png | style | pin-clip-back-baby-wisps | Easy toddler hairstyles |
| Wed 25 Nov | send-him-tangle-free-brushing.png | handoff | pin-ho-tangle-free-brushing | Hair tips for dads |
| Fri 27 Nov | clip-back-baby-wisps-step-by-step.png | step strip | pin-st-clip-back-baby-wisps | Easy toddler hairstyles |

## Alt text

Pinterest's template has no alt text column, so add it to each pin after the
upload (Edit Pin > Alt text).

### batch-1.csv

1. halloween-hair-in-ten-minutes.png: Three mannequin heads from behind wearing a high ponytail, two even pigtails and a half-up, half-down, under the headline Halloween hair in ten minutes.

### batch-1-part-1.csv and batch-1-part-2.csv, in publishing order

1. two-even-pigtails-in-6-minutes.png: Two even pigtails with pink elastics on either side of a center part, on a mannequin head seen from behind, under the headline Two even pigtails in 6 minutes.
2. send-him-classic-ponytail.png: A smooth classic ponytail with a pink elastic on a mannequin head seen from behind, under the headline Dad's on the school run? Send him this.
3. two-even-pigtails-step-by-step.png: Three numbered pictures of hands parting hair down the middle and tying a pigtail on each side of a mannequin head, then the finished pigtails.
4. classic-ponytail-in-3-minutes.png: A smooth classic ponytail with a pink elastic on a mannequin head seen from behind, under the headline A classic ponytail in 3 minutes.
5. send-him-high-ponytail.png: A high ponytail with a pink elastic on a mannequin head seen from behind, under the headline Hand him the hairbrush.
6. classic-ponytail-step-by-step.png: Three numbered pictures of hands gathering, positioning and tying a ponytail on a mannequin head, then the finished classic ponytail.
7. half-up-half-down-in-4-minutes.png: A half-up, half-down style with the top section tied in a pink elastic and the rest loose, on a mannequin head seen from behind, under the headline Half-up, half-down in 4 minutes.
8. send-him-two-even-pigtails.png: Two even pigtails with pink elastics on a mannequin head seen from behind, under the headline Weekend with dad: a style he can do.
9. half-up-half-down-step-by-step.png: Three numbered pictures of hands dividing off the top half of the hair on a mannequin head and tying it, then the finished half-up, half-down.
10. high-ponytail-in-4-minutes.png: A high ponytail with a pink elastic on a mannequin head seen from behind, under the headline A high ponytail in 4 minutes.
11. send-him-half-up-half-down.png: A half-up, half-down style with a pink elastic on a mannequin head seen from behind, under the headline Away for a few days? Leave him this.
12. high-ponytail-step-by-step.png: Three numbered pictures of hands gathering hair to the top of a mannequin head, checking it and tying it, then the finished high ponytail.
13. tangle-free-brushing-in-2-minutes.png: Long, smooth brushed hair on a mannequin head seen from behind, under the headline Tangle-free brushing in 2 minutes.
14. send-him-clip-back-baby-wisps.png: Short hair with the front wisps held back by a pink snap clip, on a mannequin head seen from the side, under the headline A first style for dad: one minute.
15. tangle-free-brushing-step-by-step.png: Three numbered pictures of hands combing long hair on a mannequin head, from the ends upward, then the smooth finished hair.
16. clip-back-baby-wisps-in-1-minute.png: Short hair with the front wisps held back by a pink snap clip, on a mannequin head seen from the side, under the headline Baby wisps clipped back in one minute.
17. send-him-tangle-free-brushing.png: Long, smooth brushed hair on a mannequin head seen from behind, under the headline Tears at brushing time? Send him the method.
18. clip-back-baby-wisps-step-by-step.png: Three numbered pictures of a hand combing, gathering and clipping the front wisps on a mannequin head, then the finished clip-back.
