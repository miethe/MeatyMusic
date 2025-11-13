/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  ComplicationProvider,
  useComplicationContext,
  useSlotManager,
  useOptionalComplicationContext,
  ComplicationWrapper,
  ComplicationDebugInfo,
} from '../context';
import type {
  ComplicationContext,
  ComplicationSlots,
  SlotManagerConfig,
  ComplicationProps,
} from '../types';

expect.extend(toHaveNoViolations);

// Mock performance.now for consistent testing
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

// Mock console methods for clean test output
const originalConsole = {
  warn: console.warn,
  error: console.error,
};

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
  jest.clearAllMocks();
});

afterAll(() => {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Test component that uses complication context
function TestComplication({ testId }: { testId: string }) {
  const context = useComplicationContext();
  const slotManager = useSlotManager();

  return (
    <div data-testid={testId}>
      <div data-testid="card-id">{context.cardId}</div>
      <div data-testid="card-state">{context.cardState}</div>
      <div data-testid="card-size">{context.cardSize}</div>
      <div data-testid="card-title">{context.cardTitle}</div>
      <div data-testid="is-focused">{context.isFocused.toString()}</div>
      <div data-testid="features-animations">{context.features.animations.toString()}</div>
      <div data-testid="effective-slots-count">
        {Object.keys(slotManager.getEffectiveSlots(context)).length}
      </div>
    </div>
  );
}

// Component that accesses optional context
function OptionalContextComponent() {
  const context = useOptionalComplicationContext();
  return <div data-testid="has-context">{context ? 'true' : 'false'}</div>;
}

// Component that throws an error for testing error boundaries
function ErrorComplication({ shouldError = false }: { shouldError?: boolean }) {
  if (shouldError) {
    throw new Error('Test complication error');
  }
  return <div data-testid="error-complication">Working</div>;
}

// Common props used across all tests
const defaultProps = {
  cardId: 'test-card-123',
  cardState: 'default' as const,
  cardSize: 'standard' as const,
  cardTitle: 'Test Card',
};

describe('ComplicationProvider', () => {

  describe('Context Provision', () => {
    it('provides complication context to child components', () => {
      render(
        <ComplicationProvider {...defaultProps}>
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      expect(screen.getByTestId('card-id')).toHaveTextContent('test-card-123');
      expect(screen.getByTestId('card-state')).toHaveTextContent('default');
      expect(screen.getByTestId('card-size')).toHaveTextContent('standard');
      expect(screen.getByTestId('card-title')).toHaveTextContent('Test Card');
      expect(screen.getByTestId('is-focused')).toHaveTextContent('false');
    });

    it('updates context when props change', () => {
      const { rerender } = render(
        <ComplicationProvider {...defaultProps} isFocused={false}>
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      expect(screen.getByTestId('is-focused')).toHaveTextContent('false');

      rerender(
        <ComplicationProvider {...defaultProps} isFocused={true}>
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      expect(screen.getByTestId('is-focused')).toHaveTextContent('true');
    });

    it('detects user preference features correctly', () => {
      // Mock matchMedia to simulate user preferences
      const mockMatchMedia = jest.fn();
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      // Test reduced motion preference
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
        <ComplicationProvider {...defaultProps}>
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      expect(screen.getByTestId('features-animations')).toHaveTextContent('false');
    });
  });

  describe('Slot Manager', () => {
    const mockComplications: ComplicationSlots = {
      topLeft: {
        component: TestComplication,
        supportedSizes: ['standard', 'xl'],
      },
      topRight: {
        component: TestComplication,
        supportedStates: ['default', 'running'],
      },
      bottomLeft: {
        component: TestComplication,
        requiresAnimations: true,
      },
    };

    it('filters complications based on card size constraints', () => {
      render(
        <ComplicationProvider
          {...defaultProps}
          cardSize="compact"
          complications={mockComplications}
        >
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      // topLeft should be filtered out (only supports standard/xl)
      // topRight should be included (no size constraints)
      // bottomLeft should be included (no size constraints)
      expect(screen.getByTestId('effective-slots-count')).toHaveTextContent('2');
    });

    it('filters complications based on card state constraints', () => {
      render(
        <ComplicationProvider
          {...defaultProps}
          cardState="error"
          complications={mockComplications}
        >
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      // topRight should be filtered out (only supports default/running)
      expect(screen.getByTestId('effective-slots-count')).toHaveTextContent('2');
    });

    it('filters complications based on animation requirements', () => {
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
        <ComplicationProvider
          {...defaultProps}
          complications={mockComplications}
        >
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      // bottomLeft should be filtered out (requires animations but user prefers reduced motion)
      expect(screen.getByTestId('effective-slots-count')).toHaveTextContent('2');
    });

    it('respects global complications disable flag', () => {
      const config: Partial<SlotManagerConfig> = {
        enabled: false,
      };

      render(
        <ComplicationProvider
          {...defaultProps}
          complications={mockComplications}
          config={config}
        >
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      expect(screen.getByTestId('effective-slots-count')).toHaveTextContent('0');
    });
  });

  describe('Error Handling', () => {
    let mockOnComplicationError: jest.Mock;

    beforeEach(() => {
      mockOnComplicationError = jest.fn();
    });

    it('reports complication errors through callback', async () => {
      const TestWrapper = () => {
        const slotManager = useSlotManager();

        React.useEffect(() => {
          slotManager.reportError(
            'topLeft',
            new Error('Test error'),
            { componentStack: 'test stack' } as React.ErrorInfo
          );
        }, [slotManager]);

        return <div data-testid="wrapper" />;
      };

      render(
        <ComplicationProvider
          {...defaultProps}
          onComplicationError={mockOnComplicationError}
        >
          <TestWrapper />
        </ComplicationProvider>
      );

      await waitFor(() => {
        expect(mockOnComplicationError).toHaveBeenCalledWith(
          'topLeft',
          expect.objectContaining({
            message: 'Test error',
          })
        );
      });
    });

    it('tracks error states in slot manager', async () => {
      const TestErrorReporter = () => {
        const slotManager = useSlotManager();

        React.useEffect(() => {
          slotManager.reportError(
            'topRight',
            new Error('Another error'),
            { componentStack: 'test stack' } as React.ErrorInfo
          );
        }, [slotManager]);

        return (
          <div data-testid="error-count">
            {Object.keys(slotManager.errors).length}
          </div>
        );
      };

      render(
        <ComplicationProvider {...defaultProps}>
          <TestErrorReporter />
        </ComplicationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('logs performance warnings when enabled and threshold exceeded', async () => {
      const config: Partial<SlotManagerConfig> = {
        monitoring: {
          logPerformance: true,
          renderTimeThreshold: 1, // Very low threshold to trigger warning
        },
      };

      render(
        <ComplicationProvider
          {...defaultProps}
          config={config}
        >
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      // Allow time for effect cleanup to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Complications render time exceeded threshold')
      );
    });

    it('does not log performance warnings when monitoring disabled', () => {
      const config: Partial<SlotManagerConfig> = {
        monitoring: {
          logPerformance: false,
          renderTimeThreshold: 1,
        },
      };

      render(
        <ComplicationProvider
          {...defaultProps}
          config={config}
        >
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Complication Change Events', () => {
    it('notifies parent when active complications change', async () => {
      const mockOnComplicationChange = jest.fn();
      const complications: ComplicationSlots = {
        topLeft: { component: TestComplication },
        topRight: { component: TestComplication },
      };

      render(
        <ComplicationProvider
          {...defaultProps}
          complications={complications}
          onComplicationChange={mockOnComplicationChange}
        >
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );

      await waitFor(() => {
        expect(mockOnComplicationChange).toHaveBeenCalledWith(['topLeft', 'topRight']);
      });
    });
  });
});

describe('useComplicationContext', () => {
  it('throws error when used outside provider', () => {
    const TestComponent = () => {
      useComplicationContext();
      return <div />;
    };

    // Suppress error boundary console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => render(<TestComponent />)).toThrow(
      'useComplicationContext must be used within a ComplicationProvider'
    );

    console.error = originalError;
  });

  it('returns context when used within provider', () => {
    render(
      <ComplicationProvider {...defaultProps}>
        <TestComplication testId="test-comp" />
      </ComplicationProvider>
    );

    expect(screen.getByTestId('card-id')).toHaveTextContent('test-card-123');
  });
});

describe('useOptionalComplicationContext', () => {
  it('returns null when used outside provider', () => {
    render(<OptionalContextComponent />);
    expect(screen.getByTestId('has-context')).toHaveTextContent('false');
  });

  it('returns context when used within provider', () => {
    render(
      <ComplicationProvider {...defaultProps}>
        <OptionalContextComponent />
      </ComplicationProvider>
    );
    expect(screen.getByTestId('has-context')).toHaveTextContent('true');
  });
});

describe('ComplicationWrapper', () => {
  it('renders children with proper attributes', () => {
    render(
      <ComplicationProvider {...defaultProps}>
        <ComplicationWrapper slot="topLeft" className="test-class">
          <div data-testid="wrapped-content">Content</div>
        </ComplicationWrapper>
      </ComplicationProvider>
    );

    const wrapper = screen.getByRole('complementary');
    expect(wrapper).toHaveClass('test-class');
    expect(wrapper).toHaveAttribute('data-slot', 'topLeft');
    expect(wrapper).toHaveAttribute('data-card-id', 'test-card-123');
    expect(wrapper).toHaveAttribute('aria-label', 'topLeft complication for Test Card');
    expect(screen.getByTestId('wrapped-content')).toBeInTheDocument();
  });

  it('accepts custom aria-label', () => {
    render(
      <ComplicationProvider {...defaultProps}>
        <ComplicationWrapper
          slot="topLeft"
          aria-label="Custom label"
        >
          <div>Content</div>
        </ComplicationWrapper>
      </ComplicationProvider>
    );

    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Custom label');
  });
});

describe('ComplicationDebugInfo', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('renders debug info in development mode', () => {
    process.env.NODE_ENV = 'development';

    const complications: ComplicationSlots = {
      topLeft: { component: TestComplication },
    };

    render(
      <ComplicationProvider
        {...defaultProps}
        complications={complications}
      >
        <ComplicationDebugInfo />
      </ComplicationProvider>
    );

    expect(screen.getByText('test-card-123')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('standard')).toBeInTheDocument();
  });

  it('does not render in production mode', () => {
    process.env.NODE_ENV = 'production';

    render(
      <ComplicationProvider {...defaultProps}>
        <ComplicationDebugInfo />
      </ComplicationProvider>
    );

    expect(screen.queryByText('test-card-123')).not.toBeInTheDocument();
  });

  it('does not render when no context available', () => {
    process.env.NODE_ENV = 'development';

    render(<ComplicationDebugInfo />);

    expect(screen.queryByText('Card ID:')).not.toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <ComplicationProvider {...defaultProps}>
        <ComplicationWrapper slot="topLeft">
          <div role="button" aria-label="Test complication">
            Content
          </div>
        </ComplicationWrapper>
      </ComplicationProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('provides proper ARIA attributes for complications wrapper', () => {
    render(
      <ComplicationProvider {...defaultProps}>
        <ComplicationWrapper slot="bottomRight">
          <button>Action</button>
        </ComplicationWrapper>
      </ComplicationProvider>
    );

    const wrapper = screen.getByRole('complementary');
    expect(wrapper).toHaveAttribute('role', 'complementary');
    expect(wrapper).toHaveAttribute('aria-label', 'bottomRight complication for Test Card');
  });
});

describe('Memory Management', () => {
  it('cleans up effects on unmount', () => {
    const { unmount } = render(
      <ComplicationProvider {...defaultProps}>
        <TestComplication testId="test-comp" />
      </ComplicationProvider>
    );

    expect(() => unmount()).not.toThrow();
  });

  it('handles rapid state changes without memory leaks', async () => {
    const { rerender } = render(
      <ComplicationProvider {...defaultProps} cardState="default">
        <TestComplication testId="test-comp" />
      </ComplicationProvider>
    );

    // Rapidly change states
    const states = ['running', 'error', 'disabled', 'selected', 'default'] as const;
    for (const state of states) {
      rerender(
        <ComplicationProvider {...defaultProps} cardState={state}>
          <TestComplication testId="test-comp" />
        </ComplicationProvider>
      );
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1));
      });
    }

    expect(screen.getByTestId('card-state')).toHaveTextContent('default');
  });
});

describe('Dynamic Registration', () => {
  // NOTE: These tests would verify dynamic registration works,
  // but we need to implement a mechanism to trigger re-renders
  // when registry changes occur. For now, we'll test that the
  // version tracking works correctly.

  it('tracks registry version changes', () => {
    const { registerComplication } = require('../registry');

    function DynamicComplication() {
      return <div>Dynamic</div>;
    }

    const initialVersion = require('../registry').getRegistryVersion();

    // Register a complication - this should increment version
    const unregister = registerComplication('topLeft', { component: DynamicComplication });
    const versionAfterRegister = require('../registry').getRegistryVersion();

    expect(versionAfterRegister).toBeGreaterThan(initialVersion);

    // Unregister - this should increment version again
    unregister();
    const versionAfterUnregister = require('../registry').getRegistryVersion();

    expect(versionAfterUnregister).toBeGreaterThan(versionAfterRegister);
  });
});
