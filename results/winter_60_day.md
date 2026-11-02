# Winter survival benchmark: 60 days (no tuning)

Measurement: November 1, 1899 (calendar day 124) through 60 simulated days, 10 fixed seeds. Runtime 4128 ms.

Survived 0/10, full-life 5/10. Death causes: {"starvation":10}. Total coal-empty ticks 10289. Library dry-room losses 0, recoveries 0.

| Seed | Ticks | Alive / death | Final wallet | Dry losses / recovery | Coal stock-outs | Full-life | Runtime ms |
|---|---:|---|---:|---|---:|---|---:|
| 1 | 1633 | starvation | 9 | 0 / 0 | 2 | false | 270 |
| 2 | 1605 | starvation | 9 | 0 / 0 | 2 | false | 243 |
| 3 | 1197 | starvation | 9 | 0 / 0 | 2 | false | 152 |
| 4 | 1977 | starvation | 10 | 0 / 0 | 2 | true | 298 |
| 5 | 1211 | starvation | 9 | 0 / 0 | 1 | false | 143 |
| 6 | 2812 | starvation | 3 | 0 / 0 | 3 | true | 551 |
| 7 | 1675 | starvation | 9 | 0 / 0 | 2 | false | 237 |
| 8 | 3414 | starvation | 3 | 0 / 0 | 3 | true | 737 |
| 9 | 3371 | starvation | 3 | 0 / 0 | 3 | true | 761 |
| 10 | 3329 | starvation | 3 | 0 / 0 | 3 | true | 725 |

Full daily wallet and health trajectories, cold-stock intervals and damage transitions for each seed are in winter_60_day.json.

Limitations: these are simplified 1899 scenario dynamics, starting with July-style initial supplies shifted to November; the model does not simulate every exposure consequence or real historical prices. The winter benchmark is an observation, not a gate and no survival tuning was done.
