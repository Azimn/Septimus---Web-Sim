# v1.8 runtime calendar and monthly merchant account contract

**Scope:** Simple Tower, a single simulated inhabitant with two deliberately scripted social counterparts. No model admission, additional person, new room, weather, or clock migration.

## Timing and series

The scenario's recurring experimental "month" is thirty consecutive 100,000-centibeat days. This is a periodic calendar rule, not an interpretation of the Gregorian date field. First-month legacy IDs remain stable; subsequent instances have @02, @03 and later suffixes. All instances are generated at runtime by `SERIES_TEMPLATES`, not written into the seed state. The initial C1 is a historical bootstrap instance and joins `DAILY-HEARTH` as the one explicitly documented exception.

`series_instance_generated` carries the template, rule, ordinal, source tick, deadline and predecessor. `commitment_opened` identifies each instance. `series_outcome` stores completion or break with causal source. Streaks, success/break totals and average elapsed completion ticks accumulate in durable `s.series`. A missed deadline is `deadline_missed`; a still-open predecessor is explicitly broken with `superseded_by_<nextId>` on the next scheduled opening. Neither case cancels future generation.

A first failure appears in the self-sheet as a recent series concern and occupies one out of four eligible rumination opportunities. A streak of at least two failures is urgent and occupies three out of four; eligible concerns are rotated so no one series monopolizes ruminations. The rule applies to the daily hearth and all three monthly series. Scores may prioritize an obligation but never award progress or stock automatically.

The principal actor's conventional `advance` freezes at death, retaining existing v1.3 tests. An explicitly externally advanced world calendar `calendarContinuesAfterDeath` continues the series opening and breaking without restoring agency or health; this is directly unit-tested. Ordinary crises do not suppress opening.

## Merchant account

At each 30-day boundary, Rosa's scheduled visit creates `merchant_statement_issued` before new-period delivery. The statement invoices real `merchant_delivery` prices in the just-closed period, carries previous outstanding credit when applicable and includes separate zero-account-charge spot `trade_receipt` identifiers. `merchant_settlement` happens only at physical co-presence and removes real provisions through the same finite batch mechanism as other consumption. Any unpaid remainder is retained as credit and emits a negative sourced `social` event with `kind: friction`. If a statement is missed, the next statement explicitly carries it forward rather than erasing it.

Year-scale natural settlements were all paid, so the unpaid branch is demonstrated by a separate controlled scenario, not falsely attributed to the 365-day life.

## Yearly evidence

365 days seed 11 and 180 days seed 14 are separate full-native-tick lives. Each 30-day snapshot includes physical goods, skills, habits, quirks, both relationships, the series status, count of original event entries and exact full save-envelope byte length. Remaining five days in seed 11 are a partial period, not a fabricated 13th month. The preregistered invariant definitions and skill threshold are in `evidence/v1.8/README.md`. The executable source is `af899b25212df4c55f55e9a9758b4a94d33f6079` and the successful workflow is https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41665810298.

This is a longitudinal architecture probe, not a declaration of human-equivalent competence or indefinite self-sufficiency.
