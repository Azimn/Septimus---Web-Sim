# Septimus v5: one-house household design review and acceptance contract

**Status:** Active repair branch, not a claim of passing winter. November 2, 2026.

## Core game

The playable world is Septimus's ruined tower and immediate grounds. The external economy is **mail-order, delayed physical delivery, correspondence and postal payments**. A traversable town, grocer, visiting shopkeeper, servant or other rescue agent is not necessary for this simulation's life loop. Keep the world spatially modest and the consequences causally rich. His laboratory makes money; the garden yields some food; catalogs replenish necessary supplies; the postal trip transforms abstract earning into physically collected purchasing power.

The design is not an invincibility script. Septimus must be able to make a sustainable sequence of ordinary choices without gifts, teleportation, ghost purchases or prevention of bad decisions. Failure is legitimate if it follows from specific missed deliveries, misallocated working capital, inadequate production, carelessness or damaged property. Failure caused by a controller repeatedly abandoning attainable goals or treating every cold porch step as a medical emergency is not desirable emergent challenge.

## Mechanical economy at the reviewed v4 baseline

* Engine time: 144 ten-minute ticks/day. Hunger needs 129.6 restoration points/day or 1.728 meal portions/day.
* Weekly staples deliver 13 cookable portions, 26 crowns during the mild/November quoted window and 33 in December-February. A November weekly bundle lasts approximately 7.52 days if all portions reach the table.
* Scientific supplies include two reagents, at a 16-crown mild or 18-crown winter order price. Each *completed and posted* reagent experiment generates a 25-crown postal receivable after a 22-tick delay. At full utilization that is 50 crowns gross per science bundle and 34/32 crowns before food, fuel, travel and opportunity costs. Unposted reports and uncollected remittances produce no cash in hand.
* Coal arrives as seven baskets per paid order. One dry basket heats 26 ticks and one wet basket 12. A model that burns continuously would need around 5.54 dry baskets/day, or 38.77/week, before wet weather: the source economy cannot casually support that alongside food and laboratory expenditure. Selective heating must be a decision, not an automatic reaction to entering a cold porch.
* Vegetable harvests and garden seeds are physically routed. An excess tea seed is not an edible seed supply. Mechanical spares are not research reagents.

These are *unit-economics and design observations*, not permission to alter costs or physical rates. All original need constants, transit rates, payment amounts, catalogs and staged v1-v4 experimental artifacts remain unchanged on this repair branch.

## Systems priorities

Protect the continuous loop: `research -> report -> post -> delayed payment -> collect -> buy food/seeds/coal/science -> delivery -> collect -> store -> cook -> eat`. Every transition is observable and receipted; no resource appears merely because the AI intended it. The actual planner retains its existing memory and intention machinery. Replenishment should target the missing ingredient, not an unrelated inventory conjunction.

Avoid false emergencies: a cold room is not by itself fatal; heat when bodily condition or actual exposure warrants its cost. Maintain the prospect of future earnings without suppressing genuinely interesting reading, journaling or experiments. Protect ongoing mail and pantry errands from being replaced by impossible goals.

## Scientific acceptance

A passing local 700-tick smoke test or an isolated 60-day need oracle does not establish a viable life. Do **not** modify old outcomes or retroactively select favorable seeds. Preserve both ten-seed fair starts: September 1 with 61-day on-ramp, and November 1 with only the declared autumn stores, then measure 60 uninterrupted days from November 1. No fresh cash, no added deliveries, no imported forgotten folio facts, no new cognitive organ and no model calls.

New v5 measurements must include per-seed survival and needs, winter time spent moving by target, actual expenditures and incomes, reports earned/posted/paid/collected, all order lifecycles, stockouts while funds remain, final grain-only non-food, heating receipts, and clear death cause provenance. A v5 paper must explicitly report failures and distinguish money scarcity from a broken route or interrupted dispatch. The 95-versus-83 crown discrepancy remains an independent exact-replay research question, not resolved by a new diagnostic.

First criterion: demonstrate at least one genuine 60-day survivor under the unchanged real economy. Second: show reproducibility and meaningful leisure/work/reading variety, and explain every failed seed. A stronger robust result should not be achieved by giving the agent foreknowledge, invisible aid, or rebalancing the physics to fit the benchmark.

The three proposed v4 folio facts (winter budgeting, neglected meal, bulky clearance) remain **unratified and inactive**. Any later ratification must preserve physical notebook provenance, document preregistered control arms, and test their impact separately from these base controller repairs.
