# MeatyMusic PRD Quick Reference

**A quick lookup guide for key PRD information**

---

## Core Entities

| Entity | Purpose | Key Fields | Key Constraints |
|--------|---------|-----------|-----------------|
| **Style** | Musical identity | genre, tempo (40-220 BPM), key, mood, energy, instrumentation, tags | Tempo-energy alignment, max 3 instruments, tag conflict matrix |
| **Lyrics** | Song text + structure | language, pov, tense, themes, rhyme, meter, syllables, hooks, sections | Required Chorus, weight normalization, profanity filter if explicit=false |
| **Persona** | Artist/band identity | name, kind, voice, vocal_range, delivery, influences, style_defaults | Unique name, public policy sanitization |
| **Producer Notes** | Arrangement guidance | structure, hooks, instrumentation, section_meta, mix | Structure alignment, duration budget ±30s, section tag validation |
| **Blueprint** | Genre rules + rubric | tempo_range, required_sections, banned_terms, lexicon, scoring weights | Weights sum to 1.0, min_total 0-1, section min/max lines |
| **Source** | External knowledge | name, kind, config, scopes, weight, allow, deny | Unique name, weight normalization, allow/deny no overlap |
| **Prompt** | Final render text | text (≤max_chars), meta (title, genre, tempo, tags, section_tags) | Character limit enforcement, conflict resolution, policy compliance |
| **Song (SDS)** | Complete spec | title, blueprint_ref, all entities, seed | Schema validation, engine limits, source weight normalization |

---

## Workflow Nodes

```
INPUT: SDS + Seed
  ↓
[PLAN] → objectives, targets, word counts
  ↓
[STYLE, LYRICS, PRODUCER] → (parallel where possible)
  ↓
[COMPOSE] → merged prompt
  ↓
[VALIDATE] → score against rubric
  ├→ PASS → [RENDER] → [REVIEW]
  └→ FAIL → [FIX] (≤3x) → [COMPOSE] → [VALIDATE]
  ↓
OUTPUT: artifacts + scores + citations
```

**Key Metrics:** hook_density, singability, rhyme_tightness, section_completeness, profanity_score

---

## API Endpoints Quick Map

### Entity CRUD (All entities follow same pattern)
```
POST   /api/v1/{entity}              Create
GET    /api/v1/{entity}/{id}         Retrieve
PUT    /api/v1/{entity}/{id}         Update
DELETE /api/v1/{entity}/{id}         Delete
GET    /api/v1/{entity}              List (paginated, filters)
POST   /api/v1/{entity}/import       Import from JSON
```

**Entities:** styles, lyrics, personas, producer_notes, sources, blueprints

### Songs & SDS
```
POST   /api/v1/songs                 Create song with SDS
GET    /api/v1/songs/{id}            Get song + SDS
GET    /api/v1/songs                 List songs
GET    /api/v1/songs/{id}/sds/export Download SDS as JSON
```

### Workflow
```
POST   /api/v1/runs                  Create run
GET    /api/v1/runs/{id}             Get run status
GET    /api/v1/runs/{id}/events      Get event history
POST   /api/v1/runs/{id}/retry       Retry run/node
POST   /api/v1/runs/{id}/cancel      Cancel run
WS     /events                       Event stream (WebSocket)
```

---

## Default Values (MVP SDS Generation)

### Style Defaults
```
tempo_bpm          → Blueprint's tempo range
time_signature     → 4/4 (or blueprint-specific)
key.primary        → Blueprint-recommended key
mood               → Blueprint's genre mood profile
energy             → Derived from tempo
instrumentation    → Blueprint defaults (max 3)
tags               → Blueprint lexicon (1-2 per category)
negative_tags      → Blueprint exclusions or empty
```

### Lyrics Defaults
```
language           → "en"
pov                → "1st"
tense              → "present"
rhyme_scheme       → "AABB"
meter              → "4/4 pop"
syllables_per_line → 8
hook_strategy      → "lyrical"
repetition_policy  → "moderate"
imagery_density    → 0.5
section_order      → Blueprint's required_sections
explicit           → false
max_lines          → 120
```

### Producer Notes Defaults
```
structure          → Derived from section_order
hooks              → 2
instrumentation    → Blueprint defaults
section_meta       → Standard tags + durations per section
mix.lufs           → -14.0 (streaming standard)
mix.space          → "balanced"
mix.stereo_width   → "normal"
```

---

## Performance Targets

| Metric | Target | Context |
|--------|--------|---------|
| Plan→Prompt Latency | P95 ≤ 60s | Excluding external render |
| SDS Generation | < 500ms P95 | Default application |
| Song Detail Load | < 1s P95 | Including SDS rendering |
| JSON Rendering | < 200ms | Syntax highlighting |
| FCP (First Contentful Paint) | < 2s | Page load |
| LCP (Largest Contentful Paint) | < 3s | Page load |
| Export Initiation | < 100ms | Download trigger |

---

## Acceptance Criteria (Release Gates)

### Gate A: Rubric Compliance
- ✅ ≥ 95% pass rate on 200-song synthetic test set
- ✅ Auto-fix loop addresses 90%+ of failures

### Gate B: Determinism
- ✅ ≥ 99% reproducibility (100 runs same input = identical output)
- ✅ Seed propagation working correctly
- ✅ Pinned retrieval by hash working

### Gate C: Security
- ✅ Zero high-severity MCP violations
- ✅ No PII in public outputs
- ✅ No living artists in public prompts (sanitized)
- ✅ Profanity filter enforcement

### Gate D: Performance
- ✅ P95 latency ≤ 60s (plan→prompt, excluding render)
- ✅ Page loads < 2s FCP, < 3s LCP
- ✅ JSON rendering < 200ms

---

## Validation Rules Checklist

### Schema & Data
- [ ] All SDS validates against sds.schema.json
- [ ] Source weights normalize to 1.0
- [ ] Seed is non-negative integer
- [ ] All required fields present
- [ ] Enum values match schema

### Entity-Specific
- [ ] **Style:** Tempo-energy alignment, ≤3 instruments, tag conflicts resolved
- [ ] **Lyrics:** Chorus required, syllables 4-16, profanity filtered if explicit=false
- [ ] **Producer Notes:** Structure matches section_order, duration ±30s, section tags valid
- [ ] **Blueprint:** Weights sum to 1.0, required_sections non-empty, min_total 0-1
- [ ] **Persona:** Name unique, public policies applied

### Workflow
- [ ] PLAN outputs section targets
- [ ] STYLE respects blueprint tempo/tags
- [ ] LYRICS enforces rhyme/meter/hooks
- [ ] PRODUCER aligns with structure
- [ ] COMPOSE stays ≤ char limits
- [ ] VALIDATE scores all metrics
- [ ] FIX applies targeted changes
- [ ] All outputs stored with metadata

---

## Conflict Resolution

### Tag Conflicts
**When detected:**
- Drop lower-priority tags to resolve
- Flag as warning if user-provided
- Automatically fixed in composition

### Tempo-Energy Misalignment
**Examples:**
- "Very slow" (< 60 BPM) + "high energy" → warn
- Fast (> 140 BPM) + "low energy" → warn
- Medium range (90-120) + "medium energy" → OK

### Profanity
**Process:**
- If `explicit = false`, filter banned terms
- Replace with `[[REDACTED]]` or safe substitutes
- Flag if profanity score exceeds `max_profanity` threshold
- Trigger fix loop if violations detected

### Influence Sanitization
**For public release:**
- If `persona.policy.disallow_named_style_of = true`
- Replace "Drake" → "contemporary hip-hop"
- Replace "Beyoncé" → "contemporary R&B divas"
- Keep influence weights the same

---

## Feature Flags (Configuration)

```json
{
  "render.suno.enabled": false,        // Enable Suno rendering
  "eval.autofix.enabled": true,        // Enable auto-fix loop
  "policy.release.strict": true,       // Enforce strict public policies
  "ui.experimental.personas": false,   // Experimental persona features
  "import.enabled": true,              // Enable entity import
  "analytics.enabled": false,          // Analytics dashboard
  "collaborative.enabled": false       // Collaborative editing
}
```

---

## Design System (UI)

### Colors (Dark Mode Default)
```
Background:  #0f0f1c (base), #1a1625 (surface), #252137 (panel)
Text:        #e2e4f5 (strong), #b4b7d6 (base), #8286a8 (muted)
Primary:     #5b4cfa → #6366f1 (gradient)
Success:     #10b981
Warning:     #f59e0b
Danger:      #ef4444
Info:        #3b82f6
```

### Spacing (4px base unit)
```
xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 20px
2xl: 24px, 3xl: 32px, 4xl: 48px, 5xl: 64px
```

### Typography (Inter Font)
```
Display:   48px/700/1.2
H1:        36px/700/1.25
H2:        30px/600/1.3
H3:        24px/600/1.35
Body:      16px/400/1.5
Caption:   12px/400/1.5
```

### Shadows (Elevation System)
```
elevation-1: 0 2px 8px (dark bg)
elevation-2: 0 4px 16px (dark bg)
elevation-3: 0 8px 24px (dark bg)
elevation-4: 0 16px 32px (dark bg)
elevation-5: 0 24px 48px (dark bg)
accent-glow: 0 0 20px rgba(91,76,250,0.4)
```

---

## Accessibility (WCAG AA)

### Contrast Ratios
```
Strong Text (18pt+):      15.2:1 minimum
Interactive Elements:     10.5:1 minimum
Normal Text:              7:1 minimum (AA)
```

### Key Requirements
- [ ] Keyboard navigation works for all interactions
- [ ] Focus indicators clearly visible (2px ring)
- [ ] ARIA labels on interactive elements
- [ ] Alt text on all images
- [ ] Form labels associated with inputs
- [ ] Semantic HTML throughout
- [ ] Color not sole means of conveying information
- [ ] Screen reader tested

---

## Testing Strategy

### Unit Tests
- Entity validation logic
- Default generation functions
- Conflict detection
- Schema validation

### Integration Tests
- API endpoint handlers
- Database CRUD operations
- Complete workflow (input → output)
- SDS compilation

### End-to-End Tests
- Song creation (wizard → submit → redirect)
- Entity import flow
- Workflow execution
- Export functionality

### Validation Tests
- **Determinism:** 100 runs same input → byte-identical output
- **Schema Compliance:** All defaults validate against schema
- **Blueprint Adherence:** All defaults satisfy genre rules
- **Conflict Detection:** Known conflicts trigger warnings

### Performance Tests
- SDS generation latency
- Page load times
- JSON rendering
- Export speed

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `/docs/amcs-overview.md` | System north star and agent reference |
| `/docs/project_plans/PRDs/` | Complete 15 PRD files |
| `/docs/hit_song_blueprint/` | Genre-specific hit song blueprints |
| `/schemas/` | JSON schemas for all entities |
| `/taxonomies/` | Tag categories and conflict matrix |
| `/limits/` | Per-engine character limits |

---

**Quick Links:**
- [Full PRD Requirements Summary](/docs/PRD_REQUIREMENTS_SUMMARY.md)
- [AMCS Overview](/docs/amcs-overview.md)
- [System Architecture](/docs/architecture/)
- [Hit Song Blueprints](/docs/hit_song_blueprint/)

**Last Updated:** 2025-11-19
