/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CostLatencyStat, type CostLatencyStatProps } from './CostLatencyStat';
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

const defaultProps: CostLatencyStatProps = {
  ...mockComplicationProps,
  slot: 'bottomLeft',
};

describe('CostLatencyStat', () => {
  describe('Cost Formatting (AC1)', () => {
    it('shows formatted cost with $ symbol and 3 decimal places', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 234,  // 234 cents = $2.34
            min: 180,
            max: 450,
            currency: 'USD',
          }}
        />
      );

      expect(screen.getByText('$2.340')).toBeInTheDocument();
    });

    it('shows EUR symbol for EUR currency', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
            currency: 'EUR',
          }}
        />
      );

      expect(screen.getByText('€2.340')).toBeInTheDocument();
    });

    it('shows GBP symbol for GBP currency', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
            currency: 'GBP',
          }}
        />
      );

      expect(screen.getByText('£2.340')).toBeInTheDocument();
    });

    it('shows "<$0.001" for costs less than $0.001 (AC10)', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 0.09,  // 0.09 cents = $0.0009
            min: 0.05,
            max: 0.15,
            currency: 'USD',
          }}
        />
      );

      expect(screen.getByText('<$0.001')).toBeInTheDocument();
    });
  });

  describe('Latency Formatting (AC2, AC6)', () => {
    it('shows P50 value with "ms" unit when < 1000ms', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 100,
          }}
        />
      );

      expect(screen.getByText('750ms')).toBeInTheDocument();
    });

    it('shows latency as seconds when >= 1000ms (AC6)', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          latency={{
            p50: 1250,
            p95: 2100,
            samples: 100,
          }}
        />
      );

      expect(screen.getByText('1.3s')).toBeInTheDocument();
    });

    it('rounds milliseconds properly', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          latency={{
            p50: 567,
            p95: 890,
            samples: 100,
          }}
        />
      );

      expect(screen.getByText('567ms')).toBeInTheDocument();
    });
  });

  describe('Null Data Handling (AC5)', () => {
    it('hides component when no data is available', () => {
      const { container } = render(
        <CostLatencyStat {...defaultProps} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows only cost pill when latency is null', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
        />
      );

      expect(screen.getByText('$2.340')).toBeInTheDocument();
      expect(screen.queryByText(/ms|s$/)).not.toBeInTheDocument();
    });

    it('shows only latency pill when cost is null', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 100,
          }}
        />
      );

      expect(screen.getByText('750ms')).toBeInTheDocument();
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });
  });

  describe('Size-Aware Rendering (AC7)', () => {
    it('shows only primary metric in compact card size', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cardSize="compact"
          primaryMetric="cost"
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 100,
          }}
        />
      );

      // Should only show cost
      expect(screen.getByText('$2.340')).toBeInTheDocument();
      expect(screen.queryByText('750ms')).not.toBeInTheDocument();
    });

    it('shows both metrics in standard card size', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cardSize="standard"
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 100,
          }}
        />
      );

      // Should show both metrics
      expect(screen.getByText('$2.340')).toBeInTheDocument();
      expect(screen.getByText('750ms')).toBeInTheDocument();
    });

    it('respects primaryMetric prop in compact mode', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cardSize="compact"
          primaryMetric="latency"
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 100,
          }}
        />
      );

      // Should only show latency when it's the primary metric
      expect(screen.queryByText('$2.340')).not.toBeInTheDocument();
      expect(screen.getByText('750ms')).toBeInTheDocument();
    });

    it('respects explicit size prop over cardSize', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cardSize="standard"
          size="compact"
          primaryMetric="cost"
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 100,
          }}
        />
      );

      // Should only show cost due to explicit compact size
      expect(screen.getByText('$2.340')).toBeInTheDocument();
      expect(screen.queryByText('750ms')).not.toBeInTheDocument();
    });
  });

  describe('Visibility Control', () => {
    it('does not render when isVisible is false', () => {
      const { container } = render(
        <CostLatencyStat
          {...defaultProps}
          isVisible={false}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when isVisible is true', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          isVisible={true}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
        />
      );

      expect(screen.getByTestId('cost-latency-stat')).toBeInTheDocument();
    });
  });

  describe('ARIA and Accessibility (AC8)', () => {
    it('provides proper ARIA labels for cost only', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
        />
      );

      expect(screen.getByRole('group', { name: 'Average cost $2.340' })).toBeInTheDocument();
    });

    it('provides proper ARIA labels for latency only', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 100,
          }}
        />
      );

      expect(screen.getByRole('group', { name: 'P50 latency 750ms' })).toBeInTheDocument();
    });

    it('provides proper ARIA labels for both metrics', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
          latency={{
            p50: 1250,
            p95: 2100,
            samples: 100,
          }}
        />
      );

      expect(screen.getByRole('group', { name: 'Average cost $2.340, P50 latency 1.3s' })).toBeInTheDocument();
    });

    it('uses custom aria-label when provided', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          aria-label="Custom performance metrics"
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
        />
      );

      expect(screen.getByRole('group', { name: 'Custom performance metrics' })).toBeInTheDocument();
    });

    it('passes accessibility audit', async () => {
      const { container } = render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 234,
            min: 180,
            max: 450,
            currency: 'USD',
          }}
          latency={{
            p50: 1250,
            p95: 2100,
            p99: 3500,
            samples: 1523,
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data Attributes', () => {
    it('includes proper data attributes for testing', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          slot="bottomLeft"
          cost={{
            avg: 234,
            min: 180,
            max: 450,
          }}
        />
      );

      const stat = screen.getByTestId('cost-latency-stat');
      expect(stat).toHaveAttribute('data-slot', 'bottomLeft');
    });
  });

  describe('Error Case (AC9)', () => {
    it('handles invalid numeric data gracefully', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: NaN,
            min: 180,
            max: 450,
          }}
        />
      );

      // Component should handle NaN by showing appropriate fallback
      const element = screen.getByTestId('cost-latency-stat');
      expect(element).toBeInTheDocument();
    });

    it('handles negative values', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: -100,
            min: -200,
            max: 0,
          }}
        />
      );

      expect(screen.getByText('<$0.001')).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('handles P99 value in latency data', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          latency={{
            p50: 750,
            p95: 1200,
            p99: 2500,
            samples: 500,
          }}
        />
      );

      // P99 should be available in tooltip but not shown in main display
      expect(screen.getByText('750ms')).toBeInTheDocument();
    });

    it('formats large sample counts correctly', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          latency={{
            p50: 750,
            p95: 1200,
            samples: 1523456,
          }}
        />
      );

      expect(screen.getByTestId('cost-latency-stat')).toBeInTheDocument();
    });

    it('handles zero values correctly', () => {
      render(
        <CostLatencyStat
          {...defaultProps}
          cost={{
            avg: 0,
            min: 0,
            max: 0,
          }}
        />
      );

      expect(screen.getByText('<$0.001')).toBeInTheDocument();
    });
  });
});
