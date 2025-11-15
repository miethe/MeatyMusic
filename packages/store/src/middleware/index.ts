/**
 * Store Middleware Exports
 *
 * Middleware for Zustand stores that can be composed together:
 * - localStorage: Persist state to localStorage with debouncing
 * - apiSync: Sync state to API with retries
 * - queryIntegration: React Query integration with optimistic updates
 * - multiTab: Synchronize state across browser tabs
 */

export {
  createLocalStorageMiddleware,
} from './localStorageMiddleware';

export {
  createApiSyncMiddleware,
} from './apiSyncMiddleware';

export {
  createQueryIntegrationMiddleware,
  type MutationHooks,
  type QueryIntegrationState,
  type QueryIntegrationActions,
  type QueryIntegrationStore,
} from './queryIntegrationMiddleware';

export {
  createMultiTabMiddleware,
} from './multiTabMiddleware';
