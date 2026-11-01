# Septimus simulation design | v0.1 | 2026-11-01

## Design test

**Can someone seem to live here when the rules remain small but consequential?** The game world takes precedence over prose. All interactions require a physical object; most require reachable tiles, travel and finite stock. The map is world state, not a decorative image. The policy is a small deterministic utility chooser with durable commitments. The engine can outlive the web page. Persistence is a hash-chained local file; replay preserves the entire world.

The research is *informed by* The Sims (needs motivate basic tasks), Black & White (creature agency and interpretation of consequences), Oxygen Not Included (physical errands, supply chains, priorities), and Park et al., **Generative Agents: Interactive Simulacra of Human Behavior** (UIST 2023; memory, reflection, and planning in a persistent sandbox). This project does not copy third-party game code or claim fidelity to those systems. Source: https://research.google/pubs/generative-agents-interactive-simulacra-of-human-behavior/ and https://oxygennotincluded.wiki.gg/wiki/Errand.

## Home canon and later village boundary

The same fictional Septimus Pretorius has lived at a **partly ruined tower outside Ingolstadt, Bavaria** since 1868 according to the reconstructed 450-memory v12 archive. This toy simulation is set after the last June 1899 autobiography event, and before the separate future Frankenstein Village game. The archive does not establish a departure date or a proper name for the tower. A projected 16 x 10 map compresses the tower's multiple levels, and is not an authentic architectural floor plan. The sink/water service and washroom are provisional gameplay mechanics, not attested historical plumbing. The old Ash Grove identity label is migrated through an append-only, hash-linked CANON_CORRECTION without editing old physical events or memory. See [source audit](HOME_CONTINUITY_AUDIT.md).

## World invariants

Time advances in explicit 10-minute ticks. There are no ad-hoc actor teleports. The property tiles and doors are authoritative for movement. Catalogs issue purchases, **not instant inventory**. Parcels arrive at one mailbox with receipt IDs and are carried to pantry storage. Research payments are generated only from completed scientific experiments and posted reports, and are not spendable until physically received. Pantry items decline only through legitimate recipes, planting or consumption. A sink with a municipal water connection is the only infinite baseline utility. Gardens regenerate crops only after paid or initially available seeds, watering and time. Hunger and thirst can drive health to zero and death is immutable. No operator action or narrative text can resurrect the character.

The active goal persists over multi-tile movement. A prerequisite (oil lamp, cleaning) retains the originating work goal. Survival crises may suspend an active goal, with its identity preserved for resumption. When intervening events invalidate an intention, the model records `goal_obsolete` rather than manufacturing completion. Every accepted world action carries source coordinates, a stable receipt ID, tick and associated goal ID. `goal_selected` includes a reason, score and verified memory IDs.

## Memory and identity

Physical world receipts are external ground truth. Memory is a source-attributed projection with source hash, original event ID and coordinate. Journal rows are append-only and hash linked with a genesis digest for the external self record. Narration is recorded separately with `memoryEligible:false`; discrepancies are retained. It does not become a physical event. In shuffled-memory controls, source hashes are deliberately moved to the wrong records: they fail original event validation and contribute no score effect. `none` removes all memory score evidence. These controls test *source-grounded score contribution*, not intelligent autobiographical causal reasoning. A future serious comparison must preregister a behavioral outcome, not merely confirm numeric deltas.

## Safely expandable hooks

The top-level physical world state is an intentionally small serializable schema. The `world.js` geometry and objects can be extended with walls, doors, individual containers, property expansion and real graphics. `simulation.js` isolates choices from action/economy rules; `organism.js` isolates persistent identity, journal, memory, controls and narration. `server.js` isolates transport. The UI only reads the public state. Future layers may implement delivery routes, market economy, perishability, garden weather, water bills, rent, electricity, trade, animal husbandry, neighbors, village NPCs, conversation, postal correspondence, full-text reading and model-proposed intents. Every such system must specify source events and failure modes before improving visual presentation.

## Preregistered experiment candidates, not approved mechanics

A memory intervention should compare linked source-attributed recall against shuffled and none across matched worlds/seeds, measuring task persistence, resumption and resource use. For a language model, keep the model as a *proposal* or subjective narrator with world-permission admission, not as an author of receipts. A second inhabitant would require physical presence, time, correspondence and persistent independent needs. Weather, affect, sleep stories, and more elaborate organ systems remain proposals until a controlled ablation demonstrates a measurable advantage.

## Known v0.1 limitations

Simulation time is accelerated 10 minutes per tick, and does not accumulate real-time elapsed time while the local process is stopped. There is no service supervisor or multi-process lock. Scientific wages are a simplified postal contract, not a balanced economy. Municipal water is assumed working. The books are eight symbolic two-section fictional volumes, not the original seventeen books. Cooking and gardening are simplified recipes, not mass-conserving chemistry or nutrition. Internal needs and urgency are hand-authored. The simple seeded scoring has stochastic variety but is not model cognition. Narration is optionally generated by local Ollama; no claims of autonomous model reasoning have been tested.
