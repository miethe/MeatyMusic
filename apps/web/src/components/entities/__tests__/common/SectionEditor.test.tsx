import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SectionEditor, Section } from '../../common/SectionEditor';

describe('SectionEditor', () => {
  const mockOnChange = jest.fn();

  const sectionTypes = [
    { value: 'intro', label: 'Intro', color: 'bg-gray-500/20 border-gray-500/40' },
    { value: 'verse', label: 'Verse', color: 'bg-accent-secondary/20 border-accent-secondary/40' },
    { value: 'chorus', label: 'Chorus', color: 'bg-accent-music/20 border-accent-music/40' },
    { value: 'bridge', label: 'Bridge', color: 'bg-accent-warning/20 border-accent-warning/40' },
  ];

  const mockSections: Section[] = [
    { id: 'section-1', type: 'verse', duration: 30, lines: 4 },
    { id: 'section-2', type: 'chorus', duration: 20, lines: 4 },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      expect(screen.getByText('Test Sections')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <SectionEditor
          label="Required Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays help text when provided', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          helpText="This is help text"
        />
      );

      expect(screen.getByText('This is help text')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          error="This is an error"
        />
      );

      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders existing sections', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      // Check that sections are rendered (via select elements)
      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });

    it('renders add section button', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      expect(screen.getByText('Add Section')).toBeInTheDocument();
    });
  });

  describe('Adding Sections', () => {
    it('adds a new section when button is clicked', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      const addButton = screen.getByText('Add Section');
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'intro',
          duration: 0,
        }),
      ]);
    });

    it('adds section with duration when showDuration is true', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showDuration={true}
        />
      );

      const addButton = screen.getByText('Add Section');
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          duration: 0,
        }),
      ]);
    });

    it('adds section with lines when showLines is true', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showLines={true}
        />
      );

      const addButton = screen.getByText('Add Section');
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          lines: 0,
        }),
      ]);
    });

    it('does not add section when disabled', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          disabled={true}
        />
      );

      const addButton = screen.getByText('Add Section');
      fireEvent.click(addButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Removing Sections', () => {
    it('removes a section when delete button is clicked', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/Remove .* section/i);
      fireEvent.click(deleteButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([mockSections[1]]);
    });

    it('removes correct section', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/Remove .* section/i);
      fireEvent.click(deleteButtons[1]); // Remove second section

      expect(mockOnChange).toHaveBeenCalledWith([mockSections[0]]);
    });

    it('does not remove section when disabled', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          disabled={true}
        />
      );

      const deleteButtons = screen.getAllByLabelText(/Remove .* section/i);
      expect(deleteButtons[0]).toBeDisabled();
    });
  });

  describe('Updating Sections', () => {
    it('updates section type', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'bridge' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        { ...mockSections[0], type: 'bridge' },
        mockSections[1],
      ]);
    });

    it('updates section duration when showDuration is true', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showDuration={true}
        />
      );

      const durationInputs = screen.getAllByRole('spinbutton');
      const durationInput = durationInputs.find(input =>
        input.getAttribute('value') === '30'
      );

      if (durationInput) {
        fireEvent.change(durationInput, { target: { value: '45' } });

        expect(mockOnChange).toHaveBeenCalledWith([
          { ...mockSections[0], duration: 45 },
          mockSections[1],
        ]);
      }
    });

    it('updates section lines when showLines is true', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showLines={true}
        />
      );

      const lineInputs = screen.getAllByRole('spinbutton');
      const lineInput = lineInputs.find(input =>
        input.getAttribute('value') === '4'
      );

      if (lineInput) {
        fireEvent.change(lineInput, { target: { value: '8' } });

        expect(mockOnChange).toHaveBeenCalledWith([
          { ...mockSections[0], lines: 8 },
          mockSections[1],
        ]);
      }
    });

    it('does not update when disabled', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          disabled={true}
        />
      );

      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toBeDisabled();
    });
  });

  describe('Duration Display', () => {
    it('shows duration inputs when showDuration is true', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showDuration={true}
        />
      );

      expect(screen.getAllByText('Duration:')).toHaveLength(2);
    });

    it('hides duration inputs when showDuration is false', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showDuration={false}
        />
      );

      expect(screen.queryByText('Duration:')).not.toBeInTheDocument();
    });

    it('displays total duration when sections have duration', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showDuration={true}
        />
      );

      expect(screen.getByText('Total Duration:')).toBeInTheDocument();
      expect(screen.getByText('50s')).toBeInTheDocument(); // 30 + 20
    });

    it('does not show total duration when no sections', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showDuration={true}
        />
      );

      expect(screen.queryByText('Total Duration:')).not.toBeInTheDocument();
    });
  });

  describe('Lines Display', () => {
    it('shows lines inputs when showLines is true', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showLines={true}
        />
      );

      expect(screen.getAllByText('Lines:')).toHaveLength(2);
    });

    it('hides lines inputs when showLines is false', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          showLines={false}
        />
      );

      expect(screen.queryByText('Lines:')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('makes sections draggable when not disabled', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const firstSection = selects[0].closest('[draggable]');
      expect(firstSection).toHaveAttribute('draggable', 'true');
    });

    it('makes sections non-draggable when disabled', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          disabled={true}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const firstSection = selects[0].closest('[draggable]');
      expect(firstSection).toHaveAttribute('draggable', 'false');
    });
  });

  describe('Disabled State', () => {
    it('disables all controls when disabled', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          disabled={true}
          showDuration={true}
          showLines={true}
        />
      );

      const selects = screen.getAllByRole('combobox');
      const spinbuttons = screen.getAllByRole('spinbutton');
      const buttons = screen.getAllByRole('button');

      selects.forEach(select => expect(select).toBeDisabled());
      spinbuttons.forEach(input => expect(input).toBeDisabled());
      buttons.forEach(button => expect(button).toBeDisabled());
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for delete buttons', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={mockSections}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      expect(screen.getByLabelText('Remove verse section')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove chorus section')).toBeInTheDocument();
    });

    it('error message has alert role', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
          error="Error message"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });
  });

  describe('Empty State', () => {
    it('renders empty state with add button', () => {
      render(
        <SectionEditor
          label="Test Sections"
          sections={[]}
          onChange={mockOnChange}
          sectionTypes={sectionTypes}
        />
      );

      expect(screen.getByText('Add Section')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });
});
