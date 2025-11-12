"""Source entity model for external knowledge bases and MCP servers.

This module defines the Source SQLAlchemy ORM model that captures external
data sources (files, web APIs, MCP servers) with scoping, weighting, and
provenance for retrieval-augmented generation.
"""

from sqlalchemy import Column, String, Boolean, Numeric, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Source(BaseModel):
    """ORM model for external data sources.

    Stores source metadata (name, kind, config), scoping rules (scopes, allow, deny),
    weighting for retrieval, provenance settings, and MCP server configuration for
    deterministic retrieval-augmented generation.
    """

    __tablename__ = "sources"
    __table_args__ = (
        Index("ix_sources_name", "name"),
        Index("ix_sources_kind", "kind"),
        Index("ix_sources_mcp_server_id", "mcp_server_id"),
        Index("ix_sources_tenant_owner", "tenant_id", "owner_id"),
        Index(
            "ix_sources_tenant_name_unique",
            "tenant_id",
            "name",
            unique=True,
            postgresql_where="deleted_at IS NULL"
        ),
        CheckConstraint(
            "weight >= 0.0 AND weight <= 1.0",
            name="check_sources_weight_range"
        ),
    )

    # Identification
    name = Column(
        String(255),
        nullable=False,
        comment="Human-readable identifier for the source"
    )

    # Source type
    kind = Column(
        String(20),
        nullable=False,
        comment="Source type: file, web, or api"
    )

    # Source configuration
    config = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Source-specific configuration (file_path, url, endpoints, auth, etc.)"
    )

    # Scoping and filtering
    scopes = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Available scopes/topics (e.g., characters, family_history, location_lore)"
    )
    allow = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Allowed terms/patterns for filtering retrieval"
    )
    deny = Column(
        ARRAY(String),
        nullable=False,
        server_default="{}",
        comment="Denied terms/patterns (overrides allow list)"
    )

    # Weighting for retrieval
    weight = Column(
        Numeric(3, 2),
        nullable=False,
        server_default="0.5",
        comment="Retrieval weight (0.0-1.0, normalized across citations)"
    )

    # Provenance tracking
    provenance = Column(
        Boolean,
        nullable=False,
        server_default="true",
        comment="Whether to track provenance (chunk hashes, citations)"
    )

    # MCP server integration
    mcp_server_id = Column(
        String(255),
        nullable=False,
        comment="Identifier of MCP server hosting retrieval functions"
    )

    # Status and validation
    is_active = Column(
        Boolean,
        nullable=False,
        server_default="true",
        comment="Whether source is active and available for retrieval"
    )
    last_validated_at = Column(
        JSONB,
        nullable=True,
        comment="Timestamp and status of last validation check"
    )

    # Additional metadata
    metadata = Column(
        JSONB,
        nullable=False,
        server_default="{}",
        comment="Additional source metadata (description, tags, custom fields)"
    )
