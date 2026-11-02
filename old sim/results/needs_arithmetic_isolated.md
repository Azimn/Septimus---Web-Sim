# Corrected isolated-need oracle (untouched simulation) and original allocation

Scripted oracle supplies materials externally and silences unrelated needs, providing a **ceiling**, not an ordinary character run. Baseline mechanics are unchanged. This corrects the first diagnostic instrument which mistakenly allowed unrelated cold-health damage to kill other-need probes. The first diagnostic is retained separately as an invalid ceiling test.

| Need | Ticks observed | Maintains target / death | Actions | Restoration units per 144 ticks | Peak meter | Warm ticks |
|---|---:|---|---:|---:|---:|---:|
| hunger | 8640 | survived isolated probe | 141 | 176.25 | 54.00 | 0 |
| thirst | 8640 | survived isolated probe | 166 | 215.80 | 59.67 | 0 |
| fatigue | 8640 | survived isolated probe | 159 | 111.30 | 65.40 | 0 |
| bladder | 8640 | survived isolated probe | 137 | 205.50 | 64.48 | 0 |
| boredom | 8640 | survived isolated probe | 218 | 79.93 | 53.60 | 0 |
| warmth | 8640 | survived isolated probe | 346 | 149.93 | 100.00 | 8640 |
| health_cold_bedroom | 616 | DIED: starvation | 0 | 0.00 | 100.00 | 0 |
| health_heated_kitchen | 8640 | survived isolated probe | 346 | 149.93 | 100.00 | 8640 |

The warm kitchen control and cold-bedroom control test health damage separately. No existing healing action exists. Model defects need not imply every isolated oracle dies.

| Variant/seed | Final date | Alive-week ticks | Sleep | Heat | Eat/cook | Drink | Toilet | Travel | Idle | Work | Other | Wallet | Hunger | Room |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| september_onramp_gated/1 | 1899-10-16 | 1008 | 0 | 0 | 23 | 17 | 0 | 269 | 0 | 0 | 699 | 26 | 100.00 | kitchen |
| september_onramp_gated/2 | 1899-09-12 | 1008 | 4 | 0 | 26 | 18 | 5 | 527 | 0 | 4 | 424 | 83 | 100.00 | garden |
| september_onramp_gated/3 | 1899-10-13 | 1008 | 0 | 0 | 23 | 16 | 0 | 271 | 0 | 0 | 698 | 31 | 100.00 | kitchen |
| september_onramp_gated/4 | 1899-10-15 | 1008 | 0 | 0 | 23 | 16 | 0 | 292 | 0 | 0 | 677 | 31 | 100.00 | kitchen |
| september_onramp_gated/5 | 1899-10-27 | 1008 | 0 | 0 | 22 | 18 | 0 | 294 | 0 | 0 | 674 | 1 | 100.00 | kitchen |
| september_onramp_gated/6 | 1899-10-28 | 1008 | 0 | 0 | 22 | 18 | 0 | 244 | 0 | 0 | 724 | 4 | 100.00 | kitchen |
| september_onramp_gated/7 | 1899-10-14 | 1008 | 0 | 0 | 23 | 16 | 0 | 270 | 0 | 0 | 699 | 19 | 100.00 | kitchen |
| september_onramp_gated/8 | 1899-10-16 | 1008 | 0 | 0 | 23 | 16 | 0 | 298 | 0 | 0 | 671 | 14 | 100.00 | kitchen |
| september_onramp_gated/9 | 1899-10-16 | 1008 | 0 | 0 | 23 | 16 | 0 | 265 | 0 | 0 | 704 | 9 | 100.00 | kitchen |
| september_onramp_gated/10 | 1899-10-11 | 1008 | 0 | 0 | 23 | 16 | 0 | 271 | 0 | 0 | 698 | 31 | 100.00 | kitchen |
| november_autumn_stores_gated/1 | 1899-11-15 | 1008 | 15 | 28 | 26 | 24 | 14 | 874 | 0 | 2 | 25 | 7 | 100.00 | hall |
| november_autumn_stores_gated/2 | 1899-11-12 | 1008 | 12 | 26 | 27 | 21 | 13 | 878 | 0 | 3 | 28 | 38 | 100.00 | kitchen |
| november_autumn_stores_gated/3 | 1899-11-15 | 1008 | 14 | 27 | 26 | 22 | 14 | 877 | 0 | 6 | 22 | 7 | 100.00 | kitchen |
| november_autumn_stores_gated/4 | 1899-11-25 | 1008 | 14 | 0 | 26 | 29 | 11 | 679 | 0 | 0 | 249 | 0 | 100.00 | hall |
| november_autumn_stores_gated/5 | 1899-11-25 | 1008 | 12 | 0 | 26 | 24 | 9 | 634 | 0 | 0 | 303 | 0 | 100.00 | library |
| november_autumn_stores_gated/6 | 1899-11-25 | 1008 | 18 | 0 | 26 | 27 | 14 | 859 | 0 | 0 | 64 | 0 | 100.00 | hall |
| november_autumn_stores_gated/7 | 1899-11-24 | 1008 | 12 | 0 | 26 | 22 | 9 | 628 | 0 | 0 | 311 | 0 | 100.00 | hall |
| november_autumn_stores_gated/8 | 1899-11-22 | 1008 | 16 | 10 | 26 | 27 | 14 | 876 | 0 | 0 | 39 | 0 | 100.00 | hall |
| november_autumn_stores_gated/9 | 1899-11-15 | 1008 | 13 | 29 | 24 | 19 | 13 | 867 | 0 | 7 | 36 | 6 | 100.00 | kitchen |
| november_autumn_stores_gated/10 | 1899-11-25 | 1008 | 11 | 0 | 24 | 22 | 8 | 597 | 0 | 0 | 346 | 0 | 100.00 | hall |
| september_onramp_ungated/1 | 1899-10-16 | 1008 | 0 | 0 | 23 | 17 | 0 | 269 | 0 | 0 | 699 | 26 | 100.00 | kitchen |
| september_onramp_ungated/2 | 1899-09-12 | 1008 | 4 | 0 | 26 | 18 | 5 | 527 | 0 | 4 | 424 | 83 | 100.00 | garden |
| september_onramp_ungated/3 | 1899-10-13 | 1008 | 0 | 0 | 23 | 16 | 0 | 271 | 0 | 0 | 698 | 31 | 100.00 | kitchen |
| september_onramp_ungated/4 | 1899-10-15 | 1008 | 0 | 0 | 23 | 16 | 0 | 292 | 0 | 0 | 677 | 31 | 100.00 | kitchen |
| september_onramp_ungated/5 | 1899-10-27 | 1008 | 0 | 0 | 22 | 18 | 0 | 294 | 0 | 0 | 674 | 1 | 100.00 | kitchen |
| september_onramp_ungated/6 | 1899-10-28 | 1008 | 0 | 0 | 22 | 18 | 0 | 244 | 0 | 0 | 724 | 4 | 100.00 | kitchen |
| september_onramp_ungated/7 | 1899-10-14 | 1008 | 0 | 0 | 23 | 16 | 0 | 270 | 0 | 0 | 699 | 19 | 100.00 | kitchen |
| september_onramp_ungated/8 | 1899-10-16 | 1008 | 0 | 0 | 23 | 16 | 0 | 298 | 0 | 0 | 671 | 14 | 100.00 | kitchen |
| september_onramp_ungated/9 | 1899-10-16 | 1008 | 0 | 0 | 23 | 16 | 0 | 265 | 0 | 0 | 704 | 9 | 100.00 | kitchen |
| september_onramp_ungated/10 | 1899-10-11 | 1008 | 0 | 0 | 23 | 16 | 0 | 271 | 0 | 0 | 698 | 31 | 100.00 | kitchen |

Each row counts exactly one use of each lived tick. The complete JSON contains last-week need samples and pantry stock, including seed(s) that die with substantial money. These are measurements on v3, not a balance intervention.
