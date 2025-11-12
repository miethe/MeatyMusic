'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { ModelChipProps } from './types';
import {
  getModelDisplayName,
  getProviderFallback,
  getModelCapabilities,
  getModelPriceTier,
  getModelStatusBadgeVariant,
  getModelA11yDescription,
  truncateText
} from './utils';

const modelChipVariants = cva(
  'inline-flex items-center gap-2 rounded-full border transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-surface border-border hover:bg-panel',
        compact: 'bg-surface border-border hover:bg-panel',
        detailed: 'bg-surface border-border shadow-sm hover:shadow-md',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        default: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md',
        false: 'cursor-default',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
);

const ModelChip = React.forwardRef<HTMLDivElement, ModelChipProps>(
  ({
    model,
    variant = 'default',
    size = 'default',
    showProvider = true,
    showStatus = true,
    showCapabilities = false,
    showPricing = false,
    interactive = false,
    onClick,
    onRemove,
    className,
    ...props
  }, ref) => {
    const displayName = getModelDisplayName(model);
    const capabilities = getModelCapabilities(model);
    const priceTier = getModelPriceTier(model);
    const statusVariant = getModelStatusBadgeVariant(model.status);
    const a11yDescription = getModelA11yDescription(model);

    const avatarSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    const maxNameLength = variant === 'compact' ? 20 : size === 'sm' ? 15 : 30;

    const handleClick = React.useCallback((e: React.MouseEvent) => {
      if (interactive && onClick) {
        e.preventDefault();
        onClick();
      }
    }, [interactive, onClick]);

    const handleRemove = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (onRemove) {
        onRemove();
      }
    }, [onRemove]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && interactive && onClick) {
        e.preventDefault();
        onClick();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (onRemove) {
          e.preventDefault();
          onRemove();
        }
      }
    }, [interactive, onClick, onRemove]);

    return (
      <div
        ref={ref}
        className={cn(
          modelChipVariants({ variant, size, interactive }),
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        aria-label={interactive ? `Select ${displayName}` : undefined}
        aria-description={a11yDescription}
        {...props}
      >
        {/* Provider Avatar */}
        {showProvider && (
          <Avatar className={cn('shrink-0', avatarSize)}>
            {model.logoUrl ? (
              <AvatarImage src={model.logoUrl} alt={`${model.provider} logo`} />
            ) : null}
            <AvatarFallback className="text-xs">
              {getProviderFallback(model.provider)}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Model Name */}
        <span className="font-medium text-text-strong truncate">
          {truncateText(displayName, maxNameLength)}
        </span>

        {/* Status Badge */}
        {showStatus && model.status !== 'active' && (
          <Badge
            variant={statusVariant}
            className={cn(
              size === 'sm' && 'text-xs px-1.5 py-0',
              size === 'lg' && 'text-sm px-2.5 py-1'
            )}
          >
            {model.status === 'beta' ? 'Beta' : 'Deprecated'}
          </Badge>
        )}

        {/* Price Tier Badge */}
        {showPricing && priceTier.tier !== 'free' && (
          <Badge
            variant={priceTier.color}
            className={cn(
              size === 'sm' && 'text-xs px-1.5 py-0',
              size === 'lg' && 'text-sm px-2.5 py-1'
            )}
          >
            {priceTier.label}
          </Badge>
        )}

        {/* Capabilities */}
        {showCapabilities && capabilities.length > 0 && (
          <div className="flex items-center gap-1">
            {capabilities.slice(0, variant === 'compact' ? 2 : 4).map((capability) => (
              <span
                key={capability.capability}
                className={cn(
                  'inline-flex items-center justify-center rounded-full bg-muted text-text-muted',
                  size === 'sm' && 'h-4 w-4 text-xs',
                  size === 'default' && 'h-5 w-5 text-xs',
                  size === 'lg' && 'h-6 w-6 text-sm'
                )}
                title={capability.label}
                aria-label={capability.label}
              >
                {capability.icon}
              </span>
            ))}
            {capabilities.length > (variant === 'compact' ? 2 : 4) && (
              <span
                className={cn(
                  'text-text-muted',
                  size === 'sm' && 'text-xs',
                  size === 'default' && 'text-xs',
                  size === 'lg' && 'text-sm'
                )}
              >
                +{capabilities.length - (variant === 'compact' ? 2 : 4)}
              </span>
            )}
          </div>
        )}

        {/* Remove Button */}
        {onRemove && (
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'h-auto p-0 text-text-muted hover:text-text-strong shrink-0',
              size === 'sm' && 'h-3 w-3',
              size === 'default' && 'h-4 w-4',
              size === 'lg' && 'h-5 w-5'
            )}
            onClick={handleRemove}
            aria-label={`Remove ${displayName}`}
            tabIndex={-1}
          >
            <X className="h-full w-full" />
          </Button>
        )}
      </div>
    );
  }
);

ModelChip.displayName = 'ModelChip';

export { ModelChip, modelChipVariants };
