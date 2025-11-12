import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import * as React from 'react';
import { ModelPicker } from './ModelPicker';
import { EnhancedModel } from './types';

// Mock data
const mockModels: EnhancedModel[] = [
  {
    id: 'gpt-4-turbo',
    provider: 'OpenAI',
    model_key: 'gpt-4-turbo-preview',
    display_name: 'GPT-4 Turbo',
    short_label: 'GPT-4 Turbo',
    family: 'gpt-4',
    modalities: ['text'],
    context_window: 128000,
    max_output_tokens: 4096,
    supports_tools: true,
    supports_json_mode: true,
    status: 'active',
    pricing: {
      input_cost_per_token: 0.01,
      output_cost_per_token: 0.03,
      currency: 'USD',
    },
    capabilities: [
      { id: 'tools', name: 'Function Calling', description: 'Supports function calling' },
      { id: 'json', name: 'JSON Mode', description: 'Supports JSON output mode' },
      { id: 'reasoning', name: 'Advanced Reasoning', description: 'Strong reasoning capabilities' },
    ],
    performance: {
      latency: 'medium',
      cost: 'high',
      quality: 'high',
    },
    tags: [
      { id: 'favorite', name: 'Favorite', color: '#ff6b6b', user_id: 'user1', created_at: '2024-01-01' },
    ],
    logoUrl: 'https://openai.com/favicon.ico',
    description: 'Most capable OpenAI model for complex tasks',
  },
  {
    id: 'claude-3-sonnet',
    provider: 'Anthropic',
    model_key: 'claude-3-sonnet-20240229',
    display_name: 'Claude 3 Sonnet',
    family: 'claude-3',
    modalities: ['text', 'vision'],
    context_window: 200000,
    max_output_tokens: 4096,
    supports_tools: true,
    supports_json_mode: false,
    status: 'active',
    pricing: {
      input_cost_per_token: 0.003,
      output_cost_per_token: 0.015,
      currency: 'USD',
    },
    capabilities: [
      { id: 'tools', name: 'Function Calling', description: 'Supports function calling' },
      { id: 'vision', name: 'Vision', description: 'Can analyze images' },
      { id: 'reasoning', name: 'Advanced Reasoning', description: 'Strong reasoning capabilities' },
    ],
    performance: {
      latency: 'low',
      cost: 'medium',
      quality: 'high',
    },
    tags: [],
    logoUrl: 'https://anthropic.com/favicon.ico',
    description: 'Balanced model for most use cases',
  },
  {
    id: 'gpt-3.5-turbo',
    provider: 'OpenAI',
    model_key: 'gpt-3.5-turbo',
    display_name: 'GPT-3.5 Turbo',
    family: 'gpt-3.5',
    modalities: ['text'],
    context_window: 16385,
    max_output_tokens: 4096,
    supports_tools: true,
    supports_json_mode: true,
    status: 'active',
    pricing: {
      input_cost_per_token: 0.0005,
      output_cost_per_token: 0.0015,
      currency: 'USD',
    },
    capabilities: [
      { id: 'tools', name: 'Function Calling', description: 'Supports function calling' },
      { id: 'json', name: 'JSON Mode', description: 'Supports JSON output mode' },
    ],
    performance: {
      latency: 'low',
      cost: 'low',
      quality: 'medium',
    },
    tags: [
      { id: 'recent', name: 'Recently Used', color: '#4ecdc4', user_id: 'user1', created_at: '2024-01-15' },
    ],
    logoUrl: 'https://openai.com/favicon.ico',
    description: 'Fast and cost-effective for simple tasks',
  },
  {
    id: 'claude-3-opus',
    provider: 'Anthropic',
    model_key: 'claude-3-opus-20240229',
    display_name: 'Claude 3 Opus',
    family: 'claude-3',
    modalities: ['text', 'vision'],
    context_window: 200000,
    max_output_tokens: 4096,
    supports_tools: true,
    supports_json_mode: false,
    status: 'active',
    pricing: {
      input_cost_per_token: 0.015,
      output_cost_per_token: 0.075,
      currency: 'USD',
    },
    capabilities: [
      { id: 'tools', name: 'Function Calling', description: 'Supports function calling' },
      { id: 'vision', name: 'Vision', description: 'Can analyze images' },
      { id: 'reasoning', name: 'Advanced Reasoning', description: 'Strong reasoning capabilities' },
      { id: 'creative', name: 'Creative Writing', description: 'Excellent for creative tasks' },
    ],
    performance: {
      latency: 'medium',
      cost: 'high',
      quality: 'high',
    },
    tags: [
      { id: 'favorite', name: 'Favorite', color: '#ff6b6b', user_id: 'user1', created_at: '2024-01-01' },
      { id: 'premium', name: 'Premium', color: '#ffd93d', user_id: 'user1', created_at: '2024-01-10' },
    ],
    logoUrl: 'https://anthropic.com/favicon.ico',
    description: 'Most capable Anthropic model for complex reasoning',
  },
  {
    id: 'gemini-pro',
    provider: 'Google',
    model_key: 'gemini-pro',
    display_name: 'Gemini Pro',
    family: 'gemini',
    modalities: ['text', 'vision'],
    context_window: 32768,
    max_output_tokens: 8192,
    supports_tools: true,
    supports_json_mode: true,
    status: 'beta',
    pricing: {
      input_cost_per_token: 0.00025,
      output_cost_per_token: 0.0005,
      currency: 'USD',
    },
    capabilities: [
      { id: 'tools', name: 'Function Calling', description: 'Supports function calling' },
      { id: 'json', name: 'JSON Mode', description: 'Supports JSON output mode' },
      { id: 'vision', name: 'Vision', description: 'Can analyze images' },
      { id: 'code', name: 'Code Generation', description: 'Excellent for coding tasks' },
    ],
    performance: {
      latency: 'low',
      cost: 'low',
      quality: 'medium',
    },
    tags: [],
    logoUrl: 'https://www.google.com/favicon.ico',
    description: 'Google\'s multimodal AI model',
  },
  {
    id: 'gpt-4-deprecated',
    provider: 'OpenAI',
    model_key: 'gpt-4-0314',
    display_name: 'GPT-4 (Legacy)',
    family: 'gpt-4',
    modalities: ['text'],
    context_window: 8192,
    max_output_tokens: 4096,
    supports_tools: false,
    supports_json_mode: false,
    status: 'deprecated',
    pricing: {
      input_cost_per_token: 0.03,
      output_cost_per_token: 0.06,
      currency: 'USD',
    },
    capabilities: [
      { id: 'reasoning', name: 'Advanced Reasoning', description: 'Strong reasoning capabilities' },
    ],
    performance: {
      latency: 'high',
      cost: 'high',
      quality: 'high',
    },
    deprecation: {
      deprecated_at: '2024-01-01',
      end_of_life: '2024-06-01',
      replacement_model: 'gpt-4-turbo',
      reason: 'Replaced by more efficient version',
    },
    tags: [],
    logoUrl: 'https://openai.com/favicon.ico',
    description: 'Legacy GPT-4 model, use GPT-4 Turbo instead',
  },
];

const meta: Meta<typeof ModelPicker> = {
  title: 'Components/ModelPicker',
  component: ModelPicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Advanced model selection component with filtering, search, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Selected model ID(s)',
    },
    multiple: {
      control: 'boolean',
      description: 'Allow multiple model selection',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the trigger',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the picker is disabled',
    },
    searchable: {
      control: 'boolean',
      description: 'Whether to show search functionality',
    },
    filterable: {
      control: 'boolean',
      description: 'Whether to show filter functionality',
    },
    virtualized: {
      control: 'boolean',
      description: 'Whether to use virtualization for large lists',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModelPicker>;

// Basic usage
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
        />
      </div>
    );
  },
};

// Multiple selection
export const Multiple: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>([]);
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          multiple
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string[]);
            action('onValueChange')(newValue);
          }}
          placeholder="Select models..."
        />
      </div>
    );
  },
};

// Pre-selected models
export const WithSelection: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>(['gpt-4-turbo', 'claude-3-sonnet']);
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          multiple
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string[]);
            action('onValueChange')(newValue);
          }}
          placeholder="Select models..."
        />
      </div>
    );
  },
};

// Loading state
export const Loading: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={[]}
          loading
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
        />
      </div>
    );
  },
};

// Error state
export const WithError: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={[]}
          error="Failed to load models. Please check your connection."
          onRetry={() => action('retry')()}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
        />
      </div>
    );
  },
};

// Disabled state
export const Disabled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('gpt-4-turbo');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          disabled
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
        />
      </div>
    );
  },
};

// Without search
export const NoSearch: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          searchable={false}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
        />
      </div>
    );
  },
};

// Without filters
export const NoFilters: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          filterable={false}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
        />
      </div>
    );
  },
};

// Provider filtered
export const ProviderFiltered: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          providers={['OpenAI', 'Anthropic']}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
          placeholder="Select OpenAI or Anthropic model..."
        />
      </div>
    );
  },
};

// Capability filtered
export const CapabilityFiltered: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={mockModels}
          capabilities={['vision']}
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
          placeholder="Select vision-capable model..."
        />
      </div>
    );
  },
};

// Large dataset (virtualized)
export const Virtualized: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');

    // Generate many models for virtualization demo
    const largeModelList = Array.from({ length: 100 }, (_, i) => ({
      ...mockModels[i % mockModels.length],
      id: `${mockModels[i % mockModels.length].id}-${i}`,
      display_name: `${mockModels[i % mockModels.length].display_name} ${i + 1}`,
    }));

    return (
      <div className="w-[400px]">
        <ModelPicker
          {...args}
          models={largeModelList}
          virtualized
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue as string);
            action('onValueChange')(newValue);
          }}
          placeholder="Select from 100+ models..."
        />
      </div>
    );
  },
};
