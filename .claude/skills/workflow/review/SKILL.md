# REVIEW Skill

**Node**: REVIEW
**Purpose**: Finalize workflow run and collect all artifacts
**Determinism**: Deterministic (summary generation)

## Overview

The REVIEW skill is the final workflow node that collects all generated artifacts, computes final metrics, persists results to storage, and emits a completion event. This node always runs regardless of validation outcomes.

## Input Contract

```typescript
{
  artifacts: {
    plan: PlanSchema;
    style: StyleSchema;
    lyrics: LyricsSchema;
    producer_notes: ProducerNotesSchema;
    composed_prompt: ComposedPromptSchema;
  };
  scores: {
    validation_scores: Record<string, number>;  // From VALIDATE
    total_score: number;
  };
  citations: Citation[];
  render_result?: {
    job_id: string;
    asset_uri?: string;
    status: string;
  } | null;
  run_metadata: {
    run_id: string;
    song_id: string;
    seed: int;
    start_time: string;  // ISO 8601
  };
}
```

## Output Contract

```typescript
{
  status: "completed" | "completed_with_warnings";
  summary: {
    artifacts: {
      plan: string;        // Content hash
      style: string;
      lyrics: string;
      producer_notes: string;
      composed_prompt: string;
    };
    scores: {
      total: number;
      validation: Record<string, number>;
    };
    citations: {
      total_count: int;
      source_count: int;
      unique_sources: string[];
    };
    render?: {
      job_id: string;
      asset_uri?: string;
      status: string;
    } | null;
    metrics: {
      duration_ms: int;
      total_artifact_size: int;  // bytes
      issues_remaining: int;
    };
  };
  issues: Issue[];  // Any remaining warnings or issues
  storage: {
    artifacts_uri: string;  // Path to stored artifacts
    run_uri: string;        // Path to run metadata
  };
}
```

## Constraints

### Deterministic Summary

- **Content Hashes**: Use SHA-256 for artifact fingerprints
- **Seed Recording**: Include workflow seed in summary
- **Reproducibility**: Same artifacts → same hashes

### Storage

- **Database**: Persist run metadata, scores, citations
- **S3/Blob Storage**: Store large artifacts (lyrics, composed_prompt)
- **Structure**: `/runs/{song_id}/{run_id}/`

### Events

- **Completion Event**: Emit final event with summary
- **WebSocket**: Broadcast to active clients
- **Audit Log**: Record completion in audit trail

## Processing Logic

1. **Collect Artifacts**
   ```python
   artifacts = {
       "plan": context.get_artifact("plan"),
       "style": context.get_artifact("style"),
       "lyrics": context.get_artifact("lyrics"),
       "producer_notes": context.get_artifact("producer_notes"),
       "composed_prompt": context.get_artifact("composed_prompt"),
   }
   ```

2. **Compute Hashes**
   ```python
   artifact_hashes = {
       name: compute_sha256(json.dumps(artifact, sort_keys=True))
       for name, artifact in artifacts.items()
   }
   ```

3. **Calculate Metrics**
   ```python
   duration_ms = (end_time - start_time).total_seconds() * 1000
   artifact_size = sum(len(json.dumps(a)) for a in artifacts.values())
   issues_remaining = len([i for i in issues if i.severity in ("warning", "error")])
   ```

4. **Summarize Citations**
   ```python
   unique_sources = set(c["source_id"] for c in citations)
   citation_summary = {
       "total_count": len(citations),
       "source_count": len(unique_sources),
       "unique_sources": list(unique_sources),
   }
   ```

5. **Persist to Storage**
   ```python
   # Database: run metadata, scores, citations
   await db.runs.create({
       "run_id": run_id,
       "song_id": song_id,
       "seed": seed,
       "artifacts": artifact_hashes,
       "scores": scores,
       "citations": citations,
       "status": status,
       "completed_at": datetime.utcnow(),
   })

   # Blob storage: full artifacts
   storage_path = f"/runs/{song_id}/{run_id}/"
   await storage.upload_json(f"{storage_path}artifacts.json", artifacts)
   ```

6. **Emit Completion Event**
   ```python
   await event_publisher.publish({
       "type": "workflow.completed",
       "run_id": run_id,
       "song_id": song_id,
       "status": status,
       "summary": summary,
       "timestamp": datetime.utcnow().isoformat(),
   })
   ```

7. **Generate Summary**
   ```python
   return {
       "status": status,
       "summary": {
           "artifacts": artifact_hashes,
           "scores": scores,
           "citations": citation_summary,
           "render": render_result,
           "metrics": {
               "duration_ms": duration_ms,
               "total_artifact_size": artifact_size,
               "issues_remaining": issues_remaining,
           },
       },
       "issues": issues,
       "storage": {
           "artifacts_uri": f"{storage_path}artifacts.json",
           "run_uri": f"/runs/{run_id}",
       },
   }
   ```

## Status Determination

### Completed

- All artifacts generated successfully
- No critical errors
- Validation passed (or fixed via FIX loop)

### Completed with Warnings

- Artifacts generated but validation warnings remain
- Non-critical issues detected
- Render job queued but not completed

## Observability

### Metrics

- `workflow.completions_total{status}`: Counter
- `workflow.duration_seconds`: Histogram
- `workflow.artifact_size_bytes`: Histogram

### Spans

- `review.finalize`: Full operation
- `review.compute_hashes`: Hash calculation
- `review.persist_storage`: Storage operations
- `review.emit_event`: Event publishing

### Events

- `workflow.completed`: Final completion event
- `workflow.failed`: If critical error during review

### Logs

All logs include:
- `run_id`: Workflow run identifier
- `song_id`: Song identifier
- `duration_ms`: Total workflow duration
- `artifact_count`: Number of artifacts
- `issues_remaining`: Count of unresolved issues

## Error Handling

### Storage Failures

- **Database Error**: Log error, continue with in-memory summary
- **Blob Storage Error**: Log error, mark status as "completed_with_warnings"
- **Retry**: Exponential backoff (max 3 attempts)

### Event Publishing Failures

- **WebSocket Error**: Log error, do not fail review
- **Best Effort**: Event publishing is non-blocking

### Critical Failures

If review itself fails:
- Log full context (artifacts, scores, issues)
- Emit `workflow.failed` event
- Return minimal summary with error details

## Future Enhancements

### Artifact Compression

- Compress large artifacts before storage
- Use gzip or brotli encoding
- Track compression ratio

### Detailed Analytics

- Track artifact generation times per node
- Record retry counts and fix iterations
- Compute quality metrics over time

### Notification Integration

- Send completion notifications (email, Slack)
- Alert on failed workflows
- Daily/weekly summary reports

### Asset Management

- Poll render job status until completion
- Download and store final audio assets
- Generate preview clips and waveforms

## References

- **Workflow PRD**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md` (section 3.9)
- **Implementation**: `services/api/app/skills/review.py`
- **Storage**: `services/api/app/storage/` (future)

## Testing

### Unit Tests

- Artifact hashing (deterministic)
- Summary generation (correct structure)
- Status determination logic
- Citation summarization

### Integration Tests

- Full workflow completion
- Storage persistence verification
- Event emission confirmation
- Error handling paths

### Contract Tests

- Output matches schema
- All required fields present
- Hashes are reproducible
