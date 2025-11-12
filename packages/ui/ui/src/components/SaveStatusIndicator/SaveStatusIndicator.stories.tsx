import type { Meta, StoryObj } from '@storybook/react-vite';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import React from 'react';

const meta = {
  title: 'Components/SaveStatusIndicator',
  component: SaveStatusIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A compact status indicator for auto-save functionality in draft forms.

## Features
- Automatically hidden when idle or pending
- Animated spinner during save operations
- Success state with formatted timestamp
- Error state for failed saves
- ARIA live region for screen readers
- Respects prefers-reduced-motion

## Usage Guidelines
- **idle**: Component is hidden (no changes to save)
- **pending**: Component is hidden (changes exist but not being saved yet)
- **saving**: Shows spinner and "Saving..." text
- **saved**: Shows checkmark and timestamp "Draft saved at HH:MM AM/PM"
- **error**: Shows error icon and "Save failed" text

## Accessibility
- ARIA live region with polite announcements
- Screen reader friendly status updates
- High contrast mode support for all icons
- Reduced motion: spinner becomes static in prefers-reduced-motion mode
- Color is not the only indicator (icons + text)

## Integration
Use with debounced auto-save logic. Component automatically handles
visibility based on save state transitions.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    saveState: {
      control: 'select',
      options: ['idle', 'pending', 'saving', 'saved', 'error'],
      description: 'Current save state',
    },
    lastSavedAt: {
      control: 'text',
      description: 'ISO timestamp of last save',
    },
    className: {
      control: 'text',
      description: 'Optional CSS classes',
    },
  },
} satisfies Meta<typeof SaveStatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Component is hidden when in idle state (no changes to save)
 */
export const Idle: Story = {
  args: {
    saveState: 'idle',
    lastSavedAt: null,
  },
  render: (args) => (
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-2">
        Component is hidden in idle state:
      </p>
      <div className="border border-dashed border-border p-4 rounded">
        <SaveStatusIndicator {...args} />
        <p className="text-xs text-muted-foreground mt-2 italic">
          (Component returns null - nothing rendered)
        </p>
      </div>
    </div>
  ),
};

/**
 * Component is hidden when in pending state (changes exist but not being saved)
 */
export const Pending: Story = {
  args: {
    saveState: 'pending',
    lastSavedAt: null,
  },
  render: (args) => (
    <div className="p-4">
      <p className="text-sm text-muted-foreground mb-2">
        Component is hidden in pending state:
      </p>
      <div className="border border-dashed border-border p-4 rounded">
        <SaveStatusIndicator {...args} />
        <p className="text-xs text-muted-foreground mt-2 italic">
          (Component returns null - nothing rendered)
        </p>
      </div>
    </div>
  ),
};

/**
 * Shows spinner and "Saving..." text during save operation
 */
export const Saving: Story = {
  args: {
    saveState: 'saving',
    lastSavedAt: null,
  },
};

/**
 * Shows checkmark and formatted timestamp after successful save
 */
export const Saved: Story = {
  args: {
    saveState: 'saved',
    lastSavedAt: '2024-01-15T10:45:30.000Z',
  },
};

/**
 * Shows error icon and "Save failed" text
 */
export const Error: Story = {
  args: {
    saveState: 'error',
    lastSavedAt: '2024-01-15T10:45:30.000Z',
  },
};

/**
 * Saved state without timestamp (fallback text)
 */
export const SavedNoTimestamp: Story = {
  args: {
    saveState: 'saved',
    lastSavedAt: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no timestamp is provided, shows generic "Draft saved" text',
      },
    },
  },
};

/**
 * All visible states side by side for comparison
 */
export const AllVisibleStates: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Saving:</p>
        <SaveStatusIndicator saveState="saving" lastSavedAt={null} />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Saved:</p>
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Error:</p>
        <SaveStatusIndicator
          saveState="error"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">
          Saved (no timestamp):
        </p>
        <SaveStatusIndicator saveState="saved" lastSavedAt={null} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparison of all visible states. Note: idle and pending states are not shown as they return null.',
      },
    },
  },
};

/**
 * Different timestamps demonstrating time formatting
 */
export const TimestampFormatting: Story = {
  render: () => {
    const timestamps = [
      { time: '2024-01-15T09:05:00.000Z', label: 'Morning (9:05 AM)' },
      { time: '2024-01-15T14:30:00.000Z', label: 'Afternoon (2:30 PM)' },
      { time: '2024-01-15T23:59:00.000Z', label: 'Late night (11:59 PM)' },
      { time: '2024-01-15T00:00:00.000Z', label: 'Midnight (12:00 AM)' },
      { time: '2024-01-15T12:00:00.000Z', label: 'Noon (12:00 PM)' },
    ];

    return (
      <div className="space-y-3 p-4">
        {timestamps.map(({ time, label }) => (
          <div key={time}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <SaveStatusIndicator saveState="saved" lastSavedAt={time} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates time formatting for various times of day. Format is always "HH:MM AM/PM".',
      },
    },
  },
};

/**
 * Interactive demo showing state transitions
 */
export const StateTransitions: Story = {
  render: () => {
    const [state, setState] = React.useState<
      'idle' | 'pending' | 'saving' | 'saved' | 'error'
    >('idle');
    const [lastSaved, setLastSaved] = React.useState<string | null>(null);

    const simulateSave = () => {
      setState('saving');
      setTimeout(() => {
        setState('saved');
        setLastSaved(new Date().toISOString());
        // Auto-hide after 3 seconds (optional UX pattern)
        setTimeout(() => {
          setState('idle');
        }, 3000);
      }, 1500);
    };

    const simulateError = () => {
      setState('saving');
      setTimeout(() => {
        setState('error');
      }, 1000);
    };

    return (
      <div className="p-4 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setState('idle')}
            className="px-3 py-1.5 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Set Idle
          </button>
          <button
            onClick={() => setState('pending')}
            className="px-3 py-1.5 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Set Pending
          </button>
          <button
            onClick={simulateSave}
            className="px-3 py-1.5 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
          >
            Simulate Save
          </button>
          <button
            onClick={simulateError}
            className="px-3 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
          >
            Simulate Error
          </button>
        </div>

        <div className="border border-border p-4 rounded min-h-[60px] flex items-center">
          <SaveStatusIndicator saveState={state} lastSavedAt={lastSaved} />
          {(state === 'idle' || state === 'pending') && (
            <p className="text-xs text-muted-foreground italic">
              Component is hidden (state: {state})
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Current state: <strong>{state}</strong></p>
          <p>Last saved: <strong>{lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'Never'}</strong></p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing typical state transitions. Click buttons to trigger different states and see the component respond.',
      },
    },
  },
};

/**
 * Real-world example: In a form context
 */
export const InFormContext: Story = {
  render: () => {
    const [saveState, setSaveState] = React.useState<
      'idle' | 'pending' | 'saving' | 'saved' | 'error'
    >('idle');
    const [lastSaved, setLastSaved] = React.useState<string | null>(null);
    const [title, setTitle] = React.useState('');
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    // Simulated debounced auto-save
    const handleChange = (value: string) => {
      setTitle(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (value.trim()) {
        setSaveState('pending');

        timeoutRef.current = setTimeout(() => {
          setSaveState('saving');
          // Simulate API call
          setTimeout(() => {
            setSaveState('saved');
            setLastSaved(new Date().toISOString());
          }, 800);
        }, 1000);
      } else {
        setSaveState('idle');
      }
    };

    return (
      <div className="p-4 max-w-md">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="title" className="text-sm font-medium">
              Draft Title
            </label>
            <SaveStatusIndicator saveState={saveState} lastSavedAt={lastSaved} />
          </div>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter a title..."
            className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Start typing to see auto-save in action
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example of SaveStatusIndicator in a real form context with debounced auto-save. Type in the input to trigger the save flow.',
      },
    },
  },
};

/**
 * Custom styling example
 */
export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div>
        <p className="text-sm font-medium mb-2">Default:</p>
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
        />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Custom opacity:</p>
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
          className="opacity-70"
        />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Larger text:</p>
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
          className="text-sm"
        />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">With background:</p>
        <SaveStatusIndicator
          saveState="saved"
          lastSavedAt="2024-01-15T10:45:30.000Z"
          className="px-2 py-1 bg-green-50 dark:bg-green-950/20 rounded"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Examples of custom styling using the className prop. The component accepts any Tailwind classes.',
      },
    },
  },
};
