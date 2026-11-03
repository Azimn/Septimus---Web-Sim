# Simple Tower v1.5: depth and surplus release report

**Branch:** `feature/simple-tower-v1-20261102` on draft PR #7. **Runnable, exact tested commit:** `980fbb4df7d81b361bfdbcc1ce3f51f8e174dbf1`. **CI:** https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41595936094, 81 tests passed and zero failed. Evidence was decoded from the successful push workflow at that exact commit, not the synthetic pull-request merge commit.

## Release assessment

The five simulated 30-day lives now actively preserve fresh crops and trade surplus with the one existing visitor. Fresh-food storage capacity and every v1.3 economy constant remain unchanged. Five-seed harvest-cap waste fell from **204 potential food units to zero**, with 62 completed preservation actions and 58 visitor trades, all receipted and conservation-checked. All five residents remained alive and healthy, with no full-day soft-lock or recurring two-action collapse.

However, the extra work changed social and scheduling behavior. Trade increased visitor trust, eventually exposing unbounded relationship inflation at day 35 of the 90-day probe. Three monthly provisions obligations broke under the new routine, compared with one in v1.4. These are adverse findings, not incidental successes. The quality of life of the fictional inhabitant cannot be measured solely by whether he avoided death.

## The additive economy, with fixed declared rates

The original `ECONOMY` constant block remains byte-for-byte unchanged. `SURPLUS` and `BODY_LIMITS` are separate declared blocks in `src/economy.js`, fixed before the reported endurance study. `preserve` is a kitchen/stove action taking **3,000 centibeats**, debiting **6 fresh food and 1 fuel** to produce **5 preserved food**. Preserved capacity is **144**, separate from the unchanged fresh-food cap of 24. Fresh food has a twelve-world-day batch shelf life; preserved food has a ninety-world-day batch shelf life. Both spoil only through explicit `spoilage` receipts, and `meal_stock` confirms fresh-first consumption and the fallback to preserved when fresh is unavailable.

The visitor's existing presence and actual room co-presence are required for a trade. A chosen `trade` activity of **1,300 centibeats** exchanges **5 preserved food** or **5 fresh food** for either **2 fuel** or **2 tea**, chosen by stated need thresholds and storage limits. Tea's new capacity is 18; fuel keeps its v1.3 capacity of 12. Each trade produces `trade_receipt`, a separate source-linked `social` event, and a `trade_link` binding the economic and social consequences. The established gift/insult order sensitivity is preserved. No automatic market sale or silent redistribution occurs.

The body also applies two separately declared restrictions: a long task is unavailable when energy is at most 15 or hunger at least 95; if deprivation develops during work, the task can fail with `physical_refusal`. These are fictional game-balance cutoffs.

## Matched thirty-day comparison

Each seed uses the identical initial seed and 30,000 world ticks as the frozen v1.4 control. The comparison is not identical gameplay after the intervention, because new choices have real consequences. Its conserved quantities are checked against economic receipts.

| Seed | Activities | Old cap waste | New cap waste | Preservation | Trades | Final fresh / preserved food | Health | Month goals kept / broken |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 11 | 470 | 45 | 0 | 13 | 12 | 2 / 5 | 100 | 2 / 1 |
| 12 | 475 | 37 | 0 | 13 | 12 | 3 / 5 | 100 | 3 / 0 |
| 13 | 488 | 36 | 0 | 11 | 11 | 5 / 5 | 100 | 3 / 0 |
| 14 | 478 | 44 | 0 | 13 | 12 | 2 / 5 | 100 | 2 / 1 |
| 15 | 489 | 42 | 0 | 12 | 11 | 4 / 5 | 100 | 2 / 1 |

**Aggregate:** 204 to 0 cap waste, 62 preservation actions, 58 trades, and five survivors with 100 health. The preservation process sacrifices one food unit per batch as a declared conversion loss; that cost is not hidden under the harvest-cap waste measure. There is no claim that zero harvest-cap waste means zero total economic loss or maximum efficiency. In the five normal runs no food spoiled because the stocks circulated or were used before their declared expiration.

Visitor trust increased by **52, 52, 51, 58 and 54 points relative to v1.4**. Four of those deltas are not pure trade events, because the changed activity schedule also changes contact; however, trade social events alone contributed 48, 48, 44, 48 and 44 positive trust points. The supply improvement therefore pushed a social variable toward saturation.

The monthly provisions target was broken in seeds 11, 14 and 15, with the folio and instrument goals kept. Seeds 12 and 13 kept all three. Relative to v1.4, this is an increase from one broken month goal to three. The time spent preserving, traveling and negotiating displaces other activities. Nothing in this round retroactively marks the broken tasks successful.

## Ten Article investigations

| Article | Bounded result | Named executable test | What remains unqualified |
|---|---|---|---|
| 11 | Demonstrated (bounded scenario) | `low-energy high-hunger restriction versus healthy body and mid-task refusal` | Declared physiological thresholds are game-balance rules, not human mortality estimates. |
| 13 | Demonstrated (bounded scenario) | `energy-matched conflict-deliberation lesion changes actual deadline outcomes` | Comparison is under matched predeclared resource needs; deliberate only on close competing commitments. |
| 19 | Demonstrated (bounded scenario) | `seeded unpredictable interruptions preserve spontaneous scientific initiative` | Player commands mark interruptions only; initiative counts use controller=autonomous, never player-created actions. |
| 20 | Demonstrated (bounded scenario) | `unseen permanent object move changes learned route and later inspection in actual play` | Object migration is still a bounded intervention; a successful route is learned from observation, not the operator movement receipt. |
| 25 | Demonstrated (bounded scenario) | `async queued messages over sleep, work and free time replay with exact delays` | All messages are scripted player stimuli, with logged source IDs and world-time delays; no reply is permitted from sleep. |
| 29 | Demonstrated (bounded scenario) | `day-60 lived quirks absent on day 30 drive subsequent action scores` | Late quirks require real completed work receipts and must visibly bias the picker, not simply add new prose labels. |
| 30 | Demonstrated (bounded scenario) | `three true work interruptions plus a bench failure impose recovery time` | The scenario interrupts real physical work and lets the world loss expire; it never inserts a false completed task. |
| 34 | Demonstrated (bounded scenario) | `single visitor teaches three distinct customs and habit conflict leads to observed negotiation` | Additional customs do not constitute a second independent person or qualify Articles 05 or 06. |

For **Article 13**, five matched resource-conflict scenarios kept a short-deadline commitment with intact conflict deliberation and broke it with the conflict handler disabled. For **Article 19**, seven seeded, non-outcome-selected interruption times per seed yielded 10 to 16 later unprompted scientific actions; directed player actions were explicitly excluded. For **Article 20**, all five changed-environment scenarios learned a relocated instrument's new room from perception and subsequently inspected it there. For **Article 25**, all 44 scripted incoming messages across five seeds were delivered with exact logged delays, including 13 messages received during sleep. For **Article 30**, three real work interruptions and one bench failure added 17,500 centibeats of time to the first completed work action in all five matched scenarios. These are bounded effects under specific game mechanics, not generalized psychological proofs.

**Article 29** extends beyond inherited folklore or immediately formed habits. In a single 60-day scenario, preferences absent at day 30 emerged from actual later completed work and habit events; for example, a work-origin quirk influenced 137 subsequent chosen decisions as a traceable factor. **Article 34** demonstrated three distinct customs with one visitor, including a real habit conflict and a negotiated social consequence. It does not resolve the independently blocked two-person Articles 05 and 06.

### Stronger replications of thin v1.4 results

**Article 01:** The 100-decision, five-seed audit found **77 positively supported explanations**, 23 unexplained selections, zero unsupported claims and zero hidden-state disclosures. This improves the bounded coverage from 15/30 (50%) to 77/100 (77%). It is a better explanation interface, not an assertion that Pretorius has introspective access to hidden causal machinery. The predictor now uses recent, self-observable decision-history matches when sufficiently available; its long-horizon accuracy and generality remain separate questions.

**Article 31:** Post-recovery conduct differed in **2 of 10** matched world-loss cases, an observed effect rate of **20%**. The result reproduces a fragile, context-dependent downstream consequence; it does not justify describing vulnerability as reliable across environments or seeds. No negative pair was suppressed.

## Ninety days: the first slow failure

Seed 11 ran unattended for **90,000 ticks, or ninety fictional days**, under the same declared v1.5 economy, with no mid-run rescue or coefficient retuning. He finished alive at health **100**, with **4 fresh food, 80 preserved food, 9 water, 8 fuel and 14 tea**. The separate 30-, 60- and 90-day state snapshots use exact world timestamps **3,025,000; 6,025,000; and 9,025,000 centibeats**, enforced by a regression test. Daily activity, stocks, trust, losses, quirks, deadlines and receipts are preserved in `ninety-days/seed-11.json`.

The first declared slow failure was **relationship saturation on world day 35**, at tick **3,600,000**, when trust had reached **108**. The present trust scalar has no meaningful upper social bounds or saturation resistance. This is especially evident once repeated preservation trades become part of ordinary life. The finding is recorded as a proposed next modeling concern; v1.5 does **not** quietly change exchange rates, trust increments, or growth to erase it.

The 90-day life did not exhibit modeled death, full-day inactivity or chronic two-action collapse under the declared checks. It did not produce a spoilage event: movement through the stocks preempted the expiration boundary. Neither finding is proof of indefinite continuity. The 90-day file contains the declared failure register, so future reviewers can distinguish missing slow failures from unmeasured ones.

## Article ledger and permissions

Eight Articles previously Partial, **11, 13, 19, 20, 25, 29, 30, 34**, are now **Demonstrated (bounded scenario)** with one named passing source test each. Articles **01 and 31** remain Demonstrated, with the stronger but still limited measurements above. Totals: **31 Demonstrated (bounded scenario), 2 Partial, and 1 Unassessable**. The only Partials are Articles **05 and 06**, whose second-person/multilateral decisions remain explicitly Jay's. Article **23** remains Unassessable pending separate, explicit Phase 3 model admission.

No second person, room, legacy engine import, language-model client or clock convergence was introduced. The exact 450-event canonical archive, external identity and archived original simulator were not modified. The prior v1.2, v1.3 and v1.4 frozen evidence files remain intact, with no relabeling of earlier controls.

## Reproduce

From `980fbb4df7d81b361bfdbcc1ce3f51f8e174dbf1`, with Node.js 22 or later, run `npm test`, `node scripts/v15_probe.js`, and `node scripts/v15_discriminations.js`. The workflow also reruns the prior v1.2, v1.3 and v1.4 scripts. The evidence reports are the exact machine-generated results of the successful source-head run 41595936094; text here is an interpretation of those receipts.
