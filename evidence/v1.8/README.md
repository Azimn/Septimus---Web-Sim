# v1.8 preregistered year-scale acceptance and measurement protocol

The 30-day experimental recurrence period is **30 consecutive simulation days**, not a Gregorian month or a clock conversion. Monthly series are anchored on offsets 8, 16, 23, with deadlines on offsets 10, 18, 25. The daily hearth is a one-day series. The first period keeps the historical legacy IDs; later instances carry @02, @03, etc. A missed instance remains broken, and an unfinished predecessor is broken with an explicit supersession cause when a successor opens. A broken series never cancels itself.

The year probe must run seed 11 for **365** consecutive days. The matched adversarial half-year must run seed 14 for **180** consecutive days, without forced rescue. Each ordinary day uses 1,000 native ticks (one simulated day) from the START @250 clock. An explicitly progressing external world clock continues to register obligations after death, but the body is never resurrected. Scenario-sized unit tests are in tests/v18.test.js. Long evidence is run separately in the workflow and emitted from the exact source commit.

## Declared invariant scorecard, fixed before results

| Invariant | Measurement and threshold |
|---|---|
| noDeath | No death receipt; alive at terminal tick |
| noFullDaySoftlock | At least one completed activity in each full elapsed day |
| noSustainedTwoActionCollapse | No pair of consecutive elapsed days within a 30-day window with two or fewer distinct completed action kinds |
| healthWithinBounds | Day-end health in [0, 100] and finite |
| nonnegativeStores | Every day-end store is nonnegative and finite |
| noSilentTopups | No unattended legacy intervention batches; fresh/preserved batch totals reconcile to store totals each day |
| seriesAllAccounted | Every series instance has a generation event (except historically bootstrapped C1), and is kept, broken with cause, or not-yet-due at the cutoff |
| relationshipBounds | Both lived trust values in [-100, 99.99] each day |
| monthlyHarvestWasteReported | A numeric harvest waste sum in every 30-day period, including zeros |
| stateGrowthReported | Event count and byte length of the full serialized state at day 0 and every 30 days (including last partial period) |
| settlementReconciles | Every issued invoice reconciles opening debt plus source-linked deliveries, and every settled statement reconciles payment plus carry |
| scienceSkillSoftCeiling | Science skill no greater than **600** at the final day; also record first crossing after day 120 |

All listed rows are reported as boolean pass/fail; scientific concerns are not hidden by aggregation. The `scienceSkillSoftCeiling` is deliberately a diagnostic threshold, not a hard invariant of physical conservation. If inflation occurs, **report it as a slow failure and propose diminishing gains plus nonuse decay; do not tune mid-run or silently retry**. Other failures likewise remain negative evidence.

## Required trajectories

Each 30-day boundary records skills, formed habits, all quirks, active-bonus quirks, both lived trusts and encounter counts, activity distributions, finite stores, health, cumulative event count, full save size in UTF-8 bytes and series summaries. The day-1 and day-365 snapshots supply the Article 27 comparison; predictor accuracy is reported independently by 90-day quarter.

The ledger reports monthly harvest waste, preserved stock expiring at 90-day shelf life, and preserved stock eaten from oldest-first batches. Quirk influence is sampled from real choice receipts. Social-account events include source event IDs for deliveries, spot goods trades (whose account charges are zero), and in-kind settlement or recorded credit and friction.

Caution: a healthy year does not imply indefinite viability. The simulation has a finite number of Article tests, simple scripted counterpart actors, and no language-model admissions. Article 23 stays Unassessable.
