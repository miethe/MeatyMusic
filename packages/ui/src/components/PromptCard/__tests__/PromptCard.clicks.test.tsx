import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PromptCard } from '../PromptCard';
import type { PromptCardProps } from '../PromptCard';

describe('PromptCard - Click Behavior', () => {
  const baseProps: PromptCardProps = {
    title: 'Test Prompt Card',
    version: 2,
    access: 'public',
    tags: ['tag1', 'tag2', 'tag3'],
    model: 'gpt-4',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Card Click', () => {
    it('calls onCardClick when card body is clicked', async () => {
      const onCardClick = jest.fn();
      render(<PromptCard {...baseProps} onCardClick={onCardClick} />);

      // Click on the card title (which is part of the card body)
      const titleElement = screen.getByText('Test Prompt Card');
      await userEvent.click(titleElement);

      expect(onCardClick).toHaveBeenCalledTimes(1);
    });

    it('prefers onCardClick over onPrimaryAction when both are provided', async () => {
      const onCardClick = jest.fn();
      const onPrimaryAction = jest.fn();
      render(
        <PromptCard {...baseProps} onCardClick={onCardClick} onPrimaryAction={onPrimaryAction} />
      );

      const titleElement = screen.getByText('Test Prompt Card');
      await userEvent.click(titleElement);

      expect(onCardClick).toHaveBeenCalledTimes(1);
      expect(onPrimaryAction).not.toHaveBeenCalled();
    });

    it('falls back to onPrimaryAction when onCardClick is not provided', async () => {
      const onPrimaryAction = jest.fn();
      render(
        <PromptCard {...baseProps} onPrimaryAction={onPrimaryAction} />
      );

      const titleElement = screen.getByText('Test Prompt Card');
      await userEvent.click(titleElement);

      expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    });

    it('does not trigger card click when clicking action buttons', async () => {
      const onCardClick = jest.fn();
      render(<PromptCard {...baseProps} onCardClick={onCardClick} onRun={jest.fn()} />);

      const runButton = screen.getByRole('button', { name: /run/i });
      await userEvent.click(runButton);

      expect(onCardClick).not.toHaveBeenCalled();
    });

    it('does not trigger card click when clicking clickable sections', async () => {
      const onCardClick = jest.fn();
      const onTagClick = jest.fn();
      render(<PromptCard {...baseProps} onCardClick={onCardClick} onTagClick={onTagClick} />);

      const tagElement = screen.getByText('tag1').closest('[data-clickable-section]');
      await userEvent.click(tagElement!);

      expect(onCardClick).not.toHaveBeenCalled();
      expect(onTagClick).toHaveBeenCalledWith('tag1', expect.anything());
    });

    it('does not trigger when card is disabled', async () => {
      const onCardClick = jest.fn();
      const { container } = render(<PromptCard {...baseProps} onCardClick={onCardClick} disabled />);

      const card = container.querySelector('[data-card-id]');
      await userEvent.click(card!);

      expect(onCardClick).not.toHaveBeenCalled();
    });

    it('does not trigger when card is running', async () => {
      const onCardClick = jest.fn();
      const { container } = render(<PromptCard {...baseProps} onCardClick={onCardClick} isRunning />);

      const card = container.querySelector('[data-card-id]');
      await userEvent.click(card!);

      expect(onCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Tag Clicks', () => {
    it('calls onTagClick when tag badge is clicked', async () => {
      const onTagClick = jest.fn();
      render(<PromptCard {...baseProps} onTagClick={onTagClick} />);

      const tagElement = screen.getByText('tag1').closest('[data-clickable-section="tag"]');
      await userEvent.click(tagElement!);

      expect(onTagClick).toHaveBeenCalledWith('tag1', expect.anything());
    });

    it('calls onTagClick with correct tag for each badge', async () => {
      const onTagClick = jest.fn();
      render(<PromptCard {...baseProps} onTagClick={onTagClick} />);

      const tag1 = screen.getByText('tag1').closest('[data-clickable-section="tag"]');
      const tag2 = screen.getByText('tag2').closest('[data-clickable-section="tag"]');
      const tag3 = screen.getByText('tag3').closest('[data-clickable-section="tag"]');

      await userEvent.click(tag1!);
      expect(onTagClick).toHaveBeenLastCalledWith('tag1', expect.anything());

      await userEvent.click(tag2!);
      expect(onTagClick).toHaveBeenLastCalledWith('tag2', expect.anything());

      await userEvent.click(tag3!);
      expect(onTagClick).toHaveBeenLastCalledWith('tag3', expect.anything());

      expect(onTagClick).toHaveBeenCalledTimes(3);
    });

    it('supports keyboard activation with Enter key', async () => {
      const onTagClick = jest.fn();
      render(<PromptCard {...baseProps} onTagClick={onTagClick} />);

      const tagElement = screen.getByText('tag1').closest('[data-clickable-section="tag"]') as HTMLElement;
      tagElement.focus();
      await userEvent.keyboard('{Enter}');

      expect(onTagClick).toHaveBeenCalledWith('tag1', expect.anything());
    });

    it('supports keyboard activation with Space key', async () => {
      const onTagClick = jest.fn();
      render(<PromptCard {...baseProps} onTagClick={onTagClick} />);

      const tagElement = screen.getByText('tag1').closest('[data-clickable-section="tag"]') as HTMLElement;
      tagElement.focus();
      await userEvent.keyboard(' ');

      expect(onTagClick).toHaveBeenCalledWith('tag1', expect.anything());
    });

    it('has proper ARIA attributes when clickable', () => {
      render(<PromptCard {...baseProps} onTagClick={jest.fn()} />);

      const tagElement = screen.getByText('tag1').closest('[data-clickable-section="tag"]');
      expect(tagElement).toHaveAttribute('role', 'button');
      expect(tagElement).toHaveAttribute('tabIndex', '0');
      expect(tagElement).toHaveAttribute('aria-label', 'Filter by tag: tag1');
    });

    it('does not have button role when not clickable', () => {
      render(<PromptCard {...baseProps} />);

      const tagElement = screen.getByText('tag1').parentElement;
      expect(tagElement).not.toHaveAttribute('role', 'button');
      expect(tagElement).not.toHaveAttribute('tabIndex');
    });

    it('has hover styles when clickable', () => {
      render(<PromptCard {...baseProps} onTagClick={jest.fn()} />);

      const tagWrapper = screen.getByText('tag1').closest('[data-clickable-section="tag"]');
      expect(tagWrapper).toHaveClass('cursor-pointer');
    });

    it('stops propagation to prevent card click', async () => {
      const onCardClick = jest.fn();
      const onTagClick = jest.fn();
      render(<PromptCard {...baseProps} onCardClick={onCardClick} onTagClick={onTagClick} />);

      const tagElement = screen.getByText('tag1').closest('[data-clickable-section="tag"]');
      await userEvent.click(tagElement!);

      expect(onTagClick).toHaveBeenCalled();
      expect(onCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Model Clicks', () => {
    it('calls onModelClick when model badge is clicked', async () => {
      const onModelClick = jest.fn();
      render(<PromptCard {...baseProps} onModelClick={onModelClick} />);

      const modelElement = screen.getByText('gpt-4').closest('[data-clickable-section="model"]');
      await userEvent.click(modelElement!);

      expect(onModelClick).toHaveBeenCalledWith('gpt-4', expect.anything());
    });

    it('supports keyboard activation with Enter key', async () => {
      const onModelClick = jest.fn();
      render(<PromptCard {...baseProps} onModelClick={onModelClick} />);

      const modelElement = screen.getByText('gpt-4').closest('[data-clickable-section="model"]') as HTMLElement;
      modelElement.focus();
      await userEvent.keyboard('{Enter}');

      expect(onModelClick).toHaveBeenCalledWith('gpt-4', expect.anything());
    });

    it('supports keyboard activation with Space key', async () => {
      const onModelClick = jest.fn();
      render(<PromptCard {...baseProps} onModelClick={onModelClick} />);

      const modelElement = screen.getByText('gpt-4').closest('[data-clickable-section="model"]') as HTMLElement;
      modelElement.focus();
      await userEvent.keyboard(' ');

      expect(onModelClick).toHaveBeenCalledWith('gpt-4', expect.anything());
    });

    it('has proper ARIA attributes when clickable', () => {
      render(<PromptCard {...baseProps} onModelClick={jest.fn()} />);

      const modelElement = screen.getByText('gpt-4').closest('[data-clickable-section="model"]');
      expect(modelElement).toHaveAttribute('role', 'button');
      expect(modelElement).toHaveAttribute('tabIndex', '0');
      expect(modelElement).toHaveAttribute('aria-label', 'Filter by model: gpt-4');
    });

    it('does not have button role when not clickable', () => {
      render(<PromptCard {...baseProps} />);

      const modelElement = screen.getByText('gpt-4').parentElement;
      expect(modelElement).not.toHaveAttribute('role', 'button');
    });

    it('has hover styles when clickable', () => {
      render(<PromptCard {...baseProps} onModelClick={jest.fn()} />);

      const modelWrapper = screen.getByText('gpt-4').closest('[data-clickable-section="model"]');
      expect(modelWrapper).toHaveClass('cursor-pointer');
    });

    it('stops propagation to prevent card click', async () => {
      const onCardClick = jest.fn();
      const onModelClick = jest.fn();
      render(<PromptCard {...baseProps} onCardClick={onCardClick} onModelClick={onModelClick} />);

      const modelElement = screen.getByText('gpt-4').closest('[data-clickable-section="model"]');
      await userEvent.click(modelElement!);

      expect(onModelClick).toHaveBeenCalled();
      expect(onCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Version Clicks', () => {
    it('calls onVersionClick when version badge is clicked', async () => {
      const onVersionClick = jest.fn();
      render(<PromptCard {...baseProps} onVersionClick={onVersionClick} />);

      const versionElement = screen.getByText('v2').closest('[data-clickable-section="version"]');
      await userEvent.click(versionElement!);

      expect(onVersionClick).toHaveBeenCalledWith(2, expect.anything());
    });

    it('supports keyboard activation with Enter key', async () => {
      const onVersionClick = jest.fn();
      render(<PromptCard {...baseProps} onVersionClick={onVersionClick} />);

      const versionElement = screen.getByText('v2').closest('[data-clickable-section="version"]') as HTMLElement;
      versionElement.focus();
      await userEvent.keyboard('{Enter}');

      expect(onVersionClick).toHaveBeenCalledWith(2, expect.anything());
    });

    it('supports keyboard activation with Space key', async () => {
      const onVersionClick = jest.fn();
      render(<PromptCard {...baseProps} onVersionClick={onVersionClick} />);

      const versionElement = screen.getByText('v2').closest('[data-clickable-section="version"]') as HTMLElement;
      versionElement.focus();
      await userEvent.keyboard(' ');

      expect(onVersionClick).toHaveBeenCalledWith(2, expect.anything());
    });

    it('has proper ARIA attributes when clickable', () => {
      render(<PromptCard {...baseProps} onVersionClick={jest.fn()} />);

      const versionElement = screen.getByText('v2').closest('[data-clickable-section="version"]');
      expect(versionElement).toHaveAttribute('role', 'button');
      expect(versionElement).toHaveAttribute('tabIndex', '0');
      expect(versionElement).toHaveAttribute('aria-label', 'View version history: 2');
    });

    it('does not have button role when not clickable', () => {
      render(<PromptCard {...baseProps} />);

      const versionElement = screen.getByText('v2').parentElement;
      expect(versionElement).not.toHaveAttribute('role', 'button');
    });

    it('has hover styles when clickable', () => {
      render(<PromptCard {...baseProps} onVersionClick={jest.fn()} />);

      const versionWrapper = screen.getByText('v2').closest('[data-clickable-section="version"]');
      expect(versionWrapper).toHaveClass('cursor-pointer');
    });

    it('stops propagation to prevent card click', async () => {
      const onCardClick = jest.fn();
      const onVersionClick = jest.fn();
      render(<PromptCard {...baseProps} onCardClick={onCardClick} onVersionClick={onVersionClick} />);

      const versionElement = screen.getByText('v2').closest('[data-clickable-section="version"]');
      await userEvent.click(versionElement!);

      expect(onVersionClick).toHaveBeenCalled();
      expect(onCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Data Attributes for Testing', () => {
    it('adds data-clickable-section="tag" to tag badges', () => {
      render(<PromptCard {...baseProps} onTagClick={jest.fn()} />);

      const tagElement = screen.getByText('tag1').closest('[data-clickable-section]');
      expect(tagElement).toHaveAttribute('data-clickable-section', 'tag');
      expect(tagElement).toHaveAttribute('data-tag', 'tag1');
    });

    it('adds data-clickable-section="model" to model badge', () => {
      render(<PromptCard {...baseProps} onModelClick={jest.fn()} />);

      const modelElement = screen.getByText('gpt-4').closest('[data-clickable-section]');
      expect(modelElement).toHaveAttribute('data-clickable-section', 'model');
      expect(modelElement).toHaveAttribute('data-model', 'gpt-4');
    });

    it('adds data-clickable-section="version" to version badge', () => {
      render(<PromptCard {...baseProps} onVersionClick={jest.fn()} />);

      const versionElement = screen.getByText('v2').closest('[data-clickable-section]');
      expect(versionElement).toHaveAttribute('data-clickable-section', 'version');
      expect(versionElement).toHaveAttribute('data-version', '2');
    });
  });

  describe('Multiple Click Handlers', () => {
    it('supports all click handlers simultaneously', async () => {
      const onCardClick = jest.fn();
      const onTagClick = jest.fn();
      const onModelClick = jest.fn();
      const onVersionClick = jest.fn();

      render(
        <PromptCard
          {...baseProps}
          onCardClick={onCardClick}
          onTagClick={onTagClick}
          onModelClick={onModelClick}
          onVersionClick={onVersionClick}
        />
      );

      // Click tag
      const tagElement = screen.getByText('tag1').closest('[data-clickable-section]');
      await userEvent.click(tagElement!);
      expect(onTagClick).toHaveBeenCalledWith('tag1', expect.anything());
      expect(onCardClick).not.toHaveBeenCalled();

      // Click model
      const modelElement = screen.getByText('gpt-4').closest('[data-clickable-section]');
      await userEvent.click(modelElement!);
      expect(onModelClick).toHaveBeenCalledWith('gpt-4', expect.anything());
      expect(onCardClick).not.toHaveBeenCalled();

      // Click version
      const versionElement = screen.getByText('v2').closest('[data-clickable-section]');
      await userEvent.click(versionElement!);
      expect(onVersionClick).toHaveBeenCalledWith(2, expect.anything());
      expect(onCardClick).not.toHaveBeenCalled();

      // Click card body
      const titleElement = screen.getByText('Test Prompt Card');
      await userEvent.click(titleElement);
      expect(onCardClick).toHaveBeenCalledTimes(1);
    });
  });
});
