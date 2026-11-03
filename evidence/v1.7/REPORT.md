# Simple Tower v1.7: social consequence and long-horizon repair

**Working branch:** `feature/simple-tower-v1-20261102` (draft PR #7, unmerged).
**Exact tested source:** `c19a821335943d17251aecbc8a08f96b2576e067`.
**Passing push workflow:** https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41645735288.
**Mechanical tests:** 111 passed, zero failed, no skips. The exact-source push workflow also executed the previously retained v1.2 through v1.6 evidence runners and the new v1.7 longitudinal runner.

## Design boundary

Septimus Pretorius is the only kernel inhabitant. Rosa Brandl and Mr. McFeely are intentionally small scripted social counterparts, with separate identities, routes, histories, knowledge and rules. They do not receive Pretorius's cognition, memories, subjective needs, personal diary, or autonomous language-model control. This is a deliberate experimental control, not a missing feature to be backfilled.

## What actually changed

**Social trust:** positive earned updates now diminish as positive lived trust rises, while directly observed insults and documented custom conflicts retain negative consequences. A declared `[-100, 99.99]` safety range prevents numerical overflow. Trust is still traceable to event IDs and not a person-ID lookup; the Article 05 witness-swap control remains passing. Rosa's established tea and instrument custom disputes now create an actual witnessed friction event (negative 4) before acknowledgment and negotiation (positive, subject to diminishing returns). Repeated trades continue to debit finite stores and produce social receipts, but cannot make trust grow without bounds.

**Commitments:** the v1.5 provisions target now explicitly means **12 physically stored edible portions, fresh plus preserved**. Stock in the garden, expected deliveries, and planned crops are not counted. Two completed `tend` sessions are still required; a calendar goal does not complete from a score alone. Multi-session obligations gain attention when opened, increasing as their deadlines approach rather than appearing urgent only when completion is already impractical. The standing daily hearth obligations and ordinary bodily needs remain active.

**Garden capacity:** a ripe crop is held in the existing garden plot until the full eight-unit harvest fits in the finite 24-unit fresh-food store. The harvest is not split or made larger. A manually invoked harvest while storage is inadequate records `harvest_deferred`, without granting food. Its physical receipt is generated only when a legal harvest occurs.

## Five 30-day seeded lives

| Seed | Rosa trust at day 30 | Rosa friction events | McFeely trust at day 30 | Merchant conversations | Carrier conversations | Monthly commitments kept | Harvest waste |
|---|---:|---:|---:|---:|---:|---:|---:|
| 11 | 33.12 | 8 | 23.09 | 5 | 13 | 3/3 | 0 |
| 12 | 30.93 | 8 | 23.09 | 5 | 13 | 3/3 | 0 |
| 13 | 35.85 | 8 | 23.09 | 5 | 13 | 3/3 | 0 |
| 14 | 34.31 | 8 | 23.09 | 5 | 13 | 3/3 | 0 |
| 15 | 35.68 | 7 | 23.09 | 5 | 13 | 3/3 | 0 |

For every seed, all three calendar obligations were kept with actual action and commitment receipts: folios in two sessions, instrument inspection in two sessions, and tending twice while holding at least twelve edible portions. The seed-specific JSON files include the source event IDs and clock ticks. All five maintained health and conserved finite preservation/trade resources.

The relationships now show different causal trajectories. Rosa's trust has seven or eight negative friction receipts per 30-day seed. McFeely's simplified delivery relationship has no negative social events in these baseline seeds. The difference reflects witnessed customs, time and activities, not hard-coded differential treatment by person identifier. His carrier role remains strictly outside the tower.

## Ninety-day unattended life

Source seed 11, 90,000 actual simulation ticks, alive, health **100**. Checkpoint lived trust: day 30 **33.12**, day 60 **42.17**, day 90 **47.37**. The frozen v1.5 evidence recorded trust **240** at day 90 and a first slow-failure alert on day 35 (relationship saturation). Current checks record **no slow-failure alert**.

The three first-month undertakings are all `kept` and their real `progressCount` values are two. The former v1.5 provisions obligation was broken. The revised one was kept at tick **2501800**. There were **0** wasted units across the full 90-day life, compared with the earlier v1.7 intermediate run which wasted three at day 86. Terminal inventory is 17 fresh food, 140 preserved food, 11 fuel, 6 water and 16 tea. This inventory is produced by real receipts and finite capacity rules, not simulation top-ups.

**Important limit:** the current `MONTH-*` schedule opens three obligations during the first calendar month. The 90-day probe verifies that those obligations survive until their deadlines and are discharged, not that new monthly obligations recur in months two and three. The absence of a slow-failure alert means no failures among the currently declared checks, not that the simulation is indefinitely sustainable or qualified as a general human model. The character fidelity review remains separate and ungraded.

## Regressions, controls and honesty of testing

A former v1.5 regression mistakenly required `firstSlowFailure` to be non-null. It was repaired to enforce the substantive rule, no detected slow failure before day 30, while allowing improvements to produce no failure at all. The test still requires 90,000 native ticks and exact day-30/60/90 snapshot timestamps. New tests specifically require physical harvest deferral, all five three-commitment success receipts, source-linked negative and positive social events, no trust overflow and no 90-day recorded harvest waste.

## Custody and provenance

The entire canonical memory archive remains at Git blob `718dcc2d5ba4feccdef1690d447edfcebaa9bfb5` (450 records); external identity remains `239d876a44bd0b641698b867d938d0489615d6ed`; archived old simulator remains tree `f56d0612452dcfeebaafc51861a313a6c486a399`. The compiled v1.7 data comes from the exact successful push run. v1.5 and v1.6 evidence files remain frozen. No additional actor, kernel, language model, room, or clock conversion was introduced.

**Article grades unchanged from v1.6:** 33 Demonstrated (bounded scenarios), zero Partial, Article 23 Unassessable. New robustness results strengthen the bounded mechanisms but do not establish any new category of artificial personhood or consciousness.
