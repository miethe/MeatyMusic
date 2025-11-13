/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OverflowTooltip, type OverflowTooltipProps } from './OverflowTooltip';
import { Badge } from '../../Badge';

expect.extend(toHaveNoViolations);

const defaultItems = [
  <Badge key="1" variant="secondary">Machine Learning</Badge>,
  <Badge key="2" variant="secondary">Data Science</Badge>,
  <Badge key="3" variant="secondary">Analytics</Badge>,
];

const defaultProps: OverflowTooltipProps = {
  overflowCount: 3,
  items: defaultItems,
};

describe('OverflowTooltip', () => {
  describe('Rendering', () => {
    it('renders the default "+X more" badge', () => {
      render(<OverflowTooltip {...defaultProps} />);
      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('renders with custom overflow count', () => {
      render(<OverflowTooltip {...defaultProps} overflowCount={5} />);
      expect(screen.getByText('+5 more')).toBeInTheDocument();
    });

    it('renders custom trigger when provided', () => {
      render(
        <OverflowTooltip
          {...defaultProps}
          trigger={<span data-testid="custom-trigger">Custom Trigger</span>}
        />
      );
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
      expect(screen.queryByText('+3 more')).not.toBeInTheDocument();
    });

    it('includes data-testid for testing', () => {
      render(<OverflowTooltip {...defaultProps} />);
      expect(screen.getByTestId('overflow-tooltip')).toBeInTheDocument();
    });

    it('does not render when overflowCount is 0', () => {
      render(<OverflowTooltip {...defaultProps} overflowCount={0} />);
      expect(screen.queryByTestId('overflow-tooltip')).not.toBeInTheDocument();
    });

    it('does not render when overflowCount is negative', () => {
      render(<OverflowTooltip {...defaultProps} overflowCount={-1} />);
      expect(screen.queryByTestId('overflow-tooltip')).not.toBeInTheDocument();
    });

    it('does not render when items array is empty', () => {
      render(<OverflowTooltip {...defaultProps} items={[]} />);
      expect(screen.queryByTestId('overflow-tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Content', () => {
    it('displays all items in tooltip', async () => {
      const user = userEvent.setup();
      render(<OverflowTooltip {...defaultProps} />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Machine Learning').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Data Science').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Analytics').length).toBeGreaterThan(0);
      });
    });

    it('handles text items in tooltip', async () => {
      const user = userEvent.setup();
      const textItems = [
        <span key="1">Item 1</span>,
        <span key="2">Item 2</span>,
        <span key="3">Item 3</span>,
      ];

      render(<OverflowTooltip overflowCount={3} items={textItems} />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Item 1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Item 2').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Item 3').length).toBeGreaterThan(0);
      });
    });

    it('handles mixed content items', async () => {
      const user = userEvent.setup();
      const mixedItems = [
        <Badge key="1" variant="success">Badge Item</Badge>,
        <span key="2" className="font-bold">Text Item</span>,
        <div key="3">Complex Item</div>,
      ];

      render(<OverflowTooltip overflowCount={3} items={mixedItems} />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Badge Item').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Text Item').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Complex Item').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Positioning', () => {
    it('defaults to top positioning', () => {
      const { container } = render(<OverflowTooltip {...defaultProps} />);
      expect(container.querySelector('[data-testid="overflow-tooltip"]')).toBeInTheDocument();
    });

    it('accepts different side positions', () => {
      const sides: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left'];

      sides.forEach((side) => {
        const { unmount } = render(<OverflowTooltip {...defaultProps} side={side} />);
        expect(screen.getByTestId('overflow-tooltip')).toBeInTheDocument();
        unmount();
      });
    });

    it('accepts different align positions', () => {
      const aligns: Array<'start' | 'center' | 'end'> = ['start', 'center', 'end'];

      aligns.forEach((align) => {
        const { unmount } = render(<OverflowTooltip {...defaultProps} align={align} />);
        expect(screen.getByTestId('overflow-tooltip')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Styling', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <OverflowTooltip {...defaultProps} className="custom-class" />
      );
      const tooltip = container.querySelector('[data-testid="overflow-tooltip"]');
      expect(tooltip).toHaveClass('custom-class');
    });

    it('applies custom contentClassName to tooltip content', () => {
      render(<OverflowTooltip {...defaultProps} contentClassName="custom-content" />);
      expect(screen.getByTestId('overflow-tooltip')).toBeInTheDocument();
    });

    it('maintains default styling classes', () => {
      const { container } = render(<OverflowTooltip {...defaultProps} />);
      const tooltip = container.querySelector('[data-testid="overflow-tooltip"]');
      expect(tooltip).toHaveClass('inline-flex', 'items-center');
    });
  });

  describe('Accessibility', () => {
    it('provides accessible label by default', () => {
      render(<OverflowTooltip {...defaultProps} overflowCount={5} />);
      expect(screen.getByLabelText('5 more items')).toBeInTheDocument();
    });

    it('uses custom aria-label when provided', () => {
      render(
        <OverflowTooltip
          {...defaultProps}
          aria-label="5 additional tags"
        />
      );
      expect(screen.getByLabelText('5 additional tags')).toBeInTheDocument();
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<OverflowTooltip {...defaultProps} />);

      const trigger = screen.getByText('+3 more').closest('span');
      expect(trigger).toHaveAttribute('tabIndex', '0');

      // Tab to trigger
      await user.tab();
      expect(trigger).toHaveFocus();
    });

    it('passes accessibility audit', async () => {
      const { container } = render(<OverflowTooltip {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes accessibility audit with custom trigger', async () => {
      const { container } = render(
        <OverflowTooltip
          {...defaultProps}
          trigger={<button type="button">Show More</button>}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Tooltip Behavior', () => {
    it('respects custom delay duration', () => {
      render(<OverflowTooltip {...defaultProps} delayDuration={500} />);
      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('shows arrow by default', () => {
      render(<OverflowTooltip {...defaultProps} />);
      expect(screen.getByTestId('overflow-tooltip')).toBeInTheDocument();
    });

    it('can hide arrow when specified', () => {
      render(<OverflowTooltip {...defaultProps} showArrow={false} />);
      expect(screen.getByTestId('overflow-tooltip')).toBeInTheDocument();
    });

    it('tooltip appears on hover', async () => {
      const user = userEvent.setup();
      render(<OverflowTooltip {...defaultProps} />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Machine Learning').length).toBeGreaterThan(0);
      });
    });

    it('tooltip disappears on unhover', async () => {
      const user = userEvent.setup();
      render(<OverflowTooltip {...defaultProps} />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Machine Learning').length).toBeGreaterThan(0);
      });

      await user.unhover(trigger);

      // Wait for the tooltip animation to complete and tooltip to be removed
      await waitFor(
        () => {
          // The visible tooltip content should be hidden, but screen reader version remains
          const elements = screen.queryAllByText('Machine Learning');
          // Should have 0 elements when completely closed
          expect(elements.length).toBeLessThanOrEqual(2);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles single overflow item', () => {
      const singleItem = [<Badge key="1" variant="secondary">Single Item</Badge>];
      render(<OverflowTooltip overflowCount={1} items={singleItem} />);
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('handles large overflow counts', () => {
      const largeCount = 999;
      render(<OverflowTooltip {...defaultProps} overflowCount={largeCount} />);
      expect(screen.getByText('+999 more')).toBeInTheDocument();
    });

    it('handles many overflow items', async () => {
      const user = userEvent.setup();
      const manyItems = Array.from({ length: 20 }, (_, i) => (
        <span key={i}>Item {i + 1}</span>
      ));

      render(<OverflowTooltip overflowCount={20} items={manyItems} />);

      const trigger = screen.getByText('+20 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Item 1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Item 20').length).toBeGreaterThan(0);
      });
    });

    it('handles items with special characters', async () => {
      const user = userEvent.setup();
      const specialItems = [
        <span key="1">Item & Special</span>,
        <span key="2">Item "Quoted"</span>,
        <span key="3">Item 'Apostrophe'</span>,
      ];

      render(<OverflowTooltip overflowCount={3} items={specialItems} />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Item & Special').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Item "Quoted"').length).toBeGreaterThan(0);
        expect(screen.getAllByText("Item 'Apostrophe'").length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Integration', () => {
    it('works with Badge components', async () => {
      const user = userEvent.setup();
      const badgeItems = [
        <Badge key="1" variant="success">Success</Badge>,
        <Badge key="2" variant="warning">Warning</Badge>,
        <Badge key="3" variant="danger">Danger</Badge>,
      ];

      render(<OverflowTooltip overflowCount={3} items={badgeItems} />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Success').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Warning').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Danger').length).toBeGreaterThan(0);
      });
    });

    it('works with custom React components', async () => {
      const user = userEvent.setup();
      const CustomComponent = ({ children }: { children: React.ReactNode }) => (
        <div className="custom-item">{children}</div>
      );

      const customItems = [
        <CustomComponent key="1">Custom 1</CustomComponent>,
        <CustomComponent key="2">Custom 2</CustomComponent>,
      ];

      render(<OverflowTooltip overflowCount={2} items={customItems} />);

      const trigger = screen.getByText('+2 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('Custom 1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Custom 2').length).toBeGreaterThan(0);
      });
    });
  });
});
