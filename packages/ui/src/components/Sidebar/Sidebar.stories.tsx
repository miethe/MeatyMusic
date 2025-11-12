import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { SidebarContent } from './SidebarContent';
import { SidebarSkeleton } from './SidebarSkeleton';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A flexible sidebar component with responsive behavior, transitions, and accessibility features.',
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    position: { control: 'radio', options: ['left', 'right'] },
    width: { control: 'number' },
    mobileWidth: { control: 'number' },
    mobileBreakpoint: { control: 'number' },
    transitionDuration: { control: 'number' },
    collapsible: { control: 'boolean' },
    overlay: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const SampleContent = () => (
  <div className="p-4 space-y-4">
    <h3 className="text-lg font-semibold">Sample Content</h3>
    <div className="space-y-2">
      <Label htmlFor="sample-input">Sample Input</Label>
      <Input id="sample-input" placeholder="Type something..." />
    </div>
    <Button className="w-full">Action Button</Button>
  </div>
);

const FilterContent = () => (
  <div className="p-4 space-y-4">
    <div>
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <select id="category" className="w-full mt-1 p-2 border rounded">
            <option>All Categories</option>
            <option>Development</option>
            <option>Design</option>
            <option>Marketing</option>
          </select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" className="w-full mt-1 p-2 border rounded">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Archived</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">Clear</Button>
          <Button className="flex-1">Apply</Button>
        </div>
      </div>
    </div>
  </div>
);

export const Default: Story = {
  args: {
    isOpen: true,
    children: <SampleContent />,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(args.isOpen);

    return (
      <div className="h-screen flex">
        <Sidebar
          {...args}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Main Content</h1>
            <p className="mb-4">
              This is the main content area. The sidebar is currently{' '}
              <strong>{isOpen ? 'open' : 'closed'}</strong>.
            </p>
            <Button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? 'Close' : 'Open'} Sidebar
            </Button>
          </div>
        </main>
      </div>
    );
  },
};

export const WithFilters: Story = {
  args: {
    isOpen: true,
    children: <FilterContent />,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(args.isOpen);

    return (
      <div className="h-screen flex">
        <Sidebar
          {...args}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Filtered Content</h1>
            <p className="mb-4">
              This demonstrates a sidebar with filter controls.
            </p>
          </div>
        </main>
      </div>
    );
  },
};

export const RightSidebar: Story = {
  args: {
    isOpen: true,
    position: 'right',
    children: <SampleContent />,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(args.isOpen);

    return (
      <div className="h-screen flex">
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Main Content</h1>
            <p className="mb-4">
              Sidebar positioned on the right side.
            </p>
            <Button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? 'Close' : 'Open'} Sidebar
            </Button>
          </div>
        </main>
        <Sidebar
          {...args}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    );
  },
};

export const Collapsible: Story = {
  args: {
    isOpen: true,
    collapsible: true,
    children: <SampleContent />,
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(args.isOpen);

    return (
      <div className="h-screen flex">
        <Sidebar
          {...args}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Collapsible Sidebar</h1>
            <p className="mb-4">
              This sidebar can be collapsed to save space.
            </p>
            <Button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? 'Collapse' : 'Expand'} Sidebar
            </Button>
          </div>
        </main>
      </div>
    );
  },
};

export const Empty: Story = {
  args: {
    isOpen: true,
    children: null,
  },
  render: (args) => (
    <div className="h-screen flex">
      <Sidebar {...args} />
      <main className="flex-1 p-6 bg-background">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold mb-4">Empty Sidebar</h1>
          <p>
            When the sidebar has no content, it automatically hides with aria-hidden="true".
          </p>
        </div>
      </main>
    </div>
  ),
};

export const WithErrorBoundary: Story = {
  render: () => {
    const [hasError, setHasError] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const ErrorComponent = () => {
      if (hasError) {
        throw new Error('Simulated sidebar content error');
      }
      return <SampleContent />;
    };

    return (
      <div className="h-screen flex">
        <Sidebar isOpen={isOpen} onOpenChange={setIsOpen}>
          <SidebarContent>
            <ErrorComponent />
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Error Boundary Demo</h1>
            <p className="mb-4">
              This demonstrates the sidebar's error boundary functionality.
            </p>
            <Button onClick={() => setHasError(!hasError)}>
              {hasError ? 'Fix' : 'Break'} Sidebar Content
            </Button>
          </div>
        </main>
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen flex">
        <Sidebar isOpen={isOpen} onOpenChange={setIsOpen}>
          <SidebarContent
            loading={isLoading}
            loadingSkeleton={<SidebarSkeleton variant="filters" />}
          >
            <FilterContent />
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Loading State</h1>
            <p className="mb-4">
              This demonstrates the sidebar's loading state with skeleton.
            </p>
            <Button onClick={() => setIsLoading(!isLoading)}>
              {isLoading ? 'Finish' : 'Start'} Loading
            </Button>
          </div>
        </main>
      </div>
    );
  },
};

export const SkeletonVariants: Story = {
  render: () => (
    <div className="h-screen flex gap-4 p-4">
      <div className="w-72 bg-background border rounded">
        <h3 className="p-2 font-semibold border-b">Default</h3>
        <SidebarSkeleton variant="default" />
      </div>
      <div className="w-72 bg-background border rounded">
        <h3 className="p-2 font-semibold border-b">Filters</h3>
        <SidebarSkeleton variant="filters" />
      </div>
      <div className="w-72 bg-background border rounded">
        <h3 className="p-2 font-semibold border-b">Navigation</h3>
        <SidebarSkeleton variant="navigation" />
      </div>
      <div className="w-72 bg-background border rounded">
        <h3 className="p-2 font-semibold border-b">Content</h3>
        <SidebarSkeleton variant="content" />
      </div>
    </div>
  ),
};
