---
schema_version: 0.1
id: null
type: artifact
artifact_kind: experiment_protocol
title: "ROWAN-001 — Whole Performance to Deliberate Variation"
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

# ROWAN-001

## Question

What makes the complete return in **Above the Rowan Canopy** matter to Nick, and which musical relationships can be preserved, understood and deliberately transformed without replacing the performance with the prompt's original fiction?

## Primary asset and evidence

The full source is `prototype/study_inputs/rowan-original.wav`: 194.8 seconds, stereo, 48 kHz, 16-bit PCM, SHA-256 `dc900e042f1bea1fe48ae504106e89a4fd0d6fc53915b121eaddbe55e6fee1c6`. It is copied unchanged from the user-supplied master. All playback windows are views of that master, not a new “canonical” excerpt.

The supplied `rowan-raw.mid` hash is `093ed09746ae3d8555e2868e7028b7a50ab82dbc26d6175570cd7c158d579ac3`. The deterministic parser yields 434 raw events, first note at approximately 25.360417 seconds with origin still zero. Its 120 BPM metadata is not a measured song tempo. Parser event timings were cross-checked against PrettyMIDI; this verifies file interpretation, not transcription accuracy or instrument identification.

| Region | Approximate time | Evidence and meaning |
|---|---|---|
| Whole performance | 0–194.8 s | user-selected listening reference |
| First statement | 25–55 s | human report: first fiddle swell around :30 |
| Complete return | 85–112 s | user-requested meaningful unit, including preparation and aftermath |
| Reaching callback | 85–94 s | human interpretation of renewed ascent |
| Yearning retreat | 94–98 s | human description; not a measured loudness drop |
| Renewed rise | 98–105 s | human description of hope, continuation, strength |
| Aftermath | 105–112 s | release and continuing relation |

These are approximate conversational review windows, not verified phrase-boundary annotations. A future reviewer may shift them. Store any correction as a new annotation revision rather than rewriting source audio.

The actual accepted Rowan melody remains audio-anchored and notation-unverified. The earlier written D–F#–A–B–A–F# is a separate independently authored sketch. The full emotional relationship is called **Rowan Return**. Neither the current MIDI nor a chroma histogram proves the performed harmony, bowing, instrument identity or mechanism of yearning.

## Human insight to preserve

Nick described the dip as longing and yearning, and the following peak as hope, continuance and perhaps strength. He specifically corrected the focus from isolated high notes to their preparation. His interpretation is first-class creative evidence; it does not require an acoustic algorithm to validate his experience. The app must not convert it into a claim about personal trauma or a universal listener response.

## Stages and actual status

1. **Preserve and inspect — implemented locally:** master hash, format, waveform, raw MIDI inventory, full origin, user annotations and context dependencies.
2. **Review phrase identity — pending:** align raw MIDI against the original; inspect false onsets, octave artifacts, polyphony, held notes, pitch bends and instrument bleed. Human listening is necessary. Do not automatically flatten all overlaps to a monophonic fiddle part.
3. **Describe the mechanism — pending:** mark candidate melody/harmony/articulation/counterpoint explanations separately. Alternatives can coexist. A sustained note over moving harmony can be tested, not asserted from a graph.
4. **Paint alternate stories — implemented as intent:** branch the Rowan canvas and change an instrument role or phrase relationship, preserving reference anchors.
5. **Controlled symbolic reconstruction — pending for actual theme:** after notation review, write a minimal faithful reduction. The included 36-second authored sketch is only an infrastructure test and is not this reconstruction.
6. **Render and audition — diagnostic infrastructure implemented; realistic/native render pending:** preserve every output, renderer/version/preset, requested performance controls and receipts.
7. **Choose and integrate — human action pending:** accept a take for a stated purpose, not as blanket truth about every symbolic or emotional claim.

## Listening comparisons

A: full source. B: complete return with the earlier statement available. C: isolated renewed peak as an intentionally incomplete contrast. D: eventual corrected symbolic reduction. E: future original variation retaining the full relation. Comparing B and C is an exploratory within-person listening study; it is not a population claim. Repeat order and prior exposure can affect the experience. Do not overformalize a meaningful personal listening moment merely to get a number.

Useful judgments: recognition, anticipation, yearning, believable continuation, role clarity, retained identity and overall preference. Keep raw words as well as optional user-chosen ratings. Performance quality and literal compliance remain separate.

## Prompt and renderer experiments

For the bracketed Lyrics question, hold reference, model, Style, Exclude and available settings constant, compare arrangement guidance versus blank Lyrics, keep multiple outputs per condition, and review without the condition label first. Current pack prepares these materials but does not run provider experiments or claim a stable API.

For instrumental roles, begin with fiddle lead/cello counterline. Compare cello lead/fiddle response, fiddle+dulcimer, and late horn arrival. Change one intended dimension initially. Do not call a loudness increase proof of hope or an instrument-program change proof of a realistic cello.

## Completion criteria

- Whole recording and source metadata preserved.
- Peak retrieval includes earlier context and interpretation.
- Actual theme separated from authored sketch and raw extraction.
- At least one manually reviewed symbolic phrase with lineage before claiming exact transcription.
- At least one explicitly authored variant and real renderer receipt before claiming generated performance.
- Human review records what was preferred and what remained uncertain.
- Selected work/recipe/take identities survive round trip through human or agent creation.

## Present artifact set

The review build seeds the full original, seven annotated occurrences, six motifs, two story canvases and eight companion briefs. `examples/v0.4/` contains actual compiled packets and a separate authored MIDI/sine test. No new realistic Rowan soundtrack recordings are included. The supplied original is never normalized, remastered or overwritten.
