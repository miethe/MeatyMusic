import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import React from 'react';
import { SourceTypeBadge, type SourceTypeBadgeProps } from './SourceTypeBadge';

const meta = {
  title: 'ContextCard/Components/SourceTypeBadge',
  component: SourceTypeBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The SourceTypeBadge displays the origin of context data on context cards.
It shows the source type (manual, url, file, api) with appropriate icons and color coding, includes tooltips when sourceRef is provided, and supports click interactions.

## Features

- **Visual Indicators**: Type-specific icons from Lucide (Edit, Link, FileText, Code)
- **Adaptive Sizing**: Compact mode hides text labels while showing icons
- **Rich Tooltips**: Shows source reference details on hover when sourceRef is provided
- **Interactive**: Optional onClick handler for source navigation
- **Accessible**: Full WCAG AA compliance with proper ARIA labels and focus states
- **Consistent Styling**: Uses Badge component with outline variant

## Source Type Classifications

- **Manual**: User-created content entered directly (Edit icon)
- **URL**: Content fetched from external URLs (Link icon)
- **File**: Content imported from file uploads (FileText icon)
- **API**: Content retrieved from API endpoints (Code icon)

## Accessibility

### WCAG 2.1 AA Compliance
- Screen reader announces source type and reference
- Keyboard navigation support (Tab to focus, Enter to activate when clickable)
- High contrast theme compatible
- Proper focus indicators with visible focus rings
- Tooltip accessible via keyboard focus
- Color is not the only indicator (icons provide redundant information)
- Touch targets meet 44x44px minimum when interactive

### Keyboard Navigation

| Key | Action | Notes |
|-----|--------|-------|
| Tab | Focus badge | Only when interactive (onClick provided) |
| Enter/Space | Activate badge | Triggers onClick handler |
| Esc | Close tooltip | Closes tooltip when open |

### ARIA Attributes
- \`role="button"\`: Applied when onClick is provided
- Implicit \`aria-label\`: Badge content provides accessible label
- Tooltip content accessible via Tooltip component's ARIA implementation
        `,
      },
    },
  },
  argTypes: {
    sourceType: {
      control: 'radio',
      options: ['manual', 'url', 'file', 'api'],
      description: 'The type of source for the context data',
    },
    sourceRef: {
      control: 'text',
      description: 'Reference to the source (URL, file path, API endpoint)',
    },
    isCompact: {
      control: 'boolean',
      description: 'Whether to show compact size (icon only, no label)',
    },
    onClick: {
      action: 'clicked',
      description: 'Called when the badge is clicked (makes badge interactive)',
    },
  },
  args: {
    sourceType: 'manual',
    sourceRef: undefined,
    isCompact: false,
    onClick: undefined,
  },
} satisfies Meta<typeof SourceTypeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Source Type Variations
// ============================================================================

export const ManualSource: Story = {
  args: {
    sourceType: 'manual',
  },
  parameters: {
    docs: {
      description: {
        story: 'Manual source type - content created directly by users. Shows Edit icon with "Manual" label.',
      },
    },
  },
};

export const URLSource: Story = {
  args: {
    sourceType: 'url',
  },
  parameters: {
    docs: {
      description: {
        story: 'URL source type - content fetched from external URLs. Shows Link icon with "URL" label.',
      },
    },
  },
};

export const FileSource: Story = {
  args: {
    sourceType: 'file',
  },
  parameters: {
    docs: {
      description: {
        story: 'File source type - content imported from file uploads. Shows FileText icon with "File" label.',
      },
    },
  },
};

export const APISource: Story = {
  args: {
    sourceType: 'api',
  },
  parameters: {
    docs: {
      description: {
        story: 'API source type - content retrieved from API endpoints. Shows Code icon with "API" label.',
      },
    },
  },
};

// ============================================================================
// With Source References (Tooltips)
// ============================================================================

export const ManualWithoutReference: Story = {
  args: {
    sourceType: 'manual',
    sourceRef: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Manual source typically has no source reference - no tooltip displayed.',
      },
    },
  },
};

export const URLWithReference: Story = {
  args: {
    sourceType: 'url',
    sourceRef: 'https://docs.example.com/api/guidelines',
  },
  parameters: {
    docs: {
      description: {
        story: 'URL source with reference - hover to see full URL in tooltip.',
      },
    },
  },
};

export const FileWithReference: Story = {
  args: {
    sourceType: 'file',
    sourceRef: 'brand-guidelines-v2.pdf',
  },
  parameters: {
    docs: {
      description: {
        story: 'File source with reference - hover to see filename in tooltip.',
      },
    },
  },
};

export const APIWithReference: Story = {
  args: {
    sourceType: 'api',
    sourceRef: '/api/v1/contexts/brand-voice',
  },
  parameters: {
    docs: {
      description: {
        story: 'API source with reference - hover to see API endpoint in tooltip.',
      },
    },
  },
};

export const LongURLReference: Story = {
  args: {
    sourceType: 'url',
    sourceRef: 'https://docs.example.com/very/long/path/to/documentation/api/guidelines/version/2/section/authentication',
  },
  parameters: {
    docs: {
      description: {
        story: 'URL source with very long reference - tooltip handles text wrapping with break-all.',
      },
    },
  },
};

// ============================================================================
// Size Variations
// ============================================================================

export const StandardSize: Story = {
  args: {
    sourceType: 'url',
    sourceRef: 'https://docs.example.com/guide',
    isCompact: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard size - shows both icon and text label.',
      },
    },
  },
};

export const CompactSize: Story = {
  args: {
    sourceType: 'url',
    sourceRef: 'https://docs.example.com/guide',
    isCompact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact size - shows only icon without text label. Tooltip still available.',
      },
    },
  },
};

export const AllSourceTypesStandard: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="manual" />
        <span className="text-sm text-gray-600">Manual entry</span>
      </div>
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="url" sourceRef="https://example.com" />
        <span className="text-sm text-gray-600">URL source</span>
      </div>
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="file" sourceRef="document.pdf" />
        <span className="text-sm text-gray-600">File upload</span>
      </div>
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="api" sourceRef="/api/v1/data" />
        <span className="text-sm text-gray-600">API endpoint</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All source types in standard size - shows complete taxonomy with labels.',
      },
    },
  },
};

export const AllSourceTypesCompact: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="manual" isCompact />
        <span className="text-sm text-gray-600">Manual entry</span>
      </div>
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="url" sourceRef="https://example.com" isCompact />
        <span className="text-sm text-gray-600">URL source</span>
      </div>
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="file" sourceRef="document.pdf" isCompact />
        <span className="text-sm text-gray-600">File upload</span>
      </div>
      <div className="flex items-center gap-2">
        <SourceTypeBadge sourceType="api" sourceRef="/api/v1/data" isCompact />
        <span className="text-sm text-gray-600">API endpoint</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All source types in compact size - shows icon-only variants.',
      },
    },
  },
};

// ============================================================================
// Interactive States
// ============================================================================

export const Clickable: Story = {
  args: {
    sourceType: 'url',
    sourceRef: 'https://docs.example.com/guide',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable badge with onClick handler - hover to see cursor change and hover effects.',
      },
    },
  },
};

export const ClickableWithoutTooltip: Story = {
  args: {
    sourceType: 'manual',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable badge without source reference - no tooltip, but still shows hover effects.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [lastClicked, setLastClicked] = React.useState<string | null>(null);

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4">
            Click badges to navigate to their sources:
          </p>
          <div className="flex flex-wrap gap-3">
            <SourceTypeBadge
              sourceType="url"
              sourceRef="https://docs.example.com"
              onClick={() => setLastClicked('URL Source')}
            />
            <SourceTypeBadge
              sourceType="file"
              sourceRef="document.pdf"
              onClick={() => setLastClicked('File Source')}
            />
            <SourceTypeBadge
              sourceType="api"
              sourceRef="/api/v1/contexts"
              onClick={() => setLastClicked('API Source')}
            />
          </div>
        </div>
        {lastClicked && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900">
              Clicked: {lastClicked}
            </p>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing clickable badges with onClick handlers.',
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
              All badges meet WCAG AA contrast requirements. Icons provide redundant information
              beyond color alone.
            </p>
            <div className="flex flex-wrap gap-3">
              <SourceTypeBadge sourceType="manual" />
              <SourceTypeBadge sourceType="url" sourceRef="https://example.com" />
              <SourceTypeBadge sourceType="file" sourceRef="doc.pdf" />
              <SourceTypeBadge sourceType="api" sourceRef="/api/v1" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Touch Targets</h4>
            <p className="text-sm text-text-muted mb-3">
              Interactive badges meet 44x44px minimum touch target size.
            </p>
            <div className="flex flex-wrap gap-3">
              <SourceTypeBadge
                sourceType="url"
                sourceRef="https://example.com"
                onClick={fn()}
              />
              <SourceTypeBadge
                sourceType="api"
                sourceRef="/api/v1/data"
                onClick={fn()}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Keyboard Navigation</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Focus Management</h4>
            <p className="text-sm text-text-muted mb-3">
              Try keyboard navigation: Tab to focus, Enter to activate, Esc to close tooltip.
            </p>
            <div className="flex flex-wrap gap-3">
              <SourceTypeBadge
                sourceType="url"
                sourceRef="https://docs.example.com"
                onClick={fn()}
              />
              <SourceTypeBadge
                sourceType="file"
                sourceRef="guidelines.pdf"
                onClick={fn()}
              />
              <SourceTypeBadge
                sourceType="api"
                sourceRef="/api/v1/contexts"
                onClick={fn()}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Non-Interactive</h4>
            <p className="text-sm text-text-muted mb-3">
              Non-interactive badges are not focusable (no onClick handler).
            </p>
            <div className="flex flex-wrap gap-3">
              <SourceTypeBadge sourceType="manual" />
              <SourceTypeBadge sourceType="url" sourceRef="https://example.com" />
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
              Screen readers announce source type and reference. Interactive badges are identified as buttons.
            </p>
            <ul className="text-sm text-text-muted space-y-2 list-disc list-inside">
              <li>Manual source: "Manual" (no button role)</li>
              <li>URL with ref: "URL" + tooltip with reference (button when clickable)</li>
              <li>File with ref: "File" + tooltip with filename (button when clickable)</li>
              <li>API with ref: "API" + tooltip with endpoint (button when clickable)</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">High Contrast Mode</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">System High Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              Badges maintain visibility in high contrast mode with proper border and icon contrast.
            </p>
            <div className="flex flex-wrap gap-3 p-4 bg-gray-900">
              <SourceTypeBadge sourceType="manual" />
              <SourceTypeBadge sourceType="url" sourceRef="https://example.com" />
              <SourceTypeBadge sourceType="file" sourceRef="doc.pdf" />
              <SourceTypeBadge sourceType="api" sourceRef="/api/v1" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Reduced Motion</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Motion Preferences</h4>
            <p className="text-sm text-text-muted mb-3">
              Respects prefers-reduced-motion - hover effects use instant transitions instead of animations.
            </p>
            <div className="flex flex-wrap gap-3">
              <SourceTypeBadge
                sourceType="url"
                sourceRef="https://example.com"
                onClick={fn()}
              />
              <SourceTypeBadge
                sourceType="api"
                sourceRef="/api/v1/data"
                onClick={fn()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility showcase demonstrating WCAG 2.1 AA compliance, keyboard navigation, screen reader support, high contrast mode, and reduced motion preferences.',
      },
    },
  },
};

// ============================================================================
// Playground
// ============================================================================

export const Playground: Story = {
  args: {
    sourceType: 'url',
    sourceRef: 'https://docs.example.com/guide',
    isCompact: false,
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - modify all props to test different combinations.',
      },
    },
  },
};
