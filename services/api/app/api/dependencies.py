"""API dependencies for service injection and authentication.

This module provides FastAPI dependencies for injecting services
and handling authentication/authorization.
"""

from __future__ import annotations

from typing import Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_security_context, get_security_context_optional
from app.core.security import SecurityContext

# Alias for backward compatibility
get_db_session = get_db

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
    BlueprintService,
    LyricsService,
    PersonaService,
    ProducerNotesService,
    SongService,
    SourceService,
    StyleService,
    ValidationService,
    WorkflowRunService,
    SDSCompilerService,
    BlueprintValidatorService,
    CrossEntityValidator,
)


# Repository dependencies
def get_blueprint_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> BlueprintRepository:
    """Get BlueprintRepository instance with security context."""
    return BlueprintRepository(db=db, security_context=security_context)


def get_persona_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> PersonaRepository:
    """Get PersonaRepository instance with security context."""
    return PersonaRepository(db=db, security_context=security_context)


def get_source_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> SourceRepository:
    """Get SourceRepository instance with security context."""
    return SourceRepository(db=db, security_context=security_context)


def get_style_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> StyleRepository:
    """Get StyleRepository instance with security context."""
    return StyleRepository(db=db, security_context=security_context)


def get_song_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> SongRepository:
    """Get SongRepository instance with security context."""
    return SongRepository(db=db, security_context=security_context)


def get_lyrics_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> LyricsRepository:
    """Get LyricsRepository instance with security context."""
    return LyricsRepository(db=db, security_context=security_context)


def get_producer_notes_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> ProducerNotesRepository:
    """Get ProducerNotesRepository instance with security context."""
    return ProducerNotesRepository(db=db, security_context=security_context)


def get_workflow_run_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> WorkflowRunRepository:
    """Get WorkflowRunRepository instance with security context."""
    return WorkflowRunRepository(db=db, security_context=security_context)


def get_composed_prompt_repository(
    db: Session = Depends(get_db),
    security_context: SecurityContext = Depends(get_security_context),
) -> ComposedPromptRepository:
    """Get ComposedPromptRepository instance with security context."""
    return ComposedPromptRepository(db=db, security_context=security_context)


# Service dependencies
def get_blueprint_service(
    blueprint_repo: BlueprintRepository = Depends(get_blueprint_repository),
) -> BlueprintService:
    """Get BlueprintService instance.

    Note: BlueprintService doesn't use BaseService pattern,
    so no session dependency is needed.
    """
    return BlueprintService(blueprint_repo=blueprint_repo)


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


def get_persona_service(
    db: Session = Depends(get_db),
    repo: PersonaRepository = Depends(get_persona_repository),
) -> PersonaService:
    """Get PersonaService instance with all dependencies."""
    return PersonaService(session=db, repo=repo)


def get_source_service(
    db: Session = Depends(get_db),
    repo: SourceRepository = Depends(get_source_repository),
) -> SourceService:
    """Get SourceService instance with all dependencies."""
    return SourceService(session=db, repo=repo)


def get_lyrics_service(
    db: Session = Depends(get_db),
    repo: LyricsRepository = Depends(get_lyrics_repository),
) -> LyricsService:
    """Get LyricsService instance with all dependencies."""
    return LyricsService(session=db, repo=repo)


def get_producer_notes_service(
    db: Session = Depends(get_db),
    repo: ProducerNotesRepository = Depends(get_producer_notes_repository),
    blueprint_repo: BlueprintRepository = Depends(get_blueprint_repository),
    lyrics_repo: LyricsRepository = Depends(get_lyrics_repository),
) -> ProducerNotesService:
    """Get ProducerNotesService instance with all dependencies."""
    return ProducerNotesService(
        session=db,
        repo=repo,
        blueprint_repo=blueprint_repo,
        lyrics_repo=lyrics_repo,
    )


__all__ = [
    "get_db",
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
    "get_blueprint_service",
    "get_lyrics_service",
    "get_persona_service",
    "get_producer_notes_service",
    "get_source_service",
    "get_style_service",
    "get_validation_service",
    "get_song_service",
    "get_workflow_run_service",
    "get_sds_compiler_service",
    "get_blueprint_validator_service",
    "get_cross_entity_validator",
]
