"""Integration tests for GET /songs/{id}/sds endpoint.

Tests the SDS compilation endpoint with default generation,
caching, error handling, and various entity configurations.
"""

import pytest
from uuid import uuid4, UUID
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
class TestGetSongSDS:
    """Test suite for GET /api/v1/songs/{song_id}/sds endpoint."""

    async def test_get_sds_with_all_entities(
        self,
        async_client: AsyncClient,
        test_song_with_full_entities,
    ):
        """Test successful SDS retrieval with all entities present."""
        song = test_song_with_full_entities

        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        # Verify SDS structure
        assert sds["title"] == song.title
        assert "blueprint_ref" in sds
        assert sds["blueprint_ref"]["genre"] is not None
        assert "style" in sds
        assert "lyrics" in sds
        assert "producer_notes" in sds
        assert "sources" in sds
        assert "prompt_controls" in sds
        assert "render" in sds
        assert "seed" in sds

        # Verify style structure
        assert "genre_detail" in sds["style"]
        assert "tempo_bpm" in sds["style"]
        assert "key" in sds["style"]
        assert "mood" in sds["style"]
        assert "instrumentation" in sds["style"]
        assert "tags" in sds["style"]

        # Verify lyrics structure
        assert "language" in sds["lyrics"]
        assert "section_order" in sds["lyrics"]
        assert "constraints" in sds["lyrics"]

        # Verify producer notes structure
        assert "structure" in sds["producer_notes"]
        assert "hooks" in sds["producer_notes"]

    async def test_get_sds_with_missing_entities_use_defaults_true(
        self,
        async_client: AsyncClient,
        test_song_minimal,
        test_blueprint,
    ):
        """Test SDS generation with missing entities and use_defaults=True."""
        song = test_song_minimal  # Song with only blueprint, no style/lyrics/producer

        response = await async_client.get(
            f"/api/v1/songs/{song.id}/sds",
            params={"use_defaults": True}
        )

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        # Verify complete SDS was generated with defaults
        assert sds["title"] == song.title
        assert "style" in sds
        assert "lyrics" in sds
        assert "producer_notes" in sds

        # Verify default values are sensible
        assert sds["style"]["genre_detail"]["primary"] == test_blueprint.genre
        assert sds["lyrics"]["language"] == "en"
        assert sds["lyrics"]["pov"] == "1st"
        assert sds["producer_notes"]["hooks"] >= 0

    async def test_get_sds_with_missing_entities_use_defaults_false(
        self,
        async_client: AsyncClient,
        test_song_minimal,
    ):
        """Test SDS compilation fails when use_defaults=False and entities missing."""
        song = test_song_minimal

        response = await async_client.get(
            f"/api/v1/songs/{song.id}/sds",
            params={"use_defaults": False}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error = response.json()
        assert "detail" in error
        assert "SDS compilation failed" in error["detail"]
        # Should mention missing entity
        assert any(word in error["detail"].lower() for word in ["style", "lyrics", "producer"])

    async def test_get_sds_song_not_found(
        self,
        async_client: AsyncClient,
    ):
        """Test 404 error when song doesn't exist."""
        non_existent_id = uuid4()

        response = await async_client.get(f"/api/v1/songs/{non_existent_id}/sds")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        error = response.json()
        assert "detail" in error
        assert str(non_existent_id) in error["detail"]

    async def test_get_sds_cached_response(
        self,
        async_client: AsyncClient,
        test_song_with_cached_sds,
    ):
        """Test that cached SDS is returned when available."""
        song = test_song_with_cached_sds

        # First request should return cached SDS
        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        # Verify it's the cached version (should have cached metadata)
        assert sds["title"] == song.title
        # Cached SDS should match what's in extra_metadata
        cached_sds = song.extra_metadata.get("compiled_sds")
        assert sds == cached_sds

    async def test_get_sds_recompile_parameter(
        self,
        async_client: AsyncClient,
        test_song_with_cached_sds,
    ):
        """Test that recompile=True forces SDS regeneration."""
        song = test_song_with_cached_sds

        # Request with recompile=True
        response = await async_client.get(
            f"/api/v1/songs/{song.id}/sds",
            params={"recompile": True}
        )

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        # Should be recompiled (not necessarily different, but freshly generated)
        assert sds["title"] == song.title
        assert "blueprint_ref" in sds

    async def test_get_sds_with_partial_entities(
        self,
        async_client: AsyncClient,
        test_song_with_style_only,
    ):
        """Test SDS generation with partial entities (style exists, others missing)."""
        song = test_song_with_style_only

        response = await async_client.get(
            f"/api/v1/songs/{song.id}/sds",
            params={"use_defaults": True}
        )

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        # Style should be from database
        assert sds["style"] is not None
        # Lyrics and producer notes should be generated defaults
        assert sds["lyrics"] is not None
        assert sds["producer_notes"] is not None

    async def test_get_sds_validation_failure(
        self,
        async_client: AsyncClient,
        test_song_with_invalid_data,
    ):
        """Test 422 error when SDS validation fails."""
        song = test_song_with_invalid_data

        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error = response.json()
        assert "detail" in error
        assert "validation failed" in error["detail"].lower()

    async def test_get_sds_with_sources(
        self,
        async_client: AsyncClient,
        test_song_with_sources,
    ):
        """Test SDS includes normalized source weights."""
        song = test_song_with_sources

        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        # Sources should be present and normalized
        assert "sources" in sds
        assert len(sds["sources"]) > 0

        # Weights should sum to approximately 1.0
        total_weight = sum(src["weight"] for src in sds["sources"])
        assert 0.99 <= total_weight <= 1.01  # Allow for rounding

        # Each source should have required fields
        for source in sds["sources"]:
            assert "name" in source
            assert "kind" in source
            assert "weight" in source
            assert 0 <= source["weight"] <= 1

    async def test_get_sds_with_persona(
        self,
        async_client: AsyncClient,
        test_song_with_persona,
    ):
        """Test SDS includes persona_id when persona is present."""
        song = test_song_with_persona

        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        assert sds["persona_id"] is not None
        # Should be a valid UUID string
        UUID(sds["persona_id"])

    async def test_get_sds_without_persona(
        self,
        async_client: AsyncClient,
        test_song_without_persona,
    ):
        """Test SDS has persona_id=null when no persona."""
        song = test_song_without_persona

        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        assert sds["persona_id"] is None

    async def test_get_sds_seed_consistency(
        self,
        async_client: AsyncClient,
        test_song_with_full_entities,
    ):
        """Test that SDS seed matches song global_seed."""
        song = test_song_with_full_entities

        response = await async_client.get(
            f"/api/v1/songs/{song.id}/sds",
            params={"recompile": True}  # Force fresh compilation
        )

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        assert sds["seed"] == song.global_seed

    async def test_get_sds_deterministic_hash(
        self,
        async_client: AsyncClient,
        test_song_with_full_entities,
    ):
        """Test that recompiling same SDS produces same hash."""
        song = test_song_with_full_entities

        # First compilation
        response1 = await async_client.get(
            f"/api/v1/songs/{song.id}/sds",
            params={"recompile": True}
        )
        sds1 = response1.json()

        # Second compilation
        response2 = await async_client.get(
            f"/api/v1/songs/{song.id}/sds",
            params={"recompile": True}
        )
        sds2 = response2.json()

        # Hashes should match (deterministic compilation)
        assert sds1.get("_computed_hash") == sds2.get("_computed_hash")

    async def test_get_sds_response_structure(
        self,
        async_client: AsyncClient,
        test_song_with_full_entities,
    ):
        """Test that response matches expected SDS schema structure."""
        song = test_song_with_full_entities

        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        sds = response.json()

        # Required top-level fields
        required_fields = [
            "title",
            "blueprint_ref",
            "style",
            "lyrics",
            "producer_notes",
            "persona_id",
            "sources",
            "prompt_controls",
            "render",
            "seed"
        ]
        for field in required_fields:
            assert field in sds, f"Missing required field: {field}"

        # Blueprint ref structure
        assert "genre" in sds["blueprint_ref"]
        assert "version" in sds["blueprint_ref"]

        # Prompt controls structure
        assert "positive_tags" in sds["prompt_controls"]
        assert "negative_tags" in sds["prompt_controls"]
        assert "max_style_chars" in sds["prompt_controls"]
        assert "max_prompt_chars" in sds["prompt_controls"]

        # Render configuration structure
        assert "engine" in sds["render"]
        assert "model" in sds["render"]
        assert "num_variations" in sds["render"]

    async def test_get_sds_content_type(
        self,
        async_client: AsyncClient,
        test_song_with_full_entities,
    ):
        """Test response has correct content type."""
        song = test_song_with_full_entities

        response = await async_client.get(f"/api/v1/songs/{song.id}/sds")

        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response.headers["content-type"]

    async def test_get_sds_multiple_songs_isolation(
        self,
        async_client: AsyncClient,
        test_song_with_full_entities,
        test_song_with_style_only,
    ):
        """Test that SDS compilation for different songs is isolated."""
        song1 = test_song_with_full_entities
        song2 = test_song_with_style_only

        # Get SDS for both songs
        response1 = await async_client.get(f"/api/v1/songs/{song1.id}/sds")
        response2 = await async_client.get(f"/api/v1/songs/{song2.id}/sds")

        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK

        sds1 = response1.json()
        sds2 = response2.json()

        # Should be different songs
        assert sds1["title"] != sds2["title"]
        assert sds1["seed"] != sds2["seed"]
        assert sds1 != sds2
