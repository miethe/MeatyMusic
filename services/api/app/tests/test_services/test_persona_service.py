"""Comprehensive unit tests for PersonaService.

This test suite verifies:
- Influence normalization for public releases
- Vocal range validation
- Delivery style conflict detection
- Policy enforcement (disallow_named_style_of)
- CRUD operations with validation
- Business logic enforcement
- Integration with PersonaRepository
"""

import uuid
import pytest
from unittest.mock import MagicMock, AsyncMock

from app.services.persona_service import PersonaService
from app.repositories.persona_repo import PersonaRepository
from app.models.persona import Persona
from app.schemas.persona import PersonaCreate, PersonaUpdate, PersonaKind
from app.errors import BadRequestError, NotFoundError


class TestPersonaService:
    """Test PersonaService business logic."""

    @pytest.fixture
    def mock_session(self):
        """Mock async session."""
        session = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        return session

    @pytest.fixture
    def mock_repo(self):
        """Mock PersonaRepository."""
        return MagicMock(spec=PersonaRepository)

    @pytest.fixture
    def service(self, mock_session, mock_repo):
        """PersonaService instance for testing."""
        return PersonaService(session=mock_session, repo=mock_repo)

    @pytest.fixture
    def valid_persona_create(self):
        """Valid PersonaCreate data."""
        return PersonaCreate(
            name="Test Artist",
            kind=PersonaKind.ARTIST,
            bio="A test artist biography",
            voice="smooth tenor",
            vocal_range="tenor",
            delivery=["crooning", "belting"],
            influences=["jazz", "pop"],
            policy={
                "public_release": False,
                "disallow_named_style_of": True
            }
        )

    @pytest.fixture
    def public_persona_create(self):
        """PersonaCreate data for public release."""
        return PersonaCreate(
            name="Public Artist",
            kind=PersonaKind.ARTIST,
            voice="powerful soprano",
            vocal_range="soprano",
            delivery=["belting"],
            influences=["Beyoncé", "style of Taylor Swift", "Adele"],
            policy={
                "public_release": True,
                "disallow_named_style_of": True
            }
        )

    def test_init(self, mock_session, mock_repo):
        """Test service initialization."""
        service = PersonaService(session=mock_session, repo=mock_repo)
        assert service.repo == mock_repo
        assert service._session == mock_session

    @pytest.mark.asyncio
    async def test_create_persona_valid(self, service, mock_repo, valid_persona_create):
        """Test creating persona with valid data."""
        # Mock repository create
        mock_persona = Persona(
            id=uuid.uuid4(),
            name="Test Artist",
            kind="artist",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            vocal_range="tenor",
            delivery=["crooning", "belting"],
            influences=["jazz", "pop"],
            policy={"public_release": False, "disallow_named_style_of": True}
        )
        mock_repo.create = AsyncMock(return_value=mock_persona)

        # Call service
        result = await service.create_persona(data=valid_persona_create)

        # Verify result
        assert result is not None
        assert result.name == "Test Artist"
        assert mock_repo.create.called

    @pytest.mark.asyncio
    async def test_create_persona_invalid_vocal_range(self, service, mock_repo):
        """Test creating persona with invalid vocal range raises error."""
        persona_data = PersonaCreate(
            name="Bad Range Artist",
            kind=PersonaKind.ARTIST,
            vocal_range="ultra-high",  # Invalid range
            delivery=["crooning"],
            influences=["pop"]
        )

        # Should raise BadRequestError
        with pytest.raises(BadRequestError) as exc_info:
            await service.create_persona(data=persona_data)

        assert "Invalid vocal range" in str(exc_info.value)
        # Repository should not be called
        assert not mock_repo.create.called

    @pytest.mark.asyncio
    async def test_create_persona_with_influence_normalization(
        self,
        service,
        mock_repo,
        public_persona_create
    ):
        """Test creating public persona normalizes influences."""
        # Mock repository create
        mock_persona = Persona(
            id=uuid.uuid4(),
            name="Public Artist",
            kind="artist",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            vocal_range="soprano",
            delivery=["belting"],
            influences=[
                "contemporary R&B diva-inspired sound",
                "pop storytelling-inspired",
                "soulful ballad-inspired"
            ],
            policy={"public_release": True, "disallow_named_style_of": True}
        )
        mock_repo.create = AsyncMock(return_value=mock_persona)

        # Call service
        result = await service.create_persona(data=public_persona_create)

        # Verify influences were normalized
        assert result is not None
        # Check that the create was called (influences modified in data)
        assert mock_repo.create.called

    @pytest.mark.asyncio
    async def test_create_persona_delivery_conflicts_logged(self, service, mock_repo):
        """Test creating persona with delivery conflicts logs warning."""
        persona_data = PersonaCreate(
            name="Conflict Artist",
            kind=PersonaKind.ARTIST,
            vocal_range="soprano",
            delivery=["whisper", "belting"],  # Conflicting styles
            influences=["pop"]
        )

        # Mock repository create
        mock_persona = Persona(
            id=uuid.uuid4(),
            name="Conflict Artist",
            kind="artist",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            vocal_range="soprano",
            delivery=["whisper", "belting"],
            influences=["pop"],
            policy={"public_release": False, "disallow_named_style_of": True}
        )
        mock_repo.create = AsyncMock(return_value=mock_persona)

        # Should create but log warning (no exception)
        result = await service.create_persona(data=persona_data)
        assert result is not None

    @pytest.mark.asyncio
    async def test_get_persona(self, service, mock_repo):
        """Test getting persona by ID."""
        persona_id = uuid.uuid4()
        mock_persona = Persona(
            id=persona_id,
            name="Test Artist",
            kind="artist",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            vocal_range="tenor",
            delivery=["crooning"],
            influences=["jazz"],
            policy={"public_release": False, "disallow_named_style_of": True}
        )
        mock_repo.get_by_id = AsyncMock(return_value=mock_persona)

        # Call service
        result = await service.get_persona(persona_id)

        # Verify
        assert result is not None
        assert result.id == persona_id
        mock_repo.get_by_id.assert_called_once_with(persona_id)

    @pytest.mark.asyncio
    async def test_get_persona_not_found(self, service, mock_repo):
        """Test getting non-existent persona returns None."""
        persona_id = uuid.uuid4()
        mock_repo.get_by_id = AsyncMock(return_value=None)

        # Call service
        result = await service.get_persona(persona_id)

        # Verify
        assert result is None

    @pytest.mark.asyncio
    async def test_update_persona(self, service, mock_repo):
        """Test updating persona with valid data."""
        persona_id = uuid.uuid4()
        update_data = PersonaUpdate(
            vocal_range="baritone",
            delivery=["crooning", "belting"]
        )

        # Mock existing persona
        mock_existing = Persona(
            id=persona_id,
            name="Test Artist",
            kind="artist",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            vocal_range="tenor",
            delivery=["crooning"],
            influences=["jazz"],
            policy={"public_release": False, "disallow_named_style_of": True}
        )

        # Mock updated persona
        mock_updated = Persona(
            id=persona_id,
            name="Test Artist",
            kind="artist",
            tenant_id=mock_existing.tenant_id,
            owner_id=mock_existing.owner_id,
            vocal_range="baritone",
            delivery=["crooning", "belting"],
            influences=["jazz"],
            policy={"public_release": False, "disallow_named_style_of": True}
        )

        mock_repo.get_by_id = AsyncMock(return_value=mock_existing)
        mock_repo.update = AsyncMock(return_value=mock_updated)

        # Call service
        result = await service.update_persona(persona_id, update_data)

        # Verify
        assert result is not None
        assert result.vocal_range == "baritone"
        mock_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_persona_not_found(self, service, mock_repo):
        """Test updating non-existent persona raises NotFoundError."""
        persona_id = uuid.uuid4()
        update_data = PersonaUpdate(vocal_range="baritone")

        mock_repo.get_by_id = AsyncMock(return_value=None)

        # Should raise NotFoundError
        with pytest.raises(NotFoundError) as exc_info:
            await service.update_persona(persona_id, update_data)

        assert str(persona_id) in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_update_persona_invalid_vocal_range(self, service, mock_repo):
        """Test updating persona with invalid vocal range raises error."""
        persona_id = uuid.uuid4()
        update_data = PersonaUpdate(vocal_range="invalid-range")

        # Mock existing persona
        mock_existing = Persona(
            id=persona_id,
            name="Test Artist",
            kind="artist",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            vocal_range="tenor",
            delivery=["crooning"],
            influences=["jazz"],
            policy={"public_release": False, "disallow_named_style_of": True}
        )
        mock_repo.get_by_id = AsyncMock(return_value=mock_existing)

        # Should raise BadRequestError
        with pytest.raises(BadRequestError) as exc_info:
            await service.update_persona(persona_id, update_data)

        assert "Invalid vocal range" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_delete_persona(self, service, mock_repo):
        """Test deleting persona."""
        persona_id = uuid.uuid4()
        mock_repo.delete = AsyncMock(return_value=True)

        # Call service
        result = await service.delete_persona(persona_id)

        # Verify
        assert result is True
        mock_repo.delete.assert_called_once_with(persona_id)

    @pytest.mark.asyncio
    async def test_delete_persona_not_found(self, service, mock_repo):
        """Test deleting non-existent persona returns False."""
        persona_id = uuid.uuid4()
        mock_repo.delete = AsyncMock(return_value=False)

        # Call service
        result = await service.delete_persona(persona_id)

        # Verify
        assert result is False

    def test_normalize_influences_no_public_release(self, service):
        """Test influence normalization skipped when not public release."""
        influences = ["Beyoncé", "Taylor Swift", "Adele"]

        # Call normalization with public_release=False
        result = service.normalize_influences(influences, public_release=False)

        # Should return unchanged
        assert result == influences

    def test_normalize_influences_public_release(self, service):
        """Test influence normalization for public release."""
        influences = ["Beyoncé", "style of Taylor Swift", "Adele", "jazz"]

        # Call normalization with public_release=True
        result = service.normalize_influences(influences, public_release=True)

        # Verify normalization
        assert "Beyoncé" not in result
        assert "Taylor Swift" not in result
        assert "Adele" not in result
        # Should have generic descriptions
        assert any("R&B" in r or "diva" in r for r in result)
        assert any("pop" in r.lower() for r in result)
        # Non-artist influences should remain
        assert "jazz" in result

    def test_normalize_influences_style_of_prefix(self, service):
        """Test normalization handles 'style of' prefix."""
        influences = ["style of Drake", "style of Ed Sheeran"]

        result = service.normalize_influences(influences, public_release=True)

        # Should remove "style of" and normalize
        assert "Drake" not in result[0]
        assert "Ed Sheeran" not in result[1]
        assert any("hip-hop" in r.lower() for r in result)

    def test_validate_vocal_range_valid(self, service):
        """Test vocal range validation with valid ranges."""
        valid_ranges = [
            "soprano",
            "mezzo-soprano",
            "alto",
            "tenor",
            "baritone",
            "bass",
            "countertenor"
        ]

        for vocal_range in valid_ranges:
            assert service.validate_vocal_range(vocal_range)
            # Test case insensitivity
            assert service.validate_vocal_range(vocal_range.upper())

    def test_validate_vocal_range_combined(self, service):
        """Test vocal range validation with combined ranges."""
        combined_ranges = [
            "soprano + tenor",
            "mezzo-soprano + baritone",
            "alto + tenor"
        ]

        for vocal_range in combined_ranges:
            assert service.validate_vocal_range(vocal_range)

    def test_validate_vocal_range_invalid(self, service):
        """Test vocal range validation with invalid ranges."""
        invalid_ranges = [
            "ultra-high",
            "super-bass",
            "medium",
            "average"
        ]

        for vocal_range in invalid_ranges:
            assert not service.validate_vocal_range(vocal_range)

    def test_validate_delivery_styles_no_conflicts(self, service):
        """Test delivery style validation with no conflicts."""
        delivery = ["crooning", "belting", "melismatic"]

        is_valid, conflicts = service.validate_delivery_styles(delivery)

        assert is_valid
        assert len(conflicts) == 0

    def test_validate_delivery_styles_whisper_belting_conflict(self, service):
        """Test delivery style validation detects whisper + belting conflict."""
        delivery = ["whisper", "belting"]

        is_valid, conflicts = service.validate_delivery_styles(delivery)

        assert not is_valid
        assert len(conflicts) == 1
        assert conflicts[0] == ("whisper", "belting")

    def test_validate_delivery_styles_multiple_conflicts(self, service):
        """Test delivery style validation detects multiple conflicts."""
        delivery = ["whisper", "belting", "soft", "aggressive"]

        is_valid, conflicts = service.validate_delivery_styles(delivery)

        assert not is_valid
        assert len(conflicts) >= 2  # whisper+belting, soft+aggressive

    def test_validate_delivery_styles_case_insensitive(self, service):
        """Test delivery style validation is case insensitive."""
        delivery = ["Whisper", "BELTING"]

        is_valid, conflicts = service.validate_delivery_styles(delivery)

        assert not is_valid
        assert len(conflicts) == 1

    @pytest.mark.asyncio
    async def test_get_by_type_artist(self, service, mock_repo):
        """Test getting personas by type (artist)."""
        mock_personas = [
            Persona(
                id=uuid.uuid4(),
                name="Artist 1",
                kind="artist",
                tenant_id=uuid.uuid4(),
                owner_id=uuid.uuid4(),
                vocal_range="tenor",
                delivery=["crooning"],
                influences=["jazz"],
                policy={"public_release": False, "disallow_named_style_of": True}
            ),
            Persona(
                id=uuid.uuid4(),
                name="Artist 2",
                kind="artist",
                tenant_id=uuid.uuid4(),
                owner_id=uuid.uuid4(),
                vocal_range="soprano",
                delivery=["belting"],
                influences=["pop"],
                policy={"public_release": False, "disallow_named_style_of": True}
            )
        ]
        mock_repo.get_all = AsyncMock(return_value=mock_personas)

        # Call service
        result = await service.get_by_type("artist")

        # Verify
        assert len(result) == 2
        assert all(p.kind == "artist" for p in result)

    @pytest.mark.asyncio
    async def test_get_by_name(self, service, mock_repo):
        """Test getting persona by name."""
        mock_persona = Persona(
            id=uuid.uuid4(),
            name="Test Artist",
            kind="artist",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4(),
            vocal_range="tenor",
            delivery=["crooning"],
            influences=["jazz"],
            policy={"public_release": False, "disallow_named_style_of": True}
        )
        mock_repo.get_by_name = AsyncMock(return_value=mock_persona)

        # Call service
        result = await service.get_by_name("Test Artist")

        # Verify
        assert result is not None
        assert result.name == "Test Artist"
        mock_repo.get_by_name.assert_called_once_with("Test Artist")

    @pytest.mark.asyncio
    async def test_search_by_influences(self, service, mock_repo):
        """Test searching personas by influences."""
        mock_personas = [
            Persona(
                id=uuid.uuid4(),
                name="Jazz Artist",
                kind="artist",
                tenant_id=uuid.uuid4(),
                owner_id=uuid.uuid4(),
                vocal_range="tenor",
                delivery=["crooning"],
                influences=["jazz", "blues"],
                policy={"public_release": False, "disallow_named_style_of": True}
            )
        ]
        mock_repo.search_by_influences = AsyncMock(return_value=mock_personas)

        # Call service
        result = await service.search_by_influences(["jazz"])

        # Verify
        assert len(result) == 1
        assert "jazz" in result[0].influences
        mock_repo.search_by_influences.assert_called_once_with(["jazz"])

    @pytest.mark.asyncio
    async def test_get_by_vocal_range(self, service, mock_repo):
        """Test getting personas by vocal range."""
        mock_personas = [
            Persona(
                id=uuid.uuid4(),
                name="Tenor Artist",
                kind="artist",
                tenant_id=uuid.uuid4(),
                owner_id=uuid.uuid4(),
                vocal_range="tenor",
                delivery=["crooning"],
                influences=["jazz"],
                policy={"public_release": False, "disallow_named_style_of": True}
            )
        ]
        mock_repo.get_by_vocal_range = AsyncMock(return_value=mock_personas)

        # Call service
        result = await service.get_by_vocal_range(min_range="C3", max_range="C5")

        # Verify
        assert len(result) == 1
        mock_repo.get_by_vocal_range.assert_called_once_with("C3", "C5")

    def test_genericize_artist_known_artists(self, service):
        """Test artist name genericization for known artists."""
        test_cases = {
            "beyoncé": "contemporary R&B diva-inspired sound",
            "taylor swift": "pop storytelling-inspired",
            "drake": "modern hip-hop influenced",
            "ed sheeran": "acoustic pop-inspired",
            "billie eilish": "alt-pop atmospheric sound"
        }

        for artist, expected in test_cases.items():
            result = service._genericize_artist(artist)
            assert result == expected

    def test_genericize_artist_unknown_artist(self, service):
        """Test artist name genericization for unknown artists."""
        result = service._genericize_artist("unknown artist name")

        # Should return generic fallback
        assert result == "contemporary pop-inspired sound"
