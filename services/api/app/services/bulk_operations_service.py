"""Bulk operations service for entity management.

This module provides generic bulk operations (delete, export) that work
with any repository and entity type, following MeatyMusic architecture patterns.
"""

from __future__ import annotations

import io
import json
import re
import zipfile
from datetime import datetime
from typing import Any, Dict, List, Type, TypeVar
from uuid import UUID

import structlog
from opentelemetry import trace
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository

logger = structlog.get_logger(__name__)
tracer = trace.get_tracer(__name__)

# Type variable for generic model types
T = TypeVar("T")


class BulkOperationsService:
    """Service for bulk operations on entities.

    Provides generic implementations of:
    - Bulk delete: Delete multiple entities by IDs
    - Bulk export: Export multiple entities as ZIP file

    Follows MP patterns:
    - Layered architecture (service → repository)
    - Telemetry spans for observability
    - Structured logging with entity counts
    - Proper error handling with partial failure tracking
    """

    def __init__(self, session: Session):
        """Initialize bulk operations service.

        Args:
            session: SQLAlchemy session for database operations
        """
        self._session = session

    async def bulk_delete_entities(
        self,
        model_class: Type[T],
        repository: BaseRepository[T],
        entity_ids: List[UUID],
        entity_type_name: str,
    ) -> Dict[str, Any]:
        """Delete multiple entities by IDs with partial failure tracking.

        Args:
            model_class: The SQLAlchemy model class
            repository: Repository instance for the entity type
            entity_ids: List of entity IDs to delete
            entity_type_name: Human-readable entity type name (e.g., "style", "lyrics")

        Returns:
            Dict with deleted_count, failed_ids, and errors

        Example:
            ```python
            result = await bulk_ops.bulk_delete_entities(
                Style,
                style_repo,
                [uuid1, uuid2, uuid3],
                "style"
            )
            # Returns: {"deleted_count": 2, "failed_ids": [uuid3], "errors": ["..."]}
            ```
        """
        with tracer.start_as_current_span(
            "bulk_delete_entities",
            attributes={
                "entity_type": entity_type_name,
                "entity_count": len(entity_ids),
            },
        ) as span:
            logger.info(
                "bulk_delete.start",
                entity_type=entity_type_name,
                count=len(entity_ids),
            )

            deleted_count = 0
            failed_ids: List[UUID] = []
            errors: List[str] = []

            for entity_id in entity_ids:
                try:
                    # Check if entity exists
                    entity = repository.get_by_id(model_class, entity_id)
                    if not entity:
                        failed_ids.append(entity_id)
                        errors.append(f"{entity_type_name} {entity_id} not found")
                        logger.warning(
                            "bulk_delete.entity_not_found",
                            entity_type=entity_type_name,
                            entity_id=str(entity_id),
                        )
                        continue

                    # Delete the entity
                    repository.delete(model_class, entity_id)
                    deleted_count += 1
                    logger.debug(
                        "bulk_delete.entity_deleted",
                        entity_type=entity_type_name,
                        entity_id=str(entity_id),
                    )

                except Exception as e:
                    failed_ids.append(entity_id)
                    error_msg = f"Failed to delete {entity_type_name} {entity_id}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(
                        "bulk_delete.entity_failed",
                        entity_type=entity_type_name,
                        entity_id=str(entity_id),
                        error=str(e),
                        exc_info=True,
                    )

            # Add telemetry attributes
            span.set_attribute("deleted_count", deleted_count)
            span.set_attribute("failed_count", len(failed_ids))

            logger.info(
                "bulk_delete.complete",
                entity_type=entity_type_name,
                deleted_count=deleted_count,
                failed_count=len(failed_ids),
            )

            return {
                "deleted_count": deleted_count,
                "failed_ids": failed_ids,
                "errors": errors,
            }

    async def bulk_export_entities_zip(
        self,
        model_class: Type[T],
        repository: BaseRepository[T],
        entity_ids: List[UUID],
        entity_type_name: str,
        response_schema: Type[BaseModel],
    ) -> io.BytesIO:
        """Export multiple entities as a ZIP file.

        Args:
            model_class: The SQLAlchemy model class
            repository: Repository instance for the entity type
            entity_ids: List of entity IDs to export
            entity_type_name: Human-readable entity type name (e.g., "style", "lyrics")
            response_schema: Pydantic schema for serialization

        Returns:
            BytesIO buffer containing ZIP file

        Raises:
            ValueError: If no entities found or all exports fail

        Example:
            ```python
            zip_buffer = await bulk_ops.bulk_export_entities_zip(
                Style,
                style_repo,
                [uuid1, uuid2],
                "style",
                StyleResponse
            )
            # Returns: BytesIO with ZIP containing style-name1.json, style-name2.json
            ```
        """
        with tracer.start_as_current_span(
            "bulk_export_entities_zip",
            attributes={
                "entity_type": entity_type_name,
                "entity_count": len(entity_ids),
            },
        ) as span:
            logger.info(
                "bulk_export.start",
                entity_type=entity_type_name,
                count=len(entity_ids),
            )

            # Create in-memory ZIP file
            zip_buffer = io.BytesIO()
            exported_count = 0
            failed_count = 0

            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for entity_id in entity_ids:
                    try:
                        # Fetch entity
                        entity = repository.get_by_id(model_class, entity_id)
                        if not entity:
                            logger.warning(
                                "bulk_export.entity_not_found",
                                entity_type=entity_type_name,
                                entity_id=str(entity_id),
                            )
                            failed_count += 1
                            continue

                        # Convert to response schema
                        entity_response = response_schema.model_validate(entity)
                        entity_dict = entity_response.model_dump(mode="json")

                        # Generate filename: {entity-type}-{name}-{id}.json
                        # Sanitize name for filename
                        name = getattr(entity, "name", None) or getattr(entity, "title", None) or str(entity_id)[:8]
                        safe_name = self._sanitize_filename(name)
                        filename = f"{entity_type_name}-{safe_name}-{str(entity_id)[:8]}.json"

                        # Add to ZIP
                        json_content = json.dumps(entity_dict, indent=2, ensure_ascii=False)
                        zip_file.writestr(filename, json_content)
                        exported_count += 1

                        logger.debug(
                            "bulk_export.entity_exported",
                            entity_type=entity_type_name,
                            entity_id=str(entity_id),
                            filename=filename,
                        )

                    except Exception as e:
                        failed_count += 1
                        logger.error(
                            "bulk_export.entity_failed",
                            entity_type=entity_type_name,
                            entity_id=str(entity_id),
                            error=str(e),
                            exc_info=True,
                        )

            # Check if any entities were exported
            if exported_count == 0:
                raise ValueError(
                    f"No {entity_type_name} entities could be exported. "
                    f"All {len(entity_ids)} entities failed or were not found."
                )

            # Add telemetry attributes
            span.set_attribute("exported_count", exported_count)
            span.set_attribute("failed_count", failed_count)
            span.set_attribute("zip_size_bytes", zip_buffer.tell())

            logger.info(
                "bulk_export.complete",
                entity_type=entity_type_name,
                exported_count=exported_count,
                failed_count=failed_count,
                zip_size_bytes=zip_buffer.tell(),
            )

            # Reset buffer position to beginning for reading
            zip_buffer.seek(0)
            return zip_buffer

    def _sanitize_filename(self, name: str) -> str:
        """Sanitize a string for use in filenames.

        Removes special characters, converts spaces to hyphens,
        and ensures the result is safe for filesystem use.

        Args:
            name: Raw name string

        Returns:
            Sanitized filename-safe string
        """
        # Convert to lowercase
        safe_name = name.lower()

        # Replace spaces and underscores with hyphens
        safe_name = safe_name.replace(" ", "-").replace("_", "-")

        # Remove special characters (keep only alphanumeric and hyphens)
        safe_name = re.sub(r"[^a-z0-9-]", "", safe_name)

        # Remove consecutive hyphens and leading/trailing hyphens
        safe_name = re.sub(r"-+", "-", safe_name).strip("-")

        # Fallback if name becomes empty after sanitization
        if not safe_name:
            safe_name = "entity"

        # Limit length to 50 characters
        if len(safe_name) > 50:
            safe_name = safe_name[:50].rstrip("-")

        return safe_name

    async def export_single_entity(
        self,
        entity: T,
        entity_type_name: str,
        response_schema: Type[BaseModel],
    ) -> Dict[str, Any]:
        """Export a single entity as JSON.

        Args:
            entity: The entity instance to export
            entity_type_name: Human-readable entity type name
            response_schema: Pydantic schema for serialization

        Returns:
            Tuple of (json_content, filename)

        Example:
            ```python
            content, filename = await bulk_ops.export_single_entity(
                style,
                "style",
                StyleResponse
            )
            # Returns: ({...}, "style-my-style-20250120.json")
            ```
        """
        with tracer.start_as_current_span(
            "export_single_entity",
            attributes={"entity_type": entity_type_name},
        ):
            # Convert to response schema
            entity_response = response_schema.model_validate(entity)
            entity_dict = entity_response.model_dump(mode="json")

            # Generate filename: {entity-type}-{name}-{timestamp}.json
            name = getattr(entity, "name", None) or getattr(entity, "title", None) or str(entity.id)[:8]
            safe_name = self._sanitize_filename(name)
            timestamp = datetime.now().strftime("%Y%m%d")
            filename = f"{entity_type_name}-{safe_name}-{timestamp}.json"

            logger.info(
                "export_single.complete",
                entity_type=entity_type_name,
                entity_id=str(entity.id),
                filename=filename,
            )

            return {
                "content": entity_dict,
                "filename": filename,
            }
