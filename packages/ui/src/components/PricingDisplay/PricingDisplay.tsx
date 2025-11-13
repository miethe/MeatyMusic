import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../Card';
import { Badge } from '../Badge';

/**
 * Pricing tier information
 */
export interface PricingTier {
  id: string;
  pricing_tier: string;
  cost_per_token?: number | null;
  cost_per_request?: number | null;
  currency: string;
  effective_date?: string;
  expires_date?: string | null;
}

const pricingDisplayVariants = cva('space-y-3', {
  variants: {
    variant: {
      default: '',
      compact: 'space-y-2',
      detailed: 'space-y-4',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface PricingDisplayProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof pricingDisplayVariants> {
  /**
   * Array of pricing tiers to display
   */
  pricing: PricingTier[];

  /**
   * Whether to show the cost calculator
   * @default false
   */
  showCalculator?: boolean;

  /**
   * Whether to show all tiers or just the primary tier
   * @default false
   */
  showAllTiers?: boolean;

  /**
   * Optional comparison pricing to show price difference
   */
  comparisonPricing?: {
    cost_per_token?: number;
    label?: string;
  };
}

/**
 * Format cost per token to per 1K tokens for readability
 */
function formatCostPer1K(costPerToken: number | null | undefined): string {
  if (costPerToken == null) return 'N/A';
  return (costPerToken * 1000).toFixed(4);
}

/**
 * Calculate cost for a given number of tokens
 */
function calculateCost(
  tokens: number,
  costPerToken: number | null | undefined
): string {
  if (costPerToken == null) return 'N/A';
  return (tokens * costPerToken).toFixed(4);
}

/**
 * Simple cost calculator component
 */
function CostCalculator({
  costPerToken,
  currency,
}: {
  costPerToken: number | null | undefined;
  currency: string;
}) {
  const [tokens, setTokens] = React.useState<number>(1000);

  if (costPerToken == null) return null;

  const estimatedCost = calculateCost(tokens, costPerToken);

  return (
    <div className="rounded-lg border border-border bg-panel p-3 space-y-2">
      <label htmlFor="token-calculator" className="text-xs font-medium">
        Cost Calculator
      </label>
      <div className="flex items-center gap-2">
        <input
          id="token-calculator"
          type="number"
          min="1"
          step="1000"
          value={tokens}
          onChange={(e) => setTokens(Math.max(1, parseInt(e.target.value) || 1))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Number of tokens"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          tokens
        </span>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">Estimated cost: </span>
        <span className="font-semibold">
          {currency}
          {estimatedCost}
        </span>
      </div>
    </div>
  );
}

/**
 * PricingDisplay shows pricing information for a model
 *
 * Displays input/output token pricing, supports multiple pricing tiers,
 * and includes an optional cost calculator.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PricingDisplay pricing={model.pricing} />
 *
 * // With calculator
 * <PricingDisplay pricing={model.pricing} showCalculator />
 *
 * // Show all tiers
 * <PricingDisplay pricing={model.pricing} showAllTiers />
 *
 * // With comparison
 * <PricingDisplay
 *   pricing={model.pricing}
 *   comparisonPricing={{ cost_per_token: 0.0001, label: 'GPT-4' }}
 * />
 * ```
 *
 * @accessibility
 * - Uses semantic HTML with proper labels
 * - Calculator input has aria-label
 * - Color is not the only indicator of price differences
 * - Keyboard accessible
 */
export const PricingDisplay = React.forwardRef<
  HTMLDivElement,
  PricingDisplayProps
>(
  (
    {
      pricing,
      showCalculator = false,
      showAllTiers = false,
      comparisonPricing,
      variant,
      size,
      className,
      ...props
    },
    ref
  ) => {
    if (!pricing || pricing.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(pricingDisplayVariants({ variant, size }), className)}
          {...props}
        >
          <p className="text-sm text-muted-foreground">
            No pricing information available
          </p>
        </div>
      );
    }

    // Show primary tier or all tiers
    const tiersToDisplay = showAllTiers ? pricing : [pricing[0]];
    const primaryTier = pricing[0];

    // Calculate price difference if comparison provided
    const priceDifference =
      comparisonPricing?.cost_per_token && primaryTier?.cost_per_token
        ? ((primaryTier.cost_per_token - comparisonPricing.cost_per_token) /
            comparisonPricing.cost_per_token) *
          100
        : null;

    return (
      <div
        ref={ref}
        className={cn(pricingDisplayVariants({ variant, size }), className)}
        {...props}
      >
        {tiersToDisplay.map((tier, index) => (
          <Card key={tier?.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{tier?.pricing_tier}</span>
              </div>
              {index === 0 && pricing.length > 1 && (
                <Badge variant="outline" className="text-xs">
                  Primary
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Per 1K tokens:</span>
                <p className="font-medium">
                  {tier?.currency}
                  {formatCostPer1K(tier?.cost_per_token)}
                </p>
              </div>
              {tier?.cost_per_request != null && (
                <div>
                  <span className="text-muted-foreground">Per request:</span>
                  <p className="font-medium">
                    {tier?.currency}
                    {tier?.cost_per_request.toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            {comparisonPricing && index === 0 && priceDifference != null && (
              <div className="flex items-center gap-2 text-xs">
                {priceDifference > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-danger" />
                    <span className="text-danger">
                      {priceDifference.toFixed(1)}% more than{' '}
                      {comparisonPricing?.label || 'comparison'}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-success" />
                    <span className="text-success">
                      {Math.abs(priceDifference).toFixed(1)}% less than{' '}
                      {comparisonPricing?.label || 'comparison'}
                    </span>
                  </>
                )}
              </div>
            )}

            {tier?.effective_date && (
              <p className="text-xs text-muted-foreground">
                Effective: {new Date(tier.effective_date).toLocaleDateString()}
              </p>
            )}
          </Card>
        ))}

        {!showAllTiers && pricing.length > 1 && (
          <p className="text-xs text-muted-foreground">
            +{pricing.length - 1} more pricing tier(s) available
          </p>
        )}

        {showCalculator && (
          <CostCalculator
            costPerToken={primaryTier?.cost_per_token}
            currency={primaryTier?.currency ?? 'USD'}
          />
        )}
      </div>
    );
  }
);

PricingDisplay.displayName = 'PricingDisplay';
