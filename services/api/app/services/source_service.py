"""Service layer for Source entity with MCP integration.

This module provides the SourceService for managing external data sources with
MCP (Model Context Protocol) server integration, deterministic chunk retrieval,
and allow/deny list enforcement.

Key Features:
- MCP server discovery and validation
- Deterministic chunk retrieval with SHA-256 hashing
- Pinned retrieval by content hash (99%+ reproducibility)
- Allow/deny list enforcement
- Weight normalization for multi-source retrieval
- Provenance tracking for citations
"""

from __future__ import annotations

from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
import random
import structlog

from sqlalchemy.orm import Session

from app.repositories.source_repo import SourceRepository
from app.schemas.source import (
    SourceCreate,
    SourceUpdate,
    SourceResponse,
    ChunkWithHash,
    Chunk,
    MCPServerInfo,
)
from app.models.source import Source
from app.errors import NotFoundError, BadRequestError
from .base_service import BaseService
from .common import compute_citation_hash, normalize_weights

logger = structlog.get_logger(__name__)


class SourceService(BaseService[Source, SourceResponse, SourceCreate, SourceUpdate]):
    """Service for source management with MCP integration.

    Provides MCP server discovery, deterministic chunk retrieval, and allow/deny
    list enforcement for external data sources used in retrieval-augmented generation.

    Determinism Guarantees:
    - Same query + seed → same chunks (99%+ reproducibility)
    - Content hash-based retrieval (SHA-256)
    - Fixed top-k with lexicographic tie-breaking
    - Pinned retrieval by hash for reproducibility

    Examples:
        >>> # Create service
        >>> service = SourceService(session, repo)
        >>>
        >>> # Discover MCP servers
        >>> servers = await service.discover_mcp_servers()
        >>>
        >>> # Retrieve chunks with deterministic hashing
        >>> chunks = await service.retrieve_chunks(
        ...     source_id=source.id,
        ...     query="music theory concepts",
        ...     top_k=5,
        ...     seed=42  # For determinism
        ... )
        >>>
        >>> # Retrieve by hash (pinned retrieval)
        >>> chunk = await service.retrieve_by_hash(source.id, chunk_hash)
    """

    def __init__(self, session: Session, repo: SourceRepository):
        """Initialize SourceService.

        Args:
            session: SQLAlchemy synchronous session
            repo: SourceRepository instance
        """
        super().__init__(session, SourceResponse)
        self.repo = repo
        self._mcp_servers: Dict[str, MCPServerInfo] = {}
        self._chunk_cache: Dict[str, Chunk] = {}  # Hash -> Chunk cache

    # =========================================================================
    # MCP Integration (N6-11)
    # =========================================================================

    async def discover_mcp_servers(self) -> List[MCPServerInfo]:
        """Discover available MCP servers.

        Queries the MCP ecosystem for available servers and their capabilities.
        For MVP, returns a mock server for testing. In production, this would
        integrate with actual MCP server discovery protocols.

        Returns:
            List of MCPServerInfo with server details and capabilities

        Example:
            >>> servers = await service.discover_mcp_servers()
            >>> for server in servers:
            ...     print(f"{server.name}: {server.capabilities}")
            Mock MCP Server: ['chunk_retrieval', 'search']
        """
        # TODO: Implement real MCP server discovery
        # For MVP, return mock server for testing
        mock_server = MCPServerInfo(
            server_id="mock-mcp-v1",
            name="Mock MCP Server",
            capabilities=["chunk_retrieval", "search", "semantic_search"],
            scopes=["public", "test", "music", "lyrics"],
            version="1.0.0",
            metadata={
                "provider": "meatymusic",
                "region": "us-east-1",
                "max_chunk_size": 2000,
                "supports_pinned_retrieval": True
            }
        )

        # Store in server registry
        self._mcp_servers[mock_server.server_id] = mock_server

        logger.info(
            "mcp.servers_discovered",
            count=1,
            servers=[mock_server.server_id]
        )

        return [mock_server]

    async def validate_mcp_scopes(
        self,
        scopes: List[str],
        server_id: str
    ) -> Tuple[bool, Optional[str]]:
        """Validate requested scopes against server capabilities.

        Checks that all requested scopes are available on the MCP server
        and enforces allow/deny list policies.

        Args:
            scopes: List of requested scopes (e.g., ['music', 'lyrics'])
            server_id: MCP server identifier

        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if all scopes are valid
            - error_message: None if valid, error string if invalid

        Example:
            >>> is_valid, error = await service.validate_mcp_scopes(
            ...     scopes=['music', 'lyrics'],
            ...     server_id='mock-mcp-v1'
            ... )
            >>> if not is_valid:
            ...     print(f"Invalid scopes: {error}")
        """
        # Discover servers if not cached
        if server_id not in self._mcp_servers:
            await self.discover_mcp_servers()

        # Check if server exists
        server = self._mcp_servers.get(server_id)
        if not server:
            error_msg = f"MCP server not found: {server_id}"
            logger.warning("mcp.server_not_found", server_id=server_id)
            return False, error_msg

        # Validate each scope
        invalid_scopes = []
        for scope in scopes:
            if scope not in server.scopes:
                invalid_scopes.append(scope)

        if invalid_scopes:
            error_msg = (
                f"Invalid scopes for server {server_id}: {invalid_scopes}. "
                f"Available scopes: {server.scopes}"
            )
            logger.warning(
                "mcp.invalid_scopes",
                server_id=server_id,
                invalid_scopes=invalid_scopes,
                available_scopes=server.scopes
            )
            return False, error_msg

        logger.debug(
            "mcp.scopes_validated",
            server_id=server_id,
            scopes=scopes
        )

        return True, None

    def create_mcp_mock_server(
        self,
        server_id: str = "test-mock-server",
        capabilities: Optional[List[str]] = None,
        scopes: Optional[List[str]] = None
    ) -> MCPServerInfo:
        """Create mock MCP server for testing.

        Useful for determinism tests and development without real MCP infrastructure.

        Args:
            server_id: Custom server ID (default: "test-mock-server")
            capabilities: List of capabilities (default: basic retrieval)
            scopes: List of scopes (default: ["test"])

        Returns:
            MCPServerInfo for the mock server

        Example:
            >>> mock_server = service.create_mcp_mock_server(
            ...     server_id="test-server",
            ...     capabilities=["chunk_retrieval"],
            ...     scopes=["test", "music"]
            ... )
            >>> # Use for testing
            >>> chunks = await service.retrieve_chunks(
            ...     source_id=source.id,
            ...     query="test query",
            ...     top_k=3
            ... )
        """
        if capabilities is None:
            capabilities = ["chunk_retrieval", "search"]

        if scopes is None:
            scopes = ["test"]

        mock_server = MCPServerInfo(
            server_id=server_id,
            name=f"Mock Server: {server_id}",
            capabilities=capabilities,
            scopes=scopes,
            version="test-1.0.0",
            metadata={"is_mock": True}
        )

        # Register in server cache
        self._mcp_servers[server_id] = mock_server

        logger.info(
            "mcp.mock_server_created",
            server_id=server_id,
            capabilities=capabilities,
            scopes=scopes
        )

        return mock_server

    # =========================================================================
    # Chunk Retrieval (N6-12)
    # =========================================================================

    async def retrieve_chunks(
        self,
        source_id: UUID,
        query: str,
        top_k: int = 5,
        seed: Optional[int] = None
    ) -> List[ChunkWithHash]:
        """Retrieve chunks with deterministic hashing and policy enforcement.

        Core retrieval method for retrieval-augmented generation (RAG). Queries
        MCP servers for relevant chunks, applies allow/deny filters, and computes
        SHA-256 hashes for deterministic provenance tracking.

        DETERMINISM GUARANTEE (99%+ reproducibility):
        - Same source_id + query + top_k + seed → same chunks
        - Same chunk content → identical hash (SHA-256)
        - Fixed top-k retrieval with lexicographic tie-breaking
        - Pinned retrieval possible via content_hash
        - Seed propagation ensures RNG reproducibility

        Retrieval Pipeline:
        1. Validate source exists and is active
        2. Validate MCP scopes against server capabilities
        3. Query MCP server (with seed for determinism)
        4. Apply allow/deny list filters (security policy)
        5. Limit to top_k results after filtering
        6. Compute SHA-256 hash for each chunk (provenance)
        7. Cache chunks locally for hash-based retrieval
        8. Return chunks with hashes

        Args:
            source_id: Source UUID to query
            query: Search query string (e.g., "chord progressions in pop")
            top_k: Maximum number of chunks to retrieve (default: 5)
            seed: Random seed for determinism (default: None = not deterministic)

        Returns:
            List of ChunkWithHash objects with:
            - text: Chunk content
            - score: Relevance score (0.0-1.0)
            - metadata: Associated metadata
            - timestamp: Creation/update timestamp if available
            - content_hash: SHA-256 hash (64 hex chars) for provenance
            - source_id: Source UUID for validation

        Raises:
            NotFoundError: If source doesn't exist in database
            BadRequestError: If source is inactive or scopes invalid

        Example:
            >>> # Deterministic retrieval with seed
            >>> chunks = await service.retrieve_chunks(
            ...     source_id=source.id,
            ...     query="chord progressions in pop music",
            ...     top_k=5,
            ...     seed=42  # Deterministic!
            ... )
            >>> for chunk in chunks:
            ...     print(f"Hash: {chunk.content_hash[:8]}...")  # First 8 chars
            ...     print(f"Score: {chunk.score:.2f}")
            ...     print(f"Text: {chunk.text[:50]}...")
        """
        # =====================================================================
        # Step 1: Validate Source
        # =====================================================================
        # Get source
        source = self.repo.get(source_id)
        if not source:
            raise NotFoundError(f"Source not found: {source_id}")

        # Validate source is active (inactive sources are excluded from retrieval)
        if not source.is_active:
            raise BadRequestError(f"Source is inactive: {source.name}")

        # =====================================================================
        # Step 2: Validate MCP Server Scopes
        # =====================================================================
        # Validate that all requested scopes are available on the MCP server
        # Scopes are permissions (e.g., 'music', 'lyrics', 'public')
        if source.scopes:
            is_valid, error = await self.validate_mcp_scopes(
                source.scopes,
                source.mcp_server_id
            )
            if not is_valid:
                raise BadRequestError(error)

        # =====================================================================
        # Step 3: Query MCP Server
        # =====================================================================
        # Execute query with seed for determinism
        # Seed ensures same query = same chunks (reproducibility)
        raw_chunks = await self._query_mcp_server(
            server_id=source.mcp_server_id,
            query=query,
            top_k=top_k,
            seed=seed,
            config=source.config
        )

        # =====================================================================
        # Step 4: Apply Allow/Deny List Filters (Policy Enforcement)
        # =====================================================================
        # Filter chunks based on source's allow/deny lists
        # Deny list: Block chunks containing denied terms
        # Allow list: Only keep chunks containing allowed terms
        filtered_chunks = []
        for chunk in raw_chunks:
            is_allowed, reason = self.validate_allow_deny_lists(
                text=chunk["text"],
                allow=source.allow,
                deny=source.deny
            )

            if is_allowed:
                filtered_chunks.append(chunk)
            else:
                # Chunk was filtered out due to policy
                logger.debug(
                    "chunk.filtered",
                    source_id=str(source_id),
                    reason=reason,
                    text_preview=chunk["text"][:50]
                )

        # =====================================================================
        # Step 5: Limit to top_k After Filtering
        # =====================================================================
        # Ensure final result doesn't exceed top_k
        # (filtering may reduce count below top_k)
        filtered_chunks = filtered_chunks[:top_k]

        # =====================================================================
        # Step 6: Compute SHA-256 Hashes for Deterministic Provenance
        # =====================================================================
        # Each chunk gets a deterministic hash based on:
        # - source_id (which source it came from)
        # - chunk_text (the exact content)
        # - timestamp (when it was created/updated)
        chunks_with_hash = []
        for chunk in filtered_chunks:
            # Compute deterministic SHA-256 hash (64 hex chars)
            chunk_hash = compute_citation_hash(
                source_id=source_id,
                chunk_text=chunk["text"],
                timestamp=chunk.get("timestamp")
            )

            # Build response object with hash
            chunk_with_hash = ChunkWithHash(
                text=chunk["text"],
                score=chunk["score"],
                metadata=chunk.get("metadata", {}),
                timestamp=chunk.get("timestamp"),
                content_hash=chunk_hash,  # 64-char hex SHA-256 hash
                source_id=source_id
            )

            chunks_with_hash.append(chunk_with_hash)

            # ===================================================================
            # Step 7: Cache Chunks Locally for Hash-Based Retrieval
            # ===================================================================
            # Store chunk in local cache keyed by hash
            # Later calls to retrieve_by_hash() will check this cache first
            self._chunk_cache[chunk_hash] = Chunk(
                text=chunk["text"],
                score=chunk["score"],
                metadata=chunk.get("metadata", {}),
                timestamp=chunk.get("timestamp")
            )

        # Log retrieval metrics for observability
        logger.info(
            "chunks.retrieved",
            source_id=str(source_id),
            query=query[:50],
            requested=top_k,
            raw_count=len(raw_chunks),
            filtered_count=len(filtered_chunks),
            final_count=len(chunks_with_hash),
            seed=seed
        )

        return chunks_with_hash

    async def retrieve_by_hash(
        self,
        source_id: UUID,
        chunk_hash: str
    ) -> Optional[Chunk]:
        """Retrieve chunk by content hash (pinned retrieval).

        Enables deterministic retrieval by exact content hash. This guarantees
        that the same hash always returns the same chunk content, critical for
        reproducibility in AMCS workflows.

        Args:
            source_id: Source UUID for provenance validation
            chunk_hash: SHA-256 hash of chunk content (64 hex chars)

        Returns:
            Chunk if found, None otherwise

        Example:
            >>> # First retrieval
            >>> chunks = await service.retrieve_chunks(source.id, "query", seed=42)
            >>> hash1 = chunks[0].content_hash
            >>>
            >>> # Later retrieval by hash (pinned)
            >>> chunk = await service.retrieve_by_hash(source.id, hash1)
            >>> assert chunk.text == chunks[0].text  # Same content!
        """
        # Validate hash format
        if len(chunk_hash) != 64:
            logger.warning(
                "chunk.invalid_hash_length",
                source_id=str(source_id),
                hash_length=len(chunk_hash)
            )
            return None

        # Check cache first
        if chunk_hash in self._chunk_cache:
            logger.debug(
                "chunk.retrieved_from_cache",
                source_id=str(source_id),
                chunk_hash=chunk_hash[:16]
            )
            return self._chunk_cache[chunk_hash]

        # TODO: Implement persistent hash-based lookup
        # For MVP, only cache is available
        # In production, this would query:
        # 1. Redis cache with hash keys
        # 2. PostgreSQL with chunk_hash index
        # 3. MCP server with hash-based retrieval

        logger.info(
            "chunk.not_found_by_hash",
            source_id=str(source_id),
            chunk_hash=chunk_hash[:16]
        )

        return None

    def validate_allow_deny_lists(
        self,
        text: str,
        allow: Optional[List[str]] = None,
        deny: Optional[List[str]] = None
    ) -> Tuple[bool, Optional[str]]:
        """Validate text against allow/deny lists for policy enforcement.

        Enforces source-level filtering policies to ensure only appropriate
        content is retrieved. This is part of MeatyMusic safety guardrails.

        Validation Logic (DENY takes precedence):
        1. Deny list: If ANY denied term found in text → REJECT (return False)
        2. Allow list: If allow list exists, REQUIRE at least ONE allowed term
        3. Both lists: Both must pass (deny fails = reject; allow fails = reject)
        4. No lists: ACCEPT (no filtering applied)

        This enables granular content filtering:
        - Deny: ["profanity", "explicit"] → filters out inappropriate content
        - Allow: ["music", "theory"] → only retrieves musicology content
        - Both: Ensures content is relevant AND appropriate

        Args:
            text: Text content to validate against filters
            allow: Optional list of allowed/required terms (case-insensitive)
                   If provided, text MUST contain at least one of these
            deny: Optional list of denied/forbidden terms (case-insensitive)
                   If provided, text MUST NOT contain any of these

        Returns:
            Tuple of (is_valid, reason)
            - is_valid: True if text passes all filters
            - reason: None if valid, error string describing why invalid

        Example:
            >>> # Deny list check
            >>> is_valid, reason = service.validate_allow_deny_lists(
            ...     text="This contains profanity",
            ...     deny=["profanity", "explicit"]
            ... )
            >>> print(is_valid)  # False
            >>> print(reason)  # "Denied term found: profanity"
            >>>
            >>> # Allow list check (only music-related content)
            >>> is_valid, reason = service.validate_allow_deny_lists(
            ...     text="Music theory concepts",
            ...     allow=["music", "theory", "composition"]
            ... )
            >>> print(is_valid)  # True (contains "music" and "theory")
            >>>
            >>> # Both lists
            >>> is_valid, reason = service.validate_allow_deny_lists(
            ...     text="Music with explicit lyrics",
            ...     allow=["music"],
            ...     deny=["explicit", "profanity"]
            ... )
            >>> print(is_valid)  # False (contains denied term "explicit")
        """
        # Convert to lowercase for case-insensitive matching
        text_lower = text.lower()

        # =====================================================================
        # Check 1: Deny List (HIGHEST PRIORITY)
        # =====================================================================
        # If deny list exists, block ANY text containing denied terms
        # This is a blocklist - immediate rejection if match found
        if deny:
            for term in deny:
                # Substring match (case-insensitive)
                if term.lower() in text_lower:
                    reason = f"Denied term found: {term}"
                    logger.debug(
                        "allow_deny.denied",
                        term=term,
                        text_preview=text[:50]
                    )
                    return False, reason

        # =====================================================================
        # Check 2: Allow List (if provided, must match at least one term)
        # =====================================================================
        # If allow list exists, require at least ONE allowed term present
        # This is an allowlist/whitelist - must match to pass
        if allow:
            found = False
            for term in allow:
                # Substring match (case-insensitive)
                if term.lower() in text_lower:
                    found = True
                    break

            # If allow list was provided but no term matched, reject
            if not found:
                reason = "No allowed terms found"
                logger.debug(
                    "allow_deny.no_allowed_terms",
                    allow_list=allow,
                    text_preview=text[:50]
                )
                return False, reason

        # =====================================================================
        # Passed all checks - text is valid
        # =====================================================================
        logger.debug(
            "allow_deny.passed",
            has_allow=bool(allow),
            has_deny=bool(deny)
        )

        return True, None

    def normalize_source_weights(
        self,
        sources: List[Source]
    ) -> Dict[UUID, float]:
        """Normalize source weights to sum to ≤1.0 for multi-source retrieval.

        Scales multiple source weights proportionally so they sum to ≤1.0,
        ensuring compliance with retrieval constraints. This is used when
        retrieving chunks from multiple sources simultaneously.

        Weight Normalization Strategy:
        - If sum(weights) ≤ 1.0 → no scaling needed (return as-is)
        - If sum(weights) > 1.0 → scale all weights proportionally
        - Maintains relative proportions between sources
        - Examples:
          * [0.5, 0.5] → [0.5, 0.5] (already valid)
          * [0.8, 0.6] → [0.571, 0.429] (scaled by 1.0/1.4)
          * [2.0, 3.0] → [0.4, 0.6] (scaled by 1.0/5.0)

        Args:
            sources: List of Source entities with weight properties

        Returns:
            Dict mapping source_id (UUID) to normalized weight (float)
            All values sum to ≤ 1.0

        Example:
            >>> # Multiple sources with different weights
            >>> sources = [
            ...     Source(id=uuid1, weight=0.8),
            ...     Source(id=uuid2, weight=0.6),  # Total = 1.4 (over limit)
            ... ]
            >>> normalized = service.normalize_source_weights(sources)
            >>> # Normalized to: {uuid1: 0.571, uuid2: 0.429}
            >>> assert sum(normalized.values()) <= 1.0  # Compliant!
        """
        if not sources:
            return {}

        # Build weight dict from source entities
        weights = {
            source.id: float(source.weight)
            for source in sources
        }

        # Normalize weights using shared utility (ensures sum ≤ 1.0)
        normalized = normalize_weights(weights, max_sum=1.0)

        # Log for debugging/observability
        logger.info(
            "source_weights.normalized",
            source_count=len(sources),
            original_sum=sum(weights.values()),
            normalized_sum=sum(normalized.values()),
            scale_needed=sum(weights.values()) > 1.0
        )

        return normalized

    # =========================================================================
    # Private Helper Methods
    # =========================================================================

    async def _query_mcp_server(
        self,
        server_id: str,
        query: str,
        top_k: int,
        seed: Optional[int],
        config: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Query MCP server for chunks (mock implementation).

        TODO: Replace with real MCP protocol implementation.

        Args:
            server_id: MCP server identifier
            query: Search query
            top_k: Number of results
            seed: Random seed for determinism
            config: Source-specific configuration

        Returns:
            List of raw chunk dicts with text, score, metadata
        """
        # Use seed for determinism
        if seed is not None:
            random.seed(seed)

        # Generate deterministic mock chunks
        chunks = []
        for i in range(top_k):
            # Generate deterministic content based on query + seed + i
            chunk_text = f"Chunk {i} for query '{query}' (seed={seed})"

            chunks.append({
                "text": chunk_text,
                "score": 1.0 - (i * 0.15),  # Descending scores
                "metadata": {
                    "chunk_id": i,
                    "source": "mock_mcp",
                    "query": query
                },
                "timestamp": None
            })

        # Sort lexicographically for tie-breaking (determinism)
        chunks.sort(key=lambda x: (x["score"], x["text"]), reverse=True)

        logger.debug(
            "mcp.query_executed",
            server_id=server_id,
            query=query[:50],
            top_k=top_k,
            seed=seed,
            result_count=len(chunks)
        )

        return chunks

    # =========================================================================
    # Standard CRUD Operations (inherited + customized)
    # =========================================================================

    async def create_source(
        self,
        data: SourceCreate,
        owner_id: UUID,
        tenant_id: UUID
    ) -> SourceResponse:
        """Create a new source with validation.

        Args:
            data: Source creation data
            owner_id: Owner user ID
            tenant_id: Tenant ID for multi-tenancy

        Returns:
            Created source as SourceResponse

        Raises:
            BadRequestError: If validation fails
        """
        with self.transaction():
            # Validate MCP server scopes
            if data.scopes:
                is_valid, error = await self.validate_mcp_scopes(
                    data.scopes,
                    data.mcp_server_id
                )
                if not is_valid:
                    raise BadRequestError(error)

            # Create source entity (pass Pydantic model with extra fields)
            created = self.repo.create(data)

            logger.info(
                "source.created",
                source_id=str(created.id),
                name=created.name,
                kind=created.kind,
                mcp_server_id=created.mcp_server_id
            )

            return self.to_response(created)

    async def get_source(self, source_id: UUID) -> SourceResponse:
        """Get source by ID.

        Args:
            source_id: Source UUID

        Returns:
            SourceResponse

        Raises:
            NotFoundError: If source doesn't exist
        """
        source = self.repo.get(source_id)
        if not source:
            raise NotFoundError(f"Source not found: {source_id}")

        return self.to_response(source)

    async def list_active_sources(self) -> List[SourceResponse]:
        """List all active sources.

        Returns:
            List of active sources as SourceResponse DTOs
        """
        sources = self.repo.get_active_sources()
        return self.to_response_list(sources)
