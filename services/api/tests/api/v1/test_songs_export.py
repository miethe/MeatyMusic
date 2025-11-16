"""Integration tests for GET /songs/{id}/export endpoint.

This module tests the SDS export functionality including:
- Successful export with proper headers and filename
- Filename generation from song title (kebab-case + timestamp)
- JSON formatting (pretty-printed, indented)
- Error handling (404, 422)
- Same error cases as GET /sds endpoint
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
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
def test_blueprint(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID
) -> Blueprint:
    """Create a test blueprint."""
    blueprint = Blueprint(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        genre="Pop",
        version="2025.11",
        rules={
            "tempo_bpm": {"min": 80, "max": 140},
            "required_sections": ["Chorus"],
        },
        eval_rubric={
            "weights": {
                "hook_density": 0.3,
                "singability": 0.25,
                "rhyme_tightness": 0.2,
            },
            "thresholds": {
                "min_total": 0.7,
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
def test_style(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint
) -> Style:
    """Create a test style specification."""
    style = Style(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Pop Style",
        genre="Pop",
        sub_genres=["Synth Pop"],
        bpm_min=120,
        bpm_max=120,
        key="C major",
        modulations=[],
        mood=["upbeat"],
        energy_level=8,
        instrumentation=["synth", "drums", "bass"],
        vocal_profile="energetic",
        style_tags=["modern"],
        negative_tags=[],
        blueprint_id=test_blueprint.id,
        extra_metadata={}
    )

    with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
        test_session.add(style)
        test_session.commit()
        test_session.refresh(style)

    return style


@pytest.fixture
def mock_sds() -> Dict[str, Any]:
    """Create a mock SDS for testing."""
    return {
        "title": "Test Song",
        "sds_version": "1.0.0",
        "global_seed": 42,
        "blueprint_ref": {
            "genre": "Pop",
            "version": "2025.11"
        },
        "style": {
            "genre_detail": {"primary": "Pop", "subgenres": [], "fusions": []},
            "tempo_bpm": 120,
            "key": {"primary": "C major", "modulations": []},
            "mood": ["upbeat"],
            "instrumentation": ["synth", "drums", "bass"],
            "tags": ["modern"]
        },
        "lyrics": {
            "language": "en",
            "section_order": ["Verse", "Chorus"],
            "constraints": {"explicit": False}
        },
        "producer_notes": {
            "structure": "Verse–Chorus",
            "hooks": 2
        },
        "persona_id": None,
        "sources": [],
        "prompt_controls": {
            "positive_tags": [],
            "negative_tags": [],
            "max_style_chars": 1000,
            "max_prompt_chars": 5000
        },
        "render": {
            "engine": "none",
            "model": None,
            "num_variations": 2
        },
        "seed": 42,
        "_computed_hash": "abc123def456"
    }


class TestExportSongSDS:
    """Test suite for GET /songs/{id}/export endpoint."""

    @pytest.mark.integration
    def test_export_sds_success(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style,
        mock_sds: Dict[str, Any]
    ):
        """Test successful SDS export with proper headers and filename.

        Verifies:
        - Returns 200 status
        - Content-Type is application/json
        - Content-Disposition header with correct filename
        - Filename format: {title-kebab-case}_sds_{YYYYMMDD}.json
        - JSON is properly formatted (indented)
        - Response body is valid JSON
        """
        # Create song
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="My Awesome Song",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        # Mock compiler
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_sds["title"] = "My Awesome Song"
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            # Verify status code
            assert response.status_code == status.HTTP_200_OK

            # Verify headers
            assert "application/json" in response.headers["content-type"]
            assert "attachment" in response.headers["content-disposition"]

            # Verify filename format
            today = datetime.now().strftime("%Y%m%d")
            expected_filename = f"my-awesome-song_sds_{today}.json"
            assert expected_filename in response.headers["content-disposition"]

            # Verify JSON content is valid and formatted
            content = response.content.decode('utf-8')
            parsed_sds = json.loads(content)
            assert parsed_sds["title"] == "My Awesome Song"
            assert parsed_sds["_computed_hash"] == "abc123def456"

            # Verify JSON is pretty-printed (has indentation)
            assert "\n" in content  # Has newlines
            assert "  " in content  # Has indentation

            # Verify compiler was called with use_defaults=True (default)
            mock_compiler_instance.compile_sds.assert_called_once_with(
                song.id, use_defaults=True, validate=True
            )

    @pytest.mark.integration
    def test_export_sds_filename_special_characters(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style,
        mock_sds: Dict[str, Any]
    ):
        """Test filename generation handles special characters correctly.

        Verifies:
        - Special characters removed from filename
        - Spaces converted to hyphens
        - Multiple hyphens collapsed to single hyphen
        - Leading/trailing hyphens removed
        """
        # Create song with special characters in title
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="Hello!! World's--Best_Song (2024)",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_sds["title"] = song.title
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_200_OK

            # Verify filename is sanitized
            content_disposition = response.headers["content-disposition"]
            # Expected: hello-worlds-best-song-2024_sds_{date}.json
            assert "hello-worlds-best-song-2024_sds_" in content_disposition
            # Should not contain special characters
            assert "!!" not in content_disposition
            assert "'s" not in content_disposition
            assert "--" not in content_disposition
            assert "()" not in content_disposition

    @pytest.mark.integration
    def test_export_sds_filename_empty_title(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style,
        mock_sds: Dict[str, Any]
    ):
        """Test filename generation with title that becomes empty after sanitization.

        Verifies:
        - Falls back to 'song' if title sanitization results in empty string
        - Filename still includes timestamp
        """
        # Create song with title that's all special characters
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="!!!",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_sds["title"] = song.title
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_200_OK

            # Verify fallback filename
            content_disposition = response.headers["content-disposition"]
            today = datetime.now().strftime("%Y%m%d")
            expected_filename = f"song_sds_{today}.json"
            assert expected_filename in content_disposition

    @pytest.mark.integration
    def test_export_sds_unicode_title(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style,
        mock_sds: Dict[str, Any]
    ):
        """Test export handles Unicode characters in title and content.

        Verifies:
        - Unicode characters handled correctly in JSON content
        - ensure_ascii=False preserves Unicode
        - UTF-8 encoding in response
        """
        # Create song with Unicode title
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="Café España 日本",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_sds["title"] = song.title
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_200_OK

            # Verify UTF-8 encoding
            assert "charset=utf-8" in response.headers["content-type"]

            # Verify Unicode preserved in content
            content = response.content.decode('utf-8')
            parsed_sds = json.loads(content)
            assert parsed_sds["title"] == "Café España 日本"

    @pytest.mark.integration
    def test_export_sds_song_not_found(
        self,
        client: TestClient
    ):
        """Test export returns 404 for non-existent song.

        Verifies:
        - Returns 404 status
        - Error message indicates song not found
        - Same behavior as GET /sds endpoint
        """
        fake_id = uuid.uuid4()
        response = client.get(f"/api/v1/songs/{fake_id}/export")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.integration
    def test_export_sds_compilation_failure(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style
    ):
        """Test export returns 422 when SDS compilation fails.

        Verifies:
        - Returns 422 status
        - Error message explains compilation failure
        - Same error handling as GET /sds endpoint
        """
        # Create song
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="Broken Song",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        # Mock compiler to fail
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.side_effect = ValueError(
                "Missing required entity: lyrics"
            )
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            detail = response.json()["detail"]
            assert "compilation failed" in detail.lower()
            assert "lyrics" in detail.lower()

    @pytest.mark.integration
    def test_export_sds_validation_failure(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style
    ):
        """Test export returns 422 when SDS validation fails.

        Verifies:
        - Returns 422 status
        - Error message explains validation failure
        """
        # Create song
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="Invalid SDS Song",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        # Mock compiler to fail validation
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.side_effect = ValueError(
                "SDS validation failed: invalid schema"
            )
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            assert "compilation failed" in response.json()["detail"].lower()

    @pytest.mark.integration
    def test_export_sds_json_formatting(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style,
        mock_sds: Dict[str, Any]
    ):
        """Test exported JSON is properly formatted for readability.

        Verifies:
        - JSON has proper indentation (2 spaces)
        - Keys are preserved in output
        - Nested objects properly formatted
        - Valid JSON can be parsed
        """
        # Create song
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="Format Test",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_200_OK

            content = response.content.decode('utf-8')

            # Verify it's valid JSON
            parsed = json.loads(content)
            assert isinstance(parsed, dict)

            # Verify formatting
            lines = content.split('\n')
            # Should have multiple lines (formatted, not compact)
            assert len(lines) > 10

            # Check for 2-space indentation
            indented_lines = [line for line in lines if line.startswith('  ')]
            assert len(indented_lines) > 0

            # Verify nested objects are formatted
            assert '"blueprint_ref": {' in content
            assert '"style": {' in content

    @pytest.mark.integration
    def test_export_sds_browser_download_behavior(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style,
        mock_sds: Dict[str, Any]
    ):
        """Test response headers trigger browser download (not display).

        Verifies:
        - Content-Disposition is 'attachment' (not 'inline')
        - Browser will prompt download instead of displaying
        """
        # Create song
        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="Download Test",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            mock_compiler_instance.compile_sds.return_value = mock_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_200_OK

            # Verify Content-Disposition triggers download
            content_disposition = response.headers["content-disposition"]
            assert content_disposition.startswith("attachment")
            assert "filename=" in content_disposition

    @pytest.mark.integration
    def test_export_sds_compiles_fresh_not_cached(
        self,
        client: TestClient,
        test_session: Session,
        test_tenant_id: uuid.UUID,
        test_owner_id: uuid.UUID,
        test_blueprint: Blueprint,
        test_style: Style,
        mock_sds: Dict[str, Any]
    ):
        """Test export always compiles fresh SDS, ignoring cache.

        Verifies:
        - Compiler is called even if cached SDS exists
        - Fresh compilation ensures latest entity state
        """
        # Create song with cached SDS
        cached_sds = {
            "title": "Old Title",
            "_computed_hash": "old_hash_cached"
        }

        song = Song(
            id=uuid.uuid4(),
            tenant_id=test_tenant_id,
            owner_id=test_owner_id,
            title="Updated Title",
            sds_version="1.0.0",
            global_seed=42,
            style_id=test_style.id,
            blueprint_id=test_blueprint.id,
            status="draft",
            feature_flags={},
            extra_metadata={"compiled_sds": cached_sds}
        )

        with rls_context(test_session, user_id=str(test_owner_id), tenant_id=str(test_tenant_id)):
            test_session.add(song)
            test_session.commit()
            test_session.refresh(song)

        # Mock compiler to return fresh SDS
        with patch("app.api.v1.endpoints.songs.get_sds_compiler_service") as mock_compiler:
            mock_compiler_instance = AsyncMock()
            fresh_sds = mock_sds.copy()
            fresh_sds["title"] = "Updated Title"
            fresh_sds["_computed_hash"] = "fresh_hash_new"
            mock_compiler_instance.compile_sds.return_value = fresh_sds
            mock_compiler.return_value = mock_compiler_instance

            response = client.get(f"/api/v1/songs/{song.id}/export")

            assert response.status_code == status.HTTP_200_OK

            # Verify fresh compilation
            content = response.content.decode('utf-8')
            parsed = json.loads(content)
            assert parsed["title"] == "Updated Title"
            assert parsed["_computed_hash"] == "fresh_hash_new"
            assert parsed["_computed_hash"] != "old_hash_cached"

            # Verify compiler was called with use_defaults=True (default)
            mock_compiler_instance.compile_sds.assert_called_once_with(
                song.id, use_defaults=True, validate=True
            )
