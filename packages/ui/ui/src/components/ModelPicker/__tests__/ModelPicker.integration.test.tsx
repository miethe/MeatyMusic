import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ModelPicker } from '../ModelPicker';
import { EnhancedModel } from '../types';

expect.extend(toHaveNoViolations);

// Mock enhanced models for testing
const mockModels: EnhancedModel[] = [
  {
    id: '1',
    provider: 'OpenAI',
    name: 'gpt-4-turbo',
    display_name: 'GPT-4 Turbo',
    short_label: 'GPT-4 Turbo',
    model_key: 'gpt-4-turbo',
    section: 'Official',
    status: 'active',
    supports_tools: true,
    supports_json_mode: true,
    capabilities: [
      { type: 'text', level: 'expert', supported: true },
      { type: 'function-calling', level: 'advanced', supported: true },
    ],
    performance: {
      latency: 'medium',
      cost: 'high',
      contextLength: 128000,
      quality: 'excellent',
    },
    tags: [],
    pricing: {
      tier: 'paid',
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
    },
  },
  {
    id: '2',
    provider: 'Anthropic',
    name: 'claude-3-sonnet',
    display_name: 'Claude 3 Sonnet',
    short_label: 'Claude 3 Sonnet',
    model_key: 'claude-3-sonnet',
    section: 'Official',
    status: 'active',
    supports_tools: true,
    supports_json_mode: false,
    capabilities: [
      { type: 'text', level: 'expert', supported: true },
      { type: 'image', level: 'advanced', supported: true },
    ],
    performance: {
      latency: 'low',
      cost: 'medium',
      contextLength: 200000,
      quality: 'excellent',
    },
    tags: [],
    pricing: {
      tier: 'paid',
      inputCostPer1k: 0.003,
      outputCostPer1k: 0.015,
    },
  },
  {
    id: '3',
    provider: 'OpenAI',
    name: 'gpt-3.5-turbo',
    display_name: 'GPT-3.5 Turbo',
    short_label: 'GPT-3.5 Turbo',
    model_key: 'gpt-3.5-turbo',
    section: 'Official',
    status: 'deprecated',
    supports_tools: true,
    supports_json_mode: true,
    capabilities: [
      { type: 'text', level: 'good', supported: true },
      { type: 'function-calling', level: 'basic', supported: true },
    ],
    performance: {
      latency: 'low',
      cost: 'low',
      contextLength: 16000,
      quality: 'good',
    },
    tags: [],
    pricing: {
      tier: 'paid',
      inputCostPer1k: 0.0005,
      outputCostPer1k: 0.0015,
    },
    deprecation: {
      isDeprecated: true,
      severity: 'warning',
      warningMessage: 'GPT-3.5 Turbo will be deprecated in June 2024',
      replacementModel: 'gpt-4-turbo',
    },
  },
];

describe('ModelPicker Integration Tests', () => {
  const defaultProps = {
    models: mockModels,
    loading: false,
    onValueChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders without crashing', () => {
      render(<ModelPicker {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('displays placeholder text when no value is selected', () => {
      render(<ModelPicker {...defaultProps} placeholder=\"Select a model...\" />);
      expect(screen.getByText('Select a model...')).toBeInTheDocument();
    });

    it('opens dropdown when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('displays all models in the dropdown', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
        expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument();
        expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument();
      });
    });

    it('selects a model when clicked', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      render(<ModelPicker {...defaultProps} onValueChange={onValueChange} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const gpt4Option = screen.getByText('GPT-4 Turbo');
      await user.click(gpt4Option);

      expect(onValueChange).toHaveBeenCalledWith('1');
    });
  });

  describe('Search Functionality', () => {
    it('filters models based on search input', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} searchable />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search models...');
      await user.type(searchInput, 'Claude');

      await waitFor(() => {
        expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument();
        expect(screen.queryByText('GPT-4 Turbo')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} searchable />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search models...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No models found matching your search.')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('filters models by provider', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} filterable />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Find and click OpenAI filter
      const openaiFilter = screen.getByLabelText('OpenAI');
      await user.click(openaiFilter);

      await waitFor(() => {
        expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
        expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument();
        expect(screen.queryByText('Claude 3 Sonnet')).not.toBeInTheDocument();
      });
    });

    it('filters models by capabilities', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} filterable />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Find and click Vision capability filter
      const visionFilter = screen.getByLabelText('Vision');
      await user.click(visionFilter);

      await waitFor(() => {
        expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument();
        expect(screen.queryByText('GPT-4 Turbo')).not.toBeInTheDocument();
      });
    });

    it('shows clear filters button when filters are applied', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} filterable />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const openaiFilter = screen.getByLabelText('OpenAI');
      await user.click(openaiFilter);

      await waitFor(() => {
        expect(screen.getByText('Clear all filters')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Selection', () => {
    it('allows multiple model selection', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      render(<ModelPicker {...defaultProps} multiple onValueChange={onValueChange} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const gpt4Option = screen.getByText('GPT-4 Turbo');
      await user.click(gpt4Option);

      const claudeOption = screen.getByText('Claude 3 Sonnet');
      await user.click(claudeOption);

      expect(onValueChange).toHaveBeenCalledWith(['1', '2']);
    });

    it('shows selected model count in trigger', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} multiple value={['1', '2']} />);

      expect(screen.getByText('2 models selected')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state', () => {
      render(<ModelPicker {...defaultProps} loading />);
      expect(screen.getByText('Loading models...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(<ModelPicker {...defaultProps} error=\"Failed to load models\" />);
      expect(screen.getByText('Failed to load models')).toBeInTheDocument();
    });

    it('shows retry button in error state', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      render(<ModelPicker {...defaultProps} error=\"Failed to load models\" onRetry={onRetry} />);

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Check that second option is highlighted
      const options = screen.getAllByRole('option');
      expect(options[1]).toHaveAttribute('data-highlighted', 'true');
    });

    it('selects option with Enter key', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      render(<ModelPicker {...defaultProps} onValueChange={onValueChange} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onValueChange).toHaveBeenCalledWith('1');
    });

    it('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ModelPicker {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<ModelPicker {...defaultProps} />);
      const trigger = screen.getByRole('combobox');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates ARIA attributes when opened', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has proper screen reader announcements', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('3 models available')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('handles large number of models efficiently', async () => {
      const largeModelSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockModels[0],
        id: `model-${i}`,
        display_name: `Model ${i}`,
      }));

      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} models={largeModelSet} virtualized />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Should still render quickly with virtualization
      expect(screen.getByText('Model 0')).toBeInTheDocument();
    });

    it('debounces search input', async () => {
      const user = userEvent.setup();
      render(<ModelPicker {...defaultProps} searchable />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search models...');

      // Type quickly
      await user.type(searchInput, 'GPT', { delay: 50 });

      // Should not filter immediately
      expect(screen.getByText('Claude 3 Sonnet')).toBeInTheDocument();

      // Wait for debounce
      await waitFor(() => {
        expect(screen.queryByText('Claude 3 Sonnet')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });
  });
});
