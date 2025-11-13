import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Chip } from './Chip';

const meta = {
  title: 'Components/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A selectable chip component designed for tag filtering interfaces. Built with accessibility in mind and supports keyboard navigation.

**Accessibility Features:**
- Full keyboard navigation (Space/Enter to toggle)
- Proper ARIA attributes (role="button", aria-pressed, aria-disabled)
- Screen reader friendly with count announcements
- 2px focus ring that meets WCAG contrast requirements
- Proper tab order and focus management

**Usage Guidelines:**
- Use for tag filtering and multi-select scenarios
- \`count\` prop displays the number of items with that tag
- \`isPopular\` shows a star icon for trending tags
- \`selected\` state shows checkmark and primary styling
- \`disabled\` state prevents interaction and reduces opacity

**Design System Integration:**
All colors, spacing, and interactions use design tokens from @meaty/tokens for consistent theming.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg'],
    },
    selected: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    isPopular: {
      control: { type: 'boolean' },
    },
    count: {
      control: { type: 'number' },
    },
  },
  args: {
    onClick: fn(),
    children: 'javascript',
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'javascript',
  },
};

export const WithCount: Story = {
  args: {
    children: 'react',
    count: 42,
  },
};

export const Selected: Story = {
  args: {
    children: 'typescript',
    count: 28,
    selected: true,
  },
};

export const Popular: Story = {
  args: {
    children: 'nextjs',
    count: 156,
    isPopular: true,
  },
};

export const PopularSelected: Story = {
  args: {
    children: 'ai',
    count: 1234,
    isPopular: true,
    selected: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'deprecated-tag',
    count: 5,
    disabled: true,
  },
};

export const DisabledSelected: Story = {
  args: {
    children: 'legacy',
    count: 12,
    selected: true,
    disabled: true,
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'vue',
    count: 67,
  },
};

export const OutlineSelected: Story = {
  args: {
    variant: 'outline',
    children: 'angular',
    count: 34,
    selected: true,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'css',
    count: 89,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'python',
    count: 201,
  },
};

export const LongText: Story = {
  args: {
    children: 'machine-learning-algorithms',
    count: 45,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chips with long text will truncate gracefully to prevent layout issues.',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" count={12}>Small</Chip>
        <Chip size="default" count={34}>Default</Chip>
        <Chip size="lg" count={56}>Large</Chip>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" selected count={12}>Small Selected</Chip>
        <Chip size="default" selected count={34}>Default Selected</Chip>
        <Chip size="lg" selected count={56}>Large Selected</Chip>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All chip sizes demonstrated in both default and selected states.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Chip variant="default" count={42}>Default</Chip>
        <Chip variant="outline" count={28}>Outline</Chip>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip variant="default" selected count={42}>Default Selected</Chip>
        <Chip variant="outline" selected count={28}>Outline Selected</Chip>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip variant="default" isPopular count={156}>Popular Default</Chip>
        <Chip variant="outline" isPopular count={89}>Popular Outline</Chip>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All chip variants in different states including popular tags.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selectedTags, setSelectedTags] = useState<string[]>(['javascript']);

    const tags = [
      { name: 'javascript', count: 1247, isPopular: true },
      { name: 'typescript', count: 892 },
      { name: 'react', count: 756, isPopular: true },
      { name: 'nextjs', count: 445 },
      { name: 'tailwind', count: 334 },
      { name: 'nodejs', count: 623, isPopular: true },
      { name: 'python', count: 1089 },
      { name: 'ai', count: 445, isPopular: true },
    ];

    const toggleTag = (tagName: string) => {
      setSelectedTags(prev =>
        prev.includes(tagName)
          ? prev.filter(tag => tag !== tagName)
          : [...prev, tagName]
      );
    };

    return (
      <div className="flex flex-col gap-4 max-w-lg">
        <h3 className="text-lg font-semibold text-text-strong">Filter by Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Chip
              key={tag.name}
              count={tag.count}
              isPopular={tag.isPopular}
              selected={selectedTags.includes(tag.name)}
              onClick={() => toggleTag(tag.name)}
            >
              {tag.name}
            </Chip>
          ))}
        </div>
        <div className="text-sm text-text-muted">
          Selected: {selectedTags.length > 0 ? selectedTags.join(', ') : 'None'}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing how chips work in a tag filtering scenario. Click chips to select/deselect them.',
      },
    },
  },
};

export const AccessibilityExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold text-text-strong">Accessibility Examples</h3>
      <div className="flex flex-wrap gap-2">
        <Chip count={45} aria-label="JavaScript programming language tag with 45 items">
          javascript
        </Chip>
        <Chip
          selected
          count={28}
          aria-describedby="react-description"
        >
          react
        </Chip>
        <Chip
          isPopular
          count={156}
          aria-label="Popular Next.js framework tag with 156 items"
        >
          nextjs
        </Chip>
        <Chip
          disabled
          count={5}
          aria-label="Deprecated tag, unavailable for selection"
        >
          deprecated
        </Chip>
      </div>
      <p id="react-description" className="text-sm text-text-muted">
        React library tag - currently selected
      </p>
      <div className="text-sm text-text-muted">
        <strong>Keyboard navigation:</strong> Use Tab to navigate between chips, Space or Enter to toggle selection
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including ARIA labels, descriptions, and keyboard navigation support.',
      },
    },
  },
};

export const StateVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h4 className="font-medium text-text-strong">Default State</h4>
        <div className="flex gap-2">
          <Chip count={42}>Normal</Chip>
          <Chip isPopular count={156}>Popular</Chip>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-medium text-text-strong">Selected State</h4>
        <div className="flex gap-2">
          <Chip selected count={42}>Selected</Chip>
          <Chip selected isPopular count={156}>Popular Selected</Chip>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-medium text-text-strong">Disabled State</h4>
        <div className="flex gap-2">
          <Chip disabled count={42}>Disabled</Chip>
          <Chip disabled selected count={156}>Disabled Selected</Chip>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All possible states of the chip component organized by category.',
      },
    },
  },
};
