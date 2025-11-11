# PRD – Render Job Entity

## 1. Purpose

The **Render Job** entity represents a request to a music rendering engine.  During MVP, render jobs are optional; users will primarily copy prompts to the Suno UI manually.  In later releases, the app will create render jobs programmatically, submit them to a supported API and poll for completion.

## 2. Schema (JSON v1.0)

```json
{
  "$id": "amcs://schemas/render-job-1.0.json",
  "type": "object",
  "required": ["engine", "model", "composed_prompt", "num_variations", "seed"],
  "properties": {
    "engine": {"type": "string"},
    "model": {"type": "string"},
    "composed_prompt": {"$ref": "amcs://schemas/composed-prompt-0.2.json"},
    "num_variations": {"type": "integer", "minimum": 1, "maximum": 8},
    "seed": {"type": "integer"},
    "callbacks": {
      "type": "object",
      "properties": {
        "webhook": {"type": "string"},
        "events": {"type": "boolean"}
      }
    }
  }
}
```

## 3. Field Descriptions

* **engine** – Name of the rendering engine (e.g., `suno-v5`).  In the MVP, this field may be `manual` to indicate that the user will render outside the app.
* **model** – Specific model version to use (e.g., `chirp-v3-5`, `v4.5`).  Required when `engine` is not `manual`.
* **composed_prompt** – The **Prompt** entity containing the final prompt text and metadata.
* **num_variations** – Number of variations to request.  Engines typically allow 1–8 variations.  More variations cost more credits.
* **seed** – Seed for deterministic rendering.  If the engine supports seeded generation, passing the seed reproduces the same output.
* **callbacks.webhook** – URL for an HTTP callback upon job completion.  Optional.  When provided, the backend posts the results to this URL.
* **callbacks.events** – Boolean indicating whether to stream progress events to the client via WebSockets.  Optional.

## 4. Validation Rules

* `engine` cannot be empty.  If `engine = manual`, `model` may be omitted and the render job is considered a placeholder for manual work.
* `num_variations` must be between 1 and 8.  If the engine supports fewer variations, the orchestrator caps the value.
* If `callbacks.webhook` is provided, it must be a valid HTTPS URL.  Invalid URLs are rejected.

## 5. Workflow

1. **Submission** – When the user clicks **Render**, the app creates a render job with the selected engine and model, attaches the composed prompt and sets the number of variations.
2. **Queueing** – The render connector queues the job and returns a job ID.  The job appears in the **Workflows** page with status `pending`.
3. **Polling & Updates** – The backend polls the engine API or streams events.  Progress updates (e.g., `queued`, `processing`, `rendered`) are sent via WebSocket.
4. **Completion** – On completion, the job status is `complete` and audio assets (MP3/WAV) are stored in the assets table.  If a `webhook` is specified, the results are posted to the URL.
5. **Failure Handling** – If the engine reports an error (e.g., invalid model or network failure), the job status is `failed`.  An error message is returned and the user can retry.

## 6. Acceptance Tests

1. **Invalid Model** – Submitting a render job with an unsupported model returns a validation error before submission.
2. **Queue Length** – If the render queue exceeds the allowed concurrent limit (configured by admin), new jobs wait until existing ones finish.  The UI displays an informative message.
3. **Webhook Delivery** – When `callbacks.webhook` is set, the system posts results to the URL and records success or failure.  If posting fails, it retries with exponential backoff (max 3 attempts).

## 7. References

The final prompt used in a render job is constructed using meta tags for structure, voice and instrumentation【290562151583449†L313-L333】.  Best practices suggest keeping prompts concise and including BPM and mood as key factors【76184295849824†L412-L418】.  These guidelines influence how the composed prompt is packaged in the render job.
