# Workflow Events Usage Guide

This guide demonstrates how to use the workflow event emission framework in AMCS skills.

## Overview

The workflow event framework provides standardized observability for all AMCS workflow skills through:

- **Real-time progress tracking** via WebSocket streams
- **Audit trail** in database for debugging and compliance
- **Structured logging** for monitoring and alerting
- **Automatic timing** of skill execution

## Quick Start

### Basic Skill Pattern

The simplest way to emit events is using the `skill_execution` context manager:

```python
from app.core.workflow_events import skill_execution, NODE_LYRICS

def generate_lyrics(run_id: str, input_data: dict) -> dict:
    """Generate lyrics with automatic event emission."""
    with skill_execution(run_id=run_id, node_name=NODE_LYRICS) as state:
        # Your implementation here
        result = create_lyrics(input_data)

        # Populate metrics (optional)
        state["metrics"]["lines_generated"] = len(result["lines"])
        state["metrics"]["citations"] = len(result["citations"])

        # Note any issues (optional)
        if len(result["lines"]) < 10:
            state["issues"].append("Warning: short lyrics")

        return result
    # END event automatically emitted with metrics and duration
```

### What Happens

1. **On entry**: START event emitted with `phase="start"`, `duration_ms=0`
2. **During execution**: You populate `state["metrics"]` and `state["issues"]`
3. **On success**: END event emitted with `phase="end"`, measured duration, metrics, and issues
4. **On exception**: FAIL event emitted with `phase="fail"`, duration, metrics, issues including exception message

## Event Structure

All events follow this schema:

```json
{
  "ts": "2025-11-18T12:00:00.000000",
  "run_id": "uuid-of-workflow-run",
  "node": "LYRICS",
  "phase": "end",
  "duration_ms": 1234,
  "metrics": {
    "lines_generated": 42,
    "citations": 5,
    "custom_metric": 3.14
  },
  "issues": [
    "Warning: short lyrics",
    "Info: using fallback source"
  ]
}
```

## Available Nodes

Use these constants for the `node_name` parameter:

```python
from app.core.workflow_events import (
    NODE_PLAN,      # "PLAN"
    NODE_STYLE,     # "STYLE"
    NODE_LYRICS,    # "LYRICS"
    NODE_PRODUCER,  # "PRODUCER"
    NODE_COMPOSE,   # "COMPOSE"
    NODE_VALIDATE,  # "VALIDATE"
    NODE_FIX,       # "FIX"
    NODE_REVIEW,    # "REVIEW"
)
```

## Available Phases

Events automatically use these phase constants:

```python
from app.core.workflow_events import (
    PHASE_START,  # "start" - skill beginning
    PHASE_END,    # "end"   - skill completed successfully
    PHASE_FAIL,   # "fail"  - skill raised exception
)
```

## Usage Patterns

### Pattern 1: Simple Skill (No Metrics)

```python
from app.core.workflow_events import skill_execution, NODE_PLAN

def plan_workflow(run_id: str, sds: dict) -> dict:
    """Plan workflow without custom metrics."""
    with skill_execution(run_id=run_id, node_name=NODE_PLAN):
        # Just do the work
        plan = create_plan(sds)
        return plan
    # Events emitted automatically
```

### Pattern 2: Skill with Metrics

```python
from app.core.workflow_events import skill_execution, NODE_LYRICS

def generate_lyrics(run_id: str, style_spec: dict) -> dict:
    """Generate lyrics with detailed metrics."""
    with skill_execution(run_id=run_id, node_name=NODE_LYRICS) as state:
        result = create_lyrics(style_spec)

        # Populate metrics for observability
        state["metrics"]["lines_generated"] = len(result["lines"])
        state["metrics"]["verses"] = result["verse_count"]
        state["metrics"]["chorus_count"] = result["chorus_count"]
        state["metrics"]["citations"] = len(result["citations"])
        state["metrics"]["avg_line_length"] = result["avg_length"]

        return result
```

### Pattern 3: Skill with Issues/Warnings

```python
from app.core.workflow_events import skill_execution, NODE_VALIDATE

def validate_prompt(run_id: str, composed_prompt: dict) -> dict:
    """Validate prompt with issue tracking."""
    with skill_execution(run_id=run_id, node_name=NODE_VALIDATE) as state:
        scores = compute_scores(composed_prompt)

        # Track validation issues
        if scores["hook_density"] < 0.7:
            state["issues"].append("Low hook density: {:.2f}".format(scores["hook_density"]))

        if scores["profanity_score"] > 0.0:
            state["issues"].append("Profanity detected: score={:.2f}".format(scores["profanity_score"]))

        if len(composed_prompt["text"]) > 3000:
            state["issues"].append("Prompt exceeds length limit")

        # Include scores as metrics
        state["metrics"].update(scores)

        return scores
```

### Pattern 4: Handling Exceptions

```python
from app.core.workflow_events import skill_execution, NODE_STYLE

def generate_style(run_id: str, sds: dict) -> dict:
    """Generate style with error handling."""
    with skill_execution(run_id=run_id, node_name=NODE_STYLE) as state:
        try:
            style_spec = create_style(sds)
            state["metrics"]["tags_generated"] = len(style_spec["tags"])
            return style_spec
        except ValueError as e:
            # Add context before re-raising
            state["issues"].append(f"Invalid SDS: {e}")
            raise
    # FAIL event automatically emitted with exception details
```

### Pattern 5: Sub-Task Timing

```python
from app.core.workflow_events import skill_execution, EventTimer, NODE_COMPOSE

def compose_prompt(run_id: str, artifacts: dict) -> dict:
    """Compose prompt with sub-task timing."""
    with skill_execution(run_id=run_id, node_name=NODE_COMPOSE) as state:
        # Time merge phase
        merge_timer = EventTimer()
        merge_timer.start()
        merged = merge_artifacts(artifacts)
        merge_timer.stop()
        state["metrics"]["merge_ms"] = merge_timer.duration_ms()

        # Time validation phase
        validate_timer = EventTimer()
        validate_timer.start()
        validated = validate_merged(merged)
        validate_timer.stop()
        state["metrics"]["validate_ms"] = validate_timer.duration_ms()

        # Time composition phase
        compose_timer = EventTimer()
        compose_timer.start()
        composed = build_final_prompt(validated)
        compose_timer.stop()
        state["metrics"]["compose_ms"] = compose_timer.duration_ms()

        state["metrics"]["total_chars"] = len(composed["text"])

        return composed
```

### Pattern 6: Conditional Event Emission

```python
from app.core.workflow_events import skill_execution, NODE_FIX

def auto_fix(run_id: str, prompt: dict, emit_events: bool = True) -> dict:
    """Auto-fix with optional event emission."""
    with skill_execution(
        run_id=run_id,
        node_name=NODE_FIX,
        emit_events=emit_events  # Can disable for internal testing
    ) as state:
        fixed_prompt = apply_fixes(prompt)
        state["metrics"]["fixes_applied"] = len(fixed_prompt["changes"])
        return fixed_prompt
```

## Manual Event Emission

For cases where you need manual control:

```python
from datetime import datetime
from app.core.workflow_events import WorkflowEvent, emit_event_sync, PHASE_END, NODE_REVIEW

def custom_workflow_step(run_id: str) -> None:
    """Manual event creation and emission."""
    # Create event manually
    event = WorkflowEvent(
        ts=datetime.utcnow(),
        run_id=run_id,
        node=NODE_REVIEW,
        phase=PHASE_END,
        duration_ms=1234,
        metrics={"artifacts_created": 5},
        issues=[]
    )

    # Emit synchronously
    emit_event_sync(event)

    # Or emit asynchronously (if in async context)
    # await emit_event(event)
```

## EventTimer Standalone Usage

```python
from app.core.workflow_events import EventTimer

timer = EventTimer()
timer.start()

# Do some work
process_data()

timer.stop()
duration = timer.duration_ms()
print(f"Processing took {duration}ms")

# Reuse timer
timer.reset()
timer.start()
# More work...
timer.stop()
```

## Best Practices

### 1. Always Use skill_execution for Skills

```python
# Good: Automatic event handling
with skill_execution(run_id=run_id, node_name=NODE_LYRICS) as state:
    return generate_lyrics(input_data)

# Avoid: Manual event management (more error-prone)
emit_event_sync(WorkflowEvent(run_id=run_id, node=NODE_LYRICS, phase=PHASE_START))
try:
    result = generate_lyrics(input_data)
    emit_event_sync(WorkflowEvent(run_id=run_id, node=NODE_LYRICS, phase=PHASE_END))
    return result
except Exception as e:
    emit_event_sync(WorkflowEvent(run_id=run_id, node=NODE_LYRICS, phase=PHASE_FAIL))
    raise
```

### 2. Populate Meaningful Metrics

```python
# Good: Specific, actionable metrics
state["metrics"]["lines_generated"] = 42
state["metrics"]["avg_line_length"] = 8.5
state["metrics"]["rhyme_density"] = 0.85

# Avoid: Generic or unclear metrics
state["metrics"]["count"] = 42
state["metrics"]["value"] = 8.5
```

### 3. Use Issues for Warnings, Not Errors

```python
# Good: Non-fatal warnings
if score < threshold:
    state["issues"].append(f"Low score: {score:.2f}")

# Avoid: Fatal errors (use exceptions instead)
if critical_error:
    state["issues"].append("Critical error")  # Won't be seen before exception
    raise ValueError("Critical error")
```

### 4. Keep Metrics Numeric

```python
# Good: Numeric metrics for analysis
state["metrics"]["lines"] = 42
state["metrics"]["score"] = 0.85

# Avoid: String metrics (harder to aggregate)
state["metrics"]["status"] = "complete"
state["metrics"]["quality"] = "good"
```

### 5. Use Descriptive Issue Messages

```python
# Good: Actionable issue description
state["issues"].append(f"Hook density {density:.2f} below threshold {threshold:.2f}")

# Avoid: Vague messages
state["issues"].append("Problem detected")
```

## Integration Points

The framework currently logs events to the structured logger. Future integration points:

### Database Persistence (TODO)

```python
# TODO: Integrate with EventPublisher
# await event_repository.create(event)
```

### WebSocket Broadcasting (TODO)

```python
# TODO: Integrate with WebSocket manager
# await websocket_manager.broadcast(event.to_dict())
```

These integration points are marked with TODO comments in the source code and will be implemented in future phases.

## Testing Your Skills

When writing tests for skills that use events:

```python
from unittest.mock import patch

@patch("app.core.workflow_events.logger")
def test_my_skill(mock_logger):
    """Test skill with mocked event emission."""
    result = my_skill(run_id="test-123", input_data={})

    # Verify skill logic
    assert result["status"] == "success"

    # Verify events were emitted
    assert mock_logger.info.call_count == 2  # START and END

    # Check event details
    end_call = mock_logger.info.call_args_list[1]
    assert end_call[1]["extra"]["phase"] == "end"
    assert end_call[1]["extra"]["metrics"]["lines"] == 42
```

## Complete Example: LYRICS Skill

```python
from app.core.workflow_events import skill_execution, NODE_LYRICS, EventTimer

def generate_lyrics_skill(
    run_id: str,
    style_spec: dict,
    constraints: dict,
    seed: int
) -> dict:
    """
    Generate lyrics with comprehensive observability.

    Emits events with metrics:
    - lines_generated: Number of lyric lines created
    - verses, choruses, bridges: Section counts
    - citations: Number of source citations
    - retrieval_ms: Time spent on source retrieval
    - generation_ms: Time spent on generation
    - validation_ms: Time spent on validation

    Tracks issues:
    - Short sections
    - Profanity violations
    - Rhyme scheme issues
    - Citation problems
    """
    with skill_execution(run_id=run_id, node_name=NODE_LYRICS) as state:
        # Phase 1: Retrieve sources
        retrieval_timer = EventTimer()
        retrieval_timer.start()
        sources = retrieve_sources(style_spec, constraints, seed)
        retrieval_timer.stop()
        state["metrics"]["retrieval_ms"] = retrieval_timer.duration_ms()
        state["metrics"]["sources_retrieved"] = len(sources)

        # Phase 2: Generate lyrics
        generation_timer = EventTimer()
        generation_timer.start()
        lyrics = generate_text(sources, style_spec, constraints, seed)
        generation_timer.stop()
        state["metrics"]["generation_ms"] = generation_timer.duration_ms()

        # Phase 3: Validate
        validation_timer = EventTimer()
        validation_timer.start()
        validation_result = validate_lyrics(lyrics, constraints)
        validation_timer.stop()
        state["metrics"]["validation_ms"] = validation_timer.duration_ms()

        # Populate metrics
        state["metrics"]["lines_generated"] = len(lyrics["lines"])
        state["metrics"]["verses"] = lyrics["verse_count"]
        state["metrics"]["choruses"] = lyrics["chorus_count"]
        state["metrics"]["bridges"] = lyrics["bridge_count"]
        state["metrics"]["citations"] = len(lyrics["citations"])
        state["metrics"]["avg_line_length"] = sum(len(line) for line in lyrics["lines"]) / len(lyrics["lines"])

        # Track issues
        if lyrics["verse_count"] < 2:
            state["issues"].append(f"Low verse count: {lyrics['verse_count']}")

        if lyrics["chorus_count"] < 1:
            state["issues"].append("Missing chorus section")

        if validation_result["profanity_score"] > constraints.get("explicit", 0):
            state["issues"].append(f"Profanity violation: {validation_result['profanity_score']}")

        if validation_result["rhyme_density"] < 0.7:
            state["issues"].append(f"Low rhyme density: {validation_result['rhyme_density']:.2f}")

        if not lyrics["citations"]:
            state["issues"].append("Warning: no citations included")

        return lyrics
```

## Monitoring and Debugging

### Viewing Events in Logs

Events are logged with structured context:

```json
{
  "event": "workflow_event.LYRICS.end",
  "timestamp": "2025-11-18T12:00:00Z",
  "run_id": "uuid",
  "node": "LYRICS",
  "phase": "end",
  "duration_ms": 1234,
  "metrics": {"lines_generated": 42},
  "issues": ["Warning: short lyrics"],
  "trace_id": "...",
  "span_id": "...",
  "service": "meatymusic-api"
}
```

### Querying Events

Once database integration is complete, you can query events:

```sql
-- Find all failed lyrics generations
SELECT * FROM workflow_events
WHERE node = 'LYRICS' AND phase = 'fail'
ORDER BY ts DESC;

-- Average duration by node
SELECT node, AVG(duration_ms) as avg_duration
FROM workflow_events
WHERE phase = 'end'
GROUP BY node;

-- Find runs with issues
SELECT DISTINCT run_id, issues
FROM workflow_events
WHERE array_length(issues, 1) > 0;
```

## Summary

The workflow event framework provides:

- **Zero-boilerplate observability** via context manager
- **Automatic timing** of skill execution
- **Flexible metrics** for skill-specific measurements
- **Issue tracking** for warnings and non-fatal problems
- **Integration-ready** for DB persistence and WebSocket streaming

Use `skill_execution` in all workflow skills to ensure consistent, comprehensive observability across the AMCS system.
