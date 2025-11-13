# WebSocket Integration Guide

Comprehensive guide to WebSocket-based real-time workflow event streaming in MeatyMusic AMCS.

## Table of Contents

1. [WebSocket Architecture](#websocket-architecture)
2. [useWorkflowWebSocket Hook](#useworkflowwebsocket-hook)
3. [Event Types and Handling](#event-types-and-handling)
4. [Connection Management](#connection-management)
5. [Integration with Stores](#integration-with-stores)
6. [Integration with React Query](#integration-with-react-query)
7. [Error Recovery](#error-recovery)
8. [Examples](#examples)
9. [Testing](#testing)

## WebSocket Architecture

MeatyMusic uses WebSocket for real-time workflow event streaming:

```
┌──────────────┐          WebSocket          ┌──────────────┐
│              │   ────────────────────►      │              │
│   Frontend   │   WorkflowEvent Stream       │    Backend   │
│              │   ◄────────────────────      │              │
└──────────────┘                              └──────────────┘
       │                                             │
       ├─ useWorkflowWebSocket hook                 ├─ FastAPI WebSocket
       ├─ Auto-reconnect logic                      ├─ Event broadcasting
       ├─ Event parsing & validation                ├─ Workflow monitoring
       └─ Store updates & cache invalidation        └─ Node status tracking
```

### Event Flow

```
1. Backend emits WorkflowEvent → WebSocket
2. useWorkflowWebSocket receives event
3. Event parsed and validated
4. workflowStore updated (node status, events)
5. React Query cache invalidated
6. Component re-renders with updated state
7. onEvent callback invoked (optional)
```

## useWorkflowWebSocket Hook

The primary hook for WebSocket integration.

**Location:** `hooks/useWorkflowWebSocket.ts`

### Basic Usage

```tsx
import { useWorkflowWebSocket } from '@/hooks';

function WorkflowPage() {
  const { isConnected, connectionError } = useWorkflowWebSocket({
    enabled: true,
  });

  return (
    <div>
      <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {connectionError && <div>Error: {connectionError}</div>}
    </div>
  );
}
```

### Hook Options

```typescript
interface UseWorkflowWebSocketOptions {
  enabled?: boolean;                        // Enable/disable connection
  reconnectDelay?: number;                  // Delay before reconnect (default: 3000ms)
  maxReconnectAttempts?: number;            // Max reconnect attempts (default: 5)
  onEvent?: (event: WorkflowEvent) => void; // Event handler callback
  onError?: (error: Error) => void;         // Error handler callback
  onConnect?: () => void;                   // Connection callback
  onDisconnect?: () => void;                // Disconnection callback
}
```

### Return Value

```typescript
interface UseWorkflowWebSocketReturn {
  isConnected: boolean;       // Connection status
  connectionError: string | null; // Connection error message
  disconnect: () => void;     // Manually disconnect
  reconnect: () => void;      // Manually reconnect
}
```

### Complete Example

```tsx
import { useWorkflowWebSocket } from '@/hooks';
import { useEffect } from 'react';

function WorkflowMonitor() {
  const {
    isConnected,
    connectionError,
    disconnect,
    reconnect,
  } = useWorkflowWebSocket({
    enabled: true,
    reconnectDelay: 3000,
    maxReconnectAttempts: 5,

    onEvent: (event) => {
      console.log('Workflow event:', event);

      // Custom event handling
      if (event.node_name === 'VALIDATE' && event.phase === 'end') {
        const scores = event.data?.scores;
        console.log('Validation scores:', scores);
      }
    },

    onError: (error) => {
      console.error('WebSocket error:', error);
    },

    onConnect: () => {
      console.log('WebSocket connected');
    },

    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
  });

  return (
    <div>
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {connectionError && (
        <div className="text-red-500">Error: {connectionError}</div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={reconnect}>Reconnect</button>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    </div>
  );
}
```

## Event Types and Handling

### WorkflowEvent Structure

```typescript
interface WorkflowEvent {
  ts: string;              // ISO 8601 timestamp
  run_id: string;          // Workflow run ID
  node_name?: string;      // Node name (undefined for run-level events)
  phase: 'start' | 'end' | 'fail'; // Event phase
  duration_ms?: number;    // Duration (for 'end' phase)
  data?: {                 // Event-specific data
    scores?: Record<string, number>;
    error_message?: string;
    artifacts?: Record<string, unknown>;
    // ... other fields
  };
  request_id: string;      // Request tracking ID
}
```

### Event Types

#### Run-Level Events

```typescript
// Workflow start
{
  ts: "2025-11-13T10:00:00Z",
  run_id: "run-123",
  node_name: undefined,
  phase: "start",
  data: { song_id: "song-456", global_seed: 12345 },
}

// Workflow completion
{
  ts: "2025-11-13T10:05:00Z",
  run_id: "run-123",
  node_name: undefined,
  phase: "end",
  duration_ms: 300000,
  data: { status: "completed" },
}

// Workflow failure
{
  ts: "2025-11-13T10:02:30Z",
  run_id: "run-123",
  node_name: undefined,
  phase: "fail",
  data: { error_message: "Workflow failed" },
}
```

#### Node-Level Events

```typescript
// Node start
{
  ts: "2025-11-13T10:00:05Z",
  run_id: "run-123",
  node_name: "STYLE",
  phase: "start",
  data: { node_index: 1 },
}

// Node completion
{
  ts: "2025-11-13T10:00:25Z",
  run_id: "run-123",
  node_name: "STYLE",
  phase: "end",
  duration_ms: 20000,
  data: {
    artifacts: { style_spec: {...} },
    scores: { completeness: 0.95 },
  },
}

// Node failure
{
  ts: "2025-11-13T10:00:15Z",
  run_id: "run-123",
  node_name: "STYLE",
  phase: "fail",
  data: { error_message: "Genre not found in blueprint" },
}
```

### Event Handling Patterns

#### Basic Event Handler

```tsx
useWorkflowWebSocket({
  enabled: true,
  onEvent: (event) => {
    console.log(`[${event.phase}] ${event.node_name || 'workflow'}`);
  },
});
```

#### Node-Specific Handlers

```tsx
useWorkflowWebSocket({
  enabled: true,
  onEvent: (event) => {
    switch (event.node_name) {
      case 'PLAN':
        if (event.phase === 'end') {
          console.log('Planning complete', event.data);
        }
        break;

      case 'VALIDATE':
        if (event.phase === 'end') {
          const scores = event.data?.scores;
          console.log('Validation scores:', scores);
        }
        break;

      case 'RENDER':
        if (event.phase === 'end') {
          console.log('Rendering complete', event.data?.artifacts);
        }
        break;
    }
  },
});
```

#### Phase-Specific Handlers

```tsx
useWorkflowWebSocket({
  enabled: true,
  onEvent: (event) => {
    switch (event.phase) {
      case 'start':
        console.log(`Starting ${event.node_name || 'workflow'}`);
        break;

      case 'end':
        console.log(
          `Completed ${event.node_name || 'workflow'} in ${event.duration_ms}ms`
        );
        break;

      case 'fail':
        console.error(
          `Failed ${event.node_name || 'workflow'}:`,
          event.data?.error_message
        );
        break;
    }
  },
});
```

#### Run-Level vs Node-Level

```tsx
useWorkflowWebSocket({
  enabled: true,
  onEvent: (event) => {
    if (!event.node_name) {
      // Run-level event
      if (event.phase === 'start') {
        console.log('Workflow started:', event.run_id);
      } else if (event.phase === 'end') {
        console.log('Workflow completed:', event.run_id);
      } else if (event.phase === 'fail') {
        console.error('Workflow failed:', event.data?.error_message);
      }
    } else {
      // Node-level event
      console.log(`Node ${event.node_name} ${event.phase}`);
    }
  },
});
```

## Connection Management

### Auto-Reconnect

The hook automatically reconnects with exponential backoff:

```tsx
useWorkflowWebSocket({
  enabled: true,
  reconnectDelay: 3000,        // Initial delay: 3s
  maxReconnectAttempts: 5,     // Try 5 times before giving up
});

// Reconnection schedule:
// Attempt 1: 3s delay
// Attempt 2: 3s delay
// Attempt 3: 3s delay
// Attempt 4: 3s delay
// Attempt 5: 3s delay
// After 5 attempts: connectionError set
```

### Manual Connection Control

```tsx
function ManualConnectionControl() {
  const { isConnected, disconnect, reconnect } = useWorkflowWebSocket({
    enabled: true,
  });

  return (
    <div>
      {isConnected ? (
        <button onClick={disconnect}>Disconnect</button>
      ) : (
        <button onClick={reconnect}>Connect</button>
      )}
    </div>
  );
}
```

### Conditional Connection

```tsx
function WorkflowPage({ hasActiveWorkflow }: { hasActiveWorkflow: boolean }) {
  // Only connect when workflow is active
  useWorkflowWebSocket({
    enabled: hasActiveWorkflow,
  });

  return <div>Workflow monitoring</div>;
}
```

### Connection Lifecycle

```tsx
function ConnectionLifecycle() {
  const [connectionLog, setConnectionLog] = useState<string[]>([]);

  useWorkflowWebSocket({
    enabled: true,

    onConnect: () => {
      setConnectionLog(log => [...log, 'Connected']);
    },

    onDisconnect: () => {
      setConnectionLog(log => [...log, 'Disconnected']);
    },

    onError: (error) => {
      setConnectionLog(log => [...log, `Error: ${error.message}`]);
    },
  });

  return (
    <div>
      <h3>Connection Log</h3>
      <ul>
        {connectionLog.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Integration with Stores

The WebSocket hook automatically updates the workflow store:

### Automatic Store Updates

```tsx
// No manual store updates needed
useWorkflowWebSocket({ enabled: true });

// Store is automatically updated with:
// - Node status changes
// - Run status changes
// - Event history
// - Connection state
```

### Reading from Store

```tsx
import { useWorkflowStore } from '@/stores';

function WorkflowStatus({ runId }: { runId: string }) {
  // Connect WebSocket
  useWorkflowWebSocket({ enabled: true });

  // Read from store (automatically updated)
  const run = useWorkflowStore(state => state.getRun(runId));

  return (
    <div>
      <div>Status: {run?.status}</div>
      <div>Current Node: {run?.currentNode}</div>
      <div>Events: {run?.events.length}</div>
    </div>
  );
}
```

### Store Update Flow

```
1. WebSocket receives event
   ↓
2. processEvent() called in hook
   ↓
3. Store actions called:
   - addEvent(runId, event)
   - updateNodeStatus(runId, nodeId, status)
   - updateRunStatus(runId, status)
   ↓
4. Components subscribed to store re-render
```

### Example: Node Status

```tsx
function NodeStatusIndicator({ runId, nodeId }: Props) {
  useWorkflowWebSocket({ enabled: true });

  const run = useWorkflowStore(state => state.getRun(runId));
  const nodeState = run?.nodes.get(nodeId);

  if (!nodeState) return <div>Pending</div>;

  return (
    <div>
      <StatusBadge status={nodeState.status} />
      {nodeState.durationMs && <span>{nodeState.durationMs}ms</span>}
      {nodeState.error && <span className="text-red-500">{nodeState.error}</span>}
    </div>
  );
}
```

## Integration with React Query

WebSocket events automatically invalidate React Query cache:

### Automatic Cache Invalidation

```tsx
useWorkflowWebSocket({ enabled: true });

// When events occur, relevant queries are invalidated:
// - Node 'end' event → invalidates workflows.detail(runId)
// - Run 'end' event → invalidates songs.detail(songId)
```

### Custom Invalidation

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/config';

function CustomInvalidation({ songId }: { songId: string }) {
  const queryClient = useQueryClient();

  useWorkflowWebSocket({
    enabled: true,
    onEvent: (event) => {
      // Custom invalidation logic
      if (event.node_name === 'STYLE' && event.phase === 'end') {
        // Refetch style data
        queryClient.invalidateQueries({
          queryKey: queryKeys.styles.lists(),
        });
      }

      if (event.phase === 'end' && !event.node_name) {
        // Workflow completed - refetch song
        queryClient.invalidateQueries({
          queryKey: queryKeys.songs.detail(songId),
        });
      }
    },
  });
}
```

### Combined Store + Query Pattern

```tsx
function WorkflowMonitor({ songId }: { songId: string }) {
  const queryClient = useQueryClient();

  // WebSocket connection
  useWorkflowWebSocket({
    enabled: true,
    onEvent: (event) => {
      // Custom logic when workflow completes
      if (event.phase === 'end' && !event.node_name) {
        // Refetch song data
        queryClient.invalidateQueries({
          queryKey: queryKeys.songs.detail(songId),
        });

        // Show success toast
        useUIStore.getState().addToast(
          'Workflow completed successfully',
          'success'
        );
      }
    },
  });

  // Read from store (real-time)
  const run = useWorkflowStore(state => state.getRunBySongId(songId));

  // Read from query (server data)
  const { data: song } = useSong(songId);

  return (
    <div>
      <h1>{song?.title}</h1>
      <div>Workflow Status: {run?.status}</div>
    </div>
  );
}
```

## Error Recovery

### Connection Errors

```tsx
function ErrorRecovery() {
  const { connectionError, reconnect } = useWorkflowWebSocket({
    enabled: true,
    maxReconnectAttempts: 5,

    onError: (error) => {
      console.error('WebSocket error:', error);
      // Log to monitoring service
      logError('websocket_error', error);
    },
  });

  if (connectionError) {
    return (
      <div className="bg-red-100 p-4 rounded">
        <p>Connection failed: {connectionError}</p>
        <button onClick={reconnect}>Retry Connection</button>
      </div>
    );
  }

  return <div>Connected</div>;
}
```

### Parse Errors

```tsx
useWorkflowWebSocket({
  enabled: true,
  onError: (error) => {
    if (error.message.includes('parse')) {
      console.error('Failed to parse WebSocket message');
      // Message format error - log for debugging
    }
  },
});
```

### Graceful Degradation

```tsx
function WorkflowWithFallback({ runId }: { runId: string }) {
  const { isConnected } = useWorkflowWebSocket({ enabled: true });

  // Fallback: Poll API when WebSocket disconnected
  const { data: run } = useWorkflowRun(runId, {
    refetchInterval: isConnected ? false : 5000, // Poll every 5s if disconnected
  });

  return (
    <div>
      {!isConnected && (
        <div className="bg-yellow-100 p-2">
          Real-time updates unavailable. Polling API instead.
        </div>
      )}
      <WorkflowStatus run={run} />
    </div>
  );
}
```

## Examples

### Complete Workflow Monitor

```tsx
import { useWorkflowWebSocket } from '@/hooks';
import { useWorkflowStore } from '@/stores';
import { useSong, useStartWorkflow, useCancelWorkflow } from '@/hooks/api';

function CompleteWorkflowMonitor({ songId }: { songId: string }) {
  const { data: song } = useSong(songId);
  const startWorkflow = useStartWorkflow();
  const cancelWorkflow = useCancelWorkflow();

  // Connect WebSocket
  const { isConnected } = useWorkflowWebSocket({
    enabled: true,
    onEvent: (event) => {
      console.log('Event:', event);
    },
  });

  // Read workflow state
  const run = useWorkflowStore(state => state.getRunBySongId(songId));

  const handleStart = () => {
    startWorkflow.mutate({
      song_id: songId,
      global_seed: Math.floor(Math.random() * 1000000),
    });
  };

  const handleCancel = () => {
    if (run) {
      cancelWorkflow.mutate(songId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>{song?.title}</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {!run ? (
        <button onClick={handleStart} disabled={startWorkflow.isPending}>
          {startWorkflow.isPending ? 'Starting...' : 'Start Workflow'}
        </button>
      ) : (
        <div>
          <div className="mb-4">
            <div className="text-lg font-semibold">
              Status: {run.status}
            </div>
            <div className="text-sm text-gray-600">
              Current Node: {run.currentNode || 'None'}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Nodes:</h3>
            {Array.from(run.nodes.entries()).map(([nodeId, nodeState]) => (
              <div key={nodeId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <StatusBadge status={nodeState.status} />
                <span>{nodeId}</span>
                {nodeState.durationMs && (
                  <span className="text-sm text-gray-600">
                    {nodeState.durationMs}ms
                  </span>
                )}
              </div>
            ))}
          </div>

          {run.status === 'running' && (
            <button onClick={handleCancel} className="mt-4">
              Cancel Workflow
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Event Log Display

```tsx
function EventLog({ runId }: { runId: string }) {
  useWorkflowWebSocket({ enabled: true });

  const run = useWorkflowStore(state => state.getRun(runId));
  const events = run?.events || [];

  return (
    <div className="max-h-96 overflow-y-auto">
      <h3 className="font-medium mb-2">Event Log</h3>
      <div className="space-y-1">
        {events.map((event, i) => (
          <div key={i} className="text-sm font-mono p-2 bg-gray-50 rounded">
            <span className="text-gray-500">
              {new Date(event.ts).toLocaleTimeString()}
            </span>
            {' - '}
            <span className="font-semibold">
              {event.node_name || 'workflow'}
            </span>
            {' '}
            <span className={getPhaseColor(event.phase)}>
              {event.phase}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing

### Mocking WebSocket

```tsx
import { renderHook } from '@testing-library/react';
import { useWorkflowWebSocket } from '@/hooks';

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  close: jest.fn(),
}));

test('useWorkflowWebSocket connects', () => {
  const { result } = renderHook(() =>
    useWorkflowWebSocket({ enabled: true })
  );

  expect(global.WebSocket).toHaveBeenCalledWith(
    expect.stringContaining('ws://')
  );
});
```

### Testing Event Handling

```tsx
test('handles workflow events', async () => {
  const onEvent = jest.fn();
  const ws = new WebSocket('ws://localhost');

  renderHook(() =>
    useWorkflowWebSocket({
      enabled: true,
      onEvent,
    })
  );

  // Simulate event
  const event = {
    ts: new Date().toISOString(),
    run_id: 'run-123',
    node_name: 'STYLE',
    phase: 'end',
    data: {},
  };

  ws.onmessage({ data: JSON.stringify(event) });

  expect(onEvent).toHaveBeenCalledWith(event);
});
```

## See Also

- [State Management Guide](./STATE_MANAGEMENT.md) - Store integration
- [Component Usage Guide](./COMPONENTS.md) - Workflow components
- [Development Guide](./DEVELOPMENT.md) - Development workflow

## References

- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- Wave 3 Implementation: `apps/web/docs/WAVE3_USAGE_GUIDE.md`
- Architecture: `.claude/context/phase5-frontend-architecture.md`
