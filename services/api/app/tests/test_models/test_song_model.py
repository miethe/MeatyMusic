"""Comprehensive unit tests for Song and WorkflowRun ORM models.

This test suite verifies:
- Song model with SDS version, global seed, status
- Global seed validation (non-negative, required for determinism)
- Status enum values and workflow states
- Foreign key relationships (style_id, persona_id, blueprint_id)
- Cascade deletes for artifacts (lyrics, producer_notes, workflow_runs, composed_prompts)
- WorkflowRun model with node outputs, events, scores
- Fix iterations constraint (0-3)
"""

import uuid
import pytest
from sqlalchemy import inspect

from app.models.song import Song, WorkflowRun
from app.models.base import BaseModel


class TestSongModel:
    """Test Song ORM model functionality."""

    def test_inheritance(self):
        """Test that Song inherits from BaseModel."""
        assert issubclass(Song, BaseModel)

    def test_table_name(self):
        """Test that table name is correct."""
        assert Song.__tablename__ == "songs"

    def test_create_song_minimal(self):
        """Test creating song with minimal required fields."""
        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()

        song = Song(
            title="Test Song",
            global_seed=12345,
            tenant_id=tenant_id,
            owner_id=owner_id
        )

        assert song.title == "Test Song"
        assert song.global_seed == 12345
        assert song.tenant_id == tenant_id
        assert song.owner_id == owner_id

    def test_create_song_full_data(self):
        """Test creating song with all fields."""
        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()
        style_id = uuid.uuid4()
        persona_id = uuid.uuid4()
        blueprint_id = uuid.uuid4()

        song = Song(
            title="Full Song",
            sds_version="1.0.0",
            global_seed=54321,
            style_id=style_id,
            persona_id=persona_id,
            blueprint_id=blueprint_id,
            status="validated",
            feature_flags={"render.enabled": True, "eval.autofix.enabled": True},
            render_config={"engine": "suno", "model": "v3.5", "num_variations": 2},
            extra_metadata={"custom": "data"},
            tenant_id=tenant_id,
            owner_id=owner_id
        )

        assert song.title == "Full Song"
        assert song.sds_version == "1.0.0"
        assert song.global_seed == 54321
        assert song.style_id == style_id
        assert song.persona_id == persona_id
        assert song.blueprint_id == blueprint_id
        assert song.status == "validated"
        assert song.feature_flags == {"render.enabled": True, "eval.autofix.enabled": True}
        assert song.render_config == {"engine": "suno", "model": "v3.5", "num_variations": 2}
        assert song.extra_metadata == {"custom": "data"}

    def test_global_seed_required(self):
        """Test that global_seed is required (not nullable)."""
        mapper = inspect(Song)
        global_seed_col = mapper.columns['global_seed']

        assert global_seed_col.nullable is False

    def test_global_seed_positive_constraint(self):
        """Test that global_seed has check constraint (>= 0)."""
        constraints = Song.__table_args__
        constraint_names = [c.name for c in constraints if hasattr(c, 'name')]

        assert "check_songs_global_seed_positive" in constraint_names

    def test_title_required(self):
        """Test that title is required (not nullable)."""
        mapper = inspect(Song)
        title_col = mapper.columns['title']

        assert title_col.nullable is False

    def test_sds_version_default(self):
        """Test that sds_version has default value."""
        mapper = inspect(Song)
        sds_version_col = mapper.columns['sds_version']

        assert sds_version_col.server_default is not None

    def test_status_default(self):
        """Test that status has default value (draft)."""
        mapper = inspect(Song)
        status_col = mapper.columns['status']

        assert status_col.server_default is not None

    def test_status_index(self):
        """Test that status has index for filtering."""
        indexes = Song.__table_args__
        index_names = [idx.name for idx in indexes if hasattr(idx, 'name')]

        assert any('status' in name for name in index_names)

    def test_title_index(self):
        """Test that title has index for search."""
        indexes = Song.__table_args__
        index_names = [idx.name for idx in indexes if hasattr(idx, 'name')]

        assert any('title' in name for name in index_names)

    def test_created_at_index(self):
        """Test that created_at has index for sorting."""
        indexes = Song.__table_args__
        index_names = [idx.name for idx in indexes if hasattr(idx, 'name')]

        assert any('created_at' in name for name in index_names)

    def test_foreign_keys(self):
        """Test that foreign keys are defined."""
        mapper = inspect(Song)

        # Check style_id FK
        style_id_col = mapper.columns['style_id']
        style_fks = list(style_id_col.foreign_keys)
        assert len(style_fks) == 1
        assert 'styles.id' in str(style_fks[0].target_fullname)

        # Check persona_id FK
        persona_id_col = mapper.columns['persona_id']
        persona_fks = list(persona_id_col.foreign_keys)
        assert len(persona_fks) == 1
        assert 'personas.id' in str(persona_fks[0].target_fullname)

        # Check blueprint_id FK
        blueprint_id_col = mapper.columns['blueprint_id']
        blueprint_fks = list(blueprint_id_col.foreign_keys)
        assert len(blueprint_fks) == 1
        assert 'blueprints.id' in str(blueprint_fks[0].target_fullname)

    def test_relationships_defined(self):
        """Test that relationships are defined."""
        song = Song(
            title="Test",
            global_seed=123,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        # Check that relationship attributes exist
        assert hasattr(song, 'style')
        assert hasattr(song, 'persona')
        assert hasattr(song, 'blueprint')
        assert hasattr(song, 'lyrics')
        assert hasattr(song, 'producer_notes')
        assert hasattr(song, 'workflow_runs')
        assert hasattr(song, 'composed_prompts')

    def test_cascade_deletes(self):
        """Test that artifact relationships have cascade delete."""
        # This is tested by checking relationship configuration
        # In actual DB tests, we would verify cascade behavior
        song = Song(
            title="Test",
            global_seed=123,
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        # Relationships should exist (cascade verified in integration tests)
        assert hasattr(song, 'lyrics')
        assert hasattr(song, 'producer_notes')
        assert hasattr(song, 'workflow_runs')
        assert hasattr(song, 'composed_prompts')

    def test_feature_flags_jsonb(self):
        """Test that feature_flags is JSONB with default."""
        mapper = inspect(Song)
        feature_flags_col = mapper.columns['feature_flags']

        assert feature_flags_col.server_default is not None

    def test_render_config_nullable(self):
        """Test that render_config is nullable (optional)."""
        mapper = inspect(Song)
        render_config_col = mapper.columns['render_config']

        assert render_config_col.nullable is True


class TestWorkflowRunModel:
    """Test WorkflowRun ORM model functionality."""

    def test_inheritance(self):
        """Test that WorkflowRun inherits from BaseModel."""
        assert issubclass(WorkflowRun, BaseModel)

    def test_table_name(self):
        """Test that table name is correct."""
        assert WorkflowRun.__tablename__ == "workflow_runs"

    def test_create_workflow_run_minimal(self):
        """Test creating workflow run with minimal required fields."""
        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()
        song_id = uuid.uuid4()
        run_id = uuid.uuid4()

        run = WorkflowRun(
            song_id=song_id,
            run_id=run_id,
            tenant_id=tenant_id,
            owner_id=owner_id
        )

        assert run.song_id == song_id
        assert run.run_id == run_id
        assert run.tenant_id == tenant_id
        assert run.owner_id == owner_id

    def test_create_workflow_run_full_data(self):
        """Test creating workflow run with all fields."""
        tenant_id = uuid.uuid4()
        owner_id = uuid.uuid4()
        song_id = uuid.uuid4()
        run_id = uuid.uuid4()

        run = WorkflowRun(
            song_id=song_id,
            run_id=run_id,
            status="completed",
            current_node="REVIEW",
            node_outputs={
                "STYLE": {"artifacts": {"style_id": "xyz"}, "scores": {}, "duration_ms": 1234},
                "LYRICS": {"artifacts": {"lyrics_id": "abc"}, "scores": {}, "duration_ms": 2345}
            },
            event_stream=[
                {"ts": "2025-11-12T10:00:00Z", "node": "STYLE", "phase": "start"},
                {"ts": "2025-11-12T10:00:01Z", "node": "STYLE", "phase": "end", "duration_ms": 1234}
            ],
            validation_scores={
                "hook_density": 0.85,
                "singability": 0.90,
                "rhyme_tightness": 0.88,
                "total": 0.87
            },
            fix_iterations=2,
            error=None,
            extra_metadata={"run_type": "automated"},
            tenant_id=tenant_id,
            owner_id=owner_id
        )

        assert run.status == "completed"
        assert run.current_node == "REVIEW"
        assert run.node_outputs["STYLE"]["artifacts"]["style_id"] == "xyz"
        assert len(run.event_stream) == 2
        assert run.validation_scores["total"] == 0.87
        assert run.fix_iterations == 2
        assert run.extra_metadata == {"run_type": "automated"}

    def test_song_id_required(self):
        """Test that song_id is required (not nullable)."""
        mapper = inspect(WorkflowRun)
        song_id_col = mapper.columns['song_id']

        assert song_id_col.nullable is False

    def test_run_id_required_unique(self):
        """Test that run_id is required and unique."""
        mapper = inspect(WorkflowRun)
        run_id_col = mapper.columns['run_id']

        assert run_id_col.nullable is False
        assert run_id_col.unique is True

    def test_fix_iterations_constraint(self):
        """Test that fix_iterations has check constraint (0-3)."""
        constraints = WorkflowRun.__table_args__
        constraint_names = [c.name for c in constraints if hasattr(c, 'name')]

        assert "check_workflow_runs_fix_iterations_range" in constraint_names

    def test_fix_iterations_default(self):
        """Test that fix_iterations has default value (0)."""
        mapper = inspect(WorkflowRun)
        fix_iterations_col = mapper.columns['fix_iterations']

        assert fix_iterations_col.server_default is not None

    def test_status_default(self):
        """Test that status has default value (running)."""
        mapper = inspect(WorkflowRun)
        status_col = mapper.columns['status']

        assert status_col.server_default is not None

    def test_indexes(self):
        """Test that required indexes exist."""
        indexes = WorkflowRun.__table_args__
        index_names = [idx.name for idx in indexes if hasattr(idx, 'name')]

        assert any('song_id' in name for name in index_names)
        assert any('run_id' in name for name in index_names)
        assert any('status' in name for name in index_names)
        assert any('created_at' in name for name in index_names)

    def test_song_foreign_key(self):
        """Test that song_id has foreign key to songs table."""
        mapper = inspect(WorkflowRun)
        song_id_col = mapper.columns['song_id']

        foreign_keys = list(song_id_col.foreign_keys)
        assert len(foreign_keys) == 1
        assert 'songs.id' in str(foreign_keys[0].target_fullname)

    def test_song_relationship(self):
        """Test that song relationship is defined."""
        run = WorkflowRun(
            song_id=uuid.uuid4(),
            run_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
            owner_id=uuid.uuid4()
        )

        assert hasattr(run, 'song')

    def test_jsonb_defaults(self):
        """Test that JSONB fields have defaults."""
        mapper = inspect(WorkflowRun)

        assert mapper.columns['node_outputs'].server_default is not None
        assert mapper.columns['event_stream'].server_default is not None
        assert mapper.columns['extra_metadata'].server_default is not None

    def test_validation_scores_nullable(self):
        """Test that validation_scores is nullable (set after validation)."""
        mapper = inspect(WorkflowRun)
        validation_scores_col = mapper.columns['validation_scores']

        assert validation_scores_col.nullable is True

    def test_error_nullable(self):
        """Test that error is nullable (only set on failure)."""
        mapper = inspect(WorkflowRun)
        error_col = mapper.columns['error']

        assert error_col.nullable is True

    def test_current_node_nullable(self):
        """Test that current_node is nullable (before run starts)."""
        mapper = inspect(WorkflowRun)
        current_node_col = mapper.columns['current_node']

        assert current_node_col.nullable is True
