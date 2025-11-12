import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusComplication, OnlineStatus, OfflineStatus, PendingStatus, ErrorStatus, SuccessStatus, WarningStatus } from './StatusComplication';
import type { ComplicationProps } from '../types';

const meta = {
  title: 'Components/PromptCard/Complications/StatusComplication',
  component: StatusComplication,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A status indicator complication that displays different states with colored dots and text. Perfect for showing operational status, health indicators, or state information with customizable animations and variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['online', 'offline', 'pending', 'error', 'success', 'warning', 'info', 'disabled'],
      description: 'Status variant that determines color and behavior',
    },
    text: {
      control: { type: 'text' },
      description: 'Optional custom text (will use default text if not provided)',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md'],
      description: 'Size variant',
    },
    pulse: {
      control: { type: 'boolean' },
      description: 'Whether to show a pulse animation for active states',
    },
    dotOnly: {
      control: { type: 'boolean' },
      description: 'Whether to show only the dot without text',
    },
    icon: {
      control: { type: 'text' },
      description: 'Custom icon (emoji or short text)',
    },
    cardSize: {
      control: { type: 'select' },
      options: ['compact', 'standard', 'xl'],
    },
    cardState: {
      control: { type: 'select' },
      options: ['default', 'running', 'error', 'disabled', 'selected'],
    },
    slot: {
      control: { type: 'select' },
      options: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'edgeLeft', 'edgeRight', 'footer'],
    },
  },
} satisfies Meta<typeof StatusComplication>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock complication props
const mockComplicationProps: Omit<ComplicationProps, keyof typeof StatusComplication> = {
  cardId: 'demo-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Demo Card',
  isFocused: false,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
  slot: 'topLeft',
  isVisible: true,
};

export const Default: Story = {
  args: {
    ...mockComplicationProps,
    status: 'online',
    text: 'Online',
  },
};

export const WithPulse: Story = {
  args: {
    ...mockComplicationProps,
    status: 'pending',
    text: 'Processing',
    pulse: true,
  },
};

export const DotOnly: Story = {
  args: {
    ...mockComplicationProps,
    status: 'success',
    dotOnly: true,
  },
};

export const WithIcon: Story = {
  args: {
    ...mockComplicationProps,
    status: 'error',
    text: 'Failed',
    icon: '⚠',
    pulse: true,
  },
};

// ============================================================================
// ALL STATUS VARIANTS
// ============================================================================

export const AllStatusVariants = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      {([
        { status: 'online', description: 'Active/connected state' },
        { status: 'offline', description: 'Inactive/disconnected state' },
        { status: 'pending', description: 'Processing/loading state' },
        { status: 'error', description: 'Error/failure state' },
        { status: 'success', description: 'Success/completion state' },
        { status: 'warning', description: 'Warning/caution state' },
        { status: 'info', description: 'Information state' },
        { status: 'disabled', description: 'Disabled/unavailable state' },
      ] as const).map(({ status, description }) => (
        <div key={status} style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', textTransform: 'capitalize' }}>{status}</h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--mp-color-text-muted)' }}>
            {description}
          </p>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              status={status}
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all available status variants with their default colors and behaviors.',
      },
    },
  },
};

// ============================================================================
// PRESET STATUS COMPONENTS
// ============================================================================

export const PresetStatuses = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>OnlineStatus</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <OnlineStatus {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>OfflineStatus</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <OfflineStatus {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>PendingStatus</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <PendingStatus {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ErrorStatus</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <ErrorStatus {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>SuccessStatus</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SuccessStatus {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>WarningStatus</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <WarningStatus {...mockComplicationProps} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows preset status complications with predefined configurations including icons and animations.',
      },
    },
  },
};

// ============================================================================
// SIZE VARIATIONS
// ============================================================================

export const SizeVariations = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Small Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              status="online"
              size="sm"
              text="Online"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Medium Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              status="online"
              size="md"
              text="Online"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Dot Only</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              status="online"
              dotOnly={true}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Compact Card</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              cardSize="compact"
              status="pending"
              text="Processing"
              pulse={true}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Standard Card</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              cardSize="standard"
              status="pending"
              text="Processing"
              pulse={true}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>XL Card</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              cardSize="xl"
              status="pending"
              text="Processing"
              pulse={true}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates size variations and how status complications adapt to different card sizes.',
      },
    },
  },
};

// ============================================================================
// SLOT POSITIONING
// ============================================================================

export const SlotPositioning = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Corner Slots</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              slot="topRight"
              status="success"
              text="Healthy"
              icon="✓"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Edge Slots (Auto Dot-Only)</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              slot="edgeRight"
              status="online"
              text="This text won't show in edge slots"
            />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 15px 0' }}>Footer Slot</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <StatusComplication
            {...mockComplicationProps}
            slot="footer"
            status="info"
            text="System Status: All services operational"
            size="md"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how status complications adapt to different slot positions, with automatic dot-only behavior for edge slots.',
      },
    },
  },
};

// ============================================================================
// ANIMATIONS & PULSE
// ============================================================================

export const AnimationsAndPulse = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Auto-Pulse States</h4>
        <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', marginBottom: '15px' }}>
          These statuses automatically pulse
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication {...mockComplicationProps} status="online" />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication {...mockComplicationProps} status="pending" />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication {...mockComplicationProps} status="error" />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Manual Pulse Control</h4>
        <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', marginBottom: '15px' }}>
          Pulse can be controlled manually
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication {...mockComplicationProps} status="success" pulse={true} text="Pulsing" />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication {...mockComplicationProps} status="success" pulse={false} text="Static" />
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication {...mockComplicationProps} status="info" pulse={true} text="Custom Pulse" />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates pulse animations, including automatic pulsing for certain statuses and manual pulse control.',
      },
    },
  },
};

// ============================================================================
// CARD STATE RESPONSES
// ============================================================================

export const CardStateResponses = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      {(['default', 'running', 'error', 'selected'] as const).map(state => (
        <div key={state} style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>{state} Card State</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              cardState={state}
              status="online"
              text="Status"
              pulse={true}
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how status complications respond to different card states with opacity changes.',
      },
    },
  },
};

// ============================================================================
// CUSTOM CONFIGURATIONS
// ============================================================================

export const CustomConfigurations = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Custom Status with Icon</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <StatusComplication
            {...mockComplicationProps}
            status="success"
            text="Deployed"
            icon="🚀"
            size="md"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Monitoring Status</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <StatusComplication
            {...mockComplicationProps}
            status="info"
            text="Monitoring"
            icon="👁"
            pulse={true}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Maintenance Mode</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <StatusComplication
            {...mockComplicationProps}
            status="warning"
            text="Maintenance"
            icon="🔧"
            pulse={false}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Custom Text Override</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <StatusComplication
            {...mockComplicationProps}
            status="error"
            text="System Down"
            icon="⚠"
            pulse={true}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows custom status configurations with icons, custom text, and specific use cases.',
      },
    },
  },
};

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const Accessibility = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Accessibility Features</h3>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: 'var(--mp-color-text-muted)' }}>
          <li>ARIA role="status" for status announcements</li>
          <li>Descriptive aria-label combining text and status</li>
          <li>Tooltip with full status description</li>
          <li>High contrast mode support</li>
          <li>Respects prefers-reduced-motion for animations</li>
          <li>Keyboard accessible when interactive</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Screen Reader Friendly</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <StatusComplication
              {...mockComplicationProps}
              status="success"
              text="All Systems Operational"
              icon="✅"
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Announced as "All Systems Operational status indicator"
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>High Contrast Compatible</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px', filter: 'contrast(1.5)' }}>
            <StatusComplication
              {...mockComplicationProps}
              status="error"
              text="Service Unavailable"
              icon="❌"
              pulse={true}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Maintains contrast in high contrast mode
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including ARIA attributes, semantic markup, and high contrast support.',
      },
    },
  },
};
