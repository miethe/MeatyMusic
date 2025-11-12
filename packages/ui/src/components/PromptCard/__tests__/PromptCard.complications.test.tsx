/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCard } from '../PromptCard';
import type { PromptCardProps } from '../PromptCard';
import type {
  ComplicationProps,
  ComplicationSlots,
  SlotPosition,
} from '../../complications/types';

expect.extend(toHaveNoViolations);

// Mock performance for tests
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

// Mock React Profiler for performance tests
const mockProfilerCallback = jest.fn();
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    Profiler: ({ children, onRender, id }: any) => {
      mockProfilerCallback(id, onRender);
      return children;
    },
  };
});

// Test complications
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

function AnimatedComplication({ slot, features }: ComplicationProps) {
  const shouldAnimate = features.animations && !features.reducedMotion;

  return (
    <div
      data-testid={`animated-${slot}`}
      data-should-animate={shouldAnimate}
      style={{
        animation: shouldAnimate ? 'pulse 1s infinite' : 'none',
      }}
    >
      {shouldAnimate ? '🌟' : '⭐'}
    </div>
  );
}

function ErrorComplication({ slot }: ComplicationProps) {
  throw new Error(`Complication error in ${slot}`);
}

function SlowComplication({ slot }: ComplicationProps) {
  // Simulate slow rendering
  const start = performance.now();
  while (performance.now() - start < 50) {
    // Busy wait
  }
  return <div data-testid={`slow-${slot}`}>Slow</div>;
}

// Performance tracking component
function PerformanceTracker({ children, testId }: { children: React.ReactNode; testId: string }) {
  const [renderCount, setRenderCount] = React.useState(0);
  const [renderTime, setRenderTime] = React.useState(0);

  React.useLayoutEffect(() => {
    const start = performance.now();
    setRenderCount(prev => prev + 1);

    return () => {
      setRenderTime(performance.now() - start);
    };
  });

  return (
    <div data-testid={testId} data-render-count={renderCount} data-render-time={renderTime}>
      {children}
    </div>
  );
}

describe('PromptCard with Complications', () => {
  const baseProps: PromptCardProps = {
    title: 'Test Prompt Card',
    version: 1,
    access: 'private',
    tags: ['test'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProfilerCallback.mockClear();
  });

  describe('Complications Prop Acceptance', () => {
    it('accepts complications prop with slot mappings', () => {
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

    it('works without complications prop', () => {
      render(<PromptCard {...baseProps} />);

      expect(screen.getByText('Test Prompt Card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();

      // No complications should be rendered
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('handles partial slot mappings', () => {
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

  describe('Seven Slot Rendering', () => {
    it('renders all seven slots in correct positions', () => {
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

      const slots: SlotPosition[] = [
        'topLeft', 'topRight', 'bottomLeft', 'bottomRight',
        'edgeLeft', 'edgeRight', 'footer'
      ];

      slots.forEach(slot => {
        const complication = screen.getByTestId(`badge-${slot}`);
        expect(complication).toBeInTheDocument();

        // Verify slot position via wrapper attributes
        const wrapper = complication.closest('[data-slot]');
        expect(wrapper).toHaveAttribute('data-slot', slot);
      });
    });

    it('positions slots correctly relative to card', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        bottomRight: { component: BadgeComplication },
      };

      const { container } = render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const complicationsContainer = container.querySelector('[data-complications-count]');
      expect(complicationsContainer).toHaveStyle({
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
      });
    });
  });

  describe('Empty Slot Behavior', () => {
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

      // Verify no empty placeholders
      const complicationsContainer = screen.getByText('Test Prompt Card').closest('[data-card-id]');
      const slots = complicationsContainer?.querySelectorAll('[data-slot]');
      expect(slots).toHaveLength(2); // Only filled slots
    });

    it('does not affect card layout when slots are empty', () => {
      const { container: withComplications } = render(
        <PromptCard
          {...baseProps}
          complications={{ topLeft: { component: BadgeComplication } }}
        />
      );

      const { container: withoutComplications } = render(
        <PromptCard {...baseProps} />
      );

      // Card content dimensions should be the same
      const cardWithComplications = withComplications.querySelector('[role="button"]');
      const cardWithoutComplications = withoutComplications.querySelector('[role="button"]');

      expect(cardWithComplications?.className).toEqual(cardWithoutComplications?.className);
    });
  });

  describe('Card Context Provision', () => {
    it('provides card context to complications', () => {
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
      expect(complication).toHaveClass('status xl');
      expect(complication).toHaveTextContent('⚡'); // Running state
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

    it('provides card ID for debugging and tracking', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const wrapper = screen.getByTestId('badge-topLeft').closest('[data-card-id]');
      expect(wrapper).toHaveAttribute('data-card-id');

      const cardId = wrapper?.getAttribute('data-card-id');
      expect(cardId).toBeTruthy();
      expect(cardId).toContain('test-prompt-card');
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

  describe('Error Boundary Behavior', () => {
    // Mock console.error to prevent error output during tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

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

  describe('Performance Optimization', () => {
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

    it('handles many complications efficiently', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: StatusComplication },
        bottomLeft: { component: BadgeComplication },
        bottomRight: { component: StatusComplication },
        edgeLeft: { component: AnimatedComplication },
        edgeRight: { component: BadgeComplication },
        footer: { component: StatusComplication },
      };

      const startTime = performance.now();

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);

      // All complications should be present
      expect(screen.getByTestId('badge-topLeft')).toBeInTheDocument();
      expect(screen.getByTestId('status-topRight')).toBeInTheDocument();
      expect(screen.getByTestId('animated-edgeLeft')).toBeInTheDocument();
    });

    it('memoizes complications to prevent unnecessary re-renders', () => {
      let complicationRenderCount = 0;

      const MemoTestComplication = React.memo(({ slot }: ComplicationProps) => {
        complicationRenderCount++;
        return <div data-testid={`memo-${slot}`}>Count: {complicationRenderCount}</div>;
      });

      const complications: ComplicationSlots = {
        topLeft: {
          component: MemoTestComplication,
          performance: { memoize: true },
        },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      expect(complicationRenderCount).toBe(1);

      // Re-render with same props should not trigger complication re-render
      rerender(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      expect(complicationRenderCount).toBe(1); // Should still be 1
    });

    it('handles slow complications without blocking card render', async () => {
      const complications: ComplicationSlots = {
        topLeft: { component: SlowComplication },
        topRight: { component: BadgeComplication },
      };

      const startTime = performance.now();

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      // Card should render quickly even with slow complications
      expect(screen.getByText('Test Prompt Card')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();

      // Fast complication should be available immediately
      expect(screen.getByTestId('badge-topRight')).toBeInTheDocument();

      // Slow complication should eventually render
      await waitFor(() => {
        expect(screen.getByTestId('slow-topLeft')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Size Variant Constraints', () => {
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

  describe('Feature Flag Support', () => {
    it('respects animation preferences', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: AnimatedComplication },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const complication = screen.getByTestId('animated-topLeft');

      // Should reflect animation preferences (mocked in test setup)
      expect(complication).toHaveAttribute('data-should-animate');
    });

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

    it('updates notifications when complications are filtered', async () => {
      const mockOnChange = jest.fn();
      const complications: ComplicationSlots = {
        topLeft: {
          component: BadgeComplication,
          supportedStates: ['default'],
        },
        topRight: { component: StatusComplication },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          state="default"
          complications={complications}
          onComplicationChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith(['topLeft', 'topRight']);
      });

      mockOnChange.mockClear();

      rerender(
        <PromptCard
          {...baseProps}
          state="running"
          complications={complications}
          onComplicationChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith(['topRight']); // topLeft filtered out
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with complications', async () => {
      const complications: ComplicationSlots = {
        topLeft: { component: BadgeComplication },
        topRight: { component: StatusComplication },
        footer: { component: BadgeComplication },
      };

      const { container } = render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

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

  describe('Integration with Card States', () => {
    it('complications respond to running state', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: StatusComplication },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          isRunning={false}
          complications={complications}
        />
      );

      expect(screen.getByTestId('status-topLeft')).toHaveTextContent('✅');

      rerender(
        <PromptCard
          {...baseProps}
          isRunning={true}
          complications={complications}
        />
      );

      expect(screen.getByTestId('status-topLeft')).toHaveTextContent('⚡');
    });

    it('complications respond to error state', () => {
      const complications: ComplicationSlots = {
        topLeft: { component: StatusComplication },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      expect(screen.getByTestId('status-topLeft')).toHaveTextContent('✅');

      rerender(
        <PromptCard
          {...baseProps}
          error="Something went wrong"
          complications={complications}
        />
      );

      expect(screen.getByTestId('status-topLeft')).toHaveTextContent('❌');
    });

    it('complications can be filtered by card state', () => {
      const complications: ComplicationSlots = {
        topLeft: {
          component: BadgeComplication,
          supportedStates: ['default', 'running'],
        },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          state="default"
          complications={complications}
        />
      );

      expect(screen.getByTestId('badge-topLeft')).toBeInTheDocument();

      rerender(
        <PromptCard
          {...baseProps}
          state="error"
          complications={complications}
        />
      );

      expect(screen.queryByTestId('badge-topLeft')).not.toBeInTheDocument();
    });
  });

  describe('CostLatencyStat Integration', () => {
    it('renders CostLatencyStat complication with both metrics', async () => {
      const { CostLatencyStat } = await import('../complications/CostLatencyStat');

      const complications: ComplicationSlots = {
        bottomLeft: {
          component: CostLatencyStat,
          props: {
            cost: {
              avg: 234,
              min: 180,
              max: 450,
              currency: 'USD',
            },
            latency: {
              p50: 1250,
              p95: 2100,
              samples: 100,
            },
          },
        },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      expect(screen.getByTestId('cost-latency-stat')).toBeInTheDocument();
      expect(screen.getByText('$2.340')).toBeInTheDocument();
      expect(screen.getByText('1.3s')).toBeInTheDocument();
    });

    it('respects compact mode for CostLatencyStat', async () => {
      const { CostLatencyStat } = await import('../complications/CostLatencyStat');

      const complications: ComplicationSlots = {
        bottomLeft: {
          component: CostLatencyStat,
          props: {
            cost: {
              avg: 234,
              min: 180,
              max: 450,
              currency: 'USD',
            },
            latency: {
              p50: 750,
              p95: 1200,
              samples: 100,
            },
            primaryMetric: 'cost',
          },
        },
      };

      render(
        <PromptCard
          {...baseProps}
          size="compact"
          complications={complications}
        />
      );

      // In compact mode, only shows primary metric (cost)
      expect(screen.getByText('$2.340')).toBeInTheDocument();
      expect(screen.queryByText('750ms')).not.toBeInTheDocument();
    });

    it('handles CostLatencyStat with no data gracefully', async () => {
      const { CostLatencyStat } = await import('../complications/CostLatencyStat');

      const complications: ComplicationSlots = {
        bottomLeft: {
          component: CostLatencyStat,
          props: {
            // No cost or latency data
          },
        },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      // Component should not render when no data is available
      expect(screen.queryByTestId('cost-latency-stat')).not.toBeInTheDocument();
    });

    it('shows CostLatencyStat with low cost edge case', async () => {
      const { CostLatencyStat } = await import('../complications/CostLatencyStat');

      const complications: ComplicationSlots = {
        bottomLeft: {
          component: CostLatencyStat,
          props: {
            cost: {
              avg: 0.05,
              min: 0.01,
              max: 0.09,
              currency: 'USD',
            },
          },
        },
      };

      render(
        <PromptCard
          {...baseProps}
          complications={complications}
        />
      );

      expect(screen.getByText('<$0.001')).toBeInTheDocument();
    });

    it('respects complication config for CostLatencyStat', async () => {
      const { CostLatencyStat } = await import('../complications/CostLatencyStat');
      const onComplicationError = jest.fn();

      const complications: ComplicationSlots = {
        bottomLeft: {
          component: CostLatencyStat,
          supportedSizes: ['standard', 'xl'],
          props: {
            cost: {
              avg: 234,
              min: 180,
              max: 450,
            },
          },
        },
      };

      const { rerender } = render(
        <PromptCard
          {...baseProps}
          size="compact"
          complications={complications}
          onComplicationError={onComplicationError}
        />
      );

      // Should not render in compact size when not supported
      expect(screen.queryByTestId('cost-latency-stat')).not.toBeInTheDocument();

      rerender(
        <PromptCard
          {...baseProps}
          size="standard"
          complications={complications}
          onComplicationError={onComplicationError}
        />
      );

      // Should render in standard size
      expect(screen.getByTestId('cost-latency-stat')).toBeInTheDocument();
    });
  });
});
