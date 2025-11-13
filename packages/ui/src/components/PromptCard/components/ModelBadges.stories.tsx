import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModelBadges } from './ModelBadges';
import type { ModelBadgesProps } from './ModelBadges';
import { fn } from '@storybook/test';

const meta = {
  title: 'PromptCard/Components/ModelBadges',
  component: ModelBadges,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The ModelBadges component displays multiple AI model names with responsive overflow handling.
It adapts the number of visible models based on card size and uses OverflowTooltip for overflow items.

## Features

- **Responsive Display**: Shows 1-3 models based on card size (compact/standard/xl)
- **Smart Overflow**: Automatically shows "+X more" for additional models
- **Interactive**: Optional click handlers for model filtering
- **Keyboard Accessible**: Full keyboard navigation and ARIA labels
- **Touch-Friendly**: Proper touch targets for mobile devices
- **Consistent Styling**: Uses Badge component with secondary variant

## Responsive Limits

- **Compact**: 1 model + overflow
- **Standard**: 2 models + overflow
- **XL**: 3 models + overflow

## Usage Patterns

### Basic Display
Show multiple model names with automatic overflow:
\`\`\`tsx
<ModelBadges
  models={['gpt-4', 'claude-3-opus', 'gemini-pro']}
  size="standard"
/>
\`\`\`

### With Click Handler
Enable filtering by clicking model badges:
\`\`\`tsx
<ModelBadges
  models={['gpt-4', 'claude-3-opus']}
  onModelClick={(model, event) => {
    filterByModel(model);
  }}
/>
\`\`\`

### In PromptCard
Typically used in the MetaStrip section:
\`\`\`tsx
<PromptCard
  // ... other props
  model={['gpt-4', 'claude-3-opus', 'gemini-pro']}
  onModelClick={(model) => filterPrompts({ model })}
/>
\`\`\`

## Accessibility

- Clickable badges have role="button" and proper ARIA labels
- Keyboard navigation via Tab key
- Enter/Space key activation for clickable badges
- Screen reader announces model names and overflow count
- Event propagation stopped to prevent card clicks
- WCAG AA compliant touch targets (≥44px)
        `,
      },
    },
  },
  argTypes: {
    models: {
      control: 'object',
      description: 'Array of model names to display',
    },
    size: {
      control: 'radio',
      options: ['compact', 'standard', 'xl'],
      description: 'Card size determines visible model count',
    },
    onModelClick: {
      action: 'modelClicked',
      description: 'Optional click handler for filtering',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'],
    size: 'standard',
    onModelClick: undefined,
  },
} satisfies Meta<ModelBadgesProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic examples
export const Default: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default ModelBadges showing 2 visible models (standard size) with "+2 more" overflow.',
      },
    },
  },
};

export const SingleModel: Story = {
  args: {
    models: ['gpt-4'],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Single model without overflow indicator.',
      },
    },
  },
};

export const TwoModels: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus'],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Two models fitting perfectly in standard size with no overflow.',
      },
    },
  },
};

export const ManyModels: Story = {
  args: {
    models: [
      'gpt-4-turbo',
      'claude-3-opus',
      'gemini-pro-1.5',
      'llama-3-70b',
      'mistral-large',
      'command-r-plus',
      'cohere-command',
      'palm-2',
    ],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Many models showing "+6 more" overflow in standard size.',
      },
    },
  },
};

// Size variations
export const CompactSize: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'],
    size: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact size shows only 1 model with "+3 more" overflow.',
      },
    },
  },
};

export const StandardSize: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard size shows 2 models with "+2 more" overflow.',
      },
    },
  },
};

export const XLSize: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'],
    size: 'xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'XL size shows 3 models with "+1 more" overflow.',
      },
    },
  },
};

// Interactive examples
export const Clickable: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
    size: 'standard',
    onModelClick: fn((model: string) => {
      console.log('Filter by model:', model);
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable model badges with hover states. Click any badge to trigger the onModelClick handler.',
      },
    },
  },
};

export const ClickableWithOverflow: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3', 'mistral-large'],
    size: 'standard',
    onModelClick: fn((model: string) => {
      console.log('Filter by model:', model);
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable badges with overflow tooltip. Models in the tooltip are also clickable.',
      },
    },
  },
};

// Real-world model names
export const OpenAIModels: Story = {
  args: {
    models: [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Real OpenAI model names with full identifiers.',
      },
    },
  },
};

export const AnthropicModels: Story = {
  args: {
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    size: 'xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Anthropic Claude models with version dates.',
      },
    },
  },
};

export const MixedProviders: Story = {
  args: {
    models: [
      'gpt-4-turbo',
      'claude-3-5-sonnet',
      'gemini-1.5-pro',
      'llama-3-70b-instruct',
      'mistral-large-2402',
      'command-r-plus',
    ],
    size: 'xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Mixed AI providers showing variety of model names and formats.',
      },
    },
  },
};

// Edge cases
export const LongModelName: Story = {
  args: {
    models: [
      'anthropic-claude-3-5-sonnet-20241022-very-long-identifier',
      'gpt-4',
    ],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Handling very long model names with proper text overflow.',
      },
    },
  },
};

export const SpecialCharacters: Story = {
  args: {
    models: [
      'gpt-4-turbo-preview',
      'claude-3.5-sonnet',
      'gemini_1.5_pro',
      'llama-3-70b-instruct',
    ],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Model names with various special characters (hyphens, dots, underscores).',
      },
    },
  },
};

// Layout examples
export const InContext: Story = {
  render: (args) => (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-panel">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Supported models:</span>
        <ModelBadges {...args} />
      </div>
    </div>
  ),
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'],
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'ModelBadges in context, showing typical usage in a metadata row.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Models
      </span>
      <ModelBadges {...args} />
    </div>
  ),
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
    size: 'standard',
    onModelClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'ModelBadges with a label, showing semantic grouping.',
      },
    },
  },
};

// Responsive comparison
export const ResponsiveComparison: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-sm font-medium mb-2">Compact (1 model)</div>
        <ModelBadges {...args} size="compact" />
      </div>
      <div>
        <div className="text-sm font-medium mb-2">Standard (2 models)</div>
        <ModelBadges {...args} size="standard" />
      </div>
      <div>
        <div className="text-sm font-medium mb-2">XL (3 models)</div>
        <ModelBadges {...args} size="xl" />
      </div>
    </div>
  ),
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3', 'mistral-large'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all three sizes with the same model list.',
      },
    },
  },
};

// Accessibility example
export const KeyboardNavigation: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
    size: 'standard',
    onModelClick: fn((model: string) => {
      console.log('Filter by model:', model);
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Test keyboard navigation: Tab to focus badges, Enter/Space to activate. All badges are keyboard accessible.',
      },
    },
  },
};

// Playground
export const Playground: Story = {
  args: {
    models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'],
    size: 'standard',
    onModelClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - modify all props to test different combinations.',
      },
    },
  },
};
