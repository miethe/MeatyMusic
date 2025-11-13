# DraftBanner Component

Alert banner for draft recovery with responsive layout and comprehensive accessibility features.

## Overview

The DraftBanner component displays when a draft is available for recovery, providing users with clear options to resume editing or discard the draft. It features blue accent styling, responsive layout, and full keyboard navigation support.

## Features

- **Blue accent styling** optimized for draft alerts
- **Automatic focus** on Resume button for quick action
- **Responsive layout** (buttons stack vertically on mobile)
- **Title truncation** at 50 characters with ellipsis
- **Accessible** with `role="alert"` for screen readers
- **Time formatting** in HH:MM AM/PM format
- **Dark mode support** with adjusted colors

## Usage

```tsx
import { DraftBanner } from '@meaty/ui';

function MyComponent() {
  const handleResume = () => {
    // Load draft data and resume editing
    console.log('Resuming draft...');
  };

  const handleDiscard = () => {
    // Clear draft from storage
    console.log('Discarding draft...');
  };

  return (
    <DraftBanner
      draft={{
        title: 'My draft prompt',
        savedAt: '2024-01-15T10:45:30.000Z'
      }}
      onResume={handleResume}
      onDiscard={handleDiscard}
    />
  );
}
```

## Props

### DraftBannerProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `draft` | `{ title?: string; savedAt: string }` | Yes | Draft metadata |
| `draft.title` | `string` | No | Draft title (truncated at 50 chars) |
| `draft.savedAt` | `string` | Yes | ISO 8601 timestamp |
| `onResume` | `() => void` | Yes | Callback when Resume is clicked |
| `onDiscard` | `() => void` | Yes | Callback when Discard is clicked |
| `className` | `string` | No | Additional CSS classes |

## Examples

### With Title

```tsx
<DraftBanner
  draft={{
    title: 'How to write effective prompts',
    savedAt: new Date().toISOString()
  }}
  onResume={() => {}}
  onDiscard={() => {}}
/>
```

### Without Title

```tsx
<DraftBanner
  draft={{
    savedAt: new Date().toISOString()
  }}
  onResume={() => {}}
  onDiscard={() => {}}
/>
```

### With Long Title (Truncation)

```tsx
<DraftBanner
  draft={{
    title: 'This is a very long title that exceeds the fifty character limit and will be truncated with ellipsis',
    savedAt: new Date().toISOString()
  }}
  onResume={() => {}}
  onDiscard={() => {}}
/>
```

## Accessibility

### ARIA Attributes

- **`role="alert"`** - Announces banner to screen readers immediately
- **`aria-label`** - Descriptive labels on both buttons for clarity
- **`aria-hidden`** - FileText icon marked as decorative

### Keyboard Navigation

1. **Focus Order**: Resume button (auto-focus) → Discard button
2. **Activation**: Press Enter or Space to activate focused button
3. **Tab Navigation**: Tab to move forward, Shift+Tab to move backward

### Screen Reader Announcements

When the banner appears, screen readers announce:
> "Alert: Resume your draft? You have an unsaved draft from 10:45 AM titled 'Draft title'"

### Color Contrast

- Text colors meet WCAG 2.1 AA standards
- High contrast blue theme for visibility
- Dark mode with adjusted colors for accessibility

## Responsive Behavior

### Desktop (≥640px)
- Horizontal layout with icon, text, and buttons inline
- Buttons right-aligned

### Mobile (<640px)
- Vertical layout with buttons stacked below text
- Full-width button container for better touch targets

## Styling

### Default Colors

```css
/* Light mode */
background: bg-blue-50
border: border-blue-200
text-heading: text-blue-900
text-body: text-blue-700
icon: text-blue-600

/* Dark mode */
background: dark:bg-blue-950/20
border: dark:border-blue-800
text-heading: dark:text-blue-100
text-body: dark:text-blue-300
icon: dark:text-blue-400
```

### Custom Styling

You can override styles using the `className` prop:

```tsx
<DraftBanner
  draft={draft}
  onResume={onResume}
  onDiscard={onDiscard}
  className="shadow-lg mb-4"
/>
```

## Implementation Details

### Time Formatting

The component uses a built-in `formatSavedTime()` function that converts ISO 8601 timestamps to "HH:MM AM/PM" format:

- `2024-01-15T10:45:30.000Z` → "10:45 AM"
- `2024-01-15T14:30:00.000Z` → "2:30 PM"
- Invalid timestamps → "" (empty string)

### Title Truncation

Titles longer than 50 characters are automatically truncated with ellipsis:

- ≤50 chars: Full title displayed
- >50 chars: First 50 chars + "..."

### Focus Management

The Resume button automatically receives focus when the banner is mounted, allowing users to quickly take action via keyboard.

## Testing

### Unit Tests (28 passing)

```bash
pnpm --filter "./packages/ui" test -- DraftBanner
```

### Coverage

- **Rendering**: 6 tests
- **Interactions**: 5 tests
- **ARIA & Accessibility**: 6 tests (including axe violations)
- **Color Classes**: 3 tests
- **Focus Management**: 1 test
- **Responsive Behavior**: 2 tests
- **Edge Cases**: 4 tests
- **Ref Forwarding**: 1 test

### Accessibility Testing

Zero axe violations with comprehensive checks for:
- Color contrast
- ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader compatibility

## Storybook

View all component variants and interactive demos:

```bash
pnpm --filter "./packages/ui" storybook
```

### Available Stories

1. **Default** - Standard banner with short title
2. **LongTitle** - Demonstrates truncation
3. **NoTitle** - Banner without title
4. **DifferentTimes** - Multiple time formats
5. **Interactive** - Working Resume/Discard handlers
6. **MobileResponsive** - Mobile viewport preview
7. **AccessibilityDemo** - A11y features overview
8. **DarkMode** - Dark mode styling
9. **AllVariants** - Side-by-side comparison

## Related Components

- **SaveStatusIndicator** - Shows save status during editing
- **Card** - Base component for layout
- **Button** - Action buttons

## License

Part of the MeatyPrompts UI component library.
