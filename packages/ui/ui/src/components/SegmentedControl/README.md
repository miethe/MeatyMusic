# SegmentedControl

A segmented control component for navigation and selection. Built on Radix Tabs for full accessibility and keyboard navigation support.

## Features

- **Full Accessibility**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Keyboard Navigation**: Arrow keys, Home, End, and Tab support
- **Touch Optimized**: 44x44px minimum tap targets for mobile
- **Smooth Animations**: 150ms transitions on all state changes
- **Design System**: Uses @meaty/tokens for consistent theming
- **Three Sizes**: Small (32px), Medium (40px), Large (48px)
- **Disabled States**: Individual segments can be disabled

## Installation

This component is part of the `@meaty/ui` package.

```tsx
import { SegmentedControl } from '@meaty/ui';
```

## Basic Usage

```tsx
import { useState } from 'react';
import { SegmentedControl } from '@meaty/ui';

function MyComponent() {
  const [view, setView] = useState('mine');

  return (
    <SegmentedControl
      value={view}
      onValueChange={setView}
      segments={[
        { value: 'mine', label: 'Mine' },
        { value: 'team', label: 'Team' },
        { value: 'public', label: 'Public' },
      ]}
      aria-label="Prompt scope filter"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | Required | Currently active segment value |
| `onValueChange` | `(value: string) => void` | Required | Callback when segment changes |
| `segments` | `Segment[]` | Required | Array of segments to display |
| `aria-label` | `string` | - | Accessible label for the control |
| `className` | `string` | - | Optional CSS class name |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |

### Segment Type

```tsx
interface Segment {
  value: string;      // Unique identifier
  label: string;      // Display text
  disabled?: boolean; // Optional disabled state
}
```

## Examples

### Two-Segment Toggle

```tsx
<SegmentedControl
  value={viewMode}
  onValueChange={setViewMode}
  segments={[
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
  ]}
  aria-label="View mode"
/>
```

### With Disabled Segment

```tsx
<SegmentedControl
  value={scope}
  onValueChange={setScope}
  segments={[
    { value: 'mine', label: 'Mine' },
    { value: 'team', label: 'Team', disabled: true }, // Premium feature
    { value: 'public', label: 'Public' },
  ]}
  aria-label="Prompt scope filter"
/>
```

### Different Sizes

```tsx
{/* Small - 32px height */}
<SegmentedControl size="sm" {...props} />

{/* Medium (default) - 40px height */}
<SegmentedControl size="md" {...props} />

{/* Large - 48px height */}
<SegmentedControl size="lg" {...props} />
```

### With URL State Sync

```tsx
import { useUrlState } from '@/hooks/useUrlState';

function PromptsPage() {
  const [scope, setScope] = useUrlState('scope', 'mine');

  return (
    <SegmentedControl
      value={scope}
      onValueChange={setScope}
      segments={[
        { value: 'mine', label: 'Mine' },
        { value: 'team', label: 'Team' },
        { value: 'public', label: 'Public' },
      ]}
      aria-label="Prompt scope filter"
    />
  );
}
```

## Accessibility

### Keyboard Navigation

- **Arrow Left/Right**: Navigate between segments
- **Home**: Jump to first segment
- **End**: Jump to last segment
- **Tab**: Move focus in/out of control
- **Enter/Space**: Activate focused segment

### Screen Reader Support

- Proper ARIA roles (`tablist`, `tab`)
- `aria-label` on root for context
- `aria-selected` on active tab
- Disabled state announced correctly
- Selection changes announced

### Focus Management

- 2px focus ring with proper offset
- High contrast ring color (WCAG AAA)
- Focus visible only on keyboard navigation
- Disabled segments skip focus

### Touch Targets

- Minimum 44x44px tap targets (WCAG AAA)
- Adequate spacing between segments
- No accidental activations

## Design Guidelines

### When to Use

- Switching between 2-5 related views or filters
- Navigation within a single page context
- Mutually exclusive options
- Frequently toggled settings

### When Not to Use

- More than 5 options (use dropdown/select instead)
- Non-exclusive options (use checkbox group)
- Rare or one-time selections
- Complex multi-level navigation

### Best Practices

1. **Keep labels short**: 1-2 words maximum
2. **Use meaningful labels**: Clear, descriptive text
3. **Provide context**: Always include `aria-label`
4. **Consider mobile**: Test on touch devices
5. **Limit segments**: 2-4 segments is optimal
6. **Consistent sizing**: Use same size throughout feature

## Styling

The component uses design tokens from `@meaty/tokens`:

```css
/* Colors */
--mp-color-surface      /* Active background */
--mp-color-panel        /* Control background */
--mp-color-border       /* Border color */
--mp-color-primary      /* Active indicator */
--mp-color-text-strong  /* Active text */
--mp-color-text-muted   /* Inactive text */
--mp-color-ring         /* Focus ring */

/* Spacing */
--mp-spacing-1 to --mp-spacing-4

/* Motion */
--mp-motion-duration-ui /* Transitions */

/* Elevation */
--mp-elevation-1        /* Control shadow */
--mp-elevation-2        /* Active segment shadow */
```

### Custom Styling

Add custom classes via the `className` prop:

```tsx
<SegmentedControl
  className="my-custom-class"
  {...props}
/>
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from '@meaty/ui';

test('changes segment on click', () => {
  const handleChange = jest.fn();
  render(
    <SegmentedControl
      value="mine"
      onValueChange={handleChange}
      segments={[...]}
    />
  );

  fireEvent.click(screen.getByText('Team'));
  expect(handleChange).toHaveBeenCalledWith('team');
});
```

### Accessibility Tests

```tsx
import { axe } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(<SegmentedControl {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Implementation Notes

### Radix Tabs Integration

Built on `@radix-ui/react-tabs` v1.1.13:
- Automatic keyboard navigation
- Focus management
- ARIA attributes
- Disabled state handling

### Animation Details

- **Duration**: 150ms (--mp-motion-duration-ui)
- **Easing**: CSS transitions
- **Properties**: background, color, shadow, transform
- **Active indicator**: Slides in from bottom

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive on mobile devices
- Touch-optimized interactions
- Respects prefers-reduced-motion

## Related Components

- **Tabs**: Full-featured tabs with content panels
- **RadioGroup**: Single selection from a list
- **NavigationTabs**: Page-level navigation tabs

## Changelog

### v1.0.0 (Phase 7)
- Initial implementation
- Three size variants
- Full accessibility support
- Comprehensive test coverage
- Storybook documentation

## Questions?

See the [Storybook stories](./SegmentedControl.stories.tsx) for interactive examples and documentation.
