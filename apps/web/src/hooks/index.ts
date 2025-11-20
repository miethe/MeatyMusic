/**
 * Hooks Index
 * Central export for all custom React hooks
 */

// Utility hooks
export { useAuth, useIsAdmin } from './useAuth';
export { useDebounce } from './useDebounce';
export { useTelemetry } from './useTelemetry';
export { useToast } from './useToast';
export { useAutoSave } from './useAutoSave';
export type { AutoSaveState, UseAutoSaveOptions } from './useAutoSave';

// WebSocket hook
export { useWorkflowWebSocket } from './useWorkflowWebSocket';
export type { UseWorkflowWebSocketOptions, UseWorkflowWebSocketReturn } from './useWorkflowWebSocket';

// API hooks (re-export from api/index)
export * from './api';
