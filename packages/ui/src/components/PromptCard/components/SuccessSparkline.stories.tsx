import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuccessSparkline } from './SuccessSparkline';

const meta: Meta<typeof SuccessSparkline> = {
  title: 'Components/PromptCard/SuccessSparkline',
  component: SuccessSparkline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A lightweight SVG-based sparkline chart component for displaying success rate trends inline.

**Features:**
- Displays 7-day success rate trends as mini charts
- Responsive sizing (default 60×24px)
- Accessible with ARIA descriptions and trend analysis
- Handles edge cases (empty data, single points, flat trends)
- Uses design tokens for consistent styling
- Performance optimized with React.memo
- Supports reduced motion preferences

**Accessibility:**
- Uses \`role="img"\` with descriptive aria-label
- Provides trend analysis (increasing/decreasing/stable)
- Screen reader friendly data descriptions
- High contrast support via CSS custom properties
        `,
      },
    },
  },
  argTypes: {
    data: {
      control: { type: 'object' },
      description: 'Array of success rates (0-1) representing trend data',
    },
    width: {
      control: { type: 'number', min: 20, max: 200 },
      description: 'Width of the sparkline in pixels',
    },
    height: {
      control: { type: 'number', min: 16, max: 80 },
      description: 'Height of the sparkline in pixels',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS class names',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SuccessSparkline>;

// Sample data generators for realistic scenarios
const generateTrendingUp = () => [0.65, 0.70, 0.68, 0.75, 0.82, 0.85, 0.88];
const generateTrendingDown = () => [0.88, 0.85, 0.80, 0.75, 0.70, 0.68, 0.65];
const generateVolatile = () => [0.75, 0.60, 0.85, 0.55, 0.90, 0.70, 0.80];
const generateStable = () => [0.80, 0.82, 0.79, 0.81, 0.80, 0.83, 0.80];
const generateRecovering = () => [0.45, 0.40, 0.50, 0.60, 0.70, 0.80, 0.85];

export const Default: Story = {
  args: {
    data: generateTrendingUp(),
  },
};

export const TrendingUp: Story = {
  args: {
    data: generateTrendingUp(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows an increasing success rate trend over time.',
      },
    },
  },
};

export const TrendingDown: Story = {
  args: {
    data: generateTrendingDown(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a decreasing success rate trend over time.',
      },
    },
  },
};

export const VolatileTrend: Story = {
  args: {
    data: generateVolatile(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows volatile success rates with ups and downs.',
      },
    },
  },
};

export const StableTrend: Story = {
  args: {
    data: generateStable(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows relatively stable success rates with minor fluctuations.',
      },
    },
  },
};

export const RecoveringTrend: Story = {
  args: {
    data: generateRecovering(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a recovery pattern from low to high success rates.',
      },
    },
  },
};

export const EmptyData: Story = {
  args: {
    data: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the fallback state when no data is available.',
      },
    },
  },
};

export const SingleDataPoint: Story = {
  args: {
    data: [0.85],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how a single data point is displayed as a dot.',
      },
    },
  },
};

export const PerfectSuccess: Story = {
  args: {
    data: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows 100% success rate across all data points.',
      },
    },
  },
};

export const NoSuccess: Story = {
  args: {
    data: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows 0% success rate across all data points.',
      },
    },
  },
};

export const CustomDimensions: Story = {
  args: {
    data: generateTrendingUp(),
    width: 100,
    height: 40,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the sparkline with custom width and height dimensions.',
      },
    },
  },
};

export const WithCustomStyling: Story = {
  args: {
    data: generateVolatile(),
    className: 'border border-gray-300 rounded bg-gray-50 p-2',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the sparkline with custom CSS classes applied.',
      },
    },
  },
};

// Showcase different sizes side by side
export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <div className="mb-2 text-sm font-medium">Small (40×16)</div>
        <SuccessSparkline data={generateTrendingUp()} width={40} height={16} />
      </div>
      <div className="text-center">
        <div className="mb-2 text-sm font-medium">Default (60×24)</div>
        <SuccessSparkline data={generateTrendingUp()} />
      </div>
      <div className="text-center">
        <div className="mb-2 text-sm font-medium">Large (100×40)</div>
        <SuccessSparkline data={generateTrendingUp()} width={100} height={40} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different sparkline sizes.',
      },
    },
  },
};

// Showcase all trend types together
export const AllTrendTypes: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <div className="text-center">
        <div className="mb-2 text-sm font-medium text-green-600">Trending Up</div>
        <SuccessSparkline data={generateTrendingUp()} />
        <div className="mt-1 text-xs text-gray-500">85% → 88%</div>
      </div>
      <div className="text-center">
        <div className="mb-2 text-sm font-medium text-red-600">Trending Down</div>
        <SuccessSparkline data={generateTrendingDown()} />
        <div className="mt-1 text-xs text-gray-500">88% → 65%</div>
      </div>
      <div className="text-center">
        <div className="mb-2 text-sm font-medium text-yellow-600">Volatile</div>
        <SuccessSparkline data={generateVolatile()} />
        <div className="mt-1 text-xs text-gray-500">55% - 90%</div>
      </div>
      <div className="text-center">
        <div className="mb-2 text-sm font-medium text-blue-600">Stable</div>
        <SuccessSparkline data={generateStable()} />
        <div className="mt-1 text-xs text-gray-500">~80%</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all different trend patterns the sparkline can display.',
      },
    },
  },
};

// Realistic usage context
export const InContext: Story = {
  render: () => (
    <div className="max-w-md p-4 bg-white border rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">GPT-4 Turbo</h3>
        <p className="text-sm text-gray-600">Creative writing assistant</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Success Rate</span>
            <span className="font-medium">85%</span>
          </div>
          <div className="mt-1">
            <SuccessSparkline data={generateTrendingUp()} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">P50 Latency</span>
            <span className="font-medium">1.2s</span>
          </div>
          <div className="mt-1">
            <SuccessSparkline data={generateStable()} />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how the sparkline looks in a realistic PromptCard context.',
      },
    },
  },
};
