# Septimus V5: one-house continuous-winter verification

**Reviewed:** November 2, 2026. **Execution:** [GitHub Actions run 41401849142](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41401849142), five fixed nonoverlapping seed shards. This report covers **only** the named controller/movement revision and does not alter any older results or claim general indefinite survival.

## Result

| Declared scenario | Reached November | Continuous 60-day winter survivors | Winter full-life checklist | Full-life since starting state | Mean winter walking-tick share | Coal-empty winter ticks |
|---|---:|---:|---:|---:|---:|---:|
| September 1, 61-day on-ramp, gated, no extra autumn stores | 10/10 | **10/10** | 0/10 | **10/10** | **36.642%** | **18,917** |
| November 1, declared autumn stores, gated | 10/10 | **10/10** | **10/10** | **10/10** | **41.060%** | **0** |

The historical reviewed v4 comparison reported **0/10 survivors in both variants**, with September seeds dying before November. The v5 tests use the original seeds 1 through 10, the identical November autumn-store boost, the original default 22-tick research payment delay, and `survivalFloor:true` in both scenarios. No food, fuel, wages, health, or other inventory was injected during the running life. The controller and household movement time were intentionally revised, so this is a new treatment rather than exact replication of the earlier v4 engine.

The September scenario's winter full-life checklist scores zero because the finite source books were already read during the long autumn lead-in, so `read_section` does not recur inside the winter-only window. All ten September lives satisfied the eight-activity *whole-life* checklist. The November starts satisfied the same eight activities inside winter itself.

### Terminal state ranges after winter (10 seeds each)

| Metric | September on-ramp | November autumn stores |
|---|---:|---:|
| Health | 98.55 to 99.20 | 96.40 to 99.20 |
| Wallet, crowns | 60 to 135 | 75 to 855 |
| Cookable portions | 6 to 16 | 5 to 30 |
| Winter walking share | 35.90% to 37.29% | 36.98% to 53.68% |

Across the September winter windows, temporary `>=90` need-ticks totaled hunger 88, thirst 7, fatigue 142, bladder 52 and boredom 10. For November, the respective counts were 9, 0, 22, 14 and 6. The peaks occasionally reached 100, so **survival does not mean every meter always remained below critical**. However none of the tested lives had a terminal collapse or resource exhaustion: all survived with very high health and remaining resources.

All five winter shards plus the expanded regression suite and bounded simulation smoke run passed. The diagnostic four-seed trace separately confirmed Sept/Nov seeds 1 and 2 alive at the same end date, with fully receipted shopping, posts, collection, earnings, food, fuel and chores.

### Reproducibility

The non-mutating benchmark is `tests/winter_continuity_v5.js`. Run `node tests/winter_continuity_v5.js 1-10` for the whole declared cohort (slow), or the CI's reproducible inclusive shards: `1-2`, `3-4`, `5-6`, `7-8`, `9-10`. Each job logs the full individual `V5WINTER_JSON` records. The CI doesn't regenerate any old result file.

### Game-design limitations, not concealed by the green result

The model now exhibits sustainable household behavior under these finite conditions, but this is not yet a **completed life simulation**. Winter coal remained empty for **18,917 sampled ticks** across the September cohort, although the health-restoration loop allowed survival. This suggests a live tension between economic winter heating and unusually effective sleep recovery. The 855-crown and 677-crown November endings also deserve an income-growth and spending-choice review, not an immediate unprincipled price nerf. Temporary maximum bladder/fatigue ticks and 36% to 54% walking budgets still warrant quality-of-life evaluation.

Neither multi-season July-to-December life nor indefinitely stable income is established by these 60-day window results. Deliberately poor decisions and negative-control controllers should be tested to demonstrate that failure remains possible for causal reasons rather than only hardcoded impossible states. A rare catastrophic weather/fabric seed might require stronger safety invariants, but no new risk is invented to force a failure.

The three unratified v4 folio proposals remain inactive. All v1-v4 outputs and `canon/` remain byte-identical; source-grounded diary rules remain intact. The earlier 95-vs-83 wallet question was a scenario-flag substring error, documented separately in `docs/V5_WALLET_RECONCILIATION.md`; this review does not rewrite historical wallets.

**Verdict:** **Pass for the specific two 60-day winter survival milestones** and a major correction of source-backed household continuity. **Not yet pass for full project completion**, multi-season generalization, economic balance, or continuously comfortable warmth.
