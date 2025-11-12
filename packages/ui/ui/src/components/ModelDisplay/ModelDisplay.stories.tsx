import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModelChip, ModelTooltip, ModelCard, ModelDeprecationWarning } from './index';
import { EnhancedModel } from '../ModelPicker/types';

// Mock model data
const mockActiveModel: EnhancedModel = {
  id: 'gpt-4-turbo',
  provider: 'OpenAI',
  model_key: 'gpt-4-turbo-preview',
  display_name: 'GPT-4 Turbo',
  short_label: 'GPT-4 Turbo',
  family: 'gpt-4',
  modalities: ['text', 'vision'],
  context_window: 128000,
  max_output_tokens: 4096,
  supports_tools: true,
  supports_json_mode: true,
  status: 'active',
  pricing: {
    input_cost_per_token: 0.00001,
    output_cost_per_token: 0.00003,
    currency: 'USD',
  },
  capabilities: [
    { id: 'vision', name: 'Vision', description: 'Image understanding and analysis' },
    { id: 'tools', name: 'Function Calling', description: 'Execute external functions' },
    { id: 'json_mode', name: 'JSON Mode', description: 'Structured JSON output' },
    { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming' },
  ],
  performance: {
    latency: 'medium',
    cost: 'high',
    quality: 'high',
  },
  tags: [],
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
  description: 'Advanced language model with vision capabilities, function calling, and excellent performance for complex reasoning tasks. Optimized for both speed and quality.',
};

const mockBetaModel: EnhancedModel = {
  ...mockActiveModel,
  id: 'gpt-4-vision-beta',
  model_key: 'gpt-4-vision-preview',
  display_name: 'GPT-4 Vision Beta',
  short_label: 'GPT-4 Vision (Beta)',
  status: 'beta',
  description: 'Beta version of GPT-4 with enhanced vision capabilities for image analysis and understanding.',
};

const mockDeprecatedModel: EnhancedModel = {
  ...mockActiveModel,
  id: 'gpt-3',
  provider: 'OpenAI',
  model_key: 'gpt-3-davinci',
  display_name: 'GPT-3 Davinci',
  short_label: 'GPT-3',
  status: 'deprecated',
  capabilities: [
    { id: 'tools', name: 'Function Calling', description: 'Execute external functions' },
  ],
  pricing: {
    input_cost_per_token: 0.00002,
    output_cost_per_token: 0.00002,
    currency: 'USD',
  },
  deprecation: {
    deprecated_at: '2024-01-01',
    end_of_life: '2024-12-31',
    replacement_model: 'gpt-4-turbo',
    reason: 'Superseded by GPT-4 with better performance and capabilities',
  },
  description: 'Legacy language model that has been superseded by newer versions.',
};

const mockFreeModel: EnhancedModel = {
  ...mockActiveModel,
  id: 'llama-2-70b',
  provider: 'Meta',
  model_key: 'llama-2-70b-chat',
  display_name: 'Llama 2 70B Chat',
  short_label: 'Llama 2 70B',
  pricing: undefined, // Free model
  logoUrl: undefined,
  description: 'Open source large language model by Meta, available for free use.',
};

const mockPremiumModel: EnhancedModel = {
  ...mockActiveModel,
  id: 'claude-3-opus',
  provider: 'Anthropic',
  model_key: 'claude-3-opus-20240229',
  display_name: 'Claude-3 Opus',
  short_label: 'Claude-3 Opus',
  context_window: 200000,
  pricing: {
    input_cost_per_token: 0.000015,
    output_cost_per_token: 0.000075,
    currency: 'USD',
  },
  logoUrl: undefined,
  description: 'Most powerful model in the Claude family, excelling at complex reasoning and analysis.',
};

// ModelChip Stories
const chipMeta: Meta<typeof ModelChip> = {
  title: 'Model Display/ModelChip',
  component: ModelChip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Compact model representation with provider logo, status indicators, and capability badges.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'compact', 'detailed'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg'],
    },
    showProvider: { control: 'boolean' },
    showStatus: { control: 'boolean' },
    showCapabilities: { control: 'boolean' },
    showPricing: { control: 'boolean' },
    interactive: { control: 'boolean' },
  },
};

export default chipMeta;

type ChipStory = StoryObj<typeof ModelChip>;

export const DefaultChip: ChipStory = {
  args: {
    model: mockActiveModel,
    showProvider: true,
    showStatus: true,
  },
};

export const InteractiveChip: ChipStory = {
  args: {
    model: mockActiveModel,
    interactive: true,
    showProvider: true,
    showStatus: true,
    showCapabilities: true,
    onClick: () => alert('Model selected!'),
  },
};

export const RemovableChip: ChipStory = {
  args: {
    model: mockActiveModel,
    showProvider: true,
    onRemove: () => alert('Model removed!'),
  },
};

export const CompactChip: ChipStory = {
  args: {
    model: mockActiveModel,
    variant: 'compact',
    size: 'sm',
    showProvider: true,
    showCapabilities: true,
  },
};

export const DetailedChip: ChipStory = {
  args: {
    model: mockActiveModel,
    variant: 'detailed',
    size: 'lg',
    showProvider: true,
    showStatus: true,
    showCapabilities: true,
    showPricing: true,
  },
};

export const DeprecatedChip: ChipStory = {
  args: {
    model: mockDeprecatedModel,
    showProvider: true,
    showStatus: true,
  },
};

export const BetaChip: ChipStory = {
  args: {
    model: mockBetaModel,
    showProvider: true,
    showStatus: true,
    showCapabilities: true,
  },
};

export const FreeModelChip: ChipStory = {
  args: {
    model: mockFreeModel,
    showProvider: true,
    showPricing: true,
  },
};

// ModelTooltip Stories
export const TooltipDefault = {
  render: () => (
    <div className="p-8">
      <ModelTooltip model={mockActiveModel}>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Hover for model info
        </button>
      </ModelTooltip>
    </div>
  ),
};

export const TooltipWithMetrics = {
  render: () => (
    <div className="p-8">
      <ModelTooltip model={mockActiveModel} showMetrics>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Hover for detailed metrics
        </button>
      </ModelTooltip>
    </div>
  ),
};

export const TooltipMinimal = {
  render: () => (
    <div className="p-8">
      <ModelTooltip model={mockActiveModel} showFullDetails={false}>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Hover for basic info
        </button>
      </ModelTooltip>
    </div>
  ),
};

// ModelCard Stories with Enhanced Hover Effects
export const CardDefault = {
  render: () => (
    <div className="max-w-md">
      <ModelCard
        model={mockActiveModel}
        onSelect={() => alert('Model selected!')}
        onFavorite={() => alert('Favorited!')}
        onCompare={() => alert('Added to comparison!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default ModelCard with enhanced hover effects - hover to see elevation lift, avatar ring, and color transitions.',
      },
    },
  },
};

export const CardCompact = {
  render: () => (
    <div className="max-w-md">
      <ModelCard
        model={mockActiveModel}
        variant="compact"
        showActions={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact variant with subtle hover lift and description truncation.',
      },
    },
  },
};

export const CardDetailed = {
  render: () => (
    <div className="max-w-md">
      <ModelCard
        model={mockActiveModel}
        variant="detailed"
        showMetrics
        showSuggestions
        onSelect={() => alert('Model selected!')}
        onFavorite={() => alert('Favorited!')}
        onCompare={() => alert('Added to comparison!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Detailed variant with maximum hover lift, performance indicators, and interactive suggestions.',
      },
    },
  },
};

export const CardDeprecated = {
  render: () => (
    <div className="max-w-md">
      <ModelCard
        model={mockDeprecatedModel}
        onSelect={() => alert('Model selected!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Deprecated model card with status badge highlighting.',
      },
    },
  },
};

export const CardPremium = {
  render: () => (
    <div className="max-w-md">
      <ModelCard
        model={mockPremiumModel}
        variant="detailed"
        showMetrics
        onSelect={() => alert('Model selected!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Premium model with price tier badge and enhanced hover effects.',
      },
    },
  },
};

// Interactive States Showcase
export const InteractiveStatesShowcase = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Hover Effects</h3>
        <p className="text-sm text-text-muted mb-4">
          Hover over these cards to see elevation lift, avatar ring animation, title color transition, and badge scaling.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <ModelCard
            model={mockActiveModel}
            variant="compact"
            onSelect={() => alert('Selected!')}
          />
          <ModelCard
            model={mockActiveModel}
            variant="default"
            onSelect={() => alert('Selected!')}
          />
          <ModelCard
            model={mockActiveModel}
            variant="detailed"
            showMetrics
            onSelect={() => alert('Selected!')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Badge Variations</h3>
        <p className="text-sm text-text-muted mb-4">
          Status and pricing badges scale on hover.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ModelCard
            model={mockBetaModel}
            onSelect={() => alert('Selected!')}
          />
          <ModelCard
            model={mockDeprecatedModel}
            onSelect={() => alert('Selected!')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Interactive Actions</h3>
        <p className="text-sm text-text-muted mb-4">
          Action buttons scale on hover. Favorite button fills heart icon when active.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ModelCard
            model={mockActiveModel}
            onSelect={() => alert('Selected!')}
            onFavorite={() => alert('Favorited!')}
            onCompare={() => alert('Compare!')}
          />
          <ModelCard
            model={mockPremiumModel}
            variant="detailed"
            showSuggestions
            onSelect={() => alert('Selected!')}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive showcase of all interactive states and hover effects for ModelCard.',
      },
    },
  },
};

// ModelDeprecationWarning Stories
export const WarningInline = {
  render: () => (
    <div className="space-y-4">
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="inline"
      />
    </div>
  ),
};

export const WarningBanner = {
  render: () => (
    <div className="space-y-4">
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="banner"
        onDismiss={() => alert('Warning dismissed!')}
        onMigrate={(model) => alert(`Migrating to ${model}`)}
      />
    </div>
  ),
};

export const WarningModal = {
  render: () => (
    <div className="max-w-lg">
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showTimeline
        showAlternatives
        onDismiss={() => alert('Warning dismissed!')}
        onMigrate={(model) => alert(`Migrating to ${model}`)}
      />
    </div>
  ),
};

export const WarningCritical = {
  render: () => (
    <div className="space-y-4">
      <ModelDeprecationWarning
        model={{
          ...mockDeprecatedModel,
          deprecation: {
            ...mockDeprecatedModel.deprecation!,
            end_of_life: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
          },
        }}
        variant="banner"
        severity="critical"
        onDismiss={() => alert('Warning dismissed!')}
      />
    </div>
  ),
};

// Combined Example
export const CombinedExample = {
  render: () => (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Model Chips</h3>
        <div className="flex flex-wrap gap-2">
          <ModelChip model={mockActiveModel} showProvider showCapabilities />
          <ModelChip model={mockBetaModel} showProvider showStatus />
          <ModelChip model={mockDeprecatedModel} showProvider showStatus />
          <ModelChip model={mockFreeModel} showProvider showPricing />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Deprecation Warnings</h3>
        <ModelDeprecationWarning
          model={mockDeprecatedModel}
          variant="banner"
          onDismiss={() => alert('Dismissed!')}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Model Cards</h3>
        <div className="grid gap-4">
          <ModelCard
            model={mockActiveModel}
            variant="compact"
            onSelect={() => alert('Selected!')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tooltips</h3>
        <div className="flex gap-4">
          <ModelTooltip model={mockActiveModel}>
            <button className="px-3 py-2 bg-primary text-primary-foreground rounded">
              Hover me
            </button>
          </ModelTooltip>
          <ModelTooltip model={mockDeprecatedModel} showMetrics>
            <button className="px-3 py-2 bg-secondary text-white rounded">
              Deprecated model
            </button>
          </ModelTooltip>
        </div>
      </div>
    </div>
  ),
};

// Accessibility Examples
export const AccessibilityShowcase = {
  render: () => (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Keyboard Navigation</h3>
        <div className="flex gap-2">
          <ModelChip
            model={mockActiveModel}
            interactive
            showProvider
            onClick={() => alert('Clicked via keyboard or mouse!')}
          />
          <ModelChip
            model={mockBetaModel}
            interactive
            showProvider
            onRemove={() => alert('Removed via keyboard or mouse!')}
          />
        </div>
        <p className="text-sm text-text-muted mt-2">
          Try using Tab, Enter, Space, and Delete keys
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Screen Reader Support</h3>
        <ModelCard
          model={mockActiveModel}
          onSelect={() => alert('Selected!')}
          onFavorite={() => alert('Favorited!')}
        />
        <p className="text-sm text-text-muted mt-2">
          All interactive elements have proper ARIA labels and descriptions
        </p>
      </div>
    </div>
  ),
};
