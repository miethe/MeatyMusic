---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: experience_design_brief
title: "MeatyMusic — The Instrument Maker's Studio"
project: MeatyMusic
domain: sonic_workshop_ux
status: proposed
owner: Nick Miethe
created_at: 2026-10-05
updated_at: 2026-10-05
system_of_record: GitHub
current_location: conversation_artifact
related_systems: [Agentic OS, SkillMeat, MeatyWiki, CCDash, IntentTree, Aural Geometry Lab]
source_context:
  - "meatymusic-sonic-workshop-direction-v0.1.md, supplied in this conversation"
  - "House-sound, unlikely-ensemble, and symphonic prompt experiments in this conversation"
  - "Prior generated MeatyMusic concept boards, visual references only"
intended_use: "Interaction design, focused screen mockups, and a subsequent clickable prototype"
next_action: "Prototype the arrange → branch → handoff → return → listen loop using fixture data"
review_cadence: "At prototype review and before implementation"
confidentiality: personal
tags: [MeatyMusic, sonic-workshop, interaction-design, musical-recipes, house-sound]
---

# MeatyMusic — The Instrument Maker's Studio

## 1. Objective and boundary

Create a tactile musical workshop where Nick can discover an ensemble, assign musical roles, change one relationship, hear the results, and keep the moments that matter. Musical exploration is the primary activity; prompts and provenance support it.

The existing product-direction document is the source for role-aware recipes, typed transformations, manual provider handoffs, exact submitted artifacts, take lineage, and listening notes. The screen composition, navigation, microcopy, progressive disclosure, and gesture details below are new design proposals. Nothing here establishes that a feature exists in the application or in a provider.

The previous image boards are aesthetic exploration, not a verified product contract. Do not inherit unverified model lists, direct Suno generation buttons, custom-model bindings, prices, waveform content, or exact durations from their artwork.

### Guiding sentence

**Start with something you love. Change a musical relationship. Hear what happened. Keep what matters.**

The product is neither a DAW nor an administrative dashboard. A recipe is structured musical intent; it is not the generated recording. The arrangement map therefore uses musical sections and approximate proportions, not editable audio clips.

## 2. Visual direction

Working name: **The Instrument Maker's Studio**.

A quiet, dark creative application with warm graphite surfaces, parchment-colored text, fine dividing rules, and a few meaningful material accents. Instrument illustrations are small specimen-like drawings rather than large decorative photographs. The sonic identity should be felt through materials, rhythm, and whitespace, not a full-screen fantasy landscape.

Use an editorial serif sparingly for composition titles, a highly readable sans-serif for controls, and a small monospace face for timecodes, counts, and revision IDs. No giant wordmark, marketing slogan, space panorama, saturated purple glow, or dashboard of vanity metrics on the working screen.

Suggested tokens, pending accessibility validation:

| Token | Proposed value | Role |
| --- | --- | --- |
| Canvas | #121718 | Warm graphite foundation |
| Panel | #1B2324 | Modest surface separation |
| Raised panel | #242D2E | Selected controls and sheets |
| Text | #F0ECE2 | Warm high-contrast primary text |
| Secondary text | #B8C1BC | Supporting labels |
| Lead accent | #D8AF76 | Instrument lead role |
| Answer accent | #8CBFB1 | Answering voice role |
| Support accent | #9FADC5 | Harmonic/bass support |
| Selection | #BBA5CC | Selected time range, with outline |

Role colors remain consistent across instrument cards and the intent map. Status always has a written label and icon; color alone never carries meaning. Verify contrast and focus visibility in a coded prototype rather than claiming the illustration is accessibility-tested.

## 3. Navigation and workspace

Three global destinations:

- **Workshop**: resume a draft, begin an idea, or open a recipe.
- **Library**: recipes, recordings, moments, and reusable assets.
- **Explore**: instruments, ensembles, references, and deliberate surprises.

House Sound is a pinned family of library profiles, not a separate product. Settings, provider access, and agent activity belong in secondary menus.

An open recipe has three local views: **Arrange**, **Variations**, **Listen**. Prompt and handoff controls open in a right-side drawer from any of them. A small History action exposes exact revisions and provenance on demand.

One player and take tray persist across navigation. Its label always identifies the recording being heard, separately from the draft being edited. Example: `Playing Original / Take 02 • editing Horn-led expansion`. A draft change does not imply that the recording has changed.

For wider desktop screens, use a slim navigation rail, a flexible main workspace, and one contextual right-side panel. Avoid simultaneously opening the instrument picker, the agent conversation, the prompt inspector, and the take details. They share one panel slot.

## 4. Arrival: resume rather than administer

Workshop's initial view asks **"What are we exploring?"** and presents:

1. The current recipe with a Resume button and the last listening note.
2. A small row of recent experiments with their actual state: draft, handoff prepared, awaiting return, takes attached.
3. Three entry actions: Start from a favorite, Build an ensemble, Paste a prompt.

The prompt box accepts a musical thought, not a required specification: `Oud and bass clarinet, starting as a duet and growing into an orchestra.` Optional cards offer two or three interpretable directions, not a wall of generated recommendations.

Missing BPM, key, or structure stays unset. A user can create a useful draft with a title and one musical idea. No tutorial is mandatory.

## 5. Flow A — Discover an instrument and build around it

Nick opens Explore and searches by name, technique, sound description, or familiar role. Examples: `breathy lead`, `bowed and woody`, `bright rhythmic plucks`.

An instrument card shows its name, short sourced description, relevant techniques, useful role suggestions, favorites/history, and an optional approved audio example. A preview button appears only when playable media is actually available. A Spotify reference can be a verified link plus Nick's note; it is not assumed to be an imported recording.

Choosing two instruments opens a compact ensemble tray. Nick assigns Lead and Answer, or leaves either open, then chooses **Build around these**. The app proposes a few accompaniment patterns with an explanation such as `long bowed response against short plucked phrases`. Suggestions are not hard cultural or musical laws.

Selecting one creates a draft recipe with editable roles and an optional section arc. The app does not silently impose an entire regional genre because one instrument was added.

## 6. Flow B — Arrange the ensemble

Use the existing recipe **Sarod on the Ridgeline** as the running example.

### Ensemble roles

| Role | Assignment | Example behavior |
| --- | --- | --- |
| Lead | Sarod | Introduce the central melody |
| Answer | Mandolin | Short rhythmic response |
| Counterline | Cello | Long independent bowed line |
| Foundation | Upright bass | Maintain the pocket |
| Color | Dobro | Connect selected phrases with slides |
| Expansion | Strings and French horns | Develop the opening material at larger scale |

Show role cards in two columns or compact rows, not a floor plan of orchestra seats. Each card exposes instrument, role, a short behavior label, and section-presence chips. Clicking it opens articulation, register, prominence, and references.

### Form strip

The central section strip is titled **Musical arc — intent, not audio**:

`Opening duet → Development → Orchestral expansion → Quiet return`

Section widths can express relative share. Exact timing is optional and explicitly labeled Target. Dragging a card changes intended presence; it does not edit any recording. Selecting a section filters the instrument roles shown below it.

### Meaningful controls

An optional **More expansive** control previews its actual patch: widen supporting register, add horn responses, increase final-section density. Tempo and other locked fields remain unchanged. A small **Changes next render** label prevents confusion with live audio controls.

Locks apply to recipe fields only. Hover help: `Keeps this instruction unchanged in variations; does not guarantee generated audio compliance.`

## 7. Flow C — Make a variation without losing the original

Nick chooses **Try a variation** and sees small operations rather than a blank chatbot:

- Swap a voice.
- Exchange two roles.
- Change the expansion.
- Reduce to chamber ensemble.
- Change the groove.
- Surprise me within my locks.

For `Let horns lead the expansion`, the preview states:

**Changed**

- Expansion lead: cello → French horn.
- Strings move to supporting harmony in that section.

**Preserved in the recipe**

- Opening duet.
- Rhythmic target.
- Return section.
- Common exclusions.

**Uncertain at render time**

- Exact audible melody continuity.

Applying creates a child draft with a parent link. The submitted parent remains immutable. Undo on a draft restores its prior state; it does not erase imported audio or past submissions.

Variations uses cards first, with a matrix option for deliberate experiments. Each card distinguishes recipe state, handoff state, and attached takes. A baseline with two takes can sit beside a prepared variation with none; no decorative waveform is shown for missing audio.

## 8. Flow D — Compile and hand off to Suno

The source proposal specifies a manual Suno handoff as the initial workflow. This design preserves that boundary rather than making a new claim about current provider API availability.

**Prepare in Suno** opens a drawer headed `Suno • Manual handoff`.

Separate fields:

- Style, with an actual character count against Nick's 1,000-character budget.
- Excludes, with independent copying and validation.
- Settings checklist, including unset/unknown entries.
- Compiler notes: preserved, omitted, and prompt-only intentions.

Actions: **Copy Style**, **Copy Excludes**, **Open Suno**, **Save handoff**. There is no direct generation button or invented cost estimate in this manual flow.

Copying does not mean submitted. Opening Suno does not mean a job started. The record can be Prepared until Nick explicitly records external submission or attaches its result.

Manual edits remain separate from the compiled text, with **Reconcile to recipe** as a reviewed proposal. Locked content that cannot fit causes a useful validation issue rather than silent truncation.

## 9. Flow E — Return with recordings

A pending card exposes **Attach results**. Nick may paste a provider link, drag local audio, or do both. The app asks which handoff it belongs to when association is ambiguous; it does not silently attach by title alone.

Show original filename, proposed take name, linked recipe/handoff, and whether actual submitted settings are known. A link-only record is useful but does not show a local waveform or playback control without real playback access.

Keep originals unchanged. Byte hashes support duplicate detection. Trims, conversions, and gain-altered exports become derivatives, not replacements.

Prepared, submitted externally, awaiting result, returned, failed, and association-unknown must remain distinguishable states. Do not infer that an old pending record failed merely because it has no audio.

## 10. Flow F — Listen, keep a moment, iterate

Listen makes the waveform large and the surrounding controls quiet. The recipe editor is not visible by default. Current take, parent variation, playback controls, and notes remain visible.

Nick selects `1:18–1:42`, chooses **Keep this moment**, and writes: `The handoff works; the accompaniment is too dense afterward.` The moment stores an asset-specific time range, a label, and the observation. It is not automatically extracted as a separate file.

Comparisons offer A/B switching, optional randomized labels, and playback-only loudness matching. Corresponding sections must be manually paired until alignment is established. Example: A at `1:18–1:42` might correspond to B at `1:24–1:49`.

**Build from this moment** creates a draft proposal linked to the observation. It carries musical intent forward; it does not automatically upload a restricted recording to another model. The first action is a recipe change, not an audio remix claim.

A favorite can have partial prompt adherence. Separate enjoyment, adherence, and intended use. Avoid a mandatory multi-axis rating form; one written note or pairwise preference is enough for the playful path.

## 11. Agents as contextual collaborators

A compact command field says **Describe a change…**. Expanding it uses the same right panel as the prompt inspector.

Example request: `Keep the opening. Let horns carry the expansion, but keep mandolin audible.`

Agent response is a patch card: three proposed changes, named locks preserved, unresolved points, and **Apply as variation**. It does not default to paragraphs, tools logs, or a new chat thread. Changes are visible on the musical objects they affect.

All UI and agent commands use the same domain contract. Expected revision protects against concurrent edits. External generation, restricted reference uploads, destructive operations, and profile promotion remain distinct authorized effects.

## 12. Library and house identity

Library tabs: **Recipes · Recordings · Moments · Assets**. Pinned collections hold House/Chamber, House/Symphonic, House/Roots, and House/Experimental.

Search distinguishes `requested instrument` from `reviewed audible presence`. A recipe can have ten takes, each with several moments, without losing the parent relationship. Cross-cultural references are context records, not a single catch-all taxonomy drawer.

**Suggest house rule** turns a listening observation into a candidate profile patch with evidence links. Saving a favorite does not automatically change all future prompts or train a provider model.

A motif family groups event semantics and source material but retains distinct identities such as execution finished and validation passed. Exporting an AOS cue is a reviewed packaging action. Aural Geometry Lab remains responsible for formal musical construction, not this listening catalog.

## 13. Mobile continuation

Prioritize play/pause, mark current time, short voice/text notes, favorites, simple variation requests, handoff status, and attach-a-link. Use bottom tabs and sheets rather than compressed desktop columns. Rich ensemble and section editing remains desktop-first in the first slice.

Do not auto-play. Keyboard users need non-drag alternatives for assigning instruments, reordering sections, and marking ranges. Preserve focus and announce asynchronous changes appropriately in the eventual application.

## 14. UI-to-domain contracts

Proposed contracts, not implemented endpoints:

| Intent | Domain operation | Important result |
| --- | --- | --- |
| Open a recipe | recipe.get | Revision and latest working state |
| Change one instrument | variation.plan | Patch, locks, unsupported intentions |
| Accept change | recipe.branch | New draft and parent link |
| Prepare provider text | prompt.compile | Separate fields, counts, warnings |
| Save manual transfer | handoff.create | Frozen payload and prepared state |
| Link result | asset.ingest | Take association and original-byte identity |
| Keep a moment | observation.add | Asset-specific range and note |
| Reuse lesson | identity.propose_update | Candidate rule, not silent promotion |

Representative patch-envelope fields: `actor_id`, `recipe_id`, `expected_revision`, `operations`, `preserve`, `effects`, `warnings`, `correlation_id`. Presentation and agent surfaces never create separate mutable copies of the recipe.

Dependencies for a clickable UX prototype: fixture recipes, fixture take records, licensed/user-provided playable audio if real playback is demonstrated, and stubbed domain responses with a visible Demo state. No real provider credential or paid generation is needed to test navigation and decision flow.

## 15. Three focused mockup frames

All are separate full-window landscape desktop views of the same product, not collages or marketing posters. Show `Concept / sample data` discreetly. Use the same typography, navigation, role colors, recipe title, and persistent player. Readable controls take priority over decoration.

### Frame 1 — Arrange

Title: `Sarod on the Ridgeline`. Badge: `House / Symphonic`. Active local tab: Arrange. Main area: role cards plus section strip with Opening / Develop / Expansion / Return. Opening is pinned. Target 96 BPM / 4/4 is clearly intention metadata. Right panel: `Change the expansion` with `Horns take the lead` selected; a short preserved/changed patch preview; `Apply as variation`. Bottom player explicitly says Original / Take 02 while editing a draft. No fake stem tracks.

### Frame 2 — Variations and manual handoff

Same recipe and shell, Variations active. Baseline card: Original, two illustrative imported takes. Horn-led expansion card: selected, Ready for handoff, no recording waveform. Bowed-lead alternative: Draft. Right drawer: `Suno • Manual handoff`, separate Style and Excludes fields, real budget labeling, buttons Copy Style / Copy Excludes / Open Suno, record state Prepared. No direct Suno Generate button, invented model binding, cost, or automatic success badge.

### Frame 3 — Listen and preserve a moment

Same shell, Listen active. A large illustrative waveform for Original / Take 02 with selected region 1:18–1:42. Compare chips for Original and Horn-led expansion, with manually paired ranges. Right: `Keep this moment`, label `The handoff`, a short listening note, and `Build from this moment`. A low tray shows saved moments and parent recipe links. Playback loudness matching clearly says it affects audition only. No claim of exact structural compliance.

### Rendered screen artifacts

- [Arrange: orchestration variation](01_arrange.png)
- [Variations: manual provider handoff](02_variations_handoff.png)
- [Listen: keep a musical moment](03_listen_moments.png)

These are static mockups with illustrative state and synthetic waveform graphics, not screenshots of an implemented app. `mockup-fixtures.json` records the complete sample prompt and its actual character count. No recording or generation service is connected.

## 16. First slice and success criteria

First prototype path: open supplied recipe → change a section role → inspect a child draft → prepare handoff → attach a fixture take → select a moment → create another draft from the note.

Tests:

1. Nick can identify the next useful action without reading a tutorial.
2. A swap never changes pinned recipe fields silently.
3. Editing a draft never alters or appears to alter the current recording.
4. Export separates Style and Excludes and visibly enforces the configured Style budget.
5. Preparing or copying a prompt never reports external submission.
6. Unknown take associations and settings remain unknown until resolved.
7. A saved moment survives navigation and retains its exact asset/range.
8. Enjoyment and adherence can disagree without one overwriting the other.
9. Agent edits create the same visible patch and history as UI edits.
10. A complete loop works without direct generation-provider integration.

Defer a node-graph-first editor, full DAW, realtime audio steering, automatic taste training, cross-provider audio reuse, and a portfolio-wide metrics dashboard. Their absence should not prevent the first useful creative session.

## 17. Ownership and next review

Owner: MeatyMusic. Layer: musical creation and asset curation, interfacing with AOS execution, reusable skills, telemetry, and memory. Postures: product designer/architect for interaction decisions, editor for microcopy, critic for state-truth and usability checks. Classification: personal creativity and implementation.

Suggested record: `docs/project_plans/design-specs/sonic-workshop-experience-v0.2.md`. SkillMeat should hold approved reusable operation/prompt bundles; MeatyWiki should hold the rationale and audition discoveries. No remote writes are implied by this document.

Next review question: **Does the role-and-section workspace feel like an instrument for exploration, or still like a settings form?** Test that with the three-screen flow before expanding the navigation.

## Source basis

Primary: `meatymusic-sonic-workshop-direction-v0.1.md`, sections 3–5, 7, 9–12, supplied in the conversation. Source-supported concepts are preserved; detailed screens, gestures, visual tokens, labels, and proposed domain contracts above are newly authored design recommendations.

The earlier generated image boards are visual references only. Current public provider documentation was not re-researched for this interaction-design pass; no new API availability, account entitlement, pricing, or model claim is made.
