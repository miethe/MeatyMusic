import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox, Search, FolderOpen, Database, AlertCircle } from "lucide-react";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Components/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "EmptyState component for displaying empty states across the application. Used when there are no items to display, no search results, or no data available.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "compact", "centered"],
      description: "Visual variant of the empty state",
    },
    iconSize: {
      control: "select",
      options: ["default", "compact", "large"],
      description: "Size of the icon",
    },
    title: {
      control: "text",
      description: "Main title text",
    },
    description: {
      control: "text",
      description: "Optional description text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * Default empty state with icon, title, and description
 */
export const Default: Story = {
  args: {
    icon: Inbox,
    title: "No items found",
    description: "Get started by creating your first item",
    variant: "default",
  },
};

/**
 * Empty state with action button
 */
export const WithAction: Story = {
  args: {
    icon: FolderOpen,
    title: "No prompts yet",
    description: "Create your first prompt to get started with MeatyPrompts",
    action: {
      label: "Create Prompt",
      onClick: () => alert("Create prompt clicked"),
      variant: "default",
    },
  },
};

/**
 * Compact variant for smaller spaces
 */
export const Compact: Story = {
  args: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filters",
    variant: "compact",
    iconSize: "compact",
  },
};

/**
 * Centered variant for full-page empty states
 */
export const Centered: Story = {
  args: {
    icon: Database,
    title: "No data available",
    description: "We couldn't find any data to display. This might be temporary.",
    variant: "centered",
  },
};

/**
 * Empty state without description
 */
export const WithoutDescription: Story = {
  args: {
    icon: Inbox,
    title: "No notifications",
    variant: "default",
  },
};

/**
 * Empty state without icon
 */
export const WithoutIcon: Story = {
  args: {
    title: "Nothing to show",
    description: "Check back later for updates",
    variant: "default",
  },
};

/**
 * Large icon variant
 */
export const LargeIcon: Story = {
  args: {
    icon: FolderOpen,
    iconSize: "large",
    title: "Your collections are empty",
    description: "Organize your prompts into collections for better management",
    action: {
      label: "Create Collection",
      onClick: () => alert("Create collection clicked"),
      variant: "default",
    },
  },
};

/**
 * Error variant with alert icon
 */
export const ErrorState: Story = {
  args: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We encountered an error while loading this content",
    action: {
      label: "Try Again",
      onClick: () => alert("Retry clicked"),
      variant: "destructive",
    },
  },
};

/**
 * No search results
 */
export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: "No results for \"example query\"",
    description: "Try different keywords or check your spelling",
    variant: "default",
  },
};

/**
 * Empty collection
 */
export const EmptyCollection: Story = {
  args: {
    icon: FolderOpen,
    title: "This collection is empty",
    description: "Add prompts to this collection to organize your work",
    action: {
      label: "Add Prompts",
      onClick: () => alert("Add prompts clicked"),
      variant: "outline",
    },
  },
};

/**
 * Empty models list after filtering
 */
export const EmptyFilteredList: Story = {
  args: {
    icon: Search,
    title: "No models match your filters",
    description: "Try removing some filters to see more results",
    action: {
      label: "Clear Filters",
      onClick: () => alert("Clear filters clicked"),
      variant: "ghost",
    },
    variant: "compact",
  },
};

/**
 * Empty analytics dashboard
 */
export const NoAnalyticsData: Story = {
  args: {
    icon: Database,
    title: "No analytics data yet",
    description: "Start using prompts to see analytics and insights here",
    variant: "centered",
  },
};

/**
 * Accessibility Demo - Screen Reader Friendly
 */
export const AccessibilityDemo: Story = {
  args: {
    icon: Inbox,
    title: "Inbox Empty",
    description: "You have no new messages at this time.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story demonstrates accessibility features:\n\n" +
          "- `role=\"status\"` for status updates\n" +
          "- `aria-live=\"polite\"` for screen reader announcements\n" +
          "- `aria-hidden=\"true\"` on icon (decorative)\n" +
          "- Semantic HTML structure\n" +
          "- Keyboard accessible action button\n\n" +
          "**Testing with Screen Readers:**\n" +
          "- VoiceOver (macOS): Should announce the title and description\n" +
          "- NVDA (Windows): Should read the status region\n" +
          "- JAWS: Should announce content changes",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            // Ensure color contrast meets WCAG AA
            id: "color-contrast",
            enabled: true,
          },
          {
            // Ensure heading hierarchy is correct
            id: "heading-order",
            enabled: true,
          },
        ],
      },
    },
  },
};
