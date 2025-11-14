"""Comprehensive unit tests for ProducerNotesService.

This test suite verifies:
- CRUD operations with validation
- Mix settings validation (LUFS, stereo width)
- Duration calculation and validation
- Hook count validation and warnings
- Structure validation against lyrics sections
- Blueprint alignment checks
- Business logic enforcement
- Integration with ProducerNotesRepository
"""

import uuid
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock, patch
from contextlib import asynccontextmanager

from app.services.producer_notes_service import ProducerNotesService
from app.repositories.producer_notes_repo import ProducerNotesRepository
from app.repositories.blueprint_repo import BlueprintRepository
from app.repositories.lyrics_repo import LyricsRepository
from app.models.producer_notes import ProducerNotes
from app.models.blueprint import Blueprint
from app.schemas.producer_notes import ProducerNotesCreate, ProducerNotesUpdate
from app.errors import NotFoundError


class TestProducerNotesService:
    """Test ProducerNotesService business logic."""

    @pytest.fixture
    def mock_session(self):
        """Mock async session."""
        session = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        return session

    @pytest.fixture
    def mock_repo(self):
        """Mock ProducerNotesRepository."""
        return MagicMock(spec=ProducerNotesRepository)

    @pytest.fixture
    def mock_blueprint_repo(self):
        """Mock BlueprintRepository."""
        return MagicMock(spec=BlueprintRepository)

    @pytest.fixture
    def mock_lyrics_repo(self):
        """Mock LyricsRepository."""
        return MagicMock(spec=LyricsRepository)

    @pytest.fixture
    def service(self, mock_session, mock_repo):
        """ProducerNotesService instance for testing."""
        service = ProducerNotesService(session=mock_session, repo=mock_repo)

        # Mock the transaction context manager
        @asynccontextmanager
        async def mock_transaction():
            yield

        service.transaction = mock_transaction
        return service

    @pytest.fixture
    def service_with_blueprint_repo(self, mock_session, mock_repo, mock_blueprint_repo):
        """ProducerNotesService with blueprint repository."""
        service = ProducerNotesService(
            session=mock_session,
            repo=mock_repo,
            blueprint_repo=mock_blueprint_repo
        )

        @asynccontextmanager
        async def mock_transaction():
            yield

        service.transaction = mock_transaction
        return service

    @pytest.fixture
    def valid_producer_notes_create(self):
        """Valid ProducerNotesCreate data."""
        return ProducerNotesCreate(
            song_id=uuid.uuid4(),
            structure=["Verse", "Chorus", "Verse", "Chorus", "Bridge"],
            structure_string="Verse-Chorus-Verse-Chorus-Bridge",
            hook_count=2,
            section_tags={
                "Chorus": ["anthemic", "hook-forward"],
                "Bridge": ["breakdown", "minimal"]
            },
            section_durations={
                "Verse": 30,
                "Chorus": 45,
                "Bridge": 20
            },
            instrumentation_hints={
                "global": ["guitar", "drums", "bass"],
                "section_specific": {
                    "Bridge": ["piano", "strings"]
                }
            },
            mix_targets={
                "loudness_lufs": -14.0,
                "stereo_width": "wide",
                "space": "large",
                "compression": "moderate"
            },
            arrangement_notes="Build energy through chorus repetitions"
        )

    # =============================================================================
    # CRUD Operations Tests (5 tests)
    # =============================================================================

    @pytest.mark.asyncio
    async def test_create_producer_notes_success(self, service, mock_repo, valid_producer_notes_create):
        """Test creating producer notes with valid data."""
        # Mock repository create
        now = datetime.now(timezone.utc)
        mock_notes = ProducerNotes(
            id=uuid.uuid4(),
            song_id=valid_producer_notes_create.song_id,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=valid_producer_notes_create.structure,
            structure_string=valid_producer_notes_create.structure_string,
            hook_count=valid_producer_notes_create.hook_count,
            section_tags=valid_producer_notes_create.section_tags,
            section_durations=valid_producer_notes_create.section_durations,
            instrumentation_hints=valid_producer_notes_create.instrumentation_hints,
            mix_targets=valid_producer_notes_create.mix_targets,
            arrangement_notes=valid_producer_notes_create.arrangement_notes,
            extra_metadata={},
            created_at=now,
            updated_at=now
        )
        mock_repo.create = MagicMock(return_value=mock_notes)

        # Call service
        result = await service.create_producer_notes(data=valid_producer_notes_create)

        # Verify result
        assert result is not None
        assert result.song_id == valid_producer_notes_create.song_id
        assert result.hook_count == 2
        assert len(result.structure) == 5
        assert mock_repo.create.called

    @pytest.mark.asyncio
    async def test_get_producer_notes(self, service, mock_repo):
        """Test getting producer notes by ID."""
        notes_id = uuid.uuid4()
        song_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        mock_notes = ProducerNotes(
            id=notes_id,
            song_id=song_id,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=["Verse", "Chorus"],
            hook_count=1,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )
        mock_repo.get_by_id = MagicMock(return_value=mock_notes)

        # Call service
        result = await service.get_producer_notes(notes_id)

        # Verify
        assert result is not None
        assert result.id == notes_id
        mock_repo.get_by_id.assert_called_once_with(ProducerNotes, notes_id)

    @pytest.mark.asyncio
    async def test_update_producer_notes(self, service, mock_repo):
        """Test updating producer notes with valid data."""
        notes_id = uuid.uuid4()
        song_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        update_data = ProducerNotesUpdate(
            hook_count=3,
            mix_targets={
                "loudness_lufs": -12.0,
                "stereo_width": "normal"
            }
        )

        # Mock existing notes
        mock_existing = ProducerNotes(
            id=notes_id,
            song_id=song_id,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=["Verse", "Chorus"],
            hook_count=1,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={"loudness_lufs": -14.0},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )

        # Mock updated notes
        mock_updated = ProducerNotes(
            id=notes_id,
            song_id=song_id,
            tenant_id=mock_existing.tenant_id,
            owner_id=mock_existing.owner_id,
            structure=["Verse", "Chorus"],
            hook_count=3,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets=update_data.mix_targets,
            extra_metadata={},
            created_at=now,
            updated_at=now
        )

        mock_repo.get_by_id = MagicMock(return_value=mock_existing)
        mock_repo.update = MagicMock(return_value=mock_updated)

        # Call service
        result = await service.update_producer_notes(notes_id, update_data)

        # Verify
        assert result is not None
        assert result.hook_count == 3
        assert result.mix_targets["loudness_lufs"] == -12.0
        mock_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_producer_notes(self, service, mock_repo):
        """Test deleting producer notes."""
        notes_id = uuid.uuid4()
        mock_repo.delete = MagicMock(return_value=True)

        # Call service
        result = await service.delete_producer_notes(notes_id)

        # Verify
        assert result is True
        mock_repo.delete.assert_called_once_with(ProducerNotes, notes_id)

    @pytest.mark.asyncio
    async def test_get_by_song_id(self, service, mock_repo):
        """Test getting all producer notes for a specific song."""
        song_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        mock_notes_list = [
            ProducerNotes(
                id=uuid.uuid4(),
                song_id=song_id,
                tenant_id=uuid.uuid4(),
                owner_id=uuid.uuid4(),
                structure=["Verse", "Chorus"],
                hook_count=1,
                section_tags={},
                section_durations={},
                instrumentation_hints={},
                mix_targets={},
                extra_metadata={},
                created_at=now,
                updated_at=now
            ),
            ProducerNotes(
                id=uuid.uuid4(),
                song_id=song_id,
                tenant_id=uuid.uuid4(),
                owner_id=uuid.uuid4(),
                structure=["Verse", "Chorus", "Bridge"],
                hook_count=2,
                section_tags={},
                section_durations={},
                instrumentation_hints={},
                mix_targets={},
                extra_metadata={},
                created_at=now,
                updated_at=now
            )
        ]
        mock_repo.get_by_song_id = MagicMock(return_value=mock_notes_list)

        # Call service
        result = await service.get_by_song_id(song_id)

        # Verify
        assert len(result) == 2
        assert all(note.song_id == song_id for note in result)
        mock_repo.get_by_song_id.assert_called_once_with(song_id)

    # =============================================================================
    # Mix Validation Tests (3 tests)
    # =============================================================================

    def test_validate_mix_settings_valid(self, service):
        """Test mix settings validation with valid settings."""
        mix = {
            "loudness_lufs": -14.0,
            "stereo_width": "wide",
            "space": "large",
            "compression": "moderate"
        }

        # Act
        is_valid, error = service.validate_mix_settings(mix)

        # Assert
        assert is_valid is True
        assert error is None

    def test_validate_mix_settings_invalid_lufs(self, service):
        """Test mix settings validation rejects invalid LUFS."""
        # Test below minimum
        mix_below = {"loudness_lufs": -25.0}
        is_valid, error = service.validate_mix_settings(mix_below)
        assert not is_valid
        assert "LUFS" in error or "loudness_lufs" in error

        # Test above maximum
        mix_above = {"loudness_lufs": -3.0}
        is_valid, error = service.validate_mix_settings(mix_above)
        assert not is_valid
        assert "LUFS" in error or "loudness_lufs" in error

    def test_validate_mix_settings_invalid_stereo_width(self, service):
        """Test mix settings validation rejects invalid stereo width."""
        mix = {
            "loudness_lufs": -14.0,
            "stereo_width": "ultra-wide"  # Invalid value
        }

        # Act
        is_valid, error = service.validate_mix_settings(mix)

        # Assert
        assert not is_valid
        assert "stereo_width" in error

    # =============================================================================
    # Duration Validation Tests (2 tests)
    # =============================================================================

    def test_calculate_total_duration(self, service):
        """Test duration calculation from section metadata."""
        # Arrange
        section_durations = {
            "Verse": 30,
            "Chorus": 45,
            "Bridge": 20
        }

        # Act
        total = service.calculate_total_duration(section_durations)

        # Assert
        assert total == 95  # 30 + 45 + 20

    @pytest.mark.asyncio
    async def test_duration_mismatch_warning(self, service, mock_repo):
        """Test that duration mismatch logs warning."""
        notes_id = uuid.uuid4()
        target_duration = 180  # 3 minutes
        now = datetime.now(timezone.utc)

        # Mock notes with durations that don't match target
        mock_notes = ProducerNotes(
            id=notes_id,
            song_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=["Verse", "Chorus"],
            hook_count=1,
            section_tags={},
            section_durations={"Verse": 30, "Chorus": 40},  # Total 70 seconds
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )
        mock_repo.get_by_id = MagicMock(return_value=mock_notes)

        # Act
        is_valid, diff = await service.validate_duration_against_target(
            notes_id, target_duration
        )

        # Assert
        assert not is_valid  # Diff is 110 seconds, exceeds tolerance
        assert diff == 110  # 180 - 70

    # =============================================================================
    # Hook Validation Tests (2 tests)
    # =============================================================================

    @pytest.mark.asyncio
    async def test_zero_hooks_warning(self, service, mock_repo):
        """Test that zero hooks triggers warning."""
        # Arrange
        song_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        notes_data = ProducerNotesCreate(
            song_id=song_id,
            structure=["Verse", "Chorus"],
            hook_count=0,  # Zero hooks
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={}
        )

        mock_notes = ProducerNotes(
            id=uuid.uuid4(),
            song_id=song_id,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=notes_data.structure,
            hook_count=0,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )
        mock_repo.create = MagicMock(return_value=mock_notes)

        # Act - should not raise but should log warning
        with patch('app.services.producer_notes_service.logger') as mock_logger:
            result = await service.create_producer_notes(notes_data)

            # Assert
            assert result is not None
            assert result.hook_count == 0
            # Verify warning was logged
            mock_logger.warning.assert_called()

    @pytest.mark.asyncio
    async def test_hooks_count_valid(self, service, mock_repo, valid_producer_notes_create):
        """Test that valid hook count passes without warnings."""
        # Modify to have multiple hooks
        valid_producer_notes_create.hook_count = 3
        now = datetime.now(timezone.utc)

        mock_notes = ProducerNotes(
            id=uuid.uuid4(),
            song_id=valid_producer_notes_create.song_id,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=valid_producer_notes_create.structure,
            hook_count=3,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )
        mock_repo.create = MagicMock(return_value=mock_notes)

        # Act
        result = await service.create_producer_notes(valid_producer_notes_create)

        # Assert
        assert result is not None
        assert result.hook_count == 3

    # =============================================================================
    # Structure Validation Tests (2 tests)
    # =============================================================================

    def test_validate_structure_valid(self, service):
        """Test structure validation with matching sections."""
        structure = ["Verse", "Chorus", "Verse", "Chorus", "Bridge"]
        section_order = ["Verse", "Chorus", "Bridge"]

        # Act
        is_valid = service.validate_structure(structure, section_order)

        # Assert
        assert is_valid is True

    def test_validate_structure_missing_sections(self, service):
        """Test structure validation detects missing sections."""
        structure = ["Verse", "Chorus"]
        section_order = ["Verse", "Chorus", "Bridge"]  # Bridge required but missing

        # Act
        is_valid = service.validate_structure(structure, section_order)

        # Assert
        assert is_valid is False

    # =============================================================================
    # Blueprint Validation Tests (2 tests)
    # =============================================================================

    @pytest.mark.asyncio
    async def test_validate_against_blueprint_success(self, service_with_blueprint_repo, mock_repo, mock_blueprint_repo):
        """Test successful blueprint validation."""
        notes_id = uuid.uuid4()
        blueprint_id = uuid.uuid4()
        now = datetime.now(timezone.utc)

        # Mock producer notes with sufficient hooks
        mock_notes = ProducerNotes(
            id=notes_id,
            song_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=["Verse", "Chorus"],
            hook_count=3,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )

        # Mock blueprint with min_hooks requirement
        mock_blueprint = Blueprint(
            id=blueprint_id,
            genre="pop",
            rules={"min_hooks": 2},
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        mock_repo.get_by_id = MagicMock(return_value=mock_notes)
        mock_blueprint_repo.get_by_id = MagicMock(return_value=mock_blueprint)

        # Act
        is_valid, violations = await service_with_blueprint_repo.validate_against_blueprint(
            notes_id, blueprint_id
        )

        # Assert
        assert is_valid is True
        assert len(violations) == 0

    @pytest.mark.asyncio
    async def test_validate_against_blueprint_hook_count_violation(self, service_with_blueprint_repo, mock_repo, mock_blueprint_repo):
        """Test blueprint validation detects hook count violations."""
        notes_id = uuid.uuid4()
        blueprint_id = uuid.uuid4()
        now = datetime.now(timezone.utc)

        # Mock producer notes with insufficient hooks
        mock_notes = ProducerNotes(
            id=notes_id,
            song_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=["Verse", "Chorus"],
            hook_count=1,  # Below minimum
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )

        # Mock blueprint with higher min_hooks requirement
        mock_blueprint = Blueprint(
            id=blueprint_id,
            genre="pop",
            rules={"min_hooks": 3},
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        mock_repo.get_by_id = MagicMock(return_value=mock_notes)
        mock_blueprint_repo.get_by_id = MagicMock(return_value=mock_blueprint)

        # Act
        is_valid, violations = await service_with_blueprint_repo.validate_against_blueprint(
            notes_id, blueprint_id
        )

        # Assert
        assert is_valid is False
        assert len(violations) > 0
        assert any("hook count" in v.lower() for v in violations)

    # =============================================================================
    # Error Handling Tests (3 tests)
    # =============================================================================

    @pytest.mark.asyncio
    async def test_create_producer_notes_invalid_mix_settings(self, service, mock_repo):
        """Test creating producer notes with invalid mix settings raises error."""
        notes_data = ProducerNotesCreate(
            song_id=uuid.uuid4(),
            structure=["Verse", "Chorus"],
            hook_count=2,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={"loudness_lufs": -30.0}  # Invalid LUFS
        )

        # Should raise ValueError
        with pytest.raises(ValueError) as exc_info:
            await service.create_producer_notes(data=notes_data)

        assert "mix settings" in str(exc_info.value).lower()
        # Repository should not be called
        assert not mock_repo.create.called

    @pytest.mark.asyncio
    async def test_update_producer_notes_not_found(self, service, mock_repo):
        """Test updating non-existent producer notes raises NotFoundError."""
        notes_id = uuid.uuid4()
        update_data = ProducerNotesUpdate(hook_count=3)

        mock_repo.get_by_id = MagicMock(return_value=None)

        # Should raise NotFoundError
        with pytest.raises(NotFoundError) as exc_info:
            await service.update_producer_notes(notes_id, update_data)

        assert str(notes_id) in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_producer_notes_not_found(self, service, mock_repo):
        """Test getting non-existent producer notes returns None."""
        notes_id = uuid.uuid4()
        mock_repo.get_by_id = MagicMock(return_value=None)

        # Call service
        result = await service.get_producer_notes(notes_id)

        # Verify
        assert result is None

    # =============================================================================
    # Latest Notes Tests (1 test)
    # =============================================================================

    @pytest.mark.asyncio
    async def test_get_latest_by_song_id(self, service, mock_repo):
        """Test getting the most recent producer notes for a song."""
        song_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        latest_notes = ProducerNotes(
            id=uuid.uuid4(),
            song_id=song_id,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=["Verse", "Chorus", "Bridge"],
            hook_count=3,
            section_tags={},
            section_durations={},
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )
        mock_repo.get_latest_by_song_id = MagicMock(return_value=latest_notes)

        # Call service
        result = await service.get_latest_by_song_id(song_id)

        # Verify
        assert result is not None
        assert result.song_id == song_id
        assert result.hook_count == 3
        mock_repo.get_latest_by_song_id.assert_called_once_with(song_id)

    # =============================================================================
    # Duration Validation Within Tolerance Tests (1 test)
    # =============================================================================

    @pytest.mark.asyncio
    async def test_duration_within_tolerance(self, service, mock_repo):
        """Test that durations within tolerance pass validation."""
        notes_id = uuid.uuid4()
        target_duration = 100  # 100 seconds
        now = datetime.now(timezone.utc)

        # Mock notes with durations close to target (within 30s tolerance)
        mock_notes = ProducerNotes(
            id=notes_id,
            song_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            structure=["Verse", "Chorus"],
            hook_count=1,
            section_tags={},
            section_durations={"Verse": 45, "Chorus": 40},  # Total 85 seconds
            instrumentation_hints={},
            mix_targets={},
            extra_metadata={},
            created_at=now,
            updated_at=now
        )
        mock_repo.get_by_id = MagicMock(return_value=mock_notes)

        # Act
        is_valid, diff = await service.validate_duration_against_target(
            notes_id, target_duration
        )

        # Assert
        assert is_valid is True  # Diff is 15 seconds, within 30s tolerance
        assert diff == 15  # 100 - 85
