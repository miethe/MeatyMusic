"""
Unit tests for determinism enforcement framework.

Tests verify that all determinism utilities work correctly and enforce
the reproducibility requirements for AMCS workflow skills.
"""

import pytest
import warnings
from datetime import datetime
from typing import List

from app.core.determinism import (
    SeededRandom,
    get_node_seed,
    hash_artifact,
    DecoderSettings,
    validate_decoder_settings,
    determinism_safe,
    print_determinism_checklist,
    DETERMINISM_CHECKLIST,
)


class TestSeededRandom:
    """Test SeededRandom class for deterministic random operations."""

    def test_init_valid_seed(self):
        """Test initialization with valid seed."""
        rng = SeededRandom(42)
        assert rng.seed == 42

    def test_init_zero_seed(self):
        """Test initialization with zero seed (valid edge case)."""
        rng = SeededRandom(0)
        assert rng.seed == 0

    def test_init_invalid_seed_negative(self):
        """Test initialization fails with negative seed."""
        with pytest.raises(ValueError, match="must be a non-negative integer"):
            SeededRandom(-1)

    def test_init_invalid_seed_non_integer(self):
        """Test initialization fails with non-integer seed."""
        with pytest.raises(ValueError, match="must be a non-negative integer"):
            SeededRandom(3.14)  # type: ignore

    def test_randint_deterministic(self):
        """Test that randint produces identical results with same seed."""
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = [rng1.randint(1, 100) for _ in range(10)]
        results2 = [rng2.randint(1, 100) for _ in range(10)]

        assert results1 == results2

    def test_randint_different_seeds(self):
        """Test that different seeds produce different results."""
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(43)

        results1 = [rng1.randint(1, 100) for _ in range(10)]
        results2 = [rng2.randint(1, 100) for _ in range(10)]

        # Should be different (probabilistically certain with 10 samples)
        assert results1 != results2

    def test_choice_deterministic(self):
        """Test that choice produces identical results with same seed."""
        options = ["a", "b", "c", "d", "e"]
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = [rng1.choice(options) for _ in range(10)]
        results2 = [rng2.choice(options) for _ in range(10)]

        assert results1 == results2

    def test_choices_deterministic(self):
        """Test that choices produces identical results with same seed."""
        population = ["a", "b", "c", "d", "e"]
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = rng1.choices(population, k=5)
        results2 = rng2.choices(population, k=5)

        assert results1 == results2

    def test_choices_with_weights(self):
        """Test that choices with weights is deterministic."""
        population = ["a", "b", "c"]
        weights = [0.5, 0.3, 0.2]
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = rng1.choices(population, weights=weights, k=10)
        results2 = rng2.choices(population, weights=weights, k=10)

        assert results1 == results2

    def test_shuffle_deterministic(self):
        """Test that shuffle produces identical results with same seed."""
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        items1 = list(range(10))
        items2 = list(range(10))

        rng1.shuffle(items1)
        rng2.shuffle(items2)

        assert items1 == items2

    def test_shuffle_returns_list(self):
        """Test that shuffle returns the shuffled list."""
        rng = SeededRandom(42)
        items = [1, 2, 3, 4, 5]
        result = rng.shuffle(items)

        assert result is items  # Returns same list object
        assert result != [1, 2, 3, 4, 5]  # Is shuffled

    def test_sample_deterministic(self):
        """Test that sample produces identical results with same seed."""
        population = list(range(20))
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = rng1.sample(population, k=5)
        results2 = rng2.sample(population, k=5)

        assert results1 == results2

    def test_sample_unique_elements(self):
        """Test that sample returns unique elements."""
        population = list(range(10))
        rng = SeededRandom(42)

        results = rng.sample(population, k=5)

        assert len(results) == 5
        assert len(set(results)) == 5  # All unique

    def test_random_deterministic(self):
        """Test that random produces identical results with same seed."""
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = [rng1.random() for _ in range(10)]
        results2 = [rng2.random() for _ in range(10)]

        assert results1 == results2

    def test_uniform_deterministic(self):
        """Test that uniform produces identical results with same seed."""
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = [rng1.uniform(0.0, 1.0) for _ in range(10)]
        results2 = [rng2.uniform(0.0, 1.0) for _ in range(10)]

        assert results1 == results2

    def test_gauss_deterministic(self):
        """Test that gauss produces identical results with same seed."""
        rng1 = SeededRandom(42)
        rng2 = SeededRandom(42)

        results1 = [rng1.gauss(0.0, 1.0) for _ in range(10)]
        results2 = [rng2.gauss(0.0, 1.0) for _ in range(10)]

        assert results1 == results2

    def test_ten_run_reproducibility(self):
        """Test 10-run reproducibility requirement (≥99%)."""
        seed = 42

        # Run 10 times and collect results
        all_results = []
        for _ in range(10):
            rng = SeededRandom(seed)
            results = [
                rng.randint(1, 100),
                rng.choice(["a", "b", "c"]),
                rng.random(),
            ]
            all_results.append(tuple(results))

        # All 10 runs should produce identical results
        assert len(set(all_results)) == 1, "All 10 runs must produce identical results"


class TestGetNodeSeed:
    """Test get_node_seed function for seed derivation."""

    def test_valid_derivation(self):
        """Test valid seed derivation."""
        assert get_node_seed(42, 1) == 43
        assert get_node_seed(42, 3) == 45
        assert get_node_seed(100, 8) == 108

    def test_zero_base_seed(self):
        """Test derivation with zero base seed (valid edge case)."""
        assert get_node_seed(0, 1) == 1
        assert get_node_seed(0, 10) == 10

    def test_invalid_base_seed_negative(self):
        """Test that negative base_seed raises ValueError."""
        with pytest.raises(ValueError, match="Invalid base_seed"):
            get_node_seed(-1, 1)

    def test_invalid_base_seed_non_integer(self):
        """Test that non-integer base_seed raises ValueError."""
        with pytest.raises(ValueError, match="Invalid base_seed"):
            get_node_seed(3.14, 1)  # type: ignore

    def test_invalid_node_index_zero(self):
        """Test that node_index=0 raises ValueError."""
        with pytest.raises(ValueError, match="Invalid node_index"):
            get_node_seed(42, 0)

    def test_invalid_node_index_negative(self):
        """Test that negative node_index raises ValueError."""
        with pytest.raises(ValueError, match="Invalid node_index"):
            get_node_seed(42, -1)

    def test_invalid_node_index_non_integer(self):
        """Test that non-integer node_index raises ValueError."""
        with pytest.raises(ValueError, match="Invalid node_index"):
            get_node_seed(42, 1.5)  # type: ignore

    def test_deterministic_across_multiple_calls(self):
        """Test that derivation is deterministic."""
        results1 = [get_node_seed(42, i) for i in range(1, 9)]
        results2 = [get_node_seed(42, i) for i in range(1, 9)]

        assert results1 == results2

    def test_different_base_seeds_different_results(self):
        """Test that different base seeds produce different derived seeds."""
        seed1 = get_node_seed(42, 1)
        seed2 = get_node_seed(100, 1)

        assert seed1 != seed2


class TestHashArtifact:
    """Test hash_artifact function for provenance tracking."""

    def test_hash_string(self):
        """Test hashing a string."""
        result = hash_artifact("test string")
        assert result.startswith("sha256:")
        assert len(result) == 71  # "sha256:" + 64 hex chars

    def test_hash_string_deterministic(self):
        """Test that same string produces same hash."""
        hash1 = hash_artifact("test string")
        hash2 = hash_artifact("test string")

        assert hash1 == hash2

    def test_hash_different_strings(self):
        """Test that different strings produce different hashes."""
        hash1 = hash_artifact("string1")
        hash2 = hash_artifact("string2")

        assert hash1 != hash2

    def test_hash_dict(self):
        """Test hashing a dictionary."""
        artifact = {"key": "value", "another": "field"}
        result = hash_artifact(artifact)

        assert result.startswith("sha256:")
        assert len(result) == 71

    def test_hash_dict_deterministic(self):
        """Test that same dict produces same hash."""
        artifact = {"key": "value", "another": "field"}
        hash1 = hash_artifact(artifact)
        hash2 = hash_artifact(artifact)

        assert hash1 == hash2

    def test_hash_dict_key_order_independent(self):
        """Test that dict key order doesn't affect hash (sorted JSON)."""
        dict1 = {"key": "value", "another": "field"}
        dict2 = {"another": "field", "key": "value"}

        hash1 = hash_artifact(dict1)
        hash2 = hash_artifact(dict2)

        assert hash1 == hash2

    def test_hash_nested_dict(self):
        """Test hashing nested dictionaries."""
        artifact = {
            "outer": {
                "inner": "value",
                "list": [1, 2, 3]
            },
            "another": "field"
        }
        result = hash_artifact(artifact)

        assert result.startswith("sha256:")

    def test_hash_bytes(self):
        """Test hashing bytes."""
        data = b"binary data"
        result = hash_artifact(data)

        assert result.startswith("sha256:")
        assert len(result) == 71

    def test_hash_bytes_deterministic(self):
        """Test that same bytes produce same hash."""
        data = b"binary data"
        hash1 = hash_artifact(data)
        hash2 = hash_artifact(data)

        assert hash1 == hash2

    def test_hash_invalid_type(self):
        """Test that invalid types raise TypeError."""
        with pytest.raises(TypeError, match="must be dict, str, or bytes"):
            hash_artifact(123)  # type: ignore

        with pytest.raises(TypeError, match="must be dict, str, or bytes"):
            hash_artifact([1, 2, 3])  # type: ignore

    def test_hash_unicode_string(self):
        """Test hashing unicode strings."""
        unicode_str = "Hello 世界 🎵"
        result = hash_artifact(unicode_str)

        assert result.startswith("sha256:")

    def test_hash_unicode_deterministic(self):
        """Test that unicode strings hash deterministically."""
        unicode_str = "Hello 世界 🎵"
        hash1 = hash_artifact(unicode_str)
        hash2 = hash_artifact(unicode_str)

        assert hash1 == hash2

    def test_ten_run_reproducibility(self):
        """Test 10-run reproducibility for hashing."""
        artifact = {"key": "value", "data": [1, 2, 3]}

        hashes = [hash_artifact(artifact) for _ in range(10)]

        # All 10 hashes should be identical
        assert len(set(hashes)) == 1, "All 10 hash computations must be identical"


class TestDecoderSettings:
    """Test DecoderSettings class for LLM parameter validation."""

    def test_init_defaults(self):
        """Test initialization with default values."""
        settings = DecoderSettings()

        assert settings.temperature == 0.3
        assert settings.top_p == 0.9
        assert settings.max_tokens is None
        assert settings.seed is None

    def test_init_custom_values(self):
        """Test initialization with custom values."""
        settings = DecoderSettings(
            temperature=0.2,
            top_p=0.95,
            max_tokens=1000,
            seed=42
        )

        assert settings.temperature == 0.2
        assert settings.top_p == 0.95
        assert settings.max_tokens == 1000
        assert settings.seed == 42

    def test_temperature_validation_negative(self):
        """Test that negative temperature raises ValueError."""
        with pytest.raises(ValueError, match="temperature must be 0.0-1.0"):
            DecoderSettings(temperature=-0.1)

    def test_temperature_validation_too_high(self):
        """Test that temperature > 1.0 raises ValueError."""
        with pytest.raises(ValueError, match="temperature must be 0.0-1.0"):
            DecoderSettings(temperature=1.5)

    def test_temperature_warning_high(self):
        """Test that temperature > 0.3 emits warning."""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            DecoderSettings(temperature=0.8)

            assert len(w) == 1
            assert "may reduce determinism" in str(w[0].message)

    def test_temperature_no_warning_low(self):
        """Test that temperature ≤ 0.3 doesn't emit warning."""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            DecoderSettings(temperature=0.3)

            # Should be no warnings for temperature=0.3
            determinism_warnings = [
                warning for warning in w
                if "determinism" in str(warning.message)
            ]
            assert len(determinism_warnings) == 0

    def test_top_p_validation_negative(self):
        """Test that negative top_p raises ValueError."""
        with pytest.raises(ValueError, match="top_p must be 0.0-1.0"):
            DecoderSettings(top_p=-0.1)

    def test_top_p_validation_too_high(self):
        """Test that top_p > 1.0 raises ValueError."""
        with pytest.raises(ValueError, match="top_p must be 0.0-1.0"):
            DecoderSettings(top_p=1.5)

    def test_max_tokens_validation_zero(self):
        """Test that max_tokens=0 raises ValueError."""
        with pytest.raises(ValueError, match="max_tokens must be positive"):
            DecoderSettings(max_tokens=0)

    def test_max_tokens_validation_negative(self):
        """Test that negative max_tokens raises ValueError."""
        with pytest.raises(ValueError, match="max_tokens must be positive"):
            DecoderSettings(max_tokens=-100)

    def test_seed_validation_negative(self):
        """Test that negative seed raises ValueError."""
        with pytest.raises(ValueError, match="seed must be non-negative integer"):
            DecoderSettings(seed=-1)

    def test_seed_validation_non_integer(self):
        """Test that non-integer seed raises ValueError."""
        with pytest.raises(ValueError, match="seed must be non-negative integer"):
            DecoderSettings(seed=3.14)  # type: ignore

    def test_to_dict(self):
        """Test conversion to dictionary."""
        settings = DecoderSettings(
            temperature=0.2,
            top_p=0.95,
            max_tokens=1000,
            seed=42
        )

        result = settings.to_dict()

        assert result == {
            "temperature": 0.2,
            "top_p": 0.95,
            "max_tokens": 1000,
            "seed": 42
        }

    def test_to_dict_with_none_values(self):
        """Test to_dict includes None values."""
        settings = DecoderSettings(temperature=0.2)

        result = settings.to_dict()

        assert result["max_tokens"] is None
        assert result["seed"] is None

    def test_repr(self):
        """Test string representation."""
        settings = DecoderSettings(temperature=0.2, seed=42)
        repr_str = repr(settings)

        assert "DecoderSettings" in repr_str
        assert "temperature=0.2" in repr_str
        assert "seed=42" in repr_str


class TestValidateDecoderSettings:
    """Test validate_decoder_settings function."""

    def test_valid_settings(self):
        """Test that valid settings return True."""
        assert validate_decoder_settings(0.2, 0.9) is True
        assert validate_decoder_settings(0.0, 0.0) is True
        assert validate_decoder_settings(1.0, 1.0) is True

    def test_valid_settings_with_warning(self):
        """Test that high temperature returns True but emits warning."""
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            result = validate_decoder_settings(0.8, 0.9)

            assert result is True
            assert len(w) == 1
            assert "may reduce determinism" in str(w[0].message)

    def test_invalid_temperature(self):
        """Test that invalid temperature returns False."""
        assert validate_decoder_settings(-0.1, 0.9) is False
        assert validate_decoder_settings(1.5, 0.9) is False

    def test_invalid_top_p(self):
        """Test that invalid top_p returns False."""
        assert validate_decoder_settings(0.2, -0.1) is False
        assert validate_decoder_settings(0.2, 1.5) is False


class TestDeterminismSafeDecorator:
    """Test @determinism_safe decorator for detecting violations."""

    def test_clean_function_no_warnings(self):
        """Test that deterministic function produces no warnings."""
        @determinism_safe
        def clean_function(seed: int) -> int:
            rng = SeededRandom(seed)
            return rng.randint(1, 10)

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            result = clean_function(42)

            assert result == 2  # Deterministic result
            # No warnings for clean function
            assert len(w) == 0

    def test_datetime_now_violation(self):
        """Test that datetime.now() triggers warning."""
        @determinism_safe
        def bad_function() -> str:
            return datetime.now().isoformat()

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            bad_function()

            assert len(w) >= 1
            warning_messages = [str(warning.message) for warning in w]
            assert any("datetime.now()" in msg for msg in warning_messages)

    def test_datetime_utcnow_violation(self):
        """Test that datetime.utcnow() triggers warning."""
        @determinism_safe
        def bad_function() -> str:
            return datetime.utcnow().isoformat()

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            bad_function()

            assert len(w) >= 1
            warning_messages = [str(warning.message) for warning in w]
            assert any("datetime.utcnow()" in msg for msg in warning_messages)

    def test_multiple_violations(self):
        """Test that multiple violations are detected."""
        @determinism_safe
        def very_bad_function() -> List[str]:
            return [
                datetime.now().isoformat(),
                datetime.utcnow().isoformat(),
            ]

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            very_bad_function()

            # Should have warnings for both violations + summary
            assert len(w) >= 2

    def test_decorator_preserves_function_metadata(self):
        """Test that decorator preserves function name and docstring."""
        @determinism_safe
        def my_function():
            """My docstring."""
            pass

        assert my_function.__name__ == "my_function"
        assert my_function.__doc__ == "My docstring."

    def test_decorator_with_args_and_kwargs(self):
        """Test that decorator works with various function signatures."""
        @determinism_safe
        def function_with_args(a: int, b: str, c: float = 1.0) -> str:
            return f"{a}-{b}-{c}"

        result = function_with_args(1, "test", c=2.5)
        assert result == "1-test-2.5"

    def test_decorator_restores_datetime(self):
        """Test that datetime methods are restored after function call."""
        original_now = datetime.now
        original_utcnow = datetime.utcnow

        @determinism_safe
        def some_function():
            pass

        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            some_function()

        # Datetime methods should be restored
        assert datetime.now is original_now
        assert datetime.utcnow is original_utcnow

    def test_decorator_restores_datetime_on_exception(self):
        """Test that datetime methods are restored even if function raises."""
        original_now = datetime.now
        original_utcnow = datetime.utcnow

        @determinism_safe
        def failing_function():
            raise ValueError("Test error")

        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            try:
                failing_function()
            except ValueError:
                pass

        # Datetime methods should still be restored
        assert datetime.now is original_now
        assert datetime.utcnow is original_utcnow


class TestDeterminismChecklist:
    """Test determinism checklist functionality."""

    def test_checklist_constant_exists(self):
        """Test that DETERMINISM_CHECKLIST constant exists."""
        assert isinstance(DETERMINISM_CHECKLIST, str)
        assert len(DETERMINISM_CHECKLIST) > 0

    def test_checklist_contains_all_points(self):
        """Test that checklist contains all 10 points."""
        for i in range(1, 11):
            assert f"☐ {i}." in DETERMINISM_CHECKLIST

    def test_checklist_contains_key_terms(self):
        """Test that checklist mentions key determinism concepts."""
        key_terms = [
            "seed",
            "SeededRandom",
            "temperature",
            "datetime",
            "hash",
            "deterministic",
        ]

        for term in key_terms:
            assert term.lower() in DETERMINISM_CHECKLIST.lower()

    def test_print_checklist_runs(self):
        """Test that print_determinism_checklist runs without error."""
        # Should not raise any exceptions
        print_determinism_checklist()


class TestIntegrationDeterminism:
    """Integration tests for complete determinism workflow."""

    def test_complete_workflow_deterministic(self):
        """
        Test that a complete workflow using all utilities is deterministic.

        Simulates a simplified skill execution with:
        - Seed derivation
        - Random operations
        - Artifact hashing
        """
        def simulate_skill(base_seed: int, node_index: int) -> dict:
            # Derive seed for this node
            seed = get_node_seed(base_seed, node_index)

            # Use deterministic random operations
            rng = SeededRandom(seed)
            random_choice = rng.choice(["option1", "option2", "option3"])
            random_number = rng.randint(1, 100)

            # Build artifact
            artifact = {
                "choice": random_choice,
                "number": random_number,
                "node_index": node_index,
            }

            # Hash artifact for provenance
            artifact_hash = hash_artifact(artifact)

            return {
                "artifact": artifact,
                "hash": artifact_hash,
            }

        # Run 10 times with same inputs
        base_seed = 42
        node_index = 3  # LYRICS node

        results = [simulate_skill(base_seed, node_index) for _ in range(10)]

        # All results should be identical
        hashes = [r["hash"] for r in results]
        assert len(set(hashes)) == 1, "All 10 runs must produce identical hashes"

        artifacts = [str(r["artifact"]) for r in results]
        assert len(set(artifacts)) == 1, "All 10 runs must produce identical artifacts"

    def test_different_nodes_different_results(self):
        """Test that different nodes produce different results."""
        base_seed = 42

        def simulate_skill(node_index: int) -> str:
            seed = get_node_seed(base_seed, node_index)
            rng = SeededRandom(seed)
            artifact = {"result": rng.randint(1, 1000)}
            return hash_artifact(artifact)

        # Different nodes should produce different results
        hash_plan = simulate_skill(1)
        hash_style = simulate_skill(2)
        hash_lyrics = simulate_skill(3)

        assert hash_plan != hash_style
        assert hash_style != hash_lyrics
        assert hash_plan != hash_lyrics

    def test_llm_decoder_settings_integration(self):
        """Test using decoder settings in simulated LLM call."""
        seed = 42

        # Create deterministic decoder settings
        settings = DecoderSettings(
            temperature=0.2,
            top_p=0.9,
            max_tokens=500,
            seed=seed
        )

        # Simulate LLM call preparation
        llm_params = settings.to_dict()

        assert llm_params["temperature"] == 0.2
        assert llm_params["seed"] == seed
        assert validate_decoder_settings(
            llm_params["temperature"],
            llm_params["top_p"]
        )

    def test_full_skill_simulation_with_decorator(self):
        """Test complete skill with @determinism_safe decorator."""
        @determinism_safe
        def lyrics_skill(base_seed: int, input_data: dict) -> dict:
            """Simulated LYRICS skill."""
            # Derive seed
            seed = get_node_seed(base_seed, node_index=3)

            # Random operations
            rng = SeededRandom(seed)
            line_count = rng.randint(8, 16)

            # Build artifact
            artifact = {
                "lines": line_count,
                "input": input_data,
            }

            # Hash for provenance
            artifact_hash = hash_artifact(artifact)

            return {
                "artifact": artifact,
                "hash": artifact_hash,
                "seed": seed,
            }

        # Run multiple times
        results = [
            lyrics_skill(42, {"theme": "love"})
            for _ in range(10)
        ]

        # All should be identical
        hashes = [r["hash"] for r in results]
        assert len(set(hashes)) == 1

    def test_reproducibility_target_met(self):
        """
        Test that ≥99% reproducibility target is met.

        With deterministic implementation, we should achieve 100% reproducibility.
        """
        base_seed = 42
        node_index = 5

        def complex_skill() -> str:
            seed = get_node_seed(base_seed, node_index)
            rng = SeededRandom(seed)

            # Multiple random operations
            artifact = {
                "int": rng.randint(1, 1000),
                "choice": rng.choice(list("abcdefghijklmnopqrstuvwxyz")),
                "sample": rng.sample(range(100), k=10),
                "float": rng.random(),
            }

            return hash_artifact(artifact)

        # Run 100 times to verify high reproducibility
        results = [complex_skill() for _ in range(100)]

        # Calculate reproducibility rate
        unique_results = len(set(results))
        reproducibility_rate = (100 - unique_results + 1) / 100

        # Should achieve 100% (only 1 unique result)
        assert reproducibility_rate >= 0.99, (
            f"Reproducibility rate {reproducibility_rate:.2%} < 99% target"
        )
        assert unique_results == 1, "Should have only 1 unique result (100% reproducibility)"
