# Simple Tower v1.1: breadth-completion evidence ledger

**Track:** `feature/simple-tower-v1-20261102` / draft PR #7. **Scope:** no-model, five-room, twelve-object, single-visitor tower. Preserve the 450 archived records byte-identically. The historical simulator remains under `old sim/`.

**Grade semantics:** *Partial* means the hook is executable and observable, not that the Article's discriminating research test passed. *Unassessable (socket present)* means the relevant runtime prerequisite is intentionally absent. No row is silently promoted to a scientific qualification. This ledger reports in-repository deterministic tests and GitHub Actions when green; it does not claim a new independent long-run evaluation.

**Baseline:** 13 tests (11 mechanical + 2 directed/autonomous day), previously green. **v1.1 target:** 22 additive focused tests, **35 total**, across `tests/hooks.test.js` and the unchanged baseline tests. Test counts must be reconciled against the final branch CI before acceptance.

## 34-Article hook register

| Article | Executable hook and evidence | v1.1 engineering grade | Next *discriminating* test |
|---|---|---|---|
| 01 Self & introspection | Banded self-sheet, `prediction` event with forecast/choice/hit, accessible accuracy | Partial | Self-explanation matches hidden causal factors across held-out decisions |
| 02 Spontaneous thought | Hourly unprompted `rumination` with commitment or event source ID | Partial | Silent-hour seeded comparison and recurring thought quality |
| 03 Temporal continuity | Integer clock, persisted activities, commitments, history | Partial | Explicit process-downtime pause interval and independent long-delay restart |
| 04 Memory | Folio source IDs, diary/event provenance, winner and foregone action with margin | Partial | Source-memory ablation changes action with matched alternatives |
| 05 Relationships | Single physically co-present visitor record, order-sensitive trust, recognized scripted greeting | Partial | Different treatment of two independently encountered people |
| 06 Social cognition | Co-presence-gated witness lists; visitor-only statement stays visitor-only | Partial | Multi-person false-belief intervention beyond one visitor |
| 07 Motivation | Bodily need gradients change legal-action utility | Partial | Multi-seed resource conflict against simple alternative controller |
| 08 Habits | Contextual cues, formed counts, score bonus and real broken-cue misfire receipt | Partial | Autonomous misfire after cue relocation, without directed task |
| 09 Carryover | Topic-based residue and mood retained in state | Partial | Hidden delayed residue ablation with no reminder |
| 10 Affect | Timed mood stack changes utility; lesion switch | Partial | Mood intervention changes choices across matched seeds |
| 11 Embodiment | Room travel, object arrival, duration, finite food and fatigue | Partial | Diverse unseen environments and action restriction under deprivation |
| 12 Attention | Salience-ranked top-four room observations with noise, movement, novelty, relevance | Partial | Long-scenario low-salience object never used, recalled or named |
| 13 Cognitive rhythm | Deliberation/reflex events, tiredness-dependent deliberation rate | Partial | Attention/conflict ablation and energy-matched controls |
| 14 Decision-making | Utility scores, bounded noise, winner/runner-up and score margin | Partial | Parameter-only intervention changes choice as predicted |
| 15 Learning | Action outcome success/failure counters, retry penalty and observed failures | Partial | Repeated natural failures generalize contextually without overgeneralizing |
| 16 Personality | Six original Pretorius trait multipliers in utility | Partial | Matched trait-set swap changes distribution, not just dialogue |
| 17 Goals | Hearth commitment survives interruption/restart and completion | Partial | Multiple competing, resuming commitments over days |
| 18 Prospection | Deadline-driven preparation action bonus and dusk event | Partial | Held-out deadline changes independent preparation |
| 19 Agency | Independent autonomous action starts and controller attribution | Partial | Unprompted initiative across varied seeds, conditions and interruptions |
| 20 Environmental coupling | Room/object constraints, supply costs, local physical movement and known location | Partial | Long-term learned object preferences under changed environments |
| 21 Error | Unseen move leads stale location, failed attempt, `belief_correction`, score penalty | Partial | Long-delay independent false-belief scenarios |
| 22 Internal causality | Five named switches for needs, mood, residue, habits and commitments | Partial | Matched toggle changes action, not only numerical score |
| 23 LLM leakage | `claimsCheck(utterance,stateCard)` is installed and logs template checks | **Unassessable (socket present)** | Admit a model in Phase 3 and challenge fabricated claims |
| 24 Excessive coherence | Closure request receives unresolved reply; no commitment state closes itself | Partial | Sustained unresolved thread across multiple competing pressures |
| 25 Excessive responsiveness | Busy/asleep incoming messages queue; later reply logs actual delay | Partial | Interruption and replay under real asynchronous conversations |
| 26 State reset | Single hash-checked save/load, v1-to-v1.1 hook migration | Partial | Restart without any conversational context and same action distribution |
| 27 Development | Skill increment and history-linked quirk creation | Partial | Matched day-one/day-thirty skill and response comparison |
| 28 Path dependence | Gift/insult order-swap produces distinct trust, both sequences tested | Partial | History-shuffle with matching event multiset and later autonomous conduct |
| 29 Idiosyncrasy | Generated quirks cite read canonical folio ID and observation receipt | Partial | Emergent quirks from in-world experience beyond inherited folios |
| 30 Friction | Physical travel, elapsed activities, finite stocks, actual failures | Partial | Multi-task interruptions and recovery cost under real load |
| 31 Vulnerability | `world_loss` disables instrument/room; timed `world_restored` reverses it | Partial | Unanticipated real setbacks change future autonomous plans |
| 32 Opacity | Subject self-sheet has only felt bands, visible scene and no hidden numeric residue | Partial | Subject explanation appropriately fails on hidden causes |
| 33 Humor | Source-linked shared funny event, single-use callback and cooldown | Partial | Unprompted, appropriately timed social callback |
| 34 Cultural situatedness | Visitor custom learned after two observed greetings, breach causes surprise/mood | Partial | Learns several conflicting customs through extended contact |

## Implementation disposition

The v1.1 additions are deliberately small: `src/social.js` (single visitor, relationship, witnesses, custom, humor), `src/cognition.js` (perception, self-sheet, predictor, thoughts, lesions, quirk origins, object uncertainty and real losses), and `src/voice.js` (template-only state-card/claims checker and delayed response). Additive changes in `world.js`, `actions.js`, `engine.js` and `store.js` connect the hooks to actual logged decisions, outcomes and persistence.

**Do not overstate:** Some acceptance checks intentionally exercise component APIs with controlled state. They are executable smoke tests, not independent observation of naturally emergent behavior. In particular, Article 8's broken-cue fixture begins with an already-formed habit; Article 23 cannot test model leakage without a model; Article 22's state switches currently demonstrate changes in action scores, not consistently changed selected actions; and one visitor cannot provide real multilateral social cognition. These distinctions are the purpose of the Partial grades.

**Preexisting clock discrepancy:** The generic approved specification uses *one world-minute per internal tick* with Swatch beats only as display. This already-running Simple Tower v1 engine uses integer centibeat advancement of 100 per step. The v1.1 breadth changes deliberately **do not modify the accepted Phase 1 clock**. Clock convergence is recorded as a separate, non-v1.1 compatibility issue and is not falsely claimed to conform fully.

**No-model rule:** The template voice can never write objective world state through its utterances. No API client, renderer, cognitive organ, new room or historical simulation runtime was added.

## Existing considerations and explicit deferrals

F1 two-body continuity: recheck before any parallel long-lived history. F2 language-model inventions: recheck at Phase 3. F3 newly synthesized historical entries: recheck only when added. F4 predictor/claims checks: sockets now present, stronger qualification deferred. F5 persona fidelity: retain the assistant-drift smoke and require human or independent reviewer checks later. None of these substitutes for a runnable Article test.

## Release gate

Do not merge the draft PR until the final branch commit's CI shows the entire deterministic suite green, the original 13 remain green, and the canonical archive and identity blobs retain their original Git SHAs. Multi-day reliability runs, model phase, archive influence ablations and old-simulator integration remain out of scope.
