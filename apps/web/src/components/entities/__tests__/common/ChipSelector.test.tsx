import { render, screen, fireEvent } from '@testing-library/react';
import { ChipSelector } from '../../common/ChipSelector';

describe('ChipSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label and placeholder', () => {
    render(
      <ChipSelector
        label="Test Label"
        value={[]}
        onChange={mockOnChange}
        placeholder="Type here..."
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('displays existing chips', () => {
    render(
      <ChipSelector
        label="Moods"
        value={['upbeat', 'energetic']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('upbeat')).toBeInTheDocument();
    expect(screen.getByText('energetic')).toBeInTheDocument();
  });

  it('adds a new chip on Enter key', () => {
    render(
      <ChipSelector
        label="Tags"
        value={['tag1']}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('Type to add...');
    fireEvent.change(input, { target: { value: 'tag2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(['tag1', 'tag2']);
  });

  it('removes a chip when X button is clicked', () => {
    render(
      <ChipSelector
        label="Tags"
        value={['tag1', 'tag2']}
        onChange={mockOnChange}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith(['tag2']);
  });

  it('shows suggestions when typing', () => {
    render(
      <ChipSelector
        label="Moods"
        value={[]}
        onChange={mockOnChange}
        suggestions={['upbeat', 'melancholic', 'energetic']}
      />
    );

    const input = screen.getByPlaceholderText('Type to add...');
    fireEvent.change(input, { target: { value: 'up' } });

    expect(screen.getByText('Suggestions:')).toBeInTheDocument();
    expect(screen.getByText('upbeat')).toBeInTheDocument();
  });

  it('enforces max chips limit', () => {
    render(
      <ChipSelector
        label="Tags"
        value={['tag1', 'tag2']}
        onChange={mockOnChange}
        maxChips={2}
      />
    );

    const input = screen.getByPlaceholderText('Type to add...');
    fireEvent.change(input, { target: { value: 'tag3' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Maximum 2 chips allowed/i)).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <ChipSelector
        label="Tags"
        value={[]}
        onChange={mockOnChange}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays warning message when provided', () => {
    render(
      <ChipSelector
        label="Tags"
        value={[]}
        onChange={mockOnChange}
        warning="Too many tags may cause issues"
      />
    );

    expect(screen.getByText('Too many tags may cause issues')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(
      <ChipSelector
        label="Tags"
        value={[]}
        onChange={mockOnChange}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ChipSelector
        label="Tags"
        value={['tag1']}
        onChange={mockOnChange}
        disabled
      />
    );

    const input = screen.getByPlaceholderText('Type to add...');
    expect(input).toBeDisabled();

    const removeButton = screen.getByRole('button', { name: /Remove tag1/i });
    expect(removeButton).toBeDisabled();
  });

  it('removes last chip on Backspace when input is empty', () => {
    render(
      <ChipSelector
        label="Tags"
        value={['tag1', 'tag2']}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('Type to add...');
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(mockOnChange).toHaveBeenCalledWith(['tag1']);
  });
});
