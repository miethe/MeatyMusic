"""Focused service tests for story, motif, and migration behavior."""

import ast
import copy
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest
from sqlalchemy import event
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.compiler import compiles

from app.core.security import SecurityContext
from app.errors import ConflictError, NotFoundError
from app.models.song import Song, WorkflowRun
from app.models.story import IdempotencyRecord, SongMotif, SongStory
from app.services.story_service import StoryService


@compiles(JSONB, "sqlite")
def _sqlite_jsonb(element, compiler, **kwargs):
    """Compile PostgreSQL JSONB as SQLite JSON in the test database."""
    return "JSON"


@compiles(ARRAY, "sqlite")
def _sqlite_array(element, compiler, **kwargs):
    """Compile PostgreSQL arrays as SQLite JSON in the test database."""
    return "JSON"


@event.listens_for(Engine, "connect")
def _sqlite_functions(connection, record):
    """Provide PostgreSQL's char_length function to SQLite tests."""
    if connection.__class__.__module__.startswith("sqlite3"):
        connection.create_function(
            "char_length", 1, lambda value: len(value) if value is not None else None
        )


@pytest.fixture
def setup_rows(test_session):
    """Create one owned song and one workflow run."""
    tenant_id, owner_id = uuid.uuid4(), uuid.uuid4()
    song = Song(
        title="Work", global_seed=42, tenant_id=tenant_id, owner_id=owner_id
    )
    test_session.add(song)
    test_session.flush()
    run = WorkflowRun(
        song_id=song.id,
        run_id=uuid.uuid4(),
        tenant_id=tenant_id,
        owner_id=owner_id,
    )
    test_session.add(run)
    test_session.commit()
    return song, run, tenant_id, owner_id


@pytest.fixture
def story_service(test_session, setup_rows):
    """Return a story service and its fixture rows."""
    song, run, tenant_id, owner_id = setup_rows
    context = SecurityContext(user_id=owner_id, tenant_id=tenant_id)
    return StoryService(test_session, context), song, run


def _snapshot(session, model, ident):
    """Copy every mapped field for an immutable-reference assertion."""
    row = session.query(model).filter_by(id=ident).one()
    return {
        column.name: copy.deepcopy(getattr(row, column.name))
        for column in model.__table__.columns
    }


def test_story_round_trip_create_edit_retrieve_reload(story_service, test_session):
    """Create a story and motif, edit them, and reload their stored values."""
    service, song, run = story_service
    body = "  雪の歌\nline\t\n"
    status, story, replayed = service.create_story(
        song.id,
        {"title": " title ", "body_text": body, "take_id": run.id},
        "create-1",
        "POST:/stories",
    )
    assert (status, replayed, story["title"], story["body_text"]) == (
        201,
        False,
        " title ",
        body,
    )

    story_id = uuid.UUID(story["id"])
    _, motif, _ = service.create_motif(
        song.id,
        story_id,
        {"label": " motif ", "notes": "終わり\n", "anchor": {"bar": 3}},
        "motif-1",
        "POST:/motifs",
    )
    status, edited, replayed = service.edit_story(
        song.id,
        story_id,
        {"expected_revision": 1, "body_text": "edited\n"},
        "edit-1",
        "PATCH:/stories/1",
    )
    assert (status, replayed, edited["revision"], edited["body_text"]) == (
        200,
        False,
        2,
        "edited\n",
    )
    _, edited_motif, _ = service.edit_motif(
        song.id,
        story_id,
        uuid.UUID(motif["id"]),
        {"expected_revision": 1, "notes": " notes "},
        "motif-edit-1",
        "PATCH:/motifs/1",
    )
    assert edited_motif["revision"] == 2
    assert edited_motif["notes"] == " notes "

    test_session.expire_all()
    reloaded = service.get_story(song.id, story_id)
    assert reloaded.body_text == "edited\n"
    assert service.list_stories(song.id)[0].title == " title "
    assert service.list_motifs(song.id, story_id)[0].notes == " notes "


def test_revision_conflict_leaves_row_unchanged(story_service, test_session):
    """A stale revision is rejected before any requested field is assigned."""
    service, song, _ = story_service
    _, story, _ = service.create_story(
        song.id, {"title": "before", "body_text": "body"}, "create", "POST"
    )
    story_id = uuid.UUID(story["id"])
    with pytest.raises(ConflictError) as caught:
        service.edit_story(
            song.id,
            story_id,
            {"expected_revision": 99, "title": "after"},
            "stale",
            "PATCH",
        )
    assert caught.value.details["current_revision"] == 1
    test_session.expire_all()
    unchanged = service.get_story(song.id, story_id)
    assert (unchanged.title, unchanged.revision) == ("before", 1)


def test_idempotent_replay_create_and_edit(story_service):
    """Create and edit retries return their persisted response snapshots."""
    service, song, _ = story_service
    payload = {"title": "same", "body_text": "text"}
    first = service.create_story(song.id, payload, "create", "POST")
    replay = service.create_story(song.id, payload, "create", "POST")
    assert replay == (first[0], first[1], True)

    story_id = uuid.UUID(first[1]["id"])
    edit_payload = {"expected_revision": 1, "title": "changed"}
    changed = service.edit_story(song.id, story_id, edit_payload, "edit", "PATCH")
    replayed_edit = service.edit_story(
        song.id, story_id, edit_payload, "edit", "PATCH"
    )
    assert changed[1]["revision"] == 2
    assert replayed_edit == (changed[0], changed[1], True)


def test_idempotency_key_reuse_with_payload_and_scope(story_service):
    """A key reused with another payload or route scope is a conflict."""
    service, song, _ = story_service
    service.create_story(song.id, {"title": "a", "body_text": "b"}, "key", "POST")
    with pytest.raises(ConflictError) as payload_error:
        service.create_story(
            song.id, {"title": "different", "body_text": "b"}, "key", "POST"
        )
    assert payload_error.value.code == "idempotency_key_reuse"
    with pytest.raises(ConflictError) as scope_error:
        service.create_story(song.id, {"title": "a", "body_text": "b"}, "key", "PATCH")
    assert scope_error.value.code == "idempotency_key_reuse"


def test_idempotency_commit_race_returns_winner(
    story_service, test_session, monkeypatch
):
    """A competing commit wins once and the losing request replays its result."""
    service, song, _ = story_service
    original_commit = test_session.commit
    raced = False

    def commit_with_competitor():
        nonlocal raced
        if not raced:
            raced = True
            test_session.rollback()
            winner_story = SongStory(
                song_id=song.id,
                title="winner",
                body_text="winner body",
                extra_metadata={},
                tenant_id=service.context.tenant_id,
                owner_id=service.context.user_id,
            )
            test_session.add(winner_story)
            test_session.flush()
            stored_body = service.serialize(winner_story, include_motifs=True)
            test_session.add(
                IdempotencyRecord(
                    tenant_id=service.context.tenant_id,
                    owner_id=service.context.user_id,
                    scope="POST",
                    key="race-key",
                    request_hash=digest,
                    response_status=201,
                    response_body=stored_body,
                )
            )
            original_commit()
            raise IntegrityError("duplicate", {}, Exception("unique"))
        original_commit()

    import hashlib
    import json
    from fastapi.encoders import jsonable_encoder

    payload = {"title": "winner", "body_text": "winner body"}
    canonical = json.dumps(
        jsonable_encoder(payload),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    digest = hashlib.sha256(canonical.encode()).hexdigest()
    monkeypatch.setattr(test_session, "commit", commit_with_competitor)
    status, body, replayed = service.create_story(song.id, payload, "race-key", "POST")
    assert (status, replayed, body["title"]) == (201, True, "winner")
    assert test_session.query(SongStory).filter_by(song_id=song.id).count() == 1
    assert test_session.query(IdempotencyRecord).filter_by(key="race-key").count() == 1


def test_nullable_take_can_be_cleared_and_bumps_revision_once(story_service):
    """Explicitly clearing take_id stores null and increments revision once."""
    service, song, run = story_service
    _, story, _ = service.create_story(
        song.id,
        {"title": "title", "body_text": "body", "take_id": run.id},
        "create",
        "POST",
    )
    _, changed, replayed = service.edit_story(
        song.id,
        uuid.UUID(story["id"]),
        {"expected_revision": 1, "take_id": None},
        "clear-take",
        "PATCH",
    )
    assert not replayed
    assert changed["take_id"] is None
    assert changed["revision"] == 2


def test_unknown_song_story_motif_and_take_are_not_found(story_service):
    """Unknown resource IDs and takes attached to another song are hidden."""
    service, song, _ = story_service
    with pytest.raises(NotFoundError):
        service.create_story(
            uuid.uuid4(), {"title": "x", "body_text": "y"}, "unknown-song", "POST"
        )
    with pytest.raises(NotFoundError):
        service.get_story(song.id, uuid.uuid4())

    _, story, _ = service.create_story(
        song.id, {"title": "x", "body_text": "y"}, "create", "POST"
    )
    story_id = uuid.UUID(story["id"])
    with pytest.raises(NotFoundError):
        service.edit_motif(
            song.id,
            story_id,
            uuid.uuid4(),
            {"expected_revision": 1, "label": "x"},
            "unknown-motif",
            "PATCH",
        )

    other_song = Song(
        title="Other",
        global_seed=12,
        tenant_id=service.context.tenant_id,
        owner_id=service.context.user_id,
    )
    test_session = service.db
    test_session.add(other_song)
    test_session.flush()
    other_run = WorkflowRun(
        song_id=other_song.id,
        run_id=uuid.uuid4(),
        tenant_id=service.context.tenant_id,
        owner_id=service.context.user_id,
    )
    test_session.add(other_run)
    test_session.commit()
    with pytest.raises(NotFoundError):
        service.create_story(
            song.id,
            {"title": "x", "body_text": "y", "take_id": other_run.id},
            "wrong-take",
            "POST",
        )


def test_other_owner_and_other_tenant_are_not_found(story_service):
    """Service lookups conceal stories from other owners and tenants."""
    service, song, _ = story_service
    _, story, _ = service.create_story(
        song.id, {"title": "x", "body_text": "y"}, "create", "POST"
    )
    story_id = uuid.UUID(story["id"])
    for context in (
        SecurityContext(user_id=uuid.uuid4(), tenant_id=service.context.tenant_id),
        SecurityContext(user_id=service.context.user_id, tenant_id=uuid.uuid4()),
    ):
        with pytest.raises(NotFoundError):
            StoryService(service.db, context).get_story(song.id, story_id)


def test_soft_deleted_stories_and_motifs_are_hidden(story_service):
    """Soft-deleted stories disappear from reads and active motif lists."""
    service, song, _ = story_service
    _, story, _ = service.create_story(
        song.id, {"title": "x", "body_text": "y"}, "create", "POST"
    )
    story_id = uuid.UUID(story["id"])
    _, motif, _ = service.create_motif(
        song.id, story_id, {"label": "motif"}, "motif", "POST-MOTIF"
    )
    motif_id = uuid.UUID(motif["id"])
    motif_row = service.db.query(SongMotif).filter_by(id=motif_id).one()
    motif_row.deleted_at = datetime.now(timezone.utc)
    service.db.commit()
    assert service.list_motifs(song.id, story_id) == []

    story_row = service.db.query(SongStory).filter_by(id=story_id).one()
    story_row.deleted_at = datetime.now(timezone.utc)
    service.db.commit()
    assert service.list_stories(song.id) == []
    with pytest.raises(NotFoundError):
        service.get_story(song.id, story_id)


def test_song_and_workflow_run_snapshots_are_preserved(story_service):
    """Story and motif operations never alter songs or workflow runs."""
    service, song, run = story_service
    before = (
        _snapshot(service.db, Song, song.id),
        _snapshot(service.db, WorkflowRun, run.id),
    )
    _, story, _ = service.create_story(
        song.id,
        {"title": "x", "body_text": "y", "take_id": run.id},
        "create",
        "POST",
    )
    _, motif, _ = service.create_motif(
        song.id,
        uuid.UUID(story["id"]),
        {"label": "z", "take_id": run.id},
        "motif",
        "POST-MOTIF",
    )
    service.edit_motif(
        song.id,
        uuid.UUID(story["id"]),
        uuid.UUID(motif["id"]),
        {"expected_revision": 1, "notes": "edited"},
        "edit-motif",
        "PATCH-MOTIF",
    )
    after = (
        _snapshot(service.db, Song, song.id),
        _snapshot(service.db, WorkflowRun, run.id),
    )
    assert before == after


def test_migration_preview_and_ast_hygiene_are_stable(test_session, story_service):
    """Preview keys, fingerprints, additive tables, and migration order are stable."""
    from app.scripts.story_motif_migration_preview import build_preview

    before = build_preview(test_session)
    service, song, _ = story_service
    service.create_story(song.id, {"title": "x", "body_text": "y"}, "preview", "POST")
    after = build_preview(test_session)
    assert set(before) == {
        "tables_to_create",
        "reference_counts",
        "rows_modified_in_existing_tables",
        "existing_rows_sha256",
        "reversible",
        "downgrade_statements",
    }
    assert before["tables_to_create"] == [
        "song_stories", "song_motifs", "idempotency_records"
    ]
    assert before["existing_rows_sha256"] == after["existing_rows_sha256"]
    assert before["rows_modified_in_existing_tables"] == 0

    migration = next(
        Path(__file__).resolve().parents[3]
        .joinpath("alembic/versions")
        .glob("20261009_0000*.py")
    )
    tree = ast.parse(migration.read_text())
    upgrade = next(
        node for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "upgrade"
    )
    table_names = [
        node.args[0].value
        for node in ast.walk(upgrade)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "create_table"
    ]
    assert table_names == ["song_stories", "song_motifs", "idempotency_records"]
    constraint = next(
        node for node in ast.walk(upgrade)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "UniqueConstraint"
    )
    assert [arg.value for arg in constraint.args] == ["tenant_id", "owner_id", "key"]
    downgrade = next(
        node for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "downgrade"
    )
    dropped = [
        node.args[0].value
        for node in ast.walk(downgrade)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "drop_table"
    ]
    assert dropped == ["idempotency_records", "song_motifs", "song_stories"]
