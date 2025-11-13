import type { Meta, StoryObj } from '@storybook/react-vite';
import { TypeBadge } from './TypeBadge';
import type { TypeBadgeProps } from './TypeBadge';

const meta = {
  title: 'PromptCard/Complications/TypeBadge',
  component: TypeBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The TypeBadge is a complication that displays prompt type indicators on prompt cards.
It shows the type classification (user, system, tool, eval, agent_instruction) with appropriate icons and color coding, includes tooltips with type descriptions, and adapts to card size.

## Features

- **Visual Indicators**: Type-specific icons from Lucide (User, Settings, Wrench, CheckCircle, Bot)
- **Color-Coded**: Each type has a distinct color for quick visual identification
- **Adaptive Sizing**: Responds to card size (compact mode hides text labels)
- **Rich Tooltips**: Shows type name and description on hover
- **Accessible**: Full WCAG AA compliance with proper ARIA labels
- **Token-driven**: Uses design tokens for consistent theming

## Type Classifications

- **User**: Standard prompts for direct user interaction (gray)
- **System**: System-level instructions and configurations (violet)
- **Tool**: Function/tool calling definitions (teal)
- **Eval**: Evaluation and testing prompts (amber)
- **Agent**: Agent behavior and control prompts (blue)

## Accessibility

- Screen reader announces prompt type
- Keyboard navigation support for tooltips
- High contrast theme compatible
- Proper focus indicators
- Tooltip accessible via keyboard
- Color contrast meets WCAG AA standards
        `,
      },
    },
  },
  argTypes: {
    type: {
      control: 'radio',
      options: ['user', 'system', 'tool', 'eval', 'agent_instruction'],
      description: 'The type classification of the prompt',
    },
    showLabel: {
      control: 'boolean',
      description: 'Override label display (by default follows cardSize)',
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
    // Default type badge props
    type: 'user',
  },
} satisfies Meta<TypeBadgeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic type variations
export const UserType: Story = {
  args: {
    type: 'user',
  },
  parameters: {
    docs: {
      description: {
        story: 'User prompt type - standard prompts for direct user interaction.',
      },
    },
  },
};

export const SystemType: Story = {
  args: {
    type: 'system',
  },
  parameters: {
    docs: {
      description: {
        story: 'System prompt type - system-level instructions and configurations.',
      },
    },
  },
};

export const ToolType: Story = {
  args: {
    type: 'tool',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tool prompt type - function/tool calling definitions.',
      },
    },
  },
};

export const EvalType: Story = {
  args: {
    type: 'eval',
  },
  parameters: {
    docs: {
      description: {
        story: 'Eval prompt type - evaluation and testing prompts.',
      },
    },
  },
};

export const AgentInstructionType: Story = {
  args: {
    type: 'agent_instruction',
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent instruction prompt type - agent behavior and control prompts.',
      },
    },
  },
};

// Card size variations
export const CompactCard: Story = {
  args: {
    type: 'system',
    cardSize: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge in compact mode - hides text labels, shows only icons with smaller sizing.',
      },
    },
  },
};

export const StandardCard: Story = {
  args: {
    type: 'tool',
    cardSize: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge in standard card size - shows both icon and text label.',
      },
    },
  },
};

export const XLCard: Story = {
  args: {
    type: 'eval',
    cardSize: 'xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge in XL card size - same styling as standard but in larger card context.',
      },
    },
  },
};

// Label override examples
export const CompactWithLabel: Story = {
  args: {
    type: 'agent_instruction',
    cardSize: 'compact',
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact card with label override - forces label to display even in compact mode.',
      },
    },
  },
};

export const StandardWithoutLabel: Story = {
  args: {
    type: 'user',
    cardSize: 'standard',
    showLabel: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard card with label override - hides label even in standard mode.',
      },
    },
  },
};

// State variations
export const RunningCard: Story = {
  args: {
    type: 'tool',
    cardState: 'running',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge on a running card - badge appearance remains consistent regardless of card state.',
      },
    },
  },
};

export const ErrorCard: Story = {
  args: {
    type: 'eval',
    cardState: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge on a card in error state - maintains readability.',
      },
    },
  },
};

export const SelectedCard: Story = {
  args: {
    type: 'system',
    cardState: 'selected',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge on selected card - works well with selection styling.',
      },
    },
  },
};

// Accessibility examples
export const HighContrast: Story = {
  args: {
    type: 'agent_instruction',
    features: {
      animations: true,
      highContrast: true,
      reducedMotion: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with high contrast mode enabled - maintains WCAG AA compliance.',
      },
    },
  },
};

export const ReducedMotion: Story = {
  args: {
    type: 'tool',
    features: {
      animations: false,
      highContrast: false,
      reducedMotion: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with reduced motion preferences - respects user accessibility settings.',
      },
    },
  },
};

// Edge cases
export const Hidden: Story = {
  args: {
    type: 'user',
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
    type: 'system',
    className: 'border-dashed border-2 border-purple-500',
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
    type: 'eval',
    'aria-label': 'Custom evaluation prompt type badge',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with custom aria-label - overrides default accessibility text.',
      },
    },
  },
};

// All types showcase
export const AllTypes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TypeBadge {...args} type="user" />
        <span className="text-sm text-gray-600">User</span>
      </div>
      <div className="flex items-center gap-2">
        <TypeBadge {...args} type="system" />
        <span className="text-sm text-gray-600">System</span>
      </div>
      <div className="flex items-center gap-2">
        <TypeBadge {...args} type="tool" />
        <span className="text-sm text-gray-600">Tool</span>
      </div>
      <div className="flex items-center gap-2">
        <TypeBadge {...args} type="eval" />
        <span className="text-sm text-gray-600">Eval</span>
      </div>
      <div className="flex items-center gap-2">
        <TypeBadge {...args} type="agent_instruction" />
        <span className="text-sm text-gray-600">Agent Instruction</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All prompt types displayed together - shows complete type taxonomy.',
      },
    },
  },
};

// Playground story for testing
export const Playground: Story = {
  args: {
    type: 'system',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - modify all props to test different combinations.',
      },
    },
  },
};
