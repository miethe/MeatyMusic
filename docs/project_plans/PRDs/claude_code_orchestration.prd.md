# Product Requirements Document – Claude Code Workflow

## 1. Purpose and Scope

This PRD specifies the **Claude Code orchestration workflow** used by the Agentic Music Creation System (AMCS).  It defines how a Song Design Spec (SDS) is transformed into intermediate artifacts (style spec, lyrics, producer notes), validated, optionally repaired, composed into a render‑ready prompt and, if enabled, sent to a music rendering engine.  The audience for this document is a team of AI agents and systems that will build, orchestrate and run these workflows deterministically.

### Objectives

* **Deterministic execution** – Given the same SDS, blueprint and seed, the workflow must produce identical outputs across runs.  All randomness is seeded and retrieval operations are pinned by content hashes.
* **Modular skill graph** – Encapsulate each major step (Plan, Style, Lyrics, Producer, Compose, Validate, Fix, Render, Review) as an agent skill with clearly defined inputs and outputs.  Skills can be updated or swapped independently.
* **Configurable** – The run manifest defines which steps to execute (e.g., skip rendering) and the maximum number of fix attempts.  Future extensions can add new nodes or connectors without breaking the contract.
* **Observability** – Emit structured events for each node (start, end, fail) with timestamps, durations, seeds, citations and scores.  Expose these via a WebSocket for the front‑end dashboard.
* **Safety and compliance** – Enforce blueprint rules, profanity policies and tag conflict checks within the workflow.  Do not leak sensitive information from sources.  Validate that prompts avoid “style of <living artist>” phrasing when public release is intended.

### Out‑of‑Scope

* Designing the user interface (covered by the Website PRD).
* Defining individual entity schemas (covered by entity PRDs).
* Implementing third‑party music engines (rendering is via a connector defined elsewhere).

## 2. Workflow Graph

### 2.1 States and Transitions

The orchestration is modelled as a directed acyclic graph (DAG) with deterministic nodes.  The standard flow is illustrated below:

```mermaid
stateDiagram-v2
    [*] --> PLAN
    PLAN --> STYLE
    PLAN --> LYRICS
    PLAN --> PRODUCER
    STYLE --> COMPOSE
    LYRICS --> COMPOSE
    PRODUCER --> COMPOSE
    COMPOSE --> VALIDATE
    VALIDATE --> RENDER: pass
    VALIDATE --> FIX: fail
    FIX --> COMPOSE
    RENDER --> REVIEW
    REVIEW --> [*]
```

* **PLAN** – Uses the SDS to produce a high‑level plan: section order, target word counts and evaluation targets.  No external calls.  Output: `plan.json`.
* **STYLE** – Generates a detailed style specification based on `sds.style`, blueprint rules and plan.  Outputs: `style.json` (tempo, key, mood, tags, instrumentation).  Constrained by blueprint tempo ranges and tag conflict matrix.
* **LYRICS** – Produces the lyrics.  Inputs: `sds.lyrics`, `sds.sources`, `plan`, blueprint and style spec.  The agent uses retrieval from MCP sources (family docs, external APIs) pinned by hash to avoid nondeterminism.  It enforces rhyme scheme, meter, syllable counts, hook strategy and repetition policy from the SDS.  Outputs: `lyrics.txt` and `citations.json` (list of source snippets and their hashes).
* **PRODUCER** – Creates production notes: structure, hooks, instrumentation hints, mix parameters, per‑section tags.  Inputs: `sds.producer_notes`, style and plan.  Outputs: `producer_notes.json`.
* **COMPOSE** – Merges the outputs from Style, Lyrics and Producer into a `composed_prompt.json` that matches the engine’s expected format.  It assembles tags and section cues (e.g., `[Intro]`, `[Verse]`, `[Chorus]`, `[Bridge]`) in the final text.  It also includes meta fields like BPM, mood and instrumentation.  It respects model character limits and avoids conflicting cues.  The composition guidelines emphasise using clear section tags, voice tags and instrument tags【290562151583449†L313-L333】 and keeping the prompt concise while including BPM, mood and special elements【76184295849824†L412-L418】.
* **VALIDATE** – Scores the composed artifacts against the blueprint’s rubric (e.g., hook density, singability, rhyme tightness, section completeness, profanity score).  If scores meet or exceed thresholds, the workflow proceeds to **RENDER**.  Otherwise, issues are returned and the flow transitions to **FIX**.
* **FIX** – Applies targeted modifications to the lowest‑scoring component.  For example, if hook density is low, the agent might insert an extra hook line; if rhyme tightness is poor, it adjusts the rhyme scheme.  After the fix, the workflow returns to **COMPOSE**.  A maximum of three fix cycles are permitted.
* **RENDER** – If the `render.engine` in the SDS is not "none", the agent sends the `composed_prompt` to the render connector (e.g., Suno API).  The connector returns a job ID and eventual audio asset URL.  If rendering is disabled, this node is skipped.
* **REVIEW** – Final step.  Collects all artifacts and scores.  Sends completion events.  Optionally notifies the user to review and publish.

### 2.2 Run Manifest

A run manifest tells the orchestrator which nodes to execute and provides configuration options.  It is a JSON object delivered alongside the SDS:

```json
{
  "song_id": "<uuid>",
  "seed": 42,
  "graph": [
    {"id": "PLAN"},
    {"id": "STYLE", "inputs": ["PLAN"]},
    {"id": "LYRICS", "inputs": ["PLAN"]},
    {"id": "PRODUCER", "inputs": ["PLAN"]},
    {"id": "COMPOSE", "inputs": ["STYLE","LYRICS","PRODUCER"]},
    {"id": "VALIDATE"},
    {"id": "FIX", "on": "fail", "max_retries": 3},
    {"id": "RENDER", "cond": "pass && flags.render"}
  ],
  "flags": {"render": true}
}
```

The orchestrator stores this manifest in the database, spawns each node in order and passes the outputs appropriately.

### 2.3 Determinism

* **Seed propagation** – Each run has a top‑level `seed`.  Each node seeds its random decisions with `seed + node_index`.  Retrieval operations use deterministic queries and sort results by hash.
* **Pinned retrieval** – Source chunks are identified by content hash.  The agent must store `citations.json` with `chunk_hash`, `source_id` and `text` to enable repeatability.  On re‑runs, the agent loads the same chunks by hash.
* **Decoder parameters** – Agents generate text with low temperature (≤ 0.3) and top‑p ≤ 0.9 to minimise variation.  All sampling parameters are recorded.

## 3. Skill Contracts

Each node is implemented as a skill specification.  The orchestrator uses these contracts to validate IO and call the correct agent function.

### 3.1 plan.generate

```yaml
name: amcs.plan.generate
inputs:
  sds: amcs://schemas/sds-1.0.json
outputs:
  plan: amcs://schemas/plan-1.0.json
determinism: true
```

### 3.2 style.generate

```yaml
name: amcs.style.generate
inputs:
  sds_style: amcs://schemas/style-1.0.json
  plan: amcs://schemas/plan-1.0.json
  blueprint: amcs://schemas/blueprint-1.0.json
outputs:
  style: amcs://schemas/style-1.0.json
policies:
  - enforce_tempo_range
  - tag_conflict_check
  - profanity_filter
determinism: true
```

### 3.3 lyrics.generate

```yaml
name: amcs.lyrics.generate
inputs:
  sds_lyrics: amcs://schemas/lyrics-1.0.json
  plan: amcs://schemas/plan-1.0.json
  style: amcs://schemas/style-1.0.json
  sources: list[amcs://schemas/source-1.0.json]
  blueprint: amcs://schemas/blueprint-1.0.json
outputs:
  lyrics: string
  citations: list[citation]
  metrics: { rhyme_tightness: number, singability: number, hook_density: number }
determinism: true
policies:
  - profanity_filter
  - lexicon_enforcement
  - section_requirements
```

### 3.4 producer.generate

```yaml
name: amcs.producer.generate
inputs:
  sds_producer: amcs://schemas/producer-notes-1.0.json
  plan: amcs://schemas/plan-1.0.json
  style: amcs://schemas/style-1.0.json
outputs:
  producer_notes: amcs://schemas/producer-notes-1.0.json
determinism: true
```

### 3.5 prompt.compose

```yaml
name: amcs.prompt.compose
inputs:
  style: amcs://schemas/style-1.0.json
  lyrics: string
  producer_notes: amcs://schemas/producer-notes-1.0.json
  limits: /limits/engine_limits.json
outputs:
  composed_prompt: amcs://schemas/composed-prompt-0.2.json
  issues: list[string]
policies:
  - char_limit_check
  - tag_conflict_check
  - normalize_influences
determinism: true
```

### 3.6 validate.evaluate

```yaml
name: amcs.validate.evaluate
inputs:
  lyrics: string
  style: amcs://schemas/style-1.0.json
  producer_notes: amcs://schemas/producer-notes-1.0.json
  blueprint: amcs://schemas/blueprint-1.0.json
  rubric: object
outputs:
  scores: { total: number, hook_density: number, singability: number, rhyme_tightness: number, section_completeness: number, profanity_score: number }
  issues: list[string]
determinism: true
```

### 3.7 fix.apply

```yaml
name: amcs.fix.apply
inputs:
  issues: list[string]
  style: amcs://schemas/style-1.0.json
  lyrics: string
  producer_notes: amcs://schemas/producer-notes-1.0.json
  blueprint: amcs://schemas/blueprint-1.0.json
outputs:
  patched_style: amcs://schemas/style-1.0.json
  patched_lyrics: string
  patched_producer_notes: amcs://schemas/producer-notes-1.0.json
determinism: true
```

### 3.8 render.submit

```yaml
name: amcs.render.submit
inputs:
  engine: string
  model: string
  composed_prompt: amcs://schemas/composed-prompt-0.2.json
  num_variations: integer
outputs:
  job_id: string
  asset_uri: string
determinism: false  # Dependent on external engine; results recorded for replay
```

## 4. API Endpoints

The orchestrator exposes a set of endpoints for the front‑end to interact with.  These are separate from the entity CRUD endpoints described in the Website PRD.

| Method | Endpoint                   | Description |
|-------|----------------------------|-------------|
| `POST` | `/runs`                    | Create a new run.  Request includes `song_id`, `sds_id`, `manifest` and `seed`.  Returns `run_id`. |
| `GET`  | `/runs/{run_id}`           | Fetch the status of a run.  Returns current node, progress, outputs and any issues. |
| `POST` | `/runs/{run_id}/retry`     | Retry a failed node or entire run.  Accepts a body specifying which node to retry and updates the run manifest. |
| `POST` | `/runs/{run_id}/cancel`    | Cancel an in‑progress run.  Marks status and stops further execution. |
| `WS`   | `/events`                  | WebSocket channel for receiving events: `{ ts, run_id, node, phase, duration_ms, metrics, issues }`. |

## 5. Acceptance Criteria

* The orchestrator executes the graph in order, respecting dependencies and conditions.  All node outputs are stored in the database and accessible via API.
* Deterministic nodes produce identical outputs for the same `sds` and `seed` across runs.  Non‑deterministic nodes (render) record their responses for replay.
* Validations enforce blueprint constraints and policy rules.  At least 95 % of compositions pass validation in automated tests; failed nodes trigger the fix loop.
* Events are emitted for each node start/end/fail with accurate timestamps and metrics.  The WebSocket stream reconnects gracefully.
* Runs can be cancelled and retried through the API.  Cancellation stops further node execution.
* The orchestrator gracefully handles agent errors, logs them and surfaces issues to the UI.

## 6. References & Best Practices

* **Meta Tag Categories** – Use structural tags (`[Intro]`, `[Verse]`, `[Chorus]`, `[Bridge]`, `[Outro]`) and voice/instrument tags in prompts to guide arrangement【290562151583449†L313-L333】.
* **Prompt Construction** – Keep prompts concise (≤ two sentences) but detailed, include BPM and mood, and add special elements for uniqueness【76184295849824†L412-L418】.
* **Iterative Refinement** – Adjust tags, BPM and instrumentation to improve output; refine prompts iteratively【76184295849824†L420-L429】.
* **Seed Control** – Always propagate the seed to ensure reproducible outputs.  Use low temperatures and top‑p sampling to reduce variability.

