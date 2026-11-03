# Simple Tower v1.2: discrimination and endurance evidence ledger

**Track:** `feature/simple-tower-v1-20261102` / draft PR #7. **Scope:** no-model, five-room, twelve-object, single-visitor tower. Preserve the 450 archived records byte-identically. The historical simulator remains under `old sim/`.

**Grade semantics:** *Demonstrated (bounded scenario)* means a named discriminating scenario passed, not broad scientific qualification. *Partial* means the hook exists without the stronger test. *Unassessable (socket present)* means its necessary runtime prerequisite is intentionally absent. No row is silently promoted to a scientific qualification. This ledger reports in-repository deterministic tests and GitHub Actions when green; it does not claim a new independent long-run evaluation.

**Test counts:** v1.1 had 35 passing tests. v1.2 added a unique-receipt regression and six matched/longitudinal tests, **42 passed, 0 failed**, on code head `cfb1b7b9e03675bd7bd8c7862031a19d241a21f3` in [GitHub Actions 41578010529](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41578010529). The evidence runner also executed all twelve discriminating probes, including seven negative findings.

## 34-Article hook register

| Article | Executable hook and evidence | v1.2 scenario grade | Next *discriminating* test |
|---|---|---|---|
| 01 Self & introspection | Banded self-sheet, `prediction` event with forecast/choice/hit, accessible accuracy | Partial | Self-explanation matches hidden causal factors across held-out decisions |
| 02 Spontaneous thought | Hourly unprompted `rumination` with commitment or event source ID | Demonstrated (bounded scenario) | Silent-hour seeded comparison and recurring thought quality |
| 03 Temporal continuity | Integer clock, persisted activities, commitments, history | Partial | Explicit process-downtime pause interval and independent long-delay restart |
| 04 Memory | Folio source IDs, diary/event provenance, winner and foregone action with margin | Partial | Source-memory ablation changes action with matched alternatives |
| 05 Relationships | Single physically co-present visitor record, order-sensitive trust, recognized scripted greeting | Partial | Different treatment of two independently encountered people |
| 06 Social cognition | Co-presence-gated witness lists; visitor-only statement stays visitor-only | Partial | Multi-person false-belief intervention beyond one visitor |
| 07 Motivation | Bodily need gradients change legal-action utility | Partial | Multi-seed resource conflict against simple alternative controller |
| 08 Habits | Contextual cues, formed counts, score bonus and real broken-cue misfire receipt | Demonstrated (bounded scenario) | Autonomous misfire after cue relocation, without directed task |
| 09 Carryover | Topic-based residue and mood retained in state | Partial | Hidden delayed residue ablation with no reminder |
| 10 Affect | Timed mood stack changes utility; lesion switch | Demonstrated (bounded scenario) | Mood intervention changes choices across matched seeds |
| 11 Embodiment | Room travel, object arrival, duration, finite food and fatigue | Partial | Diverse unseen environments and action restriction under deprivation |
| 12 Attention | Salience-ranked top-four room observations with noise, movement, novelty, relevance | Partial | Long-scenario low-salience object never used, recalled or named |
| 13 Cognitive rhythm | Deliberation/reflex events, tiredness-dependent deliberation rate | Partial | Attention/conflict ablation and energy-matched controls |
| 14 Decision-making | Utility scores, bounded noise, winner/runner-up and score margin | Partial | Parameter-only intervention changes choice as predicted |
| 15 Learning | Action outcome success/failure counters, retry penalty and observed failures | Partial | Repeated natural failures generalize contextually without overgeneralizing |
| 16 Personality | Six original Pretorius trait multipliers in utility | Demonstrated (bounded scenario) | Matched trait-set swap changes distribution, not just dialogue |
| 17 Goals | Hearth commitment survives interruption/restart and completion | Partial | Multiple competing, resuming commitments over days |
| 18 Prospection | Deadline-driven preparation action bonus and dusk event | Partial | Held-out deadline changes independent preparation |
| 19 Agency | Independent autonomous action starts and controller attribution | Partial | Unprompted initiative across varied seeds, conditions and interruptions |
| 20 Environmental coupling | Room/object constraints, supply costs, local physical movement and known location | Partial | Long-term learned object preferences under changed environments |
| 21 Error | Unseen move leads stale location, failed attempt, `belief_correction`, score penalty | Partial | Long-delay independent false-belief scenarios |
| 22 Internal causality | Five named switches for needs, mood, residue, habits and commitments | Demonstrated (bounded scenario) | Matched toggle changes action, not only numerical score |
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

## v1.2: actual endurance and discrimination evidence

**Authority:** source head `cfb1b7b9e03675bd7bd8c7862031a19d241a21f3`, [passing workflow 41578010529](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41578010529), frozen folio Git blob `718dcc2d5ba4feccdef1690d447edfcebaa9bfb5`. Five unattended seven-day runs were executed with deterministic seeds 11, 12, 13, 14, and 15. The simulation starts on calendar day 0 at @250 and advances exactly 7,000 native 100-centibeat steps per run, meaning each run includes partial initial and terminal calendar days.

**Endurance headline:** 495 total completed actions across 35 elapsed 24-hour windows; each seed exercised ten kinds of action. No seed had a 24-hour window with zero completed activities, nor two consecutive windows restricted to at most two actions. Each seed produced seven or eight folio readings and diary entries; each experienced seven scripted visitor arrivals, **but no witnessed visitor conversation**. Seven habits formed per seed; zero unmodified-baseline cue misfires occurred. Food stocks reached **zero in all five runs**, and there is no modeled death condition. Neither diverse activity nor the absence of a death event proves sustainable embodied life. Full per-seed trajectories are under `evidence/v1.2/endurance/`.

**Restart under load:** seed 13 was saved/reloaded mid-day on simulated days two and five while the work activity was still active. Both restores retained identity, commitments, habit state, work in progress, and exact serialized state. **Failure:** the engine recorded neither a `PAUSED` event nor a pause interval. Article 03 therefore remains Partial. Recording an external audit note of a restart is not equivalent to the world satisfying its downtime contract.

**Real habits:** the positive Article 08 test allowed the action habit to form during autonomous life and then moved its cue object without Pretorius witnessing that move. His subsequently selected autonomous action failed with a `habit_cue_missing` receipt. A defect in the object's movement-event receipt had overwritten the event ID; it was corrected on this branch and covered by a new regression before these results were collected. The controlled intervention does not establish natural misfire frequency.

**Character fidelity:** 30 context-bearing, unscored records, six per seed, are in `evidence/v1.2/fidelity-review.md` and `fidelity-packet.json`. No character-quality judgment has been made on Jay's or Calibos's behalf.

### Twelve discriminator outcomes

| Article | Result | Qualification limit |
|---|---|---|
| 22 | Observed | One matched chosen-action contrast per named switch. Does not prove universal causal isolation. |
| 16 | Observed | Distribution contrast from a matched trait swap across five one-day simulated seeds. |
| 10 | Observed | Matched one-day mood intervention; requires both predicted score direction and actual choice-distribution changes. |
| 14 | Not demonstrated | Declared parameter-only utility weight interface absent; direct editing of global action definitions would violate the test. |
| 04 | Not demonstrated | Requires decision-level folio evidence and a counterfactual change attributable to that evidence, not just locked library access. |
| 09 | Not demonstrated | Two-day no-reminder residue lesion must change chosen action; mere retained numeric residue is insufficient. |
| 18 | Not demonstrated | A new, previously unseen deadline must alter independent preparation; current scoring consults only the original commitment. |
| 17 | Not demonstrated | Both original commitments must survive day transitions and one be resumed without prompting. |
| 03 | Not demonstrated | Pause must be explicit and world time must stay frozen; no code modification to invent the missing PAUSED event. |
| 12 | Not demonstrated | Low-salience kettle must neither be observed nor independently selected/used; high-salience arrival must be registered. |
| 02 | Observed | This is a weak shuffled-source baseline; verifies anchored rumination frequency, not rich independent cognition. |
| 08 | Observed | At least one natural habit forms under autonomous play and is later defeated by an unseen physical cue relocation, without directed action. |

Five rows advanced to **Demonstrated (bounded scenario)**: 02, 08, 10, 16 and 22. **28 remain Partial; 23 remains Unassessable** until model admission. Article 02 used a deliberately weak shuffled-source baseline, not a robust preregistered cognitive study. Article 28's separate 1,000-tick order-swap regression preserves different trust scores across time but does not demonstrate different subsequent autonomous conduct, so its grade does not advance.

**Seven negative findings stay open:** Article 14 has no declared utility-weight intervention interface; Article 04 cannot trace action-score influence to a retrieved folio; Article 09 retains topic residue over two days but a residue ablation does not change the decision scores; Articles 17 and 18 currently consult only the first commitment and overwrite the list at day boundaries; Article 03 has no PAUSED event; Article 12's low-salience object was eventually perceived in the three-day scenario. The full negative traces appear in `evidence/v1.2/discriminations.json`.

**Out-of-scope constraints maintained:** no model, new room, organ, old-sim runtime import, canon change, 30-day developmental comparison, or parallel tower history was introduced. The existing timing contract (100 centibeats per game step) is unchanged. Since 1 centibeat = 864 milliseconds, a nominal one-minute macro step cannot be exactly represented by 69 centibeats (59.616 seconds); any clock convergence requires a separate explicit decision.
