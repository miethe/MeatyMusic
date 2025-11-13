import type { Meta, StoryObj } from '@storybook/react-vite';
import { CapabilityBadge } from './CapabilityBadge';

const meta: Meta<typeof CapabilityBadge> = {
  title: 'Components/CapabilityBadge',
  component: CapabilityBadge,
  tags: ['autodocs'],
  argTypes: {
    capabilityType: {
      control: 'select',
      options: [
        'function_calling',
        'vision',
        'streaming',
        'json_mode',
        'code_execution',
        'audio',
      ],
      description: 'The capability type to display',
    },
    enabled: {
      control: 'boolean',
      description: 'Whether the capability is enabled',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show the icon',
    },
    variant: {
      control: 'select',
      options: ['default', 'enabled', 'disabled', 'outline'],
      description: 'Visual variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CapabilityBadge>;

/**
 * Default capability badge showing function calling capability
 */
export const Default: Story = {
  args: {
    capabilityType: 'function_calling',
    enabled: true,
  },
};

/**
 * All capability types with enabled state
 */
export const AllCapabilities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CapabilityBadge capabilityType="function_calling" enabled />
      <CapabilityBadge capabilityType="vision" enabled />
      <CapabilityBadge capabilityType="streaming" enabled />
      <CapabilityBadge capabilityType="json_mode" enabled />
      <CapabilityBadge capabilityType="code_execution" enabled />
      <CapabilityBadge capabilityType="audio" enabled />
    </div>
  ),
};

/**
 * All capability types with disabled state
 */
export const AllCapabilitiesDisabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CapabilityBadge capabilityType="function_calling" enabled={false} />
      <CapabilityBadge capabilityType="vision" enabled={false} />
      <CapabilityBadge capabilityType="streaming" enabled={false} />
      <CapabilityBadge capabilityType="json_mode" enabled={false} />
      <CapabilityBadge capabilityType="code_execution" enabled={false} />
      <CapabilityBadge capabilityType="audio" enabled={false} />
    </div>
  ),
};

/**
 * Enabled capability badge with success styling
 */
export const Enabled: Story = {
  args: {
    capabilityType: 'vision',
    enabled: true,
  },
};

/**
 * Disabled capability badge with muted styling
 */
export const Disabled: Story = {
  args: {
    capabilityType: 'vision',
    enabled: false,
  },
};

/**
 * Badge without icon
 */
export const NoIcon: Story = {
  args: {
    capabilityType: 'streaming',
    enabled: true,
    showIcon: false,
  },
};

/**
 * Badge with custom label
 */
export const CustomLabel: Story = {
  args: {
    capabilityType: 'vision',
    enabled: true,
    label: 'Image Analysis',
  },
};

/**
 * Different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <CapabilityBadge capabilityType="function_calling" enabled size="sm" />
      <CapabilityBadge capabilityType="function_calling" enabled size="md" />
      <CapabilityBadge capabilityType="function_calling" enabled size="lg" />
    </div>
  ),
};

/**
 * Different variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CapabilityBadge
        capabilityType="vision"
        variant="default"
        enabled
      />
      <CapabilityBadge
        capabilityType="vision"
        variant="enabled"
        enabled
      />
      <CapabilityBadge
        capabilityType="vision"
        variant="disabled"
        enabled={false}
      />
      <CapabilityBadge
        capabilityType="vision"
        variant="outline"
        enabled
      />
    </div>
  ),
};

/**
 * Unknown capability type (graceful fallback)
 */
export const UnknownCapability: Story = {
  args: {
    capabilityType: 'unknown_capability',
    enabled: true,
  },
};

/**
 * Use case: Model capability list
 */
export const ModelCapabilityList: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">GPT-4 Vision</h3>
        <div className="flex flex-wrap gap-2">
          <CapabilityBadge capabilityType="function_calling" enabled />
          <CapabilityBadge capabilityType="vision" enabled />
          <CapabilityBadge capabilityType="streaming" enabled />
          <CapabilityBadge capabilityType="json_mode" enabled />
          <CapabilityBadge capabilityType="code_execution" enabled={false} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Claude 3 Opus</h3>
        <div className="flex flex-wrap gap-2">
          <CapabilityBadge capabilityType="function_calling" enabled />
          <CapabilityBadge capabilityType="vision" enabled />
          <CapabilityBadge capabilityType="streaming" enabled />
          <CapabilityBadge capabilityType="json_mode" enabled={false} />
          <CapabilityBadge capabilityType="code_execution" enabled={false} />
        </div>
      </div>
    </div>
  ),
};

/**
 * Accessibility test: Keyboard navigation and screen reader
 */
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Test with keyboard navigation and screen reader:
      </p>
      <div className="flex flex-wrap gap-2">
        <CapabilityBadge capabilityType="function_calling" enabled />
        <CapabilityBadge capabilityType="vision" enabled />
        <CapabilityBadge capabilityType="streaming" enabled={false} />
      </div>
      <p className="text-xs text-muted-foreground">
        Each badge should announce its capability type and state (enabled/disabled)
      </p>
    </div>
  ),
};
