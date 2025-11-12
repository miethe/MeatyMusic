import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An accessible checkbox component built on Radix UI primitives with support for labels, descriptions, validation states, and smooth transitions using MeatyPrompts design tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning'],
      description: 'Visual variant of the checkbox',
    },
    error: {
      control: 'boolean',
      description: 'Whether the checkbox has an error state',
    },
    success: {
      control: 'boolean',
      description: 'Whether the checkbox has a success state',
    },
    warning: {
      control: 'boolean',
      description: 'Whether the checkbox has a warning state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    checked: {
      control: 'boolean',
      description: 'Controlled checked state',
    },
    label: {
      control: 'text',
      description: 'Label text to display next to the checkbox',
    },
    description: {
      control: 'text',
      description: 'Description text to display below the label',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const WithLabelAndDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive emails about new products, features, and more.',
  },
};

export const Checked: Story = {
  args: {
    label: 'Selected option',
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Indeterminate state',
    description: 'Shows a dash when partially selected',
    checked: 'indeterminate',
  },
  parameters: {
    docs: {
      description: {
        story: 'The indeterminate state is useful for parent checkboxes when only some child items are selected. Click to see the smooth animation between states.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    checked: true,
    disabled: true,
  },
};

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <Checkbox
        label="Success State"
        description="This option has been validated successfully"
        success
        defaultChecked
      />

      <Checkbox
        label="Error State"
        description="This option is required but not selected"
        error
      />

      <Checkbox
        label="Warning State"
        description="This option may affect your settings"
        warning
        defaultChecked
      />

      <Checkbox
        label="Default State"
        description="Normal checkbox without validation state"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Checkboxes support success, error, and warning validation states with color-coded borders and focus rings.',
      },
    },
  },
};

export const MultipleCheckboxes: Story = {
  render: () => (
    <div className="space-y-4">
      <Checkbox label="Option 1" defaultChecked />
      <Checkbox label="Option 2" />
      <Checkbox label="Option 3" defaultChecked />
      <Checkbox label="Option 4 (disabled)" disabled />
    </div>
  ),
};

export const FilterExample: Story = {
  render: () => (
    <div className="space-y-4 p-4 border border-[var(--mp-color-border)] rounded-sm bg-[var(--mp-color-surface)]">
      <h3 className="text-sm font-semibold text-[var(--mp-color-text-strong)] mb-2">Status Filters</h3>
      <div className="space-y-3">
        <Checkbox label="Archived" />
        <Checkbox label="Favorites" defaultChecked />
        <Checkbox label="Draft" />
        <Checkbox label="Published" defaultChecked />
      </div>
    </div>
  ),
};

export const FormValidationExample: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div>
        <h3 className="text-lg font-semibold text-[var(--mp-color-text-strong)] mb-4">
          Account Settings
        </h3>
        <div className="space-y-4">
          <Checkbox
            label="I agree to the terms and conditions"
            description="You must accept the terms to continue"
            error
          />

          <Checkbox
            label="Enable two-factor authentication"
            description="Recommended for enhanced security"
            success
            defaultChecked
          />

          <Checkbox
            label="Receive marketing emails"
            description="This may result in frequent notifications"
            warning
            defaultChecked
          />

          <Checkbox
            label="Keep me logged in"
            description="Not recommended on shared devices"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete form example showing checkboxes with different validation states in context.',
      },
    },
  },
};

export const FocusStates: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Checkbox
        label="Default Focus"
        description="Tab to see default focus ring"
      />

      <Checkbox
        label="Success Focus"
        description="Tab to see success focus ring"
        success
      />

      <Checkbox
        label="Error Focus"
        description="Tab to see error focus ring"
        error
      />

      <Checkbox
        label="Warning Focus"
        description="Tab to see warning focus ring"
        warning
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Each validation state has its own focus ring color for clear keyboard navigation feedback.',
      },
    },
  },
};

export const AnimationStates: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[var(--mp-color-text-strong)]">
          Interactive Animation Demo
        </h4>
        <p className="text-xs text-[var(--mp-color-text-muted)]">
          Click to see the smooth pop animation (70ms with spring easing)
        </p>
      </div>

      <Checkbox
        label="Check Mark Pop Effect"
        description="Notice the 0 → 110% → 100% scale animation when toggling"
      />

      <Checkbox
        label="Hover State Demonstration"
        description="Hover to see border color shift and brightness increase with shadow"
      />

      <Checkbox
        label="Indeterminate Animation"
        description="The dash icon has the same pop effect as the checkmark"
        checked="indeterminate"
      />

      <Checkbox
        label="Label Hover Effect"
        description="Hover over the label text to see subtle color change"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of all animation enhancements including the checkmark pop effect (70ms micro-duration), hover states with border shifts and shadows, and label interactions. All animations respect prefers-reduced-motion.',
      },
    },
  },
};

export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Checkbox
        label="Accessible Checkbox"
        description="Includes proper ARIA attributes and keyboard navigation"
      />

      <Checkbox
        label="Required Field"
        description="Screen readers will announce this as required"
        error
      />

      <Checkbox
        label="Verified Option"
        description="Successfully validated"
        success
        defaultChecked
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Checkbox components include proper ARIA attributes and keyboard navigation for screen reader compatibility.',
      },
    },
  },
};
