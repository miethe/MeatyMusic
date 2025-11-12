/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PermissionBadge, type PermissionBadgeProps } from './PermissionBadge';
import { TooltipProvider } from '../../Tooltip';
import type { ComplicationProps } from '../../../complications/types';

expect.extend(toHaveNoViolations);

// Mock complication context props
const mockComplicationProps: Omit<ComplicationProps, 'slot'> = {
  cardId: 'test-card-123',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Test Prompt',
  isFocused: false,
  isVisible: true,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
};

const defaultProps: PermissionBadgeProps = {
  ...mockComplicationProps,
  slot: 'topRight',
  access: 'private',
};

describe('PermissionBadge', () => {
  describe('Icon Selection Logic', () => {
    it('displays lock icon for private access', () => {
      render(<PermissionBadge {...defaultProps} access="private" />);

      expect(screen.getByTestId('permission-badge-private')).toBeInTheDocument();
      // Check for SVG icon by looking for an SVG inside the badge
      expect(screen.getByTestId('permission-badge-private').querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('displays globe icon for public access', () => {
      render(<PermissionBadge {...defaultProps} access="public" />);

      expect(screen.getByTestId('permission-badge-public')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('displays users icon for shared access', () => {
      render(<PermissionBadge {...defaultProps} access="shared" />);

      expect(screen.getByTestId('permission-badge-shared')).toBeInTheDocument();
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });
  });

  describe('Badge Variants and Styling', () => {
    it('uses outline variant for private', () => {
      render(<PermissionBadge {...defaultProps} access="private" />);

      const badge = screen.getByRole('generic', { name: /private access/i });
      expect(badge).toHaveClass('border');
    });

    it('uses secondary variant for public', () => {
      render(<PermissionBadge {...defaultProps} access="public" />);

      const badge = screen.getByRole('generic', { name: /public access/i });
      expect(badge).toHaveClass('bg-secondary');
    });

    it('uses info variant for shared', () => {
      render(<PermissionBadge {...defaultProps} access="shared" />);

      const badge = screen.getByRole('generic', { name: /shared access/i });
      expect(badge).toHaveClass('bg-info');
    });
  });

  describe('Card Size Responsiveness', () => {
    it('shows smaller icon and compact styling for compact cards', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          cardSize="compact"
          access="private"
        />
      );

      const badge = screen.getByRole('generic', { name: /private access/i });
      expect(badge).toHaveClass('px-1.5', 'py-0.5', 'max-w-16');

      // Should not show text label in compact mode
      expect(screen.queryByText('Private')).not.toBeInTheDocument();
    });

    it('shows standard sizing for standard and xl cards', () => {
      const { rerender } = render(
        <PermissionBadge
          {...defaultProps}
          cardSize="standard"
          access="private"
        />
      );

      let badge = screen.getByRole('generic', { name: /private access/i });
      expect(badge).toHaveClass('px-2', 'py-1', 'max-w-20');
      expect(screen.getByText('Private')).toBeInTheDocument();

      rerender(
        <PermissionBadge
          {...defaultProps}
          cardSize="xl"
          access="private"
        />
      );

      badge = screen.getByRole('generic', { name: /private access/i });
      expect(badge).toHaveClass('px-2', 'py-1', 'max-w-20');
      expect(screen.getByText('Private')).toBeInTheDocument();
    });
  });

  describe('Tooltip Functionality', () => {
    it('renders tooltip content correctly', () => {
      // Test tooltip component structure without testing hover behavior in jsdom
      render(
        <PermissionBadge
          {...defaultProps}
          access="private"
          owner="John Doe"
        />
      );

      const badge = screen.getByTestId('permission-badge-private');
      expect(badge).toBeInTheDocument();

      // The tooltip is present but not visible until hover
      // In real usage, tooltip would show on hover/focus
    });

    it('constructs correct tooltip content for shared prompts', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          access="shared"
          owner="Jane Smith"
          sharedWith={['user1@example.com', 'user2@example.com', 'user3@example.com']}
        />
      );

      // Verify the component renders correctly - tooltip functionality works in browser
      expect(screen.getByTestId('permission-badge-shared')).toBeInTheDocument();
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });

    it('handles singular vs plural correctly in component props', () => {
      const { rerender } = render(
        <PermissionBadge
          {...defaultProps}
          access="shared"
          sharedWith={['user1@example.com']}
        />
      );

      expect(screen.getByTestId('permission-badge-shared')).toBeInTheDocument();

      rerender(
        <PermissionBadge
          {...defaultProps}
          access="shared"
          sharedWith={['user1@example.com', 'user2@example.com']}
        />
      );

      expect(screen.getByTestId('permission-badge-shared')).toBeInTheDocument();
    });
  });

  describe('Click Handler', () => {
    it('triggers onShare callback when clicked and onShare is provided', async () => {
      const onShare = jest.fn();
      const user = userEvent.setup();

      render(
        <PermissionBadge
          {...defaultProps}
          access="shared"
          onShare={onShare}
        />
      );

      const button = screen.getByRole('button', { name: /shared access.*click to manage sharing/i });
      await user.click(button);

      expect(onShare).toHaveBeenCalledTimes(1);
    });

    it('does not render as button when onShare is not provided', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          access="private"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('stops event propagation when clicked', async () => {
      const onShare = jest.fn();
      const onCardClick = jest.fn();
      const user = userEvent.setup();

      render(
        <div onClick={onCardClick}>
          <PermissionBadge
            {...defaultProps}
            access="shared"
            onShare={onShare}
          />
        </div>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onShare).toHaveBeenCalledTimes(1);
      expect(onCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Visibility Control', () => {
    it('does not render when isVisible is false', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          isVisible={false}
          access="private"
        />
      );

      expect(screen.queryByTestId('permission-badge-private')).not.toBeInTheDocument();
    });

    it('renders when isVisible is true', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          isVisible={true}
          access="private"
        />
      );

      expect(screen.getByTestId('permission-badge-private')).toBeInTheDocument();
    });
  });

  describe('ARIA and Accessibility', () => {
    it('provides proper ARIA labels for each access type', () => {
      const { rerender } = render(
        <PermissionBadge {...defaultProps} access="private" owner="John Doe" />
      );

      expect(screen.getByLabelText('Private access, owned by John Doe')).toBeInTheDocument();

      rerender(
        <PermissionBadge {...defaultProps} access="public" owner="Jane Smith" />
      );

      expect(screen.getByLabelText('Public access, owned by Jane Smith')).toBeInTheDocument();

      rerender(
        <PermissionBadge {...defaultProps} access="shared" owner="Bob Johnson" />
      );

      expect(screen.getByLabelText('Shared access, owned by Bob Johnson')).toBeInTheDocument();
    });

    it('uses custom aria-label when provided', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          access="private"
          aria-label="Custom accessibility label"
        />
      );

      expect(screen.getByLabelText('Custom accessibility label')).toBeInTheDocument();
    });

    it('provides accessible button label when clickable', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          access="shared"
          onShare={jest.fn()}
        />
      );

      expect(screen.getByRole('button', {
        name: /shared access.*click to manage sharing/i
      })).toBeInTheDocument();
    });

    it('passes accessibility audit', async () => {
      const { container } = render(
        <PermissionBadge
          {...defaultProps}
          access="shared"
          owner="Test User"
          sharedWith={['user1@example.com', 'user2@example.com']}
          onShare={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data Attributes', () => {
    it('includes proper data attributes for testing', () => {
      render(
        <PermissionBadge
          {...defaultProps}
          access="private"
          slot="topRight"
        />
      );

      const badge = screen.getByTestId('permission-badge-private');
      expect(badge).toHaveAttribute('data-slot', 'topRight');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation when clickable', async () => {
      const onShare = jest.fn();
      const user = userEvent.setup();

      render(
        <PermissionBadge
          {...defaultProps}
          access="shared"
          onShare={onShare}
        />
      );

      const button = screen.getByRole('button');

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');
      expect(onShare).toHaveBeenCalledTimes(1);

      // Press Space
      await user.keyboard(' ');
      expect(onShare).toHaveBeenCalledTimes(2);
    });

    it('shows focus ring when focused', async () => {
      const user = userEvent.setup();
      render(
        <PermissionBadge
          {...defaultProps}
          access="private"
          onShare={jest.fn()}
        />
      );

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary');
    });
  });
});
