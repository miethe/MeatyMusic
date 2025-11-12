import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProviderBadge } from './ProviderBadge';
import type { ProviderBadgeProps } from './ProviderBadge';

const meta = {
  title: 'PromptCard/Components/ProviderBadge',
  component: ProviderBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The ProviderBadge is a component that displays AI provider branding as a complication on prompt cards.
It shows which AI provider the prompt is configured to use, with appropriate brand colors and responsive sizing.

## Features

- **Brand Colors**: Each provider has its own distinct color (OpenAI green, Anthropic gold, etc.)
- **Adaptive Sizing**: Shows abbreviations in compact mode, full names in standard/xl modes
- **Model Information**: Optional model name display in tooltip
- **Interactive**: Optional click handler for provider details
- **Accessible**: Full WCAG AA compliance with proper ARIA labels
- **Responsive**: Adjusts text and sizing based on card size

## Supported Providers

- **OpenAI** (#10A37F) - GPT models
- **Anthropic** (#D4A373) - Claude models
- **Google** (#4285F4) - Gemini models
- **Meta** (#0668E1) - Llama models
- **Cohere** (#39594D) - Command models
- **Custom** (secondary) - Unknown or custom providers

## Typical Slot

This component is designed for the **topLeft** slot to prominently display provider information.

## Accessibility

- Screen reader announces provider and optional model name
- Keyboard navigation support when interactive
- High contrast theme compatible
- Proper focus indicators
- Tooltip accessible via keyboard
        `,
      },
    },
  },
  argTypes: {
    provider: {
      control: 'radio',
      options: ['openai', 'anthropic', 'google', 'meta', 'cohere', 'custom'],
      description: 'The AI provider',
    },
    modelName: {
      control: 'text',
      description: 'Optional model name (shown in tooltip)',
    },
    cardSize: {
      control: 'radio',
      options: ['compact', 'standard', 'xl'],
      description: 'The size of the parent prompt card',
    },
    isVisible: {
      control: 'boolean',
      description: 'Whether the badge should be visible',
    },
    onClick: {
      action: 'provider-clicked',
      description: 'Called when the badge is clicked (makes badge interactive)',
    },
  },
  args: {
    // Default complication props
    cardId: 'storybook-card',
    cardState: 'default',
    cardSize: 'standard',
    cardTitle: 'Sample Prompt',
    isFocused: false,
    isVisible: true,
    slot: 'topLeft',
    lastStateChange: new Date(),
    features: {
      animations: true,
      highContrast: false,
      reducedMotion: false,
    },
    // Default provider badge props
    provider: 'anthropic',
  },
} satisfies Meta<ProviderBadgeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Provider variations
export const OpenAI: Story = {
  args: {
    provider: 'openai',
    modelName: 'gpt-4',
  },
  parameters: {
    docs: {
      description: {
        story: 'OpenAI provider badge with GPT-4 model - displays in OpenAI brand green (#10A37F).',
      },
    },
  },
};

export const Anthropic: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
  },
  parameters: {
    docs: {
      description: {
        story: 'Anthropic provider badge with Claude 3.5 Sonnet model - displays in Anthropic brand gold (#D4A373).',
      },
    },
  },
};

export const Google: Story = {
  args: {
    provider: 'google',
    modelName: 'gemini-pro',
  },
  parameters: {
    docs: {
      description: {
        story: 'Google provider badge with Gemini Pro model - displays in Google brand blue (#4285F4).',
      },
    },
  },
};

export const MetaProvider: Story = {
  args: {
    provider: 'meta',
    modelName: 'llama-3-70b',
  },
  parameters: {
    docs: {
      description: {
        story: 'Meta provider badge with Llama 3 70B model - displays in Meta brand blue (#0668E1).',
      },
    },
  },
};

export const Cohere: Story = {
  args: {
    provider: 'cohere',
    modelName: 'command-r-plus',
  },
  parameters: {
    docs: {
      description: {
        story: 'Cohere provider badge with Command R Plus model - displays in Cohere brand green (#39594D).',
      },
    },
  },
};

export const Custom: Story = {
  args: {
    provider: 'custom',
    modelName: 'custom-llm-v1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom provider badge for unknown or custom providers - uses secondary color variant.',
      },
    },
  },
};

// Card size variations
export const CompactCard: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
    cardSize: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge in compact mode - shows abbreviation "ANT" instead of full "Anthropic".',
      },
    },
  },
};

export const StandardCard: Story = {
  args: {
    provider: 'openai',
    modelName: 'gpt-4',
    cardSize: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge in standard card size - shows full provider name "OpenAI".',
      },
    },
  },
};

export const XLCard: Story = {
  args: {
    provider: 'google',
    modelName: 'gemini-pro',
    cardSize: 'xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge in XL card size - shows full provider name with larger sizing.',
      },
    },
  },
};

// Model name variations
export const WithModelName: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet-20241022',
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge with detailed model name shown in tooltip.',
      },
    },
  },
};

export const WithoutModelName: Story = {
  args: {
    provider: 'openai',
    modelName: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge without model name - tooltip shows only provider description.',
      },
    },
  },
};

// Interactive examples
export const Interactive: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
    onClick: () => console.log('Opening provider details'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive provider badge - becomes a button that opens provider details or settings.',
      },
    },
  },
};

export const InteractiveOpenAI: Story = {
  args: {
    provider: 'openai',
    modelName: 'gpt-4-turbo',
    onClick: () => console.log('Opening OpenAI provider details'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive OpenAI badge with click handler for configuration.',
      },
    },
  },
};

// State variations
export const RunningCard: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
    cardState: 'running',
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge on a running card - maintains consistent appearance.',
      },
    },
  },
};

export const ErrorCard: Story = {
  args: {
    provider: 'openai',
    modelName: 'gpt-4',
    cardState: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge on a card in error state - remains readable.',
      },
    },
  },
};

export const SelectedCard: Story = {
  args: {
    provider: 'google',
    modelName: 'gemini-pro',
    cardState: 'selected',
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge on selected card - works with selection styling.',
      },
    },
  },
};

// All providers showcase
export const AllProviders: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Standard Size</h3>
        <div className="flex flex-wrap gap-2">
          <ProviderBadge {...args} provider="openai" modelName="gpt-4" />
          <ProviderBadge {...args} provider="anthropic" modelName="claude-3-5-sonnet" />
          <ProviderBadge {...args} provider="google" modelName="gemini-pro" />
          <ProviderBadge {...args} provider="meta" modelName="llama-3-70b" />
          <ProviderBadge {...args} provider="cohere" modelName="command-r-plus" />
          <ProviderBadge {...args} provider="custom" modelName="custom-llm" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Compact Size</h3>
        <div className="flex flex-wrap gap-2">
          <ProviderBadge {...args} provider="openai" cardSize="compact" />
          <ProviderBadge {...args} provider="anthropic" cardSize="compact" />
          <ProviderBadge {...args} provider="google" cardSize="compact" />
          <ProviderBadge {...args} provider="meta" cardSize="compact" />
          <ProviderBadge {...args} provider="cohere" cardSize="compact" />
          <ProviderBadge {...args} provider="custom" cardSize="compact" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All providers displayed side by side in both standard and compact modes.',
      },
    },
  },
};

// Accessibility examples
export const HighContrast: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
    features: {
      animations: true,
      highContrast: true,
      reducedMotion: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge with high contrast mode enabled - maintains WCAG AA compliance.',
      },
    },
  },
};

export const ReducedMotion: Story = {
  args: {
    provider: 'openai',
    modelName: 'gpt-4',
    features: {
      animations: false,
      highContrast: false,
      reducedMotion: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider badge with reduced motion preferences - respects user accessibility settings.',
      },
    },
  },
};

// Edge cases
export const Hidden: Story = {
  args: {
    provider: 'anthropic',
    isVisible: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge when isVisible is false - should not render anything.',
      },
    },
  },
};

export const CustomClassName: Story = {
  args: {
    provider: 'google',
    modelName: 'gemini-pro',
    className: 'ring-2 ring-offset-2 ring-purple-500',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with custom className - allows for additional styling while maintaining core functionality.',
      },
    },
  },
};

export const CustomAriaLabel: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
    'aria-label': 'Custom provider label for screen readers',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with custom aria-label - overrides default accessibility text.',
      },
    },
  },
};

// Playground story for testing
export const Playground: Story = {
  args: {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - modify all props to test different combinations.',
      },
    },
  },
};
