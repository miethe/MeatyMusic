/**
 * OverflowTooltip Usage Examples
 *
 * This file demonstrates common usage patterns for the OverflowTooltip component.
 */

import * as React from 'react';
import { OverflowTooltip } from './OverflowTooltip';
import { Badge } from '../../Badge';

/**
 * Example 1: Basic Tag Overflow
 *
 * Most common use case - displaying overflow tags with Badge components
 */
export function BasicTagOverflowExample() {
  const allTags = [
    'Machine Learning',
    'Data Science',
    'Analytics',
    'Python',
    'TensorFlow',
    'PyTorch',
    'Deep Learning',
  ];

  const maxVisible = 3;
  const visibleTags = allTags.slice(0, maxVisible);
  const overflowTags = allTags.slice(maxVisible);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visibleTags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
      {overflowTags.length > 0 && (
        <OverflowTooltip
          overflowCount={overflowTags.length}
          items={overflowTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          side="bottom"
          align="start"
        />
      )}
    </div>
  );
}

/**
 * Example 2: Model List with Custom Styling
 *
 * Displaying AI model names with monospace font
 */
export function ModelListExample() {
  const models = [
    'gpt-4-turbo-preview',
    'claude-3-5-sonnet-20241022',
    'gemini-pro-1.5',
    'llama-3-70b-instruct',
    'mistral-large',
    'command-r-plus',
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Supports:</span>
      <span className="font-mono text-xs">{models[0]}</span>
      <OverflowTooltip
        overflowCount={models.length - 1}
        items={models.slice(1).map((model) => (
          <span key={model} className="font-mono text-xs">
            {model}
          </span>
        ))}
        side="right"
        aria-label={`${models.length - 1} additional AI models`}
      />
    </div>
  );
}

/**
 * Example 3: Status Indicators
 *
 * Mixed badge variants for status and metadata
 */
export function StatusIndicatorsExample() {
  const statuses = [
    { label: 'Production', variant: 'success' as const },
    { label: 'API v2', variant: 'info' as const },
    { label: 'Rate Limited', variant: 'warning' as const },
    { label: 'Deprecated Soon', variant: 'outline' as const },
  ];

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statuses[0].variant}>{statuses[0].label}</Badge>
      {statuses.length > 1 && (
        <OverflowTooltip
          overflowCount={statuses.length - 1}
          items={statuses.slice(1).map((status) => (
            <Badge key={status.label} variant={status.variant}>
              {status.label}
            </Badge>
          ))}
        />
      )}
    </div>
  );
}

/**
 * Example 4: Custom Trigger
 *
 * Using a custom trigger element instead of default badge
 */
export function CustomTriggerExample() {
  const items = [
    'Feature 1',
    'Feature 2',
    'Feature 3',
    'Feature 4',
    'Feature 5',
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Features:</span>
      <OverflowTooltip
        overflowCount={items.length}
        items={items.map((item) => (
          <span key={item} className="text-sm">
            {item}
          </span>
        ))}
        trigger={
          <button className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1">
            View all {items.length} features
          </button>
        }
        side="bottom"
      />
    </div>
  );
}

/**
 * Example 5: Conditional Rendering
 *
 * Only show tooltip when there are overflow items
 */
export function ConditionalRenderingExample({
  tags,
  maxVisible = 5,
}: {
  tags: string[];
  maxVisible?: number;
}) {
  const visibleTags = tags.slice(0, maxVisible);
  const overflowTags = tags.slice(maxVisible);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visibleTags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
      {overflowTags.length > 0 && (
        <OverflowTooltip
          overflowCount={overflowTags.length}
          items={overflowTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        />
      )}
    </div>
  );
}

/**
 * Example 6: With Positioning Control
 *
 * Adjust positioning based on layout context
 */
export function PositionedTooltipExample() {
  const tags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5'];

  return (
    <div className="space-y-4">
      {/* Top of screen - position below */}
      <div className="flex items-center gap-2">
        <span className="text-sm">Top of screen:</span>
        <OverflowTooltip
          overflowCount={3}
          items={tags.slice(2).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          side="bottom"
        />
      </div>

      {/* End of row - align to end */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-sm">End of row:</span>
        <OverflowTooltip
          overflowCount={3}
          items={tags.slice(2).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          align="end"
        />
      </div>

      {/* Left side - position right */}
      <div className="flex items-center gap-2">
        <OverflowTooltip
          overflowCount={3}
          items={tags.slice(2).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          side="right"
        />
        <span className="text-sm">Left side</span>
      </div>
    </div>
  );
}

/**
 * Example 7: Performance - Memoized Items
 *
 * Optimize re-renders for large lists
 */
export function PerformanceOptimizedExample({
  tags,
  maxVisible = 5,
}: {
  tags: string[];
  maxVisible?: number;
}) {
  const visibleTags = React.useMemo(() => tags.slice(0, maxVisible), [tags, maxVisible]);
  const overflowTags = React.useMemo(() => tags.slice(maxVisible), [tags, maxVisible]);

  const overflowItems = React.useMemo(
    () =>
      overflowTags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      )),
    [overflowTags]
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visibleTags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
      {overflowTags.length > 0 && (
        <OverflowTooltip overflowCount={overflowTags.length} items={overflowItems} />
      )}
    </div>
  );
}

/**
 * Example 8: Integration with PromptCard MetaStrip
 *
 * Typical usage within PromptCard sections
 */
export function MetaStripIntegrationExample() {
  const tags = [
    'Machine Learning',
    'Data Science',
    'Python',
    'TensorFlow',
    'PyTorch',
    'Deep Learning',
    'Computer Vision',
    'NLP',
  ];

  const maxVisible = 3;
  const visibleTags = tags.slice(0, maxVisible);
  const overflowTags = tags.slice(maxVisible);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
      <span className="text-xs text-muted-foreground">Tags:</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {visibleTags.map((tag) => (
          <Badge key={tag} variant="outline" size="sm">
            {tag}
          </Badge>
        ))}
        {overflowTags.length > 0 && (
          <OverflowTooltip
            overflowCount={overflowTags.length}
            items={overflowTags.map((tag) => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
            side="bottom"
            align="start"
            aria-label={`${overflowTags.length} additional tags`}
          />
        )}
      </div>
    </div>
  );
}
