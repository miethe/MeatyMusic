# Phase 5: Rendering Integration (Optional MVP)

**Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Ready for implementation
**Duration**: 1-2 weeks
**Critical Path**: NO - Optional for MVP, can defer

---

## Phase Overview

### Goals

Phase 5 adds programmatic rendering via Suno API with job tracking, polling, and asset storage. This phase is **feature-flagged** and **optional for MVP** - users can manually copy prompts to Suno UI without this integration.

**Deliverables**:
1. Suno API Client - Authentication, rate limiting, request/response handling
2. Render Job Service - CRUD endpoints, queueing, status tracking
3. Job Polling System - Background workers for status updates
4. Asset Storage - S3 integration for audio files with pre-signed URLs
5. Frontend Rendering UI - Render button, status tracking, audio player

**Key Principles**:
- Feature-flagged: `render.suno.enabled` controls entire pipeline
- Fail gracefully: Rendering failures don't block workflow completion
- Deterministic: Same composed prompt + seed → same audio (when engine supports)
- Observable: Job status events via WebSocket for real-time UI updates

### Dependencies

**Phase 3 Prerequisites** (MUST be complete):
- COMPOSE skill producing validated `composed_prompt` artifacts
- Workflow orchestrator with event streaming
- Redis queue infrastructure (from Phase 0)
- S3 storage service (from Phase 0)

**External Dependencies**:
- Suno API v5 credentials (API key, organization ID)
- Redis for job queueing
- S3-compatible storage for audio assets
- WebSocket infrastructure for status updates

### Feature Flag Strategy

```python
# backend/config/features.py
from pydantic import BaseSettings

class FeatureFlags(BaseSettings):
    render_suno_enabled: bool = False  # Default: disabled for MVP
    render_suno_api_url: str = "https://api.suno.ai/v1"
    render_suno_timeout_sec: int = 300
    render_max_concurrent_jobs: int = 5
    render_retry_max_attempts: int = 3
    render_webhook_enabled: bool = False

features = FeatureFlags()
```

**Graceful Degradation**:
- When `render.suno.enabled = false`:
  - Render button hidden in UI
  - `/render_jobs` endpoints return 501 Not Implemented
  - RENDER skill skipped in workflow graph
  - Users manually copy composed prompt to Suno

### Parallel Work Opportunities

Work packages can proceed in parallel:

```
Phase 3 COMPOSE Complete
    ├─> WP1: Render Connector Service (python-backend-engineer) [5 days]
    │       ├─> Suno API client [2 days]
    │       ├─> Job endpoints + queueing [2 days]
    │       └─> Polling + asset storage [1 day]
    └─> WP2: Frontend Rendering UI (ui-engineer) [3 days]
            ├─> Render controls [1 day]
            ├─> Status tracking [1 day]
            └─> Audio player [1 day]
```

**Optimal staffing**: 1 backend engineer + 1 UI engineer
**Total wall-clock time**: 5 days with parallelization

---

## Work Package 1: Render Connector Service

**Agents**: `python-backend-engineer`, `backend-typescript-architect`
**Duration**: 5 days
**PRD Reference**: `docs/project_plans/PRDs/render_job.prd.md`

### Overview

Implement Suno API integration with job lifecycle management: submission, polling, callback handling, asset storage, and failure recovery.

### Suno API v5 Integration

#### Authentication & Rate Limiting

**File**: `backend/services/render/suno_client.py`

```python
import httpx
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from backend.config.features import features
from backend.services.cache import cache

class SunoAPIClient:
    """Suno API v5 client with rate limiting and retries."""

    def __init__(self, api_key: str, org_id: str):
        self.api_key = api_key
        self.org_id = org_id
        self.base_url = features.render_suno_api_url
        self.client = httpx.AsyncClient(
            timeout=features.render_suno_timeout_sec,
            headers={
                "Authorization": f"Bearer {api_key}",
                "X-Organization-ID": org_id,
                "Content-Type": "application/json"
            }
        )
        self.rate_limiter = SunoRateLimiter()

    async def check_rate_limit(self):
        """Check and wait if rate limit exceeded."""
        await self.rate_limiter.acquire()

    async def submit_job(
        self,
        prompt: str,
        model: str = "chirp-v3-5",
        num_variations: int = 1,
        seed: Optional[int] = None,
        duration_sec: int = 180
    ) -> Dict[str, Any]:
        """
        Submit render job to Suno API.

        Args:
            prompt: Composed prompt text (max 3800 chars for Suno v5)
            model: Model version (chirp-v3-5, v4.5)
            num_variations: Number of variations (1-8)
            seed: Random seed for deterministic generation
            duration_sec: Target duration in seconds

        Returns:
            {
                "job_id": "suno_abc123",
                "status": "queued",
                "estimated_wait_sec": 120,
                "created_at": "2025-11-11T13:00:00Z"
            }

        Raises:
            SunoAPIError: On API failures
            ValidationError: On invalid parameters
        """
        await self.check_rate_limit()

        # Validate parameters
        if len(prompt) > 3800:
            raise ValidationError("Prompt exceeds 3800 character limit")
        if num_variations < 1 or num_variations > 8:
            raise ValidationError("num_variations must be 1-8")

        payload = {
            "prompt": prompt,
            "model": model,
            "num_variations": num_variations,
            "duration": duration_sec,
        }
        if seed is not None:
            payload["seed"] = seed

        try:
            response = await self.client.post(
                f"{self.base_url}/generate",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise RateLimitError("Suno API rate limit exceeded")
            elif e.response.status_code == 402:
                raise InsufficientCreditsError("Insufficient Suno credits")
            elif e.response.status_code in (400, 422):
                raise ValidationError(f"Invalid request: {e.response.text}")
            else:
                raise SunoAPIError(f"API error: {e.response.status_code}")

    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Poll job status from Suno API.

        Returns:
            {
                "job_id": "suno_abc123",
                "status": "processing" | "complete" | "failed",
                "progress": 0.65,
                "assets": [
                    {
                        "variation_id": "var_001",
                        "url": "https://cdn.suno.ai/outputs/abc123.mp3",
                        "duration_sec": 178,
                        "format": "mp3"
                    }
                ],
                "error": null
            }
        """
        await self.check_rate_limit()

        try:
            response = await self.client.get(f"{self.base_url}/jobs/{job_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise JobNotFoundError(f"Job {job_id} not found")
            else:
                raise SunoAPIError(f"Status check failed: {e.response.status_code}")

    async def cancel_job(self, job_id: str) -> bool:
        """Cancel running job."""
        await self.check_rate_limit()

        try:
            response = await self.client.delete(f"{self.base_url}/jobs/{job_id}")
            response.raise_for_status()
            return True
        except httpx.HTTPStatusError:
            return False

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


class SunoRateLimiter:
    """Token bucket rate limiter for Suno API (10 req/min)."""

    def __init__(self, rate: int = 10, per_seconds: int = 60):
        self.rate = rate
        self.per_seconds = per_seconds
        self.allowance = rate
        self.last_check = datetime.utcnow()
        self.lock = asyncio.Lock()

    async def acquire(self):
        """Wait if rate limit exceeded."""
        async with self.lock:
            now = datetime.utcnow()
            elapsed = (now - self.last_check).total_seconds()
            self.allowance += elapsed * (self.rate / self.per_seconds)
            if self.allowance > self.rate:
                self.allowance = self.rate

            if self.allowance < 1.0:
                wait_time = (1.0 - self.allowance) * (self.per_seconds / self.rate)
                await asyncio.sleep(wait_time)
                self.allowance = 0
            else:
                self.allowance -= 1.0

            self.last_check = now
```

#### Render Job Endpoints

**File**: `backend/services/render/router.py`

```python
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from backend.auth.dependencies import get_current_user
from backend.database import get_db
from backend.models.render_job import RenderJob
from backend.schemas.render_job import (
    RenderJobCreate, RenderJobResponse, RenderJobStatus
)
from backend.services.render.suno_client import SunoAPIClient, get_suno_client
from backend.services.render.job_queue import render_queue
from backend.config.features import features

router = APIRouter(prefix="/render_jobs", tags=["rendering"])


@router.post("/", response_model=RenderJobResponse, status_code=201)
async def create_render_job(
    payload: RenderJobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user),
    suno_client: SunoAPIClient = Depends(get_suno_client)
):
    """
    Submit render job to Suno API and queue for polling.

    Feature flag: render.suno.enabled must be true.
    """
    if not features.render_suno_enabled:
        raise HTTPException(status_code=501, detail="Rendering not enabled")

    # Validate composed prompt
    if not payload.composed_prompt or len(payload.composed_prompt.prompt) == 0:
        raise HTTPException(status_code=422, detail="Empty composed prompt")

    # Check concurrent job limit
    active_jobs = await db.execute(
        db.query(RenderJob)
        .filter(RenderJob.user_id == user.id)
        .filter(RenderJob.status.in_(["queued", "processing"]))
    )
    if len(active_jobs.all()) >= features.render_max_concurrent_jobs:
        raise HTTPException(
            status_code=429,
            detail=f"Maximum {features.render_max_concurrent_jobs} concurrent jobs allowed"
        )

    # Submit to Suno API
    try:
        suno_response = await suno_client.submit_job(
            prompt=payload.composed_prompt.prompt,
            model=payload.model,
            num_variations=payload.num_variations,
            seed=payload.seed
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Suno API error: {str(e)}")

    # Create database record
    job = RenderJob(
        id=uuid4(),
        user_id=user.id,
        engine=payload.engine,
        model=payload.model,
        composed_prompt=payload.composed_prompt.dict(),
        num_variations=payload.num_variations,
        seed=payload.seed,
        external_job_id=suno_response["job_id"],
        status="queued",
        callbacks=payload.callbacks.dict() if payload.callbacks else None,
        created_at=datetime.utcnow()
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Queue for polling
    await render_queue.enqueue(job.id, user.id)

    # Emit event if requested
    if payload.callbacks and payload.callbacks.events:
        background_tasks.add_task(emit_job_event, job.id, "queued", user.id)

    return job


@router.get("/", response_model=List[RenderJobResponse])
async def list_render_jobs(
    status: Optional[RenderJobStatus] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """List render jobs for current user with optional status filter."""
    query = db.query(RenderJob).filter(RenderJob.user_id == user.id)
    if status:
        query = query.filter(RenderJob.status == status)

    query = query.order_by(RenderJob.created_at.desc())
    jobs = await query.offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=RenderJobResponse)
async def get_render_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    """Retrieve single render job by ID."""
    job = await db.get(RenderJob, job_id)
    if not job or job.user_id != user.id:
        raise HTTPException(status_code=404, detail="Render job not found")
    return job


@router.delete("/{job_id}", status_code=204)
async def cancel_render_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user),
    suno_client: SunoAPIClient = Depends(get_suno_client)
):
    """Cancel render job (if still queued or processing)."""
    job = await db.get(RenderJob, job_id)
    if not job or job.user_id != user.id:
        raise HTTPException(status_code=404, detail="Render job not found")

    if job.status in ("complete", "failed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel {job.status} job")

    # Attempt to cancel in Suno API
    if job.external_job_id:
        await suno_client.cancel_job(job.external_job_id)

    job.status = "cancelled"
    job.updated_at = datetime.utcnow()
    await db.commit()

    return None
```

#### Job Queueing & Polling

**File**: `backend/services/render/job_queue.py`

```python
import asyncio
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from redis import asyncio as aioredis
from uuid import UUID

from backend.config import settings
from backend.services.render.poller import poll_job_status

class RenderJobQueue:
    """Redis-backed job queue with background polling."""

    def __init__(self):
        self.redis = aioredis.from_url(settings.redis_url)
        self.queue_key = "render_jobs:queue"
        self.processing_key = "render_jobs:processing"
        self.polling_task: Optional[asyncio.Task] = None

    async def enqueue(self, job_id: UUID, user_id: UUID):
        """Add job to queue."""
        job_data = {
            "job_id": str(job_id),
            "user_id": str(user_id),
            "enqueued_at": datetime.utcnow().isoformat()
        }
        await self.redis.rpush(self.queue_key, json.dumps(job_data))

    async def dequeue(self) -> Optional[Dict[str, Any]]:
        """Atomically move job from queue to processing."""
        data = await self.redis.blmove(
            self.queue_key,
            self.processing_key,
            timeout=5.0,
            src="LEFT",
            dest="RIGHT"
        )
        if data:
            return json.loads(data)
        return None

    async def complete(self, job_id: UUID):
        """Remove job from processing set."""
        # Find and remove from processing list
        processing = await self.redis.lrange(self.processing_key, 0, -1)
        for item in processing:
            job_data = json.loads(item)
            if job_data["job_id"] == str(job_id):
                await self.redis.lrem(self.processing_key, 1, item)
                break

    async def start_polling(self):
        """Start background polling worker."""
        if self.polling_task is None or self.polling_task.done():
            self.polling_task = asyncio.create_task(self._poll_worker())

    async def stop_polling(self):
        """Stop background polling worker."""
        if self.polling_task:
            self.polling_task.cancel()
            try:
                await self.polling_task
            except asyncio.CancelledError:
                pass

    async def _poll_worker(self):
        """Background worker that polls jobs continuously."""
        while True:
            try:
                job_data = await self.dequeue()
                if job_data:
                    # Poll job status in background
                    asyncio.create_task(
                        poll_job_status(
                            UUID(job_data["job_id"]),
                            UUID(job_data["user_id"])
                        )
                    )
                else:
                    # No jobs, wait before retrying
                    await asyncio.sleep(5)
            except Exception as e:
                # Log error but continue polling
                print(f"Poll worker error: {e}")
                await asyncio.sleep(10)


render_queue = RenderJobQueue()
```

**File**: `backend/services/render/poller.py`

```python
import asyncio
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.render_job import RenderJob
from backend.services.render.suno_client import get_suno_client
from backend.services.render.storage import download_and_store_assets
from backend.services.events import emit_job_event
from backend.config.features import features

async def poll_job_status(job_id: UUID, user_id: UUID):
    """
    Poll Suno API for job status until complete or failed.

    Updates database with progress and stores assets on completion.
    """
    async with get_db() as db:
        job = await db.get(RenderJob, job_id)
        if not job:
            return

        suno_client = await get_suno_client()
        retry_count = 0
        poll_interval = 10  # seconds

        while retry_count < features.render_retry_max_attempts:
            try:
                status_response = await suno_client.get_job_status(
                    job.external_job_id
                )

                # Update job record
                job.status = status_response["status"]
                job.progress = status_response.get("progress", 0)
                job.updated_at = datetime.utcnow()

                if status_response["status"] == "complete":
                    # Download and store assets
                    assets = await download_and_store_assets(
                        job_id,
                        user_id,
                        status_response["assets"]
                    )
                    job.assets = assets
                    job.completed_at = datetime.utcnow()

                    # Emit completion event
                    await emit_job_event(job_id, "complete", user_id)

                    # Send webhook if configured
                    if job.callbacks and job.callbacks.get("webhook"):
                        await send_webhook(job.callbacks["webhook"], job)

                    await db.commit()
                    break

                elif status_response["status"] == "failed":
                    job.error = status_response.get("error", "Unknown error")
                    job.completed_at = datetime.utcnow()
                    await emit_job_event(job_id, "failed", user_id)
                    await db.commit()
                    break

                else:
                    # Still processing, emit progress event
                    await emit_job_event(job_id, "processing", user_id, {
                        "progress": job.progress
                    })
                    await db.commit()

                # Wait before next poll
                await asyncio.sleep(poll_interval)

            except Exception as e:
                retry_count += 1
                if retry_count >= features.render_retry_max_attempts:
                    job.status = "failed"
                    job.error = f"Polling failed after {retry_count} retries: {str(e)}"
                    job.completed_at = datetime.utcnow()
                    await db.commit()
                    break

                # Exponential backoff
                await asyncio.sleep(poll_interval * (2 ** retry_count))
```

#### Asset Storage

**File**: `backend/services/render/storage.py`

```python
import httpx
from typing import List, Dict, Any
from uuid import UUID
from pathlib import Path

from backend.services.storage import storage_client

async def download_and_store_assets(
    job_id: UUID,
    user_id: UUID,
    suno_assets: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Download audio files from Suno CDN and upload to S3.

    Returns list of stored assets with pre-signed URLs.
    """
    stored_assets = []

    for idx, asset in enumerate(suno_assets):
        # Download from Suno CDN
        async with httpx.AsyncClient() as client:
            response = await client.get(asset["url"])
            response.raise_for_status()
            audio_data = response.content

        # Generate S3 key
        variation_id = asset.get("variation_id", f"var_{idx:03d}")
        file_ext = asset.get("format", "mp3")
        s3_key = f"renders/{user_id}/{job_id}/{variation_id}.{file_ext}"

        # Upload to S3
        await storage_client.upload(
            bucket="artifacts",
            key=s3_key,
            data=audio_data,
            content_type=f"audio/{file_ext}"
        )

        # Generate pre-signed URL (expires in 7 days)
        download_url = await storage_client.generate_presigned_url(
            bucket="artifacts",
            key=s3_key,
            expires_in=7 * 24 * 3600
        )

        stored_assets.append({
            "variation_id": variation_id,
            "s3_key": s3_key,
            "download_url": download_url,
            "duration_sec": asset.get("duration_sec"),
            "format": file_ext,
            "size_bytes": len(audio_data)
        })

    return stored_assets
```

### Database Schema

**File**: `backend/models/render_job.py`

```python
from sqlalchemy import Column, String, Integer, JSON, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
import uuid as uuid_lib

from backend.database import Base

class RenderJobStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"
    CANCELLED = "cancelled"

class RenderJob(Base):
    __tablename__ = "render_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_lib.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Job configuration
    engine = Column(String, nullable=False)  # "suno-v5"
    model = Column(String, nullable=False)   # "chirp-v3-5"
    composed_prompt = Column(JSON, nullable=False)  # Full composed prompt object
    num_variations = Column(Integer, default=1)
    seed = Column(Integer, nullable=True)

    # External tracking
    external_job_id = Column(String, nullable=True)  # Suno job ID

    # Status
    status = Column(Enum(RenderJobStatus), default=RenderJobStatus.QUEUED)
    progress = Column(Integer, default=0)  # 0-100
    error = Column(String, nullable=True)

    # Assets
    assets = Column(JSON, nullable=True)  # List of {s3_key, download_url, duration_sec}

    # Callbacks
    callbacks = Column(JSON, nullable=True)  # {webhook, events}

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="render_jobs")
```

### Testing

**File**: `backend/tests/services/render/test_suno_client.py`

```python
import pytest
from unittest.mock import AsyncMock, patch
from backend.services.render.suno_client import SunoAPIClient

@pytest.fixture
def suno_client():
    return SunoAPIClient(api_key="test_key", org_id="test_org")

@pytest.mark.asyncio
async def test_submit_job_success(suno_client):
    """Test successful job submission."""
    mock_response = {
        "job_id": "suno_abc123",
        "status": "queued",
        "estimated_wait_sec": 120
    }

    with patch.object(suno_client.client, 'post') as mock_post:
        mock_post.return_value.json.return_value = mock_response
        mock_post.return_value.raise_for_status = lambda: None

        result = await suno_client.submit_job(
            prompt="upbeat pop song, 120 BPM",
            model="chirp-v3-5",
            num_variations=2,
            seed=42
        )

        assert result["job_id"] == "suno_abc123"
        assert result["status"] == "queued"

@pytest.mark.asyncio
async def test_submit_job_prompt_too_long(suno_client):
    """Test validation error for oversized prompt."""
    with pytest.raises(ValidationError, match="exceeds 3800"):
        await suno_client.submit_job(prompt="x" * 4000)

@pytest.mark.asyncio
async def test_rate_limit_handling(suno_client):
    """Test rate limiter delays requests appropriately."""
    import time

    start = time.time()
    for _ in range(3):
        await suno_client.check_rate_limit()
    elapsed = time.time() - start

    # Should take ~0.2s at 10 req/min
    assert elapsed >= 0.18
```

**File**: `backend/tests/services/render/test_job_queue.py`

```python
import pytest
from uuid import uuid4
from backend.services.render.job_queue import RenderJobQueue

@pytest.fixture
async def queue():
    q = RenderJobQueue()
    # Clear queue before test
    await q.redis.delete(q.queue_key, q.processing_key)
    yield q
    await q.redis.close()

@pytest.mark.asyncio
async def test_enqueue_dequeue(queue):
    """Test job enqueue and dequeue flow."""
    job_id = uuid4()
    user_id = uuid4()

    await queue.enqueue(job_id, user_id)
    job_data = await queue.dequeue()

    assert job_data["job_id"] == str(job_id)
    assert job_data["user_id"] == str(user_id)

@pytest.mark.asyncio
async def test_complete_removes_from_processing(queue):
    """Test job completion removes from processing list."""
    job_id = uuid4()
    user_id = uuid4()

    await queue.enqueue(job_id, user_id)
    await queue.dequeue()

    # Job should be in processing
    processing = await queue.redis.lrange(queue.processing_key, 0, -1)
    assert len(processing) == 1

    # Complete job
    await queue.complete(job_id)

    # Processing should be empty
    processing = await queue.redis.lrange(queue.processing_key, 0, -1)
    assert len(processing) == 0
```

---

## Work Package 2: Frontend Rendering UI

**Agent**: `ui-engineer`
**Duration**: 3 days
**PRD Reference**: `docs/project_plans/PRDs/website_app.prd.md` (Workflow Review screen)

### Overview

Add rendering controls to workflow review screen: render button, job status tracking, audio player with playback controls.

### Render Controls Component

**File**: `frontend/src/components/workflow/RenderControls.tsx`

```typescript
import React, { useState } from 'react';
import { Button, Select, Spinner, Alert } from '@/components/ui';
import { useRenderJob } from '@/hooks/useRenderJob';
import { ComposedPrompt } from '@/types/workflow';

interface RenderControlsProps {
  workflowId: string;
  composedPrompt: ComposedPrompt;
  onJobCreated?: (jobId: string) => void;
}

export function RenderControls({
  workflowId,
  composedPrompt,
  onJobCreated
}: RenderControlsProps) {
  const [model, setModel] = useState('chirp-v3-5');
  const [numVariations, setNumVariations] = useState(1);
  const { createJob, isLoading, error } = useRenderJob();

  const handleRender = async () => {
    const job = await createJob({
      engine: 'suno-v5',
      model,
      composed_prompt: composedPrompt,
      num_variations: numVariations,
      seed: composedPrompt.seed,
      callbacks: {
        events: true  // Enable WebSocket updates
      }
    });

    if (job && onJobCreated) {
      onJobCreated(job.id);
    }
  };

  return (
    <div className="render-controls">
      <h3>Render Audio</h3>

      <div className="form-group">
        <label>Model</label>
        <Select value={model} onChange={setModel}>
          <option value="chirp-v3-5">Chirp v3.5 (Recommended)</option>
          <option value="v4.5">Suno v4.5 (Experimental)</option>
        </Select>
      </div>

      <div className="form-group">
        <label>Variations</label>
        <Select value={numVariations} onChange={setNumVariations}>
          {[1, 2, 3, 4].map(n => (
            <option key={n} value={n}>{n} variation{n > 1 ? 's' : ''}</option>
          ))}
        </Select>
        <small>Each variation costs 1 credit</small>
      </div>

      {error && (
        <Alert variant="error">
          Render failed: {error.message}
        </Alert>
      )}

      <Button
        onClick={handleRender}
        disabled={isLoading || !composedPrompt}
        variant="primary"
        size="large"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" /> Submitting...
          </>
        ) : (
          'Render Audio'
        )}
      </Button>

      <div className="prompt-preview">
        <h4>Composed Prompt</h4>
        <pre>{composedPrompt.prompt}</pre>
        <small>
          {composedPrompt.char_count} characters
          {composedPrompt.within_limit ? ' (within limit)' : ' (exceeds limit!)'}
        </small>
      </div>
    </div>
  );
}
```

### Job Status Tracker

**File**: `frontend/src/components/workflow/JobStatusTracker.tsx`

```typescript
import React, { useEffect } from 'react';
import { ProgressBar, Badge, Button } from '@/components/ui';
import { useRenderJob } from '@/hooks/useRenderJob';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AudioPlayer } from './AudioPlayer';
import { RenderJobStatus } from '@/types/render';

interface JobStatusTrackerProps {
  jobId: string;
}

export function JobStatusTracker({ jobId }: JobStatusTrackerProps) {
  const { job, refetch, cancelJob } = useRenderJob(jobId);
  const { subscribe } = useWebSocket();

  // Subscribe to job status events via WebSocket
  useEffect(() => {
    const unsubscribe = subscribe(`render_job.${jobId}`, (event) => {
      if (event.phase === 'complete' || event.phase === 'failed') {
        refetch();
      }
    });

    return unsubscribe;
  }, [jobId, subscribe, refetch]);

  if (!job) {
    return <div>Loading job status...</div>;
  }

  const statusConfig = {
    queued: { color: 'gray', label: 'Queued' },
    processing: { color: 'blue', label: 'Processing' },
    complete: { color: 'green', label: 'Complete' },
    failed: { color: 'red', label: 'Failed' },
    cancelled: { color: 'yellow', label: 'Cancelled' }
  };

  const config = statusConfig[job.status];

  return (
    <div className="job-status-tracker">
      <div className="status-header">
        <Badge color={config.color}>{config.label}</Badge>
        <span className="job-id">Job: {jobId.slice(0, 8)}</span>
      </div>

      {job.status === 'processing' && (
        <ProgressBar value={job.progress} max={100} />
      )}

      {job.status === 'failed' && (
        <div className="error-message">
          <strong>Error:</strong> {job.error}
        </div>
      )}

      {job.status === 'complete' && job.assets && (
        <div className="assets-section">
          <h4>Rendered Audio ({job.assets.length} variation{job.assets.length > 1 ? 's' : ''})</h4>
          {job.assets.map((asset, idx) => (
            <AudioPlayer
              key={asset.variation_id}
              title={`Variation ${idx + 1}`}
              url={asset.download_url}
              duration={asset.duration_sec}
              onDownload={() => window.open(asset.download_url, '_blank')}
            />
          ))}
        </div>
      )}

      {(job.status === 'queued' || job.status === 'processing') && (
        <Button
          onClick={() => cancelJob(jobId)}
          variant="secondary"
          size="small"
        >
          Cancel Job
        </Button>
      )}

      <div className="job-metadata">
        <small>
          Model: {job.model} | Seed: {job.seed} |
          Created: {new Date(job.created_at).toLocaleString()}
        </small>
      </div>
    </div>
  );
}
```

### Audio Player Component

**File**: `frontend/src/components/workflow/AudioPlayer.tsx`

```typescript
import React, { useRef, useState, useEffect } from 'react';
import { Button, IconButton, Slider } from '@/components/ui';
import {
  PlayIcon, PauseIcon, DownloadIcon,
  VolumeUpIcon, VolumeOffIcon
} from '@/components/icons';

interface AudioPlayerProps {
  title: string;
  url: string;
  duration?: number;
  onDownload?: () => void;
}

export function AudioPlayer({ title, url, duration, onDownload }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = duration || audioRef.current?.duration || 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="player-header">
        <strong>{title}</strong>
        {onDownload && (
          <IconButton onClick={onDownload} size="small" title="Download">
            <DownloadIcon />
          </IconButton>
        )}
      </div>

      <div className="player-controls">
        <IconButton onClick={togglePlay} size="large">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>

        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>

      <Slider
        value={currentTime}
        max={totalDuration}
        onChange={handleSeek}
        className="seek-bar"
      />

      <div className="volume-controls">
        <IconButton onClick={toggleMute} size="small">
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <Slider
          value={isMuted ? 0 : volume}
          max={1}
          step={0.1}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
}
```

### React Hooks

**File**: `frontend/src/hooks/useRenderJob.ts`

```typescript
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RenderJobCreate, RenderJob } from '@/types/render';

export function useRenderJob(jobId?: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: RenderJobCreate) =>
      api.post<RenderJob>('/render_jobs', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['render_jobs']);
    },
    onError: (err) => setError(err as Error)
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/render_jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['render_jobs']);
      if (jobId) {
        queryClient.invalidateQueries(['render_job', jobId]);
      }
    }
  });

  const jobQuery = useQuery({
    queryKey: ['render_job', jobId],
    queryFn: () => api.get<RenderJob>(`/render_jobs/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Poll every 5s if job is active
      if (data?.status === 'queued' || data?.status === 'processing') {
        return 5000;
      }
      return false;
    }
  });

  return {
    job: jobQuery.data,
    isLoading: createMutation.isLoading,
    error,
    createJob: createMutation.mutateAsync,
    cancelJob: cancelMutation.mutate,
    refetch: jobQuery.refetch
  };
}
```

### Feature Flag UI

**File**: `frontend/src/components/workflow/WorkflowReview.tsx`

```typescript
import React from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { RenderControls } from './RenderControls';
import { JobStatusTracker } from './JobStatusTracker';

export function WorkflowReview({ workflow, composedPrompt }) {
  const { isEnabled } = useFeatureFlags();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  return (
    <div className="workflow-review">
      <h2>Workflow Review</h2>

      {/* Always show composed prompt */}
      <section className="prompt-section">
        <h3>Composed Prompt</h3>
        <pre>{composedPrompt.prompt}</pre>
        <Button
          onClick={() => navigator.clipboard.writeText(composedPrompt.prompt)}
          variant="secondary"
        >
          Copy to Clipboard
        </Button>
      </section>

      {/* Conditionally show render controls */}
      {isEnabled('render.suno.enabled') ? (
        <section className="render-section">
          <RenderControls
            workflowId={workflow.id}
            composedPrompt={composedPrompt}
            onJobCreated={setActiveJobId}
          />

          {activeJobId && (
            <JobStatusTracker jobId={activeJobId} />
          )}
        </section>
      ) : (
        <section className="manual-render-info">
          <h3>Manual Rendering</h3>
          <p>
            Copy the prompt above and paste it into{' '}
            <a href="https://suno.com" target="_blank" rel="noopener">
              Suno's web interface
            </a>{' '}
            to generate audio.
          </p>
          <p>
            <small>
              Programmatic rendering is not enabled in this deployment.
            </small>
          </p>
        </section>
      )}
    </div>
  );
}
```

---

## Integration Points

### Phase 3 COMPOSE → Phase 5 RENDER

```python
# .claude/skills/amcs-render/SKILL.md
"""
Render skill submits composed prompt to Suno API.

Input:
  - composed_prompt: Output from COMPOSE skill
  - sds: Song Design Spec

Output:
  - render_job_id: UUID of created render job
  - status: "queued"
  - external_job_id: Suno job ID

Process:
1. Check feature flag: render.suno.enabled
2. If disabled, log message and return skip status
3. If enabled, submit to /render_jobs endpoint
4. Return job ID for tracking
"""
```

### WebSocket Event Flow

```
1. User clicks "Render Audio"
   → POST /render_jobs {callbacks: {events: true}}

2. Backend submits to Suno API
   → Creates job with status="queued"
   → Enqueues for polling
   → Emits WebSocket event: render_job.{id}.queued

3. Background poller checks status
   → Every 10 seconds: GET /jobs/{suno_job_id}
   → Emits WebSocket event: render_job.{id}.processing {progress: 65}

4. Job completes
   → Download assets from Suno CDN
   → Upload to S3
   → Generate pre-signed URLs
   → Emits WebSocket event: render_job.{id}.complete {assets: [...]}

5. Frontend receives event
   → Updates JobStatusTracker
   → Shows AudioPlayer components
```

---

## Feature Flag Configuration

### Development Environment

```yaml
# .env.development
RENDER_SUNO_ENABLED=false  # Disabled by default
RENDER_SUNO_API_URL=https://api.suno.ai/v1
RENDER_SUNO_API_KEY=sk-test-...
RENDER_SUNO_ORG_ID=org-test-...
RENDER_MAX_CONCURRENT_JOBS=5
RENDER_RETRY_MAX_ATTEMPTS=3
```

### Production Environment

```yaml
# .env.production
RENDER_SUNO_ENABLED=true  # Enable for production
RENDER_SUNO_API_URL=https://api.suno.ai/v1
RENDER_SUNO_API_KEY=${SUNO_API_KEY}  # From secrets manager
RENDER_SUNO_ORG_ID=${SUNO_ORG_ID}
RENDER_MAX_CONCURRENT_JOBS=10
RENDER_RETRY_MAX_ATTEMPTS=3
```

### Runtime Toggle

```python
# Admin endpoint to toggle feature flag
@router.post("/admin/features/{flag_name}/toggle")
async def toggle_feature_flag(
    flag_name: str,
    enabled: bool,
    user = Depends(require_admin)
):
    """Toggle feature flag at runtime (admin only)."""
    if flag_name == "render.suno.enabled":
        features.render_suno_enabled = enabled
        # Optionally persist to database
        await save_feature_flag(flag_name, enabled)
        return {"flag": flag_name, "enabled": enabled}
    else:
        raise HTTPException(status_code=404, detail="Unknown feature flag")
```

---

## Testing Strategy

### Suno API Mock Server

**File**: `backend/tests/mocks/suno_server.py`

```python
from fastapi import FastAPI, HTTPException
from typing import Dict
import uuid

app = FastAPI()

jobs: Dict[str, dict] = {}

@app.post("/generate")
async def generate(payload: dict):
    """Mock Suno job submission."""
    job_id = f"suno_{uuid.uuid4().hex[:8]}"
    jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "estimated_wait_sec": 120
    }
    return jobs[job_id]

@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Mock Suno job status."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    # Simulate progress
    if job["status"] == "queued":
        job["status"] = "processing"
        job["progress"] = 10
    elif job["status"] == "processing":
        job["progress"] = min(100, job["progress"] + 20)
        if job["progress"] >= 100:
            job["status"] = "complete"
            job["assets"] = [
                {
                    "variation_id": f"var_{i:03d}",
                    "url": f"https://cdn.suno.ai/test/{job_id}_{i}.mp3",
                    "duration_sec": 180,
                    "format": "mp3"
                }
                for i in range(1)  # 1 variation
            ]

    return job
```

### Integration Tests

**File**: `backend/tests/integration/test_render_flow.py`

```python
import pytest
from unittest.mock import patch
from uuid import uuid4

@pytest.mark.integration
async def test_full_render_flow(client, auth_headers, test_user):
    """Test complete render flow: submit → poll → complete."""

    # Create composed prompt
    composed_prompt = {
        "prompt": "upbeat pop song, 120 BPM\n[Verse]\nTest lyrics...",
        "char_count": 100,
        "within_limit": True,
        "seed": 42
    }

    # Submit render job
    response = await client.post(
        "/render_jobs",
        json={
            "engine": "suno-v5",
            "model": "chirp-v3-5",
            "composed_prompt": composed_prompt,
            "num_variations": 1,
            "seed": 42,
            "callbacks": {"events": True}
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    job = response.json()
    job_id = job["id"]

    # Job should be queued
    assert job["status"] == "queued"
    assert job["external_job_id"].startswith("suno_")

    # Wait for processing (mock server auto-progresses)
    import asyncio
    await asyncio.sleep(2)

    # Check status
    response = await client.get(f"/render_jobs/{job_id}", headers=auth_headers)
    job = response.json()
    assert job["status"] in ("processing", "complete")

    # Poll until complete (max 10 attempts)
    for _ in range(10):
        response = await client.get(f"/render_jobs/{job_id}", headers=auth_headers)
        job = response.json()
        if job["status"] == "complete":
            break
        await asyncio.sleep(1)

    # Verify completion
    assert job["status"] == "complete"
    assert len(job["assets"]) == 1
    assert job["assets"][0]["variation_id"] == "var_000"
    assert "download_url" in job["assets"][0]

@pytest.mark.integration
async def test_render_with_feature_flag_disabled(client, auth_headers):
    """Test graceful handling when rendering disabled."""

    with patch('backend.config.features.render_suno_enabled', False):
        response = await client.post(
            "/render_jobs",
            json={"engine": "suno-v5", "model": "chirp-v3-5"},
            headers=auth_headers
        )
        assert response.status_code == 501
        assert "not enabled" in response.json()["detail"]
```

### Failure Scenario Tests

**File**: `backend/tests/integration/test_render_failures.py`

```python
import pytest

@pytest.mark.integration
async def test_suno_api_timeout(client, auth_headers):
    """Test handling of Suno API timeout."""
    with patch('backend.services.render.suno_client.SunoAPIClient.submit_job') as mock:
        mock.side_effect = asyncio.TimeoutError("Request timed out")

        response = await client.post("/render_jobs", json={...}, headers=auth_headers)
        assert response.status_code == 502
        assert "timeout" in response.json()["detail"].lower()

@pytest.mark.integration
async def test_insufficient_credits(client, auth_headers):
    """Test handling of insufficient Suno credits."""
    with patch('backend.services.render.suno_client.SunoAPIClient.submit_job') as mock:
        mock.side_effect = InsufficientCreditsError("Insufficient credits")

        response = await client.post("/render_jobs", json={...}, headers=auth_headers)
        assert response.status_code == 402
        assert "credits" in response.json()["detail"].lower()

@pytest.mark.integration
async def test_job_polling_retries(client, auth_headers):
    """Test retry logic for failed polling attempts."""
    job_id = uuid4()

    with patch('backend.services.render.suno_client.SunoAPIClient.get_job_status') as mock:
        # Fail first 2 attempts, succeed on 3rd
        mock.side_effect = [
            Exception("Network error"),
            Exception("Network error"),
            {"status": "complete", "assets": [...]}
        ]

        # Trigger polling
        await poll_job_status(job_id, test_user.id)

        # Should have retried and eventually succeeded
        assert mock.call_count == 3
```

---

## Success Criteria

### Functional Requirements

- [ ] Render jobs submit successfully to Suno API
- [ ] Job status updates via polling (every 10s)
- [ ] Assets downloaded and stored in S3
- [ ] Pre-signed URLs generated with 7-day expiration
- [ ] WebSocket events emitted for real-time UI updates
- [ ] Audio player supports play/pause/seek/volume
- [ ] Feature flag disables rendering gracefully

### Performance Requirements

- [ ] Job submission completes in <2 seconds
- [ ] Polling interval: 10 seconds
- [ ] Asset download + S3 upload in <30 seconds
- [ ] Pre-signed URL generation in <500ms
- [ ] Audio player loads in <1 second

### Reliability Requirements

- [ ] Retry logic: max 3 attempts with exponential backoff
- [ ] Rate limiting: 10 req/min to Suno API
- [ ] Graceful failure: rendering errors don't crash workflow
- [ ] Webhook delivery: 3 retries with exponential backoff
- [ ] Job cleanup: failed jobs marked after 3 retry attempts

---

## Exit Criteria

### Phase 5 Complete When:

1. **Backend Integration**:
   - Suno API client authenticates and submits jobs
   - `/render_jobs` CRUD endpoints operational
   - Redis job queue processes submissions
   - Background poller updates job status
   - Assets stored in S3 with pre-signed URLs

2. **Frontend Integration**:
   - Render controls visible on workflow review screen
   - Job status tracker shows real-time progress
   - Audio player supports playback controls
   - Download button generates audio file
   - Feature flag UI hides/shows rendering appropriately

3. **End-to-End Flow**:
   - User completes workflow → COMPOSE → composed prompt
   - User clicks "Render Audio" → job submitted
   - Job progresses: queued → processing → complete
   - Assets appear in audio player
   - User plays/downloads rendered audio

4. **Testing**:
   - Mock Suno server passes integration tests
   - Failure scenarios handled gracefully
   - Feature flag toggle works at runtime
   - Determinism tests: same prompt + seed → same assets (when supported by engine)

5. **Documentation**:
   - API endpoints documented in OpenAPI schema
   - Feature flag configuration documented
   - Suno API integration guide written
   - Troubleshooting guide for common failures

---

## Rollout Strategy

### MVP Phase (Phase 5 Disabled)

```
1. Deploy all phases 0-4
2. Keep render.suno.enabled = false
3. Users copy prompts manually to Suno UI
4. Collect feedback on prompt quality
5. Validate that composed prompts work in Suno
```

### Optional Enhancement (Phase 5 Enabled)

```
1. Acquire Suno API credentials
2. Configure feature flag: render.suno.enabled = true
3. Enable for beta users first (user_ids allow-list)
4. Monitor job success rate and latency
5. Gradually roll out to all users
```

### Rollback Plan

```
1. Set render.suno.enabled = false
2. In-flight jobs continue polling until complete
3. New job submissions return 501 Not Implemented
4. UI reverts to "Copy to Clipboard" mode
5. No data loss - all jobs persist in database
```

---

## Related Documentation

- **render_job.prd.md**: Entity schema and validation rules
- **prompt.prd.md**: Composed prompt structure (Phase 3)
- **claude_code_orchestration.prd.md**: Workflow graph with RENDER node
- **Phase 0**: Infrastructure (Redis queue, S3 storage)
- **Phase 3b**: COMPOSE skill that produces render-ready prompts
- **Phase 4**: Frontend workflow review screen

---

**Phase 5 Status**: Ready for implementation
**Next Phase**: Phase 6 (Testing & Integration)
**Estimated Start**: After Phase 3 completion
**Estimated Duration**: 1-2 weeks (backend + frontend)
