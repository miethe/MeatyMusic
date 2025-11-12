import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulkActions } from './BulkActions';
import {
  Trash2,
  FolderPlus,
  Download,
  Archive,
  Tag,
  Copy,
} from 'lucide-react';

/**
 * BulkActions component for sticky bottom bar with bulk operations.
 *
 * Features:
 * - Sticky bottom bar that appears when items are selected
 * - Selected count display
 * - Multiple action buttons with icons
 * - Clear selection button
 * - Responsive layout
 *
 * Accessibility Features:
 * - Focus management: clear button receives focus when bar appears
 * - Keyboard interaction: Escape key clears selection
 * - ARIA toolbar role with label
 * - Clear indication of selected count
 * - All buttons are keyboard accessible
 */
const meta = {
  title: 'Foundation/BulkActions',
  component: BulkActions,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'BulkActions displays a sticky bottom bar when items are selected, providing quick access to bulk operations. Automatically manages focus and keyboard interactions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selectedCount: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Number of selected items',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[300px] p-8">
        <div className="mb-8 p-4 border rounded">
          <p className="text-sm text-text-muted">
            Content area - The bulk actions bar appears at the bottom when items
            are selected.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BulkActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single action with one selected item.
 */
export const SingleAction: Story = {
  args: {
    selectedCount: 1,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete action'),
        variant: 'destructive',
      },
    ],
  },
};

/**
 * Multiple actions with several selected items.
 */
export const MultipleActions: Story = {
  args: {
    selectedCount: 5,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete action'),
        variant: 'destructive',
      },
      {
        label: 'Add to Collection',
        icon: FolderPlus,
        onClick: () => console.log('Add to collection'),
      },
      {
        label: 'Download',
        icon: Download,
        onClick: () => console.log('Download'),
      },
    ],
  },
};

/**
 * Many actions demonstrating wrapping behavior.
 */
export const ManyActions: Story = {
  args: {
    selectedCount: 12,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete'),
        variant: 'destructive',
      },
      {
        label: 'Archive',
        icon: Archive,
        onClick: () => console.log('Archive'),
      },
      {
        label: 'Add to Collection',
        icon: FolderPlus,
        onClick: () => console.log('Add to collection'),
      },
      {
        label: 'Add Tags',
        icon: Tag,
        onClick: () => console.log('Add tags'),
      },
      {
        label: 'Duplicate',
        icon: Copy,
        onClick: () => console.log('Duplicate'),
      },
      {
        label: 'Export',
        icon: Download,
        onClick: () => console.log('Export'),
      },
    ],
  },
};

/**
 * With disabled actions.
 */
export const WithDisabledActions: Story = {
  args: {
    selectedCount: 3,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete'),
        variant: 'destructive',
      },
      {
        label: 'Add to Collection',
        icon: FolderPlus,
        onClick: () => console.log('Add to collection'),
        disabled: true,
      },
      {
        label: 'Export',
        icon: Download,
        onClick: () => console.log('Export'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Actions can be disabled based on context (e.g., insufficient permissions, incompatible items).',
      },
    },
  },
};

/**
 * Large selection count.
 */
export const LargeSelectionCount: Story = {
  args: {
    selectedCount: 247,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete All',
        icon: Trash2,
        onClick: () => console.log('Delete all'),
        variant: 'destructive',
      },
      {
        label: 'Export All',
        icon: Download,
        onClick: () => console.log('Export all'),
      },
    ],
  },
};

/**
 * Actions without icons.
 */
export const WithoutIcons: Story = {
  args: {
    selectedCount: 8,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        onClick: () => console.log('Delete'),
        variant: 'destructive',
      },
      {
        label: 'Add to Collection',
        onClick: () => console.log('Add to collection'),
      },
      {
        label: 'Export',
        onClick: () => console.log('Export'),
      },
    ],
  },
};

/**
 * Example: Prompts bulk actions
 */
export const PromptsBulkActions: Story = {
  args: {
    selectedCount: 7,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete prompts'),
        variant: 'destructive',
      },
      {
        label: 'Add to Collection',
        icon: FolderPlus,
        onClick: () => console.log('Add to collection'),
      },
      {
        label: 'Add Tags',
        icon: Tag,
        onClick: () => console.log('Add tags'),
      },
      {
        label: 'Export',
        icon: Download,
        onClick: () => console.log('Export prompts'),
      },
    ],
  },
};

/**
 * Example: Collections bulk actions
 */
export const CollectionsBulkActions: Story = {
  args: {
    selectedCount: 3,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete Collections',
        icon: Trash2,
        onClick: () => console.log('Delete collections'),
        variant: 'destructive',
      },
      {
        label: 'Archive',
        icon: Archive,
        onClick: () => console.log('Archive collections'),
      },
      {
        label: 'Export',
        icon: Download,
        onClick: () => console.log('Export collections'),
      },
    ],
  },
};

/**
 * Accessibility test: Focus management
 */
export const FocusManagement: Story = {
  args: {
    selectedCount: 4,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete'),
        variant: 'destructive',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the bar appears, focus automatically moves to the clear selection button. This helps keyboard users immediately interact with the bulk actions.',
      },
    },
  },
};

/**
 * Accessibility test: Keyboard interaction
 */
export const KeyboardInteraction: Story = {
  args: {
    selectedCount: 10,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete'),
        variant: 'destructive',
      },
      {
        label: 'Export',
        icon: Download,
        onClick: () => console.log('Export'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Keyboard navigation:\n- **Escape**: Clears selection and closes bar\n- **Tab**: Navigate between actions\n- **Enter/Space**: Activate focused action\n- ARIA toolbar role for screen reader context',
      },
    },
  },
};

/**
 * Accessibility test: Responsive layout
 */
export const ResponsiveLayout: Story = {
  args: {
    selectedCount: 6,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete'),
        variant: 'destructive',
      },
      {
        label: 'Add to Collection',
        icon: FolderPlus,
        onClick: () => console.log('Add to collection'),
      },
      {
        label: 'Export',
        icon: Download,
        onClick: () => console.log('Export'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'On mobile viewports, actions stack vertically below the selection count. On larger screens, they appear in the same row.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Accessibility test: ARIA labels
 */
export const AriaLabels: Story = {
  args: {
    selectedCount: 15,
    onClearSelection: () => console.log('Clear selection'),
    actions: [
      {
        label: 'Delete',
        icon: Trash2,
        onClick: () => console.log('Delete'),
        variant: 'destructive',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Accessibility features:\n- `role="toolbar"` with `aria-label="Bulk actions"`\n- Clear button has `aria-label="Clear selection"`\n- Selected count is clearly announced\n- All interactive elements are keyboard accessible',
      },
    },
  },
};
