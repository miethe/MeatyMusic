"""MCP (Model Context Protocol) Client Service for RAG retrieval.

This service provides a wrapper around MCP servers for deterministic retrieval-
augmented generation. It supports the search and get_context tools with chunk
hash tracking for reproducibility.

For MVP, this implementation provides a mock-friendly interface that can be
replaced with actual MCP protocol integration when real servers are available.

Architecture:
    - MCPClientService: Main service for MCP operations
    - search(): Find relevant chunks from MCP sources
    - get_context(): Retrieve specific chunk by hash
    - Chunk hash tracking for determinism (SHA-256)
    - Scope validation against Source.scopes
    - OpenTelemetry spans for observability

MCP Protocol Reference:
    https://modelcontextprotocol.io/
"""

from __future__ import annotations

import hashlib
from typing import Any, Dict, List, Optional
from uuid import UUID

import structlog
from opentelemetry import trace

logger = structlog.get_logger(__name__)
tracer = trace.get_tracer(__name__)


class MCPConnectionError(Exception):
    """Raised when MCP server connection fails."""

    pass


class MCPServerNotFoundError(Exception):
    """Raised when specified MCP server is not configured."""

    pass


class MCPToolNotSupportedError(Exception):
    """Raised when MCP server doesn't support requested tool."""

    pass


class MCPClientService:
    """Client service for MCP server interactions.

    Provides deterministic retrieval from MCP sources with chunk hash tracking,
    scope validation, and telemetry integration.

    For MVP, this service uses an in-memory mock backend. Production deployment
    should integrate with actual MCP server protocol via SDK or HTTP.

    Attributes:
        mcp_servers: Registry of configured MCP servers {server_id: config}
        mock_mode: Whether to use mock data (default True for MVP)

    Example:
        ```python
        service = MCPClientService()

        # Register mock server for testing
        service.register_mock_server(
            server_id="local-knowledge",
            chunks=[
                {"text": "Verse about love...", "metadata": {"source": "lyrics_db"}},
                {"text": "Chorus about dreams...", "metadata": {"source": "lyrics_db"}},
            ]
        )

        # Search for relevant chunks
        results = await service.search(
            server_id="local-knowledge",
            query="love and dreams",
            scopes=["lyrics", "themes"],
            top_k=5,
            seed=42,
        )

        # Get specific chunk by hash
        chunk = await service.get_context(
            server_id="local-knowledge",
            chunk_hash="abc123...",
        )
        ```
    """

    def __init__(self, mock_mode: bool = True):
        """Initialize MCP client service.

        Args:
            mock_mode: Use mock backend for testing (default True for MVP)
        """
        self.mock_mode = mock_mode
        self.mcp_servers: Dict[str, Dict[str, Any]] = {}
        self._mock_data: Dict[str, List[Dict[str, Any]]] = {}

        logger.info(
            "mcp_client.init",
            mock_mode=mock_mode,
        )

    def register_mock_server(
        self,
        server_id: str,
        chunks: List[Dict[str, Any]],
        capabilities: Optional[List[str]] = None,
    ) -> None:
        """Register a mock MCP server for testing.

        This method is for MVP testing only. Production should use real MCP
        server registration via configuration.

        Args:
            server_id: Unique server identifier
            chunks: List of chunks with {text, metadata} structure
            capabilities: List of supported tools (default: ["search", "get_context"])
        """
        if not self.mock_mode:
            logger.warning(
                "mcp_client.mock_register_ignored",
                server_id=server_id,
                reason="Not in mock mode",
            )
            return

        if capabilities is None:
            capabilities = ["search", "get_context"]

        # Compute hashes for all chunks
        enriched_chunks = []
        for chunk in chunks:
            chunk_text = chunk.get("text", "")
            chunk_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()

            enriched_chunks.append(
                {
                    "text": chunk_text,
                    "chunk_hash": chunk_hash,
                    "metadata": chunk.get("metadata", {}),
                }
            )

        self.mcp_servers[server_id] = {
            "server_id": server_id,
            "capabilities": capabilities,
            "status": "active",
        }
        self._mock_data[server_id] = enriched_chunks

        logger.info(
            "mcp_client.mock_server_registered",
            server_id=server_id,
            num_chunks=len(enriched_chunks),
            capabilities=capabilities,
        )

    async def search(
        self,
        server_id: str,
        query: str,
        scopes: Optional[List[str]] = None,
        top_k: int = 5,
        seed: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search for relevant chunks in MCP server.

        This method performs deterministic retrieval with lexicographic sorting
        for reproducibility. Scopes are validated against server capabilities.

        Args:
            server_id: MCP server identifier
            query: Search query text
            scopes: List of allowed scopes (e.g., ["lyrics", "themes"])
            top_k: Number of chunks to return
            seed: Seed for deterministic selection (currently unused due to lexicographic sort)
            filters: Additional filters (metadata, source type, etc.)

        Returns:
            List of chunks with structure:
                - chunk_hash: SHA-256 hash of text
                - text: Chunk content
                - source_id: Source identifier (server_id)
                - metadata: Additional metadata
                - weight: Relevance weight (0.0-1.0, default 0.5 for mock)

        Raises:
            MCPServerNotFoundError: If server_id not configured
            MCPToolNotSupportedError: If search tool not supported
            MCPConnectionError: If connection to server fails

        Example:
            ```python
            chunks = await service.search(
                server_id="local-knowledge",
                query="love and dreams",
                scopes=["lyrics"],
                top_k=5,
                seed=42,
            )
            # Returns: [
            #     {
            #         "chunk_hash": "abc123...",
            #         "text": "Verse about love...",
            #         "source_id": "local-knowledge",
            #         "metadata": {"source": "lyrics_db"},
            #         "weight": 0.5
            #     },
            #     ...
            # ]
            ```
        """
        with tracer.start_as_current_span("mcp.search") as span:
            span.set_attribute("mcp.server_id", server_id)
            span.set_attribute("mcp.query", query[:100])
            span.set_attribute("mcp.top_k", top_k)
            span.set_attribute("mcp.scopes", ",".join(scopes) if scopes else "")
            if seed is not None:
                span.set_attribute("mcp.seed", seed)

            logger.info(
                "mcp.search.start",
                server_id=server_id,
                query_length=len(query),
                scopes=scopes,
                top_k=top_k,
                seed=seed,
            )

            # Validate server exists
            if server_id not in self.mcp_servers:
                error_msg = f"MCP server '{server_id}' not configured"
                logger.error(
                    "mcp.search.server_not_found",
                    server_id=server_id,
                    available_servers=list(self.mcp_servers.keys()),
                )
                raise MCPServerNotFoundError(error_msg)

            server_config = self.mcp_servers[server_id]

            # Validate search tool is supported
            if "search" not in server_config["capabilities"]:
                error_msg = f"MCP server '{server_id}' does not support 'search' tool"
                logger.error(
                    "mcp.search.tool_not_supported",
                    server_id=server_id,
                    capabilities=server_config["capabilities"],
                )
                raise MCPToolNotSupportedError(error_msg)

            # Validate server is active
            if server_config["status"] != "active":
                error_msg = f"MCP server '{server_id}' is not active"
                logger.error(
                    "mcp.search.server_inactive",
                    server_id=server_id,
                    status=server_config["status"],
                )
                raise MCPConnectionError(error_msg)

            # MVP: Mock implementation with lexicographic sorting
            if self.mock_mode:
                chunks = await self._mock_search(
                    server_id=server_id,
                    query=query,
                    scopes=scopes,
                    top_k=top_k,
                    filters=filters,
                )
            else:
                # TODO: Implement real MCP protocol integration
                # This would use MCP SDK or HTTP client to communicate with server
                chunks = await self._real_mcp_search(
                    server_id=server_id,
                    query=query,
                    scopes=scopes,
                    top_k=top_k,
                    filters=filters,
                )

            span.set_attribute("mcp.results_count", len(chunks))

            logger.info(
                "mcp.search.complete",
                server_id=server_id,
                results_count=len(chunks),
                chunk_hashes=[c["chunk_hash"][:16] for c in chunks],
            )

            return chunks

    async def get_context(
        self,
        server_id: str,
        chunk_hash: str,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve specific chunk by hash from MCP server.

        This method enables deterministic retrieval by fetching chunks using
        their SHA-256 hashes from previous runs.

        Args:
            server_id: MCP server identifier
            chunk_hash: SHA-256 hash of chunk to retrieve

        Returns:
            Chunk dict with {chunk_hash, text, source_id, metadata, weight}
            or None if not found

        Raises:
            MCPServerNotFoundError: If server_id not configured
            MCPToolNotSupportedError: If get_context tool not supported
            MCPConnectionError: If connection to server fails

        Example:
            ```python
            chunk = await service.get_context(
                server_id="local-knowledge",
                chunk_hash="abc123...",
            )
            # Returns: {
            #     "chunk_hash": "abc123...",
            #     "text": "Verse about love...",
            #     "source_id": "local-knowledge",
            #     "metadata": {"source": "lyrics_db"},
            #     "weight": 0.5
            # }
            ```
        """
        with tracer.start_as_current_span("mcp.get_context") as span:
            span.set_attribute("mcp.server_id", server_id)
            span.set_attribute("mcp.chunk_hash", chunk_hash[:16])

            logger.info(
                "mcp.get_context.start",
                server_id=server_id,
                chunk_hash=chunk_hash[:16],
            )

            # Validate server exists
            if server_id not in self.mcp_servers:
                error_msg = f"MCP server '{server_id}' not configured"
                logger.error(
                    "mcp.get_context.server_not_found",
                    server_id=server_id,
                )
                raise MCPServerNotFoundError(error_msg)

            server_config = self.mcp_servers[server_id]

            # Validate get_context tool is supported
            if "get_context" not in server_config["capabilities"]:
                error_msg = (
                    f"MCP server '{server_id}' does not support 'get_context' tool"
                )
                logger.error(
                    "mcp.get_context.tool_not_supported",
                    server_id=server_id,
                    capabilities=server_config["capabilities"],
                )
                raise MCPToolNotSupportedError(error_msg)

            # MVP: Mock implementation
            if self.mock_mode:
                chunk = await self._mock_get_context(
                    server_id=server_id,
                    chunk_hash=chunk_hash,
                )
            else:
                # TODO: Implement real MCP protocol integration
                chunk = await self._real_mcp_get_context(
                    server_id=server_id,
                    chunk_hash=chunk_hash,
                )

            if chunk:
                span.set_attribute("mcp.chunk_found", True)
                logger.info(
                    "mcp.get_context.found",
                    server_id=server_id,
                    chunk_hash=chunk_hash[:16],
                )
            else:
                span.set_attribute("mcp.chunk_found", False)
                logger.warning(
                    "mcp.get_context.not_found",
                    server_id=server_id,
                    chunk_hash=chunk_hash[:16],
                )

            return chunk

    async def validate_scopes(
        self,
        server_id: str,
        requested_scopes: List[str],
    ) -> Dict[str, Any]:
        """Validate that requested scopes are available on MCP server.

        Args:
            server_id: MCP server identifier
            requested_scopes: List of scope names to validate

        Returns:
            Dict with:
                - valid: bool (all scopes are valid)
                - available_scopes: List[str] (server's available scopes)
                - invalid_scopes: List[str] (requested but not available)

        Raises:
            MCPServerNotFoundError: If server_id not configured

        Example:
            ```python
            result = await service.validate_scopes(
                server_id="local-knowledge",
                requested_scopes=["lyrics", "themes", "invalid_scope"],
            )
            # Returns: {
            #     "valid": False,
            #     "available_scopes": ["lyrics", "themes", "melodies"],
            #     "invalid_scopes": ["invalid_scope"]
            # }
            ```
        """
        logger.info(
            "mcp.validate_scopes.start",
            server_id=server_id,
            requested_scopes=requested_scopes,
        )

        # Validate server exists
        if server_id not in self.mcp_servers:
            error_msg = f"MCP server '{server_id}' not configured"
            logger.error(
                "mcp.validate_scopes.server_not_found",
                server_id=server_id,
            )
            raise MCPServerNotFoundError(error_msg)

        # For MVP, assume all scopes are valid in mock mode
        # Production should query server capabilities
        if self.mock_mode:
            # Mock: Accept all scopes as valid
            available_scopes = requested_scopes
            invalid_scopes = []
        else:
            # TODO: Query real MCP server for available scopes
            available_scopes = []
            invalid_scopes = requested_scopes

        result = {
            "valid": len(invalid_scopes) == 0,
            "available_scopes": available_scopes,
            "invalid_scopes": invalid_scopes,
        }

        logger.info(
            "mcp.validate_scopes.complete",
            server_id=server_id,
            valid=result["valid"],
            invalid_count=len(invalid_scopes),
        )

        return result

    # Mock implementations for MVP
    async def _mock_search(
        self,
        server_id: str,
        query: str,
        scopes: Optional[List[str]],
        top_k: int,
        filters: Optional[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Mock implementation of search for testing."""
        if server_id not in self._mock_data:
            logger.warning(
                "mcp.mock_search.no_data",
                server_id=server_id,
            )
            return []

        chunks = self._mock_data[server_id]

        # Apply scope filtering if specified
        if scopes:
            # Mock: Filter by metadata.scope if present
            filtered_chunks = [
                c
                for c in chunks
                if not c.get("metadata", {}).get("scope")
                or c["metadata"]["scope"] in scopes
            ]
        else:
            filtered_chunks = chunks

        # Apply additional filters
        if filters:
            # Mock: Basic metadata filtering
            for key, value in filters.items():
                filtered_chunks = [
                    c
                    for c in filtered_chunks
                    if c.get("metadata", {}).get(key) == value
                ]

        # Deterministic lexicographic sort for reproducibility
        # Sort by (text) to ensure same results every time
        sorted_chunks = sorted(filtered_chunks, key=lambda x: x["text"])

        # Take top_k
        results = sorted_chunks[:top_k]

        # Enrich with source_id and weight
        enriched_results = []
        for chunk in results:
            enriched_results.append(
                {
                    "chunk_hash": chunk["chunk_hash"],
                    "text": chunk["text"],
                    "source_id": server_id,
                    "metadata": chunk.get("metadata", {}),
                    "weight": 0.5,  # Default weight for mock
                }
            )

        return enriched_results

    async def _mock_get_context(
        self,
        server_id: str,
        chunk_hash: str,
    ) -> Optional[Dict[str, Any]]:
        """Mock implementation of get_context for testing."""
        if server_id not in self._mock_data:
            return None

        chunks = self._mock_data[server_id]

        # Find chunk by hash
        for chunk in chunks:
            if chunk["chunk_hash"] == chunk_hash:
                return {
                    "chunk_hash": chunk["chunk_hash"],
                    "text": chunk["text"],
                    "source_id": server_id,
                    "metadata": chunk.get("metadata", {}),
                    "weight": 0.5,
                }

        return None

    # Placeholder for real MCP protocol integration
    async def _real_mcp_search(
        self,
        server_id: str,
        query: str,
        scopes: Optional[List[str]],
        top_k: int,
        filters: Optional[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Real MCP protocol search implementation.

        TODO: Implement using MCP SDK or HTTP client.

        This should:
        1. Establish connection to MCP server
        2. Invoke 'search' tool with parameters
        3. Parse response and extract chunks
        4. Compute SHA-256 hashes for each chunk
        5. Return standardized chunk format
        """
        raise NotImplementedError(
            "Real MCP protocol integration not yet implemented. "
            "Use mock_mode=True for testing."
        )

    async def _real_mcp_get_context(
        self,
        server_id: str,
        chunk_hash: str,
    ) -> Optional[Dict[str, Any]]:
        """Real MCP protocol get_context implementation.

        TODO: Implement using MCP SDK or HTTP client.

        This should:
        1. Establish connection to MCP server
        2. Invoke 'get_context' tool with chunk_hash
        3. Parse response and return chunk
        4. Return None if chunk not found
        """
        raise NotImplementedError(
            "Real MCP protocol integration not yet implemented. "
            "Use mock_mode=True for testing."
        )


# Global service instance
_mcp_client_service: Optional[MCPClientService] = None


def get_mcp_client_service() -> MCPClientService:
    """Get or create global MCP client service instance.

    Returns:
        MCPClientService: Global service instance (mock mode for MVP)
    """
    global _mcp_client_service
    if _mcp_client_service is None:
        _mcp_client_service = MCPClientService(mock_mode=True)
    return _mcp_client_service
