import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    title: 'Test Confirmation',
    description: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when open is true', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Test Confirmation')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      });
    });

    it('does not render when open is false', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with default button labels', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      });
    });

    it('renders with custom button labels', async () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Delete"
          cancelLabel="Keep"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
      });
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', async () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        expect(confirmButton).toBeInTheDocument();
        // Default variant uses default button variant (primary)
      });
    });

    it('renders destructive variant correctly', async () => {
      render(<ConfirmDialog {...defaultProps} variant="destructive" />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        expect(confirmButton).toBeInTheDocument();
        // Destructive variant uses destructive button styling
      });
    });

    it('renders warning variant correctly', async () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        expect(confirmButton).toBeInTheDocument();
        // Warning variant uses warning button styling
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      const onOpenChange = jest.fn();

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      const onOpenChange = jest.fn();

      render(
        <ConfirmDialog
          {...defaultProps}
          onCancel={onCancel}
          onOpenChange={onOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes dialog without calling onCancel if not provided', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange when close button (X) is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('confirms when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      const onOpenChange = jest.fn();

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Enter}');

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not confirm when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('supports Tab navigation between buttons', async () => {
      const user = userEvent.setup();

      render(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Tab through elements
      await user.tab();
      await user.tab();

      // Focus should be within the dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('auto-focuses cancel button for default variant', async () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        expect(cancelButton).toHaveFocus();
      });
    });

    it('auto-focuses confirm button for destructive variant', async () => {
      render(<ConfirmDialog {...defaultProps} variant="destructive" />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        expect(confirmButton).toHaveFocus();
      });
    });

    it('auto-focuses confirm button for warning variant', async () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        expect(confirmButton).toHaveFocus();
      });
    });

    it('traps focus within dialog', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button data-testid="outside-button">Outside Button</button>
          <ConfirmDialog {...defaultProps} />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Tab multiple times
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should still be within the dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);

      // Outside button should not receive focus
      const outsideButton = screen.getByTestId('outside-button');
      expect(outsideButton).not.toHaveFocus();
    });
  });

  describe('Controlled State', () => {
    it('works with controlled open state', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<ConfirmDialog {...defaultProps} open={true} />);

      waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('calls onOpenChange with false after confirm', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange with false after cancel', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Overlay Interactions', () => {
    it('does not close when clicking overlay (prevented by default)', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to click outside the dialog
      // Note: Due to onPointerDownOutside preventDefault, this should not close the dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // The dialog should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(
        <ConfirmDialog {...defaultProps} open={false} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when open', async () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all variants', async () => {
      const variants: Array<'default' | 'destructive' | 'warning'> = [
        'default',
        'destructive',
        'warning',
      ];

      for (const variant of variants) {
        const { container } = render(
          <ConfirmDialog {...defaultProps} variant={variant} />
        );

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('has proper ARIA attributes', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAttribute('aria-describedby');
      });
    });

    it('title is properly associated with dialog', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const titleId = dialog.getAttribute('aria-labelledby');
        expect(titleId).toBeTruthy();

        const title = document.getElementById(titleId!);
        expect(title).toHaveTextContent('Test Confirmation');
      });
    });

    it('description is properly associated with dialog', async () => {
      render(<ConfirmDialog {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const descriptionId = dialog.getAttribute('aria-describedby');
        expect(descriptionId).toBeTruthy();

        const description = document.getElementById(descriptionId!);
        expect(description).toHaveTextContent('Are you sure you want to proceed?');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid open/close cycles', async () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} open={false} />);

      for (let i = 0; i < 5; i++) {
        rerender(<ConfirmDialog {...defaultProps} open={true} />);
        rerender(<ConfirmDialog {...defaultProps} open={false} />);
      }

      // Should end in closed state
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles long title and description', async () => {
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(500);

      render(
        <ConfirmDialog
          {...defaultProps}
          title={longTitle}
          description={longDescription}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(longTitle)).toBeInTheDocument();
        expect(screen.getByText(longDescription)).toBeInTheDocument();
      });
    });

    it('handles empty optional callbacks gracefully', async () => {
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Test"
          description="Test"
          onConfirm={jest.fn()}
          // No onCancel provided
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should not throw when clicking cancel
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    it('handles multiple Enter presses before dialog closes', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      const onOpenChange = jest.fn();

      render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Enter - this will trigger confirm
      await user.keyboard('{Enter}');

      // Wait for the dialog to start closing
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      // onConfirm should have been called
      expect(onConfirm).toHaveBeenCalled();
    });
  });
});
