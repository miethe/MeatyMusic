import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Check, X, AlertCircle, Info, Star, Tag } from 'lucide-react';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A versatile badge component for displaying labels, status indicators, tags, and counts.

## Features
- Multiple semantic color variants (success, warning, danger, info)
- Collection color variants for color-coded organization
- Three size options (sm, md, lg)
- Pill and rounded shapes
- Optional dismiss functionality
- Built with design tokens for theme consistency
- WCAG AA compliant contrast ratios

## Accessibility
- Proper focus states with visible ring
- Keyboard navigation support for dismissible badges
- Screen reader friendly with aria-label support
- Color is not the only indicator (use with icons or labels)

## Usage Guidelines
- **Default**: Primary actions or default states
- **Success**: Completed states, confirmations
- **Warning**: Caution states, pending actions
- **Danger**: Error states, destructive actions
- **Info**: Informational states, neutral highlights
- **Secondary**: Alternative actions or states
- **Accent**: Featured or highlighted items
- **Outline**: Subtle, non-intrusive labels
- **Collection colors**: Color-code collections, categories, or tags
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'accent',
        'success',
        'warning',
        'danger',
        'info',
        'outline',
        'collection-primary',
        'collection-secondary',
        'collection-accent',
        'collection-purple',
        'collection-green',
        'collection-orange',
        'collection-blue',
        'collection-red',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    shape: {
      control: 'select',
      options: ['rounded', 'pill'],
    },
    dismissible: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default badge with primary color
 */
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

/**
 * Semantic color variants for different states and meanings
 */
export const SemanticVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

/**
 * Collection color variants for organizing and categorizing content
 */
export const CollectionColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="collection-primary">Primary</Badge>
      <Badge variant="collection-secondary">Secondary</Badge>
      <Badge variant="collection-accent">Accent</Badge>
      <Badge variant="collection-purple">Purple</Badge>
      <Badge variant="collection-green">Green</Badge>
      <Badge variant="collection-orange">Orange</Badge>
      <Badge variant="collection-blue">Blue</Badge>
      <Badge variant="collection-red">Red</Badge>
    </div>
  ),
};

/**
 * Three size variants: small, medium (default), and large
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm" variant="default">Small</Badge>
      <Badge size="md" variant="default">Medium</Badge>
      <Badge size="lg" variant="default">Large</Badge>
    </div>
  ),
};

/**
 * Rounded (default) and pill-shaped badges
 */
export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge shape="rounded" variant="default">Rounded</Badge>
      <Badge shape="pill" variant="default">Pill Shape</Badge>
    </div>
  ),
};

/**
 * Badges with icons for enhanced meaning
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success">
        <Check className="h-3 w-3" />
        Completed
      </Badge>
      <Badge variant="danger">
        <X className="h-3 w-3" />
        Failed
      </Badge>
      <Badge variant="warning">
        <AlertCircle className="h-3 w-3" />
        Pending
      </Badge>
      <Badge variant="info">
        <Info className="h-3 w-3" />
        Note
      </Badge>
      <Badge variant="accent">
        <Star className="h-3 w-3" />
        Featured
      </Badge>
    </div>
  ),
};

/**
 * Dismissible badges with close button
 */
export const Dismissible: Story = {
  render: () => {
    const [badges, setBadges] = React.useState([
      { id: 1, label: 'Tag 1', variant: 'default' as const },
      { id: 2, label: 'Tag 2', variant: 'secondary' as const },
      { id: 3, label: 'Tag 3', variant: 'success' as const },
    ]);

    const removeBadge = (id: number) => {
      setBadges(badges.filter((badge) => badge.id !== id));
    };

    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge
            key={badge.id}
            variant={badge.variant}
            dismissible
            onDismiss={() => removeBadge(badge.id)}
          >
            {badge.label}
          </Badge>
        ))}
      </div>
    );
  },
};

/**
 * Status indicators for different states
 */
export const StatusIndicators: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-mp-text-base">API Status:</span>
        <Badge variant="success" size="sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1" />
          Online
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-mp-text-base">Build Status:</span>
        <Badge variant="warning" size="sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
          Building
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-mp-text-base">Deployment:</span>
        <Badge variant="danger" size="sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1" />
          Failed
        </Badge>
      </div>
    </div>
  ),
};

/**
 * Count badges for notifications and metrics
 */
export const Counts: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-mp-text-base">Notifications</span>
        <Badge variant="danger" size="sm" shape="pill">12</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-mp-text-base">Messages</span>
        <Badge variant="info" size="sm" shape="pill">5</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-mp-text-base">Tasks</span>
        <Badge variant="success" size="sm" shape="pill">23</Badge>
      </div>
    </div>
  ),
};

/**
 * Tag system for categorization
 */
export const Tags: Story = {
  render: () => (
    <div className="max-w-md">
      <h3 className="text-sm font-semibold text-mp-text-strong mb-2">Project Tags</h3>
      <div className="flex flex-wrap gap-2">
        <Badge variant="collection-blue" size="sm" shape="pill">
          <Tag className="h-3 w-3" />
          Frontend
        </Badge>
        <Badge variant="collection-green" size="sm" shape="pill">
          <Tag className="h-3 w-3" />
          API
        </Badge>
        <Badge variant="collection-purple" size="sm" shape="pill">
          <Tag className="h-3 w-3" />
          Design
        </Badge>
        <Badge variant="collection-orange" size="sm" shape="pill">
          <Tag className="h-3 w-3" />
          Documentation
        </Badge>
        <Badge variant="collection-red" size="sm" shape="pill">
          <Tag className="h-3 w-3" />
          Bug
        </Badge>
      </div>
    </div>
  ),
};

/**
 * Collection categorization example
 */
export const CollectionCategorization: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-mp-surface border border-mp-border rounded-mp-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-mp-text-strong">Code Snippets</h3>
          <Badge variant="collection-blue" size="sm">24 items</Badge>
        </div>
        <p className="text-sm text-mp-text-muted">Development code examples and templates</p>
      </div>

      <div className="p-4 bg-mp-surface border border-mp-border rounded-mp-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-mp-text-strong">Design Resources</h3>
          <Badge variant="collection-purple" size="sm">18 items</Badge>
        </div>
        <p className="text-sm text-mp-text-muted">UI/UX design files and assets</p>
      </div>

      <div className="p-4 bg-mp-surface border border-mp-border rounded-mp-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-mp-text-strong">Marketing Copy</h3>
          <Badge variant="collection-orange" size="sm">32 items</Badge>
        </div>
        <p className="text-sm text-mp-text-muted">Marketing materials and copy templates</p>
      </div>
    </div>
  ),
};

/**
 * All sizes with all semantic variants
 */
export const SizeVariantMatrix: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-mp-text-strong mb-2">Small</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" size="sm">Default</Badge>
          <Badge variant="success" size="sm">Success</Badge>
          <Badge variant="warning" size="sm">Warning</Badge>
          <Badge variant="danger" size="sm">Danger</Badge>
          <Badge variant="info" size="sm">Info</Badge>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-mp-text-strong mb-2">Medium</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" size="md">Default</Badge>
          <Badge variant="success" size="md">Success</Badge>
          <Badge variant="warning" size="md">Warning</Badge>
          <Badge variant="danger" size="md">Danger</Badge>
          <Badge variant="info" size="md">Info</Badge>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-mp-text-strong mb-2">Large</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" size="lg">Default</Badge>
          <Badge variant="success" size="lg">Success</Badge>
          <Badge variant="warning" size="lg">Warning</Badge>
          <Badge variant="danger" size="lg">Danger</Badge>
          <Badge variant="info" size="lg">Info</Badge>
        </div>
      </div>
    </div>
  ),
};

/**
 * Accessibility example with proper contrast and labeling
 */
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-mp-text-strong mb-2">
          Good: Icon + Text (redundant encoding)
        </h4>
        <div className="flex gap-2">
          <Badge variant="success">
            <Check className="h-3 w-3" />
            Verified
          </Badge>
          <Badge variant="danger">
            <X className="h-3 w-3" />
            Rejected
          </Badge>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-mp-text-strong mb-2">
          Good: Text-only with clear meaning
        </h4>
        <div className="flex gap-2">
          <Badge variant="success">Active</Badge>
          <Badge variant="danger">Inactive</Badge>
        </div>
      </div>
    </div>
  ),
};
