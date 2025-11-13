/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  ComplicationSlots,
  withComplicationMemo,
  useComplicationVisibility,
  isValidSlotPosition,
  getSlotPriority,
} from '../ComplicationSlots';
import { ComplicationProvider } from '../context';
import type {
  ComplicationProps,
  ComplicationSlots as ComplicationSlotsType,
  SlotPosition,
  CardState,
  CardSize,
} from '../types';

expect.extend(toHaveNoViolations);

// Mock CSS modules
jest.mock('../complications.module.css', () => ({
  complicationsContainer: 'complications-container',
  slot: 'slot',
  slotTopLeft: 'slot-top-left',
  slotTopRight: 'slot-top-right',
  slotBottomLeft: 'slot-bottom-left',
  slotBottomRight: 'slot-bottom-right',
  slotEdgeLeft: 'slot-edge-left',
  slotEdgeRight: 'slot-edge-right',
  slotFooter: 'slot-footer',
  compact: 'compact',
  xl: 'xl',
  running: 'running',
  error: 'error',
  disabled: 'disabled',
  selected: 'selected',
  debug: 'debug',
  slotEntering: 'slot-entering',
  slotError: 'slot-error',
  debugInfo: 'debug-info',
}));

// Mock performance for tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

// Test complications
function TestComplication({ slot, cardId, cardState, isVisible, className }: ComplicationProps) {
  return (
    <div
      data-testid={`complication-${slot}`}
      data-card-id={cardId}
      data-card-state={cardState}
      data-visible={isVisible}
      className={className}
    >
      {slot} complication
    </div>
  );
}

function MinimalComplication({ slot }: ComplicationProps) {
  return <div data-testid={`minimal-${slot}`}>Minimal</div>;
}

function ErrorComplication({ slot }: ComplicationProps) {
  throw new Error(`Complication error in ${slot}`);
}

function SlowComplication({ slot }: ComplicationProps) {
  // Simulate slow rendering
  const start = Date.now();
  while (Date.now() - start < 20) {
    // Busy wait to simulate slow render
  }
  return <div data-testid={`slow-${slot}`}>Slow</div>;
}

function VisibilityTestComponent({
  supportedSizes,
  supportedStates,
  requiresAnimations,
}: {
  supportedSizes?: CardSize[];
  supportedStates?: CardState[];
  requiresAnimations?: boolean;
}) {
  const isVisible = useComplicationVisibility(supportedSizes, supportedStates, requiresAnimations);
  return <div data-testid="visibility-result">{isVisible.toString()}</div>;
}

describe('ComplicationSlots', () => {
  const defaultProviderProps = {
    cardId: 'test-card',
    cardState: 'default' as const,
    cardSize: 'standard' as const,
    cardTitle: 'Test Card',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Slot Rendering', () => {
    it('renders complications in correct slot positions', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
        topRight: { component: TestComplication },
        bottomLeft: { component: TestComplication },
        bottomRight: { component: TestComplication },
        edgeLeft: { component: TestComplication },
        edgeRight: { component: TestComplication },
        footer: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      // All 7 slots should be rendered
      expect(screen.getByTestId('complication-topLeft')).toBeInTheDocument();
      expect(screen.getByTestId('complication-topRight')).toBeInTheDocument();
      expect(screen.getByTestId('complication-bottomLeft')).toBeInTheDocument();
      expect(screen.getByTestId('complication-bottomRight')).toBeInTheDocument();
      expect(screen.getByTestId('complication-edgeLeft')).toBeInTheDocument();
      expect(screen.getByTestId('complication-edgeRight')).toBeInTheDocument();
      expect(screen.getByTestId('complication-footer')).toBeInTheDocument();
    });

    it('renders nothing when no complications provided', () => {
      render(
        <ComplicationProvider {...defaultProviderProps}>
          <ComplicationSlots />
        </ComplicationProvider>
      );

      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    });

    it('renders empty slots as nothing (no placeholders)', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
        // topRight deliberately empty
        bottomLeft: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      expect(screen.getByTestId('complication-topLeft')).toBeInTheDocument();
      expect(screen.queryByTestId('complication-topRight')).not.toBeInTheDocument();
      expect(screen.getByTestId('complication-bottomLeft')).toBeInTheDocument();
    });

    it('applies correct CSS classes for slot positions', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
        footer: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      const topLeft = screen.getByTestId('complication-topLeft');
      const footer = screen.getByTestId('complication-footer');

      expect(topLeft.className).toContain('slot-top-left');
      expect(footer.className).toContain('slot-footer');
    });

    it('passes complication context to child components', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          cardState="running"
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      const complication = screen.getByTestId('complication-topLeft');
      expect(complication).toHaveAttribute('data-card-id', 'test-card');
      expect(complication).toHaveAttribute('data-card-state', 'running');
    });
  });

  describe('Card Size Constraints', () => {
    it('filters complications based on supported sizes', () => {
      const complications: ComplicationSlotsType = {
        topLeft: {
          component: TestComplication,
          supportedSizes: ['standard', 'xl'], // Not compact
        },
        topRight: {
          component: TestComplication,
          // No size constraints
        },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          cardSize="compact"
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      expect(screen.queryByTestId('complication-topLeft')).not.toBeInTheDocument();
      expect(screen.getByTestId('complication-topRight')).toBeInTheDocument();
    });

    it('applies size-specific container classes', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
      };

      const { rerender } = render(
        <ComplicationProvider
          {...defaultProviderProps}
          cardSize="compact"
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      let container = document.querySelector('.complications-container');
      expect(container).toHaveClass('compact');

      rerender(
        <ComplicationProvider
          {...defaultProviderProps}
          cardSize="xl"
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      container = document.querySelector('.complications-container');
      expect(container).toHaveClass('xl');
    });
  });

  describe('Card State Response', () => {
    it('filters complications based on supported states', () => {
      const complications: ComplicationSlotsType = {
        topLeft: {
          component: TestComplication,
          supportedStates: ['default', 'running'], // Not error
        },
        topRight: {
          component: TestComplication,
          // No state constraints
        },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          cardState="error"
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      expect(screen.queryByTestId('complication-topLeft')).not.toBeInTheDocument();
      expect(screen.getByTestId('complication-topRight')).toBeInTheDocument();
    });

    it('applies state-specific container classes', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
      };

      const { rerender } = render(
        <ComplicationProvider
          {...defaultProviderProps}
          cardState="running"
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      let container = document.querySelector('.complications-container');
      expect(container).toHaveClass('running');

      rerender(
        <ComplicationProvider
          {...defaultProviderProps}
          cardState="error"
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      container = document.querySelector('.complications-container');
      expect(container).toHaveClass('error');
    });
  });

  describe('Animation Support', () => {
    it('filters complications requiring animations when reduced motion is preferred', () => {
      // Mock reduced motion preference
      const mockMatchMedia = jest.fn();
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      mockMatchMedia.mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const complications: ComplicationSlotsType = {
        topLeft: {
          component: TestComplication,
          requiresAnimations: true,
        },
        topRight: {
          component: TestComplication,
          requiresAnimations: false,
        },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      expect(screen.queryByTestId('complication-topLeft')).not.toBeInTheDocument();
      expect(screen.getByTestId('complication-topRight')).toBeInTheDocument();
    });

    it('applies entering animation class for new complications', async () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      await waitFor(() => {
        const complication = screen.getByTestId('complication-topLeft');
        expect(complication.className).toContain('slot-entering');
      });
    });
  });

  describe('Error Boundary Handling', () => {
    // Mock console.error to prevent error output during tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('catches complication errors and shows fallback', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: ErrorComplication },
        topRight: { component: TestComplication }, // Should still render
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      // Error complication should show fallback
      expect(screen.queryByTestId('complication-topLeft')).not.toBeInTheDocument();

      // Other complications should still render
      expect(screen.getByTestId('complication-topRight')).toBeInTheDocument();
    });

    it('calls onError callback when complication fails', async () => {
      const mockOnError = jest.fn();
      const complications: ComplicationSlotsType = {
        topLeft: { component: ErrorComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
          onComplicationError={mockOnError}
        >
          <ComplicationSlots />
        </ComplicationProvider>
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

    it('shows custom error fallback when provided', () => {
      function CustomErrorFallback({ slot, error }: any) {
        return (
          <div data-testid={`custom-error-${slot}`}>
            Custom error: {error.message}
          </div>
        );
      }

      const complications: ComplicationSlotsType = {
        topLeft: {
          component: ErrorComplication,
          errorFallback: CustomErrorFallback,
        },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      expect(screen.getByTestId('custom-error-topLeft')).toHaveTextContent(
        'Custom error: Complication error in topLeft'
      );
    });
  });

  describe('Performance Optimization', () => {
    it('renders slots in priority order', () => {
      const renderOrder: string[] = [];

      function TrackingComplication({ slot }: ComplicationProps) {
        renderOrder.push(slot);
        return <div data-testid={`tracking-${slot}`}>Tracking</div>;
      }

      const complications: ComplicationSlotsType = {
        // Add in reverse priority order to test sorting
        footer: { component: TrackingComplication },
        topLeft: { component: TrackingComplication },
        edgeRight: { component: TrackingComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      // topLeft (100) should render before edgeRight (50) which should render before footer (60)
      expect(renderOrder).toEqual(['topLeft', 'footer', 'edgeRight']);
    });

    it('supports lazy loading with Suspense', async () => {
      const LazyComplication = React.lazy(async () => ({
        default: ({ slot }: ComplicationProps) => (
          <div data-testid={`lazy-${slot}`}>Lazy loaded</div>
        ),
      }));

      const complications: ComplicationSlotsType = {
        topLeft: {
          component: LazyComplication,
          performance: { lazy: true },
        },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      // Should show loading fallback initially
      expect(screen.getByLabelText('Loading topLeft complication')).toBeInTheDocument();

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('lazy-topLeft')).toBeInTheDocument();
      });
    });
  });

  describe('Container Attributes', () => {
    it('sets correct container attributes', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
        topRight: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots />
        </ComplicationProvider>
      );

      const container = document.querySelector('.complications-container');
      expect(container).toHaveAttribute('data-complications-count', '2');
      expect(container).toHaveAttribute('data-card-id', 'test-card');
      expect(container).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies custom className to container', () => {
      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots className="custom-class" />
        </ComplicationProvider>
      );

      const container = document.querySelector('.complications-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Debug Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('shows debug information in development mode', () => {
      process.env.NODE_ENV = 'development';

      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots debug />
        </ComplicationProvider>
      );

      expect(screen.getByText('Slots: topLeft')).toBeInTheDocument();
      expect(screen.getByText('Errors: 0')).toBeInTheDocument();
      expect(screen.getByText('Card: standard / default')).toBeInTheDocument();
    });

    it('does not show debug info when debug flag is false', () => {
      process.env.NODE_ENV = 'development';

      const complications: ComplicationSlotsType = {
        topLeft: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProviderProps}
          complications={complications}
        >
          <ComplicationSlots debug={false} />
        </ComplicationProvider>
      );

      expect(screen.queryByText('Slots: topLeft')).not.toBeInTheDocument();
    });
  });
});

describe('Utility Functions', () => {
  describe('isValidSlotPosition', () => {
    it('validates correct slot positions', () => {
      expect(isValidSlotPosition('topLeft')).toBe(true);
      expect(isValidSlotPosition('topRight')).toBe(true);
      expect(isValidSlotPosition('bottomLeft')).toBe(true);
      expect(isValidSlotPosition('bottomRight')).toBe(true);
      expect(isValidSlotPosition('edgeLeft')).toBe(true);
      expect(isValidSlotPosition('edgeRight')).toBe(true);
      expect(isValidSlotPosition('footer')).toBe(true);
    });

    it('rejects invalid slot positions', () => {
      expect(isValidSlotPosition('invalid')).toBe(false);
      expect(isValidSlotPosition('center')).toBe(false);
      expect(isValidSlotPosition('')).toBe(false);
      expect(isValidSlotPosition('topCenter')).toBe(false);
    });
  });

  describe('getSlotPriority', () => {
    it('returns correct priorities for slot positions', () => {
      expect(getSlotPriority('topLeft')).toBe(100);
      expect(getSlotPriority('topRight')).toBe(90);
      expect(getSlotPriority('bottomRight')).toBe(80);
      expect(getSlotPriority('bottomLeft')).toBe(70);
      expect(getSlotPriority('footer')).toBe(60);
      expect(getSlotPriority('edgeRight')).toBe(50);
      expect(getSlotPriority('edgeLeft')).toBe(40);
    });

    it('maintains priority ordering', () => {
      const positions: SlotPosition[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft', 'footer', 'edgeRight', 'edgeLeft'];
      const priorities = positions.map(pos => getSlotPriority(pos));

      // Priorities should be in descending order
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i-1]).toBeGreaterThanOrEqual(priorities[i]);
      }
    });
  });
});

describe('withComplicationMemo', () => {
  let renderCount = 0;

  function TestComponent(props: ComplicationProps) {
    renderCount++;
    return <div data-testid={`render-${renderCount}`}>{props.slot}</div>;
  }

  const MemoizedComponent = withComplicationMemo(TestComponent);

  beforeEach(() => {
    renderCount = 0;
  });

  it('prevents re-renders when props are the same', () => {
    const props: ComplicationProps = {
      cardId: 'test',
      cardState: 'default',
      cardSize: 'standard',
      cardTitle: 'Test',
      isFocused: false,
      lastStateChange: new Date(),
      features: {
        animations: true,
        highContrast: false,
        reducedMotion: false,
      },
      slot: 'topLeft',
      isVisible: true,
    };

    const { rerender } = render(
      <ComplicationProvider {...defaultProviderProps}>
        <MemoizedComponent {...props} />
      </ComplicationProvider>
    );

    expect(renderCount).toBe(1);

    // Re-render with same props
    rerender(
      <ComplicationProvider {...defaultProviderProps}>
        <MemoizedComponent {...props} />
      </ComplicationProvider>
    );

    expect(renderCount).toBe(1); // Should not re-render
  });

  it('allows re-renders when relevant props change', () => {
    const baseProps: ComplicationProps = {
      cardId: 'test',
      cardState: 'default',
      cardSize: 'standard',
      cardTitle: 'Test',
      isFocused: false,
      lastStateChange: new Date(),
      features: {
        animations: true,
        highContrast: false,
        reducedMotion: false,
      },
      slot: 'topLeft',
      isVisible: true,
    };

    const { rerender } = render(
      <ComplicationProvider {...defaultProviderProps}>
        <MemoizedComponent {...baseProps} />
      </ComplicationProvider>
    );

    expect(renderCount).toBe(1);

    // Change relevant prop
    rerender(
      <ComplicationProvider {...defaultProviderProps}>
        <MemoizedComponent {...baseProps} cardState="running" />
      </ComplicationProvider>
    );

    expect(renderCount).toBe(2); // Should re-render
  });
});

describe('useComplicationVisibility', () => {
  const TestWrapper = ({
    cardState = 'default',
    cardSize = 'standard',
    supportedSizes,
    supportedStates,
    requiresAnimations,
  }: {
    cardState?: CardState;
    cardSize?: CardSize;
    supportedSizes?: CardSize[];
    supportedStates?: CardState[];
    requiresAnimations?: boolean;
  }) => (
    <ComplicationProvider
      cardId="test"
      cardState={cardState}
      cardSize={cardSize}
      cardTitle="Test"
    >
      <VisibilityTestComponent
        supportedSizes={supportedSizes}
        supportedStates={supportedStates}
        requiresAnimations={requiresAnimations}
      />
    </ComplicationProvider>
  );

  it('returns true when all constraints are met', () => {
    render(
      <TestWrapper
        cardSize="standard"
        cardState="default"
        supportedSizes={['standard', 'xl']}
        supportedStates={['default', 'running']}
      />
    );

    expect(screen.getByTestId('visibility-result')).toHaveTextContent('true');
  });

  it('returns false when size constraint is not met', () => {
    render(
      <TestWrapper
        cardSize="compact"
        supportedSizes={['standard', 'xl']}
      />
    );

    expect(screen.getByTestId('visibility-result')).toHaveTextContent('false');
  });

  it('returns false when state constraint is not met', () => {
    render(
      <TestWrapper
        cardState="error"
        supportedStates={['default', 'running']}
      />
    );

    expect(screen.getByTestId('visibility-result')).toHaveTextContent('false');
  });

  it('returns false when animations are required but reduced motion is preferred', () => {
    // Mock reduced motion preference
    const mockMatchMedia = jest.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    mockMatchMedia.mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <TestWrapper requiresAnimations={true} />
    );

    expect(screen.getByTestId('visibility-result')).toHaveTextContent('false');
  });

  it('returns true when no constraints are specified', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('visibility-result')).toHaveTextContent('true');
  });
});

describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
    const complications: ComplicationSlotsType = {
      topLeft: { component: TestComplication },
      topRight: { component: TestComplication },
    };

    const { container } = render(
      <ComplicationProvider
        {...defaultProviderProps}
        complications={complications}
      >
        <ComplicationSlots />
      </ComplicationProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('properly manages ARIA attributes', () => {
    const complications: ComplicationSlotsType = {
      topLeft: { component: TestComplication },
    };

    render(
      <ComplicationProvider
        {...defaultProviderProps}
        complications={complications}
      >
        <ComplicationSlots />
      </ComplicationProvider>
    );

    const container = document.querySelector('.complications-container');
    expect(container).toHaveAttribute('aria-hidden', 'true');

    const complicationWrapper = screen.getByRole('complementary');
    expect(complicationWrapper).toHaveAttribute('aria-label', 'topLeft complication for Test Card');
  });
});
