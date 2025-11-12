# Phase 2: Aggregation & Composition Services

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: Phase 0 (Foundation), Phase 1 (Entity Services)
**Critical Path**: Yes — bridges entities to orchestration

## Phase Overview

### Mission

Implement the aggregation layer that transforms entity references into the Song Design Spec (SDS) and the composition engine that renders SDS artifacts into render-ready prompts under engine constraints.

### Goals

1. **SDS Aggregation**: Assemble all entity references (persona, blueprint, style, lyrics, producer notes, sources) into a validated, deterministic SDS
2. **Prompt Composition**: Transform SDS artifacts into engine-ready prompts respecting:
   - Character limits (Suno v5: 3800 chars)
   - Tag conflict resolution
   - Living artist normalization
   - Section metadata injection
   - Deterministic ordering

### Why Critical Path

Phase 2 is the **integration pivot**:
- **Backward**: Consumes all Phase 1 entity services
- **Forward**: Provides the SDS contract for Phase 3 orchestration
- **Horizontal**: Defines the composition algorithm for render connectors

Without SDS + prompt composition, orchestration cannot validate constraints or produce render artifacts.

### Dependencies

**From Phase 0**:
- JSON schemas: `sds_schema.json`, `prompt_schema.json`
- Taxonomies: `tags/`, `conflicts.json`
- Engine limits: `limits/suno_v5.json`

**From Phase 1**:
- Entity CRUD APIs: `/personas`, `/blueprints`, `/styles`, `/lyrics`, `/producer_notes`, `/sources`
- Validation services for each entity

### Success Criteria

- [ ] SDS validates all entity references exist
- [ ] Source weights normalized to 1.0
- [ ] Prompt composition stays under engine limits (100% compliance)
- [ ] Tag conflicts auto-resolved via conflict matrix
- [ ] Determinism: same SDS + seed → identical prompt
- [ ] Living artist references normalized for policy compliance

---

## Work Package 1: SDS Service

**Agent**: `python-backend-engineer`
**Duration**: 1 week
**PRD Reference**: `docs/project_plans/PRDs/sds.prd.md`

### Overview

The SDS service aggregates entity references into a single, validated specification. It enforces weight normalization, seed validation, and cross-entity consistency.

### Implementation Details

#### File Structure

```
backend/services/aggregation/
├── sds_service.py           # Core SDS logic
├── sds_validator.py         # Cross-entity validation
├── weight_normalizer.py     # Source weight normalization
└── tests/
    ├── test_sds_assembly.py
    ├── test_validation.py
    └── test_normalization.py

backend/routes/
├── sds_routes.py            # FastAPI endpoints
```

#### SDS Assembly Algorithm

**File**: `backend/services/aggregation/sds_service.py`

```python
from typing import Optional, List
from uuid import UUID
import hashlib
import json

class SDSService:
    def __init__(self, db_session, entity_services):
        self.db = db_session
        self.personas = entity_services['personas']
        self.blueprints = entity_services['blueprints']
        self.styles = entity_services['styles']
        self.lyrics = entity_services['lyrics']
        self.producer_notes = entity_services['producer_notes']
        self.sources = entity_services['sources']
        self.validator = SDSValidator(db_session)
        self.normalizer = WeightNormalizer()

    async def assemble_sds(
        self,
        song_id: str,
        persona_ids: List[UUID],
        blueprint_id: UUID,
        style_id: UUID,
        lyrics_id: UUID,
        producer_notes_id: UUID,
        source_configs: List[dict],  # [{"id": uuid, "weight": 0.5}]
        constraints: dict,
        seed: int,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Assemble SDS from entity references.

        Args:
            song_id: Unique song identifier
            persona_ids: List of persona UUIDs (ordered)
            blueprint_id: Blueprint UUID
            style_id: Style spec UUID
            lyrics_id: Lyrics UUID
            producer_notes_id: Producer notes UUID
            source_configs: [{"id": uuid, "weight": float}]
            constraints: {explicit: bool, release_mode: str, max_duration_s: int}
            seed: Global determinism seed
            metadata: Optional song metadata

        Returns:
            Validated SDS dict
        """
        # 1. Validate all entities exist
        await self.validator.validate_entities_exist(
            persona_ids, blueprint_id, style_id, lyrics_id,
            producer_notes_id, [sc["id"] for sc in source_configs]
        )

        # 2. Normalize source weights to sum to 1.0
        normalized_sources = self.normalizer.normalize_weights(source_configs)

        # 3. Validate seed (must be positive integer)
        if not isinstance(seed, int) or seed < 0:
            raise ValueError(f"Seed must be non-negative integer, got {seed}")

        # 4. Assemble SDS structure
        sds = {
            "song_id": song_id,
            "entities": {
                "personas": [str(pid) for pid in persona_ids],
                "blueprint": str(blueprint_id),
                "style": str(style_id),
                "lyrics": str(lyrics_id),
                "producer_notes": str(producer_notes_id),
                "sources": normalized_sources  # [{"id": str, "weight": float}]
            },
            "constraints": {
                "explicit": constraints.get("explicit", False),
                "release_mode": constraints.get("release_mode", "private"),
                "max_duration_s": constraints.get("max_duration_s", 180)
            },
            "seed": seed,
            "metadata": metadata or {},
            "version": "1.0"
        }

        # 5. Validate SDS against schema
        await self.validator.validate_sds_schema(sds)

        # 6. Cross-entity validation (e.g., blueprint genre matches style)
        await self.validator.validate_cross_entity_consistency(sds)

        # 7. Compute deterministic hash
        sds["hash"] = self._compute_sds_hash(sds)

        return sds

    def _compute_sds_hash(self, sds: dict) -> str:
        """
        Compute SHA256 hash of SDS (excluding hash field itself).
        Used for determinism verification and caching.
        """
        sds_copy = {k: v for k, v in sds.items() if k != "hash"}
        canonical = json.dumps(sds_copy, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
```

#### Weight Normalization

**File**: `backend/services/aggregation/weight_normalizer.py`

```python
from typing import List

class WeightNormalizer:
    def normalize_weights(self, source_configs: List[dict]) -> List[dict]:
        """
        Normalize source weights to sum to 1.0.

        Args:
            source_configs: [{"id": uuid, "weight": float}]

        Returns:
            Normalized configs with weights summing to 1.0

        Example:
            Input:  [{"id": "a", "weight": 2.0}, {"id": "b", "weight": 3.0}]
            Output: [{"id": "a", "weight": 0.4}, {"id": "b", "weight": 0.6}]
        """
        if not source_configs:
            return []

        # Handle case where all weights are 0 or negative
        total = sum(sc.get("weight", 0) for sc in source_configs)
        if total <= 0:
            # Equal weighting
            equal_weight = 1.0 / len(source_configs)
            return [
                {"id": str(sc["id"]), "weight": equal_weight}
                for sc in source_configs
            ]

        # Normalize to sum to 1.0
        return [
            {
                "id": str(sc["id"]),
                "weight": round(sc.get("weight", 0) / total, 4)
            }
            for sc in source_configs
        ]
```

#### Cross-Entity Validation

**File**: `backend/services/aggregation/sds_validator.py`

```python
from uuid import UUID
from typing import List

class SDSValidator:
    def __init__(self, db_session):
        self.db = db_session

    async def validate_entities_exist(
        self,
        persona_ids: List[UUID],
        blueprint_id: UUID,
        style_id: UUID,
        lyrics_id: UUID,
        producer_notes_id: UUID,
        source_ids: List[UUID]
    ):
        """Verify all referenced entities exist in database."""
        # Check personas
        for pid in persona_ids:
            if not await self._entity_exists("personas", pid):
                raise ValueError(f"Persona {pid} not found")

        # Check blueprint
        if not await self._entity_exists("blueprints", blueprint_id):
            raise ValueError(f"Blueprint {blueprint_id} not found")

        # Check style
        if not await self._entity_exists("styles", style_id):
            raise ValueError(f"Style {style_id} not found")

        # Check lyrics
        if not await self._entity_exists("lyrics", lyrics_id):
            raise ValueError(f"Lyrics {lyrics_id} not found")

        # Check producer notes
        if not await self._entity_exists("producer_notes", producer_notes_id):
            raise ValueError(f"ProducerNotes {producer_notes_id} not found")

        # Check sources
        for sid in source_ids:
            if not await self._entity_exists("sources", sid):
                raise ValueError(f"Source {sid} not found")

    async def _entity_exists(self, table: str, entity_id: UUID) -> bool:
        """Check if entity exists in table."""
        result = await self.db.execute(
            f"SELECT 1 FROM {table} WHERE id = $1",
            entity_id
        )
        return result.fetchone() is not None

    async def validate_cross_entity_consistency(self, sds: dict):
        """
        Validate consistency across entities.

        Example checks:
        - Blueprint genre matches style primary_genre
        - Lyrics structure matches blueprint section requirements
        - Max duration matches blueprint constraints
        """
        # Load entities
        blueprint = await self._load_entity("blueprints", sds["entities"]["blueprint"])
        style = await self._load_entity("styles", sds["entities"]["style"])
        lyrics = await self._load_entity("lyrics", sds["entities"]["lyrics"])

        # Check genre consistency
        if blueprint["genre"] != style["primary_genre"]:
            raise ValueError(
                f"Blueprint genre '{blueprint['genre']}' does not match "
                f"style primary_genre '{style['primary_genre']}'"
            )

        # Check required sections (e.g., blueprint requires chorus)
        required_sections = blueprint.get("required_sections", [])
        lyrics_sections = {sec["type"] for sec in lyrics["sections"]}
        missing = set(required_sections) - lyrics_sections
        if missing:
            raise ValueError(f"Lyrics missing required sections: {missing}")

        # Check max duration
        max_duration = sds["constraints"]["max_duration_s"]
        blueprint_max = blueprint.get("max_duration_s")
        if blueprint_max and max_duration > blueprint_max:
            raise ValueError(
                f"Max duration {max_duration}s exceeds blueprint limit {blueprint_max}s"
            )
```

#### FastAPI Endpoints

**File**: `backend/routes/sds_routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from pydantic import BaseModel

router = APIRouter(prefix="/sds", tags=["SDS"])

class SDSRequest(BaseModel):
    song_id: str
    persona_ids: List[UUID]
    blueprint_id: UUID
    style_id: UUID
    lyrics_id: UUID
    producer_notes_id: UUID
    source_configs: List[dict]  # [{"id": uuid, "weight": float}]
    constraints: dict
    seed: int
    metadata: dict = {}

@router.post("/", status_code=201)
async def create_sds(
    request: SDSRequest,
    sds_service: SDSService = Depends(get_sds_service)
):
    """
    Assemble and validate SDS from entity references.

    Returns:
        Validated SDS with computed hash
    """
    try:
        sds = await sds_service.assemble_sds(
            song_id=request.song_id,
            persona_ids=request.persona_ids,
            blueprint_id=request.blueprint_id,
            style_id=request.style_id,
            lyrics_id=request.lyrics_id,
            producer_notes_id=request.producer_notes_id,
            source_configs=request.source_configs,
            constraints=request.constraints,
            seed=request.seed,
            metadata=request.metadata
        )
        return sds
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{song_id}")
async def get_sds(song_id: str, sds_service: SDSService = Depends(get_sds_service)):
    """Retrieve SDS by song_id."""
    sds = await sds_service.get_sds(song_id)
    if not sds:
        raise HTTPException(status_code=404, detail="SDS not found")
    return sds

@router.get("/{song_id}/preview")
async def preview_sds(
    song_id: str,
    sds_service: SDSService = Depends(get_sds_service)
):
    """
    Return human-readable preview of SDS for UI display.
    Includes entity names, not just IDs.
    """
    sds = await sds_service.get_sds_with_entities(song_id)
    if not sds:
        raise HTTPException(status_code=404, detail="SDS not found")
    return sds
```

### Test Examples

**File**: `backend/services/aggregation/tests/test_sds_assembly.py`

```python
import pytest
from uuid import uuid4

@pytest.mark.asyncio
async def test_assemble_sds_success(sds_service, mock_entities):
    """Test successful SDS assembly with valid entities."""
    sds = await sds_service.assemble_sds(
        song_id="test-song-1",
        persona_ids=[mock_entities["persona_id"]],
        blueprint_id=mock_entities["blueprint_id"],
        style_id=mock_entities["style_id"],
        lyrics_id=mock_entities["lyrics_id"],
        producer_notes_id=mock_entities["producer_notes_id"],
        source_configs=[
            {"id": mock_entities["source_id_1"], "weight": 2.0},
            {"id": mock_entities["source_id_2"], "weight": 3.0}
        ],
        constraints={"explicit": False, "release_mode": "private"},
        seed=42
    )

    assert sds["song_id"] == "test-song-1"
    assert sds["seed"] == 42
    assert len(sds["entities"]["sources"]) == 2
    # Verify weight normalization: 2/(2+3) = 0.4, 3/(2+3) = 0.6
    assert sds["entities"]["sources"][0]["weight"] == 0.4
    assert sds["entities"]["sources"][1]["weight"] == 0.6
    assert "hash" in sds

@pytest.mark.asyncio
async def test_missing_entity_fails(sds_service):
    """Test SDS assembly fails when entity doesn't exist."""
    with pytest.raises(ValueError, match="Blueprint .* not found"):
        await sds_service.assemble_sds(
            song_id="test-song-2",
            persona_ids=[uuid4()],
            blueprint_id=uuid4(),  # Non-existent
            style_id=uuid4(),
            lyrics_id=uuid4(),
            producer_notes_id=uuid4(),
            source_configs=[],
            constraints={},
            seed=42
        )

@pytest.mark.asyncio
async def test_deterministic_hash(sds_service, mock_entities):
    """Test same inputs produce same hash."""
    sds1 = await sds_service.assemble_sds(**test_inputs)
    sds2 = await sds_service.assemble_sds(**test_inputs)

    assert sds1["hash"] == sds2["hash"]
```

### Deliverables

- [ ] `backend/services/aggregation/sds_service.py`
- [ ] `backend/services/aggregation/sds_validator.py`
- [ ] `backend/services/aggregation/weight_normalizer.py`
- [ ] `backend/routes/sds_routes.py`
- [ ] Test suite with >90% coverage
- [ ] API documentation (OpenAPI schema)

---

## Work Package 2: Prompt Composition Service

**Agents**: `python-backend-engineer`, `ai-artifacts-engineer`
**Duration**: 1 week
**PRD Reference**: `docs/project_plans/PRDs/prompt.prd.md`

### Overview

The prompt composition service transforms SDS artifacts (style, lyrics, producer notes) into render-ready prompts that:
- Stay under engine character limits (Suno v5: 3800 chars)
- Resolve tag conflicts via conflict matrix
- Normalize living artist references
- Inject section metadata
- Produce deterministic output given a seed

### Implementation Details

#### File Structure

```
backend/services/composition/
├── prompt_composer.py       # Core composition logic
├── tag_orderer.py          # Tag ordering algorithm
├── conflict_resolver.py    # Conflict matrix resolution
├── artist_normalizer.py    # Living artist normalization
├── template_engine.py      # Engine-specific templates
└── tests/
    ├── test_composition.py
    ├── test_tag_ordering.py
    ├── test_conflicts.py
    └── test_determinism.py

backend/routes/
├── prompt_routes.py        # FastAPI endpoints
```

#### Core Composition Algorithm

**File**: `backend/services/composition/prompt_composer.py`

```python
import json
from typing import List, Dict, Optional

class PromptComposer:
    def __init__(self, config_path: str = "limits/suno_v5.json"):
        with open(config_path) as f:
            self.limits = json.load(f)

        self.tag_orderer = TagOrderer()
        self.conflict_resolver = ConflictResolver()
        self.artist_normalizer = ArtistNormalizer()
        self.template_engine = TemplateEngine()

    async def compose_prompt(
        self,
        sds: dict,
        style: dict,
        lyrics: dict,
        producer_notes: dict,
        engine: str = "suno_v5"
    ) -> dict:
        """
        Compose render-ready prompt from SDS artifacts.

        Args:
            sds: Song Design Spec
            style: Style spec artifact
            lyrics: Lyrics artifact
            producer_notes: Producer notes artifact
            engine: Target engine (default: suno_v5)

        Returns:
            {
                "prompt": str,           # Full composed prompt
                "style_tags": [str],     # Ordered, conflict-resolved tags
                "meta_tags": {           # Section metadata
                    "section_name": ["tag1", "tag2"]
                },
                "negative_tags": [str],  # Tags to avoid
                "char_count": int,
                "within_limit": bool,
                "seed": int
            }
        """
        seed = sds["seed"]

        # 1. Extract and order style tags
        raw_tags = self._extract_style_tags(style)
        ordered_tags = self.tag_orderer.order_tags(raw_tags, seed)

        # 2. Resolve conflicts
        resolved_tags = self.conflict_resolver.resolve(ordered_tags)

        # 3. Normalize living artists (if release_mode == public)
        if sds["constraints"]["release_mode"] == "public":
            resolved_tags = self.artist_normalizer.normalize(resolved_tags)

        # 4. Extract negative tags
        negative_tags = style.get("negative_tags", [])

        # 5. Build section metadata tags
        meta_tags = self._build_meta_tags(lyrics, producer_notes)

        # 6. Assemble prompt using template
        template = self.template_engine.get_template(engine)
        prompt = template.render(
            style_tags=resolved_tags,
            lyrics=lyrics,
            meta_tags=meta_tags,
            negative_tags=negative_tags,
            producer_notes=producer_notes
        )

        # 7. Enforce character limit
        char_limit = self.limits[engine]["max_prompt_chars"]
        if len(prompt) > char_limit:
            prompt = self._truncate_prompt(
                prompt, char_limit, resolved_tags, lyrics, meta_tags
            )

        return {
            "prompt": prompt,
            "style_tags": resolved_tags,
            "meta_tags": meta_tags,
            "negative_tags": negative_tags,
            "char_count": len(prompt),
            "within_limit": len(prompt) <= char_limit,
            "seed": seed,
            "engine": engine
        }

    def _extract_style_tags(self, style: dict) -> List[dict]:
        """
        Extract all tags with weights from style spec.

        Returns:
            [{"tag": str, "weight": float, "category": str}]
        """
        tags = []

        # Genre tags
        tags.append({
            "tag": style["primary_genre"],
            "weight": 1.0,
            "category": "genre"
        })
        for sg in style.get("sub_genres", []):
            tags.append({"tag": sg, "weight": 0.6, "category": "genre"})

        # Mood tags
        for mood in style.get("mood", []):
            tags.append({"tag": mood, "weight": 0.8, "category": "mood"})

        # Instrumentation
        for inst in style.get("instrumentation", []):
            tags.append({"tag": inst, "weight": 0.7, "category": "instrumentation"})

        # Vocal style
        if "vocal_style" in style:
            for vs in style["vocal_style"]:
                tags.append({"tag": vs, "weight": 0.8, "category": "vocal"})

        # Custom tags
        for ct in style.get("custom_tags", []):
            tags.append({
                "tag": ct["tag"],
                "weight": ct.get("weight", 0.5),
                "category": "custom"
            })

        return tags

    def _build_meta_tags(self, lyrics: dict, producer_notes: dict) -> Dict[str, List[str]]:
        """
        Build section-specific metadata tags.

        Returns:
            {"verse_1": ["energy: medium", "tempo: steady"], ...}
        """
        meta_tags = {}

        for section in lyrics["sections"]:
            section_name = section["name"]
            tags = []

            # Energy from producer notes
            if "arrangement" in producer_notes:
                energy = producer_notes["arrangement"].get(section_name, {}).get("energy")
                if energy:
                    tags.append(f"energy: {energy}")

            # Vocal direction
            if "vocals" in producer_notes:
                vocal_dir = producer_notes["vocals"].get(section_name, {}).get("direction")
                if vocal_dir:
                    tags.append(f"vocal: {vocal_dir}")

            meta_tags[section_name] = tags

        return meta_tags

    def _truncate_prompt(
        self,
        prompt: str,
        limit: int,
        tags: List[str],
        lyrics: dict,
        meta_tags: dict
    ) -> str:
        """
        Truncate prompt to fit within character limit.
        Priority: keep lyrics > style tags > meta tags
        """
        # Strategy: Drop lowest-weight style tags until within limit
        # (Implement tag dropping logic here)
        return prompt[:limit]  # Simplified
```

#### Tag Ordering Algorithm

**File**: `backend/services/composition/tag_orderer.py`

```python
from typing import List, Dict
import random

class TagOrderer:
    def order_tags(self, tags: List[Dict], seed: int) -> List[str]:
        """
        Order tags deterministically by weight (desc), then lexicographically.

        Args:
            tags: [{"tag": str, "weight": float, "category": str}]
            seed: Determinism seed

        Returns:
            Ordered list of tag strings

        Algorithm:
            1. Sort by weight descending
            2. For equal weights, sort lexicographically (deterministic tie-break)
            3. Apply category grouping (genre → mood → instrumentation → vocal → custom)
        """
        # Category priority order
        category_priority = {
            "genre": 0,
            "mood": 1,
            "instrumentation": 2,
            "vocal": 3,
            "custom": 4
        }

        # Sort by: category priority, weight desc, tag name asc
        sorted_tags = sorted(
            tags,
            key=lambda t: (
                category_priority.get(t["category"], 99),
                -t["weight"],  # Descending
                t["tag"]       # Lexicographic tie-break
            )
        )

        return [t["tag"] for t in sorted_tags]
```

#### Conflict Resolution

**File**: `backend/services/composition/conflict_resolver.py`

```python
import json
from typing import List, Set, Tuple

class ConflictResolver:
    def __init__(self, conflict_matrix_path: str = "taxonomies/conflicts.json"):
        with open(conflict_matrix_path) as f:
            self.conflicts = json.load(f)

        # Build lookup: tag → set of conflicting tags
        self.conflict_map = self._build_conflict_map()

    def _build_conflict_map(self) -> dict:
        """
        Build bidirectional conflict lookup.

        Returns:
            {"tag1": {"tag2", "tag3"}, "tag2": {"tag1"}, ...}
        """
        conflict_map = {}
        for conflict in self.conflicts:
            tag_a = conflict["tag_a"]
            tag_b = conflict["tag_b"]

            if tag_a not in conflict_map:
                conflict_map[tag_a] = set()
            if tag_b not in conflict_map:
                conflict_map[tag_b] = set()

            conflict_map[tag_a].add(tag_b)
            conflict_map[tag_b].add(tag_a)

        return conflict_map

    def resolve(self, tags: List[str]) -> List[str]:
        """
        Resolve conflicts by dropping lower-weight tags.

        Args:
            tags: Ordered list (already sorted by weight desc)

        Returns:
            Conflict-free tag list

        Algorithm:
            1. Iterate through tags in order (highest weight first)
            2. For each tag, check if it conflicts with already-kept tags
            3. If conflict, drop current tag (keep higher-weight tag)
            4. If no conflict, add to kept set
        """
        kept_tags = []
        kept_set = set()

        for tag in tags:
            # Check if this tag conflicts with any kept tag
            conflicts_with_kept = kept_set & self.conflict_map.get(tag, set())

            if conflicts_with_kept:
                # Drop this tag (lower weight)
                continue

            # Keep this tag
            kept_tags.append(tag)
            kept_set.add(tag)

        return kept_tags

    def find_conflicts(self, tags: List[str]) -> List[Tuple[str, str]]:
        """
        Find all conflicting tag pairs in list.

        Returns:
            [(tag_a, tag_b), ...]
        """
        conflicts = []
        tag_set = set(tags)

        for tag in tags:
            conflicting = tag_set & self.conflict_map.get(tag, set())
            for conflict_tag in conflicting:
                # Avoid duplicates (a,b) and (b,a)
                if tag < conflict_tag:
                    conflicts.append((tag, conflict_tag))

        return conflicts
```

**Example conflict matrix**: `taxonomies/conflicts.json`

```json
[
  {"tag_a": "whisper", "tag_b": "anthemic", "reason": "vocal intensity contradiction"},
  {"tag_a": "upbeat", "tag_b": "melancholic", "reason": "mood contradiction"},
  {"tag_a": "acoustic", "tag_b": "heavy synth", "reason": "instrumentation conflict"},
  {"tag_a": "fast tempo", "tag_b": "slow tempo", "reason": "tempo contradiction"}
]
```

#### Living Artist Normalization

**File**: `backend/services/composition/artist_normalizer.py`

```python
import re
from typing import List

class ArtistNormalizer:
    def __init__(self, artist_db_path: str = "taxonomies/living_artists.json"):
        """
        Load database of living artists to normalize.

        Example living_artists.json:
        {
          "Taylor Swift": {"influence": "pop storytelling", "era": "2010s"},
          "Drake": {"influence": "melodic rap", "era": "2010s"}
        }
        """
        with open(artist_db_path) as f:
            self.living_artists = json.load(f)

    def normalize(self, tags: List[str]) -> List[str]:
        """
        Replace "in the style of <living artist>" with generic influence.

        Args:
            tags: List of style tags

        Returns:
            Normalized tags (living artists replaced)

        Policy:
            For public release, replace specific artist mentions with:
            - Genre-based influence
            - Era-based influence
            - Generic style descriptors
        """
        normalized = []

        for tag in tags:
            # Detect "in the style of X" pattern
            match = re.match(r"in the style of (.+)", tag, re.IGNORECASE)
            if match:
                artist = match.group(1).strip()

                # Check if living artist
                if artist in self.living_artists:
                    # Replace with generic influence
                    influence = self.living_artists[artist]["influence"]
                    normalized.append(influence)
                    continue

            # Keep tag as-is
            normalized.append(tag)

        return normalized
```

#### Template Engine

**File**: `backend/services/composition/template_engine.py`

```python
from jinja2 import Template

class TemplateEngine:
    def __init__(self):
        self.templates = {
            "suno_v5": self._load_suno_v5_template()
        }

    def get_template(self, engine: str) -> Template:
        """Get Jinja2 template for engine."""
        if engine not in self.templates:
            raise ValueError(f"Unknown engine: {engine}")
        return self.templates[engine]

    def _load_suno_v5_template(self) -> Template:
        """
        Suno v5 prompt template.

        Format:
        [Style Tags]

        [Verse 1]
        <lyrics>
        [meta: energy=high, vocal=smooth]

        [Chorus]
        <lyrics>
        [meta: energy=peak, vocal=powerful]

        [Negative: <tags>]
        """
        template_str = """
{%- for tag in style_tags -%}
{{ tag }}{{ ", " if not loop.last else "" }}
{%- endfor %}

{% for section in lyrics.sections -%}
[{{ section.name }}]
{{ section.text }}
{%- if section.name in meta_tags and meta_tags[section.name] %}
[meta: {{ meta_tags[section.name]|join(", ") }}]
{%- endif %}

{% endfor %}

{%- if negative_tags %}
[Negative: {{ negative_tags|join(", ") }}]
{%- endif %}
""".strip()

        return Template(template_str)
```

#### Character Counting

**File**: `limits/suno_v5.json`

```json
{
  "engine": "suno_v5",
  "max_prompt_chars": 3800,
  "max_style_tags": 20,
  "max_negative_tags": 10,
  "max_duration_s": 240,
  "supported_keys": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  "bpm_range": [60, 200]
}
```

### Determinism Implementation

**Key strategies**:

1. **Tag Ordering**: Deterministic sort (weight desc, then lexicographic)
2. **Conflict Resolution**: Process tags in order (no randomness)
3. **Template Rendering**: Fixed Jinja2 template (no conditional randomness)
4. **Truncation**: Drop lowest-weight tags first (deterministic priority)

**Verification**:

```python
@pytest.mark.asyncio
async def test_deterministic_composition(prompt_composer, sds, artifacts):
    """Same SDS + artifacts → same prompt."""
    prompt1 = await prompt_composer.compose_prompt(sds, **artifacts)
    prompt2 = await prompt_composer.compose_prompt(sds, **artifacts)

    assert prompt1["prompt"] == prompt2["prompt"]
    assert prompt1["style_tags"] == prompt2["style_tags"]
    assert prompt1["char_count"] == prompt2["char_count"]
```

### FastAPI Endpoints

**File**: `backend/routes/prompt_routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/compose", tags=["Composition"])

class ComposeRequest(BaseModel):
    sds_id: str
    engine: str = "suno_v5"

@router.post("/prompt")
async def compose_prompt(
    request: ComposeRequest,
    composer: PromptComposer = Depends(get_prompt_composer),
    sds_service: SDSService = Depends(get_sds_service)
):
    """
    Compose render-ready prompt from SDS.

    Returns:
        {
            "prompt": str,
            "style_tags": [str],
            "meta_tags": dict,
            "negative_tags": [str],
            "char_count": int,
            "within_limit": bool
        }
    """
    # Load SDS
    sds = await sds_service.get_sds(request.sds_id)
    if not sds:
        raise HTTPException(status_code=404, detail="SDS not found")

    # Load artifacts
    style = await load_artifact("styles", sds["entities"]["style"])
    lyrics = await load_artifact("lyrics", sds["entities"]["lyrics"])
    producer_notes = await load_artifact("producer_notes", sds["entities"]["producer_notes"])

    # Compose prompt
    prompt = await composer.compose_prompt(
        sds=sds,
        style=style,
        lyrics=lyrics,
        producer_notes=producer_notes,
        engine=request.engine
    )

    return prompt

@router.post("/validate")
async def validate_prompt(
    prompt: str,
    engine: str = "suno_v5",
    composer: PromptComposer = Depends(get_prompt_composer)
):
    """
    Validate prompt against engine limits.

    Returns:
        {
            "valid": bool,
            "char_count": int,
            "limit": int,
            "over_by": int | None,
            "conflicts": [(tag_a, tag_b)]
        }
    """
    char_limit = composer.limits[engine]["max_prompt_chars"]
    char_count = len(prompt)

    return {
        "valid": char_count <= char_limit,
        "char_count": char_count,
        "limit": char_limit,
        "over_by": char_count - char_limit if char_count > char_limit else None
    }
```

### Test Examples

**File**: `backend/services/composition/tests/test_composition.py`

```python
import pytest

@pytest.mark.asyncio
async def test_compose_within_limit(prompt_composer, test_sds, test_artifacts):
    """Test prompt composition stays under character limit."""
    result = await prompt_composer.compose_prompt(
        sds=test_sds,
        style=test_artifacts["style"],
        lyrics=test_artifacts["lyrics"],
        producer_notes=test_artifacts["producer_notes"]
    )

    assert result["within_limit"] is True
    assert result["char_count"] <= 3800

@pytest.mark.asyncio
async def test_conflict_resolution(prompt_composer):
    """Test conflicting tags are resolved."""
    style_with_conflicts = {
        "primary_genre": "pop",
        "mood": ["upbeat", "melancholic"],  # Conflict
        "vocal_style": ["whisper", "anthemic"]  # Conflict
    }

    result = await prompt_composer.compose_prompt(
        sds=test_sds,
        style=style_with_conflicts,
        lyrics=test_lyrics,
        producer_notes=test_producer_notes
    )

    # Verify conflicts removed (higher weight kept)
    tags = result["style_tags"]
    assert "upbeat" in tags and "melancholic" not in tags
    assert "anthemic" in tags and "whisper" not in tags

@pytest.mark.asyncio
async def test_living_artist_normalization(prompt_composer, test_sds):
    """Test living artists normalized for public release."""
    test_sds["constraints"]["release_mode"] = "public"
    style_with_artist = {
        "primary_genre": "pop",
        "custom_tags": [
            {"tag": "in the style of Taylor Swift", "weight": 0.8}
        ]
    }

    result = await prompt_composer.compose_prompt(
        sds=test_sds,
        style=style_with_artist,
        lyrics=test_lyrics,
        producer_notes=test_producer_notes
    )

    # Verify artist replaced with generic influence
    assert "Taylor Swift" not in result["prompt"]
    assert "pop storytelling" in result["style_tags"]
```

### Deliverables

- [ ] `backend/services/composition/prompt_composer.py`
- [ ] `backend/services/composition/tag_orderer.py`
- [ ] `backend/services/composition/conflict_resolver.py`
- [ ] `backend/services/composition/artist_normalizer.py`
- [ ] `backend/services/composition/template_engine.py`
- [ ] `backend/routes/prompt_routes.py`
- [ ] `taxonomies/conflicts.json`
- [ ] `taxonomies/living_artists.json`
- [ ] `limits/suno_v5.json`
- [ ] Test suite with >90% coverage

---

## Integration Points

### Phase 1 → Phase 2

**Dependencies**:
- All entity CRUD endpoints operational
- Entity validation services available
- Database schema supports entity relationships

**Integration**:
```python
# SDS service consumes Phase 1 entities
personas = await persona_service.get_by_ids(persona_ids)
blueprint = await blueprint_service.get(blueprint_id)
style = await style_service.get(style_id)
lyrics = await lyrics_service.get(lyrics_id)
producer_notes = await producer_notes_service.get(producer_notes_id)
sources = await source_service.get_by_ids(source_ids)
```

### Phase 2 → Phase 3

**Outputs**:
- Validated SDS for orchestration consumption
- Composed prompts ready for render connectors
- Deterministic artifacts for reproducibility

**Contract**:
```python
# Orchestrator consumes Phase 2 outputs
sds = await sds_service.get_sds(song_id)
prompt = await prompt_composer.compose_prompt(sds, style, lyrics, producer_notes)

# Ready for Phase 3 workflow nodes
await orchestrator.execute_workflow(sds, prompt)
```

---

## Testing Strategy

### Unit Tests

**SDS Service**:
- Assembly with valid entities
- Missing entity detection
- Weight normalization (sum to 1.0)
- Seed validation
- Hash determinism
- Cross-entity consistency checks

**Prompt Composer**:
- Tag ordering (weight desc, lexicographic tie-break)
- Conflict resolution (drop lower weight)
- Living artist normalization (public release)
- Character limit enforcement
- Template rendering
- Determinism (same inputs → same output)

### Integration Tests

**SDS → Prompt Flow**:
```python
@pytest.mark.asyncio
async def test_sds_to_prompt_flow():
    """Test full flow: entities → SDS → prompt."""
    # 1. Create entities
    persona_id = await create_test_persona()
    blueprint_id = await create_test_blueprint()
    style_id = await create_test_style()
    lyrics_id = await create_test_lyrics()
    producer_notes_id = await create_test_producer_notes()

    # 2. Assemble SDS
    sds = await sds_service.assemble_sds(
        song_id="integration-test-1",
        persona_ids=[persona_id],
        blueprint_id=blueprint_id,
        style_id=style_id,
        lyrics_id=lyrics_id,
        producer_notes_id=producer_notes_id,
        source_configs=[],
        constraints={"explicit": False},
        seed=12345
    )

    # 3. Compose prompt
    style = await style_service.get(style_id)
    lyrics = await lyrics_service.get(lyrics_id)
    producer_notes = await producer_notes_service.get(producer_notes_id)

    prompt = await prompt_composer.compose_prompt(sds, style, lyrics, producer_notes)

    # 4. Validate
    assert prompt["within_limit"] is True
    assert len(prompt["style_tags"]) > 0
    assert prompt["char_count"] <= 3800
```

### Determinism Tests

**Reproducibility**:
```python
@pytest.mark.asyncio
async def test_reproducibility():
    """Test 10 identical runs produce identical outputs."""
    inputs = {
        "song_id": "repro-test",
        "persona_ids": [test_persona_id],
        "blueprint_id": test_blueprint_id,
        # ... all inputs
        "seed": 99999
    }

    results = []
    for i in range(10):
        sds = await sds_service.assemble_sds(**inputs)
        prompt = await prompt_composer.compose_prompt(sds, style, lyrics, producer_notes)
        results.append((sds["hash"], prompt["prompt"]))

    # All hashes identical
    hashes = [r[0] for r in results]
    assert len(set(hashes)) == 1

    # All prompts identical
    prompts = [r[1] for r in results]
    assert len(set(prompts)) == 1
```

### Performance Tests

**Latency**:
```python
@pytest.mark.asyncio
async def test_composition_latency():
    """Ensure SDS → prompt under 2s."""
    start = time.time()

    sds = await sds_service.assemble_sds(**test_inputs)
    prompt = await prompt_composer.compose_prompt(sds, style, lyrics, producer_notes)

    duration = time.time() - start
    assert duration < 2.0  # P95 target
```

---

## Success Criteria

### Functional

- [ ] SDS validates all entity references exist
- [ ] Source weights normalized to 1.0 (tolerance: 0.0001)
- [ ] SDS cross-entity consistency checks pass
- [ ] Prompts stay under engine limits (100% compliance on test suite)
- [ ] Tag conflicts resolved via conflict matrix
- [ ] Living artists normalized when `release_mode == "public"`
- [ ] Section metadata injected correctly

### Determinism

- [ ] Same SDS inputs → same hash (100% reproducibility over 10 runs)
- [ ] Same artifacts → same prompt (100% reproducibility over 10 runs)
- [ ] Tag ordering deterministic (weight desc, lexicographic tie-break)
- [ ] Conflict resolution deterministic (no randomness)

### Performance

- [ ] SDS assembly: P95 < 500ms
- [ ] Prompt composition: P95 < 1s
- [ ] Full SDS → prompt flow: P95 < 2s

### Quality

- [ ] Test coverage >90%
- [ ] No high-severity security issues
- [ ] API documentation complete (OpenAPI)
- [ ] Error messages actionable

---

## Exit Criteria

### Phase 2 Complete When:

1. **SDS Service Operational**:
   - [ ] CRUD endpoints functional
   - [ ] Validation catches missing/invalid entities
   - [ ] Weight normalization tested
   - [ ] Preview endpoint returns entity-enriched SDS

2. **Prompt Composer Operational**:
   - [ ] Tag ordering deterministic
   - [ ] Conflict resolution working
   - [ ] Character limits enforced
   - [ ] Templates render correctly
   - [ ] Living artist normalization implemented

3. **Integration Ready**:
   - [ ] SDS → Prompt flow tested end-to-end
   - [ ] Determinism verified (≥99% reproducibility)
   - [ ] Performance targets met (P95 < 2s)

4. **Documentation Complete**:
   - [ ] API endpoints documented (OpenAPI)
   - [ ] Algorithm descriptions clear
   - [ ] Example requests/responses provided

5. **Ready for Phase 3**:
   - [ ] Orchestrator can consume SDS
   - [ ] Composed prompts ready for render connectors
   - [ ] Event schemas defined for workflow nodes

---

## Risks & Mitigations

### Risk: Prompt Truncation Loses Critical Information

**Mitigation**:
- Prioritize lyrics over tags when truncating
- Emit warning events when truncation occurs
- Allow manual prompt editing as escape hatch

### Risk: Tag Conflicts Undetected

**Mitigation**:
- Comprehensive conflict matrix coverage
- Validation endpoint to check conflicts before composition
- Manual override for edge cases

### Risk: Living Artist Database Incomplete

**Mitigation**:
- Start with top 500 artists by streaming volume
- Pattern matching for "in the style of" variants
- Fallback to generic genre influence if not in DB

### Risk: Determinism Breaks Due to External Dependencies

**Mitigation**:
- Pin all retrieval to logged hashes
- Use lexicographic sorting for tie-breaks
- Avoid any randomness in tag processing
- Test reproducibility in CI pipeline

---

## Next Phase Preview

**Phase 3: Workflow Orchestration** will consume Phase 2 outputs to:
- Execute PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE workflow
- Implement fix loops (max 3 iterations)
- Emit structured events for observability
- Persist node outputs to `runs/{song_id}/{run_id}/`

**Handoff Requirements**:
- SDS schema stable (no breaking changes)
- Prompt schema stable
- Composition API endpoints frozen
- Event schemas defined for orchestrator consumption
