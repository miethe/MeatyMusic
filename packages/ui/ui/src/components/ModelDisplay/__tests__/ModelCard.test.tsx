import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelCard } from '../ModelCard';
import { EnhancedModel } from '../../ModelPicker/types';

// Mock model data
const mockModel: EnhancedModel = {
  id: 'gpt-4-turbo',
  provider: 'OpenAI',
  model_key: 'gpt-4-turbo-preview',
  display_name: 'GPT-4 Turbo',
  short_label: 'GPT-4 Turbo',
  family: 'gpt-4',
  modalities: ['text', 'vision'],
  context_window: 128000,
  max_output_tokens: 4096,
  supports_tools: true,
  supports_json_mode: true,
  status: 'active',
  pricing: {
    input_cost_per_token: 0.00001,
    output_cost_per_token: 0.00003,
    currency: 'USD',
  },
  capabilities: [
    { id: 'vision', name: 'Vision', description: 'Image understanding' },
    { id: 'tools', name: 'Tools', description: 'Function calling' },
  ],
  performance: {
    latency: 'medium',
    cost: 'high',
    quality: 'high',
  },
  tags: [],
  logoUrl: 'https://example.com/openai-logo.png',
  description: 'Advanced language model with vision capabilities and excellent performance for complex reasoning tasks.',
};

const mockDeprecatedModel: EnhancedModel = {
  ...mockModel,
  id: 'gpt-3',
  model_key: 'gpt-3-davinci',
  display_name: 'GPT-3 Davinci',
  short_label: 'GPT-3',
  status: 'deprecated',
  deprecation: {
    deprecated_at: '2024-01-01',
    end_of_life: '2024-12-31',
    replacement_model: 'gpt-4-turbo',
    reason: 'Superseded by GPT-4',
  },
};

const mockFreeModel: EnhancedModel = {
  ...mockModel,
  id: 'llama-2',
  provider: 'Meta',
  model_key: 'llama-2-70b',
  display_name: 'Llama 2 70B',
  short_label: 'Llama 2',
  pricing: undefined,
  logoUrl: undefined,
};

describe('ModelCard', () => {
  it('renders with basic model information', () => {
    render(<ModelCard model={mockModel} />);

    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('by OpenAI')).toBeInTheDocument();
    expect(screen.getByText(mockModel.description!)).toBeInTheDocument();
  });

  it('displays provider logo when available', () => {
    render(<ModelCard model={mockModel} />);

    const logo = screen.getByAltText('OpenAI logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/openai-logo.png');
  });

  it('shows provider fallback when logo is not available', () => {
    render(<ModelCard model={mockFreeModel} />);

    expect(screen.getByText('M')).toBeInTheDocument(); // Meta fallback
  });

  it('displays status badge for non-active models', () => {
    render(<ModelCard model={mockDeprecatedModel} />);

    expect(screen.getByText('Deprecated')).toBeInTheDocument();
  });

  it('shows pricing information', () => {
    render(<ModelCard model={mockModel} />);

    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('$10.00/M tokens')).toBeInTheDocument();
  });

  it('displays context window information', () => {
    render(<ModelCard model={mockModel} />);

    expect(screen.getByText('Context Window')).toBeInTheDocument();
    expect(screen.getByText('128K tokens')).toBeInTheDocument();
  });

  it('shows capabilities grid', () => {
    render(<ModelCard model={mockModel} />);

    expect(screen.getByText('Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Vision')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('displays performance indicators in detailed variant', () => {
    render(<ModelCard model={mockModel} variant="detailed" />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Latency')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
  });

  it('shows usage metrics when enabled', () => {
    render(<ModelCard model={mockModel} variant="detailed" showMetrics />);

    expect(screen.getByText('Usage & Performance')).toBeInTheDocument();
    expect(screen.getByText('Avg Response')).toBeInTheDocument();
    expect(screen.getByText('Total Uses')).toBeInTheDocument();
  });

  it('displays similar models when enabled', () => {
    render(<ModelCard model={mockModel} variant="detailed" showSuggestions />);

    expect(screen.getByText('Similar Models')).toBeInTheDocument();
    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('Claude-3 Sonnet')).toBeInTheDocument();
  });

  it('handles select action', async () => {
    const user = userEvent.setup();
    const onSelectMock = jest.fn();

    render(<ModelCard model={mockModel} onSelect={onSelectMock} />);

    const selectButton = screen.getByText('Select Model');
    await user.click(selectButton);

    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('handles favorite action', async () => {
    const user = userEvent.setup();
    const onFavoriteMock = jest.fn();

    render(<ModelCard model={mockModel} onFavorite={onFavoriteMock} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    await user.click(favoriteButton);

    expect(onFavoriteMock).toHaveBeenCalledTimes(1);
  });

  it('toggles favorite state visually', async () => {
    const user = userEvent.setup();

    render(<ModelCard model={mockModel} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    await user.click(favoriteButton);

    expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
  });

  it('handles compare action', async () => {
    const user = userEvent.setup();
    const onCompareMock = jest.fn();

    render(<ModelCard model={mockModel} onCompare={onCompareMock} />);

    const compareButton = screen.getByLabelText('Compare model');
    await user.click(compareButton);

    expect(onCompareMock).toHaveBeenCalledTimes(1);
  });

  it('truncates description in compact variant', () => {
    const longDescriptionModel = {
      ...mockModel,
      description: 'This is a very long description that should be truncated in compact mode to prevent the card from becoming too large and overwhelming.',
    };

    render(<ModelCard model={longDescriptionModel} variant="compact" />);

    const description = screen.getByText(/This is a very long description/);
    expect(description.textContent).toContain('...');
  });

  it('hides actions when showActions is false', () => {
    render(<ModelCard model={mockModel} showActions={false} />);

    expect(screen.queryByText('Select Model')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Add to favorites')).not.toBeInTheDocument();
  });

  it('does not show compare button when onCompare is not provided', () => {
    render(<ModelCard model={mockModel} />);

    expect(screen.queryByLabelText('Compare model')).not.toBeInTheDocument();
  });

  it('handles free model pricing display', () => {
    render(<ModelCard model={mockFreeModel} />);

    // Should show some pricing information even for free models
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<ModelCard model={mockModel} variant="compact" />);

    // Compact variant should not show performance section
    expect(screen.queryByText('Performance')).not.toBeInTheDocument();

    rerender(<ModelCard model={mockModel} variant="detailed" />);

    // Detailed variant should show performance section
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('shows price tier badge for premium models', () => {
    const premiumModel = {
      ...mockModel,
      pricing: {
        input_cost_per_token: 0.000015, // Higher cost
        output_cost_per_token: 0.000075,
        currency: 'USD',
      },
    };

    render(<ModelCard model={premiumModel} />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('displays all action buttons when handlers are provided', () => {
    render(
      <ModelCard
        model={mockModel}
        onSelect={() => {}}
        onFavorite={() => {}}
        onCompare={() => {}}
      />
    );

    expect(screen.getByText('Select Model')).toBeInTheDocument();
    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    expect(screen.getByLabelText('Compare model')).toBeInTheDocument();
    expect(screen.getByLabelText('View model details')).toBeInTheDocument();
  });

  it('handles models without capabilities', () => {
    const modelWithoutCapabilities = {
      ...mockModel,
      capabilities: [],
    };

    render(<ModelCard model={modelWithoutCapabilities} />);

    // Should not show capabilities section
    expect(screen.queryByText('Capabilities')).not.toBeInTheDocument();
  });

  it('handles models without description', () => {
    const modelWithoutDescription = {
      ...mockModel,
      description: undefined,
    };

    render(<ModelCard model={modelWithoutDescription} />);

    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('by OpenAI')).toBeInTheDocument();
    // Should not crash or show empty description
  });

  it('displays performance metrics with proper formatting', () => {
    render(<ModelCard model={mockModel} variant="detailed" showMetrics />);

    // Check that metrics are displayed with proper units
    expect(screen.getByText(/\d+ms/)).toBeInTheDocument(); // Response time
    expect(screen.getByText(/\d+\.\d+% uptime|\d+%/)).toBeInTheDocument(); // Uptime percentage
    expect(screen.getByText(/\d{1,3}(,\d{3})*/)).toBeInTheDocument(); // Usage count with commas
  });

  it('shows user rating in detailed view with metrics', () => {
    render(<ModelCard model={mockModel} variant="detailed" showMetrics />);

    expect(screen.getByText(/\d\.\d \/ 5\.0/)).toBeInTheDocument();
    expect(screen.getByText('user rating')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <ModelCard
        model={mockModel}
        onSelect={() => {}}
        onFavorite={() => {}}
      />
    );

    const selectButton = screen.getByText('Select Model');
    const favoriteButton = screen.getByLabelText('Add to favorites');

    expect(selectButton).toBeInTheDocument();
    expect(favoriteButton).toHaveAttribute('aria-label');
  });
});
