import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricComplication, SuccessRateMetric, LatencyMetric, CostMetric, UsageMetric, ErrorCountMetric } from './MetricComplication';
import type { ComplicationProps } from '../types';

const meta = {
  title: 'Components/PromptCard/Complications/MetricComplication',
  component: MetricComplication,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A numeric metric display complication that shows values with optional labels, units, trend arrows, and formatting. Perfect for displaying KPIs and statistics with responsive sizing and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number' },
      description: 'The numeric value to display',
    },
    label: {
      control: { type: 'text' },
      description: 'Optional label for the metric',
    },
    unit: {
      control: { type: 'text' },
      description: 'Unit suffix (e.g., "%", "ms", "$")',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'error', 'info', 'muted'],
      description: 'Color variant',
    },
    trend: {
      control: { type: 'select' },
      options: ['up', 'down', 'neutral', 'none'],
      description: 'Trend direction with arrow indicator',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    precision: {
      control: { type: 'number', min: 0, max: 4 },
      description: 'Number of decimal places to show',
    },
    compact: {
      control: { type: 'boolean' },
      description: 'Whether to format large numbers (1K, 1M, etc.)',
    },
    icon: {
      control: { type: 'text' },
      description: 'Optional icon (emoji or short text)',
    },
    cardSize: {
      control: { type: 'select' },
      options: ['compact', 'standard', 'xl'],
    },
    cardState: {
      control: { type: 'select' },
      options: ['default', 'running', 'error', 'disabled', 'selected'],
    },
    slot: {
      control: { type: 'select' },
      options: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'edgeLeft', 'edgeRight', 'footer'],
    },
  },
} satisfies Meta<typeof MetricComplication>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock complication props
const mockComplicationProps: Omit<ComplicationProps, keyof typeof MetricComplication> = {
  cardId: 'demo-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Demo Card',
  isFocused: false,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
  slot: 'topRight',
  isVisible: true,
};

export const Default: Story = {
  args: {
    ...mockComplicationProps,
    value: 42,
    label: 'Metric',
    unit: '%',
    variant: 'default',
  },
};

export const WithTrend: Story = {
  args: {
    ...mockComplicationProps,
    value: 94.5,
    label: 'Success Rate',
    unit: '%',
    variant: 'success',
    trend: 'up',
    precision: 1,
  },
};

export const LargeNumber: Story = {
  args: {
    ...mockComplicationProps,
    value: 1247892,
    label: 'Total Runs',
    variant: 'info',
    compact: true,
  },
};

export const WithIcon: Story = {
  args: {
    ...mockComplicationProps,
    value: 1850,
    label: 'Latency',
    unit: 'ms',
    variant: 'warning',
    icon: '⏱',
    trend: 'down',
  },
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '20px' }}>
      {([
        { variant: 'default', description: 'Default styling' },
        { variant: 'success', description: 'Positive metrics' },
        { variant: 'warning', description: 'Attention needed' },
        { variant: 'error', description: 'Problem indicators' },
        { variant: 'info', description: 'Informational' },
        { variant: 'muted', description: 'Secondary metrics' },
      ] as const).map(({ variant, description }) => (
        <div key={variant} style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', textTransform: 'capitalize' }}>{variant}</h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--mp-color-text-muted)' }}>
            {description}
          </p>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={89.5}
              label="Metric"
              unit="%"
              variant={variant}
              precision={1}
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all available color variants: default, success, warning, error, info, and muted.',
      },
    },
  },
};

// ============================================================================
// TREND INDICATORS
// ============================================================================

export const TrendIndicators = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Trending Up</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={94.2}
            label="Success Rate"
            unit="%"
            variant="success"
            trend="up"
            precision={1}
            icon="✅"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Trending Down</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={2150}
            label="Latency"
            unit="ms"
            variant="error"
            trend="down"
            compact={false}
            icon="⚠"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Neutral Trend</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={0.025}
            label="Cost"
            unit="$"
            variant="info"
            trend="neutral"
            precision={3}
            icon="💰"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>No Trend</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={1247}
            label="Runs"
            variant="default"
            trend="none"
            compact={true}
            icon="📊"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates trend indicators with arrows showing up, down, neutral, and no trend states.',
      },
    },
  },
};

// ============================================================================
// PRESET METRICS
// ============================================================================

export const PresetMetrics = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>SuccessRateMetric</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SuccessRateMetric {...mockComplicationProps} value={94} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>LatencyMetric</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <LatencyMetric {...mockComplicationProps} value={1850} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>CostMetric</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <CostMetric {...mockComplicationProps} value={0.028} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>UsageMetric</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <UsageMetric {...mockComplicationProps} value={1247} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ErrorCountMetric</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <ErrorCountMetric {...mockComplicationProps} value={3} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows preset metric complications with predefined formatting, colors, and icons.',
      },
    },
  },
};

// ============================================================================
// SIZE VARIATIONS
// ============================================================================

export const SizeVariations = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Small Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={89.5}
              label="Success"
              unit="%"
              variant="success"
              size="sm"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Medium Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={89.5}
              label="Success"
              unit="%"
              variant="success"
              size="md"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Large Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={89.5}
              label="Success"
              unit="%"
              variant="success"
              size="lg"
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Compact Card</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              cardSize="compact"
              value={1247}
              label="Runs"
              variant="info"
              compact={true}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Standard Card</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              cardSize="standard"
              value={1247}
              label="Runs"
              variant="info"
              compact={true}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>XL Card</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              cardSize="xl"
              value={1247}
              label="Runs"
              variant="info"
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates size variations and how metrics adapt to different card sizes with automatic size adjustments.',
      },
    },
  },
};

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

export const NumberFormatting = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Large Numbers (Compact)</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={1247}
              label="1.2K"
              compact={true}
            />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={1247892}
              label="1.2M"
              compact={true}
            />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={15400000}
              label="15.4M"
              compact={true}
            />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Precision Control</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={89}
              unit="%"
              precision={0}
              label="89%"
            />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={89.5}
              unit="%"
              precision={1}
              label="89.5%"
            />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={89.567}
              unit="%"
              precision={2}
              label="89.57%"
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows different number formatting options including compact notation (K, M) and precision control.',
      },
    },
  },
};

// ============================================================================
// SLOT POSITIONING
// ============================================================================

export const SlotPositioning = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Corner Slots</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              slot="topRight"
              value={94.2}
              label="Success"
              unit="%"
              variant="success"
              trend="up"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Edge Slots (Compact Layout)</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              slot="edgeRight"
              value={1850}
              label="Latency"
              unit="ms"
              variant="warning"
            />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 15px 0' }}>Footer Slot (Row Layout)</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            slot="footer"
            value={99.98}
            label="System Uptime"
            unit="%"
            variant="success"
            trend="up"
            precision={2}
            size="md"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how metrics adapt to different slot positions with automatic layout adjustments.',
      },
    },
  },
};

// ============================================================================
// CUSTOM FORMATTERS
// ============================================================================

export const CustomFormatters = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Currency Formatter</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={0.028}
            label="Cost"
            variant="warning"
            formatter={(val) => `$${(val * 100).toFixed(1)}¢`}
            icon="💰"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Time Formatter</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={125}
            label="Duration"
            variant="info"
            formatter={(val) => `${Math.floor(val / 60)}m ${val % 60}s`}
            icon="⏱"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Percentage with Sign</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={15.7}
            label="Change"
            variant="success"
            formatter={(val) => `+${val.toFixed(1)}%`}
            trend="up"
            icon="📈"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>File Size Formatter</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <MetricComplication
            {...mockComplicationProps}
            value={2048576}
            label="Memory"
            variant="muted"
            formatter={(val) => {
              if (val >= 1024 * 1024) return `${(val / (1024 * 1024)).toFixed(1)}MB`;
              if (val >= 1024) return `${(val / 1024).toFixed(1)}KB`;
              return `${val}B`;
            }}
            icon="💾"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates custom formatting functions for currency, time, percentages, and file sizes.',
      },
    },
  },
};

// ============================================================================
// CARD STATE RESPONSES
// ============================================================================

export const CardStateResponses = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      {(['default', 'running', 'error', 'selected'] as const).map(state => (
        <div key={state} style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>{state} Card State</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              cardState={state}
              value={94.2}
              label="Success"
              unit="%"
              variant="success"
              trend="up"
              icon="✅"
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how metrics respond to different card states with opacity changes.',
      },
    },
  },
};

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const Accessibility = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Accessibility Features</h3>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: 'var(--mp-color-text-muted)' }}>
          <li>ARIA role="status" for metric announcements</li>
          <li>Descriptive aria-label combining value, unit, label, and trend</li>
          <li>Tooltip with full metric description</li>
          <li>Semantic markup with proper heading structure</li>
          <li>High contrast mode support</li>
          <li>Screen reader friendly number formatting</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Complete Metric Description</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={94.2}
              label="Success Rate"
              unit="%"
              variant="success"
              trend="up"
              precision={1}
              icon="✅"
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Announced as "Success Rate 94.2% trending up"
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Large Number Reading</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <MetricComplication
              {...mockComplicationProps}
              value={1247892}
              label="Total Runs"
              variant="info"
              compact={true}
              icon="📊"
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Displays "1.2M" but announces full number for screen readers
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including ARIA attributes, semantic markup, and screen reader support.',
      },
    },
  },
};
