import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BindingsRow, type Binding } from './BindingsRow';

/**
 * BindingsRow - Display prompt bindings with overflow management
 *
 * Shows a row of binding chips (contexts, agents, variables, models) with:
 * - Type-specific icons and colors
 * - Configurable visible limit with overflow tooltip
 * - Responsive limits based on card size
 * - Optional click handlers for filtering/navigation
 * - Full accessibility support
 *
 * ## Responsive Limits
 * - **Standard cards**: 4 visible bindings + overflow badge
 * - **XL cards**: 6 visible bindings + overflow badge
 * - **Empty state**: Component returns null when no bindings
 *
 * ## Overflow Behavior
 * - Shows "+N more" badge when bindings exceed visible limit
 * - Hover over badge reveals tooltip with all overflow bindings
 * - Maintains proper spacing and alignment
 *
 * ## Accessibility
 * - Full WCAG AA compliance
 * - Proper ARIA labels for lists and items
 * - Keyboard accessible overflow tooltip
 * - Screen reader support for binding counts
 */

const meta: Meta<typeof BindingsRow> = {
  title: 'Components/PromptCard/BindingsRow',
  component: BindingsRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'BindingsRow displays all prompt bindings (contexts, agents, variables, models) in a horizontal row with smart overflow management. Adapts visible limit based on card size.',
      },
    },
  },
  argTypes: {
    bindings: {
      control: 'object',
      description: 'Array of binding objects to display',
    },
    maxVisible: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of visible bindings before showing overflow',
    },
    onBindingClick: {
      action: 'binding-clicked',
      description: 'Optional click handler for individual bindings',
    },
  },
  args: {
    onBindingClick: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BindingsRow>;

/**
 * Sample bindings for demonstration
 */
const sampleBindings: Binding[] = [
  { type: 'context', name: 'API Documentation', id: '1' },
  { type: 'context', name: 'Code Examples', id: '2' },
  { type: 'agent', name: 'Technical Writer', id: '3' },
  { type: 'agent', name: 'Code Reviewer', id: '4' },
  { type: 'variable', name: 'userName', id: '5' },
  { type: 'variable', name: 'targetAudience', id: '6' },
  { type: 'variable', name: 'complexity', id: '7' },
  { type: 'model', name: 'GPT-4 Turbo', id: '8' },
  { type: 'model', name: 'Claude 3 Opus', id: '9' },
  { type: 'model', name: 'Claude 3 Sonnet', id: '10' },
];

/**
 * Few bindings, no overflow - standard layout
 */
export const WithFewBindings: Story = {
  args: {
    bindings: sampleBindings.slice(0, 3),
    maxVisible: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard card with 3 bindings (below 4 visible limit). No overflow badge shown.',
      },
    },
  },
};

/**
 * Standard card with overflow - exactly at limit
 */
export const WithExactLimit: Story = {
  args: {
    bindings: sampleBindings.slice(0, 4),
    maxVisible: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard card with exactly 4 bindings. No overflow, all bindings visible.',
      },
    },
  },
};

/**
 * Standard card with overflow (5 bindings, maxVisible=4)
 */
export const WithOverflowStandard: Story = {
  args: {
    bindings: sampleBindings.slice(0, 5),
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard card showing 4 visible bindings with "+1 more" overflow badge. Hover over badge to see hidden binding.',
      },
    },
  },
};

/**
 * Standard card with significant overflow
 */
export const WithOverflowSignificant: Story = {
  args: {
    bindings: sampleBindings.slice(0, 8),
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Standard card with 8 bindings (4 visible + 4 hidden). Shows "+4 more" overflow badge with tooltip.',
      },
    },
  },
};

/**
 * XL card with standard 6 visible limit
 */
export const WithOverflowXL: Story = {
  args: {
    bindings: sampleBindings.slice(0, 8),
    maxVisible: 6,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'XL card showing 6 visible bindings with "+2 more" overflow badge. More bindings visible than standard cards.',
      },
    },
  },
};

/**
 * XL card at maximum typical capacity
 */
export const WithOverflowXLMaximum: Story = {
  args: {
    bindings: sampleBindings,
    maxVisible: 6,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'XL card with 10 bindings (6 visible + 4 hidden). Shows "+4 more" overflow badge.',
      },
    },
  },
};

/**
 * All binding types mixed together
 */
export const AllBindingTypesMixed: Story = {
  args: {
    bindings: [
      { type: 'context', name: 'API Documentation', id: '1' },
      { type: 'agent', name: 'Code Reviewer', id: '2' },
      { type: 'variable', name: 'userName', id: '3' },
      { type: 'model', name: 'GPT-4', id: '4' },
      { type: 'context', name: 'Design Guide', id: '5' },
      { type: 'agent', name: 'QA Tester', id: '6' },
    ],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row showing a practical mix of all four binding types. Demonstrates how different colors work together.',
      },
    },
  },
};

/**
 * Single binding
 */
export const SingleBinding: Story = {
  args: {
    bindings: [{ type: 'context', name: 'API Documentation', id: '1' }],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal bindings row with a single binding.',
      },
    },
  },
};

/**
 * Two bindings
 */
export const TwoBindings: Story = {
  args: {
    bindings: [
      { type: 'context', name: 'Documentation', id: '1' },
      { type: 'model', name: 'GPT-4', id: '2' },
    ],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row with two bindings, showing clean minimal layout.',
      },
    },
  },
};

/**
 * Only contexts
 */
export const OnlyContexts: Story = {
  args: {
    bindings: [
      { type: 'context', name: 'API Documentation', id: '1' },
      { type: 'context', name: 'Code Examples', id: '2' },
      { type: 'context', name: 'User Feedback', id: '3' },
      { type: 'context', name: 'Design Guidelines', id: '4' },
      { type: 'context', name: 'Requirements', id: '5' },
    ],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row with only context bindings (all blue). Shows "+1 more" overflow badge.',
      },
    },
  },
};

/**
 * Only agents
 */
export const OnlyAgents: Story = {
  args: {
    bindings: [
      { type: 'agent', name: 'Technical Writer', id: '1' },
      { type: 'agent', name: 'Code Reviewer', id: '2' },
      { type: 'agent', name: 'QA Specialist', id: '3' },
      { type: 'agent', name: 'Security Auditor', id: '4' },
      { type: 'agent', name: 'Performance Analyst', id: '5' },
    ],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row with only agent bindings (all teal). Demonstrates single type scenario.',
      },
    },
  },
};

/**
 * Only variables
 */
export const OnlyVariables: Story = {
  args: {
    bindings: [
      { type: 'variable', name: 'userName', id: '1' },
      { type: 'variable', name: 'userId', id: '2' },
      { type: 'variable', name: 'roleLevel', id: '3' },
      { type: 'variable', name: 'department', id: '4' },
      { type: 'variable', name: 'location', id: '5' },
    ],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row with only variable bindings (all amber). Shows dynamic parameters.',
      },
    },
  },
};

/**
 * Only models
 */
export const OnlyModels: Story = {
  args: {
    bindings: [
      { type: 'model', name: 'GPT-4 Turbo', id: '1' },
      { type: 'model', name: 'Claude 3 Opus', id: '2' },
      { type: 'model', name: 'Claude 3 Sonnet', id: '3' },
      { type: 'model', name: 'Gemini Pro', id: '4' },
      { type: 'model', name: 'Llama 2', id: '5' },
    ],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row with only model bindings (all violet). Shows available AI models.',
      },
    },
  },
};

/**
 * Empty state - no bindings
 */
export const EmptyState: Story = {
  args: {
    bindings: [],
    maxVisible: 4,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty bindings array. Component returns null and renders nothing.',
      },
    },
  },
};

/**
 * Read-only mode without click handler
 */
export const ReadOnlyMode: Story = {
  args: {
    bindings: sampleBindings.slice(0, 6),
    maxVisible: 4,
    onBindingClick: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row in read-only mode (no onBindingClick handler). Bindings are not interactive.',
      },
    },
  },
};

/**
 * Interactive mode with click handler
 */
export const InteractiveMode: Story = {
  args: {
    bindings: sampleBindings.slice(0, 5),
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Bindings row with click handlers enabled. Click any binding to trigger action (see Actions panel).',
      },
    },
  },
};

/**
 * Custom maxVisible limit (fewer visible)
 */
export const CustomMaxVisibleFewer: Story = {
  args: {
    bindings: sampleBindings.slice(0, 5),
    maxVisible: 2,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom maxVisible=2 (fewer than standard). Shows 2 visible bindings with "+3 more" overflow badge.',
      },
    },
  },
};

/**
 * Custom maxVisible limit (more visible)
 */
export const CustomMaxVisibleMore: Story = {
  args: {
    bindings: sampleBindings.slice(0, 8),
    maxVisible: 8,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom maxVisible=8 (more than standard/XL). Shows all 8 bindings without overflow.',
      },
    },
  },
};

/**
 * Large overflow count
 */
export const LargeOverflow: Story = {
  args: {
    bindings: sampleBindings,
    maxVisible: 3,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates handling of large overflow. Shows 3 visible bindings with "+7 more" badge.',
      },
    },
  },
};

/**
 * Comprehensive showcase with different configurations
 */
export const ComprehensiveShowcase: Story = {
  render: () => (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>Standard Card (maxVisible=4)</h3>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Few bindings (3)</p>
          <BindingsRow bindings={sampleBindings.slice(0, 3)} maxVisible={4} onBindingClick={fn()} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>At limit (4)</p>
          <BindingsRow bindings={sampleBindings.slice(0, 4)} maxVisible={4} onBindingClick={fn()} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Overflow (7)</p>
          <BindingsRow bindings={sampleBindings.slice(0, 7)} maxVisible={4} onBindingClick={fn()} />
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>XL Card (maxVisible=6)</h3>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>At limit (6)</p>
          <BindingsRow bindings={sampleBindings.slice(0, 6)} maxVisible={6} onBindingClick={fn()} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Overflow (10)</p>
          <BindingsRow bindings={sampleBindings} maxVisible={6} onBindingClick={fn()} />
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>Binding Type Distribution</h3>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Mixed types (5 bindings)</p>
          <BindingsRow
            bindings={[
              { type: 'context', name: 'Docs', id: '1' },
              { type: 'agent', name: 'Reviewer', id: '2' },
              { type: 'variable', name: 'user', id: '3' },
              { type: 'model', name: 'GPT-4', id: '4' },
              { type: 'context', name: 'Guide', id: '5' },
            ]}
            maxVisible={4}
            onBindingClick={fn()}
          />
        </div>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Comprehensive showcase demonstrating various configurations, overflow scenarios, and binding type combinations.',
      },
    },
  },
};

/**
 * Real-world prompt example
 */
export const RealWorldPromptExample: Story = {
  args: {
    bindings: [
      { type: 'context', name: 'Company Style Guide', id: '1' },
      { type: 'context', name: 'Compliance Rules', id: '2' },
      { type: 'agent', name: 'Content Reviewer', id: '3' },
      { type: 'variable', name: 'brand', id: '4' },
      { type: 'variable', name: 'audience', id: '5' },
      { type: 'variable', name: 'tone', id: '6' },
      { type: 'model', name: 'GPT-4 Turbo', id: '7' },
    ],
    maxVisible: 4,
    onBindingClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world example: marketing content generator with style guide, compliance rules, reviewer agent, brand parameters, and GPT-4 model.',
      },
    },
  },
};
