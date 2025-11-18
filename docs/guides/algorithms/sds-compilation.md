# SDS Compilation & Validation Algorithms

**Audience:** Engineers implementing or maintaining SDS compilation, validation, and determinism verification
**Scope:** Complete technical specification of all algorithms for compiling Song Design Specs and validating consistency
**Last Updated:** 2025-11-14

---

## Overview

The SDS (Song Design Spec) compilation process transforms entity references (Style, Lyrics, ProducerNotes, Blueprint, Sources, Persona) into a unified, validated, deterministic JSON specification. This document describes all algorithms used in this process, from entity aggregation through validation to final hashing.

### Compilation Pipeline

```
Entity References
       ↓
   [FETCH] → Load all entities with eager loading
       ↓
[VALIDATE REF] → Verify all required entities exist
       ↓
 [TRANSFORM] → Convert ORM models to SDS structure
       ↓
[NORMALIZE] → Normalize source weights to sum to 1.0
       ↓
[VALIDATE SDS] → Validate SDS against JSON schema
       ↓
  [BLUEPRINT] → Validate against blueprint constraints
       ↓
[CROSS-ENTITY] → Validate consistency across entities
       ↓
    [HASH] → Compute deterministic SHA-256 hash
       ↓
  Compiled SDS
```

---

## 1. SDS Compilation Algorithm

### 1.1 Overview

The main compilation algorithm aggregates multiple entity specifications into a single Song Design Spec JSON that serves as the single source of truth for rendering and evaluation. The process ensures all required entities exist, transforms them to the correct format, normalizes data, and validates the result.

### 1.2 Algorithm: Compile SDS

**Input:**
- `song_id: UUID` — Song identifier
- `validate: bool = True` — Whether to run full validation

**Output:**
- `sds: Dict[str, Any]` — Complete, validated SDS dictionary

**Errors:**
- `ValueError` — If song not found, entity missing, or validation fails

### 1.3 Step-by-Step Flow

```
STEP 1: Fetch All Entities
  • Query Song with all relationships eager-loaded
  • Load: Style, Lyrics, ProducerNotes, Blueprint, Persona
  • Separate query for Sources (many-to-many)
  • Apply RLS (Row-Level Security) checks
  • Return: all entities or None if song inaccessible

STEP 2: Validate Entity References
  • Check Style exists → "Style specification is required"
  • Check Lyrics exists → "Lyrics are required"
  • Check ProducerNotes exists → "Producer notes are required"
  • Check Blueprint exists → "Blueprint is required"
  • Return: list of missing entities or empty list

STEP 3: Transform to SDS Structure
  • Song.title → sds.title
  • Blueprint.genre + version → sds.blueprint_ref
  • Style.spec → sds.style (already JSON)
  • Lyrics.spec → sds.lyrics (already JSON)
  • ProducerNotes.spec → sds.producer_notes (already JSON)
  • Persona.id → sds.persona_id (nullable)
  • Sources → sds.sources (list)
  • Song.render_config → sds.render + sds.prompt_controls
  • Song.global_seed → sds.seed

STEP 4: Normalize Source Weights
  • Call normalize_source_weights(sources)
  • Return: sources with weights summing to 1.0

STEP 5: Validate Against JSON Schema
  • IF validate == True:
    - Validate SDS against /schemas/sds.schema.json
    - Return: (is_valid, errors) tuple
    - IF not valid: raise ValueError with all errors

STEP 6: Compute Deterministic Hash
  • Call compute_sds_hash(sds)
  • Return: SHA-256 hexdigest

STEP 7: Return Compiled SDS
  • SDS now ready for rendering/evaluation
  • All fields populated and validated
  • Hash computed for reproducibility checks
```

### 1.4 Pseudocode: Main Compilation Logic

```python
async def compile_sds(song_id: UUID, validate: bool = True) -> Dict[str, Any]:
    # STEP 1: Fetch all entities
    entities = fetch_entities_with_eager_load(song_id)
    if not entities:
        raise ValueError(f"Song {song_id} not found or inaccessible")

    song = entities["song"]

    # STEP 2: Validate entity references exist
    required_entities = ["style", "lyrics", "producer_notes", "blueprint"]
    missing = [e for e in required_entities if not entities.get(e)]
    if missing:
        raise ValueError(f"Missing required entities: {', '.join(missing)}")

    # STEP 3: Transform to SDS structure
    sds = {
        "title": song.title,
        "blueprint_ref": {
            "genre": entities["blueprint"].genre,
            "version": entities["blueprint"].version
        },
        "style": entities["style"].spec,
        "lyrics": entities["lyrics"].spec,
        "producer_notes": entities["producer_notes"].spec,
        "persona_id": str(entities["persona"].id) if entities.get("persona") else None,
        "sources": [src.to_dict() for src in entities["sources"]],
        "prompt_controls": song.render_config.get("prompt_controls", {}),
        "render": song.render_config.get("render", {}),
        "seed": song.global_seed
    }

    # STEP 4: Normalize source weights
    if sds["sources"]:
        sds["sources"] = normalize_source_weights(sds["sources"])

    # STEP 5: Validate against JSON schema
    if validate:
        is_valid, errors = validate_sds_against_schema(sds)
        if not is_valid:
            raise ValueError(f"SDS validation failed: {'; '.join(errors)}")

    # STEP 6: Compute deterministic hash
    sds["_computed_hash"] = compute_sds_hash(sds)

    # STEP 7: Return compiled SDS
    log_event("sds.compiled", song_id=song_id, hash=sds["_computed_hash"])
    return sds
```

### 1.5 Decision Tree: Entity Mapping

```
Song entity available?
├─ YES: Proceed
│   ├─ Style exists?
│   │  ├─ YES: Use style.spec
│   │  └─ NO: Error "Style specification is required"
│   ├─ Lyrics exists?
│   │  ├─ YES: Use lyrics.spec
│   │  └─ NO: Error "Lyrics are required"
│   ├─ ProducerNotes exists?
│   │  ├─ YES: Use producer_notes.spec
│   │  └─ NO: Error "Producer notes are required"
│   ├─ Blueprint exists?
│   │  ├─ YES: Use blueprint.genre + version
│   │  └─ NO: Error "Blueprint is required"
│   ├─ Persona exists?
│   │  ├─ YES: Set persona_id
│   │  └─ NO: Set persona_id = null
│   └─ Sources exists?
│      ├─ YES: Include in sds.sources
│      └─ NO: sds.sources = []
└─ NO: Error "Song not found or inaccessible"
```

---

## 2. Source Weight Normalization Algorithm

### 2.1 Overview

Sources used for Retrieval-Augmented Generation (RAG) have associated weights indicating their importance/priority. These weights must be normalized so they sum to exactly 1.0, allowing consistent probability-based sampling during generation.

### 2.2 Formula

Given a set of sources with weights:

$$w_{original} = [w_1, w_2, \ldots, w_n]$$

**Normal Case:** If $\sum w_i > 0$:

$$w_{normalized\_i} = \frac{w_i}{\sum_{j=1}^{n} w_j}$$

**Edge Case:** If $\sum w_i \leq 0$ (all zero or negative):

$$w_{normalized\_i} = \frac{1}{n} \text{ for all } i$$

**Rounding:** Round all weights to 4 decimal places for precision.

### 2.3 Example Calculations

#### Example 1: Normal normalization

```
Input sources:
  Source A: weight = 2.0
  Source B: weight = 3.0
  Source C: weight = 5.0

Sum: 2.0 + 3.0 + 5.0 = 10.0

Normalized:
  Source A: 2.0 / 10.0 = 0.2000
  Source B: 3.0 / 10.0 = 0.3000
  Source C: 5.0 / 10.0 = 0.5000

Verification: 0.2 + 0.3 + 0.5 = 1.0 ✓
```

#### Example 2: All zero weights (edge case)

```
Input sources:
  Source A: weight = 0
  Source B: weight = 0
  Source C: weight = 0

Sum: 0 (fallback to equal weighting)

Normalized:
  Source A: 1 / 3 = 0.3333
  Source B: 1 / 3 = 0.3333
  Source C: 1 / 3 = 0.3333

Verification: 0.3333 + 0.3333 + 0.3334 = 1.0000 ✓
(Note: rounding to 4 decimals may cause ±0.0001 variance)
```

#### Example 3: Mixed weights with rounding

```
Input sources:
  Source A: weight = 1.5
  Source B: weight = 2.25
  Source C: weight = 3.75

Sum: 1.5 + 2.25 + 3.75 = 7.5

Normalized (before rounding):
  Source A: 1.5 / 7.5 = 0.20
  Source B: 2.25 / 7.5 = 0.30
  Source C: 3.75 / 7.5 = 0.50

Final (rounded to 4 decimals):
  Source A: 0.2000
  Source B: 0.3000
  Source C: 0.5000

Verification: 0.2 + 0.3 + 0.5 = 1.0 ✓
```

### 2.4 Pseudocode: Normalize Source Weights

```python
def normalize_source_weights(sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Normalize source weights to sum to 1.0.

    Args:
        sources: List of source dictionaries with 'weight' field

    Returns:
        List of sources with normalized weights summing to 1.0
    """
    if not sources:
        return []

    # Calculate total weight
    total_weight = sum(src.get("weight", 0.0) for src in sources)

    if total_weight <= 0:
        # Edge case: use equal weighting
        equal_weight = round(1.0 / len(sources), 4)
        for src in sources:
            src["weight"] = equal_weight
        log_event(
            "sds.weights.equal_distribution",
            source_count=len(sources),
            weight_per_source=equal_weight
        )
    else:
        # Normal case: normalize to sum to 1.0
        for src in sources:
            src["weight"] = round(src.get("weight", 0.0) / total_weight, 4)
        log_event(
            "sds.weights.normalized",
            source_count=len(sources),
            total_weight_before=total_weight,
            total_weight_after=sum(s["weight"] for s in sources)
        )

    return sources
```

### 2.5 Deterministic Properties

- **Reproducibility:** Same input weights → same normalized weights
- **Stability:** Weights always sum to 1.0 ± 0.0001 (4-decimal rounding)
- **Order-invariant:** Normalization doesn't depend on order of sources
- **Fair fallback:** Equal weighting when all weights are zero

---

## 3. Tag Conflict Resolution Algorithm

### 3.1 Overview

Style specifications contain tags (e.g., "acoustic", "energetic", "whisper") that describe musical characteristics. Some tags are mutually exclusive or contradictory (defined in a conflict matrix). The conflict resolution algorithm removes lower-priority tags to maintain consistency.

### 3.2 Conflict Matrix

The conflict matrix is a JSON file (`/taxonomies/conflict_matrix.json`) defining which tags conflict with each other:

```json
[
  {
    "tag_a": "whisper",
    "tag_b": "anthemic",
    "reason": "Whisper is intimate; anthemic is grand and loud"
  },
  {
    "tag_a": "minimalist",
    "tag_b": "orchestral",
    "reason": "Minimalist uses few instruments; orchestral uses many"
  },
  {
    "tag_a": "lo-fi",
    "tag_b": "hi-fidelity",
    "reason": "Lo-fi has deliberate artifacts; hi-fidelity prioritizes clarity"
  }
]
```

**Format:**
- Bidirectional: If (A, B) conflicts, then (B, A) also conflicts
- Self-conflict: A tag should never conflict with itself
- Reflexivity: All conflicts are symmetric

### 3.3 Algorithm: Greedy Conflict Resolution

**Input:**
- `tags: List[str]` — List of style tags (pre-sorted by weight descending)
- `weights: Dict[str, float]` — Weight for each tag (optional)

**Output:**
- `kept_tags: List[str]` — Conflict-free subset of tags

**Strategy:** Greedy algorithm that keeps higher-weight tags and drops conflicting lower-weight tags.

### 3.4 Step-by-Step Flow

```
STEP 1: Initialize kept tags (empty)
  kept_tags = []
  kept_set = {} (for O(1) lookup)

STEP 2: Iterate through tags (highest weight first)
  FOR each tag in tags (in order):

    STEP 3: Check for conflicts
      conflicts_with_kept = kept_set ∩ conflict_map[tag]

      STEP 4: Decide to keep or drop
        IF conflicts_with_kept is not empty:
          DROP this tag (lower weight than conflicting kept tag)
          log: "tag.dropped_due_to_conflict", dropped=tag, conflicts_with=conflicts_with_kept
        ELSE:
          KEEP this tag
          kept_tags.append(tag)
          kept_set.add(tag)

STEP 5: Return results
  RETURN kept_tags
```

### 3.5 Pseudocode: Conflict Resolver

```python
class TagConflictResolver:
    def __init__(self, conflict_matrix_path: str):
        """Load bidirectional conflict map from JSON."""
        conflicts = load_json(conflict_matrix_path)
        self.conflict_map = {}  # {"tag_a": {"tag_b", "tag_c"}, ...}

        for conflict in conflicts:
            tag_a = conflict["tag_a"]
            tag_b = conflict["tag_b"]

            if tag_a not in self.conflict_map:
                self.conflict_map[tag_a] = set()
            if tag_b not in self.conflict_map:
                self.conflict_map[tag_b] = set()

            # Bidirectional
            self.conflict_map[tag_a].add(tag_b)
            self.conflict_map[tag_b].add(tag_a)

    def resolve_conflicts(self, tags: List[str], weights: Dict[str, float] = None) -> List[str]:
        """Resolve conflicts by dropping lower-weight tags.

        Algorithm:
        - Tags should be pre-sorted by weight (descending)
        - For each tag, check if it conflicts with any already-kept tag
        - If conflict found, drop current tag (keep higher-weight)
        - If no conflict, add to kept set

        Args:
            tags: List of tags, pre-sorted by weight descending
            weights: Optional weight map for logging

        Returns:
            Conflict-free subset of tags (same order as input)
        """
        kept_tags = []
        kept_set = set()

        for tag in tags:
            # Check if this tag conflicts with any kept tag
            conflicts_with_kept = kept_set & self.conflict_map.get(tag, set())

            if conflicts_with_kept:
                # Drop this tag (lower weight than kept tags)
                log_event(
                    "tag.dropped_due_to_conflict",
                    dropped_tag=tag,
                    conflicts_with=list(conflicts_with_kept),
                    weight=weights.get(tag) if weights else None
                )
                continue

            # Keep this tag
            kept_tags.append(tag)
            kept_set.add(tag)

        if len(kept_tags) < len(tags):
            log_event(
                "tags.conflicts_resolved",
                original_count=len(tags),
                kept_count=len(kept_tags),
                dropped_count=len(tags) - len(kept_tags)
            )

        return kept_tags
```

### 3.6 Example: Conflict Resolution

```
Input tags (pre-sorted by weight descending):
  ["anthemic", "orchestral", "whisper", "minimalist", "acoustic"]

Weights:
  anthemic: 0.9 (highest)
  orchestral: 0.8
  whisper: 0.7
  minimalist: 0.6
  acoustic: 0.5

Conflict matrix:
  whisper ↔ anthemic
  orchestral ↔ minimalist

Processing:

1. Tag: "anthemic" (weight 0.9)
   Conflicts with: {whisper} ✓
   kept_set: {} (empty)
   → NO conflicts with kept_set
   → KEEP "anthemic"
   → kept_set = {anthemic}, kept_tags = [anthemic]

2. Tag: "orchestral" (weight 0.8)
   Conflicts with: {minimalist}
   → NO conflicts with kept_set = {anthemic}
   → KEEP "orchestral"
   → kept_set = {anthemic, orchestral}, kept_tags = [anthemic, orchestral]

3. Tag: "whisper" (weight 0.7)
   Conflicts with: {anthemic}
   → CONFLICTS with kept_set (anthemic is in kept_set)
   → DROP "whisper"
   → kept_set unchanged, kept_tags = [anthemic, orchestral]

4. Tag: "minimalist" (weight 0.6)
   Conflicts with: {orchestral}
   → CONFLICTS with kept_set (orchestral is in kept_set)
   → DROP "minimalist"
   → kept_set unchanged, kept_tags = [anthemic, orchestral]

5. Tag: "acoustic" (weight 0.5)
   Conflicts with: {} (no conflicts in matrix)
   → NO conflicts with kept_set
   → KEEP "acoustic"
   → kept_set = {anthemic, orchestral, acoustic}, kept_tags = [anthemic, orchestral, acoustic]

Output tags: ["anthemic", "orchestral", "acoustic"]
Dropped: ["whisper", "minimalist"] (2 due to conflicts)
```

### 3.7 Deterministic Guarantees

- **Reproducibility:** Same tag list and weights always produce same output
- **Greedy optimality:** Keeps maximum-weight conflict-free subset
- **Order-preservation:** Output preserves input order (importance order)
- **Idempotency:** Running resolver on resolved tags returns same tags
- **No dependencies:** Resolution doesn't depend on external state

---

## 4. Cross-Entity Validation Rules

### 4.1 Overview

SDS contains multiple related entities (Style, Lyrics, ProducerNotes, Blueprint, Sources) that must be consistent with each other. This validator checks alignment across entity boundaries to catch logical errors early.

### 4.2 Validation Rules

#### Rule 1: Genre Consistency

**Rule:** Blueprint genre must match Style primary genre

**Validation Logic:**
```
blueprint_genre = sds.blueprint_ref.genre
style_genre = sds.style.genre_detail.primary

IF blueprint_genre != style_genre:
  ERROR: "Genre mismatch: blueprint '{blueprint_genre}' != style '{style_genre}'"
```

**Rationale:** Blueprint defines genre-specific constraints (BPM ranges, required sections, lexicon). Style must declare the same primary genre to ensure constraints apply correctly.

**Example:**
```json
{
  "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
  "style": {"genre_detail": {"primary": "Rock", "secondary": ["Pop"]}}
}
→ ERROR: Genre mismatch
```

#### Rule 2: Section Alignment

**Rule:** All sections referenced by ProducerNotes must exist in Lyrics

**Validation Logic:**
```
lyrics_sections = set(sds.lyrics.section_order)

producer_structure = sds.producer_notes.structure
# Parse sections (format: "Intro – Verse 1 – Chorus – Bridge – Outro")
producer_sections = set(
  section.strip()
  for section in producer_structure.split("–")
  if section.strip()
)

missing = producer_sections - lyrics_sections

IF missing is not empty:
  ERROR: "Producer notes references sections not in lyrics: {missing}"
```

**Rationale:** Producer notes describe arrangement for specific sections. If a section is mentioned in producer notes but doesn't exist in lyrics, the arrangement guidance is invalid.

**Example:**
```json
{
  "lyrics": {
    "section_order": ["Intro", "Verse", "Chorus", "Outro"]
  },
  "producer_notes": {
    "structure": "Intro – Verse 1 – Chorus – Bridge – Outro"
  }
}
→ ERROR: Bridge is not in lyrics.section_order
```

#### Rule 3: Source Citation Validation

**Rule:** All source citations in Lyrics must reference existing Sources

**Validation Logic:**
```
citations = sds.lyrics.get("source_citations", [])
source_names = set(src.get("name") for src in sds.sources)

errors = []
FOR each citation in citations:
  cited_source = citation.get("source_id")
  IF cited_source and cited_source not in source_names:
    errors.append(
      f"Lyrics cites source '{cited_source}' not in sources list"
    )

IF errors:
  ERROR: join(errors, "; ")
```

**Rationale:** Lyrics may reference external sources (for citations, influence, style matching). Each citation must point to an actual source defined in the SDS, ensuring traceability and preventing dead references.

**Example:**
```json
{
  "sources": [
    {"name": "wikipedia-music", "kind": "web"},
    {"name": "meaty-corpus", "kind": "file"}
  ],
  "lyrics": {
    "source_citations": [
      {"source_id": "wikipedia-music"},
      {"source_id": "unknown-source"}  ← NOT in sources
    ]
  }
}
→ ERROR: Lyrics cites source 'unknown-source' which is not in sources list
```

### 4.3 Validation Flowchart

```
Enter Cross-Entity Validation
├─ Check Genre Consistency
│  ├─ blueprint.genre == style.primary_genre?
│  │  ├─ YES: Continue
│  │  └─ NO: Error "Genre mismatch..."
│  └─ Continue
├─ Check Section Alignment
│  ├─ All producer_notes sections in lyrics.section_order?
│  │  ├─ YES: Continue
│  │  └─ NO: Error "Producer notes references sections..."
│  └─ Continue
├─ Check Source Citations
│  ├─ All citations.source_id in sources.name?
│  │  ├─ YES: Continue
│  │  └─ NO: Error "Lyrics cites source..."
│  └─ Continue
└─ All Checks Passed: Return (True, [])
```

### 4.4 Error Messages

Cross-entity validation returns a list of error messages (0 = valid, >0 = invalid):

```
Valid case:
  (is_valid=True, errors=[])

Single error:
  (is_valid=False, errors=[
    "Genre mismatch: blueprint 'Pop' != style 'Rock'"
  ])

Multiple errors:
  (is_valid=False, errors=[
    "Genre mismatch: blueprint 'Pop' != style 'Rock'",
    "Producer notes references sections not in lyrics: Bridge, Pre-Chorus",
    "Lyrics cites source 'unknown-source' which is not in sources list"
  ])
```

---

## 5. Blueprint Constraint Enforcement

### 5.1 Overview

Blueprints encode genre-specific rules and constraints (BPM ranges, required sections, banned terms, line count requirements). These constraints must be enforced on the compiled SDS to ensure it conforms to genre conventions.

### 5.2 Blueprint Structure

```json
{
  "id": "blueprint-pop-2025-11",
  "genre": "Pop",
  "version": "2025.11",
  "rules": {
    "tempo_bpm": [80, 140],
    "required_sections": ["Intro", "Verse", "Chorus", "Outro"],
    "banned_terms": ["explicit", "profane"],
    "section_lines": {
      "Verse": {"min": 4, "max": 12},
      "Chorus": {"min": 2, "max": 8}
    }
  }
}
```

### 5.3 Constraint Types

#### Constraint 1: BPM Range Validation

**Rule:** Style tempo_bpm must fall within blueprint range

**Validation Logic:**
```
IF "tempo_bpm" not in blueprint.rules:
  RETURN [] (no constraint)

bpm_range = blueprint.rules["tempo_bpm"]  # [min, max]
style_bpm = sds.style.get("tempo_bpm")

IF style_bpm is None:
  RETURN ["Style missing tempo_bpm"]

# Handle single BPM or range
IF isinstance(style_bpm, int):
  bpm_values = [style_bpm]
ELSE:
  bpm_values = style_bpm  # already a list

errors = []
FOR each bpm in bpm_values:
  IF bpm < bpm_range[0] OR bpm > bpm_range[1]:
    errors.append(
      f"BPM {bpm} outside blueprint range [{bpm_range[0]}, {bpm_range[1]}]"
    )

RETURN errors
```

**Example:**
```
Blueprint: {"tempo_bpm": [90, 130]}
Style BPM: 100
→ PASS ✓

Blueprint: {"tempo_bpm": [90, 130]}
Style BPM: 180
→ ERROR: "BPM 180 outside blueprint range [90, 130]"
```

#### Constraint 2: Required Sections Validation

**Rule:** Lyrics must include all required sections from blueprint

**Validation Logic:**
```
required_sections = blueprint.rules.get("required_sections", [])
IF required_sections is empty:
  RETURN [] (no constraint)

lyrics_sections = set(sds.lyrics.get("section_order", []))
missing = set(required_sections) - lyrics_sections

IF missing is not empty:
  RETURN [f"Missing required sections: {', '.join(missing)}"]
ELSE:
  RETURN []
```

**Example:**
```
Blueprint required_sections: ["Intro", "Verse", "Chorus", "Outro"]
Lyrics section_order: ["Intro", "Verse", "Chorus", "Bridge", "Outro"]
→ PASS ✓ (has all required, plus Bridge)

Blueprint required_sections: ["Intro", "Verse", "Chorus", "Outro"]
Lyrics section_order: ["Verse", "Chorus"]
→ ERROR: "Missing required sections: Intro, Outro"
```

#### Constraint 3: Banned Terms Filtering

**Rule:** Lyrics and Style must not use banned terms (unless explicit is allowed)

**Validation Logic:**
```
banned_terms = blueprint.rules.get("banned_terms", [])
IF banned_terms is empty:
  RETURN [] (no constraint)

explicit_allowed = sds.lyrics.get("constraints", {}).get("explicit", False)

IF not explicit_allowed:
  # Placeholder: Full profanity/term checking happens during LYRICS generation
  # For SDS validation, just flag explicit requirement
  # This is a structural check, not text content checking
  RETURN []
ELSE:
  RETURN []

# Note: Actual banned term checking is deferred to LYRICS workflow node
# where full text content is generated and scanned
```

**Rationale:** Banned terms are context-dependent (profanity depends on explicitness setting). Full checking requires generated text, which happens in the LYRICS node. SDS validation performs structural checks only.

#### Constraint 4: Section Line Count Requirements

**Rule:** Sections must meet minimum/maximum line count requirements

**Validation Logic:**
```
section_lines = blueprint.rules.get("section_lines", {})
IF section_lines is empty:
  RETURN [] (no constraint)

section_reqs = sds.lyrics.get("constraints", {}).get("section_requirements", {})

errors = []
FOR each section, line_rules in section_lines.items():
  IF section in sds.lyrics.get("section_order", []):
    # Section exists in lyrics
    IF section not in section_reqs:
      min_lines = line_rules.get("min", 0)
      IF min_lines > 0:
        errors.append(
          f"Section '{section}' requires line count constraints (min: {min_lines})"
        )

RETURN errors
```

**Example:**
```
Blueprint section_lines: {"Chorus": {"min": 2, "max": 8}}
Lyrics constraints.section_requirements: {"Verse": {"min": 4}}
→ Missing: Chorus constraints
→ ERROR: "Section 'Chorus' requires line count constraints (min: 2)"

Blueprint section_lines: {"Chorus": {"min": 2}}
Lyrics constraints.section_requirements: {"Chorus": {"min": 4}, "Verse": {"min": 3}}
→ PASS ✓ (Chorus has required constraints)
```

### 5.4 Enforcement Flowchart

```
Enter Blueprint Constraint Validation
├─ Load Blueprint
│  ├─ Blueprint exists?
│  │  ├─ YES: Continue
│  │  └─ NO: ERROR "Blueprint not found"
│  └─ Continue
├─ Check BPM Range
│  ├─ BPM in [min, max]?
│  │  ├─ YES: Continue
│  │  └─ NO: ERROR "BPM outside range"
│  └─ Continue
├─ Check Required Sections
│  ├─ All required sections present?
│  │  ├─ YES: Continue
│  │  └─ NO: ERROR "Missing required sections"
│  └─ Continue
├─ Check Banned Terms
│  ├─ No banned terms (if !explicit)?
│  │  ├─ YES: Continue
│  │  └─ NO: (deferred to LYRICS node)
│  └─ Continue
├─ Check Section Line Counts
│  ├─ Line count constraints defined?
│  │  ├─ YES: Continue
│  │  └─ NO: Continue (deferred to generation)
│  └─ Continue
└─ All Checks Passed: Return (True, [])
```

### 5.5 Error Messages

Blueprint validation returns detailed, actionable error messages:

```
BPM violation:
  "BPM 180 outside blueprint range [80, 140]"

Missing sections:
  "Missing required sections: Chorus, Bridge"

Line count requirement:
  "Section 'Verse' requires line count constraints (min: 4)"

Multiple errors:
  [
    "BPM 180 outside blueprint range [80, 140]",
    "Missing required sections: Chorus",
    "Section 'Chorus' requires line count constraints (min: 2)"
  ]
```

---

## 6. Deterministic Hashing Methodology

### 6.1 Overview

Deterministic hashing ensures reproducibility: given identical inputs, the SDS should always hash to the same value. This enables:
- Verification that SDS hasn't changed
- Detection of unintended mutations
- Reproducibility testing (same seed + SDS = same output)

### 6.2 Hash Algorithm: SHA-256 on Canonical JSON

**Algorithm:**
1. Create a copy of SDS excluding non-deterministic fields
2. Convert to canonical JSON (sorted keys, deterministic formatting)
3. Compute SHA-256 hash of canonical JSON
4. Return 64-character hexadecimal digest

### 6.3 Fields Excluded from Hash

The following fields are excluded because they're computed/metadata and not part of the deterministic input:

```
Excluded fields:
  - "_computed_hash": The hash itself can't be part of the hash
  - "compiled_at": Timestamp (not deterministic)
  - "compiler_version": Version string (not deterministic)
  - Any other runtime/metadata fields added after compilation
```

**Rationale:** These fields are added after compilation and reflect execution time, not content. Including them would make the hash non-deterministic.

### 6.4 Canonical JSON Format

Canonical JSON ensures identical JSONs always produce identical hashes:

**Rules:**
1. **Sorted keys:** All object keys sorted alphabetically
2. **No whitespace:** No spaces, newlines, or formatting
3. **UTF-8 encoding:** Consistent character encoding
4. **Consistent array order:** Arrays maintain input order (not sorted)

**Example:**

```python
# Input SDS (keys unordered)
sds = {
  "title": "My Song",
  "seed": 42,
  "blueprint_ref": {"version": "2025.11", "genre": "Pop"},
  "style": {...}
}

# Canonical JSON (keys sorted, compact)
canonical = '{"blueprint_ref":{"genre":"Pop","version":"2025.11"},...,"seed":42,"style":{...},"title":"My Song"}'

# SHA-256 hash
hash = sha256(canonical.encode()).hexdigest()
# → "a1b2c3d4e5f6..."
```

### 6.5 Pseudocode: Compute Deterministic Hash

```python
import hashlib
import json

def compute_sds_hash(sds: Dict[str, Any]) -> str:
    """Compute SHA-256 hash of SDS for determinism verification.

    Excludes computed/metadata fields from hash calculation.
    Uses canonical JSON (sorted keys, compact format).

    Args:
        sds: Complete SDS dictionary

    Returns:
        SHA-256 hexdigest (64-character hex string)
    """
    # Step 1: Create copy and exclude non-deterministic fields
    excluded_fields = {"_computed_hash", "compiled_at", "compiler_version"}
    sds_copy = {
        k: v for k, v in sds.items()
        if k not in excluded_fields
    }

    # Step 2: Canonical JSON (sorted keys, compact)
    canonical = json.dumps(
        sds_copy,
        sort_keys=True,
        separators=(',', ':'),  # Compact: no spaces
        ensure_ascii=False      # Preserve UTF-8
    )

    # Step 3: Compute SHA-256
    hash_digest = hashlib.sha256(canonical.encode('utf-8')).hexdigest()

    log_event(
        "sds.hash_computed",
        hash=hash_digest,
        sds_size_bytes=len(canonical.encode('utf-8')),
        excluded_fields=list(excluded_fields)
    )

    return hash_digest
```

### 6.6 Hash Reproducibility Example

**Test: Same SDS produces same hash**

```python
# Run 1
sds_1 = compile_sds(song_id)
hash_1 = sds_1["_computed_hash"]

# Run 2 (identical inputs, same seed)
sds_2 = compile_sds(song_id)
hash_2 = sds_2["_computed_hash"]

assert hash_1 == hash_2  ✓
# "a1b2c3d4e5f6..." == "a1b2c3d4e5f6..."
```

**Test: Different SDS produces different hash**

```python
sds_1 = compile_sds(song_id_1)  # Song A
hash_1 = sds_1["_computed_hash"]

sds_2 = compile_sds(song_id_2)  # Song B (different entities)
hash_2 = sds_2["_computed_hash"]

assert hash_1 != hash_2  ✓
# "a1b2c3d4..." != "d4e5f6a1b2c3..."
```

**Test: Mutation changes hash**

```python
sds = compile_sds(song_id)
hash_original = sds["_computed_hash"]

# Mutate: change tempo
sds["style"]["tempo_bpm"] = 200  # was 120
hash_mutated = compute_sds_hash(sds)

assert hash_original != hash_mutated  ✓
# Mutation detected!
```

### 6.7 Hash Format and Properties

**Format:**
- **Length:** 64 characters (SHA-256 hexdigest)
- **Charset:** 0-9, a-f (hexadecimal)
- **Example:** `"a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"`

**Properties:**
- **Collision-free (for practical purposes):** SHA-256 produces 2^256 possible values
- **Deterministic:** Same input → same hash
- **Avalanche effect:** Small change in input → completely different hash
- **One-way:** Cannot reverse hash to get original SDS
- **Fast:** O(n) complexity where n = SDS size

### 6.8 Verification Workflow

```
Compile SDS
├─ compute_sds_hash(sds) → hash_1
└─ Store hash with SDS

Later: Verify SDS hasn't mutated
├─ Load SDS and stored hash_original
├─ compute_sds_hash(sds) → hash_2
├─ IF hash_1 == hash_2:
│  └─ SDS is valid (unchanged)
└─ ELSE:
   └─ SDS has been mutated (error!)
```

---

## 7. Integration Example: Complete Flow

### 7.1 End-to-End Compilation Example

```python
# STEP 1: User creates song with entity references
song_create = SongCreate(
    title="Acoustic Dream",
    style_id="uuid-style-123",
    lyrics_id="uuid-lyrics-456",
    producer_notes_id="uuid-producer-789",
    blueprint_id="uuid-blueprint-pop",
    global_seed=42
)

# STEP 2: API endpoint calls SDS compiler
sds_compiler = SDSCompilerService(...)
sds = await sds_compiler.compile_sds(song.id)

# Output after compilation:
{
  "title": "Acoustic Dream",
  "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
  "style": {
    "genre_detail": {"primary": "Pop", "secondary": ["Acoustic"]},
    "tempo_bpm": 110,
    "tags": ["acoustic", "intimate", "reflective"]  ← conflict-resolved
    # ... more fields
  },
  "lyrics": {
    "section_order": ["Intro", "Verse", "Chorus", "Outro"],
    "constraints": {"explicit": false},
    # ... more fields
  },
  "producer_notes": {
    "structure": "Intro – Verse – Chorus – Bridge – Outro",
    # ... more fields
  },
  "sources": [
    {"name": "spotify-artist-archive", "weight": 0.5},  ← normalized
    {"name": "meaty-corpus", "weight": 0.5}              ← normalized
  ],
  "render": {"engine": "none", "num_variations": 2},
  "seed": 42,
  "_computed_hash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
}

# STEP 3: Validators check the SDS

# 3A: Blueprint validation
blueprint_validator.validate_sds_against_blueprint(sds, blueprint_id)
→ Checks: BPM 110 in [80, 140] ✓
         Sections: Intro, Verse, Chorus in required ✓
         No banned terms ✓

# 3B: Cross-entity validation
cross_entity_validator.validate_sds_consistency(sds)
→ Checks: Genre "Pop" == "Pop" ✓
         Sections: Intro, Verse, Chorus, Bridge, Outro all present ✓
         Citations: all reference valid sources ✓

# STEP 4: All validation passed
→ SDS stored in song.extra_metadata.compiled_sds
→ Return 201 Created with song data
```

---

## 8. Performance Characteristics

### 8.1 Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Fetch entities | O(1) | Single query with eager loading |
| Validate references | O(n) | n = number of entities (typically 6) |
| Transform to SDS | O(m) | m = total size of entity specs |
| Normalize weights | O(k) | k = number of sources (typically 1-5) |
| Validate schema | O(m) | m = SDS JSON size |
| Blueprint validation | O(s) | s = number of rules (typically 10-20) |
| Cross-entity validation | O(n) | n = total entity count |
| Compute hash | O(m) | m = SDS JSON size |
| **Total** | **O(m)** | m = SDS size dominates |

### 8.2 Space Complexity

| Component | Space | Notes |
|-----------|-------|-------|
| Entity models | O(m) | m = total entity size |
| SDS copy | O(m) | Copy for hashing excludes some fields |
| Conflict map | O(c) | c = conflict matrix size (~1KB) |
| **Total** | **O(m)** | SDS dominates |

### 8.3 Performance Targets

**From implementation plan:**
- **SDS compilation**: P95 < 500ms
- **Full song creation** (with validation): P95 < 2s
- **Database queries**: < 5 queries per song

---

## 9. References and Standards

### 9.1 Related Documents

- `/docs/project_plans/PRDs/sds.prd.md` — SDS entity contract and schema
- `/docs/project_plans/PRDs/blueprint.prd.md` — Blueprint rules and constraints
- `/schemas/sds.schema.json` — SDS JSON schema for validation
- `/taxonomies/conflict_matrix.json` — Tag conflict definitions

### 9.2 Standards and Algorithms

- **JSON Canonicalization**: RFC 7159 (JSON), custom sorted-keys approach
- **SHA-256 Hashing**: FIPS 180-4 standard
- **Conflict Resolution**: Greedy algorithm (optimal for weighted conflicts)
- **Weight Normalization**: Sum-to-one normalization (standard in probability)

### 9.3 Implementation References

**Services:**
- `SDSCompilerService` — Main compilation orchestrator
- `BlueprintValidatorService` — Blueprint constraint enforcement
- `TagConflictResolver` — Conflict resolution logic
- `CrossEntityValidator` — Cross-entity consistency checks

**Tests:**
- `test_sds_compiler_service.py` — Unit tests for compilation
- `test_blueprint_validator_service.py` — Blueprint validation tests
- `test_tag_conflict_resolver.py` — Conflict resolution tests
- `test_cross_entity_validator.py` — Cross-entity validation tests
- `test_song_creation_flow.py` — Integration tests

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **SDS** | Song Design Spec — complete specification for one song |
| **Compilation** | Process of aggregating entities into SDS format |
| **Normalization** | Converting weights to sum to 1.0 |
| **Conflict** | Two tags that are mutually exclusive (contradictory) |
| **Resolution** | Removing conflicting tags using greedy algorithm |
| **Determinism** | Same input produces same output (reproducible) |
| **Canonical JSON** | JSON with sorted keys and compact formatting |
| **Hash** | SHA-256 digest for verification and reproducibility |
| **RLS** | Row-Level Security — access control on entities |
| **Blueprint** | Genre-specific rules and constraints |
| **Schema** | JSON schema for structural validation |

---

**Document Status:** Complete
**Last Updated:** 2025-11-14
**Reviewed By:** —
**Next Review:** —

