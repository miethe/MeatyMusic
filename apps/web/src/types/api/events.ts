/**
 * MeatyMusic AMCS WebSocket Event Types
 * Generated from backend event system
 *
 * WebSocket event types for real-time workflow monitoring.
 * Backend: services/api/app/workflows/events.py
 */

import type { ISODateTime, UUID } from './entities';
import { WorkflowNode } from './workflows';

/**
 * Event Phase
 * Lifecycle phase of the event
 */
export type EventPhase = 'start' | 'end' | 'fail' | 'info';

/**
 * Base Event Structure
 * All workflow events follow this envelope structure
 * Backend: app/workflows/events.py - EventPublisher.publish_event
 */
export interface WorkflowEvent {
  event_id: UUID;
  run_id: UUID;
  timestamp: ISODateTime;
  node_name: WorkflowNode | null; // null for run-level events
  phase: EventPhase;
  metrics: Record<string, unknown>;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    code?: string;
    field?: string;
  }>;
  data: Record<string, unknown>;
}

/**
 * Run Started Event
 * Emitted when workflow run starts
 */
export interface RunStartedEvent extends WorkflowEvent {
  node_name: null;
  phase: 'start';
  data: {
    song_id: UUID;
    global_seed: number;
    total_nodes: number;
    skip_nodes?: WorkflowNode[];
  };
}

/**
 * Run Completed Event
 * Emitted when workflow run completes successfully
 */
export interface RunCompletedEvent extends WorkflowEvent {
  node_name: null;
  phase: 'end';
  metrics: {
    duration_ms: number;
    nodes_executed: number;
    fix_iterations: number;
    validation_passed: boolean;
  };
  data: {
    song_id: UUID;
    final_status: 'validated' | 'rendered';
    artifacts_generated: string[];
  };
}

/**
 * Run Failed Event
 * Emitted when workflow run fails
 */
export interface RunFailedEvent extends WorkflowEvent {
  node_name: null;
  phase: 'fail';
  data: {
    song_id: UUID;
    failed_node: WorkflowNode;
    error_code: string;
    error_message: string;
    error_details?: Record<string, unknown>;
  };
}

/**
 * Node Started Event
 * Emitted when a workflow node starts execution
 */
export interface NodeStartedEvent extends WorkflowEvent {
  node_name: WorkflowNode;
  phase: 'start';
  data: {
    seed: number;
    inputs?: Record<string, unknown>;
  };
}

/**
 * Node Completed Event
 * Emitted when a workflow node completes successfully
 */
export interface NodeCompletedEvent extends WorkflowEvent {
  node_name: WorkflowNode;
  phase: 'end';
  metrics: {
    duration_ms: number;
    output_size_bytes?: number;
    citations_count?: number;
  };
  data: {
    output: Record<string, unknown>;
    artifacts?: Record<string, unknown>;
    scores?: Record<string, number>;
    citations?: Array<{
      source_id: string;
      chunk_hash: string;
      weight: number;
    }>;
  };
}

/**
 * Node Failed Event
 * Emitted when a workflow node fails
 */
export interface NodeFailedEvent extends WorkflowEvent {
  node_name: WorkflowNode;
  phase: 'fail';
  data: {
    error_code: string;
    error_message: string;
    error_details?: Record<string, unknown>;
    retry_count?: number;
  };
}

/**
 * Node Info Event
 * Emitted for informational updates during node execution
 */
export interface NodeInfoEvent extends WorkflowEvent {
  node_name: WorkflowNode;
  phase: 'info';
  data: {
    message: string;
    progress_percentage?: number;
    substep?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Validation Event
 * Emitted by VALIDATE node with detailed scores
 */
export interface ValidationEvent extends Omit<NodeCompletedEvent, 'data'> {
  node_name: WorkflowNode.VALIDATE;
  data: {
    output: {
      passed: boolean;
      total_score: number;
      threshold: number;
    };
    artifacts?: Record<string, unknown>;
    scores?: {
      hook_density: number;
      singability: number;
      rhyme_tightness: number;
      section_completeness: number;
      profanity_score: number;
    };
    citations?: Array<{
      source_id: string;
      chunk_hash: string;
      weight: number;
    }>;
    issues?: Array<{
      metric: string;
      score: number;
      threshold: number;
      failed: boolean;
    }>;
  };
}

/**
 * Fix Event
 * Emitted by FIX node with fix iteration details
 */
export interface FixEvent extends Omit<NodeCompletedEvent, 'data'> {
  node_name: WorkflowNode.FIX;
  data: {
    output: {
      iteration: number; // 1-3
      target_metric: string;
      fixes_applied: string[];
      improved: boolean;
    };
    artifacts?: Record<string, unknown>;
    scores?: {
      before: Record<string, number>;
      after: Record<string, number>;
      delta: Record<string, number>;
    };
    citations?: Array<{
      source_id: string;
      chunk_hash: string;
      weight: number;
    }>;
  };
}

/**
 * Render Event
 * Emitted by RENDER node with render job details
 */
export interface RenderEvent extends Omit<NodeCompletedEvent, 'data'> {
  node_name: WorkflowNode.RENDER;
  data: {
    output: {
      job_id: UUID;
      engine: string;
      model?: string;
      variations: number;
      status: 'queued' | 'rendering' | 'completed' | 'failed';
    };
    artifacts?: {
      audio_urls?: string[];
      metadata?: Record<string, unknown>;
    };
    scores?: Record<string, number>;
    citations?: Array<{
      source_id: string;
      chunk_hash: string;
      weight: number;
    }>;
  };
}

/**
 * Union type of all event types
 */
export type WorkflowEventType =
  | RunStartedEvent
  | RunCompletedEvent
  | RunFailedEvent
  | NodeStartedEvent
  | NodeCompletedEvent
  | NodeFailedEvent
  | NodeInfoEvent
  | ValidationEvent
  | FixEvent
  | RenderEvent;

/**
 * Event Handler Function Type
 * For subscribing to events
 */
export type EventHandler<T extends WorkflowEvent = WorkflowEvent> = (event: T) => void;

/**
 * WebSocket Connection State
 */
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * WebSocket Subscription
 * Represents an active WebSocket subscription to workflow events
 */
export interface WorkflowSubscription {
  run_id: UUID;
  state: WebSocketState;
  connected_at?: ISODateTime;
  disconnected_at?: ISODateTime;
  error?: string;
  events_received: number;
}
