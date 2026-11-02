# The Simple Tower

**Build track:** 2026-11-02. Standalone minimalist physical life simulation of Septimus Pretorius in his ruined tower outside Ingolstadt. This is a working Phase 1 mechanical baseline, not the old Web-Sim, Doctor Lives, Pretorius Laboratory, or Candidate B runtime.

The entire previous Web-Sim tree is preserved as `old sim/` on this branch, with byte-identical Git blob contents and historic source commit `b6c8e695513d25db3df00fdf36296c8c3e2ecdea`. The previous implementation is not imported by the new code. Archive, external identity and historical folios are *data*, not imported code. The freeze allows future selective salvage.

## Run

Requires Node.js 20 or newer, no packages or model. `npm start` and open `http://127.0.0.1:8765/`. `npm test` runs the deterministic mechanics suite. The game binds only to localhost. `TOWER_SAVE=/path/to/file.json` and `PORT=8766` are optional. Save data is stored under `data/` and never checked in.

Pause the world to direct an object action, then advance manually or begin autonomous life. The root of the tower has five rooms, twelve smart objects, finite food/water/fuel, a provenance-checked 450-folio history shelf, persistent first-person diary, state-based action scoring, emotion modifiers, history-seeded topic salience, and a bounded template voice. A spoken name is recorded as heard, not experienced as an event from the past.

Each game decision advances exactly **100 centibeats** (1 Swatch beat or 86.4 simulated seconds). The engine clock is an integer count of **864 ms centibeats**, with **100,000 centibeats per day**. In autoplay the *accelerated* presentation runs one game beat per real second. The one-day cap on unattended replay pauses rather than silently skipping an arbitrary long interval. This is intentionally distinct from the former 10-minute Web-Sim steps.

## Identity and archive

`identity.json` is an exact copy of the original external identity record. `canon/Pretorius_v12_450_Events_Complete.jsonl` is an exact Git-blob copy of the frozen 450-memory v12 archive with source SHA `718dcc2d5ba4feccdef1690d447edfcebaa9bfb5`. On launch, the program validates archive bytes, record count, unique event IDs, provenance fields and external identity. The folio memory is explicitly *pre-awakening reconstructed history*. Lived events are saved separately, never fabricated as a result of reading.

## Honest acceptance status

Phase 1 mechanics have passing Node tests. The current build has **not** demonstrated all 34 Article acceptance criteria and has not run the research paper's matched histories, delayed discriminating opportunities, renderer swaps, or rigorous cognitive comparisons. The template voice is not a language model, and no Doctor Lives connection exists. Current moods, routines, commitments and diary are intentionally shallow. The UI is only a minimal operator/player surface.

Specific remaining Phase 1 acceptance: test the exact canonical archive on the published branch in CI, conduct a fresh-start server and browser smoke, evaluate a whole coherent day including preparation before dusk, confirm restart during a timed activity, and audit whether actual decisions reliably show historical/persona fidelity rather than only stylistic cues. If any mechanism fails its exercise, report the failure instead of counting the Article.

## Design authority and deferred concerns

The build follows Jay's **Simple Tower, Tower-Track Companion Specification v1**, subordinate to the generic **Minimum Viable Inhabitant Combined Build Specification v1** except for setting, identity and day-one folio content. The generic source document was referenced by local workspace path, not available as a checked-in file during this implementation. Where that unavailable document might set requirements, the companion and previously supplied minimalist brief were used; reconciliation remains required before declaring full conformance.

Calibos concerns F1-F5 remain tracked: long parallel tower runs, model confabulation on model admission, new synthesized history, predictor/claims checker before later acceptance, and ongoing character fidelity. In v1 only F5 is active from the first spoken line. No model speech is admitted. No archive-derived memory-effect qualification is claimed.
