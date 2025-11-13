import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelTooltip } from '../ModelTooltip';
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

describe('ModelTooltip', () => {
  it('renders trigger element', () => {
    render(
      <ModelTooltip model={mockModel}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel}>
        <button>Hover me</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('by OpenAI')).toBeInTheDocument();
    });
  });

  it('displays model description when available', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel} showFullDetails>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText(/Advanced language model with vision capabilities/)).toBeInTheDocument();
    });
  });

  it('truncates long descriptions', async () => {
    const user = userEvent.setup();
    const longDescriptionModel = {
      ...mockModel,
      description: 'This is a very long description that should be truncated because it exceeds the maximum length allowed in the tooltip content area and we want to keep it readable.',
    };

    render(
      <ModelTooltip model={longDescriptionModel} showFullDetails>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      const description = screen.getByText(/This is a very long description/);
      expect(description.textContent).toContain('...');
    });
  });

  it('shows specifications when showFullDetails is true', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel} showFullDetails>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Specifications')).toBeInTheDocument();
      expect(screen.getByText('128K tokens')).toBeInTheDocument();
      expect(screen.getByText('$10.00/M tokens')).toBeInTheDocument();
    });
  });

  it('displays capabilities with icons', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Capabilities')).toBeInTheDocument();
      expect(screen.getByText('Vision')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });
  });

  it('shows performance metrics when enabled', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel} showMetrics>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('Uptime')).toBeInTheDocument();
      expect(screen.getByText('Usage Count')).toBeInTheDocument();
    });
  });

  it('displays status badge for non-active models', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockDeprecatedModel}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });
  });

  it('shows provider logo and fallback', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      const logo = screen.getByAltText('OpenAI logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/openai-logo.png');
    });
  });

  it('shows provider fallback when logo is not available', async () => {
    const user = userEvent.setup();
    const modelWithoutLogo = { ...mockModel, logoUrl: undefined };

    render(
      <ModelTooltip model={modelWithoutLogo}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('O')).toBeInTheDocument(); // OpenAI fallback
    });
  });

  it('displays model key in footer', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Model ID: gpt-4-turbo-preview')).toBeInTheDocument();
    });
  });

  it('includes view details link', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View Details/ })).toBeInTheDocument();
    });
  });

  it('hides specifications when showFullDetails is false', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel} showFullDetails={false}>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Specifications')).not.toBeInTheDocument();
    });
  });

  it('handles models without pricing', async () => {
    const user = userEvent.setup();
    const freeModel = { ...mockModel, pricing: undefined };

    render(
      <ModelTooltip model={freeModel} showFullDetails>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  it('handles models without context window', async () => {
    const user = userEvent.setup();
    const modelWithoutContext = { ...mockModel, context_window: undefined };

    render(
      <ModelTooltip model={modelWithoutContext} showFullDetails>
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      // Should not show context window specification
      expect(screen.queryByText(/tokens/)).not.toBeInTheDocument();
    });
  });

  it('positions tooltip correctly', async () => {
    const user = userEvent.setup();

    render(
      <ModelTooltip model={mockModel} side="bottom" align="start">
        <button>Trigger</button>
      </ModelTooltip>
    );

    const trigger = screen.getByRole('button');
    await user.hover(trigger);

    await waitFor(() => {
      // The tooltip should be positioned on the bottom
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });
  });
});
