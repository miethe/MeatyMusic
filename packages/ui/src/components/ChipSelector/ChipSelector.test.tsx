import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChipSelector } from './ChipSelector';

expect.extend(toHaveNoViolations);

const mockOptions = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
];

describe('ChipSelector', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          label="Genres"
        />
      );

      expect(screen.getByText('Genres')).toBeInTheDocument();
    });

    it('renders with placeholder when no selections', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          placeholder="Select genres..."
        />
      );

      expect(screen.getByPlaceholderText('Select genres...')).toBeInTheDocument();
    });

    it('renders selected chips', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={['pop', 'rock']}
          onChange={() => {}}
        />
      );

      expect(screen.getByText('Pop')).toBeInTheDocument();
      expect(screen.getByText('Rock')).toBeInTheDocument();
    });

    it('renders helper text', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          helperText="Select your favorite genres"
        />
      );

      expect(screen.getByText('Select your favorite genres')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          error="Please select at least one genre"
        />
      );

      expect(screen.getByText('Please select at least one genre')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders required indicator', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          label="Genres"
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Selection Behavior', () => {
    it('calls onChange when chip is removed', async () => {
      const onChange = jest.fn();
      render(
        <ChipSelector
          options={mockOptions}
          selected={['pop', 'rock']}
          onChange={onChange}
        />
      );

      const removeButtons = screen.getAllByRole('button');
      const popRemoveButton = removeButtons.find(
        (btn) => btn.getAttribute('aria-label') === 'Remove'
      );

      if (popRemoveButton) {
        fireEvent.click(popRemoveButton);
        expect(onChange).toHaveBeenCalledWith(['rock']);
      }
    });

    it('calls onChange when option is selected from dropdown', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={onChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByText('Pop')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Pop'));
      expect(onChange).toHaveBeenCalledWith(['pop']);
    });

    it('respects maxSelections limit', () => {
      const onChange = jest.fn();
      render(
        <ChipSelector
          options={mockOptions}
          selected={['pop', 'rock']}
          onChange={onChange}
          maxSelections={2}
        />
      );

      // Input should be disabled when max is reached
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText(/Maximum 2 selections reached/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('removes last selected item on Backspace when input is empty', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={['pop', 'rock']}
          onChange={onChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(onChange).toHaveBeenCalledWith(['pop']);
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.type(input, 'p');

      // Dropdown should be open
      await waitFor(() => {
        expect(screen.getByText('Pop')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      // Dropdown should be closed
      await waitFor(() => {
        expect(screen.queryByText('Pop')).not.toBeInTheDocument();
      });
    });

    it('navigates options with arrow keys', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={onChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      // Arrow down to navigate
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(['pop']);
    });
  });

  describe('Create New Option', () => {
    it('allows creating new option when allowCreate is true', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={onChange}
          allowCreate
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'custom');

      await waitFor(() => {
        expect(screen.getByText(/Create "custom"/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Create "custom"/i));
      expect(onChange).toHaveBeenCalledWith(['custom']);
    });

    it('does not show create option for existing values', async () => {
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          allowCreate
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'pop');

      await waitFor(() => {
        expect(screen.queryByText(/Create "pop"/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          disabled
        />
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does not allow chip removal when disabled', () => {
      const onChange = jest.fn();
      render(
        <ChipSelector
          options={mockOptions}
          selected={['pop']}
          onChange={onChange}
          disabled
        />
      );

      const removeButtons = screen.queryAllByRole('button');
      expect(removeButtons).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ChipSelector
          options={mockOptions}
          selected={['pop']}
          onChange={() => {}}
          label="Genres"
          helperText="Select your genres"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes on input', () => {
      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
          label="Genres"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Genres');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('has proper role on dropdown', async () => {
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters options based on input', async () => {
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={[]}
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'ja');

      await waitFor(() => {
        expect(screen.getByText('Jazz')).toBeInTheDocument();
        expect(screen.queryByText('Pop')).not.toBeInTheDocument();
        expect(screen.queryByText('Rock')).not.toBeInTheDocument();
      });
    });

    it('excludes already selected options from dropdown', async () => {
      const user = userEvent.setup();

      render(
        <ChipSelector
          options={mockOptions}
          selected={['pop']}
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.queryByText('Pop')).not.toBeInTheDocument();
        expect(screen.getByText('Rock')).toBeInTheDocument();
      });
    });
  });
});
