# Septimus consultation v2 and winter benchmark: review stop

## Limitations first
The new consultation drive caused a physical target-folio read in every preregistered case, but **none was driven by a world cue or unanswered-question flag**. All 72 were evening-chair consultations with the preregistered test cursor. This demonstrates consultation in the bounded test, not successful cue-driven autobiographical recall. Both A/B and A/C first-five-goal comparisons remained identical, so the declared load-bearing decision criterion failed. The original v1 control is not reinterpreted or overwritten.

All 10 November-start winter lives died **before** the planned 60-day end; no complete 60-day survivor trajectory exists. The engine labeled every death `starvation`. The current death classifier defaults to starvation whenever thirst is below 100, so its label is a coarse mechanical classification, not proof that cold or exhaustion made no causal contribution. All measured days are preserved as recorded. The starting stock is the default July stock shifted to November; it is not a historically validated November inventory. Zero observed roof/dry-room losses here does not demonstrate winter-long fabric resilience: no world lasted beyond November 25.

The v2 post-read +18/0/-18 effects are deliberately engineered controller interventions, not interpretation of historical prose. The experimental `FOLIO_READ` entries are verified and labeled in disposable harness records, not appended to a persistent lived journal. Arms share one common natural pre-trigger trajectory, so equal per-arm trigger percentages are by construction, not three independent observations.

## Provenance and frozen source
Protocol committed **before testing**: `62709732ac51ef8e23a056d2dfb9d13ce2351fc8`, `docs/FOLIO_MEMORY_PREREGISTRATION_V2.md`.

Consultation code and removal of v1 auto-regeneration: `d3687acf143574b7823926475701a53477054c80`.

Regression tests, bounded v2 harness, winter instrument and measurement workflow: `16d15b9c9023b4f7f3c72f9a1df9bc16df798223`.

All four unedited numerical outcome artifacts committed by CI **after the tests**: `3a1bac28705da1a0a4901a0be013dd06f3e7f494`. CI: https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41364359078, **42 tests passed, 0 failures**, bounded experiment and winter scripts completed.

Frozen v12 canonical Git blob: `718dcc2d5ba4feccdef1690d447edfcebaa9bfb5`; archive sha256 reported by experiment: `becdf4ca72b85365c35940ccd68f3b6a9bbb1093b7b3cc89c33b113bbe5608ec`. Prior v1 source/result files were not modified. The unchanged v1 primary null was 0/72 target-folio consultations.

## Folio v2 observed results
The matched 24 seeds each for E22-001, E18-010 and E03-002 produced 24/24 target reads per source, all attributed to chair, none to cue or question. This is 72/72 target reads total. The receipt-level boredom reduction occurred in 72/72 target reads (21 points before clipping in the relevant receipt). The measured consultation may therefore satisfy a need without affecting a selected goal in the first-five window.

The primary A/B divergence remained 0/24 for all three sources. The A/C divergence likewise remained 0/24 for each. The target selection counts for A, B and C were 0/0/0 for each target. The preregistered 30% threshold was met by 0 of 3 sources. Classification: **NULL: controller criterion not met**, even though availability-to-consultation changed. The three-arm experiment used 3,377 ms of recorded Node execution time.

Records: `results/folio_experiment_v2.json` (complete seeds, reads, physical IDs, mechanisms, per-arm verified access and goal traces) and `results/folio_experiment_v2.md` (unaltered aggregates). The experiment does not establish causal use of folio content.

## Winter observed results
The 10 seeds began November 1, 1899, from `World.fresh(seed)` with day 124 and attempted 8,640 ten-minute ticks each. Actual lives ended after 1,197 to 3,414 ticks, between November 9 and November 25. **0/10 survived**; the eight-activity full-life flag was met in 5/10 lives before their deaths. Every recorded death cause was `starvation` according to the above classifier.

Starting wallet was 72 for every seed, terminal wallet ranged from 3 to 10. The individual daily ledgers show funds declining quickly with occasional earned payments. Coal was empty for a combined 10,289 ticks across 22,224 actually lived ticks (not a 60-day denominator), with repeated stockout episodes. The measured library dry-room status had 0 losses and 0 recoveries. The test consumed 5,554 ms of measured Node execution time. No prices, stock dynamics or household parameters were tuned in response.

Records: `results/winter_60_day.json` (complete daily wallet and health observations, per-seed coal intervals, damage transitions and death records) and `results/winter_60_day.md`.

Intermediate red: the initial atomic code write failed because the GitHub commit payload lacked a tree SHA; switching to the Git tree endpoint fixed the tool invocation, without changing research results. No test reds remained in the final workflow.

**STOP FOR REVIEW:** No further behavioral tuning or post hoc threshold modification has been performed.
