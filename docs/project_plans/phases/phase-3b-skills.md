# Phase 3b: Workflow Skills & Validation

**Duration**: 1.5-2.5 weeks (of 3-4 week Phase 3)
**Status**: Not Started
**Dependencies**: Phase 3a (Orchestrator Foundation)
**Critical Path**: Yes — Core composition logic

## Phase Overview

### Mission

Implement 9 Claude Code workflow skills that transform SDS into validated, render-ready artifacts:
1. **PLAN**: Expand SDS into work targets
2. **STYLE**: Generate style spec with tag conflict resolution
3. **LYRICS**: Generate lyrics with MCP retrieval and citations
4. **PRODUCER**: Create producer notes aligned to blueprint
5. **COMPOSE**: Assemble final prompt under engine limits
6. **VALIDATE**: Score against rubric with hard-fail guards
7. **FIX**: Apply targeted repairs based on validation issues
8. **RENDER**: Submit to rendering engine (optional)
9. **REVIEW**: Finalize artifacts and emit completion events

### Goals

- Implement each skill as Claude Code artifact in `.claude/skills/amcs-{skill}/`
- Ensure deterministic execution (temperature ≤ 0.3, seeded)
- Implement MCP retrieval with hash-based pinning for LYRICS
- Build validation engine with rubric scoring and auto-fix playbook
- Achieve ≥95% validation pass rate on test suite

### Success Criteria

- [ ] All 9 skills pass determinism tests (≥99% reproduction)
- [ ] LYRICS skill includes citations with chunk hashes
- [ ] VALIDATE scores match blueprint rubric
- [ ] FIX loop converges within 3 iterations (≥90% of cases)
- [ ] COMPOSE respects engine character limits (100% compliance)
- [ ] Full workflow (PLAN → REVIEW) completes without manual intervention

---

## Work Package 1: PLAN Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 0.5 days
**PRD Reference**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md` (PLAN node)

### Overview

PLAN skill expands SDS into ordered work targets: section sequence, word count targets, evaluation priorities.

### Input/Output Contract

**Input**:
```json
{
  "sds": {
    "song_id": "uuid",
    "entities": {...},
    "constraints": {...},
    "seed": 42
  }
}
```

**Output**:
```json
{
  "sections": [
    {"name": "intro", "target_duration_s": 8, "target_words": 0, "priority": 1},
    {"name": "verse_1", "target_duration_s": 20, "target_words": 80, "priority": 2},
    {"name": "chorus", "target_duration_s": 20, "target_words": 60, "priority": 3},
    {"name": "verse_2", "target_duration_s": 20, "target_words": 80, "priority": 4},
    {"name": "chorus", "target_duration_s": 20, "target_words": 60, "priority": 5},
    {"name": "bridge", "target_duration_s": 16, "target_words": 50, "priority": 6},
    {"name": "chorus", "target_duration_s": 20, "target_words": 60, "priority": 7},
    {"name": "outro", "target_duration_s": 8, "target_words": 20, "priority": 8}
  ],
  "total_duration_s": 132,
  "evaluation_targets": {
    "hook_density": 0.85,
    "singability": 0.80,
    "rhyme_tightness": 0.75
  },
  "seed": 42
}
```

### Implementation

**File**: `.claude/skills/amcs-plan/SKILL.md`

```yaml
---
name: amcs-plan
description: Use when expanding Song Design Spec into ordered work targets (section sequence, durations, word counts, evaluation priorities). Applies blueprint constraints and structure rules. Deterministic output given seed.
---

# AMCS Plan Generator

## Purpose

Expand Song Design Spec (SDS) into a detailed plan with:
- Section sequence (intro, verse, chorus, bridge, outro)
- Target durations per section
- Target word counts for lyrical sections
- Evaluation priorities and scoring targets

## Inputs

- **sds**: Song Design Spec with entities, constraints, seed

## Outputs

- **sections**: Ordered list of sections with targets
- **total_duration_s**: Total song duration
- **evaluation_targets**: Rubric score targets
- **seed**: Propagated seed

## Algorithm

1. Load blueprint constraints (genre-specific structure)
2. Determine section sequence based on blueprint + SDS style
3. Allocate durations to meet max_duration_s constraint
4. Calculate word count targets (4 words per second for verses)
5. Set evaluation targets from blueprint rubric thresholds
6. Return deterministic plan (no randomness)

## Example

Input SDS with genre="pop", max_duration_s=180

Output:
- Sections: intro (8s) → verse (20s) → chorus (20s) → verse (20s) → chorus (20s) → bridge (16s) → chorus (20s) → outro (8s)
- Total: 132s (within 180s limit)
- Word targets: verse=80, chorus=60, bridge=50

## Determinism

- No LLM calls (pure algorithmic logic)
- Section sequence deterministic per blueprint
- Duration allocation uses integer division (no randomness)
```

**File**: `.claude/skills/amcs-plan/scripts/plan.js`

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';

async function generatePlan(sds) {
  // Load blueprint for genre
  const blueprint = await loadBlueprint(sds.entities.blueprint);

  // Determine section sequence
  const sectionSequence = blueprint.default_structure; // e.g., ["intro", "verse", "chorus", "verse", "chorus", "bridge", "chorus", "outro"]

  // Allocate durations
  const maxDuration = sds.constraints.max_duration_s || 180;
  const sections = allocateDurations(sectionSequence, maxDuration);

  // Calculate word count targets
  sections.forEach(sec => {
    if (["verse", "chorus", "bridge"].includes(sec.name)) {
      sec.target_words = Math.floor(sec.target_duration_s * 4); // 4 words/sec
    } else {
      sec.target_words = 0; // Instrumental sections
    }
  });

  // Set evaluation targets from blueprint
  const evaluationTargets = blueprint.rubric_thresholds;

  return {
    sections,
    total_duration_s: sections.reduce((sum, s) => sum + s.target_duration_s, 0),
    evaluation_targets: evaluationTargets,
    seed: sds.seed
  };
}

function allocateDurations(sequence, maxDuration) {
  // Default durations per section type
  const defaults = {
    intro: 8,
    verse: 20,
    chorus: 20,
    bridge: 16,
    outro: 8
  };

  let sections = sequence.map((name, i) => ({
    name,
    target_duration_s: defaults[name] || 16,
    priority: i + 1
  }));

  // Scale if over max duration
  const total = sections.reduce((sum, s) => sum + s.target_duration_s, 0);
  if (total > maxDuration) {
    const scale = maxDuration / total;
    sections.forEach(s => {
      s.target_duration_s = Math.floor(s.target_duration_s * scale);
    });
  }

  return sections;
}

// CLI entry point
const sds = JSON.parse(await readFile(process.argv[2], 'utf-8'));
const plan = await generatePlan(sds);
console.log(JSON.stringify(plan, null, 2));
```

---

## Work Package 2: STYLE Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 1 day
**PRD Reference**: `docs/project_plans/PRDs/style.prd.md`, `blueprint.prd.md`

### Overview

Generate detailed style specification from SDS style entity, applying:
- Blueprint tempo windows
- Tag conflict resolution
- Tag limit enforcement (8-12 tags)
- Living artist normalization (if release_mode=public)

### Input/Output Contract

**Input**:
```json
{
  "sds": {...},
  "plan": {...}
}
```

**Output**:
```json
{
  "primary_genre": "pop",
  "sub_genres": ["synth-pop"],
  "bpm": 120,
  "key": "C Major",
  "mood": ["upbeat", "energetic"],
  "instrumentation": ["synth", "drums", "bass"],
  "vocal_style": ["smooth", "melodic"],
  "tags": ["upbeat", "energetic", "synth", "drums", "bass", "smooth", "melodic", "pop", "synth-pop"],
  "negative_tags": ["slow", "acoustic"],
  "conflicts_resolved": [
    {"dropped": "acoustic", "reason": "conflicts with heavy synth"}
  ],
  "seed": 43
}
```

### Implementation

**File**: `.claude/skills/amcs-style/SKILL.md`

```yaml
---
name: amcs-style
description: Use when generating style specification from SDS style entity. Applies blueprint tempo windows, resolves tag conflicts using conflict matrix, enforces tag limits (8-12), normalizes living artists. Deterministic with seed.
---

# AMCS Style Generator

## Purpose

Generate detailed, conflict-free style specification honoring:
- Blueprint tempo windows per genre
- Tag conflict matrix (drop lower-weight tags)
- Tag count limits (8-12 for optimal rendering)
- Living artist normalization for public release

## Inputs

- **sds**: Song Design Spec
- **plan**: Plan artifact with evaluation targets

## Outputs

- **Style spec**: Genre, BPM, key, mood, instrumentation, tags
- **conflicts_resolved**: List of dropped tags with reasons
- **seed**: Node seed

## Algorithm

1. Load SDS style entity
2. Load blueprint for genre (tempo windows, allowed tags)
3. Extract all tags with weights (genre=1.0, mood=0.8, instrumentation=0.7, etc.)
4. Order tags by weight (descending)
5. Resolve conflicts: for each tag, check conflict matrix; drop lower-weight conflicting tags
6. Limit to 8-12 tags (drop lowest weight if over limit)
7. Normalize living artists if release_mode=public
8. Return style spec

## Conflict Resolution Example

Input tags:
- "whisper" (weight: 0.7)
- "anthemic" (weight: 0.9)

Conflict matrix: "whisper" conflicts with "anthemic"

Resolution: Drop "whisper" (lower weight)

## Determinism

- Tag ordering: weight desc, then lexicographic
- Conflict resolution: deterministic (always drop lower weight)
- Temperature: Not applicable (no LLM generation)
```

**File**: `.claude/skills/amcs-style/scripts/style.js`

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';

async function generateStyle(sds, plan) {
  // Load entities
  const styleEntity = await loadEntity('styles', sds.entities.style);
  const blueprint = await loadBlueprint(sds.entities.blueprint);
  const conflictMatrix = await loadConflictMatrix();

  // Extract tags with weights
  let tags = extractTags(styleEntity);

  // Order by weight (desc), then lexicographic
  tags.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.tag.localeCompare(b.tag);
  });

  // Resolve conflicts
  const { resolvedTags, conflicts } = resolveConflicts(tags, conflictMatrix);

  // Limit to 8-12 tags
  const finalTags = resolvedTags.slice(0, 12);

  // Normalize living artists if public release
  const normalizedTags = sds.constraints.release_mode === 'public'
    ? normalizeLivingArtists(finalTags)
    : finalTags;

  return {
    primary_genre: styleEntity.primary_genre,
    sub_genres: styleEntity.sub_genres || [],
    bpm: styleEntity.bpm,
    key: styleEntity.key,
    mood: styleEntity.mood || [],
    instrumentation: styleEntity.instrumentation || [],
    vocal_style: styleEntity.vocal_style || [],
    tags: normalizedTags.map(t => t.tag),
    negative_tags: styleEntity.negative_tags || [],
    conflicts_resolved: conflicts,
    seed: sds.seed + 1  // Node index 1
  };
}

function extractTags(styleEntity) {
  const tags = [];

  // Primary genre (weight 1.0)
  tags.push({ tag: styleEntity.primary_genre, weight: 1.0, category: 'genre' });

  // Sub-genres (weight 0.6)
  (styleEntity.sub_genres || []).forEach(sg => {
    tags.push({ tag: sg, weight: 0.6, category: 'genre' });
  });

  // Mood (weight 0.8)
  (styleEntity.mood || []).forEach(m => {
    tags.push({ tag: m, weight: 0.8, category: 'mood' });
  });

  // Instrumentation (weight 0.7)
  (styleEntity.instrumentation || []).forEach(inst => {
    tags.push({ tag: inst, weight: 0.7, category: 'instrumentation' });
  });

  // Vocal style (weight 0.8)
  (styleEntity.vocal_style || []).forEach(vs => {
    tags.push({ tag: vs, weight: 0.8, category: 'vocal' });
  });

  // Custom tags
  (styleEntity.custom_tags || []).forEach(ct => {
    tags.push({ tag: ct.tag, weight: ct.weight || 0.5, category: 'custom' });
  });

  return tags;
}

function resolveConflicts(tags, conflictMatrix) {
  const kept = [];
  const keptSet = new Set();
  const conflicts = [];

  for (const tag of tags) {
    // Check if this tag conflicts with any kept tag
    const conflictsWith = conflictMatrix[tag.tag] || [];
    const hasConflict = conflictsWith.some(c => keptSet.has(c));

    if (hasConflict) {
      // Drop this tag (lower weight)
      conflicts.push({
        dropped: tag.tag,
        reason: `conflicts with ${conflictsWith.filter(c => keptSet.has(c)).join(', ')}`
      });
      continue;
    }

    // Keep this tag
    kept.push(tag);
    keptSet.add(tag.tag);
  }

  return { resolvedTags: kept, conflicts };
}

// CLI entry point
const sds = JSON.parse(await readFile(process.argv[2], 'utf-8'));
const plan = JSON.parse(await readFile(process.argv[3], 'utf-8'));
const style = await generateStyle(sds, plan);
console.log(JSON.stringify(style, null, 2));
```

**Supporting File**: `.claude/skills/amcs-style/supporting/conflict-matrix.md`

Reference to `taxonomies/conflicts.json` with common conflicts:
- whisper ↔ anthemic
- upbeat ↔ melancholic
- acoustic ↔ heavy synth
- fast tempo ↔ slow tempo

---

## Work Package 3: LYRICS Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 1.5 days
**PRD Reference**: `docs/project_plans/PRDs/lyrics.prd.md`, `sources.prd.md`

### Overview

Generate lyrics with:
- Section structure from plan
- Rhyme scheme and meter from SDS lyrics entity
- MCP retrieval from sources (pinned by chunk hash)
- Citation tracking for all source chunks
- Profanity filtering per constraints.explicit

### Input/Output Contract

**Input**:
```json
{
  "sds": {...},
  "plan": {...},
  "style": {...}
}
```

**Output**:
```json
{
  "sections": [
    {
      "name": "verse_1",
      "lines": [
        "Walking down the avenue",
        "Thinking thoughts of only you",
        "Every step a memory",
        "Of what we used to be"
      ],
      "rhyme_scheme": "AABB",
      "syllables_per_line": [7, 7, 7, 7]
    }
  ],
  "citations": [
    {
      "chunk_hash": "abc123...",
      "source_id": "uuid",
      "text": "Original source text...",
      "relevance": 0.85
    }
  ],
  "metrics": {
    "rhyme_tightness": 0.82,
    "singability": 0.79,
    "hook_density": 0.88
  },
  "seed": 44
}
```

### Implementation

**File**: `.claude/skills/amcs-lyrics/SKILL.md`

```yaml
---
name: amcs-lyrics
description: Use when generating song lyrics with section structure, rhyme schemes, meter, and source citations. Retrieves relevant chunks from MCP sources (pinned by hash), enforces profanity filter, applies blueprint lyrical rules. Deterministic with low-temperature LLM (≤0.3).
---

# AMCS Lyrics Generator

## Purpose

Generate lyrics that:
- Match section structure from plan
- Follow rhyme scheme and meter from SDS
- Incorporate source material (family stories, themes) with citations
- Pass profanity filter per constraints
- Meet singability and hook density targets

## Inputs

- **sds**: Song Design Spec
- **plan**: Plan with section targets
- **style**: Style spec with mood, genre

## Outputs

- **sections**: List of lyrical sections with lines, rhyme scheme, syllable counts
- **citations**: Source chunks used with hashes
- **metrics**: Preliminary scores (rhyme_tightness, singability, hook_density)
- **seed**: Node seed

## MCP Retrieval Strategy

1. Load source entities from SDS
2. For each source with weight > 0, retrieve top-k chunks:
   - Query: section theme + mood + genre
   - k = 5 per source
   - Sort results by relevance score, then by chunk_hash (lexicographic tie-break)
3. Store citations: {chunk_hash, source_id, text, relevance}
4. Use citations as context for lyric generation

## Profanity Filter

- If `constraints.explicit = false`, reject outputs with profanity
- Use profanity detection library (e.g., `bad-words`)
- Retry generation with stronger constraint if profanity detected (max 3 attempts)

## Rhyme Scheme Enforcement

- Use rhyme dictionary (e.g., CMU Pronouncing Dictionary)
- Validate rhyme scheme matches SDS lyrics.rhyme_scheme
- Adjust lines to fit scheme if mismatch

## Determinism

- LLM temperature: 0.2 (low variance)
- Seed: sds.seed + 2 (node index)
- Retrieval: deterministic sort by relevance + hash
- Output: JSON-serializable with sorted keys

## Example

Input:
- Section: verse_1, target_words: 80, rhyme_scheme: ABAB
- Sources: family story about grandmother

Output:
```
Verse 1:
Grandma told me tales of old (A)
Of summers spent by the sea (B)
Her wisdom like a thread of gold (A)
A legacy she gave to me (B)
```

Citations:
- chunk_hash: abc123, text: "grandmother's stories of summer vacations"
```

**File**: `.claude/skills/amcs-lyrics/scripts/lyrics.js`

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function generateLyrics(sds, plan, style) {
  const seed = sds.seed + 2; // Node index 2

  // 1. Retrieve source chunks (MCP)
  const citations = await retrieveSourceChunks(sds, style, seed);

  // 2. Generate lyrics for each section
  const sections = [];
  for (const planSection of plan.sections) {
    if (!['verse', 'chorus', 'bridge'].includes(planSection.name.split('_')[0])) {
      continue; // Skip instrumental sections
    }

    const section = await generateSection(
      planSection,
      sds,
      style,
      citations,
      seed
    );
    sections.push(section);
  }

  // 3. Apply profanity filter
  if (!sds.constraints.explicit) {
    await filterProfanity(sections);
  }

  // 4. Compute metrics
  const metrics = computeLyricsMetrics(sections);

  return {
    sections,
    citations,
    metrics,
    seed
  };
}

async function retrieveSourceChunks(sds, style, seed) {
  const citations = [];

  // Load source entities
  const sources = await loadEntities('sources', sds.entities.sources.map(s => s.id));

  for (const sourceConfig of sds.entities.sources) {
    const source = sources.find(s => s.id === sourceConfig.id);
    if (!source || sourceConfig.weight === 0) continue;

    // Build retrieval query
    const query = `${style.mood.join(' ')} ${style.primary_genre} song themes`;

    // Retrieve chunks (MCP call to vector DB)
    const chunks = await retrieveChunks(source, query, 5);

    // Sort deterministically: relevance desc, then chunk_hash asc
    chunks.sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return a.chunk_hash.localeCompare(b.chunk_hash);
    });

    // Add to citations
    chunks.forEach(chunk => {
      citations.push({
        chunk_hash: chunk.chunk_hash,
        source_id: source.id,
        text: chunk.text,
        relevance: chunk.relevance
      });
    });
  }

  return citations;
}

async function generateSection(planSection, sds, style, citations, seed) {
  const lyricsEntity = await loadEntity('lyrics', sds.entities.lyrics);

  // Build context from citations
  const context = citations.map(c => c.text).join('\n\n');

  // Build prompt
  const prompt = `Generate lyrics for a ${style.primary_genre} song section.

Section: ${planSection.name}
Target words: ${planSection.target_words}
Rhyme scheme: ${lyricsEntity.rhyme_scheme}
Mood: ${style.mood.join(', ')}
POV: ${lyricsEntity.pov}

Source context (use as inspiration):
${context}

Requirements:
- Follow ${lyricsEntity.rhyme_scheme} rhyme scheme
- Approximately ${lyricsEntity.meter.syllables_per_line} syllables per line
- ${lyricsEntity.pov} point of view
- Include ${lyricsEntity.imagery.join(', ')} imagery
- Hook strategy: ${lyricsEntity.hook_strategy}

Output only the lyrics, one line per line.`;

  // Call LLM
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    temperature: 0.2,  // Low variance for determinism
    messages: [{
      role: 'user',
      content: prompt
    }],
    metadata: {
      user_id: `seed_${seed}`  // Seed-based user ID for determinism
    }
  });

  const lines = response.content[0].text.trim().split('\n');

  return {
    name: planSection.name,
    lines,
    rhyme_scheme: lyricsEntity.rhyme_scheme,
    syllables_per_line: lines.map(countSyllables)
  };
}

function computeLyricsMetrics(sections) {
  // Compute preliminary metrics (detailed scoring in VALIDATE)
  const totalLines = sections.reduce((sum, s) => sum + s.lines.length, 0);
  const hookLines = sections.filter(s => s.name.startsWith('chorus')).reduce((sum, s) => sum + s.lines.length, 0);

  return {
    rhyme_tightness: 0.8,  // Placeholder (detailed analysis in VALIDATE)
    singability: 0.75,
    hook_density: hookLines / totalLines
  };
}

// CLI entry point
const sds = JSON.parse(await readFile(process.argv[2], 'utf-8'));
const plan = JSON.parse(await readFile(process.argv[3], 'utf-8'));
const style = JSON.parse(await readFile(process.argv[4], 'utf-8'));
const lyrics = await generateLyrics(sds, plan, style);
console.log(JSON.stringify(lyrics, null, 2));
```

**Supporting File**: `.claude/skills/amcs-lyrics/supporting/rhyme-schemes.md`

Common rhyme schemes:
- AABB: Couplet
- ABAB: Alternating
- ABCB: Simple alternating
- AAAA: Monorhyme
- ABBA: Enclosed

---

## Work Package 4: PRODUCER Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 0.5 days
**PRD Reference**: `docs/project_plans/PRDs/producer_notes.prd.md`

### Overview

Generate production notes: arrangement, structure, mix targets, section-specific instructions.

### Input/Output Contract

**Input**:
```json
{
  "sds": {...},
  "plan": {...},
  "style": {...}
}
```

**Output**:
```json
{
  "arrangement": {
    "verse_1": {
      "energy": "medium",
      "instrumentation": ["bass", "drums", "synth pad"],
      "dynamics": "building"
    },
    "chorus": {
      "energy": "high",
      "instrumentation": ["bass", "drums", "synth lead", "vocal harmonies"],
      "dynamics": "peak"
    }
  },
  "mix_targets": {
    "vocal_loudness_lufs": -14,
    "master_peak_db": -1,
    "stereo_width": "wide"
  },
  "blueprint_ref": "pop_blueprint.md",
  "seed": 45
}
```

### Implementation

**File**: `.claude/skills/amcs-producer/SKILL.md`

```yaml
---
name: amcs-producer
description: Use when generating producer notes for arrangement, structure, mix targets. Applies blueprint production guidelines, section-specific energy/dynamics, instrumentation allocation. Low-temperature LLM generation (≤0.3) for determinism.
---

# AMCS Producer Notes Generator

## Purpose

Generate production notes aligned to:
- Blueprint arrangement guidelines
- Style instrumentation
- Section energy progression
- Mix targets (LUFS, dynamics, stereo width)

## Inputs

- **sds**: Song Design Spec
- **plan**: Plan with sections
- **style**: Style spec with instrumentation

## Outputs

- **arrangement**: Per-section energy, instrumentation, dynamics
- **mix_targets**: Vocal loudness, master peak, stereo width
- **blueprint_ref**: Reference to blueprint used
- **seed**: Node seed

## Algorithm

1. Load producer notes entity from SDS
2. Load blueprint production guidelines
3. For each section in plan:
   - Determine energy level (intro: low, verse: medium, chorus: high, bridge: varied, outro: low)
   - Allocate instrumentation from style (intro: minimal, chorus: full)
   - Set dynamics (building, peak, sustain, fade)
4. Set mix targets from blueprint defaults
5. Return producer notes

## Determinism

- LLM temperature: 0.2
- Seed: sds.seed + 3 (node index)
- Deterministic energy progression per blueprint
```

(Implementation similar to STYLE skill, using LLM to refine blueprint templates)

---

## Work Package 5: COMPOSE Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 1 day
**PRD Reference**: `docs/project_plans/PRDs/prompt.prd.md`

### Overview

Compose final render-ready prompt from STYLE, LYRICS, PRODUCER artifacts:
- Merge tags, lyrics, section metadata
- Enforce engine character limits (Suno v5: 3800 chars)
- Apply section tags ([Verse], [Chorus], etc.)
- Add metadata tags (BPM, key, energy)

### Input/Output Contract

**Input**:
```json
{
  "style": {...},
  "lyrics": {...},
  "producer": {...},
  "sds": {...}
}
```

**Output**:
```json
{
  "prompt": "upbeat, energetic, synth-pop, 120 BPM, C Major\n\n[Intro]\n[energy: low, synth pad]\n\n[Verse 1]\nWalking down the avenue...\n[energy: medium]\n\n[Chorus]\nI'm feeling alive tonight...\n[energy: high, vocal harmonies]\n\n...",
  "char_count": 2847,
  "within_limit": true,
  "tags_used": ["upbeat", "energetic", "synth-pop"],
  "sections": ["intro", "verse_1", "chorus", "verse_2", "chorus", "bridge", "chorus", "outro"],
  "seed": 46
}
```

### Implementation

**File**: `.claude/skills/amcs-compose/SKILL.md`

```yaml
---
name: amcs-compose
description: Use when composing final render-ready prompt from style, lyrics, producer artifacts. Merges tags and section metadata, enforces engine character limits (Suno v5: 3800 chars), applies section tags ([Verse], [Chorus]). Deterministic assembly.
---

# AMCS Prompt Composer

## Purpose

Assemble final prompt for rendering engine by:
- Merging style tags
- Inserting section tags ([Intro], [Verse], [Chorus], etc.)
- Adding section metadata (energy, instrumentation)
- Enforcing character limits with truncation strategy

## Inputs

- **style**: Style spec with tags
- **lyrics**: Lyrics with sections
- **producer**: Producer notes with arrangement
- **sds**: Song Design Spec

## Outputs

- **prompt**: Final render-ready text
- **char_count**: Character count
- **within_limit**: Boolean (true if ≤ engine limit)
- **tags_used**: Tags included in prompt
- **sections**: Section sequence
- **seed**: Node seed

## Algorithm

1. Load engine limits (e.g., Suno v5: 3800 chars)
2. Build style tags line: "upbeat, energetic, synth-pop, 120 BPM, C Major"
3. For each section in lyrics:
   - Add section tag: [Verse 1]
   - Add lyrics lines
   - Add metadata from producer: [energy: medium, drums, bass]
4. Check character count
5. If over limit, truncate:
   - Priority: keep chorus sections > verse > bridge > intro/outro
   - Drop lowest-weight style tags
   - Drop section metadata
6. Return composed prompt

## Truncation Strategy

If prompt exceeds limit:
1. Drop intro/outro sections (instrumental)
2. Drop section metadata tags
3. Drop lowest-weight style tags (keep top 5)
4. If still over, truncate lyrics (keep chorus intact)

## Determinism

- No LLM calls (pure string assembly)
- Deterministic tag ordering (from STYLE)
- Deterministic section sequence (from LYRICS)
```

**File**: `.claude/skills/amcs-compose/scripts/compose.js`

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';

async function composePrompt(style, lyrics, producer, sds) {
  const limits = await loadEngineLimits(sds.render?.engine || 'suno_v5');

  // Build style tags line
  const styleLine = buildStyleLine(style);

  // Build sections
  let sections = [];
  for (const section of lyrics.sections) {
    const sectionText = buildSection(section, producer);
    sections.push(sectionText);
  }

  // Assemble prompt
  let prompt = `${styleLine}\n\n${sections.join('\n\n')}`;

  // Check char limit
  const charCount = prompt.length;
  const withinLimit = charCount <= limits.max_prompt_chars;

  // Truncate if needed
  if (!withinLimit) {
    prompt = truncatePrompt(prompt, limits.max_prompt_chars, style, lyrics, producer);
  }

  return {
    prompt,
    char_count: prompt.length,
    within_limit: prompt.length <= limits.max_prompt_chars,
    tags_used: style.tags,
    sections: lyrics.sections.map(s => s.name),
    seed: sds.seed + 4
  };
}

function buildStyleLine(style) {
  return `${style.tags.join(', ')}, ${style.bpm} BPM, ${style.key}`;
}

function buildSection(section, producer) {
  const lines = [
    `[${capitalize(section.name)}]`
  ];

  // Add lyrics
  lines.push(section.lines.join('\n'));

  // Add metadata from producer
  const arrangement = producer.arrangement[section.name];
  if (arrangement) {
    const meta = [
      `energy: ${arrangement.energy}`,
      ...arrangement.instrumentation
    ].join(', ');
    lines.push(`[${meta}]`);
  }

  return lines.join('\n');
}

function truncatePrompt(prompt, limit, style, lyrics, producer) {
  // Strategy: drop intro/outro, then metadata, then lowest-weight tags
  // (Truncation logic here)
  return prompt.substring(0, limit);
}

// CLI entry point
const style = JSON.parse(await readFile(process.argv[2], 'utf-8'));
const lyrics = JSON.parse(await readFile(process.argv[3], 'utf-8'));
const producer = JSON.parse(await readFile(process.argv[4], 'utf-8'));
const sds = JSON.parse(await readFile(process.argv[5], 'utf-8'));
const composed = await composePrompt(style, lyrics, producer, sds);
console.log(JSON.stringify(composed, null, 2));
```

---

## Work Package 6: VALIDATE Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 1 day
**PRD Reference**: `docs/project_plans/PRDs/blueprint.prd.md`

### Overview

Score composed artifacts against blueprint rubric:
- **hook_density**: Chorus repetition ratio
- **singability**: Syllable variance, melodic flow
- **rhyme_tightness**: Rhyme accuracy per scheme
- **section_completeness**: All required sections present
- **profanity_score**: Explicit content detection

Hard-fail checks:
- Character limit exceeded
- Missing required sections
- Profanity (if explicit=false)
- Living artist in public release

### Input/Output Contract

**Input**:
```json
{
  "style": {...},
  "lyrics": {...},
  "producer": {...},
  "composed_prompt": {...},
  "sds": {...}
}
```

**Output**:
```json
{
  "scores": {
    "hook_density": 0.88,
    "singability": 0.79,
    "rhyme_tightness": 0.82,
    "section_completeness": 1.0,
    "profanity_score": 1.0,
    "total": 0.858
  },
  "threshold": 0.80,
  "pass": true,
  "issues": [],
  "hard_fails": [],
  "seed": 47
}
```

### Implementation

**File**: `.claude/skills/amcs-validate/SKILL.md`

```yaml
---
name: amcs-validate
description: Use when scoring composed artifacts against blueprint rubric (hook_density, singability, rhyme_tightness, section_completeness, profanity_score). Runs hard-fail checks (char limit, required sections, profanity filter, living artist). Deterministic scoring.
---

# AMCS Validation Engine

## Purpose

Validate composed artifacts against:
- Blueprint rubric thresholds
- Hard-fail policy guards
- Section completeness
- Character limits

## Inputs

- **style, lyrics, producer, composed_prompt, sds**

## Outputs

- **scores**: {hook_density, singability, rhyme_tightness, section_completeness, profanity_score, total}
- **threshold**: Minimum passing score from blueprint
- **pass**: Boolean (true if total ≥ threshold and no hard-fails)
- **issues**: Warnings (low scores)
- **hard_fails**: Critical failures (must fix)
- **seed**: Node seed

## Scoring Formulas

### hook_density
```
hook_lines = count(chorus lines)
total_lines = count(all lines)
hook_density = hook_lines / total_lines

Target: ≥ 0.25 (chorus is 25%+ of lyrics)
```

### singability
```
syllable_variance = std_dev(syllables per line)
singability = 1 / (1 + syllable_variance)

Target: ≥ 0.75 (low variance = easy to sing)
```

### rhyme_tightness
```
expected_rhymes = count(rhyme pairs per scheme)
actual_rhymes = count(perfect + near rhymes)
rhyme_tightness = actual_rhymes / expected_rhymes

Target: ≥ 0.70 (70% rhyme accuracy)
```

### section_completeness
```
required_sections = blueprint.required_sections
present_sections = lyrics.sections.map(s => s.name)
section_completeness = |required ∩ present| / |required|

Target: = 1.0 (all required sections present)
```

### profanity_score
```
profanity_count = count(profane words)
profanity_score = explicit ? 1.0 : (profanity_count === 0 ? 1.0 : 0.0)

Target: = 1.0 (no profanity if explicit=false)
```

### total
```
weights = blueprint.rubric_weights
total = Σ (score[metric] * weights[metric])

Target: ≥ threshold (default: 0.80)
```

## Hard-Fail Checks

1. **Character limit**: composed_prompt.char_count ≤ engine_limit
2. **Required sections**: All blueprint.required_sections present
3. **Profanity**: profanity_count === 0 if explicit=false
4. **Living artist**: No "in the style of <living artist>" if release_mode=public

## Determinism

- No randomness (pure computation)
- Rhyme detection: deterministic phoneme matching
```

**File**: `.claude/skills/amcs-validate/scripts/validate.js`

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';

async function validateArtifacts(style, lyrics, producer, composedPrompt, sds) {
  const blueprint = await loadBlueprint(sds.entities.blueprint);

  // Compute scores
  const hookDensity = computeHookDensity(lyrics);
  const singability = computeSingability(lyrics);
  const rhymeTightness = computeRhymeTightness(lyrics);
  const sectionCompleteness = computeSectionCompleteness(lyrics, blueprint);
  const profanityScore = computeProfanityScore(lyrics, sds.constraints.explicit);

  // Weighted total
  const weights = blueprint.rubric_weights || {
    hook_density: 0.25,
    singability: 0.20,
    rhyme_tightness: 0.25,
    section_completeness: 0.20,
    profanity_score: 0.10
  };

  const total =
    hookDensity * weights.hook_density +
    singability * weights.singability +
    rhymeTightness * weights.rhyme_tightness +
    sectionCompleteness * weights.section_completeness +
    profanityScore * weights.profanity_score;

  // Hard-fail checks
  const hardFails = [];
  const issues = [];

  // Char limit check
  const limits = await loadEngineLimits(sds.render?.engine || 'suno_v5');
  if (composedPrompt.char_count > limits.max_prompt_chars) {
    hardFails.push(`Prompt exceeds ${limits.max_prompt_chars} char limit (${composedPrompt.char_count})`);
  }

  // Section completeness check
  if (sectionCompleteness < 1.0) {
    hardFails.push(`Missing required sections: ${getMissingSections(lyrics, blueprint)}`);
  }

  // Profanity check
  if (profanityScore < 1.0 && !sds.constraints.explicit) {
    hardFails.push('Profanity detected with explicit=false');
  }

  // Living artist check (if public release)
  if (sds.constraints.release_mode === 'public') {
    const livingArtists = detectLivingArtists(style.tags);
    if (livingArtists.length > 0) {
      hardFails.push(`Living artist references: ${livingArtists.join(', ')}`);
    }
  }

  // Warnings (low scores)
  if (hookDensity < 0.25) issues.push('Low hook density');
  if (singability < 0.75) issues.push('Low singability (high syllable variance)');
  if (rhymeTightness < 0.70) issues.push('Weak rhyme scheme adherence');

  const threshold = blueprint.rubric_thresholds?.total || 0.80;
  const pass = total >= threshold && hardFails.length === 0;

  return {
    scores: {
      hook_density: hookDensity,
      singability: singability,
      rhyme_tightness: rhymeTightness,
      section_completeness: sectionCompleteness,
      profanity_score: profanityScore,
      total: total
    },
    threshold,
    pass,
    issues,
    hard_fails: hardFails,
    seed: sds.seed + 5
  };
}

function computeHookDensity(lyrics) {
  const totalLines = lyrics.sections.reduce((sum, s) => sum + s.lines.length, 0);
  const hookLines = lyrics.sections
    .filter(s => s.name.startsWith('chorus'))
    .reduce((sum, s) => sum + s.lines.length, 0);

  return totalLines > 0 ? hookLines / totalLines : 0;
}

function computeSingability(lyrics) {
  const syllableCounts = lyrics.sections.flatMap(s => s.syllables_per_line || []);
  if (syllableCounts.length === 0) return 0.75; // Default

  const mean = syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length;
  const variance = syllableCounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / syllableCounts.length;
  const stdDev = Math.sqrt(variance);

  return 1 / (1 + stdDev);
}

function computeRhymeTightness(lyrics) {
  // Use rhyme detection library (e.g., CMU dict)
  // For now, return placeholder
  return 0.80;
}

function computeSectionCompleteness(lyrics, blueprint) {
  const required = new Set(blueprint.required_sections || ['verse', 'chorus']);
  const present = new Set(lyrics.sections.map(s => s.name.split('_')[0]));

  const intersection = [...required].filter(r => present.has(r));
  return required.size > 0 ? intersection.length / required.size : 1.0;
}

function computeProfanityScore(lyrics, explicit) {
  if (explicit) return 1.0;

  // Use profanity detection (e.g., bad-words library)
  const allText = lyrics.sections.flatMap(s => s.lines).join(' ');
  const hasProfanity = false; // Placeholder

  return hasProfanity ? 0.0 : 1.0;
}

// CLI entry point
const style = JSON.parse(await readFile(process.argv[2], 'utf-8'));
const lyrics = JSON.parse(await readFile(process.argv[3], 'utf-8'));
const producer = JSON.parse(await readFile(process.argv[4], 'utf-8'));
const composed = JSON.parse(await readFile(process.argv[5], 'utf-8'));
const sds = JSON.parse(await readFile(process.argv[6], 'utf-8'));
const validation = await validateArtifacts(style, lyrics, producer, composed, sds);
console.log(JSON.stringify(validation, null, 2));
```

---

## Work Package 7: FIX Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 1 day
**PRD Reference**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`

### Overview

Apply targeted fixes based on validation issues:
- **Low hook density** → duplicate chorus hooks
- **Weak rhyme** → adjust rhyme scheme or syllable counts
- **Tag conflicts** → drop lowest-weight conflicting tag
- **Profanity** → regenerate flagged sections

Max 3 fix iterations. After fix, loop back to COMPOSE → VALIDATE.

### Input/Output Contract

**Input**:
```json
{
  "validation": {...},
  "style": {...},
  "lyrics": {...},
  "producer": {...},
  "sds": {...}
}
```

**Output**:
```json
{
  "patched_style": {...},
  "patched_lyrics": {...},
  "patched_producer": {...},
  "fixes_applied": [
    {"issue": "low hook density", "action": "duplicated chorus line 2"}
  ],
  "seed": 48
}
```

### Implementation

**File**: `.claude/skills/amcs-fix/SKILL.md`

```yaml
---
name: amcs-fix
description: Use when applying targeted fixes based on validation issues. Handles low hook density (duplicate hooks), weak rhyme (adjust scheme), tag conflicts (drop tags), profanity (regenerate). Max 3 iterations. Low-temperature LLM (≤0.3).
---

# AMCS Fix Engine

## Purpose

Apply auto-fix playbook to resolve validation issues:
- Low hook density → add chorus repetition
- Weak singability → even out syllable counts
- Poor rhyme tightness → adjust rhyme scheme
- Tag conflicts → drop lowest-weight tag
- Profanity → regenerate section

## Inputs

- **validation**: Validation report with issues
- **style, lyrics, producer, sds**

## Outputs

- **patched_style, patched_lyrics, patched_producer**
- **fixes_applied**: List of fixes
- **seed**: Node seed

## Fix Playbook

### Low Hook Density
If `hook_density < 0.25`:
- Action: Duplicate strongest hook line in chorus
- Expected improvement: +0.05 to +0.10

### Low Singability
If `singability < 0.75`:
- Action: Adjust syllable counts to match median
- Expected improvement: +0.10

### Weak Rhyme Tightness
If `rhyme_tightness < 0.70`:
- Action: Adjust line endings to match rhyme scheme
- Expected improvement: +0.15

### Tag Conflicts
If conflicts detected:
- Action: Drop lowest-weight conflicting tag
- Expected improvement: Pass hard-fail check

### Profanity
If profanity detected:
- Action: Regenerate section with stronger filter
- Expected improvement: profanity_score = 1.0

## Determinism

- LLM temperature: 0.2
- Seed: sds.seed + 6 + retry_count
- Deterministic fix selection (lowest-scoring metric first)
```

**File**: `.claude/skills/amcs-fix/scripts/fix.js`

```javascript
#!/usr/bin/env node
import { readFile } from 'fs/promises';

async function applyFixes(validation, style, lyrics, producer, sds) {
  const fixesApplied = [];
  let patchedStyle = { ...style };
  let patchedLyrics = { ...lyrics };
  let patchedProducer = { ...producer };

  // Prioritize fixes by lowest score
  const scores = validation.scores;
  const sortedMetrics = Object.entries(scores)
    .filter(([k, v]) => k !== 'total')
    .sort((a, b) => a[1] - b[1]); // Ascending (lowest first)

  for (const [metric, score] of sortedMetrics) {
    if (metric === 'hook_density' && score < 0.25) {
      patchedLyrics = fixHookDensity(patchedLyrics);
      fixesApplied.push({ issue: 'low hook density', action: 'duplicated chorus hook' });
      break; // One fix per iteration
    }

    if (metric === 'singability' && score < 0.75) {
      patchedLyrics = fixSingability(patchedLyrics);
      fixesApplied.push({ issue: 'low singability', action: 'adjusted syllable counts' });
      break;
    }

    if (metric === 'rhyme_tightness' && score < 0.70) {
      patchedLyrics = await fixRhymeTightness(patchedLyrics, sds);
      fixesApplied.push({ issue: 'weak rhyme tightness', action: 'adjusted line endings' });
      break;
    }

    if (metric === 'profanity_score' && score < 1.0) {
      patchedLyrics = await fixProfanity(patchedLyrics, sds);
      fixesApplied.push({ issue: 'profanity detected', action: 'regenerated section' });
      break;
    }
  }

  // Handle hard-fails
  if (validation.hard_fails.length > 0) {
    const firstFail = validation.hard_fails[0];

    if (firstFail.includes('Living artist')) {
      patchedStyle = fixLivingArtist(patchedStyle);
      fixesApplied.push({ issue: 'living artist reference', action: 'normalized to influence' });
    }
  }

  return {
    patched_style: patchedStyle,
    patched_lyrics: patchedLyrics,
    patched_producer: patchedProducer,
    fixes_applied: fixesApplied,
    seed: sds.seed + 6
  };
}

function fixHookDensity(lyrics) {
  // Find chorus section
  const chorusIdx = lyrics.sections.findIndex(s => s.name.startsWith('chorus'));
  if (chorusIdx === -1) return lyrics;

  const chorus = lyrics.sections[chorusIdx];

  // Duplicate strongest hook line (first line typically)
  const hookLine = chorus.lines[0];
  chorus.lines.push(hookLine);

  return lyrics;
}

function fixSingability(lyrics) {
  // Adjust syllable counts to match median
  const allSyllables = lyrics.sections.flatMap(s => s.syllables_per_line || []);
  const median = allSyllables.sort((a, b) => a - b)[Math.floor(allSyllables.length / 2)];

  // (Adjust lines to match median - simplified)
  return lyrics;
}

async function fixRhymeTightness(lyrics, sds) {
  // Use LLM to adjust rhymes (low temperature)
  // (LLM call here)
  return lyrics;
}

async function fixProfanity(lyrics, sds) {
  // Regenerate section with stronger profanity filter
  // (LLM call here)
  return lyrics;
}

function fixLivingArtist(style) {
  // Normalize living artist tags
  const artistNormalizer = new ArtistNormalizer();
  style.tags = artistNormalizer.normalize(style.tags);
  return style;
}

// CLI entry point
const validation = JSON.parse(await readFile(process.argv[2], 'utf-8'));
const style = JSON.parse(await readFile(process.argv[3], 'utf-8'));
const lyrics = JSON.parse(await readFile(process.argv[4], 'utf-8'));
const producer = JSON.parse(await readFile(process.argv[5], 'utf-8'));
const sds = JSON.parse(await readFile(process.argv[6], 'utf-8'));
const fixed = await applyFixes(validation, style, lyrics, producer, sds);
console.log(JSON.stringify(fixed, null, 2));
```

---

## Work Package 8: RENDER Skill (Optional)

**Agent**: `ai-artifacts-engineer`
**Duration**: 0.5 days
**PRD Reference**: `docs/project_plans/PRDs/render_job.prd.md`

### Overview

Submit composed prompt to rendering engine (Suno, future engines). Feature-flagged.

### Input/Output Contract

**Input**:
```json
{
  "composed_prompt": {...},
  "sds": {...}
}
```

**Output**:
```json
{
  "job_id": "suno_abc123",
  "engine": "suno_v5",
  "status": "queued",
  "submitted_at": "2025-11-11T13:00:00Z",
  "seed": 49
}
```

### Implementation

**File**: `.claude/skills/amcs-render/SKILL.md`

```yaml
---
name: amcs-render
description: Use when submitting composed prompt to rendering engine (Suno, future engines). Feature-flagged. Non-deterministic (external API). Returns job ID for polling.
---

# AMCS Render Submitter

## Purpose

Submit composed prompt to rendering engine:
- Suno v5 (if render.suno.enabled=true)
- Future engines (pluggable connectors)

## Inputs

- **composed_prompt**: Final prompt
- **sds**: Song Design Spec

## Outputs

- **job_id**: Engine job identifier
- **engine**: Engine name
- **status**: queued
- **submitted_at**: Timestamp
- **seed**: Node seed

## Feature Flag

Only execute if `flags.render = true` in run manifest.

## Determinism

Non-deterministic (external API). Results are recorded for replay.
```

(Implementation delegates to rendering connector from Phase 5)

---

## Work Package 9: REVIEW Skill

**Agent**: `ai-artifacts-engineer`
**Duration**: 0.5 days
**PRD Reference**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`

### Overview

Final step: collect all artifacts, scores, citations; emit completion events.

### Input/Output Contract

**Input**:
```json
{
  "plan": {...},
  "style": {...},
  "lyrics": {...},
  "producer": {...},
  "composed_prompt": {...},
  "validation": {...},
  "render": {...} (optional),
  "sds": {...}
}
```

**Output**:
```json
{
  "summary": {
    "song_id": "uuid",
    "run_id": "uuid",
    "status": "completed",
    "artifacts": {
      "plan": {...},
      "style": {...},
      "lyrics": {...},
      "producer": {...},
      "composed_prompt": {...}
    },
    "scores": {
      "total": 0.858,
      "hook_density": 0.88,
      ...
    },
    "citations": [...],
    "render_job_id": "suno_abc123",
    "completed_at": "2025-11-11T13:05:00Z"
  },
  "seed": 50
}
```

### Implementation

**File**: `.claude/skills/amcs-review/SKILL.md`

```yaml
---
name: amcs-review
description: Use when finalizing workflow run. Collects all artifacts, scores, citations, render job ID. Emits run.end event. Stores summary in database and S3. Deterministic assembly.
---

# AMCS Review Finalizer

## Purpose

Finalize workflow run:
- Collect all artifacts
- Aggregate scores
- Store citations
- Emit completion event
- Generate summary JSON

## Inputs

- **All previous artifacts** (plan, style, lyrics, producer, composed_prompt, validation, render)
- **sds**

## Outputs

- **summary**: Complete run summary with artifacts, scores, citations
- **seed**: Node seed

## Algorithm

1. Collect all artifacts
2. Aggregate final scores from validation
3. Collect citations from lyrics
4. Store render job ID (if render executed)
5. Compute run duration
6. Emit run.end event
7. Store summary in S3: `runs/{song_id}/{run_id}/summary.json`
8. Return summary

## Determinism

No randomness (pure aggregation).
```

(Implementation similar to state manager finalization)

---

## Integration Points

### Skills → Phase 3a Orchestrator

```python
# In NodeExecutor
output = await self.execute_skill(
    skill_name="amcs.lyrics.generate",
    inputs={"sds": sds, "plan": plan, "style": style},
    seed=node_seed
)
```

### Skills → Phase 2 (Prompt Composition)

```python
# COMPOSE skill uses Phase 2 composition service
prompt = await prompt_composer.compose_prompt(
    sds=sds,
    style=style,
    lyrics=lyrics,
    producer=producer_notes
)
```

### Skills → Phase 1 (Entity Services)

```python
# LYRICS skill loads source entities
sources = await sources_service.get_many([s.id for s in sds.entities.sources])
```

---

## Testing Strategy

### Determinism Tests

```python
@pytest.mark.asyncio
async def test_lyrics_determinism():
    """Test LYRICS skill produces identical output across 10 runs."""
    inputs = {...}
    seed = 42

    results = []
    for _ in range(10):
        output = await lyrics_skill.generate(inputs, seed)
        results.append(output)

    # All outputs should be identical (byte-level)
    first = json.dumps(results[0], sort_keys=True)
    for r in results[1:]:
        assert json.dumps(r, sort_keys=True) == first
```

### Rubric Compliance Tests

```python
@pytest.mark.asyncio
async def test_validation_pass_rate():
    """Test validation achieves ≥95% pass rate on 200-song test set."""
    test_suite = load_test_suite(200)

    passes = 0
    for sds in test_suite:
        artifacts = await run_workflow(sds)
        validation = await validate_skill.evaluate(artifacts, sds)
        if validation["pass"]:
            passes += 1

    pass_rate = passes / len(test_suite)
    assert pass_rate >= 0.95, f"Pass rate {pass_rate} below 95%"
```

### Fix Loop Convergence Tests

```python
@pytest.mark.asyncio
async def test_fix_loop_convergence():
    """Test FIX loop converges within 3 iterations on 90% of cases."""
    test_suite = load_test_suite(100)

    converged = 0
    for sds in test_suite:
        for iteration in range(3):
            artifacts = await run_workflow(sds)
            validation = await validate_skill.evaluate(artifacts, sds)

            if validation["pass"]:
                converged += 1
                break

            # Apply fix
            fixed = await fix_skill.apply(validation, artifacts, sds)
            artifacts = await compose_skill.compose(fixed, sds)

    convergence_rate = converged / len(test_suite)
    assert convergence_rate >= 0.90, f"Convergence rate {convergence_rate} below 90%"
```

---

## Performance Targets

- [ ] **PLAN**: <1s (algorithmic, no LLM)
- [ ] **STYLE**: <2s (template-based with LLM refinement)
- [ ] **LYRICS**: <20s (MCP retrieval + LLM generation)
- [ ] **PRODUCER**: <5s (template-based with LLM refinement)
- [ ] **COMPOSE**: <1s (string assembly)
- [ ] **VALIDATE**: <2s (scoring computations)
- [ ] **FIX**: <10s (targeted LLM regeneration)
- [ ] **REVIEW**: <1s (aggregation)
- [ ] **Total** (PLAN → COMPOSE): P95 ≤ 60s

---

## Deliverables

- [ ] `.claude/skills/amcs-plan/SKILL.md` + `scripts/plan.js`
- [ ] `.claude/skills/amcs-style/SKILL.md` + `scripts/style.js`
- [ ] `.claude/skills/amcs-lyrics/SKILL.md` + `scripts/lyrics.js`
- [ ] `.claude/skills/amcs-producer/SKILL.md` + `scripts/producer.js`
- [ ] `.claude/skills/amcs-compose/SKILL.md` + `scripts/compose.js`
- [ ] `.claude/skills/amcs-validate/SKILL.md` + `scripts/validate.js`
- [ ] `.claude/skills/amcs-fix/SKILL.md` + `scripts/fix.js`
- [ ] `.claude/skills/amcs-render/SKILL.md` + `scripts/render.js`
- [ ] `.claude/skills/amcs-review/SKILL.md` + `scripts/review.js`
- [ ] Test suite for each skill (>90% coverage)
- [ ] Integration tests for full workflow

---

## Exit Criteria

- [ ] All 9 skills pass determinism tests (≥99% reproduction)
- [ ] LYRICS skill citations include chunk hashes
- [ ] VALIDATE scores match blueprint rubric formulas
- [ ] FIX loop converges ≥90% within 3 iterations
- [ ] COMPOSE respects engine limits 100% of time
- [ ] Full workflow (PLAN → REVIEW) completes on 200-song test suite
- [ ] Ready for Phase 4 (frontend can trigger workflows)
- [ ] Ready for Phase 5 (rendering connector can consume composed prompts)
- [ ] Ready for Phase 6 (comprehensive testing)

---

## Summary

Phase 3b delivers the **compositional intelligence** of AMCS:
- **PLAN**: Deterministic structure planning
- **STYLE**: Conflict-free tag generation
- **LYRICS**: Source-grounded lyric creation with citations
- **PRODUCER**: Blueprint-aligned production notes
- **COMPOSE**: Engine-optimized prompt assembly
- **VALIDATE**: Rigorous rubric scoring
- **FIX**: Intelligent auto-repair
- **RENDER**: Engine submission (optional)
- **REVIEW**: Comprehensive finalization

Combined with Phase 3a orchestrator, this completes the **critical path** workflow engine ready for frontend integration (Phase 4) and rendering (Phase 5).
