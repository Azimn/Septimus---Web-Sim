# SEPTIMUS | The Living Laboratory

A small, persistent, browser-based life simulation with a concrete physical house, kitchen, laboratory, garden, catalogs, finite goods and mail delivery. It is a new independent project. It does **not** depend on Candidate B, its organs, or the original Pretorius-Laboratory physics.

## Run locally

Requires Node.js 20 or later. No npm dependencies, database server, hosted API, external images, or internet connection.

```bash
npm start
```

Visit **http://127.0.0.1:8765/**. Press **Begin life** to run autonomously, even when the browser tab is closed (as long as the Node server remains running). **Step once**, **+10** and **+120** advance by deterministic ten-minute simulated ticks. Stop or restart the server, then restart it: world state, mail, weather-independent crops, money, goals, event history and the running setting survive in the local `data/events.jsonl` journal.

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

The world owns physical facts. The durable JSONL event journal is hash chained and reverified on load. Only physical event receipts are eligible for attributed autobiographical memory, which remains separate from narration. Identity is stored externally and tied to the journal's genesis digest. Source-referenced memories affect some decision scores; `GET /api/memory-control` returns linked, shuffled, and no-memory alternatives on the same unchanged world state. A report of a model's imagined activity cannot cook food or alter inventory.

Optional Ollama narration, strictly local: set `OLLAMA_MODEL=your-model` (and an existing Ollama server at `127.0.0.1:11434`) before `npm start`. The model can write a first-person observation but does not select physical action or modify world records. If unavailable, truthful deterministic narration works offline. The model is **not** currently a full generative narrative planner; that remains an explicit experiment.

## API

`GET /api/state`, `GET /api/info`, `GET /api/memory-control`, `GET /api/export`; `POST /api/step` with `{"steps":10}` (maximum 120); `POST /api/run` with `{"running":true}`; `POST /api/narrate` and `POST /api/identity-probe` for separate narration/identity probes. Local HTTP binds to loopback only.

## Status and limits

This is a *playable research toy*, not yet a convincing autonomous person. Its needs are deliberately compact and the world has no external economy, seasons, disease, real 17-book content, dialog with other inhabitants, actual grown-up science, or visual animation beyond a working map. Survival rates in bounded tests should not be mistaken for open-ended life. Running time stops when the local Node process is off. Do not call it perpetual or fault-tolerant. See `docs/SIMULATION_DESIGN.md` for boundaries and experiments.

`legacy/` contains the original Minimum Organism and Reduced decision engines as frozen reference sources, not active code. The original Pretorius repositories remain untouched.
