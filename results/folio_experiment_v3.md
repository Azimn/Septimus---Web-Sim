# V3 source-grounded knowledge trial

Result: **held_facts_load_bearing**. Runtime 4131 ms. v1/v2 unchanged. Original source corpus unchanged.

| Folio | Target reads | Cue / question / chair | A/B first five | A/C first five | Target A/B/C | Related A/B/C | Decisions using facts A/B/C | Pass |
|---|---:|---|---:|---:|---|---|---|---|
| E22-001 | 23/24 | 0/0/23 | 23/24 | 23/24 | 23/0/0 | 23/0/0 | 2533/0/0 | yes |
| E18-010 | 24/24 | 20/0/4 | 4/24 | 4/24 | 4/4/4 | 4/4/4 | 4/4/4 | no |
| E03-002 | 24/24 | 0/0/24 | 24/24 | 24/24 | 24/0/0 | 24/0/0 | 692/0/0 | yes |

A target read is one natural `journal_read` receipt for the source folio. Equal per-arm trigger rates reflect a common pre-trigger history, not independent A/B/C discovery.

Evidence contains each scenario assumption, pre-trigger encounter and receipt, natural reading, verified access or labeled counter access, fact grants and first-five decision provenance. False facts never enter a persisted game save.

**Limits:** Explicit fact-to-policy rules are designer-authored, not semantic comprehension. An experience-granted fact may predate the read and legitimately mask A/B effects. Failed target triggers count in all-seed denominators. Zero cues would indicate the cue mechanism has failed again, regardless of later behavioral divergence.
