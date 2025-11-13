import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';
import { Search, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Flexible input component with validation states, icons, and enhanced accessibility. Uses MeatyPrompts design tokens for consistent styling.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning'],
      description: 'Visual variant of the input',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'HTML input type',
    },
    error: {
      control: 'boolean',
      description: 'Whether the input has an error state',
    },
    success: {
      control: 'boolean',
      description: 'Whether the input has a success state',
    },
    warning: {
      control: 'boolean',
      description: 'Whether the input has a warning state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    showValidationIcon: {
      control: 'boolean',
      description: 'Whether to show validation icons',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'John Doe',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    helperText: 'We will never share your email with anyone.',
    type: 'email',
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    required: true,
    helperText: 'This field is required',
  },
};

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <Input
        label="Success State"
        placeholder="Valid input"
        defaultValue="john@example.com"
        success
        helperText="Email format is valid!"
      />

      <Input
        label="Error State"
        placeholder="Invalid input"
        defaultValue="invalid-email"
        error
        helperText="Please enter a valid email address."
      />

      <Input
        label="Warning State"
        placeholder="Warning input"
        defaultValue="admin"
        warning
        helperText="This username may already be taken."
      />

      <Input
        label="Default State"
        placeholder="Normal input"
        helperText="Enter your preferred username."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs support success, error, and warning validation states with automatic icons.',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input
        label="Search"
        placeholder="Search..."
        icon={<Search className="h-4 w-4" />}
      />

      <Input
        label="Email"
        type="email"
        placeholder="Enter email"
        icon={<Mail className="h-4 w-4" />}
      />

      <Input
        label="Username"
        placeholder="Enter username"
        icon={<User className="h-4 w-4" />}
        helperText="Choose a unique username"
      />
    </div>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input
        label="Disabled Input"
        disabled
        placeholder="Disabled input"
        defaultValue="Cannot edit this"
        helperText="This field cannot be edited."
      />

      <Input
        label="Disabled with Icon"
        disabled
        placeholder="Disabled"
        icon={<Mail className="h-4 w-4" />}
        defaultValue="locked@example.com"
      />
    </div>
  ),
};

export const PasswordField: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-96 space-y-4">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          icon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none hover:opacity-70 transition-opacity"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          showValidationIcon={false}
          helperText="Must be at least 8 characters"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Password input with toggle visibility functionality.',
      },
    },
  },
};

export const ValidationWithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input
        label="Email with Success"
        type="email"
        icon={<Mail className="h-4 w-4" />}
        defaultValue="valid@example.com"
        success
        helperText="Email verified!"
      />

      <Input
        label="Email with Error"
        type="email"
        icon={<Mail className="h-4 w-4" />}
        defaultValue="invalid-email"
        error
        helperText="Please enter a valid email address."
      />

      <Input
        label="Username with Warning"
        icon={<User className="h-4 w-4" />}
        defaultValue="admin"
        warning
        helperText="This username may already be taken."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Validation states work seamlessly with left icons, showing validation icon on the right.',
      },
    },
  },
};

export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input
        label="Text Input"
        type="text"
        placeholder="Enter text"
      />

      <Input
        label="Email Input"
        type="email"
        placeholder="Enter email"
        icon={<Mail className="h-4 w-4" />}
      />

      <Input
        label="Number Input"
        type="number"
        placeholder="Enter number"
      />

      <Input
        label="Search Input"
        type="search"
        placeholder="Search..."
        icon={<Search className="h-4 w-4" />}
      />

      <Input
        label="Password Input"
        type="password"
        placeholder="Enter password"
        icon={<Lock className="h-4 w-4" />}
      />

      <Input
        label="URL Input"
        type="url"
        placeholder="https://example.com"
      />

      <Input
        label="Telephone Input"
        type="tel"
        placeholder="+1 (555) 123-4567"
      />
    </div>
  ),
};

export const FocusStates: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Input
        label="Default Focus"
        placeholder="Click to see focus ring"
        helperText="Focus ring uses primary color"
      />

      <Input
        label="Success Focus"
        placeholder="Click to see success focus"
        success
        helperText="Focus ring uses success color"
      />

      <Input
        label="Error Focus"
        placeholder="Click to see error focus"
        error
        helperText="Focus ring uses error color"
      />

      <Input
        label="Warning Focus"
        placeholder="Click to see warning focus"
        warning
        helperText="Focus ring uses warning color"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Each validation state has its own focus ring color for clear visual feedback.',
      },
    },
  },
};

// Accessibility test story
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <Input
        label="Accessible Input"
        required
        placeholder="Enter required value"
        helperText="This field is required and includes proper ARIA attributes."
      />

      <Input
        label="Error with ARIA"
        error
        defaultValue="invalid"
        helperText="This field has an error. Screen readers will announce this."
      />

      <Input
        label="Success with ARIA"
        success
        defaultValue="valid@example.com"
        helperText="Valid input confirmed"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Input components include proper ARIA attributes for screen reader compatibility. Error states use role="alert" for immediate feedback.',
      },
    },
  },
};

export const FormExample: Story = {
  render: () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isEmailValid = email.includes('@') && email.includes('.');
    const isPasswordValid = password.length >= 8;

    return (
      <div className="w-96 space-y-4">
        <h3 className="text-lg font-semibold text-[var(--mp-color-text-strong)]">
          Sign In
        </h3>

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          success={!!(email && isEmailValid)}
          error={!!(email && !isEmailValid)}
          helperText={
            email && !isEmailValid
              ? 'Please enter a valid email address.'
              : email && isEmailValid
              ? 'Email format is valid!'
              : 'Enter your email address'
          }
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none hover:opacity-70 transition-opacity"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          showValidationIcon={false}
          error={!!(password && !isPasswordValid)}
          success={!!(password && isPasswordValid)}
          helperText={
            password && !isPasswordValid
              ? 'Password must be at least 8 characters.'
              : password && isPasswordValid
              ? 'Password meets requirements!'
              : 'Must be at least 8 characters'
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete form example with real-time validation feedback.',
      },
    },
  },
};
