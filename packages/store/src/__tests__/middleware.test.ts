import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create, type StateCreator } from 'zustand';

import { createQueryIntegrationMiddleware } from '../middleware/queryIntegrationMiddleware';
import { createMultiTabMiddleware } from '../middleware/multiTabMiddleware';

// ============================================================================
// Browser API Polyfills for Node.js Test Environment
// ============================================================================

// Polyfill StorageEvent for Node.js
class MockStorageEvent extends Event {
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
  url: string;
  storageArea: Storage | null;

  constructor(type: string, init?: {
    key?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    url?: string;
    storageArea?: Storage | null;
  }) {
    super(type);
    this.key = init?.key ?? null;
    this.oldValue = init?.oldValue ?? null;
    this.newValue = init?.newValue ?? null;
    this.url = init?.url ?? '';
    this.storageArea = init?.storageArea ?? null;
  }
}

// Make StorageEvent available globally
(globalThis as any).StorageEvent = MockStorageEvent;

// ============================================================================
// Test Helpers
// ============================================================================

interface TestStore {
  count: number;
  items: string[];
  increment: () => void;
  addItem: (item: string) => void;
  reset: () => void;
}

const createTestStore = (config: StateCreator<TestStore>) => {
  return create<TestStore>()(config);
};

const mockStorage = () => {
  let store: Record<string, string> = {};
  const listeners: Array<(event: any) => void> = [];

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      const oldValue = store[key];
      store[key] = value;

      // Simulate storage event for other tabs
      const event = new MockStorageEvent('storage', {
        key,
        oldValue,
        newValue: value,
        storageArea: null,
      });

      // Fire event on all listeners (simulating other tabs)
      listeners.forEach((listener) => listener(event));
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    addEventListener: (type: string, listener: (event: any) => void) => {
      if (type === 'storage') {
        listeners.push(listener);
      }
    },
    removeEventListener: (type: string, listener: (event: any) => void) => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    },
  };
};

// ============================================================================
// Query Integration Middleware Tests
// ============================================================================

describe('queryIntegrationMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerMutation', () => {
    it('should register mutation hooks', () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      const onMutate = vi.fn();
      const onSuccess = vi.fn();
      const onError = vi.fn();

      store.getState().registerMutation('testMutation', {
        onMutate,
        onSuccess,
        onError,
      });

      // Check that registration doesn't throw
      expect(store.getState()._mutations.has('testMutation')).toBe(true);
    });
  });

  describe('createSnapshot', () => {
    it('should create snapshot of current state', () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: ['a', 'b'],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      store.getState().createSnapshot('test-snapshot');

      // Snapshot should be stored
      expect(store.getState()._snapshots.has('test-snapshot')).toBe(true);
    });

    it('should exclude middleware state from snapshot', () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: ['a'],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      store.getState().createSnapshot('test-snapshot');

      const snapshot = store.getState()._snapshots.get('test-snapshot') as any;

      // Should have user state
      expect(snapshot).toHaveProperty('count');
      expect(snapshot).toHaveProperty('items');

      // Should NOT have middleware state
      expect(snapshot).not.toHaveProperty('_snapshots');
      expect(snapshot).not.toHaveProperty('_mutations');
      expect(snapshot).not.toHaveProperty('registerMutation');
    });
  });

  describe('rollbackToSnapshot', () => {
    it('should rollback to snapshot state', () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: ['a', 'b'],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      // Create snapshot
      store.getState().createSnapshot('test-snapshot');

      // Modify state
      store.getState().increment();
      store.getState().addItem('c');

      expect(store.getState().count).toBe(6);
      expect(store.getState().items).toEqual(['a', 'b', 'c']);

      // Rollback
      store.getState().rollbackToSnapshot('test-snapshot');

      expect(store.getState().count).toBe(5);
      expect(store.getState().items).toEqual(['a', 'b']);
    });

    it('should clear snapshot after rollback', () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      store.getState().createSnapshot('test-snapshot');
      store.getState().rollbackToSnapshot('test-snapshot');

      expect(store.getState()._snapshots.has('test-snapshot')).toBe(false);
    });

    it('should handle rollback to non-existent snapshot', () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      const beforeState = { ...store.getState() };

      // Should not throw
      store.getState().rollbackToSnapshot('non-existent');

      // State should be unchanged
      expect(store.getState().count).toBe(beforeState.count);
    });
  });

  describe('clearSnapshot', () => {
    it('should remove snapshot', () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      store.getState().createSnapshot('test-snapshot');
      expect(store.getState()._snapshots.has('test-snapshot')).toBe(true);

      store.getState().clearSnapshot('test-snapshot');
      expect(store.getState()._snapshots.has('test-snapshot')).toBe(false);
    });
  });

  describe('executeMutationHook', () => {
    it('should execute onMutate hook', async () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      const onMutate = vi.fn();

      store.getState().registerMutation('testMutation', {
        onMutate,
      });

      await store.getState().executeMutationHook('testMutation', 'onMutate', {
        variables: { test: 'data' },
      });

      expect(onMutate).toHaveBeenCalledWith({
        variables: { test: 'data' },
        state: expect.objectContaining({ count: 0, items: [] }),
        createSnapshot: expect.any(Function),
      });
    });

    it('should execute onSuccess hook', async () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      const onSuccess = vi.fn();

      store.getState().registerMutation('testMutation', {
        onSuccess,
      });

      await store.getState().executeMutationHook('testMutation', 'onSuccess', {
        data: { result: 'success' },
        variables: { test: 'data' },
      });

      expect(onSuccess).toHaveBeenCalledWith({
        data: { result: 'success' },
        variables: { test: 'data' },
        state: expect.objectContaining({ count: 0, items: [] }),
      });
    });

    it('should execute onError hook', async () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      const onError = vi.fn();
      const testError = new Error('Test error');

      store.getState().registerMutation('testMutation', {
        onError,
      });

      await store.getState().executeMutationHook('testMutation', 'onError', {
        error: testError,
        variables: { test: 'data' },
      });

      expect(onError).toHaveBeenCalledWith({
        error: testError,
        variables: { test: 'data' },
        state: expect.objectContaining({ count: 0, items: [] }),
        rollback: expect.any(Function),
      });
    });

    it('should handle hook execution for unregistered mutation', async () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      // Should not throw
      await expect(
        store.getState().executeMutationHook('unregistered', 'onMutate', {
          variables: {},
        })
      ).resolves.toBeUndefined();
    });

    it('should provide createSnapshot function in onMutate', async () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      let capturedCreateSnapshot: ((id: string) => void) | null = null;

      store.getState().registerMutation('testMutation', {
        onMutate: ({ createSnapshot }) => {
          capturedCreateSnapshot = createSnapshot;
          createSnapshot('auto-snapshot');
        },
      });

      await store.getState().executeMutationHook('testMutation', 'onMutate', {
        variables: {},
      });

      expect(capturedCreateSnapshot).toBeTruthy();
      expect(store.getState()._snapshots.has('auto-snapshot')).toBe(true);
    });

    it('should provide rollback function in onError', async () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 5,
          items: ['a'],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      // Create snapshot
      store.getState().createSnapshot('error-snapshot');

      // Modify state
      store.getState().increment();
      expect(store.getState().count).toBe(6);

      // Register error handler with rollback
      store.getState().registerMutation('testMutation', {
        onError: ({ rollback }) => {
          rollback('error-snapshot');
        },
      });

      await store.getState().executeMutationHook('testMutation', 'onError', {
        error: new Error('test'),
        variables: {},
      });

      // State should be rolled back
      expect(store.getState().count).toBe(5);
    });
  });

  describe('integration with optimistic updates', () => {
    it('should support full optimistic update flow', async () => {
      const store = createTestStore(
        createQueryIntegrationMiddleware<TestStore>()((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      // Register mutation with full lifecycle
      store.getState().registerMutation('addItem', {
        onMutate: ({ variables, createSnapshot }) => {
          createSnapshot('addItem-rollback');
          store.getState().addItem(variables.item);
        },
        onSuccess: ({ data }) => {
          // Could update with server data
        },
        onError: ({ rollback }) => {
          rollback('addItem-rollback');
        },
      });

      // Initial state
      expect(store.getState().items).toEqual([]);

      // Execute onMutate (optimistic update)
      await store.getState().executeMutationHook('addItem', 'onMutate', {
        variables: { item: 'optimistic-item' },
      });

      expect(store.getState().items).toEqual(['optimistic-item']);

      // Simulate error - rollback
      await store.getState().executeMutationHook('addItem', 'onError', {
        error: new Error('API failed'),
        variables: { item: 'optimistic-item' },
      });

      // Should be rolled back
      expect(store.getState().items).toEqual([]);
    });
  });
});

// ============================================================================
// Multi-Tab Middleware Tests - Simplified
// ============================================================================

describe('multiTabMiddleware', () => {
  let storage: ReturnType<typeof mockStorage>;

  beforeEach(() => {
    storage = mockStorage();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { localStorage: storage, addEventListener: storage.addEventListener });
  });

  describe('basic functionality', () => {
    it('should add timestamp to state updates', () => {
      const store = createTestStore(
        createMultiTabMiddleware<TestStore>('test-store')((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      );

      const beforeTime = Date.now();
      store.getState().increment();

      const state = store.getState() as any;
      expect(state._lastSyncTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(state._lastSyncTimestamp).toBeLessThanOrEqual(Date.now());
    });
  });
});

// ============================================================================
// Middleware Composition Tests
// ============================================================================

describe('Middleware Composition', () => {
  it('should compose queryIntegration with multiTab', () => {
    const store = createTestStore(
      createQueryIntegrationMiddleware<TestStore>()(
        createMultiTabMiddleware<TestStore>('composed-store')((set) => ({
          count: 0,
          items: [],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      )
    );

    // Should have both middleware features
    expect(typeof store.getState().registerMutation).toBe('function');
    expect(typeof store.getState().createSnapshot).toBe('function');

    // Both should work
    store.getState().increment();
    store.getState().createSnapshot('test');

    expect(store.getState().count).toBe(1);
    expect(store.getState()._snapshots.has('test')).toBe(true);
  });

  it('should preserve state through middleware layers', () => {
    const store = createTestStore(
      createQueryIntegrationMiddleware<TestStore>()(
        createMultiTabMiddleware<TestStore>('composed-store')((set) => ({
          count: 5,
          items: ['a', 'b'],
          increment: () => set((s) => ({ count: s.count + 1 })),
          addItem: (item) => set((s) => ({ items: [...s.items, item] })),
          reset: () => set({ count: 0, items: [] }),
        }))
      )
    );

    expect(store.getState().count).toBe(5);
    expect(store.getState().items).toEqual(['a', 'b']);
  });
});
