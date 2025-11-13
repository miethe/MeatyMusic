import type { Meta, StoryObj } from '@storybook/react-vite';
import { PermissionBadge } from './PermissionBadge';
import type { PermissionBadgeProps } from './PermissionBadge';

const meta = {
  title: 'PromptCard/Complications/PermissionBadge',
  component: PermissionBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The PermissionBadge is a complication that displays access level indicators on prompt cards.
It shows permission status (private/public/shared) with appropriate icons and colors, includes tooltips for detailed context, and supports click interactions for sharing management.

## Features

- **Visual Indicators**: Lock (private), Globe (public), Users (shared) icons
- **Adaptive Sizing**: Responds to card size (compact mode hides text labels)
- **Rich Tooltips**: Shows owner information and sharing details
- **Interactive**: Optional click handler for sharing modal
- **Accessible**: Full WCAG AA compliance with proper ARIA labels
- **Token-driven**: Uses design tokens for consistent theming

## Accessibility

- Screen reader announces permission level and owner
- Keyboard navigation support when interactive
- High contrast theme compatible
- Proper focus indicators
- Tooltip accessible via keyboard
        `,
      },
    },
  },
  argTypes: {
    access: {
      control: 'radio',
      options: ['private', 'public', 'shared'],
      description: 'The access level of the prompt',
    },
    owner: {
      control: 'text',
      description: 'The owner of the prompt (shown in tooltip)',
    },
    sharedWith: {
      control: 'object',
      description: 'Array of email addresses the prompt is shared with',
    },
    cardSize: {
      control: 'radio',
      options: ['compact', 'standard', 'xl'],
      description: 'The size of the parent prompt card',
    },
    isVisible: {
      control: 'boolean',
      description: 'Whether the badge should be visible',
    },
    onShare: {
      action: 'share-clicked',
      description: 'Called when the badge is clicked (makes badge interactive)',
    },
  },
  args: {
    // Default complication props
    cardId: 'storybook-card',
    cardState: 'default',
    cardSize: 'standard',
    cardTitle: 'Sample Prompt',
    isFocused: false,
    isVisible: true,
    slot: 'topRight',
    lastStateChange: new Date(),
    features: {
      animations: true,
      highContrast: false,
      reducedMotion: false,
    },
    // Default permission badge props
    access: 'private',
    owner: 'John Doe',
    sharedWith: [],
  },
} satisfies Meta<PermissionBadgeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic permission states
export const Private: Story = {
  args: {
    access: 'private',
    owner: 'John Doe',
  },
};

export const Public: Story = {
  args: {
    access: 'public',
    owner: 'Jane Smith',
  },
};

export const Shared: Story = {
  args: {
    access: 'shared',
    owner: 'Bob Johnson',
    sharedWith: ['alice@example.com', 'charlie@example.com'],
  },
};

// Interactive examples
export const InteractivePrivate: Story = {
  args: {
    access: 'private',
    owner: 'John Doe',
    onShare: () => console.log('Opening sharing modal for private prompt'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Private badge with click handler - becomes a button that opens sharing management.',
      },
    },
  },
};

export const InteractiveShared: Story = {
  args: {
    access: 'shared',
    owner: 'Sarah Wilson',
    sharedWith: ['team-member-1@company.com', 'team-member-2@company.com', 'external-reviewer@client.com'],
    onShare: () => console.log('Opening sharing modal for shared prompt'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shared badge with click handler - tooltip shows shared count and owner information.',
      },
    },
  },
};

// Card size variations
export const CompactCard: Story = {
  args: {
    access: 'shared',
    cardSize: 'compact',
    owner: 'Compact Owner',
    sharedWith: ['user1@example.com', 'user2@example.com'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge in compact mode - hides text labels, shows only icons with smaller sizing.',
      },
    },
  },
};

export const StandardCard: Story = {
  args: {
    access: 'public',
    cardSize: 'standard',
    owner: 'Standard User',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge in standard card size - shows both icon and text label.',
      },
    },
  },
};

export const XLCard: Story = {
  args: {
    access: 'private',
    cardSize: 'xl',
    owner: 'XL Card Owner',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge in XL card size - same styling as standard but in larger card context.',
      },
    },
  },
};

// Tooltip variations
export const NoOwnerInfo: Story = {
  args: {
    access: 'public',
    owner: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge without owner information - tooltip shows only access level.',
      },
    },
  },
};

export const SingleSharedUser: Story = {
  args: {
    access: 'shared',
    owner: 'Solo Sharer',
    sharedWith: ['single-user@example.com'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shared badge with single user - tooltip uses singular "person" instead of "people".',
      },
    },
  },
};

export const ManySharedUsers: Story = {
  args: {
    access: 'shared',
    owner: 'Team Lead',
    sharedWith: new Array(10).fill(0).map((_, i) => `user${i + 1}@company.com`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shared badge with many users - tooltip shows total count without listing all emails.',
      },
    },
  },
};

// State variations
export const RunningCard: Story = {
  args: {
    access: 'private',
    cardState: 'running',
    owner: 'Runner',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge on a running card - badge appearance remains consistent regardless of card state.',
      },
    },
  },
};

export const ErrorCard: Story = {
  args: {
    access: 'public',
    cardState: 'error',
    owner: 'Error User',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge on a card in error state - maintains readability.',
      },
    },
  },
};

export const SelectedCard: Story = {
  args: {
    access: 'shared',
    cardState: 'selected',
    owner: 'Selected Owner',
    sharedWith: ['selected-user@example.com'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge on selected card - works well with selection styling.',
      },
    },
  },
};

// Accessibility examples
export const HighContrast: Story = {
  args: {
    access: 'private',
    owner: 'HC User',
    features: {
      animations: true,
      highContrast: true,
      reducedMotion: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with high contrast mode enabled - maintains WCAG AA compliance.',
      },
    },
  },
};

export const ReducedMotion: Story = {
  args: {
    access: 'shared',
    owner: 'Reduced Motion User',
    sharedWith: ['accessible@example.com'],
    features: {
      animations: false,
      highContrast: false,
      reducedMotion: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with reduced motion preferences - respects user accessibility settings.',
      },
    },
  },
};

// Edge cases
export const Hidden: Story = {
  args: {
    access: 'private',
    isVisible: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge when isVisible is false - should not render anything.',
      },
    },
  },
};

export const CustomClassName: Story = {
  args: {
    access: 'public',
    owner: 'Custom Styled',
    className: 'border-dashed border-2 border-red-500',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with custom className - allows for additional styling while maintaining core functionality.',
      },
    },
  },
};

export const CustomAriaLabel: Story = {
  args: {
    access: 'shared',
    owner: 'ARIA User',
    sharedWith: ['aria@example.com'],
    'aria-label': 'Custom accessibility label for screen readers',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge with custom aria-label - overrides default accessibility text.',
      },
    },
  },
};

// Playground story for testing
export const Playground: Story = {
  args: {
    access: 'shared',
    owner: 'Playground User',
    sharedWith: ['test1@example.com', 'test2@example.com', 'test3@example.com'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground - modify all props to test different combinations.',
      },
    },
  },
};
