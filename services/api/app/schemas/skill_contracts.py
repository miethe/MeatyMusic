"""
Skill Execution Contract Schemas for AMCS Workflow

This module defines the formal input/output contracts for all 8 workflow skills
in the Agentic Music Creation System (AMCS). These are execution contracts, not
entity schemas - they define what data flows between workflow nodes.

Workflow Order:
    PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX (loop ≤3) → REVIEW

Each skill has:
- Input schema inheriting from SkillInput
- Output schema inheriting from SkillOutput
- Deterministic execution guarantees via seed propagation
- Provenance tracking via artifact hashes

Example Usage:
    ```python
    # Execute PLAN skill
    plan_input = PlanInput(
        context=WorkflowContext(
            run_id="uuid-here",
            song_id="song-uuid",
            seed=12345,
            feature_flags={"eval.autofix.enabled": True}
        ),
        sds={"title": "My Song", "genre": "pop", ...}
    )

    plan_output = plan_skill.execute(plan_input)
    assert plan_output.status == "success"
    assert plan_output.artifact_hash is not None
    ```

Note: Artifact dictionaries (sds, plan, style, lyrics, etc.) use Dict[str, Any]
for flexibility. The actual structure references entity schemas in app/schemas/,
but these contracts don't enforce nested typing to allow for skill implementation
flexibility and avoid circular imports.

Author: AMCS Development Team
Last Updated: 2025-11-18
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# =============================================================================
# Base Contracts (all skills inherit from these)
# =============================================================================

class WorkflowContext(BaseModel):
    """
    Context passed to all workflow skills for execution traceability.

    This context provides the determinism foundation (seed), identifies the
    workflow run, and carries feature flags that control skill behavior.

    Attributes:
        run_id: Unique workflow run identifier (UUID format recommended)
        song_id: Identifier of the song being generated
        seed: Base seed for deterministic random operations (≥0)
        created_at: Timestamp when the workflow started
        feature_flags: Runtime flags controlling behavior (e.g., autofix, render)

    Example:
        ```python
        ctx = WorkflowContext(
            run_id="550e8400-e29b-41d4-a716-446655440000",
            song_id="song-123",
            seed=42,
            feature_flags={"render.suno.enabled": False}
        )
        ```
    """

    run_id: str = Field(
        ...,
        description="Unique workflow run identifier (UUID)",
        min_length=1
    )
    song_id: str = Field(
        ...,
        description="Song entity identifier being generated",
        min_length=1
    )
    seed: int = Field(
        ...,
        ge=0,
        description="Base seed for deterministic operations (all skills derive node seeds from this)"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Workflow start timestamp (UTC)"
    )
    feature_flags: Dict[str, bool] = Field(
        default_factory=dict,
        description="Feature flags controlling skill behavior (e.g., render.suno.enabled)"
    )

    @field_validator("run_id", "song_id")
    @classmethod
    def validate_ids(cls, v: str) -> str:
        """Ensure IDs are non-empty after stripping."""
        if not v.strip():
            raise ValueError("ID must not be empty or whitespace")
        return v.strip()


class SkillInput(BaseModel):
    """
    Base class for all skill inputs.

    Every skill receives a WorkflowContext for traceability and determinism.
    Skill-specific inputs extend this base with additional fields.

    Attributes:
        context: Workflow execution context with run_id, seed, etc.
    """

    context: WorkflowContext = Field(
        ...,
        description="Workflow context for traceability and determinism"
    )


class SkillOutput(BaseModel):
    """
    Base class for all skill outputs.

    Every skill emits standardized status, timing, metrics, and errors.
    This enables consistent observability and debugging across all workflow nodes.

    Attributes:
        status: Execution outcome (success/failed/partial)
        execution_time_ms: Skill execution duration in milliseconds
        artifact_hash: SHA-256 hash of primary output artifact (for provenance)
        metrics: Skill-specific metrics (e.g., token_count, api_calls)
        events: Structured log events emitted during execution
        errors: Error messages if status is failed or partial

    Example:
        ```python
        output = SkillOutput(
            status="success",
            execution_time_ms=1234,
            artifact_hash="sha256:abc123...",
            metrics={"tokens_used": 500},
            events=[{"phase": "start", "ts": "2025-11-18T10:00:00Z"}],
            errors=[]
        )
        ```
    """

    status: Literal["success", "failed", "partial"] = Field(
        ...,
        description="Execution outcome: success (complete), failed (error), partial (incomplete)"
    )
    execution_time_ms: int = Field(
        ...,
        ge=0,
        description="Skill execution duration in milliseconds"
    )
    artifact_hash: Optional[str] = Field(
        None,
        description="SHA-256 hash of primary output artifact for provenance tracking",
        pattern=r"^(sha256:)?[a-f0-9]{64}$"
    )
    metrics: Dict[str, float] = Field(
        default_factory=dict,
        description="Skill-specific metrics (e.g., token_count, api_calls, cache_hits)"
    )
    events: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Structured log events emitted during execution"
    )
    errors: List[str] = Field(
        default_factory=list,
        description="Error messages if status is failed or partial"
    )

    @model_validator(mode="after")
    def validate_status_consistency(self) -> "SkillOutput":
        """Ensure errors list is non-empty when status is failed."""
        if self.status == "failed" and not self.errors:
            raise ValueError("Status 'failed' requires at least one error message")
        return self


# =============================================================================
# PLAN Skill Contracts
# =============================================================================

class PlanInput(SkillInput):
    """
    Input contract for the PLAN skill.

    The PLAN skill expands the Song Design Spec (SDS) into ordered work targets
    including section structure, word count targets, and evaluation goals.

    Attributes:
        context: Workflow execution context
        sds: Song Design Spec (references schemas/song.py, style.py, etc.)

    Example:
        ```python
        plan_input = PlanInput(
            context=ctx,
            sds={
                "title": "Summer Nights",
                "genre": "pop",
                "targetLength": "3:30",
                "constraints": {"explicit": False},
                "style": {"bpm": 120, "key": "C major"},
                ...
            }
        )
        ```
    """

    sds: Dict[str, Any] = Field(
        ...,
        description="Song Design Spec containing all entity specifications (style, persona, constraints)"
    )

    @field_validator("sds")
    @classmethod
    def validate_sds_has_required_keys(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure SDS has minimum required fields."""
        required = {"genre", "targetLength"}
        missing = required - set(v.keys())
        if missing:
            raise ValueError(f"SDS missing required fields: {missing}")
        return v


class PlanOutput(SkillOutput):
    """
    Output contract for the PLAN skill.

    The plan defines section structure, word count targets, evaluation metrics,
    and ordering for downstream skills.

    Attributes:
        plan: Structured plan with sections, targets, and evaluation goals

    Plan Structure:
        {
            "sections": [
                {
                    "id": "verse1",
                    "type": "verse",
                    "wordCountTarget": 80,
                    "durationTarget": "0:30",
                    "order": 1
                },
                ...
            ],
            "evaluationTargets": {
                "hookDensity": 0.85,
                "singability": 0.90,
                "rhymeTightness": 0.80
            },
            "totalWordCount": 320,
            "sectionOrder": ["intro", "verse1", "chorus1", ...]
        }

    Example:
        ```python
        plan_output = PlanOutput(
            status="success",
            execution_time_ms=450,
            artifact_hash="sha256:abc...",
            plan={
                "sections": [...],
                "evaluationTargets": {...},
                "totalWordCount": 320
            }
        )
        ```
    """

    plan: Dict[str, Any] = Field(
        ...,
        description="Structured plan with section order, word counts, and evaluation targets"
    )

    @field_validator("plan")
    @classmethod
    def validate_plan_structure(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure plan has required keys."""
        required = {"sections", "evaluationTargets", "totalWordCount"}
        missing = required - set(v.keys())
        if missing:
            raise ValueError(f"Plan missing required fields: {missing}")
        return v


# =============================================================================
# STYLE Skill Contracts
# =============================================================================

class StyleInput(SkillInput):
    """
    Input contract for the STYLE skill.

    The STYLE skill generates a style specification honoring blueprint constraints
    and resolving tag conflicts based on the conflict matrix.

    Attributes:
        context: Workflow execution context
        sds: Song Design Spec
        plan: Output from PLAN skill
        blueprint: Genre blueprint with constraints and allowed tags

    Example:
        ```python
        style_input = StyleInput(
            context=ctx,
            sds={...},
            plan={"sections": [...], ...},
            blueprint={
                "genre": "pop",
                "bpmRange": {"min": 100, "max": 140},
                "allowedTags": ["upbeat", "melodic", ...],
                "conflictMatrix": {"whisper": ["anthemic"], ...}
            }
        )
        ```
    """

    sds: Dict[str, Any] = Field(
        ...,
        description="Song Design Spec"
    )
    plan: Dict[str, Any] = Field(
        ...,
        description="Plan output from PLAN skill with section structure"
    )
    blueprint: Dict[str, Any] = Field(
        ...,
        description="Genre blueprint with constraints, allowed tags, and conflict matrix"
    )

    @field_validator("blueprint")
    @classmethod
    def validate_blueprint_has_genre(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure blueprint specifies genre."""
        if "genre" not in v:
            raise ValueError("Blueprint must specify 'genre'")
        return v


class StyleOutput(SkillOutput):
    """
    Output contract for the STYLE skill.

    The style specification includes genre, BPM, key, mood, instrumentation,
    and sanitized tags with conflicts resolved.

    Attributes:
        style: Style specification (references schemas/style.py)
        conflicts_resolved: List of tag conflicts that were resolved

    Style Structure:
        {
            "genre": "pop",
            "bpm": 120,
            "key": "C major",
            "mood": ["upbeat", "energetic"],
            "instrumentation": ["synth", "drums", "bass"],
            "tags": ["melodic", "catchy"],
            "vocalStyle": "powerful",
            ...
        }

    Example:
        ```python
        style_output = StyleOutput(
            status="success",
            execution_time_ms=680,
            artifact_hash="sha256:def...",
            style={
                "genre": "pop",
                "bpm": 120,
                "key": "C major",
                ...
            },
            conflicts_resolved=["whisper vs anthemic -> removed whisper"]
        )
        ```
    """

    style: Dict[str, Any] = Field(
        ...,
        description="Style specification with genre, BPM, key, mood, instrumentation, tags"
    )
    conflicts_resolved: List[str] = Field(
        default_factory=list,
        description="List of tag conflicts that were resolved during generation"
    )

    @field_validator("style")
    @classmethod
    def validate_style_has_genre_and_bpm(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure style has minimum required fields."""
        required = {"genre", "bpm"}
        missing = required - set(v.keys())
        if missing:
            raise ValueError(f"Style missing required fields: {missing}")
        return v


# =============================================================================
# LYRICS Skill Contracts
# =============================================================================

class LyricsInput(SkillInput):
    """
    Input contract for the LYRICS skill.

    The LYRICS skill generates lyrics with citations from sources, honoring
    section structure, rhyme schemes, and profanity constraints.

    Attributes:
        context: Workflow execution context
        sds: Song Design Spec
        plan: Plan output with section structure
        style: Style specification
        sources: External knowledge sources (MCP, web, file) with chunk hashes
        blueprint: Genre blueprint with rhyme schemes and lyrical patterns

    Example:
        ```python
        lyrics_input = LyricsInput(
            context=ctx,
            sds={...},
            plan={...},
            style={...},
            sources=[
                {
                    "id": "src-123",
                    "type": "web",
                    "chunks": [
                        {"hash": "sha256:abc...", "text": "...", "weight": 0.9}
                    ]
                }
            ],
            blueprint={...}
        )
        ```
    """

    sds: Dict[str, Any] = Field(
        ...,
        description="Song Design Spec"
    )
    plan: Dict[str, Any] = Field(
        ...,
        description="Plan output with section structure and word count targets"
    )
    style: Dict[str, Any] = Field(
        ...,
        description="Style specification from STYLE skill"
    )
    sources: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="External knowledge sources with chunk hashes for citation"
    )
    blueprint: Dict[str, Any] = Field(
        ...,
        description="Genre blueprint with rhyme schemes and lyrical patterns"
    )


class LyricsOutput(SkillOutput):
    """
    Output contract for the LYRICS skill.

    Lyrics are structured by section with full provenance via citations.
    Each line can be traced back to source chunks.

    Attributes:
        lyrics: Lyrics structured by section (references schemas/lyrics.py)
        citations: List of source citations with chunk hashes and weights

    Lyrics Structure:
        {
            "sections": [
                {
                    "id": "verse1",
                    "type": "verse",
                    "lines": [
                        {"text": "Summer nights...", "citations": ["cite-1"]},
                        ...
                    ],
                    "rhymeScheme": "ABAB"
                },
                ...
            ]
        }

    Citation Structure:
        {
            "id": "cite-1",
            "chunkHash": "sha256:abc...",
            "sourceId": "src-123",
            "text": "Original source text",
            "weight": 0.9,
            "section": "verse1"
        }

    Example:
        ```python
        lyrics_output = LyricsOutput(
            status="success",
            execution_time_ms=2340,
            artifact_hash="sha256:ghi...",
            lyrics={
                "sections": [...]
            },
            citations=[
                {
                    "id": "cite-1",
                    "chunkHash": "sha256:abc...",
                    "sourceId": "src-123",
                    "weight": 0.9,
                    "section": "verse1"
                }
            ]
        )
        ```
    """

    lyrics: Dict[str, Any] = Field(
        ...,
        description="Lyrics structured by section with lines and rhyme schemes"
    )
    citations: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Source citations with chunk hashes, source IDs, and weights"
    )

    @field_validator("lyrics")
    @classmethod
    def validate_lyrics_has_sections(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure lyrics has sections array."""
        if "sections" not in v or not isinstance(v["sections"], list):
            raise ValueError("Lyrics must have 'sections' array")
        return v


# =============================================================================
# PRODUCER Skill Contracts
# =============================================================================

class ProducerInput(SkillInput):
    """
    Input contract for the PRODUCER skill.

    The PRODUCER skill generates arrangement and mix guidance aligned to
    style and blueprint constraints.

    Attributes:
        context: Workflow execution context
        sds: Song Design Spec
        plan: Plan output with section structure
        style: Style specification
        blueprint: Genre blueprint with production patterns

    Example:
        ```python
        producer_input = ProducerInput(
            context=ctx,
            sds={...},
            plan={...},
            style={...},
            blueprint={
                "genre": "pop",
                "productionPatterns": {
                    "intro": "sparse, build tension",
                    "chorus": "full mix, maximize energy"
                }
            }
        )
        ```
    """

    sds: Dict[str, Any] = Field(
        ...,
        description="Song Design Spec"
    )
    plan: Dict[str, Any] = Field(
        ...,
        description="Plan output with section structure"
    )
    style: Dict[str, Any] = Field(
        ...,
        description="Style specification from STYLE skill"
    )
    blueprint: Dict[str, Any] = Field(
        ...,
        description="Genre blueprint with production patterns"
    )


class ProducerOutput(SkillOutput):
    """
    Output contract for the PRODUCER skill.

    Producer notes include arrangement guidance, mix targets, and section-specific
    production instructions.

    Attributes:
        producer_notes: Production guidance (references schemas/producer_notes.py)
        structure: Section order with duration targets and transitions

    Producer Notes Structure:
        {
            "arrangement": {
                "intro": "Sparse piano, gradual build",
                "verse": "Add bass and drums, keep vocals forward",
                "chorus": "Full mix, layered vocals",
                ...
            },
            "mixTargets": {
                "vocalLevel": "prominent",
                "bassPresence": "medium",
                "dynamicRange": "moderate compression"
            },
            "transitions": [
                {
                    "from": "verse1",
                    "to": "chorus1",
                    "technique": "riser + drum fill"
                }
            ]
        }

    Structure:
        {
            "sectionOrder": ["intro", "verse1", "chorus1", ...],
            "durations": {
                "intro": "0:10",
                "verse1": "0:30",
                ...
            }
        }

    Example:
        ```python
        producer_output = ProducerOutput(
            status="success",
            execution_time_ms=890,
            artifact_hash="sha256:jkl...",
            producer_notes={
                "arrangement": {...},
                "mixTargets": {...}
            },
            structure={
                "sectionOrder": ["intro", "verse1", ...],
                "durations": {...}
            }
        )
        ```
    """

    producer_notes: Dict[str, Any] = Field(
        ...,
        description="Production guidance with arrangement and mix targets"
    )
    structure: Dict[str, Any] = Field(
        ...,
        description="Section order with duration targets and transitions"
    )

    @field_validator("structure")
    @classmethod
    def validate_structure_has_section_order(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure structure has section order."""
        if "sectionOrder" not in v or not isinstance(v["sectionOrder"], list):
            raise ValueError("Structure must have 'sectionOrder' array")
        return v


# =============================================================================
# COMPOSE Skill Contracts
# =============================================================================

class ComposeInput(SkillInput):
    """
    Input contract for the COMPOSE skill.

    The COMPOSE skill merges style, lyrics, and producer notes into a final
    render-ready prompt that fits within engine character limits.

    Attributes:
        context: Workflow execution context
        style: Style specification
        lyrics: Lyrics with sections
        producer_notes: Production guidance
        engine_limits: Character and parameter limits for target render engine

    Example:
        ```python
        compose_input = ComposeInput(
            context=ctx,
            style={...},
            lyrics={...},
            producer_notes={...},
            engine_limits={
                "char_limit": 3000,
                "max_duration": 240,  # seconds
                "supports_sections": True
            }
        )
        ```
    """

    style: Dict[str, Any] = Field(
        ...,
        description="Style specification from STYLE skill"
    )
    lyrics: Dict[str, Any] = Field(
        ...,
        description="Lyrics with sections from LYRICS skill"
    )
    producer_notes: Dict[str, Any] = Field(
        ...,
        description="Production guidance from PRODUCER skill"
    )
    engine_limits: Dict[str, int] = Field(
        ...,
        description="Engine-specific limits (char_limit, max_duration, etc.)"
    )

    @field_validator("engine_limits")
    @classmethod
    def validate_engine_limits_has_char_limit(cls, v: Dict[str, int]) -> Dict[str, int]:
        """Ensure engine limits specify char_limit."""
        if "char_limit" not in v:
            raise ValueError("Engine limits must specify 'char_limit'")
        return v


class ComposeOutput(SkillOutput):
    """
    Output contract for the COMPOSE skill.

    The composed prompt is render-ready text that fits within engine limits.

    Attributes:
        composed_prompt: Final render prompt (references schemas/composed_prompt.py)
        char_count: Total character count of composed prompt
        truncated: Whether prompt was truncated to fit limits
        truncation_warnings: Warnings about what was truncated

    Composed Prompt Structure:
        {
            "text": "Full render-ready prompt text...",
            "sections": [
                {
                    "marker": "[Verse 1]",
                    "content": "Lyrics and production notes..."
                },
                ...
            ],
            "metadata": {
                "genre": "pop",
                "bpm": 120,
                "key": "C major"
            }
        }

    Example:
        ```python
        compose_output = ComposeOutput(
            status="success",
            execution_time_ms=450,
            artifact_hash="sha256:mno...",
            composed_prompt={
                "text": "[Intro]\\nSparse piano...\\n[Verse 1]\\n...",
                "sections": [...],
                "metadata": {...}
            },
            char_count=2847,
            truncated=False,
            truncation_warnings=[]
        )
        ```
    """

    composed_prompt: Dict[str, Any] = Field(
        ...,
        description="Final render-ready prompt with text, sections, and metadata"
    )
    char_count: int = Field(
        ...,
        ge=0,
        description="Total character count of composed prompt"
    )
    truncated: bool = Field(
        default=False,
        description="Whether prompt was truncated to fit engine limits"
    )
    truncation_warnings: List[str] = Field(
        default_factory=list,
        description="Warnings about what was truncated (if truncated=True)"
    )

    @field_validator("composed_prompt")
    @classmethod
    def validate_composed_prompt_has_text(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure composed prompt has text field."""
        if "text" not in v:
            raise ValueError("Composed prompt must have 'text' field")
        return v

    @model_validator(mode="after")
    def validate_truncation_consistency(self) -> "ComposeOutput":
        """Ensure truncation warnings exist when truncated=True."""
        if self.truncated and not self.truncation_warnings:
            raise ValueError("truncated=True requires at least one truncation warning")
        return self


# =============================================================================
# VALIDATE Skill Contracts
# =============================================================================

class ValidateInput(SkillInput):
    """
    Input contract for the VALIDATE skill.

    The VALIDATE skill scores artifacts against blueprint rubric and runs
    policy guards (profanity, length, conflicts).

    Attributes:
        context: Workflow execution context
        lyrics: Lyrics with sections
        style: Style specification
        producer_notes: Production guidance
        composed_prompt: Final render prompt
        blueprint: Genre blueprint with scoring rubric

    Example:
        ```python
        validate_input = ValidateInput(
            context=ctx,
            lyrics={...},
            style={...},
            producer_notes={...},
            composed_prompt={...},
            blueprint={
                "rubric": {
                    "hookDensity": {"weight": 0.3, "threshold": 0.75},
                    "singability": {"weight": 0.25, "threshold": 0.8},
                    "rhymeTightness": {"weight": 0.2, "threshold": 0.7},
                    ...
                },
                "passThreshold": 0.85
            }
        )
        ```
    """

    lyrics: Dict[str, Any] = Field(
        ...,
        description="Lyrics with sections from LYRICS skill"
    )
    style: Dict[str, Any] = Field(
        ...,
        description="Style specification from STYLE skill"
    )
    producer_notes: Dict[str, Any] = Field(
        ...,
        description="Production guidance from PRODUCER skill"
    )
    composed_prompt: Dict[str, Any] = Field(
        ...,
        description="Final render prompt from COMPOSE skill"
    )
    blueprint: Dict[str, Any] = Field(
        ...,
        description="Genre blueprint with scoring rubric and thresholds"
    )

    @field_validator("blueprint")
    @classmethod
    def validate_blueprint_has_rubric(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure blueprint has rubric for scoring."""
        if "rubric" not in v:
            raise ValueError("Blueprint must have 'rubric' for validation")
        return v


class ValidateOutput(SkillOutput):
    """
    Output contract for the VALIDATE skill.

    Validation report includes scores for all rubric metrics and overall pass/fail.

    Attributes:
        validation_report: Full validation report with detailed findings
        scores: Individual metric scores (0.0-1.0)
        total_score: Weighted total score (0.0-1.0)
        passed: Whether total_score meets blueprint threshold
        issues: List of validation issues found

    Validation Report Structure:
        {
            "timestamp": "2025-11-18T10:00:00Z",
            "rubricVersion": "pop-v1.2",
            "metrics": {
                "hookDensity": {
                    "score": 0.85,
                    "weight": 0.3,
                    "threshold": 0.75,
                    "passed": True,
                    "notes": "Chorus hook appears 3 times"
                },
                ...
            },
            "policyChecks": {
                "profanity": {"passed": True, "flags": []},
                "length": {"passed": True, "actualDuration": 210, "targetDuration": 210},
                "conflicts": {"passed": True, "conflicts": []}
            }
        }

    Example:
        ```python
        validate_output = ValidateOutput(
            status="success",
            execution_time_ms=1120,
            artifact_hash="sha256:pqr...",
            validation_report={
                "timestamp": "2025-11-18T10:00:00Z",
                "metrics": {...},
                "policyChecks": {...}
            },
            scores={
                "hookDensity": 0.85,
                "singability": 0.90,
                "rhymeTightness": 0.75
            },
            total_score=0.87,
            passed=True,
            issues=[]
        )
        ```
    """

    validation_report: Dict[str, Any] = Field(
        ...,
        description="Full validation report with metrics and policy checks"
    )
    scores: Dict[str, float] = Field(
        ...,
        description="Individual metric scores (each 0.0-1.0)"
    )
    total_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Weighted total score (0.0-1.0)"
    )
    passed: bool = Field(
        ...,
        description="Whether total_score meets blueprint threshold"
    )
    issues: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of validation issues (empty if passed=True)"
    )

    @field_validator("scores")
    @classmethod
    def validate_all_scores_in_range(cls, v: Dict[str, float]) -> Dict[str, float]:
        """Ensure all individual scores are 0.0-1.0."""
        for metric, score in v.items():
            if not 0.0 <= score <= 1.0:
                raise ValueError(f"Score '{metric}' must be 0.0-1.0, got {score}")
        return v

    @model_validator(mode="after")
    def validate_pass_fail_consistency(self) -> "ValidateOutput":
        """Ensure issues list is non-empty when passed=False."""
        if not self.passed and not self.issues:
            raise ValueError("passed=False requires at least one issue")
        return self


# =============================================================================
# FIX Skill Contracts
# =============================================================================

class FixInput(SkillInput):
    """
    Input contract for the FIX skill.

    The FIX skill applies targeted patches to improve validation scores.
    Maximum 3 iterations per workflow run.

    Attributes:
        context: Workflow execution context
        validation_report: Validation report from VALIDATE skill
        lyrics: Current lyrics (may be patched)
        style: Current style (may be patched)
        producer_notes: Current producer notes (may be patched)
        blueprint: Genre blueprint for constraints
        iteration: Current fix iteration (1-3)

    Example:
        ```python
        fix_input = FixInput(
            context=ctx,
            validation_report={
                "scores": {"hookDensity": 0.65, ...},
                "total_score": 0.72,
                "passed": False,
                "issues": [{"metric": "hookDensity", "reason": "Too few hook repetitions"}]
            },
            lyrics={...},
            style={...},
            producer_notes={...},
            blueprint={...},
            iteration=1
        )
        ```
    """

    validation_report: Dict[str, Any] = Field(
        ...,
        description="Validation report from VALIDATE skill with scores and issues"
    )
    lyrics: Dict[str, Any] = Field(
        ...,
        description="Current lyrics (to be patched if needed)"
    )
    style: Dict[str, Any] = Field(
        ...,
        description="Current style (to be patched if needed)"
    )
    producer_notes: Dict[str, Any] = Field(
        ...,
        description="Current producer notes (to be patched if needed)"
    )
    blueprint: Dict[str, Any] = Field(
        ...,
        description="Genre blueprint with constraints"
    )
    iteration: int = Field(
        default=1,
        ge=1,
        le=3,
        description="Current fix iteration (1-3 max)"
    )

    @field_validator("validation_report")
    @classmethod
    def validate_report_has_issues(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure validation report has issues to fix."""
        if "issues" not in v or not v["issues"]:
            raise ValueError("Validation report must have issues to fix")
        return v


class FixOutput(SkillOutput):
    """
    Output contract for the FIX skill.

    FIX applies targeted patches to artifacts. Only modified artifacts are included.

    Attributes:
        patched_lyrics: Updated lyrics (None if unchanged)
        patched_style: Updated style (None if unchanged)
        patched_producer_notes: Updated producer notes (None if unchanged)
        fixes_applied: List of descriptions of fixes applied
        improvement: Expected score improvement delta

    Example:
        ```python
        fix_output = FixOutput(
            status="success",
            execution_time_ms=780,
            artifact_hash="sha256:stu...",
            patched_lyrics={
                "sections": [
                    # Updated sections with improved hook density
                ]
            },
            patched_style=None,  # Not modified
            patched_producer_notes=None,  # Not modified
            fixes_applied=[
                "Duplicated chorus hook in bridge",
                "Added title callback in final chorus"
            ],
            improvement=0.13  # Expected +0.13 to hookDensity score
        )
        ```
    """

    patched_lyrics: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated lyrics (None if unchanged)"
    )
    patched_style: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated style (None if unchanged)"
    )
    patched_producer_notes: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated producer notes (None if unchanged)"
    )
    fixes_applied: List[str] = Field(
        default_factory=list,
        description="List of fix descriptions applied"
    )
    improvement: float = Field(
        default=0.0,
        ge=0.0,
        description="Expected score improvement delta (0.0 if no fixes)"
    )

    @model_validator(mode="after")
    def validate_at_least_one_fix(self) -> "FixOutput":
        """Ensure at least one artifact was patched if status is success."""
        if self.status == "success":
            has_patches = any([
                self.patched_lyrics is not None,
                self.patched_style is not None,
                self.patched_producer_notes is not None
            ])
            if not has_patches:
                raise ValueError("Success status requires at least one patched artifact")
            if not self.fixes_applied:
                raise ValueError("Success status requires at least one fix description")
        return self


# =============================================================================
# REVIEW Skill Contracts
# =============================================================================

class ReviewInput(SkillInput):
    """
    Input contract for the REVIEW skill.

    The REVIEW skill finalizes the workflow by persisting all artifacts,
    computing provenance, and emitting summary events.

    Attributes:
        context: Workflow execution context
        artifacts: All workflow artifacts (style, lyrics, producer_notes, composed_prompt)
        validation_report: Final validation report

    Example:
        ```python
        review_input = ReviewInput(
            context=ctx,
            artifacts={
                "plan": {...},
                "style": {...},
                "lyrics": {...},
                "producer_notes": {...},
                "composed_prompt": {...}
            },
            validation_report={
                "scores": {...},
                "total_score": 0.89,
                "passed": True
            }
        )
        ```
    """

    artifacts: Dict[str, Any] = Field(
        ...,
        description="All workflow artifacts (plan, style, lyrics, producer_notes, composed_prompt)"
    )
    validation_report: Dict[str, Any] = Field(
        ...,
        description="Final validation report from VALIDATE skill"
    )

    @field_validator("artifacts")
    @classmethod
    def validate_artifacts_has_required_keys(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure artifacts has all required workflow outputs."""
        required = {"plan", "style", "lyrics", "producer_notes", "composed_prompt"}
        missing = required - set(v.keys())
        if missing:
            raise ValueError(f"Artifacts missing required keys: {missing}")
        return v


class ReviewOutput(SkillOutput):
    """
    Output contract for the REVIEW skill.

    Review finalizes the workflow with full provenance and optional S3 paths.

    Attributes:
        summary: Workflow summary with final scores and outcomes
        provenance: Full traceability (artifact hashes, citations, sources)
        s3_paths: Optional S3 paths if artifacts were persisted to object storage

    Summary Structure:
        {
            "runId": "uuid",
            "songId": "song-uuid",
            "status": "success",
            "finalScore": 0.89,
            "passed": True,
            "iterations": 0,  # Number of FIX iterations
            "totalExecutionTimeMs": 8450,
            "createdAt": "2025-11-18T10:00:00Z",
            "completedAt": "2025-11-18T10:00:08Z"
        }

    Provenance Structure:
        {
            "artifactHashes": {
                "plan": "sha256:abc...",
                "style": "sha256:def...",
                "lyrics": "sha256:ghi...",
                "producer_notes": "sha256:jkl...",
                "composed_prompt": "sha256:mno..."
            },
            "citations": [...],  # All citations from LYRICS
            "sources": [...],  # All sources used
            "seed": 12345,
            "featureFlags": {...}
        }

    Example:
        ```python
        review_output = ReviewOutput(
            status="success",
            execution_time_ms=450,
            artifact_hash="sha256:vwx...",
            summary={
                "runId": "uuid",
                "status": "success",
                "finalScore": 0.89,
                "passed": True,
                "iterations": 0
            },
            provenance={
                "artifactHashes": {...},
                "citations": [...],
                "seed": 12345
            },
            s3_paths={
                "composed_prompt": "s3://bucket/runs/uuid/composed_prompt.json",
                "validation_report": "s3://bucket/runs/uuid/validation_report.json"
            }
        )
        ```
    """

    summary: Dict[str, Any] = Field(
        ...,
        description="Workflow summary with final scores and outcomes"
    )
    provenance: Dict[str, Any] = Field(
        ...,
        description="Full traceability with artifact hashes, citations, and sources"
    )
    s3_paths: Optional[Dict[str, str]] = Field(
        None,
        description="S3 paths for persisted artifacts (if configured)"
    )

    @field_validator("summary")
    @classmethod
    def validate_summary_has_required_keys(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure summary has required keys."""
        required = {"runId", "songId", "status", "finalScore", "passed"}
        missing = required - set(v.keys())
        if missing:
            raise ValueError(f"Summary missing required keys: {missing}")
        return v

    @field_validator("provenance")
    @classmethod
    def validate_provenance_has_artifact_hashes(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure provenance has artifact hashes."""
        if "artifactHashes" not in v:
            raise ValueError("Provenance must include 'artifactHashes'")
        return v


# =============================================================================
# Export All Contracts
# =============================================================================

__all__ = [
    # Base contracts
    "WorkflowContext",
    "SkillInput",
    "SkillOutput",
    # PLAN
    "PlanInput",
    "PlanOutput",
    # STYLE
    "StyleInput",
    "StyleOutput",
    # LYRICS
    "LyricsInput",
    "LyricsOutput",
    # PRODUCER
    "ProducerInput",
    "ProducerOutput",
    # COMPOSE
    "ComposeInput",
    "ComposeOutput",
    # VALIDATE
    "ValidateInput",
    "ValidateOutput",
    # FIX
    "FixInput",
    "FixOutput",
    # REVIEW
    "ReviewInput",
    "ReviewOutput",
]
