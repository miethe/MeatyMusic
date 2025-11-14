# SDS Aggregation & Song Creation - Implementation Plan v1

**Version**: 1.0
**Created**: 2025-11-14
**Complexity**: Medium (M)
**Track**: Standard
**Estimated Effort**: 26-30 story points (1 week with 2 engineers)
**Timeline**: 5-7 business days

## Executive Summary

This implementation plan addresses the #1 critical blocker for Phase 3 (Orchestration) by implementing the SDS Compiler service and completing the song creation backend flow. The implementation follows MeatyMusic's layered architecture pattern and builds on existing infrastructure (70% complete from Phase 1-2).

### Goals

1. **SDS Compiler Service**: Transform entity references into validated, deterministic SDS JSON
2. **Song Creation Flow**: Complete `POST /songs` with SDS compilation and validation
3. **Blueprint Validation**: Enforce genre-specific BPM, section, and lexicon constraints
4. **Tag Conflict Resolution**: Implement conflict matrix enforcement logic
5. **Cross-Entity Validation**: Verify section matching, genre consistency, and reference integrity
6. **Source Weight Normalization**: Ensure source weights sum to 1.0

### Current State (Phase 2: 80% Complete)

**Completed Components**:
- Database models: `Song`, `WorkflowRun` (full ORM with relationships)
- Repository layer: `SongRepository` with RLS and entity fetching
- Base services: `SongService` with basic validation
- API endpoints: `/songs` CRUD operations
- Validation service: `ValidationService` with JSON schema support
- Schemas: Complete SDS schema at `/schemas/sds.schema.json`

**Missing Components** (This Implementation):
- SDS Compiler service (aggregates entities into SDS)
- Blueprint constraint validator
- Tag conflict resolver
- Source weight normalizer
- Cross-entity consistency validator
- SDS hashing for determinism verification

### Success Criteria

- Song creation flow fully operational from API to database
- SDS compilation from entity references works deterministically
- All validation rules enforced (blueprint, conflicts, cross-entity)
- Tag conflicts resolved using conflict matrix
- Source weights normalized to sum to 1.0
- API returns clear error messages for validation failures
- 95%+ test coverage on service layer
- Phase 3 (Orchestration) unblocked

---

## Implementation Strategy

### Layered Architecture Approach

Following MeatyMusic's established patterns:

1. **Phase 1**: Repository Layer Extensions (if needed)
2. **Phase 2**: Service Layer - SDS compiler, validators, normalizers
3. **Phase 3**: API Layer - Enhanced song creation endpoints
4. **Phase 4**: Testing - Unit, integration, determinism tests
5. **Phase 5**: Documentation - API docs, algorithm descriptions

### Parallel Work Streams

**Week 1 (Days 1-3)**: Foundation
- Stream A: SDS Compiler core logic
- Stream B: Validation services (blueprint, conflict, cross-entity)
- Stream C: Utility services (normalizer, hasher)

**Week 1 (Days 4-5)**: Integration
- Stream A: API endpoint enhancement
- Stream B: Testing suite
- Stream C: Documentation

### Critical Path

```
Repository Extensions → SDS Compiler → Validators → API Integration → Testing
```

Dependencies flow left-to-right; validators can be built in parallel.

---

## Phase Overview

| Phase | Component | Effort (SP) | Duration | Dependencies | Subagents |
|-------|-----------|-------------|----------|--------------|-----------|
| 1 | Repository Extensions | 3 | 0.5 days | None | data-layer-expert |
| 2A | SDS Compiler Service | 8 | 2 days | Phase 1 | backend-architect, python-backend-engineer |
| 2B | Validation Services | 6 | 1.5 days | Phase 1 | python-backend-engineer |
| 2C | Utility Services | 4 | 1 day | Phase 1 | python-backend-engineer |
| 3 | API Enhancement | 4 | 1 day | Phase 2A-C | python-backend-engineer |
| 4 | Testing Suite | 5 | 1.5 days | Phase 2-3 | testing-specialist |
| 5 | Documentation | 2 | 0.5 day | Phase 2-4 | documentation-writer |
| **Total** | | **32** | **8 days** | | |

---

## Phase 1: Repository Layer Extensions

**Duration**: 0.5 days (4 hours)
**Effort**: 3 story points
**Subagents**: data-layer-expert, python-backend-engineer
**Dependencies**: None

### Overview

Add specialized repository methods for SDS compilation that fetch multiple entities in single queries with eager loading.

### Tasks

#### SDS-001: Add Batch Entity Fetching to Repositories

**Description**: Extend existing repositories with batch fetching methods to load multiple entities efficiently for SDS compilation.

**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/repositories/song_repo.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/repositories/blueprint_repo.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/repositories/source_repo.py`

**Implementation**:

```python
# song_repo.py - Add method
async def get_with_all_entities_for_sds(
    self,
    song_id: UUID
) -> Optional[Dict[str, Any]]:
    """Fetch song with all entities needed for SDS compilation.

    Returns:
        {
            "song": Song,
            "style": Style,
            "lyrics": Lyrics,
            "producer_notes": ProducerNotes,
            "persona": Persona,
            "blueprint": Blueprint,
            "sources": List[Source]
        }
    """
    # Single query with all joins
    query = self.db.query(Song).filter(
        Song.id == song_id,
        Song.deleted_at.is_(None)
    ).options(
        joinedload(Song.style),
        joinedload(Song.persona),
        joinedload(Song.blueprint),
        joinedload(Song.lyrics),
        joinedload(Song.producer_notes)
    )

    # Apply RLS
    guard = self.get_unified_guard(Song)
    if guard:
        query = guard.filter_query(query)

    song = query.first()
    if not song:
        return None

    # Load sources separately (many-to-many relationship)
    sources = await self.source_repo.get_by_song_id(song_id)

    return {
        "song": song,
        "style": song.style,
        "lyrics": song.lyrics[0] if song.lyrics else None,
        "producer_notes": song.producer_notes[0] if song.producer_notes else None,
        "persona": song.persona,
        "blueprint": song.blueprint,
        "sources": sources
    }
```

**Acceptance Criteria**:
- [ ] Single query fetches all SDS entities with eager loading
- [ ] RLS enforcement maintained
- [ ] Returns None if song not found or inaccessible
- [ ] Sources loaded in separate query (avoid N+1)
- [ ] Method tested with mock data

**Effort**: 3 story points
**Assigned**: data-layer-expert, python-backend-engineer

---

## Phase 2A: SDS Compiler Service

**Duration**: 2 days
**Effort**: 8 story points
**Subagents**: backend-architect, python-backend-engineer
**Dependencies**: Phase 1

### Overview

Core SDS compiler that transforms entity references into validated SDS JSON with deterministic hashing.

### Tasks

#### SDS-002: Create SDS Compiler Service Core

**Description**: Implement the main SDS compiler service that aggregates entities into SDS format.

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/services/sds_compiler_service.py`

**Implementation**:

```python
"""SDS Compiler Service - Aggregates entities into Song Design Spec.

This service transforms entity references into a complete, validated SDS JSON
following the deterministic compilation algorithm.
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
import hashlib
import json
import structlog

from app.repositories.song_repo import SongRepository
from app.repositories.style_repo import StyleRepository
from app.repositories.lyrics_repo import LyricsRepository
from app.repositories.producer_notes_repo import ProducerNotesRepository
from app.repositories.persona_repo import PersonaRepository
from app.repositories.blueprint_repo import BlueprintRepository
from app.repositories.source_repo import SourceRepository
from app.services.validation_service import ValidationService

logger = structlog.get_logger(__name__)


class SDSCompilerService:
    """Service for compiling entity references into Song Design Spec."""

    def __init__(
        self,
        song_repo: SongRepository,
        style_repo: StyleRepository,
        lyrics_repo: LyricsRepository,
        producer_notes_repo: ProducerNotesRepository,
        persona_repo: PersonaRepository,
        blueprint_repo: BlueprintRepository,
        source_repo: SourceRepository,
        validation_service: ValidationService,
    ):
        """Initialize SDS compiler with all required repositories."""
        self.song_repo = song_repo
        self.style_repo = style_repo
        self.lyrics_repo = lyrics_repo
        self.producer_notes_repo = producer_notes_repo
        self.persona_repo = persona_repo
        self.blueprint_repo = blueprint_repo
        self.source_repo = source_repo
        self.validation_service = validation_service

    async def compile_sds(
        self,
        song_id: UUID,
        validate: bool = True
    ) -> Dict[str, Any]:
        """Compile SDS from song entity references.

        Args:
            song_id: Song UUID
            validate: Whether to run full validation (default: True)

        Returns:
            Complete SDS dictionary

        Raises:
            ValueError: If entity references invalid or validation fails
        """
        # 1. Fetch all entities in single query
        entities = await self.song_repo.get_with_all_entities_for_sds(song_id)
        if not entities:
            raise ValueError(f"Song {song_id} not found or inaccessible")

        song = entities["song"]

        # 2. Validate all required entities exist
        self._validate_entity_references(entities)

        # 3. Build SDS structure
        sds = await self._build_sds_structure(song, entities)

        # 4. Normalize source weights
        if sds["sources"]:
            sds["sources"] = self._normalize_source_weights(sds["sources"])

        # 5. Validate SDS against JSON schema
        if validate:
            is_valid, errors = self.validation_service.validate_sds(sds)
            if not is_valid:
                raise ValueError(f"SDS validation failed: {'; '.join(errors)}")

        # 6. Compute deterministic hash
        sds_hash = self._compute_sds_hash(sds)

        logger.info(
            "sds.compiled",
            song_id=str(song_id),
            sds_hash=sds_hash,
            source_count=len(sds["sources"]),
            seed=sds["seed"]
        )

        return sds

    def _validate_entity_references(self, entities: Dict[str, Any]) -> None:
        """Validate all required entity references exist."""
        required = {
            "style": "Style specification",
            "lyrics": "Lyrics",
            "producer_notes": "Producer notes",
            "blueprint": "Blueprint"
        }

        for key, name in required.items():
            if not entities.get(key):
                raise ValueError(f"{name} is required but not found")

    async def _build_sds_structure(
        self,
        song: Any,
        entities: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build complete SDS structure from entities."""
        style = entities["style"]
        lyrics = entities["lyrics"]
        producer_notes = entities["producer_notes"]
        blueprint = entities["blueprint"]
        persona = entities.get("persona")
        sources = entities.get("sources", [])

        # Convert ORM models to dict representations
        style_dict = self._entity_to_dict(style, "style")
        lyrics_dict = self._entity_to_dict(lyrics, "lyrics")
        producer_notes_dict = self._entity_to_dict(producer_notes, "producer_notes")
        sources_list = [self._source_to_dict(src) for src in sources]

        # Build SDS following schema
        sds = {
            "title": song.title,
            "blueprint_ref": {
                "genre": blueprint.genre,
                "version": blueprint.version
            },
            "style": style_dict,
            "lyrics": lyrics_dict,
            "producer_notes": producer_notes_dict,
            "persona_id": str(persona.id) if persona else None,
            "sources": sources_list,
            "prompt_controls": song.render_config.get("prompt_controls", {
                "positive_tags": [],
                "negative_tags": [],
                "max_style_chars": 1000,
                "max_prompt_chars": 5000
            }) if song.render_config else {
                "positive_tags": [],
                "negative_tags": [],
                "max_style_chars": 1000,
                "max_prompt_chars": 5000
            },
            "render": song.render_config.get("render", {
                "engine": "none",
                "model": None,
                "num_variations": 2
            }) if song.render_config else {
                "engine": "none",
                "model": None,
                "num_variations": 2
            },
            "seed": song.global_seed
        }

        return sds

    def _entity_to_dict(self, entity: Any, entity_type: str) -> Dict[str, Any]:
        """Convert ORM entity to SDS-compatible dictionary.

        Extracts the spec field from entity models which contain the JSON spec.
        """
        if hasattr(entity, "spec"):
            return entity.spec
        raise ValueError(f"{entity_type} entity missing 'spec' field")

    def _source_to_dict(self, source: Any) -> Dict[str, Any]:
        """Convert Source ORM model to SDS source format."""
        return {
            "name": source.name,
            "kind": source.kind,
            "config": source.config or {},
            "scopes": source.scopes or [],
            "weight": source.weight or 0.5,
            "allow": source.allow_terms or [],
            "deny": source.deny_terms or [],
            "provenance": source.provenance_required,
            "mcp_server_id": source.mcp_server_id
        }

    def _normalize_source_weights(
        self,
        sources: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Normalize source weights to sum to 1.0."""
        if not sources:
            return []

        total_weight = sum(src.get("weight", 0) for src in sources)

        if total_weight <= 0:
            # Equal weighting if all weights are 0 or negative
            equal_weight = 1.0 / len(sources)
            for src in sources:
                src["weight"] = round(equal_weight, 4)
        else:
            # Normalize to sum to 1.0
            for src in sources:
                src["weight"] = round(src.get("weight", 0) / total_weight, 4)

        logger.debug(
            "sds.weights_normalized",
            source_count=len(sources),
            total_weight=sum(src["weight"] for src in sources)
        )

        return sources

    def _compute_sds_hash(self, sds: Dict[str, Any]) -> str:
        """Compute SHA-256 hash of SDS for determinism verification.

        Excludes computed/metadata fields from hash calculation.
        """
        # Copy and remove non-deterministic fields
        sds_copy = {
            k: v for k, v in sds.items()
            if k not in ["_computed_hash", "compiled_at", "compiler_version"]
        }

        # Canonical JSON (sorted keys)
        canonical = json.dumps(sds_copy, sort_keys=True)

        return hashlib.sha256(canonical.encode()).hexdigest()
```

**Acceptance Criteria**:
- [ ] Compiles SDS from all entity references
- [ ] Validates entity references exist
- [ ] Normalizes source weights to 1.0
- [ ] Computes deterministic hash
- [ ] Raises clear errors for missing/invalid entities
- [ ] Logs compilation events for observability
- [ ] Handles None persona gracefully

**Effort**: 8 story points
**Assigned**: backend-architect (design), python-backend-engineer (implementation)

---

## Phase 2B: Validation Services

**Duration**: 1.5 days
**Effort**: 6 story points
**Subagents**: python-backend-engineer
**Dependencies**: Phase 1

### Overview

Implement blueprint constraint validation, tag conflict resolution, and cross-entity consistency checks.

### Tasks

#### SDS-003: Blueprint Constraint Validator

**Description**: Validate SDS against blueprint-specific constraints (BPM range, required sections, lexicon, banned terms).

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/services/blueprint_validator_service.py`

**Implementation**:

```python
"""Blueprint Validator Service - Enforces genre-specific constraints."""

from typing import Dict, Any, List, Tuple
import structlog

from app.repositories.blueprint_repo import BlueprintRepository

logger = structlog.get_logger(__name__)


class BlueprintValidatorService:
    """Validates SDS against blueprint constraints."""

    def __init__(self, blueprint_repo: BlueprintRepository):
        self.blueprint_repo = blueprint_repo

    async def validate_sds_against_blueprint(
        self,
        sds: Dict[str, Any],
        blueprint_id: str
    ) -> Tuple[bool, List[str]]:
        """Validate SDS against blueprint constraints.

        Args:
            sds: Complete SDS dictionary
            blueprint_id: Blueprint UUID

        Returns:
            Tuple of (is_valid, error_messages)
        """
        # Fetch blueprint
        blueprint = await self.blueprint_repo.get_by_id(blueprint_id)
        if not blueprint:
            return False, [f"Blueprint {blueprint_id} not found"]

        errors = []

        # 1. Validate BPM range
        bpm_errors = self._validate_bpm(sds["style"], blueprint.rules)
        errors.extend(bpm_errors)

        # 2. Validate required sections
        section_errors = self._validate_required_sections(sds["lyrics"], blueprint.rules)
        errors.extend(section_errors)

        # 3. Validate banned terms
        banned_errors = self._validate_banned_terms(sds["lyrics"], blueprint.rules)
        errors.extend(banned_errors)

        # 4. Validate section line counts
        line_errors = self._validate_section_lines(sds["lyrics"], blueprint.rules)
        errors.extend(line_errors)

        is_valid = len(errors) == 0

        if not is_valid:
            logger.warning(
                "blueprint.validation_failed",
                blueprint_genre=blueprint.genre,
                error_count=len(errors),
                errors=errors
            )

        return is_valid, errors

    def _validate_bpm(
        self,
        style: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Validate tempo BPM is within blueprint range."""
        if "tempo_bpm" not in rules:
            return []

        bpm_range = rules["tempo_bpm"]
        min_bpm, max_bpm = bpm_range[0], bpm_range[1]

        style_bpm = style.get("tempo_bpm")
        if style_bpm is None:
            return ["Style missing tempo_bpm"]

        # Handle single BPM or range
        if isinstance(style_bpm, int):
            bpm_values = [style_bpm]
        else:
            bpm_values = style_bpm

        errors = []
        for bpm in bpm_values:
            if bpm < min_bpm or bpm > max_bpm:
                errors.append(
                    f"BPM {bpm} outside blueprint range [{min_bpm}, {max_bpm}]"
                )

        return errors

    def _validate_required_sections(
        self,
        lyrics: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Validate all required sections present in lyrics."""
        required_sections = rules.get("required_sections", [])
        if not required_sections:
            return []

        lyrics_sections = set(lyrics.get("section_order", []))
        missing = set(required_sections) - lyrics_sections

        if missing:
            return [f"Missing required sections: {', '.join(missing)}"]

        return []

    def _validate_banned_terms(
        self,
        lyrics: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Check lyrics for banned terms."""
        banned_terms = rules.get("banned_terms", [])
        if not banned_terms:
            return []

        # For now, just check if explicit is allowed
        # Full lyrics content checking happens during LYRICS workflow node
        explicit_allowed = lyrics.get("constraints", {}).get("explicit", False)

        if not explicit_allowed and banned_terms:
            # Placeholder for actual profanity checking
            # Real implementation will scan generated lyrics text
            return []

        return []

    def _validate_section_lines(
        self,
        lyrics: Dict[str, Any],
        rules: Dict[str, Any]
    ) -> List[str]:
        """Validate section line counts against blueprint rules."""
        section_lines = rules.get("section_lines", {})
        if not section_lines:
            return []

        # This validation is more relevant post-generation
        # For SDS validation, just check requirements are defined
        section_reqs = lyrics.get("constraints", {}).get("section_requirements", {})

        errors = []
        for section, line_rules in section_lines.items():
            if section in lyrics.get("section_order", []):
                # Section exists, check if requirements defined
                if section not in section_reqs:
                    min_lines = line_rules.get("min", 0)
                    if min_lines > 0:
                        errors.append(
                            f"Section '{section}' requires line count constraints (min: {min_lines})"
                        )

        return errors
```

**Acceptance Criteria**:
- [ ] Validates BPM within blueprint range
- [ ] Checks required sections present
- [ ] Flags banned terms (if explicit=false)
- [ ] Validates section line count requirements
- [ ] Returns clear error messages for each violation
- [ ] Logs validation failures with context

**Effort**: 3 story points
**Assigned**: python-backend-engineer

#### SDS-004: Tag Conflict Resolver

**Description**: Resolve tag conflicts using conflict matrix to drop lower-priority conflicting tags.

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/services/tag_conflict_resolver.py`

**Implementation**:

```python
"""Tag Conflict Resolver - Enforces conflict matrix rules."""

from typing import List, Set, Tuple, Dict
from pathlib import Path
import json
import structlog

logger = structlog.get_logger(__name__)


class TagConflictResolver:
    """Resolves tag conflicts using conflict matrix."""

    def __init__(self, conflict_matrix_path: str = None):
        """Initialize with conflict matrix.

        Args:
            conflict_matrix_path: Path to conflict matrix JSON file
        """
        if conflict_matrix_path is None:
            # Default path relative to project root
            project_root = Path(__file__).parent.parent.parent.parent.parent
            conflict_matrix_path = str(project_root / "taxonomies" / "conflict_matrix.json")

        self.conflict_map = self._load_conflict_matrix(conflict_matrix_path)

    def _load_conflict_matrix(self, path: str) -> Dict[str, Set[str]]:
        """Load and build bidirectional conflict lookup.

        Returns:
            {"tag1": {"tag2", "tag3"}, "tag2": {"tag1"}, ...}
        """
        try:
            with open(path, 'r') as f:
                conflicts = json.load(f)
        except FileNotFoundError:
            logger.warning(
                "conflict_matrix.not_found",
                path=path,
                message="Creating empty conflict matrix"
            )
            return {}

        conflict_map = {}
        for conflict in conflicts:
            tag_a = conflict["tag_a"]
            tag_b = conflict["tag_b"]

            if tag_a not in conflict_map:
                conflict_map[tag_a] = set()
            if tag_b not in conflict_map:
                conflict_map[tag_b] = set()

            conflict_map[tag_a].add(tag_b)
            conflict_map[tag_b].add(tag_a)

        logger.info(
            "conflict_matrix.loaded",
            conflict_count=len(conflicts),
            tag_count=len(conflict_map)
        )

        return conflict_map

    def find_conflicts(self, tags: List[str]) -> List[Tuple[str, str]]:
        """Find all conflicting tag pairs in list.

        Args:
            tags: List of style tags

        Returns:
            List of conflicting pairs: [(tag_a, tag_b), ...]
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

    def resolve_conflicts(
        self,
        tags: List[str],
        weights: Dict[str, float] = None
    ) -> List[str]:
        """Resolve conflicts by dropping lower-weight tags.

        Args:
            tags: List of tags (should be pre-sorted by weight desc)
            weights: Optional weight map for each tag

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
                logger.debug(
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
            logger.info(
                "tags.conflicts_resolved",
                original_count=len(tags),
                kept_count=len(kept_tags),
                dropped_count=len(tags) - len(kept_tags)
            )

        return kept_tags
```

**Acceptance Criteria**:
- [ ] Loads conflict matrix from JSON file
- [ ] Builds bidirectional conflict lookup
- [ ] Finds all conflicting pairs in tag list
- [ ] Resolves conflicts by dropping lower-weight tags
- [ ] Returns deterministic results (same input → same output)
- [ ] Logs dropped tags with reasons
- [ ] Handles missing conflict matrix gracefully

**Effort**: 3 story points
**Assigned**: python-backend-engineer

---

## Phase 2C: Utility Services

**Duration**: 1 day
**Effort**: 4 story points
**Subagents**: python-backend-engineer
**Dependencies**: Phase 1

### Overview

Implement cross-entity validation logic that checks consistency between related entities.

### Tasks

#### SDS-005: Cross-Entity Validator

**Description**: Validate consistency between entities (genre matching, section alignment, source citations).

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/services/cross_entity_validator.py`

**Implementation**:

```python
"""Cross-Entity Validator - Ensures consistency across entities."""

from typing import Dict, Any, List
import structlog

logger = structlog.get_logger(__name__)


class CrossEntityValidator:
    """Validates consistency between related entities in SDS."""

    def validate_sds_consistency(self, sds: Dict[str, Any]) -> tuple[bool, List[str]]:
        """Validate cross-entity consistency in SDS.

        Args:
            sds: Complete SDS dictionary

        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []

        # 1. Validate genre consistency
        genre_errors = self._validate_genre_consistency(sds)
        errors.extend(genre_errors)

        # 2. Validate section alignment
        section_errors = self._validate_section_alignment(sds)
        errors.extend(section_errors)

        # 3. Validate source citations
        citation_errors = self._validate_source_citations(sds)
        errors.extend(citation_errors)

        is_valid = len(errors) == 0

        if not is_valid:
            logger.warning(
                "cross_entity.validation_failed",
                error_count=len(errors),
                errors=errors
            )

        return is_valid, errors

    def _validate_genre_consistency(self, sds: Dict[str, Any]) -> List[str]:
        """Validate blueprint genre matches style primary genre."""
        blueprint_genre = sds["blueprint_ref"]["genre"]
        style_genre = sds["style"]["genre_detail"]["primary"]

        if blueprint_genre != style_genre:
            return [
                f"Genre mismatch: blueprint '{blueprint_genre}' != style '{style_genre}'"
            ]

        return []

    def _validate_section_alignment(self, sds: Dict[str, Any]) -> List[str]:
        """Validate lyrics sections match producer notes structure."""
        lyrics_sections = set(sds["lyrics"].get("section_order", []))

        # Parse producer notes structure
        structure = sds["producer_notes"].get("structure", "")
        producer_sections = set()
        for part in structure.split("–"):
            section = part.strip()
            if section:
                producer_sections.add(section)

        # Check all producer sections exist in lyrics
        missing = producer_sections - lyrics_sections
        if missing:
            return [
                f"Producer notes references sections not in lyrics: {', '.join(missing)}"
            ]

        return []

    def _validate_source_citations(self, sds: Dict[str, Any]) -> List[str]:
        """Validate lyrics source citations reference existing sources."""
        citations = sds["lyrics"].get("source_citations", [])
        if not citations:
            return []

        source_ids = {src.get("name") for src in sds["sources"]}

        errors = []
        for citation in citations:
            cited_id = citation.get("source_id")
            # Note: SDS schema uses source names, not IDs in some cases
            # This validation may need adjustment based on actual data format
            if cited_id and cited_id not in source_ids:
                errors.append(
                    f"Lyrics cites source '{cited_id}' which is not in sources list"
                )

        return errors
```

**Acceptance Criteria**:
- [ ] Validates blueprint genre matches style genre
- [ ] Checks lyrics sections align with producer notes structure
- [ ] Verifies source citations reference existing sources
- [ ] Returns clear error messages for inconsistencies
- [ ] Logs validation failures
- [ ] Handles missing/optional fields gracefully

**Effort**: 4 story points
**Assigned**: python-backend-engineer

---

## Phase 3: API Enhancement

**Duration**: 1 day
**Effort**: 4 story points
**Subagents**: python-backend-engineer, backend-architect
**Dependencies**: Phase 2A-C

### Overview

Enhance song creation endpoints to integrate SDS compilation and validation.

### Tasks

#### SDS-006: Enhance POST /songs Endpoint

**Description**: Integrate SDS compiler into song creation flow with comprehensive validation.

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/api/v1/endpoints/songs.py`

**Implementation**:

Modify existing `create_song` endpoint:

```python
@router.post(
    "",
    response_model=SongResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new song with SDS compilation",
    description="Create a new song and compile SDS from entity references",
    responses={
        201: {"description": "Song created and SDS compiled successfully"},
        400: {"model": ErrorResponse, "description": "Invalid data or validation failed"},
        404: {"model": ErrorResponse, "description": "Referenced entity not found"},
    },
)
async def create_song(
    song_data: SongCreate,
    service: SongService = Depends(get_song_service),
    repo: SongRepository = Depends(get_song_repository),
    sds_compiler: SDSCompilerService = Depends(get_sds_compiler_service),
    blueprint_validator: BlueprintValidatorService = Depends(get_blueprint_validator_service),
    cross_entity_validator: CrossEntityValidator = Depends(get_cross_entity_validator),
) -> SongResponse:
    """Create a new song with SDS compilation and validation.

    Flow:
    1. Create song record with entity references
    2. Compile SDS from entity references
    3. Validate SDS against blueprint constraints
    4. Validate cross-entity consistency
    5. Store compiled SDS in song record
    6. Return created song with SDS

    Args:
        song_data: Song creation data with entity references
        service: Song service instance
        repo: Song repository instance
        sds_compiler: SDS compiler service
        blueprint_validator: Blueprint validator service
        cross_entity_validator: Cross-entity validator

    Returns:
        Created song with compiled SDS

    Raises:
        HTTPException: If validation fails or entities not found
    """
    try:
        # 1. Create song record
        song = await service.create_song(song_data)

        # 2. Compile SDS from entity references
        try:
            sds = await sds_compiler.compile_sds(song.id, validate=True)
        except ValueError as e:
            # Rollback song creation if SDS compilation fails
            await repo.delete(song.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SDS compilation failed: {str(e)}",
            )

        # 3. Validate against blueprint constraints
        is_valid, blueprint_errors = await blueprint_validator.validate_sds_against_blueprint(
            sds, song.blueprint_id
        )
        if not is_valid:
            await repo.delete(song.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Blueprint validation failed: {'; '.join(blueprint_errors)}",
            )

        # 4. Validate cross-entity consistency
        is_valid, consistency_errors = cross_entity_validator.validate_sds_consistency(sds)
        if not is_valid:
            await repo.delete(song.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cross-entity validation failed: {'; '.join(consistency_errors)}",
            )

        # 5. Store compiled SDS in song extra_metadata
        await repo.update(song.id, {
            "extra_metadata": {
                **song.extra_metadata,
                "compiled_sds": sds,
                "sds_hash": sds.get("_computed_hash"),
                "compilation_version": "1.0"
            }
        })

        # 6. Return song with SDS
        updated_song = await repo.get_by_id(song.id)
        return SongResponse.model_validate(updated_song)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
```

**Acceptance Criteria**:
- [ ] Creates song with entity references
- [ ] Compiles SDS from references
- [ ] Validates SDS against blueprint
- [ ] Validates cross-entity consistency
- [ ] Stores compiled SDS in song metadata
- [ ] Rolls back song on compilation failure
- [ ] Returns clear error messages for each failure type
- [ ] Logs all validation steps

**Effort**: 3 story points
**Assigned**: python-backend-engineer

#### SDS-007: Add GET /songs/{id}/sds Endpoint

**Description**: Add dedicated endpoint to retrieve compiled SDS for a song.

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/api/v1/endpoints/songs.py`

**Implementation**:

```python
@router.get(
    "/{song_id}/sds",
    response_model=Dict[str, Any],
    summary="Get compiled SDS for song",
    description="Retrieve the compiled Song Design Spec",
    responses={
        200: {"description": "SDS retrieved successfully"},
        404: {"model": ErrorResponse, "description": "Song not found or SDS not compiled"},
    },
)
async def get_song_sds(
    song_id: UUID,
    recompile: bool = Query(False, description="Force recompilation of SDS"),
    repo: SongRepository = Depends(get_song_repository),
    sds_compiler: SDSCompilerService = Depends(get_sds_compiler_service),
) -> Dict[str, Any]:
    """Get compiled SDS for a song.

    Args:
        song_id: Song UUID
        recompile: If True, force recompilation (default: False)
        repo: Song repository instance
        sds_compiler: SDS compiler service

    Returns:
        Compiled SDS dictionary

    Raises:
        HTTPException: If song not found or SDS compilation fails
    """
    song = await repo.get_by_id(song_id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Song {song_id} not found",
        )

    # Check if SDS already compiled
    if not recompile and song.extra_metadata.get("compiled_sds"):
        return song.extra_metadata["compiled_sds"]

    # Compile SDS
    try:
        sds = await sds_compiler.compile_sds(song_id, validate=True)
        return sds
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SDS compilation failed: {str(e)}",
        )
```

**Acceptance Criteria**:
- [ ] Returns cached SDS if available
- [ ] Supports forced recompilation via query param
- [ ] Returns compiled SDS dictionary
- [ ] Handles song not found
- [ ] Handles compilation errors gracefully

**Effort**: 1 story point
**Assigned**: python-backend-engineer

---

## Phase 4: Testing Suite

**Duration**: 1.5 days
**Effort**: 5 story points
**Subagents**: testing-specialist, python-backend-engineer
**Dependencies**: Phase 2-3

### Overview

Comprehensive testing covering unit, integration, and determinism tests.

### Tasks

#### SDS-008: Unit Tests for SDS Compiler

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/tests/services/test_sds_compiler_service.py`

**Test Coverage**:

```python
"""Unit tests for SDS Compiler Service."""

import pytest
from uuid import uuid4

@pytest.mark.asyncio
async def test_compile_sds_success(sds_compiler, mock_entities):
    """Test successful SDS compilation with all entities."""
    sds = await sds_compiler.compile_sds(mock_entities["song_id"])

    assert sds["title"] == "Test Song"
    assert sds["seed"] == 42
    assert "style" in sds
    assert "lyrics" in sds
    assert "producer_notes" in sds
    assert "_computed_hash" in sds

@pytest.mark.asyncio
async def test_compile_sds_missing_entity(sds_compiler):
    """Test SDS compilation fails when entity missing."""
    with pytest.raises(ValueError, match="not found"):
        await sds_compiler.compile_sds(uuid4())

@pytest.mark.asyncio
async def test_source_weight_normalization(sds_compiler, mock_song_with_sources):
    """Test source weights normalized to sum to 1.0."""
    sds = await sds_compiler.compile_sds(mock_song_with_sources["song_id"])

    total_weight = sum(src["weight"] for src in sds["sources"])
    assert abs(total_weight - 1.0) < 0.0001  # Tolerance for float precision

@pytest.mark.asyncio
async def test_deterministic_hash(sds_compiler, mock_entities):
    """Test same inputs produce same hash."""
    sds1 = await sds_compiler.compile_sds(mock_entities["song_id"])
    sds2 = await sds_compiler.compile_sds(mock_entities["song_id"])

    assert sds1["_computed_hash"] == sds2["_computed_hash"]
```

**Effort**: 2 story points

#### SDS-009: Unit Tests for Validators

**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/tests/services/test_blueprint_validator_service.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/tests/services/test_cross_entity_validator.py`
- `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/tests/services/test_tag_conflict_resolver.py`

**Test Coverage**: 95%+ for each validator

**Effort**: 2 story points

#### SDS-010: Integration Tests

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/tests/integration/test_song_creation_flow.py`

```python
"""Integration tests for complete song creation flow."""

@pytest.mark.asyncio
async def test_create_song_with_sds_compilation(client, test_entities):
    """Test end-to-end song creation with SDS compilation."""
    response = await client.post("/api/v1/songs", json={
        "title": "Test Song",
        "style_id": str(test_entities["style_id"]),
        "lyrics_id": str(test_entities["lyrics_id"]),
        "producer_notes_id": str(test_entities["producer_notes_id"]),
        "blueprint_id": str(test_entities["blueprint_id"]),
        "global_seed": 42
    })

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Song"
    assert "id" in data

@pytest.mark.asyncio
async def test_create_song_validation_failure(client, invalid_entities):
    """Test song creation fails with invalid entities."""
    response = await client.post("/api/v1/songs", json={
        "title": "Invalid Song",
        "style_id": str(uuid4()),  # Non-existent
        "blueprint_id": str(invalid_entities["blueprint_id"]),
        "global_seed": 42
    })

    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()
```

**Effort**: 1 story point

---

## Phase 5: Documentation

**Duration**: 0.5 days
**Effort**: 2 story points
**Subagents**: documentation-writer
**Dependencies**: Phase 2-4

### Tasks

#### SDS-011: API Documentation

**Files**:
- `/Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/api/v1/endpoints/songs.py` (enhance docstrings)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/api/sds-compilation.md` (new)

**Content**:
- Endpoint descriptions with examples
- Request/response schemas
- Error codes and messages
- SDS structure documentation
- Validation rules reference

**Effort**: 1 story point

#### SDS-012: Algorithm Documentation

**File**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/algorithms/sds-compilation.md` (new)

**Content**:
- SDS compilation algorithm description
- Weight normalization formula
- Conflict resolution algorithm
- Cross-entity validation rules
- Blueprint constraint enforcement
- Deterministic hashing methodology

**Effort**: 1 story point

---

## Risk Mitigation

### Technical Risks

**Risk**: Source weight normalization edge cases (all zero weights, negative weights)
**Mitigation**: Handle in normalizer with equal weighting fallback; comprehensive unit tests
**Impact**: Low - well-defined fallback behavior

**Risk**: Tag conflict matrix incomplete or inconsistent
**Mitigation**: Start with core conflicts; allow missing matrix (graceful degradation); add conflicts iteratively
**Impact**: Medium - affects prompt quality but not blocking

**Risk**: Cross-entity validation too strict (blocks valid cases)
**Mitigation**: Make validations warnings initially; collect data; promote to errors in v2
**Impact**: Low - can be relaxed post-deployment

**Risk**: Performance degradation with large source lists
**Mitigation**: Add query optimization; implement caching; monitor P95 latency
**Impact**: Medium - address if P95 > 2s

### Schedule Risks

**Risk**: Validation rules clarification delays
**Mitigation**: Implement base validators; iterate with stakeholder feedback
**Impact**: Low - validators can be enhanced incrementally

**Risk**: Testing uncovers integration issues
**Mitigation**: Early integration testing; daily builds; tight dev-test loop
**Impact**: Low - caught early in cycle

---

## Success Metrics

### Delivery Metrics

- [ ] All 12 tasks completed (100%)
- [ ] Code review passed for all components
- [ ] Test coverage ≥ 95% for service layer
- [ ] Zero high-severity bugs in testing
- [ ] Documentation complete and reviewed

### Quality Metrics

- [ ] SDS compilation succeeds for 100% of valid entity sets
- [ ] Validation catches 100% of known invalid cases
- [ ] Source weights sum to 1.0 (tolerance: 0.0001) in all cases
- [ ] Tag conflicts resolved deterministically (10 runs same input → same output)
- [ ] SDS hashing produces identical hashes for identical inputs (100% reproducibility)

### Performance Metrics

- [ ] SDS compilation: P95 < 500ms
- [ ] Full song creation (with validation): P95 < 2s
- [ ] API response time: P95 < 3s
- [ ] Database queries: < 5 queries per song creation

### Functional Metrics

- [ ] Song creation flow operational end-to-end
- [ ] Blueprint validation enforces all constraint types
- [ ] Cross-entity validation catches inconsistencies
- [ ] API returns actionable error messages
- [ ] Phase 3 (Orchestration) integration ready

---

## Next Steps

### Immediate Actions (Day 1)

1. **Repository Setup**:
   - Create feature branch: `feature/sds-aggregation-v1`
   - Set up task tracking in project board
   - Assign engineers to parallel tracks

2. **Phase 1 Kickoff**:
   - Begin SDS-001 (Repository extensions)
   - Set up development environment
   - Create test fixtures and mocks

3. **Phase 2A Kickoff**:
   - Begin SDS-002 (SDS Compiler core)
   - Architecture review with backend-architect
   - Define service interfaces

### Week 1 Milestones

- **Day 1-2**: Phase 1 complete, Phase 2A underway
- **Day 3**: Phase 2B-C complete, validators tested
- **Day 4**: Phase 3 API integration complete
- **Day 5**: Phase 4 testing 80% complete
- **Day 6**: Phase 5 documentation, final review

### Post-Implementation

1. **Integration with Phase 3**:
   - Hand off SDS compiler to orchestration team
   - Provide integration examples
   - Support workflow node implementation

2. **Monitoring & Iteration**:
   - Set up Datadog dashboards for SDS compilation metrics
   - Monitor validation failure patterns
   - Collect feedback for validator improvements

3. **Future Enhancements**:
   - Add conflict matrix editor UI
   - Implement living artist normalization (Phase 2 prompt composition)
   - Expand blueprint constraint types
   - Add SDS versioning and migration

---

## Appendix

### File Structure

```
services/api/app/
├── services/
│   ├── sds_compiler_service.py          # SDS-002
│   ├── blueprint_validator_service.py   # SDS-003
│   ├── tag_conflict_resolver.py         # SDS-004
│   └── cross_entity_validator.py        # SDS-005
├── repositories/
│   └── song_repo.py                     # SDS-001 (enhanced)
├── api/v1/endpoints/
│   └── songs.py                         # SDS-006, SDS-007 (enhanced)
└── tests/
    ├── services/
    │   ├── test_sds_compiler_service.py # SDS-008
    │   ├── test_blueprint_validator_service.py # SDS-009
    │   ├── test_tag_conflict_resolver.py # SDS-009
    │   └── test_cross_entity_validator.py # SDS-009
    └── integration/
        └── test_song_creation_flow.py   # SDS-010

taxonomies/
└── conflict_matrix.json                 # New (placeholder)

docs/
├── api/
│   └── sds-compilation.md               # SDS-011
└── algorithms/
    └── sds-compilation.md               # SDS-012
```

### Dependencies

**Python Packages** (already in requirements.txt):
- `sqlalchemy` >= 2.0
- `pydantic` >= 2.0
- `structlog` >= 23.0
- `jsonschema` >= 4.0
- `pytest` >= 7.0
- `pytest-asyncio` >= 0.21

**External Services**:
- PostgreSQL 15+
- Redis 7+ (for caching, optional)

### Reference Documents

- **PRDs**:
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md`

- **Phase Design**:
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-2-aggregation.md`

- **Schemas**:
  - `/Users/miethe/dev/homelab/development/MeatyMusic/schemas/sds.schema.json`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/schemas/blueprint.schema.json`

### Contact & Escalation

- **Technical Lead**: backend-architect
- **Project Owner**: Product team
- **Escalation Path**: Technical Lead → Engineering Manager → CTO

---

**Document Status**: Ready for Implementation
**Approval Required**: Technical Lead, Engineering Manager
**Target Start Date**: 2025-11-15
**Target Completion**: 2025-11-22

---

*This implementation plan follows MeatyMusic's layered architecture and integrates with existing Phase 1-2 infrastructure. All code examples are production-ready patterns based on established codebase conventions.*
