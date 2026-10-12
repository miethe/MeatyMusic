---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: product_spec
title: "Product and UX direction"
project: MeatyMusic
domain: music_and_voice_creation
status: implementation_handoff_candidate
owner: Nick Miethe
created_at: 2026-10-07
updated_at: 2026-10-07
system_of_record: GitHub
current_location: conversation_handoff
related_systems: [Agentic OS, Voice Lab, aos-tts, SkillMeat, MeatyWiki, CCDash, IntentTree, Aural Geometry Lab]
source_context: "Existing Sonic Workshop proposal, focused UX references, repository contract reads, official provider documentation"
intended_use: "Local prototype review and additive implementation in the existing estate"
next_action: "Run the local prototype and reconcile the existing MeatyMusic implementation before integration"
review_cadence: "Before integration or provider capability changes"
confidentiality: personal
tags: [sonic-workshop, music, voice, prototype, implementation-handoff]
---

# Product and UX direction


## Purpose and problem

Make musical exploration tactile, legible and cumulative. The user should be able to preserve what moved them in a recording and change who carries the idea without reconstructing a conversation or losing a favorite passage.

A flat instrument/tag picker describes presence, not musical relationships. A folder of recordings loses intent, exact prompts and variations. A conventional DAW implies control over existing audio that a generative prompt does not provide. Sonic Workshop should solve those gaps without turning enjoyable experimentation into data entry.

## Assumptions

Personal-first; Nick is the initial operator. Desktop supports deep arrangement work; mobile supports listening, light edits and capture. Provider generation may occur outside the app. Theory fields may be unspecified. A house sound is a family with chamber, roots, symphonic and experimental branches—not a compulsory genre or provider custom model.

## Recommended visual direction

Use the focused graphite/mint screens as the baseline, not the earlier busy promotional collages. Warm near-black canvas, desaturated green surfaces, pale mint primary actions, amber for plucked/attention accents, blue for supporting lines and lilac for moments/voice direction. Serif musical titles plus a quiet system-sans interface. Fine vector instrument cues, not repeated fantasy landscapes or giant banners.

Color reinforces text; it never carries status alone. Recipe composition should feel like a thoughtful score notebook, the listening room like a focused audition space. The singular persistent player belongs to the actual take being heard, independent of the recipe currently being edited.

## Information architecture

| Workspace | Primary job | Default interaction |
| --- | --- | --- |
| Workshop | Shape and vary one recipe | Arrange → Variations → Listen & keep |
| Library | Recover recipes, takes and moments | Search, filter, open in context |
| Instruments | Discover a useful voice for a role | Search family/context, inspect behavior, add to selected section |
| Singers & voices | Define performers and link bounded voice resources | Edit direction, cast, import promoted speech metadata, export briefs |
| Connections | Inspect available routes and configure navigation links | Manual / export / proposed statuses; no guessed online status |

House collections and recent recipes are sidebar shortcuts, not additional systems of record. Advanced schemas, transport and logs stay out of the default creative path.

## Core flow A: one musical change

Entry: an existing favorite recipe. The current audio may keep playing.

1. Select an arrangement section. Section cards describe intention (Opening, Develop, Expansion, Return), not editable audio tracks.
2. Read instrument cards as role + voice + behavior. A recipe has multiple parts, with section-specific role overrides.
3. Select a transformation. The preview lists changed fields, preserved pins and its effect: next recipe only.
4. Applying creates a child with a parent revision reference. Original recipe and audio remain untouched.
5. Compile for the chosen target; length failure is visible, not silent truncation.

Pinned sections are real constraints. Replacing a lead that participates in a pinned opening is blocked until the user unpins that section. A warning offers the exact remedy rather than pretending to preserve something it changes. The prototype supports three operations; the production backlog adds role exchange, motif handoff and narrative alternatives.

## Core flow B: prepare, leave, return

Suno remains a first-class manual lane even when other APIs become available. Prepare the handoff before leaving: immutable recipe snapshot, exact Style/Excludes, target profile, compiler revision and chosen settings. Show `Prepared · not submitted`.

Copy Style and Excludes individually. Manual Style overrides are exact artifacts, including whitespace. Record actual text/settings if changed externally. “I submitted this” is a user attestation, not proof that a provider accepted the request. Returning a provider URL creates a link-only take. Uploading a file creates a locally playable take with a byte hash and declared association. One attempt may yield several takes.

Import UX must not guess which generation produced a file. Explicit association takes precedence over a filename suggestion. A link does not authorize fetching media. The local prototype does not fetch provider URLs.

## Core flow C: hear something useful

Open Listen & keep with the exact take title visible. Decode real audio to a waveform; do not reuse a decorative waveform as evidence. Choose a numeric range and audition it, then save a title and note. Original bytes remain unchanged.

The note should answer a musical observation: “Keep the mandolin audible after the horns enter,” rather than requiring a complete scoring rubric. Later evaluations can separately capture adherence, enjoyment and utility.

“Build from here” creates a child recipe with a reference to the moment. It is conceptual inspiration, not audio derivation. The current prototype does not infer the transformation from the note. A future agent can propose a typed patch for review.

A/B playback switches exact takes. Equivalent wall-clock times are not assumed to represent equivalent sections. Manual region pairing, audition-only loudness matching and blind sessions are backlog features; do not relabel the current switch as those features.

## Core flow D: discover by role

Start from “I need a gliding answering voice” as well as “Southeast Asia.” Display aliases, instrument family, sourced context, technique notes and authorized examples in the eventual catalog. Changing the instrument must not silently alter the piece's cultural grammar, tonal system or genre.

The prototype's 26 items are editorial prompt palettes, not authoritative instrument identifications. Do not infer that a renderer recognizes or faithfully reproduces each instrument. Learn provider recognition only from properly labeled observations tied to model, prompt and take.

## Core flow E: singer casting

A singer card represents a creative character: target register, tone, phrasing, language, vibrato and role. Ember and Hollow are fictional example directions. Their descriptions incorporate the user's interest in warm female leads, low supportive harmonies, patient phrasing and descending melisma—not claims that a provider voice exists.

Choose instrumental, solo or duet. An instrumental recipe excludes singer direction from the prompt. A vocal recipe includes selected performance descriptions, not a provider identity token. Avoid contradictory exclusions when switching from instrumental to vocal.

Link an imported promoted speech reference where useful. Label it `Speech reference`; singing remains `Unverified`. Export a proposed Voice Lab brief to coordinate further auditions, or prepare reviewed speech for Estate Voice. Neither export makes a provider call. The design supports a future explicit singing binding only after capability and identity evidence exist.

## Core flow F: agent collaboration

An agent can search the same catalog, inspect the current recipe, propose a variation and compile it. Writes require the current workspace sequence and an idempotency key. The UI must show the resulting local event and still let the human inspect what changed. Drafting a musical experiment is separate from executing a paid request.

Voice and music agents are functional postures on shared domain commands, not a swarm of persistent agents per instrument. A command such as “Make three alternatives, preserving the opening” produces reviewable candidates and a cost/operation plan before any external action.

## State language

| State | Exact meaning |
| --- | --- |
| Draft | Recipe may change; no recording is implied |
| Prepared | Frozen handoff exists; no submission is implied |
| Submitted by you | User recorded an external action; provider confirmation unknown |
| Link only | Reference exists; local audio unavailable |
| Imported original | Original file stored locally and hash-recorded |
| Diagnostic | Authored test signal, not generated music |
| Direction only | Creative voice description, not an instantiated voice |
| Speech reference | Promoted metadata is linked; singing not established |
| Proposed adapter | Intended architecture, not connectivity |

A later production asynchronous state machine should distinguish submission_pending, provider_acknowledged, submission_unknown, rendering, partial_delivery, completed, failed and cancellation_unknown. A timeout must not become a silent second paid request.

## Design and interaction constraints

Desktop: sidebar, central working area, contextual inspector, persistent player. Mobile: narrow icon rail, single-column cards, inspector below content, compact fixed player. Keep labels understandable without hover. Search must not erase editing or listening context.

Use local lightweight compilation for ordinary edits, not a model call on every control change. Advanced controls disclose the specific fields they affect. Keep desired tempo/key/structure visibly marked as targets. Never animate the waveform in response to a prompt slider unless actual audio changes.

Keyboard: labeled inputs, visible focus, semantic buttons, skip link, focus-trapped dialogs, Escape close, return focus, no autoplay. Respect reduced-motion settings. Production must also test screen-reader descriptions, contrast, zoom, touch targets and accessible waveform-range alternatives; the implemented numeric start/end inputs are the baseline alternative.

## Success criteria

A user can branch a favorite without losing its original, preserve the actual submitted text, attach the result, and recover a useful passage from one workspace. Common musical exploration needs no hypothesis form. The product can explain why an edit is pinned or a provider operation is unavailable. No UI state claims singer identity, audio edits, generation, synchronization or review work that did not occur.

## First release boundary

Ship the closed create/handoff/return/listen loop before real-time generation, public sharing, automated aesthetic scoring, voice cloning or DAW-like mixing. Keep the structured musical intent richer than any single provider's prompt field.
