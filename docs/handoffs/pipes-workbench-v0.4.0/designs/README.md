# Design review

Open `review.html` for an offline gallery. These are screenshots of the delivered implementation with diagnostic/example data.

| Screen | Interaction demonstrated |
| --- | --- |
| 01 Workshop | Pinned section cards, role-aware ensemble, contextual next-variation inspector |
| 02 Variation diff | Reversible changes and preserved recipe fields before applying |
| 03 Variations | Parent/baseline and child recipes remain independently inspectable |
| 04 Suno handoff | Exact editable Style, separate Excludes, budget and prepared-not-submitted receipt |
| 05 Listening | Real decoded waveform, exact take, bounded moment and source-linked next variation |
| 06 Singers & voices | Fictional performer direction, cast, speech metadata, separately unverified singing |
| 07 Connections | Manual/export/planned/bundle distinctions; no invented online status |
| 08 Library | Recipes/takes/moments in one retrieval surface |
| 09 Instruments | Editorial role-oriented repertoire browser |
| 10 Mobile voices | Narrow viewport single-column voice workbench |
| 11 Mobile workshop | Narrow viewport arrangement and persistent exact-take transport |

Use the focused graphite/mint direction, not the earlier promotional collages. The editable implementation is `prototype/static/`; screenshots are not the source code. Typography uses system fonts and Georgia, so no font distribution or external font request is required.

Do not treat sample provider labels, diagnostic waveforms, fictional singers or explanatory metadata as deployed data. Design tokens are in `tokens.json`; the actual implementation CSS is authoritative for this prototype.
