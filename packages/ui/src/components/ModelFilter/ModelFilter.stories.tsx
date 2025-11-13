import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { useState } from 'react';
import { ModelFilter, type ModelFilterProps, type ModelGroup } from './ModelFilter';

const meta: Meta<typeof ModelFilter> = {
  title: 'Components/ModelFilter',
  component: ModelFilter,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ModelFilter is a multi-select component for filtering models grouped by provider.
It supports loading, error, and empty states with full accessibility support.

**Key Features:**
- Groups models by provider (OpenAI, Anthropic, etc.)
- Multi-select with visual selection indicators
- Model count badges showing number of prompts per model
- Provider-level group selection
- Loading, error, and empty states
- Keyboard navigation and screen reader support
- Collapsible provider groups
        `,
      },
    },
  },
  argTypes: {
    selectedModels: {
      control: { type: 'object' },
      description: 'Array of currently selected model IDs',
    },
    onSelectionChange: {
      action: 'selection-changed',
      description: 'Callback when model selection changes',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading skeleton state',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables all interactions',
    },
    maxHeight: {
      control: 'text',
      description: 'Maximum height of the scrollable area',
    },
    showClearAll: {
      control: 'boolean',
      description: 'Shows clear all button when models are selected',
    },
  },
} satisfies Meta<typeof ModelFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample model data
const sampleModelGroups: ModelGroup[] = [
  {
    provider: 'OpenAI',
    models: [
      {
        id: 'gpt-4',
        name: 'gpt-4',
        displayName: 'GPT-4',
        provider: 'OpenAI',
        promptCount: 156,
      },
      {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        provider: 'OpenAI',
        promptCount: 89,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        promptCount: 234,
      },
    ],
    totalCount: 3,
  },
  {
    provider: 'Anthropic',
    models: [
      {
        id: 'claude-3-opus',
        name: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        provider: 'Anthropic',
        promptCount: 78,
      },
      {
        id: 'claude-3-sonnet',
        name: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        promptCount: 112,
      },
      {
        id: 'claude-3-haiku',
        name: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        provider: 'Anthropic',
        promptCount: 45,
      },
    ],
    totalCount: 3,
  },
  {
    provider: 'Google',
    models: [
      {
        id: 'gemini-pro',
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        provider: 'Google',
        promptCount: 67,
      },
      {
        id: 'gemini-pro-vision',
        name: 'gemini-pro-vision',
        displayName: 'Gemini Pro Vision',
        provider: 'Google',
        promptCount: 23,
      },
    ],
    totalCount: 2,
  },
];

// Interactive wrapper component
const ModelFilterWrapper = (args: Partial<ModelFilterProps>) => {
  const [selectedModels, setSelectedModels] = useState<string[]>(args.selectedModels || []);

  const handleSelectionChange = (newSelection: string[]) => {
    setSelectedModels(newSelection);
    action('selection-changed')(newSelection);
  };

  const handleClearAll = () => {
    setSelectedModels([]);
    action('clear-all')();
  };

  return (
    <div className="max-w-sm">
      <ModelFilter
        {...args}
        modelGroups={args.modelGroups || []}
        selectedModels={selectedModels}
        onSelectionChange={handleSelectionChange}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: sampleModelGroups,
    selectedModels: ['gpt-4', 'claude-3-opus'],
    loading: false,
    error: undefined,
    disabled: false,
    showClearAll: true,
    maxHeight: '400px',
  },
};

export const Loading: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: [],
    selectedModels: [],
    loading: true,
  },
};

export const Error: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: [],
    selectedModels: [],
    loading: false,
    error: 'Failed to fetch models from the API. Please check your connection.',
    onRetry: action('retry-clicked'),
  },
};

export const Empty: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: [],
    selectedModels: [],
    loading: false,
    error: undefined,
  },
};

export const Disabled: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: sampleModelGroups,
    selectedModels: ['gpt-4'],
    disabled: true,
  },
};

export const ManyModels: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: [
      {
        provider: 'OpenAI',
        models: [
          { id: 'gpt-4', name: 'gpt-4', provider: 'OpenAI', promptCount: 156 },
          { id: 'gpt-4-turbo', name: 'gpt-4-turbo', provider: 'OpenAI', promptCount: 89 },
          { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', provider: 'OpenAI', promptCount: 234 },
          { id: 'gpt-3.5-turbo-16k', name: 'gpt-3.5-turbo-16k', provider: 'OpenAI', promptCount: 67 },
        ],
        totalCount: 4,
      },
      {
        provider: 'Anthropic',
        models: [
          { id: 'claude-3-opus', name: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', provider: 'Anthropic', promptCount: 78 },
          { id: 'claude-3-sonnet', name: 'claude-3-sonnet-20240229', displayName: 'Claude 3 Sonnet', provider: 'Anthropic', promptCount: 112 },
          { id: 'claude-3-haiku', name: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku', provider: 'Anthropic', promptCount: 45 },
          { id: 'claude-2.1', name: 'claude-2.1', displayName: 'Claude 2.1', provider: 'Anthropic', promptCount: 89 },
          { id: 'claude-instant', name: 'claude-instant-1.2', displayName: 'Claude Instant', provider: 'Anthropic', promptCount: 134 },
        ],
        totalCount: 5,
      },
      {
        provider: 'Google',
        models: [
          { id: 'gemini-pro', name: 'gemini-pro', provider: 'Google', promptCount: 67 },
          { id: 'gemini-pro-vision', name: 'gemini-pro-vision', provider: 'Google', promptCount: 23 },
          { id: 'palm-2', name: 'text-bison-001', displayName: 'PaLM 2', provider: 'Google', promptCount: 45 },
        ],
        totalCount: 3,
      },
      {
        provider: 'Meta',
        models: [
          { id: 'llama-2-70b', name: 'llama-2-70b-chat', displayName: 'Llama 2 70B', provider: 'Meta', promptCount: 34 },
          { id: 'llama-2-13b', name: 'llama-2-13b-chat', displayName: 'Llama 2 13B', provider: 'Meta', promptCount: 19 },
          { id: 'llama-2-7b', name: 'llama-2-7b-chat', displayName: 'Llama 2 7B', provider: 'Meta', promptCount: 12 },
        ],
        totalCount: 3,
      },
    ],
    selectedModels: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
    maxHeight: '300px',
  },
};

export const WithZeroCounts: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: [
      {
        provider: 'OpenAI',
        models: [
          { id: 'gpt-4', name: 'gpt-4', provider: 'OpenAI', promptCount: 156 },
          { id: 'gpt-4-vision', name: 'gpt-4-vision-preview', displayName: 'GPT-4 Vision (Preview)', provider: 'OpenAI', promptCount: 0 },
          { id: 'dall-e-3', name: 'dall-e-3', displayName: 'DALL-E 3', provider: 'OpenAI', promptCount: 0 },
        ],
        totalCount: 3,
      },
    ],
    selectedModels: [],
  },
};

export const SingleProvider: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: [sampleModelGroups[0]], // Only OpenAI
    selectedModels: ['gpt-4'],
  },
};

export const AllSelected: Story = {
  render: (args) => <ModelFilterWrapper {...args} />,
  args: {
    modelGroups: sampleModelGroups,
    selectedModels: sampleModelGroups.flatMap(group => group.models.map(model => model.id)),
  },
};

// Accessibility story
export const AccessibilityDemo: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p><strong>Keyboard Navigation:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Tab through model groups and items</li>
          <li>Space/Enter to toggle selections</li>
          <li>Arrow keys within groups (future enhancement)</li>
        </ul>
        <p className="mt-3"><strong>Screen Reader Support:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Proper ARIA labels and roles</li>
          <li>Selection state announcements</li>
          <li>Group structure announced</li>
        </ul>
      </div>
      <ModelFilterWrapper {...args} />
    </div>
  ),
  args: {
    modelGroups: sampleModelGroups.slice(0, 2), // Smaller set for demo
    selectedModels: ['gpt-4'],
  },
};
