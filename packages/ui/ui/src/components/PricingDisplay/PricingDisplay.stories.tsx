import type { Meta, StoryObj } from '@storybook/react-vite';
import { PricingDisplay } from './PricingDisplay';
import type { PricingTier } from './PricingDisplay';

const meta: Meta<typeof PricingDisplay> = {
  title: 'Components/PricingDisplay',
  component: PricingDisplay,
  tags: ['autodocs'],
  argTypes: {
    showCalculator: {
      control: 'boolean',
      description: 'Show the cost calculator',
    },
    showAllTiers: {
      control: 'boolean',
      description: 'Show all pricing tiers',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Visual variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Text size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PricingDisplay>;

const samplePricing: PricingTier[] = [
  {
    id: '1',
    pricing_tier: 'Standard',
    cost_per_token: 0.00003,
    cost_per_request: 0.001,
    currency: '$',
    effective_date: '2025-01-01',
  },
];

const multiTierPricing: PricingTier[] = [
  {
    id: '1',
    pricing_tier: 'Pay-as-you-go',
    cost_per_token: 0.00003,
    cost_per_request: 0.001,
    currency: '$',
    effective_date: '2025-01-01',
  },
  {
    id: '2',
    pricing_tier: 'Volume (1M+ tokens/month)',
    cost_per_token: 0.000025,
    cost_per_request: 0.0008,
    currency: '$',
    effective_date: '2025-01-01',
  },
  {
    id: '3',
    pricing_tier: 'Enterprise (10M+ tokens/month)',
    cost_per_token: 0.00002,
    cost_per_request: 0.0006,
    currency: '$',
    effective_date: '2025-01-01',
  },
];

/**
 * Default pricing display showing single tier
 */
export const Default: Story = {
  args: {
    pricing: samplePricing,
  },
};

/**
 * Pricing display with cost calculator
 */
export const WithCalculator: Story = {
  args: {
    pricing: samplePricing,
    showCalculator: true,
  },
};

/**
 * Multiple pricing tiers
 */
export const MultipleTiers: Story = {
  args: {
    pricing: multiTierPricing,
    showAllTiers: true,
  },
};

/**
 * Multiple tiers with only primary shown (default)
 */
export const MultipleTiersPrimaryOnly: Story = {
  args: {
    pricing: multiTierPricing,
    showAllTiers: false,
  },
};

/**
 * With price comparison showing cheaper model
 */
export const WithComparisonCheaper: Story = {
  args: {
    pricing: samplePricing,
    comparisonPricing: {
      cost_per_token: 0.00006,
      label: 'GPT-4',
    },
  },
};

/**
 * With price comparison showing more expensive model
 */
export const WithComparisonMoreExpensive: Story = {
  args: {
    pricing: [
      {
        id: '1',
        pricing_tier: 'Standard',
        cost_per_token: 0.00006,
        currency: '$',
        effective_date: '2025-01-01',
      },
    ],
    comparisonPricing: {
      cost_per_token: 0.00003,
      label: 'Claude 3.5 Sonnet',
    },
  },
};

/**
 * Empty pricing (graceful fallback)
 */
export const EmptyPricing: Story = {
  args: {
    pricing: [],
  },
};

/**
 * Compact variant
 */
export const CompactVariant: Story = {
  args: {
    pricing: samplePricing,
    variant: 'compact',
    showCalculator: true,
  },
};

/**
 * Different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold mb-2">Small</h3>
        <PricingDisplay pricing={samplePricing} size="sm" />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Medium (Default)</h3>
        <PricingDisplay pricing={samplePricing} size="md" />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Large</h3>
        <PricingDisplay pricing={samplePricing} size="lg" />
      </div>
    </div>
  ),
};

/**
 * Real-world example: GPT-4 Turbo pricing
 */
export const GPT4TurboPricing: Story = {
  args: {
    pricing: [
      {
        id: '1',
        pricing_tier: 'Standard',
        cost_per_token: 0.00001,
        currency: '$',
        effective_date: '2024-12-01',
      },
    ],
    showCalculator: true,
  },
};

/**
 * Real-world example: Claude 3.5 Sonnet pricing
 */
export const Claude35SonnetPricing: Story = {
  args: {
    pricing: [
      {
        id: '1',
        pricing_tier: 'Standard',
        cost_per_token: 0.000003,
        currency: '$',
        effective_date: '2025-01-01',
      },
    ],
    showCalculator: true,
    comparisonPricing: {
      cost_per_token: 0.00001,
      label: 'GPT-4 Turbo',
    },
  },
};

/**
 * Use case: Model comparison pricing
 */
export const ModelComparisonPricing: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">GPT-4 Turbo</h3>
        <PricingDisplay
          pricing={[
            {
              id: '1',
              pricing_tier: 'Standard',
              cost_per_token: 0.00001,
              currency: '$',
              effective_date: '2024-12-01',
            },
          ]}
          showCalculator
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">Claude 3.5 Sonnet</h3>
        <PricingDisplay
          pricing={[
            {
              id: '2',
              pricing_tier: 'Standard',
              cost_per_token: 0.000003,
              currency: '$',
              effective_date: '2025-01-01',
            },
          ]}
          showCalculator
        />
      </div>
    </div>
  ),
};

/**
 * Accessibility test: Keyboard navigation and screen reader
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Test with keyboard navigation and screen reader:
      </p>
      <PricingDisplay pricing={samplePricing} showCalculator />
      <p className="text-xs text-muted-foreground">
        Calculator input should be keyboard accessible and properly labeled
      </p>
    </div>
  ),
};
