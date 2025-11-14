"""Base service class for all entity services in MeatyMusic.

This module provides the foundation for service layer implementation with
transaction management, error handling, and DTO conversion utilities.

The BaseService integrates with SQLAlchemy synchronous sessions for database
transactions with proper commit/rollback handling. Service methods remain async
for FastAPI compatibility while calling synchronous repository operations.
"""

from __future__ import annotations

from typing import Generic, TypeVar, Optional, List, Any, Dict, Type
from contextlib import contextmanager
from uuid import UUID
import structlog

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel

from app.errors import AppError, InternalServerError, BadRequestError

logger = structlog.get_logger(__name__)

# Type variables for generic service
T = TypeVar('T')  # Model type (SQLAlchemy ORM model)
R = TypeVar('R', bound=BaseModel)  # Response DTO type (Pydantic model)
C = TypeVar('C', bound=BaseModel)  # Create DTO type (Pydantic model)
U = TypeVar('U', bound=BaseModel)  # Update DTO type (Pydantic model)


class BaseService(Generic[T, R, C, U]):
    """Abstract base class for all entity services.

    Provides:
    - Synchronous transaction context management with automatic commit/rollback
    - Structured error handling with logging
    - DTO conversion utilities (Model → Response DTO)
    - Repository dependency injection patterns
    - Type-safe operations with generic type parameters

    Type Parameters:
        T: SQLAlchemy ORM model type (e.g., Style, Lyrics)
        R: Response DTO type (e.g., StyleResponse)
        C: Create DTO type (e.g., StyleCreate)
        U: Update DTO type (e.g., StyleUpdate)

    Usage:
        ```python
        class LyricsService(BaseService[Lyrics, LyricsResponse, LyricsCreate, LyricsUpdate]):
            def __init__(self, session: Session, repo: LyricsRepository):
                super().__init__(session, LyricsResponse)
                self.repo = repo

            async def create_lyrics(self, data: LyricsCreate) -> Lyrics:
                # Async method calling sync transaction and repo
                with self.transaction():
                    entity = self.repo.create(data)  # NO await - repo is sync
                    logger.info("lyrics.created", id=str(entity.id))
                    return entity

            async def get_lyrics(self, lyrics_id: UUID) -> LyricsResponse:
                # Read operations don't need transactions
                lyrics = self.repo.get_by_id(lyrics_id)  # NO await
                if not lyrics:
                    raise NotFoundError(f"Lyrics {lyrics_id} not found")
                return self.to_response(lyrics)
        ```

    Transaction Management:
        The `transaction()` context manager provides:
        - Automatic commit on success
        - Automatic rollback on exception
        - Structured logging of transaction lifecycle
        - Proper error propagation with context
        - Synchronous operations (use `with`, not `async with`)

    Error Handling:
        All errors are logged with structured context including:
        - trace_id (from OpenTelemetry if available)
        - operation name
        - entity details (id, type, etc.)
        - error details and stack traces

    DTO Conversion:
        - `to_response()`: Convert single model to response DTO
        - `to_response_list()`: Convert list of models to response DTOs
        - Validates models against Pydantic schema
        - Handles None values gracefully
    """

    def __init__(self, session: Session, response_model: Type[R]):
        """Initialize base service.

        Args:
            session: SQLAlchemy synchronous session for database operations
            response_model: Pydantic model class for response DTOs
        """
        self._session = session
        self._response_model = response_model

    @property
    def session(self) -> Session:
        """Get the current database session.

        Returns:
            Session: The SQLAlchemy synchronous session
        """
        return self._session

    @contextmanager
    def transaction(self):
        """Synchronous transaction context manager for atomic operations.

        Provides automatic commit/rollback handling with structured logging.
        The transaction is automatically committed when the context exits
        successfully, or rolled back if an exception occurs.

        Usage:
            ```python
            with self.transaction():  # NOT async with
                # Do database operations
                entity = self.repo.create(data)  # NO await
                self.repo.update(entity.id, updates)  # NO await
                # Auto-commit on success, auto-rollback on error
            ```

        Yields:
            None (context for transaction block)

        Raises:
            SQLAlchemyError: Database errors with structured context
            Exception: Other errors are re-raised after rollback

        Examples:
            ```python
            # Simple transaction
            with self.transaction():
                style = self.style_repo.create(style_data)

            # Nested operations (same transaction)
            with self.transaction():
                lyrics = self.lyrics_repo.create(lyrics_data)
                self.song_repo.update(song_id, {"lyrics_id": lyrics.id})
            ```
        """
        logger.debug("transaction.start", session_id=id(self._session))

        try:
            # Yield control to the calling code
            yield

            # Commit the transaction on success
            self._session.commit()
            logger.debug("transaction.commit", session_id=id(self._session))

        except SQLAlchemyError as e:
            # Database error - rollback and log with context
            self._session.rollback()
            logger.error(
                "transaction.rollback.database_error",
                session_id=id(self._session),
                error_type=type(e).__name__,
                error_message=str(e),
                exc_info=True
            )
            raise

        except Exception as e:
            # Non-database error - still rollback to maintain consistency
            self._session.rollback()
            logger.error(
                "transaction.rollback.error",
                session_id=id(self._session),
                error_type=type(e).__name__,
                error_message=str(e),
                exc_info=True
            )
            raise

    def to_response(self, model: Optional[T]) -> Optional[R]:
        """Convert model instance to response DTO.

        Uses Pydantic's `model_validate()` to convert SQLAlchemy ORM objects
        to response DTOs with proper validation and type coercion.

        Args:
            model: Database model instance (SQLAlchemy ORM object)

        Returns:
            Response DTO instance, or None if model is None

        Raises:
            ValueError: If conversion fails (invalid data or schema mismatch)

        Examples:
            ```python
            # Convert single entity
            style = self.repo.get_by_id(style_id)  # NO await - repo is sync
            response = self.to_response(style)
            # Returns: StyleResponse with all fields populated

            # Handle None safely
            style = self.repo.get_by_id(nonexistent_id)
            response = self.to_response(style)  # Returns None
            ```
        """
        if model is None:
            return None

        try:
            # Use Pydantic's model_validate for ORM conversion
            # This respects ConfigDict(from_attributes=True) in response schemas
            response: R = self._response_model.model_validate(model)
            return response

        except Exception as e:
            logger.error(
                "dto.conversion_failed",
                model_type=type(model).__name__,
                response_type=self._response_model.__name__,
                error=str(e),
                exc_info=True
            )
            raise ValueError(
                f"Failed to convert {type(model).__name__} to "
                f"{self._response_model.__name__}: {str(e)}"
            ) from e

    def to_response_list(self, models: List[T]) -> List[R]:
        """Convert list of models to response DTOs.

        Args:
            models: List of database model instances

        Returns:
            List of response DTO instances

        Raises:
            ValueError: If any conversion fails

        Examples:
            ```python
            # Convert multiple entities
            styles = self.repo.get_by_genre("pop")  # NO await
            responses = self.to_response_list(styles)
            # Returns: List[StyleResponse]

            # Empty list handling
            styles = self.repo.get_by_genre("nonexistent")
            responses = self.to_response_list(styles)
            # Returns: [] (empty list)
            ```
        """
        return [self.to_response(model) for model in models if model is not None]

    async def _handle_error(
        self,
        error: Exception,
        operation: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AppError:
        """Handle and log service errors with structured context.

        Converts exceptions to appropriate AppError types with detailed
        structured logging for observability and debugging.

        Args:
            error: The exception that occurred
            operation: Name of the operation (e.g., "create_lyrics", "update_style")
            context: Additional context (entity_id, user_id, etc.)

        Returns:
            AppError: Appropriate error type (BadRequestError, InternalServerError, etc.)

        Examples:
            ```python
            try:
                entity = self.repo.create(data)  # NO await - repo is sync
            except Exception as e:
                raise await self._handle_error(e, "create_lyrics", {
                    "song_id": str(song_id),
                    "user_id": str(user_id)
                })
            ```
        """
        # Prepare log context
        log_context = {
            "operation": operation,
            "error_type": type(error).__name__,
            "error_message": str(error),
        }

        # Add additional context if provided
        if context:
            log_context.update(context)

        # Log the error with full context
        logger.error("service.error", **log_context, exc_info=True)

        # Convert to appropriate AppError type
        if isinstance(error, AppError):
            # Already an AppError, return as-is
            return error

        elif isinstance(error, SQLAlchemyError):
            # Database error
            return BadRequestError(
                message=f"Database error during {operation}: {str(error)}"
            )

        elif isinstance(error, ValueError):
            # Validation or conversion error
            return BadRequestError(
                message=f"Validation error during {operation}: {str(error)}"
            )

        else:
            # Unknown error - wrap as internal server error
            return InternalServerError(
                message=f"Unexpected error during {operation}: {str(error)}"
            )

    async def _validate_required_fields(
        self,
        data: BaseModel,
        required_fields: List[str],
        operation: str
    ) -> None:
        """Validate that required fields are present and non-None.

        Utility method for business logic validation beyond Pydantic schema validation.

        Args:
            data: The DTO to validate
            required_fields: List of field names that must be present
            operation: Operation name for error context

        Raises:
            BadRequestError: If any required field is missing or None

        Examples:
            ```python
            # Validate song_id is required
            await self._validate_required_fields(
                data=lyrics_data,
                required_fields=["song_id", "text"],
                operation="create_lyrics"
            )
            ```
        """
        missing_fields = []

        for field in required_fields:
            value = getattr(data, field, None)
            if value is None:
                missing_fields.append(field)

        if missing_fields:
            error_message = (
                f"Missing required fields for {operation}: "
                f"{', '.join(missing_fields)}"
            )
            logger.warning(
                "validation.missing_fields",
                operation=operation,
                missing_fields=missing_fields
            )
            raise BadRequestError(message=error_message)
