# Winter v2 original policy: deterministic replay diagnosis

This script reran the original November-start seeds before any balance or controller modification. v2 result JSON only held daily wallet and health, not purchases and needs. This is independently generated receipt-level replay, not data retroactively present in v2.

| Seed | Death date | Final hunger | Final thirst | Final warmth | Food (last 7d) | Coal | Science | Other | Last goal |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 1899-11-12 | 100.0 | 21.1 | 25.0 | 12 | 13 | 0 | 0 | sleep |
| 2 | 1899-11-12 | 100.0 | 8.2 | 25.0 | 0 | 13 | 0 | 0 | sleep |
| 3 | 1899-11-09 | 100.0 | 21.1 | 25.0 | 12 | 26 | 0 | 0 | stoke_hearth |
| 4 | 1899-11-15 | 100.0 | 5.8 | 25.0 | 0 | 0 | 0 | 0 | toilet |
| 5 | 1899-11-09 | 100.0 | 22.2 | 25.0 | 12 | 26 | 0 | 0 | stoke_hearth |
| 6 | 1899-11-20 | 100.0 | 15.2 | 25.0 | 19 | 13 | 0 | 0 | sleep |
| 7 | 1899-11-12 | 100.0 | 39.8 | 25.0 | 12 | 13 | 0 | 0 | drink |
| 8 | 1899-11-25 | 100.0 | 30.4 | 25.0 | 0 | 0 | 0 | 0 | sleep |
| 9 | 1899-11-24 | 100.0 | 18.7 | 25.0 | 0 | 0 | 0 | 0 | sleep |
| 10 | 1899-11-24 | 100.0 | 44.5 | 25.0 | 0 | 0 | 0 | 0 | toilet |

Category totals (10 seeds, each final 7 lived days): {"food":67,"coal":104,"science":0,"other":0}.

All recorded physical purchases, income receipts, hourly needs and final seven-day goals appear in the JSON; death labels remain the engine’s own and are not causal diagnoses.
