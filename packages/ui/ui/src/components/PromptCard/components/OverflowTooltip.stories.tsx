import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverflowTooltip } from './OverflowTooltip';
import type { OverflowTooltipProps } from './OverflowTooltip';
import { Badge } from '../../Badge';

const meta = {
  title: 'PromptCard/Components/OverflowTooltip',
  component: OverflowTooltip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The OverflowTooltip component displays a "+X more" indicator that reveals overflow content in a tooltip.
It's used throughout PromptCard to show additional tags, models, or other items that don't fit in the main view.

## Features

- **Rich Content Support**: Display any React nodes (badges, text, custom components)
- **Flexible Trigger**: Default "+X more" badge or custom trigger element
- **Smart Positioning**: Configurable side and alignment to avoid viewport clipping
- **Keyboard Accessible**: Full keyboard navigation and screen reader support
- **Clean Presentation**: Maximum width prevents tooltip overflow, items are scannable
- **WCAG AA Compliant**: Proper ARIA labels and accessible interaction patterns

## Usage Patterns

### Tags Overflow
Show additional tags that don't fit in the main tag row:
\`\`\`tsx
<OverflowTooltip
  overflowCount={3}
  items={[
    <Badge key="1">Machine Learning</Badge>,
    <Badge key="2">Data Science</Badge>,
    <Badge key="3">Analytics</Badge>
  ]}
/>
\`\`\`

### Model List
Display additional models with custom positioning:
\`\`\`tsx
<OverflowTooltip
  overflowCount={5}
  items={models.map(m => <span key={m}>{m}</span>)}
  side="bottom"
  align="start"
/>
\`\`\`

### Custom Trigger
Use your own trigger element:
\`\`\`tsx
<OverflowTooltip
  overflowCount={3}
  items={items}
  trigger={<button>View More</button>}
/>
\`\`\`

## Accessibility

- Screen reader announces overflow count via aria-label
- Keyboard navigation via Tab key
- Tooltip content is accessible to screen readers
- Proper focus management
- Works with high contrast themes
        `,
      },
    },
  },
  argTypes: {
    overflowCount: {
      control: 'number',
      description: 'Number of items not shown in the main view',
    },
    items: {
      control: 'object',
      description: 'Array of React nodes to display in tooltip',
    },
    side: {
      control: 'radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Tooltip positioning side',
    },
    align: {
      control: 'radio',
      options: ['start', 'center', 'end'],
      description: 'Tooltip alignment',
    },
    delayDuration: {
      control: 'number',
      description: 'Delay before showing tooltip (ms)',
    },
    showArrow: {
      control: 'boolean',
      description: 'Whether to show arrow on tooltip',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the trigger',
    },
  },
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1" variant="secondary">Machine Learning</Badge>,
      <Badge key="2" variant="secondary">Data Science</Badge>,
      <Badge key="3" variant="secondary">Analytics</Badge>,
    ],
    side: 'top',
    align: 'center',
    delayDuration: 200,
    showArrow: true,
  },
} satisfies Meta<OverflowTooltipProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic examples
export const Default: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1" variant="secondary">Machine Learning</Badge>,
      <Badge key="2" variant="secondary">Data Science</Badge>,
      <Badge key="3" variant="secondary">Analytics</Badge>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Default OverflowTooltip with "+X more" badge trigger showing Badge components in tooltip.',
      },
    },
  },
};

export const SmallOverflow: Story = {
  args: {
    overflowCount: 1,
    items: [
      <Badge key="1" variant="info">Additional Tag</Badge>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Single overflow item - shows "+1 more" badge.',
      },
    },
  },
};

export const LargeOverflow: Story = {
  args: {
    overflowCount: 10,
    items: Array.from({ length: 10 }, (_, i) => (
      <Badge key={i} variant="secondary">Tag {i + 1}</Badge>
    )),
  },
  parameters: {
    docs: {
      description: {
        story: 'Large overflow count - tooltip displays all 10 items in a scrollable list.',
      },
    },
  },
};

// Content variations
export const TextItems: Story = {
  args: {
    overflowCount: 4,
    items: [
      <span key="1">gpt-4-turbo</span>,
      <span key="2">claude-3-5-sonnet</span>,
      <span key="3">gemini-pro</span>,
      <span key="4">llama-3-70b</span>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Text content without badges - useful for simple lists like model names.',
      },
    },
  },
};

export const MixedContent: Story = {
  args: {
    overflowCount: 5,
    items: [
      <Badge key="1" variant="success">Production</Badge>,
      <Badge key="2" variant="warning">Testing</Badge>,
      <span key="3" className="font-mono text-xs">v1.2.3</span>,
      <Badge key="4" variant="info">Beta</Badge>,
      <span key="5" className="text-muted-foreground">Last updated: Today</span>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Mixed content types - badges, text, and custom styled elements.',
      },
    },
  },
};

export const BadgeVariants: Story = {
  args: {
    overflowCount: 6,
    items: [
      <Badge key="1" variant="default">Default</Badge>,
      <Badge key="2" variant="secondary">Secondary</Badge>,
      <Badge key="3" variant="success">Success</Badge>,
      <Badge key="4" variant="warning">Warning</Badge>,
      <Badge key="5" variant="danger">Danger</Badge>,
      <Badge key="6" variant="info">Info</Badge>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Different badge variants - showcasing rich visual content support.',
      },
    },
  },
};

// Positioning examples
export const PositionTop: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    side: 'top',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip positioned above the trigger (default).',
      },
    },
  },
};

export const PositionBottom: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    side: 'bottom',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip positioned below the trigger.',
      },
    },
  },
};

export const PositionLeft: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    side: 'left',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip positioned to the left of the trigger.',
      },
    },
  },
};

export const PositionRight: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    side: 'right',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip positioned to the right of the trigger.',
      },
    },
  },
};

export const AlignStart: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    align: 'start',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip aligned to the start of the trigger.',
      },
    },
  },
};

export const AlignEnd: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    align: 'end',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip aligned to the end of the trigger.',
      },
    },
  },
};

// Custom trigger examples
export const CustomTrigger: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    trigger: <Badge variant="accent">Show More Tags</Badge>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom trigger element instead of default "+X more" badge.',
      },
    },
  },
};

export const CustomTriggerButton: Story = {
  args: {
    overflowCount: 5,
    items: [
      <span key="1">Item 1</span>,
      <span key="2">Item 2</span>,
      <span key="3">Item 3</span>,
      <span key="4">Item 4</span>,
      <span key="5">Item 5</span>,
    ],
    trigger: (
      <button className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1">
        View all 5 items
      </button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Button as custom trigger with interactive styling.',
      },
    },
  },
};

export const CustomTriggerText: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    trigger: <span className="text-xs text-muted-foreground cursor-help">...and 3 more</span>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Text-based custom trigger with subtle styling.',
      },
    },
  },
};

// Behavior examples
export const NoArrow: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    showArrow: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip without arrow pointer.',
      },
    },
  },
};

export const InstantShow: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    delayDuration: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip appears instantly with no delay.',
      },
    },
  },
};

export const SlowShow: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
    ],
    delayDuration: 1000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tooltip with longer delay (1 second) before appearing.',
      },
    },
  },
};

// Accessibility examples
export const CustomAriaLabel: Story = {
  args: {
    overflowCount: 5,
    items: [
      <Badge key="1">Tag 1</Badge>,
      <Badge key="2">Tag 2</Badge>,
      <Badge key="3">Tag 3</Badge>,
      <Badge key="4">Tag 4</Badge>,
      <Badge key="5">Tag 5</Badge>,
    ],
    'aria-label': '5 additional tags available',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom aria-label for better screen reader support.',
      },
    },
  },
};

// Real-world examples
export const TagsOverflow: Story = {
  args: {
    overflowCount: 7,
    items: [
      <Badge key="1" variant="secondary">Machine Learning</Badge>,
      <Badge key="2" variant="secondary">Data Science</Badge>,
      <Badge key="3" variant="secondary">Analytics</Badge>,
      <Badge key="4" variant="secondary">Visualization</Badge>,
      <Badge key="5" variant="secondary">Python</Badge>,
      <Badge key="6" variant="secondary">TensorFlow</Badge>,
      <Badge key="7" variant="secondary">PyTorch</Badge>,
    ],
    side: 'bottom',
    align: 'start',
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: Tag overflow in a prompt card showing additional tags.',
      },
    },
  },
};

export const ModelsOverflow: Story = {
  args: {
    overflowCount: 6,
    items: [
      <span key="1" className="font-mono text-xs">gpt-4-turbo-preview</span>,
      <span key="2" className="font-mono text-xs">claude-3-5-sonnet-20241022</span>,
      <span key="3" className="font-mono text-xs">gemini-pro-1.5</span>,
      <span key="4" className="font-mono text-xs">llama-3-70b-instruct</span>,
      <span key="5" className="font-mono text-xs">mistral-large</span>,
      <span key="6" className="font-mono text-xs">command-r-plus</span>,
    ],
    side: 'right',
    'aria-label': '6 supported AI models',
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: Showing additional AI models with monospace font.',
      },
    },
  },
};

export const StatusIndicators: Story = {
  args: {
    overflowCount: 4,
    items: [
      <Badge key="1" variant="success">Production Ready</Badge>,
      <Badge key="2" variant="info">API v2</Badge>,
      <Badge key="3" variant="warning">Rate Limited</Badge>,
      <Badge key="4" variant="outline">Deprecated Soon</Badge>,
    ],
    side: 'bottom',
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: Status indicators and metadata overflow.',
      },
    },
  },
};

// Layout examples
export const InlineFlow: Story = {
  render: (args) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm">Visible tags:</span>
      <Badge variant="secondary">React</Badge>
      <Badge variant="secondary">TypeScript</Badge>
      <Badge variant="secondary">Tailwind</Badge>
      <OverflowTooltip {...args} />
    </div>
  ),
  args: {
    overflowCount: 5,
    items: [
      <Badge key="1" variant="secondary">Next.js</Badge>,
      <Badge key="2" variant="secondary">Vite</Badge>,
      <Badge key="3" variant="secondary">Storybook</Badge>,
      <Badge key="4" variant="secondary">Jest</Badge>,
      <Badge key="5" variant="secondary">Playwright</Badge>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'OverflowTooltip in context with visible items, showing typical inline usage.',
      },
    },
  },
};

// Playground
export const Playground: Story = {
  args: {
    overflowCount: 3,
    items: [
      <Badge key="1" variant="secondary">Item 1</Badge>,
      <Badge key="2" variant="secondary">Item 2</Badge>,
      <Badge key="3" variant="secondary">Item 3</Badge>,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - modify all props to test different combinations.',
      },
    },
  },
};
