'use client';

import * as React from 'react';
import { ExternalLink, Clock, DollarSign, Zap } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Separator } from '../Separator';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent, TooltipPortal } from '../Tooltip';
import { ModelTooltipProps, ModelMetrics } from './types';
import {
  getModelDisplayName,
  getProviderFallback,
  getModelCapabilities,
  formatPrice,
  formatContextWindow,
  formatPerformanceLevel,
  getModelStatusBadgeVariant
} from './utils';

const ModelTooltip = React.forwardRef<HTMLDivElement, ModelTooltipProps>(
  ({
    model,
    children,
    side = 'top',
    align = 'center',
    showFullDetails = true,
    showMetrics = false,
    className,
    ...props
  }, ref) => {
    const displayName = getModelDisplayName(model);
    const capabilities = getModelCapabilities(model);
    const statusVariant = getModelStatusBadgeVariant(model.status);

    // Mock metrics - in a real implementation, these would come from props or API
    const metrics: ModelMetrics = React.useMemo(() => ({
      responseTime: Math.random() * 2000 + 500, // 500-2500ms
      uptime: Math.random() * 5 + 95, // 95-100%
      satisfactionScore: Math.random() * 2 + 3, // 3-5 stars
      usageCount: Math.floor(Math.random() * 10000),
      lastUsed: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Last 7 days
    }), []);

    const TooltipContentElement = React.useMemo(() => (
      <div className="max-w-80 p-0">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <Avatar className="h-10 w-10 shrink-0">
            {model.logoUrl ? (
              <AvatarImage src={model.logoUrl} alt={`${model.provider} logo`} />
            ) : null}
            <AvatarFallback className="text-sm">
              {getProviderFallback(model.provider)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-text-strong leading-tight">
                  {displayName}
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  by {model.provider}
                </p>
              </div>

              {model.status !== 'active' && (
                <Badge variant={statusVariant} className="text-xs shrink-0">
                  {model.status === 'beta' ? 'Beta' : 'Deprecated'}
                </Badge>
              )}
            </div>

            {model.description && showFullDetails && (
              <p className="text-xs text-text-base mt-2 leading-relaxed">
                {model.description.length > 120
                  ? `${model.description.slice(0, 120)}...`
                  : model.description
                }
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Key Specifications */}
        {showFullDetails && (
          <>
            <div className="p-4 py-3 space-y-2">
              <h5 className="text-xs font-semibold text-text-strong mb-2">
                Specifications
              </h5>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {model.context_window && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-text-muted shrink-0" />
                    <span className="text-text-muted">Context:</span>
                    <span className="text-text-base font-medium">
                      {formatContextWindow(model.context_window)}
                    </span>
                  </div>
                )}

                {model.pricing && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3 text-text-muted shrink-0" />
                    <span className="text-text-muted">Price:</span>
                    <span className="text-text-base font-medium">
                      {formatPrice(model.pricing.input_cost_per_token || 0)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-text-muted shrink-0" />
                  <span className="text-text-muted">Speed:</span>
                  <span className="text-text-base font-medium">
                    {formatPerformanceLevel(model.performance.latency).label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 text-text-muted shrink-0">💎</span>
                  <span className="text-text-muted">Quality:</span>
                  <span className="text-text-base font-medium">
                    {formatPerformanceLevel(model.performance.quality).label}
                  </span>
                </div>
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Capabilities */}
        {capabilities.length > 0 && (
          <>
            <div className="p-4 py-3">
              <h5 className="text-xs font-semibold text-text-strong mb-2">
                Capabilities
              </h5>

              <div className="flex flex-wrap gap-1.5">
                {capabilities.map((capability) => (
                  <div
                    key={capability.capability}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs"
                  >
                    <span className="text-sm" role="img" aria-label={capability.label}>
                      {capability.icon}
                    </span>
                    <span className="text-text-base font-medium">
                      {capability.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Performance Metrics */}
        {showMetrics && (
          <>
            <div className="p-4 py-3 space-y-2">
              <h5 className="text-xs font-semibold text-text-strong mb-2">
                Performance
              </h5>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Response Time</span>
                  <span className="text-text-base font-medium">
                    {Math.round(metrics.responseTime || 0)}ms
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Uptime</span>
                  <span className="text-text-base font-medium">
                    {(metrics.uptime || 0).toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Usage Count</span>
                  <span className="text-text-base font-medium">
                    {(metrics.usageCount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Footer */}
        <div className="p-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Model ID: {model.model_key}
            </span>

            <button className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <span>View Details</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    ), [model, displayName, capabilities, statusVariant, showFullDetails, showMetrics, metrics]);

    return (
      <TooltipProvider delayDuration={300}>
        <TooltipRoot>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipPortal>
            <TooltipContent
              ref={ref}
              side={side}
              align={align}
              className={cn(
                'p-0 bg-surface border border-border shadow-lg max-w-none',
                className
              )}
              sideOffset={8}
              {...props}
            >
              {TooltipContentElement}
            </TooltipContent>
          </TooltipPortal>
        </TooltipRoot>
      </TooltipProvider>
    );
  }
);

ModelTooltip.displayName = 'ModelTooltip';

export { ModelTooltip };
