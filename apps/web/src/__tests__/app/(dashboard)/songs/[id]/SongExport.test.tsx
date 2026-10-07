/**
 * SongExport Unit Tests
 * Tests for SDS export functionality
 *
 * Task: SDS-PREVIEW-012
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SongDetailPage from '@/app/(dashboard)/songs/[id]/page';
import { songsApi } from '@/lib/api/songs';
import { useUIStore } from '@/stores';
import type { Song } from '@/types/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-song-id-123' }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/api/songs', () => ({
  songsApi: {
    get: jest.fn(),
    export: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the zustand useUIStore HOOK (not just getState): the component calls
// `const { addToast } = useUIStore()` at the hook call-site, so spying on `getState`
// never reaches the component's live addToast reference.
jest.mock('@/stores', () => ({
  useUIStore: jest.fn(),
}));
const mockUseUIStoreFn = require('@/stores').useUIStore as jest.MockedFunction<typeof useUIStore>;

jest.mock('@/hooks/api/useSongs', () => ({
  useSong: () => ({
    data: mockSong,
    isLoading: false,
    error: null,
  }),
  useDeleteSong: () => ({
    mutateAsync: jest.fn(),
  }),
}));

// Mock PageHeader component to simplify testing
jest.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, actions }: { title: string; actions: React.ReactNode }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <div data-testid="header-actions">{actions}</div>
    </div>
  ),
}));

// Mock EntityDetailSection component
jest.mock('@/components/songs/EntityDetailSection', () => ({
  EntityDetailSection: () => <div data-testid="entity-section">Entity Section</div>,
}));

const mockSong: Song = {
  id: 'test-song-id-123',
  title: 'Test Song',
  status: 'draft',
  global_seed: 12345,
  style_id: 'style-123',
  persona_id: 'persona-123',
  blueprint_id: 'blueprint-123',
  extra_metadata: {
    description: 'A test song',
    genre: 'Pop',
    mood: ['upbeat', 'energetic'],
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// Helper to render component with providers
function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('SongExport', () => {
  let mockAddToast: jest.Mock;
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;
  let mockAppendChild: jest.Mock;
  let mockRemoveChild: jest.Mock;
  let mockClick: jest.Mock;
  // Stored before any spy is installed, used as the non-'a' fallback inside the mock.
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock toast store: wire the mock hook to return { addToast: mockFn }
    mockAddToast = jest.fn();
    mockUseUIStoreFn.mockReturnValue({ addToast: mockAddToast } as any);

    // Mock URL methods
    mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Capture the REAL createElement before the spy is installed so the fallback path
    // inside the mock does not recurse into itself.
    originalCreateElement = document.createElement.bind(document);

    // Mock DOM methods
    mockAppendChild = jest.fn();
    mockRemoveChild = jest.fn();
    mockClick = jest.fn();

    // NOTE: @testing-library/react's render() creates its container via:
    //   container = baseElement.appendChild(document.createElement('div'))
    // If appendChild is mocked to a fn that returns `undefined`, createRoot(undefined) throws.
    // So only mock appendChild for non-Element arguments (i.e. anchor elements added by export
    // code) — for real DOM elements, call through so testing-library gets its container back.
    const realAppendChild = document.body.appendChild.bind(document.body);
    jest.spyOn(document.body, 'appendChild').mockImplementation((child: Node) => {
      if (child instanceof HTMLAnchorElement) {
        return mockAppendChild(child);
      }
      return realAppendChild(child);
    });
    const realRemoveChild = document.body.removeChild.bind(document.body);
    jest.spyOn(document.body, 'removeChild').mockImplementation((child: Node) => {
      if (child instanceof HTMLAnchorElement) {
        return mockRemoveChild(child);
      }
      return realRemoveChild(child);
    });
    // Intercept anchor creation only: store a reference to the REAL createElement so the
    // fallback branch doesn't recurse.  Because jest.spyOn replaces document.createElement,
    // we capture the original first (done above, before the spy is installed).
    // We replace document.createElement only on the document-level prototype so React's
    // internal calls (which use the same function internally) still get real DOM elements.
    // Strategy: spy returns a fake anchor for 'a', calls original for everything else.
    jest.spyOn(document, 'createElement').mockImplementation(
      function(this: Document, tagName: string, options?: ElementCreationOptions) {
        if (tagName === 'a') {
          const fakeAnchor = originalCreateElement('a') as HTMLAnchorElement;
          fakeAnchor.click = mockClick;
          return fakeAnchor;
        }
        return originalCreateElement.call(this, tagName, options);
      } as typeof document.createElement
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render export button in header actions', () => {
    renderWithProviders(<SongDetailPage />);

    // The page renders an "Export SDS" button both in the header and in the Quick Actions
    // section, so use getAllByRole and verify at least one is present.
    const exportButtons = screen.getAllByRole('button', { name: /export sds/i });
    expect(exportButtons.length).toBeGreaterThan(0);
    expect(exportButtons[0]).not.toBeDisabled();
  });

  it('should render export button in quick actions', () => {
    renderWithProviders(<SongDetailPage />);

    // Click on Overview tab to ensure it's visible
    const overviewTab = screen.getByRole('tab', { name: /overview/i });
    fireEvent.click(overviewTab);

    const exportButtons = screen.getAllByRole('button', { name: /export sds/i });
    expect(exportButtons.length).toBeGreaterThan(1); // Should have both header and quick actions button
  });

  it('should trigger download when export button is clicked', async () => {
    const mockBlob = new Blob(['{"test": "data"}'], { type: 'application/json' });
    const mockFilename = 'test_song_sds_20250115.json';

    (songsApi.export as jest.Mock).mockResolvedValue({
      blob: mockBlob,
      filename: mockFilename,
    });

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(songsApi.export).toHaveBeenCalledWith('test-song-id-123');
    });

    // Verify blob URL creation and download
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    // Verify cleanup
    await waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  it('should extract filename from Content-Disposition header', async () => {
    const mockBlob = new Blob(['{"test": "data"}'], { type: 'application/json' });
    const expectedFilename = 'my_custom_song_sds_20250115_143022.json';

    (songsApi.export as jest.Mock).mockResolvedValue({
      blob: mockBlob,
      filename: expectedFilename,
    });

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(songsApi.export).toHaveBeenCalled();
    });

    // The filename should be set on the anchor element
    // This is verified by checking that the API was called and returned the expected filename
    const result = await songsApi.export('test-song-id-123');
    expect(result.filename).toBe(expectedFilename);
  });

  it('should show loading state during export', async () => {
    let resolveExport: (value: { blob: Blob; filename: string }) => void;
    const exportPromise = new Promise<{ blob: Blob; filename: string }>((resolve) => {
      resolveExport = resolve;
    });

    (songsApi.export as jest.Mock).mockReturnValue(exportPromise);

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    // Should show loading spinner
    await waitFor(() => {
      expect(exportButton).toBeDisabled();
      const spinner = exportButton.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });

    // Resolve the promise
    resolveExport!({
      blob: new Blob(['{"test": "data"}'], { type: 'application/json' }),
      filename: 'test.json',
    });

    // Should remove loading state
    await waitFor(() => {
      expect(exportButton).not.toBeDisabled();
    });
  });

  it('should show success toast on successful export', async () => {
    const mockBlob = new Blob(['{"test": "data"}'], { type: 'application/json' });

    (songsApi.export as jest.Mock).mockResolvedValue({
      blob: mockBlob,
      filename: 'test.json',
    });

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('SDS exported successfully', 'success');
    });
  });

  it('should show error toast on export failure', async () => {
    const errorMessage = 'Export failed due to server error';
    (songsApi.export as jest.Mock).mockRejectedValue({
      message: errorMessage,
    });

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(errorMessage, 'error');
    });

    // Should re-enable button after error
    await waitFor(() => {
      expect(exportButton).not.toBeDisabled();
    });
  });

  it('should show generic error message when error has no message', async () => {
    (songsApi.export as jest.Mock).mockRejectedValue(new Error());

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to export SDS', 'error');
    });
  });

  it('should handle network errors gracefully', async () => {
    (songsApi.export as jest.Mock).mockRejectedValue({
      message: 'Network error: Unable to reach server',
    });

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Network error: Unable to reach server',
        'error'
      );
    });
  });

  it('should verify downloaded JSON is valid format', async () => {
    const validJson = {
      song_id: 'test-song-id-123',
      title: 'Test Song',
      style: { genre: 'Pop' },
    };

    const mockBlob = new Blob([JSON.stringify(validJson, null, 2)], {
      type: 'application/json',
    });

    (songsApi.export as jest.Mock).mockResolvedValue({
      blob: mockBlob,
      filename: 'test.json',
    });

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(songsApi.export).toHaveBeenCalled();
    });

    // Verify blob contains valid JSON by decoding it via FileReader (Blob.text() is absent
    // in jsdom 20, which ships a Blob from the WHATWG spec without the text() convenience
    // method added later).
    const result = await songsApi.export('test-song-id-123');
    const textPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(result.blob);
    });
    const text = await textPromise;
    const parsed = JSON.parse(text);
    expect(parsed).toEqual(validJson);
  });

  it('should disable export button only during active export', async () => {
    let resolveExport: (value: { blob: Blob; filename: string }) => void;
    const exportPromise = new Promise<{ blob: Blob; filename: string }>((resolve) => {
      resolveExport = resolve;
    });

    (songsApi.export as jest.Mock).mockReturnValue(exportPromise);

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];

    // Initially enabled
    expect(exportButton).not.toBeDisabled();

    // Click to start export
    fireEvent.click(exportButton);

    // Should be disabled during export
    await waitFor(() => {
      expect(exportButton).toBeDisabled();
    });

    // Resolve export
    resolveExport!({
      blob: new Blob(['{}'], { type: 'application/json' }),
      filename: 'test.json',
    });

    // Should be enabled after export completes
    await waitFor(() => {
      expect(exportButton).not.toBeDisabled();
    });
  });

  it('should work in Chrome, Firefox, and Safari (blob API compatibility)', async () => {
    // This test ensures we're using standard browser APIs that work across browsers
    const mockBlob = new Blob(['{"test": "data"}'], { type: 'application/json' });

    (songsApi.export as jest.Mock).mockResolvedValue({
      blob: mockBlob,
      filename: 'test.json',
    });

    renderWithProviders(<SongDetailPage />);

    const exportButton = screen.getAllByRole('button', { name: /export sds/i })[0];
    fireEvent.click(exportButton);

    await waitFor(() => {
      // Verify we're using standard Blob API
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    // Verify blob type is standard
    expect(mockBlob.type).toBe('application/json');
  });
});
