# Minimum Viable Inhabitant — Combined Build Specification v1

**Status:** Approved basis. This is the GENERIC (no-character) spec — as of 2026-11-02 it serves as the backup design on the shelf. The actual build track is the tower-track companion (~/workspace/reviews/mvi-tower-track-spec-v1.md): same architecture, but set in Pretorius's tower with his history present as flavor. Where the two differ, the companion governs the build. Written 2026-11-02 by Calibos at Jay's direction.
**Working name:** MVI-1 (Jay may rename; naming is his creative act).

## 0. Basis and provenance

This spec combines four sources, each used for what it is actually good at:

| Source | What it contributes here |
|---|---|
| *Minimum Viable Inhabitant* (Claude) | The architecture spine: 10 systems, ground rules, build order, smoke tests, the extra mechanisms (surprise, boredom, sleep consolidation) |
| *Design Specification v1* (DeepSeek, via ChatGPT) | Custody rules, the three-layer model, the data contract shape, evidence grades, its corrections register (C01–C10) |
| *Integrated Path Forward* (ChatGPT deep dive) | The Article-mapping corrections (acceptance definitions), the centibeat rounding correction, pause policy, decision-origin attribution, action receipts, the G0–G6 ladder for later qualification |
| Portfolio audit of 2026-11-02 (Calibos) | The donor map: which existing code is copied, rewritten, or skipped for every system (~/workspace/reviews/articles-audit-2026-11-02.md) |

Decisions already made by Jay and treated as settled in this spec:

- **Build the simple thing.** A small game-like Sim that addresses all 34 Articles breadth-first, basic on purpose. Depth comes later, from this baseline. Do NOT build on the Candidate B / Doctor–Laboratory integration line; it remains exam hall and donor, its R4 failure a bounded open diagnosis, not a foundation.
- **This inhabitant is a generic baseline (the deep dive's C0 class).** It is not Pretorius, not Calibos, not Kiki. It tests mechanics honestly and is never passed off as any existing person. Its identity is a small external file it cannot edit (Septimus pattern).
- **No coverage theater.** Every Article gets a mechanism and a test, graded honestly. In a one-person house (plus one scripted visitor), the social Articles grade Partial or Unassessable at v1 — never Passed, never Failed.
- **Swatch Internet Time is the display standard** (Jay's signature; @000–@999, Biel Mean Time UTC+01:00, no daylight saving). It is never the internal arithmetic unit — see §3.

What this spec does not claim: consciousness, sentience, subjective experience, or that passing a smoke test resolves a philosophical critique. Passing means: *the mechanism ran and the specified behavior was observed in the specified scenario.*

## 1. Design thesis

The world determines what happened, what can happen, and what changes. The inhabitant decides in plain code from named state. A language model, when admitted (Phase 3), narrates from an authorized state card; its words never become world facts. With the model switched off, the inhabitant still lives and speaks in template lines.

Ground rules (from the Claude doc, unchanged):

1. Done means it runs — watched working, this week.
2. One short file per system (~200 lines). If it needs more, the design is too big; cut the design.
3. No model call on the tick.
4. One save bundle is the whole inhabitant (checkpoint JSON + event log JSONL). Nothing that matters lives only in a chat context.
5. Steal first — from Jay's own portfolio first of all (donor map, §2). Licensing is not deferred for anything taken from outside the portfolio.
6. Every decision writes a log line naming the numbers and the decision origin that drove it.
7. Breadth before depth. Kill rule: if a phase is not running in about a week, shrink the phase; do not extend it.

Implementation language: **Python, standard library only** — the majority of donors are Python, the single most portable donor file (`resident_life.py`) copies directly, and stdlib-only keeps the whole thing runnable anywhere with no install step.

## 2. Architecture — the 10 systems

Each system: the simplest mechanism that answers its Articles, its donor, and its smoke test. Donor verdicts are from the 2026-11-02 audit.

### S1. Clock and save bundle
- **Mechanism:** Integer world clock (§3). Append-only event log (JSONL, hash-chained) + atomic JSON checkpoint. On restart, state is rebuilt from the bundle; downtime is recorded as an explicit `PAUSED` interval — the clock does not advance while the process is down (pause policy, v1).
- **Donors:** Copy — Septimus `organism.js` journal discipline (hash chain, fsync, genesis record), ported; Lab `store.py` backup/restore shape. Rewrite — the clock driver itself (new, §3).
- **Smoke test:** Run, quit, relaunch hours later: state identical, `PAUSED` interval logged, no invented activity, event order intact.

### S2. Body and needs
- **Mechanism:** Five needs — energy, hunger, thirst, warmth, stimulation — plus health as a derived consequence, each with its own decay curve and a small random wobble. Every need exists in two layers: **actual** (the runtime's number) and **felt** (the inhabitant's lagged, noisy perception of it). Actions cost time and needs; at zero energy, actions become unavailable. Finite stocks (food, water, fuel) gate consumption.
- **Donors:** Copy — Lab `daily_rhythm.py` accrual/gating pattern (retuned); calibos-mind `interoception.py` felt-vs-actual design; home_sim's spatial body (rooms, integer levels, affordances). Rewrite — the merged five-need table.
- **Smoke test:** Starve one need: priorities visibly swap in the decision log; at zero stock the eat action fails and the failure changes the next choice.

### S3. Perception filter
- **Mechanism:** Each tick the inhabitant perceives only its current room, ranked by salience (movement, noise, relevance to an active need, novelty), **hard cap: top 4**. Anything not perceived is not known and cannot be acted on, remembered, or mentioned. Perceptions are records carrying confidence, salience, and source.
- **Donors:** Copy — Village `resident_life.record_perception` (bounded record with confidence/salience/source_id); Doctor-Lives `awareness.py` routing shape (focal 1 / conscious 3) as the cap design. Rewrite — the spatial front-end (room-based candidate generation).
- **Smoke test:** A low-salience object sits in the room for a day and is never mentioned, never used, and absent from memory.

### S4. Event log and memory
- **Mechanism:** Every event: unique id, tick, actor, type, target, outcome, witnesses, weight, tags, source class (`saw_it` / `was_told` / `inferred` / `dreamed` — classes never merged). Memory is a view over the log: retrieval scores recency (ACT-R-style decay) × weight × tag overlap with the current situation, and retrieved memories change action scores, not just dialogue. Nightly consolidation pass: strengthen what repeated, compress the rest into structured summaries that keep their provenance.
- **Donors:** Copy — Doctor-Lives memory/provenance machinery (evidence classes, salience formula) simplified; Septimus hash-verified memory evidence (a memory whose source event is gone or altered is inert); calibos-mind consolidation discipline (supersede, never silently rewrite). 
- **Smoke test:** Delete one memory's source event in a fork: the action that depended on it changes; the inhabitant does not "remember" the deleted event in speech.

### S5. Mood and traits — NEW ASSEMBLY (runs nowhere today)
- **Mechanism:** Mood is a **stack of timed modifiers** (event → modifier with value and expiry, RimWorld-thoughts style), feeding caution, sociability, and risk in the action scores. Traits are **6 fixed multipliers** set at creation (e.g. sociable, industrious, nervous, curious, stubborn, gentle) that multiply score factors and thresholds. Mood moves; traits don't (except by the slow drift of S7/S9 path rules).
- **Donors:** Assemble — Village `resident_life` affect episodes (half-life decay; strong affect generates goals) + Village `prototype/engagement-tiers/sim.py` trait-multiplier scoring + calibos-mind ambivalence margin logging. No single donor is copied whole; this is the one system that is genuinely assembled from three.
- **Smoke test:** Remove one mood modifier in a fork: the choice distribution changes measurably. Swap the trait set in a clone: the same scenario yields different choices.

### S6. Action picker with habits
- **Mechanism:** Utility AI over feasible actions only: `score = needDeficit·needWeight − pathCost + moodEffect + traitEffect + memoryResidue + commitmentUrgency + habitBonus − resourceCost`, picked with bounded seeded noise (softmax-style), never strict maximum. Repeated successes in a context increment a habit counter; past threshold (default 5), the action runs at reduced deliberation cost — and can misfire naturally if its cue is absent (a misfire is an outcome, never staged). **Surprise:** each action carries an expected outcome; the gap between expectation and result raises attention and memory weight and writes a surprise record.
- **Donors:** Copy — Septimus `Simulation.choose` shape (seeded stable noise, recency penalty); Village engagement-prototype habit bonus (capped); calibos-mind `habits.py` formation/dormancy logic. 
- **Smoke test:** Change one input: the pick changes as the logged arithmetic predicts. After 5 repeats the log marks a habit; remove the habit's cue object and a misfire occurs on its own.

### S7. Commitments and calendar
- **Mechanism:** A commitments table: intention, trigger, deadline (world time), next step, status — with first-class statuses **open / kept / broken / released / superseded**, never reconstructed from one another. As a deadline approaches, preparation actions gain score (prospection ramp). A simple calendar holds expected events (market day, the visitor's arrival, seasonal markers). Commitments survive interruption and resume; completing or releasing one is an event, not an edit.
- **Donors:** Copy — Doctor-Lives commitment lifecycle + calibos-mind status taxonomy; Village calendar/scheduled-events pattern.
- **Smoke test:** Set a goal, interrupt with a day of other tasks: it resumes unprompted, prepares before its deadline, and stops when kept or released.

### S8. Self sheet and predictor — PREDICTOR IS NEW (exists in no base)
- **Mechanism:** A readable self sheet: current needs (felt **bands**, never exact digits — the inhabitant does not have engineer access to itself), mood modifiers it can feel, open commitments, current goal, strongest memories. Some state (residue, S9) is marked hidden from the sheet — "I don't know why I avoid that room" can be literally true. **Predictor:** before each deliberated choice, the inhabitant logs a one-line prediction of its own pick, from the sheet's view only. The picker then chooses; hit or miss is recorded. Prediction accuracy is a tracked, published number.
- **Donors:** Copy — calibos-mind `cmd_status` felt-bands sheet + counterfactual margin log; Doctor-Lives felt-vs-engineer access discipline. New — the predictor and hit-rate tracker (~50 lines).
- **Smoke test:** Over a day of deliberated choices, a hit rate exists and is computed from the log; asked why it acted, the inhabitant quotes logged factors that match the decision record.

### S9. Voice with claims check — CHECKER IS NEW (exists in no base)
- **Mechanism (two stages):** (a) **State card:** the voice (template lines in Phases 1–2; an LLM in Phase 3) receives only the self sheet + perceived scene + retrieved memories with provenance. It may phrase; it may not assert. (b) **Claims check (post-hoc, new):** every finished utterance is scanned for claims of the forms *I remember X*, *I did/feel X*, *I have/own X*, *person P said/did X*. Each claim must cite a log event id, a sheet field, or a world record, or it is struck/hedged and the failure logged. Symbol grounding is the same check: the voice may only name objects, places, and people in the world tables.
- **Donors:** Copy — Lab `SubjectPort` boundary (verified state in, first-person text out, hidden fields rejected); Doctor-Lives `RenderRequest` (read-only, provenance-tagged, user input marked untrusted); calibos-mind custody pattern (state-card-only context, freshness refusal). New — the claims checker itself.
- **Smoke test:** Bait it with an event that never happened: it denies or hedges, and any invented claim that slips through appears in the claims-failure log, not in the world.

### S10. Social records (one visitor at v1)
- **Mechanism:** One scripted visitor on a schedule (the social minimum that makes Articles 5, 6, 33, 34 testable at all). Per-person record: stable recognition marker, witnessed-event list, trust/affinity/grievance derived **only** from specific shared events (order-sensitive rule: gift-then-insult ≠ insult-then-gift, per the Spec's worked example), a customs table learned by observation. The inhabitant tracks what the visitor has and has not witnessed; unwitnessed = not known by them.
- **Donors:** Copy — Village `resident_life.py` social records + RumorRegistry witness gating (pure Python, zero Evennia imports — the audit's most portable asset); Doctor-Lives relationship-events ledger shape.
- **Smoke test:** Tell the visitor a fact in private; later, the inhabitant does not treat the *player* as knowing it, and treats the visitor differently from a stranger with an identical profile.
- **Grade ceiling:** Articles 5, 6, 33, 34 cap at **Partial** in this slice. Full sociality is a later phase (Village integration is the named direction, not a v1 task).

### Core loop

```
every tick:
  advance world clock (integer ticks, §3)
  apply need decay, stock and event consequences
  perceive: rank room candidates, keep top 4
  record events; update memory weights, mood stack, residue
  compare expectation vs outcome (surprise)
  check commitments: deadlines, prep ramp, overdue
  if deliberation warranted (novelty, conflict, or commitment pressure):
      log self-prediction (S8)
  score feasible actions; log decision line with origin + factors
  choose with bounded noise; run action (it can fail); write receipt
while down: nothing happens; on restart, log PAUSED interval

when someone speaks:
  check availability (asleep / busy / mid-task) — delay or defer is allowed
  build state card → voice → claims check → reply
nightly:
  sleep consolidation over the day's log; dream-flavored thought entries
  drawn only from the day's real records (marked dreamed, never evidence)
```

Decision origins (deep dive discipline): every decision line is tagged **native** (the picker), **host** (a scripted world event proposed it), **visitor/player** (a request — a request is not an accomplished action), or **model** (Phase 3 proposer, separately labeled, never in v1–v2).

## 3. Clock contract

The deep dive's correction stands: a 10-minute step equals 6250/9 centibeats — a non-integer — so any design that ticks in coarse steps and rounds to centibeats accumulates error. Resolution:

- **Internal unit: 1 tick = 1 world-minute.** 1,440 ticks/day. All durations, deadlines, decays, and cooldowns are integer ticks. Arithmetic is exact; nothing ever rounds internally.
- **Swatch is display only, derived from the absolute tick:** within a world day, `centibeats = floor(minuteOfDay × 100000 / 1440)`, displayed as `@BBB.CC` (beats = centibeats ÷ 100). Because the display is recomputed from the absolute tick every time — never incremented step by step — rounding cannot accumulate.
- **Real-time driver:** the process advances ticks from monotonic elapsed real time at a declared rate (default: accelerated for tests; a real-time rate for live runs), persisting the last committed tick after each batch. A timer is a wake-up, not a clock (Spec correction C01).
- **Pause policy (v1):** process down = world paused. Restart logs a `PAUSED` interval with real timestamps. Offline catch-up is a later, separately labeled treatment, never silently applied.
- The inhabitant experiences world time only through in-world observation (light, hunger, the calendar) — it is never handed the operator's wall clock.

## 4. Data contract

One bundle per inhabitant: `checkpoint.json` (derived state, atomic write) + `events.jsonl` (append-only, hash-chained, the authority). Field sketch (exemplary names):

```json
{
  "schemaVersion": 1,
  "clock": {"absoluteTick": 14500, "pausedIntervals": []},
  "identity": {"id": "inhabitant_01", "name": "…", "identityHash": "…"},
  "inhabitant": {
    "needsActual": {"energy": 75, "hunger": 30, "thirst": 20, "warmth": 80, "stimulation": 60},
    "needsFelt":   {"energy": 70, "hunger": 35, "thirst": 22, "warmth": 78, "stimulation": 60},
    "moodStack": [{"label": "burned_self", "value": -3, "expiresTick": 16000, "sourceEventId": "e104"}],
    "traits": {"sociable": 1.2, "industrious": 1.0, "nervous": 0.8, "curious": 1.4, "stubborn": 1.0, "gentle": 1.1},
    "position": {"room": "kitchen"}, "carrying": ["mug"],
    "habits": {"make_tea@morning": {"count": 6, "formed": true}},
    "residue": {"hearth_room": -0.4, "visitor": 0.2},
    "activeCommitments": ["c3"]
  },
  "commitments": [{"id": "c3", "text": "…", "dueTick": 20160, "status": "open", "nextStep": "…"}],
  "predictions": [{"tick": 14490, "predicted": "make_tea", "actual": "make_tea", "hit": true}],
  "world": {"rooms": ["…"], "objects": [{"id": "stove", "room": "kitchen", "state": "intact", "stock": {}}]},
  "people": {"visitor_01": {"trust": -5, "witnessed": ["e98"], "events": ["e98", "e101"]}},
  "customs": [{"text": "…", "observations": 3, "sourceEventIds": ["…"]}]
}
```

Rules: derived values (trust, felt needs, mood) are either recomputed from the event log or stamped with the event revision that produced them. A save may not contain events from the future relative to its committed tick. Narration is stored marked `narration` and is never memory-eligible (Septimus rule). The identity file lives outside the bundle and is hash-checked at load; the inhabitant cannot edit it.

## 5. The 34 Articles — acceptance matrix

Definitions follow the deep dive's corrected interpretations. **V1 ceiling** is the best grade this slice can honestly earn: **D** = Demonstrable (the smoke test can fully pass in the slice), **P** = Partial by construction (mechanism runs; the strong form of the critique needs more world, more people, or more time), **U** = Unassessable in the slice (prerequisite absent; graded as such, not as failure).

| # | Article | Mechanism (system) | Acceptance test | V1 ceiling |
|---|---|---|---|---|
| 1 | Self & Introspection | Self sheet + predictor (S8) | Prediction hit rate computed from the log; "why" answers quote the logged factors that actually drove the choice | D |
| 2 | Spontaneous Thought | Idle ticks draw rumination from open commitments + high-weight memories into a thought log (S4/S7) | After an hour unattended, thought entries tie to real open items, not generic filler | D |
| 3 | Temporal Continuity | Clock + bundle (S1), pause policy declared | Quit and relaunch: an earlier worry persists at decayed intensity; PAUSED interval logged, no invented activity | D |
| 4 | Memory | Weighted log + retrieval that moves scores (S4) | Delete a source event in a fork: the dependent action changes and the memory goes inert | D |
| 5 | Relationship | Per-person records from specific events (S10) | Same profile, different histories → measurably different treatment | P (one visitor) |
| 6 | Social Cognition | Witness lists; knowledge tracked per person (S10) | A secret told to the visitor is not treated as known by the player, or vice versa | P (one visitor) |
| 7 | Motivation | Competing needs with distinct curves (S2/S6) | Starve one need: priority swaps in the log, then recovers | D |
| 8 | Habits | Counters → cheap execution (S6) | Past threshold the log marks a habit; a cue change produces a natural misfire — a staged misfire is NOT required and does not count | D |
| 9 | Carryover | Hidden residue on rooms/objects/topics (S6) | A bad event in a room produces later quiet avoidance, unannounced in dialogue | P (residue is a narrow form of preconscious carryover) |
| 10 | Affect | Mood stack with declared decay (S5) | Remove one modifier in a fork: choices change; tone follows the stack, not a script | D |
| 11 | Embodiment | Body struct, rooms, carrying limit, stocks (S2) | At zero energy or empty hands/stock, actions are genuinely unavailable | D |
| 12 | Attention | Salience ranking + top-4 cap (S3) | A low-salience object in the room goes unnoticed, unused, unmentioned | D |
| 13 | Cognitive Rhythm | Cheap reflex ticks; deliberation only on novelty/conflict; low energy shrinks the deliberation budget (S6/S8) | Deliberation rate in the log varies predictably with urgency and energy | D |
| 14 | Decision Making | Utility scoring with disclosed noise (S6) | Change one input: the pick changes as the arithmetic predicts; tie-breaking and noise are logged, host contributions attributed | D |
| 15 | Learning | Outcome table per action/context updates expected value (S6) | After repeated failure at X, attempts at X (and near contexts) decline; distinguish from pure memory effects | D |
| 16 | Personality | 6 trait multipliers (S5) | Swap the trait set in a clone: same scenario, different choices; traits stay stable across prose changes | D |
| 17 | Goal Structure | Commitments with lifecycle (S7) | Set a goal, interrupt for a day: it resumes, and stops on kept/released | D |
| 18 | Prospection | Deadline prep ramp + calendar (S7) | Preparation begins before anyone mentions the deadline | D |
| 19 | Agency | Scheduler + initiative from commitments/needs (S6/S7) | A meaningful action begins with no chat input, inside a permission list, with its origin logged as native | D |
| 20 | Environmental Coupling | Per-object history + residue (S4/S6) | It prefers the chair it uses and avoids the stove that burned it — prior experience changes use, not just stock counts | D |
| 21 | Error | Partial perception + stale beliefs + fatigue-scaled execution noise (S3/S6) | It acts on an outdated belief about a moved object, then corrects. Injected typos or staged failures do NOT count | D |
| 22 | Internal Causality | Every decision reads named state; each state has a debug switch (S6) | For each named state: flipping its switch changes behavior in the predicted direction. (Engineering causality only — no claim about intrinsic physical causation or integrated information) | D |
| 23 | LLM Leakage | State card + claims check (S9) | Bait with a non-event: denial/hedge; any slipped invention is in the claims-failure log. Includes renderer-swap control | D (Phase 3; template stage graded P) |
| 24 | Excessive Coherence | Open threads stay open until an event closes them (S4/S7) | A pending issue survives a "let's just resolve this" request and remains consequential | D |
| 25 | Excessive Responsiveness | Availability states with real costs (S9 loop) | While asleep or mid-task it does not answer instantly; the message queues. Manufactured rudeness does NOT count | D |
| 26 | State Reset | Bundle is the inhabitant; model context rebuilt per call (S1/S9) | Wipe all model context: behavior unchanged; deliberate resets/deletions are disclosed in the log | D |
| 27 | Developmental History | Skill XP + slow drift + log of firsts (S4/S6) | Day 1 vs day 30 of the same task differ in speed or choice, from lived events only — reconstructed prehistory does NOT count | P (needs the 30 days to actually run) |
| 28 | Path Dependence | Order-sensitive slow-variable rules (S10/S5) | Gift→insult vs insult→gift leave different trust by the declared rule. (Convergence is acceptable when causal states genuinely converge — difference must be predicted, not forced) | D |
| 29 | Idiosyncrasy | Preferences seeded from first experiences (S4/S5) | Every quirk on the sheet cites its origin event. A hard-coded quirk is a configured preference and does NOT count | P (only as many quirks as the run has lived) |
| 30 | Friction | Time/energy costs, failure, costly retries (S2/S6) | No action is instant and free. Efficiency is not a failure; suffering is not required | D |
| 31 | Vulnerability & Stakes | Reversible consequential losses (S2) | A broken tool or locked room changes later options and preparation. Death is not required | D |
| 32 | Opacity | Hidden state genuinely withheld from sheet and card (S8/S9) | Its self-explanations match its access flags; exact hidden values appear in neither its speech nor its card. Operator audit access is preserved | D |
| 33 | Humor | Funny-tagged shared events → callback list with cooldown (S10) | One unprompted, partner-specific callback to a real shared incident. Generic jokes do NOT count | P (one visitor) |
| 34 | Cultural Situatedness | Customs table learned by observation (S10) | A violated custom produces surprise + a logged reaction + changed later interpretation, without restating the custom as lore | P (one visitor, few customs) |

## 6. Build order

**Phase 0 — Harness (days, not weeks).** Repo skeleton, decision-log format, bundle load/save, one smoke-test runner per Article. No inhabitant yet.

**Phase 1 — Vertical slice.** One house (3 rooms), ~10 objects, S1–S4 + S6 in minimal form, template voice (S9 stage a only), thought log. Target: Articles 2, 3, 4, 7, 11, 12, 14, 19, 22, 25, 26, 30 demonstrable; **first acceptance run = one coherent day** (deep dive G2 shape): wake, eat from finite stock, work, prepare for a known event, be interrupted, restart mid-day, sleep — with zero phantom objects, zero duplicate completions, zero invented activity.

**Phase 2 — Depth.** S5 mood/traits assembly, S7 commitments + calendar, S8 self sheet + predictor, habits fully, surprise, sleep consolidation, residue. Target: Articles 1, 8, 9, 10, 13, 15, 16, 17, 18, 20, 21, 24, 27(partial), 32 demonstrable.

**Phase 3 — Voice and people.** LLM behind the state card + the claims checker (S9 complete), the visitor and S10, humor callbacks, customs. Target: Articles 5, 6, 23, 28, 29, 33, 34 at their Partial ceilings.

**Phase 4 — only after 1–3 run.** Longitudinal runs (30-day development evidence), renderer-swap and memory-lesion controls (deep dive G4), the G0–G6 qualification ladder for any stronger claims. Social expansion toward the Village is a separate decision after Phase 3 grades are in.

Kill rule per phase: not running in ~a week → shrink the phase, never extend it.

## 7. Evidence protocol

- **Grades:** Specified (in this document only) / Demonstrated (a versioned run produced the behavior) / Partial (works in the narrow scenario) / Not demonstrated. Nothing is reported above its grade.
- **Evidence record per test:** scenario id, initial bundle, input or tick range, seed, event log excerpt, final bundle, renderer context + output (voice tests), expectation, observed result, build version.
- **Decision log line (every deliberated choice):** tick, origin (native/host/player/model), candidate actions with scores and their factor breakdown, prediction (S8) where applicable, chosen action, receipt id, outcome, surprise value where applicable.
- **Controls available from Phase 2:** memory-withheld, shuffled-history, event-order swap, state-switch interventions, renderer swap. Interventions happen in forks; canonical history is never edited to manufacture a result.
- **Failure is data.** A failed smoke test stays in the record with its trace; gates are never weakened to obtain green.

## 8. Open calls (Jay's, not blocking Phase 0–1)

1. The inhabitant's name and the project's public name (working name MVI-1 until then).
2. Whether the visitor is a scripted character with a small fixed repertoire (spec assumption) or a second simple inhabitant running the same kernel (more honest social tests, roughly double the Phase 3 work).
3. Phase 3 voice model: local small model vs frontier API — the claims checker is model-agnostic either way.
4. Whether offline catch-up ever replaces the pause policy, and under what labeling.
5. Public repo or private until Phase 1 runs (the Swatch canary logic argues public; the call is Jay's).

## 9. Explicit non-goals

- Not a Candidate B revival, not a Doctor–Laboratory integration, not a Septimus replacement (Septimus continues as its own project; this spec borrows its disciplines, not its world). Frankenstein Village is a donor and a possible later social home, not the v1 host.
- No new cognitive organs, no service architecture, no commercial engine.
- No claim — in code comments, README, or speech — that any Article is "solved." The register is the claim.
