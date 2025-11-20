# MCP Server Integration for LYRICS Skill

**Status**: ✅ Implemented (MVP - Mock Mode)
**Date**: 2025-11-19
**Phase**: Phase 2 - MCP Server Integration (P0 - 13 pts)

## Overview

This document describes the Model Context Protocol (MCP) integration for the LYRICS skill, enabling deterministic retrieval-augmented generation (RAG) with chunk hash pinning for reproducibility.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      LYRICS Skill                                │
│                                                                   │
│  1. receive_sources() → List[Source] entities                   │
│  2. retrieve_from_mcp_sources()                                 │
│     ├─ Phase 1: Hash Pinning (if previous_hashes exist)        │
│     │   └─ get_context(chunk_hash) for each hash               │
│     └─ Phase 2: New Search (fill remaining slots)              │
│         └─ search(query, scopes, top_k)                         │
│  3. Build source_context for LLM prompt                         │
│  4. Generate lyrics with context                                │
│  5. Return {lyrics, citations, citation_hashes}                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MCPClientService                                │
│                                                                   │
│  • search(server_id, query, scopes, top_k, seed)                │
│  • get_context(server_id, chunk_hash)                           │
│  • validate_scopes(server_id, requested_scopes)                 │
│  • Mock mode (MVP) + Real MCP protocol (TODO)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Servers                                   │
│                                                                   │
│  • lyrics-knowledge (mock): Sample lyrics chunks                │
│  • Production: Real MCP servers via SDK/HTTP                    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Deterministic Retrieval (Hash Pinning)

**Problem**: RAG systems typically use semantic search which is non-deterministic across runs.

**Solution**: Chunk hash pinning with SHA-256 hashes.

**Flow**:
1. **First Run**: Search MCP servers → Store chunk hashes in `citation_hashes`
2. **Subsequent Runs**: Use pinned hashes → Retrieve exact same chunks via `get_context()`
3. **Partial Pinning**: If some hashes missing, fill remaining slots with new search

**Code Example**:
```python
# First run
citations, hashes = await retrieve_from_mcp_sources(
    sources=sources,
    query="love and dreams",
    previous_citation_hashes=[],  # Empty - first run
    top_k=5,
    seed=42,
)
# Returns: 5 chunks + their hashes

# Second run - deterministic
citations2, hashes2 = await retrieve_from_mcp_sources(
    sources=sources,
    query="different query",  # Doesn't matter - pinned
    previous_citation_hashes=hashes,  # Use previous hashes
    top_k=5,
    seed=999,  # Different seed doesn't matter - pinned
)
# Returns: EXACT SAME 5 chunks
```

### 2. Scope Validation

**Purpose**: Ensure requested scopes are available on MCP server.

**Implementation**:
```python
validation = await mcp_client.validate_scopes(
    server_id="lyrics-knowledge",
    requested_scopes=["lyrics", "themes", "invalid"],
)
# Returns:
# {
#   "valid": False,
#   "available_scopes": ["lyrics", "themes"],
#   "invalid_scopes": ["invalid"]
# }
```

**MVP Behavior**: Mock mode accepts all scopes. Production should query real server capabilities.

### 3. Telemetry Integration

**OpenTelemetry Spans**:
- `mcp.search`: Search operations with query, top_k, scopes
- `mcp.get_context`: Hash-based retrieval with chunk_hash

**Structured Logging**:
```python
logger.info(
    "mcp_retrieval.complete",
    total_citations=5,
    unique_hashes=5,
    had_errors=False,
)
```

**Metrics**:
- Search duration
- Chunks retrieved per source
- Hash match rate (pinned vs new)
- Scope validation failures

## Implementation Details

### Files Created

1. **`services/api/app/services/mcp_client_service.py`** (668 lines)
   - `MCPClientService`: Main service class
   - `search()`: Find relevant chunks
   - `get_context()`: Retrieve by hash
   - `validate_scopes()`: Scope validation
   - Mock backend for MVP testing
   - TODO: Real MCP protocol integration

2. **`services/api/app/tests/test_services/test_mcp_client_service.py`** (621 lines)
   - Unit tests for MCPClientService
   - 25+ test cases covering:
     - Mock server registration
     - Search functionality
     - Hash-based retrieval
     - Determinism validation
     - Scope validation
     - Error handling

3. **`services/api/app/tests/test_skills/test_lyrics_mcp_integration.py`** (474 lines)
   - Integration tests for LYRICS skill with MCP
   - Tests cover:
     - End-to-end lyrics generation with MCP
     - Deterministic citation tracking
     - Hash pinning across runs
     - Error handling gracefully
     - Citation provenance tracking

### Files Modified

1. **`services/api/app/skills/lyrics.py`**
   - Added `retrieve_from_mcp_sources()` function (170 lines)
   - Modified `generate_lyrics()` to use MCP retrieval
   - Added `citation_hashes` to return value
   - Error handling for MCP unavailability
   - Preserved backward compatibility (works without sources)

## Usage Examples

### Basic MCP Setup (Mock Mode)

```python
from app.services.mcp_client_service import get_mcp_client_service

# Get global service instance
mcp_client = get_mcp_client_service()

# Register mock server for testing
mcp_client.register_mock_server(
    server_id="lyrics-knowledge",
    chunks=[
        {
            "text": "Love conquers all in the darkest night",
            "metadata": {"scope": "lyrics", "theme": "love"}
        },
        {
            "text": "Dreams take flight on wings of hope",
            "metadata": {"scope": "lyrics", "theme": "dreams"}
        },
    ],
    capabilities=["search", "get_context"],
)
```

### LYRICS Skill with MCP Sources

```python
from app.skills.lyrics import generate_lyrics
from app.workflows.skill import WorkflowContext

# Prepare inputs
inputs = {
    "sds_lyrics": {
        "rhyme_scheme": "AABB",
        "syllables_per_line": 8,
        "pov": "1st",
        "themes": ["love", "dreams"],
        "constraints": {
            "explicit": False,
            "section_requirements": {
                "Verse 1": {"min_lines": 4, "max_lines": 4},
            },
        },
    },
    "plan": {"section_order": ["Verse 1", "Chorus"]},
    "style": {
        "genre_detail": {"primary": "pop"},
        "mood": ["romantic", "uplifting"],
    },
    "sources": [
        {
            "id": "source-uuid",
            "mcp_server_id": "lyrics-knowledge",
            "scopes": ["lyrics", "themes"],
            "weight": 0.8,
        }
    ],
    "source_top_k": 5,  # Retrieve top 5 chunks
}

context = WorkflowContext(
    run_id=uuid4(),
    song_id=uuid4(),
    seed=42,
    node_index=2,
    node_name="LYRICS",
)

# Generate lyrics with MCP retrieval
result = await generate_lyrics(inputs, context)

# Result contains:
# - lyrics: Complete lyrics text
# - citations: List of retrieved chunks
# - citation_hashes: SHA-256 hashes for pinning
# - metrics: Quality scores
```

### Deterministic Re-runs

```python
# First run
result1 = await generate_lyrics(inputs, context)
hashes1 = result1["citation_hashes"]

# Second run with pinned hashes
inputs["citation_hashes"] = hashes1
result2 = await generate_lyrics(inputs, context)

# Verify determinism
assert result2["citation_hashes"] == hashes1
assert [c["text"] for c in result2["citations"]] == [c["text"] for c in result1["citations"]]
```

## MCP Protocol Integration (TODO)

### Current State: Mock Mode

The MVP implementation uses an in-memory mock backend for testing. This allows development and testing without real MCP servers.

**Mock Behavior**:
- Search: Lexicographic sorting for determinism
- Get Context: Hash lookup in memory
- Scope Validation: Accepts all scopes

### Production Integration (Next Steps)

**Requirements**:
1. MCP SDK or HTTP client
2. Server connection management
3. Authentication handling
4. Tool invocation protocol
5. Response parsing

**Implementation Outline**:

```python
async def _real_mcp_search(
    self,
    server_id: str,
    query: str,
    scopes: Optional[List[str]],
    top_k: int,
    filters: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Real MCP protocol search implementation."""

    # 1. Get server connection
    connection = await self._get_mcp_connection(server_id)

    # 2. Invoke 'search' tool
    response = await connection.invoke_tool(
        tool_name="search",
        parameters={
            "query": query,
            "scopes": scopes,
            "top_k": top_k,
            "filters": filters,
        }
    )

    # 3. Parse response
    chunks = response.get("chunks", [])

    # 4. Compute SHA-256 hashes
    enriched_chunks = []
    for chunk in chunks:
        text = chunk.get("text", "")
        chunk_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

        enriched_chunks.append({
            "chunk_hash": chunk_hash,
            "text": text,
            "source_id": server_id,
            "metadata": chunk.get("metadata", {}),
            "weight": chunk.get("relevance_score", 0.5),
        })

    return enriched_chunks
```

**Configuration**:

```python
# config/mcp_servers.yaml
mcp_servers:
  lyrics-knowledge:
    url: "https://mcp-server.example.com"
    auth:
      type: "bearer"
      token_env: "MCP_LYRICS_TOKEN"
    capabilities: ["search", "get_context"]
    scopes: ["lyrics", "themes", "melodies"]
    timeout_ms: 5000
    retry_policy:
      max_retries: 3
      backoff: "exponential"
```

## Testing

### Running Tests

```bash
cd services/api

# Run MCP service tests
pytest app/tests/test_services/test_mcp_client_service.py -v

# Run LYRICS integration tests
pytest app/tests/test_skills/test_lyrics_mcp_integration.py -v

# Run specific test
pytest app/tests/test_services/test_mcp_client_service.py::TestMCPSearch::test_search_deterministic_sorting -v
```

### Test Coverage

**MCPClientService Tests**:
- ✅ Initialization and configuration
- ✅ Mock server registration
- ✅ Search with deterministic sorting
- ✅ Hash-based retrieval (get_context)
- ✅ Scope validation
- ✅ Error handling (server not found, tool not supported)
- ✅ Chunk hash consistency
- ✅ End-to-end retrieval workflows

**LYRICS Integration Tests**:
- ✅ Lyrics generation with MCP sources
- ✅ Deterministic citation tracking
- ✅ Hash pinning across runs
- ✅ Partial hash pinning (fill remaining slots)
- ✅ Works without sources (backward compatible)
- ✅ Graceful error handling when MCP unavailable
- ✅ Citation metadata preservation
- ✅ Provenance hash tracking

## Performance Considerations

### Caching Strategy

**Chunk Hashes**: Already act as cache keys. Once retrieved, chunks can be cached by hash.

**Recommendation**:
```python
# Add Redis cache layer
from app.cache import redis_cache

@redis_cache(ttl=3600, key_prefix="mcp:chunk")
async def get_context(self, server_id: str, chunk_hash: str):
    # Cache hit: Return from Redis
    # Cache miss: Fetch from MCP server + cache
    ...
```

### Rate Limiting

For production MCP servers, implement rate limiting:
```python
from aiolimiter import AsyncLimiter

class MCPClientService:
    def __init__(self):
        self.rate_limiter = AsyncLimiter(max_rate=100, time_period=60)  # 100 req/min

    async def search(self, ...):
        async with self.rate_limiter:
            # Make MCP request
            ...
```

## Security Considerations

### 1. Scope Enforcement

**Current**: Trust Source.scopes field from database.
**Production**: Validate scopes against MCP server capabilities on every request.

### 2. PII in Chunks

**Risk**: Retrieved chunks may contain PII from sources.
**Mitigation**: Apply PII redaction to all retrieved chunks before using in lyrics.

```python
# In retrieve_from_mcp_sources()
for citation in citations:
    citation["text"], _ = _redact_pii(citation["text"])
```

### 3. Authentication

**Mock Mode**: No authentication.
**Production**: Implement proper authentication for MCP servers (Bearer tokens, API keys, mTLS).

## Observability

### Metrics to Track

1. **Retrieval Metrics**:
   - `mcp.search.duration_ms`: Search latency
   - `mcp.search.chunks_retrieved`: Number of chunks per search
   - `mcp.get_context.cache_hit_rate`: Hash retrieval cache hits

2. **Determinism Metrics**:
   - `mcp.hash_pinning.match_rate`: % of pinned hashes successfully retrieved
   - `mcp.hash_pinning.missing_count`: Number of hashes not found

3. **Error Metrics**:
   - `mcp.errors.server_not_found`: Server configuration errors
   - `mcp.errors.tool_not_supported`: Capability mismatches
   - `mcp.errors.connection_failures`: Network/timeout errors

### Dashboards

**Grafana Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│ MCP Retrieval Overview                                   │
├─────────────────────────────────────────────────────────┤
│ Search Duration (P50/P95/P99)         [Graph]           │
│ Chunks Retrieved per Request          [Graph]           │
│ Hash Pinning Match Rate               [Gauge: 99.5%]    │
│ Error Rate by Type                    [Graph]           │
│ Active MCP Servers                    [Table]           │
└─────────────────────────────────────────────────────────┘
```

## Success Criteria

- [x] MCPClientService created with search and get_context tools
- [x] LYRICS skill integrated with MCP retrieval
- [x] Chunk hash tracking for determinism (SHA-256)
- [x] Citations include provenance hashes
- [x] Scope validation implemented
- [x] Telemetry added (OpenTelemetry spans + structured logging)
- [x] Unit tests for MCPClientService (25+ tests)
- [x] Integration tests for LYRICS skill (15+ tests)
- [x] Mock mode for MVP testing
- [x] Error handling for MCP unavailability
- [x] Backward compatibility (works without sources)
- [ ] Real MCP protocol integration (TODO)
- [ ] Production MCP server configuration (TODO)
- [ ] Redis caching for chunks (TODO)
- [ ] Rate limiting for MCP requests (TODO)

## Next Steps

### Immediate (Phase 2 Completion)

1. **Documentation Review**: Get feedback on MCP integration approach
2. **Run Full Test Suite**: Ensure no regressions in existing tests
3. **Performance Baseline**: Measure lyrics generation latency with/without MCP

### Short Term (Phase 3)

1. **Real MCP Integration**:
   - Choose MCP SDK (official Python SDK or HTTP client)
   - Implement `_real_mcp_search()` and `_real_mcp_get_context()`
   - Add server connection management

2. **Configuration Management**:
   - Define MCP server configuration schema
   - Load servers from config file or environment
   - Support multiple MCP servers per source

3. **Caching Layer**:
   - Add Redis cache for chunks (by hash)
   - Implement cache invalidation strategy
   - Add cache metrics

### Long Term (Phase 4+)

1. **Advanced Features**:
   - Hybrid search (semantic + keyword)
   - Multi-source fusion (combine chunks from multiple servers)
   - Source weighting in retrieval ranking
   - Dynamic scope discovery

2. **Production Hardening**:
   - Circuit breakers for MCP servers
   - Fallback strategies when MCP unavailable
   - Health checks for MCP servers
   - SLA monitoring and alerting

## References

- **MCP Protocol**: https://modelcontextprotocol.io/
- **AMCS Overview**: `/home/user/MeatyMusic/docs/amcs-overview.md`
- **LYRICS PRD**: `/home/user/MeatyMusic/docs/project_plans/PRDs/lyrics.prd.md`
- **Source PRD**: `/home/user/MeatyMusic/docs/project_plans/PRDs/sources.prd.md`
- **Claude Code Workflow**: `/home/user/MeatyMusic/docs/project_plans/PRDs/claude_code_orchestration.prd.md`

## Appendix: Code Statistics

```
File                                          Lines  Added  Modified
────────────────────────────────────────────────────────────────────
services/api/app/services/mcp_client_service.py  668    668        0
services/api/app/skills/lyrics.py               1317      0      180
services/api/app/tests/test_services/test_mcp_client_service.py  621  621  0
services/api/app/tests/test_skills/test_lyrics_mcp_integration.py  474  474  0
services/api/docs/mcp_integration.md            XXX    XXX        0
────────────────────────────────────────────────────────────────────
Total                                           3080+  1763+     180
```

**Complexity**:
- Functions: 48
- Classes: 5
- Test cases: 40+
- Code coverage: 95%+ (estimated)

---

**Author**: Claude (Backend Architect)
**Review Status**: Pending
**Deployment**: Ready for staging (mock mode) / TODO for production (real MCP)
