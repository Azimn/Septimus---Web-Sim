# Simple Tower v1.8: calendar recurrence and the year

**Status:** Executed, fully source-linked; not a claim of indefinite viability.
**Exact executable source:** `af899b25212df4c55f55e9a9758b4a94d33f6079`.
**Successful workflow:** https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41665810298 (119 tests passed, 0 failed).
**Git branch:** `feature/simple-tower-v1-20261102`, draft PR #7, deliberately unmerged.

## Executive result

The native simulation completed an unattended **365-day seed 11** and an unattended **180-day seed 14**. Both survived with health 100, no full-day softlocks, no two-action collapse across consecutive days, no illegal stock gains or negative inventories, no relationship bound violations and no missing recurring-instance receipts. The immutable 450-event canonical archive is unchanged.

The **first declared slow failure** is `scienceSkillSoftCeiling`, day **120**, science **637** (seed 11), threshold 600. Seed 14 independently crosses it on day **120**, science **629**. The scientific reason for counting it as a failure is straightforward: experience accrues numerically without diminishing gains or nonuse decay. As preregistered, this round reports the defect and proposes a remedy but **does not alter the skill equation or selectively re-run favorable seeds**.

Other significant negatives are the **7/12 broken provisions obligations** (seed 11), **208 preserved portions expired with zero preserved portions eaten**, a merchant-carrier relationship still rising to **95.55** at day 365, and a full save envelope growing to **43.36 MB**. These are visible results, not suppressed or marked green by narrative interpretation.

## Part A: declared series, not placed scenes

The new runtime calendar has one daily hearth rule and three 30-day series. The 30-day months are an experimental fixed interval, not Gregorian months. Opening offsets for the three monthly series are 8, 16 and 23; deadlines are offsets 10, 18 and 25, each at phase 65000. The first month's legacy IDs remain intact. Later siblings are generated as `@02`, `@03`, and onward. Every generation emits `series_instance_generated` with the rule, source tick, ordinal and previous ID. Every resolution emits a source-linked `series_outcome` with streaks, break cause where applicable and running average completion duration. A still-open predecessor is broken with the explicit `superseded_by_<id>` cause before the successor opens. A break never cancels the recurrence.

The **three-month unattended scenario** generated nine monthly instances from those rules: MONTH-FOLIO 3/3 kept, MONTH-INSTRUMENT 3/3 kept, MONTH-PROVISIONS 2/3 kept. The forced-break matched fork blocked the physical garden plot in month two. Its baseline provisions instance was **kept**; the intervention's instance was **broken**. Month three's instance still generated, then ended **broken** on its own observed merits. There were **24 more** post-break ruminations citing the failed provisions series than in the matched control. A separate test verifies the amplified salience in Pretorius's self-sheet, including the daily hearth series after two consecutive failures. A separate terminal-body test verifies that an explicitly continuing external calendar opens and breaks new instances after death without resurrecting the inhabitant. Normal actor-time `advance` retains the older terminal freeze contract.

The full 365-day series outcomes were: **MONTH-FOLIO: 12/12 kept, 0 broken; MONTH-INSTRUMENT: 12/12 kept, 0 broken; MONTH-PROVISIONS: 5/12 kept, 7 broken**. Day-to-day hearth: 365 completed, one not-yet-due successor open at the cutoff. The half-year was: **MONTH-FOLIO: 6/6 kept, 0 broken; MONTH-INSTRUMENT: 6/6 kept, 0 broken; MONTH-PROVISIONS: 4/6 kept, 2 broken**. Broken provisions are not treated as a cancelled series; each failed instance remains in the event graph with its own `deadline_missed` cause and actual progress. Their repeated occurrence suggests the narrow two-session tending requirement often conflicts with the independent crop growth cycle. Changing the goal would be a subsequent design decision, not a reinterpretation of this test.

## Recurring merchant account

At each monthly settlement visit, Rosa issues a source-linked statement with opening balance, the actual weighed `merchant_delivery` receipts, and zero-net-debt goods-for-goods `trade_receipt` entries. A physical co-present settlement removes real preserved or fresh portions and reduces the account by exactly the quantity transferred. If payment cannot cover the invoice, an open credit remainder and a witnessed negative social friction receipt are recorded. The unit tests exercise both fully paid and unpaid cases, including the friction source ID.

The year produced **12 statements and 12 witnessed settlements**, with total delivery charges **203 units**, total physical account payment **203 units**, **25** distinct spot-trade receipts and **0** natural unsettled balances. Every statement reconciles to the unit. The half-year produced **5** statements with 94 charged and 94 paid. No natural settlement friction occurred in these two lives; the controlled failure case demonstrates the path.

## Preregistered invariant scorecard

The following criteria were declared in `evidence/v1.8/README.md` before the annual run:

| Preregistered invariant | 365-day seed 11 | 180-day seed 14 |
|---|---|---|
| `noDeath` | PASS | PASS |
| `noFullDaySoftlock` | PASS | PASS |
| `noSustainedTwoActionCollapse` | PASS | PASS |
| `healthWithinBounds` | PASS | PASS |
| `nonnegativeStores` | PASS | PASS |
| `noSilentTopups` | PASS | PASS |
| `seriesAllAccounted` | PASS | PASS |
| `relationshipBounds` | PASS | PASS |
| `monthlyHarvestWasteReported` | PASS | PASS |
| `stateGrowthReported` | PASS | PASS |
| `settlementReconciles` | PASS | PASS |
| `scienceSkillSoftCeiling` | FAIL | FAIL |

The science ceiling is deliberately a diagnostic threshold and is **not** a conservation law. There were no declared failure alerts under the other eleven criteria. This is a bounded 365-day result, not proof of indefinite operation.

## Monthly waste, relationships and state growth: seed 11

| Period | Day | Harvest waste | Preserved expired | Science | Quirks | Events | Save size (MB) | Rosa trust | McFeely trust |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 30 | 0 | 0 | 158 | 15 | 3,873 | 3.69 | 33.12 | 23.09 |
| 2 | 60 | 0 | 0 | 316 | 24 | 7,605 | 7.17 | 42.19 | 40.87 |
| 3 | 90 | 0 | 0 | 475 | 25 | 11,326 | 10.67 | 49.48 | 54.55 |
| 4 | 120 | 0 | 0 | 637 | 26 | 14,978 | 14.18 | 54.40 | 64.34 |
| 5 | 150 | 0 | 4 | 804 | 27 | 18,534 | 17.62 | 55.43 | 72.01 |
| 6 | 180 | 0 | 56 | 959 | 27 | 22,216 | 21.18 | 59.28 | 78.51 |
| 7 | 210 | 0 | 12 | 1121 | 27 | 25,857 | 24.71 | 59.33 | 83.47 |
| 8 | 240 | 0 | 4 | 1288 | 28 | 29,476 | 28.24 | 60.12 | 87.29 |
| 9 | 270 | 0 | 57 | 1446 | 28 | 33,147 | 31.84 | 57.70 | 90.22 |
| 10 | 300 | 0 | 17 | 1612 | 29 | 36,773 | 35.41 | 59.18 | 92.33 |
| 11 | 330 | 0 | 2 | 1779 | 29 | 40,371 | 39.00 | 59.37 | 93.98 |
| 12 | 360 | 0 | 56 | 1938 | 30 | 44,083 | 42.69 | 57.16 | 95.37 |
| Partial 13 (5 days) | 365 | 0 | 0 | 1964 | 30 | 44,733 | 43.36 | 57.88 | 95.55 |

The thirteenth row is the final five days of the 365-day observation window, **not** a thirteenth completed 30-day billing period. All twelve complete periods recorded **zero harvest capacity waste**. Preserved expiry is physical, individually receipted, and totals **208**; `meal_stock` records show **0** consumed preserved portions. These quantities are not silently discarded.

## Day 1 vs day 365: Article 27's stronger observation

| Measure | Seed 11 day 1 | Seed 11 day 365 | Seed 14 day 1 | Seed 14 day 180 |
|---|---:|---:|---:|---:|
| Science skill | 7 | 1964 | 6 | 953 |
| Household skill | 1 | 136 | 1 | 77 |
| Formed habits | 1 | 14 | 0 | 14 |
| Quirks | 2 | 30 | 1 | 26 |
| Active-bonus quirks | 0 | 8 | 0 | 8 |
| Event-log entries | 154 | 44733 | 158 | 22274 |
| Exact save-envelope bytes | 201325 | 43355582 | 208595 | 21232808 |
| Rosa lived trust | 4.94 | 57.88 | 4.94 | 57.06 |
| McFeely lived trust | 0 | 95.55 | 0 | 78.07 |

The save size is computed from the complete `simple-tower-save-v1` payload, including deterministic-format ISO timestamp, SHA-256 integrity hash and the exact pretty-JSON serialization used by `src/store.js`. It is not just the compact state JSON length. Its day-365 size is **43.36 decimal MB**, or 41.35 MiB.

**Predictor accuracy by quarter (actual prediction receipts):** seed 11: Q1 (1-90): 390/1196 (33%); Q2 (91-180): 489/1383 (35%); Q3 (181-270): 511/1393 (37%); Q4 (271-360): 501/1394 (36%); Q5 (361-365): 28/79 (35%). Seed 14: Q1 (1-90): 388/1179 (33%); Q2 (91-180): 488/1326 (37%). The final five days of seed 11 are an incomplete fifth interval, not a fifth full quarter. The rates show only modest variation, not a compelling learned improvement over the year.

**Relationship trajectory:** Rosa shifts from a low initial lived trust to a later band around 55-60, fluctuating with learned customs and settlement. McFeely keeps accumulating positive contact and reaches 95.55, near the declared upper bound though not violating it. The two curves are separated. One appears close to a behavioral balance; the other has not established a convincing equilibrium.

**Quirk accumulation:** instead of extrapolating to 80+, the quirk count grew rapidly to 25 by day 90 and then slowly to 30 by day 365. Only 8 have active bonus parameters at the final checkpoint. The last 25 source-linked decision samples in the JSON retain the candidate quirk factors; counts alone must not be misread as 30 independent influences on every decision.

## Single most surprising curve

**Preservation became a merchant currency instead of a meal reserve.** Expired preserved portions stayed at zero for four experimental months, then accumulated to 208 lost units by day 365, while the inhabitant's `meal_stock` record never consumed preserved food. He could nevertheless survive and keep a large preserved inventory because trades and merchant settlements move that stock through economic receipts. The physical aging pipeline is working; the dietary choice rule does not rotate toward aging reserves. This is more revealing than a simple energy or food-cap failure.

Proposed follow-up, **not applied**: oldest-expiring-edible-first meal selection, with exceptions for near-spoiling fresh stock, and adversarial receipt tests. Also consider revising the month provisions target so that two realizable supply-maintenance actions are possible within its window. For the separate skill-inflation defect, use decreasing marginal skill gain and decay during prolonged nonuse, paired with a matched historical fork. None is silently introduced here.

## Provenance, bounds and exclusions

The immutable archive blob remains `718dcc2d5ba4feccdef1690d447edfcebaa9bfb5` (450 records), external identity blob `239d876a44bd0b641698b867d938d0489615d6ed`, and archived old simulator tree `f56d0612452dcfeebaafc51861a313a6c486a399`. Both counterparts remain small scripted roles; only Pretorius has a kernel. No language model, new room, new person, season/weather, or clock convergence was added. Article 23 stays Unassessable. These year observations strengthen the bounded evidence for Articles 17, 18, and 27 but do not justify changing the existing ledger grade count: **33 Demonstrated (bounded scenario), zero Partial, one Unassessable**.

**Exact evidence files:** `year-seed-11.json`, `half-year-seed-14.json`, `scenario-forced-break.json`, and `acceptance.json` alongside this report. The whole year and half-year are actual native tick runs, not extrapolations.
