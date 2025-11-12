import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelDeprecationWarning } from '../ModelDeprecationWarning';
import { EnhancedModel } from '../../ModelPicker/types';

// Mock model data
const mockDeprecatedModel: EnhancedModel = {
  id: 'gpt-3',
  provider: 'OpenAI',
  model_key: 'gpt-3-davinci',
  display_name: 'GPT-3 Davinci',
  short_label: 'GPT-3',
  family: 'gpt-3',
  modalities: ['text'],
  context_window: 4096,
  max_output_tokens: 2048,
  supports_tools: false,
  supports_json_mode: false,
  status: 'deprecated',
  pricing: {
    input_cost_per_token: 0.00002,
    output_cost_per_token: 0.00002,
    currency: 'USD',
  },
  capabilities: [],
  performance: {
    latency: 'medium',
    cost: 'medium',
    quality: 'medium',
  },
  tags: [],
  deprecation: {
    deprecated_at: '2024-01-01',
    end_of_life: '2024-12-31',
    replacement_model: 'gpt-4-turbo',
    reason: 'Superseded by GPT-4 with better performance and capabilities',
  },
  description: 'Legacy language model',
};

const mockCriticalDeprecatedModel: EnhancedModel = {
  ...mockDeprecatedModel,
  deprecation: {
    deprecated_at: '2024-01-01',
    end_of_life: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    replacement_model: 'gpt-4-turbo',
    reason: 'End of life approaching',
  },
};

const mockActiveModel: EnhancedModel = {
  ...mockDeprecatedModel,
  status: 'active',
  deprecation: undefined,
};

describe('ModelDeprecationWarning', () => {
  it('does not render for active models without deprecation', () => {
    const { container } = render(
      <ModelDeprecationWarning model={mockActiveModel} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders inline variant with basic deprecation info', () => {
    render(
      <ModelDeprecationWarning model={mockDeprecatedModel} variant="inline" />
    );

    expect(screen.getByText('Deprecated')).toBeInTheDocument();
  });

  it('shows days left badge for models with end of life', () => {
    render(
      <ModelDeprecationWarning model={mockCriticalDeprecatedModel} variant="inline" />
    );

    expect(screen.getByText(/\d+d left/)).toBeInTheDocument();
  });

  it('renders banner variant with full information', () => {
    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="banner"
        showAlternatives={false}
      />
    );

    expect(screen.getByText('Deprecation Notice: GPT-3')).toBeInTheDocument();
    expect(screen.getByText(/This model has been deprecated/)).toBeInTheDocument();
  });

  it('renders modal variant with comprehensive details', () => {
    render(
      <ModelDeprecationWarning model={mockDeprecatedModel} variant="modal" />
    );

    expect(screen.getByText('Deprecation Notice')).toBeInTheDocument();
    expect(screen.getByText('GPT-3 by OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Recommended Alternatives')).toBeInTheDocument();
  });

  it('shows critical severity for models ending soon', () => {
    render(
      <ModelDeprecationWarning
        model={mockCriticalDeprecatedModel}
        variant="banner"
      />
    );

    expect(screen.getByText(/Model Ending Soon/)).toBeInTheDocument();
    expect(screen.getByText(/will be discontinued in \d+ days/)).toBeInTheDocument();
  });

  it('displays deprecation reason when available', () => {
    render(
      <ModelDeprecationWarning model={mockDeprecatedModel} variant="modal" />
    );

    expect(screen.getByText('Reason:')).toBeInTheDocument();
    expect(screen.getByText(/Superseded by GPT-4/)).toBeInTheDocument();
  });

  it('shows timeline information when enabled', () => {
    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showTimeline
      />
    );

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Deprecated:')).toBeInTheDocument();
    expect(screen.getByText('End of Life:')).toBeInTheDocument();
  });

  it('displays alternative models when enabled', () => {
    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showAlternatives
      />
    );

    expect(screen.getByText('Recommended Alternatives')).toBeInTheDocument();
    expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
    expect(screen.getByText('Claude-3 Sonnet')).toBeInTheDocument();
    expect(screen.getByText('Gemini Pro')).toBeInTheDocument();
  });

  it('handles dismiss action', async () => {
    const user = userEvent.setup();
    const onDismissMock = jest.fn();

    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="banner"
        onDismiss={onDismissMock}
      />
    );

    const dismissButton = screen.getByLabelText('Dismiss warning');
    await user.click(dismissButton);

    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });

  it('handles migration action', async () => {
    const user = userEvent.setup();
    const onMigrateMock = jest.fn();

    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="banner"
        onMigrate={onMigrateMock}
      />
    );

    const migrateButton = screen.getByText(/Migrate to gpt-4-turbo/);
    await user.click(migrateButton);

    expect(onMigrateMock).toHaveBeenCalledWith('gpt-4-turbo');
  });

  it('handles alternative model selection', async () => {
    const user = userEvent.setup();
    const onMigrateMock = jest.fn();

    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showAlternatives
        onMigrate={onMigrateMock}
      />
    );

    const selectButtons = screen.getAllByText('Select');
    await user.click(selectButtons[0]); // Select first alternative

    expect(onMigrateMock).toHaveBeenCalledWith('gpt-4-turbo');
  });

  it('shows migration guide link', () => {
    render(
      <ModelDeprecationWarning model={mockDeprecatedModel} variant="modal" />
    );

    expect(screen.getByText('View Migration Guide')).toBeInTheDocument();
  });

  it('applies correct severity styling', () => {
    const { rerender } = render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="banner"
        severity="notice"
      />
    );

    let banner = screen.getByRole('alert');
    expect(banner).toHaveClass('border-warning/20');

    rerender(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="banner"
        severity="critical"
      />
    );

    banner = screen.getByRole('alert');
    expect(banner).toHaveClass('border-danger/40');
  });

  it('automatically determines severity based on end of life date', () => {
    render(
      <ModelDeprecationWarning model={mockCriticalDeprecatedModel} variant="banner" />
    );

    // Should show critical message for models ending soon
    expect(screen.getByText(/Model Ending Soon/)).toBeInTheDocument();
  });

  it('handles models without end of life date', () => {
    const modelWithoutEOL = {
      ...mockDeprecatedModel,
      deprecation: {
        ...mockDeprecatedModel.deprecation!,
        end_of_life: undefined,
      },
    };

    render(
      <ModelDeprecationWarning model={modelWithoutEOL} variant="modal" showTimeline />
    );

    expect(screen.getByText('Deprecated:')).toBeInTheDocument();
    expect(screen.queryByText('End of Life:')).not.toBeInTheDocument();
  });

  it('shows similarity scores for alternatives', () => {
    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showAlternatives
      />
    );

    expect(screen.getByText('95% similar')).toBeInTheDocument();
    expect(screen.getByText('90% similar')).toBeInTheDocument();
    expect(screen.getByText('85% similar')).toBeInTheDocument();
  });

  it('displays context window for alternatives', () => {
    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showAlternatives
      />
    );

    expect(screen.getByText('128K tokens')).toBeInTheDocument();
    expect(screen.getByText('200K tokens')).toBeInTheDocument();
    expect(screen.getByText('1.0M tokens')).toBeInTheDocument();
  });

  it('hides alternatives when showAlternatives is false', () => {
    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showAlternatives={false}
      />
    );

    expect(screen.queryByText('Recommended Alternatives')).not.toBeInTheDocument();
  });

  it('hides timeline when showTimeline is false', () => {
    render(
      <ModelDeprecationWarning
        model={mockDeprecatedModel}
        variant="modal"
        showTimeline={false}
      />
    );

    expect(screen.queryByText('Timeline')).not.toBeInTheDocument();
  });
});
