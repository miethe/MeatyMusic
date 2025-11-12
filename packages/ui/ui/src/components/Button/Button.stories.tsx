import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Play, Edit, GitFork, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A versatile button component with multiple variants, sizes, and states. Built on Radix Slot for composition patterns.

**Accessibility Features:**
- Full keyboard navigation support
- 2px focus ring that meets WCAG contrast requirements
- Proper ARIA attributes for disabled states
- Screen reader friendly text
- Loading state with aria-busy

**Polish & Interactions:**
- Enhanced hover states with elevation and transforms (size-specific)
- Active/press feedback with 98% scale
- Icon buttons with scale-on-hover effect
- Smooth loading state with spinner
- Respects prefers-reduced-motion

**Usage Guidelines:**
- Use \`default\` (primary) for primary actions
- Use \`secondary\` for secondary actions with teal accent
- Use \`success\` for positive confirmations (save, create, confirm)
- Use \`warning\` for cautionary actions
- Use \`danger\`/\`destructive\` for destructive actions (delete, remove)
- Use \`premium\` for paid/upgrade actions with gradient styling
- Use \`outline\` for tertiary actions
- Use \`ghost\` for subtle actions
- Use \`link\` for navigation-style actions
- Use \`asChild\` prop to render as different element (e.g., Next.js Link)

**Design System Integration:**
All colors and spacing use design tokens from @meaty/tokens for consistent theming.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'success', 'warning', 'danger', 'destructive', 'premium', 'outline', 'ghost', 'link'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size of the button',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Render as child element (for composition)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disabled state',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Loading state with spinner',
    },
    loadingText: {
      control: { type: 'text' },
      description: 'Text to display when loading',
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary button with teal accent color. Use for secondary actions that complement the primary action.',
      },
    },
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: (
      <>
        <CheckCircle className="h-4 w-4" />
        Confirm
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Success button for positive actions like saving, confirming, or creating. Uses green semantic color.',
      },
    },
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: (
      <>
        <AlertTriangle className="h-4 w-4" />
        Proceed with Caution
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning button for actions that require user attention. Uses orange/amber semantic color.',
      },
    },
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: (
      <>
        <XCircle className="h-4 w-4" />
        Delete
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Danger button for destructive actions like deleting or removing. Uses red semantic color.',
      },
    },
  },
};

export const Premium: Story = {
  args: {
    variant: 'premium',
    children: 'Upgrade to Premium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Premium button with gradient styling for paid features or upgrade prompts.',
      },
    },
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
  parameters: {
    docs: {
      description: {
        story: 'Destructive variant (alias for danger). Use for delete/remove actions.',
      },
    },
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
  parameters: {
    docs: {
      description: {
        story: 'Outline button for tertiary actions with subtle styling.',
      },
    },
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ghost button with minimal styling, shows background on hover.',
      },
    },
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link-styled button for navigation actions.',
      },
    },
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Play className="h-4 w-4" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon-only button with enhanced hover effect. Icons scale to 105% on hover.',
      },
    },
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Edit className="h-4 w-4" />
        Edit
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with 60% opacity and not-allowed cursor. No hover effects.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    children: 'Submit',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinning icon. Button becomes disabled, content fades to 70% opacity.',
      },
    },
  },
};

export const LoadingWithCustomText: Story = {
  args: {
    children: 'Save Changes',
    loading: true,
    loadingText: 'Saving...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with custom loading text.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-strong">Color Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="premium">Premium</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-strong">Style Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-strong">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <GitFork className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-strong">States</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants, styles, sizes, and states demonstrated together.',
      },
    },
  },
};

export const SemanticActions: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 max-w-md">
      <h3 className="text-lg font-semibold text-text-strong">Semantic Action Examples</h3>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-text-muted mb-2">Positive Action</p>
          <Button variant="success" className="w-full">
            <CheckCircle className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div>
          <p className="text-sm text-text-muted mb-2">Cautionary Action</p>
          <Button variant="warning" className="w-full">
            <AlertTriangle className="h-4 w-4" />
            Proceed Anyway
          </Button>
        </div>

        <div>
          <p className="text-sm text-text-muted mb-2">Destructive Action</p>
          <Button variant="danger" className="w-full">
            <XCircle className="h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of semantic button variants used for common action types.',
      },
    },
  },
};

export const InteractiveStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold text-text-strong">Interactive States</h3>
      <div className="flex gap-2">
        <Button>Normal</Button>
        <Button className="hover:bg-primary/90">Hover (simulate)</Button>
        <Button className="focus:ring-2 focus:ring-ring">Focus (simulate)</Button>
        <Button disabled>Disabled</Button>
      </div>
      <p className="text-sm text-text-muted">
        Hover and focus over buttons to see state changes. Focus visible with keyboard navigation.
      </p>
      <div className="mt-4 p-4 bg-panel rounded-md">
        <h4 className="text-sm font-semibold text-text-strong mb-2">Enhanced Interactions</h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Small buttons: -0.5px translateY on hover</li>
          <li>• Default/Large: -1px translateY on hover</li>
          <li>• All buttons: 98% scale on press</li>
          <li>• Icon buttons: 105% icon scale on hover</li>
          <li>• Transition: 150ms ease-out</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive states including hover, focus, and disabled states with enhanced micro-interactions.',
      },
    },
  },
};

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold text-text-strong">Loading States</h3>
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <Button loading>Default Loading</Button>
          <Button variant="secondary" loading>Secondary</Button>
          <Button variant="success" loading>Success</Button>
          <Button variant="danger" loading>Danger</Button>
        </div>
        <div className="flex gap-2 items-center">
          <Button size="sm" loading>Small</Button>
          <Button size="lg" loading>Large</Button>
        </div>
        <div className="flex gap-2 items-center">
          <Button loading loadingText="Saving...">Save</Button>
          <Button variant="premium" loading loadingText="Processing...">Submit</Button>
        </div>
      </div>
      <p className="text-sm text-text-muted">
        Loading state with spinner animation. Content fades to 70% opacity, button is disabled.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading states across different variants and sizes.',
      },
    },
  },
};

export const AccessibilityExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold text-text-strong">Accessibility Examples</h3>
      <div className="flex flex-wrap gap-2">
        <Button aria-label="Save document">
          <Edit className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="danger" aria-describedby="delete-warning">
          Delete Item
        </Button>
        <Button size="icon" aria-label="Play video">
          <Play className="h-4 w-4" />
        </Button>
      </div>
      <p id="delete-warning" className="text-sm text-text-muted">
        This action cannot be undone
      </p>
      <div className="text-sm text-text-muted">
        <strong>Keyboard navigation:</strong> Use Tab to navigate, Enter/Space to activate
      </div>
      <div className="mt-4 p-4 bg-panel rounded-md">
        <h4 className="text-sm font-semibold text-text-strong mb-2">Accessibility Features</h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• 2px focus ring with proper offset</li>
          <li>• Ring color matches button variant</li>
          <li>• Loading state includes aria-busy</li>
          <li>• Respects prefers-reduced-motion</li>
          <li>• Disabled state with not-allowed cursor</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including ARIA labels, descriptions, keyboard navigation, and motion preferences.',
      },
    },
  },
};
