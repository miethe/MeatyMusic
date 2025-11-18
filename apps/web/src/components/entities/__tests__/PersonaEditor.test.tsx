/**
 * PersonaEditor Component Tests
 * Phase 4 Frontend - Entity Editor Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersonaEditor } from '../PersonaEditor';
import { PersonaKind } from '@/types/api/entities';

jest.mock('@/hooks/api/usePersonas', () => ({
  usePersonas: jest.fn(() => ({ data: { items: [] }, isLoading: false })),
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

describe('PersonaEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('renders with empty initial value', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Persona Editor')).toBeInTheDocument();
      expect(screen.getByLabelText(/persona name/i)).toBeInTheDocument();
    });

    it('renders with pre-filled data', () => {
      const initialValue = {
        name: 'Test Persona',
        kind: PersonaKind.ARTIST,
        vocal_range: 'tenor',
      };

      renderWithProviders(
        <PersonaEditor initialValue={initialValue} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Test Persona');
    });

    it('shows all form fields', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/persona name/i)).toBeInTheDocument();
      expect(screen.getByText('Kind')).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/voice description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vocal range/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates name field', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/persona name/i);
      fireEvent.change(nameInput, { target: { value: 'New Persona' } });

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('New Persona');
      });
    });

    it('updates kind field with radio buttons', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const bandRadio = screen.getByLabelText('Band');
      fireEvent.click(bandRadio);

      await waitFor(() => {
        expect(bandRadio).toBeChecked();
      });
    });

    it('updates bio field', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const bioTextarea = screen.getByLabelText(/bio/i);
      fireEvent.change(bioTextarea, { target: { value: 'Test bio' } });

      await waitFor(() => {
        expect((bioTextarea as HTMLTextAreaElement).value).toBe('Test bio');
      });
    });

    it('updates vocal range', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const rangeSelect = screen.getByLabelText(/vocal range/i);
      fireEvent.change(rangeSelect, { target: { value: 'tenor' } });

      await waitFor(() => {
        expect((rangeSelect as HTMLSelectElement).value).toBe('tenor');
      });
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(screen.getByText('Persona name is required')).toBeInTheDocument();
      });
    });

    it('shows warning for public release with influences', async () => {
      renderWithProviders(
        <PersonaEditor
          initialValue={{
            name: 'Test',
            policy: { public_release: true, disallow_named_style_of: true },
            influences: ['Artist 1'],
          }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/public release with named influences may require sanitization/i)
        ).toBeInTheDocument();
      });
    });

    it('disables save when validation fails', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Policy Settings', () => {
    it('renders policy settings section', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Policy Settings')).toBeInTheDocument();
      expect(screen.getByLabelText(/allow public release/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/disallow named "style of" references/i)).toBeInTheDocument();
    });

    it('toggles public release checkbox', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const checkbox = screen.getByLabelText(/allow public release/i);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });

    it('toggles disallow named style of checkbox', async () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const checkbox = screen.getByLabelText(/disallow named "style of" references/i);

      // It should be checked by default
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Save/Cancel', () => {
    it('calls onSave with correct data', async () => {
      renderWithProviders(
        <PersonaEditor
          initialValue={{
            name: 'Test Persona',
            kind: PersonaKind.ARTIST,
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
          name: 'Test Persona',
          kind: PersonaKind.ARTIST,
        })
      );
    });

    it('calls onCancel when cancel is clicked', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
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

  describe('Chip Selectors', () => {
    it('renders delivery styles chip selector', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Delivery Styles')).toBeInTheDocument();
    });

    it('renders influences chip selector', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Influences')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/persona name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/voice description/i)).toBeInTheDocument();
    });

    it('has accessible radio buttons', () => {
      renderWithProviders(
        <PersonaEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText('Artist')).toBeInTheDocument();
      expect(screen.getByLabelText('Band')).toBeInTheDocument();
    });
  });
});
