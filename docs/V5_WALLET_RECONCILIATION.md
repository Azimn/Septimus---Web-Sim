# V5 reconciliation: the 95-crown and 83-crown September replay question

**Date:** 2026-11-02. **Status:** Root cause of the *apparent* cross-scenario wallet mismatch identified by source audit. This note does **not** regenerate or rewrite any historical experiment.

## Previously confused comparisons

The frozen v3 review `results/winter_balance_v3.md` reports September on-ramp **ungated**, seed 2, terminal wallet **95 crowns**. The same reviewed table separately reports September on-ramp **gated**, seed 2, terminal wallet **83 crowns**.

The later isolated audit `results/needs_arithmetic_isolated.md` reports **83 crowns for both** `september_onramp_gated/2` and `september_onramp_ungated/2`, including matching final-window tick allocations. Its `tests/needs_audit_oracles.js`, inside `winterInit(seed,id)`, initializes the policy using:

```js
s.policyOptions={survivalFloor:id.includes('gated')};
```

This condition is true for both names. `'september_onramp_ungated'.includes('gated') === true`. The diagnostic's supposed ungated sample was in fact run with `survivalFloor:true`. Thus the source-level reason its 83-crown result fails to reproduce the frozen ungated 95-crown v3 row is a **scenario-flag matching error**, not demonstrated nondeterminism, a missing twelve-crown debit, or unexplained income.

## Resolution and methodological boundary

Do not describe the 95 and 83 figures as two genuinely identical replays. They belong to different gate settings in the reviewed v3 table. The wrongly labeled isolated audit provides corroborating source evidence by collapsing those two settings to the gated case.

No previously frozen artifacts, canonical memories, need parameters, payment amounts, weather, seeds, or v3 implementation are altered here. The old audit code is retained as historical evidence; changing it in place would make its original committed output misleadingly appear to have been produced by a corrected instrument.

Future **new** analyses must pass `survivalFloor` as an explicit boolean defined by the scenario, not infer it using a substring. Exact byte-identical full-trace replay of the old 95-crown run is a separate potential verification task; this source audit is sufficient to explain the named cross-scenario mismatch but does not pretend to reproduce all archived actions.

The v5 household benchmarks define explicit `survivalFloor:true` for both approved gated scenarios and avoid this string-substring collision.
