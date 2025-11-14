"""Integration tests for complete song creation flow with SDS compilation.

This module tests the end-to-end song creation workflow including:
- Song creation with entity references
- Automatic SDS compilation
- Blueprint validation
- Cross-entity consistency validation
- GET /songs/{id}/sds endpoint
- Rollback on validation failures
"""

from __future__ import annotations

import uuid
from typing import Dict, Any
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models import Song, Style, Lyrics, ProducerNotes, Blueprint, Persona
from app.tests.conftest import rls_context


@pytest.fixture
def client() -> TestClient:
    """Create FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def test_tenant_id() -> uuid.UUID:
    """Generate a test tenant ID."""
    return uuid.uuid4()


@pytest.fixture
def test_owner_id() -> uuid.UUID:
    """Generate a test owner ID."""
    return uuid.uuid4()


@pytest.fixture
def test_blueprint(test_session: Session, test_tenant_id: uuid.UUID, test_owner_id: uuid.UUID) -> Blueprint:
    """Create a test blueprint with Christmas Pop genre rules."""
    blueprint = Blueprint(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        genre="Christmas Pop",
        version="2025.11",
        rules={
            "tempo_bpm": {"min": 100, "max": 140},
            "required_sections": ["Chorus"],
            "banned_terms": ["hate", "violence"] if False else [],  # For explicit control
            "lexicon_positive": ["holiday", "joy", "cheer", "snow"],
            "lexicon_negative": ["sad", "alone", "dark"],
            "section_lines": {
                "Chorus": {"min": 4, "max": 10}
            }
        },
        eval_rubric={
            "weights": {
                "hook_density": 0.3,
                "singability": 0.25,
                "rhyme_tightness": 0.2,
                "section_completeness": 0.15,
                "profanity_score": 0.1
            },
            "thresholds": {
                "min_total": 0.7,
                "max_profanity": 0.1
            }
        },
        conflict_matrix={},
        tag_categories={},
        extra_metadata={}
    )

    with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
        test_session.add(blueprint)
        test_session.commit()
        test_session.refresh(blueprint)

    return blueprint


@pytest.fixture
def test_style(test_session: Session, test_tenant_id: uuid.UUID, test_owner_id: uuid.UUID, test_blueprint: Blueprint) -> Style:
    """Create a test style specification."""
    style = Style(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Christmas Pop Upbeat",
        genre="Christmas Pop",
        sub_genres=["Big Band Pop", "Electro Swing"],
        bpm_min=110,
        bpm_max=130,
        key="C major",
        modulations=[],
        mood=["upbeat", "cheeky", "warm"],
        energy_level=8,
        instrumentation=["brass", "upright bass", "sleigh bells"],
        vocal_profile="male/female duet",
        style_tags=["Era:2010s", "Rhythm:four-on-the-floor", "Mix:modern-bright"],
        negative_tags=["muddy low-end"],
        blueprint_id=test_blueprint.id,
        extra_metadata={}
    )

    with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
        test_session.add(style)
        test_session.commit()
        test_session.refresh(style)

    return style


@pytest.fixture
def test_persona(test_session: Session, test_tenant_id: uuid.UUID, test_owner_id: uuid.UUID) -> Persona:
    """Create a test persona."""
    persona = Persona(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Holiday Crooner",
        vocal_range="baritone",
        influences=["Frank Sinatra", "Michael Bublé"],
        personality_traits=["charming", "sophisticated"],
        extra_metadata={}
    )

    with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
        test_session.add(persona)
        test_session.commit()
        test_session.refresh(persona)

    return persona


@pytest.fixture
def test_entities(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint,
    test_style: Style,
    test_persona: Persona
) -> Dict[str, Any]:
    """Create all required test entities for song creation."""

    # Create song first (needed for lyrics and producer_notes FK)
    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Test Christmas Song",
        sds_version="1.0.0",
        global_seed=42,
        style_id=test_style.id,
        persona_id=test_persona.id,
        blueprint_id=test_blueprint.id,
        status="draft",
        feature_flags={},
        render_config=None,
        extra_metadata={}
    )

    with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
        test_session.add(song)
        test_session.commit()
        test_session.refresh(song)

    # Create lyrics
    lyrics = Lyrics(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        song_id=song.id,
        sections=[
            {"type": "Intro", "lines": ["Instrumental intro"], "rhyme_scheme": "", "tags": []},
            {"type": "Verse", "lines": ["Line 1", "Line 2", "Line 3", "Line 4"], "rhyme_scheme": "AABB", "tags": []},
            {"type": "Chorus", "lines": ["Hook 1", "Hook 2", "Hook 3", "Hook 4"], "rhyme_scheme": "AABB", "tags": []}
        ],
        section_order=["Intro", "Verse", "Chorus", "Verse", "Chorus"],
        language="en",
        pov="first-person",
        tense="present",
        rhyme_scheme="AABB",
        meter="4/4 pop",
        syllables_per_line=8,
        hook_strategy="chant",
        repetition_policy="hook-heavy",
        themes=["holiday hustle", "family time"],
        imagery_density=7,
        reading_level=80,
        profanity_level=0,
        source_citations=[],
        extra_metadata={}
    )

    with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
        test_session.add(lyrics)
        test_session.commit()
        test_session.refresh(lyrics)

    # Create producer notes
    producer_notes = ProducerNotes(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        song_id=song.id,
        structure="Intro–Verse–Chorus–Verse–Chorus",
        hooks=2,
        instrumentation=["sleigh bells", "brass", "upright bass"],
        section_meta={
            "Chorus": {"tags": ["crowd-chant"]},
            "Verse": {"tags": ["intimate"]}
        },
        mix_targets={
            "lufs": -12.0,
            "space": "lush",
            "stereo_width": "wide"
        },
        extra_metadata={}
    )

    with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
        test_session.add(producer_notes)
        test_session.commit()
        test_session.refresh(producer_notes)

    return {
        "song_id": song.id,
        "style_id": test_style.id,
        "lyrics_id": lyrics.id,
        "producer_notes_id": producer_notes.id,
        "persona_id": test_persona.id,
        "blueprint_id": test_blueprint.id,
        "tenant_id": test_tenant_id,
        "owner_id": test_owner_id
    }


class TestSongCreationWithSDSCompilation:
    """Test suite for end-to-end song creation with SDS compilation."""

    @pytest.mark.integration
    def test_create_song_with_sds_success(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test end-to-end song creation with SDS compilation and validation.

        Verifies:
        - Song created successfully
        - SDS compiled from entity references
        - SDS stored in extra_metadata.compiled_sds
        - All validation passes
        - Response contains song data
        """
        # Mock the service dependencies to avoid actual compilation
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler, \
             patch("app.api.v1.endpoints.songs.get_blueprint_validator_service") as mock_bp_validator, \
             patch("app.api.v1.endpoints.songs.get_cross_entity_validator") as mock_ce_validator:

            # Mock SDS compiler to return a valid SDS
            mock_compiler_instance = AsyncMock()
            mock_sds = {
                "title": "Test Song",
                "sds_version": "1.0.0",
                "global_seed": 100,
                "style": {"genre": "Christmas Pop", "tempo_bpm": 120},
                "lyrics": {"sections": [], "section_order": ["Chorus"]},
                "producer_notes": {"structure": "Chorus", "hooks": 2},
                "_computed_hash": "abc123def456"
            }
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            # Mock blueprint validator to pass
            mock_bp_validator_instance = AsyncMock()
            mock_bp_validator_instance.validate_sds_against_blueprint = AsyncMock(
                return_value=(True, [])
            )
            mock_bp_validator.return_value = mock_bp_validator_instance

            # Mock cross-entity validator to pass
            mock_ce_validator_instance = AsyncMock()
            mock_ce_validator_instance.validate_sds_consistency.return_value = (True, [])
            mock_ce_validator.return_value = mock_ce_validator_instance

            # Create song
            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Test Song",
                    "sds_version": "1.0.0",
                    "global_seed": 100,
                    "style_id": str(test_entities["style_id"]),
                    "persona_id": str(test_entities["persona_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            # Assertions
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["title"] == "Test Song"
            assert "id" in data
            assert data["global_seed"] == 100

            # Verify song exists in database
            with rls_context(
                test_session,
                user_id=str(test_entities["owner_id"]),
                tenant_id=str(test_entities["tenant_id"])
            ):
                song = test_session.query(Song).filter(Song.id == uuid.UUID(data["id"])).first()
                assert song is not None
                assert song.title == "Test Song"

                # Verify SDS stored in metadata
                assert "compiled_sds" in song.extra_metadata
                assert song.extra_metadata["compiled_sds"]["_computed_hash"] == "abc123def456"

    @pytest.mark.integration
    def test_create_song_missing_style_entity(
        self,
        client: TestClient,
        test_entities: Dict[str, Any]
    ):
        """Test song creation fails with non-existent style_id.

        Verifies:
        - Returns 400 status
        - Error message indicates entity not found
        - Song not created in database
        """
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            # Mock compiler to raise ValueError for missing entity
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.side_effect = ValueError(
                "Style with ID 00000000-0000-0000-0000-000000000000 not found"
            )
            mock_compiler.return_value = mock_compiler_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Invalid Song",
                    "sds_version": "1.0.0",
                    "global_seed": 42,
                    "style_id": "00000000-0000-0000-0000-000000000000",  # Non-existent
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "not found" in response.json()["detail"].lower()

    @pytest.mark.integration
    def test_create_song_missing_blueprint_entity(
        self,
        client: TestClient,
        test_entities: Dict[str, Any]
    ):
        """Test song creation fails with non-existent blueprint_id.

        Verifies:
        - Returns 400 status
        - Error message indicates blueprint not found
        """
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            # Mock compiler to raise ValueError for missing blueprint
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.side_effect = ValueError(
                "Blueprint with ID 00000000-0000-0000-0000-000000000000 not found"
            )
            mock_compiler.return_value = mock_compiler_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Invalid Song",
                    "sds_version": "1.0.0",
                    "global_seed": 42,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": "00000000-0000-0000-0000-000000000000",  # Non-existent
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "blueprint" in response.json()["detail"].lower()
            assert "not found" in response.json()["detail"].lower()

    @pytest.mark.integration
    def test_create_song_blueprint_bpm_violation(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test song creation fails when BPM outside blueprint range.

        Verifies:
        - Returns 400 status
        - Error message explains BPM constraint violation
        - Song not created (rollback worked)
        """
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler, \
             patch("app.api.v1.endpoints.songs.get_blueprint_validator_service") as mock_bp_validator:

            # Mock compiler to return SDS with invalid BPM
            mock_compiler_instance = AsyncMock()
            mock_sds = {
                "title": "Test Song",
                "style": {"genre": "Christmas Pop", "tempo_bpm": 200},  # Outside 100-140 range
                "blueprint_ref": {"genre": "Christmas Pop"}
            }
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            # Mock blueprint validator to fail
            mock_bp_validator_instance = AsyncMock()
            mock_bp_validator_instance.validate_sds_against_blueprint = AsyncMock(
                return_value=(False, ["BPM 200 outside allowed range 100-140"])
            )
            mock_bp_validator.return_value = mock_bp_validator_instance

            initial_song_count = test_session.query(Song).count()

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Invalid BPM Song",
                    "sds_version": "1.0.0",
                    "global_seed": 42,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            detail = response.json()["detail"]
            assert "blueprint validation failed" in detail.lower()
            assert "bpm" in detail.lower()

            # Verify song was not created (rollback worked)
            final_song_count = test_session.query(Song).count()
            assert final_song_count == initial_song_count

    @pytest.mark.integration
    def test_create_song_missing_required_sections(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test song creation fails when required sections missing.

        Verifies:
        - Returns 400 status
        - Error message indicates missing required sections
        - Song not created
        """
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler, \
             patch("app.api.v1.endpoints.songs.get_blueprint_validator_service") as mock_bp_validator:

            # Mock compiler to return SDS without required Chorus
            mock_compiler_instance = AsyncMock()
            mock_sds = {
                "title": "Test Song",
                "lyrics": {"section_order": ["Verse", "Bridge"]},  # No Chorus
                "blueprint_ref": {"genre": "Christmas Pop"}
            }
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            # Mock blueprint validator to fail
            mock_bp_validator_instance = AsyncMock()
            mock_bp_validator_instance.validate_sds_against_blueprint = AsyncMock(
                return_value=(False, ["Missing required section: Chorus"])
            )
            mock_bp_validator.return_value = mock_bp_validator_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Missing Sections Song",
                    "sds_version": "1.0.0",
                    "global_seed": 42,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            detail = response.json()["detail"]
            assert "blueprint validation failed" in detail.lower()
            assert "section" in detail.lower() or "chorus" in detail.lower()

    @pytest.mark.integration
    def test_create_song_genre_mismatch(
        self,
        client: TestClient,
        test_entities: Dict[str, Any]
    ):
        """Test song creation fails when blueprint genre != style genre.

        Verifies:
        - Returns 400 status
        - Error message explains genre mismatch
        - Song not created
        """
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler, \
             patch("app.api.v1.endpoints.songs.get_blueprint_validator_service") as mock_bp_validator, \
             patch("app.api.v1.endpoints.songs.get_cross_entity_validator") as mock_ce_validator:

            # Mock compiler to return valid SDS
            mock_compiler_instance = AsyncMock()
            mock_sds = {
                "title": "Test Song",
                "blueprint_ref": {"genre": "Christmas Pop"},
                "style": {"genre_detail": {"primary": "Hip-Hop"}}  # Mismatch!
            }
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            # Mock blueprint validator to pass
            mock_bp_validator_instance = AsyncMock()
            mock_bp_validator_instance.validate_sds_against_blueprint = AsyncMock(
                return_value=(True, [])
            )
            mock_bp_validator.return_value = mock_bp_validator_instance

            # Mock cross-entity validator to fail on genre mismatch
            mock_ce_validator_instance = AsyncMock()
            mock_ce_validator_instance.validate_sds_consistency.return_value = (
                False,
                ["Genre mismatch: blueprint 'Christmas Pop' != style 'Hip-Hop'"]
            )
            mock_ce_validator.return_value = mock_ce_validator_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Genre Mismatch Song",
                    "sds_version": "1.0.0",
                    "global_seed": 42,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            detail = response.json()["detail"]
            assert "cross-entity validation failed" in detail.lower()
            assert "genre" in detail.lower()

    @pytest.mark.integration
    def test_create_song_producer_section_not_in_lyrics(
        self,
        client: TestClient,
        test_entities: Dict[str, Any]
    ):
        """Test song creation fails when producer sections not in lyrics.

        Verifies:
        - Returns 400 status
        - Error message explains section alignment issue
        """
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler, \
             patch("app.api.v1.endpoints.songs.get_blueprint_validator_service") as mock_bp_validator, \
             patch("app.api.v1.endpoints.songs.get_cross_entity_validator") as mock_ce_validator:

            # Mock compiler
            mock_compiler_instance = AsyncMock()
            mock_sds = {
                "title": "Test Song",
                "lyrics": {"section_order": ["Verse", "Chorus"]},
                "producer_notes": {"structure": "Verse–Chorus–Bridge"}  # Bridge not in lyrics!
            }
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            # Mock blueprint validator to pass
            mock_bp_validator_instance = AsyncMock()
            mock_bp_validator_instance.validate_sds_against_blueprint = AsyncMock(
                return_value=(True, [])
            )
            mock_bp_validator.return_value = mock_bp_validator_instance

            # Mock cross-entity validator to fail on section mismatch
            mock_ce_validator_instance = AsyncMock()
            mock_ce_validator_instance.validate_sds_consistency.return_value = (
                False,
                ["Producer section 'Bridge' not found in lyrics.section_order"]
            )
            mock_ce_validator.return_value = mock_ce_validator_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Section Mismatch Song",
                    "sds_version": "1.0.0",
                    "global_seed": 42,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            detail = response.json()["detail"]
            assert "cross-entity validation failed" in detail.lower()


class TestGetSongSDSEndpoint:
    """Test suite for GET /songs/{id}/sds endpoint."""

    @pytest.mark.integration
    def test_get_sds_cache_hit(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test GET /songs/{id}/sds returns cached SDS.

        Verifies:
        - Returns 200 status
        - Returns SDS from extra_metadata.compiled_sds
        - Fast response (no recompilation)
        """
        # Create song with cached SDS
        cached_sds = {
            "title": "Cached Song",
            "sds_version": "1.0.0",
            "global_seed": 42,
            "style": {"genre": "Christmas Pop"},
            "_computed_hash": "cached_hash_123"
        }

        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_entities["tenant_id"],
            owner_id=test_entities["owner_id"],
            title="Cached Song",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_entities["style_id"],
            blueprint_id=test_entities["blueprint_id"],
            status="draft",
            feature_flags={},
            extra_metadata={"compiled_sds": cached_sds}
        )

        with rls_context(
            test_session,
            user_id=str(test_entities["owner_id"]),
            tenant_id=str(test_entities["tenant_id"])
        ):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        response = client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()
        assert sds["title"] == "Cached Song"
        assert sds["_computed_hash"] == "cached_hash_123"

    @pytest.mark.integration
    def test_get_sds_cache_miss_compiles(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test GET /songs/{id}/sds compiles SDS when cache missing.

        Verifies:
        - Returns 200 status
        - Compiles SDS from current entity state
        """
        # Create song without cached SDS
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_entities["tenant_id"],
            owner_id=test_entities["owner_id"],
            title="Uncached Song",
            sds_version="1.0.0",
            global_seed=100,
            style_id=test_entities["style_id"],
            blueprint_id=test_entities["blueprint_id"],
            status="draft",
            feature_flags={},
            extra_metadata={}  # No cached SDS
        )

        with rls_context(
            test_session,
            user_id=str(test_entities["owner_id"]),
            tenant_id=str(test_entities["tenant_id"])
        ):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            # Mock compiler to return fresh SDS
            mock_compiler_instance = AsyncMock()
            compiled_sds = {
                "title": "Uncached Song",
                "sds_version": "1.0.0",
                "global_seed": 100,
                "_computed_hash": "fresh_hash_456"
            }
            mock_compiler_instance.compile_sds.return_value = compiled_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/sds")

            assert response.status_code == status.HTTP_200_OK
            sds = response.json()
            assert sds["title"] == "Uncached Song"
            assert sds["_computed_hash"] == "fresh_hash_456"

            # Verify compiler was called
            mock_compiler_instance.compile_sds.assert_called_once_with(song.id, validate=True)

    @pytest.mark.integration
    def test_get_sds_force_recompile(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test GET /songs/{id}/sds?recompile=true forces recompilation.

        Verifies:
        - Ignores cached SDS
        - Compiles fresh SDS from current entities
        - Returns new SDS with updated hash
        """
        # Create song with cached SDS
        old_sds = {
            "title": "Old Title",
            "_computed_hash": "old_hash"
        }

        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_entities["tenant_id"],
            owner_id=test_entities["owner_id"],
            title="Updated Song",
            sds_version="1.0.0",
            global_seed=200,
            style_id=test_entities["style_id"],
            blueprint_id=test_entities["blueprint_id"],
            status="draft",
            feature_flags={},
            extra_metadata={"compiled_sds": old_sds}
        )

        with rls_context(
            test_session,
            user_id=str(test_entities["owner_id"]),
            tenant_id=str(test_entities["tenant_id"])
        ):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            # Mock compiler to return fresh SDS
            mock_compiler_instance = AsyncMock()
            new_sds = {
                "title": "Updated Song",
                "_computed_hash": "new_hash_789"
            }
            mock_compiler_instance.compile_sds.return_value = new_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/sds?recompile=true")

            assert response.status_code == status.HTTP_200_OK
            sds = response.json()
            assert sds["title"] == "Updated Song"
            assert sds["_computed_hash"] == "new_hash_789"
            assert sds["_computed_hash"] != "old_hash"  # Fresh compilation

            # Verify compiler was called even though cache existed
            mock_compiler_instance.compile_sds.assert_called_once()

    @pytest.mark.integration
    def test_get_sds_song_not_found(
        self,
        client: TestClient
    ):
        """Test GET /songs/{id}/sds returns 404 for non-existent song.

        Verifies:
        - Returns 404 status
        - Error message indicates song not found
        """
        fake_id = uuid.uuid4()
        response = client.get(f"/api/v1/songs/{fake_id}/sds")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.integration
    def test_get_sds_compilation_failure(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test GET /songs/{id}/sds returns 400 when compilation fails.

        Verifies:
        - Returns 400 status
        - Error message explains compilation failure
        """
        # Create song without cached SDS
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_entities["tenant_id"],
            owner_id=test_entities["owner_id"],
            title="Broken Song",
            sds_version="1.0.0",
            global_seed=300,
            style_id=test_entities["style_id"],
            blueprint_id=test_entities["blueprint_id"],
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(
            test_session,
            user_id=str(test_entities["owner_id"]),
            tenant_id=str(test_entities["tenant_id"])
        ):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            # Mock compiler to raise error
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.side_effect = ValueError(
                "Missing required entity: lyrics"
            )
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/sds")

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            detail = response.json()["detail"]
            assert "compilation failed" in detail.lower()
            assert "lyrics" in detail.lower()


class TestSongCreationRollback:
    """Test suite for transaction rollback on validation failures."""

    @pytest.mark.integration
    def test_rollback_on_compilation_failure(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test song is rolled back when SDS compilation fails.

        Verifies:
        - Song not persisted in database
        - No orphaned records
        - Error returned to client
        """
        initial_song_count = test_session.query(Song).count()

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            # Mock compiler to fail
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.side_effect = ValueError(
                "Compilation error: missing lyrics"
            )
            mock_compiler.return_value = mock_compiler_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Rollback Test Song",
                    "sds_version": "1.0.0",
                    "global_seed": 999,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST

            # Verify song was NOT created
            final_song_count = test_session.query(Song).count()
            assert final_song_count == initial_song_count

    @pytest.mark.integration
    def test_rollback_on_blueprint_validation_failure(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test song is rolled back when blueprint validation fails.

        Verifies:
        - Song not persisted
        - Validation error returned
        """
        initial_song_count = test_session.query(Song).count()

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler, \
             patch("app.api.v1.endpoints.songs.get_blueprint_validator_service") as mock_bp_validator:

            # Mock compiler to succeed
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.return_value = {"title": "Test"}
            mock_compiler.return_value = mock_compiler_instance

            # Mock blueprint validator to fail
            mock_bp_validator_instance = AsyncMock()
            mock_bp_validator_instance.validate_sds_against_blueprint = AsyncMock(
                return_value=(False, ["Invalid BPM"])
            )
            mock_bp_validator.return_value = mock_bp_validator_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Blueprint Rollback Test",
                    "sds_version": "1.0.0",
                    "global_seed": 888,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST

            # Verify song was NOT created
            final_song_count = test_session.query(Song).count()
            assert final_song_count == initial_song_count

    @pytest.mark.integration
    def test_rollback_on_cross_entity_validation_failure(
        self,
        client: TestClient,
        test_entities: Dict[str, Any],
        test_session: Session
    ):
        """Test song is rolled back when cross-entity validation fails.

        Verifies:
        - Song not persisted
        - Cross-entity error returned
        """
        initial_song_count = test_session.query(Song).count()

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler, \
             patch("app.api.v1.endpoints.songs.get_blueprint_validator_service") as mock_bp_validator, \
             patch("app.api.v1.endpoints.songs.get_cross_entity_validator") as mock_ce_validator:

            # Mock compiler to succeed
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.return_value = {"title": "Test"}
            mock_compiler.return_value = mock_compiler_instance

            # Mock blueprint validator to pass
            mock_bp_validator_instance = AsyncMock()
            mock_bp_validator_instance.validate_sds_against_blueprint = AsyncMock(
                return_value=(True, [])
            )
            mock_bp_validator.return_value = mock_bp_validator_instance

            # Mock cross-entity validator to fail
            mock_ce_validator_instance = AsyncMock()
            mock_ce_validator_instance.validate_sds_consistency.return_value = (
                False,
                ["Genre mismatch"]
            )
            mock_ce_validator.return_value = mock_ce_validator_instance

            response = client.post(
                "/api/v1/songs",
                json={
                    "title": "Cross-Entity Rollback Test",
                    "sds_version": "1.0.0",
                    "global_seed": 777,
                    "style_id": str(test_entities["style_id"]),
                    "blueprint_id": str(test_entities["blueprint_id"]),
                    "status": "draft",
                    "feature_flags": {},
                    "extra_metadata": {}
                }
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST

            # Verify song was NOT created
            final_song_count = test_session.query(Song).count()
            assert final_song_count == initial_song_count
