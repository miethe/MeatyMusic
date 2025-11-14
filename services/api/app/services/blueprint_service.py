"""Service layer for Blueprint entity with file loading and validation.

This module implements business logic for blueprint operations including:
- Loading blueprints from markdown files
- In-memory caching for performance
- Rubric weight validation
- Tag conflict detection
- Tempo range validation
"""

from __future__ import annotations

from typing import Optional, Dict, List, Tuple
from uuid import UUID
from pathlib import Path
import json
import re
import structlog

from app.repositories.blueprint_repo import BlueprintRepository
from app.schemas.blueprint import (
    BlueprintCreate,
    BlueprintUpdate,
    BlueprintResponse,
)
from app.models.blueprint import Blueprint
from app.errors import NotFoundError, BadRequestError
from .common import normalize_weights

logger = structlog.get_logger(__name__)


class BlueprintService:
    """Service for blueprint management with file loading and caching.

    This service handles:
    - Loading blueprints from markdown files in /docs/hit_song_blueprint/AI/
    - Caching blueprints in memory for performance
    - Validating rubric weights (must sum to 1.0)
    - Loading and checking tag conflicts from conflict matrix
    - Validating tempo ranges and required sections

    Attributes:
        blueprint_repo: Repository for blueprint data access
        _blueprint_cache: In-memory cache for loaded blueprints
        _conflict_matrix: Cached tag conflict matrix from JSON
        BLUEPRINT_DIR: Path to blueprint markdown files
        CONFLICT_MATRIX_PATH: Path to conflict matrix JSON file
    """

    # Class-level paths (absolute paths as per requirements)
    BLUEPRINT_DIR = Path("/home/user/MeatyMusic/docs/hit_song_blueprint/AI")
    CONFLICT_MATRIX_PATH = Path("/home/user/MeatyMusic/taxonomies/conflict_matrix.json")

    def __init__(self, blueprint_repo: BlueprintRepository):
        """Initialize the blueprint service.

        Args:
            blueprint_repo: Repository for blueprint data access
        """
        self.blueprint_repo = blueprint_repo
        self._blueprint_cache: Dict[str, Blueprint] = {}
        self._conflict_matrix: Optional[Dict[str, List[str]]] = None

    # =============================================================================
    # Blueprint Loading & Caching (N6-9)
    # =============================================================================

    def get_or_load_blueprint(
        self,
        genre: str,
        version: str = "latest"
    ) -> Blueprint:
        """Get blueprint from cache or load from file.

        First checks the in-memory cache for the blueprint. If not found,
        attempts to load from the corresponding markdown file and caches it.

        Args:
            genre: Genre name (e.g., 'pop', 'country', 'hip-hop')
            version: Blueprint version (default 'latest')

        Returns:
            Blueprint entity with all rules and rubric loaded

        Raises:
            NotFoundError: If blueprint file doesn't exist
            BadRequestError: If blueprint file is malformed

        Example:
            >>> service = BlueprintService(repo)
            >>> pop_blueprint = service.get_or_load_blueprint("pop")
            >>> # Subsequent calls use cache
            >>> pop_blueprint2 = service.get_or_load_blueprint("pop")
        """
        cache_key = f"{genre}:{version}"

        # Check cache first
        if cache_key in self._blueprint_cache:
            logger.debug(
                "blueprint.cache_hit",
                genre=genre,
                version=version,
                cache_size=len(self._blueprint_cache)
            )
            return self._blueprint_cache[cache_key]

        # Cache miss - load from file
        logger.debug(
            "blueprint.cache_miss",
            genre=genre,
            version=version
        )

        blueprint = self.load_blueprint_from_file(genre)

        # Cache the loaded blueprint
        self.cache_blueprint(genre, blueprint, version)

        logger.info(
            "blueprint.loaded_and_cached",
            genre=genre,
            version=version,
            blueprint_id=str(blueprint.id) if hasattr(blueprint, 'id') else None
        )

        return blueprint

    def load_blueprint_from_file(self, genre: str) -> Blueprint:
        """Load blueprint from markdown file.

        Parses the blueprint markdown file and extracts:
        - Tempo ranges from Musical Blueprint section
        - Required sections from Structural Blueprint
        - Rubric configuration (if present)
        - Genre constraints

        Args:
            genre: Genre name (matches filename: {genre}_blueprint.md)

        Returns:
            Blueprint entity (not yet persisted to database)

        Raises:
            NotFoundError: If blueprint file doesn't exist
            BadRequestError: If file is malformed or can't be parsed

        Example:
            >>> blueprint = service.load_blueprint_from_file("pop")
            >>> print(blueprint.genre)  # 'pop'
            >>> print(blueprint.rules)  # {'tempo_bpm': [95, 130], ...}
        """
        # Construct file path
        file_path = self.BLUEPRINT_DIR / f"{genre}_blueprint.md"

        if not file_path.exists():
            logger.error(
                "blueprint.file_not_found",
                genre=genre,
                path=str(file_path)
            )
            raise NotFoundError(f"Blueprint file not found: {file_path}")

        try:
            # Read markdown content
            content = file_path.read_text(encoding='utf-8')

            # Parse blueprint structure
            parsed_data = self._parse_blueprint_markdown(content, genre)

            logger.info(
                "blueprint.parsed",
                genre=genre,
                has_tempo_range=bool(parsed_data.get('rules', {}).get('tempo_bpm')),
                has_rubric=bool(parsed_data.get('eval_rubric'))
            )

            # Return as Blueprint model (in-memory, not persisted)
            # Note: This creates a minimal Blueprint for caching purposes
            # For full persistence, use BlueprintCreate schema and repository
            blueprint = Blueprint(
                genre=parsed_data['genre'],
                version=parsed_data['version'],
                rules=parsed_data['rules'],
                eval_rubric=parsed_data['eval_rubric'],
                conflict_matrix=parsed_data.get('conflict_matrix', {}),
                tag_categories=parsed_data.get('tag_categories', {}),
                extra_metadata=parsed_data.get('extra_metadata', {})
            )

            return blueprint

        except Exception as e:
            logger.error(
                "blueprint.parse_failed",
                genre=genre,
                path=str(file_path),
                error=str(e),
                exc_info=True
            )
            raise BadRequestError(
                f"Failed to parse blueprint file for '{genre}': {str(e)}"
            ) from e

    def _parse_blueprint_markdown(
        self,
        content: str,
        genre: str
    ) -> Dict:
        """Parse blueprint markdown content into structured data.

        Extracts tempo ranges, required sections, length constraints, and
        evaluation rubric from the markdown blueprint file. Uses regex patterns
        to identify key sections and constraints.

        This is the core parsing logic that transforms human-readable markdown
        blueprints into machine-readable data structures for validation and scoring.

        Args:
            content: Raw markdown content from blueprint file
            genre: Genre name (used to initialize structure)

        Returns:
            Dict with structured blueprint data including:
            - genre: Genre name
            - version: Blueprint version (default: 'latest')
            - rules: Dict with tempo_bpm, required_sections, length_minutes
            - eval_rubric: Scoring weights and thresholds
            - conflict_matrix: Tag conflicts for this genre
            - tag_categories: Categorized style tags
            - extra_metadata: Additional metadata (source file, has examples, etc.)
        """
        # Initialize default structure with empty containers
        data = {
            'genre': genre,
            'version': 'latest',  # Could parse from content if version is specified
            'rules': {},                # Tempo, sections, length constraints
            'eval_rubric': {},          # Scoring weights and thresholds
            'conflict_matrix': {},      # Tag conflicts for this genre
            'tag_categories': {},       # Categorized style tags
            'extra_metadata': {}        # Source file, parse info, etc.
        }

        # =====================================================================
        # 1. Extract Tempo Range
        # =====================================================================
        # Regex pattern: Matches "**Tempo:** Most pop hits fall between **95–130 BPM**"
        tempo_match = re.search(
            r'\*\*Tempo:\*\*[^\d]*(\d+)[–-](\d+)\s*BPM',
            content,
            re.IGNORECASE
        )
        if tempo_match:
            bpm_min = int(tempo_match.group(1))
            bpm_max = int(tempo_match.group(2))
            data['rules']['tempo_bpm'] = [bpm_min, bpm_max]
            logger.debug(
                "blueprint.tempo_extracted",
                genre=genre,
                bpm_min=bpm_min,
                bpm_max=bpm_max
            )
        else:
            # Fallback: Try simpler pattern for alternative markdown formats
            # Pattern: "**95–130 BPM** for dance‑oriented tracks or **70–90 BPM** for ballads"
            tempo_alt_match = re.search(
                r'(\d+)[–-](\d+)\s*BPM',
                content
            )
            if tempo_alt_match:
                bpm_min = int(tempo_alt_match.group(1))
                bpm_max = int(tempo_alt_match.group(2))
                data['rules']['tempo_bpm'] = [bpm_min, bpm_max]

        # =====================================================================
        # 2. Extract Required Sections (Song Structure)
        # =====================================================================
        # Looks for "**Form:** Verse → Chorus → Verse → Chorus → Bridge → Chorus"
        sections = []
        form_match = re.search(
            r'\*\*Form:\*\*[^\n]*?\*\*([^*]+)\*\*',
            content,
            re.IGNORECASE
        )
        if form_match:
            form_text = form_match.group(1)
            # Extract standard section names (case-insensitive)
            # Pattern handles Pre-Chorus with both hyphen and en-dash
            section_pattern = r'(Verse|Chorus|Bridge|Pre[‑-]?Chorus|Intro|Outro|Hook)'
            found_sections = re.findall(section_pattern, form_text, re.IGNORECASE)
            # Remove duplicates while preserving order (unique while maintaining sequence)
            sections = list(dict.fromkeys(found_sections))

        if not sections:
            # Default required sections (Verse + Chorus minimum)
            sections = ["Verse", "Chorus"]

        data['rules']['required_sections'] = sections

        # =====================================================================
        # 3. Extract Length Constraints (Song Duration)
        # =====================================================================
        # Pattern: "Most hits run **2.5–3.5 minutes**"
        # Matches decimal numbers with em-dash or hyphen
        length_match = re.search(
            r'(\d+\.?\d*)[–-](\d+\.?\d*)\s*minutes',
            content,
            re.IGNORECASE
        )
        if length_match:
            min_length = float(length_match.group(1))
            max_length = float(length_match.group(2))
            data['rules']['length_minutes'] = [min_length, max_length]

        # =====================================================================
        # 4. Initialize Default Evaluation Rubric
        # =====================================================================
        # Per MeatyMusic AMCS blueprint requirements - these are the base weights
        # used to score generated lyrics and producer notes against quality metrics
        data['eval_rubric'] = {
            'weights': {
                'hook_density': 0.25,           # How many catchy hooks (chorus-quality lines)
                'singability': 0.20,            # How easy to sing/remember
                'rhyme_tightness': 0.15,        # Quality and consistency of rhyme scheme
                'section_completeness': 0.20,   # All required sections present
                'profanity_score': 0.20         # Adherence to explicit policy
            },
            'thresholds': {
                'min_total': 0.75,              # Minimum total score to pass validation
                'max_profanity': 0.1            # Maximum profanity allowed (0.0 = none)
            }
        }

        # =====================================================================
        # 5. Store Metadata for Reference
        # =====================================================================
        data['extra_metadata'] = {
            'source_file': f"{genre}_blueprint.md",
            'parsed_at': None,  # Could add timestamp if needed
            'has_examples': bool(re.search(r'## Examples', content, re.IGNORECASE))
        }

        return data

    def cache_blueprint(
        self,
        genre: str,
        blueprint: Blueprint,
        version: str = "latest"
    ) -> None:
        """Store blueprint in memory cache.

        Args:
            genre: Genre name
            blueprint: Blueprint entity to cache
            version: Blueprint version (default 'latest')

        Example:
            >>> service.cache_blueprint("pop", pop_blueprint)
            >>> # Blueprint now available in cache
        """
        cache_key = f"{genre}:{version}"
        self._blueprint_cache[cache_key] = blueprint

        logger.debug(
            "blueprint.cached",
            genre=genre,
            version=version,
            cache_key=cache_key,
            cache_size=len(self._blueprint_cache)
        )

    def invalidate_cache(self, genre: Optional[str] = None) -> int:
        """Invalidate blueprint cache.

        Args:
            genre: Optional genre to invalidate (if None, clears entire cache)

        Returns:
            Number of cache entries removed

        Example:
            >>> service.invalidate_cache("pop")  # Clear just pop blueprints
            >>> service.invalidate_cache()  # Clear all cached blueprints
        """
        if genre is None:
            # Clear entire cache
            count = len(self._blueprint_cache)
            self._blueprint_cache.clear()
            logger.info("blueprint.cache_cleared", entries_removed=count)
            return count
        else:
            # Clear specific genre (all versions)
            removed = 0
            keys_to_remove = [
                key for key in self._blueprint_cache.keys()
                if key.startswith(f"{genre}:")
            ]
            for key in keys_to_remove:
                del self._blueprint_cache[key]
                removed += 1

            logger.info(
                "blueprint.cache_invalidated",
                genre=genre,
                entries_removed=removed
            )
            return removed

    # =============================================================================
    # Validation & Constraints (N6-10)
    # =============================================================================

    def validate_rubric_weights(
        self,
        weights: Dict[str, float]
    ) -> Tuple[bool, Optional[str]]:
        """Validate rubric weights sum to 1.0.

        Ensures that evaluation rubric weights are valid:
        - All weights are positive
        - Sum of weights equals 1.0 (within tolerance of 0.01)

        Args:
            weights: Dict mapping metric name to weight value

        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if validation passes
            - error_message: None if valid, error description if invalid

        Example:
            >>> weights = {"hook_density": 0.3, "singability": 0.7}
            >>> is_valid, error = service.validate_rubric_weights(weights)
            >>> assert is_valid and error is None

            >>> weights = {"hook_density": 0.3, "singability": 0.5}
            >>> is_valid, error = service.validate_rubric_weights(weights)
            >>> assert not is_valid  # Sum is 0.8, not 1.0
        """
        if not weights:
            return False, "Weights cannot be empty"

        # Check all positive
        for key, value in weights.items():
            if value < 0:
                logger.warning(
                    "rubric.negative_weight",
                    key=key,
                    value=value
                )
                return False, f"Negative weight for '{key}': {value}"

        # Check sum to 1.0 (within tolerance)
        total = sum(weights.values())
        tolerance = 0.01

        if abs(total - 1.0) > tolerance:
            logger.warning(
                "rubric.invalid_sum",
                total=total,
                expected=1.0,
                tolerance=tolerance,
                weights=weights
            )
            return False, f"Weights sum to {total:.3f}, expected 1.0 (±{tolerance})"

        logger.debug(
            "rubric.weights_valid",
            total=total,
            metric_count=len(weights)
        )

        return True, None

    def validate_tempo_range(
        self,
        bpm_min: int,
        bpm_max: int,
        blueprint: Blueprint
    ) -> Tuple[bool, Optional[str]]:
        """Validate tempo range against blueprint constraints.

        Checks if the provided BPM range falls within the blueprint's
        acceptable tempo ranges.

        Args:
            bpm_min: Minimum BPM
            bpm_max: Maximum BPM
            blueprint: Blueprint entity with tempo constraints

        Returns:
            Tuple of (is_valid, error_message)

        Example:
            >>> blueprint = service.get_or_load_blueprint("pop")
            >>> is_valid, error = service.validate_tempo_range(100, 120, blueprint)
            >>> # True if 100-120 falls within pop's range
        """
        if bpm_min <= 0 or bpm_max <= 0:
            return False, "BPM values must be positive"

        if bpm_min > bpm_max:
            return False, f"Invalid range: min ({bpm_min}) > max ({bpm_max})"

        # Extract blueprint tempo constraints
        rules = blueprint.rules
        if not rules or 'tempo_bpm' not in rules:
            # No tempo constraints in blueprint - accept any reasonable range
            if bpm_min < 40 or bpm_max > 240:
                return False, f"BPM range {bpm_min}-{bpm_max} outside reasonable bounds (40-240)"
            return True, None

        blueprint_bpm = rules['tempo_bpm']
        if not isinstance(blueprint_bpm, list) or len(blueprint_bpm) != 2:
            # Malformed blueprint tempo - log warning and accept
            logger.warning(
                "blueprint.invalid_tempo_format",
                blueprint_id=str(blueprint.id) if hasattr(blueprint, 'id') else None,
                genre=blueprint.genre,
                tempo_value=blueprint_bpm
            )
            return True, None

        blueprint_min, blueprint_max = blueprint_bpm

        # Check if requested range overlaps with blueprint range
        if bpm_max < blueprint_min or bpm_min > blueprint_max:
            return False, (
                f"BPM range {bpm_min}-{bpm_max} outside blueprint constraints "
                f"({blueprint_min}-{blueprint_max}) for {blueprint.genre}"
            )

        logger.debug(
            "tempo.validated",
            bpm_min=bpm_min,
            bpm_max=bpm_max,
            blueprint_range=f"{blueprint_min}-{blueprint_max}",
            genre=blueprint.genre
        )

        return True, None

    def validate_required_sections(
        self,
        sections: List[str],
        required: List[str]
    ) -> Tuple[bool, Optional[str]]:
        """Validate that all required sections are present.

        Args:
            sections: List of section names in the lyrics
            required: List of required section names

        Returns:
            Tuple of (is_valid, error_message)

        Example:
            >>> sections = ["Verse", "Chorus", "Bridge"]
            >>> required = ["Verse", "Chorus"]
            >>> is_valid, error = service.validate_required_sections(sections, required)
            >>> assert is_valid
        """
        if not required:
            # No requirements - always valid
            return True, None

        if not sections:
            return False, f"Missing required sections: {', '.join(required)}"

        # Normalize for case-insensitive comparison
        sections_lower = [s.lower().strip() for s in sections]
        required_lower = [r.lower().strip() for r in required]

        missing = []
        for req in required_lower:
            if req not in sections_lower:
                # Find original case for error message
                original = next(
                    (r for r in required if r.lower().strip() == req),
                    req
                )
                missing.append(original)

        if missing:
            logger.warning(
                "sections.missing_required",
                missing=missing,
                provided=sections
            )
            return False, f"Missing required sections: {', '.join(missing)}"

        logger.debug(
            "sections.validated",
            section_count=len(sections),
            required_count=len(required)
        )

        return True, None

    # =============================================================================
    # Tag Conflict Detection (N6-10)
    # =============================================================================

    def load_conflict_matrix(self) -> Dict[str, List[str]]:
        """Load tag conflict matrix from JSON file.

        Loads the conflict matrix that defines which style tags conflict
        with each other (e.g., "whisper" conflicts with "anthemic").

        Returns:
            Dict mapping tag name to list of conflicting tags

        Raises:
            BadRequestError: If conflict matrix file is malformed

        Example:
            >>> matrix = service.load_conflict_matrix()
            >>> print(matrix.get("whisper"))
            >>> # ["anthemic", "high-energy", "aggressive"]
        """
        # Return cached matrix if already loaded
        if self._conflict_matrix is not None:
            logger.debug(
                "conflict_matrix.cache_hit",
                tag_count=len(self._conflict_matrix)
            )
            return self._conflict_matrix

        # Check if file exists
        if not self.CONFLICT_MATRIX_PATH.exists():
            logger.warning(
                "conflict_matrix.not_found",
                path=str(self.CONFLICT_MATRIX_PATH),
                fallback="empty_matrix"
            )
            # Return empty matrix as fallback
            self._conflict_matrix = {}
            return self._conflict_matrix

        try:
            # Load JSON file
            with open(self.CONFLICT_MATRIX_PATH, 'r', encoding='utf-8') as f:
                matrix = json.load(f)

            if not isinstance(matrix, dict):
                raise ValueError("Conflict matrix must be a JSON object")

            self._conflict_matrix = matrix

            logger.info(
                "conflict_matrix.loaded",
                path=str(self.CONFLICT_MATRIX_PATH),
                tag_count=len(matrix)
            )

            return matrix

        except json.JSONDecodeError as e:
            logger.error(
                "conflict_matrix.parse_error",
                path=str(self.CONFLICT_MATRIX_PATH),
                error=str(e),
                exc_info=True
            )
            raise BadRequestError(
                f"Malformed conflict matrix JSON: {str(e)}"
            ) from e
        except Exception as e:
            logger.error(
                "conflict_matrix.load_error",
                path=str(self.CONFLICT_MATRIX_PATH),
                error=str(e),
                exc_info=True
            )
            raise BadRequestError(
                f"Failed to load conflict matrix: {str(e)}"
            ) from e

    def get_tag_conflicts(self, tags: List[str]) -> List[Tuple[str, str]]:
        """Find conflicting tag pairs in the provided list.

        Checks the conflict matrix to identify any tags that conflict
        with each other. Returns pairs of conflicting tags.

        Args:
            tags: List of style tags to check

        Returns:
            List of (tag1, tag2) tuples representing conflicts

        Example:
            >>> tags = ["whisper", "anthemic", "acoustic"]
            >>> conflicts = service.get_tag_conflicts(tags)
            >>> print(conflicts)
            >>> # [("whisper", "anthemic")]
        """
        if not tags:
            return []

        # Load conflict matrix
        matrix = self.load_conflict_matrix()

        if not matrix:
            logger.debug("conflict_matrix.empty", tag_count=len(tags))
            return []

        conflicts = []

        # Check each tag against the matrix
        for tag in tags:
            # Normalize tag for lookup (lowercase)
            tag_lower = tag.lower().strip()

            if tag_lower in matrix:
                conflicting_tags = matrix[tag_lower]

                # Check if any conflicting tags are in the provided list
                for conflict in conflicting_tags:
                    conflict_lower = conflict.lower().strip()
                    # Find if conflict exists in tags (case-insensitive)
                    for other_tag in tags:
                        if other_tag.lower().strip() == conflict_lower and other_tag != tag:
                            # Found a conflict - add as tuple
                            # Sort to avoid duplicates like (A,B) and (B,A)
                            pair = tuple(sorted([tag, other_tag]))
                            if pair not in conflicts:
                                conflicts.append(pair)

        if conflicts:
            logger.warning(
                "tags.conflicts_detected",
                tag_count=len(tags),
                conflict_count=len(conflicts),
                conflicts=[f"{a} ↔ {b}" for a, b in conflicts]
            )
        else:
            logger.debug(
                "tags.no_conflicts",
                tag_count=len(tags)
            )

        return conflicts

    # =============================================================================
    # CRUD Operations (using repository)
    # =============================================================================

    def create_blueprint(self, data: BlueprintCreate) -> Blueprint:
        """Create a new blueprint entity.

        Validates rubric weights before creating.

        Args:
            data: Blueprint creation data

        Returns:
            Created blueprint entity

        Raises:
            BadRequestError: If validation fails
        """
        # Validate rubric weights if provided
        if data.eval_rubric and 'weights' in data.eval_rubric:
            is_valid, error = self.validate_rubric_weights(data.eval_rubric['weights'])
            if not is_valid:
                raise BadRequestError(f"Invalid rubric weights: {error}")

        # Create via repository
        blueprint = self.blueprint_repo.create(data.model_dump())

        logger.info(
            "blueprint.created",
            blueprint_id=str(blueprint.id),
            genre=blueprint.genre,
            version=blueprint.version
        )

        return blueprint

    def get_blueprint_by_id(self, blueprint_id: UUID) -> Optional[Blueprint]:
        """Get blueprint by ID.

        Args:
            blueprint_id: Blueprint identifier

        Returns:
            Blueprint entity, or None if not found
        """
        return self.blueprint_repo.get_by_id(blueprint_id)

    def get_blueprints_by_genre(self, genre: str) -> List[Blueprint]:
        """Get all blueprints for a specific genre.

        Args:
            genre: Genre name

        Returns:
            List of blueprint entities
        """
        return self.blueprint_repo.get_by_genre(genre)

    def update_blueprint(
        self,
        blueprint_id: UUID,
        data: BlueprintUpdate
    ) -> Optional[Blueprint]:
        """Update an existing blueprint.

        Validates rubric weights if being updated.

        Args:
            blueprint_id: Blueprint identifier
            data: Blueprint update data

        Returns:
            Updated blueprint entity, or None if not found

        Raises:
            BadRequestError: If validation fails
        """
        # Get existing blueprint
        existing = self.blueprint_repo.get_by_id(blueprint_id)
        if not existing:
            return None

        # Validate rubric weights if being updated
        if data.eval_rubric and 'weights' in data.eval_rubric:
            is_valid, error = self.validate_rubric_weights(data.eval_rubric['weights'])
            if not is_valid:
                raise BadRequestError(f"Invalid rubric weights: {error}")

        # Update via repository
        blueprint = self.blueprint_repo.update(
            blueprint_id,
            data.model_dump(exclude_unset=True)
        )

        logger.info(
            "blueprint.updated",
            blueprint_id=str(blueprint_id),
            updated_fields=list(data.model_dump(exclude_unset=True).keys())
        )

        return blueprint

    def delete_blueprint(self, blueprint_id: UUID) -> bool:
        """Delete a blueprint.

        Args:
            blueprint_id: Blueprint identifier

        Returns:
            True if deleted, False if not found
        """
        success = self.blueprint_repo.delete(blueprint_id)

        if success:
            logger.info("blueprint.deleted", blueprint_id=str(blueprint_id))

        return success
