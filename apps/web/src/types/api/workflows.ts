/**
 * MeatyMusic AMCS Workflow Types
 * Generated from backend Pydantic schemas
 *
 * Workflow execution and orchestration types for Claude Code skills.
 * Backend: services/api/app/schemas/song.py, app/workflows/
 */

import type { ISODateTime, UUID } from './entities';

/**
 * Workflow Run Status
 * Backend: app/schemas/song.py - WorkflowRunStatus enum
 */
export enum WorkflowRunStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Workflow Node Names
 * Backend: app/schemas/song.py - WorkflowNode enum
 */
export enum WorkflowNode {
  PLAN = 'PLAN',
  STYLE = 'STYLE',
  LYRICS = 'LYRICS',
  PRODUCER = 'PRODUCER',
  COMPOSE = 'COMPOSE',
  VALIDATE = 'VALIDATE',
  FIX = 'FIX',
  RENDER = 'RENDER',
  REVIEW = 'REVIEW',
}

/**
 * Workflow run base fields
 * Backend: app/schemas/song.py - WorkflowRunBase
 */
export interface WorkflowRunBase {
  song_id: UUID;
  run_id: UUID;
  status?: WorkflowRunStatus;
  current_node?: WorkflowNode;
  node_outputs?: Record<string, unknown>;
  event_stream?: Array<Record<string, unknown>>;
  validation_scores?: Record<string, number>;
  fix_iterations?: number; // 0-3
  error?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
}

/**
 * Workflow run creation request
 * Backend: app/schemas/song.py - WorkflowRunCreate
 */
export interface WorkflowRunCreate extends WorkflowRunBase {}

/**
 * Workflow run update request (all fields optional)
 * Backend: app/schemas/song.py - WorkflowRunUpdate
 */
export interface WorkflowRunUpdate {
  status?: WorkflowRunStatus;
  current_node?: WorkflowNode;
  node_outputs?: Record<string, unknown>;
  event_stream?: Array<Record<string, unknown>>;
  validation_scores?: Record<string, number>;
  fix_iterations?: number;
  error?: Record<string, unknown>;
  extra_metadata?: Record<string, unknown>;
}

/**
 * Workflow run response with database fields
 * Backend: app/schemas/song.py - WorkflowRunResponse
 */
export interface WorkflowRun extends WorkflowRunBase {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime;
}

/**
 * Node output update request
 * Backend: app/schemas/common.py - NodeOutputUpdate
 */
export interface NodeOutputUpdate {
  node: string;
  output: Record<string, unknown>;
  artifacts?: Record<string, unknown>;
  scores?: Record<string, unknown>;
  citations?: Array<Record<string, unknown>>;
  error?: string;
}

/**
 * Status update request
 * Backend: app/schemas/common.py - StatusUpdateRequest
 */
export interface StatusUpdateRequest {
  status: string;
}

/**
 * Workflow Execution Request
 * Request to execute workflow for a song
 */
export interface WorkflowExecutionRequest {
  song_id: UUID;
  global_seed?: number;
  skip_nodes?: WorkflowNode[];
  feature_flags?: Record<string, boolean>;
}

/**
 * Workflow Execution Response
 * Initial response when workflow starts
 */
export interface WorkflowExecutionResponse {
  run_id: UUID;
  song_id: UUID;
  status: WorkflowRunStatus;
  started_at: ISODateTime;
}

/**
 * Workflow Progress
 * Real-time progress tracking for UI
 */
export interface WorkflowProgress {
  run_id: UUID;
  song_id: UUID;
  status: WorkflowRunStatus;
  current_node?: WorkflowNode;
  completed_nodes: WorkflowNode[];
  failed_nodes: WorkflowNode[];
  total_nodes: number;
  progress_percentage: number; // 0-100
  estimated_completion?: ISODateTime;
}

/**
 * Node Execution Result
 * Result from a single node execution
 */
export interface NodeExecutionResult {
  node: WorkflowNode;
  status: 'success' | 'failed' | 'skipped';
  duration_ms: number;
  output?: Record<string, unknown>;
  artifacts?: Record<string, unknown>;
  scores?: Record<string, number>;
  citations?: Array<{
    source_id: string;
    chunk_hash: string;
    weight: number;
  }>;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Validation Scores
 * Scores from VALIDATE node
 */
export interface ValidationScores {
  hook_density: number;
  singability: number;
  rhyme_tightness: number;
  section_completeness: number;
  profanity_score: number;
  total: number;
  passed: boolean;
}

/**
 * Fix Iteration
 * Auto-fix iteration details
 */
export interface FixIteration {
  iteration: number; // 1-3
  target_metric: string;
  fixes_applied: string[];
  scores_before: ValidationScores;
  scores_after: ValidationScores;
  improved: boolean;
}

/**
 * Workflow Summary
 * Complete workflow execution summary
 */
export interface WorkflowSummary {
  run_id: UUID;
  song_id: UUID;
  status: WorkflowRunStatus;
  started_at: ISODateTime;
  completed_at?: ISODateTime;
  duration_ms?: number;
  nodes_executed: NodeExecutionResult[];
  validation_scores?: ValidationScores;
  fix_iterations?: FixIteration[];
  final_artifacts?: {
    style?: Record<string, unknown>;
    lyrics?: Record<string, unknown>;
    producer_notes?: Record<string, unknown>;
    composed_prompt?: string;
  };
  render_job_id?: UUID;
  error?: {
    node: WorkflowNode;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
