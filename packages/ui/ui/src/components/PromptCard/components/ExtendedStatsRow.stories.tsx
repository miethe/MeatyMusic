import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExtendedStatsRow } from './ExtendedStatsRow';

const meta: Meta<typeof ExtendedStatsRow> = {
  title: 'Components/PromptCard/ExtendedStatsRow',
  component: ExtendedStatsRow,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Extended statistics row component for the PromptCard XL variant. Displays performance metrics with inline sparkline trends.

**Features:**
- Success rate with trend visualization
- P50 latency with sparkline chart
- Token usage tracking with trends
- Cost analysis with visual trends
- P95 latency display
- Responsive grid layout (2-col mobile, 4-col desktop)
- Uses SuccessSparkline component for trend visualization

**Usage in PromptCard XL:**
This component is designed to be used in the XL variant of PromptCard to show detailed performance analytics inline with other card content.
        `,
      },
    },
  },
  argTypes: {
    successRateData: {
      control: { type: 'object' },
      description: '7-day success rate trend data (0-1)',
    },
    successRate: {
      control: { type: 'number', min: 0, max: 1, step: 0.01 },
      description: 'Current success rate (0-1)',
    },
    p50Latency: {
      control: { type: 'number', min: 0 },
      description: 'P50 latency in milliseconds',
    },
    p95Latency: {
      control: { type: 'number', min: 0 },
      description: 'P95 latency in milliseconds',
    },
    avgTokens: {
      control: { type: 'number', min: 0 },
      description: 'Average token usage',
    },
    avgCost: {
      control: { type: 'number', min: 0, step: 0.01 },
      description: 'Average cost per run in USD',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExtendedStatsRow>;

// Sample data generators
const generateSuccessData = () => [0.82, 0.85, 0.80, 0.88, 0.90, 0.87, 0.89];
const generateLatencyData = () => [1200, 1100, 1300, 1150, 1000, 1080, 1050]; // ms
const generateTokenData = () => [1500, 1800, 1600, 2000, 1700, 1900, 1650]; // tokens
const generateCostData = () => [0.03, 0.04, 0.035, 0.045, 0.038, 0.042, 0.037]; // USD

export const Default: Story = {
  args: {
    successRateData: generateSuccessData(),
    successRate: 0.89,
    p50Latency: 1050,
    p95Latency: 2100,
    p50LatencyData: generateLatencyData(),
    tokenUsageData: generateTokenData(),
    avgTokens: 1650,
    costData: generateCostData(),
    avgCost: 0.037,
  },
};

export const HighPerformance: Story = {
  args: {
    successRateData: [0.95, 0.96, 0.97, 0.98, 0.97, 0.98, 0.99],
    successRate: 0.99,
    p50Latency: 850,
    p95Latency: 1200,
    p50LatencyData: [900, 850, 880, 820, 840, 860, 850],
    tokenUsageData: [1200, 1100, 1250, 1180, 1220, 1190, 1210],
    avgTokens: 1210,
    costData: [0.02, 0.019, 0.021, 0.020, 0.022, 0.020, 0.021],
    avgCost: 0.021,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a high-performance prompt with excellent success rates and low latency.',
      },
    },
  },
};

export const DegradedPerformance: Story = {
  args: {
    successRateData: [0.75, 0.70, 0.68, 0.65, 0.62, 0.58, 0.55],
    successRate: 0.55,
    p50Latency: 2800,
    p95Latency: 5200,
    p50LatencyData: [2200, 2400, 2600, 2800, 3000, 2900, 2800],
    tokenUsageData: [3200, 3500, 3800, 4000, 3900, 4200, 4100],
    avgTokens: 4100,
    costData: [0.08, 0.09, 0.095, 0.10, 0.098, 0.105, 0.102],
    avgCost: 0.102,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a prompt with degraded performance - declining success rate and higher costs.',
      },
    },
  },
};

export const RecoveringPerformance: Story = {
  args: {
    successRateData: [0.45, 0.50, 0.60, 0.70, 0.78, 0.82, 0.85],
    successRate: 0.85,
    p50Latency: 1100,
    p95Latency: 1850,
    p50LatencyData: [2000, 1800, 1600, 1400, 1300, 1200, 1100],
    tokenUsageData: [2800, 2600, 2400, 2200, 2000, 1900, 1800],
    avgTokens: 1800,
    costData: [0.07, 0.065, 0.06, 0.055, 0.05, 0.048, 0.045],
    avgCost: 0.045,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a prompt recovering from poor performance with improving trends across all metrics.',
      },
    },
  },
};

export const PartialData: Story = {
  args: {
    successRateData: generateSuccessData(),
    successRate: 0.89,
    // Only success rate data, no latency or cost data
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component with only partial data - just success rate information.',
      },
    },
  },
};

export const CostFocused: Story = {
  args: {
    costData: [0.15, 0.18, 0.22, 0.19, 0.16, 0.14, 0.13],
    avgCost: 0.13,
    tokenUsageData: [5000, 5200, 5800, 5400, 4800, 4600, 4400],
    avgTokens: 4400,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component focused on cost and token usage metrics.',
      },
    },
  },
};

export const LatencyFocused: Story = {
  args: {
    p50Latency: 950,
    p95Latency: 1680,
    p50LatencyData: [1100, 1050, 1000, 980, 960, 950, 950],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component focused on latency performance metrics.',
      },
    },
  },
};

// Realistic usage in card context
export const InCardContext: Story = {
  render: (args) => (
    <div className="max-w-2xl p-6 bg-white border rounded-lg shadow-sm">
      {/* Mock card header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">GPT-4 Turbo Creative Assistant</h3>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">v2.1</span>
        </div>
        <p className="text-sm text-gray-600">Advanced creative writing and brainstorming prompt</p>
      </div>

      {/* Mock basic stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Runs</span>
          <div className="font-medium">1,247</div>
        </div>
        <div>
          <span className="text-gray-600">Model</span>
          <div className="font-medium">GPT-4</div>
        </div>
        <div>
          <span className="text-gray-600">Last Run</span>
          <div className="font-medium">2m ago</div>
        </div>
      </div>

      {/* Extended stats */}
      <div className="border-t pt-4">
        <ExtendedStatsRow {...args} />
      </div>
    </div>
  ),
  args: {
    successRateData: generateSuccessData(),
    successRate: 0.89,
    p50Latency: 1050,
    p95Latency: 2100,
    p50LatencyData: generateLatencyData(),
    tokenUsageData: generateTokenData(),
    avgTokens: 1650,
    costData: generateCostData(),
    avgCost: 0.037,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how ExtendedStatsRow would appear within a complete PromptCard context.',
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="text-sm font-medium">Mobile (2 columns)</div>
      <div className="w-80">
        <ExtendedStatsRow {...args} />
      </div>

      <div className="text-sm font-medium">Desktop (4 columns)</div>
      <div className="w-full max-w-2xl">
        <ExtendedStatsRow {...args} />
      </div>
    </div>
  ),
  args: {
    successRateData: generateSuccessData(),
    successRate: 0.89,
    p50Latency: 1050,
    p50LatencyData: generateLatencyData(),
    tokenUsageData: generateTokenData(),
    avgTokens: 1650,
    costData: generateCostData(),
    avgCost: 0.037,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the responsive behavior of the component across different screen sizes.',
      },
    },
  },
};
