import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RhymeSchemeInput } from '../../common/RhymeSchemeInput';

describe('RhymeSchemeInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Rhyme Scheme')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <RhymeSchemeInput
          label="Required Scheme"
          value=""
          onChange={mockOnChange}
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays help text when provided', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          helpText="This is help text"
        />
      );

      expect(screen.getByText('This is help text')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          error="This is an error"
        />
      );

      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders input with placeholder', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByPlaceholderText('Enter pattern (e.g., ABAB)')).toBeInTheDocument();
    });

    it('displays current value', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value="ABAB"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)') as HTMLInputElement;
      expect(input.value).toBe('ABAB');
    });
  });

  describe('Common Patterns', () => {
    it('renders common pattern buttons', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('AABB (Couplet)')).toBeInTheDocument();
      expect(screen.getByText('ABAB (Alternate)')).toBeInTheDocument();
      expect(screen.getByText('ABCB (Simple)')).toBeInTheDocument();
      expect(screen.getByText('AAAA (Monorhyme)')).toBeInTheDocument();
      expect(screen.getByText('ABBA (Enclosed)')).toBeInTheDocument();
    });

    it('applies pattern when clicked', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      const button = screen.getByText('ABAB (Alternate)');
      fireEvent.click(button);

      expect(mockOnChange).toHaveBeenCalledWith('ABAB');
    });

    it('highlights selected pattern', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value="ABAB"
          onChange={mockOnChange}
        />
      );

      const button = screen.getByText('ABAB (Alternate)');
      expect(button).toHaveClass('bg-accent-primary');
    });

    it('does not apply pattern when disabled', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const button = screen.getByText('ABAB (Alternate)');
      fireEvent.click(button);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Custom Input', () => {
    it('accepts custom pattern input', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)');
      fireEvent.change(input, { target: { value: 'ABCABC' } });

      expect(mockOnChange).toHaveBeenCalledWith('ABCABC');
    });

    it('converts input to uppercase', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)');
      fireEvent.change(input, { target: { value: 'abab' } });

      expect(mockOnChange).toHaveBeenCalledWith('ABAB');
    });

    it('removes non-letter characters', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)');
      fireEvent.change(input, { target: { value: 'A1B2C3' } });

      expect(mockOnChange).toHaveBeenCalledWith('ABC');
    });

    it('handles mixed input with spaces and symbols', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)');
      fireEvent.change(input, { target: { value: 'A B-C D' } });

      expect(mockOnChange).toHaveBeenCalledWith('ABCD');
    });

    it('does not accept input when disabled', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)');
      expect(input).toBeDisabled();
    });
  });

  describe('Visualization', () => {
    it('shows visualization when value is provided', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value="ABAB"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Visualization')).toBeInTheDocument();
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Line 3')).toBeInTheDocument();
      expect(screen.getByText('Line 4')).toBeInTheDocument();
    });

    it('hides visualization when value is empty', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText('Visualization')).not.toBeInTheDocument();
    });

    it('displays letter badges for each line', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value="ABAB"
          onChange={mockOnChange}
        />
      );

      // Find all badges (we expect 4 for ABAB)
      const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];
      lines.forEach(line => {
        expect(screen.getByText(line)).toBeInTheDocument();
      });
    });

    it('visualizes monorhyme pattern correctly', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value="AAAA"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Line 3')).toBeInTheDocument();
      expect(screen.getByText('Line 4')).toBeInTheDocument();
    });

    it('visualizes complex pattern correctly', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value="ABCABC"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 6')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value="ABAB"
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)');
      expect(input).toBeDisabled();
    });

    it('disables pattern buttons when disabled', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('error message has alert role', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          error="Error message"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });

    it('input has proper labels', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Pattern')).toBeInTheDocument();
      expect(screen.getByText('Common Patterns')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error styling on input', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          error="Invalid pattern"
        />
      );

      const input = screen.getByPlaceholderText('Enter pattern (e.g., ABAB)');
      expect(input).toHaveClass('border-accent-error');
    });

    it('prioritizes error over help text', () => {
      render(
        <RhymeSchemeInput
          label="Rhyme Scheme"
          value=""
          onChange={mockOnChange}
          helpText="Help text"
          error="Error message"
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    });
  });
});
