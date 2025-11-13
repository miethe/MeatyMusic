# Chip Component

A selectable chip component designed for tag filtering interfaces. Built with accessibility in mind and supports full keyboard navigation.

## Features

- ✅ **Accessible**: Full keyboard navigation, ARIA attributes, screen reader support
- ✅ **Interactive**: Click or keyboard (Space/Enter) to toggle selection
- ✅ **Visual States**: Default, selected, disabled, popular (with star icon)
- ✅ **Flexible**: Supports counts, custom styling, and multiple variants
- ✅ **Design System**: Uses design tokens from @meaty/tokens

## Basic Usage

```tsx
import { Chip } from '@meaty/ui';

// Basic chip
<Chip onClick={() => toggleTag('javascript')}>
  javascript
</Chip>

// With count
<Chip count={42} onClick={() => toggleTag('react')}>
  react
</Chip>

// Selected state
<Chip
  selected={isSelected}
  count={28}
  onClick={() => toggleTag('typescript')}
>
  typescript
</Chip>

// Popular tag with star icon
<Chip
  isPopular
  count={156}
  onClick={() => toggleTag('nextjs')}
>
  nextjs
</Chip>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | The chip content (typically tag name) |
| `count` | `number` | - | Optional count to display after the text |
| `selected` | `boolean` | `false` | Whether the chip is selected |
| `disabled` | `boolean` | `false` | Whether the chip is disabled |
| `isPopular` | `boolean` | `false` | Shows star icon for popular tags |
| `variant` | `'default' \| 'outline'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size variant |
| `onClick` | `() => void` | - | Click handler |
| `onKeyDown` | `(e: React.KeyboardEvent) => void` | - | Keyboard event handler |
| `className` | `string` | - | Additional CSS classes |

## Accessibility

The Chip component is built with accessibility as a priority:

- **Keyboard Navigation**: Tab to focus, Space/Enter to toggle
- **ARIA Attributes**: `role="button"`, `aria-pressed`, `aria-disabled`
- **Screen Reader**: Count is announced as "X items"
- **Focus Management**: Proper tab order, visible focus ring
- **Disabled State**: Properly excludes from tab order when disabled

## Examples

### Tag Filtering Interface

```tsx
const [selectedTags, setSelectedTags] = useState<string[]>([]);

const toggleTag = (tagName: string) => {
  setSelectedTags(prev =>
    prev.includes(tagName)
      ? prev.filter(tag => tag !== tagName)
      : [...prev, tagName]
  );
};

const tags = [
  { name: 'javascript', count: 1247, isPopular: true },
  { name: 'typescript', count: 892 },
  { name: 'react', count: 756, isPopular: true },
];

return (
  <div className="flex flex-wrap gap-2">
    {tags.map(tag => (
      <Chip
        key={tag.name}
        count={tag.count}
        isPopular={tag.isPopular}
        selected={selectedTags.includes(tag.name)}
        onClick={() => toggleTag(tag.name)}
      >
        {tag.name}
      </Chip>
    ))}
  </div>
);
```

### Different Variants and Sizes

```tsx
// Variants
<Chip variant="default" count={42}>Default</Chip>
<Chip variant="outline" count={28}>Outline</Chip>

// Sizes
<Chip size="sm" count={12}>Small</Chip>
<Chip size="default" count={34}>Default</Chip>
<Chip size="lg" count={56}>Large</Chip>

// States
<Chip selected count={42}>Selected</Chip>
<Chip disabled count={15}>Disabled</Chip>
<Chip isPopular count={156}>Popular</Chip>
```

## Design Tokens

The component uses the following design tokens:

- **Colors**: `surface`, `panel`, `primary`, `text-base`, `text-muted`, `warning`
- **Spacing**: Standard 4px/8px grid system
- **Typography**: `text-xs`, `text-sm`, `text-base`
- **Borders**: `border`, `border-strong`, `rounded-pill`
- **Focus**: `ring`, `ring-offset`

## Testing

The component includes comprehensive tests covering:

- Rendering and basic functionality
- Click and keyboard interactions
- ARIA attributes and accessibility
- Different variants and states
- Disabled behavior
- Custom props and ref forwarding

Run tests with: `pnpm test Chip`
