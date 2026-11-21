# Forensic closure: reversible recurrence lesion, original trial

**Status:** Independently reproduced and archived as permanent repository evidence, November 20, 2026 (America/Chicago). This is a **post hoc forensic verification** of the originally completed, preregistered experiment, not a new preregistered test, retuned result, or additional positive observation.

The original complete experiment remains GitHub Actions [run 44854991267](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/44854991267), source commit `724fad1dbeaa698ed929d61a834e4c0aec4f72cf`. The original preregistration was committed at `ce1e8886716e98efaf8a40a140fa20c0c6c8bdac` and the verified v1.8 executable baseline is `af899b25212df4c55f55e9a9758b4a94d33f6079`. Neither was changed. The separate forensic replay was executed successfully in [run 44857119761](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/44857119761).

## The alleged score discrepancy is a timestamp discrepancy

The original summary recorded a **post-day free-action snapshot at tick 14,925,000**. The original year-run JSONL recorded the **next real action decision at tick 14,925,100**, after the engine advanced the clock and physiological state. They are different state times.

| State / event | Coupling enabled | Removed | Restored |
|---|---|---|---|
| Same identical snapshot, tick 14,925,000 | `prepare` 33.37 | `work` 32.86 | `prepare` 33.37 |
| Next real decision, tick 14,925,100 | `prepare` 33.32 | `work` 32.85 | `prepare` 33.32 |

At snapshot time the enabled `prepare` has a bonus of 2.67; at actual decision time its bonus is 2.62. The source is thought `L18774`, generated at tick 14,917,500 for commitment `C150` / `DAILY-HEARTH`. Preregistered `GAIN=6`, `WINDOW=13500`, `CAP=12`. The age increases from 7,500 to 7,600 centibeats, making `6*(1-7500/13500)=2.6667` and `6*(1-7600/13500)=2.6222`, respectively. The remaining one-cent differences are the normal clock/body update before the actual decision. The original report failed to distinguish the two timestamps; this index corrects that omission without editing original evidence.

## Same-state reproduction

The state was rebuilt from `fresh(11)`, coupled mode, running exactly 149 original 1,000-tick days without external messages or intervention. At tick 14,925,000, the final original event is `L18778` (`completed work`); `activity` is null. Full state is in the included compressed JSON, with raw UTF-8 state hash:

```text
sha256:be483b5d292320aa9730e4d4c8eb33d3ebc999a5402d1adcb193ca55bb17a214
```

All three scorings consumed a structured clone of that exact same state, changing only the reversible `ruminationCouplingDisabled` switch. The `forensic-lesion.json` contains **all 10 eligible action candidates** for enabled, disabled and restored, with full scoring factors. Enabled and restored are exactly equal. The next real decision receipts include **all five logged candidates** for each condition.

## Full 200-tick physical forks

The full branch-unique event receipts are included as JSONL for both conditions, plus a restored fork. The **entire restored and enabled 200-tick event streams are byte-identical**, not merely their final action names.

| Condition | Completed physical actions, in order |
|---|---|
| Enabled | `prepare` (L18788, t 14,927,500), `work` (L18796, t 14,935,600), `rest` (L18802, t 14,939,300) |
| Removed | `work` (L18784, t 14,932,500), `prepare` (L18793, t 14,935,000), `rest` (L18800, t 14,938,700) |
| Restored | Byte-identical to enabled |

The behavior and ordering changed, but the two continuations completed the same **multiset** of actions within 200 ticks. The evidence supports a reversible causal difference in action selection and its chronology, **not** a demonstrated durable adaptive advantage. The original multi-seed and year-long aggregate conclusions remain unchanged.

## Permanent evidence files

The repository stores `forensic-lesion.json` (full score candidate arrays, exact references and both branches' physical receipts), `same-state-14925000.json.gz` (the complete 11,281,542-byte JSON state, losslessly compressed), and `fork-enabled-200-ticks.jsonl`, `fork-disabled-200-ticks.jsonl`, and `fork-restored-200-ticks.jsonl` (all generated event receipts). The complete forensic package was also archived as [GitHub Actions artifact 14688495515](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/44857119761/artifacts/14688495515), ZIP SHA-256 `6cfa026f9c56579b0ecf016746c5c74bd4c3874e07dc86100caceb17607505d8`.

The compressed state recovers to the exact SHA-256 above. The JSONL content SHA-256 values are recorded inside `forensic-lesion.json` and were independently checked against the archived files. This GitHub branch stores the snapshot and receipts permanently rather than depending exclusively on the expiring Actions artifact.

## Replay

On a clone of this research branch with Node 22 or the declared compatible runtime:

```bash
npm test
FORENSIC_OUT=research-results/independent-lesion-replay node scripts/recurrent_lesion_forensic.js
```

Use a new output directory to preserve existing evidence. The script confirms the exact state, source thought, next decision, three scoring states, restored branch equivalence, and both 200-tick physical receipt streams. It refuses to silently overwrite output files. It does not alter a canonical archive or any user save.

**Interpretation:** demonstrated bounded reversible causal influence on a later physical-action choice, but no established general advantage of recurrence over the matched simple rule or record-only control. No conclusion about subjective experience.
