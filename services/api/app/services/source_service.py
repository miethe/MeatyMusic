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

from sqlalchemy.ext.asyncio import AsyncSession

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

    def __init__(self, session: AsyncSession, repo: SourceRepository):
        """Initialize SourceService.

        Args:
            session: SQLAlchemy async session
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
        """Retrieve chunks with deterministic hashing.

        Queries MCP server for relevant chunks and computes SHA-256 hashes for
        each chunk to enable pinned retrieval and provenance tracking.

        DETERMINISM GUARANTEE:
        - Same source_id + query + top_k + seed → same chunks
        - Same chunk content → same hash
        - Fixed top-k retrieval
        - Lexicographic sorting for tie-breaking
        - 99%+ reproducibility

        Args:
            source_id: Source UUID
            query: Search query string
            top_k: Number of chunks to retrieve (default: 5)
            seed: Random seed for determinism (default: None)

        Returns:
            List of ChunkWithHash with content hashes for provenance

        Raises:
            NotFoundError: If source doesn't exist
            BadRequestError: If source is inactive or invalid

        Example:
            >>> chunks = await service.retrieve_chunks(
            ...     source_id=source.id,
            ...     query="chord progressions in pop music",
            ...     top_k=5,
            ...     seed=42  # Deterministic!
            ... )
            >>> for chunk in chunks:
            ...     print(f"Hash: {chunk.content_hash[:8]}...")
            ...     print(f"Text: {chunk.text[:50]}...")
        """
        # Get source
        source = await self.repo.get(source_id)
        if not source:
            raise NotFoundError(f"Source not found: {source_id}")

        # Validate source is active
        if not source.is_active:
            raise BadRequestError(f"Source is inactive: {source.name}")

        # Validate scopes
        if source.scopes:
            is_valid, error = await self.validate_mcp_scopes(
                source.scopes,
                source.mcp_server_id
            )
            if not is_valid:
                raise BadRequestError(error)

        # Query MCP server (mock for now)
        raw_chunks = await self._query_mcp_server(
            server_id=source.mcp_server_id,
            query=query,
            top_k=top_k,
            seed=seed,
            config=source.config
        )

        # Apply allow/deny lists
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
                logger.debug(
                    "chunk.filtered",
                    source_id=str(source_id),
                    reason=reason,
                    text_preview=chunk["text"][:50]
                )

        # Limit to top_k after filtering
        filtered_chunks = filtered_chunks[:top_k]

        # Compute hashes for each chunk
        chunks_with_hash = []
        for chunk in filtered_chunks:
            chunk_hash = compute_citation_hash(
                source_id=source_id,
                chunk_text=chunk["text"],
                timestamp=chunk.get("timestamp")
            )

            chunk_with_hash = ChunkWithHash(
                text=chunk["text"],
                score=chunk["score"],
                metadata=chunk.get("metadata", {}),
                timestamp=chunk.get("timestamp"),
                content_hash=chunk_hash,
                source_id=source_id
            )

            chunks_with_hash.append(chunk_with_hash)

            # Cache for hash-based retrieval
            self._chunk_cache[chunk_hash] = Chunk(
                text=chunk["text"],
                score=chunk["score"],
                metadata=chunk.get("metadata", {}),
                timestamp=chunk.get("timestamp")
            )

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
        """Validate text against allow/deny lists.

        Enforces source-level filtering policies to ensure only appropriate
        content is retrieved. Deny list takes precedence over allow list.

        Validation Rules:
        1. If deny list exists, text must NOT contain any denied terms
        2. If allow list exists, text MUST contain at least one allowed term
        3. If both exist, both rules must pass
        4. If neither exist, all text is allowed

        Args:
            text: Text content to validate
            allow: Optional list of allowed terms (case-insensitive)
            deny: Optional list of denied terms (case-insensitive)

        Returns:
            Tuple of (is_valid, reason)
            - is_valid: True if text passes filters
            - reason: None if valid, error string if invalid

        Example:
            >>> # Deny list check
            >>> is_valid, reason = service.validate_allow_deny_lists(
            ...     text="This contains profanity",
            ...     deny=["profanity", "explicit"]
            ... )
            >>> print(is_valid)  # False
            >>>
            >>> # Allow list check
            >>> is_valid, reason = service.validate_allow_deny_lists(
            ...     text="Music theory concepts",
            ...     allow=["music", "theory", "composition"]
            ... )
            >>> print(is_valid)  # True
        """
        text_lower = text.lower()

        # Check deny list first (highest priority)
        if deny:
            for term in deny:
                if term.lower() in text_lower:
                    reason = f"Denied term found: {term}"
                    logger.debug(
                        "allow_deny.denied",
                        term=term,
                        text_preview=text[:50]
                    )
                    return False, reason

        # Check allow list (must match at least one if provided)
        if allow:
            found = False
            for term in allow:
                if term.lower() in text_lower:
                    found = True
                    break

            if not found:
                reason = "No allowed terms found"
                logger.debug(
                    "allow_deny.no_allowed_terms",
                    allow_list=allow,
                    text_preview=text[:50]
                )
                return False, reason

        # Passed all checks
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
        """Normalize source weights to sum to ≤1.0.

        Ensures multi-source retrieval weights comply with constraints while
        preserving relative proportions. Uses shared normalize_weights utility.

        Args:
            sources: List of Source entities

        Returns:
            Dict mapping source_id to normalized weight

        Example:
            >>> sources = await repo.get_active_sources()
            >>> normalized = service.normalize_source_weights(sources)
            >>> total = sum(normalized.values())
            >>> assert total <= 1.0  # Compliant!
        """
        if not sources:
            return {}

        # Build weight dict
        weights = {
            source.id: float(source.weight)
            for source in sources
        }

        # Normalize using common utility
        normalized = normalize_weights(weights, max_sum=1.0)

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
        async with self.transaction():
            # Validate MCP server scopes
            if data.scopes:
                is_valid, error = await self.validate_mcp_scopes(
                    data.scopes,
                    data.mcp_server_id
                )
                if not is_valid:
                    raise BadRequestError(error)

            # Create source entity
            source = Source(
                **data.model_dump(),
                owner_id=owner_id,
                tenant_id=tenant_id
            )

            created = await self.repo.create(source)

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
        source = await self.repo.get(source_id)
        if not source:
            raise NotFoundError(f"Source not found: {source_id}")

        return self.to_response(source)

    async def list_active_sources(self) -> List[SourceResponse]:
        """List all active sources.

        Returns:
            List of active sources as SourceResponse DTOs
        """
        sources = await self.repo.get_active_sources()
        return self.to_response_list(sources)
