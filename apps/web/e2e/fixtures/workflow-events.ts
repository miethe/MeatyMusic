/**
 * Mock Workflow Events for E2E Testing
 *
 * Provides realistic workflow event sequences for testing.
 * Phase 5, Task 5.1
 */

export interface WorkflowEvent {
  ts: string;
  run_id: string;
  node: string;
  phase: 'start' | 'end' | 'fail' | 'progress';
  duration_ms?: number;
  metrics?: Record<string, any>;
  issues?: string[];
  data?: any;
}

/**
 * Generate a complete workflow event sequence
 */
export function generateWorkflowEvents(runId: string): WorkflowEvent[] {
  const baseTime = new Date('2025-11-15T10:00:00Z').getTime();

  return [
    // PLAN node
    {
      ts: new Date(baseTime).toISOString(),
      run_id: runId,
      node: 'PLAN',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 2000).toISOString(),
      run_id: runId,
      node: 'PLAN',
      phase: 'end',
      duration_ms: 2000,
      metrics: { sections_count: 4 },
    },

    // STYLE node
    {
      ts: new Date(baseTime + 2100).toISOString(),
      run_id: runId,
      node: 'STYLE',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 5000).toISOString(),
      run_id: runId,
      node: 'STYLE',
      phase: 'end',
      duration_ms: 2900,
      metrics: { tags_count: 8, bpm: 120, key: 'C major' },
    },

    // LYRICS node
    {
      ts: new Date(baseTime + 5100).toISOString(),
      run_id: runId,
      node: 'LYRICS',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 12000).toISOString(),
      run_id: runId,
      node: 'LYRICS',
      phase: 'end',
      duration_ms: 6900,
      metrics: { lines_count: 32, rhyme_score: 0.85 },
    },

    // PRODUCER node
    {
      ts: new Date(baseTime + 12100).toISOString(),
      run_id: runId,
      node: 'PRODUCER',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 16000).toISOString(),
      run_id: runId,
      node: 'PRODUCER',
      phase: 'end',
      duration_ms: 3900,
      metrics: { arrangement_complexity: 0.7 },
    },

    // COMPOSE node
    {
      ts: new Date(baseTime + 16100).toISOString(),
      run_id: runId,
      node: 'COMPOSE',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 18000).toISOString(),
      run_id: runId,
      node: 'COMPOSE',
      phase: 'end',
      duration_ms: 1900,
      metrics: { prompt_length: 3200 },
    },

    // VALIDATE node
    {
      ts: new Date(baseTime + 18100).toISOString(),
      run_id: runId,
      node: 'VALIDATE',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 20000).toISOString(),
      run_id: runId,
      node: 'VALIDATE',
      phase: 'end',
      duration_ms: 1900,
      metrics: {
        hook_density: 0.92,
        singability: 0.88,
        rhyme_tightness: 0.85,
        total: 0.88,
      },
    },

    // REVIEW node (final)
    {
      ts: new Date(baseTime + 20100).toISOString(),
      run_id: runId,
      node: 'REVIEW',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 21000).toISOString(),
      run_id: runId,
      node: 'REVIEW',
      phase: 'end',
      duration_ms: 900,
      data: {
        status: 'completed',
        artifacts: {
          style_spec: { id: 'style-1' },
          lyrics: { id: 'lyrics-1' },
          producer_notes: { id: 'producer-1' },
          composed_prompt: { id: 'prompt-1' },
        },
      },
    },
  ];
}

/**
 * Generate workflow events with a failure
 */
export function generateFailedWorkflowEvents(runId: string): WorkflowEvent[] {
  const baseTime = new Date('2025-11-15T10:00:00Z').getTime();

  return [
    {
      ts: new Date(baseTime).toISOString(),
      run_id: runId,
      node: 'PLAN',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 2000).toISOString(),
      run_id: runId,
      node: 'PLAN',
      phase: 'end',
      duration_ms: 2000,
    },
    {
      ts: new Date(baseTime + 2100).toISOString(),
      run_id: runId,
      node: 'STYLE',
      phase: 'start',
    },
    {
      ts: new Date(baseTime + 5000).toISOString(),
      run_id: runId,
      node: 'STYLE',
      phase: 'fail',
      duration_ms: 2900,
      issues: ['Failed to generate valid style spec: conflicting tags detected'],
    },
  ];
}

/**
 * Generate a stream of events with delays
 */
export async function* streamWorkflowEvents(
  events: WorkflowEvent[],
  delayMs: number = 100
): AsyncGenerator<WorkflowEvent> {
  for (const event of events) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield event;
  }
}

/**
 * Generate rapid events for performance testing
 */
export function generateRapidEvents(runId: string, count: number): WorkflowEvent[] {
  const baseTime = Date.now();
  const events: WorkflowEvent[] = [];

  for (let i = 0; i < count; i++) {
    events.push({
      ts: new Date(baseTime + i * 10).toISOString(),
      run_id: runId,
      node: 'LYRICS',
      phase: 'progress',
      metrics: { lines_generated: i + 1 },
    });
  }

  return events;
}
