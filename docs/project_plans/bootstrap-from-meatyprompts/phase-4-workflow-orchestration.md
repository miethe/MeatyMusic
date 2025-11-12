# Phase 4: Workflow Orchestration (15-20 days)

**Timeline**: 15-20 days (3-4 weeks)
**Effort**: 55 story points
**Dependencies**: Phase 3 complete
**Team**: skill-builder, python-backend-engineer, backend-architect, code-reviewer, senior-code-reviewer

---

## Goals

- Create Claude Code skills for workflow nodes
- Implement graph runner (orchestrator)
- Build validation and auto-fix logic
- Create event streaming system

## Tasks

### Week 1: Workflow Skills Foundation

#### 1. Create skill structure (`.claude/skills/`):
```
.claude/skills/
├── plan-song/
│   ├── SKILL.md
│   ├── scripts/
│   │   └── expand_sds.mjs
│   └── templates/
├── style-generation/
│   ├── SKILL.md
│   ├── scripts/
│   │   └── sanitize_tags.mjs
│   └── blueprints/ -> symlink to /docs/hit_song_blueprint/AI/
├── lyrics-generation/
│   ├── SKILL.md
│   ├── scripts/
│   │   └── validate_rhyme.mjs
│   └── templates/
├── producer-notes/
│   ├── SKILL.md
│   └── scripts/
├── prompt-composition/
│   ├── SKILL.md
│   └── scripts/
│       └── merge_artifacts.mjs
├── validation/
│   ├── SKILL.md
│   └── scripts/
│       └── score_rubric.mjs
└── auto-fix/
    ├── SKILL.md
    └── scripts/
        └── apply_fixes.mjs
```

#### 2. PLAN skill (`.claude/skills/plan-song/SKILL.md`):
````yaml
---
name: plan-song
description: "Expand Song Design Spec into ordered workflow targets. Analyzes SDS, determines section order, sets objectives for each workflow node. Use when starting a new song workflow from SDS JSON."
---

# Plan Song Workflow

## Input Contract
- SDS JSON (validated against schema)
- Global seed
- Feature flags

## Process
1. Validate SDS structure
2. Determine section order from genre blueprint
3. Calculate derived seeds (seed + node_index)
4. Set objectives for each node
5. Emit planning manifest

## Output Contract
```json
{
  "run_id": "uuid",
  "sections": ["intro", "verse1", "chorus", "verse2", "chorus", "bridge", "chorus", "outro"],
  "node_seeds": {
    "STYLE": 12345,
    "LYRICS": 12346,
    "PRODUCER": 12347,
    "COMPOSE": 12348
  },
  "objectives": {
    "STYLE": "Generate pop style with 120-130 BPM, uplifting mood",
    "LYRICS": "Write 3 verses, 1 chorus, 1 bridge with AABB rhyme",
    "PRODUCER": "Arrange for radio-friendly 3:30 runtime",
    "COMPOSE": "Merge to Suno format <500 chars"
  }
}
```

## Determinism
- Use fixed section order from blueprint
- Derived seeds = global_seed + node_index
- No external calls
````

#### 3. STYLE skill (`.claude/skills/style-generation/SKILL.md`):
````yaml
---
name: style-generation
description: "Generate style specification from SDS + blueprint. Emits genre, BPM, key, mood, instrumentation, tags. Validates tag conflicts using conflict matrix. Use when creating style artifact for song composition."
---

# Style Generation

## Input Contract
- SDS with style preferences
- Genre blueprint
- Node seed

## Process
1. Load genre blueprint
2. Select genre/sub-genre
3. Determine BPM within blueprint range
4. Select mood/energy from allowed list
5. Choose instrumentation
6. Generate positive tags (max 8)
7. Generate negative tags (max 5)
8. Validate no tag conflicts
9. Emit style artifact

## Tag Conflict Validation
```javascript
// scripts/sanitize_tags.mjs
import { conflictMatrix } from '/taxonomies/tag_conflicts.json'

function validateTags(tags) {
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      if (conflictMatrix[tags[i]]?.includes(tags[j])) {
        throw new Error(`Conflicting tags: ${tags[i]} vs ${tags[j]}`)
      }
    }
  }
}
```

## Output Contract
```json
{
  "artifact_type": "style",
  "artifact_hash": "sha256:...",
  "genre": "pop",
  "sub_genres": ["synth-pop"],
  "bpm": 125,
  "key": "C major",
  "mood": ["uplifting", "energetic"],
  "energy": 8,
  "instrumentation": ["synth", "drums", "bass", "vocals"],
  "vocal_profile": {"range": "tenor", "delivery": "clean"},
  "tags_positive": ["anthemic", "radio-friendly", "hook-driven"],
  "tags_negative": ["ballad", "acoustic"]
}
```
````

#### 4. VALIDATION skill (`.claude/skills/validation/SKILL.md`):
```yaml
---
name: validation
description: "Score composed prompt against genre rubric. Checks hook density, singability, rhyme tightness, section completeness, profanity. Returns pass/fail + scores. Use after COMPOSE to validate artifacts."
---

# Validation & Rubric Scoring

## Input Contract
- Composed prompt
- Style artifact
- Lyrics artifact
- Genre blueprint
- Rubric thresholds

## Scoring Metrics
1. **hook_density** (0-100): Repetition of chorus/hook phrases
2. **singability** (0-100): Syllable stress, natural phrasing
3. **rhyme_tightness** (0-100): Adherence to rhyme scheme
4. **section_completeness** (0-100): All required sections present
5. **profanity_score** (0-100): Compliance with explicit flag

## Hard Fail Conditions
- Character count > model limit
- Missing required sections
- Profanity when explicit=false
- Conflicting tags detected
- "style of <living artist>" in public mode

## Output Contract
```json
{
  "validation_result": "pass" | "fail",
  "scores": {
    "hook_density": 85,
    "singability": 90,
    "rhyme_tightness": 75,
    "section_completeness": 100,
    "profanity_score": 100,
    "total": 87
  },
  "threshold": 80,
  "issues": [
    {"severity": "warning", "message": "Hook density below 80"}
  ],
  "hard_fails": []
}
```
```

### Week 2: Orchestrator Implementation

#### 1. Create orchestrator service (`/services/api/app/services/workflow_orchestrator.py`):
```python
from typing import Dict, List, Callable
from ..models.song import WorkflowRun
from ..schemas.workflow import NodeOutput, WorkflowEvent

class WorkflowOrchestrator:
    """Graph runner for AMCS workflow."""

    NODES = ['PLAN', 'STYLE', 'LYRICS', 'PRODUCER', 'COMPOSE', 'VALIDATE', 'FIX', 'RENDER', 'REVIEW']
    MAX_FIX_ITERATIONS = 3

    def __init__(self, run_repo, event_publisher):
        self.run_repo = run_repo
        self.event_publisher = event_publisher
        self.skill_handlers: Dict[str, Callable] = {}

    async def execute_workflow(self, song_id: str, sds: dict) -> WorkflowRun:
        """Execute complete workflow graph."""
        run = await self.run_repo.create(WorkflowRun(
            song_id=song_id,
            status='running',
            current_node='PLAN'
        ))

        try:
            # Execute nodes sequentially
            plan_output = await self._execute_node('PLAN', sds, run)

            # Parallel execution where possible
            style_output, lyrics_output, producer_output = await asyncio.gather(
                self._execute_node('STYLE', plan_output, run),
                self._execute_node('LYRICS', plan_output, run),
                self._execute_node('PRODUCER', plan_output, run)
            )

            # Compose
            compose_output = await self._execute_node('COMPOSE', {
                'style': style_output,
                'lyrics': lyrics_output,
                'producer': producer_output
            }, run)

            # Validate with fix loop
            validation_output = await self._validate_with_fixes(
                compose_output, run
            )

            # Render (if enabled)
            if sds.get('feature_flags', {}).get('render.enabled'):
                await self._execute_node('RENDER', validation_output, run)

            # Review
            await self._execute_node('REVIEW', validation_output, run)

            run.status = 'completed'
            await self.run_repo.update(run)

            return run

        except Exception as e:
            run.status = 'failed'
            await self.run_repo.update(run)
            raise

    async def _validate_with_fixes(self, compose_output: dict, run: WorkflowRun) -> dict:
        """Validate with up to 3 fix iterations."""
        current_output = compose_output

        for iteration in range(self.MAX_FIX_ITERATIONS):
            validation = await self._execute_node('VALIDATE', current_output, run)

            if validation['validation_result'] == 'pass':
                return validation

            # Apply fixes
            fix_output = await self._execute_node('FIX', {
                'compose': current_output,
                'validation': validation,
                'iteration': iteration
            }, run)

            # Re-compose
            current_output = await self._execute_node('COMPOSE', fix_output, run)

        # Max iterations reached
        if validation['validation_result'] == 'fail':
            raise ValidationError(f"Failed validation after {self.MAX_FIX_ITERATIONS} iterations")

        return validation

    async def _execute_node(self, node: str, input_data: dict, run: WorkflowRun) -> dict:
        """Execute single workflow node."""
        # Emit start event
        await self.event_publisher.publish(WorkflowEvent(
            run_id=run.run_id,
            node=node,
            phase='start',
            timestamp=datetime.utcnow()
        ))

        start_time = time.time()

        # Execute skill handler
        handler = self.skill_handlers.get(node)
        if not handler:
            raise ValueError(f"No handler for node: {node}")

        output = await handler(input_data)

        duration_ms = int((time.time() - start_time) * 1000)

        # Store node output
        run.node_outputs[node] = output
        await self.run_repo.update(run)

        # Emit end event
        await self.event_publisher.publish(WorkflowEvent(
            run_id=run.run_id,
            node=node,
            phase='end',
            duration_ms=duration_ms,
            metrics=output.get('metrics', {})
        ))

        return output
```

#### 2. Create event publisher (`/services/api/app/services/event_publisher.py`):
```python
from fastapi import WebSocket
from typing import List
import json

class EventPublisher:
    """WebSocket event publisher for workflow events."""

    def __init__(self):
        self.connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        self.connections.remove(websocket)

    async def publish(self, event: WorkflowEvent):
        """Publish event to all connected clients."""
        message = json.dumps(event.dict())

        for connection in self.connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Connection closed
                pass
```

### Week 3: API Endpoints

#### 1. Create workflow endpoints (`/services/api/app/api/v1/workflows.py`):
```python
from fastapi import APIRouter, Depends, WebSocket
from ...services.workflow_orchestrator import WorkflowOrchestrator
from ...schemas.sds import SDS

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.post("/runs")
async def create_workflow_run(
    sds: SDS,
    orchestrator: WorkflowOrchestrator = Depends()
):
    """Start a new workflow run from SDS."""
    run = await orchestrator.execute_workflow(
        song_id=sds.song_id,
        sds=sds.dict()
    )
    return {"run_id": str(run.run_id), "status": run.status}

@router.get("/runs/{run_id}")
async def get_workflow_run(run_id: str):
    """Get workflow run status and outputs."""
    # Implementation

@router.websocket("/events")
async def workflow_events(websocket: WebSocket):
    """WebSocket endpoint for workflow events."""
    await event_publisher.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        await event_publisher.disconnect(websocket)
```

## Agent Assignments

- **Skills**: skill-builder, python-backend-engineer
- **Orchestrator**: python-backend-engineer
- **Events**: python-backend-engineer
- **Review**: code-reviewer, senior-code-reviewer

## Deliverables

- Claude Code skills for all workflow nodes
- Workflow orchestrator with graph execution
- Event publishing system
- WebSocket API for real-time events
- Validation and auto-fix logic
- Integration tests for complete workflow

## Success Criteria

- [x] All skills created and functional
- [x] Orchestrator executes complete workflow
- [x] Events stream to WebSocket clients
- [x] Validation with fix loop works
- [x] End-to-end test passes
- [x] Determinism verified (same seed → same output)

## Workflow Node Skills

### PLAN Node
- **Input**: SDS JSON
- **Output**: Ordered sections, node seeds, objectives
- **Determinism**: Fixed section order from blueprint

### STYLE Node
- **Input**: SDS style preferences, blueprint
- **Output**: Genre, BPM, key, mood, instrumentation, tags
- **Validation**: Tag conflict checking

### LYRICS Node
- **Input**: SDS constraints, style artifact
- **Output**: Sections with lines, rhyme scheme, citations
- **Validation**: Profanity, reading level

### PRODUCER Node
- **Input**: Style + lyrics artifacts
- **Output**: Structure, hook count, section tags, mix targets
- **Validation**: Duration constraints

### COMPOSE Node
- **Input**: All artifacts (style, lyrics, producer)
- **Output**: Render-ready prompt with section tags
- **Validation**: Character count < engine limit

### VALIDATE Node
- **Input**: Composed prompt, artifacts, blueprint
- **Output**: Pass/fail, scores, issues
- **Checks**: Hook density, singability, rhyme, completeness

### FIX Node (Auto-Fix Loop)
- **Input**: Validation issues, current artifacts
- **Output**: Updated artifacts (targeted changes only)
- **Max Iterations**: 3

### RENDER Node (Optional)
- **Input**: Validated prompt, render config
- **Output**: Job ID, polling status
- **Feature Flag**: `render.enabled`

### REVIEW Node
- **Input**: All artifacts, scores, events
- **Output**: Final summary JSON, persisted artifacts
- **Actions**: Store artifacts, emit completion event

## Testing Strategy

### Unit Tests
- Each skill in isolation with fixed inputs
- Determinism: Same input → same output
- Error handling: Invalid inputs, timeouts

### Integration Tests
- Full workflow execution
- Parallel node execution (STYLE + LYRICS + PRODUCER)
- Fix loop with multiple iterations
- Event stream validation

### End-to-End Tests
- SDS → Validated Prompt
- Multiple genre blueprints
- Feature flag variations
- Failure scenarios and recovery

## Key Files Created

### Skills
- `.claude/skills/plan-song/SKILL.md`
- `.claude/skills/style-generation/SKILL.md`
- `.claude/skills/lyrics-generation/SKILL.md`
- `.claude/skills/producer-notes/SKILL.md`
- `.claude/skills/prompt-composition/SKILL.md`
- `.claude/skills/validation/SKILL.md`
- `.claude/skills/auto-fix/SKILL.md`

### Services
- `/services/api/app/services/workflow_orchestrator.py`
- `/services/api/app/services/event_publisher.py`

### API
- `/services/api/app/api/v1/workflows.py`

### Schemas
- `/services/api/app/schemas/workflow.py` (NodeOutput, WorkflowEvent)

---

**Previous Phase**: [Phase 3: Domain Model Migration](./phase-3-domain-model-migration.md)
**Next Phase**: [Phase 5: UI Adaptation](./phase-5-ui-adaptation.md)
**Return to**: [Bootstrap Plan Overview](../bootstrap-from-meatyprompts.md)
