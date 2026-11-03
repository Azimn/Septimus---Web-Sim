# Simple Tower v1.6: two-person postal and relationship release report

**Branch:** `feature/simple-tower-v1-20261102`, draft PR #7, unmerged. **Exact executable source SHA:** `e502bc51ca60078fc9c1d4d2bc68c0b4cc5683f2`. **Passing push workflow:** https://github.com/Azimn/Septimus---Web-Sim/actions/runs/41642932805 (**100 tests passed, 0 failed**). Evidence is decoded from the successful push job at that SHA, not reconstructed from a hypothetical scenario.

## What was verified

There is still exactly one kernel inhabitant. Rosa Brandl, the existing caller, now carries the declared archive-sourced thirty-year prior of a coal and provisions merchant; Mr. McFeely is a second, scripted person on the garden-path postal route. Both have independently witnessed histories. Neither the canonical 450-event archive nor the external identity nor the archived simulator was altered. No language model, extra room, third person, or clock conversion was added.

All ten executable acceptance predicates in `scripts/v16_probe.js` passed, including the actual witnessed history-swap decisions, private correspondence and three-person knowledge separation, direct-witness disconfirmation of the declared stale hearsay, physical handed/boxed receipt distinction, one Henry letter per seed, and Rosa prior convergence. Source tests `tests/v16.test.js` include two further causal controls: trust-derived account credit and unrelated hearsay remaining unconfirmed.

## Five independent unattended thirty-day lives

| Seed | Person / role | Encounters | Witnessed conversations | Trust (lived end) | Effective trust | Letters received / read / replied | Parcels | Avoidance |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 11 | Rosa (sender and supplier) | 5 | 5 | 79 | 85.4 | 3 / 3 / 0 | 1 | 0 |
| 11 | McFeely (carrier handling mail) | 12 | 12 | 24 | 24.0 | 13 / 13 / 2 | 3 | 0 |
| 12 | Rosa (sender and supplier) | 5 | 5 | 75 | 81.4 | 3 / 3 / 0 | 1 | 0 |
| 12 | McFeely (carrier handling mail) | 13 | 13 | 26 | 26.0 | 13 / 13 / 2 | 3 | 0 |
| 13 | Rosa (sender and supplier) | 5 | 5 | 85 | 91.4 | 3 / 3 / 0 | 1 | 0 |
| 13 | McFeely (carrier handling mail) | 13 | 13 | 26 | 26.0 | 13 / 13 / 2 | 3 | 0 |
| 14 | Rosa (sender and supplier) | 5 | 5 | 85 | 91.4 | 3 / 3 / 0 | 1 | 0 |
| 14 | McFeely (carrier handling mail) | 12 | 12 | 24 | 24.0 | 13 / 13 / 2 | 3 | 0 |
| 15 | Rosa (sender and supplier) | 5 | 5 | 83 | 89.4 | 3 / 3 / 0 | 1 | 0 |
| 15 | McFeely (carrier handling mail) | 12 | 12 | 24 | 24.0 | 13 / 13 / 2 | 3 | 0 |

Letter counts are **role-specific**: Rosa's column is correspondence *from Rosa*; McFeely's column is *all physically delivered letters* that the inhabitant later received/read/replied to. Parcels likewise distinguish the one tea parcel from Rosa and all three parcels handled by the carrier. Trust trajectories, witnessed source event IDs, recognition events and delivery/trade receipts appear in the per-seed JSON files. Different curves do not establish universal social intelligence: Rosa's trust also grows through trade and negotiating customs while the carrier's grows mostly through greetings.

Each seed completed 30,000 ticks without death. Letters: 13 received and read, two replies written and subsequently collected, three parcels delivered per seed. Rosa appeared in five witnessed conversations per seed; McFeely in 12 or 13. No avoiding of either person occurred in the baseline endurance runs, although avoidance and its reversal were observed in the adversarial history-swap forks.

## Article 05: separate social histories, causal swaps, long prior

The four-event swap fork gave Rosa two gifts and McFeely two insults, then exchanged **only their lived trust and event histories** in a matched fork. The treatment rule contains no person-ID conditional, and the world-level follow-up receipts switched too: before the swap Rosa was greeted and McFeely avoided; afterward Rosa was avoided and McFeely greeted. The test checks the actual `visitor_conversation`, `visitor_avoided`, `person_avoided`, and `carrier_conversation` events, not just predicted policy outputs.

Rosa's starting conditions are `prior_source: reconstructed_archive` with `E22-001` (The Coal Woman's Measure) and `E22-003` (The Meal That Went Cold). The five facets are commercial reliability (8), friction tolerance (6), personal register (4), known habits (3), and standing account (3), yielding a declared initial prior contribution of 24. Its weight is `1 / (1 + 0.55 * livedEncounters)`, with lived social trust added separately. Credit now follows computed trust, so the same person with adverse lived dealings can lose favorable account terms. At the opening encounter the prior changes register and time offered; zeroing it yields a new-contact form. After five lived encounters the prior's contribution is 6.4 and lived trust predominates. The two matched effective-trust curves converge by the measured delta, not to identical biographies or verbal claims. Rosa's pre-1899 knowledge remains archive-derived, never falsely registered as lived since awakening.

## Article 06: three-person knowledge, correspondence, correction

The mail is held or boxed before reading, with distinct `mail_handed`, `mail_boxed`, `mail_collected`, `letter_read`, `reply_posted`, and `reply_collected` receipts. Reading is the point at which a letter claim enters the knowledge store as `by_letter:<letterId>`. A private fact in an outgoing reply reaches McFeely only on physical collection and never appears in Rosa's known-facts list. Replies keep their commitments open through posting and close only upon a later carrier collection. The declared outdated market-season report enters as source-linked hearsay and is disconfirmed when Rosa is personally witnessed back at the tower. An unrelated price rumor is **not** incorrectly disconfirmed by her mere appearance; its belief remains unconfirmed.

The single scripted Henry letter is a new event **of receiving correspondence**, not a forged archive entry or proof of Henry's prior mental state. Its complete observed postal custody is:

| Seed | Letter | Arrival tick | Delivery | Receipt | Read tick | Reply written | Collected tick |
|---|---|---:|---|---|---:|---:|---:|
| 11 | LETTER-05 | 542,000 | boxed | L695 | 547,200 | 549,000 | 842,000 |
| 12 | LETTER-05 | 542,000 | handed | L667 | 544,400 | 546,200 | 842,000 |
| 13 | LETTER-05 | 542,000 | boxed | L705 | 547,500 | 549,300 | 842,000 |
| 14 | LETTER-05 | 542,000 | boxed | L701 | 548,200 | 550,000 | 842,000 |
| 15 | LETTER-05 | 542,000 | boxed | L712 | 547,100 | 548,900 | 842,000 |

Henry's letter has `provenance: synthesized_correspondence` with identity `LETTER-05`. It raises an experiment-related topic after reading, and the reading event supplies the source ID. No other history-figure letter was generated.

## Footnote F3, character fidelity, and archive custody

All scenario-authored letters and parcels bear their own IDs and `synthesized_correspondence` provenance, stay in the lived event store, and are never appended to or cited as a 450-record folio. The signed source blob is `718dcc2d5ba4feccdef1690d447edfcebaa9bfb5`, the identity blob is `239d876a44bd0b641698b867d938d0489615d6ed`, and the archived old-simulator tree is `f56d0612452dcfeebaafc51861a313a6c486a399`, unchanged at the executable source SHA.

The ungraded F5 packet contains 112 actual sampled witnessed/person-specific receipts, including 25 Rosa conversational exchanges plus additional Rosa noticings, not generic templates. They are available for cold character review. Rosa's delivered lines assert measurements and account terms without a deferential assistant register. Mechanical tests are not a substitute for an independent qualitative evaluation.

## Limitations and grade decision

**Articles 05 and 06:** Demonstrated (**bounded scripted scenario**) on named passing swap and knowledge tests. This does not establish flexible multi-agent social inference or prove mental states. **Article 23:** remains Unassessable because no model is admitted. Other Article grades are unchanged. The 90-day trust saturation and missed monthly provisions obligations identified in v1.5 remain unresolved; a thirty-day positive two-person run does not erase those findings. The third-person, Phase 3, and clock-convergence boundaries remain closed.

The final source SHA is deliberately separate from this evidence-documentation commit. PR #7 remains draft and unmerged.
