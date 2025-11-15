/**
 * useSDS Hook Tests
 * Comprehensive tests for SDS fetching hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSDS, isValidSDS } from '@/hooks/api/useSDS';
import { songsApi } from '@/lib/api';
import type { SDS } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  songsApi: {
    getSDS: jest.fn(),
  },
}));

const mockSongsApi = songsApi as jest.Mocked<typeof songsApi>;

// Create a wrapper component for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// Create a shared wrapper for caching tests
const sharedQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function createSharedWrapper() {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: sharedQueryClient }, children);
}

// Mock SDS data
const mockSDS: SDS = {
  song_id: 'song-123',
  title: 'Test Song',
  global_seed: 42,
  style: {
    genre: 'pop',
    bpm_min: 120,
    bpm_max: 140,
  },
  lyrics: {
    sections: [
      { type: 'verse', text: 'Test lyrics' },
    ],
  },
  persona: {
    name: 'Test Artist',
    vocal_range: 'Tenor',
  },
  constraints: {
    explicit: false,
  },
  metadata: {
    created_at: '2025-01-01T00:00:00Z',
  },
};

describe('useSDS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sharedQueryClient.clear();
  });

  describe('Basic Functionality', () => {
    it('should fetch SDS data successfully', async () => {
      mockSongsApi.getSDS.mockResolvedValue(mockSDS);

      const { result } = renderHook(() => useSDS('song-123'), {
        wrapper: createWrapper(),
      });

      // Initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify data
      expect(result.current.data).toEqual(mockSDS);
      expect(result.current.error).toBeNull();
      expect(mockSongsApi.getSDS).toHaveBeenCalledWith('song-123');
      expect(mockSongsApi.getSDS).toHaveBeenCalledTimes(1);
    });

    it('should not fetch when songId is undefined', () => {
      const { result } = renderHook(() => useSDS(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockSongsApi.getSDS).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch SDS');
      mockSongsApi.getSDS.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSDS('song-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('Query Key Generation', () => {
    it('should use correct query key for caching', async () => {
      mockSongsApi.getSDS.mockResolvedValue(mockSDS);

      const Wrapper = createSharedWrapper();

      const { result: result1 } = renderHook(() => useSDS('song-123'), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result1.current.data).toEqual(mockSDS);
      });

      // Second call with same ID should use cache
      const { result: result2 } = renderHook(() => useSDS('song-123'), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result2.current.data).toEqual(mockSDS);
      });

      // API should only be called once (first call)
      expect(mockSongsApi.getSDS).toHaveBeenCalledTimes(1);
    });

    it('should fetch different data for different song IDs', async () => {
      const mockSDS2: SDS = { ...mockSDS, song_id: 'song-456', title: 'Another Song' };

      mockSongsApi.getSDS
        .mockResolvedValueOnce(mockSDS)
        .mockResolvedValueOnce(mockSDS2);

      const { result: result1 } = renderHook(() => useSDS('song-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.data).toEqual(mockSDS);
      });

      const { result: result2 } = renderHook(() => useSDS('song-456'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.data).toEqual(mockSDS2);
      });

      expect(mockSongsApi.getSDS).toHaveBeenCalledTimes(2);
      expect(mockSongsApi.getSDS).toHaveBeenNthCalledWith(1, 'song-123');
      expect(mockSongsApi.getSDS).toHaveBeenNthCalledWith(2, 'song-456');
    });
  });

  describe('Retry Behavior', () => {
    it('should retry on failure with exponential backoff', async () => {
      const mockError = new Error('Network error');

      mockSongsApi.getSDS
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSDS);

      const { result } = renderHook(() => useSDS('song-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.data).toEqual(mockSDS);
        },
        { timeout: 10000 }
      );

      // Should retry twice (total 3 calls: initial + 2 retries)
      expect(mockSongsApi.getSDS).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockError = new Error('Persistent error');
      mockSongsApi.getSDS.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSDS('song-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.error).toBeTruthy();
        },
        { timeout: 10000 }
      );

      expect(result.current.data).toBeUndefined();
      // Should try: initial + 2 retries = 3 total
      expect(mockSongsApi.getSDS).toHaveBeenCalledTimes(3);
    });
  });

  describe('State Management', () => {
    it('should update state when songId changes', async () => {
      const mockSDS2: SDS = { ...mockSDS, song_id: 'song-456', title: 'New Song' };

      mockSongsApi.getSDS
        .mockResolvedValueOnce(mockSDS)
        .mockResolvedValueOnce(mockSDS2);

      const { result, rerender } = renderHook(
        ({ id }) => useSDS(id),
        {
          wrapper: createWrapper(),
          initialProps: { id: 'song-123' as string | undefined },
        }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSDS);
      });

      // Change song ID
      rerender({ id: 'song-456' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSDS2);
      });

      expect(mockSongsApi.getSDS).toHaveBeenCalledTimes(2);
    });

    it('should stop fetching when songId becomes undefined', async () => {
      mockSongsApi.getSDS.mockResolvedValue(mockSDS);

      const { result, rerender } = renderHook(
        ({ id }) => useSDS(id),
        {
          wrapper: createWrapper(),
          initialProps: { id: 'song-123' as string | undefined },
        }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSDS);
      });

      // Change to undefined
      rerender({ id: undefined });

      // Should not be loading (query disabled)
      expect(result.current.isLoading).toBe(false);

      // Should not make additional calls
      expect(mockSongsApi.getSDS).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty SDS', async () => {
      const emptySDS: SDS = {
        song_id: 'song-123',
        title: '',
        global_seed: 0,
      };

      mockSongsApi.getSDS.mockResolvedValue(emptySDS);

      const { result } = renderHook(() => useSDS('song-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(emptySDS);
      });
    });

    it('should handle SDS with all optional fields', async () => {
      const fullSDS: SDS = {
        ...mockSDS,
        producer_notes: {
          sections: [],
          mix_config: {},
        },
        blueprint: {
          genre: 'pop',
          version: '1.0',
        },
      };

      mockSongsApi.getSDS.mockResolvedValue(fullSDS);

      const { result } = renderHook(() => useSDS('song-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(fullSDS);
      });
    });
  });
});

describe('isValidSDS', () => {
  it('should validate correct SDS structure', () => {
    expect(isValidSDS(mockSDS)).toBe(true);
  });

  it('should reject null', () => {
    expect(isValidSDS(null)).toBe(false);
  });

  it('should reject undefined', () => {
    expect(isValidSDS(undefined)).toBe(false);
  });

  it('should reject non-objects', () => {
    expect(isValidSDS('string')).toBe(false);
    expect(isValidSDS(123)).toBe(false);
    expect(isValidSDS([])).toBe(false);
  });

  it('should reject objects missing required fields', () => {
    expect(isValidSDS({})).toBe(false);
    expect(isValidSDS({ song_id: 'song-123' })).toBe(false);
    expect(isValidSDS({ song_id: 'song-123', title: 'Test' })).toBe(false);
    expect(isValidSDS({ title: 'Test', global_seed: 42 })).toBe(false);
  });

  it('should reject objects with wrong field types', () => {
    expect(isValidSDS({ song_id: 123, title: 'Test', global_seed: 42 })).toBe(false);
    expect(isValidSDS({ song_id: 'song-123', title: 123, global_seed: 42 })).toBe(false);
    expect(isValidSDS({ song_id: 'song-123', title: 'Test', global_seed: 'abc' })).toBe(false);
  });

  it('should accept SDS with optional fields', () => {
    const sdsWithOptional: SDS = {
      ...mockSDS,
      extra_field: 'test',
    };
    expect(isValidSDS(sdsWithOptional)).toBe(true);
  });
});
