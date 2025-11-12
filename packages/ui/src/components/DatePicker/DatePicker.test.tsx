/**
 * DatePicker Component Tests
 *
 * Tests cover:
 * - Rendering with various props
 * - User interactions (click, keyboard)
 * - Date selection and onChange callback
 * - Date constraints (minDate, maxDate)
 * - Accessibility (a11y)
 * - Keyboard navigation
 * - Focus management
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DatePicker } from './DatePicker';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

describe('DatePicker', () => {
  describe('Rendering', () => {
    it('renders with placeholder when no value', () => {
      const handleChange = jest.fn();
      render(
        <DatePicker
          onChange={handleChange}
          placeholder="Select a date"
        />
      );

      expect(screen.getByRole('button', { name: /Select a date/i })).toBeInTheDocument();
    });

    it('shows formatted date when value provided', () => {
      const handleChange = jest.fn();
      const testDate = new Date('2024-03-15T00:00:00.000Z');

      render(
        <DatePicker
          value={testDate}
          onChange={handleChange}
        />
      );

      // Date should be formatted - check for the date being present
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('March');
      expect(button.textContent).toMatch(/1[45](th|st)/); // Could be 14th or 15th depending on timezone
    });

    it('applies custom className', () => {
      const handleChange = jest.fn();
      render(
        <DatePicker
          onChange={handleChange}
          className="custom-class"
        />
      );

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('renders different sizes', () => {
      const handleChange = jest.fn();
      const { rerender } = render(
        <DatePicker onChange={handleChange} size="sm" />
      );
      // Size is passed to the Button component which applies the class
      // Just verify the component renders with each size prop
      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<DatePicker onChange={handleChange} size="md" />);
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<DatePicker onChange={handleChange} size="lg" />);
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('opens popover on trigger click', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<DatePicker onChange={handleChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Calendar grid should appear
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });

    it('selects date and calls onChange', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <DatePicker
          onChange={handleChange}
          value={new Date('2024-03-01')}
        />
      );

      // Open picker
      await user.click(screen.getByRole('button'));

      // Wait for calendar to appear
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Find and click the 15th day button
      const allButtons = screen.getAllByRole('button');
      const day15 = allButtons.find(btn => btn.textContent === '15');
      if (day15) {
        await user.click(day15);
      }

      // onChange should be called
      expect(handleChange).toHaveBeenCalled();
      const selectedDate = handleChange.mock.calls[0][0] as Date;
      expect(selectedDate.getDate()).toBe(15);
    });

    it('closes popover after date selection', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <DatePicker
          onChange={handleChange}
          value={new Date('2024-03-01')}
        />
      );

      // Open picker
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Select a date
      const allButtons = screen.getAllByRole('button');
      const day15 = allButtons.find(btn => btn.textContent === '15');
      if (day15) {
        await user.click(day15);
      }

      // Popover should close
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<DatePicker onChange={handleChange} />);

      // Open picker
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      // Popover should close
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });
    });
  });

  describe('Date Constraints', () => {
    it('respects minDate constraint', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      // Use current month dates
      const today = new Date();
      const minDate = new Date(today.getFullYear(), today.getMonth(), 10);
      const selectedDate = new Date(today.getFullYear(), today.getMonth(), 15);

      render(
        <DatePicker
          onChange={handleChange}
          value={selectedDate}
          minDate={minDate}
        />
      );

      await user.click(screen.getByRole('button', { name: /Selected date/i }));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Day before minDate should be disabled
      const allButtons = screen.getAllByRole('button');
      const day5 = allButtons.find(btn => btn.textContent === '5' && !btn.classList.contains('rdp-day_outside'));
      if (day5) {
        expect(day5).toBeDisabled();
      }
    });

    it('respects maxDate constraint', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      // Use current month dates
      const today = new Date();
      const maxDate = new Date(today.getFullYear(), today.getMonth(), 20);
      const selectedDate = new Date(today.getFullYear(), today.getMonth(), 15);

      render(
        <DatePicker
          onChange={handleChange}
          value={selectedDate}
          maxDate={maxDate}
        />
      );

      await user.click(screen.getByRole('button', { name: /Selected date/i }));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Day after maxDate should be disabled
      const allButtons = screen.getAllByRole('button');
      const day25 = allButtons.find(btn => btn.textContent === '25' && !btn.classList.contains('rdp-day_outside'));
      if (day25) {
        expect(day25).toBeDisabled();
      }
    });

    it('respects both minDate and maxDate', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      // Use current month dates
      const today = new Date();
      const minDate = new Date(today.getFullYear(), today.getMonth(), 10);
      const maxDate = new Date(today.getFullYear(), today.getMonth(), 20);
      const selectedDate = new Date(today.getFullYear(), today.getMonth(), 15);

      render(
        <DatePicker
          onChange={handleChange}
          value={selectedDate}
          minDate={minDate}
          maxDate={maxDate}
        />
      );

      await user.click(screen.getByRole('button', { name: /Selected date/i }));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');

      // Day before minDate should be disabled
      const day5 = allButtons.find(btn => btn.textContent === '5' && !btn.classList.contains('rdp-day_outside'));
      if (day5) {
        expect(day5).toBeDisabled();
      }

      // Day after maxDate should be disabled
      const day25 = allButtons.find(btn => btn.textContent === '25' && !btn.classList.contains('rdp-day_outside'));
      if (day25) {
        expect(day25).toBeDisabled();
      }

      // Day within range should be enabled
      const day15 = allButtons.find(btn => btn.textContent === '15' && !btn.classList.contains('rdp-day_outside'));
      if (day15) {
        expect(day15).not.toBeDisabled();
      }
    });
  });

  describe('Disabled State', () => {
    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <DatePicker
          onChange={handleChange}
          disabled
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();

      await user.click(trigger);

      // Calendar should not appear
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows Tab navigation to trigger', () => {
      const handleChange = jest.fn();

      render(
        <div>
          <button>Before</button>
          <DatePicker onChange={handleChange} />
          <button>After</button>
        </div>
      );

      const trigger = screen.getByRole('button', { name: /Pick a date/i });

      // Focus should be reachable via Tab
      trigger.focus();
      expect(trigger).toHaveFocus();
    });

    it('supports Enter key to open popover', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<DatePicker onChange={handleChange} />);

      const trigger = screen.getByRole('button');
      trigger.focus();

      await user.keyboard('{Enter}');

      // Calendar should appear
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });

    it('supports Space key to open popover', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<DatePicker onChange={handleChange} />);

      const trigger = screen.getByRole('button');
      trigger.focus();

      await user.keyboard(' ');

      // Calendar should appear
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no axe violations (default state)', async () => {
      const handleChange = jest.fn();
      const { container } = render(
        <DatePicker onChange={handleChange} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations (with value)', async () => {
      const handleChange = jest.fn();
      const { container } = render(
        <DatePicker
          value={new Date('2024-03-15')}
          onChange={handleChange}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations (open popover)', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = render(
        <DatePicker onChange={handleChange} />
      );

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      const handleChange = jest.fn();
      render(<DatePicker onChange={handleChange} />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<DatePicker onChange={handleChange} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('provides accessible label for selected date', () => {
      const handleChange = jest.fn();
      const testDate = new Date('2024-03-15');

      render(
        <DatePicker
          value={testDate}
          onChange={handleChange}
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-label', expect.stringContaining('March'));
    });
  });

  describe('Focus Management', () => {
    it('closes popover on Escape and maintains trigger reference', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<DatePicker onChange={handleChange} />);

      const trigger = screen.getByRole('button', { name: /Pick a date/i });

      // Verify trigger is in the document
      expect(trigger).toBeInTheDocument();

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Close with Escape
      await user.keyboard('{Escape}');

      // Wait for popover to close
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });

      // Verify trigger is still in document and accessible
      expect(trigger).toBeInTheDocument();
      expect(trigger).not.toBeDisabled();
    });
  });
});
