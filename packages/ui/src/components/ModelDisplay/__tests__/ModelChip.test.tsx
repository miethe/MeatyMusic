import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelChip } from '../ModelChip';
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
  description: 'Advanced language model with vision capabilities',
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

describe('ModelChip', () => {
  it('renders with basic props', () => {
    render(<ModelChip model={mockModel} />);

    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('O')).toBeInTheDocument(); // Provider fallback
  });

  it('displays provider logo when available', () => {
    render(<ModelChip model={mockModel} showProvider />);

    const logo = screen.getByAltText('OpenAI logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/openai-logo.png');
  });

  it('shows status badge for deprecated models', () => {
    render(<ModelChip model={mockDeprecatedModel} showStatus />);

    expect(screen.getByText('Deprecated')).toBeInTheDocument();
  });

  it('shows status badge for beta models', () => {
    const betaModel = { ...mockModel, status: 'beta' as const };
    render(<ModelChip model={betaModel} showStatus />);

    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('displays capabilities when enabled', () => {
    render(<ModelChip model={mockModel} showCapabilities />);

    // Should show capability icons
    const visionIcon = screen.getByLabelText('Vision');
    const toolsIcon = screen.getByLabelText('Tools');

    expect(visionIcon).toBeInTheDocument();
    expect(toolsIcon).toBeInTheDocument();
  });

  it('shows pricing tier when enabled', () => {
    render(<ModelChip model={mockModel} showPricing />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('handles click events when interactive', async () => {
    const user = userEvent.setup();
    const onClickMock = jest.fn();

    render(<ModelChip model={mockModel} interactive onClick={onClickMock} />);

    const chip = screen.getByRole('button');
    await user.click(chip);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation when interactive', async () => {
    const user = userEvent.setup();
    const onClickMock = jest.fn();

    render(<ModelChip model={mockModel} interactive onClick={onClickMock} />);

    const chip = screen.getByRole('button');
    await user.type(chip, '{enter}');

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('shows remove button when onRemove is provided', () => {
    const onRemoveMock = jest.fn();

    render(<ModelChip model={mockModel} onRemove={onRemoveMock} />);

    const removeButton = screen.getByLabelText('Remove GPT-4 Turbo');
    expect(removeButton).toBeInTheDocument();
  });

  it('handles remove action', async () => {
    const user = userEvent.setup();
    const onRemoveMock = jest.fn();

    render(<ModelChip model={mockModel} onRemove={onRemoveMock} />);

    const removeButton = screen.getByLabelText('Remove GPT-4 Turbo');
    await user.click(removeButton);

    expect(onRemoveMock).toHaveBeenCalledTimes(1);
  });

  it('prevents click propagation on remove button', async () => {
    const user = userEvent.setup();
    const onClickMock = jest.fn();
    const onRemoveMock = jest.fn();

    render(
      <ModelChip
        model={mockModel}
        interactive
        onClick={onClickMock}
        onRemove={onRemoveMock}
      />
    );

    const removeButton = screen.getByLabelText('Remove GPT-4 Turbo');
    await user.click(removeButton);

    expect(onRemoveMock).toHaveBeenCalledTimes(1);
    expect(onClickMock).not.toHaveBeenCalled();
  });

  it('truncates long model names', () => {
    const longNameModel = {
      ...mockModel,
      display_name: 'Very Long Model Name That Should Be Truncated',
      short_label: undefined,
    };

    render(<ModelChip model={longNameModel} variant="compact" />);

    const text = screen.getByText(/Very Long Model Name/);
    expect(text.textContent).toContain('...');
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<ModelChip model={mockModel} size="sm" />);
    expect(document.querySelector('.text-xs')).toBeInTheDocument();

    rerender(<ModelChip model={mockModel} size="lg" />);
    expect(document.querySelector('.text-base')).toBeInTheDocument();
  });

  it('shows limited capabilities in compact variant', () => {
    const manyCapabilitiesModel = {
      ...mockModel,
      capabilities: [
        { id: 'vision', name: 'Vision' },
        { id: 'tools', name: 'Tools' },
        { id: 'json_mode', name: 'JSON Mode' },
        { id: 'streaming', name: 'Streaming' },
        { id: 'code', name: 'Code' },
      ],
    };

    render(<ModelChip model={manyCapabilitiesModel} variant="compact" showCapabilities />);

    // Should show +N indicator for additional capabilities
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('provides proper accessibility attributes', () => {
    render(<ModelChip model={mockModel} interactive />);

    const chip = screen.getByRole('button');
    expect(chip).toHaveAttribute('aria-label', 'Select GPT-4 Turbo');
    expect(chip).toHaveAttribute('aria-description');
    expect(chip).toHaveAttribute('tabIndex', '0');
  });

  it('handles keyboard remove action', async () => {
    const user = userEvent.setup();
    const onRemoveMock = jest.fn();

    render(<ModelChip model={mockModel} interactive onRemove={onRemoveMock} />);

    const chip = screen.getByRole('button');
    chip.focus();
    await user.keyboard('{Delete}');

    expect(onRemoveMock).toHaveBeenCalledTimes(1);
  });

  it('does not show provider when showProvider is false', () => {
    render(<ModelChip model={mockModel} showProvider={false} />);

    expect(screen.queryByAltText('OpenAI logo')).not.toBeInTheDocument();
    expect(screen.queryByText('O')).not.toBeInTheDocument();
  });

  it('handles model without pricing', () => {
    const freeModel = { ...mockModel, pricing: undefined };

    render(<ModelChip model={freeModel} showPricing />);

    // Should not show any pricing badge for free models
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    expect(screen.queryByText('Standard')).not.toBeInTheDocument();
  });
});
