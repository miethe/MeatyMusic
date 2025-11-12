/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ModelBadges, type ModelBadgesProps } from './ModelBadges';

expect.extend(toHaveNoViolations);

const defaultModels = ['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3'];

const defaultProps: ModelBadgesProps = {
  models: defaultModels,
  size: 'standard',
};

describe('ModelBadges', () => {
  describe('Rendering', () => {
    it('renders visible models based on size', () => {
      render(<ModelBadges {...defaultProps} />);
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
      expect(screen.getByText('claude-3-opus')).toBeInTheDocument();
    });

    it('does not render when models array is empty', () => {
      const { container } = render(<ModelBadges models={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when models is undefined', () => {
      const { container } = render(<ModelBadges models={undefined as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders single model without overflow', () => {
      render(<ModelBadges models={['gpt-4']} size="standard" />);
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });
  });

  describe('Responsive Display Limits', () => {
    it('shows 1 model in compact size', () => {
      render(<ModelBadges models={defaultModels} size="compact" />);
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
      expect(screen.queryByText('claude-3-opus')).not.toBeInTheDocument();
    });

    it('shows 2 models in standard size', () => {
      render(<ModelBadges models={defaultModels} size="standard" />);
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
      expect(screen.getByText('claude-3-opus')).toBeInTheDocument();
      expect(screen.queryByText('gemini-pro')).not.toBeInTheDocument();
    });

    it('shows 3 models in xl size', () => {
      render(<ModelBadges models={defaultModels} size="xl" />);
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
      expect(screen.getByText('claude-3-opus')).toBeInTheDocument();
      expect(screen.getByText('gemini-pro')).toBeInTheDocument();
      expect(screen.queryByText('llama-3')).not.toBeInTheDocument();
    });

    it('defaults to standard size when not specified', () => {
      render(<ModelBadges models={defaultModels} />);
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
      expect(screen.getByText('claude-3-opus')).toBeInTheDocument();
      expect(screen.queryByText('gemini-pro')).not.toBeInTheDocument();
    });
  });

  describe('Overflow Handling', () => {
    it('shows overflow indicator in compact size', () => {
      render(<ModelBadges models={defaultModels} size="compact" />);
      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('shows overflow indicator in standard size', () => {
      render(<ModelBadges models={defaultModels} size="standard" />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('shows overflow indicator in xl size', () => {
      render(<ModelBadges models={defaultModels} size="xl" />);
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('does not show overflow when all models fit', () => {
      render(<ModelBadges models={['gpt-4', 'claude-3']} size="standard" />);
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('shows all overflow models in tooltip', async () => {
      const user = userEvent.setup();
      render(<ModelBadges models={defaultModels} size="compact" />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        const claudeElements = screen.getAllByText('claude-3-opus');
        expect(claudeElements.length).toBeGreaterThan(0);
        expect(screen.getAllByText('gemini-pro').length).toBeGreaterThan(0);
        expect(screen.getAllByText('llama-3').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Click Handlers', () => {
    it('calls onModelClick when badge is clicked', async () => {
      const user = userEvent.setup();
      const handleModelClick = jest.fn();
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={handleModelClick}
        />
      );

      const badge = screen.getByText('gpt-4').closest('[data-clickable-section="model"]');
      expect(badge).toBeInTheDocument();

      await user.click(badge!);

      expect(handleModelClick).toHaveBeenCalledTimes(1);
      expect(handleModelClick).toHaveBeenCalledWith(
        'gpt-4',
        expect.any(Object)
      );
    });

    it('stops event propagation when badge is clicked', async () => {
      const user = userEvent.setup();
      const handleModelClick = jest.fn();
      const handleParentClick = jest.fn();

      const { container } = render(
        <div onClick={handleParentClick}>
          <ModelBadges
            models={['gpt-4']}
            onModelClick={handleModelClick}
          />
        </div>
      );

      const badge = container.querySelector('[data-clickable-section="model"]');
      expect(badge).toBeInTheDocument();

      await user.click(badge!);

      expect(handleModelClick).toHaveBeenCalledTimes(1);
      expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('does not make badges clickable when onModelClick is not provided', () => {
      render(<ModelBadges models={['gpt-4']} />);

      const clickableSection = screen.queryByRole('button', { name: /Filter by model/i });
      expect(clickableSection).not.toBeInTheDocument();
    });

    it('calls onModelClick for overflow models in tooltip', async () => {
      const user = userEvent.setup();
      const handleModelClick = jest.fn();
      render(
        <ModelBadges
          models={defaultModels}
          size="compact"
          onModelClick={handleModelClick}
        />
      );

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(async () => {
        const overflowBadges = screen.getAllByText('claude-3-opus');
        expect(overflowBadges.length).toBeGreaterThan(0);

        const clickableBadge = overflowBadges[overflowBadges.length - 1].closest('[data-clickable-section="model"]');
        if (clickableBadge) {
          await user.click(clickableBadge);
          expect(handleModelClick).toHaveBeenCalledWith('claude-3-opus', expect.any(Object));
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for clickable badges', () => {
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={() => {}}
        />
      );

      const button = screen.getByRole('button', { name: 'Filter by model: gpt-4' });
      expect(button).toBeInTheDocument();
    });

    it('is keyboard navigable', async () => {
      const user = userEvent.setup();
      const handleModelClick = jest.fn();
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={handleModelClick}
        />
      );

      const badge = screen.getByRole('button', { name: 'Filter by model: gpt-4' });

      await user.tab();
      expect(badge).toHaveFocus();
    });

    it('supports keyboard activation with Enter key', async () => {
      const user = userEvent.setup();
      const handleModelClick = jest.fn();
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={handleModelClick}
        />
      );

      const badge = screen.getByRole('button', { name: 'Filter by model: gpt-4' });

      await user.tab();
      expect(badge).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleModelClick).toHaveBeenCalledWith('gpt-4', expect.any(Object));
    });

    it('supports keyboard activation with Space key', async () => {
      const user = userEvent.setup();
      const handleModelClick = jest.fn();
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={handleModelClick}
        />
      );

      const badge = screen.getByRole('button', { name: 'Filter by model: gpt-4' });

      await user.tab();
      expect(badge).toHaveFocus();

      await user.keyboard(' ');
      expect(handleModelClick).toHaveBeenCalledWith('gpt-4', expect.any(Object));
    });

    it('passes accessibility audit', async () => {
      const { container } = render(<ModelBadges models={defaultModels} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes accessibility audit with click handlers', async () => {
      const { container } = render(
        <ModelBadges
          models={defaultModels}
          onModelClick={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper data attributes for clickable sections', () => {
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={() => {}}
        />
      );

      const section = screen.getByRole('button').closest('[data-clickable-section="model"]');
      expect(section).toHaveAttribute('data-model', 'gpt-4');
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ModelBadges
          models={['gpt-4']}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies hover styles to clickable badges', () => {
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={() => {}}
        />
      );

      const badge = screen.getByText('gpt-4');
      expect(badge).toHaveClass('hover:bg-mp-secondary/80');
    });

    it('does not add clickable wrapper to non-clickable badges', () => {
      render(<ModelBadges models={['gpt-4']} />);

      const badge = screen.getByText('gpt-4');
      // Badge should not be wrapped in a clickable div
      const wrapper = badge.closest('[data-clickable-section="model"]');
      expect(wrapper).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long model names', () => {
      const longModelName = 'anthropic-claude-3-5-sonnet-20250219-very-long-name';
      render(<ModelBadges models={[longModelName]} />);
      expect(screen.getByText(longModelName)).toBeInTheDocument();
    });

    it('handles models with special characters', () => {
      const specialModels = ['gpt-4-turbo-preview', 'claude-3.5-opus', 'gemini_1.5_pro'];
      render(<ModelBadges models={specialModels} />);
      expect(screen.getByText('gpt-4-turbo-preview')).toBeInTheDocument();
      expect(screen.getByText('claude-3.5-opus')).toBeInTheDocument();
    });

    it('handles single model in each size', () => {
      const sizes: Array<'compact' | 'standard' | 'xl'> = ['compact', 'standard', 'xl'];

      sizes.forEach((size) => {
        const { unmount } = render(<ModelBadges models={['gpt-4']} size={size} />);
        expect(screen.getByText('gpt-4')).toBeInTheDocument();
        expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
        unmount();
      });
    });

    it('handles many models', async () => {
      const user = userEvent.setup();
      const manyModels = Array.from({ length: 20 }, (_, i) => `model-${i + 1}`);
      render(<ModelBadges models={manyModels} size="standard" />);

      expect(screen.getByText('model-1')).toBeInTheDocument();
      expect(screen.getByText('model-2')).toBeInTheDocument();
      expect(screen.getByText('+18 more')).toBeInTheDocument();

      const trigger = screen.getByText('+18 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('model-20').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Integration', () => {
    it('uses Badge component correctly', () => {
      render(<ModelBadges models={['gpt-4']} />);
      const badge = screen.getByText('gpt-4');
      expect(badge.tagName).toBe('DIV');
      expect(badge).toHaveClass('font-medium');
    });

    it('uses OverflowTooltip component for overflow', () => {
      render(<ModelBadges models={defaultModels} size="compact" />);
      expect(screen.getByTestId('overflow-tooltip')).toBeInTheDocument();
    });

    it('positions overflow tooltip correctly', async () => {
      const user = userEvent.setup();
      render(<ModelBadges models={defaultModels} size="compact" />);

      const trigger = screen.getByText('+3 more');
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getAllByText('claude-3-opus').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Attributes', () => {
    it('adds data-clickable-section to clickable badges', () => {
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={() => {}}
        />
      );

      const section = screen.getByRole('button').closest('[data-clickable-section]');
      expect(section).toHaveAttribute('data-clickable-section', 'model');
    });

    it('adds data-model to clickable badges', () => {
      render(
        <ModelBadges
          models={['gpt-4']}
          onModelClick={() => {}}
        />
      );

      const section = screen.getByRole('button').closest('[data-model]');
      expect(section).toHaveAttribute('data-model', 'gpt-4');
    });

    it('does not add data attributes to non-clickable badges', () => {
      const { container } = render(<ModelBadges models={['gpt-4']} />);
      const section = container.querySelector('[data-clickable-section="model"]');
      expect(section).not.toBeInTheDocument();
    });
  });
});
