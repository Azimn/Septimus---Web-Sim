# Tower chronology and continuity contract

The same fictional Septimus Pretorius remains at the partly ruined tower outside Ingolstadt, Bavaria. The frozen [Pretorius-Connectome v12 autobiography](https://github.com/Azimn/Pretorius-Connectome/blob/main/memories/current/Pretorius_v12_450_Events_Complete.jsonl) contains **450 reconstructed first-person memories in 27 episodes**. It dates the acquisition of his tower to **E03-001, September 1868**; the latest historical record is **E05-021, June 1899**, receiving news about Henry Frankenstein in the tower archive.

The simulation begins **July 1, 1899, at 07:00**, an explicit game-design assumption, not an autobiographical memory. The tower simulation has **no fixed departure date, end-of-year cutoff, recorded travel, or automatic arrival in Frankenstein Village**. The village is a different future game; any transfer must be modeled explicitly and must preserve the source distinction between reconstructed backstory and events actually simulated.

`src/calendar.js` derives fictional ISO dates and Swatch Internet Time beats from ten-minute game ticks, using a project-facing fixed UTC+1 convention, not a claim about historical Bavarian solar time. New physical event receipts carry a `calendarDate` while existing journal rows are preserved byte-for-byte.

The live 16 x 10 navigation map is a **compressed projection**, not a literal floor plan of a multi-level tower. The code now exposes `RESIDENCE.spaces` with provisional floor assignments and source-memory IDs for sleeping chamber, library, laboratory, stairs, kitchen and pantry, and garden. The washroom, municipal-style water point, catalog prices, planted tea bushes and exact placement of furniture remain gameplay conveniences, not source-backed historical facts. Other attested spaces such as guest chamber, archive, music room, glass room and darkroom are listed as not yet mapped.

`KNOWN_PEOPLE` currently indexes eight historical acquaintances, including Clara Weiss, Jakob Lenz, Rosa Brandl, Mathilde, Anna, Voss, Julian Adler and Marta. These are **not** active NPCs or confirmed living/present in July 1899. Future visits, letters and meetings require new physical world receipts and documented time and location.

`HISTORY_ARCHIVE` points to the actual 450-record archive with `importStatus: not_imported`. The character's current autonomous policy can consult **simulated** source-linked world memories, not this earlier fictional autobiography. Any future import must preserve the archive's `reconstructed` provenance rather than pretending the simulation has independently lived those events. Narration and memory remain separate.

This chronology is a continuation of the tower setting, not a rewriting of source material or a claim about a canonical village relocation date.

## Time-perception boundary (owner design rule, November 1, 2026)

**Swatch Internet Time (.beats, @000 to @999, fixed UTC+1) is the project-facing representation of time for non-character-aware systems.** Use it for simulation scheduling, deterministic ticks, engine diagnostics, world event ordering, operator dashboards, external records, and experiment reports. Retain unambiguous UTC/ISO-8601 timestamps or equivalent numeric ordering keys wherever necessary for accurate interoperability and replay. Player and developer interfaces may show BeatTime alongside ordinary time.

**Septimus and other inhabitants must never know about, reason from, refer to, or acquire BeatTime as an in-world fact.** A character's first-person understanding of time comes exclusively from in-world perception and memory. When Septimus actually looks at a physical clock, he may learn its conventional dial reading (such as 3:15 p.m.) with the normal limitations of an in-world object. Without a perceived clock, he may estimate time through sunlight, fatigue, routine, elapsed experiences, conversation, or other observable cues, not through omniscient engine time.

Keep **mechanical event time** separate from **character-observed time** and the observation's provenance. The same event may carry a private mechanical BeatTime and an in-character observation, but the latter must never be populated from the former without a real in-world observation. Do not leak BeatTime into LLM narrator prompts, character dialogue, autobiographical memory text, perceived clock readings, or character decision inputs. External audit records can retain both representations with their different sources. Narrative disagreements with the mechanical clock are observable evidence, not a reason to rewrite the clock or the character's recollection.

This is a **documented design contract for subsequent implementation**. Existing runtime time exposures, calendar helpers, and optional model-prompt paths are not certified against it by this documentation change. No gameplay, saves, identity, or memory records are rewritten here.
