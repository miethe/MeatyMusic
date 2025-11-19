"""Unit tests for MCP Client Service.

Tests cover:
- Mock server registration
- Search functionality with determinism
- Get context (hash-based retrieval)
- Scope validation
- Error handling
"""

import pytest
from unittest.mock import AsyncMock, patch

from app.services.mcp_client_service import (
    MCPClientService,
    MCPServerNotFoundError,
    MCPToolNotSupportedError,
    MCPConnectionError,
    get_mcp_client_service,
)


@pytest.fixture
def mcp_service():
    """Create MCP client service in mock mode."""
    return MCPClientService(mock_mode=True)


@pytest.fixture
def mcp_service_with_data(mcp_service):
    """Create MCP service with mock data registered."""
    mcp_service.register_mock_server(
        server_id="test-server",
        chunks=[
            {
                "text": "Love is a battlefield, hearts collide at night",
                "metadata": {"scope": "lyrics", "theme": "love"},
            },
            {
                "text": "Dreams take flight on wings of hope and light",
                "metadata": {"scope": "lyrics", "theme": "dreams"},
            },
            {
                "text": "City lights glow bright in the urban maze",
                "metadata": {"scope": "lyrics", "theme": "city"},
            },
            {
                "text": "Thunder rolls across the midnight sky",
                "metadata": {"scope": "lyrics", "theme": "nature"},
            },
            {
                "text": "Memories fade like photographs in time",
                "metadata": {"scope": "lyrics", "theme": "nostalgia"},
            },
        ],
        capabilities=["search", "get_context"],
    )
    return mcp_service


class TestMCPClientServiceInit:
    """Tests for MCP service initialization."""

    def test_init_mock_mode(self):
        """Test service initializes in mock mode."""
        service = MCPClientService(mock_mode=True)
        assert service.mock_mode is True
        assert service.mcp_servers == {}
        assert service._mock_data == {}

    def test_init_real_mode(self):
        """Test service initializes in real mode."""
        service = MCPClientService(mock_mode=False)
        assert service.mock_mode is False

    def test_get_global_instance(self):
        """Test global service instance is created."""
        service = get_mcp_client_service()
        assert service is not None
        assert service.mock_mode is True  # Default for MVP


class TestMockServerRegistration:
    """Tests for mock server registration."""

    def test_register_mock_server(self, mcp_service):
        """Test registering a mock server."""
        mcp_service.register_mock_server(
            server_id="my-server",
            chunks=[
                {"text": "Test chunk 1", "metadata": {"key": "value"}},
                {"text": "Test chunk 2", "metadata": {}},
            ],
        )

        assert "my-server" in mcp_service.mcp_servers
        assert "my-server" in mcp_service._mock_data

        server_config = mcp_service.mcp_servers["my-server"]
        assert server_config["server_id"] == "my-server"
        assert "search" in server_config["capabilities"]
        assert "get_context" in server_config["capabilities"]
        assert server_config["status"] == "active"

        chunks = mcp_service._mock_data["my-server"]
        assert len(chunks) == 2
        assert all("chunk_hash" in c for c in chunks)
        assert all("text" in c for c in chunks)

    def test_register_with_custom_capabilities(self, mcp_service):
        """Test registering server with custom capabilities."""
        mcp_service.register_mock_server(
            server_id="limited-server",
            chunks=[{"text": "Test"}],
            capabilities=["search"],  # No get_context
        )

        server_config = mcp_service.mcp_servers["limited-server"]
        assert server_config["capabilities"] == ["search"]

    def test_register_ignores_in_real_mode(self):
        """Test mock registration is ignored in real mode."""
        service = MCPClientService(mock_mode=False)
        service.register_mock_server(
            server_id="test",
            chunks=[{"text": "Test"}],
        )

        assert "test" not in service.mcp_servers


class TestMCPSearch:
    """Tests for MCP search functionality."""

    @pytest.mark.asyncio
    async def test_search_basic(self, mcp_service_with_data):
        """Test basic search retrieves chunks."""
        results = await mcp_service_with_data.search(
            server_id="test-server",
            query="love and dreams",
            top_k=3,
            seed=42,
        )

        assert len(results) == 3
        assert all("chunk_hash" in r for r in results)
        assert all("text" in r for r in results)
        assert all("source_id" in r for r in results)
        assert all(r["source_id"] == "test-server" for r in results)

    @pytest.mark.asyncio
    async def test_search_deterministic_sorting(self, mcp_service_with_data):
        """Test search results are deterministically sorted."""
        results1 = await mcp_service_with_data.search(
            server_id="test-server",
            query="test query",
            top_k=3,
            seed=42,
        )

        results2 = await mcp_service_with_data.search(
            server_id="test-server",
            query="different query",  # Query doesn't affect mock sorting
            top_k=3,
            seed=999,  # Different seed shouldn't matter (lexicographic sort)
        )

        # Results should be identical due to lexicographic sort
        assert [r["chunk_hash"] for r in results1] == [
            r["chunk_hash"] for r in results2
        ]

    @pytest.mark.asyncio
    async def test_search_with_scopes(self, mcp_service_with_data):
        """Test search with scope filtering."""
        results = await mcp_service_with_data.search(
            server_id="test-server",
            query="test",
            scopes=["lyrics"],
            top_k=10,
            seed=42,
        )

        # All results should match scope
        assert len(results) > 0
        for result in results:
            metadata = result.get("metadata", {})
            # If metadata has scope, it should match
            if "scope" in metadata:
                assert metadata["scope"] == "lyrics"

    @pytest.mark.asyncio
    async def test_search_top_k_limit(self, mcp_service_with_data):
        """Test search respects top_k limit."""
        results = await mcp_service_with_data.search(
            server_id="test-server",
            query="test",
            top_k=2,
            seed=42,
        )

        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_search_server_not_found(self, mcp_service):
        """Test search raises error for unknown server."""
        with pytest.raises(MCPServerNotFoundError) as exc_info:
            await mcp_service.search(
                server_id="nonexistent",
                query="test",
                top_k=5,
            )

        assert "not configured" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_search_tool_not_supported(self, mcp_service):
        """Test search raises error when tool not supported."""
        mcp_service.register_mock_server(
            server_id="limited",
            chunks=[{"text": "Test"}],
            capabilities=["other_tool"],  # No search
        )

        with pytest.raises(MCPToolNotSupportedError) as exc_info:
            await mcp_service.search(
                server_id="limited",
                query="test",
                top_k=5,
            )

        assert "does not support 'search'" in str(exc_info.value)


class TestMCPGetContext:
    """Tests for MCP get_context (hash-based retrieval)."""

    @pytest.mark.asyncio
    async def test_get_context_by_hash(self, mcp_service_with_data):
        """Test retrieving chunk by hash."""
        # First get chunks to get their hashes
        search_results = await mcp_service_with_data.search(
            server_id="test-server",
            query="test",
            top_k=1,
        )

        assert len(search_results) == 1
        chunk_hash = search_results[0]["chunk_hash"]

        # Now retrieve by hash
        result = await mcp_service_with_data.get_context(
            server_id="test-server",
            chunk_hash=chunk_hash,
        )

        assert result is not None
        assert result["chunk_hash"] == chunk_hash
        assert result["text"] == search_results[0]["text"]
        assert result["source_id"] == "test-server"

    @pytest.mark.asyncio
    async def test_get_context_hash_not_found(self, mcp_service_with_data):
        """Test get_context returns None for unknown hash."""
        result = await mcp_service_with_data.get_context(
            server_id="test-server",
            chunk_hash="nonexistent_hash_123456",
        )

        assert result is None

    @pytest.mark.asyncio
    async def test_get_context_server_not_found(self, mcp_service):
        """Test get_context raises error for unknown server."""
        with pytest.raises(MCPServerNotFoundError):
            await mcp_service.get_context(
                server_id="nonexistent",
                chunk_hash="test_hash",
            )

    @pytest.mark.asyncio
    async def test_get_context_tool_not_supported(self, mcp_service):
        """Test get_context raises error when tool not supported."""
        mcp_service.register_mock_server(
            server_id="limited",
            chunks=[{"text": "Test"}],
            capabilities=["search"],  # No get_context
        )

        with pytest.raises(MCPToolNotSupportedError) as exc_info:
            await mcp_service.get_context(
                server_id="limited",
                chunk_hash="test_hash",
            )

        assert "does not support 'get_context'" in str(exc_info.value)


class TestScopeValidation:
    """Tests for scope validation."""

    @pytest.mark.asyncio
    async def test_validate_scopes_mock_mode(self, mcp_service_with_data):
        """Test scope validation in mock mode accepts all scopes."""
        result = await mcp_service_with_data.validate_scopes(
            server_id="test-server",
            requested_scopes=["lyrics", "themes", "custom"],
        )

        assert result["valid"] is True
        assert set(result["available_scopes"]) == {"lyrics", "themes", "custom"}
        assert result["invalid_scopes"] == []

    @pytest.mark.asyncio
    async def test_validate_scopes_server_not_found(self, mcp_service):
        """Test scope validation raises error for unknown server."""
        with pytest.raises(MCPServerNotFoundError):
            await mcp_service.validate_scopes(
                server_id="nonexistent",
                requested_scopes=["test"],
            )


class TestChunkHashing:
    """Tests for chunk hash consistency."""

    @pytest.mark.asyncio
    async def test_chunk_hashes_consistent(self, mcp_service):
        """Test same text produces same hash."""
        import hashlib

        text = "Test chunk text"
        expected_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

        mcp_service.register_mock_server(
            server_id="test",
            chunks=[{"text": text}],
        )

        results = await mcp_service.search(
            server_id="test",
            query="test",
            top_k=1,
        )

        assert len(results) == 1
        assert results[0]["chunk_hash"] == expected_hash

    @pytest.mark.asyncio
    async def test_different_text_different_hash(self, mcp_service):
        """Test different texts produce different hashes."""
        mcp_service.register_mock_server(
            server_id="test",
            chunks=[
                {"text": "Text A"},
                {"text": "Text B"},
            ],
        )

        results = await mcp_service.search(
            server_id="test",
            query="test",
            top_k=2,
        )

        assert len(results) == 2
        assert results[0]["chunk_hash"] != results[1]["chunk_hash"]


class TestMCPIntegrationScenarios:
    """Integration tests for complete MCP workflows."""

    @pytest.mark.asyncio
    async def test_search_then_retrieve_by_hash(self, mcp_service_with_data):
        """Test complete workflow: search then retrieve by hash."""
        # Step 1: Search
        search_results = await mcp_service_with_data.search(
            server_id="test-server",
            query="love",
            top_k=3,
            seed=42,
        )

        assert len(search_results) == 3
        chunk_hashes = [r["chunk_hash"] for r in search_results]

        # Step 2: Retrieve each chunk by hash
        for chunk_hash in chunk_hashes:
            retrieved = await mcp_service_with_data.get_context(
                server_id="test-server",
                chunk_hash=chunk_hash,
            )

            assert retrieved is not None
            assert retrieved["chunk_hash"] == chunk_hash

    @pytest.mark.asyncio
    async def test_deterministic_retrieval_across_runs(self, mcp_service_with_data):
        """Test retrieval is deterministic across multiple runs."""
        # Run 1: Initial search
        run1_results = await mcp_service_with_data.search(
            server_id="test-server",
            query="test",
            top_k=3,
            seed=42,
        )

        run1_hashes = [r["chunk_hash"] for r in run1_results]

        # Run 2: Same search
        run2_results = await mcp_service_with_data.search(
            server_id="test-server",
            query="test",
            top_k=3,
            seed=42,
        )

        run2_hashes = [r["chunk_hash"] for r in run2_results]

        # Should be identical
        assert run1_hashes == run2_hashes

        # Run 3: Retrieve by hashes from run1
        run3_results = []
        for chunk_hash in run1_hashes:
            chunk = await mcp_service_with_data.get_context(
                server_id="test-server",
                chunk_hash=chunk_hash,
            )
            run3_results.append(chunk)

        run3_hashes = [r["chunk_hash"] for r in run3_results]

        # Should match original search
        assert run3_hashes == run1_hashes
