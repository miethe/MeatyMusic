import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import React, { useState } from 'react';
import { ContextCard, type Context } from './ContextCard';

// Mock context data
const mockContext: Context = {
  context_id: 'ctx_1234567890',
  title: 'Brand Voice Guidelines',
  description: 'Official brand voice and tone guidelines for all customer-facing communications',
  owner_id: 'user_123',
  access_control: 'private',
  current_version: {
    version: 2,
    body: '# Brand Voice\n\nBe concise, clear, and friendly...',
    tags: ['style-guide', 'brand', 'voice', 'tone'],
    source_type: 'manual',
    source_ref: undefined,
    created_at: '2024-01-15T10:30:00Z',
  },
  version_count: 3,
  usage_count: 12,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockContextMinimal: Context = {
  context_id: 'ctx_minimal',
  title: 'Simple Context',
  owner_id: 'user_123',
  access_control: 'private',
  current_version: {
    version: 1,
    body: 'Simple context content',
    tags: [],
    created_at: '2024-01-01T00:00:00Z',
  },
  version_count: 1,
  usage_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const meta: Meta<typeof ContextCard> = {
  title: 'Components/ContextCard',
  component: ContextCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A specialized card component for displaying reusable context artifacts (style guides, policies, knowledge, tool schemas). Features context-specific badges, source indicators, usage tracking, and enhanced accessibility.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['compact', 'standard', 'xl'],
    },
    state: {
      control: { type: 'select' },
      options: ['default', 'error', 'disabled', 'selected'],
    },
    onEdit: { action: 'edit' },
    onDuplicate: { action: 'duplicate' },
    onMenuAction: { action: 'menu' },
    onClick: { action: 'click' },
  },
  args: {
    onEdit: fn(),
    onDuplicate: fn(),
    onMenuAction: fn(),
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic States
// ============================================================================

export const Default: Story = {
  args: {
    context: mockContext,
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default ContextCard with enhanced hover effects - hover to see elevation lift and title color transition.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    context: mockContext,
    size: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact size (288px) with subtle hover lift effect. Description hidden.',
      },
    },
  },
};

export const Standard: Story = {
  args: {
    context: mockContext,
    size: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard size (420px) with full features.',
      },
    },
  },
};

export const XL: Story = {
  args: {
    context: mockContext,
    size: 'xl',
  },
  parameters: {
    docs: {
      description: {
        story: 'XL size (560px) with maximum hover lift effect and extended content.',
      },
    },
  },
};

// ============================================================================
// State Variations
// ============================================================================

export const WithError: Story = {
  args: {
    context: mockContext,
    error: 'Failed to load context body. Please try again.',
    state: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state with danger-colored border and error banner.',
      },
    },
  },
};

export const WithErrorAndRetry: Story = {
  args: {
    context: mockContext,
    error: {
      message: 'Network error while fetching context',
      retry: fn(),
    },
    state: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state with retry button in error banner.',
      },
    },
  },
};

export const Selected: Story = {
  args: {
    context: mockContext,
    state: 'selected',
  },
  parameters: {
    docs: {
      description: {
        story: 'Selected state with primary-colored outline.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    context: mockContext,
    state: 'disabled',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with reduced opacity and no hover effects.',
      },
    },
  },
};

// ============================================================================
// Content Variations
// ============================================================================

export const NoDescription: Story = {
  args: {
    context: { ...mockContext, description: undefined },
  },
  parameters: {
    docs: {
      description: {
        story: 'Context without description shows clean, compact layout.',
      },
    },
  },
};

export const ManyTags: Story = {
  args: {
    context: {
      ...mockContext,
      current_version: {
        ...mockContext.current_version,
        tags: ['style-guide', 'brand', 'voice', 'tone', 'marketing', 'content'],
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests tag overflow handling with many tags. Shows +N indicator for hidden tags.',
      },
    },
  },
};

export const HighUsage: Story = {
  args: {
    context: { ...mockContext, usage_count: 42 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Context with high usage count.',
      },
    },
  },
};

export const ZeroUsage: Story = {
  args: {
    context: { ...mockContext, usage_count: 0 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Context with zero usage (new or unused).',
      },
    },
  },
};

export const MinimalContent: Story = {
  args: {
    context: mockContextMinimal,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal context with only required fields.',
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    context: {
      ...mockContext,
      title: 'This is an Extremely Long Context Title That Should Demonstrate Proper Text Truncation and Layout Behavior in the ContextCard Component',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests proper text truncation with very long titles.',
      },
    },
  },
};

// ============================================================================
// Source Type Variations
// ============================================================================

export const ManualSource: Story = {
  args: {
    context: {
      ...mockContext,
      current_version: {
        ...mockContext.current_version,
        source_type: 'manual',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Context with manual source type (Edit icon).',
      },
    },
  },
};

export const URLSource: Story = {
  args: {
    context: {
      ...mockContext,
      title: 'External API Documentation',
      current_version: {
        ...mockContext.current_version,
        source_type: 'url',
        source_ref: 'https://api.example.com/docs/guidelines',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Context sourced from URL (Link icon). Hover badge to see source URL.',
      },
    },
  },
};

export const FileSource: Story = {
  args: {
    context: {
      ...mockContext,
      title: 'Company Policy Document',
      current_version: {
        ...mockContext.current_version,
        source_type: 'file',
        source_ref: 'brand-guidelines.pdf',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Context sourced from file (FileText icon). Hover badge to see filename.',
      },
    },
  },
};

export const APISource: Story = {
  args: {
    context: {
      ...mockContext,
      title: 'Dynamic Context from API',
      current_version: {
        ...mockContext.current_version,
        source_type: 'api',
        source_ref: '/api/v1/contexts/brand-voice',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Context sourced from API (Code icon). Hover badge to see API endpoint.',
      },
    },
  },
};

// ============================================================================
// Access Control
// ============================================================================

export const PrivateAccess: Story = {
  args: {
    context: { ...mockContext, access_control: 'private' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Private context (visible only to owner).',
      },
    },
  },
};

export const SharedAccess: Story = {
  args: {
    context: { ...mockContext, access_control: 'shared' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shared context (visible to specific users/teams).',
      },
    },
  },
};

export const PublicAccess: Story = {
  args: {
    context: { ...mockContext, access_control: 'public' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Public context (visible to all users).',
      },
    },
  },
};

// ============================================================================
// Selection Mode
// ============================================================================

export const WithSelection: Story = {
  args: {
    context: mockContext,
    selectable: true,
    selected: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with selection checkbox - hover to see the checkbox appear in the top-left corner.',
      },
    },
  },
};

export const SelectedState: Story = {
  args: {
    context: mockContext,
    selectable: true,
    selected: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card in selected state with visible checkbox, blue border, and subtle background tint.',
      },
    },
  },
};

export const BulkSelectionActive: Story = {
  args: {
    context: mockContext,
    selectable: true,
    selected: false,
    hasActiveSelection: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When any card is selected, all selectable cards show their checkboxes (hasActiveSelection=true).',
      },
    },
  },
};

export const SelectionInteractiveDemo: Story = {
  render: () => {
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

    const handleSelectionChange = (contextId: string, selected: boolean) => {
      setSelectedCards(prev => {
        const next = new Set(prev);
        if (selected) {
          next.add(contextId);
        } else {
          next.delete(contextId);
        }
        return next;
      });
    };

    const hasActiveSelection = selectedCards.size > 0;

    const contexts: Context[] = [
      {
        ...mockContext,
        context_id: 'ctx_1',
        title: 'Brand Voice Guidelines',
      },
      {
        ...mockContext,
        context_id: 'ctx_2',
        title: 'API Response Schemas',
        current_version: { ...mockContext.current_version, source_type: 'api' },
      },
      {
        ...mockContext,
        context_id: 'ctx_3',
        title: 'Company Policies',
        access_control: 'shared',
        current_version: { ...mockContext.current_version, source_type: 'file' },
      },
      {
        ...mockContext,
        context_id: 'ctx_4',
        title: 'External Documentation',
        access_control: 'public',
        current_version: { ...mockContext.current_version, source_type: 'url' },
      },
    ];

    return (
      <div className="space-y-6 p-8">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-text-strong">Interactive Bulk Selection</h3>
          <p className="text-sm text-text-muted mb-4">
            Hover over cards to reveal checkboxes. Select one to see all checkboxes appear.
            {selectedCards.size > 0 && ` (${selectedCards.size} selected)`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {contexts.map((context) => (
            <ContextCard
              key={context.context_id}
              context={context}
              selectable
              selected={selectedCards.has(context.context_id)}
              hasActiveSelection={hasActiveSelection}
              onSelectionChange={(selected) => handleSelectionChange(context.context_id, selected)}
              onEdit={fn()}
              onDuplicate={fn()}
              onMenuAction={fn()}
            />
          ))}
        </div>
        {selectedCards.size > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900">
              {selectedCards.size} context{selectedCards.size !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => setSelectedCards(new Set())}
              className="text-sm text-blue-700 hover:text-blue-900 underline"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive bulk selection demo. Hover to see checkboxes, select cards to enter bulk selection mode.',
      },
    },
  },
};

// ============================================================================
// Comprehensive Showcase
// ============================================================================

export const AllSourceTypesShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-text-strong">Source Type Classification</h3>
        <p className="text-sm text-text-muted mb-4">
          ContextCard displays different source type badges to indicate where context content originated.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ContextCard
          context={{
            ...mockContext,
            title: 'Manual Entry',
            description: 'Context created manually by users',
            current_version: { ...mockContext.current_version, source_type: 'manual' },
          }}
          onEdit={fn()}
          onDuplicate={fn()}
        />
        <ContextCard
          context={{
            ...mockContext,
            title: 'URL Source',
            description: 'Context synced from external URL',
            current_version: {
              ...mockContext.current_version,
              source_type: 'url',
              source_ref: 'https://docs.example.com/guide',
            },
          }}
          onEdit={fn()}
          onDuplicate={fn()}
        />
        <ContextCard
          context={{
            ...mockContext,
            title: 'File Upload',
            description: 'Context imported from file',
            current_version: {
              ...mockContext.current_version,
              source_type: 'file',
              source_ref: 'guidelines.pdf',
            },
          }}
          onEdit={fn()}
          onDuplicate={fn()}
        />
        <ContextCard
          context={{
            ...mockContext,
            title: 'API Integration',
            description: 'Context fetched from API',
            current_version: {
              ...mockContext.current_version,
              source_type: 'api',
              source_ref: '/api/contexts/schema',
            },
          }}
          onEdit={fn()}
          onDuplicate={fn()}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all 4 source types with SourceTypeBadge - demonstrates complete source taxonomy.',
      },
    },
  },
};

export const InteractiveStatesShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Size Variants</h3>
        <p className="text-sm text-text-muted mb-4">
          Hover over these cards to see elevation lift, border color change, and title color transition.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <ContextCard
            context={{ ...mockContext, title: 'Compact Card' }}
            size="compact"
            onClick={fn()}
          />
          <ContextCard
            context={{ ...mockContext, title: 'Standard Card' }}
            size="standard"
            onClick={fn()}
          />
          <ContextCard
            context={{ ...mockContext, title: 'XL Card' }}
            size="xl"
            onClick={fn()}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">State Variations</h3>
        <p className="text-sm text-text-muted mb-4">
          Different states with appropriate hover behaviors.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ContextCard
            context={{ ...mockContext, title: 'Default State' }}
            onClick={fn()}
          />
          <ContextCard
            context={{ ...mockContext, title: 'Selected State' }}
            state="selected"
            onClick={fn()}
          />
          <ContextCard
            context={{ ...mockContext, title: 'Error State' }}
            state="error"
            error="Failed to load context"
            onClick={fn()}
          />
          <ContextCard
            context={{ ...mockContext, title: 'Disabled State' }}
            state="disabled"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Accessibility</h3>
        <p className="text-sm text-text-muted mb-4">
          Focus states with proper ring outlines. Try keyboard navigation (Tab, Enter).
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ContextCard
            context={{ ...mockContext, title: 'Keyboard Navigable' }}
            onClick={fn()}
            onEdit={fn()}
            onDuplicate={fn()}
          />
          <ContextCard
            context={{ ...mockContext, title: 'Focus Ring Example' }}
            onClick={fn()}
            onEdit={fn()}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive showcase of all interactive states, hover effects, and accessibility features.',
      },
    },
  },
};

export const AccessibilityShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">WCAG 2.1 AA Compliance</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Color Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              All text and interactive elements meet WCAG AA contrast requirements (4.5:1 for normal text,
              3:1 for large text). Border colors provide 3:1 contrast against backgrounds.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={mockContext}
                onClick={fn()}
                onEdit={fn()}
              />
              <ContextCard
                context={{ ...mockContext, title: 'High Contrast Card' }}
                state="selected"
                onClick={fn()}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Non-Text Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              Icons, badges, and interactive element boundaries meet 3:1 contrast requirement.
              Source type badges use both color and icons for redundancy.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={{
                  ...mockContext,
                  title: 'URL Source Context',
                  current_version: {
                    ...mockContext.current_version,
                    source_type: 'url',
                    source_ref: 'https://docs.example.com',
                  },
                }}
              />
              <ContextCard
                context={{
                  ...mockContext,
                  title: 'API Source Context',
                  current_version: {
                    ...mockContext.current_version,
                    source_type: 'api',
                    source_ref: '/api/v1/contexts',
                  },
                }}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Touch Targets</h4>
            <p className="text-sm text-text-muted mb-3">
              All interactive elements (buttons, checkboxes) meet the 44x44px minimum touch target size.
              Spacing between targets prevents accidental activation.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={mockContext}
                selectable
                hasActiveSelection
                onClick={fn()}
                onEdit={fn()}
                onDuplicate={fn()}
              />
              <ContextCard
                context={{ ...mockContext, title: 'Touch-Friendly Card' }}
                onClick={fn()}
                onEdit={fn()}
                onDuplicate={fn()}
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
              Try keyboard navigation: Tab to focus elements, Enter/Space to activate.
              Focus order follows visual layout (card → edit → duplicate → menu).
            </p>
            <table className="w-full text-sm mb-3">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 font-medium">Key</th>
                  <th className="text-left p-2 font-medium">Action</th>
                  <th className="text-left p-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd></td>
                  <td className="p-2">Focus next element</td>
                  <td className="p-2">Natural reading order</td>
                </tr>
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Shift+Tab</kbd></td>
                  <td className="p-2">Focus previous element</td>
                  <td className="p-2">Reverse navigation</td>
                </tr>
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Enter/Space</kbd></td>
                  <td className="p-2">Activate focused element</td>
                  <td className="p-2">Click card or button</td>
                </tr>
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd></td>
                  <td className="p-2">Close menu/modal</td>
                  <td className="p-2">Returns focus to trigger</td>
                </tr>
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={{ ...mockContext, title: 'Keyboard Card 1' }}
                onClick={fn()}
                onEdit={fn()}
                onDuplicate={fn()}
              />
              <ContextCard
                context={{ ...mockContext, title: 'Keyboard Card 2' }}
                onClick={fn()}
                onEdit={fn()}
                onDuplicate={fn()}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Focus Indicators</h4>
            <p className="text-sm text-text-muted mb-3">
              Visible focus rings with 2px width and high contrast. Focus indicators never obscured by content.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={{ ...mockContext, title: 'Focus Ring Example' }}
                onClick={fn()}
                onEdit={fn()}
              />
              <ContextCard
                context={{ ...mockContext, title: 'Focus States Demo' }}
                onClick={fn()}
                onEdit={fn()}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Screen Reader Support</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Semantic Structure</h4>
            <p className="text-sm text-text-muted mb-3">
              Proper heading hierarchy, semantic HTML, and ARIA labels. Card announced as
              "article" with title as heading. Buttons clearly labeled with purpose.
            </p>
            <ul className="text-sm text-text-muted space-y-2 list-disc list-inside mb-3">
              <li>Card: "Brand Voice Guidelines, article"</li>
              <li>Edit button: "Edit Brand Voice Guidelines"</li>
              <li>Duplicate button: "Duplicate Brand Voice Guidelines"</li>
              <li>Menu button: "More options for Brand Voice Guidelines"</li>
              <li>Source badge: "Manual" or "URL https://example.com"</li>
              <li>Selection checkbox: "Select Brand Voice Guidelines"</li>
            </ul>
            <ContextCard
              context={mockContext}
              selectable
              onClick={fn()}
              onEdit={fn()}
              onDuplicate={fn()}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Live Regions</h4>
            <p className="text-sm text-text-muted mb-3">
              Error messages announced via aria-live regions. Selection changes communicated.
              Status updates don't interrupt user.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={{ ...mockContext, title: 'Error Demo' }}
                state="error"
                error="Failed to load context body"
              />
              <ContextCard
                context={{ ...mockContext, title: 'Selection Demo' }}
                selectable
                selected
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">High Contrast Mode</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Windows High Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              Cards maintain visibility and structure in system high contrast modes.
              Borders and focus indicators properly rendered.
            </p>
            <div className="p-4 bg-gray-900 rounded">
              <div className="grid grid-cols-2 gap-4">
                <ContextCard
                  context={{ ...mockContext, title: 'Dark Background Card' }}
                  onClick={fn()}
                />
                <ContextCard
                  context={{ ...mockContext, title: 'High Contrast Demo' }}
                  state="selected"
                  onClick={fn()}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Forced Colors Mode</h4>
            <p className="text-sm text-text-muted mb-3">
              Icons and borders remain visible using forced-colors media query.
              Semantic HTML ensures content hierarchy preserved.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={mockContext}
                onClick={fn()}
                onEdit={fn()}
              />
              <ContextCard
                context={{ ...mockContext, title: 'Forced Colors Test' }}
                onClick={fn()}
              />
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
              Respects prefers-reduced-motion. Hover effects use instant state changes instead of
              transitions. No auto-playing animations. Focus changes don't trigger motion.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={{ ...mockContext, title: 'Reduced Motion Card' }}
                onClick={fn()}
                onEdit={fn()}
              />
              <ContextCard
                context={{ ...mockContext, title: 'Hover Me (No Animation)' }}
                onClick={fn()}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Error Handling & Recovery</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Accessible Error Messages</h4>
            <p className="text-sm text-text-muted mb-3">
              Error messages are clear, actionable, and announced to screen readers.
              Retry buttons clearly labeled and keyboard accessible.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ContextCard
                context={{ ...mockContext, title: 'Error State' }}
                state="error"
                error="Failed to load context body. Please try again."
              />
              <ContextCard
                context={{ ...mockContext, title: 'Error with Retry' }}
                state="error"
                error={{
                  message: 'Network error while fetching context',
                  retry: fn(),
                }}
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
        story: 'Comprehensive accessibility showcase demonstrating WCAG 2.1 AA compliance, keyboard navigation, screen reader support, high contrast mode, reduced motion preferences, and error handling. All interactive elements are fully accessible and meet or exceed accessibility standards.',
      },
    },
  },
};
