import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, LoadingSkeleton } from './Skeleton';
import { PromptCardSkeleton as PromptCardSkeletonComponent } from '../PromptCard';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading skeleton components with shimmer animation support. Use to show loading states while content is being fetched.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="space-y-3 w-80">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="w-80 p-6 border border-border rounded-lg space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  ),
};

export const LoadingSkeletonBasic: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div>
        <h3 className="font-semibold mb-2">Single Line</h3>
        <LoadingSkeleton height="1rem" />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Multiple Lines</h3>
        <LoadingSkeleton height="1rem" lines={3} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Custom Width</h3>
        <LoadingSkeleton height="1rem" width="200px" />
      </div>
    </div>
  ),
};

export const LoadingSkeletonWithShimmer: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div>
        <h3 className="font-semibold mb-2">With Shimmer Animation</h3>
        <LoadingSkeleton height="1rem" lines={3} shimmer={true} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Without Animation</h3>
        <LoadingSkeleton height="1rem" lines={3} shimmer={false} />
      </div>
    </div>
  ),
};

export const LoadingSkeletonShapes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div>
        <h3 className="font-semibold mb-2">Rectangular (Default)</h3>
        <LoadingSkeleton height="3rem" width="200px" />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Circular</h3>
        <LoadingSkeleton height="3rem" width="3rem" circular={true} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Avatar with Name</h3>
        <div className="flex items-center space-x-3">
          <LoadingSkeleton height="2.5rem" width="2.5rem" circular={true} shimmer={true} />
          <div>
            <LoadingSkeleton height="1rem" width="120px" shimmer={true} />
            <LoadingSkeleton height="0.75rem" width="80px" shimmer={true} className="mt-1" />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const PromptCardSkeleton: Story = {
  render: () => (
    <div className="w-80">
      <PromptCardSkeletonComponent />
    </div>
  ),
};

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border border-border rounded-lg space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="p-4 border border-border rounded-lg space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Table */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  ),
};

// Performance comparison story
export const AnimationComparison: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div>
        <h3 className="font-semibold mb-2">Pulse Animation (Default)</h3>
        <LoadingSkeleton height="2rem" lines={3} shimmer={false} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Shimmer Animation</h3>
        <LoadingSkeleton height="2rem" lines={3} shimmer={true} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different animation styles. Shimmer provides a more modern feel while pulse is more performance-friendly.',
      },
    },
  },
};
