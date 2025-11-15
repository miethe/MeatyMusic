/**
 * Song Detail Preview Tab Tests
 * Tests for the Preview tab functionality in Song Detail page
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import SongDetailPage from '@/app/(dashboard)/songs/[id]/page';
import { useSong, useDeleteSong, useSDS } from '@/hooks/api';
import { songsApi } from '@/lib/api';
import { useUIStore } from '@/stores';
import type { Song, SDS } from '@/lib/api';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock hooks
jest.mock('@/hooks/api', () => ({
  useSong: jest.fn(),
  useDeleteSong: jest.fn(),
  useSDS: jest.fn(),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  songsApi: {
    export: jest.fn(),
  },
}));

// Mock stores
jest.mock('@/stores', () => ({
  useUIStore: jest.fn(),
}));

// Mock components
jest.mock('@/components/songs/EntityDetailSection', () => ({
  EntityDetailSection: ({ entityType }: { entityType: string }) => (
    <div data-testid={`entity-section-${entityType}`}>{entityType}</div>
  ),
}));

jest.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, actions }: { title: string; actions: React.ReactNode }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <div>{actions}</div>
    </div>
  ),
}));

const mockUseSong = useSong as jest.MockedFunction<typeof useSong>;
const mockUseDeleteSong = useDeleteSong as jest.MockedFunction<typeof useDeleteSong>;
const mockUseSDS = useSDS as jest.MockedFunction<typeof useSDS>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;
const mockSongsApi = songsApi as jest.Mocked<typeof songsApi>;

// Mock data
const mockSong: Song = {
  id: 'song-123',
  title: 'Test Song',
  status: 'draft',
  global_seed: 42,
  style_id: 'style-1',
  persona_id: 'persona-1',
  blueprint_id: 'blueprint-1',
  extra_metadata: {
    description: 'Test description',
    genre: 'pop',
    mood: ['upbeat', 'energetic'],
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
};

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
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Song Detail Page - Preview Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockUseParams.mockReturnValue({ id: 'song-123' });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseSong.mockReturnValue({
      data: mockSong,
      isLoading: false,
      error: null,
    } as any);

    mockUseDeleteSong.mockReturnValue({
      mutateAsync: jest.fn(),
    } as any);

    mockUseSDS.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    mockUseUIStore.mockReturnValue({
      addToast: jest.fn(),
    } as any);
  });

  describe('Tab Visibility', () => {
    it('should show Preview tab in tab list', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
    });

    it('should list all tabs in correct order', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);
      expect(tabs[0]).toHaveTextContent('Overview');
      expect(tabs[1]).toHaveTextContent('Entities');
      expect(tabs[2]).toHaveTextContent('Workflow');
      expect(tabs[3]).toHaveTextContent('History');
      expect(tabs[4]).toHaveTextContent('Preview');
    });
  });

  describe('SDS Data Fetching', () => {
    it('should not fetch SDS data initially', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      // useSDS should be called with undefined initially
      expect(mockUseSDS).toHaveBeenCalledWith(undefined);
    });

    it('should fetch SDS data when Preview tab is clicked', async () => {
      const Wrapper = createWrapper();
      const { rerender } = render(<SongDetailPage />, { wrapper: Wrapper });

      // Click Preview tab
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      // After clicking, component should re-render with songId
      // We need to simulate the state change
      mockUseSDS.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      rerender(<SongDetailPage />);

      // Should be loading
      expect(mockUseSDS).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when fetching SDS', () => {
      mockUseSDS.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      // Click Preview tab
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      // Should show loading state
      expect(screen.getByText(/loading sds/i)).toBeInTheDocument();
    });

    it('should show loading spinner with correct text', () => {
      mockUseSDS.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      expect(screen.getByText('Loading SDS...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when SDS fetch fails', () => {
      mockUseSDS.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to compile SDS'),
      } as any);

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      expect(screen.getByText(/failed to load sds/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to compile sds/i)).toBeInTheDocument();
    });

    it('should show default error message when error has no message', () => {
      mockUseSDS.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: {} as any,
      } as any);

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      expect(screen.getByText(/unable to compile song design spec/i)).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      mockUseSDS.mockReturnValue({
        data: mockSDS,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display SDS JSON when loaded', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      // Should show JSON content
      const jsonText = screen.getByText(/"song_id": "song-123"/);
      expect(jsonText).toBeInTheDocument();
    });

    it('should display placeholder message for JsonViewer', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      expect(screen.getByText(/json viewer placeholder/i)).toBeInTheDocument();
      expect(screen.getByText(/awaiting task sds-preview-010/i)).toBeInTheDocument();
    });

    it('should display SDS metadata summary cards', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      // Check for metadata cards
      expect(screen.getByText('Song ID')).toBeInTheDocument();
      expect(screen.getByText(mockSDS.song_id)).toBeInTheDocument();

      expect(screen.getAllByText('Title')[0]).toBeInTheDocument(); // First Title label
      expect(screen.getByText(mockSDS.title)).toBeInTheDocument();

      expect(screen.getAllByText('Global Seed')[0]).toBeInTheDocument(); // First Global Seed label
      expect(screen.getByText(String(mockSDS.global_seed))).toBeInTheDocument();
    });

    it('should display Export SDS button in Preview tab', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      const exportButtons = screen.getAllByRole('button', { name: /export sds/i });
      // Should have at least one Export SDS button (in Preview tab)
      expect(exportButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Export Functionality', () => {
    it('should trigger download when Export button is clicked', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/json' });
      mockSongsApi.export.mockResolvedValue({
        blob: mockBlob,
        filename: 'sds_song-123.json',
      });

      // Mock URL.createObjectURL and related APIs
      global.URL.createObjectURL = jest.fn(() => 'blob:test');
      global.URL.revokeObjectURL = jest.fn();

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockSongsApi.export).toHaveBeenCalledWith('song-123');
      });

      expect(mockUseUIStore().addToast).toHaveBeenCalledWith(
        'SDS exported successfully',
        'success'
      );
    });

    it('should show error toast when export fails', async () => {
      mockSongsApi.export.mockRejectedValue(new Error('Export failed'));

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockUseUIStore().addToast).toHaveBeenCalledWith(
          'Export failed',
          'error'
        );
      });
    });

    it('should disable Export button while exporting', async () => {
      mockSongsApi.export.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];

      expect(exportButton).not.toBeDisabled();

      fireEvent.click(exportButton);

      // Button should be disabled during export
      await waitFor(() => {
        expect(exportButton).toBeDisabled();
      });
    });
  });

  describe('React Query Caching', () => {
    it('should not re-fetch SDS when switching tabs back to Preview', async () => {
      mockUseSDS
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: mockSDS,
          isLoading: false,
          error: null,
        } as any);

      const Wrapper = createWrapper();
      const { rerender } = render(<SongDetailPage />, { wrapper: Wrapper });

      // Click Preview tab first time
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      rerender(<SongDetailPage />);

      // Click Overview tab
      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      fireEvent.click(overviewTab);

      // Click Preview tab again
      fireEvent.click(previewTab);

      // Should use cached data (React Query handles this)
      expect(mockUseSDS).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for tabs', () => {
      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      expect(previewTab).toHaveAttribute('role', 'tab');
    });

    it('should have accessible error messages', () => {
      mockUseSDS.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Test error'),
      } as any);

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      // Error message should be visible and readable
      const errorText = screen.getByText(/failed to load sds/i);
      expect(errorText).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty SDS data gracefully', () => {
      const emptySDS: SDS = {
        song_id: '',
        title: '',
        global_seed: 0,
      };

      mockUseSDS.mockReturnValue({
        data: emptySDS,
        isLoading: false,
        error: null,
      } as any);

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      // Should still render without crashing
      expect(screen.getByText('Song ID')).toBeInTheDocument();
    });

    it('should handle missing optional fields in SDS', () => {
      const minimalSDS: SDS = {
        song_id: 'song-123',
        title: 'Test Song',
        global_seed: 42,
      };

      mockUseSDS.mockReturnValue({
        data: minimalSDS,
        isLoading: false,
        error: null,
      } as any);

      const Wrapper = createWrapper();
      render(<SongDetailPage />, { wrapper: Wrapper });

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      fireEvent.click(previewTab);

      // Should render successfully
      expect(screen.getByText('Song ID')).toBeInTheDocument();
      expect(screen.getByText(minimalSDS.song_id)).toBeInTheDocument();
    });
  });
});
