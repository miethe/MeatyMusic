"""Unit tests for TagConflictResolver."""

import pytest
import json
import tempfile
from pathlib import Path

from app.services.tag_conflict_resolver import TagConflictResolver


class TestTagConflictResolver:
    """Test suite for tag conflict resolver service."""

    @pytest.fixture
    def sample_conflicts(self):
        """Sample conflict matrix data."""
        return [
            {
                "tag_a": "whisper",
                "tag_b": "anthemic",
                "reason": "vocal intensity contradiction",
                "category": "vocal_style"
            },
            {
                "tag_a": "upbeat",
                "tag_b": "melancholic",
                "reason": "mood contradiction",
                "category": "mood"
            },
            {
                "tag_a": "energetic",
                "tag_b": "calm",
                "reason": "energy level contradiction",
                "category": "energy"
            },
            {
                "tag_a": "acoustic",
                "tag_b": "heavy synth",
                "reason": "instrumentation conflict",
                "category": "instrumentation"
            }
        ]

    @pytest.fixture
    def temp_conflict_matrix(self, sample_conflicts):
        """Create temporary conflict matrix file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(sample_conflicts, f)
            temp_path = f.name

        yield temp_path

        # Cleanup
        Path(temp_path).unlink(missing_ok=True)

    @pytest.fixture
    def resolver(self, temp_conflict_matrix):
        """Create resolver with temporary conflict matrix."""
        return TagConflictResolver(conflict_matrix_path=temp_conflict_matrix)

    def test_load_conflict_matrix_success(self, resolver):
        """Test conflict matrix loads successfully."""
        assert len(resolver.conflict_map) > 0
        assert "whisper" in resolver.conflict_map
        assert "anthemic" in resolver.conflict_map
        assert "anthemic" in resolver.conflict_map["whisper"]
        assert "whisper" in resolver.conflict_map["anthemic"]

    def test_load_conflict_matrix_bidirectional(self, resolver):
        """Test conflict matrix is bidirectional."""
        # Check whisper <-> anthemic
        assert "anthemic" in resolver.conflict_map["whisper"]
        assert "whisper" in resolver.conflict_map["anthemic"]

        # Check upbeat <-> melancholic
        assert "melancholic" in resolver.conflict_map["upbeat"]
        assert "upbeat" in resolver.conflict_map["melancholic"]

    def test_load_conflict_matrix_case_insensitive(self, resolver):
        """Test conflict matrix normalizes to lowercase."""
        # All keys should be lowercase
        for key in resolver.conflict_map.keys():
            assert key == key.lower()

    def test_load_conflict_matrix_file_not_found(self):
        """Test graceful handling of missing file."""
        resolver = TagConflictResolver(conflict_matrix_path="/nonexistent/file.json")

        assert resolver.conflict_map == {}

    def test_load_conflict_matrix_invalid_json(self):
        """Test graceful handling of invalid JSON."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("{ invalid json }")
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)
            assert resolver.conflict_map == {}
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_find_conflicts_no_conflicts(self, resolver):
        """Test finding conflicts when none exist."""
        tags = ["pop", "upbeat", "energetic"]

        conflicts = resolver.find_conflicts(tags)

        assert conflicts == []

    def test_find_conflicts_single_pair(self, resolver):
        """Test finding single conflicting pair."""
        tags = ["whisper", "anthemic"]

        conflicts = resolver.find_conflicts(tags)

        assert len(conflicts) == 1
        assert ("whisper", "anthemic") in conflicts or ("anthemic", "whisper") in conflicts

    def test_find_conflicts_multiple_pairs(self, resolver):
        """Test finding multiple conflicting pairs."""
        tags = ["whisper", "anthemic", "upbeat", "melancholic"]

        conflicts = resolver.find_conflicts(tags)

        assert len(conflicts) == 2
        # Check both conflict pairs exist (order may vary)
        conflict_set = {tuple(sorted(c)) for c in conflicts}
        assert ("anthemic", "whisper") in conflict_set
        assert ("melancholic", "upbeat") in conflict_set

    def test_find_conflicts_no_duplicates(self, resolver):
        """Test that conflicts don't include duplicates like (a,b) and (b,a)."""
        tags = ["whisper", "anthemic"]

        conflicts = resolver.find_conflicts(tags)

        assert len(conflicts) == 1

    def test_find_conflicts_case_insensitive(self, resolver):
        """Test conflict detection is case insensitive."""
        tags = ["Whisper", "Anthemic"]

        conflicts = resolver.find_conflicts(tags)

        assert len(conflicts) == 1

    def test_find_conflicts_mixed_case(self, resolver):
        """Test conflict detection with mixed case tags."""
        tags = ["WHISPER", "anthemic", "UpBeAt", "Melancholic"]

        conflicts = resolver.find_conflicts(tags)

        assert len(conflicts) == 2

    def test_resolve_conflicts_no_conflicts(self, resolver):
        """Test resolving tags with no conflicts."""
        tags = ["pop", "happy", "bright"]

        resolved = resolver.resolve_conflicts(tags)

        assert set(resolved) == set(tags)

    def test_resolve_conflicts_drop_later_tag(self, resolver):
        """Test conflict resolution drops later tag when no weights."""
        tags = ["whisper", "anthemic"]

        resolved = resolver.resolve_conflicts(tags)

        # First tag should be kept, second dropped
        assert len(resolved) == 1
        assert resolved[0] == "whisper"

    def test_resolve_conflicts_with_weights(self, resolver):
        """Test conflict resolution drops lower-weight tag."""
        tags = ["whisper", "anthemic"]
        weights = {
            "whisper": 0.5,
            "anthemic": 0.8
        }

        resolved = resolver.resolve_conflicts(tags, weights)

        # Higher weight tag (anthemic) should be kept
        assert len(resolved) == 1
        assert resolved[0] == "anthemic"

    def test_resolve_conflicts_multiple_with_weights(self, resolver):
        """Test resolving multiple conflicts with weights."""
        tags = ["whisper", "anthemic", "upbeat", "melancholic"]
        weights = {
            "whisper": 0.5,
            "anthemic": 0.8,
            "upbeat": 0.9,
            "melancholic": 0.3
        }

        resolved = resolver.resolve_conflicts(tags, weights)

        # Should keep anthemic (0.8) and upbeat (0.9)
        assert len(resolved) == 2
        assert "anthemic" in resolved
        assert "upbeat" in resolved
        assert "whisper" not in resolved
        assert "melancholic" not in resolved

    def test_resolve_conflicts_keeps_non_conflicting(self, resolver):
        """Test that non-conflicting tags are always kept."""
        tags = ["whisper", "anthemic", "pop", "female-vocal"]
        weights = {
            "whisper": 0.5,
            "anthemic": 0.8,
            "pop": 0.6,
            "female-vocal": 0.7
        }

        resolved = resolver.resolve_conflicts(tags, weights)

        # Should keep anthemic (0.8), pop (0.6), and female-vocal (0.7)
        # Should drop whisper (0.5, conflicts with anthemic)
        assert "anthemic" in resolved
        assert "pop" in resolved
        assert "female-vocal" in resolved
        assert "whisper" not in resolved

    def test_resolve_conflicts_deterministic(self, resolver):
        """Test conflict resolution is deterministic."""
        tags = ["whisper", "anthemic", "upbeat", "melancholic"]
        weights = {
            "whisper": 0.5,
            "anthemic": 0.8,
            "upbeat": 0.9,
            "melancholic": 0.3
        }

        # Resolve multiple times
        resolved1 = resolver.resolve_conflicts(tags, weights)
        resolved2 = resolver.resolve_conflicts(tags, weights)
        resolved3 = resolver.resolve_conflicts(tags, weights)

        # Should always produce same result
        assert resolved1 == resolved2
        assert resolved2 == resolved3

    def test_resolve_conflicts_preserves_original_case(self, resolver):
        """Test that resolved tags preserve original case."""
        tags = ["Whisper", "ANTHEMIC"]
        weights = {
            "Whisper": 0.5,
            "ANTHEMIC": 0.8
        }

        resolved = resolver.resolve_conflicts(tags, weights)

        # Should preserve original case
        assert "ANTHEMIC" in resolved

    def test_resolve_conflicts_empty_list(self, resolver):
        """Test resolving empty tag list."""
        tags = []

        resolved = resolver.resolve_conflicts(tags)

        assert resolved == []

    def test_resolve_conflicts_chain_conflicts(self):
        """Test resolving chain of conflicts (A conflicts with B, B with C)."""
        # Create custom conflict matrix
        conflicts = [
            {"tag_a": "a", "tag_b": "b"},
            {"tag_a": "b", "tag_b": "c"}
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(conflicts, f)
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)

            tags = ["a", "b", "c"]
            weights = {
                "a": 0.9,
                "b": 0.5,
                "c": 0.8
            }

            resolved = resolver.resolve_conflicts(tags, weights)

            # Should keep a (0.9) and c (0.8), drop b (0.5)
            assert "a" in resolved
            assert "c" in resolved
            assert "b" not in resolved
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_reload_conflict_matrix(self, temp_conflict_matrix):
        """Test reloading conflict matrix."""
        resolver = TagConflictResolver(conflict_matrix_path=temp_conflict_matrix)
        original_count = len(resolver.conflict_map)

        # Modify the file
        new_conflicts = [
            {"tag_a": "new1", "tag_b": "new2"}
        ]
        with open(temp_conflict_matrix, 'w') as f:
            json.dump(new_conflicts, f)

        # Reload
        success = resolver.reload_conflict_matrix()

        assert success is True
        assert len(resolver.conflict_map) != original_count
        assert "new1" in resolver.conflict_map
        assert "new2" in resolver.conflict_map

    def test_reload_conflict_matrix_failure(self):
        """Test reload handles file errors gracefully."""
        resolver = TagConflictResolver(conflict_matrix_path="/nonexistent/file.json")

        success = resolver.reload_conflict_matrix()

        # Reload succeeds even with missing file (creates empty map)
        assert success is True
        assert len(resolver.conflict_map) == 0

    def test_init_with_default_path(self):
        """Test initialization with default path."""
        # This will use the real conflict matrix file if it exists
        resolver = TagConflictResolver()

        # Should not raise exception
        assert isinstance(resolver.conflict_map, dict)

    def test_conflict_map_structure(self, resolver):
        """Test conflict map has correct structure."""
        # All keys should be strings
        assert all(isinstance(k, str) for k in resolver.conflict_map.keys())

        # All values should be sets of strings
        assert all(
            isinstance(v, set) and all(isinstance(item, str) for item in v)
            for v in resolver.conflict_map.values()
        )

    def test_find_conflicts_with_extra_spaces(self):
        """Test conflict detection with tags that have spaces."""
        conflicts = [
            {"tag_a": "heavy synth", "tag_b": "acoustic"}
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(conflicts, f)
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)

            tags = ["heavy synth", "acoustic"]
            conflicts = resolver.find_conflicts(tags)

            assert len(conflicts) == 1
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_load_conflict_matrix_invalid_format_not_list(self):
        """Test graceful handling of conflict matrix that's not a list."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump({"not": "a list"}, f)
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)
            assert resolver.conflict_map == {}
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_load_conflict_matrix_invalid_entry_not_dict(self):
        """Test handling of conflict entries that aren't dictionaries."""
        conflicts = [
            {"tag_a": "valid", "tag_b": "entry"},
            "invalid_entry",  # Not a dict
            ["also", "invalid"]
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(conflicts, f)
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)
            # Should only load the valid entry
            assert "valid" in resolver.conflict_map
            assert "entry" in resolver.conflict_map
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_load_conflict_matrix_missing_tag_fields(self):
        """Test handling of conflict entries missing tag_a or tag_b."""
        conflicts = [
            {"tag_a": "valid", "tag_b": "entry"},
            {"tag_a": "missing_tag_b"},  # Missing tag_b
            {"tag_b": "missing_tag_a"},  # Missing tag_a
            {}  # Missing both
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(conflicts, f)
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)
            # Should only load the valid entry
            assert "valid" in resolver.conflict_map
            assert "entry" in resolver.conflict_map
            assert "missing_tag_b" not in resolver.conflict_map
            assert "missing_tag_a" not in resolver.conflict_map
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_load_conflict_matrix_generic_exception(self):
        """Test handling of generic exceptions during matrix loading."""
        # Create a file with valid JSON but will cause issues during processing
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            # This will be valid JSON but might cause issues
            json.dump([{"tag_a": None, "tag_b": None}], f)
            temp_path = f.name

        try:
            # Should handle gracefully
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)
            # Entries with None values should be skipped
            assert isinstance(resolver.conflict_map, dict)
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_reload_conflict_matrix_invalid_file(self):
        """Test reload with invalid file path."""
        # Create resolver with valid file
        conflicts = [{"tag_a": "a", "tag_b": "b"}]
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(conflicts, f)
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)
            original_count = len(resolver.conflict_map)

            # Delete the file to cause reload to fail
            Path(temp_path).unlink()

            # Reload should succeed but create empty map
            success = resolver.reload_conflict_matrix()
            assert success is True
            assert len(resolver.conflict_map) == 0
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def test_all_tags_conflict_scenario(self):
        """Test scenario where all tags conflict with each other."""
        # Create conflict matrix where a->b, b->c, c->a (all conflict)
        conflicts = [
            {"tag_a": "a", "tag_b": "b"},
            {"tag_a": "b", "tag_b": "c"},
            {"tag_a": "c", "tag_b": "a"}
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(conflicts, f)
            temp_path = f.name

        try:
            resolver = TagConflictResolver(conflict_matrix_path=temp_path)

            tags = ["a", "b", "c"]
            weights = {
                "a": 0.5,
                "b": 0.3,
                "c": 0.7
            }

            resolved = resolver.resolve_conflicts(tags, weights)

            # Should only keep highest weight tag (c: 0.7)
            assert len(resolved) == 1
            assert "c" in resolved
        finally:
            Path(temp_path).unlink(missing_ok=True)
