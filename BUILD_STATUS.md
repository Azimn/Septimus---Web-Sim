# Simple Tower v1.4: long-horizon development and discrimination ledger

**Track:** `feature/simple-tower-v1-20261102` / draft PR #7. **Scope:** no-model, five-room, twelve-object, single-visitor tower. Preserve the 450 archived records byte-identically. The historical simulator remains under `old sim/`.

**Grade semantics:** *Demonstrated (bounded scenario)* means a named discriminating scenario passed, not broad scientific qualification. *Partial* means the hook exists without the stronger test. *Unassessable (socket present)* means its necessary runtime prerequisite is intentionally absent. No row is silently promoted to a scientific qualification. This ledger reports in-repository deterministic tests and GitHub Actions when green; it does not claim a new independent long-run evaluation.

**Latest verified run:** [v1.4 Actions 41591212992](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41591212992), **65 passed, 0 failed** (53 existing and 12 new); 5 x 30 unattended days plus eight scenario probes. **Prior:** [v1.3 Actions 41581300405](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41581300405), 53 passing, 0 failing (42 preserved and 11 new). **Previous evidence:** v1.1 had 35 passing tests. v1.2 added a unique-receipt regression and six matched/longitudinal tests, **42 passed, 0 failed**, on code head `cfb1b7b9e03675bd7bd8c7862031a19d241a21f3` in [GitHub Actions 41578010529](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41578010529). The evidence runner also executed all twelve discriminating probes, including seven negative findings.

## 34-Article hook register

| Article | Executable hook and evidence | v1.4 bounded grade | Next *discriminating* test |
|---|---|---|---|
| 01 Self & introspection | Banded self-sheet, `prediction` event with forecast/choice/hit, accessible accuracy | Demonstrated (bounded scenario) | Only 15 of 30 self-explanations name positively supported causes; test held-out causal factors and non-tautological explanations. |
| 02 Spontaneous thought | Hourly unprompted `rumination` with commitment or event source ID | Demonstrated (bounded scenario) | Silent-hour seeded comparison and recurring thought quality |
| 03 Temporal continuity | Integer clock, persisted activities, commitments, history | Demonstrated (bounded scenario) | Test actual long offline restarts and persistent writer custody. |
| 04 Memory | Folio source IDs, diary/event provenance, winner and foregone action with margin | Demonstrated (bounded scenario) | Test delayed memory ablation across several source folios and novel decisions. |
| 05 Relationships | Single physically co-present visitor record, order-sensitive trust, recognized scripted greeting | Partial | **Blocked on Jay's design decision:** introduce a second independently encountered person, scripted visitor or kernel inhabitant. |
| 06 Social cognition | Co-presence-gated witness lists; visitor-only statement stays visitor-only | Partial | **Blocked on Jay's design decision:** introduce a second independently encountered person, scripted visitor or kernel inhabitant. |
| 07 Motivation | Bodily need gradients change legal-action utility | Demonstrated (bounded scenario) | Compare against stronger need planners and equal-resource no-calendar ablations. |
| 08 Habits | Contextual cues, formed counts, score bonus and real broken-cue misfire receipt | Demonstrated (bounded scenario) | Autonomous misfire after cue relocation, without directed task |
| 09 Carryover | Topic-based residue and mood retained in state | Demonstrated (bounded scenario) | Test delayed source interventions without manually chosen near-tie needs. |
| 10 Affect | Timed mood stack changes utility; lesion switch | Demonstrated (bounded scenario) | Mood intervention changes choices across matched seeds |
| 11 Embodiment | Room travel, object arrival, duration, finite food and fatigue | Partial | Diverse unseen environments and action restriction under deprivation |
| 12 Attention | Salience-ranked top-four room observations with noise, movement, novelty, relevance | Demonstrated (bounded scenario) | Test cross-room perception with untagged low-salience objects. |
| 13 Cognitive rhythm | Deliberation/reflex events, tiredness-dependent deliberation rate | Partial | Attention/conflict ablation and energy-matched controls |
| 14 Decision-making | Utility scores, bounded noise, winner/runner-up and score margin | Demonstrated (bounded scenario) | Test alternative weights over independent long-run seeds. |
| 15 Learning | Action outcome success/failure counters, retry penalty and observed failures | Demonstrated (bounded scenario) | Prove reattempt learning across genuinely varied contexts and longer time. |
| 16 Personality | Six original Pretorius trait multipliers in utility | Demonstrated (bounded scenario) | Matched trait-set swap changes distribution, not just dialogue |
| 17 Goals | Hearth commitment survives interruption/restart and completion | Demonstrated (bounded scenario) | Test three competing unprompted obligations with missed deadlines across a full week. |
| 18 Prospection | Deadline-driven preparation action bonus and dusk event | Demonstrated (bounded scenario) | Test novel due dates that change real preparation timing across days. |
| 19 Agency | Independent autonomous action starts and controller attribution | Partial | Unprompted initiative across varied seeds, conditions and interruptions |
| 20 Environmental coupling | Room/object constraints, supply costs, local physical movement and known location | Partial | Long-term learned object preferences under changed environments |
| 21 Error | Unseen move leads stale location, failed attempt, `belief_correction`, score penalty | Demonstrated (bounded scenario) | Repeat with spontaneously relocated objects and unconstrained path access. |
| 22 Internal causality | Five named switches for needs, mood, residue, habits and commitments | Demonstrated (bounded scenario) | Matched toggle changes action, not only numerical score |
| 23 LLM leakage | `claimsCheck(utterance,stateCard)` is installed and logs template checks | **Unassessable (socket present)** | Admit a model in Phase 3 and challenge fabricated claims |
| 24 Excessive coherence | Closure request receives unresolved reply; no commitment state closes itself | Demonstrated (bounded scenario) | Test multiple simultaneously pressured open threads and retained anxiety over longer delays. |
| 25 Excessive responsiveness | Busy/asleep incoming messages queue; later reply logs actual delay | Partial | Interruption and replay under real asynchronous conversations |
| 26 State reset | Single hash-checked save/load, v1-to-v1.1 hook migration | Demonstrated (bounded scenario) | Repeat process-downtime and replay over different hosts, elapsed intervals and concurrent events. |
| 27 Development | Skill increment and history-linked quirk creation | Demonstrated (bounded scenario) | Test if experience-driven skill changes cause improved outcomes, not just accumulated counters or habits. |
| 28 Path dependence | Gift/insult order-swap produces distinct trust, both sequences tested | Demonstrated (bounded scenario) | Test downstream conduct across longer histories, varied personalities and another visitor in a later phase. |
| 29 Idiosyncrasy | Generated quirks cite read canonical folio ID and observation receipt | Partial | Emergent quirks from in-world experience beyond inherited folios |
| 30 Friction | Physical travel, elapsed activities, finite stocks, actual failures | Partial | Multi-task interruptions and recovery cost under real load |
| 31 Vulnerability | `world_loss` disables instrument/room; timed `world_restored` reverses it | Demonstrated (bounded scenario) | Only one of five seeds showed post-recovery divergence; test stronger persistent setbacks and varied losses. |
| 32 Opacity | Subject self-sheet has only felt bands, visible scene and no hidden numeric residue | Demonstrated (bounded scenario) | Test inaccurate self-knowledge over multiple hidden causes with honest uncertainty. |
| 33 Humor | Source-linked shared funny event, single-use callback and cooldown | Demonstrated (bounded scenario) | Test appropriate callback under changing relationships and different shared funny events. |
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

### Named grade-promotion tests

These five live tests in `tests/v12.test.js` call `scripts/v12_probe.js` against the actual code and passed at source SHA `cfb1b7b9e03675bd7bd8c7862031a19d241a21f3` in [Actions 41578010529](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41578010529). Each is a limited scenario demonstration, not general Article qualification.

| Article | Before | After | Named passing test |
|---|---|---|---|
| 02 | Partial | Demonstrated (bounded scenario) | `Article 02: unattended hourly rumination sources beat the declared weak shuffled control` |
| 08 | Partial | Demonstrated (bounded scenario) | `Article 08: a naturally formed habit misfires after an unseen cue relocation without player commands` |
| 10 | Partial | Demonstrated (bounded scenario) | `Article 10: bounded mood intervention changes real activity counts in the predicted score direction` |
| 16 | Partial | Demonstrated (bounded scenario) | `Article 16: one matched trait swap changes one-day choice distributions` |
| 22 | Partial | Demonstrated (bounded scenario) | `Article 22: all five state lesions change a selected autonomous action` |

The additional `Article 28: distinct social event order persists across 1000 autonomous ticks, not yet a conduct difference` test passes for persistence of trust history but does **not** advance Article 28, since independently selected downstream conduct did not change.

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


## v1.3: what the consequences round showed

**Reproducible source head:** `00ef3ae1c8416ab7055f562b0df20d56187c57d5`; [Actions 41581300405](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41581300405) ran **53/53 tests** and all five seven-day endurance runs. No LLM or clock conversion was introduced. The 450 historical records and external identity remain unchanged. Per-seed raw evidence and negative starvation control are committed under `evidence/v1.3/`.

Five unattended seeds each reached 7,000 steps without death or a full-day soft-lock. Food finished at 18, 20, 19, 11 and 19, each backed by three or four `harvest` receipts of up to eight food units. All five experienced seven witnessed visitor conversations, learned customs, social trust events, and one humor source event. Seed 13's two mid-action restarts preserved state and emitted `paused` operator-metadata intervals without invented world time.

In the production-disabled control the actor died of sustained starvation at tick 554600 after 5296 steps. Exactly one death event occurred, no harvest was made, and later ticks/actions could not proceed. The game balance constants were declared before testing and not modified to force these outcomes.

**Unexpected negative:** seed 14 had two natural `visitor_departed` failures: the caller left before an intended conversation finished. Both receipts remain in the committed evidence. Gathering wood is a working tested action but did not occur in these five standard runs because fuel was not depleted. Endurance involved one recurring open obligation at a time; the three-commitment test is a separate two-day intervention. Seven-day sustainability is not indefinite survival.

### Eight named bounded-grade promotions

| Article | Previous | Current | Passing discriminator |
|---|---|---|---|
| 12 | Partial | Demonstrated (bounded scenario) | `Article 12: low-salience object stays unselected for three days, new movement is noticed` |
| 14 | Partial | Demonstrated (bounded scenario) | `Article 14: declared single utility-weight intervention flips chosen action with exact arithmetic` |
| 17 | Partial | Demonstrated (bounded scenario) | `Articles 17 and 18: separate commitments persist, resume and alter a timed choice` |
| 18 | Partial | Demonstrated (bounded scenario) | `Articles 17 and 18: separate commitments persist, resume and alter a timed choice` |
| 28 | Partial | Demonstrated (bounded scenario) | `Article 28: gift and insult order cause distinct subsequent autonomous social conduct` |
| 03 | Partial | Demonstrated (bounded scenario) | `Article 03: explicit resume records real downtime without fictional game ticks` |
| 04 | Partial | Demonstrated (bounded scenario) | `Article 04: real consulted folio becomes a cited utility factor and withholding it can flip action` |
| 09 | Partial | Demonstrated (bounded scenario) | `Article 09: two days after a witnessed trigger, residue affects a matched choice` |

The v1.3 ledger therefore stands at **13 Demonstrated (bounded scenario), 20 Partial, and 1 Unassessable (Article 23)**. Social Articles 05 and 06 remain Partial because only one visitor exists. Article 31 remains Partial despite the new deprivation death control because its varied-unanticipated-loss test is still open. Article 27's 30-day development comparison remains out of scope.

The economy uses fixed source constants in `src/economy.js`: crop maturity 140000 centibeats (1.4 fictional days), eight food per harvested crop, one water to plant, six water per draw and four fuel per gathering action, capped stocks, starvation-health loss 0.065 per game step when hungry at least 90 and food empty, plus 0.018 additional loss under severe exhaustion. These are fictional game values, not physiological claims.

**Scope boundary:** A passing causal scenario is not an assertion of consciousness or complete philosophical Article qualification. The generic backup specification and v1.2 negative evidence remain intact. No model, extra room, extra organ, historical runtime import or 30-day study was added.

## v1.4: what a month showed (3 November 2026)

**Executable head:** `cc2065dd1f31a6db911736c592858aac10acc751`. [Successful CI run 41591212992](https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41591212992): 65/65 tests, including all 53 v1.3 tests, plus five independent 30,000-tick unattended simulations and the Article discrimination runner. Machine-readable source reports and all failures are committed under `evidence/v1.4/`. No code from the old simulator, the Doctor Lives, or the Laboratory was imported; the 450-folio canon and external identity blobs are unchanged.

**Thirty-day stability:** Five seeds (11 to 15) completed 150 simulated world-days in total, with 457, 467, 469, 474 and 486 actions respectively. All five survived at health 100, kept positive food stocks of 24, 21, 23, 22 and 22, retained 11 or 12 distinct action kinds, and avoided the defined day-long soft-lock and two-action collapse. Crop harvest receipts account for food production and original v1.3 economy constants remain unchanged. Crop storage caps wasted 45, 37, 36, 44 and 42 potential food units, respectively. This is an inefficiency, not an invisible refill or a fatality.

**Lived development:** Scientific skill changed from day-one levels 7, 6, 6, 6, 6 to day-thirty levels 168, 168, 165, 164, 164. The household skill remained 1 in every seed. Each developed 8 to 11 quirks from logged habit-formation events rather than inheriting them from the folios. Week-one versus week-four activity distributions differ. Predictor accuracy, however, did not reliably improve: week-one 34.7% to 37.2% versus week-four 26.0% to 36.2%. A skill counter increasing is not evidence of a more competent agent by itself, and science skill is not currently the direct action-score control. Experience-based habit bonuses do influence the controller; their general utility still requires stronger testing.

**Long commitments:** Three real calendar obligations were opened, with deadlines on world days 10, 18 and 25: two-session folio consultation, two-session instrument inspection, and two garden work sessions with a 12-food threshold. Real work sessions and intervening activities produced progress, interruption, and resumption receipts without a fabricated player intervention. In the five seeds 14 of 15 monthly obligations were **kept**; seed 14's provisions obligation was **broken** after one interrupted session and was never resumed. The failure remains `broken`, not promoted to success. Daily hearth obligations continue alongside the three additional goals. A task interruption between completed sessions is not the same as an in-progress activity being physically stopped mid-step.

**Relationships:** The single visitor now arrives weekly (days 0, 7, 14, 21, and 28), with five witnessed conversations per seed. Trust changes are tied to actual social event IDs; the custom is learned on the second observation, and each seed naturally produced one source-linked humor callback. No second person or multilateral social inference was introduced.

**Restart:** Seed 13 resumed two long-running activities after deliberate wall-clock pauses on days 10 and 24; operator-metadata pause events had frozen world time and intact identity, habits and commitments.

### v1.4 named grade promotions

| Article | Before | After | Passing named test |
|---|---|---|---|
| 15 | Partial | Demonstrated (bounded scenario) | `Article 15: repeated context-specific failures change only the matching worksite score` |
| 21 | Partial | Demonstrated (bounded scenario) | `Article 21: stale belief survives two days and corrects on actual failed use` |
| 24 | Partial | Demonstrated (bounded scenario) | `Article 24: five closure attempts do not invent a resolved commitment` |
| 26 | Partial | Demonstrated (bounded scenario) | `Article 26: save/resume fork preserves the following day choice distribution` |
| 27 | Partial | Demonstrated (bounded scenario) | `Article 27: thirty-day lived development has event-backed changes rather than only saved identity` |
| 31 | Partial | Demonstrated (bounded scenario) | `Article 31: a real loss changes at least one later post-recovery activity distribution` |
| 32 | Partial | Demonstrated (bounded scenario) | `Article 32: self-explanation does not name a causally decisive hidden residue` |
| 33 | Partial | Demonstrated (bounded scenario) | `Article 33: humor callback arises in an unattended week and cites the real funny event` |
| 01 | Partial | Demonstrated (bounded scenario) | `Article 01: 30 independently recorded explanations are audited against visible and hidden causes` |
| 07 | Partial | Demonstrated (bounded scenario) | `Article 07: full policy beats need-only baseline across five resource-conflict forks` |

**Current ledger totals: 23 Demonstrated (bounded scenario), 10 Partial, 1 Unassessable (Article 23)**. Articles 05 and 06 remain explicitly **blocked on Jay's second-person choice**. Article 23 has only a model-free claims-check socket; the model Phase 3 has not been authorized or implemented. The readiness questions and attack plan are in `docs/phase-3-readiness.md`.

**Weak positive findings must not be overstated:** Article 01's 30-decision audit has **15 supported explanations and 15 unexplained decisions**, zero unsupported claims and zero hidden-factor leaks. Article 07's full controller beat a simple needs-greedy baseline in all five tested resource conflicts but the baseline itself is intentionally modest. Article 31's post-restoration decision divergence occurred in only **one of five** matched loss seeds. Article 27 demonstrates month-long, event-anchored development, not proven generalized skill acquisition or predictor improvement. They earn bounded engineering grades, not full scientific or philosophical validation.

**Deferred and negative:** Store-cap waste persists; no indefinite-horizon claim is made; household skill did not advance; the optional baseline branch may underperform on resource preparation; past notes on first-person provenance and character fidelity remain on record. The 30-sample fidelity packet is intentionally ungraded and requires Jay or Calibos's cold review. The generic baseline spec, all earlier frozen evidence, no-model boundary, no-second-person ruling, and unmodified clock contract remain in force.
