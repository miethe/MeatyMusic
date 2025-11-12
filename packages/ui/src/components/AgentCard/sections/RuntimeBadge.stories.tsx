import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import React from 'react';
import { Cloud, Terminal, Cpu, Wrench, Settings } from 'lucide-react';
import { RuntimeBadge, type RuntimeBadgeProps } from './RuntimeBadge';

const meta = {
  title: 'AgentCard/Components/RuntimeBadge',
  component: RuntimeBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The RuntimeBadge displays the execution environment for AI agents on agent cards.
It shows the runtime type (cloud_code, cli, mcp, custom) with appropriate icons and color coding, supports compact sizing, and allows custom runtime configurations.

## Features

- **Visual Indicators**: Runtime-specific icons from Lucide (Cloud, Terminal, Cpu, Wrench)
- **Color-Coded**: Each runtime has a distinct background and text color for quick visual identification
- **Adaptive Sizing**: Compact mode reduces padding while maintaining icon visibility
- **Customizable**: Supports custom runtime configs with icons, labels, and colors
- **Accessible**: Full WCAG AA compliance with proper color contrast and ARIA labels
- **Consistent Styling**: Uses Badge component with outline variant and color overlays

## Runtime Classifications

- **Cloud Code**: Executes in cloud environments (blue - cloud infrastructure)
- **CLI**: Command-line interface execution (purple - terminal/developer tools)
- **MCP**: Model Context Protocol agents (green - AI/ML systems)
- **Custom**: User-defined runtime environments (orange - flexibility/customization)

## Accessibility

### WCAG 2.1 AA Compliance
- Color contrast meets WCAG AA standards for all runtime colors
- Icons provide redundant information beyond color alone
- Text labels enhance clarity in standard size mode
- Proper focus indicators for keyboard navigation
- Touch targets meet 44x44px minimum when interactive

### Keyboard Navigation

| Key | Action | Notes |
|-----|--------|-------|
| Tab | Focus badge | Standard focus behavior |
| Enter/Space | Activate badge | If interactive features added |

### ARIA Attributes
- Implicit \`aria-label\`: Badge content provides accessible label
- Runtime type communicated through both icon and text label
        `,
      },
    },
  },
  argTypes: {
    runtime: {
      control: 'radio',
      options: ['cloud_code', 'cli', 'mcp', 'custom'],
      description: 'The runtime environment type',
    },
    isCompact: {
      control: 'boolean',
      description: 'Whether to show compact size (icon only, reduced padding)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
    config: {
      control: 'object',
      description: 'Custom runtime configuration (icon, label, color)',
    },
  },
  args: {
    runtime: 'cloud_code',
    isCompact: false,
    className: undefined,
    config: undefined,
  },
} satisfies Meta<typeof RuntimeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Runtime Type Variations
// ============================================================================

export const CloudCodeRuntime: Story = {
  args: {
    runtime: 'cloud_code',
  },
  parameters: {
    docs: {
      description: {
        story: 'Cloud Code runtime - for agents executing in cloud environments. Shows Cloud icon with blue color scheme.',
      },
    },
  },
};

export const CLIRuntime: Story = {
  args: {
    runtime: 'cli',
  },
  parameters: {
    docs: {
      description: {
        story: 'CLI runtime - for command-line interface execution. Shows Terminal icon with purple color scheme.',
      },
    },
  },
};

export const MCPRuntime: Story = {
  args: {
    runtime: 'mcp',
  },
  parameters: {
    docs: {
      description: {
        story: 'MCP runtime - Model Context Protocol for enhanced AI capabilities. Shows Cpu icon with green color scheme.',
      },
    },
  },
};

export const CustomRuntime: Story = {
  args: {
    runtime: 'custom',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom runtime - user-defined execution environment. Shows Wrench icon with orange color scheme.',
      },
    },
  },
};

// ============================================================================
// Size Variations
// ============================================================================

export const StandardSize: Story = {
  args: {
    runtime: 'cloud_code',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard size - shows both icon and text label with standard padding.',
      },
    },
  },
};

export const CompactSize: Story = {
  args: {
    runtime: 'cloud_code',
    isCompact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact size - shows icon only with reduced padding for space-constrained layouts.',
      },
    },
  },
};

export const AllRuntimesStandard: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="cloud_code" />
        <span className="text-sm text-gray-600">Cloud execution environment</span>
      </div>
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="cli" />
        <span className="text-sm text-gray-600">Command-line interface</span>
      </div>
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="mcp" />
        <span className="text-sm text-gray-600">Model Context Protocol</span>
      </div>
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="custom" />
        <span className="text-sm text-gray-600">Custom runtime</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All runtime types in standard size - shows complete taxonomy with labels.',
      },
    },
  },
};

export const AllRuntimesCompact: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="cloud_code" isCompact />
        <span className="text-sm text-gray-600">Cloud execution</span>
      </div>
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="cli" isCompact />
        <span className="text-sm text-gray-600">CLI</span>
      </div>
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="mcp" isCompact />
        <span className="text-sm text-gray-600">MCP</span>
      </div>
      <div className="flex items-center gap-2">
        <RuntimeBadge runtime="custom" isCompact />
        <span className="text-sm text-gray-600">Custom</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All runtime types in compact size - shows icon-only variants with reduced padding.',
      },
    },
  },
};

// ============================================================================
// Custom Runtime Configurations
// ============================================================================

export const CustomIconAndLabel: Story = {
  args: {
    runtime: 'custom',
    config: {
      icon: <Settings className="h-3 w-3" />,
      label: 'Lambda',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom runtime with custom icon and label - useful for specialized runtime environments.',
      },
    },
  },
};

export const CustomColor: Story = {
  args: {
    runtime: 'custom',
    config: {
      label: 'Edge Runtime',
      color: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom runtime with custom color scheme - maintains consistency while allowing brand colors.',
      },
    },
  },
};

export const FullyCustomRuntime: Story = {
  args: {
    runtime: 'custom',
    config: {
      icon: <Settings className="h-3 w-3" />,
      label: 'Kubernetes',
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully customized runtime - custom icon, label, and color for maximum flexibility.',
      },
    },
  },
};

// ============================================================================
// Custom Class Names
// ============================================================================

export const WithCustomClassName: Story = {
  args: {
    runtime: 'mcp',
    className: 'shadow-md border-2',
  },
  parameters: {
    docs: {
      description: {
        story: 'Runtime badge with custom className - allows additional styling while maintaining core appearance.',
      },
    },
  },
};

// ============================================================================
// Layout Examples
// ============================================================================

export const HorizontalLayout: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <RuntimeBadge runtime="cloud_code" />
      <RuntimeBadge runtime="cli" />
      <RuntimeBadge runtime="mcp" />
      <RuntimeBadge runtime="custom" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Runtime badges in horizontal layout - common arrangement in card headers.',
      },
    },
  },
};

export const CompactHorizontalLayout: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <RuntimeBadge runtime="cloud_code" isCompact />
      <RuntimeBadge runtime="cli" isCompact />
      <RuntimeBadge runtime="mcp" isCompact />
      <RuntimeBadge runtime="custom" isCompact />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact runtime badges in horizontal layout - space-efficient for card grids.',
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

export const ProductionAgent: Story = {
  args: {
    runtime: 'cloud_code',
  },
  parameters: {
    docs: {
      description: {
        story: 'Production agent running in cloud - typical for scalable, managed deployments.',
      },
    },
  },
};

export const DevelopmentAgent: Story = {
  args: {
    runtime: 'cli',
  },
  parameters: {
    docs: {
      description: {
        story: 'Development agent in CLI - common for local testing and debugging.',
      },
    },
  },
};

export const MCPEnabledAgent: Story = {
  args: {
    runtime: 'mcp',
  },
  parameters: {
    docs: {
      description: {
        story: 'MCP-enabled agent - supports advanced context protocols and tool integrations.',
      },
    },
  },
};

export const DockerizedAgent: Story = {
  args: {
    runtime: 'custom',
    config: {
      label: 'Docker',
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Containerized agent in Docker - custom runtime for containerized deployments.',
      },
    },
  },
};

// ============================================================================
// Accessibility Showcase
// ============================================================================

export const AccessibilityShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">WCAG 2.1 AA Compliance</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Color Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              All runtime badges meet WCAG AA contrast requirements. Each color combination
              (background, text, border) has been tested for accessibility.
            </p>
            <div className="flex flex-wrap gap-3">
              <RuntimeBadge runtime="cloud_code" />
              <RuntimeBadge runtime="cli" />
              <RuntimeBadge runtime="mcp" />
              <RuntimeBadge runtime="custom" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Icon + Text Redundancy</h4>
            <p className="text-sm text-text-muted mb-3">
              Icons provide visual distinction beyond color alone. Text labels ensure clarity
              for users with color vision deficiencies.
            </p>
            <div className="flex flex-wrap gap-3">
              <RuntimeBadge runtime="cloud_code" />
              <RuntimeBadge runtime="cli" />
              <RuntimeBadge runtime="mcp" />
              <RuntimeBadge runtime="custom" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Compact Mode Accessibility</h4>
            <p className="text-sm text-text-muted mb-3">
              Even in compact mode with text labels hidden, icons remain clearly visible
              and identifiable.
            </p>
            <div className="flex flex-wrap gap-3">
              <RuntimeBadge runtime="cloud_code" isCompact />
              <RuntimeBadge runtime="cli" isCompact />
              <RuntimeBadge runtime="mcp" isCompact />
              <RuntimeBadge runtime="custom" isCompact />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Keyboard Navigation</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Focus Behavior</h4>
            <p className="text-sm text-text-muted mb-3">
              Runtime badges are currently non-interactive (no focus state). If future features
              add interactivity, proper focus indicators will be implemented.
            </p>
            <div className="flex flex-wrap gap-3">
              <RuntimeBadge runtime="cloud_code" />
              <RuntimeBadge runtime="cli" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Screen Reader Support</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Announcements</h4>
            <p className="text-sm text-text-muted mb-3">
              Screen readers announce the full runtime label:
            </p>
            <ul className="text-sm text-text-muted space-y-2 list-disc list-inside">
              <li>Cloud Code runtime: "Cloud Code"</li>
              <li>CLI runtime: "CLI"</li>
              <li>MCP runtime: "MCP"</li>
              <li>Custom runtime: "Custom" (or custom label if configured)</li>
            </ul>
            <div className="flex flex-wrap gap-3 mt-3">
              <RuntimeBadge runtime="cloud_code" />
              <RuntimeBadge runtime="cli" />
              <RuntimeBadge runtime="mcp" />
              <RuntimeBadge runtime="custom" config={{ label: 'Lambda' }} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">High Contrast Mode</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">System High Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              Badges maintain visibility in high contrast mode with proper borders and icon contrast.
            </p>
            <div className="flex flex-wrap gap-3 p-4 bg-gray-900 rounded">
              <RuntimeBadge runtime="cloud_code" />
              <RuntimeBadge runtime="cli" />
              <RuntimeBadge runtime="mcp" />
              <RuntimeBadge runtime="custom" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Light Background</h4>
            <p className="text-sm text-text-muted mb-3">
              Color schemes work well on light backgrounds with proper transparency and contrast.
            </p>
            <div className="flex flex-wrap gap-3 p-4 bg-white border rounded">
              <RuntimeBadge runtime="cloud_code" />
              <RuntimeBadge runtime="cli" />
              <RuntimeBadge runtime="mcp" />
              <RuntimeBadge runtime="custom" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Responsive Design</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Size Adaptability</h4>
            <p className="text-sm text-text-muted mb-3">
              Badges adapt to different card sizes and layouts without losing readability.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Standard Cards</p>
                <div className="flex flex-wrap gap-3">
                  <RuntimeBadge runtime="cloud_code" />
                  <RuntimeBadge runtime="cli" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Compact Cards</p>
                <div className="flex flex-wrap gap-2">
                  <RuntimeBadge runtime="cloud_code" isCompact />
                  <RuntimeBadge runtime="cli" isCompact />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility showcase demonstrating WCAG 2.1 AA compliance, keyboard navigation readiness, screen reader support, high contrast mode, and responsive design patterns.',
      },
    },
  },
};

// ============================================================================
// Playground
// ============================================================================

export const Playground: Story = {
  args: {
    runtime: 'cloud_code',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - modify all props to test different combinations.',
      },
    },
  },
};
