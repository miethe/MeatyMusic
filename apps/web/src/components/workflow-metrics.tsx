/**
 * WorkflowMetrics Component
 * Visual score indicators for workflow validation metrics
 *
 * Features:
 * - Metrics: hook_density, singability, rhyme_tightness, section_completeness, profanity_score, total
 * - Color coding based on thresholds
 * - Visual progress bars with gradients
 * - Shows both current value and target/threshold
 * - Real-time updates via WebSocket
 *
 * P1.3 - Workflow Visualization
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@meatymusic/ui';
import type { ValidationScores } from '@/types/api';

export interface WorkflowMetricsProps {
  /** Validation scores from VALIDATE node */
  scores?: ValidationScores;
  /** Show detailed breakdown */
  detailed?: boolean;
  /** Additional class name */
  className?: string;
  /** Compact mode (smaller cards) */
  compact?: boolean;
}

/**
 * Metric configuration
 */
interface MetricConfig {
  key: keyof Omit<ValidationScores, 'total' | 'passed'>;
  label: string;
  description: string;
  threshold: number;
  maxValue: number;
}

const METRICS: MetricConfig[] = [
  {
    key: 'hook_density',
    label: 'Hook Density',
    description: 'Memorable hooks and melodic elements',
    threshold: 7,
    maxValue: 10,
  },
  {
    key: 'singability',
    label: 'Singability',
    description: 'Ease of singing and pronunciation',
    threshold: 7,
    maxValue: 10,
  },
  {
    key: 'rhyme_tightness',
    label: 'Rhyme Tightness',
    description: 'Quality and consistency of rhyme scheme',
    threshold: 7,
    maxValue: 10,
  },
  {
    key: 'section_completeness',
    label: 'Section Completeness',
    description: 'All required sections present',
    threshold: 8,
    maxValue: 10,
  },
  {
    key: 'profanity_score',
    label: 'Profanity Score',
    description: 'Adherence to content guidelines',
    threshold: 8,
    maxValue: 10,
  },
];

/**
 * Get color classes based on score value and threshold
 */
const getScoreColors = (value: number, threshold: number, maxValue: number) => {

  if (value < maxValue * 0.5) {
    return {
      gradient: 'from-accent-error via-accent-error to-accent-warning',
      text: 'text-accent-error',
      bg: 'bg-accent-error/10',
      border: 'border-accent-error',
    };
  }

  if (value < threshold) {
    return {
      gradient: 'from-accent-warning via-accent-warning to-accent-secondary',
      text: 'text-accent-warning',
      bg: 'bg-accent-warning/10',
      border: 'border-accent-warning',
    };
  }

  return {
    gradient: 'from-accent-secondary via-accent-success to-accent-success',
    text: 'text-accent-success',
    bg: 'bg-accent-success/10',
    border: 'border-accent-success',
  };
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  config: MetricConfig;
  value: number;
  compact?: boolean;
}> = ({ config, value, compact = false }) => {
  const colors = getScoreColors(value, config.threshold, config.maxValue);
  const percentage = (value / config.maxValue) * 100;

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all duration-200',
      'bg-background-secondary border-border/10',
      'hover:border-border/30 hover:shadow-sm'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className={cn(
            'font-semibold text-text-primary',
            compact ? 'text-sm' : 'text-base'
          )}>
            {config.label}
          </h4>
          {!compact && (
            <p className="text-xs text-text-tertiary mt-0.5">
              {config.description}
            </p>
          )}
        </div>

        {/* Score Value */}
        <div className={cn(
          'px-2 py-1 rounded-md border',
          colors.bg,
          colors.border,
          colors.text,
          'font-mono font-bold',
          compact ? 'text-sm' : 'text-base'
        )}>
          {value.toFixed(1)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-2 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              'absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-500',
              colors.gradient
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
          {/* Threshold Indicator */}
          <div
            className="absolute inset-y-0 w-0.5 bg-text-tertiary/40"
            style={{ left: `${(config.threshold / config.maxValue) * 100}%` }}
          />
        </div>

        {/* Threshold Label */}
        {!compact && (
          <div className="flex items-center justify-between text-[10px] text-text-tertiary">
            <span>0</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-text-tertiary/40" />
              Target: {config.threshold}
            </span>
            <span>{config.maxValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Overall Score Card
 */
const OverallScoreCard: React.FC<{
  total: number;
  passed: boolean;
  compact?: boolean;
}> = ({ total, passed, compact = false }) => {
  return (
    <div className={cn(
      'p-6 rounded-lg border-2 transition-all duration-200',
      'bg-background-secondary',
      passed
        ? 'border-accent-success bg-accent-success/5'
        : 'border-accent-error bg-accent-error/5'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={cn(
            'font-bold text-text-primary',
            compact ? 'text-lg' : 'text-2xl'
          )}>
            Overall Score
          </h3>
          {!compact && (
            <p className="text-sm text-text-secondary mt-1">
              Weighted average of all metrics
            </p>
          )}
        </div>

        <div className="text-right">
          <div className={cn(
            'font-mono font-bold',
            compact ? 'text-3xl' : 'text-4xl',
            passed ? 'text-accent-success' : 'text-accent-error'
          )}>
            {total.toFixed(2)}
          </div>
          <div className={cn(
            'mt-1 px-3 py-1 rounded-md inline-flex items-center gap-2 font-semibold',
            compact ? 'text-xs' : 'text-sm',
            passed
              ? 'bg-accent-success/20 text-accent-success border border-accent-success/30'
              : 'bg-accent-error/20 text-accent-error border border-accent-error/30'
          )}>
            {passed ? '✓ Pass' : '✗ Fail'}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * WorkflowMetrics Component
 *
 * Displays validation scores with visual indicators and color coding.
 *
 * @example
 * ```tsx
 * <WorkflowMetrics
 *   scores={{
 *     hook_density: 8.5,
 *     singability: 9.0,
 *     rhyme_tightness: 7.8,
 *     section_completeness: 10.0,
 *     profanity_score: 10.0,
 *     total: 9.06,
 *     passed: true,
 *   }}
 *   detailed
 * />
 * ```
 */
export const WorkflowMetrics: React.FC<WorkflowMetricsProps> = ({
  scores,
  detailed = false,
  className,
  compact = false,
}) => {
  if (!scores) {
    return (
      <Card className={cn('p-8', className)}>
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No Metrics Available
          </h3>
          <p className="text-sm text-text-secondary">
            Validation scores will appear here once the VALIDATE node completes
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Score */}
      <OverallScoreCard
        total={scores.total}
        passed={scores.passed}
        compact={compact}
      />

      {/* Individual Metrics */}
      <div className={cn(
        'grid gap-4',
        compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      )}>
        {METRICS.map((metric) => (
          <MetricCard
            key={metric.key}
            config={metric}
            value={scores[metric.key]}
            compact={compact}
          />
        ))}
      </div>

      {/* Detailed Info */}
      {detailed && (
        <div className="p-4 rounded-lg bg-background-tertiary/30 border border-border/10">
          <h4 className="text-sm font-semibold text-text-primary mb-2">
            Scoring Information
          </h4>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>• Scores range from 0 to 10, with 7+ typically passing individual metrics</li>
            <li>• Overall score is a weighted average of all individual metrics</li>
            <li>• Overall pass requires total score ≥ 7.0</li>
            <li>• Progress bars show score relative to maximum (10)</li>
            <li>• Vertical line indicates target threshold for each metric</li>
          </ul>
        </div>
      )}
    </div>
  );
};

WorkflowMetrics.displayName = 'WorkflowMetrics';
