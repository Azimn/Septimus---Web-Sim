# SEPTIMUS | The Living Laboratory

A small, persistent, browser-based life simulation with a concrete physical house, kitchen, laboratory, garden, catalogs, finite goods and mail delivery. It is a new independent project. It does **not** depend on Candidate B, its organs, or the original Pretorius-Laboratory physics.

## Continuity and scenario time

The same fictional Septimus Pretorius has lived at the partly ruined tower since 1868. The last dated reconstructed memory is June 1899. This simulation begins on **July 1, 1899**, an explicit scenario starting assumption, and runs without a scripted end date. The future relocation to Frankenstein Village belongs to a separate game and is **not yet a lived world event**. Historical room and acquaintance references are exposed as read-only source-linked hooks; no visitor is silently spawned. The 450 source memories are **not imported yet**. See [TOWER_CHRONOLOGY.md](docs/TOWER_CHRONOLOGY.md).

## The private diary and external self

The tower library now contains a physically reachable **private notebook**. He may write first-person retrospective pages only after reaching the object, with each page linked to a real prior world receipt. He may consult individual folios of the **actual 450 reconstructed autobiographical memories**, carried verbatim from `Pretorius-Connectome` with frozen source hash and explicitly labeled as reconstructed backstory. Observer tools may inspect all 450 via `/api/folios`, but the character is only permitted to know a folio after an in-world notebook-reading receipt. Historical memories are not relabeled as events lived in the new simulation.

The simple external Ipseity remains in `identity.json`. Perception and optional model prompts are first-person and situated, with no BeatTime, engine ticks or omniscient access to events in other rooms. BeatTime is for operators and simulation mechanics only. Diary prose is conservative deterministic templating until a local language model is integrated for richer subjective recollection. See [journal and Ipseity design](docs/JOURNAL_AND_IPSEITY.md).

## Run locally

Requires Node.js 20 or later. No npm dependencies, database server, hosted API, external images, or internet connection.

```bash
npm start
```

Visit **http://127.0.0.1:8765/**. Press **Begin life** to run autonomously, even when the browser tab is closed (as long as the Node server remains running). **Step once**, **+10** and **+120** advance by deterministic ten-minute simulated ticks, dated from **July 1, 1899, 07:00**, stopping at the story handoff on **December 31, 1899, 23:50**. Stop or restart the server, then restart it: world state, mail, weather-independent crops, money, goals, event history and the running setting survive in the local `data/events.jsonl` journal.

To run unit, integration and behavioral tests:

```bash
npm test
npm run experiment
```

Windows: double-click `start-windows.cmd`. macOS/Linux: run `./start-mac-linux.sh`.

Use `PORT=8766`, `SEPTIMUS_DATA=/path/to/data`, `SEPTIMUS_SEED=42`, and `SIM_INTERVAL_MS=1800` to configure an instance. Running two servers against the same data directory concurrently is not supported. The current world should run on one local computer; no cross-device synchronization or unattended service installation is provided.

## What exists in v0.1

The property map is 16 x 10 physical tiles. Each object has an exact room and position. Doors constrain movement, and travel takes actual simulation time. The bed, eight fictional books, instrument bench, oil lamp, sink, stove, pantry, dining table, water closet, two garden plots, catalog stand and postbox are interactable physical objects.

Septimus has hunger, thirst, fatigue, bladder, boredom, health, money, goods, pending orders, garden crops, laboratory wear, a durable active intention and an external identity. The autonomous deterministic policy chooses between real opportunities. Goals last during travel, equipment lighting, cleaning, interruption and physical completion. The world can kill the character through dehydration or starvation. The sink provides municipal potable water, not finite bottled water; municipal failure is not modeled yet. Crops must be planted, watered and harvested after elapsed time. Tea bushes are a renewable crop only after planting and growth.

Catalog orders debit the wallet and remain in transit for a bounded period; delivery creates a parcel at the mailbox. It must be collected, carried, and placed in the pantry before the stock is available. Scientific experiments generate reports that must be physically mailed; only later payment letters collected from the letter box credit money. There are no free respawns, magically replenished stock, or external scripts that perform work for him. Buying supplies is one of Septimus's actual goals.

The pre-village scenario ends in December 1899, by explicit owner decision. The final source memory is `E05-021` dated June 1899. The end marker is not an invented physical move or autobiographical memory; the separate Village game must perform and record its own actual arrival. The world owns physical facts. The durable JSONL event journal is hash chained and reverified on load. Only physical event receipts are eligible for attributed autobiographical memory, which remains separate from narration. Identity is stored externally and tied to the journal's genesis digest. Source-referenced memories affect some decision scores; `GET /api/memory-control` returns linked, shuffled, and no-memory alternatives on the same unchanged world state. A report of a model's imagined activity cannot cook food or alter inventory.

Optional Ollama narration, strictly local: set `OLLAMA_MODEL=your-model` (and an existing Ollama server at `127.0.0.1:11434`) before `npm start`. The model can write a first-person observation but does not select physical action or modify world records. If unavailable, truthful deterministic narration works offline. The model is **not** currently a full generative narrative planner; that remains an explicit experiment.

## API

`GET /api/state`, `GET /api/info`, `GET /api/memory-control`, `GET /api/export`; `POST /api/step` with `{"steps":10}` (maximum 120); `POST /api/run` with `{"running":true}`; `POST /api/narrate` and `POST /api/identity-probe` for separate narration/identity probes. Local HTTP binds to loopback only.

## Status and limits

This is a *playable research toy*, not yet a convincing autonomous person. Its needs are deliberately compact and the world has no external economy, seasons, disease, real 17-book content, dialog with other inhabitants, actual grown-up science, or visual animation beyond a working map. Survival rates in bounded tests should not be mistaken for open-ended life. Running time stops when the local Node process is off. Do not call it perpetual or fault-tolerant. See `docs/SIMULATION_DESIGN.md` for boundaries and experiments.

`legacy/` contains the original Minimum Organism and Reduced decision engines as frozen reference sources, not active code. The original Pretorius repositories remain untouched.

## Household conditions and controlled memory experiment (November 2026)

The tower now costs money and maintenance: deterministic coal-cart transit from Rosa Brandl's firm, wet/dry fuel, seasonally variable prices, hearth heat, weak floors, rain-driven roof leaks, physical repairs and slowly spreading garden nettles. See [household conditions](docs/HOUSEHOLD_CONDITIONS.md). The private notebook is now biased toward a single evening retrospective made from distinct authenticated events. Old reconstructed folios and lived journal receipts remain separate.

The [folio influence protocol](docs/FOLIO_MEMORY_PREREGISTRATION.md) was frozen in Git before outcome runs. It specifies three matched-seed controls, no scripted choices and a fixed success criterion. Run the disposable experiment with `npm run folio-experiment`. This requires the complete verified canon file already in the repository and never edits a live save. No LLM integration is added by this change.
