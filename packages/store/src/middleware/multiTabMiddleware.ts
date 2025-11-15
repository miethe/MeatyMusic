import type { StateCreator } from 'zustand';

/**
 * Internal state added by multi-tab middleware
 * @internal
 */
interface MultiTabSyncState {
  /** Timestamp of last state change, used to prevent stale syncs */
  _lastSyncTimestamp?: number;
}

/**
 * Complete store type including multi-tab sync state
 */
type MultiTabStore<T> = T & MultiTabSyncState;

/**
 * Strategy for merging state from other tabs
 * - 'replace': Incoming state completely replaces current state (default)
 * - 'merge': Shallow merge, incoming state wins for conflicts
 * - Custom function: Full control over merge logic
 */
type MergeStrategy<T> = 'replace' | 'merge' | ((incoming: T, current: T) => T);

/**
 * Configuration options for multi-tab middleware
 */
interface MultiTabOptions<T> {
  /**
   * How to merge incoming state from other tabs with current state
   * @default 'replace'
   */
  mergeStrategy?: MergeStrategy<T>;
}

/**
 * Creates middleware that synchronizes Zustand store state across browser tabs
 *
 * **Features:**
 * - Detects localStorage changes from other tabs via storage events
 * - Configurable merge strategies for handling conflicts
 * - Timestamp-based staleness detection to prevent race conditions
 * - Preserves middleware methods (functions) during sync
 * - SSR-safe (no-op when window is unavailable)
 * - Prevents infinite sync loops
 *
 * **How It Works:**
 *
 * 1. When state changes in Tab A:
 *    - Timestamp is added to state update
 *    - localStorage middleware (if present) persists state
 *
 * 2. Browser fires 'storage' event in Tab B (not Tab A)
 *
 * 3. Tab B's multi-tab middleware:
 *    - Parses incoming state from localStorage
 *    - Checks timestamp to skip stale updates
 *    - Merges incoming state per merge strategy
 *    - Preserves functions (middleware methods)
 *    - Updates store state
 *
 * **Merge Strategies:**
 *
 * - `'replace'` (default): Incoming state completely replaces current state
 *   - Use when you want other tabs to exactly mirror changes
 *   - Simple and predictable
 *
 * - `'merge'`: Shallow merge where incoming state wins conflicts
 *   - Use when different parts of state might change in different tabs
 *   - Preserves unrelated local state
 *
 * - Custom function: `(incoming, current) => merged`
 *   - Full control over merge logic
 *   - Can implement deep merging, field-specific rules, etc.
 *
 * **Usage with Middleware Stack:**
 *
 * Multi-tab sync should be composed INSIDE localStorage middleware:
 *
 * ```typescript
 * const withMiddleware = (config: StateCreator<MyStore>) =>
 *   createLocalStorageMiddleware('my-store')(
 *     createMultiTabMiddleware<MyStore>('my-store', {
 *       mergeStrategy: 'merge'
 *     })(config)
 *   );
 *
 * const useMyStore = create(devtools(withMiddleware(creator)));
 * ```
 *
 * **SSR Considerations:**
 *
 * - Middleware checks for `typeof window !== 'undefined'`
 * - Safe to use in Next.js, Remix, or other SSR frameworks
 * - No storage events will be listened to on server
 *
 * **Race Condition Prevention:**
 *
 * - Every state update gets a timestamp
 * - Incoming updates are ignored if older than current state
 * - Handles rapid updates across multiple tabs
 * - Last-write-wins for simultaneous conflicting updates
 *
 * **Optimistic Updates:**
 *
 * When using with queryIntegration middleware:
 * - Use 'merge' strategy to preserve local optimistic state
 * - Optimistic changes will be preserved until server confirms
 * - Server state will eventually sync across all tabs
 *
 * @template T - The store state type
 * @param key - localStorage key (must match localStorage middleware key)
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Basic usage with replace strategy
 * const useStore = create(
 *   createLocalStorageMiddleware('app-store')(
 *     createMultiTabMiddleware<AppStore>('app-store')(
 *       (set) => ({
 *         count: 0,
 *         increment: () => set((s) => ({ count: s.count + 1 }))
 *       })
 *     )
 *   )
 * );
 *
 * // With merge strategy for partial updates
 * const usePreferences = create(
 *   createLocalStorageMiddleware('preferences')(
 *     createMultiTabMiddleware<Preferences>('preferences', {
 *       mergeStrategy: 'merge'
 *     })(
 *       (set) => ({
 *         theme: 'light',
 *         language: 'en',
 *         setTheme: (theme) => set({ theme })
 *       })
 *     )
 *   )
 * );
 *
 * // With custom merge strategy
 * const useComplex = create(
 *   createLocalStorageMiddleware('complex')(
 *     createMultiTabMiddleware<ComplexStore>('complex', {
 *       mergeStrategy: (incoming, current) => ({
 *         // Keep local optimistic updates
 *         optimistic: current.optimistic,
 *         // Merge arrays instead of replacing
 *         items: [...current.items, ...incoming.items],
 *         // Take incoming for simple fields
 *         lastSync: incoming.lastSync
 *       })
 *     })(creator)
 *   )
 * );
 * ```
 */
export const createMultiTabMiddleware = <T extends object>(
  key: string,
  options?: MultiTabOptions<T>
) => {
  const { mergeStrategy = 'replace' } = options ?? {};

  return (config: StateCreator<T>): StateCreator<MultiTabStore<T>> => (set, get, api) => {
    /**
     * Handle storage events from other tabs
     * Only processes events for our key and applies merge strategy
     */
    const handleStorageChange = (event: StorageEvent) => {
      // Ignore events for other keys
      if (event.key !== key) return;

      // Ignore if key was deleted (no new value)
      if (!event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue) as MultiTabStore<T>;

        // Validate incoming data is a plain object
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          console.warn('multiTab.sync.invalid', { key, parsed });
          return;
        }

        const currentState = get();

        // Check timestamp to prevent syncing stale state
        // This handles race conditions where Tab A and Tab B both update
        const incomingTimestamp = parsed._lastSyncTimestamp ?? 0;
        const currentTimestamp = currentState._lastSyncTimestamp ?? 0;

        if (incomingTimestamp <= currentTimestamp) {
          if (process.env.NODE_ENV === 'development') {
            console.log('multiTab.sync.skipped', {
              key,
              reason: 'stale',
              incomingTimestamp,
              currentTimestamp,
            });
          }
          return;
        }

        // Apply merge strategy
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let newState: any;

        if (typeof mergeStrategy === 'function') {
          // Custom merge function
          newState = mergeStrategy(parsed as T, currentState as T);
        } else if (mergeStrategy === 'merge') {
          // Shallow merge, incoming wins for conflicts
          newState = { ...currentState, ...parsed };
        } else {
          // Replace strategy - incoming state replaces current
          newState = { ...parsed };
        }

        // Ensure timestamp is preserved from incoming state
        newState._lastSyncTimestamp = incomingTimestamp;

        // Preserve middleware methods (functions are not serialized to localStorage)
        // This ensures methods like registerMutation, createSnapshot, etc. are kept
        for (const key in currentState) {
          if (typeof (currentState as any)[key] === 'function') {
            newState[key] = (currentState as any)[key];
          }
        }

        // Apply merged state without replacing (preserve references)
        set(newState, false);

        if (process.env.NODE_ENV === 'development') {
          console.log('multiTab.sync.success', { key, timestamp: incomingTimestamp });
        }
      } catch (error) {
        console.error('multiTab.sync.error', { key, error });
      }
    };

    // Set up storage event listener (only in browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);

      // Note: Zustand doesn't provide cleanup hooks for middleware
      // Storage event listeners are lightweight and won't cause memory leaks
      // in normal SPA usage. For advanced use cases, consider external cleanup.
    }

    // Create base store with timestamp injection on every state change
    return config(
      (state, replace) => {
        // Add timestamp to every state update
        // This ensures we can detect which state is newer across tabs
        const stateWithTimestamp =
          typeof state === 'function'
            ? (prev: MultiTabStore<T>) => {
                const result = (state as (prev: T) => Partial<T>)(prev);
                return { ...result, _lastSyncTimestamp: Date.now() };
              }
            : { ...(state as Partial<T>), _lastSyncTimestamp: Date.now() };

        set(stateWithTimestamp as any, replace);
      },
      get,
      api
    );
  };
};
