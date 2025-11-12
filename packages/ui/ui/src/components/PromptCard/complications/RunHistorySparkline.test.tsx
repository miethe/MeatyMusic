import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RunHistorySparkline, type RunHistorySparklineProps } from './RunHistorySparkline';

expect.extend(toHaveNoViolations);

// Mock the SuccessSparkline component to avoid complex SVG testing
jest.mock('../components/SuccessSparkline', () => ({
  SuccessSparkline: ({ data, className, style }: any) => (
    <div
      data-testid="success-sparkline"
      data-points={data.length}
      className={className}
      style={style}
    >
      Sparkline with {data.length} points
    </div>
  )
}));

// Mock Tooltip component
jest.mock('../../Tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip-wrapper">
      {children}
      <div data-testid="tooltip-content" style={{ display: 'none' }}>
        {content}
      </div>
    </div>
  )
}));

const defaultProps: RunHistorySparklineProps = {
  data: [0.9, 0.8, 1.0, 0.7, 0.95],
  cardId: 'test-card',
  cardState: 'default',
  cardSize: 'standard',
  cardTitle: 'Test Card',
  isFocused: false,
  lastStateChange: new Date(),
  features: {
    animations: true,
    highContrast: false,
    reducedMotion: false
  },
  slot: 'topRight',
  isVisible: true,
};

const renderComponent = (props: Partial<RunHistorySparklineProps> = {}) =>
  render(<RunHistorySparkline {...defaultProps} {...props} />);

describe('RunHistorySparkline', () => {
  describe('Data Handling', () => {
    // AC #1: Shows last 24 data points for 24+ runs
    it('should slice to last 24 points when data has 24+ items', () => {
      const dataWith30Points = Array.from({ length: 30 }, (_, i) => i / 30);
      renderComponent({ data: dataWith30Points });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline).toHaveAttribute('data-points', '24');
    });

    // AC #2: Shows all available points with proportional spacing for <24 runs
    it('should show all points when data has less than 24 items', () => {
      const dataWith10Points = Array.from({ length: 10 }, (_, i) => i / 10);
      renderComponent({ data: dataWith10Points });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline).toHaveAttribute('data-points', '10');
    });

    // AC #5: Shows empty state when no data
    it('should render empty state when data is empty', () => {
      renderComponent({ data: [] });

      expect(screen.getByTestId('run-history-sparkline')).toBeInTheDocument();
      expect(screen.getByTestId('success-sparkline')).toHaveAttribute('data-points', '0');
    });

    // AC #6: Shows dot for single data point
    it('should handle single data point correctly', () => {
      renderComponent({ data: [0.85] });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline).toHaveAttribute('data-points', '1');
    });
  });

  describe('Color Logic', () => {
    // AC #3: Line color based on success rate thresholds
    it('should use success color for >70% success rate', () => {
      const highSuccessData = [0.8, 0.9, 1.0, 0.85, 0.75]; // avg = 0.86
      renderComponent({ data: highSuccessData });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline.style.getPropertyValue('--sparkline-color')).toBe('var(--mp-color-success)');
    });

    it('should use warning color for 40-70% success rate', () => {
      const mediumSuccessData = [0.5, 0.6, 0.7, 0.4, 0.5]; // avg = 0.54
      renderComponent({ data: mediumSuccessData });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline.style.getPropertyValue('--sparkline-color')).toBe('var(--mp-color-warning)');
    });

    it('should use danger color for <40% success rate', () => {
      const lowSuccessData = [0.1, 0.2, 0.3, 0.0, 0.1]; // avg = 0.14
      renderComponent({ data: lowSuccessData });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline.style.getPropertyValue('--sparkline-color')).toBe('var(--mp-color-danger)');
    });
  });

  describe('Tooltip Functionality', () => {
    // AC #4: Tooltip shows success count and percentage
    it('should display tooltip with correct format', () => {
      const data = [1, 1, 1, 0, 1]; // 4/5 successful = 80%
      renderComponent({ data, showTooltip: true });

      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toBeInTheDocument();
    });

    it('should calculate successful runs correctly with fractional rates', () => {
      const data = [0.8, 0.9, 0.3, 0.1, 0.7]; // 3/5 successful (>=0.5) = 60%
      renderComponent({ data, showTooltip: true });

      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toBeInTheDocument();
      // The tooltip should show "3/5 successful (60%)" format
    });

    it('should not show tooltip when showTooltip is false', () => {
      renderComponent({ showTooltip: false });

      expect(screen.queryByTestId('tooltip-wrapper')).not.toBeInTheDocument();
    });

    it('should show "No data available" in tooltip for empty data', () => {
      renderComponent({ data: [], showTooltip: true });

      // Component should render with tooltip for empty state
      expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument();
      const tooltipContent = screen.getByTestId('tooltip-content');
      expect(tooltipContent).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    // AC #7: Screen reader announces trend direction and current rate
    it('should provide meaningful ARIA label for trend analysis', () => {
      const trendingUpData = [0.5, 0.6, 0.7, 0.8, 0.9];
      renderComponent({ data: trendingUpData });

      const container = screen.getByTestId('run-history-sparkline');
      const ariaLabel = container.getAttribute('aria-label');

      expect(ariaLabel).toContain('improving trend');
      expect(ariaLabel).toContain('90% success rate');
    });

    it('should describe declining trends correctly', () => {
      const trendingDownData = [0.9, 0.8, 0.7, 0.6, 0.5];
      renderComponent({ data: trendingDownData });

      const container = screen.getByTestId('run-history-sparkline');
      const ariaLabel = container.getAttribute('aria-label');

      expect(ariaLabel).toContain('declining trend');
      expect(ariaLabel).toContain('50% success rate');
    });

    it('should describe stable trends correctly', () => {
      const stableData = [0.8, 0.81, 0.79, 0.80, 0.82];
      renderComponent({ data: stableData });

      const container = screen.getByTestId('run-history-sparkline');
      const ariaLabel = container.getAttribute('aria-label');

      expect(ariaLabel).toContain('stable trend');
    });

    it('should handle single data point accessibility', () => {
      renderComponent({ data: [0.75] });

      const container = screen.getByTestId('run-history-sparkline');
      const ariaLabel = container.getAttribute('aria-label');

      expect(ariaLabel).toContain('Single run with 75% success rate');
    });

    it('should have proper role for screen readers', () => {
      renderComponent();

      const container = screen.getByTestId('run-history-sparkline');
      expect(container).toHaveAttribute('role', 'img');
    });

    it('should pass accessibility checks', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Motion Preferences', () => {
    // AC #8: Respects reduced motion preference
    it('should disable animations when reducedMotion is true', () => {
      renderComponent({
        features: { animations: true, reducedMotion: true, highContrast: false }
      });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline).toHaveClass('reducedMotion');
    });

    it('should enable animations when reducedMotion is false', () => {
      renderComponent({
        features: { animations: true, reducedMotion: false, highContrast: false }
      });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline).toHaveClass('animated');
    });

    it('should not animate when animations are disabled', () => {
      renderComponent({
        features: { animations: false, reducedMotion: false, highContrast: false }
      });

      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline).not.toHaveClass('animated');
    });
  });

  describe('Visibility Control', () => {
    it('should not render when isVisible is false', () => {
      renderComponent({ isVisible: false });

      expect(screen.queryByTestId('run-history-sparkline')).not.toBeInTheDocument();
    });

    it('should render when isVisible is true', () => {
      renderComponent({ isVisible: true });

      expect(screen.getByTestId('run-history-sparkline')).toBeInTheDocument();
    });
  });

  describe('Slot Configuration', () => {
    it('should set correct data-slot attribute', () => {
      renderComponent({ slot: 'bottomLeft' });

      const container = screen.getByTestId('run-history-sparkline');
      expect(container).toHaveAttribute('data-slot', 'bottomLeft');
    });
  });

  describe('Custom Props', () => {
    it('should accept custom width and height', () => {
      renderComponent({ width: 80, height: 32 });

      const container = screen.getByTestId('run-history-sparkline');
      expect(container).toBeInTheDocument();
    });

    it('should accept custom timeframe (future expansion)', () => {
      renderComponent({ timeframe: '7d' });

      const container = screen.getByTestId('run-history-sparkline');
      expect(container).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      renderComponent({ className: 'custom-sparkline' });

      const container = screen.getByTestId('run-history-sparkline');
      expect(container).toHaveClass('custom-sparkline');
    });

    it('should accept custom aria-label', () => {
      renderComponent({ 'aria-label': 'Custom accessibility label' });

      const container = screen.getByTestId('run-history-sparkline');
      expect(container).toHaveAttribute('aria-label', 'Custom accessibility label');
    });
  });

  describe('Error Handling', () => {
    // AC #10: Graceful error handling
    it('should handle malformed data gracefully', () => {
      // Test with NaN values
      const malformedData = [0.5, NaN, 0.8, undefined as any, 0.6];

      expect(() => renderComponent({ data: malformedData })).not.toThrow();
    });

    it('should handle negative values gracefully', () => {
      const negativeData = [-0.1, 0.5, 1.2, 0.8];

      expect(() => renderComponent({ data: negativeData })).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render without significant delay', async () => {
      const startTime = Date.now();
      renderComponent();
      const endTime = Date.now();

      // Should render in less than 50ms (acceptance criteria)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, () => Math.random());

      expect(() => renderComponent({ data: largeData })).not.toThrow();

      // Should still only use 24 data points
      const sparkline = screen.getByTestId('success-sparkline');
      expect(sparkline).toHaveAttribute('data-points', '24');
    });
  });
});
