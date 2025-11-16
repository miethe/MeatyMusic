/**
 * Store Synchronization Hook
 * Phase 3, Task 3.2 - WebSocket Store Sync Hook
 *
 * Synchronizes Zustand stores with WebSocket events and React Query cache.
 * Provides automatic invalidation and updates when workflow events occur.
 *
 * Features:
 * - Auto-subscribe to workflow events for a specific run
 * - Invalidate React Query cache on workflow completion
 * - Update entity stores when entities are generated
 * - Update workflow store with real-time progress
 * - Automatic cleanup to prevent memory leaks
 *
 * Architecture: Section 4.2.3 - Store Sync Integration
 *
 * @example
 * ```tsx
 * // In a workflow details page
 * function WorkflowDetailsPage({ runId }: { runId: string }) {
 *   useStoreSync(runId); // That's it! Handles all sync automatically
 *
 *   return <WorkflowProgress runId={runId} />;
 * }
 * ```
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEntitiesStore, useSongsStore } from '@meatymusic/store';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { queryKeys } from '@/lib/query/config';
import type { WorkflowEvent, NodeCompletedEvent } from '@/types/api/events';
import { WorkflowNode } from '@/types/api';

/**
 * Hook options
 */
export interface UseStoreSyncOptions {
  /**
   * Enable/disable store synchronization (default: true)
   * Useful for disabling sync in certain scenarios (e.g., tests)
   */
  enabled?: boolean;

  /**
   * Enable toast notifications for workflow completion/failure (default: false)
   * Set to false since useWorkflowEvents already handles notifications
   */
  enableNotifications?: boolean;

  /**
   * Maximum number of events to keep in memory (default: 1000)
   */
  maxEvents?: number;

  /**
   * Debug mode - logs all sync operations (default: false)
   */
  debug?: boolean;
}

/**
 * Store Sync Hook
 *
 * Subscribes to WebSocket events for a specific workflow run and synchronizes:
 * - React Query cache (invalidation on completion)
 * - Workflow store (node status, progress)
 * - Entity stores (when entities are generated)
 * - Songs store (when workflow completes)
 *
 * @param runId - Workflow run UUID to sync
 * @param options - Hook configuration options
 *
 * @example
 * ```tsx
 * // Basic usage - auto-sync everything
 * useStoreSync(runId);
 *
 * // With custom options
 * useStoreSync(runId, {
 *   enableNotifications: true,
 *   debug: process.env.NODE_ENV === 'development',
 * });
 * ```
 */
export function useStoreSync(runId: string, options: UseStoreSyncOptions = {}) {
  const {
    enabled = true,
    enableNotifications = false, // Disabled by default since useWorkflowEvents handles it
    maxEvents = 1000,
    debug = false,
  } = options;

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Track if we've processed run completion (prevent duplicate invalidations)
  const hasProcessedCompletionRef = useRef(false);

  /**
   * Log debug message
   */
  const log = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      if (!debug) return;

      console.log('[useStoreSync]', {
        timestamp: new Date().toISOString(),
        runId,
        message,
        ...data,
      });
    },
    [debug, runId]
  );

  /**
   * Handle entity generation events
   * Updates entity stores and invalidates entity queries
   */
  const handleEntityGenerated = useCallback(
    (event: NodeCompletedEvent) => {
      const { node_name } = event;

      // Map workflow nodes to entity types
      const entityTypeMap: Record<string, 'style' | 'lyrics' | 'persona' | 'producerNotes'> = {
        [WorkflowNode.STYLE]: 'style',
        [WorkflowNode.LYRICS]: 'lyrics',
        // PLAN, PRODUCER, etc. may generate other entities in the future
      };

      const entityType = entityTypeMap[node_name];

      if (!entityType) {
        log('Node completed but no entity mapping', { node_name });
        return;
      }

      log('Entity generated', { entityType, node_name });

      // Invalidate entity cache to force refetch
      useEntitiesStore.getState().invalidateEntityType(entityType);

      // Invalidate React Query cache for this entity type
      switch (entityType) {
        case 'style':
          queryClient.invalidateQueries({ queryKey: queryKeys.styles.all });
          break;
        case 'lyrics':
          queryClient.invalidateQueries({ queryKey: queryKeys.lyrics.all });
          break;
        case 'persona':
          queryClient.invalidateQueries({ queryKey: queryKeys.personas.all });
          break;
        case 'producerNotes':
          queryClient.invalidateQueries({ queryKey: queryKeys.producerNotes.all });
          break;
      }

      log('Entity cache invalidated', { entityType });
    },
    [queryClient, log]
  );

  /**
   * Handle run completion events
   * Invalidates songs and workflows queries
   */
  const handleRunCompleted = useCallback(
    (event: WorkflowEvent) => {
      // Prevent duplicate processing
      if (hasProcessedCompletionRef.current) {
        log('Run completion already processed, skipping');
        return;
      }

      hasProcessedCompletionRef.current = true;

      const { data: eventData } = event;
      const songId = (eventData as any)?.song_id;

      log('Run completed', { songId });

      // Invalidate songs cache (workflow may have updated song)
      useSongsStore.getState().invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.all });

      // Invalidate specific song if we have songId
      if (songId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.songs.detail(songId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.songs.entities(songId) });
        log('Song cache invalidated', { songId });
      }

      // Invalidate workflow queries
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(runId) });

      log('Workflow cache invalidated', { runId });
    },
    [queryClient, runId, log]
  );

  /**
   * Handle run failure events
   * Similar to completion but marks as failed
   */
  const handleRunFailed = useCallback(
    (event: WorkflowEvent) => {
      // Prevent duplicate processing
      if (hasProcessedCompletionRef.current) {
        log('Run failure already processed, skipping');
        return;
      }

      hasProcessedCompletionRef.current = true;

      const { data: eventData } = event;
      const songId = (eventData as any)?.song_id;

      log('Run failed', { songId, error: (eventData as any)?.error_message });

      // Invalidate caches (same as completion)
      useSongsStore.getState().invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.all });

      if (songId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.songs.detail(songId) });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(runId) });

      log('Caches invalidated after failure', { runId });
    },
    [queryClient, runId, log]
  );

  /**
   * Process workflow event
   * Routes event to appropriate handler based on event type
   */
  const processEvent = useCallback(
    (event: WorkflowEvent) => {
      const { node_name, phase } = event;

      log('Processing event', { node_name, phase });

      // Run-level completion
      if (!node_name && phase === 'end') {
        handleRunCompleted(event);
        return;
      }

      // Run-level failure
      if (!node_name && phase === 'fail') {
        handleRunFailed(event);
        return;
      }

      // Node-level completion (entity generation)
      if (node_name && phase === 'end') {
        handleEntityGenerated(event as NodeCompletedEvent);
      }

      // Note: Node-level updates (start, fail) are already handled by useWorkflowEvents
      // which updates the workflow store directly
    },
    [handleRunCompleted, handleRunFailed, handleEntityGenerated, log]
  );

  /**
   * Subscribe to workflow events using existing useWorkflowEvents hook
   * This hook handles WebSocket connection, event accumulation, and store updates
   */
  const { events, isLoading, error } = useWorkflowEvents(runId, {
    enabled,
    maxEvents,
    onEvent: processEvent,
    enableNotifications,
  });

  /**
   * Reset completion flag when runId changes
   */
  useEffect(() => {
    hasProcessedCompletionRef.current = false;
    log('Reset completion flag for new runId', { runId });
  }, [runId, log]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      log('useStoreSync cleanup');
    };
  }, [log]);

  // Return useful state for debugging/monitoring
  return {
    /**
     * Current event count
     */
    eventCount: events.length,

    /**
     * WebSocket connection loading state
     */
    isLoading,

    /**
     * WebSocket connection error
     */
    error,

    /**
     * Whether run completion has been processed
     */
    hasProcessedCompletion: hasProcessedCompletionRef.current,
  };
}

/**
 * Global Store Sync Hook
 *
 * Subscribes to global workflow events (not tied to a specific run).
 * Useful for dashboard pages that need to react to any workflow completion.
 *
 * NOTE: This is a placeholder for future implementation.
 * Currently, we use run-specific sync with useStoreSync(runId).
 *
 * @example
 * ```tsx
 * // In a dashboard that shows all workflows
 * function WorkflowsDashboard() {
 *   useGlobalStoreSync(); // Syncs all workflow events
 *
 *   const { data: workflows } = useWorkflowsWithStore();
 *   return <WorkflowsList workflows={workflows} />;
 * }
 * ```
 */
export function useGlobalStoreSync(options: UseStoreSyncOptions = {}) {
  const { enabled = true, debug = false } = options;

  const queryClient = useQueryClient();

  const log = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      if (!debug) return;

      console.log('[useGlobalStoreSync]', {
        timestamp: new Date().toISOString(),
        message,
        ...data,
      });
    },
    [debug]
  );

  useEffect(() => {
    if (!enabled) return;

    log('Global store sync initialized');

    // TODO: Implement global event subscription
    // This would subscribe to a global WebSocket channel that broadcasts
    // all workflow events across all runs, allowing dashboard-level sync.
    //
    // For now, this is a placeholder. The actual implementation would:
    // 1. Connect to global WebSocket channel (e.g., /events/global)
    // 2. Filter events by type (run-completed, entity-generated, etc.)
    // 3. Invalidate appropriate caches based on event type
    // 4. Update stores as needed
    //
    // Example structure:
    // const client = getWebSocketClient();
    // const unsubscribe = client.subscribeGlobal((event) => {
    //   if (event.type === 'run-completed') {
    //     useSongsStore.getState().invalidate();
    //     queryClient.invalidateQueries({ queryKey: queryKeys.songs.all });
    //   }
    // });
    //
    // return () => {
    //   unsubscribe();
    // };

    return () => {
      log('Global store sync cleanup');
    };
  }, [enabled, log, queryClient]);

  return {
    isEnabled: enabled,
  };
}
