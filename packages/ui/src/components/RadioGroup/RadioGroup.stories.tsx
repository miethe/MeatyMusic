import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from './RadioGroup';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.

**Accessibility Features:**
- Full keyboard navigation support (arrow keys, tab navigation)
- Screen reader support with proper ARIA roles and states
- Focus management and visual focus indicators
- Proper grouping semantics for screen readers
- WCAG 2.1 AA compliant focus rings and color contrast

**Usage Guidelines:**
- Use for mutually exclusive choices (only one can be selected)
- Group related options together logically
- Provide clear labels for each option
- Consider default selection for better UX
- Use built-in label and description support

**Design System Integration:**
All colors, spacing, and focus states use design tokens from @meaty/tokens for consistent theming and validation states.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'text' },
    },
    defaultValue: {
      control: { type: 'text' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
    },
  },
  args: {
    onValueChange: fn(),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: 'option1',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="option1" label="Option 1" />
      <RadioGroupItem value="option2" label="Option 2" />
      <RadioGroupItem value="option3" label="Option 3" />
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  args: {
    defaultValue: 'free',
  },
  render: (args) => (
    <RadioGroup {...args} className="space-y-4">
      <RadioGroupItem
        value="free"
        label="Free Plan"
        description="Basic features for personal use"
      />
      <RadioGroupItem
        value="pro"
        label="Pro Plan"
        description="Advanced features for professionals"
      />
      <RadioGroupItem
        value="team"
        label="Team Plan"
        description="Collaboration features for teams"
      />
    </RadioGroup>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-8 w-96">
      <div>
        <h4 className="text-sm font-semibold text-[var(--mp-color-text-strong)] mb-3">Success State</h4>
        <RadioGroup defaultValue="correct">
          <RadioGroupItem
            value="correct"
            label="Correct Answer"
            description="This option is verified"
            success
          />
          <RadioGroupItem
            value="other"
            label="Other Option"
            success
          />
        </RadioGroup>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[var(--mp-color-text-strong)] mb-3">Error State</h4>
        <RadioGroup defaultValue="invalid">
          <RadioGroupItem
            value="invalid"
            label="Invalid Selection"
            description="This option is not allowed"
            error
          />
          <RadioGroupItem
            value="valid"
            label="Valid Option"
            error
          />
        </RadioGroup>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[var(--mp-color-text-strong)] mb-3">Warning State</h4>
        <RadioGroup defaultValue="risky">
          <RadioGroupItem
            value="risky"
            label="Risky Option"
            description="This may have consequences"
            warning
          />
          <RadioGroupItem
            value="safe"
            label="Safe Option"
            warning
          />
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio buttons support success, error, and warning validation states with color-coded borders and focus rings.',
      },
    },
  },
};

export const Horizontal: Story = {
  args: {
    defaultValue: 'small',
    className: 'flex-row gap-6',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="small" label="Small" />
      <RadioGroupItem value="medium" label="Medium" />
      <RadioGroupItem value="large" label="Large" />
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  args: {
    defaultValue: 'enabled',
    disabled: true,
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="enabled" label="Enabled option" />
      <RadioGroupItem value="disabled" label="Disabled option" />
    </RadioGroup>
  ),
};

export const IndividualDisabled: Story = {
  args: {
    defaultValue: 'option1',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem value="option1" label="Available option" />
      <RadioGroupItem
        value="option2"
        label="Disabled option"
        description="This option is not available"
        disabled
      />
      <RadioGroupItem value="option3" label="Another available option" />
    </RadioGroup>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('option1');

    return (
      <div className="space-y-4">
        <RadioGroup value={value} onValueChange={setValue}>
          <RadioGroupItem value="option1" label="Option 1" />
          <RadioGroupItem value="option2" label="Option 2" />
          <RadioGroupItem value="option3" label="Option 3" />
        </RadioGroup>
        <div className="text-sm text-[var(--mp-color-text-muted)]">
          Selected: <span className="font-medium text-[var(--mp-color-text-base)]">{value}</span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A controlled RadioGroup component that shows the selected value.',
      },
    },
  },
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-6 max-w-md">
      <div className="space-y-3">
        <label className="text-base font-medium text-[var(--mp-color-text-strong)]">
          Notification Preferences
        </label>
        <RadioGroup defaultValue="email" name="notifications">
          <RadioGroupItem
            value="email"
            label="Email notifications"
            description="Receive updates via email"
          />
          <RadioGroupItem
            value="push"
            label="Push notifications"
            description="Get instant alerts on your device"
          />
          <RadioGroupItem
            value="none"
            label="No notifications"
            description="Opt out of all notifications"
          />
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <label className="text-base font-medium text-[var(--mp-color-text-strong)]">
          Theme Preference
        </label>
        <RadioGroup defaultValue="system" name="theme" className="flex-row gap-6">
          <RadioGroupItem value="light" label="Light" />
          <RadioGroupItem value="dark" label="Dark" />
          <RadioGroupItem value="system" label="System" />
        </RadioGroup>
      </div>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of using RadioGroup in a form with multiple groups.',
      },
    },
  },
};

export const FocusStates: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div>
        <h4 className="text-sm font-semibold text-[var(--mp-color-text-strong)] mb-3">Default Focus</h4>
        <RadioGroup defaultValue="option1">
          <RadioGroupItem
            value="option1"
            label="Option 1"
            description="Tab to see default focus ring"
          />
          <RadioGroupItem value="option2" label="Option 2" />
        </RadioGroup>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[var(--mp-color-text-strong)] mb-3">Success Focus</h4>
        <RadioGroup defaultValue="option1">
          <RadioGroupItem
            value="option1"
            label="Success Option"
            description="Tab to see success focus ring"
            success
          />
          <RadioGroupItem value="option2" label="Other Option" success />
        </RadioGroup>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[var(--mp-color-text-strong)] mb-3">Error Focus</h4>
        <RadioGroup defaultValue="option1">
          <RadioGroupItem
            value="option1"
            label="Error Option"
            description="Tab to see error focus ring"
            error
          />
          <RadioGroupItem value="option2" label="Other Option" error />
        </RadioGroup>
      </div>
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

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--mp-color-text-strong)] mb-4">Accessibility Features</h3>
        <RadioGroup defaultValue="high" aria-label="Priority level">
          <RadioGroupItem
            value="low"
            label="Low Priority"
            description="For non-urgent items"
          />
          <RadioGroupItem
            value="medium"
            label="Medium Priority"
            description="For standard items"
          />
          <RadioGroupItem
            value="high"
            label="High Priority"
            description="For urgent items"
          />
        </RadioGroup>
      </div>

      <div className="text-sm text-[var(--mp-color-text-muted)] space-y-1">
        <div className="font-semibold text-[var(--mp-color-text-base)]">Keyboard navigation:</div>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Tab to enter/exit the group</li>
          <li>Arrow keys to navigate between options</li>
          <li>Space to select an option</li>
        </ul>
        <div className="mt-2 font-semibold text-[var(--mp-color-text-base)]">
          Screen reader support: Proper ARIA roles and labels
        </div>
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

export const CompleteFormValidation: Story = {
  render: () => {
    const [shippingMethod, setShippingMethod] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('credit');

    const shippingError = shippingMethod === '';

    return (
      <div className="space-y-8 w-96">
        <h3 className="text-lg font-semibold text-[var(--mp-color-text-strong)]">
          Checkout Form
        </h3>

        <div className="space-y-3">
          <label className="text-base font-medium text-[var(--mp-color-text-strong)]">
            Shipping Method <span className="text-[var(--mp-color-danger)]">*</span>
          </label>
          <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
            <RadioGroupItem
              value="standard"
              label="Standard Shipping"
              description="5-7 business days - Free"
              error={shippingError}
            />
            <RadioGroupItem
              value="express"
              label="Express Shipping"
              description="2-3 business days - $9.99"
              error={shippingError}
            />
            <RadioGroupItem
              value="overnight"
              label="Overnight Shipping"
              description="Next business day - $24.99"
              error={shippingError}
            />
          </RadioGroup>
          {shippingError && (
            <p className="text-sm text-[var(--mp-color-danger)]">
              Please select a shipping method
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium text-[var(--mp-color-text-strong)]">
            Payment Method
          </label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <RadioGroupItem
              value="credit"
              label="Credit Card"
              description="Visa, Mastercard, Amex"
              success={paymentMethod === 'credit'}
            />
            <RadioGroupItem
              value="paypal"
              label="PayPal"
              description="Pay with your PayPal account"
              success={paymentMethod === 'paypal'}
            />
            <RadioGroupItem
              value="crypto"
              label="Cryptocurrency"
              description="Bitcoin, Ethereum"
              warning={paymentMethod === 'crypto'}
            />
          </RadioGroup>
          {paymentMethod === 'crypto' && (
            <p className="text-sm text-[var(--mp-color-warning)]">
              Crypto payments may take longer to process
            </p>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete form example with validation states, required fields, and real-time feedback.',
      },
    },
  },
};
