/**
 * LyricsEditor Component Tests
 * Phase 4 Frontend - Entity Editor Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LyricsEditor } from '../LyricsEditor';
import { POV, Tense, HookStrategy } from '@/types/api/entities';

// Mock the hooks
jest.mock('@/hooks/api/useLyrics', () => ({
  useLyricsList: jest.fn(() => ({ data: { items: [] }, isLoading: false })),
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

describe('LyricsEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('renders with empty initial value', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Lyrics Editor')).toBeInTheDocument();
    });

    it('renders section editor', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/section structure/i)).toBeInTheDocument();
      expect(screen.getByText('Add Section')).toBeInTheDocument();
    });

    it('shows all form fields', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/point of view/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/verb tense/i)).toBeInTheDocument();
    });

    it('shows rhyme scheme input', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/rhyme scheme/i)).toBeInTheDocument();
    });

    it('shows themes chip selector', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Themes')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates language field', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const languageInput = screen.getByLabelText(/language/i);
      fireEvent.change(languageInput, { target: { value: 'Spanish' } });

      await waitFor(() => {
        expect((languageInput as HTMLInputElement).value).toBe('Spanish');
      });
    });

    it('updates meter field', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const meterSelect = screen.getByLabelText(/meter/i);
      fireEvent.change(meterSelect, { target: { value: '3/4' } });

      await waitFor(() => {
        expect((meterSelect as HTMLSelectElement).value).toBe('3/4');
      });
    });

    it('updates POV field', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const povSelect = screen.getByLabelText(/point of view/i);
      fireEvent.change(povSelect, { target: { value: POV.SECOND_PERSON } });

      await waitFor(() => {
        expect((povSelect as HTMLSelectElement).value).toBe(POV.SECOND_PERSON);
      });
    });

    it('updates tense field', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const tenseSelect = screen.getByLabelText(/verb tense/i);
      fireEvent.change(tenseSelect, { target: { value: Tense.PAST } });

      await waitFor(() => {
        expect((tenseSelect as HTMLSelectElement).value).toBe(Tense.PAST);
      });
    });

    it('updates syllables per line', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const syllablesInput = screen.getByLabelText(/syllables per line/i);
      fireEvent.change(syllablesInput, { target: { value: '10' } });

      await waitFor(() => {
        expect((syllablesInput as HTMLInputElement).value).toBe('10');
      });
    });

    it('updates hook strategy', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const hookSelect = screen.getByLabelText(/hook strategy/i);
      fireEvent.change(hookSelect, { target: { value: HookStrategy.LYRICAL } });

      await waitFor(() => {
        expect((hookSelect as HTMLSelectElement).value).toBe(HookStrategy.LYRICAL);
      });
    });

    it('toggles explicit allowed checkbox', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const explicitCheckbox = screen.getByLabelText(/allow explicit content/i);
      fireEvent.click(explicitCheckbox);

      await waitFor(() => {
        expect(explicitCheckbox).toBeChecked();
      });
    });
  });

  describe('Validation', () => {
    it('shows error when no chorus section', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Add a verse section (not a chorus)
      const addButton = screen.getByText('Add Section');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText(/at least one chorus section is required/i)
        ).toBeInTheDocument();
      });
    });

    it('shows warning for syllables out of range', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{ syllables_per_line: 2 }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/syllables per line should be between 4 and 16/i)
        ).toBeInTheDocument();
      });
    });

    it('disables save when validation fails', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Add a non-chorus section to trigger validation error
      const addButton = screen.getByText('Add Section');
      fireEvent.click(addButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Save/Cancel', () => {
    it('calls onSave with correct data', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{
            language: 'English',
            pov: POV.FIRST_PERSON,
            tense: Tense.PRESENT,
          }}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Add a chorus section to pass validation
      const addButton = screen.getByText('Add Section');
      fireEvent.click(addButton);

      // Wait for section to be added and change type to chorus
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        const sectionTypeSelect = selects.find(
          (select) => (select as HTMLSelectElement).value === 'intro'
        );
        if (sectionTypeSelect) {
          fireEvent.change(sectionTypeSelect, { target: { value: 'chorus' } });
        }
      });

      // Wait for validation to pass
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).not.toBeDisabled();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          song_id: 'song-1',
          language: 'English',
          pov: POV.FIRST_PERSON,
          tense: Tense.PRESENT,
        })
      );
    });

    it('calls onCancel when cancel is clicked', () => {
      renderWithProviders(
        <LyricsEditor
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

  describe('Imagery Density Slider', () => {
    it('renders imagery density slider', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Imagery Density')).toBeInTheDocument();
      expect(screen.getByText('Literal')).toBeInTheDocument();
      expect(screen.getByText('Poetic')).toBeInTheDocument();
    });

    it('updates imagery density value', async () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Find the imagery density slider
      const sliders = screen.getAllByRole('slider');
      const imagerySlider = sliders.find(slider =>
        slider.getAttribute('min') === '0' &&
        slider.getAttribute('max') === '10'
      );

      if (imagerySlider) {
        fireEvent.change(imagerySlider, { target: { value: '7' } });

        await waitFor(() => {
          expect((imagerySlider as HTMLInputElement).value).toBe('7');
        });
      }
    });
  });

  describe('Library Selector', () => {
    it('does not show library selector by default', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Add from Library')).not.toBeInTheDocument();
    });

    it('shows library selector when enabled', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
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
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/point of view/i)).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      renderWithProviders(
        <LyricsEditor
          songId="song-1"
          initialValue={{}}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByText('Add Section')).toBeInTheDocument();
    });
  });
});
