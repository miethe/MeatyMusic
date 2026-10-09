---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: qa_report
title: "Validation, reproducibility and remaining gates"
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

# Validation, reproducibility and remaining gates


## Automated tests

Run from `prototype/`:

```bash
python3 -m unittest discover -s tests -v
python3 -m py_compile serve.py app/domain.py tools/client.py tools/music.py tools/mcp_stdio.py
node --check static/app.js  # development syntax check only; Node is not needed to run the app
```

The delivered test log records the exact count and outcome. Coverage includes compiler repeatability, Style/lyrics limits, Unicode counting, exact manual text, instrumental/vocal exclusions, section locks, variation ancestry, immutable handoff snapshots, current sequence checks, idempotency replay/conflicts, persisted state, link-only records, bounded moments, speech-scoped imports, provider-generation refusal, HTTP authorization, origin/host checks, original-file hashes, byte ranges, CLI and MCP lifecycle/tool calls.

Contract schemas and example consistency are checked with `prototype/tools/validate_contracts.py` when the optional developer package `jsonschema` is installed. They are not a production compatibility certification for any external provider or Voice Lab server.

## Browser review

Eleven screenshot files were captured from the actual implemented browser DOM, not image generation. Thirteen interaction/responsiveness checks passed with no JavaScript page errors; see `qa/browser-review.json`.

The authoring Chromium environment blocks navigation to arbitrary URLs, including localhost. Its policy was not changed. The review instead rendered the same local HTML/CSS/JS in an about:blank page, using a test transport bridge to the real local HTTP server. That bridge drove the domain commands and returned real uploaded/fixture bytes for browser decode and playback. Authentication/origin/range behavior was separately tested through HTTP.

**Not established by that review:** native browser cookie-based fetch/media, native clipboard permissions, native downloads, screen-reader conformance, or a deployed application. These must be validated in Nick's ordinary browser before integration acceptance.

Optional browser developer setup, separate from zero-dependency runtime:

```bash
python3 -m venv .venv-dev
. .venv-dev/bin/activate
python3 -m pip install playwright jsonschema
python3 -m playwright install chromium
python3 tools/browser_review.py
```

Inspect `tools/browser_review.py --help` for a custom Chromium executable and the transport-bridge mode used during authoring. Browser tests use a temporary isolated workspace; they do not need provider access.

## Audio evidence

The two bundled 24/26-second WAVs are deterministic authored synthesis fixtures. Their source generator is included. They establish transport/playback/region behavior only; they are not a model benchmark, orchestra, sarod rendition, singer audition or a user's original Suno export.

Uploaded originals are hashed and stored unchanged. WAV header duration is measured server-side. Other format durations are supplied by browser decode and labeled accordingly. Initial signature checks do not replace robust production decoding. The prototype imports at most 40 MB and decodes the whole file in the browser; large-library streaming is future work. Playback output and auditory fidelity were not measured with hardware.

## Known limitations

- Single local operator; no RBAC, public deployment or server identity federation.
- macOS/Linux process locking uses `fcntl`; Windows is not supported by this entrypoint.
- Global workspace sequence, JSON storage and in-memory history are review-scale, not production architecture.
- Export workspace is metadata only. Stop server and back up workspace plus assets for full recovery; no restore UI is implemented.
- No live generation, voice creation, voice enrollment, live service calls or paid-provider availability probes.
- Voice Lab imports use basic v1.0 field validation; full authoritative schema and permission/revocation validation must be integrated before production.
- No robust immutable singer revision history or cross-provider singing binding lifecycle yet.
- No automatic audio alignment, loudness matching, blind ratings, instrument detection, tempo/key analysis, singer identity verification, stem isolation or audio editing.
- Eleven plan durations are placeholders; singing lyrics still need proper section assignment.
- No general drag/drop score editor, MIDI event renderer or exact symbolic composition system; AGL remains the formal construction owner.
- The included historical prompt collections are source assets, not imported application entities and not a source of current provider entitlements.
- Instrument taxonomy is editorial and deliberately does not promise authenticity or provider recognition.
- Three typed transformations and a basic experiment-plan export are implemented; general orchestration and experiment execution remain future work.

## Native acceptance checklist

Run the server in an ordinary browser. Verify initial session and mutation flow, reload persistence, two-tab conflict, file import, seek/range playback, clipboard, downloaded JSONs and encoded Unicode. Check mobile, 200% zoom, reduced motion, keyboard focus/escape and long names. Import an actual permitted Suno file and map it to an exact handoff. Confirm links open only on user action and no network leaves the app without a chosen navigation.

Then test production integration separately: estate auth, database rollback/migration, artifact backups and restore, current Voice Lab bundle contract, current aos-tts catalog and dry-run, official provider discovery, explicit live budget gate and telemetry receipts. A source merge is not deployment proof.
