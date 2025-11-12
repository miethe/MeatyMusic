import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import React from 'react';
import { PromptCard } from './PromptCard';
import { PermissionBadge } from './complications/PermissionBadge';
import { TypeBadge, type PromptType } from './complications/TypeBadge';
import type { ComplicationSlots } from '../../complications/types';

const meta: Meta<typeof PromptCard> = {
  title: 'Components/PromptCard',
  component: PromptCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A specialized card component for displaying prompts with metadata, actions, and different states. Features enhanced hover effects, smooth transitions, and polished visual hierarchy.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['compact', 'standard', 'xl'],
    },
    state: {
      control: { type: 'select' },
      options: ['default', 'running', 'error', 'disabled', 'selected'],
    },
    access: {
      control: { type: 'select' },
      options: ['private', 'public', 'shared'],
    },
    metrics: { control: { type: 'object' } },
    onRun: { action: 'run' },
    onEdit: { action: 'edit' },
    onFork: { action: 'fork' },
    onMenuAction: { action: 'menu' },
    onCompare: { action: 'compare' },
    onAnalytics: { action: 'analytics' },
    onHistory: { action: 'history' },
  },
  args: {
    onRun: fn(),
    onEdit: fn(),
    onFork: fn(),
    onMenuAction: fn(),
    onCompare: fn(),
    onAnalytics: fn(),
    onHistory: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Customer Support Email Template',
    version: 2,
    access: 'private',
    tags: ['email', 'support', 'template'],
    model: 'gpt-4',
    lastRun: new Date(Date.now() - 1000 * 60 * 30),
    bodyPreview:
      "Generate a professional customer support email response that addresses the customer's concern while maintaining a helpful and empathetic tone.",
    metrics: { runs: 23, successRate: 0.87, avgCost: 0.012, avgTime: 2.3 },
  },
  parameters: {
    docs: {
      description: {
        story: 'Default PromptCard with enhanced hover effects - hover to see elevation lift and title color transition.',
      },
    },
  },
};

export const Compact: Story = {
  args: { ...Default.args, size: 'compact' },
  parameters: {
    docs: {
      description: {
        story: 'Compact size with subtle hover lift effect.',
      },
    },
  },
};

export const XL: Story = {
  args: {
    ...Default.args,
    size: 'xl',
    blockChips: {
      persona: 'Customer support representative with 5+ years experience',
      context: 'Customer complaint about delayed order delivery',
      output: 'Professional email response with solutions and timeline',
      instructions: 'Use empathetic tone, provide specific steps, include follow-up plan',
    },
    provenance: {
      originalAuthor: 'Sarah Chen',
      forkSource: 'Customer Service Template',
      lastEditor: 'Mike Johnson',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    extendedStats: {
      successRateData: [0.89, 0.91, 0.88, 0.94, 0.87, 0.92, 0.89],
      p50Latency: 1850,
      p95Latency: 4200,
      p50LatencyData: [2100, 1950, 1800, 1750, 1850, 1900, 1850],
      tokenUsageData: [2340, 2180, 2450, 2290, 2380, 2150, 2340],
      avgTokens: 2305,
      costData: [0.008, 0.009, 0.012, 0.01, 0.011, 0.008, 0.012],
      avgCost: 0.012,
    },
    onCompare: fn(),
    onAnalytics: fn(),
    onHistory: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'XL size with maximum hover lift effect and extended content.',
      },
    },
  },
};

export const Running: Story = {
  args: { ...Default.args, isRunning: true, state: 'running' },
  parameters: {
    docs: {
      description: {
        story: 'Running state with animated progress bar and pulsing border. Hover effects are subtle to indicate active state.',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    ...Default.args,
    error: 'Rate limit exceeded. Please try again in a few minutes.',
    state: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state with danger-colored border. Hover maintains error border color.',
      },
    },
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    state: 'selected',
    title: 'Selected Prompt Template',
  },
  parameters: {
    docs: {
      description: {
        story: 'Selected state with primary-colored outline. Hover enhances the elevation while maintaining selection.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
    title: 'Disabled Prompt Template',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with reduced opacity and no hover effects.',
      },
    },
  },
};

// Content Variation Stories
export const LongTitle: Story = {
  args: {
    ...Default.args,
    title: 'This is an Extremely Long Title That Should Demonstrate Proper Text Truncation and Layout Behavior in the PromptCard Component',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests proper text truncation with very long titles. Hover to see full title behavior.',
      },
    },
  },
};

export const NoDescription: Story = {
  args: {
    ...Default.args,
    description: undefined,
    bodyPreview: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Card without description or body preview shows clean, compact layout.',
      },
    },
  },
};

export const ManyTags: Story = {
  args: {
    ...Default.args,
    tags: ['email', 'support', 'template', 'customer-service', 'automation', 'workflow', 'production', 'verified'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests tag overflow handling with many tags.',
      },
    },
  },
};

export const MinimalContent: Story = {
  args: {
    title: 'Simple Prompt',
    version: 1,
    access: 'private',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal card with only required fields. Clean and focused.',
      },
    },
  },
};

// Permission Badge Examples
const createPermissionBadgeComplication = (
  access: 'private' | 'public' | 'shared',
  owner?: string,
  sharedWith?: string[],
  onShare?: () => void
): ComplicationSlots => ({
  topRight: {
    component: (props) => (
      <PermissionBadge
        {...props}
        access={access}
        owner={owner}
        sharedWith={sharedWith}
        onShare={onShare}
      />
    ),
    supportedSizes: ['compact', 'standard', 'xl'],
    supportedStates: ['default', 'running', 'error', 'disabled', 'selected'],
    performance: {
      memoize: true,
      priority: 80,
    },
  },
});

export const WithPrivatePermissionBadge: Story = {
  args: {
    ...Default.args,
    access: 'private',
    title: 'Private Sales Pitch Generator',
    complications: createPermissionBadgeComplication('private', 'John Doe'),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with private permission badge showing lock icon and owner information in tooltip.',
      },
    },
  },
};

export const WithPublicPermissionBadge: Story = {
  args: {
    ...Default.args,
    access: 'public',
    title: 'Public API Documentation Helper',
    complications: createPermissionBadgeComplication('public', 'Jane Smith'),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with public permission badge showing globe icon.',
      },
    },
  },
};

export const WithSharedPermissionBadge: Story = {
  args: {
    ...Default.args,
    access: 'shared',
    title: 'Team Code Review Template',
    complications: createPermissionBadgeComplication(
      'shared',
      'Sarah Wilson',
      ['alice@company.com', 'bob@company.com', 'charlie@company.com']
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with shared permission badge showing users icon and shared count in tooltip.',
      },
    },
  },
};

export const WithInteractivePermissionBadge: Story = {
  args: {
    ...Default.args,
    access: 'shared',
    title: 'Interactive Sharing Template',
    complications: createPermissionBadgeComplication(
      'shared',
      'Team Lead',
      ['dev1@team.com', 'dev2@team.com'],
      fn()
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with clickable permission badge that opens sharing management modal.',
      },
    },
  },
};

export const CompactWithPermissionBadge: Story = {
  args: {
    ...Default.args,
    size: 'compact',
    access: 'shared',
    title: 'Compact Shared Template',
    complications: createPermissionBadgeComplication(
      'shared',
      'Compact User',
      ['user1@example.com', 'user2@example.com']
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact PromptCard with permission badge - badge shows only icon without text label.',
      },
    },
  },
};

export const XLWithPermissionBadge: Story = {
  args: {
    ...Default.args,
    size: 'xl',
    access: 'private',
    title: 'XL Private Template with Extended Features',
    blockChips: {
      persona: 'Senior technical writer with domain expertise',
      context: 'Internal API documentation project',
      output: 'Comprehensive documentation with examples',
      instructions: 'Focus on developer experience and clear examples',
    },
    provenance: {
      originalAuthor: 'Technical Writing Team',
      forkSource: 'Base Documentation Template',
      lastEditor: 'Senior Writer',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    extendedStats: {
      successRateData: [0.95, 0.97, 0.94, 0.98, 0.96, 0.95, 0.97],
      p50Latency: 2100,
      p95Latency: 5200,
      p50LatencyData: [2200, 2100, 2000, 1950, 2100, 2150, 2100],
      tokenUsageData: [3200, 2980, 3150, 3050, 3100, 2950, 3200],
      avgTokens: 3090,
      costData: [0.015, 0.014, 0.016, 0.015, 0.015, 0.014, 0.016],
      avgCost: 0.015,
    },
    complications: createPermissionBadgeComplication('private', 'XL Template Owner'),
  },
  parameters: {
    docs: {
      description: {
        story: 'XL PromptCard with permission badge and all extended features - badge maintains consistent positioning.',
      },
    },
  },
};

// TypeBadge Examples
const createTypeBadgeComplication = (
  type: PromptType
): ComplicationSlots => ({
  topLeft: {
    component: (props) => (
      <TypeBadge
        {...props}
        type={type}
      />
    ),
    supportedSizes: ['compact', 'standard', 'xl'],
    supportedStates: ['default', 'running', 'error', 'disabled', 'selected'],
    performance: {
      memoize: true,
      priority: 90,
    },
  },
});

export const WithUserTypeBadge: Story = {
  args: {
    ...Default.args,
    title: 'Customer Support Chatbot Prompt',
    complications: createTypeBadgeComplication('user'),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with user type badge showing User icon and label in top-left.',
      },
    },
  },
};

export const WithSystemTypeBadge: Story = {
  args: {
    ...Default.args,
    title: 'AI Assistant Personality Configuration',
    complications: createTypeBadgeComplication('system'),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with system type badge showing Settings icon and label.',
      },
    },
  },
};

export const WithToolTypeBadge: Story = {
  args: {
    ...Default.args,
    title: 'Weather API Function Definition',
    complications: createTypeBadgeComplication('tool'),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with tool type badge showing Wrench icon and label.',
      },
    },
  },
};

export const WithEvalTypeBadge: Story = {
  args: {
    ...Default.args,
    title: 'Response Quality Evaluation Prompt',
    complications: createTypeBadgeComplication('eval'),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with eval type badge showing CheckCircle icon and label.',
      },
    },
  },
};

export const WithAgentTypeBadge: Story = {
  args: {
    ...Default.args,
    title: 'Agent Workflow Instructions',
    complications: createTypeBadgeComplication('agent_instruction'),
  },
  parameters: {
    docs: {
      description: {
        story: 'PromptCard with agent instruction type badge showing Bot icon and label.',
      },
    },
  },
};

export const CompactWithTypeBadge: Story = {
  args: {
    ...Default.args,
    size: 'compact',
    title: 'Compact System Prompt',
    complications: createTypeBadgeComplication('system'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact PromptCard with type badge - badge shows only icon without text label.',
      },
    },
  },
};

export const XLWithTypeBadge: Story = {
  args: {
    ...XL.args,
    title: 'XL Tool Definition with Extended Features',
    complications: createTypeBadgeComplication('tool'),
  },
  parameters: {
    docs: {
      description: {
        story: 'XL PromptCard with type badge and all extended features - badge maintains consistent positioning.',
      },
    },
  },
};

export const AllTypesShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-text-strong">Prompt Type Classification</h3>
        <p className="text-sm text-text-muted mb-4">
          TypeBadge displays in the top-left corner to classify prompts by their intended use.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <PromptCard
          title="User Chat Interface"
          version={1}
          access="private"
          tags={['chat', 'user-facing']}
          description="For end-user interactions and chat interfaces"
          complications={createTypeBadgeComplication('user')}
          onRun={fn()}
          onEdit={fn()}
        />
        <PromptCard
          title="System Configuration"
          version={1}
          access="private"
          tags={['config', 'system']}
          description="Defines AI behavior, persona, and constraints"
          complications={createTypeBadgeComplication('system')}
          onRun={fn()}
          onEdit={fn()}
        />
        <PromptCard
          title="API Function Definition"
          version={1}
          access="public"
          tags={['function', 'api']}
          description="Specifies functions/tools the AI can call"
          complications={createTypeBadgeComplication('tool')}
          onRun={fn()}
          onEdit={fn()}
        />
        <PromptCard
          title="Quality Assessment"
          version={1}
          access="shared"
          tags={['testing', 'qa']}
          description="Used for testing and quality assessment"
          complications={createTypeBadgeComplication('eval')}
          onRun={fn()}
          onEdit={fn()}
        />
        <PromptCard
          title="Agent Workflow"
          version={1}
          access="private"
          tags={['agent', 'workflow']}
          description="Specific instructions for agent workflows"
          complications={createTypeBadgeComplication('agent_instruction')}
          onRun={fn()}
          onEdit={fn()}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all 5 prompt types with TypeBadge - demonstrates complete type taxonomy.',
      },
    },
  },
};

// Checkbox Selection Stories
export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectable: true,
    selected: false,
    title: 'Selectable Prompt Card',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with selection checkbox - hover to see the checkbox appear in the top-left corner.',
      },
    },
  },
};

export const SelectedState: Story = {
  args: {
    ...Default.args,
    selectable: true,
    selected: true,
    title: 'Selected Prompt Card',
  },
  parameters: {
    docs: {
      description: {
        story: 'Card in selected state with visible checkbox, blue border, and subtle background tint. Checkbox remains visible.',
      },
    },
  },
};

export const BulkSelectionActive: Story = {
  args: {
    ...Default.args,
    selectable: true,
    selected: false,
    hasActiveSelection: true,
    title: 'Card in Bulk Selection Mode',
  },
  parameters: {
    docs: {
      description: {
        story: 'When any card is selected, all selectable cards show their checkboxes (hasActiveSelection=true).',
      },
    },
  },
};

export const SelectionInteractiveDemo: Story = {
  render: () => {
    const [selectedCards, setSelectedCards] = React.useState<Set<number>>(new Set());

    const handleSelectionChange = (cardId: number, selected: boolean) => {
      setSelectedCards(prev => {
        const next = new Set(prev);
        if (selected) {
          next.add(cardId);
        } else {
          next.delete(cardId);
        }
        return next;
      });
    };

    const hasActiveSelection = selectedCards.size > 0;

    const cards = [
      { id: 1, title: 'Customer Support Email Template', access: 'private' as const },
      { id: 2, title: 'Code Review Template', access: 'shared' as const },
      { id: 3, title: 'API Documentation Helper', access: 'public' as const },
      { id: 4, title: 'Sales Pitch Generator', access: 'private' as const },
    ];

    return (
      <div className="space-y-6 p-8">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-text-strong">Interactive Bulk Selection</h3>
          <p className="text-sm text-text-muted mb-4">
            Hover over cards to reveal checkboxes. Select one to see all checkboxes appear.
            {selectedCards.size > 0 && ` (${selectedCards.size} selected)`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => (
            <PromptCard
              key={card.id}
              title={card.title}
              version={1}
              access={card.access}
              tags={['demo', 'selectable']}
              description="Interactive selection demo"
              selectable
              selected={selectedCards.has(card.id)}
              hasActiveSelection={hasActiveSelection}
              onSelectionChange={(selected) => handleSelectionChange(card.id, selected)}
              onRun={fn()}
              onEdit={fn()}
            />
          ))}
        </div>
        {selectedCards.size > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900">
              {selectedCards.size} card{selectedCards.size !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => setSelectedCards(new Set())}
              className="text-sm text-blue-700 hover:text-blue-900 underline"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive bulk selection demo. Hover to see checkboxes, select cards to enter bulk selection mode.',
      },
    },
  },
};

export const CompactWithSelection: Story = {
  args: {
    ...Default.args,
    size: 'compact',
    selectable: true,
    selected: false,
    hasActiveSelection: true,
    title: 'Compact Selectable Card',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact card with checkbox selection - checkbox scales appropriately for smaller size.',
      },
    },
  },
};

export const XLWithSelection: Story = {
  args: {
    ...XL.args,
    selectable: true,
    selected: true,
    title: 'XL Selected Card',
  },
  parameters: {
    docs: {
      description: {
        story: 'XL card with selection checkbox - maintains proper positioning with extended content.',
      },
    },
  },
};

export const DisabledWithSelection: Story = {
  args: {
    ...Default.args,
    selectable: true,
    selected: false,
    hasActiveSelection: true,
    disabled: true,
    title: 'Disabled Selectable Card',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled card with checkbox - checkbox is visible but disabled and grayed out.',
      },
    },
  },
};

// Interactive States Showcase
export const InteractiveStatesShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Hover Effects</h3>
        <p className="text-sm text-text-muted mb-4">
          Hover over these cards to see elevation lift, border color change, and title color transition.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <PromptCard
            title="Standard Card"
            version={1}
            access="private"
            tags={['demo']}
            description="Hover to see standard lift effect"
            onPrimaryAction={fn()}
          />
          <PromptCard
            title="Compact Card"
            size="compact"
            version={1}
            access="public"
            tags={['demo']}
            onPrimaryAction={fn()}
          />
          <PromptCard
            title="XL Card"
            size="xl"
            version={1}
            access="shared"
            tags={['demo', 'hover']}
            description="Hover for maximum lift effect"
            onPrimaryAction={fn()}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">State Variations</h3>
        <p className="text-sm text-text-muted mb-4">
          Different states with appropriate hover behaviors.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <PromptCard
            title="Default State"
            version={1}
            access="private"
            description="Full hover effects"
            onPrimaryAction={fn()}
          />
          <PromptCard
            title="Selected State"
            state="selected"
            version={1}
            access="private"
            description="Maintains selection outline on hover"
            onPrimaryAction={fn()}
          />
          <PromptCard
            title="Running State"
            state="running"
            isRunning
            version={1}
            access="private"
            description="Subtle hover during execution"
            onPrimaryAction={fn()}
          />
          <PromptCard
            title="Error State"
            state="error"
            error="Something went wrong"
            version={1}
            access="private"
            description="Maintains error styling on hover"
            onPrimaryAction={fn()}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Accessibility</h3>
        <p className="text-sm text-text-muted mb-4">
          Focus states with proper ring outlines. Try keyboard navigation (Tab, Enter).
        </p>
        <div className="grid grid-cols-2 gap-4">
          <PromptCard
            title="Keyboard Navigable"
            version={1}
            access="private"
            description="Tab to focus, Enter to activate"
            onPrimaryAction={fn()}
            onRun={fn()}
            onEdit={fn()}
          />
          <PromptCard
            title="Focus Ring Example"
            version={1}
            access="public"
            description="Clear focus indicators for all interactive elements"
            onPrimaryAction={fn()}
            onRun={fn()}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive showcase of all interactive states, hover effects, and accessibility features.',
      },
    },
  },
};

/**
 * Execution States
 * Demonstrates execution state badges for tracking prompt runs
 */
export const ExecutionStates: StoryObj<typeof PromptCard> = {
  render: () => (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Execution States</h3>
        <p className="text-sm text-text-muted mb-4">
          Status badges indicate current execution state with visual feedback.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <PromptCard
            title="Queued Execution"
            version={1}
            access="private"
            description="Execution waiting to start"
            executionState={{ status: 'queued', progress: 0 }}
            onRun={fn()}
            onEdit={fn()}
          />
          <PromptCard
            title="Running Execution"
            version={1}
            access="private"
            description="Execution in progress"
            isRunning={true}
            executionState={{ status: 'running', progress: 45 }}
            onRun={fn()}
            onEdit={fn()}
          />
          <PromptCard
            title="Successful Execution"
            version={1}
            access="public"
            description="Execution completed successfully"
            executionState={{ status: 'success', progress: 100 }}
            onRun={fn()}
            onEdit={fn()}
            metrics={{
              runs: 128,
              successRate: 95.5,
              avgCost: 1.23,
              avgTime: 2.34,
            }}
          />
          <PromptCard
            title="Failed Execution"
            version={1}
            access="private"
            description="Execution encountered an error"
            executionState={{
              status: 'failed',
              progress: 0,
              error: 'Model timeout after 30s'
            }}
            error="Execution failed: Model timeout"
            onRun={fn()}
            onEdit={fn()}
          />
          <PromptCard
            title="Cancelled Execution"
            version={1}
            access="shared"
            description="Execution was cancelled by user"
            executionState={{ status: 'cancelled', progress: 0 }}
            onRun={fn()}
            onEdit={fn()}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Execution state badges provide real-time feedback during prompt runs.',
      },
    },
  },
};

/**
 * WithBindings Story
 * Demonstrates the BindingsRow integration in the footer zone
 */
export const WithBindings: Story = {
  args: {
    title: 'Multi-Source Research Aggregator',
    description: 'Synthesizes information from multiple contexts and uses specialized agents',
    version: 3,
    access: 'shared',
    tags: ['research', 'aggregation', 'multi-context'],
    models: ['gpt-4-turbo', 'claude-3-opus'],
    primaryProvider: 'OpenAI',
    lastRun: new Date(Date.now() - 1000 * 60 * 15),
    bodyPreview:
      'This prompt combines data from API documentation, code examples, and user feedback to generate comprehensive technical documentation. It uses context variables to personalize output and model bindings to ensure consistency.',
    metrics: { runs: 45, successRate: 0.92, avgCost: 0.025, avgTime: 4.1 },
    bindings: [
      { type: 'context', name: 'API Documentation', id: 'ctx-1' },
      { type: 'context', name: 'Code Examples', id: 'ctx-2' },
      { type: 'agent', name: 'Technical Writer', id: 'agent-1' },
      { type: 'variable', name: 'userName', id: 'var-1' },
      { type: 'variable', name: 'targetAudience', id: 'var-2' },
      { type: 'model', name: 'GPT-4 Turbo', id: 'model-1' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'BindingsRow displays prompt bindings (contexts, agents, variables, models) in the footer zone with overflow management. Standard cards show 4 visible bindings, XL cards show 6.',
      },
    },
  },
};

/**
 * WithBindingsXL Story
 * Demonstrates the BindingsRow with extended capacity in XL card
 */
export const WithBindingsXL: Story = {
  args: {
    ...WithBindings.args,
    size: 'xl',
    bindings: [
      { type: 'context', name: 'API Documentation', id: 'ctx-1' },
      { type: 'context', name: 'Code Examples', id: 'ctx-2' },
      { type: 'context', name: 'User Feedback', id: 'ctx-3' },
      { type: 'agent', name: 'Technical Writer', id: 'agent-1' },
      { type: 'agent', name: 'Code Reviewer', id: 'agent-2' },
      { type: 'variable', name: 'userName', id: 'var-1' },
      { type: 'variable', name: 'targetAudience', id: 'var-2' },
      { type: 'variable', name: 'complexity', id: 'var-3' },
      { type: 'model', name: 'GPT-4 Turbo', id: 'model-1' },
      { type: 'model', name: 'Claude 3 Opus', id: 'model-2' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'XL cards display up to 6 visible bindings before showing overflow (+N more). This allows more binding information while maintaining a clean layout.',
      },
    },
  },
};

/**
 * WithBindingsOverflow Story
 * Demonstrates overflow behavior when bindings exceed visible limit
 */
export const WithBindingsOverflow: Story = {
  args: {
    ...WithBindings.args,
    bindings: [
      { type: 'context', name: 'API Documentation', id: 'ctx-1' },
      { type: 'context', name: 'Code Examples', id: 'ctx-2' },
      { type: 'context', name: 'User Feedback', id: 'ctx-3' },
      { type: 'context', name: 'Design Guidelines', id: 'ctx-4' },
      { type: 'agent', name: 'Technical Writer', id: 'agent-1' },
      { type: 'agent', name: 'Code Reviewer', id: 'agent-2' },
      { type: 'agent', name: 'QA Specialist', id: 'agent-3' },
      { type: 'variable', name: 'userName', id: 'var-1' },
      { type: 'variable', name: 'targetAudience', id: 'var-2' },
      { type: 'variable', name: 'complexity', id: 'var-3' },
      { type: 'variable', name: 'version', id: 'var-4' },
      { type: 'model', name: 'GPT-4 Turbo', id: 'model-1' },
      { type: 'model', name: 'Claude 3 Opus', id: 'model-2' },
      { type: 'model', name: 'Claude 3 Sonnet', id: 'model-3' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'When bindings exceed the visible limit (4 for standard, 6 for XL), the overflow is shown in a tooltip via the "+N more" badge. Hover over the overflow badge to see all hidden bindings.',
      },
    },
  },
};

/**
 * ExpandedContentPreview Story
 * Demonstrates the expanded body preview with increased height
 */
export const ExpandedContentPreview: Story = {
  args: {
    title: 'Long-Form Content Generator',
    version: 2,
    access: 'shared',
    tags: ['content', 'generation', 'long-form'],
    description: 'Generates comprehensive long-form content with proper structure',
    size: 'standard',
    bodyPreview:
      'You are a professional content writer specializing in technical documentation and blog posts. Your task is to create comprehensive, well-structured content that engages readers and clearly explains complex concepts. Start with a compelling introduction that hooks the reader, then break down the main topics into digestible sections with clear headings and examples. Use formatting strategically to improve readability.',
    metrics: { runs: 67, successRate: 0.94, avgCost: 0.018, avgTime: 3.2 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard card with expanded body preview showing 3-line content display. Card height increased from 280px to 340px to accommodate additional preview lines.',
      },
    },
  },
};

/**
 * ExpandedContentPreviewXL Story
 * Demonstrates the XL card with expanded body preview
 */
export const ExpandedContentPreviewXL: Story = {
  args: {
    title: 'Comprehensive API Documentation Generator',
    version: 3,
    access: 'public',
    tags: ['api', 'documentation', 'reference'],
    description: 'Generates complete API documentation with examples and error handling',
    size: 'xl',
    bodyPreview:
      'You are an expert technical documentation specialist. Create comprehensive API documentation that includes endpoint descriptions, parameter specifications, request/response examples, and error handling guides. Structure each endpoint with clear sections for overview, authentication requirements, parameters, responses, and real-world usage examples. Ensure consistency across all documentation and follow REST API best practices.',
    blockChips: {
      persona: 'Senior technical documentation specialist',
      context: 'API project with REST endpoints and webhooks',
      output: 'Complete API reference documentation',
      instructions: 'Include code examples, error scenarios, and authentication details',
    },
    metrics: { runs: 89, successRate: 0.97, avgCost: 0.022, avgTime: 4.5 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'XL card with expanded body preview showing 4-line content display. Card height increased from 320px to 400px, with full block chips and extended metrics visible.',
      },
    },
  },
};

/**
 * ProviderBadgeWithCheckbox Story
 * Demonstrates provider badge positioning with checkbox without overlap
 */
export const ProviderBadgeWithCheckbox: Story = {
  args: {
    title: 'OpenAI Provider Prompt',
    version: 1,
    access: 'shared',
    tags: ['openai', 'gpt-4'],
    description: 'Prompt configured for OpenAI API',
    primaryProvider: 'OpenAI',
    model: 'gpt-4-turbo',
    selectable: true,
    hasActiveSelection: true,
    metrics: { runs: 42, successRate: 0.88, avgCost: 0.015, avgTime: 2.8 },
    onRun: fn(),
    onEdit: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with both selection checkbox and provider badge. Demonstrates proper clearance between checkbox (top-left) and badge, with appropriate topLeft shifting.',
      },
    },
  },
};

/**
 * AllRedesignFeatures Story
 * Comprehensive showcase of all Phase 1-4 redesign features together
 */
export const AllRedesignFeatures: Story = {
  args: {
    title: 'Complete AI Agent Orchestration System',
    version: 5,
    access: 'shared',
    tags: ['agent', 'orchestration', 'multi-agent', 'workflow', 'production'],
    description: 'Full-featured agent orchestration with multiple specialized processors',
    size: 'xl',
    primaryProvider: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet'],
    bodyPreview:
      'You are the primary orchestration layer for a multi-agent AI system. Coordinate between specialized agents, manage context distribution, track performance metrics, and handle error recovery. Route queries to appropriate specialists, aggregate responses, and ensure system-wide consistency. Monitor resource usage and optimize for latency.',
    blockChips: {
      persona: 'Multi-agent orchestration controller with 10+ years experience',
      context: 'Enterprise AI platform with distributed agents',
      output: 'Coordinated agent responses with unified output format',
      instructions: 'Prioritize low latency, handle partial failures gracefully, maintain context across agent boundaries',
    },
    provenance: {
      originalAuthor: 'AI Team',
      forkSource: 'Base Orchestration Template',
      lastEditor: 'Alex Chen',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
    extendedStats: {
      successRateData: [0.94, 0.96, 0.95, 0.97, 0.94, 0.96, 0.95],
      p50Latency: 850,
      p95Latency: 2100,
      p50LatencyData: [900, 850, 800, 850, 900, 850, 800],
      tokenUsageData: [4500, 4200, 4800, 4300, 4600, 4100, 4700],
      avgTokens: 4385,
      costData: [0.032, 0.030, 0.034, 0.031, 0.033, 0.029, 0.034],
      avgCost: 0.032,
    },
    metrics: { runs: 234, successRate: 0.95, avgCost: 0.032, avgTime: 1.2 },
    bindings: [
      { type: 'context', name: 'Agent Registry', id: 'ctx-1' },
      { type: 'context', name: 'Knowledge Base', id: 'ctx-2' },
      { type: 'context', name: 'Performance Logs', id: 'ctx-3' },
      { type: 'agent', name: 'Data Analyst', id: 'agent-1' },
      { type: 'agent', name: 'Code Generator', id: 'agent-2' },
      { type: 'agent', name: 'Quality Auditor', id: 'agent-3' },
      { type: 'variable', name: 'maxAgents', id: 'var-1' },
      { type: 'variable', name: 'timeout', id: 'var-2' },
      { type: 'variable', name: 'retryCount', id: 'var-3' },
      { type: 'model', name: 'Claude 3 Opus', id: 'model-1' },
      { type: 'model', name: 'Claude 3 Sonnet', id: 'model-2' },
    ],
    selectable: true,
    selected: false,
    hasActiveSelection: false,
    state: 'default',
    onRun: fn(),
    onEdit: fn(),
    onFork: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase demonstrating all Phase 1-4 redesign features: expanded content preview (4 lines for XL), block chips with all fields, provenance tracking, extended statistics with sparklines, bindings row with overflow management, selection support, and proper badge positioning.',
      },
    },
  },
};

/**
 * SizesComparisonShowcase Story
 * Demonstrates all three card sizes with the same content
 */
export const SizesComparisonShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-text-strong">Card Size Comparison</h3>
        <p className="text-sm text-text-muted mb-6">
          Three card sizes with the same content showing responsive layout adaptation
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-text-strong">Compact (288x220px)</h4>
        <PromptCard
          size="compact"
          title="Compact Prompt Template"
          version={1}
          access="private"
          tags={['compact', 'demo']}
          description="Minimal information display"
          metrics={{ runs: 12, successRate: 0.85, avgCost: 0.01, avgTime: 1.5 }}
          onRun={fn()}
          onEdit={fn()}
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-text-strong">Standard (420x280px)</h4>
        <PromptCard
          size="standard"
          title="Standard Prompt Template"
          version={2}
          access="shared"
          tags={['standard', 'demo', 'production']}
          description="Default size for general use with standard content preview"
          bodyPreview="This is the default size card showing a typical amount of information. It balances content display with visual hierarchy."
          metrics={{ runs: 45, successRate: 0.92, avgCost: 0.015, avgTime: 2.3 }}
          onRun={fn()}
          onEdit={fn()}
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-text-strong">XL (560x400px)</h4>
        <PromptCard
          size="xl"
          title="XL Prompt Template with Extended Content"
          version={3}
          access="public"
          tags={['xl', 'demo', 'detailed', 'extended']}
          description="Extended size with maximum content display and detailed metadata"
          bodyPreview="This is the XL size card showing the maximum amount of content. It includes more detailed information, extended statistics with sparklines, block chips, and provenance tracking for comprehensive prompt understanding."
          blockChips={{
            persona: 'Senior prompt engineer',
            context: 'Enterprise AI system',
            output: 'Production prompt configuration',
            instructions: 'Ensure quality and consistency',
          }}
          extendedStats={{
            successRateData: [0.91, 0.93, 0.92, 0.94, 0.91, 0.93, 0.92],
            p50Latency: 1900,
            p95Latency: 4500,
            p50LatencyData: [2100, 1900, 1800, 1850, 1900, 2000, 1900],
            tokenUsageData: [2400, 2250, 2500, 2300, 2400, 2200, 2500],
            avgTokens: 2350,
            costData: [0.012, 0.013, 0.015, 0.012, 0.013, 0.011, 0.015],
            avgCost: 0.013,
          }}
          metrics={{ runs: 89, successRate: 0.92, avgCost: 0.013, avgTime: 3.1 }}
          onRun={fn()}
          onEdit={fn()}
          onCompare={fn()}
          onAnalytics={fn()}
          onHistory={fn()}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Side-by-side comparison of all three card sizes (compact, standard, XL) showing responsive content display and layout adaptation.',
      },
    },
  },
};

/**
 * BindingTypesShowcase Story
 * Demonstrates all binding types in context
 */
export const BindingTypesShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-text-strong">Binding Types Reference</h3>
        <p className="text-sm text-text-muted mb-6">
          PromptCard displaying all four binding types in the footer zone
        </p>
      </div>

      <PromptCard
        title="Multi-Modal Content Analysis Assistant"
        version={2}
        access="shared"
        tags={['analysis', 'multi-modal', 'content']}
        description="Analyzes content across multiple modalities with specialized processors"
        size="standard"
        bodyPreview={
          'Process and analyze content from multiple sources including text documents, images, audio transcripts, and code repositories. Coordinate analysis across specialized agents while maintaining context.'
        }
        bindings={[
          { type: 'context', name: 'Document Library', id: '1' },
          { type: 'context', name: 'Image Dataset', id: '2' },
          { type: 'agent', name: 'Text Analyzer', id: '3' },
          { type: 'agent', name: 'Vision Processor', id: '4' },
          { type: 'variable', name: 'contentType', id: '5' },
          { type: 'variable', name: 'analysisDepth', id: '6' },
          { type: 'model', name: 'Claude 3 Opus', id: '7' },
          { type: 'model', name: 'GPT-4 Vision', id: '8' },
        ]}
        metrics={{ runs: 156, successRate: 0.94, avgCost: 0.028, avgTime: 3.7 }}
        onRun={fn()}
        onEdit={fn()}
      />

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-900 font-mono">
          Bindings: 8 total (4 visible + 4 in overflow tooltip)
        </p>
        <p className="text-xs text-blue-700 mt-2">
          Context: Knowledge sources • Agent: Specialized processors • Variable: Dynamic parameters • Model: AI engines
        </p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Demonstration of all four binding types in a real-world card scenario, showing how different binding types work together with overflow management.',
      },
    },
  },
};
