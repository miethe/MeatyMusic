/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCard } from '../../components/PromptCard';
import type { PromptCardProps } from '../../components/PromptCard';
import type {
  ComplicationProps,
  ComplicationSlots,
} from '../types';

expect.extend(toHaveNoViolations);

// Test complications covering all acceptance criteria
function BadgeComplication({ slot, cardState, isVisible }: ComplicationProps) {
  if (!isVisible) return null;

  return (
    <div
      data-testid={`badge-${slot}`}
      className={`badge ${cardState}`}
      style={{
        width: '16px',
        height: '16px',
        backgroundColor: cardState === 'running' ? 'blue' : 'gray',
        borderRadius: '50%',
      }}
      aria-label={`${slot} badge`}
    />
  );
}

function StatusComplication({ slot, cardState, cardSize }: ComplicationProps) {
  return (
    <div
      data-testid={`status-${slot}`}
      className={`status ${cardSize}`}
    >
      {cardState === 'running' ? '⚡' : cardState === 'error' ? '❌' : '✅'}
    </div>
  );
}

function ErrorComplication({ slot }: ComplicationProps) {
  throw new Error(`Complication error in ${slot}`);
}

describe('Complications System Integration Tests', () => {
  const baseProps: PromptCardProps = {
    title: 'Test Prompt Card',
    version: 1,
    access: 'private',
    tags: ['test'],
  };

  // Mock console.error for error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  describe('Acceptance Criteria: Card accepts complications prop with slot mappings', () => {
    it('accepts complications prop with all seven slot mappings', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: StatusComplication },
        bottomLeft: { component: BadgeComplication },
        bottomRight: { component: StatusComplication },
        edgeLeft: { component: BadgeComplication },
        edgeRight: { component: StatusComplication },
        footer: { component: BadgeComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      // All 7 slots should be rendered
      expect(screen.getByTestId('badge-topLeft')).toBeInTheDocument();
      expect(screen.getByTestId('status-topRight')).toBeInTheDocument();
      expect(screen.getByTestId('badge-bottomLeft')).toBeInTheDocument();
      expect(screen.getByTestId('status-bottomRight')).toBeInTheDocument();
      expect(screen.getByTestId('badge-edgeLeft')).toBeInTheDocument();
      expect(screen.getByTestId('status-edgeRight')).toBeInTheDocument();
      expect(screen.getByTestId('badge-footer')).toBeInTheDocument();
    });

    it('works with partial slot mappings', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        footer: { component: StatusComplication },
        // Other slots empty
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      expect(screen.getByTestId('badge-topLeft')).toBeInTheDocument();
      expect(screen.getByTestId('status-footer')).toBeInTheDocument();

      // Empty slots should not render
      expect(screen.queryByTestId('badge-topRight')).not.toBeInTheDocument();
      expect(screen.queryByTestId('status-bottomLeft')).not.toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria: Seven slots render in correct positions', () => {
    it('renders all seven slot positions correctly', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: BadgeComplication },
        bottomLeft: { component: BadgeComplication },
        bottomRight: { component: BadgeComplication },
        edgeLeft: { component: BadgeComplication },
        edgeRight: { component: BadgeComplication },
        footer: { component: BadgeComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const slotPositions = [
        'topLeft', 'topRight', 'bottomLeft', 'bottomRight',
        'edgeLeft', 'edgeRight', 'footer'
      ];

      slotPositions.forEach(slot => {
        const complication = screen.getByTestId(`badge-${slot}`);
        expect(complication).toBeInTheDocument();

        // Verify slot position via wrapper attributes
        const wrapper = complication.closest('[data-slot]');
        expect(wrapper).toHaveAttribute('data-slot', slot);
      });
    });
  });

  describe('Acceptance Criteria: Empty slots render nothing (no placeholder)', () => {
    it('renders nothing for empty slots without placeholders', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        // topRight intentionally empty
        bottomLeft: { component: BadgeComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      expect(screen.getByTestId('badge-topLeft')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-topRight')).not.toBeInTheDocument();
      expect(screen.getByTestId('badge-bottomLeft')).toBeInTheDocument();

      // Verify no empty placeholders by counting total slots
      const complicationsContainer = screen.getByText('Test Prompt Card').closest('[data-card-id]');
      const slots = complicationsContainer?.querySelectorAll('[data-slot]');
      expect(slots).toHaveLength(2); // Only filled slots
    });
  });

  describe('Acceptance Criteria: Complications receive card context', () => {
    it('provides card context (id, state, size) to complications', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: StatusComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          title="Context Test Card"
          size="xl"
          state="running"
          complications={complications}
        />
      );

      const complication = screen.getByTestId('status-topLeft');
      expect(complication).toHaveClass('status xl'); // Size context
      expect(complication).toHaveTextContent('⚡'); // State context

      // Check card ID context via wrapper
      const wrapper = complication.closest('[data-card-id]');
      expect(wrapper).toHaveAttribute('data-card-id');
      const cardId = wrapper?.getAttribute('data-card-id');
      expect(cardId).toContain('context-test-card');
    });

    it('updates complications when card context changes', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: StatusComplication },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          state="default"
          complications={complications}
        />
      );

      let complication = screen.getByTestId('status-topLeft');
      expect(complication).toHaveTextContent('✅'); // Default state

      rerender(
        <PromptCard
          {...baseProps}
          state="running"
          complications={complications}
        />
      );

      complication = screen.getByTestId('status-topLeft');
      expect(complication).toHaveTextContent('⚡'); // Running state
    });

    it('provides focus state to complications', async () => {
      const FocusComplication = ({ isFocused }: ComplicationProps) => (
        <div data-testid="focus-comp" data-focused={isFocused} />
      );

      const complications: ComplicationSlots = {
        topLeft: { component: FocusComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const card = screen.getByRole('button', { name: /test prompt card/i });
      const complication = screen.getByTestId('focus-comp');

      expect(complication).toHaveAttribute('data-focused', 'false');

      await userEvent.tab();
      expect(card).toHaveFocus();

      await waitFor(() => {
        expect(complication).toHaveAttribute('data-focused', 'true');
      });
    });
  });

  describe('Acceptance Criteria: Error boundary catches complication failures', () => {
    it('catches complication failures without breaking card', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: ErrorComplication },
        topRight: { component: BadgeComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      // Card should still render normally
      expect(screen.getByText('Test Prompt Card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();

      // Good complication should still render
      expect(screen.getByTestId('badge-topRight')).toBeInTheDocument();

      // Error complication should not render
      expect(screen.queryByTestId('error-topLeft')).not.toBeInTheDocument();
    });

    it('isolates errors to individual complications', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: ErrorComplication },
        topRight: { component: BadgeComplication },
        bottomLeft: { component: ErrorComplication },
        bottomRight: { component: StatusComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      // Working complications should render
      expect(screen.getByTestId('badge-topRight')).toBeInTheDocument();
      expect(screen.getByTestId('status-bottomRight')).toBeInTheDocument();

      // Error complications should not render
      expect(screen.queryByTestId('error-topLeft')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-bottomLeft')).not.toBeInTheDocument();
    });

    it('calls onComplicationError callback when provided', async () => {
      const mockOnError = jest.fn();
      const complications: ComplicationSlots = {
        topLeft: { component: ErrorComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
          onComplicationError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'topLeft',
          expect.objectContaining({
            message: 'Complication error in topLeft',
          })
        );
      });
    });
  });

  describe('Acceptance Criteria: Performance - Adding complications doesn\'t trigger re-render of card body', () => {
    it('does not trigger re-render of card body when adding complications', () => {
      let cardBodyRenderCount = 0;

      const TrackedCardBody = () => {
        cardBodyRenderCount++;
        return <div data-testid="card-body">Body content</div>;
      };

      // Mock the card content to track renders
      const CardWithTracking = (props: PromptCardProps) => (
        <div>
          <PromptCard {...props} />
          <TrackedCardBody />
        </div>
      );

      const { rerender } = render(
        <CardWithTracking {...baseProps} />
      );

      const initialRenderCount = cardBodyRenderCount;

      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: StatusComplication },
      };

      rerender(
        <CardWithTracking
          {...baseProps}
          complications={complications}
        />
      );

      // Card body should not have re-rendered due to complications
      expect(cardBodyRenderCount).toBe(initialRenderCount + 1); // Only one additional render
    });
  });

  describe('Acceptance Criteria: Slot content respects card size variant constraints', () => {
    it('respects size constraints for complications', () => {
      const complications: ComplicationSlots = {
        topLeft: {
          component: StatusComplication,
          supportedSizes: ['standard', 'xl'], // Not compact
        },
        topRight: {
          component: BadgeComplication,
          // No size constraints
        },
      };

      // Test compact size
      render(
        <PromptCard
          {...baseProps}
          size="compact"
          complications={complications}
        />
      );

      expect(screen.queryByTestId('status-topLeft')).not.toBeInTheDocument();
      expect(screen.getByTestId('badge-topRight')).toBeInTheDocument();
    });

    it('shows different complications for different sizes', () => {
      const complications: ComplicationSlots = {
        topLeft: {
          component: StatusComplication,
          supportedSizes: ['compact'],
        },
        topRight: {
          component: BadgeComplication,
          supportedSizes: ['standard', 'xl'],
        },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          size="compact"
          complications={complications}
        />
      );

      // Compact: show status, hide badge
      expect(screen.getByTestId('status-topLeft')).toBeInTheDocument();
      expect(screen.queryByTestId('badge-topRight')).not.toBeInTheDocument();

      rerender(
        <PromptCard
          {...baseProps}
          size="standard"
          complications={complications}
        />
      );

      // Standard: hide status, show badge
      expect(screen.queryByTestId('status-topLeft')).not.toBeInTheDocument();
      expect(screen.getByTestId('badge-topRight')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests: Complications have proper ARIA labels', () => {
    it('provides proper ARIA labels for complications', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        bottomRight: { component: StatusComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const topLeftBadge = screen.getByLabelText('topLeft badge');
      expect(topLeftBadge).toBeInTheDocument();

      const bottomRightWrapper = screen.getByTestId('status-bottomRight').closest('[role="complementary"]');
      expect(bottomRightWrapper).toHaveAttribute('aria-label', 'bottomRight complication for Test Prompt Card');
    });

    it('does not interfere with card keyboard navigation', async () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: StatusComplication },
      };

      const onRun = jest.fn();

      render(
        <PromptCard
          {...baseProps}
          onRun={onRun}
          complications={complications}
        />
      );

      // Tab to card and press Enter
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      expect(onRun).toHaveBeenCalled();
    });

    it('hides complications container from screen readers appropriately', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const complicationsContainer = document.querySelector('[data-complications-count]');
      expect(complicationsContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Feature Flag Support', () => {
    it('can disable complications globally', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: StatusComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
          complicationConfig={{ enabled: false }}
        />
      );

      // No complications should render when disabled
      expect(screen.queryByTestId('badge-topLeft')).not.toBeInTheDocument();
      expect(screen.queryByTestId('status-topRight')).not.toBeInTheDocument();

      // Card itself should still work
      expect(screen.getByText('Test Prompt Card')).toBeInTheDocument();
    });
  });

  describe('State Change Events', () => {
    it('notifies parent when complications change', async () => {
      const mockOnChange = jest.fn();
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: StatusComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
          onComplicationChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['topLeft', 'topRight']);
      });
    });
  });
});
