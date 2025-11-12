import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Info, HelpCircle as Help, Settings, User } from 'lucide-react';
import { Button } from '../Button/Button';
import { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.

**Accessibility Features:**
- Full keyboard navigation support (focus triggers tooltip)
- Screen reader announcements via aria-describedby
- Proper focus management and escape key support
- Respects prefers-reduced-motion for animations
- WCAG 2.1 AA compliant color contrast

**Usage Guidelines:**
- Use for additional context or help information
- Keep content concise (< 100 characters recommended)
- Avoid critical information that users must have access to
- Use \`showArrow\` prop to improve visual connection
- Consider \`delayDuration\` for better UX (200ms default)

**Design System Integration:**
All colors, spacing, and animations use design tokens from @meaty/tokens for consistent theming.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left'],
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 2000, step: 100 },
    },
    showArrow: {
      control: { type: 'boolean' },
    },
  },
  args: {
    content: 'This is a helpful tooltip',
    delayDuration: 200,
    showArrow: true,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Button>Hover me</Button>,
    content: 'This is a helpful tooltip',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <Button size="icon">
        <Info className="h-4 w-4" />
      </Button>
    ),
    content: 'Get more information about this feature',
  },
};

export const LongContent: Story = {
  args: {
    children: <Button variant="outline">Complex Action</Button>,
    content: 'This tooltip contains more detailed information about what this button does and why you might want to use it.',
  },
};

export const Positions = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-8">
      <Tooltip content="Tooltip on top" side="top">
        <Button>Top</Button>
      </Tooltip>
      <Tooltip content="Tooltip on right" side="right">
        <Button>Right</Button>
      </Tooltip>
      <Tooltip content="Tooltip on bottom" side="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <Tooltip content="Tooltip on left" side="left">
        <Button>Left</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips can be positioned on any side of the trigger element.',
      },
    },
  },
};

export const Alignments = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex gap-4">
        <Tooltip content="Start aligned" side="bottom" align="start">
          <Button>Start</Button>
        </Tooltip>
        <Tooltip content="Center aligned" side="bottom" align="center">
          <Button>Center</Button>
        </Tooltip>
        <Tooltip content="End aligned" side="bottom" align="end">
          <Button>End</Button>
        </Tooltip>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips can be aligned relative to their trigger element.',
      },
    },
  },
};

export const NoArrow: Story = {
  args: {
    children: <Button variant="ghost">Clean tooltip</Button>,
    content: 'This tooltip has no arrow',
    showArrow: false,
  },
};

export const FastDelay: Story = {
  args: {
    children: <Button variant="secondary">Fast tooltip</Button>,
    content: 'Appears quickly',
    delayDuration: 0,
  },
};

export const SlowDelay: Story = {
  args: {
    children: <Button variant="outline">Slow tooltip</Button>,
    content: 'Takes time to appear',
    delayDuration: 1000,
  },
};

export const InteractiveElements = {
  render: () => (
    <div className="flex gap-4 p-4">
      <Tooltip content="User profile settings">
        <Button size="icon" variant="ghost">
          <User className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Application settings">
        <Button size="icon" variant="ghost">
          <Settings className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Get help and support">
        <Button size="icon" variant="ghost">
          <Help className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tooltips work great with icon buttons to provide context.',
      },
    },
  },
};

export const ComposedTooltip = {
  render: () => (
    <TooltipProvider delayDuration={300}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button variant="premium">
            Premium Feature
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="flex flex-col gap-1">
            <div className="font-medium">Premium Feature</div>
            <div className="text-xs text-primary-foreground/80">
              This feature requires a premium subscription to access additional functionality.
            </div>
          </div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Using the composed API for more complex tooltip content and styling.',
      },
    },
  },
};

export const AccessibilityExample = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold text-text-strong">Accessibility Examples</h3>
      <div className="flex gap-4">
        <Tooltip content="Save your current work">
          <Button>Save</Button>
        </Tooltip>
        <Tooltip content="This action cannot be undone">
          <Button variant="destructive">Delete</Button>
        </Tooltip>
        <Tooltip content="Opens in a new window">
          <Button variant="link">External Link</Button>
        </Tooltip>
      </div>
      <div className="text-sm text-text-muted max-w-md">
        <strong>Keyboard navigation:</strong> Tab to focus elements, tooltips appear automatically.
        Press Escape to close a tooltip. Screen readers will announce tooltip content.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including keyboard navigation and screen reader support.',
      },
    },
  },
};
