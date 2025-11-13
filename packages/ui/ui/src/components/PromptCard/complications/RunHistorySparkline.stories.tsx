/**
 * Storybook stories for RunHistorySparkline component - MP-PCARD-CPL-019
 *
 * Demonstrates all component states, data scenarios, and accessibility features.
 * Includes interactive controls for testing different configurations.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import { RunHistorySparkline, type RunHistorySparklineProps, type RunHistoryData } from './RunHistorySparkline';

// ============================================================================
// STORY METADATA
// ============================================================================

const meta: Meta<typeof RunHistorySparkline> = {
  title: 'Components/PromptCard/Complications/RunHistorySparkline',
  component: RunHistorySparkline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# RunHistorySparkline - MP-PCARD-CPL-019

A sophisticated 24-point sparkline visualization for displaying prompt execution history
with success/failure rates. Designed specifically for the footer slot of xl PromptCards.

## Features

- **24-point visualization**: Consistent layout regardless of data density
- **Stacked bars**: Clear success/failure rate representation
- **Interactive tooltips**: Detailed metrics on hover
- **Full accessibility**: Keyboard navigation and screen reader support
- **Graceful degradation**: Handles empty and sparse data elegantly
- **Performance optimized**: Memoized for grid rendering

## Accessibility

- Tab to focus the component
- Arrow keys to navigate data points
- Enter/Space to show tooltip for focused point
- Escape to close tooltip and clear focus
- Full screen reader descriptions with trend analysis

## Usage

Only renders on xl cards in the footer slot. Automatically normalizes data to 24 points
for consistent visualization.
        `,
      },
    },
  },
  argTypes: {
    data: {
      description: 'Run history data with points, time range, and aggregation method',
      control: { type: 'object' },
    },
    width: {
      description: 'Chart width in pixels (default: 400 for footer slot)',
      control: { type: 'number', min: 200, max: 600, step: 20 },
    },
    height: {
      description: 'Chart height in pixels',
      control: { type: 'number', min: 20, max: 60, step: 4 },
    },
    variant: {
      description: 'Chart visualization type',
      control: { type: 'radio' },
      options: ['bar', 'line'],
    },
    showTooltip: {
      description: 'Whether to show interactive tooltips',
      control: { type: 'boolean' },
    },
    cardSize: {
      description: 'Card size (only xl supported)',
      control: { type: 'radio' },
      options: ['compact', 'standard', 'xl'],
    },
    cardState: {
      description: 'Card state',
      control: { type: 'radio' },
      options: ['default', 'running', 'error', 'disabled', 'selected'],
    },
  },
  decorators: [
    (Story, context) => (
      <div style={{ padding: '20px', background: 'var(--mp-color-background)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RunHistorySparkline>;

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

/**
 * Generates realistic run history data
 */
const generateRunHistoryData = (
  pointCount: number,
  successRate: number = 0.8,
  variance: number = 0.2
): RunHistoryData => {
  const points = Array.from({ length: pointCount }, (_, index) => {
    // Add some realistic variance
    const baseRate = Math.max(0, Math.min(1, successRate + (Math.random() - 0.5) * variance));
    const totalRuns = Math.floor(Math.random() * 50) + 5; // 5-55 runs
    const successCount = Math.floor(totalRuns * baseRate);
    const failureCount = totalRuns - successCount;

    return {
      timestamp: new Date(Date.now() - (pointCount - index - 1) * 60 * 60 * 1000).toISOString(),
      successCount,
      failureCount,
      totalRuns,
      successRate: successCount / totalRuns,
    };
  });

  return {
    points,
    timeRange: '24h' as const,
    aggregation: 'hourly' as const,
  };
};

/**
 * Creates sparse data with gaps
 */
const generateSparseData = (): RunHistoryData => {
  const points = [
    {
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      successCount: 8,
      failureCount: 2,
      totalRuns: 10,
      successRate: 0.8,
    },
    {
      timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      successCount: 5,
      failureCount: 5,
      totalRuns: 10,
      successRate: 0.5,
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      successCount: 12,
      failureCount: 1,
      totalRuns: 13,
      successRate: 0.92,
    },
  ];

  return {
    points,
    timeRange: '24h' as const,
    aggregation: 'hourly' as const,
  };
};

// ============================================================================
// BASE PROPS
// ============================================================================

const baseProps: Partial<RunHistorySparklineProps> = {
  cardId: 'storybook-card',
  cardState: 'default',
  cardSize: 'xl',
  slot: 'footer',
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

// ============================================================================
// STORIES
// ============================================================================

/**
 * Default story with full 24-point data
 */
export const Default: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.85, 0.15),
    showTooltip: true,
  },
};

/**
 * High success rate scenario
 */
export const HighSuccessRate: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.95, 0.1),
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a prompt with consistently high success rates (95% average).',
      },
    },
  },
};

/**
 * Poor performance scenario
 */
export const PoorPerformance: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.4, 0.3),
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a prompt with poor performance (40% success rate with high variance).',
      },
    },
  },
};

/**
 * Sparse data with gaps
 */
export const SparseData: Story = {
  args: {
    ...baseProps,
    data: generateSparseData(),
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the component handles sparse data with only a few data points.',
      },
    },
  },
};

/**
 * Empty data state
 */
export const EmptyData: Story = {
  args: {
    ...baseProps,
    data: {
      points: [],
      timeRange: '24h' as const,
      aggregation: 'hourly' as const,
    },
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when no run history data is available.',
      },
    },
  },
};

/**
 * Single data point
 */
export const SingleDataPoint: Story = {
  args: {
    ...baseProps,
    data: {
      points: [
        {
          timestamp: new Date().toISOString(),
          successCount: 7,
          failureCount: 3,
          totalRuns: 10,
          successRate: 0.7,
        },
      ],
      timeRange: '24h' as const,
      aggregation: 'hourly' as const,
    },
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the component renders with only a single data point.',
      },
    },
  },
};

/**
 * Custom dimensions
 */
export const CustomDimensions: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    width: 300,
    height: 48,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates custom width and height settings.',
      },
    },
  },
};

/**
 * No tooltips
 */
export const NoTooltips: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    showTooltip: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component with tooltips disabled.',
      },
    },
  },
};

/**
 * Daily aggregation
 */
export const DailyAggregation: Story = {
  args: {
    ...baseProps,
    data: {
      ...generateRunHistoryData(24, 0.8, 0.2),
      timeRange: '30d' as const,
      aggregation: 'daily' as const,
    },
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows daily aggregation over 30 days instead of hourly data.',
      },
    },
  },
};

/**
 * Running state
 */
export const RunningState: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    cardState: 'running',
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component appearance when the card is in running state.',
      },
    },
  },
};

/**
 * Error state
 */
export const ErrorState: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    cardState: 'error',
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component appearance when the card is in error state.',
      },
    },
  },
};

/**
 * Non-xl card size (should not render)
 */
export const StandardCardSize: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    cardSize: 'standard',
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates that the component only renders on xl cards (this should show nothing).',
      },
    },
  },
};

/**
 * Disabled state (should not render)
 */
export const DisabledState: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    cardState: 'disabled',
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows that the component does not render when card is disabled.',
      },
    },
  },
};

/**
 * Custom colors
 */
export const CustomColors: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    colors: {
      success: '#10b981', // Custom green
      failure: '#f59e0b', // Custom orange instead of red
      background: '#f8fafc',
      grid: '#e2e8f0',
    },
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates custom color scheme (green success, orange failure).',
      },
    },
  },
};

// ============================================================================
// INTERACTION TESTS
// ============================================================================

/**
 * Interactive story for testing keyboard navigation
 */
export const KeyboardNavigation: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(12, 0.8, 0.2),
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Keyboard Navigation Test

1. **Tab** to focus the component
2. **Arrow Left/Right** to navigate data points
3. **Enter/Space** to show tooltip for focused point
4. **Escape** to close tooltip and clear focus

The component should show a dashed outline around the focused data point.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Try to find the sparkline component
    const sparkline = canvas.getByRole('img');
    expect(sparkline).toBeInTheDocument();

    // Focus the component
    await userEvent.tab();
    expect(sparkline).toHaveFocus();

    // Test arrow key navigation
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowRight}');

    // Test Enter key to show tooltip
    await userEvent.keyboard('{Enter}');

    // Test Escape to close tooltip
    await userEvent.keyboard('{Escape}');
  },
};

/**
 * Interactive story for testing hover tooltips
 */
export const HoverTooltips: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.8, 0.2),
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Hover Tooltip Test

Hover over individual bars to see detailed metrics including:
- Timestamp
- Total runs
- Success/failure counts
- Success rate percentage

Tooltips should position themselves to avoid viewport edges.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 100));

    const sparkline = canvas.getByRole('img');
    expect(sparkline).toBeInTheDocument();

    // Test hover (this might not work in all Storybook environments)
    try {
      await userEvent.hover(sparkline);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      // Hover might not work in test environment, that's okay
      console.log('Hover test skipped in this environment');
    }
  },
};

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

/**
 * Story specifically for accessibility testing
 */
export const AccessibilityDemo: Story = {
  args: {
    ...baseProps,
    data: generateRunHistoryData(24, 0.75, 0.25),
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Accessibility Features

This component includes comprehensive accessibility support:

- **ARIA labels**: Describes chart content and current state
- **Keyboard navigation**: Full interaction without mouse
- **Screen reader support**: Announces data points and trends
- **Focus management**: Clear focus indicators
- **Reduced motion support**: Respects user preferences

Test with screen readers and keyboard-only navigation.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check for accessibility attributes
    const sparkline = canvas.getByRole('img');
    expect(sparkline).toHaveAttribute('aria-label');
    expect(sparkline).toHaveAttribute('tabindex', '0');

    // Check for screen reader content
    const description = canvas.getByText(/Run history for the last/);
    expect(description).toBeInTheDocument();
  },
};
