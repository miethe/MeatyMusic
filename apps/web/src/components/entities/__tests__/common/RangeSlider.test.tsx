import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RangeSlider } from '../../common/RangeSlider';

describe('RangeSlider', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders with label and single value', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Test Slider')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('renders with range value', () => {
      render(
        <RangeSlider
          label="Test Range"
          min={0}
          max={100}
          value={[20, 80]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('20 - 80')).toBeInTheDocument();
    });

    it('displays unit when provided', () => {
      render(
        <RangeSlider
          label="Tempo"
          min={60}
          max={180}
          value={[120, 140]}
          onChange={mockOnChange}
          unit=" BPM"
        />
      );

      expect(screen.getByText('120 BPM - 140 BPM')).toBeInTheDocument();
      expect(screen.getByText('60 BPM')).toBeInTheDocument();
      expect(screen.getByText('180 BPM')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <RangeSlider
          label="Required Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays help text when provided', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          helpText="This is help text"
        />
      );

      expect(screen.getByText('This is help text')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          error="This is an error"
        />
      );

      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('error takes precedence over help text', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          helpText="Help text"
          error="Error message"
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    });
  });

  describe('Range Mode Toggle', () => {
    it('shows toggle button when allowRange is true', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          allowRange={true}
        />
      );

      expect(screen.getByText('Range')).toBeInTheDocument();
    });

    it('hides toggle button when allowRange is false', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          allowRange={false}
        />
      );

      expect(screen.queryByText('Range')).not.toBeInTheDocument();
      expect(screen.queryByText('Single value')).not.toBeInTheDocument();
    });

    it('toggles from single to range mode', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          allowRange={true}
        />
      );

      const toggleButton = screen.getByText('Range');
      fireEvent.click(toggleButton);

      expect(mockOnChange).toHaveBeenCalledWith([50, 50]);
    });

    it('toggles from range to single mode', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={[30, 70]}
          onChange={mockOnChange}
          allowRange={true}
        />
      );

      const toggleButton = screen.getByText('Single value');
      fireEvent.click(toggleButton);

      expect(mockOnChange).toHaveBeenCalledWith(30);
    });

    it('does not toggle when disabled', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          allowRange={true}
          disabled={true}
        />
      );

      const toggleButton = screen.getByText('Range');
      fireEvent.click(toggleButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Presets', () => {
    const presets = [
      { label: 'Slow', value: [60, 80] as [number, number] },
      { label: 'Fast', value: [140, 160] as [number, number] },
    ];

    it('renders preset buttons', () => {
      render(
        <RangeSlider
          label="Tempo"
          min={40}
          max={200}
          value={[100, 120]}
          onChange={mockOnChange}
          presets={presets}
        />
      );

      expect(screen.getByText('Slow')).toBeInTheDocument();
      expect(screen.getByText('Fast')).toBeInTheDocument();
    });

    it('applies preset when clicked', () => {
      render(
        <RangeSlider
          label="Tempo"
          min={40}
          max={200}
          value={[100, 120]}
          onChange={mockOnChange}
          presets={presets}
        />
      );

      const slowButton = screen.getByText('Slow');
      fireEvent.click(slowButton);

      expect(mockOnChange).toHaveBeenCalledWith([60, 80]);
    });

    it('does not apply preset when disabled', () => {
      render(
        <RangeSlider
          label="Tempo"
          min={40}
          max={200}
          value={[100, 120]}
          onChange={mockOnChange}
          presets={presets}
          disabled={true}
        />
      );

      const slowButton = screen.getByText('Slow');
      fireEvent.click(slowButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Handles', () => {
    it('renders single handle for single value', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          allowRange={false}
        />
      );

      expect(screen.getByLabelText('Value handle')).toBeInTheDocument();
      expect(screen.queryByLabelText('Minimum value handle')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Maximum value handle')).not.toBeInTheDocument();
    });

    it('renders two handles for range value', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={[30, 70]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText('Minimum value handle')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum value handle')).toBeInTheDocument();
    });

    it('disables handles when disabled prop is true', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={[30, 70]}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const minHandle = screen.getByLabelText('Minimum value handle');
      const maxHandle = screen.getByLabelText('Maximum value handle');

      expect(minHandle).toBeDisabled();
      expect(maxHandle).toBeDisabled();
    });
  });

  describe('Step Functionality', () => {
    it('uses default step of 1', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
        />
      );

      // Step is handled internally, so we just verify rendering works
      expect(screen.getByText('Test Slider')).toBeInTheDocument();
    });

    it('accepts custom step value', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          step={5}
        />
      );

      expect(screen.getByText('Test Slider')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styling', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const handle = screen.getByLabelText('Value handle');
      expect(handle).toBeDisabled();
    });

    it('does not call onChange when disabled', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          disabled={true}
          allowRange={true}
        />
      );

      const toggleButton = screen.getByText('Range');
      fireEvent.click(toggleButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Min/Max Display', () => {
    it('displays min and max values', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={10}
          max={90}
          value={50}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('displays min and max with units', () => {
      render(
        <RangeSlider
          label="Tempo"
          min={60}
          max={180}
          value={120}
          onChange={mockOnChange}
          unit=" BPM"
        />
      );

      expect(screen.getByText('60 BPM')).toBeInTheDocument();
      expect(screen.getByText('180 BPM')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for handles', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={[30, 70]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText('Minimum value handle')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximum value handle')).toBeInTheDocument();
    });

    it('has accessible label for single handle', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          allowRange={false}
        />
      );

      expect(screen.getByLabelText('Value handle')).toBeInTheDocument();
    });

    it('error message has alert role', () => {
      render(
        <RangeSlider
          label="Test Slider"
          min={0}
          max={100}
          value={50}
          onChange={mockOnChange}
          error="Error message"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });
  });
});
