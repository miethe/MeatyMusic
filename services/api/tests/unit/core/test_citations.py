"""
Unit tests for citation hashing and pinned retrieval.

Test Coverage:
- hash_chunk consistency and normalization
- CitationRecord dataclass and serialization
- create_citations_json structure and organization
- pinned_retrieval determinism across multiple runs
- Edge cases: missing chunks, empty sources, invalid hashes
"""

import pytest
from typing import List, Dict, Any

from app.core.citations import (
    CitationRecord,
    hash_chunk,
    create_citations_json,
    pinned_retrieval,
)


class TestHashChunk:
    """Test hash_chunk function for consistency and normalization."""

    def test_hash_chunk_returns_sha256_prefix(self):
        """Hash should start with 'sha256:' prefix."""
        result = hash_chunk("test text")
        assert result.startswith("sha256:")

    def test_hash_chunk_consistent(self):
        """Same text should produce same hash."""
        text = "This is a test chunk"
        hash1 = hash_chunk(text)
        hash2 = hash_chunk(text)
        assert hash1 == hash2

    def test_hash_chunk_normalizes_whitespace(self):
        """Extra whitespace should normalize to same hash."""
        text1 = "This is a test"
        text2 = "This   is   a    test"  # Extra spaces
        text3 = "This\tis\na\ttest"  # Tabs and newlines

        hash1 = hash_chunk(text1)
        hash2 = hash_chunk(text2)
        hash3 = hash_chunk(text3)

        assert hash1 == hash2 == hash3

    def test_hash_chunk_different_content_different_hash(self):
        """Different content should produce different hashes."""
        hash1 = hash_chunk("Chunk A")
        hash2 = hash_chunk("Chunk B")
        assert hash1 != hash2

    def test_hash_chunk_empty_string(self):
        """Empty string should produce valid hash."""
        result = hash_chunk("")
        assert result.startswith("sha256:")
        assert len(result) > len("sha256:")

    def test_hash_chunk_unicode(self):
        """Unicode characters should hash consistently."""
        text = "Hello 世界 🎵"
        hash1 = hash_chunk(text)
        hash2 = hash_chunk(text)
        assert hash1 == hash2


class TestCitationRecord:
    """Test CitationRecord dataclass."""

    def test_citation_record_creation(self):
        """Citation record should store all fields."""
        record = CitationRecord(
            chunk_hash="sha256:abc123",
            source_id="source-1",
            text="Test chunk",
            weight=0.85,
            section="Verse 1"
        )

        assert record.chunk_hash == "sha256:abc123"
        assert record.source_id == "source-1"
        assert record.text == "Test chunk"
        assert record.weight == 0.85
        assert record.section == "Verse 1"

    def test_citation_record_optional_section(self):
        """Section should be optional (default None)."""
        record = CitationRecord(
            chunk_hash="sha256:abc123",
            source_id="source-1",
            text="Test chunk",
            weight=0.85
        )

        assert record.section is None

    def test_citation_record_to_dict(self):
        """to_dict should produce valid JSON-serializable dict."""
        record = CitationRecord(
            chunk_hash="sha256:abc123",
            source_id="source-1",
            text="Test chunk",
            weight=0.85,
            section="Chorus"
        )

        result = record.to_dict()

        assert result == {
            "chunk_hash": "sha256:abc123",
            "source_id": "source-1",
            "text": "Test chunk",
            "weight": 0.85,
            "section": "Chorus"
        }

    def test_citation_record_to_dict_with_none_section(self):
        """to_dict should include None section."""
        record = CitationRecord(
            chunk_hash="sha256:abc123",
            source_id="source-1",
            text="Test chunk",
            weight=0.85
        )

        result = record.to_dict()
        assert result["section"] is None


class TestCreateCitationsJson:
    """Test create_citations_json function."""

    def test_create_citations_json_structure(self):
        """Should create properly structured citations JSON."""
        records = [
            CitationRecord(
                chunk_hash="sha256:abc",
                source_id="s1",
                text="Chunk 1",
                weight=0.9,
                section="Verse 1"
            ),
            CitationRecord(
                chunk_hash="sha256:def",
                source_id="s2",
                text="Chunk 2",
                weight=0.7,
                section="Verse 1"
            ),
            CitationRecord(
                chunk_hash="sha256:ghi",
                source_id="s1",
                text="Chunk 3",
                weight=0.85,
                section="Chorus"
            ),
        ]

        result = create_citations_json(records)

        # Check top-level keys
        assert set(result.keys()) == {"by_section", "all_citations", "total_count", "source_ids"}

        # Check counts
        assert result["total_count"] == 3
        assert len(result["all_citations"]) == 3

        # Check source IDs (should be sorted)
        assert result["source_ids"] == ["s1", "s2"]

    def test_create_citations_json_groups_by_section(self):
        """Should group citations by section."""
        records = [
            CitationRecord("sha256:abc", "s1", "C1", 0.9, "Verse 1"),
            CitationRecord("sha256:def", "s2", "C2", 0.7, "Verse 1"),
            CitationRecord("sha256:ghi", "s1", "C3", 0.85, "Chorus"),
        ]

        result = create_citations_json(records)

        # Check section grouping
        assert "Verse 1" in result["by_section"]
        assert "Chorus" in result["by_section"]
        assert len(result["by_section"]["Verse 1"]) == 2
        assert len(result["by_section"]["Chorus"]) == 1

    def test_create_citations_json_handles_none_section(self):
        """Citations with None section should go to 'unknown'."""
        records = [
            CitationRecord("sha256:abc", "s1", "C1", 0.9, None),
            CitationRecord("sha256:def", "s2", "C2", 0.7, None),
        ]

        result = create_citations_json(records)

        assert "unknown" in result["by_section"]
        assert len(result["by_section"]["unknown"]) == 2

    def test_create_citations_json_empty_list(self):
        """Should handle empty citations list."""
        result = create_citations_json([])

        assert result["total_count"] == 0
        assert result["all_citations"] == []
        assert result["source_ids"] == []
        assert result["by_section"] == {}

    def test_create_citations_json_source_ids_sorted(self):
        """Source IDs should be sorted for determinism."""
        records = [
            CitationRecord("sha256:abc", "s3", "C1", 0.9, "Verse 1"),
            CitationRecord("sha256:def", "s1", "C2", 0.7, "Verse 1"),
            CitationRecord("sha256:ghi", "s2", "C3", 0.85, "Chorus"),
        ]

        result = create_citations_json(records)

        # Should be sorted
        assert result["source_ids"] == ["s1", "s2", "s3"]

    def test_create_citations_json_deduplicates_source_ids(self):
        """Should deduplicate source IDs."""
        records = [
            CitationRecord("sha256:abc", "s1", "C1", 0.9, "Verse 1"),
            CitationRecord("sha256:def", "s1", "C2", 0.7, "Verse 1"),
            CitationRecord("sha256:ghi", "s1", "C3", 0.85, "Chorus"),
        ]

        result = create_citations_json(records)

        assert result["source_ids"] == ["s1"]


class TestPinnedRetrieval:
    """Test pinned_retrieval function for determinism."""

    def get_test_sources(self) -> List[Dict[str, Any]]:
        """Create test sources fixture."""
        return [
            {
                "id": "source-1",
                "chunks": [
                    {"text": "Love is a battlefield"},
                    {"text": "We are the champions"},
                    {"text": "Don't stop believin'"},
                ]
            },
            {
                "id": "source-2",
                "chunks": [
                    {"text": "I will always love you"},
                    {"text": "Sweet dreams are made of this"},
                ]
            },
        ]

    def test_pinned_retrieval_basic(self):
        """Should retrieve chunks by hash."""
        sources = self.get_test_sources()

        # Hash of first chunk
        required_hashes = [hash_chunk("Love is a battlefield")]

        result = pinned_retrieval(sources, "query", required_hashes, top_k=1)

        assert len(result) == 1
        assert result[0]["text"] == "Love is a battlefield"
        assert result[0]["source_id"] == "source-1"
        assert result[0]["hash"] == required_hashes[0]

    def test_pinned_retrieval_multiple_hashes(self):
        """Should retrieve multiple chunks by hash."""
        sources = self.get_test_sources()

        required_hashes = [
            hash_chunk("Love is a battlefield"),
            hash_chunk("I will always love you"),
        ]

        result = pinned_retrieval(sources, "query", required_hashes, top_k=2)

        assert len(result) == 2
        retrieved_texts = {chunk["text"] for chunk in result}
        assert "Love is a battlefield" in retrieved_texts
        assert "I will always love you" in retrieved_texts

    def test_pinned_retrieval_fills_remaining_slots(self):
        """Should fill remaining slots with lexicographically sorted chunks."""
        sources = self.get_test_sources()

        # Only require 1 chunk, but ask for top_k=3
        required_hashes = [hash_chunk("Love is a battlefield")]

        result = pinned_retrieval(sources, "query", required_hashes, top_k=3)

        assert len(result) == 3
        # First chunk should be the required one
        assert result[0]["text"] == "Love is a battlefield"
        # Remaining should be sorted by hash
        assert len(result) == 3

    def test_pinned_retrieval_determinism_10_runs(self):
        """Same inputs should produce identical outputs across 10 runs."""
        sources = self.get_test_sources()
        required_hashes = [
            hash_chunk("We are the champions"),
            hash_chunk("Sweet dreams are made of this"),
        ]

        # Run 10 times
        results = []
        for _ in range(10):
            result = pinned_retrieval(sources, "query", required_hashes, top_k=3, seed=42)
            # Convert to tuple of tuples for hashability
            result_signature = tuple(
                (chunk["hash"], chunk["text"], chunk["source_id"])
                for chunk in result
            )
            results.append(result_signature)

        # All runs should be identical
        assert len(set(results)) == 1, "Runs produced different results (not deterministic)"

    def test_pinned_retrieval_respects_top_k(self):
        """Should never exceed top_k limit."""
        sources = self.get_test_sources()

        # Require more chunks than top_k allows
        all_hashes = [
            hash_chunk("Love is a battlefield"),
            hash_chunk("We are the champions"),
            hash_chunk("Don't stop believin'"),
            hash_chunk("I will always love you"),
            hash_chunk("Sweet dreams are made of this"),
        ]

        result = pinned_retrieval(sources, "query", all_hashes, top_k=3)

        assert len(result) <= 3

    def test_pinned_retrieval_missing_chunks(self):
        """Should handle missing chunks gracefully."""
        sources = self.get_test_sources()

        # Require a chunk that doesn't exist
        required_hashes = [
            hash_chunk("This chunk does not exist"),
            hash_chunk("Love is a battlefield"),  # This one exists
        ]

        result = pinned_retrieval(sources, "query", required_hashes, top_k=3)

        # Should still return results (the existing chunk + fill remaining)
        assert len(result) > 0
        # Should include the existing chunk
        retrieved_texts = {chunk["text"] for chunk in result}
        assert "Love is a battlefield" in retrieved_texts

    def test_pinned_retrieval_empty_sources(self):
        """Should handle empty sources list."""
        sources = []
        required_hashes = [hash_chunk("Any chunk")]

        result = pinned_retrieval(sources, "query", required_hashes, top_k=5)

        assert result == []

    def test_pinned_retrieval_empty_required_hashes(self):
        """Should fill all slots when no required hashes."""
        sources = self.get_test_sources()

        result = pinned_retrieval(sources, "query", [], top_k=3)

        # Should return 3 chunks sorted by hash
        assert len(result) == 3

    def test_pinned_retrieval_lexicographic_sorting(self):
        """Remaining chunks should be sorted lexicographically by hash."""
        sources = self.get_test_sources()

        # No required hashes, just fill with sorted chunks
        result = pinned_retrieval(sources, "query", [], top_k=5)

        # Extract hashes
        hashes = [chunk["hash"] for chunk in result]

        # Should be sorted
        assert hashes == sorted(hashes)

    def test_pinned_retrieval_ignores_query_and_seed(self):
        """Query and seed should not affect results (API compatibility only)."""
        sources = self.get_test_sources()
        required_hashes = [hash_chunk("Love is a battlefield")]

        # Different queries and seeds
        result1 = pinned_retrieval(sources, "query1", required_hashes, top_k=2, seed=42)
        result2 = pinned_retrieval(sources, "query2", required_hashes, top_k=2, seed=99)
        result3 = pinned_retrieval(sources, "different", required_hashes, top_k=2, seed=0)

        # All should produce identical results
        assert result1 == result2 == result3


class TestIntegrationScenario:
    """Integration test: first run vs subsequent run retrieval."""

    def test_first_run_vs_subsequent_run(self):
        """
        Simulate first run (creating citations) vs subsequent run (pinned retrieval).

        Scenario:
        1. First run: Simulate semantic search, create citations
        2. Store citations.json
        3. Subsequent run: Use pinned retrieval with stored hashes
        4. Verify: Same chunks retrieved
        """
        # Mock sources
        sources = [
            {
                "id": "source-1",
                "chunks": [
                    {"text": "The night is young"},
                    {"text": "Stars are shining bright"},
                    {"text": "Dancing in the moonlight"},
                ]
            },
            {
                "id": "source-2",
                "chunks": [
                    {"text": "Love conquers all"},
                    {"text": "Hearts beat as one"},
                ]
            },
        ]

        # === FIRST RUN: Simulate semantic search ===
        # In reality, this would be semantic search results
        # For testing, we'll just pick specific chunks
        first_run_chunks = [
            {"text": "Stars are shining bright", "source_id": "source-1", "score": 0.92},
            {"text": "Love conquers all", "source_id": "source-2", "score": 0.88},
            {"text": "Hearts beat as one", "source_id": "source-2", "score": 0.85},
        ]

        # Create citations from first run
        citations = [
            CitationRecord(
                chunk_hash=hash_chunk(chunk["text"]),
                source_id=chunk["source_id"],
                text=chunk["text"],
                weight=chunk["score"],
                section="Verse 1"
            )
            for chunk in first_run_chunks
        ]

        # Store citations.json
        citations_json = create_citations_json(citations)

        # === SUBSEQUENT RUN: Pinned retrieval ===
        # Extract required hashes from citations.json
        required_hashes = [c["chunk_hash"] for c in citations_json["all_citations"]]

        # Use pinned retrieval
        subsequent_run_chunks = pinned_retrieval(
            sources=sources,
            query="ignored",  # Query doesn't matter for pinned retrieval
            required_chunk_hashes=required_hashes,
            top_k=3,
            seed=42  # Seed doesn't matter for pinned retrieval
        )

        # === VERIFICATION: Same chunks ===
        first_run_texts = {chunk["text"] for chunk in first_run_chunks}
        subsequent_run_texts = {chunk["text"] for chunk in subsequent_run_chunks}

        # Should retrieve exact same chunks
        assert first_run_texts == subsequent_run_texts

        # Verify hashes match
        first_run_hashes = {hash_chunk(chunk["text"]) for chunk in first_run_chunks}
        subsequent_run_hashes = {chunk["hash"] for chunk in subsequent_run_chunks}
        assert first_run_hashes == subsequent_run_hashes

        # Verify citation structure
        assert citations_json["total_count"] == 3
        assert citations_json["source_ids"] == ["source-1", "source-2"]
        assert "Verse 1" in citations_json["by_section"]
        assert len(citations_json["by_section"]["Verse 1"]) == 3


class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_hash_chunk_very_long_text(self):
        """Should handle very long text."""
        long_text = "A" * 100000
        result = hash_chunk(long_text)
        assert result.startswith("sha256:")

    def test_pinned_retrieval_duplicate_hashes_in_required(self):
        """Should handle duplicate hashes in required list."""
        sources = [
            {"id": "s1", "chunks": [{"text": "Chunk A"}, {"text": "Chunk B"}]}
        ]

        chunk_hash = hash_chunk("Chunk A")
        required_hashes = [chunk_hash, chunk_hash, chunk_hash]  # Duplicates

        result = pinned_retrieval(sources, "query", required_hashes, top_k=5)

        # Should only retrieve once (no duplicates in result)
        chunk_a_count = sum(1 for chunk in result if chunk["text"] == "Chunk A")
        assert chunk_a_count == 1

    def test_create_citations_json_preserves_order_in_all_citations(self):
        """all_citations should preserve input order."""
        records = [
            CitationRecord("sha256:c", "s3", "C", 0.7, "Verse 1"),
            CitationRecord("sha256:a", "s1", "A", 0.9, "Verse 1"),
            CitationRecord("sha256:b", "s2", "B", 0.8, "Verse 1"),
        ]

        result = create_citations_json(records)

        # all_citations should preserve input order
        texts = [c["text"] for c in result["all_citations"]]
        assert texts == ["C", "A", "B"]

    def test_pinned_retrieval_sources_missing_chunks_field(self):
        """Should handle sources without 'chunks' field."""
        sources = [
            {"id": "s1"},  # Missing 'chunks' field
            {"id": "s2", "chunks": [{"text": "Valid chunk"}]}
        ]

        result = pinned_retrieval(sources, "query", [], top_k=5)

        # Should only get chunks from valid source
        assert len(result) == 1
        assert result[0]["text"] == "Valid chunk"

    def test_pinned_retrieval_chunks_missing_text_field(self):
        """Should handle chunks without 'text' field."""
        sources = [
            {
                "id": "s1",
                "chunks": [
                    {},  # Missing 'text' field
                    {"text": "Valid chunk"}
                ]
            }
        ]

        result = pinned_retrieval(sources, "query", [], top_k=5)

        # Should handle missing text (hash as empty string)
        assert len(result) == 2
