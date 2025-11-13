import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparklineComplication, SuccessRateSparkline, LatencySparkline, CostSparkline, UsageSparkline } from './SparklineComplication';
import type { ComplicationProps } from '../types';

const meta = {
  title: 'Components/PromptCard/Complications/SparklineComplication',
  component: SparklineComplication,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A mini chart complication that displays trend data as a simple line chart. Perfect for showing performance metrics over time in a compact format. Supports different variants, fill areas, and responsive sizing.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: { type: 'object' },
      description: 'Array of data points for the sparkline',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'error', 'info'],
      description: 'Color variant for the line',
    },
    width: {
      control: { type: 'number', min: 16, max: 120 },
      description: 'Width of the sparkline in pixels',
    },
    height: {
      control: { type: 'number', min: 8, max: 60 },
      description: 'Height of the sparkline in pixels',
    },
    fill: {
      control: { type: 'boolean' },
      description: 'Whether to show fill area under the line',
    },
    strokeWidth: {
      control: { type: 'number', min: 0.5, max: 3 },
      description: 'Stroke width of the line',
    },
    label: {
      control: { type: 'text' },
      description: 'Optional label text',
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
} satisfies Meta<typeof SparklineComplication>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock complication props
const mockComplicationProps: Omit<ComplicationProps, keyof typeof SparklineComplication> = {
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

// Sample data sets
const trendingUp = [0.65, 0.7, 0.68, 0.75, 0.8, 0.85, 0.9];
const trendingDown = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];
const volatile = [0.7, 0.9, 0.6, 0.8, 0.5, 0.85, 0.75];
const stable = [0.8, 0.81, 0.79, 0.8, 0.82, 0.81, 0.8];
const latencyData = [2100, 1950, 1800, 1750, 1850, 1900, 1850];
const costData = [0.008, 0.009, 0.012, 0.010, 0.011, 0.008, 0.012];

export const Default: Story = {
  args: {
    ...mockComplicationProps,
    data: trendingUp,
    variant: 'default',
    label: 'Trend',
  },
};

export const WithFill: Story = {
  args: {
    ...mockComplicationProps,
    data: trendingUp,
    variant: 'success',
    fill: true,
    label: 'Success',
  },
};

export const SmallSize: Story = {
  args: {
    ...mockComplicationProps,
    data: trendingUp,
    variant: 'info',
    width: 24,
    height: 12,
    strokeWidth: 1,
    cardSize: 'compact',
  },
};

export const LargeSize: Story = {
  args: {
    ...mockComplicationProps,
    data: volatile,
    variant: 'warning',
    width: 80,
    height: 40,
    fill: true,
    strokeWidth: 2,
    cardSize: 'xl',
    slot: 'footer',
  },
};

// ============================================================================
// VARIANT DEMONSTRATIONS
// ============================================================================

export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px' }}>
      {(['default', 'success', 'warning', 'error', 'info'] as const).map(variant => (
        <div key={variant} style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'capitalize' }}>{variant}</h4>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              data={trendingUp}
              variant={variant}
              label={variant.charAt(0).toUpperCase() + variant.slice(1)}
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all available color variants: default, success, warning, error, and info.',
      },
    },
  },
};

export const TrendPatterns = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Trending Up</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SparklineComplication
            {...mockComplicationProps}
            data={trendingUp}
            variant="success"
            fill={true}
            label="📈"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Trending Down</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SparklineComplication
            {...mockComplicationProps}
            data={trendingDown}
            variant="error"
            fill={true}
            label="📉"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Volatile</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SparklineComplication
            {...mockComplicationProps}
            data={volatile}
            variant="warning"
            strokeWidth={1.5}
            label="⚡"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Stable</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SparklineComplication
            {...mockComplicationProps}
            data={stable}
            variant="info"
            fill={true}
            label="📊"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates different trend patterns: trending up, trending down, volatile, and stable data.',
      },
    },
  },
};

// ============================================================================
// PRESET SPARKLINES
// ============================================================================

export const PresetSparklines = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Success Rate</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SuccessRateSparkline
            {...mockComplicationProps}
            data={trendingUp}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Latency</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <LatencySparkline
            {...mockComplicationProps}
            data={latencyData}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Cost</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <CostSparkline
            {...mockComplicationProps}
            data={costData}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Usage</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <UsageSparkline
            {...mockComplicationProps}
            data={[10, 25, 30, 28, 35, 42, 38]}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows preset sparkline complications: SuccessRateSparkline, LatencySparkline, CostSparkline, and UsageSparkline.',
      },
    },
  },
};

// ============================================================================
// SIZE RESPONSIVENESS
// ============================================================================

export const SizeResponsiveness = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Compact Card Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              cardSize="compact"
              data={trendingUp}
              variant="success"
              fill={true}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Standard Card Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              cardSize="standard"
              data={trendingUp}
              variant="success"
              fill={true}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>XL Card Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              cardSize="xl"
              data={trendingUp}
              variant="success"
              fill={true}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Corner Slot</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              slot="topRight"
              data={volatile}
              variant="warning"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Edge Slot</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              slot="edgeRight"
              data={stable}
              variant="info"
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how sparklines adapt to different card sizes and slot positions with appropriate scaling.',
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
          <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>{state} State</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              cardState={state}
              data={trendingUp}
              variant="success"
              fill={true}
              label="Trend"
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how sparklines respond to different card states with opacity changes and visibility rules.',
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
          <li>ARIA labels describe trend direction and data point count</li>
          <li>Role="img" for screen reader compatibility</li>
          <li>Tooltip with descriptive text on hover</li>
          <li>High contrast mode support</li>
          <li>Respects reduced motion preferences</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Increasing Trend</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              data={trendingUp}
              variant="success"
              label="Success Rate"
              fill={true}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Announced as "Success Rate showing increasing trend with 7 data points"
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Stable Trend</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <SparklineComplication
              {...mockComplicationProps}
              data={stable}
              variant="info"
              label="Latency"
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Announced as "Latency showing stable trend with 7 data points"
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including ARIA labels, semantic markup, and assistive technology support.',
      },
    },
  },
};
