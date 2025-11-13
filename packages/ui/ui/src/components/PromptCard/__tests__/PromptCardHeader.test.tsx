import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Header } from '../sections';

describe('PromptCard Header', () => {
  it('renders title', () => {
    render(
      <Header
        title="Test Prompt"
        version={1}
        isCompact={false}
      />
    );
    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
  });

  it('renders lastRun time when provided', () => {
    const lastRun = new Date('2025-10-10T12:00:00Z');
    render(
      <Header
        title="Test Prompt"
        version={1}
        lastRun={lastRun}
        isCompact={false}
      />
    );
    // Should show relative time
    expect(screen.getByText(/ago|Just now/)).toBeInTheDocument();
  });

  it('shows date tooltip when hovering over lastRun with createdAt and updatedAt', async () => {
    const user = userEvent.setup();
    const createdAt = new Date('2025-01-10T15:45:00Z');
    const updatedAt = new Date('2025-10-10T10:30:00Z');
    const lastRun = new Date('2025-10-10T12:00:00Z');

    render(
      <Header
        title="Test Prompt"
        version={1}
        lastRun={lastRun}
        createdAt={createdAt}
        updatedAt={updatedAt}
        isCompact={false}
      />
    );

    const timeElement = screen.getByText(/ago|Just now/);

    // Element should have cursor-help class
    expect(timeElement).toHaveClass('cursor-help');

    await user.hover(timeElement);

    // Check that tooltip content appears (using getAllByText since Radix renders it multiple times)
    const createdElements = await screen.findAllByText(/Created:/);
    const modifiedElements = await screen.findAllByText(/Last modified:/);

    expect(createdElements.length).toBeGreaterThan(0);
    expect(modifiedElements.length).toBeGreaterThan(0);
  });

  it('does not show tooltip when createdAt and updatedAt are not provided', () => {
    const lastRun = new Date('2025-10-10T12:00:00Z');
    render(
      <Header
        title="Test Prompt"
        version={1}
        lastRun={lastRun}
        isCompact={false}
      />
    );

    const timeElement = screen.getByText(/ago|Just now/);
    // Should not have cursor-help class when no tooltip
    expect(timeElement).not.toHaveClass('cursor-help');
  });

  it('shows tooltip with only createdAt when updatedAt is not provided', async () => {
    const user = userEvent.setup();
    const createdAt = new Date('2025-01-10T15:45:00Z');
    const lastRun = new Date('2025-10-10T12:00:00Z');

    render(
      <Header
        title="Test Prompt"
        version={1}
        lastRun={lastRun}
        createdAt={createdAt}
        isCompact={false}
      />
    );

    const timeElement = screen.getByText(/ago|Just now/);

    // Element should have cursor-help class
    expect(timeElement).toHaveClass('cursor-help');

    await user.hover(timeElement);

    const createdElements = await screen.findAllByText(/Created:/);
    expect(createdElements.length).toBeGreaterThan(0);
  });

  it('does not render lastRun section when lastRun is not provided', () => {
    render(
      <Header
        title="Test Prompt"
        version={1}
        isCompact={false}
      />
    );

    // Clock icon should not be present
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });
});
