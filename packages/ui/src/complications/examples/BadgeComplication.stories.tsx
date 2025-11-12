import type { Meta, StoryObj } from '@storybook/react-vite';
import { BadgeComplication, SuccessBadge, ErrorBadge, RunningBadge, NewBadge, StarBadge } from './BadgeComplication';
import type { ComplicationProps } from '../types';

const meta = {
  title: 'Components/PromptCard/Complications/BadgeComplication',
  component: BadgeComplication,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A simple badge complication that displays a colored badge with text. Perfect for status indicators, feature flags, and notifications with support for animations and icons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: { type: 'text' },
      description: 'Text content of the badge',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'error', 'info'],
      description: 'Badge color variant',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md'],
      description: 'Size variant',
    },
    pulse: {
      control: { type: 'boolean' },
      description: 'Whether to show a pulse animation',
    },
    icon: {
      control: { type: 'text' },
      description: 'Custom icon (Lucide icon name)',
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
} satisfies Meta<typeof BadgeComplication>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock complication props
const mockComplicationProps: Omit<ComplicationProps, keyof typeof BadgeComplication> = {
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
  slot: 'topRight',
  isVisible: true,
};

export const Default: Story = {
  args: {
    ...mockComplicationProps,
    text: 'Badge',
    variant: 'default',
  },
};

export const WithPulse: Story = {
  args: {
    ...mockComplicationProps,
    text: 'NEW',
    variant: 'warning',
    pulse: true,
  },
};

export const WithIcon: Story = {
  args: {
    ...mockComplicationProps,
    text: 'Success',
    variant: 'success',
    icon: '✓',
  },
};

export const SmallSize: Story = {
  args: {
    ...mockComplicationProps,
    text: 'SM',
    variant: 'info',
    size: 'sm',
    cardSize: 'compact',
  },
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

export const AllVariants = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '20px' }}>
      {(['default', 'success', 'warning', 'error', 'info'] as const).map(variant => (
        <div key={variant} style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'capitalize' }}>{variant}</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <BadgeComplication
              {...mockComplicationProps}
              text={variant.toUpperCase()}
              variant={variant}
            />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all available badge variants: default, success, warning, error, and info.',
      },
    },
  },
};

// ============================================================================
// PRESET BADGES
// ============================================================================

export const PresetBadges = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>SuccessBadge</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <SuccessBadge {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>ErrorBadge</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <ErrorBadge {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>RunningBadge</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <RunningBadge {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>NewBadge</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <NewBadge {...mockComplicationProps} />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>StarBadge</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <StarBadge {...mockComplicationProps} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows preset badge complications with predefined icons and configurations.',
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
            <BadgeComplication
              {...mockComplicationProps}
              text="SMALL"
              variant="success"
              size="sm"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Medium Size</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <BadgeComplication
              {...mockComplicationProps}
              text="MEDIUM"
              variant="success"
              size="md"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Auto Size (Compact Card)</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <BadgeComplication
              {...mockComplicationProps}
              cardSize="compact"
              text="AUTO"
              variant="success"
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates size variations and how badges automatically adapt to card sizes.',
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
            <BadgeComplication
              {...mockComplicationProps}
              slot="topRight"
              text="CORNER"
              variant="info"
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Edge Slots (Truncated)</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <BadgeComplication
              {...mockComplicationProps}
              slot="edgeRight"
              text="EDGE"
              variant="warning"
            />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 15px 0' }}>Footer Slot</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <BadgeComplication
            {...mockComplicationProps}
            slot="footer"
            text="Footer Badge"
            variant="success"
            size="md"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how badges adapt to different slot positions, including automatic truncation for edge slots.',
      },
    },
  },
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const Animations = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Static Badge</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <BadgeComplication
            {...mockComplicationProps}
            text="STATIC"
            variant="success"
            pulse={false}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Pulsing Badge</h4>
        <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
          <BadgeComplication
            {...mockComplicationProps}
            text="PULSE"
            variant="warning"
            pulse={true}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates pulse animation for attention-grabbing badges.',
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
          <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>{state} State</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <BadgeComplication
              {...mockComplicationProps}
              cardState={state}
              text="BADGE"
              variant="success"
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
        story: 'Shows how badges respond to different card states with opacity changes.',
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
          <li>ARIA role="status" for status indicators</li>
          <li>Descriptive aria-label with text and slot position</li>
          <li>Tooltip with full badge description</li>
          <li>Keyboard accessible when interactive</li>
          <li>High contrast mode support</li>
          <li>Respects prefers-reduced-motion for animations</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Status Badge</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <BadgeComplication
              {...mockComplicationProps}
              text="LIVE"
              variant="success"
              pulse={true}
              icon="●"
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Announced as "LIVE indicator (topRight)"
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Feature Flag Badge</h4>
          <div style={{ padding: '15px', border: '1px solid var(--mp-color-border)', borderRadius: '8px' }}>
            <BadgeComplication
              {...mockComplicationProps}
              text="BETA"
              variant="warning"
              icon="⚡"
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--mp-color-text-muted)', margin: '10px 0 0 0' }}>
            Announced as "BETA indicator (topRight)"
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including ARIA attributes, semantic markup, and assistive technology support.',
      },
    },
  },
};
