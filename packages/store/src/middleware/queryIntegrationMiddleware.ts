import type { StateCreator } from 'zustand';

/**
 * Mutation lifecycle hooks that have access to store state
 *
 * These hooks integrate with React Query mutations to provide:
 * - Pre-mutation setup (optimistic updates)
 * - Post-success cleanup
 * - Error handling and rollback
 */
export interface MutationHooks<TState, TVariables = unknown, TData = unknown> {
  /**
   * Called before mutation executes
   * Use for applying optimistic updates to the store
   *
   * @param context.variables - Mutation input variables
   * @param context.state - Current store state
   * @param context.createSnapshot - Function to snapshot current state for rollback
   */
  onMutate?: (context: {
    variables: TVariables;
    state: TState;
    createSnapshot: (id: string) => void;
  }) => void | Promise<void>;

  /**
   * Called when mutation succeeds
   * Use for committing optimistic updates or syncing server data
   *
   * @param context.data - Mutation result data
   * @param context.variables - Mutation input variables
   * @param context.state - Current store state
   */
  onSuccess?: (context: {
    data: TData;
    variables: TVariables;
    state: TState;
  }) => void | Promise<void>;

  /**
   * Called when mutation fails
   * Use for rolling back optimistic updates
   *
   * @param context.error - Error that occurred
   * @param context.variables - Mutation input variables
   * @param context.state - Current store state
   * @param context.rollback - Function to rollback to a snapshot
   */
  onError?: (context: {
    error: Error;
    variables: TVariables;
    state: TState;
    rollback: (snapshotId: string) => void;
  }) => void | Promise<void>;
}

/**
 * Internal state added by query integration middleware
 * Not meant to be accessed directly by consumers
 */
export interface QueryIntegrationState {
  /** @internal State snapshots for rollback */
  _snapshots: Map<string, unknown>;
  /** @internal Registered mutation hooks */
  _mutations: Map<string, MutationHooks<unknown, unknown, unknown>>;
}

/**
 * Actions added by query integration middleware
 */
export interface QueryIntegrationActions<TState> {
  /**
   * Register mutation hooks for a specific mutation key
   * Call this once per mutation to set up lifecycle hooks
   *
   * @param key - Unique identifier for the mutation
   * @param hooks - Lifecycle hooks for this mutation
   *
   * @example
   * ```typescript
   * store.registerMutation('createSong', {
   *   onMutate: ({ variables, createSnapshot }) => {
   *     createSnapshot('createSong-rollback');
   *     store.addOptimisticSong(variables);
   *   },
   *   onError: ({ rollback }) => {
   *     rollback('createSong-rollback');
   *   }
   * });
   * ```
   */
  registerMutation: <TVariables = unknown, TData = unknown>(
    key: string,
    hooks: MutationHooks<TState, TVariables, TData>
  ) => void;

  /**
   * Create a snapshot of current state for later rollback
   * Excludes internal middleware state from snapshot
   *
   * @param id - Unique identifier for this snapshot
   */
  createSnapshot: (id: string) => void;

  /**
   * Rollback to a previous snapshot
   * Restores store state to the snapshot, preserving middleware state
   *
   * @param id - Snapshot identifier to rollback to
   */
  rollbackToSnapshot: (id: string) => void;

  /**
   * Clear a snapshot (e.g., after successful commit)
   *
   * @param id - Snapshot identifier to clear
   */
  clearSnapshot: (id: string) => void;

  /**
   * Execute a mutation lifecycle hook
   * Called by React Query mutations at appropriate times
   *
   * @param mutationKey - Key of the registered mutation
   * @param phase - Lifecycle phase to execute
   * @param payload - Data for the hook (variables, data, or error)
   */
  executeMutationHook: <TVariables = unknown, TData = unknown>(
    mutationKey: string,
    phase: 'onMutate' | 'onSuccess' | 'onError',
    payload: {
      variables?: TVariables;
      data?: TData;
      error?: Error;
    }
  ) => Promise<void>;
}

/**
 * Combined query integration store type
 */
export type QueryIntegrationStore<TState> = TState &
  QueryIntegrationState &
  QueryIntegrationActions<TState>;

/**
 * Creates middleware that integrates Zustand stores with React Query
 *
 * **Features:**
 * - Mutation lifecycle hooks (onMutate, onSuccess, onError)
 * - State snapshot/rollback for optimistic updates
 * - Access to store state within mutation hooks
 * - Composable with localStorage and API sync middleware
 *
 * **Usage Pattern:**
 *
 * 1. Add middleware to store:
 * ```typescript
 * const withMiddleware = (config: StateCreator<MyStore>) =>
 *   createQueryIntegrationMiddleware<MyStore>()(
 *     createApiSyncMiddleware({ endpoint: '/api/data' })(
 *       createLocalStorageMiddleware('my-store')(config)
 *     )
 *   );
 *
 * export const useMyStore = create(devtools(withMiddleware(creator)));
 * ```
 *
 * 2. Register mutations in component:
 * ```typescript
 * const store = useMyStore();
 *
 * React.useEffect(() => {
 *   store.registerMutation('updateItem', {
 *     onMutate: ({ variables, createSnapshot }) => {
 *       createSnapshot('update-rollback');
 *       store.updateOptimisticItem(variables);
 *     },
 *     onError: ({ rollback }) => {
 *       rollback('update-rollback');
 *     },
 *     onSuccess: ({ data }) => {
 *       store.commitOptimistic(data.id);
 *     }
 *   });
 * }, []);
 * ```
 *
 * 3. Use in React Query mutations:
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: updateItem,
 *   onMutate: async (variables) => {
 *     await store.executeMutationHook('updateItem', 'onMutate', { variables });
 *   },
 *   onError: async (error, variables) => {
 *     await store.executeMutationHook('updateItem', 'onError', { error, variables });
 *   },
 *   onSuccess: async (data, variables) => {
 *     await store.executeMutationHook('updateItem', 'onSuccess', { data, variables });
 *   }
 * });
 * ```
 *
 * @template TState - The store state type
 */
export const createQueryIntegrationMiddleware = <TState extends object>() => {
  return (
    config: StateCreator<TState>
  ): StateCreator<QueryIntegrationStore<TState>> => (set, get, api) => {
    // Internal storage for snapshots and mutation hooks
    // Stored outside of Zustand state to avoid serialization issues
    const snapshots = new Map<string, Partial<TState>>();
    const mutations = new Map<
      string,
      MutationHooks<unknown, unknown, unknown>
    >();

    // List of keys that are part of the middleware, not user state
    const middlewareKeys = new Set([
      '_snapshots',
      '_mutations',
      'registerMutation',
      'createSnapshot',
      'rollbackToSnapshot',
      'clearSnapshot',
      'executeMutationHook',
    ]);

    /**
     * Extract only user state, excluding middleware internals
     */
    const extractUserState = (state: QueryIntegrationStore<TState>): Partial<TState> => {
      const userState: Record<string, unknown> = {};
      for (const key in state) {
        if (Object.prototype.hasOwnProperty.call(state, key) && !middlewareKeys.has(key)) {
          userState[key] = (state as Record<string, unknown>)[key];
        }
      }
      return userState as Partial<TState>;
    };

    // Create base store from config
    const baseStore = config(set, get, api);

    // Query integration actions
    const queryActions: QueryIntegrationActions<TState> & QueryIntegrationState = {
      _snapshots: snapshots as Map<string, unknown>,
      _mutations: mutations,

      registerMutation: (key, hooks) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('middleware.query.register', { key });
        }
        mutations.set(key, hooks as MutationHooks<unknown, unknown, unknown>);
      },

      createSnapshot: (id) => {
        const currentState = get();
        const userState = extractUserState(currentState);

        // Deep clone to prevent mutation
        // Note: This uses JSON serialization, so it won't preserve
        // functions, Maps, Sets, or other non-serializable types
        const snapshot = JSON.parse(JSON.stringify(userState)) as Partial<TState>;
        snapshots.set(id, snapshot);

        if (process.env.NODE_ENV === 'development') {
          console.log('middleware.query.snapshot.create', { id, keys: Object.keys(snapshot) });
        }
      },

      rollbackToSnapshot: (id) => {
        const snapshot = snapshots.get(id);
        if (snapshot) {
          // Merge snapshot back into state, preserving middleware methods
          set(snapshot as any, false); // Partial update, don't replace
          snapshots.delete(id);

          if (process.env.NODE_ENV === 'development') {
            console.log('middleware.query.snapshot.rollback', { id });
          }
        } else {
          console.warn('middleware.query.snapshot.notfound', { id });
        }
      },

      clearSnapshot: (id) => {
        if (snapshots.has(id)) {
          snapshots.delete(id);

          if (process.env.NODE_ENV === 'development') {
            console.log('middleware.query.snapshot.clear', { id });
          }
        }
      },

      executeMutationHook: async (mutationKey, phase, payload) => {
        const hooks = mutations.get(mutationKey);
        if (!hooks) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('middleware.query.hook.notregistered', { mutationKey });
          }
          return;
        }

        const currentState = get();
        const userState = extractUserState(currentState) as TState;

        try {
          if (phase === 'onMutate' && payload.variables !== undefined) {
            const hook = hooks.onMutate;
            if (hook) {
              await hook({
                variables: payload.variables,
                state: userState,
                createSnapshot: (snapshotId: string) => {
                  queryActions.createSnapshot(snapshotId);
                },
              });
            }
          } else if (phase === 'onSuccess' && payload.data !== undefined) {
            const hook = hooks.onSuccess;
            if (hook) {
              await hook({
                data: payload.data,
                variables: payload.variables ?? ({} as any),
                state: userState,
              });
            }
          } else if (phase === 'onError' && payload.error) {
            const hook = hooks.onError;
            if (hook) {
              await hook({
                error: payload.error,
                variables: payload.variables ?? ({} as any),
                state: userState,
                rollback: (snapshotId: string) => {
                  queryActions.rollbackToSnapshot(snapshotId);
                },
              });
            }
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('middleware.query.hook.executed', {
              mutationKey,
              phase,
            });
          }
        } catch (error) {
          console.error('middleware.query.hook.error', {
            mutationKey,
            phase,
            error,
          });
        }
      },
    };

    return {
      ...baseStore,
      ...queryActions,
    } as QueryIntegrationStore<TState>;
  };
};
