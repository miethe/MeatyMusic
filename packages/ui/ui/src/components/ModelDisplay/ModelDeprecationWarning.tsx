'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, Clock, X, ArrowRight, ExternalLink, Calendar } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Alert, AlertDescription } from '../Alert';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardHeader } from '../Card';
import { Separator } from '../Separator';
import { ModelDeprecationWarningProps } from './types';
import {
  getModelDisplayName,
  getDeprecationUrgency,
  formatContextWindow
} from './utils';

const deprecationWarningVariants = cva(
  'transition-all duration-200',
  {
    variants: {
      variant: {
        inline: '',
        banner: 'w-full',
        modal: 'max-w-lg',
      },
      severity: {
        notice: 'border-warning/20 bg-warning/5',
        warning: 'border-warning/40 bg-warning/10',
        critical: 'border-danger/40 bg-danger/10',
      },
    },
    defaultVariants: {
      variant: 'inline',
      severity: 'notice',
    },
  }
);

const ModelDeprecationWarning = React.forwardRef<HTMLDivElement, ModelDeprecationWarningProps>(
  ({
    model,
    variant = 'inline',
    severity,
    showAlternatives = true,
    showTimeline = true,
    onDismiss,
    onMigrate,
    className,
    ...props
  }, ref) => {
    if (!model.deprecation) return null;

    const displayName = getModelDisplayName(model);
    const actualSeverity = severity || getDeprecationUrgency(model);
    const deprecatedAt = new Date(model.deprecation.deprecated_at);
    const endOfLife = model.deprecation.end_of_life ? new Date(model.deprecation.end_of_life) : null;

    // Calculate days until end of life
    const daysUntilEOL = endOfLife
      ? Math.ceil((endOfLife.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    // Mock alternative models - in a real implementation, these would come from props or API
    const alternativeModels = React.useMemo(() => [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        similarity: 95,
        contextWindow: 128000
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude-3 Sonnet',
        provider: 'Anthropic',
        similarity: 90,
        contextWindow: 200000
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        similarity: 85,
        contextWindow: 1000000
      },
    ], []);

    const getSeverityIcon = () => {
      switch (actualSeverity) {
        case 'critical':
          return <AlertTriangle className="h-5 w-5 text-danger" />;
        case 'warning':
          return <AlertTriangle className="h-5 w-5 text-warning" />;
        default:
          return <Clock className="h-5 w-5 text-warning" />;
      }
    };

    const getSeverityTitle = () => {
      switch (actualSeverity) {
        case 'critical':
          return 'Model Ending Soon';
        case 'warning':
          return 'Model Deprecated';
        default:
          return 'Deprecation Notice';
      }
    };

    const getSeverityMessage = () => {
      if (daysUntilEOL !== null) {
        if (daysUntilEOL <= 0) {
          return 'This model has reached end of life and is no longer available.';
        } else if (daysUntilEOL <= 30) {
          return `This model will be discontinued in ${daysUntilEOL} days. Please migrate to an alternative.`;
        } else if (daysUntilEOL <= 90) {
          return `This model will be discontinued in ${daysUntilEOL} days. Consider migrating to an alternative.`;
        }
      }

      return 'This model has been deprecated. While still functional, consider migrating to a recommended alternative.';
    };

    const handleMigrate = (alternativeModelId: string) => {
      if (onMigrate) {
        onMigrate(alternativeModelId);
      }
    };

    if (variant === 'banner') {
      return (
        <Alert
          ref={ref}
          className={cn(deprecationWarningVariants({ variant, severity: actualSeverity }), className)}
          {...props}
        >
          <div className="flex items-start gap-3 w-full">
            {getSeverityIcon()}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-text-strong">
                  {getSeverityTitle()}: {displayName}
                </h4>

                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-auto p-1 text-text-muted hover:text-text-strong shrink-0"
                    aria-label="Dismiss warning"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <AlertDescription className="mt-1">
                {getSeverityMessage()}
                {model.deprecation.reason && (
                  <span className="block mt-1 text-sm">
                    Reason: {model.deprecation.reason}
                  </span>
                )}
              </AlertDescription>

              {model.deprecation.replacement_model && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMigrate(model.deprecation!.replacement_model!)}
                    className="text-xs"
                  >
                    Migrate to {model.deprecation.replacement_model}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Alert>
      );
    }

    if (variant === 'modal') {
      return (
        <Card
          ref={ref}
          variant="elevated"
          className={cn(deprecationWarningVariants({ variant, severity: actualSeverity }), className)}
          {...props}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              {getSeverityIcon()}

              <div className="flex-1">
                <h3 className="font-bold text-lg text-text-strong">
                  {getSeverityTitle()}
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  {displayName} by {model.provider}
                </p>
              </div>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-auto p-1 text-text-muted hover:text-text-strong"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-text-base">
              {getSeverityMessage()}
            </p>

            {model.deprecation.reason && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Reason:</span> {model.deprecation.reason}
                </p>
              </div>
            )}

            {/* Timeline */}
            {showTimeline && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-text-strong">Timeline</h4>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-text-muted" />
                      <span className="text-text-muted">Deprecated:</span>
                      <span className="text-text-base">
                        {deprecatedAt.toLocaleDateString()}
                      </span>
                    </div>

                    {endOfLife && (
                      <div className="flex items-center gap-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-danger" />
                        <span className="text-text-muted">End of Life:</span>
                        <span className="text-text-base font-medium">
                          {endOfLife.toLocaleDateString()}
                        </span>
                        {daysUntilEOL !== null && daysUntilEOL > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {daysUntilEOL} days left
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Alternative Models */}
            {showAlternatives && alternativeModels.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-text-strong">
                    Recommended Alternatives
                  </h4>

                  <div className="space-y-2">
                    {alternativeModels.slice(0, 3).map((alternative) => (
                      <div
                        key={alternative.id}
                        className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-text-strong">
                              {alternative.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {alternative.similarity}% similar
                            </Badge>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {alternative.provider} • {formatContextWindow(alternative.contextWindow)}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMigrate(alternative.id)}
                          className="text-xs"
                        >
                          Select
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Documentation Link */}
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Migration Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Inline variant
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 px-2 py-1 rounded-md border text-sm',
          deprecationWarningVariants({ variant, severity: actualSeverity }),
          className
        )}
        {...props}
      >
        {getSeverityIcon()}
        <span className="font-medium">Deprecated</span>
        {endOfLife && daysUntilEOL !== null && daysUntilEOL > 0 && (
          <Badge variant="destructive" className="text-xs">
            {daysUntilEOL}d left
          </Badge>
        )}
      </div>
    );
  }
);

ModelDeprecationWarning.displayName = 'ModelDeprecationWarning';

export { ModelDeprecationWarning, deprecationWarningVariants };
