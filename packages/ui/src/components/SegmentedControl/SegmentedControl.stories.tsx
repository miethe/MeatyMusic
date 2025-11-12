import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

const mockSegments = [
  { value: 'mine', label: 'Mine' },
  { value: 'team', label: 'Team' },
  { value: 'public', label: 'Public' },
];

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A segmented control component for navigation and selection. Built on Radix Tabs for full accessibility.

**Accessibility Features:**
- Full keyboard navigation (Arrow keys, Home, End, Tab)
- Proper ARIA roles and attributes
- 2px focus ring that meets WCAG contrast requirements
- Screen reader friendly labels with selection state
- Touch-friendly tap targets (44x44px minimum)

**Interactions:**
- Arrow Left/Right: Navigate between segments
- Home: Jump to first segment
- End: Jump to last segment
- Tab: Move focus in/out of control
- Smooth 200ms transitions on all state changes

**Usage Guidelines:**
- Use for 2-5 related options or views
- Keep labels short and clear (1-2 words)
- Provide meaningful aria-label for context
- Active segment shows elevated appearance with shadow
- Disabled segments are grayed out and not selectable

**Design System Integration:**
All colors, spacing, and motion use design tokens from @meaty/tokens for consistent theming across light/dark modes.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'text' },
      description: 'Currently active segment value',
    },
    onValueChange: {
      description: 'Callback when segment changes',
    },
    segments: {
      description: 'Array of segments to display',
    },
    'aria-label': {
      control: { type: 'text' },
      description: 'Accessible label for the control',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the control',
    },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Simple two-segment control for binary choices
 */
export const TwoSegments: Story = {
  render: () => {
    const [value, setValue] = useState('list');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        segments={[
          { value: 'list', label: 'List' },
          { value: 'grid', label: 'Grid' },
        ]}
        aria-label="View mode"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Simple two-segment control for binary choices like view toggles.',
      },
    },
  },
};

/**
 * Three-segment control - the primary use case for Mine/Team/Public navigation
 */
export const ThreeSegments: Story = {
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        segments={[
          { value: 'mine', label: 'Mine' },
          { value: 'team', label: 'Team' },
          { value: 'public', label: 'Public' },
        ]}
        aria-label="Prompt scope filter"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three-segment control for Mine/Team/Public navigation. This is the primary use case for Phase 7 prompts filtering.',
      },
    },
  },
};

/**
 * Four segments showing more complex navigation
 */
export const FourSegments: Story = {
  render: () => {
    const [value, setValue] = useState('all');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        segments={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived' },
        ]}
        aria-label="Status filter"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Four-segment control showing maximum recommended segments.',
      },
    },
  },
};

/**
 * Small size variant
 */
export const SmallSize: Story = {
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        segments={[
          { value: 'mine', label: 'Mine' },
          { value: 'team', label: 'Team' },
          { value: 'public', label: 'Public' },
        ]}
        size="sm"
        aria-label="Prompt scope filter"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size variant for compact layouts. Height: 32px.',
      },
    },
  },
};

/**
 * Medium size variant (default)
 */
export const MediumSize: Story = {
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        segments={[
          { value: 'mine', label: 'Mine' },
          { value: 'team', label: 'Team' },
          { value: 'public', label: 'Public' },
        ]}
        size="md"
        aria-label="Prompt scope filter"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium size variant (default). Height: 40px.',
      },
    },
  },
};

/**
 * Large size variant
 */
export const LargeSize: Story = {
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        segments={[
          { value: 'mine', label: 'Mine' },
          { value: 'team', label: 'Team' },
          { value: 'public', label: 'Public' },
        ]}
        size="lg"
        aria-label="Prompt scope filter"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Large size variant for prominent placements. Height: 48px.',
      },
    },
  },
};

/**
 * Disabled segments
 */
export const WithDisabledSegments: Story = {
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        segments={[
          { value: 'mine', label: 'Mine' },
          { value: 'team', label: 'Team', disabled: true },
          { value: 'public', label: 'Public' },
        ]}
        aria-label="Prompt scope filter"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Some segments can be disabled. Useful for premium features or unavailable options. Disabled segments are grayed out and not selectable.',
      },
    },
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  args: {
    value: 'mine',
    onValueChange: () => {},
    segments: mockSegments,
    'aria-label': 'All sizes',
  },
  render: () => {
    const [valueSm, setValueSm] = useState('mine');
    const [valueMd, setValueMd] = useState('mine');
    const [valueLg, setValueLg] = useState('mine');

    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-strong">Small (h-8)</h3>
          <SegmentedControl
            value={valueSm}
            onValueChange={setValueSm}
            segments={[
              { value: 'mine', label: 'Mine' },
              { value: 'team', label: 'Team' },
              { value: 'public', label: 'Public' },
            ]}
            size="sm"
            aria-label="Small size example"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-strong">
            Medium (h-10, default)
          </h3>
          <SegmentedControl
            value={valueMd}
            onValueChange={setValueMd}
            segments={[
              { value: 'mine', label: 'Mine' },
              { value: 'team', label: 'Team' },
              { value: 'public', label: 'Public' },
            ]}
            size="md"
            aria-label="Medium size example"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-strong">Large (h-12)</h3>
          <SegmentedControl
            value={valueLg}
            onValueChange={setValueLg}
            segments={[
              { value: 'mine', label: 'Mine' },
              { value: 'team', label: 'Team' },
              { value: 'public', label: 'Public' },
            ]}
            size="lg"
            aria-label="Large size example"
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All three size variants compared side by side.',
      },
    },
  },
};

/**
 * Interactive states demonstration
 */
export const InteractiveStates: Story = {
  args: {
    value: 'mine',
    onValueChange: () => {},
    segments: mockSegments,
    'aria-label': 'Interactive states',
  },
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-strong">
            Interactive States
          </h3>
          <SegmentedControl
            value={value}
            onValueChange={setValue}
            segments={[
              { value: 'mine', label: 'Mine' },
              { value: 'team', label: 'Team' },
              { value: 'public', label: 'Public' },
            ]}
            aria-label="Interactive example"
          />
        </div>

        <div className="text-sm text-text-muted space-y-2">
          <p>
            <strong>Try these interactions:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click segments to change selection</li>
            <li>Press Tab to focus, then use Arrow keys to navigate</li>
            <li>Press Home to jump to first segment</li>
            <li>Press End to jump to last segment</li>
            <li>Notice the smooth transitions and active indicator</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-mp-panel rounded-md">
          <h4 className="text-sm font-semibold text-text-strong mb-2">
            State Details
          </h4>
          <ul className="text-sm text-text-muted space-y-1">
            <li>• Active: Elevated with shadow, primary accent bar</li>
            <li>• Hover: Subtle background change, text darkens</li>
            <li>• Focus: 2px ring with proper offset</li>
            <li>• Disabled: 50% opacity, not clickable</li>
            <li>• Transition: 150ms on all state changes</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates all interactive states with instructions for testing keyboard navigation.',
      },
    },
  },
};

/**
 * Accessibility example
 */
export const AccessibilityExample: Story = {
  args: {
    value: 'mine',
    onValueChange: () => {},
    segments: mockSegments,
    'aria-label': 'Accessibility example',
  },
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text-strong">
            Accessibility Features
          </h3>
          <SegmentedControl
            value={value}
            onValueChange={setValue}
            segments={[
              { value: 'mine', label: 'Mine' },
              { value: 'team', label: 'Team', disabled: true },
              { value: 'public', label: 'Public' },
            ]}
            aria-label="Prompt visibility scope"
          />
        </div>

        <div className="p-4 bg-mp-panel rounded-md">
          <h4 className="text-sm font-semibold text-text-strong mb-2">
            Built-in Accessibility
          </h4>
          <ul className="text-sm text-text-muted space-y-1">
            <li>• Proper ARIA roles (tablist, tab)</li>
            <li>• aria-label on root for context</li>
            <li>• aria-selected on active tab</li>
            <li>• Disabled state with proper attributes</li>
            <li>• Keyboard navigation (Arrow, Home, End, Tab)</li>
            <li>• Focus ring meets WCAG AAA contrast (4.5:1+)</li>
            <li>• Touch targets meet 44x44px minimum</li>
            <li>• Screen reader announces selection changes</li>
          </ul>
        </div>

        <div className="p-4 bg-mp-panel rounded-md">
          <h4 className="text-sm font-semibold text-text-strong mb-2">
            Testing with Screen Readers
          </h4>
          <ul className="text-sm text-text-muted space-y-1">
            <li>• VoiceOver (Mac): Cmd+F5 to enable</li>
            <li>• NVDA (Windows): Free open-source reader</li>
            <li>• Control+Option+Right Arrow to navigate</li>
            <li>• Listen for "selected" announcement on active tab</li>
            <li>• Verify disabled state is announced</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive accessibility features including ARIA attributes, keyboard navigation, and screen reader support.',
      },
    },
  },
};

/**
 * Playground for testing
 */
export const Playground: Story = {
  args: {
    value: 'mine',
    onValueChange: () => {},
    segments: [
      { value: 'mine', label: 'Mine' },
      { value: 'team', label: 'Team' },
      { value: 'public', label: 'Public' },
    ],
    'aria-label': 'Prompt scope filter',
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground to test different props and configurations.',
      },
    },
  },
};

/**
 * Mobile viewport test
 */
export const MobileViewport: Story = {
  args: {
    value: 'mine',
    onValueChange: () => {},
    segments: mockSegments,
    'aria-label': 'Mobile viewport',
  },
  render: () => {
    const [value, setValue] = useState('mine');
    return (
      <div className="w-full max-w-[375px] p-4">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-strong">
            Mobile Viewport (375px)
          </h3>
          <SegmentedControl
            value={value}
            onValueChange={setValue}
            segments={[
              { value: 'mine', label: 'Mine' },
              { value: 'team', label: 'Team' },
              { value: 'public', label: 'Public' },
            ]}
            aria-label="Mobile example"
          />
          <p className="text-xs text-text-muted">
            Touch targets are optimized for mobile interaction (44x44px minimum).
            Try tapping on segments to test responsiveness.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile viewport demonstration showing touch-friendly tap targets.',
      },
    },
  },
};
