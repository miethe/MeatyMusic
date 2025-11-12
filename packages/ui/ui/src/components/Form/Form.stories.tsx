import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Form, FormField, FormItem, FormMessage, FormDescription } from './Form';
import { Input } from '../Input';
import { Button } from '../Button';
import { Textarea } from '../Textarea';
import { Mail, Lock, User } from 'lucide-react';

const meta: Meta<typeof FormField> = {
  title: 'Components/Form',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Accessible form components with proper ARIA attributes, error handling, and semantic structure.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicFormField: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Email Address" required>
        <Input type="email" placeholder="Enter your email" icon={<Mail className="h-4 w-4" />} />
      </FormField>
    </div>
  ),
};

export const FormFieldWithError: Story = {
  render: () => (
    <div className="w-80">
      <FormField
        label="Email Address"
        required
        error="Please enter a valid email address."
      >
        <Input
          type="email"
          placeholder="Enter your email"
          defaultValue="invalid-email"
          icon={<Mail className="h-4 w-4" />}
        />
      </FormField>
    </div>
  ),
};

export const FormFieldWithDescription: Story = {
  render: () => (
    <div className="w-80">
      <FormField
        label="Password"
        required
        description="Must be at least 8 characters long with a mix of letters, numbers, and symbols."
      >
        <Input
          type="password"
          placeholder="Enter your password"
          icon={<Lock className="h-4 w-4" />}
        />
      </FormField>
    </div>
  ),
};

export const FormFieldWithTextarea: Story = {
  render: () => (
    <div className="w-80">
      <FormField
        label="Message"
        description="Tell us what you think about our service."
      >
        <Textarea placeholder="Type your message here..." rows={4} />
      </FormField>
    </div>
  ),
};

export const CompleteForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      message: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const newErrors: Record<string, string> = {};

      if (!formData.name.trim()) {
        newErrors.name = 'Name is required.';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address.';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long.';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        console.log('Form submitted:', formData);
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          message: '',
        });
      }
    };

    const handleChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    return (
      <div className="w-96">
        <Form onSubmit={handleSubmit}>
          <FormField
            label="Full Name"
            required
            error={errors.name}
          >
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              icon={<User className="h-4 w-4" />}
            />
          </FormField>

          <FormField
            label="Email Address"
            required
            error={errors.email}
            description="We'll never share your email with anyone else."
          >
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter your email"
              icon={<Mail className="h-4 w-4" />}
            />
          </FormField>

          <FormField
            label="Password"
            required
            error={errors.password}
            description="Must be at least 8 characters long."
          >
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Enter your password"
              icon={<Lock className="h-4 w-4" />}
            />
          </FormField>

          <FormField
            label="Confirm Password"
            required
            error={errors.confirmPassword}
          >
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              icon={<Lock className="h-4 w-4" />}
            />
          </FormField>

          <FormField
            label="Message"
            description="Optional message or comments."
          >
            <Textarea
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Type your message here..."
              rows={3}
            />
          </FormField>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </div>
        </Form>
      </div>
    );
  },
};

export const FormStates: Story = {
  render: () => (
    <div className="w-96 space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Normal State</h3>
        <FormField label="Username" description="Choose a unique username.">
          <Input placeholder="Enter username" />
        </FormField>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Error State</h3>
        <FormField
          label="Username"
          required
          error="This username is already taken."
        >
          <Input placeholder="Enter username" defaultValue="taken_username" />
        </FormField>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Disabled State</h3>
        <FormField label="System ID" description="This field cannot be edited.">
          <Input disabled defaultValue="SYS_12345" />
        </FormField>
      </div>
    </div>
  ),
};

// Accessibility test story
export const AccessibilityTest: Story = {
  render: () => (
    <div className="w-96">
      <Form>
        <FormField
          label="Accessible Input"
          required
          error="This field has an error."
          description="This field demonstrates proper ARIA relationships."
        >
          <Input
            placeholder="Type here to test screen reader announcements"
            aria-describedby="custom-description"
          />
        </FormField>

        <FormItem>
          <label className="text-sm font-medium">
            Manual Label Connection
          </label>
          <Input placeholder="This input is manually connected to its label" />
          <FormDescription>
            This shows how FormItem can be used for custom form layouts.
          </FormDescription>
          <FormMessage>
            Error messages are announced to screen readers.
          </FormMessage>
        </FormItem>

        <Button type="submit">Submit Form</Button>
      </Form>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form with proper ARIA relationships, error announcements, and screen reader support.',
      },
    },
  },
};
