import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DraftBanner } from './DraftBanner';

const meta: Meta<typeof DraftBanner> = {
  title: 'Components/DraftBanner',
  component: DraftBanner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Alert banner for draft recovery with responsive layout and accessibility features.

**Features:**
- Blue accent styling for draft alerts
- Automatic focus on Resume button
- Responsive layout (stacks buttons on mobile)
- Title truncation at 50 characters
- ARIA role="alert" for screen readers
- Time formatting (HH:MM AM/PM)

**Accessibility:**
- \`role="alert"\` announces banner to screen readers
- Labeled buttons for clear action intent
- Keyboard navigation (Tab → Resume → Discard)
- Initial focus on Resume button (primary action)
- Proper color contrast in light/dark modes
        `,
      },
    },
  },
  argTypes: {
    draft: {
      description: 'Draft data (title and savedAt timestamp)',
    },
    onResume: {
      description: 'Callback when Resume button is clicked',
      action: 'resumed',
    },
    onDiscard: {
      description: 'Callback when Discard button is clicked',
      action: 'discarded',
    },
    className: {
      description: 'Optional additional CSS classes',
      control: 'text',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default banner with a short title
 */
export const Default: Story = {
  args: {
    draft: {
      title: 'My draft prompt',
      savedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard draft banner with a short title. The banner displays the time the draft was saved and provides Resume/Discard actions.',
      },
    },
  },
};

/**
 * Banner with a very long title to demonstrate truncation
 */
export const LongTitle: Story = {
  args: {
    draft: {
      title: 'This is a very long draft title that exceeds the fifty character limit and will be truncated with ellipsis',
      savedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner with a title exceeding 50 characters. The title is truncated with "..." to prevent layout issues.',
      },
    },
  },
};

/**
 * Banner without a title
 */
export const NoTitle: Story = {
  args: {
    draft: {
      savedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner for a draft without a title. Shows only the timestamp without the "titled" text.',
      },
    },
  },
};

/**
 * Banner with various timestamps
 */
export const DifferentTimes: Story = {
  render: () => {
    const now = new Date();
    const times = [
      { label: 'Morning (8:30 AM)', time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30) },
      { label: 'Afternoon (2:15 PM)', time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 15) },
      { label: 'Evening (7:45 PM)', time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 45) },
      { label: 'Late Night (11:59 PM)', time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59) },
    ];

    return (
      <div className="space-y-4">
        {times.map(({ label, time }) => (
          <div key={label}>
            <p className="text-xs text-text-muted mb-2">{label}</p>
            <DraftBanner
              draft={{
                title: `Draft saved at ${label}`,
                savedAt: time.toISOString(),
              }}
              onResume={() => console.log('Resume clicked')}
              onDiscard={() => console.log('Discard clicked')}
            />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates time formatting across different times of day. Each banner shows how the timestamp is formatted in HH:MM AM/PM format.',
      },
    },
  },
};

/**
 * Interactive demo with working handlers
 */
export const Interactive: Story = {
  render: () => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [lastAction, setLastAction] = React.useState<string | null>(null);

    const handleResume = () => {
      setLastAction('Resumed draft');
      setIsVisible(false);
      // Simulate draft being loaded
      setTimeout(() => {
        setIsVisible(true);
        setLastAction(null);
      }, 2000);
    };

    const handleDiscard = () => {
      setLastAction('Discarded draft');
      setIsVisible(false);
      // Simulate clearing
      setTimeout(() => {
        setIsVisible(true);
        setLastAction(null);
      }, 2000);
    };

    return (
      <div className="space-y-4">
        {isVisible ? (
          <DraftBanner
            draft={{
              title: 'Interactive draft example',
              savedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            }}
            onResume={handleResume}
            onDiscard={handleDiscard}
          />
        ) : (
          <div className="p-4 bg-surface border border-border rounded-md text-center">
            <p className="text-sm text-text-muted">
              {lastAction} - Banner will reappear in 2 seconds...
            </p>
          </div>
        )}
        <div className="p-3 bg-panel border border-border rounded-md">
          <p className="text-xs text-text-muted">
            <strong>Try it:</strong> Click Resume or Discard to see the banner hide and reappear.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive banner demonstrating Resume and Discard actions. Click the buttons to see the banner hide and reappear.',
      },
    },
  },
};

/**
 * Mobile responsive layout
 */
export const MobileResponsive: Story = {
  args: {
    draft: {
      title: 'Testing mobile layout with a reasonably long title',
      savedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Banner in mobile viewport. Buttons stack vertically below the text content for better touch targets and readability.',
      },
    },
  },
};

/**
 * Accessibility testing story
 */
export const AccessibilityDemo: Story = {
  args: {
    draft: {
      title: 'Accessibility features test',
      savedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  },
  render: (args) => (
    <div className="space-y-4">
      <DraftBanner {...args} />
      <div className="p-4 bg-panel border border-border rounded-md">
        <h4 className="text-sm font-medium mb-2">Accessibility Features:</h4>
        <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
          <li>
            <code>role=&quot;alert&quot;</code> announces banner to screen readers
          </li>
          <li>Resume button receives initial focus for quick action</li>
          <li>Buttons have <code>aria-label</code> for clear action intent</li>
          <li>Keyboard navigation: Tab → Resume → Discard</li>
          <li>High contrast blue colors for visibility</li>
          <li>FileText icon marked <code>aria-hidden</code> (decorative)</li>
        </ul>
      </div>
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <p className="text-xs text-yellow-800 dark:text-yellow-300">
          <strong>Test with keyboard:</strong> Press Tab to navigate between buttons.
          Press Enter or Space to activate.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates all accessibility features including ARIA attributes, focus management, and keyboard navigation.',
      },
    },
  },
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  args: {
    draft: {
      title: 'Dark mode styling test',
      savedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Banner in dark mode with adjusted colors for proper contrast and visibility.',
      },
    },
  },
};

/**
 * All variants side-by-side
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-text-muted mb-2 font-medium">With short title</p>
        <DraftBanner
          draft={{
            title: 'Short title',
            savedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          }}
          onResume={() => {}}
          onDiscard={() => {}}
        />
      </div>

      <div>
        <p className="text-xs text-text-muted mb-2 font-medium">With long title (truncated)</p>
        <DraftBanner
          draft={{
            title: 'This is a very long title that will definitely be truncated because it exceeds the fifty character maximum',
            savedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          }}
          onResume={() => {}}
          onDiscard={() => {}}
        />
      </div>

      <div>
        <p className="text-xs text-text-muted mb-2 font-medium">Without title</p>
        <DraftBanner
          draft={{
            savedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          }}
          onResume={() => {}}
          onDiscard={() => {}}
        />
      </div>

      <div>
        <p className="text-xs text-text-muted mb-2 font-medium">With custom className</p>
        <DraftBanner
          draft={{
            title: 'Custom styled banner',
            savedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          }}
          onResume={() => {}}
          onDiscard={() => {}}
          className="shadow-lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All banner variants displayed together for comparison.',
      },
    },
  },
};
