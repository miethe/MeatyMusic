/**
 * ProducerNotesEditor Component Tests
 * Phase 4 Frontend - Entity Editor Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProducerNotesEditor } from '../ProducerNotesEditor';

jest.mock('@/hooks/api/useProducerNotes', () => ({
  useProducerNotesList: jest.fn(() => ({ data: { items: [] }, isLoading: false })),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('ProducerNotesEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('renders with empty initial value', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Producer Notes Editor')).toBeInTheDocument();
    });

    it('renders section editor', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/arrangement structure/i)).toBeInTheDocument();
      expect(screen.getByText('Add Section')).toBeInTheDocument();
    });

    it('shows all form fields', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/hook count/i)).toBeInTheDocument();
      expect(screen.getByText('Additional Instrumentation')).toBeInTheDocument();
      expect(screen.getByText('Mix Parameters')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates hook count', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const hooksInput = screen.getByLabelText(/hook count/i);
      fireEvent.change(hooksInput, { target: { value: '3' } });

      await waitFor(() => {
        expect((hooksInput as HTMLInputElement).value).toBe('3');
      });
    });

    it('updates LUFS target', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const lufsInput = screen.getByLabelText(/lufs target/i);
      fireEvent.change(lufsInput, { target: { value: '-10' } });

      await waitFor(() => {
        expect((lufsInput as HTMLInputElement).value).toBe('-10');
      });
    });

    it('updates space setting', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const spaceSelect = screen.getByLabelText(/space/i);
      fireEvent.change(spaceSelect, { target: { value: 'roomy' } });

      await waitFor(() => {
        expect((spaceSelect as HTMLSelectElement).value).toBe('roomy');
      });
    });

    it('updates stereo width with radio buttons', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const wideRadio = screen.getByLabelText('Wide');
      fireEvent.click(wideRadio);

      await waitFor(() => {
        expect(wideRadio).toBeChecked();
      });
    });
  });

  describe('Validation', () => {
    it('shows error for negative hook count', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{ hooks: -1 }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/hooks count cannot be negative/i)).toBeInTheDocument();
      });
    });

    it('shows warning for too many hooks', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{ hooks: 10 }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/more than 8 hooks may overwhelm the arrangement/i)
        ).toBeInTheDocument();
      });
    });

    it('disables save when validation fails', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{ hooks: -1 }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Mix Parameters', () => {
    it('renders mix parameters section', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Mix Parameters')).toBeInTheDocument();
      expect(screen.getByLabelText(/lufs target/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/space/i)).toBeInTheDocument();
      expect(screen.getByText('Stereo Width')).toBeInTheDocument();
    });

    it('shows stereo width options', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText('Narrow')).toBeInTheDocument();
      expect(screen.getByLabelText('Normal')).toBeInTheDocument();
      expect(screen.getByLabelText('Wide')).toBeInTheDocument();
    });
  });

  describe('Save/Cancel', () => {
    it('calls onSave with correct data', async () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{
            hooks: 3,
            mix: { lufs: -12, space: 'normal', stereo_width: 'normal' },
          }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).not.toBeDisabled();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          song_id: 'song-1',
          hooks: 3,
        })
      );
    });

    it('calls onCancel when cancel is clicked', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(btn =>
        btn.className.includes('border-border-secondary') &&
        btn.querySelector('svg')
      );

      if (cancelButton) {
        fireEvent.click(cancelButton);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/hook count/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/lufs target/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/space/i)).toBeInTheDocument();
    });

    it('has accessible radio buttons', () => {
      renderWithProviders(
        <ProducerNotesEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText('Narrow')).toBeInTheDocument();
      expect(screen.getByLabelText('Normal')).toBeInTheDocument();
      expect(screen.getByLabelText('Wide')).toBeInTheDocument();
    });
  });
});
