# Septimus Tower: designated successor to the standalone Pretorius Laboratory

**Decision date:** 2026-11-02  
**Status:** Architectural designation approved; feature parity and runtime migration **not** yet completed.  
**Source heads reviewed:** Septimus Web-Sim `b70a53faa47b5c52d4b2f540611aef74320b22b9`; Pretorius-Laboratory `6e49795752835d64fa6fd63d16359669a1ca2ba7`; The-Doctor-Lives main at the November 2, 2026 inspection.  
**Scope:** The physical/life simulator only. The Doctor Lives remains Pretorius's independent authoritative cognitive system.

## Executive architectural decision

Septimus Web-Sim is promoted from disposable research toy to the **target home-world simulation** for Pretorius's pre-Village ruined tower outside Ingolstadt. The old Python/SQLite Pretorius-Laboratory becomes a **mechanical capability donor and research baseline**, not a second active world instance running alongside the tower. Its immutable history is retained. The Doctor Lives remains authoritative for identity, active cognition, autobiographical memory, relationships, concerns, neural policy, commitments and ongoing subjective continuity.

**Designation is not a cutover.** The existing Web-Sim deterministic `Simulation.choose` is a useful validated baseline household controller, not Pretorius's complete cognitive policy. His local `identity.json`, 450 reconstructed folios and small rule-based `knowledge.facts` must not silently overwrite The Doctor Lives' schema, 70-node Persona Connectome, deep-history classifications or living memory. A successful migration must contain **one physical world authority, one cognitive authority, and an explicit checked bridge**.

The two modeled buildings are not proven to be the same actual location. Web-Sim's scenario is the **ruined tower, occupied since 1868**, beginning July 1899. Pretorius-Laboratory's opt-in home prototype has a **sanctum, experimental chamber, bedroom, kitchen, sitting room and closed curiosity shop** associated with a *future* Village-facing story. That shop's curtain, inventory, events and arrival are **not automatically present** in the tower. Port code/affordances, not invented historical possession or movement.

## Side-by-side source audit

| System / design dimension | Web-Sim v5, actual code | Older Pretorius-Laboratory and/or Doctor Lives, actual code | Disposition |
|---|---|---|---|
| Home-scale autonomous life | Ten-minute world tick, persistent goals, timed routes, a server-side autonomous loop; 20/20 fair 60-day winter survivors | DailyRhythm is opt-in explicit action/advance, without a continuous autonomous loop | **Retain Web-Sim as primary physical clock and ordinary-life engine** |
| Pantry, economy and correspondence | Paid groceries, bulk staples, coal, seeds, science consumables; delayed physical delivery and research income; crops and repairs | Finite kitchen rations/water/fuel and work wear, but no equivalent proven long-horizon paid supply/income loop | **Retain Web-Sim** |
| Conditions and seasonal risk | Rain, nettles, coal wetness, winter prices, cold exposure, roof and floor wear | Local lighting, obstructions, finite fuel and object-level experimental constraints; no Web-Sim seasonal economy | **Combine mechanisms after timing reconciliation** |
| Activity duration | Most actions, including `sleep`, `experiment`, `read_section`, `cook`, complete within one ten-minute tick; sleep restores 44/76 fatigue and 10 health | `DailyRhythm`: 480-minute sleep, 60-minute experiment, 30-minute meal preparation, 10-minute eating, 20-minute tea, and continuing needs during time | **P0: elapsed duration/progress engine before claiming believable life** |
| Books and genuine study | Eight fictional book titles; two abstract `read` actions mark a book complete; old folios physically read with verified provenance | 17 complete, source-pinned pre-1891 text works; verified digital leaves, open/turn/read/mark/close, actual custody and bookmarks | **P0: migrate 17-book content and source/pagination discipline, keep folios distinct** |
| Durable objects and possessions | ~20 stationary map objects, aggregate inventory and a single generic carried parcel | Stable IDs and object condition, slots with occupancy/capacity, containers, clothing, furniture, carried books, one-current-location policy | **P0: transplant identity, occupancy and transaction constraints** |
| Physical science | Generic reagents/spares/clutter/damage; fixed experiment results and reports; one generic bench | Calibrated synthetic ruler and balance, bounded measurement uncertainty, instrument source receipts, physical beaker and break/collect/place semantics | **P1: reproducible inquiry and object-based experiments** |
| Material affordances | Door graph, 3-adjacent-cell traced movement per tick, hazardous stairs/garden; generic parcel capacity | Synthetic source-labelled size/mass, shelf capacity, reach/lift bounds, object placement and obstacle reflex | **P1: object constraints, calibrated synthetic provenance** |
| Light, locality and senses | Room-local events, cold/damp impressions; oil lamp and bench action state; no general source-gated dark-room inspection | Unified subject gate denies inspection, reading and measurements in dark/unsafe conditions; human-readable first-person `inner` and `spoken_aloud` | **P0: fail-closed visibility and action prerequisites** |
| Body and mundane life | Hunger, thirst, fatigue, bladder, boredom, health; cooking, gardening, repairs, drinking, eating, journaling | Thirst/hunger/fatigue, room cleanliness, finite oil/water/fuel, cleaning/rest; containers, clothing and accidental vocal reflex | **Retain stronger new needs; recover richer actions and consequences** |
| Memory/cognition | Frozen 450 reconstructed folios, three small declared verified-fact policy families, local journal receipts and deterministic `choose`; optional Ollama narration cannot change action | The Doctor Lives: persistent BrainStore, first-person projection/ingress, relationships, concerns, commitments, recurrent policy, deep-history provenance, action outcome learning | **P0: use real Doctor bridge with matched cheap-controller baseline; never install a second brain** |
| Receipt authority | Hash-chained JSONL `TICK` world snapshots, verified save replay, single local Node process; no multiwriter interlock | SQLite transactional physical authority, versioned epochs, idempotent event IDs, checkpoint/backup/fork, book custody and consistent-placement checks; Doctor bridge provides deduplicated first-person admission | **P0: versioned world-to-brain ingress, restart/fork/cross-process integrity** |
| Setting and future Village | Historical tower and garden; a *future* Village handoff only | Synthetic shop currently closed and not approved for Village public travel; no authorized cross-world dual occupancy | **Do not port shop or activate Village until separate approval** |
| Presentation and real-time operation | Local browser/map, need/economy panels, server-side accelerated ticks when running | Python CLIs, physical source receipts, local world databases, experimental actor port; Doctor has independent cognitive access | **Keep browser; expose subject/engineer surfaces separately and make pace configurable** |

Reference sources: Web-Sim `src/{world,simulation,organism,knowledge,ipseity,household,diary}.js`, `server.js`, `results/V5_HOUSEHOLD_REVIEW.md`; old Laboratory `pretorius_lab/{subject_port,habitat_v2,home_life,daily_rhythm,book_library,book_custody,bench_instruments,physical_affordances}.py`, `corpus/{victorian_bookshelf_v1,esoteric_annex_1890}.json`, `docs/UNIFIED_FIRST_PERSON_LAB_PORT_2026-10-15.md`; Doctor `doctor_lives/{lab_home_bridge,home_motive_queue,chassis}.py`, `ARCHITECTURE_CONTRACT.md`, `FIRST_PERSON_SUBJECT_INTERFACE_CONTRACT.md`.

## P0 migration gates, in dependency order

### A. Versioned successor contract and current-save safety

Freeze a source/epoch/clock conversion table and stable IDs for the existing tower coordinates, room names, journals, catalog orders, receipts, garden, roof/floor condition and possessions. The existing saved `events.jsonl` must verify unchanged. Add a **new versioned extension** or migration that preserves earlier events, rather than editing genesis, inventing a prior book purchase, rewriting historical folios, or silently merging the old Laboratory's shop. Validate full backup, restore, duplicate receipt, stale revision, interrupted mutation, and a separate experimental fork. A single physical event has exactly one authoritative owner.

**Acceptance:** existing Septimus saves reopen; original hashes pass; tampering is detected; restart/retry produces no duplicated food, objects, income, memory, or post receipts.

### B. Multi-tick activities and believable daily rhythm

Implement bounded declared activity durations and completed-action effects for sleep, experiments, repair, cooking, reading, instrument measurements, carrying, cleaning and letter writing. Unlike current one-tick `sleep`, rest takes actual time; hunger, thirst, room temperature and fuel continue evolving. Persist activity phase, object reservation, partial progress and interrupted work. Make travel, study and sleep time economically and physiologically comparable. Distinguish `rest` and sustained `sleep`, and prohibit learning/research rewards before completion. Re-run the **same twenty seeds**, including negative seeds, with no artificial wallet, refills or economic retuning. The 20/20 v5 result must remain historical, never falsely labeled as proof under the new duration rules.

**Acceptance:** any interrupted activity resumes or explicitly fails without duplication; sleep duration matches world time and is not an instant heal; real future task completion can still support at least one healthy 60-day life before seeking a robust cohort.

### C. Source-backed library and physical custody

Port both old Library source manifests and their verification rules into the tower's library, without treating modern transcriptions as authenticated historical printings. Register **17 distinct books** and persistent shelf/table/bench capacity; preserve checked editions, digital-leaf offsets, bookmarks, custody/placement history and local source text. Keep the old eight fictional placeholder titles only as explicitly non-source-backed scenario props or remove them via a versioned migration. A verified `read_section` cannot grant a whole book's contents; reading must operate over actual installed text. Folio reading and The Doctor Lives' historical memories remain separate evidence classes. Support reading in place, carrying a book, putting it down, resuming at a bookmark, and an unavailable/dark room.

**Acceptance:** 17/17 complete verified sources available through real world actions; one-copy/one-location invariants, no invented pages and no absent-book read; restart does not alter pagination or learning provenance.

### D. Subject viewpoint and actual Pretorius brain

Implement an opt-in, narrow cross-process adapter from new world receipts to `The-Doctor-Lives.PretoriusBrainPort`, reusing the strict first-person projection and typed source-authority boundaries. Admit **seen** world events only, never operator inventories, hidden economic state, arbitrary engine JSON or unseen mail arrivals. Idempotently map an accepted world receipt to exactly one lived-memory admission. Provide a cognitive request/evaluation surface and an explicitly auditable authorization path for the resulting **world act**. Preserve Web-Sim's deterministic policy as a **matched baseline and safe fallback**, not a second personality. Do not count shared natural-language perception or a host-started activity queue as evidence that the real Doctor autonomously selected it. Do not let an LLM write directly to world inventory or historical canon.

**Acceptance:** memory-withheld, stale-observation, false-claim and restart/duplicate controls pass; real-Doctor proposals and matched simple-controller proposals use equal current observations and action affordances; causal differences are recorded from executed, receipted outcomes.

### E. Visible condition and viable choices

Add the old Laboratory's light/room-local perception gates, finite lamp use and scene-local physical access; introduce a persistent general object layer with container capacity, carrying, weight/size/reach, and measured rather than omniscient knowledge. Maintain a subject-only natural-language presentation and an engineer-only numeric audit. Expand options through **affordances**, not by giving an arbitrary free-action menu. A room and its actual objects determine legal choices. Reuse the old fixed synthetic ruler/balance as a declared engineering scenario, not authentic Victorian measurements. Preserve the existing porch mail/catalog lifecycle and roof, fuel and garden simulation.

**Acceptance:** dark or distant items cannot be read, measured, fetched or enumerated; physically occupied slots reject a second occupant; instrument measurements produce reproducible but uncertain source receipts; bad decisions can cause genuine reversible costs and recognized failure.

## P1: make the tower worth inhabiting

The meaningful missing *choices* are not more fake currencies or off-map errands. Give the same room richer opportunity: choosing, opening and using books; writing annotated research observations; preparing different meals from actual ingredients; tending and cultivating specific plants, pressing flowers, drying herbs and keeping records; lighting and maintaining apparatus; collecting and storing specimens; running controlled measurements; cleaning/repairing furniture; maintaining, inspecting and organizing archives; sorting correspondence and sending non-income letters; and quiet leisure, reflection or reading by choice. Every option needs a local object, resources, consequences, elapsed time, and source-grounded receipts. Distinguish character goals from the host's engineering experiment harness.

Prioritize a **small vertical slice** over adding every noun at once: one real book with portable custody, one measured apparatus, one multi-stage investigation, one domestic recovery loop, one correspondence thread and one interrupted-return-to-task test. Expand to the full seventeen books and the remaining interactions only after the vertical slice is reproducible.

## P2: scientific quality and release gates

After parity, test a continuous July-to-December life from ordinary July initial conditions without a separate November infusion. Preserve daily need/cash/travel/coal/resource traces, not just whether Septimus is alive. Use matched challenging seeds, bad-policy and withheld-evidence controls to make failure meaningful. Include 60-day warmth/health, house wear, book study, experiments, self-selected tasks, and source-driven belief revision. Run cross-restart and cross-model continuity tests; the actual Doctor and the simple controller must be distinguishable in a predeclared, held-out outcome, or report the null.

Science should have falsifiable inputs, apparatus, observations, failure modes, reusable notes and follow-up investigation. `experiment` should not always be an instant guaranteed report and payment. Model sustainable economics without hardcoded forced poverty. Historical sources, synthetic scenario facts, and actually lived receipts remain separate. The future Village shop/arrival is a **later independent story and integration gate**, not an ordinary household feature.

## Ownership and promotion semantics

**NEW PHYSICAL OWNER (designated):** `Septimus---Web-Sim` for the ruined tower, its autonomous household, local objects, material consequences and virtual time.

**OLD MECHANICS DONOR (kept intact):** `Pretorius-Laboratory` for 17-books/physics/lighting/custody/measurement and immutable experimental comparison. No mirrored live world, no old save rewritten, no automatic tower=shop assertion.

**EXISTING COGNITIVE OWNER (unchanged):** `The-Doctor-Lives` for Pretorius's active identity/memory/cognition/relationships. The Web-Sim's deterministic chooser is a temporary controlled mode until an explicit bridge and matched scientific validation exists.

**Handoff condition:** Only after the successor passes data integrity, book/object parity, truthful subject projection, continuous activity-time viability, and independently matched real-Doctor world-action tests should the old Laboratory cease being used as the *primary experimental habitat*. Until then, preserve it as a working protected baseline. Promotion does not itself delete old experiments or change Pretorius's identity.

**Decision metric:** Does Septimus maintain a life while producing a growing, trustworthy history of meaningful actions, choices, knowledge and changed surroundings? Mere 60-day survival and large wallet balances are necessary evidence for viability, not the complete game.
