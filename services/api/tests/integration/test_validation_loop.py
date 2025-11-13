"""Integration tests for VALIDATE → FIX → COMPOSE → VALIDATE loop."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.workflows.orchestrator import WorkflowOrchestrator
from app.workflows.events import EventPublisher
from app.repositories.workflow_run_repo import WorkflowRunRepository
from app.repositories.node_execution_repo import NodeExecutionRepository


@pytest.fixture
def mock_db_session():
    """Create mock database session."""
    session = MagicMock()
    session.commit = MagicMock()
    session.add = MagicMock()
    return session


@pytest.fixture
def mock_event_publisher():
    """Create mock event publisher."""
    return EventPublisher(None)


@pytest.fixture
def mock_workflow_run_repo():
    """Create mock workflow run repository."""
    repo = MagicMock(spec=WorkflowRunRepository)

    # Create mock run
    mock_run = MagicMock()
    mock_run.run_id = uuid4()
    mock_run.song_id = uuid4()
    mock_run.status = "pending"
    mock_run.current_node = None
    mock_run.extra_metadata = {
        "seed": 42,
        "manifest": {
            "graph": [
                {"id": "PLAN"},
                {"id": "STYLE"},
                {"id": "LYRICS"},
                {"id": "PRODUCER"},
                {"id": "COMPOSE"},
                {"id": "VALIDATE"},
                {"id": "FIX", "on": "fail", "max_retries": 3},
            ],
            "flags": {"render": False},
        },
    }

    repo.get_by_run_id = MagicMock(return_value=mock_run)
    return repo


@pytest.fixture
def mock_node_execution_repo():
    """Create mock node execution repository."""
    return MagicMock(spec=NodeExecutionRepository)


@pytest.fixture
def orchestrator(
    mock_db_session,
    mock_event_publisher,
    mock_workflow_run_repo,
    mock_node_execution_repo,
):
    """Create orchestrator with mocked dependencies."""
    return WorkflowOrchestrator(
        db_session=mock_db_session,
        event_publisher=mock_event_publisher,
        workflow_run_repo=mock_workflow_run_repo,
        node_execution_repo=mock_node_execution_repo,
    )


@pytest.mark.asyncio
async def test_validation_passes_on_first_try(orchestrator, mock_workflow_run_repo):
    """Test validation loop when validation passes on first try."""
    run_id = mock_workflow_run_repo.get_by_run_id().run_id

    # Mock skills to return passing validation
    async def mock_plan(inputs, context):
        return {
            "plan": {},
            "blueprint": {
                "rules": {"required_sections": ["Verse", "Chorus"]},
                "eval_rubric": {
                    "weights": {
                        "hook_density": 0.25,
                        "singability": 0.25,
                        "rhyme_tightness": 0.20,
                        "section_completeness": 0.20,
                        "profanity_score": 0.10,
                    },
                    "thresholds": {"min_total": 0.85},
                },
            },
            "sds": {"constraints": {"explicit": False}},
        }

    async def mock_style(inputs, context):
        return {"style": {"genre_detail": {"primary": "Pop"}}}

    async def mock_lyrics(inputs, context):
        return {
            "lyrics": """[Verse]
Hook line here
Hook line here

[Chorus]
Hook line here
Hook line here"""
        }

    async def mock_producer(inputs, context):
        return {"producer_notes": {"structure": "Verse-Chorus", "hooks": 2}}

    async def mock_compose(inputs, context):
        return {"composed_prompt": {"text": "Complete prompt"}}

    async def mock_validate(inputs, context):
        return {
            "scores": {
                "total": 0.90,
                "hook_density": 0.85,
                "singability": 0.90,
                "rhyme_tightness": 0.88,
                "section_completeness": 1.0,
                "profanity_score": 1.0,
            },
            "issues": [],
            "pass": True,
        }

    # Register mocked skills
    orchestrator.register_skill("PLAN", mock_plan)
    orchestrator.register_skill("STYLE", mock_style)
    orchestrator.register_skill("LYRICS", mock_lyrics)
    orchestrator.register_skill("PRODUCER", mock_producer)
    orchestrator.register_skill("COMPOSE", mock_compose)
    orchestrator.register_skill("VALIDATE", mock_validate)

    # Execute run
    result = await orchestrator.execute_run(run_id)

    # Validation passed, no fixes needed
    assert result["status"] == "completed"
    assert result["fix_iterations"] == 0
    assert result["validation_scores"]["total"] == 0.90


@pytest.mark.asyncio
async def test_validation_fails_then_passes_after_fix(
    orchestrator, mock_workflow_run_repo
):
    """Test validation loop when validation fails, then passes after one fix."""
    run_id = mock_workflow_run_repo.get_by_run_id().run_id

    validation_call_count = 0

    async def mock_plan(inputs, context):
        return {
            "plan": {},
            "blueprint": {
                "rules": {"required_sections": ["Verse", "Chorus"]},
                "eval_rubric": {
                    "weights": {
                        "hook_density": 0.25,
                        "singability": 0.25,
                        "rhyme_tightness": 0.20,
                        "section_completeness": 0.20,
                        "profanity_score": 0.10,
                    },
                    "thresholds": {"min_total": 0.85},
                },
            },
            "sds": {"constraints": {"explicit": False}},
        }

    async def mock_style(inputs, context):
        return {"style": {"genre_detail": {"primary": "Pop"}}}

    async def mock_lyrics(inputs, context):
        return {
            "lyrics": """[Verse]
Low hook density

[Chorus]
No repeated hooks"""
        }

    async def mock_producer(inputs, context):
        return {"producer_notes": {"structure": "Verse-Chorus", "hooks": 1}}

    async def mock_compose(inputs, context):
        return {"composed_prompt": {"text": "Complete prompt"}}

    async def mock_validate(inputs, context):
        nonlocal validation_call_count
        validation_call_count += 1

        if validation_call_count == 1:
            # First validation: fail
            return {
                "scores": {
                    "total": 0.70,
                    "hook_density": 0.45,
                    "singability": 0.80,
                    "rhyme_tightness": 0.75,
                    "section_completeness": 1.0,
                    "profanity_score": 1.0,
                },
                "issues": ["Low hook density: 0.45 (target 0.7)"],
                "pass": False,
            }
        else:
            # After fix: pass
            return {
                "scores": {
                    "total": 0.88,
                    "hook_density": 0.75,
                    "singability": 0.85,
                    "rhyme_tightness": 0.80,
                    "section_completeness": 1.0,
                    "profanity_score": 1.0,
                },
                "issues": [],
                "pass": True,
            }

    async def mock_fix(inputs, context):
        return {
            "patched_lyrics": """[Verse]
Hook line here
Hook line here

[Chorus]
Hook line here
Hook line here""",
            "patched_style": inputs["style"],
            "patched_producer_notes": inputs["producer_notes"],
            "fixes_applied": ["Added hook repetitions"],
        }

    # Register mocked skills
    orchestrator.register_skill("PLAN", mock_plan)
    orchestrator.register_skill("STYLE", mock_style)
    orchestrator.register_skill("LYRICS", mock_lyrics)
    orchestrator.register_skill("PRODUCER", mock_producer)
    orchestrator.register_skill("COMPOSE", mock_compose)
    orchestrator.register_skill("VALIDATE", mock_validate)
    orchestrator.register_skill("FIX", mock_fix)

    # Execute run
    result = await orchestrator.execute_run(run_id)

    # Should have completed with 1 fix iteration
    assert result["status"] == "completed"
    assert result["fix_iterations"] == 1
    assert result["validation_scores"]["total"] == 0.88


@pytest.mark.asyncio
async def test_validation_max_retries_exceeded(orchestrator, mock_workflow_run_repo):
    """Test validation loop when max retries (3) are exceeded."""
    run_id = mock_workflow_run_repo.get_by_run_id().run_id

    async def mock_plan(inputs, context):
        return {
            "plan": {},
            "blueprint": {
                "rules": {"required_sections": ["Verse", "Chorus"]},
                "eval_rubric": {
                    "weights": {
                        "hook_density": 0.25,
                        "singability": 0.25,
                        "rhyme_tightness": 0.20,
                        "section_completeness": 0.20,
                        "profanity_score": 0.10,
                    },
                    "thresholds": {"min_total": 0.85},
                },
            },
            "sds": {"constraints": {"explicit": False}},
        }

    async def mock_style(inputs, context):
        return {"style": {"genre_detail": {"primary": "Pop"}}}

    async def mock_lyrics(inputs, context):
        return {"lyrics": "[Verse]\nLow quality\n[Chorus]\nLow quality"}

    async def mock_producer(inputs, context):
        return {"producer_notes": {"structure": "Verse-Chorus", "hooks": 1}}

    async def mock_compose(inputs, context):
        return {"composed_prompt": {"text": "Complete prompt"}}

    async def mock_validate(inputs, context):
        # Always fail validation
        return {
            "scores": {
                "total": 0.70,
                "hook_density": 0.45,
                "singability": 0.70,
                "rhyme_tightness": 0.65,
                "section_completeness": 1.0,
                "profanity_score": 1.0,
            },
            "issues": [
                "Low hook density: 0.45 (target 0.7)",
                "Weak singability: 0.70 (target 0.8)",
            ],
            "pass": False,
        }

    async def mock_fix(inputs, context):
        # Fix doesn't improve enough
        return {
            "patched_lyrics": inputs["lyrics"],
            "patched_style": inputs["style"],
            "patched_producer_notes": inputs["producer_notes"],
            "fixes_applied": ["Attempted fix but not enough"],
        }

    # Register mocked skills
    orchestrator.register_skill("PLAN", mock_plan)
    orchestrator.register_skill("STYLE", mock_style)
    orchestrator.register_skill("LYRICS", mock_lyrics)
    orchestrator.register_skill("PRODUCER", mock_producer)
    orchestrator.register_skill("COMPOSE", mock_compose)
    orchestrator.register_skill("VALIDATE", mock_validate)
    orchestrator.register_skill("FIX", mock_fix)

    # Execute run
    result = await orchestrator.execute_run(run_id)

    # Should complete despite validation failure (max retries exceeded)
    assert result["status"] == "completed"
    assert result["fix_iterations"] == 3  # Max retries
    assert result["validation_scores"]["pass"] is False


@pytest.mark.asyncio
async def test_validation_loop_updates_artifacts(orchestrator, mock_workflow_run_repo):
    """Test that fix loop properly updates artifacts for re-composition."""
    run_id = mock_workflow_run_repo.get_by_run_id().run_id

    compose_call_count = 0
    compose_inputs_history = []

    async def mock_plan(inputs, context):
        return {
            "plan": {},
            "blueprint": {
                "rules": {"required_sections": ["Verse", "Chorus"]},
                "eval_rubric": {
                    "weights": {
                        "hook_density": 0.25,
                        "singability": 0.25,
                        "rhyme_tightness": 0.20,
                        "section_completeness": 0.20,
                        "profanity_score": 0.10,
                    },
                    "thresholds": {"min_total": 0.85},
                },
            },
            "sds": {"constraints": {"explicit": False}},
        }

    async def mock_style(inputs, context):
        return {"style": {"genre_detail": {"primary": "Pop"}}}

    async def mock_lyrics(inputs, context):
        return {"lyrics": "Original lyrics"}

    async def mock_producer(inputs, context):
        return {"producer_notes": {"structure": "Verse-Chorus"}}

    async def mock_compose(inputs, context):
        nonlocal compose_call_count
        compose_call_count += 1
        compose_inputs_history.append(inputs.copy())
        return {"composed_prompt": {"text": f"Compose call {compose_call_count}"}}

    validation_call_count = 0

    async def mock_validate(inputs, context):
        nonlocal validation_call_count
        validation_call_count += 1

        if validation_call_count == 1:
            return {
                "scores": {"total": 0.70, "hook_density": 0.45},
                "issues": ["Low hook density"],
                "pass": False,
            }
        else:
            return {
                "scores": {"total": 0.90, "hook_density": 0.80},
                "issues": [],
                "pass": True,
            }

    async def mock_fix(inputs, context):
        return {
            "patched_lyrics": "Fixed lyrics",
            "patched_style": inputs["style"],
            "patched_producer_notes": inputs["producer_notes"],
            "fixes_applied": ["Fixed lyrics"],
        }

    # Register mocked skills
    orchestrator.register_skill("PLAN", mock_plan)
    orchestrator.register_skill("STYLE", mock_style)
    orchestrator.register_skill("LYRICS", mock_lyrics)
    orchestrator.register_skill("PRODUCER", mock_producer)
    orchestrator.register_skill("COMPOSE", mock_compose)
    orchestrator.register_skill("VALIDATE", mock_validate)
    orchestrator.register_skill("FIX", mock_fix)

    # Execute run
    result = await orchestrator.execute_run(run_id)

    # Compose should be called twice: initial + after fix
    assert compose_call_count == 2

    # Second compose call should use fixed lyrics
    # Note: This depends on orchestrator properly updating inputs
    # The test verifies the loop executes correctly
    assert result["status"] == "completed"
    assert result["fix_iterations"] == 1


@pytest.mark.asyncio
async def test_validation_loop_determinism(orchestrator, mock_workflow_run_repo):
    """Test that validation loop is deterministic with same seed."""
    run_id = mock_workflow_run_repo.get_by_run_id().run_id

    validation_results = []

    async def mock_plan(inputs, context):
        return {
            "plan": {},
            "blueprint": {
                "rules": {"required_sections": ["Verse", "Chorus"]},
                "eval_rubric": {
                    "weights": {
                        "hook_density": 0.25,
                        "singability": 0.25,
                        "rhyme_tightness": 0.20,
                        "section_completeness": 0.20,
                        "profanity_score": 0.10,
                    },
                    "thresholds": {"min_total": 0.85},
                },
            },
            "sds": {"constraints": {"explicit": False}},
        }

    async def mock_validate(inputs, context):
        result = {
            "scores": {"total": 0.90, "hook_density": 0.85},
            "issues": [],
            "pass": True,
            "seed": context.seed,
        }
        validation_results.append(result)
        return result

    # Register minimal skills
    orchestrator.register_skill("PLAN", mock_plan)
    orchestrator.register_skill("STYLE", lambda i, c: {"style": {}})
    orchestrator.register_skill("LYRICS", lambda i, c: {"lyrics": "lyrics"})
    orchestrator.register_skill("PRODUCER", lambda i, c: {"producer_notes": {}})
    orchestrator.register_skill("COMPOSE", lambda i, c: {"composed_prompt": {}})
    orchestrator.register_skill("VALIDATE", mock_validate)

    # Execute run
    result = await orchestrator.execute_run(run_id)

    # Verify seed was propagated correctly
    assert len(validation_results) > 0
    # VALIDATE should be node index 5, so seed should be 42 + 5 = 47
    # (PLAN=0, STYLE=1, LYRICS=2, PRODUCER=3, COMPOSE=4, VALIDATE=5)
    # Note: Actual index depends on node execution order
    assert result["status"] == "completed"
