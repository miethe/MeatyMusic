'use client';

import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import type { ProfanityCheckResult, ProfanityViolation } from '@/types/api/entities';

export interface ProfanityWarningsProps {
  result: ProfanityCheckResult | null;
  isLoading?: boolean;
  explicitAllowed?: boolean;
  onOverride?: () => void;
  className?: string;
}

const CATEGORY_CONFIG = {
  mild: {
    icon: Info,
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Mild',
  },
  moderate: {
    icon: AlertCircle,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'Moderate',
  },
  severe: {
    icon: XCircle,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Severe',
  },
} as const;

export function ProfanityWarnings({
  result,
  isLoading,
  explicitAllowed,
  onOverride,
  className = '',
}: ProfanityWarningsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={`rounded-lg border border-border-secondary bg-bg-elevated p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <span className="text-sm text-text-secondary">Checking for profanity...</span>
        </div>
      </div>
    );
  }

  // No result yet
  if (!result) {
    return null;
  }

  // Clean - no violations
  if (result.is_clean && result.violation_count === 0) {
    return (
      <div className={`rounded-lg border border-green-500/30 bg-green-500/10 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-green-400">No profanity detected</span>
        </div>
      </div>
    );
  }

  // Has violations
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary */}
      <div className="rounded-lg border border-border-accent bg-bg-elevated p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-accent-warning" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-text-primary">
              {result.violation_count} profanity {result.violation_count === 1 ? 'violation' : 'violations'} detected
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.categories_found.map((category) => {
                const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                if (!config) return null;

                return (
                  <span
                    key={category}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bgColor} ${config.borderColor} border`}
                  >
                    <config.icon className={`h-3 w-3 ${config.iconColor}`} />
                    {config.label}
                  </span>
                );
              })}
            </div>
            {result.total_score > 0 && (
              <p className="mt-2 text-xs text-text-secondary">
                Total score: <span className="font-semibold">{result.total_score.toFixed(2)}</span>
                {result.max_score > 0 && (
                  <>
                    {' '}
                    | Max: <span className="font-semibold">{result.max_score.toFixed(2)}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {explicitAllowed && onOverride && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-bg-base p-3">
            <Info className="h-4 w-4 text-accent-secondary" />
            <p className="flex-1 text-xs text-text-secondary">
              Explicit content is allowed, but violations are still shown for review.
            </p>
          </div>
        )}
      </div>

      {/* Individual violations */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Violations</h5>
        {result.violations.map((violation, index) => (
          <ViolationItem key={index} violation={violation} />
        ))}
      </div>
    </div>
  );
}

interface ViolationItemProps {
  violation: ProfanityViolation;
}

function ViolationItem({ violation }: ViolationItemProps) {
  const config = CATEGORY_CONFIG[violation.category as keyof typeof CATEGORY_CONFIG];

  if (!config) return null;

  return (
    <div
      className={`group rounded-lg border p-3 transition-colors ${config.bgColor} ${config.borderColor} hover:bg-opacity-20`}
    >
      <div className="flex items-start gap-3">
        <config.icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-sm font-semibold text-text-primary">&quot;{violation.word}&quot;</code>
            <span className={`text-xs font-medium ${config.iconColor}`}>{config.label}</span>
            {violation.line_number && (
              <span className="text-xs text-text-tertiary">Line {violation.line_number}</span>
            )}
          </div>
          {violation.context && (
            <p className="mt-1 text-xs text-text-secondary break-words">
              Context: <span className="italic">&quot;{violation.context}&quot;</span>
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-xs font-semibold text-text-tertiary">
          {violation.score.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
