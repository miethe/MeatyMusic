"""Integration tests for LYRICS skill with MCP retrieval.

Tests cover:
- LYRICS skill with MCP sources
- Deterministic citation tracking
- Hash pinning across runs
- Scope validation integration
- Error handling when MCP unavailable
"""

import pytest
from uuid import uuid4

from app.services.mcp_client_service import get_mcp_client_service
from app.skills.lyrics import generate_lyrics, retrieve_from_mcp_sources
from app.workflows.skill import WorkflowContext


@pytest.fixture
def mcp_service_with_lyrics_data():
    """Setup MCP service with sample lyrics-related chunks."""
    service = get_mcp_client_service()

    # Register mock server with lyrics knowledge
    service.register_mock_server(
        server_id="lyrics-knowledge",
        chunks=[
            {
                "text": "Love conquers all, even in the darkest night",
                "metadata": {"scope": "lyrics", "theme": "love", "source": "kb1"},
            },
            {
                "text": "Dreams take flight on wings of hope",
                "metadata": {"scope": "lyrics", "theme": "dreams", "source": "kb1"},
            },
            {
                "text": "Hearts beat as one in perfect harmony",
                "metadata": {"scope": "lyrics", "theme": "romance", "source": "kb1"},
            },
            {
                "text": "Stars align when fate brings souls together",
                "metadata": {"scope": "lyrics", "theme": "destiny", "source": "kb2"},
            },
            {
                "text": "Thunder rolls across the midnight sky so wild",
                "metadata": {"scope": "lyrics", "theme": "nature", "source": "kb2"},
            },
        ],
        capabilities=["search", "get_context"],
    )

    return service


@pytest.fixture
def sample_sources():
    """Create sample source entities for testing."""
    return [
        {
            "id": str(uuid4()),
            "mcp_server_id": "lyrics-knowledge",
            "scopes": ["lyrics", "themes"],
            "weight": 0.8,
        }
    ]


@pytest.fixture
def workflow_context():
    """Create workflow context for skill execution."""
    return WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,
        node_index=2,  # LYRICS is typically node 2 after PLAN and STYLE
        node_name="LYRICS",
    )


class TestMCPRetrievalFunction:
    """Tests for retrieve_from_mcp_sources function."""

    @pytest.mark.asyncio
    async def test_retrieve_initial_search(
        self, mcp_service_with_lyrics_data, sample_sources
    ):
        """Test initial retrieval performs MCP search."""
        citations, chunk_hashes = await retrieve_from_mcp_sources(
            sources=sample_sources,
            query="love and dreams",
            previous_citation_hashes=[],
            top_k=3,
            seed=42,
        )

        assert len(citations) == 3
        assert len(chunk_hashes) == 3

        # Verify citation structure
        for citation in citations:
            assert "chunk_hash" in citation
            assert "text" in citation
            assert "source_id" in citation
            assert citation["source_id"] == "lyrics-knowledge"
            assert "metadata" in citation
            assert "weight" in citation
            assert citation["weight"] == 0.8  # From source

    @pytest.mark.asyncio
    async def test_retrieve_with_pinned_hashes(
        self, mcp_service_with_lyrics_data, sample_sources
    ):
        """Test retrieval with pinned hashes retrieves exact chunks."""
        # First retrieval
        citations1, hashes1 = await retrieve_from_mcp_sources(
            sources=sample_sources,
            query="love",
            previous_citation_hashes=[],
            top_k=3,
            seed=42,
        )

        # Second retrieval with pinned hashes
        citations2, hashes2 = await retrieve_from_mcp_sources(
            sources=sample_sources,
            query="different query",  # Different query shouldn't matter
            previous_citation_hashes=hashes1,
            top_k=3,
            seed=999,  # Different seed shouldn't matter
        )

        # Should retrieve exact same chunks
        assert hashes2 == hashes1
        assert len(citations2) == len(citations1)

        # Verify text content matches
        texts1 = {c["chunk_hash"]: c["text"] for c in citations1}
        texts2 = {c["chunk_hash"]: c["text"] for c in citations2}
        assert texts1 == texts2

    @pytest.mark.asyncio
    async def test_retrieve_scope_validation(
        self, mcp_service_with_lyrics_data, sample_sources
    ):
        """Test retrieval validates scopes."""
        # Modify source to have specific scopes
        sources_with_scopes = [
            {
                "id": str(uuid4()),
                "mcp_server_id": "lyrics-knowledge",
                "scopes": ["lyrics"],  # Specific scope
                "weight": 0.5,
            }
        ]

        citations, hashes = await retrieve_from_mcp_sources(
            sources=sources_with_scopes,
            query="test",
            previous_citation_hashes=[],
            top_k=5,
            seed=42,
        )

        # Should still retrieve chunks (mock mode accepts all scopes)
        assert len(citations) > 0

    @pytest.mark.asyncio
    async def test_retrieve_handles_missing_server_id(self):
        """Test retrieval handles sources without mcp_server_id."""
        sources_invalid = [
            {
                "id": str(uuid4()),
                # Missing mcp_server_id
                "scopes": ["lyrics"],
                "weight": 0.5,
            }
        ]

        citations, hashes = await retrieve_from_mcp_sources(
            sources=sources_invalid,
            query="test",
            previous_citation_hashes=[],
            top_k=5,
            seed=42,
        )

        # Should return empty results
        assert citations == []
        assert hashes == []

    @pytest.mark.asyncio
    async def test_retrieve_partial_hash_pinning(
        self, mcp_service_with_lyrics_data, sample_sources
    ):
        """Test retrieval with partial pinned hashes fills remaining slots."""
        # First retrieval
        citations1, hashes1 = await retrieve_from_mcp_sources(
            sources=sample_sources,
            query="test",
            previous_citation_hashes=[],
            top_k=5,
            seed=42,
        )

        assert len(citations1) == 5

        # Second retrieval with only 2 pinned hashes
        citations2, hashes2 = await retrieve_from_mcp_sources(
            sources=sample_sources,
            query="test",
            previous_citation_hashes=hashes1[:2],  # Only first 2 hashes
            top_k=5,
            seed=42,
        )

        # Should retrieve 5 total: 2 pinned + 3 new
        assert len(citations2) == 5

        # First 2 should match pinned hashes
        assert hashes2[:2] == hashes1[:2]


class TestLyricsSkillWithMCP:
    """Integration tests for LYRICS skill with MCP sources."""

    @pytest.mark.asyncio
    async def test_generate_lyrics_with_mcp_sources(
        self, mcp_service_with_lyrics_data, sample_sources, workflow_context
    ):
        """Test lyrics generation with MCP sources."""
        inputs = {
            "sds_lyrics": {
                "rhyme_scheme": "AABB",
                "syllables_per_line": 8,
                "pov": "1st",
                "tense": "present",
                "themes": ["love", "dreams"],
                "language": "en",
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "Verse 1": {
                            "min_lines": 4,
                            "max_lines": 4,
                            "must_end_with_hook": False,
                        },
                    },
                },
            },
            "plan": {
                "section_order": ["Verse 1"],
            },
            "style": {
                "genre_detail": {"primary": "pop"},
                "mood": ["uplifting", "romantic"],
                "energy": "medium",
            },
            "sources": sample_sources,
            "source_top_k": 3,
        }

        result = await generate_lyrics(inputs, workflow_context)

        # Verify outputs
        assert "lyrics" in result
        assert "citations" in result
        assert "citation_hashes" in result
        assert "metrics" in result
        assert "_hash" in result

        # Verify citations were retrieved
        assert len(result["citations"]) > 0
        assert len(result["citation_hashes"]) > 0

        # Verify citation structure
        for citation in result["citations"]:
            assert "chunk_hash" in citation
            assert "text" in citation
            assert "source_id" in citation

        # Verify metrics
        assert "rhyme_tightness" in result["metrics"]
        assert "singability" in result["metrics"]
        assert "hook_density" in result["metrics"]

    @pytest.mark.asyncio
    async def test_generate_lyrics_deterministic_with_hashes(
        self, mcp_service_with_lyrics_data, sample_sources, workflow_context
    ):
        """Test lyrics generation is deterministic with citation hash pinning."""
        inputs = {
            "sds_lyrics": {
                "rhyme_scheme": "AABB",
                "syllables_per_line": 8,
                "pov": "1st",
                "tense": "present",
                "themes": ["love"],
                "language": "en",
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "Verse 1": {"min_lines": 4, "max_lines": 4},
                    },
                },
            },
            "plan": {"section_order": ["Verse 1"]},
            "style": {
                "genre_detail": {"primary": "pop"},
                "mood": ["romantic"],
                "energy": "medium",
            },
            "sources": sample_sources,
            "source_top_k": 3,
        }

        # Run 1: Generate lyrics
        result1 = await generate_lyrics(inputs, workflow_context)
        hashes1 = result1["citation_hashes"]

        # Run 2: Generate with pinned hashes
        inputs["citation_hashes"] = hashes1
        result2 = await generate_lyrics(inputs, workflow_context)
        hashes2 = result2["citation_hashes"]

        # Citations should be identical
        assert hashes2 == hashes1

        # Verify same chunks retrieved
        texts1 = [c["text"] for c in result1["citations"]]
        texts2 = [c["text"] for c in result2["citations"]]
        assert texts1 == texts2

    @pytest.mark.asyncio
    async def test_generate_lyrics_without_sources(self, workflow_context):
        """Test lyrics generation works without MCP sources."""
        inputs = {
            "sds_lyrics": {
                "rhyme_scheme": "AABB",
                "syllables_per_line": 8,
                "pov": "1st",
                "tense": "present",
                "themes": ["love"],
                "language": "en",
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "Verse 1": {"min_lines": 4, "max_lines": 4},
                    },
                },
            },
            "plan": {"section_order": ["Verse 1"]},
            "style": {
                "genre_detail": {"primary": "pop"},
                "mood": ["romantic"],
                "energy": "medium",
            },
            "sources": [],  # No sources
        }

        result = await generate_lyrics(inputs, workflow_context)

        # Should still generate lyrics
        assert "lyrics" in result
        assert len(result["lyrics"]) > 0

        # Citations should be empty
        assert result["citations"] == []
        assert result["citation_hashes"] == []

    @pytest.mark.asyncio
    async def test_generate_lyrics_handles_mcp_errors(
        self, sample_sources, workflow_context
    ):
        """Test lyrics generation handles MCP errors gracefully."""
        # Use non-existent server
        sources_invalid = [
            {
                "id": str(uuid4()),
                "mcp_server_id": "nonexistent-server",
                "scopes": ["lyrics"],
                "weight": 0.5,
            }
        ]

        inputs = {
            "sds_lyrics": {
                "rhyme_scheme": "AABB",
                "syllables_per_line": 8,
                "pov": "1st",
                "tense": "present",
                "themes": ["love"],
                "language": "en",
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "Verse 1": {"min_lines": 4, "max_lines": 4},
                    },
                },
            },
            "plan": {"section_order": ["Verse 1"]},
            "style": {
                "genre_detail": {"primary": "pop"},
                "mood": ["romantic"],
                "energy": "medium",
            },
            "sources": sources_invalid,
        }

        result = await generate_lyrics(inputs, workflow_context)

        # Should still generate lyrics despite MCP error
        assert "lyrics" in result
        assert len(result["lyrics"]) > 0

        # Citations should be empty due to error
        assert result["citations"] == []
        assert result["citation_hashes"] == []


class TestCitationProvenanceTracking:
    """Tests for citation provenance tracking."""

    @pytest.mark.asyncio
    async def test_citation_hashes_tracked_in_output(
        self, mcp_service_with_lyrics_data, sample_sources, workflow_context
    ):
        """Test citation hashes are tracked in skill output."""
        inputs = {
            "sds_lyrics": {
                "rhyme_scheme": "AABB",
                "syllables_per_line": 8,
                "pov": "1st",
                "tense": "present",
                "themes": ["love"],
                "language": "en",
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "Verse 1": {"min_lines": 4, "max_lines": 4},
                    },
                },
            },
            "plan": {"section_order": ["Verse 1"]},
            "style": {
                "genre_detail": {"primary": "pop"},
                "mood": ["romantic"],
                "energy": "medium",
            },
            "sources": sample_sources,
            "source_top_k": 3,
        }

        result = await generate_lyrics(inputs, workflow_context)

        # Verify hashes match citations
        citation_hashes_from_citations = [c["chunk_hash"] for c in result["citations"]]
        assert result["citation_hashes"] == citation_hashes_from_citations

        # Verify hashes are SHA-256 format (64 hex characters)
        for chunk_hash in result["citation_hashes"]:
            assert isinstance(chunk_hash, str)
            assert len(chunk_hash) == 64
            assert all(c in "0123456789abcdef" for c in chunk_hash)

    @pytest.mark.asyncio
    async def test_citation_metadata_preserved(
        self, mcp_service_with_lyrics_data, sample_sources, workflow_context
    ):
        """Test citation metadata is preserved from MCP."""
        inputs = {
            "sds_lyrics": {
                "rhyme_scheme": "AABB",
                "syllables_per_line": 8,
                "pov": "1st",
                "tense": "present",
                "themes": ["love"],
                "language": "en",
                "constraints": {
                    "explicit": False,
                    "section_requirements": {
                        "Verse 1": {"min_lines": 4, "max_lines": 4},
                    },
                },
            },
            "plan": {"section_order": ["Verse 1"]},
            "style": {
                "genre_detail": {"primary": "pop"},
                "mood": ["romantic"],
                "energy": "medium",
            },
            "sources": sample_sources,
            "source_top_k": 3,
        }

        result = await generate_lyrics(inputs, workflow_context)

        # Verify metadata is present
        for citation in result["citations"]:
            assert "metadata" in citation
            metadata = citation["metadata"]

            # Metadata from mock chunks
            if "scope" in metadata:
                assert metadata["scope"] == "lyrics"
            if "source" in metadata:
                assert metadata["source"] in ["kb1", "kb2"]
