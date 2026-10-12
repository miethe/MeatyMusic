# MeatyMusic agent guidance

## Domain and boundaries

MeatyMusic is the system of record for musical projects, works, recipes, takes, stories, motifs, interpretations, and creative decisions. Preserve existing IDs, source text, and lineage when evolving the domain.

`pipes/` is a separable execution module within this repository. It owns bounded audio inspection, symbolic transforms, rendering, and execution receipts. It is not a separate estate service until there is a second consumer. The v0.4.0 handoff under `docs/handoffs/` is a behavior reference; its local JSON store and review server are not production infrastructure.

Voice Lab and `aos-tts` integrations belong behind an adapter seam that consumes their actual versioned contracts. Voice metadata is not proof of singing identity. A later Aural Geometry Lab seam must preserve exact symbolic timing and provenance without inferring musical meaning.

## Change discipline

- Use MeatyMusic's existing backend, database, API, and UI authorities for production behavior.
- Keep source recordings immutable; distinguish human-reviewed notation from raw MIDI candidates and authored diagnostic sketches.
- Mutations need revision/concurrency checks and idempotency. External generation needs explicit authorization and bounded capability/cost checks.
- Do not start new services or connect the local review prototype as production.
