import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { Menu, Settings, User, X, Plus } from 'lucide-react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Label } from '../Label/Label';
import { Separator } from '../Separator/Separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './Sheet';

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A panel that slides out from the edge of the screen. Perfect for navigation menus, forms, or additional content that doesn't need to block the entire interface.

**Accessibility Features:**
- Focus trap: Focus stays within sheet when open
- Escape key support to close the sheet
- Click outside to close (configurable)
- Screen reader support with proper ARIA attributes
- Return focus to trigger element when closed
- WCAG 2.1 AA compliant focus indicators

**Usage Guidelines:**
- Use for navigation menus, settings panels, or secondary content
- Choose appropriate side based on reading direction and content type
- Include a close button for explicit dismissal
- Keep content scannable with clear headings and sections
- Consider mobile responsive behavior

**Design System Integration:**
All animations, spacing, and colors use design tokens from @meaty/tokens for consistent theming.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a description of what this sheet contains or what action the user can take.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Sheet content goes here. This could be a form, navigation menu, or any other content.
          </p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Menu className="h-4 w-4 mr-2" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>
            Access different sections of the application.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start text-destructive">
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open from Top</Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Notification Center</SheetTitle>
          <SheetDescription>
            Recent notifications and updates.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="font-medium text-sm">New message received</div>
            <div className="text-xs text-muted-foreground">2 minutes ago</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-medium text-sm">Task completed</div>
            <div className="text-xs text-muted-foreground">1 hour ago</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open from Bottom</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
          <SheetDescription>
            Frequently used actions and shortcuts.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="grid grid-cols-3 gap-4">
            <Button size="lg" variant="outline" className="h-20 flex flex-col gap-2">
              <Plus className="h-6 w-6" />
              <span className="text-xs">New Item</span>
            </Button>
            <Button size="lg" variant="outline" className="h-20 flex flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span className="text-xs">Settings</span>
            </Button>
            <Button size="lg" variant="outline" className="h-20 flex flex-col gap-2">
              <User className="h-6 w-6" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const FormExample: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Edit Profile</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" defaultValue="@peduarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" defaultValue="pedro@example.com" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>Open Sheet</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close Sheet
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Sheet is {open ? 'open' : 'closed'}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Controlled Sheet</SheetTitle>
              <SheetDescription>
                This sheet's open state is controlled externally.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm">
                You can control the sheet state programmatically using the open and onOpenChange props.
              </p>
            </div>
            <SheetFooter>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A controlled Sheet component where the open state is managed externally.',
      },
    },
  },
};

export const NoOverlay: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open without Overlay</Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        {/* Custom content without using SheetOverlay */}
        <SheetHeader>
          <SheetTitle>Custom Sheet</SheetTitle>
          <SheetDescription>
            This sheet demonstrates custom styling options.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            You can customize the sheet appearance by not using the default overlay or by applying custom styles.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const AllSides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Left</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Left Sheet</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Right</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Right Sheet</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Top</Button>
        </SheetTrigger>
        <SheetContent side="top" className="h-[300px]">
          <SheetHeader>
            <SheetTitle>Top Sheet</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[300px]">
          <SheetHeader>
            <SheetTitle>Bottom Sheet</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sheets can slide out from any edge of the screen.',
      },
    },
  },
};

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Accessible Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Accessibility Features</SheetTitle>
            <SheetDescription>
              This sheet demonstrates built-in accessibility features.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessible-input">Accessible Input</Label>
              <Input
                id="accessible-input"
                placeholder="This input is properly labeled"
                aria-describedby="input-help"
              />
              <div id="input-help" className="text-xs text-muted-foreground">
                Help text is associated with the input via aria-describedby
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="text-sm text-muted-foreground space-y-2">
        <div><strong>Accessibility features:</strong></div>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Focus is trapped within the sheet when open</li>
          <li>Escape key closes the sheet</li>
          <li>Focus returns to trigger when closed</li>
          <li>Screen reader support with ARIA attributes</li>
          <li>Click outside to close (can be disabled)</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including focus management and keyboard navigation.',
      },
    },
  },
};
