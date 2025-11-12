# OverflowTooltip

A reusable component for displaying overflow content (tags, models, etc.) in a clean, accessible tooltip.

## Overview

OverflowTooltip provides a consistent pattern for showing "+X more" indicators throughout the PromptCard system. It displays a badge trigger (or custom element) that reveals overflow items in a tooltip on hover or keyboard focus.

## Features

- **Rich Content Support**: Display any React nodes including badges, text, or custom components
- **Flexible Trigger**: Default "+X more" badge or fully custom trigger element
- **Smart Positioning**: Configurable side and alignment to prevent viewport clipping
- **Full Keyboard Accessibility**: Tab navigation and screen reader support
- **WCAG AA Compliant**: Proper ARIA labels and accessible interaction patterns
- **Clean Presentation**: Max-width constraint prevents overflow, items are scannable

## Basic Usage

```tsx
import { OverflowTooltip } from '@meaty/ui';
import { Badge } from '@meaty/ui';

// Basic overflow tooltip
<OverflowTooltip
  overflowCount={3}
  items={[
    <Badge key="1">Machine Learning</Badge>,
    <Badge key="2">Data Science</Badge>,
    <Badge key="3">Analytics</Badge>
  ]}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `overflowCount` | `number` | Required | Number of items not shown in main view |
| `items` | `React.ReactNode[]` | Required | Items to display in tooltip |
| `trigger` | `React.ReactNode` | `undefined` | Custom trigger (defaults to "+X more" badge) |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Tooltip positioning side |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Tooltip alignment |
| `className` | `string` | `undefined` | Additional classes for wrapper |
| `contentClassName` | `string` | `undefined` | Additional classes for tooltip content |
| `delayDuration` | `number` | `200` | Delay before showing tooltip (ms) |
| `showArrow` | `boolean` | `true` | Whether to show arrow on tooltip |
| `aria-label` | `string` | `'{count} more items'` | Accessible label for trigger |

## Common Patterns

### Tag Overflow

Display additional tags that don't fit in the tag row:

```tsx
<OverflowTooltip
  overflowCount={tags.length - visibleTags.length}
  items={overflowTags.map(tag => (
    <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
  ))}
  side="bottom"
  align="start"
/>
```

### Model List

Show supported AI models:

```tsx
<OverflowTooltip
  overflowCount={models.length}
  items={models.map(model => (
    <span key={model} className="font-mono text-xs">{model}</span>
  ))}
  aria-label={`${models.length} supported models`}
/>
```

### Custom Trigger

Use your own trigger element:

```tsx
<OverflowTooltip
  overflowCount={5}
  items={items}
  trigger={
    <button className="text-sm text-primary hover:underline">
      View all items
    </button>
  }
/>
```

### Mixed Content

Combine different types of content:

```tsx
<OverflowTooltip
  overflowCount={3}
  items={[
    <Badge key="1" variant="success">Production</Badge>,
    <span key="2" className="font-mono">v1.2.3</span>,
    <span key="3" className="text-muted">Updated today</span>
  ]}
/>
```

## Accessibility

### Keyboard Navigation

- **Tab**: Focus the trigger element
- **Enter/Space**: (When using button trigger) Activate
- **Hover/Focus**: Show tooltip content
- **Escape**: Close tooltip

### Screen Readers

- Default trigger announces: "{count} more items"
- Custom aria-label supported for contextual announcements
- Tooltip content is fully accessible to screen readers
- All items in tooltip are announced individually

### ARIA Attributes

The component automatically provides:
- `aria-label` on trigger (default or custom)
- `aria-describedby` linking trigger to tooltip
- `role="tooltip"` on tooltip content
- `tabIndex="0"` on trigger for keyboard access

## Best Practices

### DO

- Use for overflow of 1+ items that don't fit in main view
- Provide meaningful content in items array
- Use appropriate badge variants for visual hierarchy
- Consider tooltip positioning based on layout context
- Use custom aria-label for domain-specific context

### DON'T

- Show tooltip when overflowCount is 0 (component prevents this)
- Nest interactive elements in tooltip items (breaks accessibility)
- Use extremely long content (tooltip has max-width)
- Forget to provide unique keys for items array
- Override default positioning without testing edge cases

## Integration with PromptCard

OverflowTooltip is designed to work seamlessly within PromptCard sections:

```tsx
import { OverflowTooltip } from '../components/OverflowTooltip';

// In a PromptCard section
const visibleTags = tags.slice(0, maxVisible);
const overflowTags = tags.slice(maxVisible);

return (
  <div className="flex items-center gap-1">
    {visibleTags.map(tag => (
      <Badge key={tag.id}>{tag.name}</Badge>
    ))}
    {overflowTags.length > 0 && (
      <OverflowTooltip
        overflowCount={overflowTags.length}
        items={overflowTags.map(tag => (
          <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
        ))}
      />
    )}
  </div>
);
```

## Testing

Comprehensive test coverage includes:
- ✓ Rendering with different overflow counts
- ✓ Custom trigger support
- ✓ Tooltip content display
- ✓ Positioning variations
- ✓ Keyboard accessibility
- ✓ ARIA compliance (via jest-axe)
- ✓ Edge cases (0 count, large counts, special characters)
- ✓ Component integration (Badge, custom components)

## Related Components

- **Badge**: Primary content for items array
- **Tooltip**: Underlying primitive (wrapped by this component)
- **PromptCard**: Primary consumer of OverflowTooltip

## Examples

See the Storybook stories for interactive examples:
- Default usage with badges
- Text-only items
- Mixed content types
- Custom triggers
- All positioning options
- Real-world tag and model overflow scenarios
