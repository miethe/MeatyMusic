"""API dependencies for service injection and authentication.

This module provides FastAPI dependencies for injecting services
and handling authentication/authorization.
"""

from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories import (
    BlueprintRepository,
    ComposedPromptRepository,
    LyricsRepository,
    PersonaRepository,
    ProducerNotesRepository,
    SongRepository,
    SourceRepository,
    StyleRepository,
    WorkflowRunRepository,
)
from app.services import (
    SongService,
    StyleService,
    ValidationService,
    WorkflowRunService,
    SDSCompilerService,
    BlueprintValidatorService,
    CrossEntityValidator,
)


# Database session dependency (reuse from db.session)
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session for dependency injection."""
    async for session in get_db():
        yield session


# Repository dependencies
def get_blueprint_repository(
    db: AsyncSession = Depends(get_db_session),
) -> BlueprintRepository:
    """Get BlueprintRepository instance."""
    return BlueprintRepository(db)


def get_persona_repository(
    db: AsyncSession = Depends(get_db_session),
) -> PersonaRepository:
    """Get PersonaRepository instance."""
    return PersonaRepository(db)


def get_source_repository(
    db: AsyncSession = Depends(get_db_session),
) -> SourceRepository:
    """Get SourceRepository instance."""
    return SourceRepository(db)


def get_style_repository(
    db: AsyncSession = Depends(get_db_session),
) -> StyleRepository:
    """Get StyleRepository instance."""
    return StyleRepository(db)


def get_song_repository(
    db: AsyncSession = Depends(get_db_session),
) -> SongRepository:
    """Get SongRepository instance."""
    return SongRepository(db)


def get_lyrics_repository(
    db: AsyncSession = Depends(get_db_session),
) -> LyricsRepository:
    """Get LyricsRepository instance."""
    return LyricsRepository(db)


def get_producer_notes_repository(
    db: AsyncSession = Depends(get_db_session),
) -> ProducerNotesRepository:
    """Get ProducerNotesRepository instance."""
    return ProducerNotesRepository(db)


def get_workflow_run_repository(
    db: AsyncSession = Depends(get_db_session),
) -> WorkflowRunRepository:
    """Get WorkflowRunRepository instance."""
    return WorkflowRunRepository(db)


def get_composed_prompt_repository(
    db: AsyncSession = Depends(get_db_session),
) -> ComposedPromptRepository:
    """Get ComposedPromptRepository instance."""
    return ComposedPromptRepository(db)


# Service dependencies
def get_style_service(
    style_repo: StyleRepository = Depends(get_style_repository),
) -> StyleService:
    """Get StyleService instance."""
    return StyleService(style_repo=style_repo)


def get_validation_service() -> ValidationService:
    """Get ValidationService instance."""
    return ValidationService()


def get_song_service(
    song_repo: SongRepository = Depends(get_song_repository),
    style_repo: StyleRepository = Depends(get_style_repository),
    lyrics_repo: LyricsRepository = Depends(get_lyrics_repository),
    producer_notes_repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
    composed_prompt_repo: ComposedPromptRepository = Depends(get_composed_prompt_repository),
    validation_service: ValidationService = Depends(get_validation_service),
) -> SongService:
    """Get SongService instance with all dependencies."""
    return SongService(
        song_repo=song_repo,
        style_repo=style_repo,
        lyrics_repo=lyrics_repo,
        producer_notes_repo=producer_notes_repo,
        composed_prompt_repo=composed_prompt_repo,
        validation_service=validation_service,
    )


def get_workflow_run_service(
    workflow_run_repo: WorkflowRunRepository = Depends(get_workflow_run_repository),
) -> WorkflowRunService:
    """Get WorkflowRunService instance."""
    return WorkflowRunService(workflow_run_repo=workflow_run_repo)


def get_sds_compiler_service(
    song_repo: SongRepository = Depends(get_song_repository),
    style_repo: StyleRepository = Depends(get_style_repository),
    lyrics_repo: LyricsRepository = Depends(get_lyrics_repository),
    producer_notes_repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
    persona_repo: PersonaRepository = Depends(get_persona_repository),
    blueprint_repo: BlueprintRepository = Depends(get_blueprint_repository),
    source_repo: SourceRepository = Depends(get_source_repository),
    validation_service: ValidationService = Depends(get_validation_service),
) -> SDSCompilerService:
    """Get SDSCompilerService instance with all dependencies."""
    return SDSCompilerService(
        song_repo=song_repo,
        style_repo=style_repo,
        lyrics_repo=lyrics_repo,
        producer_notes_repo=producer_notes_repo,
        persona_repo=persona_repo,
        blueprint_repo=blueprint_repo,
        source_repo=source_repo,
        validation_service=validation_service,
    )


def get_blueprint_validator_service(
    blueprint_repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> BlueprintValidatorService:
    """Get BlueprintValidatorService instance."""
    return BlueprintValidatorService(blueprint_repo=blueprint_repo)


def get_cross_entity_validator() -> CrossEntityValidator:
    """Get CrossEntityValidator instance."""
    return CrossEntityValidator()


__all__ = [
    "get_db_session",
    "get_blueprint_repository",
    "get_persona_repository",
    "get_source_repository",
    "get_style_repository",
    "get_song_repository",
    "get_lyrics_repository",
    "get_producer_notes_repository",
    "get_workflow_run_repository",
    "get_composed_prompt_repository",
    "get_style_service",
    "get_validation_service",
    "get_song_service",
    "get_workflow_run_service",
    "get_sds_compiler_service",
    "get_blueprint_validator_service",
    "get_cross_entity_validator",
]
