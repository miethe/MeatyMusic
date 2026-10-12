"""HTTP contract tests for story and motif endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.engine import Engine
from sqlalchemy.ext.compiler import compiles

from app.core.dependencies import get_security_context
from app.core.security import SecurityContext
from app.db.session import get_db
from app.models.song import Song, WorkflowRun
from app.models.story import SongMotif, SongStory
from main import app


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
def story_client(test_session):
    """Build an API client with one song and replaceable request identity."""
    tenant_id, owner_id = uuid.uuid4(), uuid.uuid4()
    song = Song(
        title="API work", global_seed=17, tenant_id=tenant_id, owner_id=owner_id
    )
    test_session.add(song)
    test_session.commit()
    context = SecurityContext(user_id=owner_id, tenant_id=tenant_id)
    app.dependency_overrides[get_db] = lambda: test_session
    app.dependency_overrides[get_security_context] = lambda: context
    with TestClient(app) as client:
        yield client, song, context
    app.dependency_overrides.clear()


def test_create_edit_replay_and_get_list_preserve_verbatim_text(story_client):
    """Create and edit retries replay, and GET keeps Unicode and whitespace."""
    client, song, _ = story_client
    url = f"/api/v1/songs/{song.id}/stories"
    body = "  café\n雪\t\n"
    created = client.post(
        url,
        json={"title": " title ", "body_text": body},
        headers={"Idempotency-Key": "create"},
    )
    replay = client.post(
        url,
        json={"title": " title ", "body_text": body},
        headers={"Idempotency-Key": "create"},
    )
    assert created.status_code == 201
    assert created.json()["body_text"] == body
    assert replay.json() == created.json()
    assert replay.headers["Idempotency-Replayed"] == "true"

    story_id = created.json()["id"]
    edit_payload = {"expected_revision": 1, "body_text": "updated\n雪"}
    edited = client.patch(
        f"{url}/{story_id}",
        json=edit_payload,
        headers={"Idempotency-Key": "edit"},
    )
    edit_replay = client.patch(
        f"{url}/{story_id}",
        json=edit_payload,
        headers={"Idempotency-Key": "edit"},
    )
    assert edited.status_code == 200
    assert edited.json()["revision"] == 2
    assert edit_replay.json() == edited.json()
    assert client.get(f"{url}/{story_id}").json()["body_text"] == "updated\n雪"
    assert client.get(url).json()[0]["body_text"] == "updated\n雪"


def test_key_reuse_different_payload_and_different_scope_is_conflict(story_client):
    """A key reused with changed data or a changed route scope returns 409."""
    client, song, _ = story_client
    url = f"/api/v1/songs/{song.id}/stories"
    payload = {"title": "first", "body_text": "body"}
    first = client.post(url, json=payload, headers={"Idempotency-Key": "shared"})
    assert first.status_code == 201
    changed_payload = client.post(
        url,
        json={"title": "second", "body_text": "body"},
        headers={"Idempotency-Key": "shared"},
    )
    assert changed_payload.status_code == 409
    assert changed_payload.json()["detail"]["error"] == "idempotency_key_reuse"
    story_id = first.json()["id"]
    other_scope = client.patch(
        f"{url}/{story_id}",
        json={"expected_revision": 1, "title": "first"},
        headers={"Idempotency-Key": "shared"},
    )
    assert other_scope.status_code == 409
    assert other_scope.json()["detail"]["error"] == "idempotency_key_reuse"


def test_missing_idempotency_key_returns_400(story_client):
    """Mutation endpoints require an idempotency key."""
    client, song, _ = story_client
    response = client.post(
        f"/api/v1/songs/{song.id}/stories",
        json={"title": "x", "body_text": "y"},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["error"] == "bad_request"


@pytest.mark.parametrize(
    ("method", "path_suffix", "body", "expected_status"),
    [
        ("post", "", {"title": None, "body_text": "x"}, 422),
        ("post", "", {"title": "x", "body_text": None}, 422),
        ("patch", "/{story_id}", {"expected_revision": 1, "title": None}, 422),
        ("patch", "/{story_id}", {"expected_revision": 1, "body_text": None}, 422),
        ("patch", "/{story_id}", {"expected_revision": None}, 422),
    ],
)
def test_non_nullable_null_fields_are_rejected(
    story_client, method, path_suffix, body, expected_status
):
    """Explicit JSON null never reaches non-nullable story columns."""
    client, song, _ = story_client
    base_url = f"/api/v1/songs/{song.id}/stories"
    story_id = None
    if "{story_id}" in path_suffix:
        created = client.post(
            base_url,
            json={"title": "valid", "body_text": "valid"},
            headers={"Idempotency-Key": str(uuid.uuid4())},
        )
        story_id = created.json()["id"]
        path_suffix = path_suffix.format(story_id=story_id)
    response = getattr(client, method)(
        base_url + path_suffix,
        json=body,
        headers={"Idempotency-Key": str(uuid.uuid4())},
    )
    assert response.status_code == expected_status
    assert response.status_code != 500


def test_nullable_fields_can_be_cleared(story_client):
    """A take can be cleared through PATCH with a single revision increment."""
    client, song, context = story_client
    run = WorkflowRun(
        song_id=song.id,
        run_id=uuid.uuid4(),
        tenant_id=context.tenant_id,
        owner_id=context.user_id,
    )
    client_db = app.dependency_overrides[get_db]()
    client_db.add(run)
    client_db.commit()
    url = f"/api/v1/songs/{song.id}/stories"
    created = client.post(
        url,
        json={"title": "x", "body_text": "y", "take_id": str(run.id)},
        headers={"Idempotency-Key": "create"},
    )
    assert created.status_code == 201
    cleared = client.patch(
        f"{url}/{created.json()['id']}",
        json={"expected_revision": 1, "take_id": None},
        headers={"Idempotency-Key": "clear"},
    )
    assert cleared.status_code == 200
    assert cleared.json()["take_id"] is None
    assert cleared.json()["revision"] == 2


def test_unknown_song_story_motif_and_take_return_404(story_client):
    """Unknown song, story, motif, and take IDs are all hidden as 404."""
    client, song, context = story_client
    base = f"/api/v1/songs/{song.id}/stories"
    unknown_song = client.post(
        f"/api/v1/songs/{uuid.uuid4()}/stories",
        json={"title": "x", "body_text": "y"},
        headers={"Idempotency-Key": "unknown-song"},
    )
    assert unknown_song.status_code == 404
    assert client.get(f"{base}/{uuid.uuid4()}").status_code == 404
    created = client.post(
        base,
        json={"title": "x", "body_text": "y"},
        headers={"Idempotency-Key": "create"},
    )
    story_id = created.json()["id"]
    unknown_motif = client.patch(
        f"{base}/{story_id}/motifs/{uuid.uuid4()}",
        json={"expected_revision": 1, "label": "x"},
        headers={"Idempotency-Key": "unknown-motif"},
    )
    assert unknown_motif.status_code == 404
    unknown_take = client.post(
        base,
        json={"title": "x", "body_text": "y", "take_id": str(uuid.uuid4())},
        headers={"Idempotency-Key": "unknown-take"},
    )
    assert unknown_take.status_code == 404

    other_song = Song(
        title="Other API song",
        global_seed=21,
        tenant_id=context.tenant_id,
        owner_id=context.user_id,
    )
    db = app.dependency_overrides[get_db]()
    db.add(other_song)
    db.flush()
    other_run = WorkflowRun(
        song_id=other_song.id,
        run_id=uuid.uuid4(),
        tenant_id=context.tenant_id,
        owner_id=context.user_id,
    )
    db.add(other_run)
    db.commit()
    wrong_song_take = client.post(
        base,
        json={"title": "x", "body_text": "y", "take_id": str(other_run.id)},
        headers={"Idempotency-Key": "wrong-song-take"},
    )
    assert wrong_song_take.status_code == 404


@pytest.mark.parametrize("identity_change", ["owner", "tenant"])
def test_other_owner_and_tenant_get_404_via_api(story_client, identity_change):
    """API reads conceal stories when either owner or tenant differs."""
    client, song, context = story_client
    created = client.post(
        f"/api/v1/songs/{song.id}/stories",
        json={"title": "x", "body_text": "y"},
        headers={"Idempotency-Key": "create"},
    )
    original_owner, original_tenant = context.user_id, context.tenant_id
    if identity_change == "owner":
        context.user_id = uuid.uuid4()
    else:
        context.tenant_id = uuid.uuid4()
    response = client.get(
        f"/api/v1/songs/{song.id}/stories/{created.json()['id']}"
    )
    assert response.status_code == 404
    context.user_id, context.tenant_id = original_owner, original_tenant


def test_soft_deleted_story_is_hidden_from_api_list_and_retrieve(story_client):
    """A directly soft-deleted story is absent from API reads."""
    client, song, _ = story_client
    base = f"/api/v1/songs/{song.id}/stories"
    created = client.post(
        base,
        json={"title": "x", "body_text": "y"},
        headers={"Idempotency-Key": "create"},
    )
    db = app.dependency_overrides[get_db]()
    story = db.query(SongStory).filter_by(id=uuid.UUID(created.json()["id"])).one()
    from datetime import datetime, timezone

    story.deleted_at = datetime.now(timezone.utc)
    db.commit()
    assert client.get(base).json() == []
    assert client.get(f"{base}/{story.id}").status_code == 404
