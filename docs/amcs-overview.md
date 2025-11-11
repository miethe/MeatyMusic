# AMCS — Agent Overview (Bridge Doc)

**Audience:** AI agents and automated pipelines
**Goal:** Provide a concise, machine-first overview of the Agentic Music Creation System (AMCS)—what we’re building, the invariant principles, how work is orchestrated, and where each PRD fits. This document is the “north star” index and runtime brief for agents.

---

## 1) Mission & North Stars

* **Mission:** Deterministically convert structured creative intent (**SDS**) into validated artifacts—**style spec → lyrics → producer notes → composed prompt**—and optionally a rendered audio take via pluggable engines.
* **North Stars:**

  1. **Determinism:** Same inputs + seed ⇒ same outputs.
  2. **Constraint Fidelity:** Always satisfy blueprint/rubric + policy constraints before render.
  3. **Compact Power:** Minimal, non-conflicting tags with high information density.
  4. **Composable & Swappable:** Engines (Suno or others) and sources are connectors, not core.
  5. **Traceability:** Every decision carries provenance, hashes, and scores.

---

## 2) Operating Model (TL;DR)

* **Input:** A versioned **Song Design Spec (SDS)** JSON that references all entities.
* **Process:** `PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → (FIX)* → RENDER → REVIEW`
* **Output:** Validated artifacts (style/lyrics/notes/prompt), optional audio assets, scores, and an event stream.

---

## 3) Contracts You Must Respect

* **Global `seed`**: Every node uses the run seed or `seed+node_idx`.
* **Pinned Retrieval:** Only use source chunks whose hashes are logged in citations; fixed top-k; lexicographic tie-breaks.
* **Model Limits:** Obey engine character limits and parameter constraints.
* **Conflict Matrix:** Reject contradictory tags (e.g., “whisper” + “anthemic”).
* **Policy:** No public release outputs with “style of <living artist>”; redact PII; profanity obeys `constraints.explicit`.

---

## 4) System Snapshot

* **Client:** React/React-Native UI → compiles entity specs + SDS.
* **Gateway:** FastAPI (HTTP + WS events).
* **Orchestrator:** Graph runner (Claude Code skills) with retries and fix loops.
* **Storage:** Postgres (+pgvector) for metadata/embeddings; S3 for artifacts; Redis for queues.
* **Connectors:** MCP servers for sources/evaluators; render connectors (Suno et al.) behind feature flags.

---

## 5) PRD Index (1–2 sentence briefs)

> **Use these as the canonical contracts.** The filenames match the docs bundle.

* **Website Application** (`docs/website_app.prd.md`)
  Defines routes, screens, component library, API endpoints, events, and persistence. Serves as the UX/system wrapper and specifies JSON spec emission from the UI.

* **Style Entity** (`docs/style.prd.md`)
  Multi-select, tag-rich musical identity: genre/sub-genre/fusion, BPM range, key + modulations, mood/energy/instrumentation/vocal profile, and positive/negative tags with conflict checks.

* **Lyrics Entity** (`docs/lyrics.prd.md`)
  Textual constraints: sections/order, rhyme scheme, meter, syllables/line, POV/tense, hook/repetition strategies, imagery density, reading level, explicitness, and source-citation weights.

* **Persona/Band Entity** (`docs/persona.prd.md`)
  Reusable artist profile with vocal range/delivery, influences, default style/lyrics templates, and release/policy toggles; conditions style and prompt composition.

* **Producer Notes Entity** (`docs/producer_notes.prd.md`)
  Arrangement and mix intent: structure, number of hooks, per-section tags/durations, instrumentation hints, mix targets (loudness, space, stereo width).

* **Source Entity** (`docs/sources.prd.md`)
  External knowledge registry (file/web/API/MCP) with scopes, allow/deny lists, weights, and required provenance hashing for deterministic RAG.

* **Blueprint & Rubric** (`docs/blueprint.prd.md`)
  Genre algorithms: tempo windows, required sections, lexicon +/- lists, banned terms, and scoring weights/thresholds powering validation and auto-fix.

* **Prompt Composition** (`docs/prompt.prd.md`)
  Merge style/lyrics/notes into a render-ready prompt with section tags and model-aware limits; enforces compact, non-conflicting tags and length guards.

* **Song Design Spec (SDS)** (`docs/sds.prd.md`)
  The aggregator contract: references all entities, sets global seed, render flags, and evaluation targets; single source of truth for a run.

* **Render Job** (`docs/render_job.prd.md`)
  Programmatic render request (engine/model/variations/seed/callbacks) for engines like Suno; optional in MVP.

* **Claude Code Workflow** (`docs/claude_code_orchestration.prd.md`)
  State machine, skill I/O, determinism rules, run manifest, events, acceptance gates; defines retries and fix cycles capped at 3.

* **Future Extensions** (`docs/future_expansions.prd.md`)
  Direct Suno integration, analytics ingestion, in-app agent invocation, collaboration, stems export, and plugin ecosystem roadmap.

* **Design Guidelines** (`docs/design_guidelines.md`)
  Visual system and UX rules: palette, type, layout grid, component patterns, accessibility targets, and screen inspirations.

---

## 6) Workflow Responsibilities (per node)

* **PLAN:** Expand SDS into ordered work targets (sections, goals); no external calls.
* **STYLE:** Emit style spec honoring blueprint limits; sanitize conflicting tags.
* **LYRICS:** Generate lyrics with citations; satisfy section and profanity rules.
* **PRODUCER:** Produce arrangement/mix guidance aligned to style and blueprint.
* **COMPOSE:** Build final prompt (with section/meta tags) under model limits.
* **VALIDATE:** Score vs rubric; run length/section/policy/conflict guards.
* **FIX (loop ≤3):** Apply targeted diffs (e.g., add hook lines; tighten rhyme).
* **RENDER (flagged):** Submit composed prompt to connector; store job + assets.
* **REVIEW:** Persist artifacts, scores, citations, and emit final events.

---

## 7) Determinism & Reproducibility

* **Decoding:** Low-variance settings (e.g., temperature ≤0.3, fixed top-p).
* **RAG:** Deterministic queries; fixed `top_k`; chunk hashes in citations; strict tie-breaks.
* **Sorting:** Serialize arrays (tags, instrumentation) lexicographically before hashing.
* **Seeds:** `run.seed` is canonical; derived seeds per node = `seed + node_index`.

---

## 8) Evaluation & Policy Guards

* **Metrics:** `hook_density`, `singability`, `rhyme_tightness`, `section_completeness`, `profanity_score`, `total`.
* **Hard Fails:** Over length limits, missing required sections, profanity when disallowed, style-of-living-artist in public mode, contradictory tag sets.
* **Auto-Fix Playbook:**

  * Low hook density → duplicate/condense chorus hooks.
  * Weak rhyme/meter → adjust scheme or syllables/line.
  * Tag conflicts → drop the lowest-weight tag per conflict matrix.

---

## 9) Performance Targets (MVP)

* **Plan→Prompt Latency:** P95 ≤ 60s (excluding external rendering).
* **Rubric Pass Rate:** ≥ 95% without manual edits on the test suite.
* **Repro Rate:** ≥ 99% identical outputs across 10 replays (frozen inputs).
* **Security:** Zero high-severity violations on MCP allow-list policy.

---

## 10) Feature Flags (examples)

```json
{
  "render.suno.enabled": false,
  "eval.autofix.enabled": true,
  "policy.release.strict": true,
  "ui.experimental.personas": false
}
```

---

## 11) Repo & Files (expected layout)

```
/docs/*.prd.md                  # PRDs (this doc indexes them)
/schemas/*.json                 # JSON Schemas (entities + SDS + prompt)
/taxonomies/style_tags.json     # Tag categories and conflict matrix
/limits/engine_limits.json      # Per-engine char limits & params
/specs/{song_id}/*.json         # FE-emitted entity specs + SDS
/runs/{song_id}/{run_id}/...    # Node IO, scores, citations, assets
```

---

## 12) Agent Runbook (default)

1. **Validate SDS** against schemas and feature flags.
2. **PLAN** → derive ordered objectives.
3. **STYLE, LYRICS, PRODUCER** in parallel where possible; persist artifacts + hashes.
4. **COMPOSE** → produce `composed_prompt` within model limits.
5. **VALIDATE** → compute scores; if fail → **FIX** (≤3) → **COMPOSE** → **VALIDATE**.
6. **RENDER** (if enabled) → submit job, then poll and store assets.
7. **REVIEW** → finalize outputs, emit events, produce summary JSON.

---

## 13) Safety & Compliance

* **PII & Private Sources:** Access only via allowed MCP scopes; always include provenance hashes; redact where policy requires.
* **Influences:** Normalize “in the style of” to generic influence language for public releases.
* **Profanity/Explicitness:** Enforce `constraints.explicit` strictly.

---

## 14) Glossary

* **SDS:** Song Design Spec—single JSON that ties all entities together.
* **Blueprint/Rubric:** Genre rules + scoring weights/thresholds.
* **Composer:** The prompt-builder that merges artifacts into a render-ready prompt.
* **Connector:** Pluggable adapter for render engines or sources.

---

## 15) Acceptance Gates (release promotion)

* **Gate A:** Rubric pass ≥ 95% on 200-song synthetic set.
* **Gate B:** Determinism reproducibility ≥ 99%.
* **Gate C:** Security: MCP allow-list audit clean.
* **Gate D:** Latency P95 ≤ 60s (no render).

---

### Final Note to Agents

This overview is the **shared map**. Always defer to the **entity PRDs** for field-level truth and to the **Claude Code Workflow PRD** for execution order and I/O contracts. If a constraint, limit, or policy conflicts, the **SDS schema + Blueprint** win unless a feature flag explicitly overrides them.
