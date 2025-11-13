/**
 * TemplateCard - Interactive card component for displaying template information
 *
 * Displays template metadata with hover effects and action buttons.
 * Used in Template Gallery and Onboarding Wizard.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Button';

/**
 * Variants for TemplateCard sizing
 */
const templateCardVariants = cva(
  'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
  {
    variants: {
      size: {
        /** Standard size with min-height of 280px */
        standard: 'min-h-[280px]',
        /** Compact size with min-height of 220px */
        compact: 'min-h-[220px]',
      },
    },
    defaultVariants: {
      size: 'standard',
    },
  }
);

/**
 * Props for TemplateCard component
 */
export interface TemplateCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof templateCardVariants> {
  /** Unique template identifier */
  id: string;

  /** Template name/title */
  name: string;

  /** Optional template description (clamps to 3 lines) */
  description?: string;

  /** Template category (e.g., 'productivity', 'marketing') */
  category: string;

  /** Number of times template has been used (optional) */
  usageCount?: number;

  /** Array of template tags (shows first 3, then "+N more") */
  tags?: string[];

  /** Preview content - first 200 characters of template body */
  preview?: string;

  /** Callback when preview button or card is clicked */
  onPreview?: () => void;

  /** Callback when "Use Template" button is clicked */
  onUseTemplate?: () => void;

  /** Whether the card is in a loading state (disables interactions) */
  loading?: boolean;
}

/**
 * TemplateCard component for displaying template information.
 *
 * Features:
 * - Hover effects (lift up, shadow increase, action buttons fade in)
 * - Full keyboard navigation (Tab, Enter, Space)
 * - Accessibility (ARIA labels, semantic HTML)
 * - Responsive design (works on mobile, tablet, desktop)
 * - Loading states (disables interactions)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TemplateCard
 *   id="template-1"
 *   name="Blog Post Outline"
 *   description="Create structured outlines for blog posts"
 *   category="productivity"
 *   usageCount={42}
 *   tags={['writing', 'blog', 'content']}
 *   onPreview={() => setPreviewOpen(true)}
 *   onUseTemplate={() => createFromTemplate(template)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With loading state
 * <TemplateCard
 *   id="template-1"
 *   name="Blog Post Outline"
 *   category="productivity"
 *   loading={isCreating}
 *   onUseTemplate={() => createFromTemplate(template)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Compact size
 * <TemplateCard
 *   id="template-1"
 *   name="Blog Post Outline"
 *   category="productivity"
 *   size="compact"
 *   onPreview={() => setPreviewOpen(true)}
 * />
 * ```
 */
const TemplateCard = React.forwardRef<HTMLDivElement, TemplateCardProps>(
  (
    {
      className,
      size,
      id,
      name,
      description,
      category,
      usageCount = 0,
      tags = [],
      preview,
      onPreview,
      onUseTemplate,
      loading,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const handleCardClick = React.useCallback(() => {
      if (!loading && onPreview) {
        onPreview();
      }
    }, [loading, onPreview]);

    const handleUseTemplate = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!loading && onUseTemplate) {
          onUseTemplate();
        }
      },
      [loading, onUseTemplate]
    );

    return (
      <Card
        ref={ref}
        className={cn(templateCardVariants({ size }), className)}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={loading ? -1 : 0}
        aria-label={`Template: ${name}`}
        aria-describedby={`${id}-description`}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !loading) {
            e.preventDefault();
            handleCardClick();
          }
        }}
        data-template-id={id}
        {...props}
      >
        <div className="flex flex-col h-full p-6 space-y-4">
          {/* Header with category badge and usage count */}
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" size="sm" className="capitalize">
              {category}
            </Badge>
            {usageCount > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-text-muted"
                aria-label={`Used ${usageCount} times`}
              >
                <Users className="h-3 w-3" aria-hidden="true" />
                <span>{usageCount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Title and description */}
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-text-strong line-clamp-2">
              {name}
            </h3>
            {description && (
              <p
                id={`${id}-description`}
                className="text-sm text-text-muted line-clamp-3"
              >
                {description}
              </p>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2" role="list" aria-label="Tags">
              {tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  size="sm"
                  role="listitem"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" size="sm" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions - shown on hover */}
          <div
            className={cn(
              'flex items-center gap-2 transition-all duration-200',
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseTemplate}
              disabled={loading}
              loading={loading}
              className="flex-1"
              aria-label={`Use ${name} template`}
            >
              Use Template
            </Button>
            {onPreview && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!loading) onPreview();
                }}
                disabled={loading}
                aria-label={`Preview ${name} template`}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

TemplateCard.displayName = 'TemplateCard';

export { TemplateCard, templateCardVariants };
