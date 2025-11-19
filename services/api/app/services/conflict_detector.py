"""Conflict Detection Service - Tag conflict detection and resolution with detailed reporting.

This module implements comprehensive tag conflict detection and resolution for the
MeatyMusic AMCS validation framework. It provides multiple resolution strategies,
detailed violation reports, and remediation recommendations.

Key Features:
- Multiple resolution strategies (remove-lowest-priority, remove-highest-priority, keep-first)
- Detailed conflict reports with category and reason information
- Remediation suggestions for conflicting tags
- Deterministic conflict resolution (same inputs → same outputs)
- Comprehensive structured logging
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple, Set, Literal
from pathlib import Path
import json
import structlog

from app.services.tag_conflict_resolver import TagConflictResolver

logger = structlog.get_logger(__name__)

# Type alias for resolution strategies
ResolutionStrategy = Literal["remove-lowest-priority", "remove-highest-priority", "keep-first"]

# Type alias for conflict reports
ConflictReport = Dict[str, any]
ViolationReport = Dict[str, any]


class ConflictDetector:
    """Service for detecting and resolving tag conflicts with detailed reporting.

    This service provides comprehensive tag conflict detection and resolution using
    the conflict matrix from taxonomies/conflict_matrix.json. It supports multiple
    resolution strategies and returns detailed violation reports with remediation
    options.

    Resolution Strategies:
    - remove-lowest-priority: Remove tags with lower priority (later in list)
    - remove-highest-priority: Remove tags with higher priority (earlier in list)
    - keep-first: Keep first occurrence of conflicting tags (default strategy)

    Attributes:
        resolver: TagConflictResolver instance for core conflict logic
        conflict_matrix_data: Raw conflict matrix data with categories and reasons

    Example:
        >>> detector = ConflictDetector()
        >>> conflicts = detector.detect_tag_conflicts(["whisper", "anthemic"])
        >>> print(conflicts)
        [
            {
                "tag_a": "whisper",
                "tag_b": "anthemic",
                "reason": "vocal intensity contradiction",
                "category": "vocal_style"
            }
        ]

        >>> cleaned_tags = detector.resolve_conflicts(
        ...     ["whisper", "anthemic", "upbeat"],
        ...     strategy="keep-first"
        ... )
        >>> print(cleaned_tags)
        ["whisper", "upbeat"]  # "anthemic" removed
    """

    def __init__(self, conflict_matrix_path: Optional[str] = None):
        """Initialize the conflict detector.

        Args:
            conflict_matrix_path: Optional path to conflict matrix JSON file.
                                If None, uses default path at taxonomies/conflict_matrix.json
        """
        # Initialize the base resolver
        self.resolver = TagConflictResolver(conflict_matrix_path)

        # Load full conflict matrix data for detailed reporting
        if conflict_matrix_path is None:
            project_root = Path(__file__).parent.parent.parent.parent.parent
            conflict_matrix_path = str(project_root / "taxonomies" / "conflict_matrix.json")

        self.conflict_matrix_path = conflict_matrix_path
        self.conflict_matrix_data = self._load_conflict_matrix_data()

        logger.info(
            "conflict_detector.initialized",
            conflict_matrix_path=conflict_matrix_path,
            tag_count=len(self.resolver.conflict_map),
            has_detailed_data=len(self.conflict_matrix_data) > 0
        )

    def _load_conflict_matrix_data(self) -> List[Dict]:
        """Load full conflict matrix data including categories and reasons.

        Returns:
            List of conflict entries with tag, Tags, Reason, and Category fields
        """
        try:
            with open(self.conflict_matrix_path, 'r') as f:
                data = json.load(f)

            if not isinstance(data, list):
                logger.warning(
                    "conflict_matrix.invalid_format",
                    path=self.conflict_matrix_path,
                    message="Expected array format"
                )
                return []

            logger.debug(
                "conflict_matrix.data_loaded",
                path=self.conflict_matrix_path,
                entry_count=len(data)
            )

            return data

        except FileNotFoundError:
            logger.warning(
                "conflict_matrix.not_found",
                path=self.conflict_matrix_path,
                message="Conflict matrix file not found"
            )
            return []
        except json.JSONDecodeError as e:
            logger.error(
                "conflict_matrix.parse_error",
                path=self.conflict_matrix_path,
                error=str(e),
                message="Failed to parse JSON"
            )
            return []
        except Exception as e:
            logger.error(
                "conflict_matrix.load_error",
                path=self.conflict_matrix_path,
                error=str(e),
                message="Unexpected error loading conflict matrix"
            )
            return []

    def _get_conflict_details(
        self,
        tag_a: str,
        tag_b: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """Get detailed information about a conflict.

        Args:
            tag_a: First tag in conflict pair
            tag_b: Second tag in conflict pair

        Returns:
            Tuple of (reason, category) for the conflict
            Returns (None, None) if details not found
        """
        tag_a_lower = tag_a.lower()
        tag_b_lower = tag_b.lower()

        # Search conflict matrix data for matching entry
        for entry in self.conflict_matrix_data:
            if not isinstance(entry, dict):
                continue

            entry_tag = entry.get("tag", "").lower()
            conflicting_tags = [t.lower() for t in entry.get("Tags", [])]

            # Check if this entry defines the conflict
            if entry_tag == tag_a_lower and tag_b_lower in conflicting_tags:
                return entry.get("Reason"), entry.get("Category")
            elif entry_tag == tag_b_lower and tag_a_lower in conflicting_tags:
                return entry.get("Reason"), entry.get("Category")

        # No detailed information found
        return None, None

    def detect_tag_conflicts(
        self,
        tags: List[str]
    ) -> List[ConflictReport]:
        """Detect all tag conflicts in the provided list.

        Analyzes the tag list and returns detailed information about each
        conflict found, including the conflicting tags, reason, and category.

        Args:
            tags: List of style tags to check for conflicts

        Returns:
            List of conflict reports, each containing:
            - tag_a: First tag in conflict
            - tag_b: Second tag in conflict
            - reason: Human-readable explanation of why they conflict
            - category: Conflict category (e.g., "vocal_style", "instrumentation")

        Example:
            >>> conflicts = detector.detect_tag_conflicts(["whisper", "anthemic"])
            >>> print(conflicts[0])
            {
                "tag_a": "whisper",
                "tag_b": "anthemic",
                "reason": "vocal intensity contradiction",
                "category": "vocal_style"
            }
        """
        if not tags:
            logger.debug("conflict_detector.empty_tag_list")
            return []

        # Use base resolver to find conflict pairs
        conflict_pairs = self.resolver.find_conflicts(tags)

        # Build detailed conflict reports
        conflict_reports = []
        for tag_a, tag_b in conflict_pairs:
            # Get detailed information
            reason, category = self._get_conflict_details(tag_a, tag_b)

            report: ConflictReport = {
                "tag_a": tag_a,
                "tag_b": tag_b,
                "reason": reason if reason else "Tags conflict with each other",
                "category": category if category else "unknown"
            }

            conflict_reports.append(report)

        if conflict_reports:
            logger.info(
                "conflict_detector.conflicts_detected",
                tag_count=len(tags),
                conflict_count=len(conflict_reports),
                conflicts=[f"{c['tag_a']} ↔ {c['tag_b']}" for c in conflict_reports]
            )
        else:
            logger.debug(
                "conflict_detector.no_conflicts",
                tag_count=len(tags)
            )

        return conflict_reports

    def resolve_conflicts(
        self,
        tags: List[str],
        strategy: ResolutionStrategy = "keep-first",
        tag_priorities: Optional[Dict[str, float]] = None
    ) -> List[str]:
        """Resolve tag conflicts using the specified strategy.

        Removes conflicting tags according to the chosen resolution strategy,
        returning a conflict-free tag list while maintaining determinism.

        Args:
            tags: List of tags (may contain conflicts)
            strategy: Resolution strategy to use:
                - "keep-first": Keep first occurrence in list, remove later ones (default)
                - "remove-lowest-priority": Remove tags with lowest priority values
                - "remove-highest-priority": Remove tags with highest priority values
            tag_priorities: Optional priority values for each tag (required for priority strategies)

        Returns:
            Conflict-free tag list

        Raises:
            ValueError: If priority strategy selected but tag_priorities not provided

        Example:
            >>> # Keep-first strategy (default)
            >>> cleaned = detector.resolve_conflicts(
            ...     ["whisper", "anthemic", "upbeat"],
            ...     strategy="keep-first"
            ... )
            >>> print(cleaned)
            ["whisper", "upbeat"]  # "anthemic" removed (conflicts with "whisper")

            >>> # Priority-based strategy
            >>> cleaned = detector.resolve_conflicts(
            ...     ["whisper", "anthemic", "upbeat"],
            ...     strategy="remove-lowest-priority",
            ...     tag_priorities={"whisper": 0.5, "anthemic": 0.8, "upbeat": 0.6}
            ... )
            >>> print(cleaned)
            ["anthemic", "upbeat"]  # "whisper" removed (lowest priority)
        """
        if not tags:
            logger.debug("conflict_detector.empty_tag_list")
            return []

        # Validate strategy and priorities
        if strategy in ("remove-lowest-priority", "remove-highest-priority"):
            if not tag_priorities:
                raise ValueError(
                    f"Strategy '{strategy}' requires tag_priorities to be provided"
                )

        logger.debug(
            "conflict_detector.resolving_conflicts",
            tag_count=len(tags),
            strategy=strategy,
            has_priorities=tag_priorities is not None
        )

        # Apply resolution strategy
        if strategy == "keep-first":
            # Keep first occurrence, remove later conflicting tags
            resolved_tags = self._resolve_keep_first(tags)

        elif strategy == "remove-lowest-priority":
            # Remove tags with lowest priority values
            resolved_tags = self._resolve_remove_lowest_priority(tags, tag_priorities)

        elif strategy == "remove-highest-priority":
            # Remove tags with highest priority values
            resolved_tags = self._resolve_remove_highest_priority(tags, tag_priorities)

        else:
            # Unknown strategy - log error and use keep-first as fallback
            logger.error(
                "conflict_detector.unknown_strategy",
                strategy=strategy,
                valid_strategies=["keep-first", "remove-lowest-priority", "remove-highest-priority"],
                fallback="keep-first"
            )
            resolved_tags = self._resolve_keep_first(tags)

        # Log resolution results
        if len(resolved_tags) < len(tags):
            removed_count = len(tags) - len(resolved_tags)
            removed_tags = [t for t in tags if t not in resolved_tags]

            logger.info(
                "conflict_detector.conflicts_resolved",
                original_count=len(tags),
                resolved_count=len(resolved_tags),
                removed_count=removed_count,
                removed_tags=removed_tags,
                strategy=strategy
            )
        else:
            logger.debug(
                "conflict_detector.no_changes",
                tag_count=len(tags),
                strategy=strategy
            )

        return resolved_tags

    def _resolve_keep_first(self, tags: List[str]) -> List[str]:
        """Resolve conflicts by keeping first occurrence.

        This is the default deterministic strategy. For each conflict, the tag
        that appears first in the list is kept, and later conflicting tags are removed.

        Args:
            tags: List of tags

        Returns:
            Conflict-free tag list maintaining original order
        """
        kept_tags = []
        kept_set = set()  # Lowercase versions for conflict checking

        for tag in tags:
            tag_lower = tag.lower()

            # Check if this tag conflicts with any kept tag
            conflicts_with_kept = kept_set & self.resolver.conflict_map.get(tag_lower, set())

            if conflicts_with_kept:
                # Drop this tag (keep earlier one)
                logger.debug(
                    "conflict_detector.tag_dropped_keep_first",
                    dropped_tag=tag,
                    conflicts_with=list(conflicts_with_kept)
                )
                continue

            # Keep this tag
            kept_tags.append(tag)
            kept_set.add(tag_lower)

        return kept_tags

    def _resolve_remove_lowest_priority(
        self,
        tags: List[str],
        tag_priorities: Dict[str, float]
    ) -> List[str]:
        """Resolve conflicts by removing tags with lowest priority.

        For each conflict, the tag with the lower priority value is removed.
        This preserves higher-priority tags.

        Args:
            tags: List of tags
            tag_priorities: Priority values for each tag (higher = more important)

        Returns:
            Conflict-free tag list
        """
        # Normalize tag keys in priorities to lowercase for matching
        priorities_lower = {tag.lower(): priority for tag, priority in tag_priorities.items()}

        # Sort tags by priority descending (highest priority first)
        sorted_tags = sorted(
            tags,
            key=lambda t: priorities_lower.get(t.lower(), 0.0),
            reverse=True  # Highest priority first
        )

        kept_tags = []
        kept_set = set()

        for tag in sorted_tags:
            tag_lower = tag.lower()

            # Check if this tag conflicts with any kept tag
            conflicts_with_kept = kept_set & self.resolver.conflict_map.get(tag_lower, set())

            if conflicts_with_kept:
                # Drop this tag (it has lower priority since we sorted)
                priority = priorities_lower.get(tag_lower, 0.0)
                logger.debug(
                    "conflict_detector.tag_dropped_low_priority",
                    dropped_tag=tag,
                    priority=priority,
                    conflicts_with=list(conflicts_with_kept)
                )
                continue

            # Keep this tag
            kept_tags.append(tag)
            kept_set.add(tag_lower)

        # Restore original order (maintain determinism)
        # Create lookup for kept tags
        kept_lower = {t.lower() for t in kept_tags}
        result = [tag for tag in tags if tag.lower() in kept_lower]

        return result

    def _resolve_remove_highest_priority(
        self,
        tags: List[str],
        tag_priorities: Dict[str, float]
    ) -> List[str]:
        """Resolve conflicts by removing tags with highest priority.

        For each conflict, the tag with the higher priority value is removed.
        This is the inverse of remove-lowest-priority.

        Args:
            tags: List of tags
            tag_priorities: Priority values for each tag (higher = more important)

        Returns:
            Conflict-free tag list
        """
        # Normalize tag keys in priorities to lowercase for matching
        priorities_lower = {tag.lower(): priority for tag, priority in tag_priorities.items()}

        # Sort tags by priority ascending (lowest priority first)
        sorted_tags = sorted(
            tags,
            key=lambda t: priorities_lower.get(t.lower(), 0.0),
            reverse=False  # Lowest priority first
        )

        kept_tags = []
        kept_set = set()

        for tag in sorted_tags:
            tag_lower = tag.lower()

            # Check if this tag conflicts with any kept tag
            conflicts_with_kept = kept_set & self.resolver.conflict_map.get(tag_lower, set())

            if conflicts_with_kept:
                # Drop this tag (it has higher priority since we sorted ascending)
                priority = priorities_lower.get(tag_lower, 0.0)
                logger.debug(
                    "conflict_detector.tag_dropped_high_priority",
                    dropped_tag=tag,
                    priority=priority,
                    conflicts_with=list(conflicts_with_kept)
                )
                continue

            # Keep this tag
            kept_tags.append(tag)
            kept_set.add(tag_lower)

        # Restore original order (maintain determinism)
        kept_lower = {t.lower() for t in kept_tags}
        result = [tag for tag in tags if tag.lower() in kept_lower]

        return result

    def get_violation_report(
        self,
        tags: List[str],
        include_remediation: bool = True
    ) -> ViolationReport:
        """Generate detailed violation report for tag conflicts.

        Creates a comprehensive report of all conflicts found in the tag list,
        including conflict details, suggested resolutions, and remediation options.

        Args:
            tags: List of tags to check
            include_remediation: Whether to include remediation suggestions

        Returns:
            Violation report dict containing:
            - is_valid: Whether tags are conflict-free
            - tag_count: Number of tags analyzed
            - conflict_count: Number of conflicts found
            - conflicts: List of detailed conflict reports
            - suggested_resolution: Recommended tags after conflict resolution (if requested)
            - remediation_options: Alternative resolution strategies (if requested)

        Example:
            >>> report = detector.get_violation_report(["whisper", "anthemic", "upbeat"])
            >>> print(report)
            {
                "is_valid": False,
                "tag_count": 3,
                "conflict_count": 1,
                "conflicts": [
                    {
                        "tag_a": "whisper",
                        "tag_b": "anthemic",
                        "reason": "vocal intensity contradiction",
                        "category": "vocal_style"
                    }
                ],
                "suggested_resolution": ["whisper", "upbeat"],
                "remediation_options": {
                    "keep_first": ["whisper", "upbeat"],
                    "remove_anthemic": ["whisper", "upbeat"],
                    "remove_whisper": ["anthemic", "upbeat"]
                }
            }
        """
        # Detect conflicts
        conflicts = self.detect_tag_conflicts(tags)

        # Build base report
        report: ViolationReport = {
            "is_valid": len(conflicts) == 0,
            "tag_count": len(tags),
            "conflict_count": len(conflicts),
            "conflicts": conflicts
        }

        # Add remediation if requested
        if include_remediation and conflicts:
            # Suggested resolution using keep-first strategy (default)
            suggested = self.resolve_conflicts(tags, strategy="keep-first")
            report["suggested_resolution"] = suggested

            # Alternative remediation options
            remediation_options = {}

            # Option 1: Keep-first strategy
            remediation_options["keep_first"] = suggested

            # Option 2: For each conflict, show result of removing each tag
            for conflict in conflicts:
                tag_a = conflict["tag_a"]
                tag_b = conflict["tag_b"]

                # Option to remove tag_a
                without_a = [t for t in tags if t.lower() != tag_a.lower()]
                remediation_options[f"remove_{tag_a}"] = without_a

                # Option to remove tag_b
                without_b = [t for t in tags if t.lower() != tag_b.lower()]
                remediation_options[f"remove_{tag_b}"] = without_b

            report["remediation_options"] = remediation_options

        logger.debug(
            "conflict_detector.violation_report_generated",
            is_valid=report["is_valid"],
            tag_count=report["tag_count"],
            conflict_count=report["conflict_count"],
            has_remediation=include_remediation
        )

        return report

    def reload_conflict_matrix(self) -> bool:
        """Reload the conflict matrix from file.

        Useful for updating the conflict rules without restarting the service.

        Returns:
            True if reload successful, False otherwise
        """
        try:
            # Reload in base resolver
            success = self.resolver.reload_conflict_matrix()

            if success:
                # Reload detailed data
                self.conflict_matrix_data = self._load_conflict_matrix_data()

                logger.info(
                    "conflict_detector.matrix_reloaded",
                    path=self.conflict_matrix_path,
                    tag_count=len(self.resolver.conflict_map),
                    data_entries=len(self.conflict_matrix_data)
                )
                return True
            else:
                logger.error(
                    "conflict_detector.reload_failed",
                    path=self.conflict_matrix_path
                )
                return False

        except Exception as e:
            logger.error(
                "conflict_detector.reload_error",
                path=self.conflict_matrix_path,
                error=str(e),
                exc_info=True
            )
            return False


# =============================================================================
# Convenience Functions
# =============================================================================


def detect_tag_conflicts(tags: List[str]) -> List[ConflictReport]:
    """Convenience function to detect tag conflicts.

    Creates a ConflictDetector instance and detects conflicts in the tag list.
    For repeated calls, consider creating a ConflictDetector instance directly
    to avoid reloading the conflict matrix.

    Args:
        tags: List of tags to check

    Returns:
        List of conflict reports

    Example:
        >>> conflicts = detect_tag_conflicts(["whisper", "anthemic"])
        >>> print(len(conflicts))
        1
    """
    detector = ConflictDetector()
    return detector.detect_tag_conflicts(tags)


def resolve_conflicts(
    tags: List[str],
    strategy: ResolutionStrategy = "keep-first",
    tag_priorities: Optional[Dict[str, float]] = None
) -> List[str]:
    """Convenience function to resolve tag conflicts.

    Creates a ConflictDetector instance and resolves conflicts using the
    specified strategy. For repeated calls, consider creating a ConflictDetector
    instance directly to avoid reloading the conflict matrix.

    Args:
        tags: List of tags (may contain conflicts)
        strategy: Resolution strategy ("keep-first", "remove-lowest-priority", "remove-highest-priority")
        tag_priorities: Optional priority values for priority-based strategies

    Returns:
        Conflict-free tag list

    Example:
        >>> cleaned = resolve_conflicts(["whisper", "anthemic", "upbeat"])
        >>> print(cleaned)
        ["whisper", "upbeat"]
    """
    detector = ConflictDetector()
    return detector.resolve_conflicts(tags, strategy, tag_priorities)


# =============================================================================
# Module Exports
# =============================================================================

__all__ = [
    "ConflictDetector",
    "detect_tag_conflicts",
    "resolve_conflicts",
    "ConflictReport",
    "ViolationReport",
    "ResolutionStrategy",
]
