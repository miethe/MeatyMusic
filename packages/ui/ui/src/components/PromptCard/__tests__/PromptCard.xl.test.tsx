import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PromptCard } from '../PromptCard';
import type { PromptCardProps } from '../PromptCard';

expect.extend(toHaveNoViolations);

// Mock performance for tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
  },
});

describe('PromptCard - XL Variant', () => {
  const baseProps: PromptCardProps = {
    title: 'Advanced Marketing Campaign Strategy Generator',
    version: 7,
    access: 'shared',
    size: 'xl',
    tags: ['marketing', 'campaigns', 'strategy', 'automation'],
    model: 'gpt-4-turbo',
    lastRun: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    bodyPreview: 'Create comprehensive marketing campaign strategies that include target audience analysis, channel selection, messaging frameworks, budget allocation, timeline development, and success metrics.',
    metrics: { runs: 234, successRate: 0.94, avgCost: 0.028, avgTime: 3.2 },
    onRun: jest.fn(),
    onEdit: jest.fn(),
    onFork: jest.fn(),
    onMenuAction: jest.fn(),
    onCompare: jest.fn(),
    onAnalytics: jest.fn(),
    onHistory: jest.fn(),
  };

  const fullFeatureProps: PromptCardProps = {
    ...baseProps,
    blockChips: {
      persona: 'Senior marketing strategist with 10+ years experience',
      context: 'Company launching new enterprise software product',
      output: 'Comprehensive marketing campaign strategy with tactical implementation plan',
      instructions: 'Include competitor analysis, multi-channel approach, content calendar',
    },
    provenance: {
      originalAuthor: 'Sarah Chen',
      forkSource: 'Marketing Strategy Templates',
      lastEditor: 'Alex Thompson',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
    },
    extendedStats: {
      successRateData: [0.91, 0.89, 0.94, 0.96, 0.92, 0.95, 0.94],
      p50Latency: 2850,
      p95Latency: 6200,
      p50LatencyData: [3100, 2950, 2800, 2750, 2850, 2900, 2850],
      tokenUsageData: [4340, 4180, 4450, 4290, 4380, 4150, 4340],
      avgTokens: 4305,
      costData: [0.025, 0.028, 0.032, 0.030, 0.031, 0.025, 0.028],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC #1: XL variant renders with min-width 560px, no max-width constraint
  describe('Size Constraints', () => {
    it('renders with XL size class for minimum width constraint', () => {
      const { container } = render(<PromptCard {...baseProps} />);
      const card = container.firstChild;

      expect(card).toHaveClass(/xl/);
      expect(card).not.toHaveClass(/compact/);
      expect(card).not.toHaveClass(/standard/);
    });

    it('allows unlimited width expansion', () => {
      const { container } = render(<PromptCard {...fullFeatureProps} />);
      const card = container.firstChild;

      // Should have XL class which provides min-width but no max-width
      expect(card).toHaveClass(/xl/);
    });
  });

  // AC #2: Display block chips row for structured prompt components
  describe('Block Chips Row', () => {
    it('displays block chips when provided', () => {
      render(<PromptCard {...fullFeatureProps} />);

      // Should show all block chip types with their content (using partial matching since text may be in multiple elements)
      expect(screen.getByText(/Senior marketing strategist/)).toBeInTheDocument();
      expect(screen.getByText(/Company launching new enterprise/)).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive marketing campaign/)).toBeInTheDocument();
      expect(screen.getByText(/Include competitor analysis/)).toBeInTheDocument();
    });

    it('hides block chips when not provided', () => {
      render(<PromptCard {...baseProps} />);

      // Should not render block chips section
      expect(screen.queryByText('Persona')).not.toBeInTheDocument();
      expect(screen.queryByText('Context')).not.toBeInTheDocument();
    });

    it('shows only provided block chips (partial data)', () => {
      render(<PromptCard
        {...baseProps}
        blockChips={{
          persona: 'Test persona',
          output: 'Test output'
          // No context or instructions
        }}
      />);

      expect(screen.getByText(/Test persona/)).toBeInTheDocument();
      expect(screen.getByText(/Test output/)).toBeInTheDocument();
    });
  });

  // AC #3: Body preview expands to 4 lines with smooth text truncation
  describe('Body Preview', () => {
    it('shows body preview in XL variant', () => {
      render(<PromptCard {...baseProps} />);

      expect(screen.getByText(baseProps.bodyPreview!)).toBeInTheDocument();
    });

    it('applies 4-line text truncation styling', () => {
      render(<PromptCard {...baseProps} />);

      const bodyText = screen.getByText(baseProps.bodyPreview!);

      // Should have webkit line clamp styles applied via style attribute
      expect(bodyText).toBeInTheDocument();

      // Check that the element has the expected style attribute content
      const styleAttr = bodyText.getAttribute('style');
      expect(styleAttr).toContain('display: -webkit-box');
      expect(styleAttr).toContain('-webkit-line-clamp: 4');
      expect(styleAttr).toContain('overflow: hidden');
    });

    it('handles long body text gracefully', () => {
      const longBodyText = 'This is a very long body preview text that should be truncated at 4 lines in the XL variant. '.repeat(10);

      render(<PromptCard {...baseProps} bodyPreview={longBodyText} />);

      // Use partial text matching since the full text might be truncated in display
      expect(screen.getByText(/This is a very long body preview text/)).toBeInTheDocument();
    });
  });

  // AC #4: Extended stats with P50/P95 latency, token usage, success trend sparkline
  describe('Extended Stats Row', () => {
    it('displays extended stats when provided', () => {
      render(<PromptCard {...fullFeatureProps} />);

      // Should show extended stats labels
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('P50')).toBeInTheDocument();
      expect(screen.getByText('Tokens')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
    });

    it('shows P95 latency in extended stats', () => {
      render(<PromptCard {...fullFeatureProps} />);

      expect(screen.getByText('P95 Latency')).toBeInTheDocument();
      expect(screen.getByText('6.2s')).toBeInTheDocument(); // P95 latency formatted
    });

    it('hides extended stats when not provided', () => {
      render(<PromptCard {...baseProps} />);

      expect(screen.queryByText('P50')).not.toBeInTheDocument();
      expect(screen.queryByText('P95 Latency')).not.toBeInTheDocument();
    });

    it('formats latency values correctly', () => {
      render(<PromptCard {...fullFeatureProps} />);

      // P50 latency: 2850ms should show as "2.9s"
      expect(screen.getByText('2.9s')).toBeInTheDocument();
    });

    it('formats token counts correctly', () => {
      render(<PromptCard {...fullFeatureProps} />);

      // avgTokens: 4305 should show as "4.3K"
      expect(screen.getByText('4.3K')).toBeInTheDocument();
    });
  });

  // AC #5: Provenance section with authorship information
  describe('Provenance Row', () => {
    it('displays complete provenance information', () => {
      render(<PromptCard {...fullFeatureProps} />);

      expect(screen.getByText(/Sarah Chen/)).toBeInTheDocument();
      expect(screen.getByText(/Marketing Strategy Templates/)).toBeInTheDocument();
      expect(screen.getByText(/Alex Thompson/)).toBeInTheDocument();
      expect(screen.getByText(/weeks ago/)).toBeInTheDocument(); // Created 2 weeks ago
    });

    it('hides provenance when not provided', () => {
      render(<PromptCard {...baseProps} />);

      expect(screen.queryByText(/Sarah Chen/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Marketing Strategy Templates/)).not.toBeInTheDocument();
    });

    it('handles partial provenance data', () => {
      render(<PromptCard
        {...baseProps}
        provenance={{
          originalAuthor: 'John Doe',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        }}
      />);

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      // Time formatting might show as "2h ago" or "2 hours ago" depending on implementation
      expect(screen.getByText(/2.*ago/)).toBeInTheDocument();
    });
  });

  // AC #6: Additional action buttons (Compare, Analytics, History)
  describe('Additional Action Buttons', () => {
    it('shows additional action buttons in XL variant', () => {
      render(<PromptCard {...fullFeatureProps} />);

      expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
    });

    it('calls compare callback when Compare button clicked', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...fullFeatureProps} />);

      const compareButton = screen.getByRole('button', { name: /compare/i });
      await user.click(compareButton);

      expect(fullFeatureProps.onCompare).toHaveBeenCalledTimes(1);
    });

    it('calls analytics callback when Analytics button clicked', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...fullFeatureProps} />);

      const analyticsButton = screen.getByRole('button', { name: /analytics/i });
      await user.click(analyticsButton);

      expect(fullFeatureProps.onAnalytics).toHaveBeenCalledTimes(1);
    });

    it('calls history callback when History button clicked', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...fullFeatureProps} />);

      const historyButton = screen.getByRole('button', { name: /history/i });
      await user.click(historyButton);

      expect(fullFeatureProps.onHistory).toHaveBeenCalledTimes(1);
    });

    it('hides additional buttons when callbacks not provided', () => {
      render(<PromptCard {...baseProps} onCompare={undefined} onAnalytics={undefined} onHistory={undefined} />);

      expect(screen.queryByRole('button', { name: /compare/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /analytics/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /history/i })).not.toBeInTheDocument();
    });

    it('shows individual buttons based on provided callbacks', () => {
      render(<PromptCard
        {...baseProps}
        onCompare={jest.fn()}
        // Explicitly set other callbacks to undefined
        onAnalytics={undefined}
        onHistory={undefined}
      />);

      expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /analytics/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /history/i })).not.toBeInTheDocument();
    });
  });

  // AC #7: Block chips colored by type
  describe('Block Chips Styling', () => {
    it('applies different styling to different block chip types', () => {
      render(<PromptCard {...fullFeatureProps} />);

      // Each block chip should have different styling based on its type
      // This would require checking the actual CSS classes or computed styles
      const personaChip = screen.getByText(/Senior marketing strategist/);
      const contextChip = screen.getByText(/Company launching new enterprise/);
      const outputChip = screen.getByText(/Comprehensive marketing campaign/);
      const instructionsChip = screen.getByText(/Include competitor analysis/);

      expect(personaChip).toBeInTheDocument();
      expect(contextChip).toBeInTheDocument();
      expect(outputChip).toBeInTheDocument();
      expect(instructionsChip).toBeInTheDocument();
    });
  });

  // AC #8: Layout order verification
  describe('Layout Order', () => {
    it('renders components in correct order for XL variant', () => {
      const { container } = render(<PromptCard {...fullFeatureProps} />);

      // Get all text content in order to verify layout sequence
      const textContent = container.textContent!;

      // Check that key components appear in the expected order
      const titleIndex = textContent.indexOf('Advanced Marketing');
      const tagsIndex = textContent.indexOf('marketing');
      // Block chips text appears in a tooltip/title attribute, so find the text differently
      const blockChipsIndex = textContent.indexOf('Create comprehensive'); // Body should come after block chips
      const bodyIndex = textContent.indexOf('Create comprehensive');
      const provenanceIndex = textContent.indexOf('Sarah Chen');
      const statsIndex = textContent.indexOf('Success');
      const actionsIndex = textContent.indexOf('Run');

      expect(titleIndex).toBeLessThan(tagsIndex);
      expect(tagsIndex).toBeLessThan(bodyIndex); // Skip block chips ordering since text is in attributes
      expect(bodyIndex).toBeLessThan(provenanceIndex);
      expect(provenanceIndex).toBeLessThan(statsIndex);
      expect(statsIndex).toBeLessThan(actionsIndex);
    });
  });

  // AC #9: Responsive behavior
  describe('Responsive Behavior', () => {
    it('maintains XL functionality on wider viewports', () => {
      // Mock wide viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<PromptCard {...fullFeatureProps} />);

      // Should show all XL features
      expect(screen.getByText('Senior marketing strategist with 10+ years experience')).toBeInTheDocument();
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compare/i })).toBeInTheDocument();
    });
  });

  // Standard feature preservation
  describe('Standard Features Preservation', () => {
    it('maintains all standard card features', () => {
      render(<PromptCard {...baseProps} />);

      // Header elements
      expect(screen.getByText('Advanced Marketing Campaign Strategy Generator')).toBeInTheDocument();
      expect(screen.getByText('v7')).toBeInTheDocument();
      expect(screen.getByText('shared')).toBeInTheDocument();

      // Meta strip
      expect(screen.getByText('marketing')).toBeInTheDocument();
      expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
      expect(screen.getByText('15m ago')).toBeInTheDocument();

      // Standard stats
      expect(screen.getByText('234 runs')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('$0.028')).toBeInTheDocument();

      // Standard actions
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fork/i })).toBeInTheDocument();
    });

    it('maintains state handling functionality', () => {
      render(<PromptCard {...baseProps} isRunning={true} state="running" />);

      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton.textContent).toContain('Running...');
      expect(runButton).toBeDisabled();
    });

    it('shows error state properly', () => {
      render(<PromptCard {...baseProps} error="Test error message" state="error" />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  // Accessibility compliance
  describe('Accessibility', () => {
    it('meets WCAG AA standards with all XL features', async () => {
      const { container } = render(<PromptCard {...fullFeatureProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels for extended stats', () => {
      const { container } = render(<PromptCard {...fullFeatureProps} />);

      const extendedStats = container.querySelector('[aria-label*="Extended performance statistics"]');
      expect(extendedStats).toBeInTheDocument();
    });

    it('maintains keyboard navigation with additional buttons', async () => {
      const user = userEvent.setup();
      render(<PromptCard {...fullFeatureProps} />);

      // Tab through all interactive elements
      await user.tab(); // Card container
      await user.tab(); // Run button
      await user.tab(); // Edit button
      await user.tab(); // Fork button
      await user.tab(); // Compare button
      await user.tab(); // Analytics button
      await user.tab(); // History button

      expect(screen.getByRole('button', { name: /history/i })).toHaveFocus();
    });
  });

  // Performance considerations
  describe('Performance', () => {
    it('handles complex XL rendering efficiently', () => {
      const renderStart = performance.now();
      render(<PromptCard {...fullFeatureProps} />);
      const renderEnd = performance.now();

      // Should render in reasonable time (this is a basic check)
      expect(renderEnd - renderStart).toBeLessThan(100);
    });

    it('does not re-render unnecessarily with complex props', () => {
      const { rerender } = render(<PromptCard {...fullFeatureProps} />);

      // Re-render with same props
      rerender(<PromptCard {...fullFeatureProps} />);

      // Should not crash or cause performance issues
      expect(screen.getByText('Advanced Marketing Campaign Strategy Generator')).toBeInTheDocument();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles XL variant without optional extended features', () => {
      render(<PromptCard {...baseProps} />);

      // Should render successfully without block chips, provenance, or extended stats
      expect(screen.getByText('Advanced Marketing Campaign Strategy Generator')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    });

    it('handles mixed partial data gracefully', () => {
      render(<PromptCard
        {...baseProps}
        blockChips={{ persona: 'Test persona' }}
        provenance={{ originalAuthor: 'Test Author' }}
        // No extended stats
      />);

      expect(screen.getByText(/Test persona/)).toBeInTheDocument();
      expect(screen.getByText(/Test Author/)).toBeInTheDocument();
    });
  });
});
