"""Determinism tests for SourceService.

Validates that SourceService meets AMCS determinism requirements:
- Same query + seed → same chunks (99%+ reproducibility)
- Content hash stability
- Pinned retrieval by hash
"""

import pytest
from uuid import uuid4

from app.services.source_service import SourceService
from app.schemas.source import SourceCreate, SourceKind


@pytest.mark.asyncio
class TestSourceServiceDeterminism:
    """Test deterministic behavior of SourceService."""

    async def test_retrieve_chunks_deterministic_with_seed(
        self,
        source_service: SourceService,
        test_source_id: str
    ):
        """Test that same query + seed produces same chunks.

        CRITICAL: This test validates the core determinism guarantee.
        Same inputs MUST produce identical outputs for reproducibility.
        """
        query = "music theory chord progressions"
        top_k = 5
        seed = 42

        # Retrieve chunks multiple times with same seed
        results = []
        for _ in range(10):
            chunks = await source_service.retrieve_chunks(
                source_id=test_source_id,
                query=query,
                top_k=top_k,
                seed=seed  # Same seed!
            )
            results.append(chunks)

        # Validate all results are identical
        first_result = results[0]
        for i, result in enumerate(results[1:], start=1):
            assert len(result) == len(first_result), \
                f"Run {i}: Different chunk count"

            for j, (chunk1, chunk2) in enumerate(zip(first_result, result)):
                assert chunk1.text == chunk2.text, \
                    f"Run {i}, Chunk {j}: Different text"
                assert chunk1.content_hash == chunk2.content_hash, \
                    f"Run {i}, Chunk {j}: Different hash"
                assert chunk1.score == chunk2.score, \
                    f"Run {i}, Chunk {j}: Different score"

        print(f"✓ Determinism test passed: 10 runs with seed={seed}")
        print(f"  Chunk count: {len(first_result)}")
        print(f"  First hash: {first_result[0].content_hash[:16]}...")

    async def test_content_hash_stability(
        self,
        source_service: SourceService
    ):
        """Test that content hashes are stable and collision-resistant.

        Validates SHA-256 hashing for citation tracking.
        """
        from app.services.common import compute_citation_hash

        source_id = uuid4()
        chunk_text = "Test chunk content for hashing"

        # Compute hash multiple times
        hashes = [
            compute_citation_hash(source_id, chunk_text)
            for _ in range(100)
        ]

        # All hashes must be identical
        assert len(set(hashes)) == 1, "Hash instability detected!"
        assert len(hashes[0]) == 64, "Invalid hash length"
        assert all(c in "0123456789abcdef" for c in hashes[0]), \
            "Invalid hash format"

        print(f"✓ Hash stability test passed: 100 iterations")
        print(f"  Hash: {hashes[0]}")

    async def test_different_seeds_produce_different_results(
        self,
        source_service: SourceService,
        test_source_id: str
    ):
        """Test that different seeds produce different results.

        Validates that seed actually affects retrieval (not just a no-op).
        """
        query = "music theory"
        top_k = 5

        # Retrieve with different seeds
        chunks_seed_1 = await source_service.retrieve_chunks(
            source_id=test_source_id,
            query=query,
            top_k=top_k,
            seed=1
        )

        chunks_seed_2 = await source_service.retrieve_chunks(
            source_id=test_source_id,
            query=query,
            top_k=top_k,
            seed=2
        )

        # Results should be different (different seeds)
        # Note: In mock implementation, content includes seed in text
        hashes_1 = [c.content_hash for c in chunks_seed_1]
        hashes_2 = [c.content_hash for c in chunks_seed_2]

        assert hashes_1 != hashes_2, \
            "Different seeds should produce different results"

        print(f"✓ Seed variation test passed")
        print(f"  Seed 1 first hash: {hashes_1[0][:16]}...")
        print(f"  Seed 2 first hash: {hashes_2[0][:16]}...")

    async def test_retrieve_by_hash_pinned_retrieval(
        self,
        source_service: SourceService,
        test_source_id: str
    ):
        """Test pinned retrieval by content hash.

        Validates that chunks can be retrieved by hash for reproducibility.
        """
        # First retrieval
        query = "test query"
        chunks = await source_service.retrieve_chunks(
            source_id=test_source_id,
            query=query,
            top_k=3,
            seed=42
        )

        assert len(chunks) > 0, "No chunks retrieved"

        # Get first chunk hash
        first_chunk = chunks[0]
        chunk_hash = first_chunk.content_hash

        # Retrieve by hash (pinned)
        retrieved_chunk = await source_service.retrieve_by_hash(
            source_id=test_source_id,
            chunk_hash=chunk_hash
        )

        # Validate same content
        assert retrieved_chunk is not None, "Chunk not found by hash"
        assert retrieved_chunk.text == first_chunk.text, \
            "Hash retrieval returned different content"

        print(f"✓ Pinned retrieval test passed")
        print(f"  Hash: {chunk_hash[:16]}...")
        print(f"  Text: {retrieved_chunk.text[:50]}...")

    async def test_allow_deny_list_enforcement(
        self,
        source_service: SourceService
    ):
        """Test allow/deny list filtering."""
        # Test deny list
        is_valid, reason = source_service.validate_allow_deny_lists(
            text="This contains profanity",
            deny=["profanity", "explicit"]
        )
        assert not is_valid, "Deny list should block text"
        assert "Denied term found" in reason

        # Test allow list
        is_valid, reason = source_service.validate_allow_deny_lists(
            text="Music theory concepts",
            allow=["music", "theory"]
        )
        assert is_valid, "Allow list should pass text"

        # Test allow list failure
        is_valid, reason = source_service.validate_allow_deny_lists(
            text="Random content",
            allow=["music", "theory"]
        )
        assert not is_valid, "Allow list should block text without allowed terms"

        print(f"✓ Allow/deny list test passed")

    async def test_weight_normalization(
        self,
        source_service: SourceService
    ):
        """Test source weight normalization."""
        from app.models.source import Source

        # Create test sources with weights > 1.0
        sources = [
            Source(id=uuid4(), weight=0.5, name="Source 1"),
            Source(id=uuid4(), weight=0.8, name="Source 2"),
            Source(id=uuid4(), weight=0.7, name="Source 3"),
        ]

        # Normalize
        normalized = source_service.normalize_source_weights(sources)

        # Validate sum ≤ 1.0
        total = sum(normalized.values())
        assert total <= 1.0, f"Normalized weights sum to {total} > 1.0"

        # Validate relative proportions preserved
        weights = [s.weight for s in sources]
        original_ratios = [w / sum(weights) for w in weights]
        normalized_ratios = [
            normalized[s.id] / total for s in sources
        ]

        for orig, norm in zip(original_ratios, normalized_ratios):
            assert abs(orig - norm) < 0.01, \
                "Relative proportions not preserved"

        print(f"✓ Weight normalization test passed")
        print(f"  Original sum: {sum(weights)}")
        print(f"  Normalized sum: {total}")


# Fixtures

@pytest.fixture
async def source_service(db_session):
    """Create SourceService instance."""
    from app.repositories.source_repo import SourceRepository

    repo = SourceRepository(db=db_session)
    service = SourceService(session=db_session, repo=repo)

    # Create mock MCP server
    service.create_mcp_mock_server(
        server_id="test-mock",
        capabilities=["chunk_retrieval", "search"],
        scopes=["test", "music", "lyrics"]
    )

    return service


@pytest.fixture
async def test_source_id(db_session, source_service):
    """Create a test source and return its ID."""
    from app.schemas.source import SourceCreate, SourceKind

    source_data = SourceCreate(
        name="Test Source",
        kind=SourceKind.API,
        config={},
        scopes=["test", "music"],
        allow=[],
        deny=[],
        weight=0.5,
        provenance=True,
        mcp_server_id="test-mock",
        is_active=True
    )

    source = await source_service.create_source(
        data=source_data,
        owner_id=uuid4(),
        tenant_id=uuid4()
    )

    return source.id
