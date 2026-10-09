---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: integration_spec
title: "Music providers, singer design and speech integration"
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

# Music providers, singer design and speech integration


## Verified facts and proposed work

Provider documentation was checked on 2026-10-07. Account entitlements and live estate services were not probed. The table distinguishes public documentation from capabilities implemented in this package.

| Lane | Evidence / opportunity | What this prototype does | Next implementation gate |
| --- | --- | --- | --- |
| Suno | Official Suno Platform advertises a REST API, but public access resolves to sign-in | Exact manual Style/Excludes/settings handoff and result import | Inspect authorized API docs, account access, billing and model/operation contracts before submit integration |
| Suno Voices | Own-voice enrollment includes provider verification | Descriptive singer prompt only; no enrollment or identity claim | Authorized human provider flow; no synthetic proof-of-identity or assumed TTS transfer |
| Eleven Music | Prompt or ordered structured composition plan | Exports a draft plan; does not call API | Validate current fields, chunk durations, lyrics, controls, commercial access and error behavior |
| Google Lyria batch | Official batch music generation documentation | Proposed capability lane only | Pin model and operation; test an authorized request and retention rules |
| Lyria RealTime | Experimental continuously steered music stream; distinct from batch | Proposed only | Separate streaming/session controls; do not promise vocals or full-score preservation |
| Stable Audio Open | Specific open model release aimed at short samples/effects | Proposed local-materials lane | Review chosen release/license, hardware and adapter; no download/install performed |
| Voice Lab | Local curatorial workshop and promotion bundle | Reads promotion metadata; exports a proposed design brief | Align a brief importer/launcher to current implemented-contract; do not invent endpoint |
| aos-tts | Estate speech service consumes promoted voices | Exports a reviewed-speech handoff with live disabled | Resolve exact catalog and render contract; preserve live/paid/per-request gates |

**Correction to earlier assumptions:** do not describe Suno as having no official API. An official API entry point is now public. That alone does not establish that Nick's Pro subscription includes API access or that an unofficial endpoint is authorized. Manual handoff remains useful and fully supported. [P1]

## Suno manual handoff

Input: frozen recipe and provider target. Output: exact Style, separate Excludes, optional lyrics, user-recorded settings, compilation report and immutable recipe snapshot. The prototype uses the user's 1,000-unit Style target and 5,000-unit lyrics project target. It does not treat model names or slider values from previous prompt packs as verified current capabilities.

Manual text changes in the app remain exact; external last-minute changes are captured in actual_submission. The prepared artifact is not rewritten. A provider link alone remains link_only. Imported bytes are unchanged. The UI never suggests the prompt editor is a live mixer.

Production API discovery must record operation-specific shape, official base URL, authorization, per-field counters, model IDs, plan eligibility, reference-audio rules, cancellation semantics, request/take multiplicity, rate limits, billing and retention. No scraped session-token or browser automation dependency should be hidden behind a generic “Suno adapter.”

## Structured-plan compilation

Eleven Music supports ordered chunks with durations and positive/negative style instructions. [P4] The prototype exports a preview using 30-second placeholder section durations. This is visibly a draft, not a rendered result or validated universal request. Before live use, assign actual durations and lyrics to sections, inspect length limits, and pin the accepted endpoint schema. A model seed does not replace a generation receipt.

A Lyria batch adapter and a RealTime session adapter must be separate operations. Live steering affects future stream generation; it is not a reliable edit to a previously saved waveform. RealTime's documented instrumental limitation must not be inherited by batch indiscriminately, nor should batch vocal capability be advertised for RealTime. [P6–P7]

## The singer architecture: three records, not one

1. **SingerDirection** — creative intent. Timbre, target register, vowel shape, phrasing, melisma, vibrato, accent/language, emotional delivery, role and ensemble relationship. A target range is a request, not a measured capability.
2. **SpeechBinding** — a promoted or locked resource that can render spoken text under a specific provider/model/voice contract. It carries source revision and operation permissions.
3. **SingingBinding** — optional, separately validated capability for the intended musical operation. Records provider/model/resource, enrollment evidence, register tests, language/phoneme tests, identity-continuity observations and usage permissions.

One singer can have several bindings, and a binding may expire or be revoked independently of the creative persona. A creative profile remains usable when no singing model is available.

## Proposed singer workflow

### Define

Create Ember-like lead and Hollow-like answer profiles, independently of any real person's identity. Define the relationship: female voice carries the main melody, low voice adds an independent supporting harmony, neither crowds the other's phrases. For a duet, record where parts sing alone, alternate, harmonize or overlap. Current prototype compiles broad singer descriptors; per-section vocal score/parts are target work.

### Audition speech where useful

Export a proposed `meatymusic.voice-design-brief.v1` containing the direction, review questions and probe plan. Voice Lab currently imports recordings and curates them; it does not call providers or create provider voices. [R1] A new brief intake can coordinate the work but must not quietly turn Voice Lab into the generator.

For existing promoted speech resources, obtain Voice Lab's versioned promotion bundle. The current schema has `schema: voice-lab.promotion-bundle`, `schema_version: 1.0`, voice/provider/model bindings, mood styles, source and provenance. [R2] This prototype validates basic fields and links metadata. Full published-schema validation and source revision reconciliation are required before production trust.

Aos-tts generates reviewed speech from its own promoted catalog; the music app may prepare a spoken character read or lyrics read-through. The prototype exports `meatymusic.speech-handoff.v1`, explicitly prepared_not_sent, backend dry-run, confirm_live false. This is not the aos-tts wire request. An adapter must resolve the actual service's contract and catalog ID. Speech can help audition character or pronunciation; it does not prove sung phrasing, pitch control or tessitura.

### Validate singing separately

For a supporting provider, use authorized enrollment and musical test material. Suno's own-voice workflow compares a spoken verification phrase with the uploaded singing voice; it is not a generic synthetic persona import. [P2] Do not attempt to satisfy identity verification with synthetic speech from another system.

ElevenLabs specifically documents that its Professional Voice Clones do not currently support singing and require spoken training material. [P5] That statement is scoped to Professional Voice Cloning; it does not imply Eleven Music cannot generate vocals. Do not map an arbitrary Eleven TTS voice_id into a Music request without an explicitly documented binding contract.

Begin a singing evaluation with an original short phrase at a comfortable target register, alternate vowel sounds, soft and stronger delivery, a held note, a simple descending melisma, then one real ensemble passage. Keep quality, identity consistency, range and preference separate. Record observations by condition and take. A pleasant speech sample is neither failure nor success evidence for these musical tests.

### Promote

Speech promotions continue through Voice Lab → aos-tts. Musical singer-profile changes are approved in MeatyMusic. A singing-resource promotion must include actual provider-specific evidence; it does not mutate or overstate the speech binding. Keep source candidate/take/profile IDs and evidence revisions.

## Boundary cases to design explicitly

| Case | Correct behavior |
| --- | --- |
| No singing-capable binding | Keep “Direction only”; descriptive prompt remains useful |
| Speech voice imported | Mark “Speech reference”; singing stays unverified |
| Voice profile changed after lock | Hold for review; do not relabel the old take |
| Provider voice removed | Preserve creative persona and historical evidence; disable affected operation |
| Different vendor voice sounds similar | User similarity observation, not identity equivalence |
| Duet prompt yields one singer | Save the take and mismatch observation; do not fabricate stem identities |
| Instrumental recipe selected | Exclude vocal directives from compile; retain cast definitions for later reuse |
| Narration plus score | Separate speech and music stems; post-production is a distinct stage |
| Imported reference rights unknown | Permit only explicitly authorized operations; no automatic cross-provider upload |

## Existing estate interfaces to reuse, not duplicate

Voice Lab documents `/api/v1/implemented-contract` and `/api/v1/domain-schema`, candidate/take/artifact/evaluation/persona/lock routes, idempotency keys and If-Match. Unimplemented future routes return 501. Imported provider metadata is not remote synchronization. Its current loudness-matched comparison is documented as unimplemented. [R3]

Estate Voice has library, HTTP and CLI front doors, with the stable `tts` interface. Its live rendering is off by default and explicit per-request approval matters. A music integration must preserve those gates instead of treating a dry run as a generated sample. [R4]
