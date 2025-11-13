"""Service layer for JSON schema validation.

This module implements JSON schema validation for SDS and all entity specs
using Draft-07 schemas with comprehensive error formatting.
"""

from typing import Dict, Any, List, Tuple
from pathlib import Path
import json
import structlog
from jsonschema import validate, ValidationError, Draft7Validator

logger = structlog.get_logger(__name__)


class ValidationService:
    """Service for JSON schema validation of SDS and entities.

    Loads all JSON schemas from /schemas directory and provides validation
    methods for each entity type with detailed error reporting.
    """

    def __init__(self):
        """Initialize the validation service.

        Loads all JSON schemas from the /schemas directory at project root.
        Schemas are cached in memory for performance.
        """
        self.schemas: Dict[str, Any] = {}
        self._load_schemas()
        logger.info(
            "validation_service.initialized",
            schema_count=len(self.schemas),
            schemas=list(self.schemas.keys())
        )

    def _load_schemas(self) -> None:
        """Load all JSON schemas from /schemas directory.

        Schemas are loaded from the project root /schemas directory.
        Missing schemas are logged as warnings but don't prevent initialization.
        """
        # Find project root (4 levels up from this file)
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
