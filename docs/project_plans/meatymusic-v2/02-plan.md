# MeatyMusic v2 — milestone plan

MeatyMusic remains the system of record. `pipes/` is a separable execution module inside this repository; it does not become an estate service until a second consumer exists. The v0.4.0 review app and JSON store guide behavior but are not production components.

## M1 — Story and motif thin slice

Add story and motif records linked to an existing MeatyMusic work and take, using the current backend, persistence, and UI. Preserve existing work/recipe/take identifiers and source text; all mutations use revision checks and idempotency; users can create, edit, and retrieve the linked story through the existing API and UI.

## M2 — Musical context and deterministic composition

Add canonical parts/sections/locks, listening moments, typed variations, deterministic prompt/context compilation, and handoff/return lineage on top of MeatyMusic authorities. Keep original recordings immutable and unverified MIDI separate from canonical notation. Acceptance: stable compilation for identical input, explicit budget reporting, no silent truncation, and every returned take links to its originating work and handoff.

## M3 — Voice Lab and aos-tts adapter seam

Map Voice Lab's actual promotion-bundle contract and `aos-tts` catalog/request contract; distinguish speech metadata from singing identity. Acceptance: schema-validated imports and explicit dry-run/live approval gates; no fabricated promotion path or direct provider submission from MeatyMusic.

## M4 — Bounded Pipes execution and later Aural Geometry seam

Keep `pipes/` responsible for bounded inspection, symbolic transforms, rendering, and execution receipts. Add capability/cost preflight before any authorized provider adapter and reconcile uncertain outcomes without blind retries. Define a later Aural Geometry import/export seam preserving exact symbolic timing and provenance. Acceptance: operation bounds and receipts are verified; Aural Geometry integration remains versioned and does not infer musical meaning from mathematical mappings.

## Evidence basis

Seeded from survey §5 (normalized SW-00–15 backlog) and §7 (review, baseline reconciliation, contract mapping, then thin slice). The first implementation milestone is deliberately limited to the story/motif ↔ existing work/take round trip.

## IntentTree mapping

- M1: `node_01M4GZMWZKYJB06WE5VCRWC668`
- M2: `node_01M4GZMXTMSDVS5C07K7S6PSRX`
- M3: `node_01M4GZMYZN9ZTDVY9XA7CSZ7EP`
- M4: `node_01M4GZN011W2GJS7ZHJ5N7K4QJ`

The four M1 atomic tasks are children of M1. Cross-tree `relates_to` edges connect M3 to Voice Lab's `node_01M497Q2ZC9Z7CVEFKKV4JTXE5` and M4 to Aural Geometry's `node_01M0BSH4KQ95BTXR7F7PHYJ0R6`.
