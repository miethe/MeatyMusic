import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from './PageHeader';
import { Button } from '../Button/Button';
import { Plus, Download, Settings } from 'lucide-react';

/**
 * PageHeader component for consistent page headers across the application.
 *
 * Features:
 * - Title and optional subtitle
 * - Breadcrumb navigation
 * - Actions slot for buttons/controls
 * - Sticky variant for persistent headers
 * - Responsive layout
 *
 * Accessibility Features:
 * - Proper heading hierarchy (h1 for title)
 * - Semantic breadcrumb navigation with aria-label
 * - Header landmark role
 * - Keyboard accessible breadcrumbs
 * - aria-current="page" on active breadcrumb
 */
const meta = {
  title: 'Foundation/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'PageHeader provides a consistent header structure for pages with title, subtitle, breadcrumbs, and action buttons. Supports sticky positioning and responsive layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title (h1)',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle/description',
    },
    sticky: {
      control: 'boolean',
      description: 'Whether header sticks to top on scroll',
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic header with title only.
 */
export const Basic: Story = {
  args: {
    title: 'Prompts',
  },
};

/**
 * Header with title and subtitle.
 */
export const WithSubtitle: Story = {
  args: {
    title: 'Prompts',
    subtitle: 'Manage your AI prompts and templates',
  },
};

/**
 * Header with breadcrumb navigation.
 */
export const WithBreadcrumbs: Story = {
  args: {
    title: 'Edit Prompt',
    subtitle: 'Update your prompt details',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Prompts', href: '/prompts' },
      { label: 'Edit Prompt' },
    ],
  },
};

/**
 * Header with action button.
 */
export const WithSingleAction: Story = {
  args: {
    title: 'Prompts',
    subtitle: 'Manage your AI prompts and templates',
    actions: (
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Prompt
      </Button>
    ),
  },
};

/**
 * Header with multiple action buttons.
 */
export const WithMultipleActions: Story = {
  args: {
    title: 'Collections',
    subtitle: 'Organize your prompts into collections',
    actions: (
      <>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </>
    ),
  },
};

/**
 * Header with breadcrumbs and actions.
 */
export const WithBreadcrumbsAndActions: Story = {
  args: {
    title: 'Prompt Details',
    subtitle: 'View and manage your prompt',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Prompts', href: '/prompts' },
      { label: 'My First Prompt' },
    ],
    actions: (
      <>
        <Button variant="outline">
          <Settings className="h-4 w-4" />
        </Button>
        <Button>Edit</Button>
      </>
    ),
  },
};

/**
 * Sticky header that stays at top on scroll.
 */
export const Sticky: Story = {
  args: {
    title: 'Analytics Dashboard',
    subtitle: 'Track your prompt usage and performance',
    sticky: true,
    actions: (
      <Button variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export Report
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
        {/* Add scrollable content to demonstrate sticky behavior */}
        <div className="p-8 space-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="p-4 border rounded">
              Content block {i + 1}
            </div>
          ))}
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Sticky header remains at the top when scrolling. Uses `position: sticky` with `z-index: 10`.',
      },
    },
  },
};

/**
 * Header with deep breadcrumb hierarchy.
 */
export const DeepBreadcrumbs: Story = {
  args: {
    title: 'Nested Item',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Collections', href: '/collections' },
      { label: 'AI Prompts', href: '/collections/ai-prompts' },
      { label: 'GPT-4 Templates', href: '/collections/ai-prompts/gpt4' },
      { label: 'Nested Item' },
    ],
  },
};

/**
 * Example: Prompts listing page
 */
export const PromptsListPage: Story = {
  args: {
    title: 'Prompts',
    subtitle: 'Browse and manage your prompt library',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Prompts' }],
    actions: (
      <>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Prompt
        </Button>
      </>
    ),
  },
};

/**
 * Example: Settings page
 */
export const SettingsPage: Story = {
  args: {
    title: 'Settings',
    subtitle: 'Manage your account and preferences',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Settings' }],
  },
};

/**
 * Example: Collections detail page
 */
export const CollectionDetailPage: Story = {
  args: {
    title: 'GPT-4 Best Practices',
    subtitle: '12 prompts • Updated 2 days ago',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Collections', href: '/collections' },
      { label: 'GPT-4 Best Practices' },
    ],
    actions: (
      <>
        <Button variant="outline">Share</Button>
        <Button variant="outline">
          <Settings className="h-4 w-4" />
        </Button>
        <Button>Add Prompts</Button>
      </>
    ),
  },
};

/**
 * Accessibility test: Proper heading hierarchy
 */
export const AccessibilityHeadingHierarchy: Story = {
  args: {
    title: 'Page Title',
    subtitle: 'This is an h1 element with proper semantic meaning',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The title uses an `<h1>` element for proper heading hierarchy. Each page should have exactly one h1 element.',
      },
    },
  },
};

/**
 * Accessibility test: Breadcrumb navigation
 */
export const AccessibilityBreadcrumbs: Story = {
  args: {
    title: 'Current Page',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Parent', href: '/parent' },
      { label: 'Current Page' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Breadcrumbs use semantic `<nav>` with `aria-label="Breadcrumb"` and `aria-current="page"` on the active item. Links are keyboard accessible.',
      },
    },
  },
};

/**
 * Accessibility test: Responsive layout
 */
export const ResponsiveLayout: Story = {
  args: {
    title: 'Responsive Header',
    subtitle: 'Actions move below title on mobile viewports',
    actions: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'On mobile viewports (< 640px), actions move below the title. On larger screens, they appear on the same row.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
