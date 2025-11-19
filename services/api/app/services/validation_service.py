"""Service layer for JSON schema validation.

This module implements JSON schema validation for SDS and all entity specs
using Draft-07 schemas with comprehensive error formatting. Also provides
tag conflict validation using the ConflictDetector service.

Extended with rubric scoring integration for VALIDATE and FIX workflow nodes.
"""

from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
from dataclasses import dataclass
import json
import structlog
from jsonschema import validate, ValidationError, Draft7Validator

from app.services.conflict_detector import ConflictDetector
from app.services.policy_guards import (
    ProfanityFilter,
    PIIDetector,
    ArtistNormalizer,
    PolicyEnforcer
)
from app.services.rubric_scorer import RubricScorer, ScoreReport, ThresholdDecision

logger = structlog.get_logger(__name__)


@dataclass
class ActionableReport:
    """Comprehensive validation report for VALIDATE node with actionable suggestions.

    This report combines rubric scoring, threshold validation, and improvement
    suggestions to provide a complete picture for the VALIDATE and FIX workflow nodes.

    Attributes:
        passed: True if all thresholds met
        decision: ThresholdDecision (PASS/FAIL/BORDERLINE)
        score_report: Full ScoreReport with all metrics
        margin: Distance from threshold (positive = pass, negative = fail)
        improvement_suggestions: List of actionable suggestions for FIX node
        should_trigger_fix: True if FAIL and fixable (not a hard failure)
        fix_targets: Specific metric names that need improvement
    """
    passed: bool
    decision: ThresholdDecision
    score_report: ScoreReport
    margin: float
    improvement_suggestions: List[str]
    should_trigger_fix: bool
    fix_targets: List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Convert actionable report to dictionary format.

        Returns:
            Dictionary representation of actionable report
        """
        return {
            "passed": self.passed,
            "decision": self.decision.value,
            "score_report": self.score_report.to_dict(),
            "margin": self.margin,
            "improvement_suggestions": self.improvement_suggestions,
            "should_trigger_fix": self.should_trigger_fix,
            "fix_targets": self.fix_targets
        }


class ValidationService:
    """Service for JSON schema validation of SDS and entities.

    Loads all JSON schemas from /schemas directory and provides validation
    methods for each entity type with detailed error reporting.
    """

    def __init__(self, blueprint_service: Optional['BlueprintService'] = None):
        """Initialize the validation service.

        Loads all JSON schemas from the /schemas directory at project root.
        Initializes ConflictDetector for tag validation.
        Initializes policy guards for content validation (profanity, PII, artist references).
        Initializes RubricScorer for rubric-based validation.
        Schemas are cached in memory for performance.

        Args:
            blueprint_service: Optional BlueprintService for rubric scoring.
                              If not provided, creates a new instance.
        """
        self.schemas: Dict[str, Any] = {}
        self._load_schemas()

        # Initialize conflict detector for tag validation
        self.conflict_detector = ConflictDetector()

        # Initialize policy guards for content validation
        self.profanity_filter = ProfanityFilter()
        self.pii_detector = PIIDetector()
        self.artist_normalizer = ArtistNormalizer()
        self.policy_enforcer = PolicyEnforcer(artist_normalizer=self.artist_normalizer)

        # Initialize blueprint service and rubric scorer
        # Import here to avoid circular dependency
        if blueprint_service is None:
            from app.services.blueprint_service import BlueprintService
            blueprint_service = BlueprintService()

        self.blueprint_service = blueprint_service
        self.rubric_scorer = RubricScorer(
            blueprint_service=self.blueprint_service,
            profanity_filter=self.profanity_filter,
            config_path=None  # Use default config path
        )

        logger.info(
            "validation_service.initialized",
            schema_count=len(self.schemas),
            schemas=list(self.schemas.keys()),
            conflict_detector_ready=self.conflict_detector is not None,
            profanity_filter_ready=self.profanity_filter is not None,
            pii_detector_ready=self.pii_detector is not None,
            artist_normalizer_ready=self.artist_normalizer is not None,
            policy_enforcer_ready=self.policy_enforcer is not None,
            blueprint_service_ready=self.blueprint_service is not None,
            rubric_scorer_ready=self.rubric_scorer is not None
        )

    def _load_schemas(self) -> None:
        """Load all JSON schemas from /schemas directory.

        Schemas are loaded from the project root /schemas directory.
        Missing schemas are logged as warnings but don't prevent initialization.
        """
        # Find project root (5 levels up from this file: validation_service.py -> services -> app -> api -> services -> MeatyMusic)
        # Path structure: /Users/miethe/dev/homelab/development/MeatyMusic/services/api/app/services/validation_service.py
        project_root = Path(__file__).parent.parent.parent.parent.parent
        schema_dir = project_root / "schemas"

        if not schema_dir.exists():
            logger.warning(
                "validation.schema_dir_not_found",
                path=str(schema_dir),
                message="Schema directory not found, validation will fail"
            )
            return

        schema_files = {
            "sds": "sds.schema.json",
            "style": "style.schema.json",
            "lyrics": "lyrics.schema.json",
            "producer_notes": "producer_notes.schema.json",
            "composed_prompt": "composed_prompt.schema.json",
            "blueprint": "blueprint.schema.json",
            "persona": "persona.schema.json",
            "source": "source.schema.json",
        }

        for schema_key, filename in schema_files.items():
            schema_path = schema_dir / filename
            if schema_path.exists():
                try:
                    with open(schema_path, 'r') as f:
                        self.schemas[schema_key] = json.load(f)
                    logger.debug(
                        "validation.schema_loaded",
                        schema=schema_key,
                        path=str(schema_path)
                    )
                except Exception as e:
                    logger.error(
                        "validation.schema_load_error",
                        schema=schema_key,
                        error=str(e)
                    )
            else:
                logger.warning(
                    "validation.schema_not_found",
                    schema=schema_key,
                    path=str(schema_path)
                )

    def _format_validation_errors(
        self,
        validator: Draft7Validator,
        data: Dict[str, Any]
    ) -> List[str]:
        """Format JSON schema validation errors into human-readable messages.

        Args:
            validator: JSON schema validator instance
            data: Data that was validated

        Returns:
            List of formatted error messages
        """
        errors = []
        for error in validator.iter_errors(data):
            # Build path to error location
            path = ".".join(str(p) for p in error.path) if error.path else "root"

            # Format the error message
            message = f"{path}: {error.message}"

            # Add validator context if helpful
            if error.validator == "required":
                # Extract field name from error message (handles both 'field' and field formats)
                field_name = error.message.split("'")[1] if "'" in error.message else error.message.strip()
                message = f"Missing required field: '{field_name}'"
            elif error.validator == "enum":
                message = f"{path}: Value must be one of {error.validator_value}"
            elif error.validator == "pattern":
                message = f"{path}: Does not match required pattern"
            elif error.validator in ("minimum", "maximum"):
                message = f"{path}: {error.message}"

            errors.append(message)

        return errors

    def validate_sds(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate Song Design Spec against JSON schema.

        Args:
            data: SDS dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
            - is_valid: True if validation passed, False otherwise
            - error_messages: List of validation error strings (empty if valid)
        """
        if "sds" not in self.schemas:
            logger.error("validation.sds_schema_missing")
            return False, ["SDS schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["sds"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.sds_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.sds_passed", field_count=len(data))
            return True, []

        except Exception as e:
            logger.error("validation.sds_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_style(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate Style entity against JSON schema.

        Args:
            data: Style dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if "style" not in self.schemas:
            logger.error("validation.style_schema_missing")
            return False, ["Style schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["style"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.style_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.style_passed")
            return True, []

        except Exception as e:
            logger.error("validation.style_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_lyrics(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate Lyrics entity against JSON schema.

        Args:
            data: Lyrics dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if "lyrics" not in self.schemas:
            logger.error("validation.lyrics_schema_missing")
            return False, ["Lyrics schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["lyrics"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.lyrics_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.lyrics_passed")
            return True, []

        except Exception as e:
            logger.error("validation.lyrics_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_producer_notes(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate ProducerNotes entity against JSON schema.

        Args:
            data: ProducerNotes dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if "producer_notes" not in self.schemas:
            logger.error("validation.producer_notes_schema_missing")
            return False, ["ProducerNotes schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["producer_notes"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.producer_notes_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.producer_notes_passed")
            return True, []

        except Exception as e:
            logger.error("validation.producer_notes_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_composed_prompt(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate ComposedPrompt entity against JSON schema.

        Args:
            data: ComposedPrompt dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if "composed_prompt" not in self.schemas:
            logger.error("validation.composed_prompt_schema_missing")
            return False, ["ComposedPrompt schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["composed_prompt"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.composed_prompt_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.composed_prompt_passed")
            return True, []

        except Exception as e:
            logger.error("validation.composed_prompt_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_blueprint(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate Blueprint entity against JSON schema.

        Args:
            data: Blueprint dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if "blueprint" not in self.schemas:
            logger.error("validation.blueprint_schema_missing")
            return False, ["Blueprint schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["blueprint"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.blueprint_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.blueprint_passed")
            return True, []

        except Exception as e:
            logger.error("validation.blueprint_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_persona(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate Persona entity against JSON schema.

        Args:
            data: Persona dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if "persona" not in self.schemas:
            logger.error("validation.persona_schema_missing")
            return False, ["Persona schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["persona"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.persona_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.persona_passed")
            return True, []

        except Exception as e:
            logger.error("validation.persona_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_source(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate Source entity against JSON schema.

        Args:
            data: Source dictionary to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        if "source" not in self.schemas:
            logger.error("validation.source_schema_missing")
            return False, ["Source schema not loaded"]

        try:
            validator = Draft7Validator(self.schemas["source"])
            errors = self._format_validation_errors(validator, data)

            if errors:
                logger.warning(
                    "validation.source_failed",
                    error_count=len(errors),
                    errors=errors
                )
                return False, errors

            logger.debug("validation.source_passed")
            return True, []

        except Exception as e:
            logger.error("validation.source_exception", error=str(e))
            return False, [f"Validation error: {str(e)}"]

    def validate_tags_for_conflicts(
        self,
        tags: List[str],
        context: Optional[str] = None,
        strategy: str = "keep-first",
        tag_priorities: Optional[Dict[str, float]] = None
    ) -> Tuple[bool, List[str], Dict[str, Any]]:
        """Validate tags for conflicts and optionally resolve them.

        This method detects tag conflicts using the conflict matrix and can
        automatically resolve them using the specified strategy. Returns a
        comprehensive report with conflict details and remediation options.

        Args:
            tags: List of tags to validate
            context: Optional context string for logging (e.g., "style", "prompt", "section")
            strategy: Resolution strategy to use:
                - "keep-first": Keep first occurrence, remove later conflicting tags (default)
                - "remove-lowest-priority": Remove tags with lowest priority values
                - "remove-highest-priority": Remove tags with highest priority values
            tag_priorities: Optional priority values for each tag (required for priority strategies)

        Returns:
            Tuple of (is_valid, cleaned_tags, report):
            - is_valid: True if no conflicts found, False if conflicts exist
            - cleaned_tags: List of tags after conflict resolution (may be same as input if no conflicts)
            - report: Dictionary containing:
                - conflict_count: Number of conflicts detected
                - conflicts: List of conflict details (tag_a, tag_b, reason, category)
                - removed_tags: List of tags that were removed during resolution
                - strategy_used: Resolution strategy applied
                - suggestions: Alternative resolution options (if conflicts found)

        Example:
            >>> service = ValidationService()
            >>> is_valid, cleaned, report = service.validate_tags_for_conflicts(
            ...     tags=["whisper", "anthemic", "upbeat"],
            ...     context="style",
            ...     strategy="keep-first"
            ... )
            >>> print(is_valid)
            False  # Conflicts detected
            >>> print(cleaned)
            ["whisper", "upbeat"]  # "anthemic" removed
            >>> print(report["conflict_count"])
            1
            >>> print(report["conflicts"][0])
            {
                "tag_a": "whisper",
                "tag_b": "anthemic",
                "reason": "vocal intensity contradiction",
                "category": "vocal_style"
            }
        """
        if not tags:
            logger.debug(
                "validation.tags_empty",
                context=context
            )
            return True, [], {
                "conflict_count": 0,
                "conflicts": [],
                "removed_tags": [],
                "strategy_used": strategy,
                "suggestions": {}
            }

        logger.debug(
            "validation.tags_conflict_check_start",
            tag_count=len(tags),
            context=context,
            strategy=strategy
        )

        try:
            # Step 1: Detect conflicts
            conflicts = self.conflict_detector.detect_tag_conflicts(tags)

            # Step 2: Resolve conflicts if any found
            if conflicts:
                # Apply resolution strategy
                cleaned_tags = self.conflict_detector.resolve_conflicts(
                    tags=tags,
                    strategy=strategy,
                    tag_priorities=tag_priorities
                )

                # Determine which tags were removed
                removed_tags = [tag for tag in tags if tag not in cleaned_tags]

                # Get comprehensive violation report for detailed info
                violation_report = self.conflict_detector.get_violation_report(
                    tags=tags,
                    include_remediation=True
                )

                # Build comprehensive report
                report = {
                    "conflict_count": len(conflicts),
                    "conflicts": conflicts,
                    "removed_tags": removed_tags,
                    "strategy_used": strategy,
                    "suggestions": violation_report.get("remediation_options", {})
                }

                logger.warning(
                    "validation.tags_conflicts_detected",
                    tag_count=len(tags),
                    conflict_count=len(conflicts),
                    removed_count=len(removed_tags),
                    removed_tags=removed_tags,
                    context=context,
                    strategy=strategy
                )

                return False, cleaned_tags, report

            else:
                # No conflicts - tags are valid as-is
                report = {
                    "conflict_count": 0,
                    "conflicts": [],
                    "removed_tags": [],
                    "strategy_used": strategy,
                    "suggestions": {}
                }

                logger.debug(
                    "validation.tags_no_conflicts",
                    tag_count=len(tags),
                    context=context
                )

                return True, tags, report

        except Exception as e:
            # Error during validation - log and return error report
            logger.error(
                "validation.tags_conflict_check_error",
                error=str(e),
                tag_count=len(tags),
                context=context,
                exc_info=True
            )

            # Return original tags with error in report
            error_report = {
                "conflict_count": 0,
                "conflicts": [],
                "removed_tags": [],
                "strategy_used": strategy,
                "suggestions": {},
                "error": str(e)
            }

            return True, tags, error_report

    # ===== Policy Validation Methods =====

    def validate_profanity(
        self,
        text: str,
        explicit_allowed: bool,
        context: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """Validate text for profanity violations.

        This method checks text against profanity rules based on the explicit content
        flag. Returns structured violation reports suitable for workflow integration.

        Args:
            text: Text to validate (lyrics, style description, etc.)
            explicit_allowed: If True, allows explicit content based on thresholds
            context: Optional context string for logging (e.g., "lyrics", "style")

        Returns:
            Tuple of (is_valid, report):
            - is_valid: True if no violations (text is compliant), False if violations detected
            - report: Comprehensive profanity validation report with:
                - has_violations: bool
                - violations: List[Dict] with violation details
                - profanity_score: float (0.0-1.0)
                - explicit_allowed: bool
                - mode: str
                - severity_summary: Dict[str, int]
                - compliant: bool

        Example:
            >>> service = ValidationService()
            >>> is_valid, report = service.validate_profanity(
            ...     text="Some lyrics text",
            ...     explicit_allowed=False,
            ...     context="lyrics"
            ... )
            >>> if not is_valid:
            ...     print(f"Found {len(report['violations'])} violations")
            ...     print(f"Profanity score: {report['profanity_score']}")
        """
        if not text:
            return True, {
                "has_violations": False,
                "violations": [],
                "profanity_score": 0.0,
                "explicit_allowed": explicit_allowed,
                "mode": "explicit" if explicit_allowed else "clean",
                "severity_summary": {"mild": 0, "moderate": 0, "strong": 0, "extreme": 0},
                "compliant": True,
                "violation_count": 0
            }

        logger.debug(
            "validation.profanity_check_start",
            text_length=len(text),
            explicit_allowed=explicit_allowed,
            context=context
        )

        try:
            # Get comprehensive profanity report
            report = self.profanity_filter.get_violation_report(
                text=text,
                explicit_allowed=explicit_allowed,
                mode="clean"  # Default mode for non-explicit
            )

            # Determine if violations are blocking
            is_valid = report["compliant"]

            logger.info(
                "validation.profanity_check_complete",
                text_length=len(text),
                is_valid=is_valid,
                violation_count=report.get("violation_count", 0),
                profanity_score=report.get("profanity_score", 0.0),
                context=context
            )

            return is_valid, report

        except Exception as e:
            logger.error(
                "validation.profanity_check_error",
                error=str(e),
                text_length=len(text),
                context=context,
                exc_info=True
            )

            # Return error report
            error_report = {
                "has_violations": False,
                "violations": [],
                "profanity_score": 0.0,
                "explicit_allowed": explicit_allowed,
                "mode": "error",
                "severity_summary": {},
                "compliant": True,  # Default to compliant on error
                "error": str(e)
            }

            return True, error_report

    def validate_pii(
        self,
        text: str,
        context: Optional[str] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """Validate and redact PII from text.

        This method detects personally identifiable information (emails, phone numbers,
        addresses, SSNs, etc.) and returns both a redacted version and violation report.

        Args:
            text: Text to validate and redact
            context: Optional context string for logging (e.g., "lyrics", "style")

        Returns:
            Tuple of (has_pii, redacted_text, report):
            - has_pii: True if PII was detected
            - redacted_text: Text with PII replaced by placeholders (e.g., [EMAIL])
            - report: Comprehensive PII detection report with:
                - has_pii: bool
                - pii_found: List[Dict] with detection details
                - redacted_text: str
                - original_text: str
                - summary: Dict with counts and types

        Example:
            >>> service = ValidationService()
            >>> has_pii, redacted, report = service.validate_pii(
            ...     text="Contact me at john@example.com",
            ...     context="lyrics"
            ... )
            >>> if has_pii:
            ...     print(f"Redacted: {redacted}")
            ...     print(f"Found {report['summary']['total_pii_count']} PII items")
        """
        if not text:
            return False, text, {
                "has_pii": False,
                "pii_found": [],
                "redacted_text": text,
                "original_text": text,
                "summary": {
                    "total_pii_count": 0,
                    "types": {},
                    "avg_confidence": 0.0
                }
            }

        logger.debug(
            "validation.pii_check_start",
            text_length=len(text),
            context=context
        )

        try:
            # Get comprehensive PII report with redaction
            report = self.pii_detector.get_pii_report(text=text)

            has_pii = report["has_pii"]
            redacted_text = report["redacted_text"]

            logger.info(
                "validation.pii_check_complete",
                text_length=len(text),
                has_pii=has_pii,
                pii_count=report["summary"]["total_pii_count"],
                pii_types=list(report["summary"]["types"].keys()),
                context=context
            )

            return has_pii, redacted_text, report

        except Exception as e:
            logger.error(
                "validation.pii_check_error",
                error=str(e),
                text_length=len(text),
                context=context,
                exc_info=True
            )

            # Return error report
            error_report = {
                "has_pii": False,
                "pii_found": [],
                "redacted_text": text,
                "original_text": text,
                "summary": {
                    "total_pii_count": 0,
                    "types": {},
                    "avg_confidence": 0.0
                },
                "error": str(e)
            }

            return False, text, error_report

    def validate_artist_references(
        self,
        text: str,
        public_release: bool,
        policy_mode: str = "strict"
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """Validate and normalize artist references in text.

        This method detects living artist references (e.g., "style of Taylor Swift")
        and normalizes them to generic descriptions for public release compliance.

        Args:
            text: Text to validate and normalize
            public_release: If True, enforce public release restrictions
            policy_mode: Policy enforcement mode (strict, warn, permissive)

        Returns:
            Tuple of (is_valid, normalized_text, report):
            - is_valid: True if compliant with policy mode
            - normalized_text: Text with artist references normalized
            - report: Comprehensive validation report with:
                - has_references: bool
                - references: List[Dict] with reference details
                - normalized_text: str
                - original_text: str
                - changes: List[Dict] documenting replacements
                - compliant: bool
                - violations: List[str] (for strict mode)

        Example:
            >>> service = ValidationService()
            >>> is_valid, normalized, report = service.validate_artist_references(
            ...     text="style of Taylor Swift with catchy hooks",
            ...     public_release=True,
            ...     policy_mode="strict"
            ... )
            >>> if not is_valid:
            ...     print(f"Violations: {report['violations']}")
            ...     print(f"Normalized: {normalized}")
        """
        if not text:
            return True, text, {
                "has_references": False,
                "references": [],
                "normalized_text": text,
                "original_text": text,
                "changes": [],
                "compliant": True,
                "violations": []
            }

        logger.debug(
            "validation.artist_check_start",
            text_length=len(text),
            public_release=public_release,
            policy_mode=policy_mode
        )

        try:
            # Detect artist references
            has_references, references = self.artist_normalizer.detect_artist_references(text)

            # Normalize if references found
            normalized_text = text
            changes = []

            if has_references:
                normalized_text, changes = self.artist_normalizer.normalize_influences(text)

            # Check compliance based on policy mode and public release flag
            compliant = True
            violations = []

            if public_release:
                # Use policy enforcer to check compliance
                mode_config = self.artist_normalizer.policy_modes.get(
                    policy_mode,
                    self.artist_normalizer.policy_modes.get("strict", {})
                )
                allow_artist_names = mode_config.get("allow_artist_names", False)

                if has_references and not allow_artist_names:
                    # Check strict compliance
                    compliant, violations = self.artist_normalizer.check_public_release_compliance(
                        text=text,
                        allow_artist_names=allow_artist_names
                    )

            # Build comprehensive report
            report = {
                "has_references": has_references,
                "references": references,
                "normalized_text": normalized_text,
                "original_text": text,
                "changes": changes,
                "compliant": compliant,
                "violations": violations,
                "policy_mode": policy_mode,
                "public_release": public_release
            }

            # For strict mode, is_valid = compliant
            # For warn mode, is_valid = True (but with violations logged)
            # For permissive mode, is_valid = True
            if policy_mode == "strict":
                is_valid = compliant
            elif policy_mode == "warn":
                is_valid = True  # Allow with warnings
                if not compliant:
                    logger.warning(
                        "validation.artist_references_warning",
                        violation_count=len(violations),
                        public_release=public_release
                    )
            else:  # permissive
                is_valid = True

            logger.info(
                "validation.artist_check_complete",
                text_length=len(text),
                has_references=has_references,
                reference_count=len(references),
                compliant=compliant,
                is_valid=is_valid,
                policy_mode=policy_mode,
                public_release=public_release
            )

            return is_valid, normalized_text, report

        except Exception as e:
            logger.error(
                "validation.artist_check_error",
                error=str(e),
                text_length=len(text),
                exc_info=True
            )

            # Return error report
            error_report = {
                "has_references": False,
                "references": [],
                "normalized_text": text,
                "original_text": text,
                "changes": [],
                "compliant": True,  # Default to compliant on error
                "violations": [],
                "error": str(e)
            }

            return True, text, error_report

    def validate_all_policies(
        self,
        content: Dict[str, Any],
        explicit_allowed: bool,
        public_release: bool,
        policy_mode: str = "strict"
    ) -> Tuple[bool, Dict[str, Any]]:
        """Run all policy checks on content dictionary.

        This method validates content against all policy guards:
        - Profanity filter
        - PII detector
        - Artist reference normalizer

        Checks multiple content fields (style, lyrics, producer_notes, etc.) and
        returns a comprehensive validation report with all violations and redactions.

        Args:
            content: Content dictionary to validate (e.g., {"style": "...", "lyrics": {...}})
            explicit_allowed: If True, allows explicit content
            public_release: If True, enforces public release restrictions
            policy_mode: Policy enforcement mode (strict, warn, permissive)

        Returns:
            Tuple of (is_valid, report):
            - is_valid: True if all policies pass
            - report: Comprehensive validation report with:
                - is_valid: bool
                - violations: Dict[str, List] categorized by policy type
                - redacted_content: Dict[str, str] with PII redacted
                - normalized_content: Dict[str, str] with artist references normalized
                - policy_mode: str
                - suggestions: List[str] for remediation

        Example:
            >>> service = ValidationService()
            >>> is_valid, report = service.validate_all_policies(
            ...     content={
            ...         "style": "style of Taylor Swift",
            ...         "lyrics": {"text": "Contact me at email@example.com"}
            ...     },
            ...     explicit_allowed=False,
            ...     public_release=True,
            ...     policy_mode="strict"
            ... )
            >>> if not is_valid:
            ...     print(f"Profanity violations: {len(report['violations']['profanity'])}")
            ...     print(f"PII violations: {len(report['violations']['pii'])}")
            ...     print(f"Artist violations: {len(report['violations']['artist_references'])}")
        """
        if not content:
            return True, {
                "is_valid": True,
                "violations": {
                    "profanity": [],
                    "pii": [],
                    "artist_references": []
                },
                "redacted_content": {},
                "normalized_content": {},
                "policy_mode": policy_mode,
                "suggestions": []
            }

        logger.debug(
            "validation.all_policies_check_start",
            content_fields=list(content.keys()),
            explicit_allowed=explicit_allowed,
            public_release=public_release,
            policy_mode=policy_mode
        )

        # Track violations by category
        all_violations = {
            "profanity": [],
            "pii": [],
            "artist_references": []
        }

        # Track redacted and normalized content
        redacted_content = {}
        normalized_content = {}

        # Track suggestions for remediation
        suggestions = []

        # Determine which fields to check
        text_fields = ["style", "lyrics", "producer_notes", "description", "prompt"]

        # Check each field
        for field in text_fields:
            if field not in content:
                continue

            field_value = content[field]

            # Extract text from different field types
            if isinstance(field_value, str):
                text_to_check = field_value
            elif isinstance(field_value, dict):
                # Handle structured fields like lyrics
                if "text" in field_value:
                    text_to_check = field_value["text"]
                elif "sections" in field_value:
                    # Concatenate all section texts
                    sections = field_value["sections"]
                    texts = []
                    for section in sections:
                        if isinstance(section, dict) and "text" in section:
                            texts.append(section["text"])
                    text_to_check = " ".join(texts)
                else:
                    # Try to serialize the dict
                    text_to_check = str(field_value)
            else:
                # Skip non-text fields
                continue

            if not text_to_check:
                continue

            # === Check 1: Profanity ===
            profanity_valid, profanity_report = self.validate_profanity(
                text=text_to_check,
                explicit_allowed=explicit_allowed,
                context=field
            )

            if profanity_report.get("has_violations", False):
                for violation in profanity_report.get("violations", []):
                    violation["field"] = field
                    all_violations["profanity"].append(violation)

            # === Check 2: PII ===
            has_pii, redacted_text, pii_report = self.validate_pii(
                text=text_to_check,
                context=field
            )

            if has_pii:
                for pii_item in pii_report.get("pii_found", []):
                    pii_item["field"] = field
                    all_violations["pii"].append(pii_item)

                # Store redacted version
                redacted_content[field] = redacted_text

            # === Check 3: Artist References ===
            artist_valid, normalized_text, artist_report = self.validate_artist_references(
                text=text_to_check,
                public_release=public_release,
                policy_mode=policy_mode
            )

            if artist_report.get("has_references", False):
                for reference in artist_report.get("references", []):
                    reference["field"] = field
                    all_violations["artist_references"].append(reference)

                # Store normalized version
                normalized_content[field] = normalized_text

                # Add violations for strict mode
                if not artist_valid:
                    for violation_msg in artist_report.get("violations", []):
                        # Already formatted as strings
                        pass

        # Determine overall validity
        is_valid = True

        # Profanity check
        if len(all_violations["profanity"]) > 0:
            is_valid = False
            suggestions.append("Reduce or remove profanity to comply with explicit content policy")

        # PII check (always fails if PII found)
        if len(all_violations["pii"]) > 0:
            is_valid = False
            suggestions.append("Remove or redact personally identifiable information (PII)")

        # Artist reference check (depends on policy mode)
        if len(all_violations["artist_references"]) > 0:
            if policy_mode == "strict" and public_release:
                is_valid = False
                suggestions.append("Replace living artist references with generic descriptions for public release")
            elif policy_mode == "warn":
                suggestions.append("Consider normalizing artist references for better compliance")

        # Build comprehensive report
        report = {
            "is_valid": is_valid,
            "violations": all_violations,
            "redacted_content": redacted_content,
            "normalized_content": normalized_content,
            "policy_mode": policy_mode,
            "suggestions": suggestions,
            "explicit_allowed": explicit_allowed,
            "public_release": public_release,
            "summary": {
                "total_violations": sum(len(v) for v in all_violations.values()),
                "profanity_count": len(all_violations["profanity"]),
                "pii_count": len(all_violations["pii"]),
                "artist_reference_count": len(all_violations["artist_references"])
            }
        }

        logger.info(
            "validation.all_policies_check_complete",
            is_valid=is_valid,
            total_violations=report["summary"]["total_violations"],
            profanity_count=report["summary"]["profanity_count"],
            pii_count=report["summary"]["pii_count"],
            artist_reference_count=report["summary"]["artist_reference_count"],
            policy_mode=policy_mode,
            public_release=public_release
        )

        return is_valid, report

    # ===== Rubric Scoring Methods =====

    def score_artifacts(
        self,
        lyrics: Dict[str, Any],
        style: Dict[str, Any],
        producer_notes: Dict[str, Any],
        genre: str,
        explicit_allowed: bool,
        blueprint_version: str = "latest"
    ) -> ScoreReport:
        """Score artifacts using rubric scorer.

        This method delegates to RubricScorer.score_artifacts() to calculate
        all 5 metrics (hook_density, singability, rhyme_tightness,
        section_completeness, profanity_score) and compute the weighted
        composite score based on genre-specific weights from blueprint.

        Used by VALIDATE workflow node to compute quality scores.

        Args:
            lyrics: Lyrics dictionary with sections
            style: Style dictionary with tags and metadata
            producer_notes: Producer notes dictionary
            genre: Genre name (e.g., "pop", "country")
            explicit_allowed: If True, explicit content is allowed
            blueprint_version: Blueprint version (default "latest")

        Returns:
            ScoreReport with all metrics, weights, thresholds, and explanations

        Raises:
            NotFoundError: If blueprint not found for genre

        Example:
            >>> service = ValidationService()
            >>> score_report = service.score_artifacts(
            ...     lyrics={"sections": [...]},
            ...     style={"tags": ["upbeat"]},
            ...     producer_notes={"structure": "Verse-Chorus"},
            ...     genre="pop",
            ...     explicit_allowed=False
            ... )
            >>> print(f"Total score: {score_report.total:.2f}")
            >>> print(f"Hook density: {score_report.hook_density:.2f}")
        """
        logger.info(
            "validation_service.score_artifacts_start",
            genre=genre,
            explicit_allowed=explicit_allowed,
            blueprint_version=blueprint_version
        )

        try:
            score_report = self.rubric_scorer.score_artifacts(
                lyrics=lyrics,
                style=style,
                producer_notes=producer_notes,
                genre=genre,
                explicit_allowed=explicit_allowed,
                blueprint_version=blueprint_version
            )

            logger.info(
                "validation_service.score_artifacts_complete",
                genre=genre,
                total_score=score_report.total,
                meets_threshold=score_report.meets_threshold,
                margin=score_report.margin
            )

            return score_report

        except Exception as e:
            logger.error(
                "validation_service.score_artifacts_error",
                genre=genre,
                error=str(e),
                exc_info=True
            )
            raise

    def evaluate_compliance(
        self,
        score_report: ScoreReport,
        genre: str,
        blueprint_version: str = "latest"
    ) -> Tuple[bool, ActionableReport]:
        """Evaluate if scores meet blueprint thresholds.

        This method validates threshold compliance and generates an actionable
        report with improvement suggestions for the FIX workflow node.

        The method:
        1. Loads the blueprint for the genre
        2. Validates threshold compliance (min_total, max_profanity)
        3. Determines if FIX loop should be triggered
        4. Identifies specific metrics that need improvement
        5. Returns comprehensive ActionableReport

        Used by VALIDATE workflow node to determine pass/fail and trigger FIX.

        Args:
            score_report: ScoreReport from score_artifacts()
            genre: Genre name for loading blueprint
            blueprint_version: Blueprint version (default "latest")

        Returns:
            Tuple of (passed, actionable_report):
            - passed: True if all thresholds met
            - actionable_report: ActionableReport with decision, suggestions, fix targets

        Example:
            >>> service = ValidationService()
            >>> score_report = service.score_artifacts(...)
            >>> passed, report = service.evaluate_compliance(
            ...     score_report=score_report,
            ...     genre="pop"
            ... )
            >>> if not passed and report.should_trigger_fix:
            ...     print("Triggering FIX loop")
            ...     for target in report.fix_targets:
            ...         print(f"  - Fix: {target}")
            ...     for suggestion in report.improvement_suggestions:
            ...         print(f"  - {suggestion}")
        """
        logger.info(
            "validation_service.evaluate_compliance_start",
            genre=genre,
            total_score=score_report.total,
            blueprint_version=blueprint_version
        )

        try:
            # Load blueprint
            blueprint = self.blueprint_service.get_or_load_blueprint(
                genre=genre,
                version=blueprint_version
            )

            # Validate thresholds
            decision, margin, suggestions = self.rubric_scorer.validate_thresholds(
                score_report=score_report,
                blueprint=blueprint
            )

            # Determine pass/fail
            passed = decision == ThresholdDecision.PASS

            # Determine if FIX should be triggered
            # FAIL -> trigger FIX
            # BORDERLINE -> trigger FIX (to improve to safe margin)
            # PASS -> no FIX needed
            should_trigger_fix = decision in (ThresholdDecision.FAIL, ThresholdDecision.BORDERLINE)

            # Identify specific metrics that need improvement (fix targets)
            fix_targets = self._identify_fix_targets(score_report, blueprint)

            # Build actionable report
            actionable_report = ActionableReport(
                passed=passed,
                decision=decision,
                score_report=score_report,
                margin=margin,
                improvement_suggestions=suggestions,
                should_trigger_fix=should_trigger_fix,
                fix_targets=fix_targets
            )

            logger.info(
                "validation_service.evaluate_compliance_complete",
                genre=genre,
                passed=passed,
                decision=decision.value,
                margin=margin,
                should_trigger_fix=should_trigger_fix,
                fix_target_count=len(fix_targets),
                suggestion_count=len(suggestions)
            )

            return passed, actionable_report

        except Exception as e:
            logger.error(
                "validation_service.evaluate_compliance_error",
                genre=genre,
                error=str(e),
                exc_info=True
            )
            raise

    def _identify_fix_targets(
        self,
        score_report: ScoreReport,
        blueprint: 'Blueprint'
    ) -> List[str]:
        """Identify specific metrics that need improvement.

        Analyzes score report to determine which metrics are below target
        thresholds and should be targeted by the FIX workflow node.

        Args:
            score_report: ScoreReport from score_artifacts()
            blueprint: Blueprint with thresholds and weights

        Returns:
            List of metric names that need improvement (e.g., ["hook_density", "profanity_score"])
        """
        fix_targets = []

        # Target threshold for individual metrics
        metric_target = 0.75

        # Extract thresholds
        thresholds = blueprint.eval_rubric.get("thresholds", {})
        max_profanity = thresholds.get("max_profanity", 0.1)

        # Check each metric
        if score_report.hook_density < metric_target:
            fix_targets.append("hook_density")

        if score_report.singability < metric_target:
            fix_targets.append("singability")

        if score_report.rhyme_tightness < metric_target:
            fix_targets.append("rhyme_tightness")

        if score_report.section_completeness < 1.0:
            fix_targets.append("section_completeness")

        # Check profanity (inverse scoring)
        profanity_violation_ratio = 1.0 - score_report.profanity_score
        if profanity_violation_ratio > max_profanity:
            fix_targets.append("profanity_score")

        logger.debug(
            "validation_service.identify_fix_targets",
            fix_target_count=len(fix_targets),
            fix_targets=fix_targets,
            hook_density=score_report.hook_density,
            singability=score_report.singability,
            rhyme_tightness=score_report.rhyme_tightness,
            section_completeness=score_report.section_completeness,
            profanity_score=score_report.profanity_score
        )

        return fix_targets
