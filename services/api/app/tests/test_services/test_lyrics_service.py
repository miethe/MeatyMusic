"""Unit tests for LyricsService.

This test suite verifies:
- CRUD operations with validation
- Section structure validation (must contain Chorus)
- Rhyme scheme validation
- Explicit content filtering
- Reading level validation
- Citation management with deterministic hashing
- Source weight normalization
- Business logic enforcement
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4
from datetime import datetime

from app.services.lyrics_service import LyricsService
from app.schemas.lyrics import LyricsCreate, LyricsUpdate, POV, Tense, HookStrategy
from app.models.lyrics import Lyrics
from app.errors import BadRequestError


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_repo():
    """Mock LyricsRepository."""
    repo = Mock()
    repo.create = AsyncMock()
    repo.get_by_id = AsyncMock()
    repo.update = AsyncMock()
    repo.delete = AsyncMock()
    repo.get_by_song_id = AsyncMock()
    return repo


@pytest.fixture
def mock_session():
    """Mock async session."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    return session


@pytest.fixture
def lyrics_service(mock_session, mock_repo):
    """Create LyricsService with mocked dependencies."""
    return LyricsService(session=mock_session, repo=mock_repo)


@pytest.fixture
def valid_lyrics_create():
    """Valid LyricsCreate data."""
    return LyricsCreate(
        song_id=uuid4(),
        sections=[
            {"type": "Verse", "lines": ["Line 1", "Line 2"]},
            {"type": "Chorus", "lines": ["Hook line", "Catchy line"]},
        ],
        section_order=["Verse", "Chorus", "Verse", "Chorus"],
        language="en",
        pov=POV.FIRST_PERSON,
        tense=Tense.PRESENT,
        rhyme_scheme="AABB",
        reading_level=50,
        explicit_allowed=False,
        source_citations=[]
    )


@pytest.fixture
def mock_lyrics_entity():
    """Mock Lyrics entity."""
    return Lyrics(
        id=uuid4(),
        song_id=uuid4(),
        sections=[
            {"type": "Verse", "lines": ["Line 1", "Line 2"]},
            {"type": "Chorus", "lines": ["Hook line", "Catchy line"]},
        ],
        section_order=["Verse", "Chorus", "Verse", "Chorus"],
        language="en",
        rhyme_scheme="AABB",
        reading_level=50,
        explicit_allowed=False,
        source_citations=[],
        repetition_rules={},
        themes=[],
        constraints={},
        extra_metadata={},
        tenant_id=uuid4(),
        owner_id=uuid4(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


# =============================================================================
# CRUD Operations Tests (6 tests)
# =============================================================================


@pytest.mark.asyncio
async def test_create_lyrics_success(lyrics_service, mock_repo, valid_lyrics_create, mock_lyrics_entity):
    """Test successful lyrics creation with validation."""
    # Arrange
    mock_repo.create.return_value = mock_lyrics_entity

    # Mock transaction context manager
    mock_transaction = AsyncMock()
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)

    # Mock check_explicit_content
    with patch('app.services.lyrics_service.check_explicit_content',
               new=AsyncMock(return_value=(True, []))):
        with patch.object(lyrics_service, 'transaction', return_value=mock_transaction):
            # Act
            result = await lyrics_service.create_lyrics(valid_lyrics_create)

    # Assert
    assert result is not None
    assert result.id == mock_lyrics_entity.id
    mock_repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_create_lyrics_invalid_section_order(lyrics_service):
    """Test lyrics creation fails without Chorus section (Pydantic validation)."""
    # Arrange & Act & Assert
    # Pydantic validates section_order before service code runs
    from pydantic import ValidationError

    with pytest.raises(ValidationError) as exc_info:
        data = LyricsCreate(
            song_id=uuid4(),
            sections=[{"type": "Verse", "lines": ["Line 1"]}],
            section_order=["Verse", "Bridge"],  # No Chorus!
            language="en"
        )

    assert "chorus" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_get_lyrics_success(lyrics_service, mock_repo, mock_lyrics_entity):
    """Test getting lyrics by ID."""
    # Arrange
    lyrics_id = uuid4()
    mock_lyrics_entity.id = lyrics_id
    mock_repo.get_by_id.return_value = mock_lyrics_entity

    # Act
    result = await lyrics_service.get_lyrics(lyrics_id)

    # Assert
    assert result is not None
    assert result.id == lyrics_id
    mock_repo.get_by_id.assert_called_once_with(lyrics_id)


@pytest.mark.asyncio
async def test_get_lyrics_not_found(lyrics_service, mock_repo):
    """Test getting non-existent lyrics returns None."""
    # Arrange
    lyrics_id = uuid4()
    mock_repo.get_by_id.return_value = None

    # Act
    result = await lyrics_service.get_lyrics(lyrics_id)

    # Assert
    assert result is None
    mock_repo.get_by_id.assert_called_once_with(lyrics_id)


@pytest.mark.asyncio
async def test_update_lyrics_success(lyrics_service, mock_repo, mock_lyrics_entity):
    """Test successful lyrics update."""
    # Arrange
    lyrics_id = uuid4()
    update_data = LyricsUpdate(
        section_order=["Verse", "Chorus", "Bridge", "Chorus"],
        rhyme_scheme="ABAB"
    )

    mock_lyrics_entity.id = lyrics_id
    mock_lyrics_entity.section_order = ["Verse", "Chorus", "Bridge", "Chorus"]
    mock_lyrics_entity.rhyme_scheme = "ABAB"
    mock_repo.update.return_value = mock_lyrics_entity

    # Mock transaction
    mock_transaction = AsyncMock()
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)

    with patch.object(lyrics_service, 'transaction', return_value=mock_transaction):
        # Act
        result = await lyrics_service.update_lyrics(lyrics_id, update_data)

    # Assert
    assert result is not None
    assert result.rhyme_scheme == "ABAB"
    mock_repo.update.assert_called_once()


@pytest.mark.asyncio
async def test_delete_lyrics_success(lyrics_service, mock_repo):
    """Test successful lyrics deletion."""
    # Arrange
    lyrics_id = uuid4()
    mock_repo.delete.return_value = True

    # Mock transaction
    mock_transaction = AsyncMock()
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)

    with patch.object(lyrics_service, 'transaction', return_value=mock_transaction):
        # Act
        result = await lyrics_service.delete_lyrics(lyrics_id)

    # Assert
    assert result is True
    mock_repo.delete.assert_called_once_with(lyrics_id)


# =============================================================================
# Validation Tests (6 tests)
# =============================================================================


@pytest.mark.asyncio
async def test_section_validation_missing_chorus(lyrics_service):
    """Test section order validation requires Chorus (Pydantic validation)."""
    # Arrange & Act & Assert
    from pydantic import ValidationError

    with pytest.raises(ValidationError) as exc_info:
        data = LyricsCreate(
            song_id=uuid4(),
            sections=[],
            section_order=["Verse", "Bridge", "Outro"],  # No Chorus
            language="en"
        )

    assert "chorus" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_rhyme_scheme_validation_invalid(lyrics_service, valid_lyrics_create):
    """Test rhyme scheme validation rejects invalid format."""
    # Arrange
    valid_lyrics_create.rhyme_scheme = "INVALID123"

    # Act & Assert
    with pytest.raises(BadRequestError) as exc_info:
        await lyrics_service.create_lyrics(valid_lyrics_create)

    assert "rhyme scheme" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_explicit_content_rejected(lyrics_service):
    """Test explicit content is rejected when not allowed."""
    # Arrange
    data = LyricsCreate(
        song_id=uuid4(),
        sections=[
            {"type": "Verse", "lines": ["This shit is bad"]},
            {"type": "Chorus", "lines": ["Hook line"]}
        ],
        section_order=["Verse", "Chorus"],
        language="en",
        explicit_allowed=False
    )

    # Mock explicit content detection
    with patch('app.services.lyrics_service.check_explicit_content',
               new=AsyncMock(return_value=(False, ["shit"]))):
        # Act & Assert
        with pytest.raises(BadRequestError) as exc_info:
            await lyrics_service.create_lyrics(data)

        assert "explicit content" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_reading_level_out_of_range(lyrics_service, valid_lyrics_create):
    """Test reading level validation rejects out-of-range values."""
    # Arrange
    valid_lyrics_create.reading_level = 150  # >100

    # Act & Assert
    with pytest.raises(BadRequestError) as exc_info:
        await lyrics_service.create_lyrics(valid_lyrics_create)

    assert "reading level" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_multiple_validation_errors(lyrics_service):
    """Test multiple validation errors are caught by Pydantic."""
    # Arrange & Act & Assert
    from pydantic import ValidationError

    # Pydantic will catch multiple errors at once
    with pytest.raises(ValidationError) as exc_info:
        data = LyricsCreate(
            song_id=uuid4(),
            sections=[],
            section_order=["Verse"],  # No Chorus
            rhyme_scheme="INVALID",  # Invalid rhyme scheme
            reading_level=200,  # Out of range
            language="en"
        )

    # Should have multiple validation errors
    assert len(exc_info.value.errors()) >= 2


@pytest.mark.asyncio
async def test_empty_section_order(lyrics_service):
    """Test empty section order is rejected (Pydantic validation)."""
    # Arrange & Act & Assert
    from pydantic import ValidationError

    with pytest.raises(ValidationError) as exc_info:
        data = LyricsCreate(
            song_id=uuid4(),
            sections=[],
            section_order=[],  # Empty!
            language="en"
        )

    assert "chorus" in str(exc_info.value).lower()


# =============================================================================
# Citation Management Tests (4 tests)
# =============================================================================


def test_citation_hash_computation(lyrics_service):
    """Test citation hashes are computed deterministically."""
    # Arrange
    source_id = uuid4()
    citations = [
        {"source_id": str(source_id), "chunk_text": "Test chunk", "weight": 1.0}
    ]

    # Act
    result = lyrics_service.parse_citations_with_hashes(citations)

    # Assert
    assert len(result) == 1
    assert "citation_hash" in result[0]
    assert len(result[0]["citation_hash"]) == 64  # SHA-256 hex

    # Verify determinism
    result2 = lyrics_service.parse_citations_with_hashes(citations)
    assert result[0]["citation_hash"] == result2[0]["citation_hash"]


def test_citation_weight_normalization(lyrics_service):
    """Test citation weights are normalized to sum ≤ 1.0."""
    # Arrange
    citations = [
        {"source_id": str(uuid4()), "chunk_text": "Chunk 1", "weight": 0.8},
        {"source_id": str(uuid4()), "chunk_text": "Chunk 2", "weight": 0.6}
    ]

    # Act
    result = lyrics_service.normalize_source_weights(citations)

    # Assert
    total_weight = sum(c["weight"] for c in result)
    assert total_weight <= 1.0 + 1e-6  # Allow small floating point error
    # Should be normalized to 1.0 (0.8 + 0.6 = 1.4, normalized to 1.0)
    assert abs(total_weight - 1.0) < 0.001


def test_duplicate_source_citations(lyrics_service):
    """Test validation rejects duplicate source_ids."""
    # Arrange
    source_id = uuid4()
    citations = [
        {"source_id": str(source_id), "chunk_text": "Chunk 1", "weight": 0.5},
        {"source_id": str(source_id), "chunk_text": "Chunk 2", "weight": 0.5}
    ]

    # Act & Assert
    with pytest.raises(BadRequestError) as exc_info:
        lyrics_service.validate_citations(citations)

    assert "duplicate" in str(exc_info.value).lower()


def test_empty_citations_allowed(lyrics_service):
    """Test empty citations are allowed."""
    # Arrange
    citations = []

    # Act
    result = lyrics_service.validate_citations(citations)

    # Assert
    assert result is True


# =============================================================================
# Additional Tests (5 tests)
# =============================================================================


def test_extract_text_from_sections(lyrics_service):
    """Test text extraction from sections."""
    # Arrange
    sections = [
        {"type": "Verse", "lines": ["Line 1", "Line 2"]},
        {"type": "Chorus", "lines": ["Hook line", "Another hook"]}
    ]

    # Act
    result = lyrics_service._extract_text_from_sections(sections)

    # Assert
    assert "Line 1" in result
    assert "Line 2" in result
    assert "Hook line" in result
    assert "Another hook" in result


@pytest.mark.asyncio
async def test_get_by_song_id(lyrics_service, mock_repo, mock_lyrics_entity):
    """Test getting all lyrics for a song."""
    # Arrange
    song_id = uuid4()
    mock_lyrics_entity.song_id = song_id
    mock_repo.get_by_song_id.return_value = [mock_lyrics_entity]

    # Act
    result = await lyrics_service.get_by_song_id(song_id)

    # Assert
    assert len(result) == 1
    assert result[0].song_id == song_id
    mock_repo.get_by_song_id.assert_called_once_with(song_id)


def test_citation_missing_source_id_skipped(lyrics_service):
    """Test citations without source_id are skipped."""
    # Arrange
    citations = [
        {"chunk_text": "Test", "weight": 1.0},  # No source_id!
        {"source_id": str(uuid4()), "chunk_text": "Valid", "weight": 1.0}
    ]

    # Act
    result = lyrics_service.parse_citations_with_hashes(citations)

    # Assert
    assert len(result) == 1  # Only valid citation included
    assert result[0]["chunk_text"] == "Valid"


@pytest.mark.asyncio
async def test_update_lyrics_not_found(lyrics_service, mock_repo):
    """Test updating non-existent lyrics returns None."""
    # Arrange
    lyrics_id = uuid4()
    update_data = LyricsUpdate(rhyme_scheme="ABAB")
    mock_repo.update.return_value = None

    # Mock transaction
    mock_transaction = AsyncMock()
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)

    with patch.object(lyrics_service, 'transaction', return_value=mock_transaction):
        # Act
        result = await lyrics_service.update_lyrics(lyrics_id, update_data)

    # Assert
    assert result is None


def test_citation_negative_weight_rejected(lyrics_service):
    """Test validation rejects negative weights."""
    # Arrange
    citations = [
        {"source_id": str(uuid4()), "chunk_text": "Chunk", "weight": -0.5}
    ]

    # Act & Assert
    with pytest.raises(BadRequestError) as exc_info:
        lyrics_service.validate_citations(citations)

    assert "weight" in str(exc_info.value).lower()


# =============================================================================
# Integration Tests (2 tests)
# =============================================================================


@pytest.mark.asyncio
async def test_create_with_citations_full_workflow(lyrics_service, mock_repo, mock_lyrics_entity):
    """Test complete workflow with citations."""
    # Arrange
    source_id1 = uuid4()
    source_id2 = uuid4()

    data = LyricsCreate(
        song_id=uuid4(),
        sections=[
            {"type": "Verse", "lines": ["Line 1"]},
            {"type": "Chorus", "lines": ["Hook"]}
        ],
        section_order=["Verse", "Chorus"],
        language="en",
        source_citations=[
            {"source_id": str(source_id1), "chunk_text": "Source 1", "weight": 0.6},
            {"source_id": str(source_id2), "chunk_text": "Source 2", "weight": 0.4}
        ]
    )

    mock_repo.create.return_value = mock_lyrics_entity

    # Mock transaction and explicit content check
    mock_transaction = AsyncMock()
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)

    with patch('app.services.lyrics_service.check_explicit_content',
               new=AsyncMock(return_value=(True, []))):
        with patch.object(lyrics_service, 'transaction', return_value=mock_transaction):
            # Act
            result = await lyrics_service.create_lyrics(data)

    # Assert
    assert result is not None

    # Verify repository was called with processed data
    call_args = mock_repo.create.call_args[0][0]
    citations = call_args.source_citations

    # Citations should have hashes
    assert all("citation_hash" in c for c in citations)

    # Weights should be normalized (already sum to 1.0)
    total_weight = sum(c["weight"] for c in citations)
    assert abs(total_weight - 1.0) < 0.001


@pytest.mark.asyncio
async def test_update_with_validation_full_workflow(lyrics_service, mock_repo, mock_lyrics_entity):
    """Test update with comprehensive validation."""
    # Arrange
    lyrics_id = uuid4()
    update_data = LyricsUpdate(
        section_order=["Intro", "Verse", "Chorus", "Verse", "Chorus", "Outro"],
        rhyme_scheme="ABAB",
        reading_level=75,
        sections=[
            {"type": "Verse", "lines": ["Clean lyrics here"]},
            {"type": "Chorus", "lines": ["Family friendly hook"]}
        ],
        explicit_allowed=False
    )

    mock_repo.update.return_value = mock_lyrics_entity

    # Mock transaction and explicit content check
    mock_transaction = AsyncMock()
    mock_transaction.__aenter__ = AsyncMock(return_value=None)
    mock_transaction.__aexit__ = AsyncMock(return_value=None)

    with patch('app.services.lyrics_service.check_explicit_content',
               new=AsyncMock(return_value=(True, []))):
        with patch.object(lyrics_service, 'transaction', return_value=mock_transaction):
            # Act
            result = await lyrics_service.update_lyrics(lyrics_id, update_data)

    # Assert
    assert result is not None
    mock_repo.update.assert_called_once()
