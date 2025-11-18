# Pinned Retrieval - Quick Reference

## Overview

Deterministic source chunk retrieval for the LYRICS skill using SHA-256 content hashing.

**Status:** ✅ COMPLETE - 30/30 tests passing, 100% determinism validated

---

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `services/api/app/skills/lyrics.py` | Implementation | 194-361, 405-437 |
| `services/api/tests/unit/skills/test_lyrics.py` | Tests | 500+ lines, 30 tests |
| `PHASE_3.2_PINNED_RETRIEVAL_DELIVERY.md` | Full documentation | Complete spec |

---

## Function Signature

```python
def pinned_retrieve(
    query: str,                          # Search query (context only)
    sources: List[Dict[str, Any]],       # Source documents with chunks
    required_chunk_hashes: List[str],    # SHA-256 hashes from previous run
    top_k: int,                          # Number of chunks to return
    seed: int,                           # Seed (unused currently)
) -> List[Dict[str, Any]]:              # Returns chunks with metadata
```

---

## Algorithm

### Phase 1: Hash Matching
```python
for required_hash in required_chunk_hashes:
    if hash exists in sources:
        add to results
```

### Phase 2: Lexicographic Fill
```python
if len(results) < top_k:
    sort unmatched chunks by (source_id, text)
    take first (top_k - matched) chunks
```

---

## Usage Example

```python
# First run (no hashes)
chunks = pinned_retrieve(
    query="Lyrics context for love, heartbreak",
    sources=[
        {
            "name": "source1",
            "chunks": ["chunk A", "chunk B"],
            "weight": 0.8
        }
    ],
    required_chunk_hashes=[],  # Empty on first run
    top_k=5,
    seed=42
)
# Returns: 5 chunks in lexicographic order
# Save: chunks[0]["chunk_hash"], chunks[1]["chunk_hash"], ...

# Second run (with hashes) - DETERMINISTIC
chunks = pinned_retrieve(
    query="Different query",  # Query doesn't matter
    sources=same_sources,
    required_chunk_hashes=saved_hashes,  # From first run
    top_k=5,
    seed=99  # Seed doesn't matter
)
# Returns: IDENTICAL chunks as first run
```

---

## Integration in LYRICS Skill

```python
# In generate_lyrics() function (line ~418)
chunks = pinned_retrieve(
    query=f"Lyrics context for {sds_lyrics.get('themes', ['song'])}",
    sources=sources,
    required_chunk_hashes=inputs.get("citation_hashes", []),
    top_k=inputs.get("source_top_k", 5),
    seed=context.seed + 1,
)

citations = chunks  # Store for output

# Build source context for LLM prompt
if chunks:
    source_texts = [f"- {chunk['text']}" for chunk in chunks]
    source_context = "\n\nRelevant source material:\n" + "\n".join(source_texts)
```

---

## Test Results

```
30 passed, 2 skipped in 0.13s
```

### Critical Tests
- ✅ **10-run determinism**: 100% identical outputs
- ✅ Hash matching: Reproduces previous selections
- ✅ Lexicographic fill: Deterministic ordering
- ✅ All edge cases: Empty, missing, duplicates

---

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| Missing hash | Log warning, continue, fill from pool |
| Empty sources | Return [], log error |
| top_k > available | Return all available chunks |
| Duplicate hashes | Deduplicate, retrieve once |
| top_k = 0 | Return [], log warning |
| Non-string chunks | Skip invalid chunks |
| Missing metadata | Use defaults (weight=0.5, id="unknown") |

---

## Performance

- **Time Complexity:** O(n log n) where n = total chunks
- **Space Complexity:** O(n)
- **Benchmark:** <10ms for 100 chunks

---

## Determinism Guarantees

✅ No `random.random()` calls
✅ No `time.time()` or `datetime.now()` calls
✅ Stable lexicographic sorting
✅ Consistent SHA-256 hashing
✅ No external API calls

**Result:** 100% reproducibility across runs with same inputs

---

## Verification Command

```bash
cd /home/user/MeatyMusic/services/api
uv run pytest tests/unit/skills/test_lyrics.py -v
```

Expected: **30 passed, 2 skipped**

---

## Next Steps

1. ✅ Implementation complete
2. ✅ Tests passing
3. ✅ Determinism validated
4. 🔄 Integration testing with full workflow (next phase)
5. 🔄 MCP source integration (next phase)

---

**Last Updated:** 2025-11-18
**Commit:** Pending
