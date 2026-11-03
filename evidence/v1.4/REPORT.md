# Simple Tower v1.4: long-horizon release report

**Status:** Committed on draft PR #7. No merge. **Source head:** `cc2065dd1f31a6db911736c592858aac10acc751`. **CI:** https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41591212992, **65 tests passed / 0 failed**. The authoritative month evidence is in `evidence/v1.4/raw-report.json` and its five per-seed extracts. All runs use v1.3's unchanged economy constants and the same five-room world, no language model.

## Thirty elapsed days across five seeds

| Seed | Completed activities | Action kinds | End food | Harvested food | Health | Weekly conversations | Lived-origin quirks | Month goals kept / broken |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 11 | 457 | 12 | 24 | 99 | 100 | 5 | 9 | 3 / 0 |
| 12 | 467 | 12 | 21 | 99 | 100 | 5 | 8 | 3 / 0 |
| 13 | 469 | 12 | 23 | 100 | 100 | 5 | 11 | 3 / 0 |
| 14 | 474 | 12 | 22 | 100 | 100 | 5 | 9 | 2 / 1 |
| 15 | 486 | 11 | 22 | 102 | 100 | 5 | 10 | 3 / 0 |

No measured day-long soft-lock, fatality or two-consecutive-day two-action collapse. The five tests represent 150 fictional days, not 150 days of elapsed real time. Harvests have physical receipts. The normal food stores sometimes reach their capacity, and unused potential yield totals 45, 37, 36, 44 and 42 units across the seeds. This is an opportunity to improve the future utility model, **not** permission to silently alter the frozen v1.3 economy in this round.

The production-disabled seed-11 control died once of deprivation and could not resume physical action. It is part of `starvation-control.json`.

## Long calendar obligations, with an actual failure

The monthly calendar opens a two-session library project on day 8, due day 10; a two-session instrument inspection on day 16, due day 18; and a two-session provisioning project on day 23, due day 25 with a minimum of 12 food. These are tracked in the same commitment array and assigned to legal, finite-duration tower actions. A competing action between unfinished sessions emits `commitment_interrupted` referencing its original obligation, and subsequent actual task work emits `commitment_resumed`.

All three were interrupted and later resumed in seeds 11, 12, 13 and 15. In seed 14, the provisioning project was interrupted but not resumed before the deadline, so it was marked broken. This is the month's most useful negative result. It demonstrates that the planner can lose a commitment while pursuing otherwise viable day-to-day behavior. No intervention rescued or relabeled it. Paused-world process restarts (seed 13) were tracked separately from ordinary in-world work interruptions.

## Development comparisons

| Seed | Science day 1 to day 30 | Household day 1 to day 30 | New lived-origin quirks | Predictor week 1 | Predictor week 4 |
|---|---|---|---:|---:|---:|
| 11 | 7 to 168 | 1 to 1 | 9 | 37.2% | 31.5% |
| 12 | 6 to 168 | 1 to 1 | 8 | 34.7% | 36.2% |
| 13 | 6 to 165 | 1 to 1 | 11 | 34.7% | 29.3% |
| 14 | 6 to 164 | 1 to 1 | 9 | 34.7% | 26.0% |
| 15 | 6 to 164 | 1 to 1 | 10 | 35.4% | 36.2% |

All skill increases come from actual completed scientific work, and every new lived quirk cites a specific real `habit_formed` event. The active habit bonus is already part of decision scoring. Nevertheless, the science counter does not yet directly improve work quality, and predictor accuracy worsens in three of five seeds. This is demonstrable path-dependent development, not proof of learning across every skill or increasing introspective accuracy. Week-one and week-four action distributions are preserved verbatim in per-seed development files.

## Matched discriminator results

| Article | Bounded result | What the experiment actually demonstrated |
|---|---|---|
| 01 | Observed | 30-source explanation audit, 15 positively supported, 15 unexplained, no false claims or hidden leaks |
| 07 | Observed | Full utility controller beat a simple needs-greedy baseline in resource/deadline outcomes on 5/5 forks |
| 15 | Observed | Three worksite failures reduce scores for that context, not a separately relocated worksite |
| 21 | Observed | A stale object belief persisted across a two-day room-access block until a real failed action corrected it |
| 24 | Observed | Five closure requests and competing daily deadlines did not quietly resolve a physically blocked concern |
| 26 | Observed | Next-day action distribution identical after a paused hash-checked restart versus an uninterrupted fork |
| 31 | Observed, narrow | 1/5 setback forks changed later choices after the damaged bench became usable again |
| 32 | Observed | A hidden residue factor changed a decision without being revealed as an allegedly known motive |

Article 27 was independently exercised by the 30-day development regression, and Article 33 by the naturally occurring, source-linked humor callback during unattended simulation. Both are bounded and do not settle the stronger research claims. The ledger totals are **23 Demonstrated, 10 Partial, one Unassessable (23)**. Articles 05 and 06 remain blocked on Jay's choice of a second independent person.

## Identity, art and model boundaries

The tower, Pretorius's temperament, his existing first-person rendering conventions, and the byte-identical 450-memory archive remain. No old simulator runtime, second person, new room or API integration was imported. The 30-sample packet in `fidelity-review.md` is a cold-read aid for Jay or Calibos, not a self-graded character test. `docs/phase-3-readiness.md` is a paper-only decision memo. It names speech, diary and rumination integration options, a stricter model-claim validation requirement and Article 23 attacks. No model has been admitted.

## Reproduction

At `cc2065dd1f31a6db911736c592858aac10acc751`, Node 22+: `npm test`, `node scripts/v14_probe.js`, `node scripts/v14_discriminations.js`. The same CI logs contain the raw encoded result object, decoded without reconstructed events into this evidence directory. All original frozen v1.2 and v1.3 files are intact; the new code remains on the draft feature branch for conflict-aware reconciliation with main.
