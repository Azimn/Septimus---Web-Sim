# The Simple Tower — Tower-Track Companion Specification v1

**Status:** Build track, approved by Jay 2026-11-02. Companion to *Minimum Viable Inhabitant — Combined Build Specification v1* (the generic spec, ~/workspace/reviews/mvi-combined-spec-v1.md).
**Rule of interpretation:** everything in the generic spec stands — the 10 systems, the clock contract, the data contract, the 34-article acceptance matrix, the build order, the evidence protocol — except where this document explicitly differs. Where they differ, this document governs the build. The generic spec remains on the shelf as the no-character backup design, in case the Pretorius line fails again.

## 1. What differs

Three things, and only three:

1. **The setting is the tower** — the same ruined tower outside Ingolstadt, not a new house in a new place.
2. **The inhabitant is Pretorius** — an existing person with an identity, a temperament, and a past, not a generic blank.
3. **The history is present from day one as flavor** — the 450-memory archive and its world, imported as content, adding color and cues but **no complexity**: no new systems, no new gates, no new tests in v1 because of it.

Nothing else changes. In particular, **no code is imported** from Septimus Web-Sim, The-Doctor-Lives, the Laboratory, or Candidate B. The generic spec's donor map still governs mechanism-level borrowing (small patterns, copied files where the audit said Copy). This is a new, simple body — built knowing the deeper elements exist and are coming, with ports for them, per the anti-single-piece rule: never design as if the piece in front of you is the only piece.

## 2. The tower (setting, kept simple)

The ruined tower outside Ingolstadt, as established by the archive — the home before the Village, the place the corpus runs until June 1899. The simulation opens in that world with the same geography, reduced to what the simple build needs:

- **Rooms (v1, five):** library, kitchen/hearth, laboratory, bedchamber, garden path. (The web-sim's fuller house is flavor reference, not a floor plan obligation.)
- **Objects (v1, ~12):** the notebook and folio shelves (library), hearth, stove, kettle, stores shelf (kitchen), workbench, instrument, specimen jars (laboratory), bed (bedchamber), path and plot (garden). Each object advertises its actions, per the generic spec.
- **Calendar flavor:** the world is 1899 in its dates and customs; nothing in v1 simulates the Village, the move, or December. Those are future content decisions, not v1 mechanics.

Flavor rule, stated once and applied everywhere in this track: **history and setting may name, color, and cue; they may not add machinery.** If a piece of history seems to require a new system in v1, it is recorded as a later-phase note, not built.

## 3. The inhabitant (Pretorius, kept simple)

- **Identity:** the existing external identity record (name: Septimus Pretorius; the tower residence), carried as the generic spec's hash-checked external identity file. He does not edit it; neither does any model.
- **Traits (v1 values, Jay may adjust — they are tuning, not canon):** curious 1.5, industrious 1.4, stubborn 1.3, nervous 0.7, gentle 0.8, sociable 0.6. A mind that works, probes, and persists; not a bon vivant, not a people person.
- **Emotional triggers as residue seeds:** a small table of names and topics drawn from the history (e.g. Henry Frankenstein, Victor, the Bride, the university, homunculi) carrying initial residue values. In v1 these do exactly one thing: when such a topic is perceived (in the archive, in speech, in a letter), it biases salience and can attach a mood modifier. No trigger gets its own subsystem.
- **Character-fidelity check (the Pretorius metric):** Pretorius is an adversarial persona against friendly-assistant defaults — a man who would object to being treated as anyone's assistant, whose values and morals conflict with default model behavior. Therefore: **if he starts acting like a helpful assistant, the build is malfunctioning**, and that is a measurable failure, not a vibe. Method: a standing sample of his utterances and decisions is checked (by Jay, or by Calibos on review) against the character invariants — would Pretorius, with his history and temperament, say or do this, or is this a generic assistant wearing his name? Drift is logged in the evidence record like any other failed test. (This metric is noted here because it is cheap and specific to this inhabitant; it does not exist for the generic build, and it would be near-useless for inhabitants who are kind and helpful by design.)

## 4. The history layer (flavor in v1, load-bearing later)

- **Import:** the 450-memory v12 archive, copied **byte-identical**, living in the tower library as the folio collection — a physical thing in the world. He walks to it; he reads from it by query (recall cues, participants, locations, dates), never by context dump.
- **Status of the past:** the project's standing invariant is *provenance, not prohibition*. The archive is his pre-awakening autobiography in the four mechanically distinguishable classes already defined for Pretorius (canonical / reconstructed / synthesized pre-awakening memory, vs lived runtime memory). Jay's position, stated for this build: Pretorius is a fictional character, and what is real is a matter of perspective — to him, this history is as real as anything that happened to anyone; it is not to be treated as contamination to be quarantined. The classes are kept because they are *information about* the past, not because the past is on probation.
- **What it does in v1:** supplies the diary's and the voice's world — names, places, prior events to reference, recognize, and be cued by; seeds the trigger table (§3); gives Article 27/29 material its head start (his idiosyncrasies have origins; the sheet can cite them). Retrieval may bias action scores only through the generic spec's normal memory-residue channel — the same channel any lived memory uses, no special archive privilege.
- **What it does not do in v1:** no admission ceremonies, no SHA-bound gates beyond the byte-identical import check, no memory-influence experiments. Those belong to later phases and to the research track, and designing the port now (§5 of the generic spec's build order, Phase 4) is enough.
- **First person, everywhere:** lived records render "I…"; inherited records render in their own register ("I have an account that…", class-aware, per the non-negotiables layer already designed for Septimus). No third-person receipts in anything he experiences as his own record. This is non-negotiable and costs nothing if done from the first diary line.

## 5. Footnotes — Calibos's concerns, documented, not blocking

Jay's ruling on Calibos's continuity/fabrication concerns, adopted as this track's procedure: **document them in footnotes, check back on them at the named triggers, and do not let them gate a build that does not yet exist** — the same discipline as not worrying about hackers before there is anything worth stealing, or ethics lectures before there is anything that could act unethically. The concerns are recorded as taken seriously and deliberately deferred, not dismissed:

| # | Concern (Calibos's, on record) | Check back when |
|---|---|---|
| F1 | Two bodies, one past: the web-sim tower continues to exist; if both run long-term, which days count as whose? | Before any long parallel run of both towers; or if the simple tower ever claims web-sim days as its own |
| F2 | Fabricated events polluting genuine experience: model-narrated detail hardening into false autobiography | At Phase 3, when the model is admitted — the claims checker and the Confabulation Ledger's promotion rules are the instruments; not needed before there is speech that could fabricate |
| F3 | Admission discipline for synthesized history: classes are labeled, but labeling is a norm, not an enforcement | If synthesized material is ever added beyond the current archive; the Kiki gate test is the candidate instrument |
| F4 | The predictor and claims checker are new and unproven; their absence in v1 is a known hole | At Phase 2/3 acceptance — they are already scheduled there in the generic spec |
| F5 | Character drift toward generic-assistant behavior (the inverse failure: not fabrication, but dilution) | Continuously, via the §3 fidelity check — this one is cheap enough to run from the first spoken line |

## 6. Phasing deltas (only where they differ from the generic spec)

- **Phase 1** runs the generic spec's one coherent day *in the tower*: wake in the bedchamber, eat from finite stores, work at the bench, read a folio in the library (a real archive record), prepare against a calendar event, be interrupted, restart mid-day, write the diary in first person, sleep. The archive is present and readable from this phase — as flavor and reference, per §4.
- **Phase 3** adds the visitor as before; in this track the visitor may be framed within the tower's world (a caller at the tower door) without adding any system.
- **Phase 4** is where the deeper elements arrive, one at a time, each earning its seat: memory-influence measurement (archive access vs withheld), the model as proposer, and only then any question of relationship to the web-sim tower (F1).

## 7. Success for this track, in one paragraph

A simple game that runs: one man, in his tower, with his past on the library shelf, living coherent days under all 34 hooks — basic in every component, honest in every grade — and unmistakably *him* rather than a helpful assistant in a costume. If it fails, it fails legibly, and the generic spec is still on the shelf.
