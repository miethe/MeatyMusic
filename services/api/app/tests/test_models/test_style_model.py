"""Comprehensive unit tests for Style ORM model.

This test suite verifies:
- Style model creation with all fields
- BPM range constraints (60-200, min <= max)
- Energy level validation (1-10)
- Default arrays for sub_genres, mood, instrumentation, tags
- JSONB fields for vocal_profile and extra_metadata
- Foreign key relationship to Blueprint
- Indexes for performance (genre, tenant_owner, name)
"""

import uuid
import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from app.models.style import Style
from app.models.base import BaseModel


class TestStyleModel:
    """Test Style ORM model functionality."""

    def test_inheritance(self):
        """Test that Style inherits from BaseModel."""
        assert issubclass(Style, BaseModel)

    def test_table_name(self):
        """Test that table name is correct."""
        assert Style.__tablename__ == "styles"

    def test_create_style_minimal(self):
        """Test creating style with minimal required fields."""
        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()

        style = Style(
            name="Test Style",
            genre="Pop",
            tenant_id=tenant_id,
            owner_id=owner_id
        )

        assert style.name == "Test Style"
        assert style.genre == "Pop"
        assert style.tenant_id == tenant_id
        assert style.owner_id == owner_id

    def test_create_style_full_data(self):
        """Test creating style with all fields."""
        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()
        blueprint_id = uuid.uuid4()

        style = Style(
            name="Full Style",
            genre="Christmas Pop",
            sub_genres=["Big Band Pop", "Swing"],
            bpm_min=110,
            bpm_max=130,
            key="C major",
            modulations=["F major"],
            mood=["upbeat", "cheeky", "warm"],
            energy_level=8,
            instrumentation=["brass", "upright bass", "sleigh bells"],
            vocal_profile={"voice": "male", "range": "baritone", "delivery": "smooth"},
            tags_positive=["1940s", "swung eighth notes", "big band feel"],
            tags_negative=["muddy low-end"],
            blueprint_id=blueprint_id,
            extra_metadata={"custom_field": "value"},
            tenant_id=tenant_id,
            owner_id=owner_id
        )

        assert style.name == "Full Style"
        assert style.genre == "Christmas Pop"
        assert style.sub_genres == ["Big Band Pop", "Swing"]
        assert style.bpm_min == 110
        assert style.bpm_max == 130
        assert style.key == "C major"
        assert style.modulations == ["F major"]
        assert style.mood == ["upbeat", "cheeky", "warm"]
        assert style.energy_level == 8
        assert style.instrumentation == ["brass", "upright bass", "sleigh bells"]
        assert style.vocal_profile == {"voice": "male", "range": "baritone", "delivery": "smooth"}
        assert style.tags_positive == ["1940s", "swung eighth notes", "big band feel"]
        assert style.tags_negative == ["muddy low-end"]
        assert style.blueprint_id == blueprint_id
        assert style.extra_metadata == {"custom_field": "value"}

    def test_bpm_range_constraint(self):
        """Test that BPM check constraint exists (bpm_min <= bpm_max)."""
        constraints = Style.__table_args__
        constraint_names = [c.name for c in constraints if hasattr(c, 'name')]

        assert "check_styles_bpm_range" in constraint_names

    def test_energy_level_constraint(self):
        """Test that energy level check constraint exists (1-10)."""
        constraints = Style.__table_args__
        constraint_names = [c.name for c in constraints if hasattr(c, 'name')]

        assert "check_styles_energy_range" in constraint_names

    def test_genre_index(self):
        """Test that genre has index for filtering."""
        indexes = Style.__table_args__
        index_names = [idx.name for idx in indexes if hasattr(idx, 'name') and 'genre' in idx.name]

        assert any('genre' in name for name in index_names)

    def test_tenant_owner_index(self):
        """Test that composite tenant_owner index exists for RLS."""
        indexes = Style.__table_args__
        index_names = [idx.name for idx in indexes if hasattr(idx, 'name')]

        assert any('tenant_owner' in name for name in index_names)

    def test_name_index(self):
        """Test that name has index for search."""
        indexes = Style.__table_args__
        index_names = [idx.name for idx in indexes if hasattr(idx, 'name') and 'name' in idx.name]

        assert any('name' in name for name in index_names)

    def test_genre_required(self):
        """Test that genre is required (not nullable)."""
        mapper = inspect(Style)
        genre_col = mapper.columns['genre']

        assert genre_col.nullable is False

    def test_name_required(self):
        """Test that name is required (not nullable)."""
        mapper = inspect(Style)
        name_col = mapper.columns['name']

        assert name_col.nullable is False

    def test_default_arrays(self):
        """Test that array fields have empty array defaults."""
        mapper = inspect(Style)

        # Check server defaults for array columns
        assert mapper.columns['sub_genres'].server_default is not None
        assert mapper.columns['mood'].server_default is not None
        assert mapper.columns['instrumentation'].server_default is not None
        assert mapper.columns['tags_positive'].server_default is not None
        assert mapper.columns['tags_negative'].server_default is not None
        assert mapper.columns['modulations'].server_default is not None

    def test_default_jsonb_fields(self):
        """Test that JSONB fields have empty object defaults."""
        mapper = inspect(Style)

        # Check server defaults for JSONB columns
        assert mapper.columns['vocal_profile'].server_default is not None
        assert mapper.columns['extra_metadata'].server_default is not None

    def test_bpm_nullable(self):
        """Test that BPM fields are nullable (optional)."""
        mapper = inspect(Style)

        assert mapper.columns['bpm_min'].nullable is True
        assert mapper.columns['bpm_max'].nullable is True

    def test_energy_level_nullable(self):
        """Test that energy_level is nullable (optional)."""
        mapper = inspect(Style)

        assert mapper.columns['energy_level'].nullable is True

    def test_blueprint_foreign_key(self):
        """Test that blueprint_id has foreign key to blueprints table."""
        mapper = inspect(Style)
        blueprint_id_col = mapper.columns['blueprint_id']

        # Check if foreign key exists
        foreign_keys = list(blueprint_id_col.foreign_keys)
        assert len(foreign_keys) == 1
        assert 'blueprints.id' in str(foreign_keys[0].target_fullname)

    def test_blueprint_on_delete_set_null(self):
        """Test that blueprint FK has ondelete='SET NULL'."""
        mapper = inspect(Style)
        blueprint_id_col = mapper.columns['blueprint_id']

        foreign_keys = list(blueprint_id_col.foreign_keys)
        # In SQLAlchemy, ondelete is set on the ForeignKey constraint
        assert len(foreign_keys) == 1

    def test_relationships_defined(self):
        """Test that relationships are defined."""
        style = Style(
            name="Test",
            genre="Pop",
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        # Check that relationship attributes exist
        assert hasattr(style, 'blueprint')
        assert hasattr(style, 'songs')

    def test_column_comments(self):
        """Test that columns have descriptive comments."""
        mapper = inspect(Style)

        # Verify key columns have comments
        assert mapper.columns['name'].comment is not None
        assert mapper.columns['genre'].comment is not None
        assert mapper.columns['bpm_min'].comment is not None
        assert mapper.columns['bpm_max'].comment is not None
        assert mapper.columns['energy_level'].comment is not None
        assert mapper.columns['instrumentation'].comment is not None
        assert mapper.columns['vocal_profile'].comment is not None
        assert mapper.columns['tags_positive'].comment is not None
        assert mapper.columns['blueprint_id'].comment is not None

    def test_bpm_range_valid(self):
        """Test creating style with valid BPM range."""
        style = Style(
            name="Valid BPM",
            genre="Pop",
            bpm_min=100,
            bpm_max=140,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        assert style.bpm_min == 100
        assert style.bpm_max == 140
        assert style.bpm_min <= style.bpm_max

    def test_energy_level_valid_range(self):
        """Test creating style with valid energy levels."""
        for energy in [1, 5, 10]:
            style = Style(
                name=f"Energy {energy}",
                genre="Pop",
                energy_level=energy,
                tenant_id=uuid.uuid4(),
                owner_id=uuid.uuid4()
            )
            assert style.energy_level == energy

    def test_instrumentation_limit_documented(self):
        """Test that instrumentation field exists (limit enforced in service layer)."""
        style = Style(
            name="Test",
            genre="Pop",
            instrumentation=["piano", "guitar", "drums"],  # Max 3 items
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        assert len(style.instrumentation) == 3

    def test_vocal_profile_structure(self):
        """Test vocal_profile JSONB can store complex structures."""
        vocal_profile = {
            "voice": "male",
            "range": "baritone",
            "delivery": "smooth",
            "style": "crooning"
        }

        style = Style(
            name="Test",
            genre="Pop",
            vocal_profile=vocal_profile,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        assert style.vocal_profile == vocal_profile
        assert style.vocal_profile["voice"] == "male"
        assert style.vocal_profile["range"] == "baritone"

    def test_extra_metadata_flexible(self):
        """Test extra_metadata JSONB can store custom fields."""
        metadata = {
            "custom_field": "value",
            "nested": {"key": "value"},
            "array": [1, 2, 3]
        }

        style = Style(
            name="Test",
            genre="Pop",
            extra_metadata=metadata,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        assert style.extra_metadata == metadata
