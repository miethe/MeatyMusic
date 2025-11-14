"""Schemas package for API request/response validation."""

# Blueprint schemas
from app.schemas.blueprint import (
    BlueprintBase,
    BlueprintCreate,
    BlueprintResponse,
    BlueprintUpdate,
)

# Common schemas
from app.schemas.common import (
    ErrorResponse,
    NodeOutputUpdate,
    PageInfo,
    PaginatedResponse,
    StatusUpdateRequest,
)

# ComposedPrompt schemas
from app.schemas.composed_prompt import (
    ComposedPromptBase,
    ComposedPromptCreate,
    ComposedPromptResponse,
    ComposedPromptUpdate,
    ValidationStatus,
)

# Lyrics schemas
from app.schemas.lyrics import (
    HookStrategy,
    LyricsBase,
    LyricsCreate,
    LyricsResponse,
    LyricsUpdate,
    POV,
    Tense,
)

# Persona schemas
from app.schemas.persona import (
    PersonaBase,
    PersonaCreate,
    PersonaKind,
    PersonaResponse,
    PersonaUpdate,
)

# ProducerNotes schemas
from app.schemas.producer_notes import (
    ProducerNotesBase,
    ProducerNotesCreate,
    ProducerNotesResponse,
    ProducerNotesUpdate,
)

# Song schemas
from app.schemas.song import (
    SongBase,
    SongCreate,
    SongResponse,
    SongStatus,
    SongUpdate,
    WorkflowNode,
    WorkflowRunBase,
    WorkflowRunCreate,
    WorkflowRunResponse,
    WorkflowRunStatus,
    WorkflowRunUpdate,
)

# Source schemas
from app.schemas.source import (
    Chunk,
    ChunkWithHash,
    MCPServerInfo,
    SourceBase,
    SourceCreate,
    SourceKind,
    SourceResponse,
    SourceUpdate,
)

# Style schemas
from app.schemas.style import (
    StyleBase,
    StyleCreate,
    StyleResponse,
    StyleUpdate,
)

__all__ = [
    # Blueprint
    "BlueprintBase",
    "BlueprintCreate",
    "BlueprintResponse",
    "BlueprintUpdate",
    # Common
    "ErrorResponse",
    "NodeOutputUpdate",
    "PageInfo",
    "PaginatedResponse",
    "StatusUpdateRequest",
    # ComposedPrompt
    "ComposedPromptBase",
    "ComposedPromptCreate",
    "ComposedPromptResponse",
    "ComposedPromptUpdate",
    "ValidationStatus",
    # Lyrics
    "HookStrategy",
    "LyricsBase",
    "LyricsCreate",
    "LyricsResponse",
    "LyricsUpdate",
    "POV",
    "Tense",
    # Persona
    "PersonaBase",
    "PersonaCreate",
    "PersonaKind",
    "PersonaResponse",
    "PersonaUpdate",
    # ProducerNotes
    "ProducerNotesBase",
    "ProducerNotesCreate",
    "ProducerNotesResponse",
    "ProducerNotesUpdate",
    # Song
    "SongBase",
    "SongCreate",
    "SongResponse",
    "SongStatus",
    "SongUpdate",
    "WorkflowNode",
    "WorkflowRunBase",
    "WorkflowRunCreate",
    "WorkflowRunResponse",
    "WorkflowRunStatus",
    "WorkflowRunUpdate",
    # Source
    "Chunk",
    "ChunkWithHash",
    "MCPServerInfo",
    "SourceBase",
    "SourceCreate",
    "SourceKind",
    "SourceResponse",
    "SourceUpdate",
    # Style
    "StyleBase",
    "StyleCreate",
    "StyleResponse",
    "StyleUpdate",
]
