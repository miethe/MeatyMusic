'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Star, Heart, BarChart3, ExternalLink, TrendingUp, Users } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';
import { Separator } from '../Separator';
import { ModelCardProps, ModelMetrics } from './types';
import {
  getModelDisplayName,
  getProviderFallback,
  getModelCapabilities,
  formatPrice,
  formatContextWindow,
  formatPerformanceLevel,
  getModelStatusBadgeVariant,
  getModelPriceTier
} from './utils';

const modelCardVariants = cva(
  'transition-all duration-ui cursor-pointer',
  {
    variants: {
      variant: {
        default: 'hover:shadow-elev3 hover:-translate-y-0.5 active:translate-y-0 active:shadow-elev2',
        compact: 'hover:shadow-elev2 hover:-translate-y-px active:translate-y-0',
        detailed: 'hover:shadow-elev4 hover:-translate-y-1 active:-translate-y-0.5 active:shadow-elev3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const ModelCard = React.forwardRef<HTMLDivElement, ModelCardProps>(
  ({
    model,
    variant = 'default',
    showActions = true,
    showMetrics = false,
    showSuggestions = false,
    onSelect,
    onFavorite,
    onCompare,
    className,
    ...props
  }, ref) => {
    const displayName = getModelDisplayName(model);
    const capabilities = getModelCapabilities(model);
    const statusVariant = getModelStatusBadgeVariant(model.status);
    const priceTier = getModelPriceTier(model);

    // Mock metrics and data - in a real implementation, these would come from props or API
    const metrics: ModelMetrics = React.useMemo(() => ({
      responseTime: Math.random() * 2000 + 500,
      uptime: Math.random() * 5 + 95,
      satisfactionScore: Math.random() * 2 + 3,
      usageCount: Math.floor(Math.random() * 10000),
      lastUsed: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    }), []);

    const [isFavorited, setIsFavorited] = React.useState(false);

    const handleFavorite = React.useCallback(() => {
      setIsFavorited(!isFavorited);
      if (onFavorite) {
        onFavorite();
      }
    }, [isFavorited, onFavorite]);

    const PerformanceIndicator = ({
      level,
      label
    }: {
      level: 'low' | 'medium' | 'high';
      label: string
    }) => {
      const { color } = formatPerformanceLevel(level);
      const dotColor = {
        success: 'bg-success',
        warning: 'bg-warning',
        destructive: 'bg-danger',
      }[color];

      return (
        <div className="flex items-center gap-2 transition-opacity duration-ui group-hover:opacity-100 opacity-90">
          <div className={cn('h-2 w-2 rounded-full transition-transform duration-ui group-hover:scale-110', dotColor)} />
          <span className="text-sm text-text-muted">{label}</span>
          <span className="text-sm font-medium text-text-base capitalize">
            {level}
          </span>
        </div>
      );
    };

    return (
      <Card
        ref={ref}
        variant="elevated"
        className={cn('group', modelCardVariants({ variant }), className)}
        {...props}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-transparent transition-all duration-ui group-hover:ring-primary group-hover:ring-offset-2">
              {model.logoUrl ? (
                <AvatarImage src={model.logoUrl} alt={`${model.provider} logo`} />
              ) : null}
              <AvatarFallback className="text-lg transition-colors duration-ui group-hover:bg-primary group-hover:text-primary-foreground">
                {getProviderFallback(model.provider)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg text-text-strong leading-tight transition-colors duration-ui group-hover:text-primary">
                    {displayName}
                  </h3>
                  <p className="text-sm text-text-muted mt-0.5 transition-colors duration-ui group-hover:text-text-base">
                    by {model.provider}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {model.status !== 'active' && (
                    <Badge
                      variant={statusVariant}
                      className="transition-transform duration-ui group-hover:scale-105"
                    >
                      {model.status === 'beta' ? 'Beta' : 'Deprecated'}
                    </Badge>
                  )}

                  {priceTier.tier !== 'free' && (
                    <Badge
                      variant={priceTier.color}
                      className="transition-transform duration-ui group-hover:scale-105"
                    >
                      {priceTier.label}
                    </Badge>
                  )}
                </div>
              </div>

              {model.description && (
                <p className="text-sm text-text-base mt-3 leading-relaxed transition-colors duration-ui group-hover:text-text-strong">
                  {variant === 'compact'
                    ? model.description.slice(0, 100) + (model.description.length > 100 ? '...' : '')
                    : model.description
                  }
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Specifications */}
          <div className="grid grid-cols-2 gap-4">
            {model.context_window && (
              <div className="transition-transform duration-ui group-hover:translate-x-0.5">
                <p className="text-xs font-semibold text-text-strong mb-1">Context Window</p>
                <p className="text-sm text-text-base">{formatContextWindow(model.context_window)}</p>
              </div>
            )}

            {model.pricing && (
              <div className="transition-transform duration-ui group-hover:translate-x-0.5">
                <p className="text-xs font-semibold text-text-strong mb-1">Pricing</p>
                <p className="text-sm text-text-base">
                  {formatPrice(model.pricing.input_cost_per_token || 0)}
                </p>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {variant === 'detailed' && (
            <>
              <Separator className="transition-opacity duration-ui group-hover:opacity-70" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-strong">Performance</h4>
                <div className="space-y-2">
                  <PerformanceIndicator level={model.performance.latency} label="Latency" />
                  <PerformanceIndicator level={model.performance.cost} label="Cost" />
                  <PerformanceIndicator level={model.performance.quality} label="Quality" />
                </div>
              </div>
            </>
          )}

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <>
              <Separator className="transition-opacity duration-ui group-hover:opacity-70" />
              <div>
                <h4 className="text-sm font-semibold text-text-strong mb-3">Capabilities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {capabilities.map((capability) => (
                    <div
                      key={capability.capability}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50 transition-all duration-ui group-hover:bg-muted group-hover:scale-105"
                    >
                      <span className="text-lg" role="img" aria-label={capability.label}>
                        {capability.icon}
                      </span>
                      <span className="text-sm font-medium text-text-base">
                        {capability.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Usage Metrics */}
          {showMetrics && variant === 'detailed' && (
            <>
              <Separator className="transition-opacity duration-ui group-hover:opacity-70" />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text-strong">Usage & Performance</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 transition-transform duration-ui group-hover:translate-x-0.5">
                    <TrendingUp className="h-4 w-4 text-text-muted transition-colors duration-ui group-hover:text-success" />
                    <div>
                      <p className="text-xs text-text-muted">Avg Response</p>
                      <p className="text-sm font-medium text-text-base">
                        {Math.round(metrics.responseTime || 0)}ms
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 transition-transform duration-ui group-hover:translate-x-0.5">
                    <Users className="h-4 w-4 text-text-muted transition-colors duration-ui group-hover:text-info" />
                    <div>
                      <p className="text-xs text-text-muted">Total Uses</p>
                      <p className="text-sm font-medium text-text-base">
                        {(metrics.usageCount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 transition-transform duration-ui group-hover:translate-x-0.5">
                  <Star className="h-4 w-4 text-warning fill-warning transition-transform duration-ui group-hover:scale-110" />
                  <span className="text-sm font-medium text-text-base">
                    {(metrics.satisfactionScore || 0).toFixed(1)} / 5.0
                  </span>
                  <span className="text-xs text-text-muted">user rating</span>
                </div>
              </div>
            </>
          )}

          {/* Similar Models */}
          {showSuggestions && variant === 'detailed' && (
            <>
              <Separator className="transition-opacity duration-ui group-hover:opacity-70" />
              <div>
                <h4 className="text-sm font-semibold text-text-strong mb-2">Similar Models</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs transition-all duration-ui hover:bg-primary hover:text-primary-foreground hover:border-primary">
                    GPT-4 Turbo
                  </Badge>
                  <Badge variant="outline" className="text-xs transition-all duration-ui hover:bg-primary hover:text-primary-foreground hover:border-primary">
                    Claude-3 Sonnet
                  </Badge>
                  <Badge variant="outline" className="text-xs transition-all duration-ui hover:bg-primary hover:text-primary-foreground hover:border-primary">
                    Gemini Pro
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {/* Actions */}
        {showActions && (
          <CardFooter className="pt-4 border-t border-border transition-colors duration-ui group-hover:border-primary/20">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  className={cn(
                    'text-text-muted hover:text-text-strong transition-all duration-ui',
                    isFavorited && 'text-danger hover:text-danger/80'
                  )}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={cn(
                    'h-4 w-4 transition-all duration-ui',
                    isFavorited && 'fill-current scale-110'
                  )} />
                </Button>

                {onCompare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCompare}
                    className="text-text-muted hover:text-text-strong transition-all duration-ui hover:scale-105"
                    aria-label="Compare model"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-text-muted hover:text-text-strong transition-all duration-ui hover:scale-105"
                  aria-label="View model details"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {onSelect && (
                <Button
                  onClick={onSelect}
                  size="sm"
                  className="transition-all duration-ui hover:scale-105 active:scale-100"
                >
                  Select Model
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    );
  }
);

ModelCard.displayName = 'ModelCard';

export { ModelCard, modelCardVariants };
