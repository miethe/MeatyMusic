"""Transactional story and motif operations with idempotent mutations."""

import hashlib
import json
from typing import Any, Callable

from fastapi.encoders import jsonable_encoder
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import SecurityContext
from app.errors import ConflictError, ForbiddenError, NotFoundError
from app.models.song import Song, WorkflowRun
from app.models.story import IdempotencyRecord, SongMotif, SongStory


class StoryService:
    """Enforce tenant ownership and revision rules for story mutations."""

    def __init__(self, session: Session, security_context: SecurityContext):
        """Create a service bound to one database session and security context."""
        self.db = session
        self.context = security_context
        if not security_context.user_id or not security_context.tenant_id:
            raise ForbiddenError("Tenant and user context required")

    def visible(self, model: Any, ident: Any) -> Any:
        """Return an active row visible to the current tenant and owner."""
        return (
            self.db.query(model)
            .filter(
                model.id == ident,
                model.deleted_at.is_(None),
                model.tenant_id == self.context.tenant_id,
                model.owner_id == self.context.user_id,
            )
            .first()
        )

    def require_song(self, song_id: Any) -> Song:
        """Require an active song visible to the current principal."""
        song = self.visible(Song, song_id)
        if song is None:
            raise NotFoundError("Song not found")
        return song

    def validate_take(self, take_id: Any, song_id: Any) -> None:
        """Require a referenced take to belong to the visible song."""
        if take_id is None:
            return
        run = self.visible(WorkflowRun, take_id)
        if run is None or run.song_id != song_id:
            raise NotFoundError("Take not found for song")

    def serialize(self, obj: Any, include_motifs: bool = False) -> dict[str, Any]:
        """Serialize a story or motif, optionally including active motifs."""
        data = {
            column.name: getattr(obj, column.name)
            for column in obj.__table__.columns
        }
        data = jsonable_encoder(data)
        if include_motifs:
            motifs = (
                self.db.query(SongMotif)
                .filter(
                    SongMotif.story_id == obj.id,
                    SongMotif.deleted_at.is_(None),
                    SongMotif.tenant_id == self.context.tenant_id,
                    SongMotif.owner_id == self.context.user_id,
                )
                .all()
            )
            data["motifs"] = [self.serialize(motif) for motif in motifs]
        return data

    def _idempotency_record(self, key: str) -> IdempotencyRecord | None:
        """Find a key in its tenant and owner namespace, independent of scope."""
        return (
            self.db.query(IdempotencyRecord)
            .filter_by(
                tenant_id=self.context.tenant_id,
                owner_id=self.context.user_id,
                key=key,
            )
            .first()
        )

    @staticmethod
    def _check_replay(
        record: IdempotencyRecord, scope: str, digest: str
    ) -> tuple[int, dict[str, Any], bool]:
        """Validate an existing key and return its stored response."""
        if record.scope != scope or record.request_hash != digest:
            raise ConflictError(
                "Idempotency key reused", code="idempotency_key_reuse"
            )
        return record.response_status, record.response_body, True

    def mutate(
        self,
        key: str | None,
        scope: str,
        payload: dict[str, Any],
        action: Callable[[], tuple[int, dict[str, Any]]],
    ) -> tuple[int, dict[str, Any], bool]:
        """Run a mutation once and persist its response for future retries."""
        if not key:
            raise ValueError("Idempotency-Key required")
        if len(key) > 200:
            raise ValueError("Idempotency-Key exceeds 200 characters")

        canonical = json.dumps(
            jsonable_encoder(payload),
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        digest = hashlib.sha256(canonical.encode()).hexdigest()
        existing = self._idempotency_record(key)
        if existing is not None:
            return self._check_replay(existing, scope, digest)

        try:
            status, body = action()
            self.db.add(
                IdempotencyRecord(
                    tenant_id=self.context.tenant_id,
                    owner_id=self.context.user_id,
                    scope=scope,
                    key=key,
                    request_hash=digest,
                    response_status=status,
                    response_body=body,
                )
            )
            self.db.commit()
            return status, body, False
        except IntegrityError:
            self.db.rollback()
            winner = self._idempotency_record(key)
            if winner is None:
                raise
            return self._check_replay(winner, scope, digest)
        except Exception:
            self.db.rollback()
            raise

    def create_story(
        self, song_id: Any, payload: dict[str, Any], key: str | None, scope: str
    ) -> tuple[int, dict[str, Any], bool]:
        """Create a story and store the response under its idempotency key."""

        def action() -> tuple[int, dict[str, Any]]:
            self.require_song(song_id)
            self.validate_take(payload.get("take_id"), song_id)
            story = SongStory(
                song_id=song_id,
                take_id=payload.get("take_id"),
                title=payload["title"],
                body_text=payload["body_text"],
                extra_metadata={},
                tenant_id=self.context.tenant_id,
                owner_id=self.context.user_id,
            )
            self.db.add(story)
            self.db.flush()
            return 201, self.serialize(story, include_motifs=True)

        return self.mutate(key, scope, payload, action)

    def edit_story(
        self,
        song_id: Any,
        story_id: Any,
        payload: dict[str, Any],
        key: str | None,
        scope: str,
    ) -> tuple[int, dict[str, Any], bool]:
        """Apply a revision-checked story patch and persist its response."""
        values = {
            name: value
            for name, value in payload.items()
            if name != "expected_revision"
        }

        def action() -> tuple[int, dict[str, Any]]:
            story = self.get_story(song_id, story_id)
            if story.revision != payload["expected_revision"]:
                raise ConflictError(
                    "Revision conflict",
                    code="revision_conflict",
                    details={"current_revision": story.revision},
                )
            if "take_id" in values:
                self.validate_take(values["take_id"], song_id)
            for name, value in values.items():
                setattr(story, name, value)
            story.revision += 1
            self.db.flush()
            return 200, self.serialize(story, include_motifs=True)

        return self.mutate(key, scope, payload, action)

    def get_story(self, song_id: Any, story_id: Any) -> SongStory:
        """Retrieve an active story after checking its parent song."""
        self.require_song(song_id)
        story = self.visible(SongStory, story_id)
        if story is None or story.song_id != song_id:
            raise NotFoundError("Story not found")
        return story

    def list_stories(self, song_id: Any) -> list[SongStory]:
        """List active stories for a visible song in creation order."""
        self.require_song(song_id)
        return (
            self.db.query(SongStory)
            .filter(
                SongStory.song_id == song_id,
                SongStory.tenant_id == self.context.tenant_id,
                SongStory.owner_id == self.context.user_id,
                SongStory.deleted_at.is_(None),
            )
            .order_by(SongStory.created_at)
            .all()
        )

    def list_motifs(self, song_id: Any, story_id: Any) -> list[SongMotif]:
        """List active motifs for a visible story."""
        self.get_story(song_id, story_id)
        return (
            self.db.query(SongMotif)
            .filter(
                SongMotif.story_id == story_id,
                SongMotif.tenant_id == self.context.tenant_id,
                SongMotif.owner_id == self.context.user_id,
                SongMotif.deleted_at.is_(None),
            )
            .all()
        )

    def create_motif(
        self,
        song_id: Any,
        story_id: Any,
        payload: dict[str, Any],
        key: str | None,
        scope: str,
    ) -> tuple[int, dict[str, Any], bool]:
        """Create a motif attached to a visible story."""

        def action() -> tuple[int, dict[str, Any]]:
            story = self.get_story(song_id, story_id)
            self.validate_take(payload.get("take_id"), song_id)
            motif = SongMotif(
                story_id=story.id,
                song_id=song_id,
                take_id=payload.get("take_id"),
                label=payload["label"],
                notes=payload.get("notes"),
                anchor=payload.get("anchor"),
                tenant_id=self.context.tenant_id,
                owner_id=self.context.user_id,
            )
            self.db.add(motif)
            self.db.flush()
            return 201, self.serialize(motif)

        return self.mutate(key, scope, payload, action)

    def edit_motif(
        self,
        song_id: Any,
        story_id: Any,
        motif_id: Any,
        payload: dict[str, Any],
        key: str | None,
        scope: str,
    ) -> tuple[int, dict[str, Any], bool]:
        """Apply a revision-checked motif patch and persist its response."""
        values = {
            name: value
            for name, value in payload.items()
            if name != "expected_revision"
        }

        def action() -> tuple[int, dict[str, Any]]:
            self.get_story(song_id, story_id)
            motif = self.visible(SongMotif, motif_id)
            if motif is None or motif.story_id != story_id:
                raise NotFoundError("Motif not found")
            if motif.revision != payload["expected_revision"]:
                raise ConflictError(
                    "Revision conflict",
                    code="revision_conflict",
                    details={"current_revision": motif.revision},
                )
            if "take_id" in values:
                self.validate_take(values["take_id"], song_id)
            for name, value in values.items():
                setattr(motif, name, value)
            motif.revision += 1
            self.db.flush()
            return 200, self.serialize(motif)

        return self.mutate(key, scope, payload, action)
