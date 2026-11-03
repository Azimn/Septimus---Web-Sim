# Simple Tower v1.3: consequences release assessment

**Build:** Source head `00ef3ae1c8416ab7055f562b0df20d56187c57d5` on PR #7. [Passing GitHub Actions](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41581300405): 53/53 tests, including all 42 v1.2 tests. This is a no-model experimental simulator.

## Why the economy was changed

V1.2 spent provisions without producing any. V1.3 uses the same garden plot and path to produce food, draw water and gather wood through time-consuming actions. Every stock increment has a physical-world receipt. The control without production still exhausts food, loses health and dies. Thus a stable run is now a consequence of behavior, not an inexhaustible stock or an immortal inhabitant.

The economy was frozen at `growth=140000` centibeats (1.4 world days), `harvestFood=8`, `plantWater=1`, `drawWater=6`, `gatherFuel=4`, stock capacities food 24/water 18/fuel 12; hunger 75 penalizes energy, hunger 90 with empty food reduces health 0.065/step, and exhaustion under 12 energy can cause an additional 0.018 health loss/step. These are balance parameters, not human physiology. They were not retuned between the five-seed standard experiment and the starvation control.

## Seven-day unattended re-run

| Seed | Completed actions | Action kinds | Food remaining | Physical food harvest | Witnessed conversations | Health |
|---|---:|---:|---:|---:|---:|---:|
| 11 | 115 | 11 | 18 | 32 | 7 | 100 |
| 12 | 113 | 11 | 20 | 32 | 7 | 100 |
| 13 | 115 | 11 | 19 | 32 | 7 | 100 |
| 14 | 113 | 11 | 11 | 24 | 7 | 100 |
| 15 | 118 | 11 | 19 | 32 | 7 | 100 |

Every standard seed survived and had nonzero food at the end through logged harvests. Every seed recorded seven actual co-present visitor conversations, customs and trust records. No run met the no-useful-action-for-a-day soft-lock criterion or the sustained two-action collapse criterion. Seed 13 saved/reloaded while eating on day 2 and working on day 5. Both resumes logged a 24-hour operator pause, preserved in-progress work and did not advance fictional world time.

**Deprivation control:** Seed 11 with all production actions disabled died once from sustained starvation after 5296 simulation steps (world tick 554600). Its death was persisted and terminal. **Unexpected consequence:** Seed 14 had two real failed conversations after the visitor departed. They remain in the per-seed trace, not suppressed or interpreted as success.

## Discrimination

Eight articles advanced in bounded engineering evidence only: 03, 04, 09, 12, 14, 17, 18, 28. Exact names of the passing tests are in `discriminations.json` and the `BUILD_STATUS.md` matrix. Total grades: 13 Demonstrated, 20 Partial, one Unassessable (Article 23). No claim is made that these shallow tests satisfy all longitudinal research requirements.

## Limitations

Normal endurance never required wood gathering, though the action is physically receipted and tested. The baseline only maintained one active recurring commitment; three simultaneously tracked commitments are exercised in the controlled scenario. The one visitor cannot establish social generality. The 30-day Article 27 window and LLM-related Article 23 are intentionally not tested. Seven days of survival is not an indefinitely sustainable livelihood.

## Reproduction and provenance

At source head above run `npm test`, then `node scripts/v13_probe.js` with Node 22 or later. The CI log contains the encoded authoritative result object, decoded unchanged into the seed evidence files, starvation-control file and acceptance report under `evidence/v1.3/`. The 450-memory canon and identity blobs are unchanged.
