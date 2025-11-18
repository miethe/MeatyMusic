"""
Citation Hashing and Pinned Retrieval for LYRICS Skill

This module provides deterministic source citation tracking for the LYRICS skill.
Key features:
- Content-based hashing (SHA-256) for chunk identification
- Pinned retrieval: same hashes → same chunks across runs
- Citation tracking: provenance for every source chunk used
- Structured JSON output for audit and verification

Why Pinned Retrieval?
Traditional semantic search is non-deterministic:
- Embedding models may have slight variations
- Distance calculations can have floating-point drift
- Ranking can vary across runs

Pinned retrieval solves this by:
- Storing content hashes from first run
- Re-retrieving exact same chunks by hash on subsequent runs
- Using lexicographic sorting (not relevance scoring) for determinism

Usage Pattern:
1. First Run (no citations.json yet):
   - Perform semantic search to get initial chunks
   - Hash each chunk and create CitationRecord objects
   - Store citations.json with hashes

2. Subsequent Runs (citations.json exists):
   - Load required_chunk_hashes from citations.json
   - Use pinned_retrieval() to get exact same chunks
   - Verify determinism (same hashes → same lyrics)

Example:
    from app.core.citations import (
        CitationRecord, hash_chunk, create_citations_json, pinned_retrieval
    )

    # First run: semantic search
    chunks = semantic_search(query="love song", sources=sources, top_k=5)

    # Create citations
    citations = [
        CitationRecord(
            chunk_hash=hash_chunk(chunk["text"]),
            source_id=chunk["source_id"],
            text=chunk["text"],
            weight=chunk["score"],
            section="Verse 1"
        )
        for chunk in chunks
    ]

    # Store for reproducibility
    citations_json = create_citations_json(citations)

    # Subsequent runs: pinned retrieval
    required_hashes = [c["chunk_hash"] for c in citations_json["all_citations"]]
    same_chunks = pinned_retrieval(sources, "query", required_hashes, top_k=5)
    # Guaranteed to retrieve same chunks as first run

See: docs/citations_and_retrieval.md for full details
"""

import hashlib
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class CitationRecord:
    """
    Record of a source chunk citation for lyrics generation.

    Used for:
    - Provenance tracking (which sources influenced which sections)
    - Deterministic retrieval (same chunks retrieved on re-run)
    - Audit trail (verify no unauthorized sources)

    Attributes:
        chunk_hash: SHA-256 hash of chunk text (for deterministic retrieval)
        source_id: Reference to source entity in database
        text: Original chunk text (for verification)
        weight: Relevance score 0.0-1.0
        section: Which lyrics section used this citation (e.g., "Verse 1", "Chorus")

    Example:
        citation = CitationRecord(
            chunk_hash="sha256:abc123...",
            source_id="source-uuid",
            text="Original chunk content",
            weight=0.85,
            section="Verse 1"
        )
    """
    chunk_hash: str  # SHA-256 hash with 'sha256:' prefix
    source_id: str
    text: str
    weight: float  # 0.0-1.0
    section: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for JSON serialization"""
        return {
            "chunk_hash": self.chunk_hash,
            "source_id": self.source_id,
            "text": self.text,
            "weight": self.weight,
            "section": self.section
        }


def hash_chunk(text: str) -> str:
    """
    Compute SHA-256 hash of chunk text for deterministic retrieval.

    Normalizes whitespace before hashing for consistency.

    Args:
        text: Chunk text to hash

    Returns:
        SHA-256 hash with 'sha256:' prefix

    Example:
        >>> hash_chunk("Example chunk text")
        'sha256:abc123...'
        >>> hash_chunk("Example   chunk   text")  # Extra spaces normalized
        'sha256:abc123...'  # Same hash
    """
    # Normalize whitespace for consistent hashing
    normalized = " ".join(text.split())

    # Compute SHA-256
    hash_obj = hashlib.sha256(normalized.encode('utf-8'))
    return f"sha256:{hash_obj.hexdigest()}"


def create_citations_json(records: List[CitationRecord]) -> Dict[str, Any]:
    """
    Create structured citations JSON for storage.

    Organizes citations by section for easy verification and audit.

    Args:
        records: List of CitationRecord objects

    Returns:
        Dict with citations organized by section

    Example:
        citations_json = create_citations_json([
            CitationRecord(chunk_hash="sha256:abc", source_id="s1", text="...", weight=0.9, section="Verse 1"),
            CitationRecord(chunk_hash="sha256:def", source_id="s2", text="...", weight=0.7, section="Verse 1"),
            CitationRecord(chunk_hash="sha256:ghi", source_id="s1", text="...", weight=0.85, section="Chorus")
        ])
        # Returns:
        # {
        #   "by_section": {
        #     "Verse 1": [citation1, citation2],
        #     "Chorus": [citation3]
        #   },
        #   "all_citations": [citation1, citation2, citation3],
        #   "total_count": 3,
        #   "source_ids": ["s1", "s2"]
        # }
    """
    # Group by section
    by_section: Dict[str, List[Dict[str, Any]]] = {}
    for record in records:
        section = record.section or "unknown"
        if section not in by_section:
            by_section[section] = []
        by_section[section].append(record.to_dict())

    # Collect unique source IDs
    source_ids = list(set(r.source_id for r in records))

    return {
        "by_section": by_section,
        "all_citations": [r.to_dict() for r in records],
        "total_count": len(records),
        "source_ids": sorted(source_ids)  # Sorted for determinism
    }


def pinned_retrieval(
    sources: List[Dict[str, Any]],
    query: str,
    required_chunk_hashes: List[str],
    top_k: int = 5,
    seed: int = 42
) -> List[Dict[str, Any]]:
    """
    Deterministic source chunk retrieval using content hashes.

    Retrieval strategy:
    1. Match all required_chunk_hashes (from previous run)
    2. Fill remaining slots with lexicographically sorted chunks
    3. Never exceed top_k limit

    This ensures:
    - Same hashes → same chunks retrieved
    - Deterministic ordering (no relevance scoring randomness)
    - Reproducible across runs

    Args:
        sources: List of source documents with 'chunks' field
        query: Query text (unused in pinned retrieval, for API compatibility)
        required_chunk_hashes: Hashes of chunks to retrieve (from citations.json)
        top_k: Maximum chunks to return (default 5)
        seed: Random seed (unused in pinned retrieval, for API compatibility)

    Returns:
        List of chunk dicts with 'hash', 'text', 'source_id' fields

    Example:
        sources = [
            {"id": "s1", "chunks": [{"text": "Chunk A"}, {"text": "Chunk B"}]},
            {"id": "s2", "chunks": [{"text": "Chunk C"}]}
        ]
        required_hashes = [hash_chunk("Chunk B")]
        chunks = pinned_retrieval(sources, "query", required_hashes, top_k=2)
        # Returns: [{"hash": "sha256:...", "text": "Chunk B", "source_id": "s1"}, ...]
    """
    # Flatten all chunks with metadata
    all_chunks = []
    for source in sources:
        source_id = source.get("id", "unknown")
        for chunk_data in source.get("chunks", []):
            chunk_text = chunk_data.get("text", "")
            chunk_hash = hash_chunk(chunk_text)
            all_chunks.append({
                "hash": chunk_hash,
                "text": chunk_text,
                "source_id": source_id
            })

    # 1. Match required hashes (exact matches)
    matched_chunks = []
    required_set = set(required_chunk_hashes)
    for chunk in all_chunks:
        if chunk["hash"] in required_set:
            matched_chunks.append(chunk)
            required_set.remove(chunk["hash"])

    # 2. If we need more chunks, sort remaining by hash (lexicographic order)
    remaining_needed = top_k - len(matched_chunks)
    if remaining_needed > 0:
        # Get chunks not already matched
        matched_hashes = {c["hash"] for c in matched_chunks}
        remaining_chunks = [c for c in all_chunks if c["hash"] not in matched_hashes]

        # Sort by hash for deterministic ordering
        remaining_chunks.sort(key=lambda c: c["hash"])

        # Take first N remaining chunks
        matched_chunks.extend(remaining_chunks[:remaining_needed])

    # 3. Return at most top_k chunks
    return matched_chunks[:top_k]
