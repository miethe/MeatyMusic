/**
 * Enhanced Pricing Display Component - Phase 2 Models Integration
 *
 * This component provides comprehensive pricing visualization with tier indicators,
 * cost comparisons, and usage scenarios for AI models.
 *
 * Architecture:
 * - Uses @meaty/ui design system components
 * - Displays pricing tiers with visual indicators
 * - Shows cost per 1k tokens with breakdown
 * - Provides usage scenario cost estimates
 * - Includes comparison data visualization
 */

'use client';

import React from 'react';
import { Badge } from '../Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Separator } from '../Separator';
import { Tooltip } from '../Tooltip';
import { InfoIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from 'lucide-react';

// ===== TYPE DEFINITIONS =====

export interface PricingTierData {
  tier: 'free' | 'budget' | 'standard' | 'premium';
  tier_label: string;
  tier_color: string;
  cost_indicator: {
    level: string;
    display_cost: string;
    relative_position: number; // 0.0 to 1.0
  };
}

export interface CostBreakdown {
  input: number;
  output: number;
}

export interface UsageScenario {
  name: string;
  tokens: number;
  description: string;
  estimated_cost: number;
  cost_breakdown: {
    input_cost: number;
    output_cost: number;
    input_tokens: number;
    output_tokens: number;
  };
}

export interface CostComparison {
  tier: string;
  relative_cost: 'low' | 'medium' | 'high';
  percentile: number;
  similar_models_comparison: {
    cheaper_alternatives: number;
    more_expensive: number;
    total_compared: number;
  };
}

export interface PricingTrend {
  trend: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
  periods_analyzed: number;
  latest_effective_date: string;
}

export interface EnhancedPricingData {
  model_id: string;
  tier_visualization: PricingTierData;
  cost_per_1k_tokens: CostBreakdown;
  cost_comparison?: CostComparison;
  usage_scenarios?: UsageScenario[];
  pricing_trend?: PricingTrend;
  last_updated: string;
}

// ===== COMPONENT PROPS =====

export interface PricingDisplayProps {
  /** Enhanced pricing data from backend */
  pricingData: EnhancedPricingData;
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Show usage scenarios */
  showScenarios?: boolean;
  /** Show cost comparisons */
  showComparison?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

// ===== UTILITY FUNCTIONS =====

const formatCurrency = (amount: number): string => {
  if (amount === 0) return 'Free';
  if (amount < 0.001) return `<$0.001`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(3)}`;
};

const getTierBadgeVariant = (tier: string) => {
  switch (tier) {
    case 'free':
      return 'default'; // Green variant
    case 'budget':
      return 'secondary'; // Blue variant
    case 'standard':
      return 'outline'; // Amber variant
    case 'premium':
      return 'destructive'; // Red variant
    default:
      return 'outline';
  }
};

const getCostIndicatorColor = (position: number): string => {
  if (position <= 0.2) return '#10B981'; // Green
  if (position <= 0.5) return '#3B82F6'; // Blue
  if (position <= 0.8) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing':
      return <TrendingUpIcon className="h-4 w-4 text-red-500" />;
    case 'decreasing':
      return <TrendingDownIcon className="h-4 w-4 text-green-500" />;
    default:
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
  }
};

// ===== SUBCOMPONENTS =====

const TierIndicator: React.FC<{ tierData: PricingTierData }> = ({ tierData }) => (
  <div className="flex items-center gap-2">
    <Badge variant={getTierBadgeVariant(tierData.tier)} className="capitalize">
      {tierData.tier_label}
    </Badge>
    <div className="flex items-center gap-1">
      <div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: tierData.tier_color }}
        aria-label={`${tierData.tier_label} tier indicator`}
      />
      <span className="text-sm font-medium">{tierData.cost_indicator.display_cost}</span>
    </div>
  </div>
);

const CostBreakdownDisplay: React.FC<{ breakdown: CostBreakdown }> = ({ breakdown }) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">Input tokens</div>
      <div className="font-mono text-sm">{formatCurrency(breakdown.input)}/1k</div>
    </div>
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">Output tokens</div>
      <div className="font-mono text-sm">{formatCurrency(breakdown.output)}/1k</div>
    </div>
  </div>
);

const UsageScenariosDisplay: React.FC<{ scenarios: UsageScenario[] }> = ({ scenarios }) => (
  <div className="space-y-3">
    <h4 className="font-medium text-sm">Usage Scenarios</h4>
    <div className="grid gap-2">
      {scenarios.slice(0, 3).map((scenario, index) => (
        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <div className="space-y-1">
            <div className="text-sm font-medium">{scenario.name}</div>
            <div className="text-xs text-muted-foreground">{scenario.description}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm">{formatCurrency(scenario.estimated_cost)}</div>
            <div className="text-xs text-muted-foreground">per month</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ComparisonDisplay: React.FC<{ comparison: CostComparison }> = ({ comparison }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Cost relative to similar models:</span>
      <Badge
        variant={
          comparison.relative_cost === 'low'
            ? 'default'
            : comparison.relative_cost === 'medium'
            ? 'secondary'
            : 'destructive'
        }
        className="capitalize"
      >
        {comparison.relative_cost}
      </Badge>
    </div>
    {comparison.similar_models_comparison.total_compared > 0 && (
      <div className="text-xs text-muted-foreground">
        Compared to {comparison.similar_models_comparison.total_compared} similar models
      </div>
    )}
  </div>
);

const TrendDisplay: React.FC<{ trend: PricingTrend }> = ({ trend }) => (
  <div className="flex items-center gap-2">
    {getTrendIcon(trend.trend)}
    <div className="space-y-0">
      <div className="text-sm capitalize">{trend.trend}</div>
      {trend.change_percentage !== 0 && (
        <div className="text-xs text-muted-foreground">
          {trend.change_percentage > 0 ? '+' : ''}{trend.change_percentage.toFixed(1)}%
        </div>
      )}
    </div>
  </div>
);

// ===== MAIN COMPONENT =====

export const PricingDisplay: React.FC<PricingDisplayProps> = ({
  pricingData,
  showDetails = true,
  showScenarios = true,
  showComparison = true,
  compact = false,
  className = '',
}) => {
  const {
    tier_visualization,
    cost_per_1k_tokens,
    cost_comparison,
    usage_scenarios,
    pricing_trend,
  } = pricingData;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <TierIndicator tierData={tier_visualization} />
        {pricing_trend && (
          <Tooltip content={
            `Pricing trend: ${pricing_trend.trend}${pricing_trend.change_percentage !== 0
              ? ` (${pricing_trend.change_percentage > 0 ? '+' : ''}${pricing_trend.change_percentage.toFixed(1)}% change)`
              : ''
            }`
          }>
            {getTrendIcon(pricing_trend.trend)}
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span>Pricing</span>
          <Tooltip content="Pricing information is updated regularly and may vary by region and usage volume.">
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </Tooltip>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tier and Cost Overview */}
        <div className="space-y-3">
          <TierIndicator tierData={tier_visualization} />

          {showDetails && (
            <CostBreakdownDisplay breakdown={cost_per_1k_tokens} />
          )}
        </div>

        {/* Cost Comparison */}
        {showComparison && cost_comparison && (
          <>
            <Separator />
            <ComparisonDisplay comparison={cost_comparison} />
          </>
        )}

        {/* Pricing Trend */}
        {pricing_trend && pricing_trend.trend !== 'stable' && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Trend</h4>
              <TrendDisplay trend={pricing_trend} />
            </div>
          </>
        )}

        {/* Usage Scenarios */}
        {showScenarios && usage_scenarios && usage_scenarios.length > 0 && (
          <>
            <Separator />
            <UsageScenariosDisplay scenarios={usage_scenarios} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ===== EXPORT =====

export default PricingDisplay;
