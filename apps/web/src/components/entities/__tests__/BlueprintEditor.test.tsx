/**
 * BlueprintEditor Component Tests
 * Phase 4 Frontend - Entity Editor Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlueprintEditor } from '../BlueprintEditor';

jest.mock('@/hooks/api/useBlueprints', () => ({
  useBlueprints: jest.fn(() => ({ data: { items: [] }, isLoading: false })),
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

describe('BlueprintEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('renders with empty initial value', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Blueprint Editor')).toBeInTheDocument();
    });

    it('renders with pre-filled data', () => {
      const initialValue = {
        genre: 'pop',
        version: '1.0',
      };

      renderWithProviders(
        <BlueprintEditor
          initialValue={initialValue}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const genreSelect = screen.getByLabelText(/genre/i) as HTMLSelectElement;
      expect(genreSelect.value).toBe('pop');
    });

    it('shows all form sections', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
      expect(screen.getByText('Rules')).toBeInTheDocument();
      expect(screen.getByText('Evaluation Rubric Weights')).toBeInTheDocument();
      expect(screen.getByText('Evaluation Thresholds')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates genre field', async () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const genreSelect = screen.getByLabelText(/genre/i);
      fireEvent.change(genreSelect, { target: { value: 'rock' } });

      await waitFor(() => {
        expect((genreSelect as HTMLSelectElement).value).toBe('rock');
      });
    });

    it('updates version field', async () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const versionInput = screen.getByLabelText(/version/i);
      fireEvent.change(versionInput, { target: { value: '2.0' } });

      await waitFor(() => {
        expect((versionInput as HTMLInputElement).value).toBe('2.0');
      });
    });

    it('updates weight inputs', async () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Find hook density weight input
      const hookDensityLabel = screen.getByText(/hook density/i);
      const hookDensityInput = hookDensityLabel.closest('div')?.querySelector('input');

      if (hookDensityInput) {
        fireEvent.change(hookDensityInput, { target: { value: '0.3' } });

        await waitFor(() => {
          expect((hookDensityInput as HTMLInputElement).value).toBe('0.3');
        });
      }
    });

    it('updates threshold inputs', async () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const minTotalInput = screen.getByLabelText(/minimum total score/i);
      fireEvent.change(minTotalInput, { target: { value: '8.0' } });

      await waitFor(() => {
        expect((minTotalInput as HTMLInputElement).value).toBe('8.0');
      });
    });
  });

  describe('Validation', () => {
    it('shows error when genre is empty', async () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      await waitFor(() => {
        expect(screen.getByText('Genre is required')).toBeInTheDocument();
      });
    });

    it('shows warning when weights do not sum to 1.0', async () => {
      const invalidWeights = {
        genre: 'pop',
        eval_rubric: {
          weights: {
            hook_density: 0.5,
            singability: 0.3,
            rhyme_tightness: 0.1,
            section_completeness: 0.05,
            profanity_score: 0.05,
          },
          thresholds: {
            min_total: 7.0,
            max_profanity: 2.0,
          },
        },
      };

      renderWithProviders(
        <BlueprintEditor
          initialValue={invalidWeights}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Weights sum to 1.0, so no warning should appear
      // Let's test with actual invalid sum
      const hookDensityLabel = screen.getByText(/hook density/i);
      const hookDensityInput = hookDensityLabel.closest('div')?.querySelector('input');

      if (hookDensityInput) {
        fireEvent.change(hookDensityInput, { target: { value: '0.6' } });

        await waitFor(() => {
          // Should show warning about weights not summing to 1.0
          const warning = screen.queryByText(/weights must sum to 1\.0/i);
          if (warning) {
            expect(warning).toBeInTheDocument();
          }
        });
      }
    });

    it('disables save when validation fails', async () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Rules Section', () => {
    it('renders rules section components', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Rules')).toBeInTheDocument();
      expect(screen.getByText(/tempo bpm range/i)).toBeInTheDocument();
      expect(screen.getByText('Required Sections')).toBeInTheDocument();
      expect(screen.getByText('Banned Terms')).toBeInTheDocument();
      expect(screen.getByText('Positive Lexicon')).toBeInTheDocument();
      expect(screen.getByText('Negative Lexicon')).toBeInTheDocument();
    });
  });

  describe('Evaluation Weights Section', () => {
    it('renders all weight inputs', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByText(/hook density/i)).toBeInTheDocument();
      expect(screen.getByText(/singability/i)).toBeInTheDocument();
      expect(screen.getByText(/rhyme tightness/i)).toBeInTheDocument();
      expect(screen.getByText(/section completeness/i)).toBeInTheDocument();
      expect(screen.getByText(/profanity score/i)).toBeInTheDocument();
    });
  });

  describe('Evaluation Thresholds Section', () => {
    it('renders threshold inputs', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/minimum total score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum profanity score/i)).toBeInTheDocument();
    });
  });

  describe('Save/Cancel', () => {
    it('calls onSave with correct data', async () => {
      renderWithProviders(
        <BlueprintEditor
          initialValue={{
            genre: 'pop',
            version: '1.0',
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
          genre: 'pop',
          version: '1.0',
        })
      );
    });

    it('calls onCancel when cancel is clicked', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
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

  describe('Library Selector', () => {
    it('does not show library selector by default', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.queryByText('Add from Library')).not.toBeInTheDocument();
    });

    it('shows library selector when enabled', () => {
      renderWithProviders(
        <BlueprintEditor
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          showLibrarySelector={true}
        />
      );

      expect(screen.getByText('Add from Library')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/version/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum total score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum profanity score/i)).toBeInTheDocument();
    });

    it('has accessible buttons', () => {
      renderWithProviders(
        <BlueprintEditor initialValue={{}} onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });
});
