import * as React from 'react';
import { Badge } from '../../Badge';
import { Tooltip } from '../../Tooltip';
import { cn } from '../../../lib/utils';
import type { ComplicationProps } from '../../../complications/types';

/**
 * Supported AI providers
 */
export type Provider = 'openai' | 'anthropic' | 'google' | 'meta' | 'cohere' | 'custom';

/**
 * Provider configuration with branding
 */
interface ProviderConfig {
  /** Display name */
  name: string;
  /** Short abbreviation for compact display */
  abbreviation: string;
  /** Brand color (CSS color value) */
  color: string;
  /** Full description for tooltip */
  description: string;
}

/**
 * Provider configurations with brand colors
 */
const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    abbreviation: 'OAI',
    color: '#10A37F',
    description: 'OpenAI GPT models',
  },
  anthropic: {
    name: 'Anthropic',
    abbreviation: 'ANT',
    color: '#D4A373',
    description: 'Anthropic Claude models',
  },
  google: {
    name: 'Google',
    abbreviation: 'GOO',
    color: '#4285F4',
    description: 'Google Gemini models',
  },
  meta: {
    name: 'Meta',
    abbreviation: 'MTA',
    color: '#0668E1',
    description: 'Meta Llama models',
  },
  cohere: {
    name: 'Cohere',
    abbreviation: 'COH',
    color: '#39594D',
    description: 'Cohere Command models',
  },
  custom: {
    name: 'Custom',
    abbreviation: 'CUS',
    color: 'var(--mp-color-secondary)',
    description: 'Custom or unknown provider',
  },
};

export interface ProviderBadgeProps extends ComplicationProps {
  /** The AI provider */
  provider: Provider;
  /** Optional model name to display in tooltip */
  modelName?: string;
  /** Optional callback when badge is clicked */
  onClick?: () => void;
}

/**
 * ProviderBadge - Display AI provider branding as a complication
 *
 * Designed for the topLeft slot to show which AI provider this prompt uses.
 * Uses brand colors and abbreviations, with responsive sizing based on card size.
 *
 * @example
 * ```tsx
 * <PromptCard
 *   complications={{
 *     topLeft: {
 *       component: ProviderBadge,
 *       provider: 'anthropic',
 *       modelName: 'claude-3-5-sonnet'
 *     }
 *   }}
 * />
 * ```
 */
export function ProviderBadge({
  provider,
  modelName,
  onClick,
  cardSize,
  slot,
  isVisible,
  className,
  'aria-label': ariaLabel,
  ...complicationProps
}: ProviderBadgeProps) {
  if (!isVisible) return null;

  const config = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.custom;

  // Size adjustments based on card size
  const isCompact = cardSize === 'compact';
  const isXL = cardSize === 'xl';

  const badgeClasses = cn(
    'font-bold uppercase tracking-wide transition-all overflow-hidden text-ellipsis whitespace-nowrap',
    isCompact ? 'px-1.5 py-0.5 text-[10px] max-w-[60px]' : isXL ? 'px-3 py-1 text-xs max-w-[140px]' : 'px-2 py-0.5 text-[11px] max-w-[120px]',
    onClick && 'cursor-pointer hover:opacity-80',
    className
  );

  const displayText = isCompact ? config.abbreviation : config.name;

  const tooltipContent = (
    <div className="text-left">
      <div className="font-medium">{config.name}</div>
      <div className="text-xs opacity-90 mt-1">{config.description}</div>
      {modelName && (
        <div className="text-xs opacity-75 mt-1 font-mono">
          Model: {modelName}
        </div>
      )}
    </div>
  );

  const handleClick = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const badgeElement = (
    <Badge
      variant="secondary"
      className={badgeClasses}
      style={{
        backgroundColor: config.color,
        color: 'white',
        borderColor: config.color,
      }}
      aria-label={ariaLabel || `${config.name} provider${modelName ? `, model: ${modelName}` : ''}`}
    >
      {displayText}
    </Badge>
  );

  const interactiveBadge = onClick ? (
    <button
      type="button"
      onClick={handleClick}
      className="focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary rounded-md"
      aria-label={`${config.name} provider. Click for details.`}
    >
      {badgeElement}
    </button>
  ) : (
    badgeElement
  );

  return (
    <div
      className={cn(
        "flex-shrink-0 overflow-hidden",
        isCompact ? "max-w-[60px]" : isXL ? "max-w-[140px]" : "max-w-[120px]"
      )}
      data-testid={`provider-badge-${provider}`}
      data-slot={slot}
      title={`${config.name}${modelName ? ` - ${modelName}` : ''}`}
    >
      <Tooltip
        content={tooltipContent}
        side="bottom"
        align="start"
        delayDuration={300}
      >
        {interactiveBadge}
      </Tooltip>
    </div>
  );
}

ProviderBadge.displayName = 'ProviderBadge';
