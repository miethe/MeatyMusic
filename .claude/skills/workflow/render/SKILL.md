# RENDER Skill

**Node**: RENDER
**Purpose**: Submit composed prompt to external rendering engine (optional, feature-flagged)
**Determinism**: Non-deterministic (external API call)

## Overview

The RENDER skill submits the final composed prompt to an external music rendering engine (e.g., Suno, Stable Audio) to generate audio assets. This is an optional workflow node controlled by feature flags.

## Input Contract

```typescript
{
  engine: string;           // Rendering engine ID (e.g., "suno", "stable-audio", "mock")
  model: string;            // Model version (e.g., "suno-v3.5", "stable-audio-v1")
  composed_prompt: ComposedPromptSchema;  // Final prompt from COMPOSE node
  num_variations: int;      // Number of variations to generate (1-3)
  seed?: int;              // Optional seed for reproducibility (if supported by engine)
}
```

## Output Contract

```typescript
{
  job_id: string;          // Render job identifier
  asset_uri?: string;      // URI to generated audio (if sync) or null (if async)
  status: string;          // "queued" | "processing" | "completed" | "failed"
  created_at: string;      // ISO 8601 timestamp
  metadata?: {             // Optional engine-specific metadata
    engine: string;
    model: string;
    duration_estimate?: number;
  }
}
```

If rendering is disabled via feature flag, returns `null`.

## Constraints

### Feature Flag

- **Flag**: `flags.render` (boolean, default: `false`)
- **Behavior**: If `false`, skip rendering and return `null`
- **Purpose**: Allows testing workflow without external API dependency

### Connector Pattern

- **Abstraction**: `RenderConnector` interface for pluggable engines
- **Implementations**:
  - `MockConnector`: Simulated rendering for testing (MVP)
  - `SunoConnector`: Suno API integration (Phase 5+)
  - Future: Stable Audio, MusicGen, etc.

### Non-Determinism

- **External API**: Results vary per submission (even with same prompt)
- **Recording**: Log all requests and responses for replay/debugging
- **Traceability**: Include trace context in all API calls

### Engine Limits

- **Character Limits**: Validate composed prompt length against engine limits
- **Parameter Constraints**: Respect engine-specific constraints (BPM, key, etc.)
- **Rate Limits**: Handle rate limiting and retries gracefully

## Processing Logic

1. **Check Feature Flag**
   ```python
   if not context.flags.get("render", False):
       logger.info("Rendering disabled by feature flag")
       return None
   ```

2. **Select Connector**
   ```python
   connector = connector_factory.get_connector(engine)
   if not connector:
       raise ValueError(f"Unknown rendering engine: {engine}")
   ```

3. **Validate Prompt**
   ```python
   max_length = connector.get_max_prompt_length(model)
   if len(composed_prompt.final_prompt) > max_length:
       raise ValueError(f"Prompt exceeds {engine} limit: {max_length} chars")
   ```

4. **Submit Job**
   ```python
   with tracer.start_as_current_span("render.submit"):
       result = await connector.submit_job(
           prompt=composed_prompt,
           model=model,
           num_variations=num_variations,
           seed=seed
       )
   ```

5. **Log Submission**
   ```python
   logger.info("Render job submitted", extra={
       "job_id": result["job_id"],
       "engine": engine,
       "model": model,
       "status": result["status"]
   })
   ```

6. **Emit Event**
   ```python
   await event_publisher.publish({
       "type": "render.submitted",
       "job_id": result["job_id"],
       "engine": engine,
       "timestamp": datetime.utcnow().isoformat()
   })
   ```

7. **Return Result**
   ```python
   return result
   ```

## MVP Implementation (Phase 4.4)

For MVP, use `MockConnector`:

```python
class MockConnector(RenderConnector):
    async def submit_job(self, prompt: dict, model: str, num_variations: int) -> dict:
        job_id = f"mock_{uuid4()}"
        return {
            "job_id": job_id,
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "metadata": {
                "engine": "mock",
                "model": model,
                "duration_estimate": 180  # 3 minutes
            }
        }
```

No actual API calls; returns mock data immediately.

## Error Handling

### Validation Errors

- **Invalid Engine**: Raise `ValueError` with supported engines list
- **Prompt Too Long**: Raise `ValueError` with length limit
- **Invalid Parameters**: Validate `num_variations` (1-3), model exists

### API Errors

- **Rate Limit**: Retry with exponential backoff (max 3 attempts)
- **Service Unavailable**: Retry with backoff
- **Authentication**: Fail fast, log error, do not retry
- **Timeout**: Fail after 30s, log timeout

### Logging

All errors include:
- `error_type`: Classification of error
- `engine`: Which engine failed
- `trace_id`: For correlation
- `retry_count`: If applicable

## Observability

### Metrics

- `render.submissions_total{engine, model}`: Counter
- `render.failures_total{engine, error_type}`: Counter
- `render.duration_seconds{engine}`: Histogram

### Spans

- `render.submit`: Full operation
- `render.validate_prompt`: Validation step
- `render.connector.submit_job`: Connector call

### Events

- `render.submitted`: Job submitted successfully
- `render.failed`: Submission failed
- `render.skipped`: Feature flag disabled

## Future Enhancements (Phase 5+)

### Suno Connector

- OAuth authentication
- Job polling mechanism
- Asset download and storage
- Credits management

### Status Polling

Add `get_status()` endpoint:
```python
async def get_status(job_id: str) -> dict:
    connector = get_connector_for_job(job_id)
    return await connector.get_status(job_id)
```

### Asset Management

- Download audio from engine storage
- Upload to S3 with hashed filename
- Update database with asset URI

### Webhook Support

- Register webhook for job completion
- Receive async notifications
- Update job status in database

## References

- **PRD**: `docs/project_plans/PRDs/render_job.prd.md`
- **Workflow PRD**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md` (section 3.8)
- **Connector Interface**: `services/api/app/connectors/base.py`
- **Implementation**: `services/api/app/skills/render.py`

## Testing

### Unit Tests

- Feature flag enabled/disabled
- Mock connector submission
- Prompt validation (length limits)
- Error handling (invalid engine, timeout)

### Integration Tests

- Full workflow with render enabled
- Full workflow with render disabled
- Multiple variations submission

### Contract Tests

- Verify output matches schema
- Verify connector interface compliance
