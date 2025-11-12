import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import {
  User,
  Settings,
  LogOut,
  HelpCircle,
  CreditCard,
  Bell,
  Shield,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Share,
  Plus,
  Check
} from 'lucide-react';
import { Button } from '../components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../components/DropdownMenu';

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A dropdown menu component built on Radix UI that provides accessible menu interactions with keyboard navigation, focus management, and portal rendering.

**Accessibility Features:**
- Full keyboard navigation (Arrow keys, Enter, Space, Escape, Tab)
- Automatic focus management and restoration
- Screen reader support with proper ARIA attributes
- Portal rendering for proper layering
- Disabled state handling

**Usage Guidelines:**
- Use for user profile menus, context menus, and action menus
- Group related items with DropdownMenuGroup and separators
- Use DropdownMenuLabel for section headers
- Use destructive styling for dangerous actions
- Include keyboard shortcuts when applicable

**Design System Integration:**
Uses design tokens for colors, spacing, shadows, and animations. Supports both light and dark themes.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: { type: 'boolean' },
    },
  },
  args: { onOpenChange: fn() },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserProfile: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <User className="h-4 w-4 mr-2" />
          John Doe
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A typical user profile dropdown menu with account actions, settings, and sign out.',
      },
    },
  },
};

export const ContextMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          <span>Share</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A context menu for item actions like edit, duplicate, share, and delete.',
      },
    },
  },
};

export const WithCheckboxes: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">View Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>View Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>
          Show Toolbar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={false}>
          Show Sidebar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>
          Show Status Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem>
          Full Screen Mode
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dropdown menu with checkbox items for toggling view options.',
      },
    },
  },
};

export const WithRadioGroup: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Theme</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value="light">
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dropdown menu with radio group for exclusive selection options.',
      },
    },
  },
};

export const WithSubmenus: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">More Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>
          <Plus className="mr-2 h-4 w-4" />
          <span>New File</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Share className="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <span>Share via Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Share via Link</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Share via Social</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Preferences</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dropdown menu with nested submenus for organizing complex actions.',
      },
    },
  },
};

export const DisabledItems: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy (Disabled)</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          <span>Share</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled destructive>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete (Disabled)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dropdown menu with disabled items to show unavailable actions.',
      },
    },
  },
};

export const AccessibilityDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold text-text-strong">Accessibility Features</h3>
      <div className="flex gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label="User account menu">
              <User className="h-4 w-4 mr-2" />
              Account
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              <span>Privacy</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="text-sm text-text-muted max-w-md">
        <strong>Keyboard Navigation:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Arrow keys to navigate menu items</li>
          <li>Enter or Space to activate items</li>
          <li>Escape to close menu</li>
          <li>Tab to move focus out of menu</li>
          <li>Focus automatically returns to trigger</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including keyboard navigation, ARIA labels, and focus management.',
      },
    },
  },
};

export const AllVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-4">
      <h3 className="text-lg font-semibold text-text-strong">DropdownMenu Variations</h3>

      <div className="flex flex-wrap gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">Default Button</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action 1</DropdownMenuItem>
            <DropdownMenuItem>Action 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Outline Button</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action 1</DropdownMenuItem>
            <DropdownMenuItem>Action 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem destructive>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-sm text-text-muted">
        Different trigger styles and menu contents showing the flexibility of the component.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various trigger button styles and menu configurations.',
      },
    },
  },
};
