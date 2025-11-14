"""Tag Conflict Resolver - Enforces conflict matrix rules."""

from typing import List, Set, Tuple, Dict
from pathlib import Path
import json
import structlog

logger = structlog.get_logger(__name__)


class TagConflictResolver:
    """Resolves tag conflicts using conflict matrix.

    This service loads a conflict matrix from a JSON file and provides methods
    to detect and resolve conflicting tags in style specifications. Conflicts
    are resolved by dropping lower-weight tags to maintain deterministic output.
    """

    def __init__(self, conflict_matrix_path: str = None):
        """Initialize with conflict matrix.

        Args:
            conflict_matrix_path: Path to conflict matrix JSON file.
                                If None, uses default path: taxonomies/conflict_matrix.json
        """
        if conflict_matrix_path is None:
            # Default path relative to project root
            # Navigate from services/api/app/services/ to project root
            project_root = Path(__file__).parent.parent.parent.parent.parent
            conflict_matrix_path = str(project_root / "taxonomies" / "conflict_matrix.json")

        self.conflict_matrix_path = conflict_matrix_path
        self.conflict_map = self._load_conflict_matrix(conflict_matrix_path)

    def _load_conflict_matrix(self, path: str) -> Dict[str, Set[str]]:
        """Load and build bidirectional conflict lookup.

        The conflict matrix JSON contains pairs of conflicting tags. This method
        builds a bidirectional lookup map for efficient conflict detection.

        Args:
            path: Path to conflict matrix JSON file

        Returns:
            Dictionary mapping each tag to its set of conflicting tags
            Example: {"tag1": {"tag2", "tag3"}, "tag2": {"tag1"}, ...}
        """
        try:
            with open(path, 'r') as f:
                conflicts = json.load(f)

            if not isinstance(conflicts, list):
                logger.error(
                    "conflict_matrix.invalid_format",
                    path=path,
                    message="Conflict matrix must be a JSON array"
                )
                return {}

        except FileNotFoundError:
            logger.warning(
                "conflict_matrix.not_found",
                path=path,
                message="Conflict matrix file not found, creating empty conflict map"
            )
            return {}
        except json.JSONDecodeError as e:
            logger.error(
                "conflict_matrix.invalid_json",
                path=path,
                error=str(e),
                message="Failed to parse conflict matrix JSON"
            )
            return {}
        except Exception as e:
            logger.error(
                "conflict_matrix.load_error",
                path=path,
                error=str(e),
                message="Unexpected error loading conflict matrix"
            )
            return {}

        # Build bidirectional conflict map
        conflict_map: Dict[str, Set[str]] = {}

        for conflict in conflicts:
            if not isinstance(conflict, dict):
                logger.warning(
                    "conflict_matrix.invalid_entry",
                    conflict=conflict,
                    message="Conflict entry must be a dictionary"
                )
                continue

            tag_a = conflict.get("tag_a")
            tag_b = conflict.get("tag_b")

            if not tag_a or not tag_b:
                logger.warning(
                    "conflict_matrix.missing_tags",
                    conflict=conflict,
                    message="Conflict entry missing tag_a or tag_b"
                )
                continue

            # Normalize tags to lowercase for case-insensitive matching
            tag_a = tag_a.lower()
            tag_b = tag_b.lower()

            # Build bidirectional map
            if tag_a not in conflict_map:
                conflict_map[tag_a] = set()
            if tag_b not in conflict_map:
                conflict_map[tag_b] = set()

            conflict_map[tag_a].add(tag_b)
            conflict_map[tag_b].add(tag_a)

        logger.info(
            "conflict_matrix.loaded",
            path=path,
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
            Each pair is sorted to avoid duplicates (a,b) and (b,a)
        """
        conflicts = []
        # Normalize tags to lowercase for matching
        tag_map = {tag.lower(): tag for tag in tags}
        tag_set = set(tag_map.keys())

        for tag_lower in sorted(tag_set):  # Sort for deterministic order
            # Find conflicts with this tag
            conflicting = tag_set & self.conflict_map.get(tag_lower, set())

            for conflict_tag_lower in sorted(conflicting):  # Sort for deterministic order
                # Avoid duplicates: only add pair if tag < conflict_tag (lexicographic)
                if tag_lower < conflict_tag_lower:
                    # Return original case versions
                    conflicts.append((tag_map[tag_lower], tag_map[conflict_tag_lower]))

        if conflicts:
            logger.debug(
                "tags.conflicts_found",
                conflict_count=len(conflicts),
                conflicts=conflicts[:5]  # Log first 5 conflicts
            )

        return conflicts

    def resolve_conflicts(
        self,
        tags: List[str],
        weights: Dict[str, float] = None
    ) -> List[str]:
        """Resolve conflicts by dropping lower-weight tags.

        This method implements a greedy algorithm that preserves higher-weight tags
        and drops lower-weight conflicting tags to produce a conflict-free tag list.

        Algorithm:
            1. Iterate through tags in order (highest weight first if weights provided)
            2. For each tag, check if it conflicts with already-kept tags
            3. If conflict, drop current tag (keep higher-weight tag)
            4. If no conflict, add to kept set

        Args:
            tags: List of tags (will be sorted by weight descending if weights provided)
            weights: Optional weight map for each tag (higher weight = higher priority)

        Returns:
            Conflict-free tag list maintaining original case
        """
        if not tags:
            return []

        # If weights provided, sort tags by weight descending (highest first)
        if weights:
            # Normalize tag keys in weights to lowercase for matching
            weights_lower = {tag.lower(): weight for tag, weight in weights.items()}
            sorted_tags = sorted(
                tags,
                key=lambda t: weights_lower.get(t.lower(), 0.0),
                reverse=True  # Highest weight first
            )
        else:
            # No weights, process in original order
            sorted_tags = tags

        kept_tags = []
        kept_set = set()  # Lowercase versions for conflict checking

        for tag in sorted_tags:
            tag_lower = tag.lower()

            # Check if this tag conflicts with any kept tag
            conflicts_with_kept = kept_set & self.conflict_map.get(tag_lower, set())

            if conflicts_with_kept:
                # Drop this tag (lower weight or later in order)
                logger.debug(
                    "tag.dropped_due_to_conflict",
                    dropped_tag=tag,
                    conflicts_with=list(conflicts_with_kept),
                    weight=weights.get(tag) if weights else None
                )
                continue

            # Keep this tag
            kept_tags.append(tag)  # Keep original case
            kept_set.add(tag_lower)  # Track lowercase for conflict checking

        if len(kept_tags) < len(tags):
            logger.info(
                "tags.conflicts_resolved",
                original_count=len(tags),
                kept_count=len(kept_tags),
                dropped_count=len(tags) - len(kept_tags)
            )

        return kept_tags

    def reload_conflict_matrix(self) -> bool:
        """Reload the conflict matrix from file.

        Useful for updating the conflict map without restarting the service.

        Returns:
            True if reload successful, False otherwise
        """
        try:
            new_conflict_map = self._load_conflict_matrix(self.conflict_matrix_path)
            self.conflict_map = new_conflict_map
            logger.info(
                "conflict_matrix.reloaded",
                path=self.conflict_matrix_path,
                tag_count=len(new_conflict_map)
            )
            return True
        except Exception as e:
            logger.error(
                "conflict_matrix.reload_failed",
                path=self.conflict_matrix_path,
                error=str(e)
            )
            return False
