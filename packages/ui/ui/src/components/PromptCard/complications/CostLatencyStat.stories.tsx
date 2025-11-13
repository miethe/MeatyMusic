import type { Meta, StoryObj } from '@storybook/react-vite';
import { CostLatencyStat } from './CostLatencyStat';
import type { CostLatencyStatProps } from './CostLatencyStat';

const meta: Meta<typeof CostLatencyStat> = {
  title: 'PromptCard/Complications/CostLatencyStat',
  component: CostLatencyStat,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A compact complication for displaying cost and latency metrics with detailed tooltips.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    cost: {
      description: 'Cost data with average, min, max values in cents',
      control: 'object',
    },
    latency: {
      description: 'Latency data with percentiles in milliseconds',
      control: 'object',
    },
    primaryMetric: {
      description: 'Which metric to show in compact mode',
      options: ['cost', 'latency'],
      control: { type: 'select' },
    },
    size: {
      description: 'Size variant of the component',
      options: ['compact', 'standard'],
      control: { type: 'select' },
    },
    cardSize: {
      description: 'Parent card size that affects default sizing',
      options: ['compact', 'standard', 'xl'],
      control: { type: 'select' },
    },
    slot: {
      description: 'Slot position in the PromptCard',
      options: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'edgeLeft', 'edgeRight', 'footer'],
      control: { type: 'select' },
    },
    isVisible: {
      description: 'Controls visibility of the complication',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock complication props that would normally come from context
const baseProps: Partial<CostLatencyStatProps> = {
  cardId: 'story-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Sample Prompt',
  isFocused: false,
  isVisible: true,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
  slot: 'bottomLeft',
};

export const Default: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 234,
      min: 180,
      max: 450,
      currency: 'USD',
    },
    latency: {
      p50: 1250,
      p95: 2100,
      p99: 3500,
      samples: 1523,
    },
  },
};

export const CostOnly: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 567,
      min: 234,
      max: 890,
      currency: 'USD',
    },
  },
};

export const LatencyOnly: Story = {
  args: {
    ...baseProps,
    latency: {
      p50: 750,
      p95: 1200,
      samples: 100,
    },
  },
};

export const CompactMode: Story = {
  args: {
    ...baseProps,
    cardSize: 'compact',
    primaryMetric: 'cost',
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
  },
  parameters: {
    docs: {
      description: {
        story: 'In compact mode, only the primary metric is shown.',
      },
    },
  },
};

export const LowCostEdgeCase: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 0.09,
      min: 0.05,
      max: 0.15,
      currency: 'USD',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'When cost is less than $0.001, it displays as "<$0.001".',
      },
    },
  },
};

export const HighLatency: Story = {
  args: {
    ...baseProps,
    latency: {
      p50: 5234,
      p95: 8900,
      p99: 12500,
      samples: 450,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Latency greater than 1000ms is displayed in seconds.',
      },
    },
  },
};

export const EuroCurrency: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 345,
      min: 200,
      max: 500,
      currency: 'EUR',
    },
    latency: {
      p50: 890,
      p95: 1567,
      samples: 250,
    },
  },
};

export const BritishPoundCurrency: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 289,
      min: 150,
      max: 400,
      currency: 'GBP',
    },
    latency: {
      p50: 670,
      p95: 1234,
      samples: 180,
    },
  },
};

export const NoP99Data: Story = {
  args: {
    ...baseProps,
    latency: {
      p50: 450,
      p95: 890,
      samples: 75,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'P99 is optional and the component handles its absence gracefully.',
      },
    },
  },
};

export const LargeSampleCount: Story = {
  args: {
    ...baseProps,
    latency: {
      p50: 234,
      p95: 567,
      p99: 890,
      samples: 1523456,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Large sample counts are formatted with proper number localization.',
      },
    },
  },
};

export const StandardSize: Story = {
  args: {
    ...baseProps,
    size: 'standard',
    cost: {
      avg: 456,
      min: 234,
      max: 678,
      currency: 'USD',
    },
    latency: {
      p50: 345,
      p95: 789,
      samples: 200,
    },
  },
};

export const CompactSize: Story = {
  args: {
    ...baseProps,
    size: 'compact',
    primaryMetric: 'latency',
    cost: {
      avg: 123,
      min: 90,
      max: 180,
      currency: 'USD',
    },
    latency: {
      p50: 234,
      p95: 456,
      samples: 150,
    },
  },
};

export const EdgeSlotPlacement: Story = {
  args: {
    ...baseProps,
    slot: 'edgeLeft',
    cost: {
      avg: 345,
      min: 200,
      max: 500,
      currency: 'USD',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Component adapted for edge slot placement.',
      },
    },
  },
};

export const FooterSlotPlacement: Story = {
  args: {
    ...baseProps,
    slot: 'footer',
    cost: {
      avg: 678,
      min: 456,
      max: 890,
      currency: 'USD',
    },
    latency: {
      p50: 567,
      p95: 890,
      samples: 300,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Component adapted for footer slot placement.',
      },
    },
  },
};

export const ZeroCost: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 0,
      min: 0,
      max: 0,
      currency: 'USD',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Zero cost displays as "<$0.001".',
      },
    },
  },
};

export const MixedMetrics: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 15,
      min: 5,
      max: 25,
      currency: 'USD',
    },
    latency: {
      p50: 50,
      p95: 150,
      samples: 50,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Very low cost and latency values.',
      },
    },
  },
};

export const HighPerformance: Story = {
  args: {
    ...baseProps,
    cost: {
      avg: 1234,
      min: 890,
      max: 1567,
      currency: 'USD',
    },
    latency: {
      p50: 12,
      p95: 25,
      p99: 45,
      samples: 10000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'High cost but very low latency - typical for powerful models.',
      },
    },
  },
};

export const CustomAriaLabel: Story = {
  args: {
    ...baseProps,
    'aria-label': 'Custom performance metrics for GPT-4 model',
    cost: {
      avg: 789,
      min: 567,
      max: 1012,
      currency: 'USD',
    },
    latency: {
      p50: 2345,
      p95: 3456,
      samples: 750,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom ARIA label for accessibility.',
      },
    },
  },
};
