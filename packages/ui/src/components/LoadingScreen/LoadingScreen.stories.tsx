import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingScreen } from './LoadingScreen';

/**
 * LoadingScreen component for full-page or section loading states.
 *
 * Variants:
 * - **spinner**: Animated spinner with optional message
 * - **skeleton**: Skeleton placeholder for content
 * - **progress**: Progress bar with percentage
 *
 * Accessibility Features:
 * - Respects `prefers-reduced-motion` (spinner animation disabled)
 * - ARIA live regions announce loading state to screen readers
 * - Progress updates are announced for screen readers
 * - Proper `role="status"` and `aria-busy="true"`
 */
const meta = {
  title: 'Foundation/LoadingScreen',
  component: LoadingScreen,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'LoadingScreen displays loading states with three variants: spinner, skeleton, and progress. Fully accessible with screen reader announcements and reduced motion support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['spinner', 'skeleton', 'progress'],
      description: 'Visual style of the loading indicator',
    },
    fullScreen: {
      control: 'boolean',
      description: 'Whether to use full screen height',
    },
    message: {
      control: 'text',
      description: 'Loading message to display',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (0-100) for progress variant',
      if: { arg: 'variant', eq: 'progress' },
    },
    skeletonLines: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of skeleton lines for skeleton variant',
      if: { arg: 'variant', eq: 'skeleton' },
    },
  },
} satisfies Meta<typeof LoadingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default spinner variant with standard loading message.
 */
export const Default: Story = {
  args: {
    variant: 'spinner',
    message: 'Loading...',
  },
};

/**
 * Spinner variant with custom loading message.
 */
export const SpinnerWithCustomMessage: Story = {
  args: {
    variant: 'spinner',
    message: 'Loading your prompts...',
  },
};

/**
 * Spinner variant with full screen height.
 */
export const SpinnerFullScreen: Story = {
  args: {
    variant: 'spinner',
    message: 'Loading application...',
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Skeleton variant with default 5 lines.
 */
export const SkeletonDefault: Story = {
  args: {
    variant: 'skeleton',
    message: 'Loading content...',
  },
};

/**
 * Skeleton variant with 3 lines (compact).
 */
export const SkeletonCompact: Story = {
  args: {
    variant: 'skeleton',
    skeletonLines: 3,
    message: 'Loading preview...',
  },
};

/**
 * Skeleton variant with 7 lines (detailed).
 */
export const SkeletonDetailed: Story = {
  args: {
    variant: 'skeleton',
    skeletonLines: 7,
    message: 'Loading detailed view...',
  },
};

/**
 * Skeleton variant with full screen height.
 */
export const SkeletonFullScreen: Story = {
  args: {
    variant: 'skeleton',
    skeletonLines: 5,
    message: 'Loading page...',
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Progress variant at 0% (just started).
 */
export const ProgressStart: Story = {
  args: {
    variant: 'progress',
    progress: 0,
    message: 'Starting upload...',
  },
};

/**
 * Progress variant at 25% (in progress).
 */
export const ProgressQuarter: Story = {
  args: {
    variant: 'progress',
    progress: 25,
    message: 'Uploading file... 25%',
  },
};

/**
 * Progress variant at 50% (halfway).
 */
export const ProgressHalf: Story = {
  args: {
    variant: 'progress',
    progress: 50,
    message: 'Processing... 50%',
  },
};

/**
 * Progress variant at 75% (nearly complete).
 */
export const ProgressThreeQuarters: Story = {
  args: {
    variant: 'progress',
    progress: 75,
    message: 'Almost done... 75%',
  },
};

/**
 * Progress variant at 100% (complete).
 */
export const ProgressComplete: Story = {
  args: {
    variant: 'progress',
    progress: 100,
    message: 'Complete!',
  },
};

/**
 * Progress variant with full screen height.
 */
export const ProgressFullScreen: Story = {
  args: {
    variant: 'progress',
    progress: 60,
    message: 'Importing data... 60%',
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Accessibility test: Reduced motion
 * When prefers-reduced-motion is enabled, animations should be disabled.
 */
export const ReducedMotion: Story = {
  args: {
    variant: 'spinner',
    message: 'Loading with reduced motion...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The spinner respects the `prefers-reduced-motion` media query. When enabled, the spinner animation is disabled via CSS `motion-reduce:animate-none`.',
      },
    },
  },
};

/**
 * Accessibility test: Screen reader announcements
 * All variants include proper ARIA live regions and screen reader text.
 */
export const ScreenReaderTest: Story = {
  args: {
    variant: 'progress',
    progress: 65,
    message: 'Processing your request... 65%',
  },
  parameters: {
    docs: {
      description: {
        story:
          'LoadingScreen includes:\n- `role="status"` for semantic meaning\n- `aria-live="polite"` for non-intrusive announcements\n- `aria-busy="true"` to indicate loading state\n- Screen reader-only text with progress percentage\n- All loading messages are announced',
      },
    },
  },
};

/**
 * Example: Loading prompts list
 */
export const LoadingPromptsList: Story = {
  args: {
    variant: 'skeleton',
    skeletonLines: 5,
    message: 'Loading your prompts...',
  },
};

/**
 * Example: Uploading file
 */
export const UploadingFile: Story = {
  args: {
    variant: 'progress',
    progress: 45,
    message: 'Uploading prompts.json... 45%',
  },
};

/**
 * Example: Initial page load
 */
export const InitialPageLoad: Story = {
  args: {
    variant: 'spinner',
    message: 'Loading MeatyPrompts...',
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};
