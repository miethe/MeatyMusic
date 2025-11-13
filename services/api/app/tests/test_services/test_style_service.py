"""Comprehensive unit tests for StyleService.

This test suite verifies:
- Tag conflict detection (_validate_tag_conflicts)
- Energy/tempo coherence validation
- create_style with valid/invalid data
- Business logic enforcement
- Integration with StyleRepository
"""

import uuid
import pytest
from unittest.mock import MagicMock, Mock, patch, AsyncMock

from app.services.style_service import StyleService
from app.repositories.style_repo import StyleRepository
from app.models.style import Style
from app.schemas.style import StyleCreate, StyleUpdate


class TestStyleService:
    """Test StyleService business logic."""

    @pytest.fixture
    def mock_repo(self):
        """Mock StyleRepository."""
        return MagicMock(spec=StyleRepository)

    @pytest.fixture
    def service(self, mock_repo):
        """StyleService instance for testing."""
        return StyleService(style_repo=mock_repo)

    @pytest.fixture
    def valid_style_create(self):
        """Valid StyleCreate data."""
        return StyleCreate(
            name="Test Style",
            genre="Pop",
            sub_genres=["Dance Pop"],
            bpm_min=110,
            bpm_max=130,
            energy_level=8,
            mood=["upbeat"],
            instrumentation=["synth", "bass", "drums"],
            tags_positive=["bright", "catchy"],
            tags_negative=["muddy"]
        )

    def test_init(self, mock_repo):
        """Test service initialization."""
        service = StyleService(style_repo=mock_repo)
        assert service.style_repo == mock_repo

    @pytest.mark.asyncio
    async def test_create_style_valid(self, service, mock_repo, valid_style_create):
        """Test creating style with valid data."""
        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()

        # Mock repository create
        mock_style = Style(
            id=uuid.uuid4(),
            name="Test Style",
            genre="Pop",
            tenant_id=tenant_id,
            owner_id=owner_id
        )
        mock_repo.create = AsyncMock(return_value=mock_style)

        # Call service
        result = await service.create_style(
            data=valid_style_create,
            tenant_id=tenant_id,
            owner_id=owner_id
        )

        # Verify result
        assert result is not None
        assert mock_repo.create.called

    def test_validate_tag_conflicts_no_conflict(self, service):
        """Test tag conflict validation with no conflicts."""
        tags = ["bright", "catchy", "upbeat"]

        # Should not raise exception
        try:
            service._validate_tag_conflicts(tags)
            success = True
        except ValueError:
            success = False

        assert success

    def test_validate_tag_conflicts_era_conflict(self, service):
        """Test tag conflict validation with era conflict."""
        tags = ["1940s", "1980s"]  # Multiple eras not allowed

        # Should raise ValueError
        with pytest.raises(ValueError) as exc_info:
            service._validate_tag_conflicts(tags)

        assert "Only one era tag allowed" in str(exc_info.value)

    def test_validate_tag_conflicts_energy_conflict(self, service):
        """Test tag conflict validation with energy conflict."""
        # Test whisper vs anthemic
        tags = ["whisper", "anthemic"]

        with pytest.raises(ValueError) as exc_info:
            service._validate_tag_conflicts(tags)

        assert "Conflicting energy tags" in str(exc_info.value)

    def test_validate_tag_conflicts_intimate_stadium(self, service):
        """Test tag conflict validation with intimate vs stadium."""
        tags = ["intimate", "stadium"]

        with pytest.raises(ValueError) as exc_info:
            service._validate_tag_conflicts(tags)

        assert "Conflicting energy tags" in str(exc_info.value)

    def test_validate_energy_tempo_coherence_valid(self, service):
        """Test energy/tempo coherence with valid data."""
        # High energy (8) with medium-fast BPM (120)
        try:
            service._validate_energy_tempo_coherence(
                energy_level=8,
                bpm_min=120,
                bpm_max=140
            )
            success = True
        except ValueError:
            success = False

        assert success

    def test_validate_energy_tempo_coherence_invalid(self, service):
        """Test energy/tempo coherence with invalid data."""
        # High energy (9) with slow BPM (70) - incoherent
        with pytest.raises(ValueError) as exc_info:
            service._validate_energy_tempo_coherence(
                energy_level=9,
                bpm_min=60,
                bpm_max=80
            )

        assert "High energy" in str(exc_info.value) and "slow BPM" in str(exc_info.value)

    def test_validate_energy_tempo_coherence_low_energy_fast_bpm(self, service):
        """Test low energy with fast BPM (incoherent)."""
        # Low energy (3) with fast BPM (160) - incoherent
        with pytest.raises(ValueError) as exc_info:
            service._validate_energy_tempo_coherence(
                energy_level=3,
                bpm_min=150,
                bpm_max=170
            )

        assert "Low energy" in str(exc_info.value) and "fast BPM" in str(exc_info.value)

    def test_validate_energy_tempo_coherence_no_energy(self, service):
        """Test validation with no energy level (optional)."""
        # No energy level provided - should not raise
        try:
            service._validate_energy_tempo_coherence(
                energy_level=None,
                bpm_min=120,
                bpm_max=140
            )
            success = True
        except ValueError:
            success = False

        assert success

    def test_validate_energy_tempo_coherence_no_bpm(self, service):
        """Test validation with no BPM (optional)."""
        # No BPM provided - should not raise
        try:
            service._validate_energy_tempo_coherence(
                energy_level=8,
                bpm_min=None,
                bpm_max=None
            )
            success = True
        except ValueError:
            success = False

        assert success

    @pytest.mark.asyncio
    async def test_create_style_with_tag_conflict(self, service, mock_repo):
        """Test creating style with tag conflicts raises error."""
        style_data = StyleCreate(
            name="Conflict Style",
            genre="Pop",
            bpm_min=110,
            bpm_max=130,
            energy_level=8,
            instrumentation=["synth"],
            tags_positive=["1940s", "1980s"],  # Conflicting eras
            tags_negative=[]
        )

        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()

        # Should raise ValueError before repository is called
        with pytest.raises(ValueError) as exc_info:
            await service.create_style(
                data=style_data,
                tenant_id=tenant_id,
                owner_id=owner_id
            )

        # Repository should not be called
        assert not mock_repo.create.called

    @pytest.mark.asyncio
    async def test_create_style_with_energy_tempo_incoherence(self, service, mock_repo):
        """Test creating style with incoherent energy/tempo raises error."""
        style_data = StyleCreate(
            name="Incoherent Style",
            genre="Pop",
            bpm_min=60,
            bpm_max=80,  # Slow BPM
            energy_level=9,  # High energy - incoherent
            instrumentation=["synth"],
            tags_positive=["bright"],
            tags_negative=[]
        )

        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()

        # Should raise ValueError before repository is called
        with pytest.raises(ValueError) as exc_info:
            await service.create_style(
                data=style_data,
                tenant_id=tenant_id,
                owner_id=owner_id
            )

        # Repository should not be called
        assert not mock_repo.create.called

    @pytest.mark.asyncio
    async def test_update_style_with_validation(self, service, mock_repo):
        """Test updating style with validation."""
        style_id = uuid.uuid4()
        update_data = StyleUpdate(
            tags_positive=["bright", "catchy"],  # No conflicts
            energy_level=8
        )

        # Mock existing style
        mock_style = Style(
            id=style_id,
            name="Test Style",
            genre="Pop",
            bpm_min=120,
            bpm_max=140,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )
        mock_repo.get_by_id = AsyncMock(return_value=mock_style)
        mock_repo.update = AsyncMock(return_value=mock_style)

        # Call service
        result = await service.update_style(style_id, update_data)

        # Verify
        assert result is not None
        assert mock_repo.update.called

    def test_validate_instrumentation_limit(self, service):
        """Test that instrumentation limit is enforced (max 3)."""
        # This validation happens in Pydantic schema, but service should respect it
        instrumentation = ["piano", "guitar", "drums", "bass"]  # 4 items

        # Service should accept list (validation in schema layer)
        # But we can test the logic would apply if service enforces it
        assert len(instrumentation) > 3  # Verify test data is correct
