# Game-first release: Septimus playable alpha G0

**Status:** Browser gameplay vertical slice, not a cognitive Laboratory migration. November 2, 2026.

## Design objective

The game begins with the most basic *The Sims* proposition: a single person with needs, a finite house, objects with actual actions, and a player who may steer him while his ordinary autonomous life continues. The existing Septimus Web-Sim world remains authoritative. The game will not earn its way to a personality simulator by adding cognitive components before the activity loop works.

G0 turns the earlier spectator-only map into a playable space. Clicking an actual object shows currently possible actions. A directed action replaces the active intention, but Septimus must still traverse valid adjacent tiles, obey normal access and supply conditions, and pay the cost of ordinary elapsed ticks. The player may pause or resume autonomy; direct actions require a paused world to prevent race conditions. The selected goal survives restart and may still be interrupted by acute survival pressure. Events and last-decision records label **player** and **autonomous** sources separately, so a player command never counts as independent artificial agency.

The UI only displays actions that the existing physical code can execute: bed/sleep, sink/drink, stove/cook or brew tea, table/eat or reflect, bookshelf/read, bench/work, garden/crop care, home maintenance, research mail, delivery collection and catalogs. It does not create items, change wallet values or bypass the previously verified postal economy. Reading currently uses the existing eight schematic books, **not** the historical 17-book source corpus, and sleep currently uses V5's one-tick abstraction. Both limitations are explicit later gameplay gates, not G0 feature claims.

## Player procedure

Run `npm start`, open `http://127.0.0.1:8765/`, and use the map. Click a furniture or world object to view its current actions. Pause the world before giving a direction. Once directed, the next steps complete real movement and activity under the same continuous simulation; use `Step once`, `+ 10 steps` or `Begin life` to resume. Object choices change as stock, needs, garden stages, income and physical world circumstances change.

## Minimum acceptance criteria

**G0 release:** A fresh world starts, object menu is visibly accessible by click or keyboard, a player can direct an actual action to a real object, physical navigation occurs before a remote action, inventories and money cannot be forged, the action persists across restart, and autonomous behavior is byte-for-byte unchanged when the player never directs it. CI must pass the full existing test suite, the existing bounded smoke, and all original V5 winter cohort shards at the exact candidate head.

**G1, ordinary Sims-style gameplay:** Deliberate action durations and meaningful needs tradeoffs, more autonomous non-survival options, more than a single recipe and scientific task, a game-readable daily activity summary, and real recoverable setbacks. Test an uninterrupted July-through-December life and at least one deliberately poor household plan that produces a measurable failure. A successful winter benchmark by itself is not sufficient.

**G2, object depth:** A portable genuinely readable verified book and physical bookmark, concrete personal possessions and storage, one repeatable instrument measurement, and one multi-step investigation with a result that depends on what was observed. Port only *small capabilities* from the older failed Laboratory, never its multiple competing runtime domains.

**G3, agent experiment:** The real Doctor Lives brain may optionally propose actions through a tightly verified host adapter, with a separate no-brain baseline and matched observations. Its success is measured by better real-world action outcomes, not prose, benchmark survivability alone or neural complexity. The standalone playable simulation never depends on this stage.

## Research integrity

Keep original V5 and other frozen outputs intact, and test every new intervention from a fresh sandbox seed. The game does not prove autonomy merely because a human-selected plan runs for multiple ticks. Record whose decision it was and which real environment consequences followed. This document does not ratify proposed folios, change historic canon, or authorize a Village visit.

If G0 cannot pass, stop expansion and fix the play loop. If G1 cannot sustain at least one believable complete life, do not add the old Laboratory library, another memory system or a bigger model to disguise the failing economy or scheduling.
