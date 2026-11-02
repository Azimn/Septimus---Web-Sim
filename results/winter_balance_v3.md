# Winter v3: declared fair spawns, needs floor, and at most one economy adjustment

Original November v2 benchmark and its separate pre-change diagnostic remain frozen. These are **scenario comparisons**, not retroactively amended controls.
Autumn-store assumption: {"coalDry":20,"vegetables":8,"grain":6,"milk":4,"meals":6,"extraWallet":0}; September on-ramp: 61 days before November 1. Each variant is seeds 1..10 and measures 60 winter days or earlier death.
Economy adjustment applied: YES, research-payment receipt delay 22 to 12 ticks only. Total measured Node runtime: 139741 ms.

| Variant | November reached | 60-day survivors | Winter full-life | Coal-empty ticks | Dry loss/recovery | Final wallets | Runtime ms |
|---|---:|---:|---:|---:|---|---|---:|
| september_onramp_ungated | 0/10 | 0/10 | 0/10 | 0 | 0/0 | 38,95,43,43,1,4,43,26,21,43 | 36904 |
| november_autumn_stores_ungated | 10/10 | 0/10 | 10/10 | 10415 | 0/0 | 2,3,2,1,3,3,2,1,0,1 | 15525 |
| september_onramp_gated | 0/10 | 0/10 | 0/10 | 0 | 0/0 | 26,83,31,31,1,4,19,14,9,31 | 36821 |
| november_autumn_stores_gated | 10/10 | 0/10 | 7/10 | 7522 | 0/0 | 7,38,7,0,0,0,0,0,6,0 | 7422 |
| september_onramp_gated_report_delay_12 | 0/10 | 0/10 | 0/10 | 0 | 0/0 | 64,31,1,1,31,19,31,15,25,6 | 35259 |
| november_autumn_stores_gated_report_delay_12 | 10/10 | 0/10 | 7/10 | 8062 | 0/0 | 7,0,7,0,0,0,0,0,6,0 | 7810 |

The JSON preserves all individual live days, daily wallets and health, hourly needs, hunger/thirst, death receipts, coal-stockout intervals, dry-room changes, full-life evidence, survival-gate scoring and action traces.

Interpretation must distinguish supply generosity from controller improvement, and survival failure from partial-life richness. Source world facts, prices, harvest yields and weather were not retuned. A conditional single report delay comparison does not validate a general economy overhaul.
