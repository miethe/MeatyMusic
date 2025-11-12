import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavigationTabs } from '../components/NavigationTabs';
import type { NavigationItem } from '../components/NavigationTabs';
import { Home, Search, Settings, User, Bookmark, TrendingUp } from 'lucide-react';

const meta: Meta<typeof NavigationTabs> = {
  title: 'Components/NavigationTabs',
  component: NavigationTabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A navigation tabs component for top-level navigation. Uses Radix UI tabs with proper ARIA attributes and keyboard navigation support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'default', 'lg'],
      description: 'Size variant of the navigation tabs',
    },
    currentPath: {
      control: 'text',
      description: 'Current active path to determine which tab should be active',
    },
    onNavigate: {
      action: 'navigate',
      description: 'Callback fired when a tab is clicked or activated via keyboard',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems: NavigationItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    label: 'Bookmarks',
    href: '/bookmarks',
    icon: Bookmark,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

const manyItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Analytics', href: '/analytics', icon: TrendingUp },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Default: Story = {
  args: {
    items: defaultItems,
    currentPath: '/',
    size: 'default',
  },
};

export const ActiveSearch: Story = {
  args: {
    items: defaultItems,
    currentPath: '/search',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the navigation tabs with the Search tab active.',
      },
    },
  },
};

export const WithNestedPath: Story = {
  args: {
    items: defaultItems,
    currentPath: '/settings/profile',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how nested paths are handled - the Settings tab is active for "/settings/profile".',
      },
    },
  },
};

export const WithoutIcons: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
    ],
    currentPath: '/about',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation tabs without icons, showing text-only labels.',
      },
    },
  },
};

export const WithDisabledTab: Story = {
  args: {
    items: [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Search', href: '/search', icon: Search },
      { label: 'Premium', href: '/premium', icon: TrendingUp, disabled: true },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
    currentPath: '/',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a navigation tab that is disabled (Premium tab).',
      },
    },
  },
};

export const SmallSize: Story = {
  args: {
    items: defaultItems.slice(0, 4),
    currentPath: '/bookmarks',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size variant of the navigation tabs.',
      },
    },
  },
};

export const LargeSize: Story = {
  args: {
    items: defaultItems.slice(0, 4),
    currentPath: '/profile',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Large size variant of the navigation tabs.',
      },
    },
  },
};

export const ManyTabs: Story = {
  args: {
    items: manyItems,
    currentPath: '/analytics',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the component handles many tabs. Consider using overflow scroll or dropdown for mobile.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    items: defaultItems,
    currentPath: '/',
    size: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test different configurations.',
      },
    },
  },
};
