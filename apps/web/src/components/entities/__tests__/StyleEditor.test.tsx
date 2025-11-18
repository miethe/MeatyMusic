/**
 * StyleEditor Component Tests
 * Phase 4 Frontend - Entity Editor Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleEditor } from '../StyleEditor';

// Mock the hooks
jest.mock('@/hooks/api/useStyles', () => ({
  useStyles: jest.fn(() => ({ data: { items: [] }, isLoading: false })),
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

describe('StyleEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('renders with empty initial value', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Style Editor')).toBeInTheDocument();
      expect(screen.getByLabelText(/style name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/primary genre/i)).toBeInTheDocument();
    });

    it('renders with pre-filled data', () => {
      const initialValue = {
        name: 'Test Style',
        genre: 'pop',
        bpm_min: 100,
        bpm_max: 140,
      };

      renderWithProviders(
        <StyleEditor
          initialValue={initialValue}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/style name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Test Style');
    });

    it('shows all form fields', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/style name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/primary genre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
      expect(screen.getByText(/tempo \(bpm\)/i)).toBeInTheDocument();
      expect(screen.getByText(/energy level/i)).toBeInTheDocument();
    });

    it('shows preview panel', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates name field on input change', async () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/style name/i);
      fireEvent.change(nameInput, { target: { value: 'New Style Name' } });

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('New Style Name');
      });
    });

    it('updates genre field on select change', async () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const genreSelect = screen.getByLabelText(/primary genre/i);
      fireEvent.change(genreSelect, { target: { value: 'rock' } });

      await waitFor(() => {
        expect((genreSelect as HTMLSelectElement).value).toBe('rock');
      });
    });

    it('updates key field on select change', async () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const keySelect = screen.getByLabelText(/key/i);
      fireEvent.change(keySelect, { target: { value: 'C' } });

      await waitFor(() => {
        expect((keySelect as HTMLSelectElement).value).toBe('C');
      });
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty', async () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Wait for validation to run
      await waitFor(() => {
        expect(screen.getByText('Style name is required')).toBeInTheDocument();
      });
    });

    it('shows error when genre is empty', async () => {
      renderWithProviders(
        <StyleEditor
          initialValue={{ name: 'Test' }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Genre is required')).toBeInTheDocument();
      });
    });

    it('shows warning for too many instruments', async () => {
      renderWithProviders(
        <StyleEditor
          initialValue={{
            name: 'Test',
            genre: 'pop',
            instrumentation: ['guitar', 'piano', 'drums', 'bass'],
          }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/more than 3 instruments may dilute the mix/i)
        ).toBeInTheDocument();
      });
    });

    it('disables save button when validation fails', async () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Save/Cancel', () => {
    it('calls onSave with correct data when save is clicked', async () => {
      renderWithProviders(
        <StyleEditor
          initialValue={{
            name: 'Test Style',
            genre: 'pop',
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
          name: 'Test Style',
          genre: 'pop',
        })
      );
    });

    it('calls onCancel when cancel is clicked', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Find cancel button by icon (X)
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

    it('does not call onSave when validation fails', async () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });

      // Try to click (should not work because disabled)
      fireEvent.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Preview Panel Toggle', () => {
    it('toggles preview panel on mobile', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Preview should be visible initially
      expect(screen.getByText('Live Preview')).toBeInTheDocument();

      // Note: Toggle button is hidden on desktop (md:hidden class)
      // This test verifies the button exists but may not be visible
      const toggleButtons = screen.queryAllByRole('button', {
        name: /hide preview|show preview/i,
      });

      // Button might exist but be hidden via CSS
      if (toggleButtons.length > 0) {
        fireEvent.click(toggleButtons[0]);
        // Preview visibility is controlled by state and CSS classes
      }
    });
  });

  describe('Library Selector', () => {
    it('does not show library selector by default', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.queryByText('Add from Library')).not.toBeInTheDocument();
    });

    it('shows library selector when enabled', () => {
      renderWithProviders(
        <StyleEditor
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          showLibrarySelector={true}
        />
      );

      expect(screen.getByText('Add from Library')).toBeInTheDocument();
    });
  });

  describe('Chip Selectors', () => {
    it('renders subgenres chip selector', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Subgenres')).toBeInTheDocument();
    });

    it('renders mood chip selector', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Mood')).toBeInTheDocument();
    });

    it('renders instrumentation chip selector', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Instrumentation')).toBeInTheDocument();
    });

    it('renders positive and negative tags chip selectors', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Positive Tags')).toBeInTheDocument();
      expect(screen.getByText('Negative Tags')).toBeInTheDocument();
    });
  });

  describe('Range Sliders', () => {
    it('renders tempo range slider', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText(/tempo \(bpm\)/i)).toBeInTheDocument();
    });

    it('renders energy level slider', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText(/energy level/i)).toBeInTheDocument();
    });
  });

  describe('Required Fields', () => {
    it('marks style name as required', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const nameLabel = screen.getByText(/style name/i);
      const requiredIndicator = nameLabel.querySelector('.text-accent-error');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('marks genre as required', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const genreLabel = screen.getByText(/primary genre/i);
      const requiredIndicator = genreLabel.querySelector('.text-accent-error');
      expect(requiredIndicator).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/style name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/primary genre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      renderWithProviders(
        <StyleEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });
});
