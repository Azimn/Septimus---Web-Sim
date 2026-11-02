# Septimus v3 review stop: knowledge inventory, designed encounters and winter balance

**November 1, 2026. Status: implementation and bounded trials completed; stop for review.** No additional economy tuning or further trial generations authorized in this round.

## Limitations first
- **Memory content is hand-interpreted by a designer**, not semantically understood by Septimus. The policy holds hand-declared fact IDs and deterministic rules. Facts are earned by physical, verified folio reading or perceived direct experience; cue metadata remains separate from that knowledge. Reaching v3's causal controller criterion does not establish an LLM autobiographical mind.
- **The garden did not meet the preregistered divergence criterion.** Its encounter really did trigger consultation, 20/24 seeds, but those same 20 seeds had experienced relevant garden evidence before the folio. Existing fact knowledge may legitimately eliminate a unique value for reading. No unanswered-question target-read attribution occurred. The floor and coal cues were still zero, so only the chair motivated their reads.
- **The counter-folio comparison is not proof that false facts always caused actively wrong actions.** The false-belief entries are deposited and have negative candidate scores in policy, but the reported selected-goal fact-provenance counts for the counter arms were zero. A/C divergence may be due to A's helpful facts, not demonstrably harmful C choices. A candidate-level lost-decision study remains future work, not a claim here.
- **All tested winter lives still failed.** An autumn on-ramp starting September 1 gave no seed even enough continuity to reach November. An endowed November start gave 0/10 survival for 60 days, ungated and gated. The one-knob research-payment delay sensitivity also gave 0/10. The simulation's original survival logic and finite income remain inadequate; no second economy knob was adjusted.
- **The character policy still includes acknowledged legacy access to some global stock and fabric conditions.** These source-level game shortcuts are not acquired memories; this round strictly gates only the new held facts. A future belief-state rewrite would be a separate effort.
- The pinned historical source is a reconstructed fictional autobiography, not new world experience; `identity.json` is untouched. No LLM calls and no new cognitive organ. The late/wet cart, failing board and nettle-heavy garden are declared disposable scenario assumptions, not claims about 1899 history.

## Chronology, provenance, and CI
The frozen original research protocol, results and source audit were read first. The new protocol was committed **before code and trials**, `ecd5266d36bd2b136e0d5f4669a611f0260829ec`: `docs/FOLIO_MEMORY_PREREGISTRATION_V3.md`.

The November-v2 seed replay instrumentation was added before economy modification. Its receipt-level diagnosis was committed at `c49dd7cf3e3ec92eb7b2a0ceb1037e15eca5e3c6`: `results/winter_diagnosis_original.{json,md}`. The prior v2 aggregate files contain only daily wallet and health, so the extra category spending, needs and last goals are deterministic replays, not original v2 fields.

The knowledge and survival implementation began at `67fd93e1ac88763fef50cce604e00a5fb815fbfb`, followed by a single optional research payment delay control `65fe0f145fa7d284569f06cbe542e17f1b9bcd57`; provenance tests at `837f2015f3cab7a4480c2f7c46c4450dbd610be9`, encounter harness `20aada7da410a7812d1e51f352d3311d192bac44` and winter matrix `5bec0d6eed6d02b576f471a5b3d7b49a7b91872a`. The `garden_path_seen` cue wiring omission was corrected under the unchanged protocol in `537981d7ae4fe378350c9130a0f5c8ae4f23a459`. The final corrected source run: https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41369571001.

The corrected raw results and plain-language summaries were committed by that run separately at `45a14d9680cdf5f535060844e623fd256b618740`:
`results/folio_experiment_v3.{json,md}` and `results/winter_balance_v3.{json,md}`.

An earlier CI workflow inadvertently regenerated original v2 files with new runtime measurements. The original reviewed blobs were recovered **byte-for-byte** from review head `9bd9b92bd33ea1f5860af3e724af9528c78ac379`, and restored at commit `412d9e16818f7ad5a6419fc6870a227e2ad237a0`. That commit removed automatic research regeneration and added frozen-artifact byte-integrity tests. Restored blobs: v2 JSON `8c83f3c5abfc8b41754dc435a698d2eaebfbedcf`; v2 Markdown `f53724ba177686e3b140ee1caddd1eede81a4686`; original winter JSON `7f1decf20da50f0ec614e9906f7f4cd92cb35908`; original winter Markdown `5926f94976c02b946b93b2c9a03ded92c647cffd`. The original v1 blobs remain unchanged. Frozen canonical JSONL Git blob `718dcc2d5ba4feccdef1690d447edfcebaa9bfb5`.

The post-restoration CI run https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41369902848 passed **55/55 tests, 0 failures, 0 skipped**. Its integrity tests explicitly verify the historical corpus and prior-generation byte hashes, and verify that the declared v3/winter results match the committed raw data.

Intermediate red: a transitional workflow attempted to publish regenerated frozen results from a stale branch while the non-mutating workflow was being installed; the re-generation hazard was removed and exact source blobs were restored. Another pre-result audit found the unwired perceived nettle-path cue; it was fixed before the accepted corrected v3 source run, with no altered thresholds, seeds or input resources.

## Folio v3: trigger mechanism first
Across 24 fixed seeds per source, maximum 800 pre-trigger and 160 post-trigger ticks, all A/B/C arms share a real common pre-trigger event. A gets original verified facts, B withholds, C grants explicitly false experimental facts, never in living saves or `canon/`. The prior v2 +18/-18 post-read score tokens were **not used in the v3 harness**.

| Source | Target reads / 24 | Cue / question / chair | A/B first-five divergence | A/C first-five divergence | Target A / B / C | Criterion |
|---|---:|---|---:|---:|---|---|
| E22-001, floor | 23 | 0 / 0 / 23 | 23 / 24 | 23 / 24 | 23 / 0 / 0 | PASS |
| E18-010, garden | 24 | 20 / 0 / 4 | 4 / 24 | 4 / 24 | 4 / 4 / 4 | FAIL |
| E03-002, coal | 24 | 0 / 0 / 24 | 24 / 24 | 24 / 24 | 24 / 0 / 0 | PASS |

All missing triggers count as failures in the fixed 24-seed denominator. **Two of three sources** meet the prespecified criterion of A/B divergence >=30% of 24 seeds and a greater A than B target selection rate. Classification: `held_facts_load_bearing`, referring narrowly to designer-authored fact-consuming behavior. V3 trial Node runtime: **3,971 ms**. The garden condition is a genuine negative source result. Most encountered nettle evidence was learned before the read, establishing a meaningful competing acquisition route.

Every recorded fact stores a fact ID, grant tick, source kind, folio ID or experience event kind and source receipt. Autonomous folio-derived facts are appended after verified `FOLIO_READ` to the persistent hash chain; they survive cold restart, and forged source/tick references are rejected by regressions. The game can instead acquire selected facts through physically perceived inspections, hazards, wet coal handling and path encounters. The selected goal log includes used fact IDs, provenance and temporal order. Known unsafe floor routing can avoid the dangerous square when a valid map path exists.

## Winter v3: diagnosis, spawn comparison, survival gate and single knob
Original November failure diagnostics, measured before the new controller, show terminal hunger 100 for each seed and thirst below 100, across last-seven-lived-day recorded spending totals **67 food, 104 coal, 0 science, 0 other**. Last selected goals varied among sleep, toilet, drink and stoking; these are exact final selected intentions, not a complete physiological causal analysis. The original classifier calls all 10 deaths starvation.

Scenario A: September 1 with ordinary `fresh(seed)` inventory, 61 days before November and then a maximum 60 winter days. **0/10** reached November with the ungated controller; **0/10** with the survival gate. The report records deaths before the measurement start rather than claiming 60 days of winter observation.

Scenario B: November 1 with an explicitly endowed initial stock: +20 dry coal, +8 vegetables, +6 grain, +4 milk, +6 prepared meals, +0 cash. All 10 entered November in each controller version. Neither ungated nor gated variant had a survivor at 60 days: **0/10**. Winter full-life was **10/10 ungated**, **7/10 gated**; "full-life" still does not imply survival. Coal-empty ticks were **10,415 ungated** and **7,522 gated**. No dry-room losses or recoveries occurred during observed lives.

The gate makes feasible acute-hunger, thirst, health and warmth provisions strictly outrank science, diary, books and comfort in the policy. It does not generate resources or rescue a household with insufficient income. Since both gated scenarios remained below five survivors, the **one preregistered parameter sensitivity** ran: research-payment postal delay 22 -> 12 ten-minute ticks. It yielded **0/10 September-to-November continuity** and **0/10 60-day November survival**. Its November coal-empty ticks were **8,062**, not an improvement over the gated 7,522. Because the sensitivity failed, the default report delay remains 22, and there was **no second economy adjustment**.

The recorded full winter matrix Node duration was **139,741 ms**, six labeled scenario variants with ten seeds each. The complete JSON has daily wallet and health trajectories, sampled needs, winter receipts, selected goals, causes, coal outage intervals and dry-room transitions. No seed or unfavorable count was dropped.

## Review boundary
The next design question is not whether Septimus can hold facts: v3 proves he can, within this declared deterministic policy. It is whether a fact is *usefully gained by consultation rather than already by experience*, and whether the tower's household economy can sustain a genuinely continuous life without privileged resource provision. The results do not authorize retroactive changes to the v3 protocol or extra knobs in this round.

**STOP FOR REVIEW.**
