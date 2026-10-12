---
schema_version: 0.1
id: null
type: artifact
artifact_kind: product_and_ux_spec
title: "Musical Story Canvas — Meaning Before Sound"
project: MeatyMusic / Pipes
domain: agentic-music-workbench
status: candidate_artifact
owner: Nick Miethe
created_at: 2026-10-09
updated_at: 2026-10-09
system_of_record: GitHub (proposed)
current_location: portable-conversation-package
related_systems: [MeatyMusic, Pipes, The Long Becoming, IntentTree, SkillMeat, CCDash, MeatyWiki, Aural Geometry Lab]
source_context: "MeatyMusic v0.3 handoff; Pipes v0.1 starter; supplied Rowan WAV/MIDI; soundtrack v2/v3; Nick's listening notes and visual composition request."
intended_use: "Local review and additive implementation handoff; not a production deployment."
next_action: "Run ROWAN-001 locally and reconcile the new domain contracts with the live MeatyMusic repository."
review_cadence: after-local-audition-and-adapter-validation
confidentiality: personal
tags: [meatymusic, pipes, music-workbench, story-canvas, mcp]
---

# Paint the story; then give it sound

## The interaction we are designing for

“I remember the part that nearly gives up, but the cello keeps going. Let that return come later, and let the horn join only after the fiddle has found its way back.”

The user should not need to know “augmentation,” “appoggiatura” or the exact bar number to start. Formal musical vocabulary is available as an inspection layer, not an admission test. The interface helps translate lived listening into editable choices without pretending that a metaphor is a complete score.

## Three linked views of one musical idea

**Meaning:** words, images supplied by the user, metaphors, imagined scenes, emotions, listener interpretations, palette references, constraints and questions. A meaningful ambiguity can remain unresolved.

**Story:** motif gestures over relative time; who speaks, who answers, what repeats, what is withheld, what changes and what remains. This is musical dramatic structure before exact notes.

**Sound:** approved recordings, exact source windows, score candidates, corrected notes, instrument parts, dynamics and render comparisons. This is where the planned relationship is tested against a real result.

The workflow is bidirectional. A surprising take can revise the story. A user interpretation can change what we inspect without changing the recorded audio. An accepted phrase can become a new compositional anchor even when it differs from the original prompt.

## Canvas visual grammar

| Visual object | Meaning | Evidence boundary |
|---|---|---|
| Motif color | stable motif identity across views | color does not certify melodic equality |
| Instrument lane | the voice/role assigned in this arrangement | observed instrument attribution needs evidence |
| Gesture span | desired duration or annotated interval in the active clock | clocks never silently switch |
| Solid phrase card on recording view | human-reported occurrence with labeled source | not automatically note-verified |
| Intent gesture card/ribbon | planned appearance or transformation | not an extracted acoustic feature |
| Callback edge | later gesture depends on an earlier statement | may be authored or human-reported |
| Answer/support edge | two musical roles relate | separate from timing coincidence |
| Prominence points/line | author-drawn foreground emphasis | not dB, MIDI velocity or objective emotional intensity |
| Waveform | measured aggregate signal envelope | not melody, instrument identity or emotional meaning |
| Piano-roll notes | symbolic events with provenance | raw transcription stays visibly raw |
| Pin | preserve this gesture until explicit unlock | pinning meaning does not freeze a whole audio take |

Use text, line styles and focus/keyboard states as well as color. Do not animate everything constantly; reduced motion and quiet mode must be available in the production implementation.

## What works in the v0.4 review build

The Listen & evidence view shows the whole original recording with waveform and region markers. Selecting an annotated passage exposes its observation text, source, uncertainty, local MIDI candidates and context. The player can loop the complete return; the earlier swell remains separately accessible. During playback, recorded-time cursors move in waveform and MIDI views. This does not infer a synchronized cursor position in an unaligned intent story.

The Paint & intent view uses relative-time gestures on instrument lanes. Users can move a gesture horizontally, edit its position numerically, change instrument/role, prominence, interpretation and motif, pin/unpin, add an event, link two gestures and branch a story. Numeric fields provide a keyboard alternative to dragging. Story revisions persist through the same API used by agents.

The Motif atlas distinguishes audio-anchored identity, expressive arc and authored note sketches. It shows where each is reported and where it is planned. Discovery offers local text/curated-synonym results with reasons. Worlds & works exposes hierarchy and original prompt fields. Pipes & experiments exposes actual local packets/renders and clearly disconnected adapters.

## Larger design target — not all implemented

### 1. Paint gestures as meaningful blocks

Selectable brushes: introduce, recall, reach, retreat, hold, answer, withhold, fragment, intertwine, hand off, broaden, release, settle. A brush changes an arrangement intent, not necessarily individual notes. A silence/absence is first-class rather than an empty region the generator should always fill.

A gesture can bind to an existing motif, carry a transformation, and have hard/soft constraints: melody exact, contour retained, register open, instrument fixed, role fixed, harmonic strategy provisional. Show editable commitments and open questions side by side.

### 2. Transform across representations

Expand a motif card from narrative → contour/rhythm → notes/parts → performance controls. A melodic motif should show contour, rhythm and phrase boundaries, not just a list of pitch classes. A textural motif may instead expose articulation, register, resonance and density. An expressive arc may span several motifs and participants.

### 3. Visualize appearances across songs

A culture atlas maps works as columns and motif identities as rows. Cells distinguish authored plans, raw detector candidates and reviewed occurrences. Selecting a cell auditions the corresponding phrase with optional earlier context. A global game view can reveal cultural motifs converging in the finale without loading a ten-thousand-node graph. Zoom into a song, then a phrase, then a note; return to the previous view with selection and playhead preserved.

### 4. A living playback score

Once a score/performance alignment is accepted, a playhead can illuminate motif ribbons and instrument roles as they occur. A foreground handoff should be visible, not inferred solely from track labels. Uncertain alignments show ranges; missing alignments remain unlit. “Expected versus observed” can compare the intent canvas with reviewed occurrences without implying that every discrepancy is a failure.

### 5. Explore without an exact query

Offer small “nearby musical ideas” shelves by emotional relationship, instrument material, contour, narrative role, contrast and past listening preference. Example: “other returns where the lower voice continues through a retreat.” Explain why each candidate appeared. Begin with explicit tags/relations and local search; add embeddings only with selected corpus and permissions. Do not silently send personal interpretation notes to embedding providers.

### 6. Compare composition choices, not only tracks

Pin the original, compare variants at equivalent phrases, retain global and local notes separately. Level matching is an optional derived listening view, not a destructive edit to masters. Compare cello response, absence duration, harmony and instrumental roles while keeping overall beauty separate from fidelity. A bad variant is useful as a negative reference.

## Cognitive ergonomics

The design is tuned to the user's stated preference for associative, high-context, visual creation and low routing friction. This is a product personalization, not a clinical assessment.

- **Capture first:** one thought field, optional scope; no required genre/key/task.
- **Recognition first:** show familiar snippets, notes and instrument cards rather than force recall of filenames or theory terms.
- **Context survives detours:** breadcrumb, persistent selection, pinned keeper, playhead and a “return to what I was exploring” action.
- **Progressive precision:** don't demand notes before a musical story; don't demand a finished story before saving a thought.
- **Explicit commitments:** separate “must remain,” “try changing,” and “not decided”; no accidental prompt rewrite that drops the heart of an idea.
- **Play and proof are different modes:** spontaneous exploration need not produce a benchmark, and a favorite need not satisfy every instruction.
- **Manage scale:** limited previews, lightweight cards and expand-on-demand neighborhoods. Avoid a dashboard of every cultural motif simultaneously.
- **Avoid productivity pressure:** no streaks, guilt badges or task explosion; return to music rather than bookkeeping.
- **Preserve personal meaning:** keep Nick's wording alongside structured tags; allow contradictory readings and changes of interpretation.

Current v0.4 covers loose capture, local recognition search, context retrieval, branching, pins and explicit evidence labels. Full navigation-resume memory, rich brush gestures, cross-song matrix, elastic score alignment and semantic retrieval are follow-on work.

## The Rowan canvas

First promise → life between → recognizable callback → yearning retreat → held support → renewed wider rise → release.

The later rise references the original statement, and its impact depends on the enclosing retreat. The cello-support gesture is a **new compositional proposal**, not a claim that the recording contains our authored World motif. Loss is a possible story reading; ordinary joy and uncomplicated home scenes remain essential to the culture.

“Blow life into it” has two honest routes. A source-guided prompt packet offers expressive generation but uncertain compliance. An explicit symbolic score supports controlled rendering, but expressive realism depends on the chosen instrument engine and articulation. Both can be useful; neither must impersonate the other.
