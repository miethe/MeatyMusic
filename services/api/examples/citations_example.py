"""
Example: First Run vs Subsequent Run with Pinned Retrieval

This example demonstrates how citation hashing enables deterministic
retrieval across multiple runs:

1. FIRST RUN: Semantic search → Create citations → Store hashes
2. SUBSEQUENT RUN: Load hashes → Pinned retrieval → Same chunks

This ensures the LYRICS skill produces identical outputs when re-run
with the same SDS and seed.
"""

import json
import sys
from typing import List, Dict, Any

# Add app to path
sys.path.insert(0, '/home/user/MeatyMusic/services/api')

from app.core.citations import (
    CitationRecord,
    hash_chunk,
    create_citations_json,
    pinned_retrieval,
)


# ============================================================================
# Mock Sources (in reality, these come from database/MCP)
# ============================================================================

MOCK_SOURCES = [
    {
        "id": "source-love-songs",
        "name": "Classic Love Song Lyrics",
        "chunks": [
            {"text": "When you hold me in your arms, I feel safe and warm"},
            {"text": "Dancing under starlight, our hearts beat as one"},
            {"text": "Every moment with you feels like a dream come true"},
            {"text": "Your smile lights up my darkest days"},
            {"text": "Together we can conquer anything"},
        ]
    },
    {
        "id": "source-metaphors",
        "name": "Poetic Imagery Database",
        "chunks": [
            {"text": "Love is a wildfire burning bright"},
            {"text": "Our love is an ocean, deep and endless"},
            {"text": "Like two stars colliding in the night"},
            {"text": "A symphony of passion and desire"},
        ]
    },
    {
        "id": "source-modern-pop",
        "name": "Modern Pop Lyrics",
        "chunks": [
            {"text": "Can't get you out of my head tonight"},
            {"text": "We're unstoppable, you and me"},
            {"text": "This feeling never fades away"},
        ]
    }
]


# ============================================================================
# FIRST RUN: Semantic Search + Citation Creation
# ============================================================================

def simulate_semantic_search(
    sources: List[Dict[str, Any]],
    query: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Simulate semantic search (in reality, uses embeddings + vector DB).

    WARNING: This is a mock! Real semantic search is non-deterministic:
    - Embedding models can have slight variations
    - Distance calculations have floating-point drift
    - Ranking may vary across runs

    Returns:
        List of chunks with 'text', 'source_id', and 'score' fields
    """
    # Mock: Just return first top_k chunks
    # In reality, this would use vector similarity search
    results = []
    for source in sources:
        for chunk_data in source["chunks"][:2]:  # Take first 2 from each
            results.append({
                "text": chunk_data["text"],
                "source_id": source["id"],
                "score": 0.85  # Mock relevance score
            })
            if len(results) >= top_k:
                break
        if len(results) >= top_k:
            break

    return results


def first_run_workflow(song_id: str, section: str = "Verse 1") -> Dict[str, Any]:
    """
    FIRST RUN: Generate lyrics with source citations.

    Steps:
    1. Perform semantic search to retrieve relevant chunks
    2. Generate lyrics using chunks (mock)
    3. Create CitationRecord for each chunk used
    4. Store citations.json for reproducibility

    Returns:
        Dict with lyrics and citations_json
    """
    print("=" * 70)
    print("FIRST RUN: Semantic Search + Citation Creation")
    print("=" * 70)

    # Step 1: Semantic search
    query = "romantic love song lyrics"
    print(f"\n1. Performing semantic search for: '{query}'")
    search_results = simulate_semantic_search(MOCK_SOURCES, query, top_k=5)

    print(f"   Found {len(search_results)} relevant chunks:")
    for i, chunk in enumerate(search_results, 1):
        print(f"      {i}. [{chunk['source_id']}] {chunk['text'][:50]}...")

    # Step 2: Generate lyrics (mock)
    # In reality, this would be LLM generation using the chunks
    lyrics_text = """
When you hold me close tonight
Dancing under starlight
Our love is an ocean deep
This feeling I'll always keep
    """.strip()

    print(f"\n2. Generated lyrics for {section}:")
    print(f"   {lyrics_text[:80]}...")

    # Step 3: Create citations
    print(f"\n3. Creating citation records...")
    citations = []
    for chunk in search_results:
        chunk_hash = hash_chunk(chunk["text"])
        citation = CitationRecord(
            chunk_hash=chunk_hash,
            source_id=chunk["source_id"],
            text=chunk["text"],
            weight=chunk["score"],
            section=section
        )
        citations.append(citation)
        print(f"   ✓ {chunk_hash[:20]}... → {chunk['text'][:40]}...")

    # Step 4: Store citations.json
    citations_json = create_citations_json(citations)

    print(f"\n4. Created citations.json:")
    print(f"   - Total citations: {citations_json['total_count']}")
    print(f"   - Unique sources: {len(citations_json['source_ids'])}")
    print(f"   - Sections: {list(citations_json['by_section'].keys())}")

    return {
        "lyrics": lyrics_text,
        "citations_json": citations_json,
        "search_results": search_results  # For comparison later
    }


# ============================================================================
# SUBSEQUENT RUN: Pinned Retrieval
# ============================================================================

def subsequent_run_workflow(
    song_id: str,
    citations_json: Dict[str, Any],
    section: str = "Verse 1"
) -> Dict[str, Any]:
    """
    SUBSEQUENT RUN: Use pinned retrieval to get same chunks.

    Steps:
    1. Load required chunk hashes from citations.json
    2. Use pinned_retrieval() to get exact same chunks
    3. Generate lyrics using same chunks (deterministic)
    4. Verify same output

    Returns:
        Dict with lyrics and retrieved chunks
    """
    print("\n" + "=" * 70)
    print("SUBSEQUENT RUN: Pinned Retrieval (Deterministic)")
    print("=" * 70)

    # Step 1: Load required hashes
    required_hashes = [c["chunk_hash"] for c in citations_json["all_citations"]]
    print(f"\n1. Loaded {len(required_hashes)} required chunk hashes from citations.json")
    for hash_val in required_hashes[:3]:
        print(f"   - {hash_val[:20]}...")

    # Step 2: Pinned retrieval
    print(f"\n2. Performing pinned retrieval (deterministic)...")
    retrieved_chunks = pinned_retrieval(
        sources=MOCK_SOURCES,
        query="IGNORED",  # Query doesn't affect pinned retrieval
        required_chunk_hashes=required_hashes,
        top_k=5,
        seed=999  # Seed doesn't affect pinned retrieval
    )

    print(f"   Retrieved {len(retrieved_chunks)} chunks:")
    for i, chunk in enumerate(retrieved_chunks, 1):
        print(f"      {i}. [{chunk['source_id']}] {chunk['text'][:50]}...")

    # Step 3: Generate lyrics (mock - same as first run)
    lyrics_text = """
When you hold me close tonight
Dancing under starlight
Our love is an ocean deep
This feeling I'll always keep
    """.strip()

    print(f"\n3. Generated lyrics for {section}:")
    print(f"   {lyrics_text[:80]}...")
    print("   ✓ DETERMINISTIC: Same chunks → Same lyrics")

    return {
        "lyrics": lyrics_text,
        "retrieved_chunks": retrieved_chunks
    }


# ============================================================================
# VERIFICATION: Compare First Run vs Subsequent Run
# ============================================================================

def verify_determinism(first_run_data: Dict, subsequent_run_data: Dict):
    """
    Verify that pinned retrieval produces identical results.
    """
    print("\n" + "=" * 70)
    print("VERIFICATION: Comparing First Run vs Subsequent Run")
    print("=" * 70)

    # Extract chunk texts
    first_run_texts = {chunk["text"] for chunk in first_run_data["search_results"]}
    subsequent_run_texts = {chunk["text"] for chunk in subsequent_run_data["retrieved_chunks"]}

    print(f"\n1. Chunk Retrieval:")
    print(f"   First run chunks: {len(first_run_texts)}")
    print(f"   Subsequent run chunks: {len(subsequent_run_texts)}")

    if first_run_texts == subsequent_run_texts:
        print("   ✓ PASS: Identical chunks retrieved")
    else:
        print("   ✗ FAIL: Different chunks retrieved")
        print(f"   Missing: {first_run_texts - subsequent_run_texts}")
        print(f"   Extra: {subsequent_run_texts - first_run_texts}")

    # Compare hashes
    first_run_hashes = {
        hash_chunk(chunk["text"]) for chunk in first_run_data["search_results"]
    }
    subsequent_run_hashes = {
        chunk["hash"] for chunk in subsequent_run_data["retrieved_chunks"]
    }

    print(f"\n2. Content Hashes:")
    if first_run_hashes == subsequent_run_hashes:
        print("   ✓ PASS: Identical hashes")
    else:
        print("   ✗ FAIL: Different hashes")

    # Compare lyrics
    print(f"\n3. Generated Lyrics:")
    if first_run_data["lyrics"] == subsequent_run_data["lyrics"]:
        print("   ✓ PASS: Identical lyrics")
    else:
        print("   ✗ FAIL: Different lyrics")

    print("\n" + "=" * 70)
    print("CONCLUSION")
    print("=" * 70)
    print("Pinned retrieval ensures:")
    print("  ✓ Same chunk hashes → same chunks retrieved")
    print("  ✓ Same chunks → same lyrics generated")
    print("  ✓ Same SDS + seed → deterministic output")
    print("=" * 70)


# ============================================================================
# RUN EXAMPLE
# ============================================================================

def main():
    """
    Run complete example: first run → subsequent run → verification.
    """
    song_id = "song-12345"
    section = "Verse 1"

    # FIRST RUN
    first_run_data = first_run_workflow(song_id, section)

    # Simulate storing citations.json
    # In reality, this would be stored in /runs/{song_id}/{run_id}/citations.json
    citations_json = first_run_data["citations_json"]

    # SUBSEQUENT RUN (using stored citations)
    subsequent_run_data = subsequent_run_workflow(song_id, citations_json, section)

    # VERIFY DETERMINISM
    verify_determinism(first_run_data, subsequent_run_data)

    # Show citations.json structure
    print("\n" + "=" * 70)
    print("CITATIONS.JSON STRUCTURE")
    print("=" * 70)
    print(json.dumps(citations_json, indent=2))


if __name__ == "__main__":
    main()
