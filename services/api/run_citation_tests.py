"""
Simple test runner for citation tests without pytest infrastructure.
"""

import sys
import traceback
from typing import Callable, List, Tuple
from pathlib import Path
# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.citations import (
    CitationRecord,
    hash_chunk,
    create_citations_json,
    pinned_retrieval,
)


class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def add_pass(self, test_name: str):
        self.passed += 1
        print(f"✓ {test_name}")

    def add_fail(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append((test_name, error))
        print(f"✗ {test_name}")
        print(f"  Error: {error}")

    def summary(self):
        total = self.passed + self.failed
        print("\n" + "=" * 70)
        print(f"Test Results: {self.passed}/{total} passed")
        if self.failed > 0:
            print(f"\nFailed tests:")
            for test_name, error in self.errors:
                print(f"  - {test_name}")
                print(f"    {error}")
        print("=" * 70)
        return self.failed == 0


def run_test(test_func: Callable, result: TestResult):
    """Run a single test function."""
    try:
        test_func()
        result.add_pass(test_func.__name__)
    except AssertionError as e:
        result.add_fail(test_func.__name__, str(e))
    except Exception as e:
        result.add_fail(test_func.__name__, f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}")


# ============================================================================
# TESTS
# ============================================================================

def test_hash_chunk_returns_sha256_prefix():
    result = hash_chunk("test text")
    assert result.startswith("sha256:"), f"Expected sha256: prefix, got {result}"


def test_hash_chunk_consistent():
    text = "This is a test chunk"
    hash1 = hash_chunk(text)
    hash2 = hash_chunk(text)
    assert hash1 == hash2, f"Hash not consistent: {hash1} != {hash2}"


def test_hash_chunk_normalizes_whitespace():
    text1 = "This is a test"
    text2 = "This   is   a    test"
    text3 = "This\tis\na\ttest"

    hash1 = hash_chunk(text1)
    hash2 = hash_chunk(text2)
    hash3 = hash_chunk(text3)

    assert hash1 == hash2 == hash3, f"Hashes not equal: {hash1}, {hash2}, {hash3}"


def test_hash_chunk_different_content():
    hash1 = hash_chunk("Chunk A")
    hash2 = hash_chunk("Chunk B")
    assert hash1 != hash2, "Different content should produce different hashes"


def test_citation_record_creation():
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


def test_citation_record_to_dict():
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


def test_create_citations_json_structure():
    records = [
        CitationRecord("sha256:abc", "s1", "Chunk 1", 0.9, "Verse 1"),
        CitationRecord("sha256:def", "s2", "Chunk 2", 0.7, "Verse 1"),
        CitationRecord("sha256:ghi", "s1", "Chunk 3", 0.85, "Chorus"),
    ]

    result = create_citations_json(records)

    assert set(result.keys()) == {"by_section", "all_citations", "total_count", "source_ids"}
    assert result["total_count"] == 3
    assert len(result["all_citations"]) == 3
    assert result["source_ids"] == ["s1", "s2"]


def test_create_citations_json_groups_by_section():
    records = [
        CitationRecord("sha256:abc", "s1", "C1", 0.9, "Verse 1"),
        CitationRecord("sha256:def", "s2", "C2", 0.7, "Verse 1"),
        CitationRecord("sha256:ghi", "s1", "C3", 0.85, "Chorus"),
    ]

    result = create_citations_json(records)

    assert "Verse 1" in result["by_section"]
    assert "Chorus" in result["by_section"]
    assert len(result["by_section"]["Verse 1"]) == 2
    assert len(result["by_section"]["Chorus"]) == 1


def test_pinned_retrieval_basic():
    sources = [
        {
            "id": "source-1",
            "chunks": [
                {"text": "Love is a battlefield"},
                {"text": "We are the champions"},
            ]
        }
    ]

    required_hashes = [hash_chunk("Love is a battlefield")]
    result = pinned_retrieval(sources, "query", required_hashes, top_k=1)

    assert len(result) == 1
    assert result[0]["text"] == "Love is a battlefield"
    assert result[0]["source_id"] == "source-1"
    assert result[0]["hash"] == required_hashes[0]


def test_pinned_retrieval_determinism_10_runs():
    sources = [
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

    required_hashes = [
        hash_chunk("We are the champions"),
        hash_chunk("Sweet dreams are made of this"),
    ]

    results = []
    for _ in range(10):
        result = pinned_retrieval(sources, "query", required_hashes, top_k=3, seed=42)
        result_signature = tuple(
            (chunk["hash"], chunk["text"], chunk["source_id"])
            for chunk in result
        )
        results.append(result_signature)

    assert len(set(results)) == 1, "Runs produced different results (not deterministic)"


def test_pinned_retrieval_respects_top_k():
    sources = [
        {
            "id": "source-1",
            "chunks": [
                {"text": "Chunk 1"},
                {"text": "Chunk 2"},
                {"text": "Chunk 3"},
                {"text": "Chunk 4"},
                {"text": "Chunk 5"},
            ]
        }
    ]

    all_hashes = [hash_chunk(f"Chunk {i}") for i in range(1, 6)]
    result = pinned_retrieval(sources, "query", all_hashes, top_k=3)

    assert len(result) <= 3, f"Exceeded top_k: got {len(result)} chunks"


def test_pinned_retrieval_empty_sources():
    sources = []
    required_hashes = [hash_chunk("Any chunk")]
    result = pinned_retrieval(sources, "query", required_hashes, top_k=5)
    assert result == []


def test_pinned_retrieval_lexicographic_sorting():
    sources = [
        {
            "id": "s1",
            "chunks": [
                {"text": "Chunk A"},
                {"text": "Chunk B"},
                {"text": "Chunk C"},
                {"text": "Chunk D"},
                {"text": "Chunk E"},
            ]
        }
    ]

    result = pinned_retrieval(sources, "query", [], top_k=5)
    hashes = [chunk["hash"] for chunk in result]
    assert hashes == sorted(hashes), "Chunks not sorted lexicographically"


def test_integration_first_run_vs_subsequent_run():
    """Test complete workflow: first run → subsequent run."""
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

    # First run: mock semantic search
    first_run_chunks = [
        {"text": "Stars are shining bright", "source_id": "source-1", "score": 0.92},
        {"text": "Love conquers all", "source_id": "source-2", "score": 0.88},
        {"text": "Hearts beat as one", "source_id": "source-2", "score": 0.85},
    ]

    # Create citations
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

    citations_json = create_citations_json(citations)

    # Subsequent run: pinned retrieval
    required_hashes = [c["chunk_hash"] for c in citations_json["all_citations"]]
    subsequent_run_chunks = pinned_retrieval(
        sources=sources,
        query="ignored",
        required_chunk_hashes=required_hashes,
        top_k=3,
        seed=42
    )

    # Verify same chunks
    first_run_texts = {chunk["text"] for chunk in first_run_chunks}
    subsequent_run_texts = {chunk["text"] for chunk in subsequent_run_chunks}

    assert first_run_texts == subsequent_run_texts, \
        f"Different chunks retrieved: {first_run_texts} vs {subsequent_run_texts}"


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 70)
    print("Running Citation Module Tests")
    print("=" * 70)
    print()

    result = TestResult()

    # Run all tests
    tests = [
        test_hash_chunk_returns_sha256_prefix,
        test_hash_chunk_consistent,
        test_hash_chunk_normalizes_whitespace,
        test_hash_chunk_different_content,
        test_citation_record_creation,
        test_citation_record_to_dict,
        test_create_citations_json_structure,
        test_create_citations_json_groups_by_section,
        test_pinned_retrieval_basic,
        test_pinned_retrieval_determinism_10_runs,
        test_pinned_retrieval_respects_top_k,
        test_pinned_retrieval_empty_sources,
        test_pinned_retrieval_lexicographic_sorting,
        test_integration_first_run_vs_subsequent_run,
    ]

    for test in tests:
        run_test(test, result)

    success = result.summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
