# Winter v4: fixed arithmetic plus standing pantry, only two gated scenarios

Prior v3 results remain frozen. Same seeds, same 61-day September on-ramp, same 60-day winter window, and exactly the original November autumn-store bonus. No new income or coal price tuning.

| Scenario | Reached Nov | 60-day survivors | Winter full-life | Coal-empty ticks | Dry-room loss/recovery | Failure loops | Runtime ms |
|---|---:|---:|---:|---:|---|---|---:|
| september_onramp_gated | 0/10 | 0/10 | 0/10 | 0 | 0/0 | {"food_refill_loop_no_cookable_servings":10} | 57368 |
| november_autumn_stores_gated | 10/10 | 0/10 | 6/10 | 5529 | 0/0 | {"food_refill_loop_no_cookable_servings":10} | 7914 |

| Variant/seed | Death/final date | Survived | Wallet | Hunger | Thirst | Health | Coal | Food equivalents | Cause/failed loop |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| september_onramp_gated/1 | 1899-10-26 | false | 7 | 100.0 | 48.0 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/2 | 1899-10-21 | false | 6 | 100.0 | 57.3 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/3 | 1899-10-21 | false | 6 | 100.0 | 56.2 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/4 | 1899-10-21 | false | 13 | 100.0 | 85.4 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/5 | 1899-10-19 | false | 13 | 100.0 | 86.6 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/6 | 1899-10-25 | false | 3 | 100.0 | 57.3 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/7 | 1899-10-21 | false | 4 | 100.0 | 74.9 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/8 | 1899-10-21 | false | 4 | 100.0 | 33.9 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/9 | 1899-10-29 | false | 1 | 100.0 | 28.1 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| september_onramp_gated/10 | 1899-10-21 | false | 6 | 100.0 | 26.1 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/1 | 1899-11-15 | false | 6 | 100.0 | 53.8 | 0.0 | 1 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/2 | 1899-11-28 | false | 0 | 100.0 | 12.9 | 0.0 | 3 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/3 | 1899-11-15 | false | 6 | 100.0 | 35.1 | 0.0 | 1 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/4 | 1899-11-21 | false | 0 | 100.0 | 16.4 | 0.0 | 2 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/5 | 1899-11-23 | false | 1 | 100.0 | 33.9 | 0.0 | 1 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/6 | 1899-11-23 | false | 1 | 100.0 | 2.3 | 0.0 | 1 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/7 | 1899-11-15 | false | 1 | 100.0 | 17.9 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/8 | 1899-11-16 | false | 6 | 100.0 | 24.6 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/9 | 1899-11-15 | false | 6 | 100.0 | 66.3 | 0.0 | 0 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |
| november_autumn_stores_gated/10 | 1899-11-21 | false | 0 | 100.0 | 42.1 | 0.0 | 2 stock-outs | 0 | starvation / food_refill_loop_no_cookable_servings |

All daily wallets, actual goal selections, needs and winter cold losses, coal outages, pre-November failures and eight-action full-life flags are in the unedited JSON.

Limitations: a labeled death cause is not sufficient causal diagnosis. Where two resource loops fail together, the last-row loop label is the primary observed missing supply, not a complete counterfactual attribution. Existing v3 scenario resource boosts remain explicit. The standing pantry habit was not learned from a folio.
