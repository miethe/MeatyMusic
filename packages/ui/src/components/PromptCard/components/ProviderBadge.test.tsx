/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProviderBadge, type ProviderBadgeProps, type Provider } from './ProviderBadge';
import type { ComplicationProps } from '../../../complications/types';

expect.extend(toHaveNoViolations);

// Mock complication context props
const mockComplicationProps: Omit<ComplicationProps, 'slot'> = {
  cardId: 'test-card-123',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Test Prompt',
  isFocused: false,
  isVisible: true,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false,
  },
};

const defaultProps: ProviderBadgeProps = {
  ...mockComplicationProps,
  slot: 'topLeft',
  provider: 'anthropic',
};

describe('ProviderBadge', () => {
  describe('Provider Display', () => {
    const providers: Provider[] = ['openai', 'anthropic', 'google', 'meta', 'cohere', 'custom'];

    providers.forEach((provider) => {
      it(`displays correct badge for ${provider}`, () => {
        render(<ProviderBadge {...defaultProps} provider={provider} />);

        expect(screen.getByTestId(`provider-badge-${provider}`)).toBeInTheDocument();
      });
    });

    it('displays OpenAI with correct branding', () => {
      render(<ProviderBadge {...defaultProps} provider="openai" />);

      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByTestId('provider-badge-openai')).toBeInTheDocument();
    });

    it('displays Anthropic with correct branding', () => {
      render(<ProviderBadge {...defaultProps} provider="anthropic" />);

      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByTestId('provider-badge-anthropic')).toBeInTheDocument();
    });

    it('displays Google with correct branding', () => {
      render(<ProviderBadge {...defaultProps} provider="google" />);

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByTestId('provider-badge-google')).toBeInTheDocument();
    });

    it('displays Meta with correct branding', () => {
      render(<ProviderBadge {...defaultProps} provider="meta" />);

      expect(screen.getByText('Meta')).toBeInTheDocument();
      expect(screen.getByTestId('provider-badge-meta')).toBeInTheDocument();
    });

    it('displays Cohere with correct branding', () => {
      render(<ProviderBadge {...defaultProps} provider="cohere" />);

      expect(screen.getByText('Cohere')).toBeInTheDocument();
      expect(screen.getByTestId('provider-badge-cohere')).toBeInTheDocument();
    });

    it('displays Custom for unknown providers', () => {
      render(<ProviderBadge {...defaultProps} provider="custom" />);

      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByTestId('provider-badge-custom')).toBeInTheDocument();
    });
  });

  describe('Card Size Responsiveness', () => {
    it('shows abbreviation for compact cards', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          cardSize="compact"
          provider="anthropic"
        />
      );

      expect(screen.getByText('ANT')).toBeInTheDocument();
      expect(screen.queryByText('Anthropic')).not.toBeInTheDocument();
    });

    it('shows full name for standard cards', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          cardSize="standard"
          provider="anthropic"
        />
      );

      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.queryByText('ANT')).not.toBeInTheDocument();
    });

    it('shows full name for xl cards', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          cardSize="xl"
          provider="openai"
        />
      );

      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.queryByText('OAI')).not.toBeInTheDocument();
    });

    it('applies correct sizing classes for compact', () => {
      const { container } = render(
        <ProviderBadge
          {...defaultProps}
          cardSize="compact"
          provider="google"
        />
      );

      const badge = container.querySelector('[data-testid="provider-badge-google"]')?.firstChild;
      expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-[10px]');
    });

    it('applies correct sizing classes for standard', () => {
      const { container } = render(
        <ProviderBadge
          {...defaultProps}
          cardSize="standard"
          provider="google"
        />
      );

      const badge = container.querySelector('[data-testid="provider-badge-google"]')?.firstChild;
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[11px]');
    });

    it('applies correct sizing classes for xl', () => {
      const { container } = render(
        <ProviderBadge
          {...defaultProps}
          cardSize="xl"
          provider="google"
        />
      );

      const badge = container.querySelector('[data-testid="provider-badge-google"]')?.firstChild;
      expect(badge).toHaveClass('px-3', 'py-1', 'text-xs');
    });
  });

  describe('Model Name Display', () => {
    it('includes model name in tooltip when provided', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          modelName="claude-3-5-sonnet"
        />
      );

      const badge = screen.getByLabelText(/anthropic provider.*model: claude-3-5-sonnet/i);
      expect(badge).toBeInTheDocument();
    });

    it('works without model name', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          provider="openai"
        />
      );

      const badge = screen.getByLabelText(/openai provider/i);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Click Handler', () => {
    it('triggers onClick callback when clicked and onClick is provided', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          onClick={onClick}
        />
      );

      const button = screen.getByRole('button', { name: /anthropic provider.*click for details/i });
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not render as button when onClick is not provided', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
        />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('stops event propagation when clicked', async () => {
      const onClick = jest.fn();
      const onCardClick = jest.fn();
      const user = userEvent.setup();

      render(
        <div onClick={onCardClick}>
          <ProviderBadge
            {...defaultProps}
            provider="anthropic"
            onClick={onClick}
          />
        </div>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onCardClick).not.toHaveBeenCalled();
    });

    it('applies cursor pointer class when clickable', () => {
      const { container } = render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          onClick={jest.fn()}
        />
      );

      const badge = container.querySelector('[data-testid="provider-badge-anthropic"]')?.firstChild?.firstChild;
      expect(badge).toHaveClass('cursor-pointer');
    });
  });

  describe('Visibility Control', () => {
    it('does not render when isVisible is false', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          isVisible={false}
          provider="anthropic"
        />
      );

      expect(screen.queryByTestId('provider-badge-anthropic')).not.toBeInTheDocument();
    });

    it('renders when isVisible is true', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          isVisible={true}
          provider="anthropic"
        />
      );

      expect(screen.getByTestId('provider-badge-anthropic')).toBeInTheDocument();
    });
  });

  describe('ARIA and Accessibility', () => {
    it('provides proper ARIA labels for each provider', () => {
      const providers: Provider[] = ['openai', 'anthropic', 'google', 'meta', 'cohere'];

      providers.forEach((provider) => {
        const { unmount } = render(
          <ProviderBadge {...defaultProps} provider={provider} />
        );

        expect(screen.getByLabelText(new RegExp(`${provider} provider`, 'i'))).toBeInTheDocument();
        unmount();
      });
    });

    it('uses custom aria-label when provided', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          aria-label="Custom accessibility label"
        />
      );

      expect(screen.getByLabelText('Custom accessibility label')).toBeInTheDocument();
    });

    it('provides accessible button label when clickable', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          onClick={jest.fn()}
        />
      );

      expect(screen.getByRole('button', {
        name: /anthropic provider.*click for details/i
      })).toBeInTheDocument();
    });

    it('passes accessibility audit', async () => {
      const { container } = render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          modelName="claude-3-5-sonnet"
          onClick={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes accessibility audit for non-clickable badge', async () => {
      const { container } = render(
        <ProviderBadge
          {...defaultProps}
          provider="openai"
          modelName="gpt-4"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data Attributes', () => {
    it('includes proper data attributes for testing', () => {
      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          slot="topLeft"
        />
      );

      const badge = screen.getByTestId('provider-badge-anthropic');
      expect(badge).toHaveAttribute('data-slot', 'topLeft');
    });

    it('includes correct testid for each provider', () => {
      const providers: Provider[] = ['openai', 'anthropic', 'google', 'meta', 'cohere', 'custom'];

      providers.forEach((provider) => {
        const { unmount } = render(
          <ProviderBadge {...defaultProps} provider={provider} />
        );

        expect(screen.getByTestId(`provider-badge-${provider}`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation when clickable', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          onClick={onClick}
        />
      );

      const button = screen.getByRole('button');

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);

      // Press Space
      await user.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('shows focus ring when focused', async () => {
      const user = userEvent.setup();
      render(
        <ProviderBadge
          {...defaultProps}
          provider="anthropic"
          onClick={jest.fn()}
        />
      );

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Brand Colors', () => {
    it('applies correct brand color styles', () => {
      const { container } = render(
        <ProviderBadge
          {...defaultProps}
          provider="openai"
        />
      );

      const badge = container.querySelector('[data-testid="provider-badge-openai"]')?.firstChild;
      expect(badge).toHaveStyle({
        backgroundColor: '#10A37F',
        color: 'white',
      });
    });

    it('applies different colors for different providers', () => {
      const { container: anthropicContainer } = render(
        <ProviderBadge {...defaultProps} provider="anthropic" />
      );

      const { container: googleContainer } = render(
        <ProviderBadge {...defaultProps} provider="google" />
      );

      const anthropicBadge = anthropicContainer.querySelector('[data-testid="provider-badge-anthropic"]')?.firstChild;
      const googleBadge = googleContainer.querySelector('[data-testid="provider-badge-google"]')?.firstChild;

      expect(anthropicBadge).toHaveStyle({ backgroundColor: '#D4A373' });
      expect(googleBadge).toHaveStyle({ backgroundColor: '#4285F4' });
    });
  });
});
