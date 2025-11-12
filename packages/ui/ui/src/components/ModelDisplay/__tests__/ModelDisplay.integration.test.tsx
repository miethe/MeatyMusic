import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ModelChip, ModelTooltip, ModelCard, ModelDeprecationWarning } from '../index';
import { EnhancedModel } from '../types';

expect.extend(toHaveNoViolations);

// Mock enhanced model for testing
const mockModel: EnhancedModel = {
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
  description: 'Advanced language model with improved capabilities',
  logoUrl: 'https://example.com/openai-logo.png',
  documentationUrl: 'https://docs.openai.com/gpt-4-turbo',
  capabilities: [
    { type: 'text', level: 'expert', supported: true },
    { type: 'function-calling', level: 'advanced', supported: true },
    { type: 'json-mode', level: 'advanced', supported: true },
  ],
  performance: {
    latency: 'medium',
    cost: 'high',
    contextLength: 128000,
    maxOutputTokens: 4096,
    tokensPerSecond: 50,
    quality: 'excellent',
  },
  tags: [
    { id: '1', name: 'favorite', color: '#ff6b6b', isSystem: false, createdAt: new Date() },
    { id: '2', name: 'coding', color: '#4ecdc4', isSystem: false, createdAt: new Date() },
  ],
  pricing: {
    tier: 'paid',
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
  },
};

const deprecatedModel: EnhancedModel = {
  ...mockModel,
  id: '2',
  name: 'gpt-3.5-turbo',
  display_name: 'GPT-3.5 Turbo',
  short_label: 'GPT-3.5 Turbo',
  status: 'deprecated',
  deprecation: {
    isDeprecated: true,
    severity: 'warning',
    deprecationDate: new Date('2024-06-01'),
    endOfLifeDate: new Date('2024-12-01'),
    warningMessage: 'GPT-3.5 Turbo will be deprecated in June 2024',
    replacementModel: 'gpt-4-turbo',
  },
};

describe('ModelDisplay Integration Tests', () => {
  describe('ModelChip Component', () => {
    it('renders basic model chip', () => {
      render(<ModelChip model={mockModel} />);
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
    });

    it('shows status badge for active model', () => {
      render(<ModelChip model={mockModel} showStatus />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows capability badges when enabled', () => {
      render(<ModelChip model={mockModel} showCapabilities />);
      expect(screen.getByLabelText('Function Calling')).toBeInTheDocument();
      expect(screen.getByLabelText('JSON Mode')).toBeInTheDocument();
    });

    it('shows pricing tier when enabled', () => {
      render(<ModelChip model={mockModel} showPricing />);
      expect(screen.getByText('Paid')).toBeInTheDocument();
    });

    it('handles click events when interactive', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<ModelChip model={mockModel} interactive onClick={onClick} />);

      const chip = screen.getByRole('button');
      await user.click(chip);

      expect(onClick).toHaveBeenCalled();
    });

    it('shows remove button when removable', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      render(<ModelChip model={mockModel} onRemove={onRemove} />);

      const removeButton = screen.getByLabelText('Remove GPT-4 Turbo');
      await user.click(removeButton);

      expect(onRemove).toHaveBeenCalled();
    });

    it('shows deprecation indicator for deprecated model', () => {
      render(<ModelChip model={deprecatedModel} showStatus />);
      expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<ModelChip model={mockModel} interactive />);
      const chip = screen.getByRole('button');

      expect(chip).toHaveAttribute('aria-label', 'GPT-4 Turbo by OpenAI');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<ModelChip model={mockModel} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ModelTooltip Component', () => {
    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      render(
        <ModelTooltip model={mockModel}>
          <button>Hover me</button>
        </ModelTooltip>
      );

      const trigger = screen.getByText('Hover me');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Advanced language model with improved capabilities')).toBeInTheDocument();
      });
    });

    it('shows model specifications in tooltip', async () => {
      const user = userEvent.setup();
      render(
        <ModelTooltip model={mockModel} showFullDetails>
          <button>Hover me</button>
        </ModelTooltip>
      );

      const trigger = screen.getByText('Hover me');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('128K tokens')).toBeInTheDocument();
        expect(screen.getByText('$0.01 / 1K tokens')).toBeInTheDocument();
      });
    });

    it('shows capability matrix', async () => {
      const user = userEvent.setup();
      render(
        <ModelTooltip model={mockModel} showFullDetails>
          <button>Hover me</button>
        </ModelTooltip>
      );

      const trigger = screen.getByText('Hover me');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Text Processing')).toBeInTheDocument();
        expect(screen.getByText('Function Calling')).toBeInTheDocument();
      });
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <ModelTooltip model={mockModel}>
          <button>Hover me</button>
        </ModelTooltip>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ModelCard Component', () => {
    it('renders comprehensive model information', () => {
      render(<ModelCard model={mockModel} />);

      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Advanced language model with improved capabilities')).toBeInTheDocument();
    });

    it('shows capability grid', () => {
      render(<ModelCard model={mockModel} />);

      expect(screen.getByText('Text Processing')).toBeInTheDocument();
      expect(screen.getByText('Function Calling')).toBeInTheDocument();
      expect(screen.getByText('JSON Mode')).toBeInTheDocument();
    });

    it('shows performance metrics when enabled', () => {
      render(<ModelCard model={mockModel} showMetrics />);

      expect(screen.getByText('128K context')).toBeInTheDocument();
      expect(screen.getByText('50 tokens/sec')).toBeInTheDocument();
    });

    it('shows action buttons when enabled', () => {
      render(<ModelCard model={mockModel} showActions />);

      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Favorite')).toBeInTheDocument();
      expect(screen.getByText('Compare')).toBeInTheDocument();
    });

    it('handles action button clicks', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      const onFavorite = jest.fn();
      const onCompare = jest.fn();

      render(
        <ModelCard
          model={mockModel}
          showActions
          onSelect={onSelect}
          onFavorite={onFavorite}
          onCompare={onCompare}
        />
      );

      await user.click(screen.getByText('Select'));
      expect(onSelect).toHaveBeenCalled();

      await user.click(screen.getByText('Favorite'));
      expect(onFavorite).toHaveBeenCalled();

      await user.click(screen.getByText('Compare'));
      expect(onCompare).toHaveBeenCalled();
    });

    it('shows tags', () => {
      render(<ModelCard model={mockModel} />);

      expect(screen.getByText('favorite')).toBeInTheDocument();
      expect(screen.getByText('coding')).toBeInTheDocument();
    });

    it('has responsive design', () => {
      render(<ModelCard model={mockModel} variant=\"compact\" />);

      // Should render in compact mode
      const card = screen.getByRole('article');
      expect(card).toHaveClass('compact');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<ModelCard model={mockModel} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ModelDeprecationWarning Component', () => {
    it('shows deprecation warning for deprecated model', () => {
      render(<ModelDeprecationWarning model={deprecatedModel} />);

      expect(screen.getByText('Model Deprecated')).toBeInTheDocument();
      expect(screen.getByText('GPT-3.5 Turbo will be deprecated in June 2024')).toBeInTheDocument();
    });

    it('shows timeline when enabled', () => {
      render(<ModelDeprecationWarning model={deprecatedModel} showTimeline />);

      expect(screen.getByText('Deprecation Date:')).toBeInTheDocument();
      expect(screen.getByText('End of Life:')).toBeInTheDocument();
    });

    it('shows alternative models when enabled', () => {
      render(<ModelDeprecationWarning model={deprecatedModel} showAlternatives />);

      expect(screen.getByText('Recommended Alternative')).toBeInTheDocument();
      expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
    });

    it('handles migration action', async () => {
      const user = userEvent.setup();
      const onMigrate = jest.fn();

      render(
        <ModelDeprecationWarning
          model={deprecatedModel}
          showAlternatives
          onMigrate={onMigrate}
        />
      );

      const migrateButton = screen.getByText('Migrate to gpt-4-turbo');
      await user.click(migrateButton);

      expect(onMigrate).toHaveBeenCalledWith('gpt-4-turbo');
    });

    it('can be dismissed', async () => {
      const user = userEvent.setup();
      const onDismiss = jest.fn();

      render(
        <ModelDeprecationWarning
          model={deprecatedModel}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss warning');
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });

    it('shows appropriate severity styling', () => {
      render(<ModelDeprecationWarning model={deprecatedModel} severity=\"critical\" />);

      const warning = screen.getByRole('alert');
      expect(warning).toHaveClass('critical');
    });

    it('doesn\\'t render for non-deprecated models', () => {
      render(<ModelDeprecationWarning model={mockModel} />);

      expect(screen.queryByText('Model Deprecated')).not.toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<ModelDeprecationWarning model={deprecatedModel} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Integration Scenarios', () => {
    it('works together in a complete model selection interface', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(
        <div>
          <ModelCard model={mockModel} showActions onSelect={onSelect} />
          <ModelDeprecationWarning model={deprecatedModel} />
        </div>
      );

      // Should show both active and deprecated models
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument();
      expect(screen.getByText('Model Deprecated')).toBeInTheDocument();

      // Should be able to interact with active model
      await user.click(screen.getByText('Select'));
      expect(onSelect).toHaveBeenCalled();
    });

    it('handles model comparison scenario', () => {
      render(
        <div>
          <ModelChip model={mockModel} showCapabilities />
          <ModelChip model={deprecatedModel} showCapabilities showStatus />
        </div>
      );

      // Should show different capabilities and status
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });

    it('shows rich tooltips over chips', async () => {
      const user = userEvent.setup();

      render(
        <ModelTooltip model={mockModel} showFullDetails>
          <ModelChip model={mockModel} showCapabilities />
        </ModelTooltip>
      );

      const chip = screen.getByText('GPT-4 Turbo');
      await user.hover(chip);

      await waitFor(() => {
        expect(screen.getByText('Advanced language model with improved capabilities')).toBeInTheDocument();
        expect(screen.getByText('128K tokens')).toBeInTheDocument();
      });
    });
  });
});
