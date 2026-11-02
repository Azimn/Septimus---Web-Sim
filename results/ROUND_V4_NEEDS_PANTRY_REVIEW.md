# V4 review stop: the arithmetic, pantry habit and proposed second folio set

**Scope:** `Azimn/Septimus---Web-Sim` on `main`; original canon and research results byte-identical. No LLM calls, no additional cognitive organ, no v4 folio experiment. **STOP FOR REVIEW** after these completed workstreams.

## Limitations first
The winter survival goal remains unmet: **0/10** survivors in each of the **two** requested scenarios. The September-start gated lives all died in October, before November measurement even began. All ten endowed-November lives reached the winter window, but none survived 60 days. Every terminal state had **100 hunger and zero cookable food equivalents**. The primary observed failed replenishment loop is therefore **food**, not an assumed pure wallet problem, even though several endings also had empty coal.

The isolated needs oracles artificially replenish input resources and suppress unrelated needs; their passing 60-day results establish numerical and action feasibility for the named loops, **not** joint long-run survival, and certainly not unbounded mathematical proof for all winter household conditions. Warmth is a derived room score, not an internally restoring need. The 60-day health oracle still ends at 98.75, not a proof of immortality or a warm tower. The original death classifier can label a pure cold-health death as starvation.

An audit reconciliation exception is disclosed rather than concealed: the archived v3 September experiment includes a **95-crown** ending; a separately instrumented nominally unchanged-policy September replay reported **83** for seed 2. The root of that mismatch has **not been verified**. Those figures must not be spliced together or treated as exact-replay validation. The original v3 outcome files were never rewritten.

The v4 folio policies are **unratified previews only**. Their source-inspired facts and false counterfacts are tested in an isolated module that ordinary `Simulation.choose`, `createOrganism`, and living saves do not import. E03-015 is currently inert for actual science deliveries because present catalogs do not have bulky-item metadata. The proposed facts do not constitute new character memories or outcomes of a trial.

## Workstream 1: audit was published before corrections
Source-rate audit: `docs/NEEDS_ARITHMETIC_AUDIT.md`, first committed at `71c9c05f7b30bb4b1107189c70142c76da460371`. Measured untouched-policy oracles, dying-week allocation, arithmetic inequalities and an invalid intermediate instrument are separately preserved as `results/needs_arithmetic_baseline.*` and `results/needs_arithmetic_isolated.*`. The invalid first instrument failed to isolate health damage; the corrected instrument clearly discloses external resets.

Measured at the original 144-tick day and an isolated physically routed oracle: hunger returned 176.250 points/day against accrual 129.600 (feasible); thirst 215.800 against 168.480 (feasible); bladder 205.500 against 149.760 (feasible). Cold fatigue achieved 111.300 versus 112.320 accrual (nonclosing rate in the sampled control); reflection 79.933 versus 80.640 boredom accrual (nonclosing sampled rate); cold-bedroom health had **zero** restoring action versus up to 23.4 damage/day and died after 616 ticks. At-hearth continuous warmth was feasible with external fuel, needing about 5.77 dry baskets/day, not an affordable household claim.

At least one dying gated November run allocated **874 of its final 1,008 ticks to travel** (86.7%), and only 26 to eating/cooking. The September seed 2 diagnostic had wallet 83, no meals/vegetables/milk, six grain, and hunger 100. These allocations show a significant controller travel burden and why nominal money or grain does not guarantee a cookable meal. Its source discrepancy with the v3 wallet was explicitly recorded above.

## Corrections, one at a time, with new proof after each
**A03/E03:** cold sleep fatigue relief **42 -> 44**, implementation `0cccc4407733aa18536cd65a719dac971e03cd2a`. A one-line JS comment generated an intermediate syntax red; a comment-only repair `5be7eb9c1c4b7896cd3d4ad4850dc27a3559fed1` restored the suite before the next change.

**A05/E05:** reflection boredom relief **22 -> 23**, independently committed and passing at `94ede07868c598306bb13d77b98ca705335850d3`.

**A07/E07:** completed sleep now restores **10 health**, while retaining cold sleep's additional -0.8 and ordinary physical cold exposure, committed and passing at `58402d2fee2660da3369ae3faa6fc1525d76e238`.

After all three, the source-real corrected oracle `results/needs_equilibrium_corrected.json` observed **60 full days** per target: fatigue peak **50.76**, zero critical ticks; boredom peak **53.64**, zero critical ticks; cold-sleep health finished alive at **98.75** with genuine room exposure. The physical receipt counts were 153 sleeps for fatigue and for the health case, 209 reflections for boredom. The measured finite averages can undershoot unbounded accrual because the beginning and ending phases differ; observed bounded peaks and actual actions provide the 60-day evidence. The new equilibrium assertions ran with each relevant source correction; no need rate was retuned again after outcome inspection.

No coal heat duration, grocery unit price, science product cost, report income or report cadence was changed.

## Workstream 2: a household habit rather than a remembered key
**A16 controller repair:** before the pantry changes, an unactionable emergency cook was prevented from interrupting a supply delivery, commit `6359c35534007a7d0587ce6f822a38aafdea10f4`.

**A14 standing pantry habit:** commit `ed7e4b0d1994ea17df7bc1a2e230ca32298435b5`. The routine is not recorded as a new historical belief. Hunger needs 129.6/75 = **1.728 meals/day**, a regular seven-day order rounds to **13 cookable meals**: 9 vegetables plus 4 milk-and-grain pairs. On-hand equivalents count `meals + vegetables + min(milk,grain)`, not raw grain alone. The reserve threshold is **4 cookable portions**, computed using 9 transit ticks, 30 ticks of handling/travel allowance and a two-day buffer. A weekly bundle costs **26 crowns** in mild/November conditions and **33** in December-February, exactly proportional (rounded) to the original six-meal, 12-crown mild / 15-crown winter grocery bundle. The goods still require a paid catalog order, seeded physical arrival, mailbox collection, carrying and pantry storage. An emergency small basket remains available if the week package is unaffordable.

Fixture regressions were updated for the real household priority and the paid larger bundle. The first pantry CI pass had three red assumptions (old grocery choice, leisure without adequate pantry, and unheated winter delivery fixture), corrected without changing prices or fake character actions at `fdd8330b29584b820fe8cfc2808a5c14059ef3dd`.

### Exactly two requested winter comparisons, unedited

Raw records: `results/winter_pantry_v4.json`, human review: `results/winter_pantry_v4.md`. Inputs were the same ten seeds and two names from v3, same 61-day September on-ramp and November endowed inventory, `survivalFloor:true`, `reportPaymentDelay:22`. No additional sensitivity knob.

| Variant | Reached November | Survived 60 days | Winter full-life | Coal-empty ticks | Library dry-room losses/recoveries |
|---|---:|---:|---:|---:|---|
| `september_onramp_gated` | **0/10** | **0/10** | **0/10** | **0** (no winter lived) | **0/0** |
| `november_autumn_stores_gated` | **10/10** | **0/10** | **6/10** | **5,529** | **0/0** |

The comparable prior v3 gated November measure was 0/10 survival, 7/10 winter full-life, and 7,522 coal-empty ticks, so an apparent improvement in coal coverage did not produce survival, and the optional full-life count was lower. The new November lives ended between November 15 and November 28; all terminal wallet balances were 0 to 6 and all terminal meal equivalents were 0. The September starts died October 19 to 29, with wallets 1 to 13 and no edible meals. Every terminal recorded hunger was 100. The end-of-life failure label is consistently `food_refill_loop_no_cookable_servings`. The report provides all ten seed endings per scenario, actual wallet trajectories, sampled needs, goal logs, coal stockout intervals and original full-life definition. No failed seed was removed.

**Interpretation:** The raw physiological decay inequalities are no longer the decisive bottleneck in these measured lives. Food supply is again exhausted, now despite weekly deliveries. Sustained purchasing power, production, scheduling, and transport must be investigated as distinct candidate causes, not silently equated with the food flag. No additional economy retuning is authorized this round.

## Workstream 3: proposed folios and tests only
Source-verified proposed declarations: `docs/FOLIO_V4_DECLARATIONS_PROPOSAL.md`. `E22-012`, *The Kingdom's Winter Account*, proposes `winter_staples_before_science` with the declared November-February and 45-crown budgeting test; its false counter is `winter_science_first`. `E22-003`, *A Meal That Went Cold*, proposes `meal_before_bench` for prepared food and moderate hunger, counter `bench_before_meal`. `E03-015`, *The Question of a Larger Vessel*, proposes `bulky_apparatus_requires_clearance`, counter `bulky_apparatus_always_fits`, with the noted current catalog-size limitation.

`src/folio_v4_proposals.js` is not imported by the runtime and merely supplies isolated disposable candidate previews. `tests/folio_v4_declarations.test.js` verifies original event IDs, titles, digest and physical notebook read checks, grant-before-use order, log provenance, A/C opposite actions and no effect on `Simulation.choose` when proposals remain unratified. There was **no v4 trial**. Owner ratification remains explicitly required before integration.

## Integrity and stop
The final read-only CI locks original v1, v2, v3, the pinned 450-record source, both baseline diagnostic generations, corrected equilibrium, and the new winter artifacts to exact Git blob digests. No workflow automatically regenerates a frozen result. The post-proposal test run https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41375863197 passed **66/66, zero failed, zero skipped**. All code was committed on `main`, no new cognitive organ or model call, no change to `canon/`, and no unratified rule enabled.

**STOP FOR REVIEW.**
