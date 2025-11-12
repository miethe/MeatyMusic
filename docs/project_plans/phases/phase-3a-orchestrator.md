# Phase 3a: Workflow Orchestrator Foundation

**Duration**: 1.5 weeks (of 3-4 week Phase 3)
**Status**: Not Started
**Dependencies**: Phase 0 (Foundation), Phase 1 (Entity Services), Phase 2 (Aggregation)
**Critical Path**: Yes — This is the "brain" of AMCS

## Phase Overview

### Mission

Build the workflow orchestrator that executes the PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → RENDER → REVIEW graph with:
- Deterministic execution (same SDS + seed → identical outputs)
- Event streaming (WebSocket `/events`)
- Retry logic and cancellation
- State persistence and artifact storage
- Seed propagation across all nodes

### Goals

1. **DAG Runner**: Execute workflow graph respecting dependencies
2. **Determinism Engine**: Propagate seeds, ensure reproducible outputs
3. **Event System**: Emit structured events for observability
4. **State Manager**: Track run status, node progress, artifacts
5. **Retry/Cancel Logic**: Handle failures gracefully

### Why Most Complex Phase

Phase 3 is the **most complex** because:
- **AI Generation**: 9 skills involve LLM calls with determinism requirements
- **MCP Retrieval**: LYRICS skill requires pinned, hash-based retrieval
- **Validation Loop**: FIX → COMPOSE → VALIDATE cycle (max 3 iterations)
- **Cross-Phase Integration**: Consumes all Phase 1 entities, Phase 2 SDS/composition
- **Observability**: Real-time event streaming for frontend monitoring

### Dependencies

**From Phase 0**:
- Database: `workflow_runs`, `workflow_artifacts`, `workflow_events` tables
- Redis: Pub/sub channels for event streaming
- S3: Artifact storage in `runs/{song_id}/{run_id}/`

**From Phase 1**:
- Entity CRUD services: personas, blueprints, styles, lyrics, producer_notes, sources

**From Phase 2**:
- SDS compilation and validation
- Prompt composition service

### Success Criteria

- [ ] DAG executes PLAN → REVIEW without manual intervention
- [ ] Determinism: 10 runs with same SDS+seed produce identical artifacts (≥99% match)
- [ ] Event stream delivers all node events via WebSocket
- [ ] State manager persists node outputs and scores
- [ ] Retry logic handles transient failures (max 3 attempts)
- [ ] Cancellation stops workflow mid-execution

---

## Work Package 1: DAG Runner Core

**Agents**: `python-backend-engineer`, `backend-typescript-architect`
**Duration**: 1 week
**PRD Reference**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`

### Overview

The DAG (Directed Acyclic Graph) runner orchestrates workflow execution. It:
- Parses run manifest (defines node order and dependencies)
- Executes nodes in topological order
- Passes outputs between nodes
- Handles failures with retries
- Emits events on state transitions

### Implementation Details

#### File Structure

```
backend/orchestration/
├── dag_runner.py              # Core DAG execution engine
├── node_executor.py           # Node execution wrapper
├── dependency_resolver.py     # Topological sort + parallelism
├── seed_propagator.py         # Seed generation per node
├── event_emitter.py           # Event publishing to Redis
├── state_manager.py           # Run state persistence
└── tests/
    ├── test_dag_execution.py
    ├── test_dependency_resolution.py
    ├── test_seed_propagation.py
    └── test_event_emission.py

backend/routes/
├── workflow_routes.py         # FastAPI endpoints
```

#### DAG Runner Algorithm

**File**: `backend/orchestration/dag_runner.py`

```python
from typing import Dict, List, Optional
from datetime import datetime
import asyncio
from uuid import uuid4

class DAGRunner:
    """
    Orchestrates workflow execution based on run manifest.

    The manifest defines:
    - Nodes to execute
    - Dependencies between nodes
    - Retry policies
    - Feature flags (e.g., render.enabled)

    Example manifest:
    {
      "song_id": "uuid",
      "seed": 42,
      "graph": [
        {"id": "PLAN"},
        {"id": "STYLE", "inputs": ["PLAN"]},
        {"id": "LYRICS", "inputs": ["PLAN"]},
        {"id": "PRODUCER", "inputs": ["PLAN"]},
        {"id": "COMPOSE", "inputs": ["STYLE", "LYRICS", "PRODUCER"]},
        {"id": "VALIDATE"},
        {"id": "FIX", "on": "fail", "max_retries": 3},
        {"id": "RENDER", "cond": "pass && flags.render"},
        {"id": "REVIEW"}
      ],
      "flags": {"render": true}
    }
    """

    def __init__(
        self,
        db_session,
        event_emitter,
        state_manager,
        node_executor,
        dependency_resolver,
        seed_propagator
    ):
        self.db = db_session
        self.events = event_emitter
        self.state = state_manager
        self.executor = node_executor
        self.resolver = dependency_resolver
        self.seeds = seed_propagator

    async def run(self, run_id: str, sds: dict, manifest: dict) -> dict:
        """
        Execute workflow graph.

        Args:
            run_id: Unique run identifier
            sds: Song Design Spec
            manifest: Run manifest defining graph

        Returns:
            {
              "run_id": str,
              "status": "completed|failed|cancelled",
              "artifacts": {node_name: output_dict},
              "scores": {metric: value},
              "events": [event],
              "duration_ms": int
            }
        """
        start_time = datetime.utcnow()

        # Initialize run state
        await self.state.create_run(
            run_id=run_id,
            song_id=sds["song_id"],
            sds_hash=sds["hash"],
            manifest=manifest,
            status="running"
        )

        # Emit run.start event
        await self.events.emit({
            "ts": start_time.isoformat(),
            "run_id": run_id,
            "event": "run.start",
            "song_id": sds["song_id"],
            "seed": manifest["seed"]
        })

        try:
            # Resolve execution order (topological sort)
            execution_order = self.resolver.resolve_dependencies(manifest["graph"])

            # Execute nodes in order
            artifacts = {}
            for batch in execution_order:
                # Nodes in same batch can run in parallel
                batch_results = await asyncio.gather(*[
                    self._execute_node(
                        run_id=run_id,
                        node_id=node["id"],
                        node_config=node,
                        sds=sds,
                        artifacts=artifacts,
                        manifest=manifest
                    )
                    for node in batch
                ])

                # Collect batch results
                for node_id, output in batch_results:
                    artifacts[node_id] = output

                # Check for cancellation
                if await self.state.is_cancelled(run_id):
                    await self._handle_cancellation(run_id)
                    return await self.state.get_run_result(run_id)

            # Mark run complete
            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)

            await self.state.complete_run(
                run_id=run_id,
                status="completed",
                artifacts=artifacts,
                duration_ms=duration_ms
            )

            # Emit run.end event
            await self.events.emit({
                "ts": end_time.isoformat(),
                "run_id": run_id,
                "event": "run.end",
                "status": "completed",
                "duration_ms": duration_ms
            })

            return await self.state.get_run_result(run_id)

        except Exception as e:
            # Handle run failure
            await self._handle_failure(run_id, str(e))
            raise

    async def _execute_node(
        self,
        run_id: str,
        node_id: str,
        node_config: dict,
        sds: dict,
        artifacts: dict,
        manifest: dict
    ) -> tuple:
        """
        Execute single workflow node with retries.

        Args:
            run_id: Run identifier
            node_id: Node name (e.g., "PLAN", "STYLE")
            node_config: Node configuration from manifest
            sds: Song Design Spec
            artifacts: Previously generated artifacts
            manifest: Full run manifest

        Returns:
            (node_id, output_dict)
        """
        max_retries = node_config.get("max_retries", 3)
        retry_count = 0

        while retry_count <= max_retries:
            try:
                # Emit node.start event
                node_start = datetime.utcnow()
                await self.events.emit({
                    "ts": node_start.isoformat(),
                    "run_id": run_id,
                    "node": node_id,
                    "phase": "start",
                    "retry": retry_count
                })

                # Generate node seed
                node_seed = self.seeds.get_node_seed(
                    base_seed=manifest["seed"],
                    node_id=node_id
                )

                # Prepare node inputs
                inputs = self._prepare_node_inputs(
                    node_id=node_id,
                    node_config=node_config,
                    sds=sds,
                    artifacts=artifacts
                )

                # Execute node
                output = await self.executor.execute(
                    node_id=node_id,
                    inputs=inputs,
                    seed=node_seed,
                    run_id=run_id
                )

                # Store artifact
                await self.state.store_artifact(
                    run_id=run_id,
                    node_id=node_id,
                    artifact=output
                )

                # Emit node.end event
                node_end = datetime.utcnow()
                duration_ms = int((node_end - node_start).total_seconds() * 1000)

                await self.events.emit({
                    "ts": node_end.isoformat(),
                    "run_id": run_id,
                    "node": node_id,
                    "phase": "end",
                    "duration_ms": duration_ms,
                    "metrics": output.get("metrics", {})
                })

                return (node_id, output)

            except Exception as e:
                retry_count += 1
                if retry_count > max_retries:
                    # Emit node.fail event
                    await self.events.emit({
                        "ts": datetime.utcnow().isoformat(),
                        "run_id": run_id,
                        "node": node_id,
                        "phase": "fail",
                        "error": str(e),
                        "retry_count": retry_count
                    })
                    raise

                # Exponential backoff
                await asyncio.sleep(2 ** retry_count)

    def _prepare_node_inputs(
        self,
        node_id: str,
        node_config: dict,
        sds: dict,
        artifacts: dict
    ) -> dict:
        """
        Prepare inputs for node execution.

        Args:
            node_id: Node name
            node_config: Node configuration
            sds: Song Design Spec
            artifacts: Previously generated artifacts

        Returns:
            Input dict for node executor
        """
        inputs = {"sds": sds}

        # Add inputs from previous nodes
        for input_node in node_config.get("inputs", []):
            if input_node not in artifacts:
                raise ValueError(f"Missing input artifact: {input_node}")
            inputs[input_node.lower()] = artifacts[input_node]

        return inputs

    async def _handle_cancellation(self, run_id: str):
        """Handle workflow cancellation."""
        await self.state.update_run(run_id, status="cancelled")
        await self.events.emit({
            "ts": datetime.utcnow().isoformat(),
            "run_id": run_id,
            "event": "run.cancelled"
        })

    async def _handle_failure(self, run_id: str, error: str):
        """Handle workflow failure."""
        await self.state.update_run(run_id, status="failed", error=error)
        await self.events.emit({
            "ts": datetime.utcnow().isoformat(),
            "run_id": run_id,
            "event": "run.failed",
            "error": error
        })
```

#### Dependency Resolver

**File**: `backend/orchestration/dependency_resolver.py`

```python
from typing import List, Dict, Set
from collections import defaultdict, deque

class DependencyResolver:
    """
    Resolves node execution order using topological sort.
    Groups independent nodes into batches for parallel execution.
    """

    def resolve_dependencies(self, graph: List[dict]) -> List[List[dict]]:
        """
        Compute execution order with parallelism.

        Args:
            graph: [{"id": str, "inputs": [str]}]

        Returns:
            [[batch_1_nodes], [batch_2_nodes], ...]

        Example:
            Input:
              [
                {"id": "PLAN"},
                {"id": "STYLE", "inputs": ["PLAN"]},
                {"id": "LYRICS", "inputs": ["PLAN"]},
                {"id": "PRODUCER", "inputs": ["PLAN"]},
                {"id": "COMPOSE", "inputs": ["STYLE", "LYRICS", "PRODUCER"]}
              ]

            Output:
              [
                [{"id": "PLAN"}],
                [{"id": "STYLE"}, {"id": "LYRICS"}, {"id": "PRODUCER"}],
                [{"id": "COMPOSE"}]
              ]

        Algorithm (Kahn's topological sort with batching):
            1. Build dependency graph: node → dependencies
            2. Build reverse graph: node → dependents
            3. Find nodes with no dependencies (batch 0)
            4. For each batch:
               a. Remove batch nodes from graph
               b. Find new nodes with no dependencies (next batch)
            5. Repeat until all nodes processed
        """
        # Build dependency map
        deps = {}
        for node in graph:
            deps[node["id"]] = set(node.get("inputs", []))

        # Build reverse dependency map (who depends on me)
        dependents = defaultdict(set)
        for node in graph:
            for dep in node.get("inputs", []):
                dependents[dep].add(node["id"])

        # Find initial batch (no dependencies)
        batches = []
        current_batch = [node for node in graph if not deps[node["id"]]]
        batches.append(current_batch)

        # Process batches
        processed = set(node["id"] for node in current_batch)

        while len(processed) < len(graph):
            next_batch = []

            for node_id in list(dependents.keys()):
                # Check if all dependencies processed
                node_deps = deps[node_id]
                if node_deps <= processed and node_id not in processed:
                    # Find node object
                    node_obj = next(n for n in graph if n["id"] == node_id)
                    next_batch.append(node_obj)
                    processed.add(node_id)

            if not next_batch:
                # Cycle detected or missing dependencies
                remaining = set(n["id"] for n in graph) - processed
                raise ValueError(f"Circular dependency or missing inputs: {remaining}")

            batches.append(next_batch)

        return batches

    def validate_graph(self, graph: List[dict]) -> bool:
        """
        Validate graph has no cycles and all inputs exist.

        Returns:
            True if valid

        Raises:
            ValueError if invalid
        """
        node_ids = {node["id"] for node in graph}

        for node in graph:
            # Check all inputs exist
            for input_node in node.get("inputs", []):
                if input_node not in node_ids:
                    raise ValueError(
                        f"Node {node['id']} depends on non-existent node {input_node}"
                    )

        # Check for cycles (topological sort will fail)
        try:
            self.resolve_dependencies(graph)
            return True
        except ValueError as e:
            raise ValueError(f"Graph validation failed: {e}")
```

#### Seed Propagation

**File**: `backend/orchestration/seed_propagator.py`

```python
import hashlib

class SeedPropagator:
    """
    Generate deterministic seeds for each workflow node.

    Strategy:
        - Base seed comes from SDS
        - Each node gets: hash(base_seed + node_id)
        - Ensures different nodes have different seeds
        - Same node in different runs gets same seed if base_seed matches
    """

    def __init__(self):
        # Node ID to index mapping (for deterministic ordering)
        self.node_indices = {
            "PLAN": 0,
            "STYLE": 1,
            "LYRICS": 2,
            "PRODUCER": 3,
            "COMPOSE": 4,
            "VALIDATE": 5,
            "FIX": 6,
            "RENDER": 7,
            "REVIEW": 8
        }

    def get_node_seed(self, base_seed: int, node_id: str) -> int:
        """
        Generate deterministic seed for node.

        Args:
            base_seed: Run-level seed from SDS
            node_id: Node identifier (e.g., "PLAN", "STYLE")

        Returns:
            Node-specific seed (32-bit integer)

        Algorithm:
            seed = hash(base_seed + node_index) % 2^31

        Example:
            base_seed = 42, node_id = "STYLE"
            node_index = 1
            seed = hash("42_1") % 2147483648
        """
        if node_id not in self.node_indices:
            raise ValueError(f"Unknown node: {node_id}")

        node_index = self.node_indices[node_id]
        seed_string = f"{base_seed}_{node_index}"

        # Hash to get deterministic value
        hash_bytes = hashlib.sha256(seed_string.encode()).digest()
        seed = int.from_bytes(hash_bytes[:4], byteorder="big")

        # Keep in 32-bit range
        return seed % (2 ** 31)

    def get_retry_seed(self, base_seed: int, node_id: str, retry_count: int) -> int:
        """
        Generate seed for node retry.

        Args:
            base_seed: Run-level seed
            node_id: Node identifier
            retry_count: Retry attempt number (1, 2, 3, ...)

        Returns:
            Retry-specific seed

        Note:
            Different from initial seed to avoid repeating same failure
        """
        node_index = self.node_indices[node_id]
        seed_string = f"{base_seed}_{node_index}_retry{retry_count}"

        hash_bytes = hashlib.sha256(seed_string.encode()).digest()
        seed = int.from_bytes(hash_bytes[:4], byteorder="big")

        return seed % (2 ** 31)
```

#### Event Emitter

**File**: `backend/orchestration/event_emitter.py`

```python
import json
from typing import Dict
import redis.asyncio as redis

class EventEmitter:
    """
    Emit workflow events to Redis pub/sub for WebSocket streaming.

    Event structure:
    {
      "ts": "2025-11-11T13:00:00Z",
      "run_id": "uuid",
      "event": "run.start|run.end|run.failed|run.cancelled",
      "node": "PLAN|STYLE|...",
      "phase": "start|end|fail",
      "duration_ms": 1234,
      "metrics": {...},
      "issues": [...]
    }
    """

    def __init__(self, redis_client: redis.Redis, channel: str = "workflow_events"):
        self.redis = redis_client
        self.channel = channel

    async def emit(self, event: Dict):
        """
        Publish event to Redis channel.

        Args:
            event: Event dictionary (will be serialized to JSON)
        """
        # Serialize event
        event_json = json.dumps(event, default=str)

        # Publish to Redis
        await self.redis.publish(self.channel, event_json)

        # Also store in event log (for replay)
        await self._store_event(event)

    async def _store_event(self, event: Dict):
        """
        Store event in database for historical queries.

        Table: workflow_events
        Columns: id, run_id, ts, event_type, node, phase, data
        """
        # (Database insert logic here)
        pass

    async def subscribe(self, callback):
        """
        Subscribe to event stream.

        Args:
            callback: Async function to call on each event
        """
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(self.channel)

        async for message in pubsub.listen():
            if message["type"] == "message":
                event = json.loads(message["data"])
                await callback(event)
```

#### State Manager

**File**: `backend/orchestration/state_manager.py`

```python
from typing import Dict, Optional
from datetime import datetime
import json

class StateManager:
    """
    Manage workflow run state in database.

    Tables:
      - workflow_runs: Run metadata, status, scores
      - workflow_artifacts: Per-node outputs
      - workflow_events: Event log
    """

    def __init__(self, db_session, s3_client):
        self.db = db_session
        self.s3 = s3_client

    async def create_run(
        self,
        run_id: str,
        song_id: str,
        sds_hash: str,
        manifest: dict,
        status: str
    ):
        """Create new workflow run."""
        await self.db.execute(
            """
            INSERT INTO workflow_runs (id, song_id, sds_hash, manifest, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            run_id, song_id, sds_hash, json.dumps(manifest), status, datetime.utcnow()
        )

    async def update_run(self, run_id: str, **fields):
        """Update run fields."""
        set_clauses = []
        values = []
        for i, (key, value) in enumerate(fields.items(), start=1):
            set_clauses.append(f"{key} = ${i}")
            values.append(value)

        values.append(run_id)
        query = f"UPDATE workflow_runs SET {', '.join(set_clauses)} WHERE id = ${len(values)}"
        await self.db.execute(query, *values)

    async def complete_run(
        self,
        run_id: str,
        status: str,
        artifacts: dict,
        duration_ms: int
    ):
        """Mark run as complete and store final artifacts."""
        # Store artifacts in S3
        s3_key = f"runs/{run_id}/artifacts.json"
        await self.s3.put_object(
            Key=s3_key,
            Body=json.dumps(artifacts),
            ContentType="application/json"
        )

        # Update run record
        await self.update_run(
            run_id=run_id,
            status=status,
            artifacts_uri=s3_key,
            duration_ms=duration_ms,
            completed_at=datetime.utcnow()
        )

    async def store_artifact(self, run_id: str, node_id: str, artifact: dict):
        """Store individual node artifact."""
        await self.db.execute(
            """
            INSERT INTO workflow_artifacts (run_id, node_id, artifact, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            run_id, node_id, json.dumps(artifact), datetime.utcnow()
        )

        # Also store in S3 for durability
        s3_key = f"runs/{run_id}/nodes/{node_id}.json"
        await self.s3.put_object(
            Key=s3_key,
            Body=json.dumps(artifact),
            ContentType="application/json"
        )

    async def get_run_result(self, run_id: str) -> dict:
        """Get complete run result."""
        run = await self.db.fetchrow(
            "SELECT * FROM workflow_runs WHERE id = $1",
            run_id
        )

        if not run:
            raise ValueError(f"Run {run_id} not found")

        # Load artifacts from S3
        if run["artifacts_uri"]:
            artifacts = await self._load_s3_artifact(run["artifacts_uri"])
        else:
            artifacts = {}

        return {
            "run_id": run["id"],
            "status": run["status"],
            "artifacts": artifacts,
            "scores": run.get("scores", {}),
            "duration_ms": run.get("duration_ms"),
            "created_at": run["created_at"].isoformat(),
            "completed_at": run["completed_at"].isoformat() if run["completed_at"] else None
        }

    async def is_cancelled(self, run_id: str) -> bool:
        """Check if run has been cancelled."""
        result = await self.db.fetchval(
            "SELECT status FROM workflow_runs WHERE id = $1",
            run_id
        )
        return result == "cancelled"

    async def _load_s3_artifact(self, s3_key: str) -> dict:
        """Load artifact from S3."""
        obj = await self.s3.get_object(Key=s3_key)
        body = await obj["Body"].read()
        return json.loads(body)
```

### Database Schema

**File**: `migrations/versions/008_workflow_orchestration.py`

```python
"""
Workflow orchestration tables.

Tables:
  - workflow_runs: Run metadata and status
  - workflow_artifacts: Per-node outputs
  - workflow_events: Event log
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

def upgrade():
    # workflow_runs table
    op.create_table(
        'workflow_runs',
        sa.Column('id', UUID, primary_key=True),
        sa.Column('song_id', sa.String, nullable=False),
        sa.Column('sds_hash', sa.String(64), nullable=False),
        sa.Column('manifest', JSONB, nullable=False),
        sa.Column('status', sa.String, nullable=False),  # running, completed, failed, cancelled
        sa.Column('artifacts_uri', sa.String, nullable=True),  # S3 key
        sa.Column('scores', JSONB, nullable=True),
        sa.Column('error', sa.Text, nullable=True),
        sa.Column('duration_ms', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('completed_at', sa.DateTime, nullable=True)
    )

    op.create_index('idx_workflow_runs_song_id', 'workflow_runs', ['song_id'])
    op.create_index('idx_workflow_runs_status', 'workflow_runs', ['status'])
    op.create_index('idx_workflow_runs_sds_hash', 'workflow_runs', ['sds_hash'])

    # workflow_artifacts table
    op.create_table(
        'workflow_artifacts',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('run_id', UUID, nullable=False),
        sa.Column('node_id', sa.String, nullable=False),
        sa.Column('artifact', JSONB, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.ForeignKeyConstraint(['run_id'], ['workflow_runs.id'], ondelete='CASCADE')
    )

    op.create_index('idx_workflow_artifacts_run_id', 'workflow_artifacts', ['run_id'])

    # workflow_events table
    op.create_table(
        'workflow_events',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('run_id', UUID, nullable=False),
        sa.Column('ts', sa.DateTime, nullable=False),
        sa.Column('event_type', sa.String, nullable=False),  # run.start, node.start, etc.
        sa.Column('node', sa.String, nullable=True),
        sa.Column('phase', sa.String, nullable=True),  # start, end, fail
        sa.Column('data', JSONB, nullable=True),
        sa.ForeignKeyConstraint(['run_id'], ['workflow_runs.id'], ondelete='CASCADE')
    )

    op.create_index('idx_workflow_events_run_id', 'workflow_events', ['run_id'])
    op.create_index('idx_workflow_events_ts', 'workflow_events', ['ts'])

def downgrade():
    op.drop_table('workflow_events')
    op.drop_table('workflow_artifacts')
    op.drop_table('workflow_runs')
```

### FastAPI Endpoints

**File**: `backend/routes/workflow_routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from typing import Optional
from uuid import uuid4, UUID

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.post("/runs", status_code=201)
async def create_run(
    song_id: str,
    sds_id: UUID,
    manifest: dict,
    seed: Optional[int] = None,
    dag_runner: DAGRunner = Depends(get_dag_runner),
    sds_service = Depends(get_sds_service)
):
    """
    Create and start new workflow run.

    Args:
        song_id: Song identifier
        sds_id: SDS UUID
        manifest: Run manifest (graph definition)
        seed: Override seed (optional)

    Returns:
        {run_id, status, created_at}
    """
    # Load SDS
    sds = await sds_service.get_sds(sds_id)
    if not sds:
        raise HTTPException(status_code=404, detail="SDS not found")

    # Override seed if provided
    if seed is not None:
        sds["seed"] = seed

    # Generate run ID
    run_id = str(uuid4())

    # Start run (async background task)
    asyncio.create_task(dag_runner.run(run_id, sds, manifest))

    return {
        "run_id": run_id,
        "status": "running",
        "created_at": datetime.utcnow().isoformat()
    }

@router.get("/runs/{run_id}")
async def get_run(
    run_id: UUID,
    state_manager: StateManager = Depends(get_state_manager)
):
    """Get run status and results."""
    try:
        result = await state_manager.get_run_result(str(run_id))
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/runs/{run_id}/cancel")
async def cancel_run(
    run_id: UUID,
    state_manager: StateManager = Depends(get_state_manager)
):
    """Cancel running workflow."""
    await state_manager.update_run(str(run_id), status="cancelled")
    return {"status": "cancelled"}

@router.websocket("/events")
async def event_stream(
    websocket: WebSocket,
    event_emitter: EventEmitter = Depends(get_event_emitter)
):
    """
    WebSocket endpoint for real-time event streaming.

    Client receives:
    {
      "ts": "2025-11-11T13:00:00Z",
      "run_id": "uuid",
      "event": "node.start",
      "node": "STYLE",
      "phase": "start"
    }
    """
    await websocket.accept()

    async def send_event(event: dict):
        await websocket.send_json(event)

    # Subscribe to events
    await event_emitter.subscribe(send_event)
```

---

## Work Package 2: Determinism Engine

**Agents**: `python-backend-engineer`, `data-layer-expert`
**Duration**: 0.5 weeks
**PRD Reference**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`

### Overview

Ensure deterministic execution across all workflow nodes:
- Low-variance LLM sampling (temperature ≤ 0.3)
- Seed propagation to all random operations
- Deterministic retrieval (hash-based pinning)
- Reproducible sorting and tie-breaking

### Implementation Details

#### Determinism Checklist

**File**: `backend/orchestration/determinism.py`

```python
from typing import Dict, Any

class DeterminismEnforcer:
    """
    Enforce determinism constraints across workflow.

    Requirements:
    - All LLM calls use temperature ≤ 0.3
    - All random operations seeded
    - All retrieval results sorted by hash (lexicographic tie-break)
    - All outputs JSON-serializable with sorted keys
    """

    @staticmethod
    def validate_llm_params(params: Dict[str, Any]):
        """
        Validate LLM generation parameters for determinism.

        Args:
            params: {temperature, top_p, seed, ...}

        Raises:
            ValueError if non-deterministic
        """
        if "temperature" not in params:
            raise ValueError("Missing temperature parameter")

        if params["temperature"] > 0.3:
            raise ValueError(
                f"Temperature {params['temperature']} exceeds limit 0.3 for determinism"
            )

        if "seed" not in params:
            raise ValueError("Missing seed parameter")

        # top_p should be deterministic
        if params.get("top_p", 1.0) < 0.9:
            # Low top_p can introduce more variance
            pass  # Log warning but allow

    @staticmethod
    def sort_results_deterministically(results: list, key: str = "hash") -> list:
        """
        Sort results with deterministic tie-breaking.

        Args:
            results: List of dicts with 'hash' or other key
            key: Sort key (default: 'hash')

        Returns:
            Sorted list (lexicographic on key, then by JSON serialization)
        """
        return sorted(
            results,
            key=lambda r: (r.get(key, ""), json.dumps(r, sort_keys=True))
        )

    @staticmethod
    def serialize_deterministically(obj: Any) -> str:
        """
        JSON serialize with sorted keys for deterministic hashing.

        Args:
            obj: Any JSON-serializable object

        Returns:
            JSON string with sorted keys
        """
        return json.dumps(obj, sort_keys=True, ensure_ascii=True)

    @staticmethod
    def compute_hash(data: str) -> str:
        """
        Compute SHA-256 hash of data.

        Args:
            data: String to hash

        Returns:
            Hex digest (64 chars)
        """
        return hashlib.sha256(data.encode()).hexdigest()
```

### Testing Determinism

**File**: `backend/orchestration/tests/test_determinism.py`

```python
import pytest

@pytest.mark.asyncio
async def test_reproducible_plan(dag_runner, test_sds):
    """Test PLAN node produces identical output across runs."""
    manifest = {
        "seed": 42,
        "graph": [{"id": "PLAN"}]
    }

    # Run 10 times
    results = []
    for _ in range(10):
        run_id = str(uuid4())
        result = await dag_runner.run(run_id, test_sds, manifest)
        results.append(result["artifacts"]["PLAN"])

    # All outputs should be identical
    first = results[0]
    for r in results[1:]:
        assert r == first, "PLAN outputs not deterministic"

@pytest.mark.asyncio
async def test_seed_propagation(seed_propagator):
    """Test node seeds are deterministic and unique."""
    base_seed = 42

    # Generate seeds for all nodes
    seeds = {}
    for node_id in ["PLAN", "STYLE", "LYRICS", "PRODUCER"]:
        seeds[node_id] = seed_propagator.get_node_seed(base_seed, node_id)

    # Seeds should be unique
    assert len(set(seeds.values())) == len(seeds), "Node seeds not unique"

    # Seeds should be reproducible
    for node_id in seeds:
        seed2 = seed_propagator.get_node_seed(base_seed, node_id)
        assert seeds[node_id] == seed2, f"{node_id} seed not reproducible"
```

---

## Work Package 3: WebSocket Event Streaming

**Agents**: `backend-typescript-architect`, `python-backend-engineer`
**Duration**: 0.5 weeks

### Overview

Implement WebSocket endpoint for real-time event streaming to frontend dashboard.

### Implementation

**File**: `backend/gateway/websocket.py`

```python
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

class WebSocketManager:
    """
    Manage WebSocket connections for event streaming.

    Features:
    - Multiple clients can subscribe to same run
    - Automatic reconnection support
    - Event filtering by run_id
    """

    def __init__(self):
        self.active_connections: dict = {}  # {run_id: [WebSocket]}

    async def connect(self, websocket: WebSocket, run_id: str = None):
        """Accept WebSocket connection."""
        await websocket.accept()

        if run_id:
            if run_id not in self.active_connections:
                self.active_connections[run_id] = []
            self.active_connections[run_id].append(websocket)

    def disconnect(self, websocket: WebSocket, run_id: str = None):
        """Remove WebSocket connection."""
        if run_id and run_id in self.active_connections:
            self.active_connections[run_id].remove(websocket)

    async def broadcast(self, run_id: str, event: dict):
        """Broadcast event to all connections for run."""
        if run_id not in self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections[run_id]:
            try:
                await connection.send_json(event)
            except:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.active_connections[run_id].remove(conn)
```

---

## Integration Points

### Orchestrator → Phase 2 (SDS/Composition)

```python
# In DAG runner, load SDS
sds = await sds_service.get_sds(sds_id)

# In COMPOSE node, call composition service
prompt = await prompt_composer.compose_prompt(
    sds=sds,
    style=artifacts["STYLE"],
    lyrics=artifacts["LYRICS"],
    producer_notes=artifacts["PRODUCER"]
)
```

### Orchestrator → Phase 1 (Entity Services)

```python
# In LYRICS node, fetch source entities
source_ids = sds["entities"]["sources"]
sources = await sources_service.get_many(source_ids)
```

### Orchestrator → Skills (Phase 3b)

```python
# Node executor delegates to skill implementations
output = await skills.execute(
    skill_name="amcs.lyrics.generate",
    inputs=inputs,
    seed=node_seed
)
```

---

## Testing Strategy

### Unit Tests

- [ ] DAG execution with linear graph
- [ ] DAG execution with parallel batches
- [ ] Dependency resolution (topological sort)
- [ ] Seed propagation uniqueness
- [ ] Event emission to Redis
- [ ] State persistence to database
- [ ] Retry logic with exponential backoff
- [ ] Cancellation handling

### Integration Tests

- [ ] Full workflow execution (PLAN → REVIEW)
- [ ] WebSocket event streaming
- [ ] Artifact storage to S3
- [ ] Database state consistency

### Determinism Tests

- [ ] 10 runs with same SDS + seed produce identical artifacts
- [ ] Node seed reproducibility
- [ ] Hash-based retrieval sorting

---

## Performance Targets

- [ ] **Latency**: P95 ≤ 60s for PLAN → COMPOSE (excluding RENDER)
- [ ] **Throughput**: Support 10 concurrent workflow runs
- [ ] **Event Latency**: WebSocket events delivered <500ms from emission
- [ ] **Retry Overhead**: Failed node retry adds <5s overhead

---

## Deliverables

- [ ] `backend/orchestration/dag_runner.py`
- [ ] `backend/orchestration/node_executor.py`
- [ ] `backend/orchestration/dependency_resolver.py`
- [ ] `backend/orchestration/seed_propagator.py`
- [ ] `backend/orchestration/event_emitter.py`
- [ ] `backend/orchestration/state_manager.py`
- [ ] `backend/routes/workflow_routes.py`
- [ ] `migrations/versions/008_workflow_orchestration.py`
- [ ] Test suite with >90% coverage
- [ ] API documentation (OpenAPI schema)

---

## Exit Criteria

- [ ] DAG runner executes full workflow without errors
- [ ] Determinism tests pass (≥99% reproducibility)
- [ ] Event stream delivers all events to WebSocket clients
- [ ] State manager persists all artifacts and scores
- [ ] Ready for Phase 3b (skill implementation)
- [ ] Ready for Phase 4 (frontend can monitor workflows via WebSocket)

---

## Next: Phase 3b

With orchestrator foundation complete, Phase 3b implements the 9 workflow skills:
- PLAN: Expand SDS into work targets
- STYLE: Generate style spec with conflict resolution
- LYRICS: Generate lyrics with MCP retrieval
- PRODUCER: Create producer notes
- COMPOSE: Assemble final prompt
- VALIDATE: Score against rubric
- FIX: Apply targeted repairs
- RENDER: Submit to engine (if enabled)
- REVIEW: Finalize artifacts and events

See `phase-3b-skills.md` for detailed skill specifications.
