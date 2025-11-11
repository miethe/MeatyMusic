# Product Requirements Document – Music Creation App (Website)

## 1. Purpose and Scope

This PRD describes the **full‑stack web application** that acts as the main interface for the Agentic Music Creation System (AMCS).  It covers the web front‑end, the back‑end services, data storage, API design and user flows.  The site allows users to design styles, write lyrics, build personas, assemble blueprints and produce song specifications (SDS).  It also orchestrates the Claude Code workflow and, in later versions, will support direct interaction with third‑party music engines such as Suno.

### Objectives

* Provide a responsive, mobile‑friendly web application for creating and managing music assets.
* Offer intuitive forms for entering complex song attributes such as **style**, **lyrics**, **persona**, **producer notes**, **sources**, **blueprints** and **render jobs**.
* Use multi‑select chips and tag inputs for fields like mood, instrumentation and sources.  Where a precise value is required (e.g., BPM or key), allow ranges or modulations rather than a single fixed value.
* Generate **spec JSON files** for each entity and a master **Song Design Spec (SDS)**.  These specifications are consumed by the Claude Code workflow or other agentic services.
* Provide a dashboard showing recently created songs, templates, personas and analytics.  Support editing, cloning and deletion of assets.
* Reuse UI components and infrastructure patterns from previous apps (e.g., MediPrompts) to accelerate development while applying a distinct brand identity.
* Prepare the architecture for future features such as in‑app Suno rendering, analytics dashboards and collaborative editing.

### Out‑of‑Scope

* Real‑time DAW‑style audio editing.
* Public song publishing or streaming.  Integration with music distribution platforms is deferred to a separate future PRD.
* Payment processing or subscription management.

## 2. User Personas

1. **Songwriter** – Interested in designing songs for personal or commercial use.  Lacks deep musical training but knows how to describe moods, instruments and themes.
2. **Producer** – A technical user who wants to experiment with AI‑assisted composition, create custom production notes and integrate external data sources (e.g., family stories or lore) into songs.
3. **Editor/Reviewer** – Responsible for reviewing songs, adjusting fields and ensuring compliance with legal or style guidelines before release.

## 3. Core Entities

The web application manipulates several primary entities.  Each has its own PRD detailing schema, validation rules and user interface controls.  At a high level:

| Entity         | Purpose                                                   |
|---------------|-----------------------------------------------------------|
| **Style**     | Captures genre, sub‑genre, tempo, key, mood, energy, instrumentation and tags.  Supports multiple selections where appropriate. |
| **Lyrics**    | Stores lyrical content and structural constraints such as rhyme scheme, meter, syllables per line, POV, tense, hook strategy and repetition policy.  Allows multiple sources with weights. |
| **Persona**   | Represents an artist or band with bio, vocal range, delivery style, influences and default style/lyrics templates.  Includes policy flags for public release. |
| **Producer Notes** | Defines song structure (e.g., verse/chorus order), hooks, instrumentation hints, mix parameters and per‑section tags. |
| **Source**    | Registers external knowledge bases (family documents, APIs like *An API of Ice and Fire*) along with scopes, filters and weights. |
| **Blueprint** | Encodes algorithmic rules and evaluation rubrics for a particular genre.  Defines tempo ranges, required sections, lexicon constraints and scoring weights. |
| **Prompt**    | Assembles text used by an external music engine.  Contains the final merged style, lyrics and producer notes plus meta tags and model‑specific limits. |
| **Song Design Spec (SDS)** | Aggregates the above entities into a canonical specification for the Claude Code workflow. |
| **Render Job** | Represents a request to a music engine (e.g., Suno) including model parameters and callbacks. |

## 4. Information Architecture

The site uses a **dashboard‑centric layout**.  A persistent side navigation panel lists high‑level sections:

* **Home** – Overview of recent songs, pending render jobs and quick actions (new style, new lyrics, etc.).  
* **Styles** – Library of style definitions.  Includes filters by genre, mood and creation date.
* **Lyrics** – Library of lyric specs.  Includes filters by language, POV and reading level.
* **Personas** – Library of personas.  Includes search and grouping by artist or band.
* **Blueprints** – Library of genre blueprints and rubrics.
* **Sources** – Management of external sources (files, APIs).  Allows scope assignment and weighting.
* **Workflows** – Launches and monitors Claude Code runs.  Shows status of each step (Plan, Style, Lyrics, Producer, Compose, Validate, Fix, Render).
* **Settings** – Global app settings, taxonomies (tag lists), API keys and feature flags.

The top bar shows the app logo, a breadcrumb for current location, user avatar and notifications (render job completion, validation failures).

## 5. User Flow

1. **Create a New Song**
   1. From the dashboard or header, click **New Song**.  
   2. The app prompts the user to choose whether to start from a template or from scratch.  
   3. On the **Style Editor** page, the user fills out genre, tempo (range), key (with modulations), mood (multi‑select chips), energy level, instrumentation and tags.  Real‑time validation warns about conflicting cues (e.g., “very slow” with “high energy”).
   4. On the **Lyrics Editor** page, the user writes verses, choruses and bridges in separate fields.  They set rhyme scheme, meter, syllable target, POV, tense, hook strategy and repetition policy.  They select one or more sources and adjust weights.  Profanity is flagged if explicit content is disallowed.  
   5. On the **Persona Selector** page, the user can link an existing persona or create a new one with vocal range, delivery and influences.  If no persona is chosen, the system uses a default generic voice.
   6. On the **Producer Notes** page, the user selects a structure (e.g., `Intro–Verse–Pre‑Chorus–Chorus–Bridge–Chorus`), number of hooks, instrumentation hints and mix preferences.  They can assign per‑section tags such as “anthemic chorus” or “minimal bridge”.
   7. On the **Summary** page, the system shows a preview of the aggregated SDS JSON.  The user can review and edit any section.  They can download the SDS or send it directly to the Claude Code workflow.  A call to the orchestrator is created with the SDS and the selected blueprint.
   8. After the workflow completes, the user receives prompts, final lyrics, producer notes and a composed prompt.  They may optionally submit the composed prompt to a render engine or copy it into Suno manually (MVP).  Future versions will allow direct submission.

2. **View and Edit Existing Assets**
   1. From any library page (Styles, Lyrics, Personas), click on a row to open a detail view.  
   2. The detail view displays the JSON spec, last modified date and associated songs.  Users can edit fields, clone the item, or archive it.  Versioning is handled via unique IDs and timestamps.
   3. Editing triggers validation and, if necessary, updates dependent SDS records.

## 6. UI Components and Design Guidelines

* **Theme** – Dark background (#0f0f1c) with purple and blue highlights.  Cards and inputs have rounded corners and subtle shadow.  Use semi‑transparent accent panels.  Typography is modern, sans‑serif and legible.  
* **Inputs** – Use chip components for multi‑select lists (mood, instrumentation, tags).  For range fields (tempo), use sliders with min/max handles.  Keys use a dropdown with optional modulations (multiple selection).  Sources include toggle switches and weight sliders.  Some fields have tooltips explaining best practices.
* **Preview Panels** – Show a real‑time JSON preview of the spec being built.  This teaches users the structure of the SDS and encourages them to refine fields.
* **Validation Messages** – Provide immediate, inline feedback on conflicting tags, missing required sections and profanity detection.  When warnings occur, suggest corrective action.
* **Reuse Patterns** – Follow component patterns from MediPrompts (card lists, navigation drawers, skeleton loaders).  For forms, use Stepper/Accordion components to collapse optional sections, improving readability.
* **Images** – The design includes high‑level renderings of key screens.  See the dashboard, style editor, lyrics editor and persona editor images included with this PRD.

### Screen Renderings

The following images illustrate the overall look and feel of the application.  They are concept art meant to inspire implementation rather than pixel‑perfect mock‑ups.

#### Dashboard

![Dashboard]({{file:file-EFFRQbZpzNEQ23zYdN3nkk}})

#### Style Editor

![Style Editor]({{file:file-6YimMTMTAjdkf8hwkEeoRc}})

#### Lyrics Editor

![Lyrics Editor]({{file:file-9WC5spbJhCFXM5sfogNEMB}})

#### Persona Editor

![Persona Editor]({{file:file-DSxJ4bTX2XsR7p3Jaaw81A}})

## 7. Back‑End and Infrastructure

### Architecture Overview

* **Front‑End** – Built with React (Next.js) or React Native for cross‑platform compatibility.  Uses TypeScript and modular component architecture.
* **Back‑End API** – Implemented with FastAPI (Python).  Exposes REST endpoints for all entities (`/styles`, `/lyrics`, `/personas`, `/producer_notes`, `/sources`, `/blueprints`, `/prompts`, `/sds`, `/render_jobs`).  Supports WebSockets (`/events`) for real‑time workflow updates.
* **Database** – PostgreSQL with `pgvector` extension for embeddings and similarity search.  Data models mirror the entity schemas described in their respective PRDs.
* **Object Storage** – S3‑compatible bucket for storing uploaded files (source documents, assets, prompts).  Use signed URLs for secure access.
* **Queue & Cache** – Redis for queuing asynchronous tasks (e.g., invoking Claude Code workflows) and caching meta‑data.
* **Orchestrator** – A microservice that reads SDS records from the database, constructs run manifests and invokes Claude Code skill graphs.  It monitors progress and writes results back into the database.
* **Authentication & Authorization** – Use OAuth2 (e.g., Auth0) for user sign‑in.  Role‑based access controls restrict editing rights (e.g., producers vs. viewers).  Secrets and API keys are stored in a vault.

### API Contracts

Key endpoints include:

| Method | Endpoint | Description |
|-------|----------|-------------|
| `POST` | `/styles` | Create a new style entity.  Accepts a payload matching the `style` schema. |
| `GET` | `/styles/{id}` | Retrieve a style by ID. |
| `POST` | `/songs` | Create a new song, including its SDS.  Consumes multiple entity IDs and returns a `song_id`. |
| `POST` | `/songs/{song_id}/runs` | Launch a Claude Code workflow with flags for plan/style/lyrics/render. |
| `GET` | `/runs/{id}` | Fetch run status and outputs. |
| `POST` | `/render_jobs` | Create a render job; feature‑flagged and only active when third‑party engine integration is enabled. |
| `WS` | `/events` | Subscribe to run events for real‑time updates.

### Data Persistence

Tables and columns follow the schemas in the entity PRDs.  All JSON fields are stored as `JSONB`.  Each table includes `id` (UUID), `created_at`, `updated_at`, `version` and `status` fields.  Relationships use foreign keys (e.g., `song.persona_id → persona.id`).

## 8. Acceptance Criteria

* Users can create, edit, clone and delete **style**, **lyrics**, **persona**, **producer notes** and **source** entities via the UI.  Forms correctly enforce required fields and show validation errors.
* The system can compile an SDS spec and start a Claude Code run.  Each step (plan → style → lyrics → producer → compose → validate → fix → render) is recorded and visible in the workflow screen.
* If any part of the workflow fails, an error notification appears with details.  Users can retry failed steps.
* Generated prompts and final outputs adhere to the blueprint’s rubric (≥95 % pass rate).  99 % of runs are deterministic when given the same seed.
* Feature flags allow administrators to enable or disable experimental features (direct render via Suno, analytics dashboard, collaborative editing).

## 9. Best Practices and References

* Use **meta tags** to guide AI composition: Suno supports structural tags like `[Intro]`, `[Verse]`, `[Chorus]`, `[Bridge]` and `[Outro]`, voice tags like `[Male singer]` or `[Whispers]`, instrument tags like `[Acoustic guitar]` and sound effect tags like `[Applause]`【290562151583449†L313-L333】.  Tagging each section of the lyrics helps shape the arrangement.
* Keep prompts concise (≤ two sentences) yet detailed; always include BPM and mood and add special elements (e.g., vinyl crackle) for uniqueness【76184295849824†L412-L418】.  Save your best prompts in a personal library for reuse【76184295849824†L414-L419】.
* Iterative refinement improves quality: experiment with different tag combinations, adjust BPM and key and refine instrument lists to fix generic or wrong‑vibe outputs【76184295849824†L420-L429】.
* When designing tags, avoid conflicting cues (e.g., “very slow” with “high energy”) and limit to one or two tags per category.  Use categories such as Song Structure, Vocal & Voice, Instruments & Style, Mood & Atmosphere, Musical Elements & Qualities and Rhythm & Tempo.  Start with key tags first and add details gradually.  Though this guideline comes from community practice, it is reinforced by official meta tag categories【290562151583449†L313-L333】.

## 10. Future Extensions

* **In‑App Suno Rendering** – Integrate the Suno API directly into the app.  A new `/render_jobs` endpoint will accept composed prompts and return job IDs.  The render connector will poll for completion and store audio assets.  Until then, users can manually paste prompts into Suno.
* **Analytics & Tracking** – Capture metrics such as play counts, skip rates and completion rates from music platforms once songs are released.  Store metrics per song and display dashboards in the app.  Initial MVP will allow manual entry of release dates and URLs; automated ingestion comes later.
* **Direct Claude Code Invocation** – The front‑end will call Claude Code agents directly via API.  Specifications will be packaged as JSON and sent to a hosting service that executes the skill graph.  The orchestrator will move client‑side or become part of the Claude Code ecosystem.
* **Collaborative Editing** – Support multi‑user editing sessions on specs, with commenting and change tracking.
* **Plugins** – Allow custom modules for additional sources, evaluation functions or render engines.  Provide a plugin API with authentication and sandboxing.
