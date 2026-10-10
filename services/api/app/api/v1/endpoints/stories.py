"""Story and motif API routes attached to songs."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.dependencies import get_security_context
from app.core.security import SecurityContext
from app.errors import AppError
from app.models.story import SongStory
from app.services.story_service import StoryService

router = APIRouter(prefix="/songs/{song_id}/stories", tags=["Stories"])


class StoryCreate(BaseModel):
    """Request body for creating a story."""

    title: str = Field(max_length=500)
    body_text: str
    take_id: UUID | None = None


class StoryPatch(BaseModel):
    """Request body for editing a story; null clears only take_id."""

    model_config = ConfigDict(extra="forbid")

    expected_revision: int = Field(ge=1)
    title: str = Field(default=None, max_length=500)
    body_text: str = None
    take_id: UUID | None = None


class MotifCreate(BaseModel):
    """Request body for creating a motif."""

    label: str = Field(max_length=200)
    notes: str | None = None
    anchor: dict[str, Any] | None = None
    take_id: UUID | None = None


class MotifPatch(BaseModel):
    """Request body for editing a motif; null clears nullable fields."""

    model_config = ConfigDict(extra="forbid")

    expected_revision: int = Field(ge=1)
    label: str = Field(default=None, max_length=200)
    notes: str | None = None
    anchor: dict[str, Any] | None = None
    take_id: UUID | None = None


def service(db: Session, context: SecurityContext) -> StoryService:
    """Build the service for the request's database and security context."""
    return StoryService(db, context)


def mutate_result(
    result: tuple[int, dict[str, Any], bool], response: Response
) -> dict[str, Any]:
    """Apply mutation status and replay metadata to the HTTP response."""
    status, body, replay = result
    if replay:
        response.headers["Idempotency-Replayed"] = "true"
    response.status_code = status
    return body


def _raise_http(error: AppError) -> None:
    """Translate a domain error into the API's standard error response."""
    raise HTTPException(
        error.status_code,
        detail={"error": error.code, "detail": error.message, **error.details},
    )


def _raise_bad_request(error: ValueError) -> None:
    """Translate an invalid idempotency header into a 400 response."""
    raise HTTPException(400, detail={"error": "bad_request", "detail": str(error)})


@router.post("")
def create_story(
    song_id: UUID,
    data: StoryCreate,
    response: Response,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    """Create a story for a song."""
    try:
        result = service(db, context).create_story(
            song_id,
            data.model_dump(),
            idempotency_key,
            f"POST:/songs/{song_id}/stories",
        )
        return mutate_result(result, response)
    except ValueError as error:
        _raise_bad_request(error)
    except AppError as error:
        _raise_http(error)


@router.get("")
def list_stories(
    song_id: UUID,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(get_security_context),
) -> list[dict[str, Any]]:
    """List active stories for a song."""
    try:
        story_service = service(db, context)
        return [
            story_service.serialize(story, include_motifs=True)
            for story in story_service.list_stories(song_id)
        ]
    except AppError as error:
        _raise_http(error)


@router.get("/{story_id}")
def retrieve_story(
    song_id: UUID,
    story_id: UUID,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    """Retrieve one active story and its motifs."""
    try:
        story_service = service(db, context)
        story = story_service.get_story(song_id, story_id)
        return story_service.serialize(story, include_motifs=True)
    except AppError as error:
        _raise_http(error)


@router.patch("/{story_id}")
def edit_story(
    song_id: UUID,
    story_id: UUID,
    data: StoryPatch,
    response: Response,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    """Edit a story using its expected revision."""
    try:
        result = service(db, context).edit_story(
            song_id,
            story_id,
            data.model_dump(exclude_unset=True),
            idempotency_key,
            f"PATCH:/songs/{song_id}/stories/{story_id}",
        )
        return mutate_result(result, response)
    except ValueError as error:
        _raise_bad_request(error)
    except AppError as error:
        _raise_http(error)


@router.post("/{story_id}/motifs")
def create_motif(
    song_id: UUID,
    story_id: UUID,
    data: MotifCreate,
    response: Response,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    """Create a motif on a story."""
    try:
        result = service(db, context).create_motif(
            song_id,
            story_id,
            data.model_dump(),
            idempotency_key,
            f"POST:/songs/{song_id}/stories/{story_id}/motifs",
        )
        return mutate_result(result, response)
    except ValueError as error:
        _raise_bad_request(error)
    except AppError as error:
        _raise_http(error)


@router.get("/{story_id}/motifs")
def list_motifs(
    song_id: UUID,
    story_id: UUID,
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(get_security_context),
) -> list[dict[str, Any]]:
    """List active motifs for a story."""
    try:
        story_service = service(db, context)
        return [
            story_service.serialize(motif)
            for motif in story_service.list_motifs(song_id, story_id)
        ]
    except AppError as error:
        _raise_http(error)


@router.patch("/{story_id}/motifs/{motif_id}")
def edit_motif(
    song_id: UUID,
    story_id: UUID,
    motif_id: UUID,
    data: MotifPatch,
    response: Response,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    context: SecurityContext = Depends(get_security_context),
) -> dict[str, Any]:
    """Edit a motif using its expected revision."""
    try:
        result = service(db, context).edit_motif(
            song_id,
            story_id,
            motif_id,
            data.model_dump(exclude_unset=True),
            idempotency_key,
            f"PATCH:/songs/{song_id}/stories/{story_id}/motifs/{motif_id}",
        )
        return mutate_result(result, response)
    except ValueError as error:
        _raise_bad_request(error)
    except AppError as error:
        _raise_http(error)
