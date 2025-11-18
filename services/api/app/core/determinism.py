"""
Determinism Enforcement Framework for AMCS Workflow Skills

This module provides utilities to ensure that all workflow skills produce
identical outputs when given identical inputs and seeds. This is critical
for reproducibility, debugging, and audit trails.

Key Components:
- SeededRandom: Deterministic random number generation
- get_node_seed: Derive per-node seeds from base seed
- hash_artifact: SHA-256 hashing for provenance
- DecoderSettings: Validated LLM parameters
- @determinism_safe: Decorator to detect non-deterministic patterns

Usage Example:
    from app.core.determinism import SeededRandom, get_node_seed, hash_artifact

    def my_skill(input: SkillInput) -> SkillOutput:
        # Get deterministic seed for this node
        seed = get_node_seed(input.context.seed, node_index=3)  # LYRICS=3
        rng = SeededRandom(seed)

        # Use deterministic random operations
        choice = rng.choice(["option1", "option2"])

        # Hash output for provenance
        artifact = {"result": choice}
        artifact_hash = hash_artifact(artifact)

        return SkillOutput(
            status="success",
            artifact_hash=artifact_hash,
            ...
        )

Determinism Requirements:
- ≥99% reproducibility across 10 runs with same input + seed
- No datetime.now() or datetime.utcnow() calls
- No unseeded random operations
- All database queries deterministically ordered
- LLM calls use temperature ≤ 0.3 and seed

See: docs/determinism_requirements.md for full details
"""

import functools
import hashlib
import json
import random
import warnings
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Sequence, TypeVar, Union

__all__ = [
    "SeededRandom",
    "get_node_seed",
    "hash_artifact",
    "DecoderSettings",
    "validate_decoder_settings",
    "determinism_safe",
    "print_determinism_checklist",
    "DETERMINISM_CHECKLIST",
]

# Type variable for generic typing
T = TypeVar("T")


class SeededRandom:
    """
    Deterministic random number generator for AMCS workflow skills.

    Wraps Python's random.Random with a fixed seed to ensure reproducible
    random operations across multiple runs.

    Attributes:
        seed: The seed value used to initialize this RNG

    Example:
        >>> rng = SeededRandom(42)
        >>> rng.randint(1, 10)
        2
        >>> rng2 = SeededRandom(42)
        >>> rng2.randint(1, 10)  # Same as rng
        2
        >>> rng.choice(["a", "b", "c"])
        'b'
    """

    def __init__(self, seed: int):
        """
        Initialize a deterministic random number generator.

        Args:
            seed: Integer seed value (must be >= 0)

        Raises:
            ValueError: If seed is not a valid integer >= 0
        """
        if not isinstance(seed, int) or seed < 0:
            raise ValueError(f"seed must be a non-negative integer, got {seed}")

        self._seed = seed
        self._rng = random.Random(seed)

    @property
    def seed(self) -> int:
        """Return the seed used to initialize this RNG."""
        return self._seed

    def randint(self, a: int, b: int) -> int:
        """
        Return random integer in range [a, b], including both endpoints.

        Args:
            a: Lower bound (inclusive)
            b: Upper bound (inclusive)

        Returns:
            Random integer between a and b

        Example:
            >>> rng = SeededRandom(42)
            >>> rng.randint(1, 10)
            2
        """
        return self._rng.randint(a, b)

    def choice(self, seq: Sequence[T]) -> T:
        """
        Return a random element from non-empty sequence.

        Args:
            seq: Non-empty sequence to choose from

        Returns:
            Random element from seq

        Raises:
            IndexError: If seq is empty

        Example:
            >>> rng = SeededRandom(42)
            >>> rng.choice(["a", "b", "c"])
            'c'
        """
        return self._rng.choice(seq)

    def choices(
        self,
        population: Sequence[T],
        weights: Optional[Sequence[float]] = None,
        k: int = 1
    ) -> List[T]:
        """
        Return k random elements from population with optional weights.

        Args:
            population: Sequence to sample from
            weights: Optional relative weights for each element
            k: Number of elements to choose

        Returns:
            List of k random elements (with replacement)

        Example:
            >>> rng = SeededRandom(42)
            >>> rng.choices(["a", "b", "c"], k=2)
            ['c', 'a']
        """
        return self._rng.choices(population, weights=weights, k=k)

    def shuffle(self, seq: List[T]) -> List[T]:
        """
        Shuffle sequence in-place and return it.

        Args:
            seq: List to shuffle (modified in place)

        Returns:
            The same list, shuffled

        Example:
            >>> rng = SeededRandom(42)
            >>> items = [1, 2, 3, 4, 5]
            >>> rng.shuffle(items)
            [3, 1, 4, 2, 5]
        """
        self._rng.shuffle(seq)
        return seq

    def sample(self, population: Sequence[T], k: int) -> List[T]:
        """
        Return k unique random elements from population.

        Args:
            population: Sequence to sample from
            k: Number of unique elements to choose

        Returns:
            List of k unique random elements (without replacement)

        Raises:
            ValueError: If k > len(population)

        Example:
            >>> rng = SeededRandom(42)
            >>> rng.sample([1, 2, 3, 4, 5], k=3)
            [4, 1, 5]
        """
        return self._rng.sample(population, k)

    def random(self) -> float:
        """
        Return random float in range [0.0, 1.0).

        Returns:
            Random float between 0.0 (inclusive) and 1.0 (exclusive)

        Example:
            >>> rng = SeededRandom(42)
            >>> rng.random()
            0.6394267984578837
        """
        return self._rng.random()

    def uniform(self, a: float, b: float) -> float:
        """
        Return random float in range [a, b] or [b, a].

        Args:
            a: Lower or upper bound
            b: Upper or lower bound

        Returns:
            Random float between a and b

        Example:
            >>> rng = SeededRandom(42)
            >>> rng.uniform(1.0, 10.0)
            6.394267984578837
        """
        return self._rng.uniform(a, b)

    def gauss(self, mu: float, sigma: float) -> float:
        """
        Return random number from Gaussian distribution.

        Args:
            mu: Mean of distribution
            sigma: Standard deviation of distribution

        Returns:
            Random float from Gaussian distribution

        Example:
            >>> rng = SeededRandom(42)
            >>> rng.gauss(0.0, 1.0)
            0.8835562628144864
        """
        return self._rng.gauss(mu, sigma)


def get_node_seed(base_seed: int, node_index: int) -> int:
    """
    Derive deterministic seed for workflow node.

    Each workflow node (PLAN=1, STYLE=2, LYRICS=3, etc.) should use a derived
    seed to ensure independent but reproducible randomness.

    Args:
        base_seed: Base seed from WorkflowContext (must be >= 0)
        node_index: Node position in workflow (1=PLAN, 2=STYLE, 3=LYRICS, ...)
                   Must be >= 1

    Returns:
        Derived seed for this specific node (base_seed + node_index)

    Raises:
        ValueError: If base_seed or node_index are invalid

    Example:
        >>> get_node_seed(42, 1)  # PLAN skill
        43
        >>> get_node_seed(42, 3)  # LYRICS skill
        45
        >>> get_node_seed(100, 8)  # REVIEW skill
        108
    """
    if not isinstance(base_seed, int) or base_seed < 0:
        raise ValueError(f"Invalid base_seed: {base_seed} (must be int >= 0)")
    if not isinstance(node_index, int) or node_index < 1:
        raise ValueError(f"Invalid node_index: {node_index} (must be int >= 1)")

    return base_seed + node_index


def hash_artifact(artifact: Union[Dict[str, Any], str, bytes]) -> str:
    """
    Compute SHA-256 hash of artifact for provenance tracking.

    Handles different input types:
    - dict: Converts to sorted JSON for deterministic key order
    - str: Hashes string directly as UTF-8
    - bytes: Hashes bytes directly

    Args:
        artifact: Dictionary, string, or bytes to hash

    Returns:
        SHA-256 hash as hex string with 'sha256:' prefix

    Example:
        >>> hash_artifact({"key": "value", "another": "field"})
        'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c'
        >>> hash_artifact("test string")
        'sha256:d5579c46dfcc7f18207013e65b44e4cb4e2c2298f4ac457ba8f82743f31e930b'
        >>> # Same dict, different key order -> same hash
        >>> hash_artifact({"another": "field", "key": "value"})
        'sha256:b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c'
    """
    if isinstance(artifact, dict):
        # Sort keys for deterministic JSON serialization
        content = json.dumps(artifact, sort_keys=True, ensure_ascii=False)
        content_bytes = content.encode('utf-8')
    elif isinstance(artifact, str):
        content_bytes = artifact.encode('utf-8')
    elif isinstance(artifact, bytes):
        content_bytes = artifact
    else:
        raise TypeError(
            f"artifact must be dict, str, or bytes, got {type(artifact)}"
        )

    hash_obj = hashlib.sha256(content_bytes)
    return f"sha256:{hash_obj.hexdigest()}"


class DecoderSettings:
    """
    Validated settings for LLM calls to ensure determinism.

    Enforces constraints on temperature and other parameters to maintain
    reproducibility across multiple runs.

    Attributes:
        temperature: Sampling temperature (0.0-1.0, recommended ≤ 0.3)
        top_p: Nucleus sampling parameter (0.0-1.0)
        max_tokens: Maximum tokens to generate (optional)
        seed: Random seed for LLM sampling (optional but recommended)

    Example:
        >>> settings = DecoderSettings(temperature=0.2, top_p=0.9, seed=42)
        >>> settings.to_dict()
        {'temperature': 0.2, 'top_p': 0.9, 'max_tokens': None, 'seed': 42}

        >>> # Warning for high temperature
        >>> risky = DecoderSettings(temperature=0.8)
        UserWarning: temperature=0.8 > 0.3 may reduce determinism
    """

    def __init__(
        self,
        temperature: float = 0.3,
        top_p: float = 0.9,
        max_tokens: Optional[int] = None,
        seed: Optional[int] = None
    ):
        """
        Initialize decoder settings with validation.

        Args:
            temperature: Sampling temperature (0.0-1.0, recommended ≤ 0.3)
            top_p: Nucleus sampling parameter (0.0-1.0)
            max_tokens: Maximum tokens to generate
            seed: Random seed for LLM sampling

        Raises:
            ValueError: If temperature or top_p are out of valid range

        Warnings:
            UserWarning: If temperature > 0.3 (may reduce determinism)
        """
        if temperature < 0 or temperature > 1:
            raise ValueError(
                f"temperature must be 0.0-1.0, got {temperature}"
            )
        if temperature > 0.3:
            warnings.warn(
                f"temperature={temperature} > 0.3 may reduce determinism. "
                f"Consider using temperature ≤ 0.3 for maximum reproducibility.",
                UserWarning,
                stacklevel=2
            )

        if top_p < 0 or top_p > 1:
            raise ValueError(
                f"top_p must be 0.0-1.0, got {top_p}"
            )

        if max_tokens is not None and max_tokens <= 0:
            raise ValueError(
                f"max_tokens must be positive, got {max_tokens}"
            )

        if seed is not None and (not isinstance(seed, int) or seed < 0):
            raise ValueError(
                f"seed must be non-negative integer or None, got {seed}"
            )

        self.temperature = temperature
        self.top_p = top_p
        self.max_tokens = max_tokens
        self.seed = seed

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert settings to dictionary for API calls.

        Returns:
            Dictionary with all non-None settings

        Example:
            >>> DecoderSettings(temperature=0.2, seed=42).to_dict()
            {'temperature': 0.2, 'top_p': 0.9, 'max_tokens': None, 'seed': 42}
        """
        return {
            "temperature": self.temperature,
            "top_p": self.top_p,
            "max_tokens": self.max_tokens,
            "seed": self.seed
        }

    def __repr__(self) -> str:
        """Return string representation of settings."""
        return (
            f"DecoderSettings(temperature={self.temperature}, "
            f"top_p={self.top_p}, max_tokens={self.max_tokens}, "
            f"seed={self.seed})"
        )


def validate_decoder_settings(temperature: float, top_p: float) -> bool:
    """
    Validate that decoder settings are suitable for determinism.

    Returns True if settings are deterministic-safe, False otherwise.
    Issues warnings for borderline settings (temperature > 0.3).

    Args:
        temperature: Sampling temperature (0.0-1.0)
        top_p: Nucleus sampling parameter (0.0-1.0)

    Returns:
        True if settings are valid, False if out of range

    Example:
        >>> validate_decoder_settings(0.2, 0.9)
        True
        >>> validate_decoder_settings(0.5, 0.9)  # Warning but valid
        UserWarning: temperature=0.5 > 0.3 may reduce determinism
        True
        >>> validate_decoder_settings(1.5, 0.9)  # Invalid
        False
    """
    try:
        DecoderSettings(temperature=temperature, top_p=top_p)
        return True
    except ValueError:
        return False


def determinism_safe(func: Callable) -> Callable:
    """
    Decorator to mark and validate deterministic functions.

    Monitors function execution to detect common non-deterministic patterns:
    - datetime.now() or datetime.utcnow() calls (use input timestamps instead)
    - Other time-dependent operations

    Note: This decorator provides runtime warnings but does not prevent
    non-deterministic behavior. It's a development aid for catching issues early.

    Usage:
        @determinism_safe
        def my_skill_function(input: SkillInput) -> SkillOutput:
            # Implementation must be deterministic
            # - Use SeededRandom for randomness
            # - Use input timestamps, not datetime.now()
            # - Order all database queries deterministically
            pass

    Example:
        >>> @determinism_safe
        ... def good_function(seed: int) -> int:
        ...     rng = SeededRandom(seed)
        ...     return rng.randint(1, 10)
        >>> good_function(42)  # No warnings
        2

        >>> @determinism_safe
        ... def bad_function() -> str:
        ...     return datetime.now().isoformat()
        >>> bad_function()  # Emits warning
        UserWarning: bad_function called datetime.now() - use input timestamps
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Store original datetime methods to detect violations
        original_now = datetime.now
        original_utcnow = datetime.utcnow

        violation_detected = False
        violation_messages = []

        def now_violation(*args, **kwargs):
            nonlocal violation_detected
            violation_detected = True
            msg = (
                f"{func.__name__} called datetime.now() - "
                f"use input timestamps for determinism"
            )
            violation_messages.append(msg)
            warnings.warn(msg, UserWarning, stacklevel=2)
            return original_now(*args, **kwargs)

        def utcnow_violation(*args, **kwargs):
            nonlocal violation_detected
            violation_detected = True
            msg = (
                f"{func.__name__} called datetime.utcnow() - "
                f"use input timestamps for determinism"
            )
            violation_messages.append(msg)
            warnings.warn(msg, UserWarning, stacklevel=2)
            return original_utcnow(*args, **kwargs)

        # Monkey-patch datetime methods to detect violations
        datetime.now = now_violation
        datetime.utcnow = utcnow_violation

        try:
            result = func(*args, **kwargs)
            if violation_detected:
                warnings.warn(
                    f"{func.__name__} may not be deterministic - "
                    f"review datetime usage. Violations: {len(violation_messages)}",
                    UserWarning,
                    stacklevel=2
                )
            return result
        finally:
            # Restore originals
            datetime.now = original_now
            datetime.utcnow = original_utcnow

    return wrapper


# 10-Point Determinism Checklist for developers
DETERMINISM_CHECKLIST = """
10-Point Determinism Checklist for AMCS Skills
===============================================

Before completing a skill implementation, verify:

☐ 1. Seed Propagation: Skill receives seed from WorkflowContext
☐ 2. Derived Seeds: Use get_node_seed(base_seed, node_index) for this skill
☐ 3. Random Operations: All randomness uses SeededRandom(seed)
☐ 4. LLM Calls: temperature ≤ 0.3, top_p ≤ 0.9, seed provided
☐ 5. No Datetime: No datetime.now() or datetime.utcnow() - use input timestamps
☐ 6. Ordered Retrieval: Database/source queries must be deterministically ordered (e.g., ORDER BY id)
☐ 7. Sorted Iteration: When iterating dicts, use sorted(dict.items()) for consistent order
☐ 8. No Floating-Point Math: Avoid non-deterministic float operations (or use fixed precision)
☐ 9. Hash Outputs: Call hash_artifact() on all outputs for provenance
☐ 10. Test: 10-run determinism test passes (all hashes identical)

If any checklist item fails, the skill is NOT deterministic.

Additional Guidelines:
- Use decimal.Decimal for precise decimal arithmetic
- Avoid operations that depend on iteration order of sets or unsorted dicts
- All external data sources must be versioned and pinned
- Random sampling from databases must use deterministic ordering
- No dependency on system time, timezone, or locale
- No threading or async operations without careful coordination

Target: ≥99% reproducibility across 10 runs with same input + seed
"""


def print_determinism_checklist() -> None:
    """
    Print the 10-point determinism checklist for developers.

    This function is useful during development to remind developers of
    the key requirements for deterministic workflow skills.

    Example:
        >>> print_determinism_checklist()
        10-Point Determinism Checklist for AMCS Skills
        ===============================================
        ...
    """
    print(DETERMINISM_CHECKLIST)
