import type { Meta, StoryObj } from '@storybook/react';
import { AgentCard } from './AgentCard';
import { Github, Code2, Database } from 'lucide-react';

const meta = {
  title: 'Components/AgentCard',
  component: AgentCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'AgentCard displays agent metadata, runtime configuration, entry prompts, tools, and variables with interactive states and multiple size variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['compact', 'standard', 'xl'],
      description: 'Card size variant',
    },
    runtime: {
      control: 'select',
      options: ['cloud_code', 'cli', 'mcp', 'custom'],
      description: 'Agent runtime environment',
    },
    access: {
      control: 'select',
      options: ['private', 'public', 'shared'],
      description: 'Access control level',
    },
    isRunning: {
      control: 'boolean',
      description: 'Whether the agent is currently running',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the card is disabled',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable checkbox selection mode',
    },
    selected: {
      control: 'boolean',
      description: 'Whether this card is selected',
    },
  },
} satisfies Meta<typeof AgentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultProps = {
  name: 'Code Review Agent',
  version: '1.0',
  runtime: 'cloud_code' as const,
  entryPrompt: {
    id: 'prompt-123',
    name: 'Code Review Prompt',
    preview: 'Analyze pull request for code quality, security issues, and best practices. Provide detailed feedback.',
  },
  tools: [
    { id: 't1', name: 'GitHub API', icon: <Github className="h-3 w-3" /> },
    { id: 't2', name: 'Code Parser', icon: <Code2 className="h-3 w-3" /> },
  ],
  variables: {
    repo: 'string',
    pr_number: 'number',
    check_security: 'boolean',
  },
  tags: ['automation', 'code-review', 'github'],
  onRun: () => console.log('Run clicked'),
  onEdit: () => console.log('Edit clicked'),
  onExport: () => console.log('Export clicked'),
  onMenuAction: (action: string) => console.log('Menu action:', action),
};

// Standard Size Stories
export const Standard: Story = {
  args: {
    ...defaultProps,
    size: 'standard',
  },
};

export const StandardWithDescription: Story = {
  args: {
    ...defaultProps,
    size: 'standard',
    description: 'Automated code review agent that analyzes pull requests and provides detailed feedback on code quality.',
  },
};

export const StandardRunning: Story = {
  args: {
    ...defaultProps,
    size: 'standard',
    isRunning: true,
  },
};

export const StandardWithError: Story = {
  args: {
    ...defaultProps,
    size: 'standard',
    error: {
      message: 'Failed to connect to GitHub API. Please check your credentials.',
      retry: () => console.log('Retry clicked'),
    },
  },
};

// Compact Size Stories
export const Compact: Story = {
  args: {
    ...defaultProps,
    size: 'compact',
  },
};

export const CompactRunning: Story = {
  args: {
    ...defaultProps,
    size: 'compact',
    isRunning: true,
  },
};

// XL Size Stories
export const ExtraLarge: Story = {
  args: {
    ...defaultProps,
    size: 'xl',
    description: 'Comprehensive code review agent with advanced analysis capabilities.',
    tools: [
      { id: 't1', name: 'GitHub API', icon: <Github className="h-3 w-3" /> },
      { id: 't2', name: 'Code Parser', icon: <Code2 className="h-3 w-3" /> },
      { id: 't3', name: 'Security Scanner', icon: <Database className="h-3 w-3" /> },
      { id: 't4', name: 'Style Checker' },
      { id: 't5', name: 'Test Runner' },
    ],
    tags: ['automation', 'code-review', 'github', 'security', 'testing', 'quality'],
    metrics: {
      runs: 142,
      successRate: 0.95,
      avgDuration: 45,
    },
  },
};

// Runtime Variants
export const CloudCodeRuntime: Story = {
  args: {
    ...defaultProps,
    runtime: 'cloud_code',
    name: 'Cloud Code Agent',
  },
};

export const CLIRuntime: Story = {
  args: {
    ...defaultProps,
    runtime: 'cli',
    name: 'CLI Agent',
    description: 'Command-line interface agent for local execution',
  },
};

export const MCPRuntime: Story = {
  args: {
    ...defaultProps,
    runtime: 'mcp',
    name: 'MCP Agent',
    description: 'Model Context Protocol agent for enhanced capabilities',
  },
};

export const CustomRuntime: Story = {
  args: {
    ...defaultProps,
    runtime: 'custom',
    name: 'Custom Agent',
    description: 'Custom runtime configuration for specialized use cases',
  },
};

// Access Control Variants
export const PrivateAccess: Story = {
  args: {
    ...defaultProps,
    access: 'private',
  },
};

export const PublicAccess: Story = {
  args: {
    ...defaultProps,
    access: 'public',
  },
};

export const SharedAccess: Story = {
  args: {
    ...defaultProps,
    access: 'shared',
  },
};

// State Variants
export const Disabled: Story = {
  args: {
    ...defaultProps,
    disabled: true,
  },
};

export const Selected: Story = {
  args: {
    ...defaultProps,
    selectable: true,
    selected: true,
  },
};

export const SelectableWithHover: Story = {
  args: {
    ...defaultProps,
    selectable: true,
    hasActiveSelection: true,
  },
};

// Complex Scenarios
export const DataProcessingAgent: Story = {
  args: {
    name: 'Data Processing Agent',
    version: '2.3',
    runtime: 'mcp',
    entryPrompt: {
      id: 'prompt-456',
      name: 'Data Processing Pipeline',
      preview: 'Process large datasets with advanced filtering, transformation, and aggregation capabilities.',
    },
    tools: [
      { id: 't1', name: 'Pandas', icon: <Database className="h-3 w-3" /> },
      { id: 't2', name: 'NumPy' },
      { id: 't3', name: 'SQL Engine' },
    ],
    variables: {
      input_path: 'string',
      output_format: 'enum[csv,json,parquet]',
      chunk_size: 'number',
      filters: 'object',
    },
    tags: ['data', 'processing', 'etl', 'analytics'],
    access: 'shared',
    lastRun: new Date(Date.now() - 3600000), // 1 hour ago
    createdAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    size: 'standard',
  },
};

export const BackgroundWorker: Story = {
  args: {
    name: 'Background Worker',
    version: '1.5',
    runtime: 'cli',
    entryPrompt: {
      id: 'prompt-789',
      name: 'Background Task',
      preview: 'Execute long-running background tasks with automatic retry and error handling.',
    },
    tools: [
      { id: 't1', name: 'Task Queue' },
      { id: 't2', name: 'Redis' },
    ],
    variables: {
      queue_name: 'string',
      max_retries: 'number',
      timeout: 'number',
    },
    tags: ['background', 'queue', 'worker'],
    access: 'private',
    isRunning: true,
    metrics: {
      runs: 1247,
      successRate: 0.98,
      avgDuration: 120,
    },
    size: 'xl',
  },
};

// Minimal Configuration
export const Minimal: Story = {
  args: {
    name: 'Simple Agent',
    runtime: 'custom',
    entryPrompt: {
      id: 'prompt-minimal',
      name: 'Simple Prompt',
      preview: 'A minimal agent configuration.',
    },
  },
};

// Without Variables
export const WithoutVariables: Story = {
  args: {
    ...defaultProps,
    variables: undefined,
    showVariables: false,
  },
};

// Without Tools
export const WithoutTools: Story = {
  args: {
    ...defaultProps,
    tools: [],
  },
};

// Many Tools (Overflow)
export const ManyTools: Story = {
  args: {
    ...defaultProps,
    size: 'standard',
    tools: [
      { id: 't1', name: 'GitHub API' },
      { id: 't2', name: 'Code Parser' },
      { id: 't3', name: 'Security Scanner' },
      { id: 't4', name: 'Style Checker' },
      { id: 't5', name: 'Test Runner' },
      { id: 't6', name: 'Linter' },
      { id: 't7', name: 'Formatter' },
    ],
  },
};

// Long Content
export const LongContent: Story = {
  args: {
    name: 'Very Long Agent Name That Should Truncate Properly',
    version: '10.5',
    runtime: 'cloud_code',
    entryPrompt: {
      id: 'prompt-long',
      name: 'Very Long Entry Prompt Name',
      preview: 'This is a very long entry prompt preview that should demonstrate how the component handles lengthy content. It should be truncated appropriately based on the card size variant.',
    },
    tools: [
      { id: 't1', name: 'Tool with Very Long Name' },
      { id: 't2', name: 'Another Long Tool Name' },
      { id: 't3', name: 'Yet Another Long Tool' },
    ],
    variables: {
      very_long_variable_name_one: 'string',
      very_long_variable_name_two: 'number',
      very_long_variable_name_three: 'boolean',
      nested_object: {
        nested_property: 'value',
        another_nested: 'value',
      },
    },
    tags: ['very-long-tag-name-one', 'very-long-tag-name-two', 'another-long-tag', 'yet-another-tag'],
    size: 'standard',
  },
};

// Interactive Demo
export const InteractiveDemo: Story = {
  args: {
    ...defaultProps,
    onCardClick: () => console.log('Card clicked'),
    onTagClick: (tag: string) => console.log('Tag clicked:', tag),
    onToolClick: (toolId: string) => console.log('Tool clicked:', toolId),
    onEntryPromptClick: (promptId: string) => console.log('Entry prompt clicked:', promptId),
    onSelectionChange: (selected: boolean) => console.log('Selection changed:', selected),
    selectable: true,
  },
};

// Grid Layout Demo
export const GridDemo: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-4 bg-mp-background" style={{ width: '1400px' }}>
      <AgentCard {...defaultProps} size="compact" />
      <AgentCard {...defaultProps} size="compact" runtime="cli" name="CLI Agent" />
      <AgentCard {...defaultProps} size="compact" runtime="mcp" name="MCP Agent" />
      <AgentCard {...defaultProps} size="compact" isRunning name="Running Agent" />
      <AgentCard {...defaultProps} size="compact" selected selectable name="Selected Agent" />
      <AgentCard {...defaultProps} size="compact" disabled name="Disabled Agent" />
    </div>
  ),
};

// Accessibility Showcase
export const AccessibilityShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">WCAG 2.1 AA Compliance</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Color Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              All text, icons, and interactive elements meet WCAG AA contrast requirements (4.5:1 for normal text,
              3:1 for large text and UI components). Runtime badges use distinct colors with sufficient contrast.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard {...defaultProps} size="standard" />
              <AgentCard {...defaultProps} runtime="mcp" name="MCP Agent" size="standard" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Non-Text Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              Runtime badges, status indicators, and button boundaries meet 3:1 contrast requirement.
              Icons provide redundant information beyond color alone.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard {...defaultProps} runtime="cloud_code" name="Cloud Agent" />
              <AgentCard {...defaultProps} runtime="cli" name="CLI Agent" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Touch Targets</h4>
            <p className="text-sm text-text-muted mb-3">
              All interactive elements (buttons, checkboxes, tags) meet the 44x44px minimum touch target size.
              Adequate spacing prevents accidental activation.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard
                {...defaultProps}
                selectable
                hasActiveSelection
                onRun={() => {}}
                onEdit={() => {}}
                onExport={() => {}}
              />
              <AgentCard
                {...defaultProps}
                name="Touch-Friendly Agent"
                onRun={() => {}}
                onEdit={() => {}}
                onExport={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Keyboard Navigation</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Focus Management</h4>
            <p className="text-sm text-text-muted mb-3">
              Try keyboard navigation: Tab to focus elements, Enter/Space to activate.
              Focus order follows logical layout (card → run → edit → export → menu).
            </p>
            <table className="w-full text-sm mb-3">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 font-medium">Key</th>
                  <th className="text-left p-2 font-medium">Action</th>
                  <th className="text-left p-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd></td>
                  <td className="p-2">Focus next element</td>
                  <td className="p-2">Natural reading order</td>
                </tr>
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Shift+Tab</kbd></td>
                  <td className="p-2">Focus previous element</td>
                  <td className="p-2">Reverse navigation</td>
                </tr>
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Enter/Space</kbd></td>
                  <td className="p-2">Activate focused element</td>
                  <td className="p-2">Run agent or click button</td>
                </tr>
                <tr>
                  <td className="p-2"><kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd></td>
                  <td className="p-2">Close menu/modal</td>
                  <td className="p-2">Returns focus to trigger</td>
                </tr>
              </tbody>
            </table>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard
                {...defaultProps}
                name="Keyboard Agent 1"
                onRun={() => {}}
                onEdit={() => {}}
                onExport={() => {}}
              />
              <AgentCard
                {...defaultProps}
                name="Keyboard Agent 2"
                onRun={() => {}}
                onEdit={() => {}}
                onExport={() => {}}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Focus Indicators</h4>
            <p className="text-sm text-text-muted mb-3">
              Visible focus rings with 2px width and high contrast. Focus states never obscured by content.
              Distinct focus styles for different element types.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard
                {...defaultProps}
                name="Focus Ring Example"
                onRun={() => {}}
                onEdit={() => {}}
              />
              <AgentCard
                {...defaultProps}
                name="Focus States Demo"
                onRun={() => {}}
                onEdit={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Screen Reader Support</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Semantic Structure</h4>
            <p className="text-sm text-text-muted mb-3">
              Proper heading hierarchy, semantic HTML, and ARIA labels. Card announced as
              "article" with agent name as heading. Actions clearly labeled with purpose.
            </p>
            <ul className="text-sm text-text-muted space-y-2 list-disc list-inside mb-3">
              <li>Card: "Code Review Agent, article"</li>
              <li>Runtime badge: "Cloud Code" or "MCP" or "CLI"</li>
              <li>Run button: "Run Code Review Agent"</li>
              <li>Edit button: "Edit Code Review Agent"</li>
              <li>Export button: "Export Code Review Agent"</li>
              <li>Menu button: "More options for Code Review Agent"</li>
              <li>Running status: "Agent is currently running"</li>
              <li>Selection checkbox: "Select Code Review Agent"</li>
            </ul>
            <AgentCard
              {...defaultProps}
              selectable
              onRun={() => {}}
              onEdit={() => {}}
              onExport={() => {}}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Status Announcements</h4>
            <p className="text-sm text-text-muted mb-3">
              Agent status changes (running, stopped, error) announced via aria-live regions.
              Updates communicated without interrupting user workflow.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard
                {...defaultProps}
                name="Running Agent"
                isRunning={true}
              />
              <AgentCard
                {...defaultProps}
                name="Error Agent"
                error={{ message: 'Failed to connect to API' }}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Metadata Announcements</h4>
            <p className="text-sm text-text-muted mb-3">
              Entry prompt, tools, variables, and metrics properly announced with context.
              Screen reader users get complete information about agent configuration.
            </p>
            <ul className="text-sm text-text-muted space-y-2 list-disc list-inside mb-3">
              <li>Entry prompt: "Code Review Prompt: Analyze pull request..."</li>
              <li>Tools: "2 tools: GitHub API, Code Parser"</li>
              <li>Variables: "3 variables: repo, pr_number, check_security"</li>
              <li>Metrics: "142 runs, 95% success rate, average 45 seconds"</li>
            </ul>
            <AgentCard {...defaultProps} size="xl" metrics={{ runs: 142, successRate: 0.95, avgDuration: 45 }} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">High Contrast Mode</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Windows High Contrast</h4>
            <p className="text-sm text-text-muted mb-3">
              Cards maintain visibility and structure in system high contrast modes.
              Borders, runtime badges, and status indicators properly rendered.
            </p>
            <div className="p-4 bg-gray-900 rounded">
              <div className="grid grid-cols-2 gap-4">
                <AgentCard {...defaultProps} name="Dark Background Agent" size="compact" />
                <AgentCard {...defaultProps} runtime="mcp" name="High Contrast Demo" size="compact" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Forced Colors Mode</h4>
            <p className="text-sm text-text-muted mb-3">
              Icons, borders, and runtime badges remain visible using forced-colors media query.
              Semantic HTML ensures content hierarchy preserved.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard {...defaultProps} runtime="cloud_code" />
              <AgentCard {...defaultProps} runtime="cli" name="Forced Colors Test" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Reduced Motion</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Motion Preferences</h4>
            <p className="text-sm text-text-muted mb-3">
              Respects prefers-reduced-motion. Hover effects use instant state changes instead of
              transitions. Running indicator uses static state instead of animation. No auto-playing motion.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard
                {...defaultProps}
                name="Reduced Motion Card"
                onRun={() => {}}
              />
              <AgentCard
                {...defaultProps}
                name="Running (No Animation)"
                isRunning={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Error Handling & Recovery</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Accessible Error Messages</h4>
            <p className="text-sm text-text-muted mb-3">
              Error messages are clear, actionable, and announced to screen readers.
              Retry buttons clearly labeled and keyboard accessible. Error context preserved.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <AgentCard
                {...defaultProps}
                name="Error State Agent"
                error={{ message: 'Failed to connect to GitHub API. Please check your credentials.' }}
              />
              <AgentCard
                {...defaultProps}
                name="Error with Retry"
                error={{
                  message: 'Network timeout while executing agent',
                  retry: () => {},
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-strong">Responsive Design & Overflow</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Size Adaptability</h4>
            <p className="text-sm text-text-muted mb-3">
              Cards adapt to different sizes without losing functionality. Compact cards hide
              non-essential information while maintaining accessibility.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Compact Size</p>
                <AgentCard {...defaultProps} size="compact" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Standard Size</p>
                <AgentCard {...defaultProps} size="standard" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">XL Size</p>
                <AgentCard {...defaultProps} size="xl" metrics={{ runs: 142, successRate: 0.95, avgDuration: 45 }} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-text-default">Content Overflow Handling</h4>
            <p className="text-sm text-text-muted mb-3">
              Long content properly truncated with tooltips. Many tools show +N indicator.
              Overflow handling maintains accessibility and doesn't hide critical information.
            </p>
            <AgentCard
              {...defaultProps}
              name="Very Long Agent Name That Should Truncate Properly"
              tools={[
                { id: 't1', name: 'Tool 1' },
                { id: 't2', name: 'Tool 2' },
                { id: 't3', name: 'Tool 3' },
                { id: 't4', name: 'Tool 4' },
                { id: 't5', name: 'Tool 5' },
                { id: 't6', name: 'Tool 6' },
              ]}
              tags={['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6']}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility showcase demonstrating WCAG 2.1 AA compliance, keyboard navigation, screen reader support, high contrast mode, reduced motion preferences, error handling, and responsive design. All interactive elements are fully accessible and meet or exceed accessibility standards. Agent status changes are properly announced to assistive technologies.',
      },
    },
  },
};
