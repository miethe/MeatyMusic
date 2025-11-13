import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Flexible card component with variants for different visual styles and semantic slots for content organization. Features enhanced hover states and interactive mode for clickable cards.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'bordered', 'ghost', 'interactive'],
      description: 'Visual variant of the card',
    },
    focusable: {
      control: 'boolean',
      description: 'Whether the card can be focused via keyboard navigation',
    },
    interactive: {
      control: 'boolean',
      description: 'Enable interactive mode with enhanced hover states for clickable cards',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Elevated: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>
          This card has a shadow and elevated appearance, perfect for important content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This could be any type of content like text, images, or other components.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The elevated variant features subtle shadow and hover effects. Hover to see the elevation increase and border color shift.',
      },
    },
  },
};

export const Bordered: Story = {
  args: {
    variant: 'bordered',
  },
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>Bordered Card</CardTitle>
        <CardDescription>
          This card has a subtle border with minimal elevation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Perfect for content that needs structure without being too prominent.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Action</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The bordered variant adds a subtle shadow on hover and the border shifts to the primary color.',
      },
    },
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>Ghost Card</CardTitle>
        <CardDescription>
          This card has no background or border, blending with the surrounding content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Ideal for subtle content grouping without visual separation.</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Action</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The ghost variant shows a subtle background on hover, maintaining a minimal appearance.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
  },
  render: (args) => (
    <Card {...args} className="w-96" onClick={() => alert('Card clicked!')}>
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>
          This card is optimized for click interactions with enhanced hover states.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Hover over this card to see the dramatic lift effect. Click to trigger the action.</p>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-text-muted">Click anywhere on the card</div>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The interactive variant features enhanced hover states with a larger lift, border color change, and cursor pointer. Perfect for clickable cards.',
      },
    },
  },
};

export const SimpleCard: Story = {
  args: {
    variant: 'elevated',
  },
  render: (args) => (
    <Card {...args} className="w-96 p-6">
      <h3 className="text-lg font-semibold mb-2">Simple Card</h3>
      <p>A card without using the semantic components, just using the base Card.</p>
    </Card>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-6 flex-wrap">
      <Card variant="elevated" className="w-64">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Shadow and elevation</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hover to see enhanced shadow</p>
        </CardContent>
      </Card>

      <Card variant="bordered" className="w-64">
        <CardHeader>
          <CardTitle>Bordered</CardTitle>
          <CardDescription>Subtle border style</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hover to see border shift</p>
        </CardContent>
      </Card>

      <Card variant="ghost" className="w-64">
        <CardHeader>
          <CardTitle>Ghost</CardTitle>
          <CardDescription>Transparent background</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hover to see background</p>
        </CardContent>
      </Card>

      <Card interactive className="w-64" onClick={() => console.log('Interactive card clicked')}>
        <CardHeader>
          <CardTitle>Interactive</CardTitle>
          <CardDescription>Clickable card</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hover to see lift effect</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All card variants side by side. Hover over each to see their unique hover states.',
      },
    },
  },
};

export const GroupHoverEffects: Story = {
  render: () => (
    <div className="space-y-6">
      <Card interactive className="w-96">
        <CardHeader>
          <CardTitle>Product Card</CardTitle>
          <CardDescription>
            Notice how the title changes to primary color on hover
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This demonstrates the group-hover effects. When you hover over the card, the title color shifts to primary, the header border becomes more visible, and the footer border appears.</p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm">Learn More</Button>
          <Button variant="outline" size="sm">Details</Button>
        </CardFooter>
      </Card>

      <Card variant="bordered" className="w-96">
        <CardHeader>
          <CardTitle>Feature Highlight</CardTitle>
          <CardDescription>
            Group hover effects work on all variants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Even non-interactive cards benefit from the enhanced hover states. The sub-components respond to the parent card hover state.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates group-hover effects where card sub-components (title, description, header, footer) respond to the parent card hover state.',
      },
    },
  },
};

export const FocusableCard: Story = {
  args: {
    focusable: true,
    variant: 'elevated',
  },
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>Focusable Card</CardTitle>
        <CardDescription>
          This card can be focused with keyboard navigation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Press Tab to focus this card. You'll see a focus ring appear around it.</p>
      </CardContent>
      <CardFooter>
        <Button>Primary Action</Button>
        <Button variant="outline">Secondary</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with focusable prop enabled. Use Tab key to focus the card and see the focus ring.',
      },
    },
  },
};

// Accessibility test story
export const AccessibilityTest: Story = {
  args: {
    interactive: true,
  },
  render: (args) => (
    <Card {...args} className="w-96" role="article">
      <CardHeader>
        <CardTitle>Accessible Card</CardTitle>
        <CardDescription>
          This card includes proper ARIA attributes and keyboard navigation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Interactive cards are automatically focusable and include proper keyboard support. Press Enter or Space to activate.</p>
      </CardContent>
      <CardFooter>
        <Button>Primary Action</Button>
        <Button variant="outline">Secondary</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Card with proper accessibility attributes for screen readers and keyboard navigation. Interactive cards are automatically focusable.',
      },
    },
  },
};

export const NestedCards: Story = {
  render: () => (
    <Card variant="elevated" className="w-[600px]">
      <CardHeader>
        <CardTitle>Parent Card</CardTitle>
        <CardDescription>
          Cards can be nested with cascading hover effects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="mb-4">This demonstrates nested cards with individual hover states:</p>

        <Card variant="bordered" className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Nested Card 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">This card has its own hover state independent of the parent.</p>
          </CardContent>
        </Card>

        <Card variant="bordered" className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Nested Card 2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Hover states work correctly even when cards are nested.</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how cards can be nested while maintaining independent hover states.',
      },
    },
  },
};

export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Testing Reduced Motion:</strong> Enable "Reduce motion" in your system preferences to test.
          Transforms and transitions will be disabled while maintaining functionality.
        </p>
      </div>

      <Card interactive className="w-96">
        <CardHeader>
          <CardTitle>Reduced Motion Test</CardTitle>
          <CardDescription>
            Respects prefers-reduced-motion setting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>With reduced motion enabled, the card will not animate on hover, but all interactive states remain functional.</p>
        </CardContent>
        <CardFooter>
          <Button>Test Interaction</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Test card with reduced motion preferences. The card respects system settings for accessibility.',
      },
    },
  },
};
