import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BindingsChip, type BindingType } from './BindingsChip';

/**
 * BindingsChip - Type-specific binding indicators for prompt cards
 *
 * Displays individual prompt bindings (contexts, agents, variables, models)
 * with color-coded icons and support for interactive states.
 *
 * ## Binding Types
 * - **Context** (blue, FileText icon): Knowledge sources and documentation
 * - **Agent** (teal, Bot icon): AI agents and specialized processors
 * - **Variable** (amber, Variable icon): Dynamic parameters and inputs
 * - **Model** (violet, Zap icon): AI models and language engines
 *
 * ## States
 * - Default: Interactive, clickable state
 * - Hover: Enhanced visual feedback
 * - Focus: Keyboard navigation support
 * - Disabled: Reduced opacity, non-interactive
 *
 * ## Accessibility
 * - Full WCAG AA compliance
 * - Proper ARIA labels for screen readers
 * - Keyboard navigation support (Tab, Enter/Space)
 * - Clear focus indicators for keyboard users
 */

const meta: Meta<typeof BindingsChip> = {
  title: 'Components/PromptCard/BindingsChip',
  component: BindingsChip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'BindingsChip displays a single prompt binding with type-specific icon, color coding, and interactive states. Used in BindingsRow to show all bindings for a prompt.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['context', 'agent', 'variable', 'model'],
      description: 'Type of binding - determines icon and color',
    },
    name: {
      control: 'text',
      description: 'Display name of the binding',
    },
    onClick: {
      action: 'clicked',
      description: 'Optional click handler',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the chip is disabled',
    },
  },
  args: {
    onClick: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BindingsChip>;

/**
 * Default context binding in interactive state
 */
export const ContextBinding: Story = {
  args: {
    type: 'context',
    name: 'API Documentation',
  },
  parameters: {
    docs: {
      description: {
        story: 'Context binding with blue color and FileText icon. Used for knowledge sources and documentation references.',
      },
    },
  },
};

/**
 * Agent binding with specialized processor
 */
export const AgentBinding: Story = {
  args: {
    type: 'agent',
    name: 'Code Reviewer',
  },
  parameters: {
    docs: {
      description: {
        story: 'Agent binding with teal color and Bot icon. Used for AI agents that process or enhance prompts.',
      },
    },
  },
};

/**
 * Variable binding for dynamic parameters
 */
export const VariableBinding: Story = {
  args: {
    type: 'variable',
    name: 'userName',
  },
  parameters: {
    docs: {
      description: {
        story: 'Variable binding with amber color and Variable icon. Used for dynamic parameters injected at runtime.',
      },
    },
  },
};

/**
 * Model binding for AI language models
 */
export const ModelBinding: Story = {
  args: {
    type: 'model',
    name: 'GPT-4 Turbo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Model binding with violet color and Zap icon. Used to specify which AI model executes the prompt.',
      },
    },
  },
};

/**
 * All four binding types displayed together
 */
export const AllBindingTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', maxWidth: '500px' }}>
      <BindingsChip type="context" name="API Docs" />
      <BindingsChip type="agent" name="Reviewer" />
      <BindingsChip type="variable" name="userName" />
      <BindingsChip type="model" name="GPT-4" />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Showcase of all four binding types with their respective colors and icons.',
      },
    },
  },
};

/**
 * Disabled context binding
 */
export const DisabledContext: Story = {
  args: {
    type: 'context',
    name: 'API Documentation',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled binding with reduced opacity and not-allowed cursor. Click handler is ignored.',
      },
    },
  },
};

/**
 * Disabled agent binding
 */
export const DisabledAgent: Story = {
  args: {
    type: 'agent',
    name: 'Code Reviewer',
    disabled: true,
  },
};

/**
 * Disabled variable binding
 */
export const DisabledVariable: Story = {
  args: {
    type: 'variable',
    name: 'userName',
    disabled: true,
  },
};

/**
 * Disabled model binding
 */
export const DisabledModel: Story = {
  args: {
    type: 'model',
    name: 'GPT-4 Turbo',
    disabled: true,
  },
};

/**
 * All binding types in disabled state
 */
export const AllDisabledStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', maxWidth: '500px' }}>
      <BindingsChip type="context" name="API Docs" disabled />
      <BindingsChip type="agent" name="Reviewer" disabled />
      <BindingsChip type="variable" name="userName" disabled />
      <BindingsChip type="model" name="GPT-4" disabled />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'All binding types displayed in disabled state with reduced opacity.',
      },
    },
  },
};

/**
 * Interactive state with click handler
 */
export const InteractiveWithClick: Story = {
  args: {
    type: 'context',
    name: 'API Documentation',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'BindingsChip with click handler enabled. Can be used for filtering or navigation.',
      },
    },
  },
};

/**
 * Demonstration of hover and focus states
 */
export const InteractionStatesShowcase: Story = {
  render: () => (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <section>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>Default States</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <BindingsChip type="context" name="API Documentation" onClick={fn()} />
          <BindingsChip type="agent" name="Code Reviewer" onClick={fn()} />
          <BindingsChip type="variable" name="userName" onClick={fn()} />
          <BindingsChip type="model" name="GPT-4 Turbo" onClick={fn()} />
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280' }}>
          Hover over chips to see enhanced visual feedback. Click to trigger action.
        </p>
      </section>

      <section>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>Focus States (Tab for keyboard navigation)</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <BindingsChip type="context" name="Documentation" onClick={fn()} />
          <BindingsChip type="agent" name="Agent" onClick={fn()} />
          <BindingsChip type="variable" name="Parameter" onClick={fn()} />
          <BindingsChip type="model" name="Model" onClick={fn()} />
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280' }}>
          Press Tab to focus individual chips. Use Enter or Space to activate.
        </p>
      </section>

      <section>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>Disabled States</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <BindingsChip type="context" name="Documentation" disabled />
          <BindingsChip type="agent" name="Agent" disabled />
          <BindingsChip type="variable" name="Parameter" disabled />
          <BindingsChip type="model" name="Model" disabled />
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280' }}>
          Disabled chips show reduced opacity and not-allowed cursor. Not clickable or keyboard navigable.
        </p>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Comprehensive showcase of all interaction states: default, hover, focus, and disabled. Interactive elements support keyboard navigation and proper focus indicators.',
      },
    },
  },
};

/**
 * Long binding names that may wrap or truncate
 */
export const LongBindingName: Story = {
  args: {
    type: 'context',
    name: 'Comprehensive API Documentation with Examples and Tutorials',
  },
  parameters: {
    docs: {
      description: {
        story: 'BindingsChip with long name demonstrates text handling within the chip.',
      },
    },
  },
};

/**
 * Short binding name
 */
export const ShortBindingName: Story = {
  args: {
    type: 'variable',
    name: 'id',
  },
  parameters: {
    docs: {
      description: {
        story: 'BindingsChip with minimal text content.',
      },
    },
  },
};

/**
 * Multiple chips in a compact row
 */
export const MultipleChipsCompact: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '400px' }}>
      <BindingsChip type="context" name="Docs" onClick={fn()} />
      <BindingsChip type="context" name="Examples" onClick={fn()} />
      <BindingsChip type="agent" name="Reviewer" onClick={fn()} />
      <BindingsChip type="agent" name="Tester" onClick={fn()} />
      <BindingsChip type="variable" name="user" onClick={fn()} />
      <BindingsChip type="variable" name="role" onClick={fn()} />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple binding chips in compact layout demonstrating space-efficient display.',
      },
    },
  },
};

/**
 * Real-world example with mixed binding types
 */
export const RealWorldExample: Story = {
  render: () => (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>Code Review Assistant Bindings</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <BindingsChip type="context" name="Code Style Guide" onClick={fn()} />
          <BindingsChip type="context" name="Project Architecture" onClick={fn()} />
          <BindingsChip type="agent" name="Security Auditor" onClick={fn()} />
          <BindingsChip type="variable" name="projectName" onClick={fn()} />
          <BindingsChip type="model" name="GPT-4 Turbo" onClick={fn()} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world example showing a practical combination of contexts, agents, variables, and models for a code review assistant.',
      },
    },
  },
};

/**
 * Binding type color reference
 */
export const ColorReference: Story = {
  render: () => (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>Binding Type Colors</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Context (Blue)</p>
            <BindingsChip type="context" name="API Documentation" />
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
              Knowledge sources, documentation, and reference materials
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Agent (Teal)</p>
            <BindingsChip type="agent" name="Code Reviewer" />
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
              AI agents and specialized processors
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Variable (Amber)</p>
            <BindingsChip type="variable" name="userName" />
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
              Dynamic parameters and runtime inputs
            </p>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Model (Violet)</p>
            <BindingsChip type="model" name="GPT-4 Turbo" />
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
              AI models and language engines
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Color reference guide showing the distinctive color and icon for each binding type.',
      },
    },
  },
};
