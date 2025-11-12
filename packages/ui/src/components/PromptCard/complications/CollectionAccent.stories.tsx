/**
 * CollectionAccent Storybook Stories
 *
 * Demonstrates the CollectionAccent complication in various configurations
 * to showcase all supported colors, card sizes, positions, and edge cases.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { PromptCard } from '../PromptCard';
import { CollectionAccent, type Collection, type CollectionColor } from './CollectionAccent';
import type { ComplicationSlots } from '../../../complications/types';

// Sample collections for stories
const marketingCollection: Collection = {
  id: 'coll_marketing',
  name: 'Marketing Templates',
  color: 'purple',
};

const devCollection: Collection = {
  id: 'coll_dev',
  name: 'Development Utilities',
  color: 'blue',
};

const designCollection: Collection = {
  id: 'coll_design',
  name: 'Design System',
  color: 'green',
};

const multipleCollections: Collection[] = [
  marketingCollection,
  devCollection,
  designCollection,
];

const noColorCollection: Collection = {
  id: 'coll_no_color',
  name: 'No Color Collection',
};

// Helper function to create collection accent complications
const createCollectionAccentComplication = (
  collection?: Collection | Collection[],
  position: 'left' | 'right' = 'left'
): ComplicationSlots => ({
  edgeLeft: position === 'left' ? {
    component: (props) => (
      <CollectionAccent
        {...props}
        collection={collection}
        position={position}
      />
    ),
    supportedSizes: ['compact', 'standard', 'xl'],
    supportedStates: ['default', 'running', 'error', 'disabled', 'selected'],
    performance: {
      memoize: true,
      priority: 40,
    },
  } : undefined,
  edgeRight: position === 'right' ? {
    component: (props) => (
      <CollectionAccent
        {...props}
        collection={collection}
        position={position}
      />
    ),
    supportedSizes: ['compact', 'standard', 'xl'],
    supportedStates: ['default', 'running', 'error', 'disabled', 'selected'],
    performance: {
      memoize: true,
      priority: 40,
    },
  } : undefined,
});

// Base story metadata
const meta: Meta<typeof CollectionAccent> = {
  title: 'Components/PromptCard/Complications/CollectionAccent',
  component: CollectionAccent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The CollectionAccent complication renders a colored vertical bar on the edge of the prompt card
to visually indicate which collection a prompt belongs to. It uses design tokens from the
collection color system and supports RTL layouts.

## Features

- **4px vertical accent bar** positioned on card edge
- **Collection color tokens** from design system
- **RTL support** with position prop
- **Accessibility compliant** with proper ARIA labels
- **Graceful fallbacks** for missing/invalid collections
- **Theme aware** through CSS custom properties
- **Performance optimized** with minimal layout impact

## Usage in PromptCard

\`\`\`tsx
<PromptCard
  title="My Prompt"
  complications={{
    edgeLeft: (props) => (
      <CollectionAccent
        {...props}
        collection={{
          id: 'coll_123',
          name: 'Marketing Templates',
          color: 'purple'
        }}
      />
    )
  }}
/>
\`\`\`
        `,
      },
    },
    controls: {
      exclude: ['cardId', 'cardState', 'cardTitle', 'slot', 'isFocused', 'lastStateChange', 'features'],
    },
  },
  argTypes: {
    collection: {
      description: 'Collection data or array of collections (uses first as primary)',
      control: { type: 'object' },
    },
    position: {
      description: 'Edge position of the accent bar',
      control: { type: 'radio' },
      options: ['left', 'right'],
    },
    cardSize: {
      description: 'Card size affects accent bar thickness',
      control: { type: 'radio' },
      options: ['compact', 'standard', 'xl'],
    },
    isVisible: {
      description: 'Whether the complication is visible',
      control: { type: 'boolean' },
    },
  },
  args: {
    // Default complication props
    cardId: 'story-card',
    cardState: 'default',
    cardSize: 'standard',
    cardTitle: 'Story Card',
    slot: 'edgeLeft',
    isFocused: false,
    lastStateChange: new Date(),
    features: {
      animations: true,
      highContrast: false,
      reducedMotion: false,
    },
    isVisible: true,
    // Default CollectionAccent props
    collection: marketingCollection,
    position: 'left',
  },
};

export default meta;
type Story = StoryObj<typeof CollectionAccent>;

// ============================================================================
// BASIC STORIES
// ============================================================================

export const Default: Story = {
  name: 'Default (Purple Collection)',
  args: {
    collection: marketingCollection,
  },
};

export const MultipleCollections: Story = {
  name: 'Multiple Collections (Uses Primary)',
  args: {
    collection: multipleCollections,
  },
  parameters: {
    docs: {
      description: {
        story: 'When multiple collections are provided, the first one (primary) is used for the accent color.',
      },
    },
  },
};

export const NoCollection: Story = {
  name: 'No Collection (Hidden)',
  args: {
    collection: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no collection is provided, the accent is not rendered.',
      },
    },
  },
};

export const NoColorFallback: Story = {
  name: 'No Color (Primary Fallback)',
  args: {
    collection: noColorCollection,
  },
  parameters: {
    docs: {
      description: {
        story: 'Collections without a color property fallback to the primary brand color.',
      },
    },
  },
};

// ============================================================================
// COLOR VARIANTS
// ============================================================================

const collectionColors: CollectionColor[] = [
  'primary',
  'secondary',
  'accent',
  'purple',
  'green',
  'orange',
  'blue',
  'red',
];

export const AllColors: Story = {
  name: 'All Collection Colors',
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-4xl">
      {collectionColors.map((color) => {
        const collection: Collection = {
          id: `coll_${color}`,
          name: `${color.charAt(0).toUpperCase() + color.slice(1)} Collection`,
          color,
        };

        return (
          <div key={color} className="relative">
            <CollectionAccent
              cardId="color-demo"
              cardState="default"
              cardSize="standard"
              cardTitle="Color Demo"
              slot="edgeLeft"
              isFocused={false}
              lastStateChange={new Date()}
              features={{
                animations: true,
                highContrast: false,
                reducedMotion: false,
              }}
              isVisible={true}
              collection={collection}
            />
            <div className="bg-white border rounded-lg p-4 pl-8 shadow-sm">
              <h3 className="font-medium">{color}</h3>
              <p className="text-sm text-gray-600">{collection.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available collection colors from the design token system.',
      },
    },
  },
};

// ============================================================================
// POSITION VARIANTS
// ============================================================================

export const LeftPosition: Story = {
  name: 'Left Position (LTR)',
  args: {
    position: 'left',
  },
};

export const RightPosition: Story = {
  name: 'Right Position (RTL)',
  args: {
    position: 'right',
  },
  parameters: {
    docs: {
      description: {
        story: 'Right position for RTL (Right-to-Left) language layouts.',
      },
    },
  },
};

// ============================================================================
// CARD SIZE VARIANTS
// ============================================================================

export const CardSizes: Story = {
  name: 'Different Card Sizes',
  render: () => (
    <div className="flex flex-col gap-6">
      {(['compact', 'standard', 'xl'] as const).map((size) => (
        <div key={size} className="relative">
          <CollectionAccent
            cardId={`size-demo-${size}`}
            cardState="default"
            cardSize={size}
            cardTitle="Size Demo"
            slot="edgeLeft"
            isFocused={false}
            lastStateChange={new Date()}
            features={{
              animations: true,
              highContrast: false,
              reducedMotion: false,
            }}
            isVisible={true}
            collection={marketingCollection}
          />
          <div
            className={
              size === 'compact'
                ? 'bg-white border rounded-lg p-3 pl-7 shadow-sm w-64 h-32'
                : size === 'xl'
                ? 'bg-white border rounded-lg p-6 pl-10 shadow-sm w-96 h-40'
                : 'bg-white border rounded-lg p-4 pl-8 shadow-sm w-80 h-36'
            }
          >
            <h3 className="font-medium capitalize">{size} Card</h3>
            <p className="text-sm text-gray-600">
              Accent width adjusts to card size
            </p>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accent bar thickness adjusts based on the card size: 3px (compact), 4px (standard), 5px (xl).',
      },
    },
  },
};

// ============================================================================
// INTEGRATION WITH PROMPTCARD
// ============================================================================

export const InPromptCard: Story = {
  name: 'Integrated with PromptCard',
  render: () => (
    <div className="max-w-md">
      <PromptCard
        title="Marketing Email Template"
        version={2}
        access="shared"
        tags={['email', 'marketing', 'template']}
        model="gpt-4"
        lastRun={new Date()}
        bodyPreview="A comprehensive email template for marketing campaigns with dynamic content blocks and responsive design..."
        metrics={{
          runs: 45,
          successRate: 0.92,
          avgCost: 0.12,
          avgTime: 2.3,
        }}
        complications={createCollectionAccentComplication(marketingCollection)}
        onRun={() => console.log('Run clicked')}
        onEdit={() => console.log('Edit clicked')}
        onFork={() => console.log('Fork clicked')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'CollectionAccent integrated into a real PromptCard using the complications system.',
      },
    },
  },
};

export const MultipleComplications: Story = {
  name: 'With Multiple Complications',
  render: () => (
    <div className="max-w-md">
      <PromptCard
        title="Development Utility"
        version={1}
        access="private"
        tags={['utility', 'development']}
        model="claude-3"
        lastRun={new Date()}
        bodyPreview="A utility function for processing development workflows..."
        metrics={{
          runs: 12,
          successRate: 1.0,
          avgCost: 0.08,
          avgTime: 1.1,
        }}
        complications={{
          ...createCollectionAccentComplication(devCollection),
          topRight: {
            component: (props) => (
              <div
                className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded font-medium"
                data-slot={props.slot}
              >
                NEW
              </div>
            ),
            supportedSizes: ['compact', 'standard', 'xl'],
            supportedStates: ['default', 'running', 'error', 'disabled', 'selected'],
          },
        }}
        onRun={() => console.log('Run clicked')}
        onEdit={() => console.log('Edit clicked')}
        onFork={() => console.log('Fork clicked')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'CollectionAccent working alongside other complications in the slot system.',
      },
    },
  },
};

// ============================================================================
// ACCESSIBILITY & THEME STORIES
// ============================================================================

export const HighContrastDemo: Story = {
  name: 'High Contrast Support',

  render: () => (
    <div className="p-6 bg-black text-white">
      <p className="mb-4 text-sm">
        In high contrast mode, accent colors maintain proper contrast ratios.
        This demo simulates a dark high contrast environment.
      </p>
      <div className="relative">
        <CollectionAccent
          cardId="hc-demo"
          cardState="default"
          cardSize="standard"
          cardTitle="High Contrast Demo"
          slot="edgeLeft"
          isFocused={false}
          lastStateChange={new Date()}
          features={{
            animations: true,
            highContrast: true,
            reducedMotion: false,
          }}
          isVisible={true}
          collection={marketingCollection}
        />
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 pl-8 shadow-lg">
          <h3 className="font-medium text-white">High Contrast Card</h3>
          <p className="text-sm text-gray-300">
            Accent maintains visibility and contrast
          </p>
        </div>
      </div>
    </div>
  ),

  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the accent maintains proper contrast in high contrast themes.',
      },
    }
  },

  globals: {
    backgrounds: {
      value: "dark"
    }
  }
};

export const ReducedMotionDemo: Story = {
  name: 'Reduced Motion Support',
  args: {
    collection: marketingCollection,
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        When users prefer reduced motion, accent transitions are disabled.
        Toggle themes or hover the accent to see the difference.
      </p>
      <div className="relative">
        <CollectionAccent
          {...args}
          features={{
            animations: true,
            highContrast: false,
            reducedMotion: true,
          }}
        />
        <div className="bg-white border rounded-lg p-4 pl-8 shadow-sm">
          <h3 className="font-medium">Reduced Motion</h3>
          <p className="text-sm text-gray-600">
            No animations or transitions
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Respects user preference for reduced motion by disabling transitions.',
      },
    },
  },
};

// ============================================================================
// EDGE CASES & ERROR HANDLING
// ============================================================================

export const EdgeCases: Story = {
  name: 'Edge Cases & Error Handling',
  render: () => (
    <div className="grid grid-cols-1 gap-4 max-w-2xl">
      <div className="relative">
        <CollectionAccent
          cardId="empty-array"
          cardState="default"
          cardSize="standard"
          cardTitle="Empty Array Demo"
          slot="edgeLeft"
          isFocused={false}
          lastStateChange={new Date()}
          features={{
            animations: true,
            highContrast: false,
            reducedMotion: false,
          }}
          isVisible={true}
          collection={[]}
        />
        <div className="bg-white border rounded-lg p-4 pl-8 shadow-sm">
          <h3 className="font-medium">Empty Array</h3>
          <p className="text-sm text-gray-600">No accent rendered</p>
        </div>
      </div>

      <div className="relative">
        <CollectionAccent
          cardId="no-visible"
          cardState="default"
          cardSize="standard"
          cardTitle="Not Visible Demo"
          slot="edgeLeft"
          isFocused={false}
          lastStateChange={new Date()}
          features={{
            animations: true,
            highContrast: false,
            reducedMotion: false,
          }}
          isVisible={false}
          collection={marketingCollection}
        />
        <div className="bg-white border rounded-lg p-4 pl-8 shadow-sm">
          <h3 className="font-medium">Not Visible</h3>
          <p className="text-sm text-gray-600">Accent hidden via isVisible</p>
        </div>
      </div>

      <div className="relative">
        <CollectionAccent
          cardId="fallback-demo"
          cardState="default"
          cardSize="standard"
          cardTitle="Fallback Demo"
          slot="edgeLeft"
          isFocused={false}
          lastStateChange={new Date()}
          features={{
            animations: true,
            highContrast: false,
            reducedMotion: false,
          }}
          isVisible={true}
          collection={noColorCollection}
        />
        <div className="bg-white border rounded-lg p-4 pl-8 shadow-sm">
          <h3 className="font-medium">No Color Fallback</h3>
          <p className="text-sm text-gray-600">Uses primary brand color</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the component handles various edge cases and error conditions gracefully.',
      },
    },
  },
};
