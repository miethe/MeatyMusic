import { describe, it, expect, beforeEach } from 'vitest';

import {
  useSongsStore,
} from '../stores/songsStore';
import type { Song, SongStatus } from '../types';

// ============================================================================
// Test Helpers
// ============================================================================

const mockSong = (id: string, overrides?: Partial<Song>): Song => ({
  id,
  tenant_id: 'tenant-1',
  owner_id: 'owner-1',
  title: `Test Song ${id}`,
  global_seed: 12345,
  status: 'draft' as SongStatus,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

// ============================================================================
// Songs Store Tests
// ============================================================================

describe('SongsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSongsStore.getState().reset();
  });

  // ==========================================================================
  // Query Sync Actions
  // ==========================================================================

  describe('setItems', () => {
    it('should set items and update allIds', () => {
      const songs = [mockSong('song-1'), mockSong('song-2')];

      useSongsStore.getState().setItems(songs, { total: 2 });

      const state = useSongsStore.getState();
      expect(state.items.get('song-1')).toEqual(songs[0]);
      expect(state.items.get('song-2')).toEqual(songs[1]);
      expect(state.allIds).toEqual(['song-1', 'song-2']);
      expect(state.pagination.total).toBe(2);
    });

    it('should update pagination metadata', () => {
      const songs = [mockSong('song-1')];

      useSongsStore.getState().setItems(songs, {
        total: 10,
        hasMore: true,
      });

      const state = useSongsStore.getState();
      expect(state.pagination.total).toBe(10);
      expect(state.pagination.hasMore).toBe(true);
    });

    it('should clear loading and error states', () => {
      useSongsStore.setState({ loading: true, error: new Error('test') });
      useSongsStore.getState().setItems([], {});

      const state = useSongsStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should set lastUpdated timestamp', () => {
      const beforeTime = Date.now();

      useSongsStore.getState().setItems([], {});

      const state = useSongsStore.getState();
      expect(state.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastUpdated).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('setError', () => {
    it('should set error and clear loading', () => {
      const error = new Error('Test error');

      useSongsStore.setState({ loading: true });
      useSongsStore.getState().setError(error);

      const state = useSongsStore.getState();
      expect(state.error).toBe(error);
      expect(state.loading).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useSongsStore.getState().setLoading(true);
      expect(useSongsStore.getState().loading).toBe(true);

      useSongsStore.getState().setLoading(false);
      expect(useSongsStore.getState().loading).toBe(false);
    });
  });

  // ==========================================================================
  // Filter Management
  // ==========================================================================

  describe('setSearchQuery', () => {
    it('should update search query and mark filters as dirty', () => {
      useSongsStore.getState().setSearchQuery('test query');

      const state = useSongsStore.getState();
      expect(state.filters.search).toBe('test query');
      expect(state.filters.isDirty).toBe(true);
    });
  });

  describe('setFilters', () => {
    it('should merge filters and mark as dirty', () => {
      useSongsStore.getState().setFilters({
        status: 'validated' as SongStatus,
        createdAfter: '2025-01-01T00:00:00Z',
      });

      const state = useSongsStore.getState();
      expect(state.filters.status).toBe('validated');
      expect(state.filters.createdAfter).toBe('2025-01-01T00:00:00Z');
      expect(state.filters.isDirty).toBe(true);
    });

    it('should preserve existing filters when merging', () => {
      useSongsStore.getState().setSearchQuery('existing');
      useSongsStore.getState().setFilters({ status: 'draft' as SongStatus });

      const state = useSongsStore.getState();
      expect(state.filters.search).toBe('existing');
      expect(state.filters.status).toBe('draft');
    });
  });

  describe('clearFilters', () => {
    it('should reset filters to initial state', () => {
      useSongsStore.getState().setSearchQuery('query');
      useSongsStore.getState().setFilters({ status: 'draft' as SongStatus });
      useSongsStore.getState().clearFilters();

      const state = useSongsStore.getState();
      expect(state.filters.search).toBe('');
      expect(state.filters.status).toBeUndefined();
      expect(state.filters.isApplied).toBe(false);
      expect(state.filters.isDirty).toBe(false);
    });
  });

  describe('applyFilters', () => {
    it('should mark filters as applied and clear dirty flag', () => {
      useSongsStore.getState().setSearchQuery('test');
      useSongsStore.getState().applyFilters();

      const state = useSongsStore.getState();
      expect(state.filters.isApplied).toBe(true);
      expect(state.filters.isDirty).toBe(false);
    });

    it('should reset pagination to first page', () => {
      useSongsStore.setState({ pagination: { page: 3, limit: 20, total: 100, hasMore: true } });
      useSongsStore.getState().applyFilters();

      const state = useSongsStore.getState();
      expect(state.pagination.page).toBe(1);
    });
  });

  describe('revertFilters', () => {
    it('should clear dirty flag without applying', () => {
      useSongsStore.getState().setSearchQuery('test');
      useSongsStore.getState().revertFilters();

      const state = useSongsStore.getState();
      expect(state.filters.isDirty).toBe(false);
      expect(state.filters.isApplied).toBe(false);
    });
  });

  // ==========================================================================
  // Sorting
  // ==========================================================================

  describe('setSorting', () => {
    it('should set field and direction', () => {
      useSongsStore.getState().setSorting('title', 'asc');

      const state = useSongsStore.getState();
      expect(state.sorting.field).toBe('title');
      expect(state.sorting.direction).toBe('asc');
    });

    it('should toggle direction when clicking same field', () => {
      useSongsStore.getState().setSorting('title', 'asc');
      useSongsStore.getState().setSorting('title');

      const state = useSongsStore.getState();
      expect(state.sorting.direction).toBe('desc');

      useSongsStore.getState().setSorting('title');
      expect(useSongsStore.getState().sorting.direction).toBe('asc');
    });

    it('should default to asc when changing to new field', () => {
      useSongsStore.getState().setSorting('title', 'desc');
      useSongsStore.getState().setSorting('createdAt');

      const state = useSongsStore.getState();
      expect(state.sorting.field).toBe('createdAt');
      expect(state.sorting.direction).toBe('asc');
    });

    it('should reset pagination to first page', () => {
      useSongsStore.setState({ pagination: { page: 5, limit: 20, total: 100, hasMore: true } });
      useSongsStore.getState().setSorting('title', 'asc');

      expect(useSongsStore.getState().pagination.page).toBe(1);
    });
  });

  // ==========================================================================
  // Pagination
  // ==========================================================================

  describe('setPage', () => {
    it('should update current page', () => {
      useSongsStore.getState().setPage(3);
      expect(useSongsStore.getState().pagination.page).toBe(3);
    });
  });

  describe('nextPage', () => {
    it('should increment page when hasMore is true', () => {
      useSongsStore.setState({
        pagination: { page: 2, limit: 20, total: 100, hasMore: true },
      });
      useSongsStore.getState().nextPage();

      expect(useSongsStore.getState().pagination.page).toBe(3);
    });

    it('should not increment page when hasMore is false', () => {
      useSongsStore.setState({
        pagination: { page: 5, limit: 20, total: 100, hasMore: false },
      });
      useSongsStore.getState().nextPage();

      expect(useSongsStore.getState().pagination.page).toBe(5);
    });
  });

  describe('previousPage', () => {
    it('should decrement page when page > 1', () => {
      useSongsStore.setState({
        pagination: { page: 3, limit: 20, total: 100, hasMore: true },
      });
      useSongsStore.getState().previousPage();

      expect(useSongsStore.getState().pagination.page).toBe(2);
    });

    it('should not decrement page when page is 1', () => {
      useSongsStore.setState({
        pagination: { page: 1, limit: 20, total: 100, hasMore: true },
      });
      useSongsStore.getState().previousPage();

      expect(useSongsStore.getState().pagination.page).toBe(1);
    });
  });

  // ==========================================================================
  // Selection
  // ==========================================================================

  describe('selectSong', () => {
    it('should set selected song ID', () => {
      useSongsStore.getState().selectSong('song-1');
      expect(useSongsStore.getState().selectedId).toBe('song-1');
    });

    it('should clear selection when null', () => {
      useSongsStore.getState().selectSong('song-1');
      useSongsStore.getState().selectSong(null);
      expect(useSongsStore.getState().selectedId).toBe(null);
    });
  });

  describe('toggleMultiSelect', () => {
    it('should add ID to selectedIds when not present', () => {
      useSongsStore.getState().toggleMultiSelect('song-1');
      expect(useSongsStore.getState().selectedIds).toEqual(['song-1']);
    });

    it('should remove ID from selectedIds when present', () => {
      useSongsStore.getState().toggleMultiSelect('song-1');
      useSongsStore.getState().toggleMultiSelect('song-2');
      useSongsStore.getState().toggleMultiSelect('song-1');

      expect(useSongsStore.getState().selectedIds).toEqual(['song-2']);
    });

    it('should handle multiple selections', () => {
      useSongsStore.getState().toggleMultiSelect('song-1');
      useSongsStore.getState().toggleMultiSelect('song-2');
      useSongsStore.getState().toggleMultiSelect('song-3');

      expect(useSongsStore.getState().selectedIds).toEqual(['song-1', 'song-2', 'song-3']);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selection state', () => {
      useSongsStore.getState().selectSong('song-1');
      useSongsStore.getState().toggleMultiSelect('song-2');
      useSongsStore.getState().setComparisonMode(true);
      useSongsStore.getState().clearSelection();

      const state = useSongsStore.getState();
      expect(state.selectedId).toBe(null);
      expect(state.selectedIds).toEqual([]);
      expect(state.isComparing).toBe(false);
    });
  });

  describe('setComparisonMode', () => {
    it('should enable comparison mode', () => {
      useSongsStore.getState().setComparisonMode(true);
      expect(useSongsStore.getState().isComparing).toBe(true);
    });

    it('should disable comparison mode', () => {
      useSongsStore.getState().setComparisonMode(true);
      useSongsStore.getState().setComparisonMode(false);
      expect(useSongsStore.getState().isComparing).toBe(false);
    });
  });

  // ==========================================================================
  // Optimistic Operations
  // ==========================================================================

  describe('addOptimisticSong', () => {
    it('should add song to stagedItems', () => {
      const song = mockSong('song-1');

      useSongsStore.getState().addOptimisticSong(song);

      const state = useSongsStore.getState();
      expect(state.stagedItems.get('song-1')).toEqual(song);
    });

    it('should handle multiple staged items', () => {
      const song1 = mockSong('song-1');
      const song2 = mockSong('song-2');

      useSongsStore.getState().addOptimisticSong(song1);
      useSongsStore.getState().addOptimisticSong(song2);

      const state = useSongsStore.getState();
      expect(state.stagedItems.size).toBe(2);
      expect(state.stagedItems.get('song-1')).toEqual(song1);
      expect(state.stagedItems.get('song-2')).toEqual(song2);
    });
  });

  describe('updateOptimisticSong', () => {
    it('should add update to stagedUpdates', () => {
      const updates = { title: 'Updated Title' };

      useSongsStore.getState().updateOptimisticSong('song-1', updates);

      const state = useSongsStore.getState();
      expect(state.stagedUpdates.get('song-1')).toEqual(updates);
    });

    it('should handle multiple updates', () => {
      useSongsStore.getState().updateOptimisticSong('song-1', { title: 'Title 1' });
      useSongsStore.getState().updateOptimisticSong('song-2', { title: 'Title 2' });

      const state = useSongsStore.getState();
      expect(state.stagedUpdates.size).toBe(2);
    });
  });

  describe('removeOptimisticSong', () => {
    it('should add ID to stagedRemovals', () => {
      useSongsStore.getState().removeOptimisticSong('song-1');

      const state = useSongsStore.getState();
      expect(state.stagedRemovals).toContain('song-1');
    });

    it('should handle multiple removals', () => {
      useSongsStore.getState().removeOptimisticSong('song-1');
      useSongsStore.getState().removeOptimisticSong('song-2');

      const state = useSongsStore.getState();
      expect(state.stagedRemovals).toEqual(['song-1', 'song-2']);
    });
  });

  describe('commitOptimistic', () => {
    it('should commit staged item to items', () => {
      const song = mockSong('song-1');

      useSongsStore.getState().addOptimisticSong(song);
      useSongsStore.getState().commitOptimistic('song-1');

      const state = useSongsStore.getState();
      expect(state.items.get('song-1')).toEqual(song);
      expect(state.stagedItems.has('song-1')).toBe(false);
      expect(state.allIds).toContain('song-1');
    });

    it('should commit staged update to existing item', () => {
      const song = mockSong('song-1');

      useSongsStore.getState().setItems([song], {});
      useSongsStore.getState().updateOptimisticSong('song-1', { title: 'Updated' });
      useSongsStore.getState().commitOptimistic('song-1');

      const state = useSongsStore.getState();
      expect(state.items.get('song-1')?.title).toBe('Updated');
      expect(state.stagedUpdates.has('song-1')).toBe(false);
    });

    it('should commit staged removal', () => {
      const song = mockSong('song-1');

      useSongsStore.getState().setItems([song], {});
      useSongsStore.getState().removeOptimisticSong('song-1');
      useSongsStore.getState().commitOptimistic('song-1');

      const state = useSongsStore.getState();
      expect(state.items.has('song-1')).toBe(false);
      expect(state.allIds).not.toContain('song-1');
      expect(state.stagedRemovals).not.toContain('song-1');
    });
  });

  describe('rollbackOptimistic', () => {
    it('should rollback staged item', () => {
      const song = mockSong('song-1');

      useSongsStore.getState().addOptimisticSong(song);
      useSongsStore.getState().rollbackOptimistic('song-1');

      const state = useSongsStore.getState();
      expect(state.stagedItems.has('song-1')).toBe(false);
    });

    it('should rollback staged update', () => {
      useSongsStore.getState().updateOptimisticSong('song-1', { title: 'Updated' });
      useSongsStore.getState().rollbackOptimistic('song-1');

      const state = useSongsStore.getState();
      expect(state.stagedUpdates.has('song-1')).toBe(false);
    });

    it('should rollback staged removal', () => {
      useSongsStore.getState().removeOptimisticSong('song-1');
      useSongsStore.getState().rollbackOptimistic('song-1');

      const state = useSongsStore.getState();
      expect(state.stagedRemovals).not.toContain('song-1');
    });
  });

  // ==========================================================================
  // Cache Control
  // ==========================================================================

  describe('invalidate', () => {
    it('should clear lastUpdated timestamp', () => {
      useSongsStore.getState().setItems([], {});
      useSongsStore.getState().invalidate();

      expect(useSongsStore.getState().lastUpdated).toBe(null);
    });
  });

  describe('clear', () => {
    it('should clear items and reset state', () => {
      const songs = [mockSong('song-1'), mockSong('song-2')];

      useSongsStore.getState().setItems(songs, {});
      useSongsStore.setState({ loading: true, error: new Error('test') });
      useSongsStore.getState().clear();

      const state = useSongsStore.getState();
      expect(state.items.size).toBe(0);
      expect(state.allIds).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastUpdated).toBe(null);
    });
  });

  describe('reset', () => {
    it('should reset entire store to initial state', () => {
      useSongsStore.getState().setItems([mockSong('song-1')], {});
      useSongsStore.getState().selectSong('song-1');
      useSongsStore.getState().setSearchQuery('test');
      useSongsStore.getState().addOptimisticSong(mockSong('song-2'));
      useSongsStore.getState().reset();

      const state = useSongsStore.getState();
      expect(state.items.size).toBe(0);
      expect(state.allIds).toEqual([]);
      expect(state.selectedId).toBe(null);
      expect(state.selectedIds).toEqual([]);
      expect(state.filters.search).toBe('');
      expect(state.stagedItems.size).toBe(0);
      expect(state.stagedUpdates.size).toBe(0);
      expect(state.stagedRemovals).toEqual([]);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      useSongsStore.getState().setItems([], {});

      const state = useSongsStore.getState();
      expect(state.items.size).toBe(0);
      expect(state.allIds).toEqual([]);
    });

    it('should handle updating non-existent song', () => {
      useSongsStore.getState().updateOptimisticSong('non-existent', { title: 'Updated' });
      useSongsStore.getState().commitOptimistic('non-existent');

      // Should not throw, just ignore the update
      const state = useSongsStore.getState();
      expect(state.items.has('non-existent')).toBe(false);
    });

    it('should preserve staged items when committing different ID', () => {
      const song1 = mockSong('song-1');
      const song2 = mockSong('song-2');

      useSongsStore.getState().addOptimisticSong(song1);
      useSongsStore.getState().addOptimisticSong(song2);
      useSongsStore.getState().commitOptimistic('song-1');

      const state = useSongsStore.getState();
      expect(state.stagedItems.has('song-2')).toBe(true);
    });
  });
});
