# ModelBadges Component

## Overview

The `ModelBadges` component displays multiple AI model names with responsive overflow handling. It's designed for use in PromptCard's MetaStrip section to show which models a prompt supports.

## Features

- **Responsive Display**: Automatically adjusts visible model count based on card size
  - Compact: 1 model + overflow
  - Standard: 2 models + overflow
  - XL: 3 models + overflow
- **Smart Overflow**: Uses OverflowTooltip to show "+X more" for additional models
- **Interactive**: Optional click handlers for model-based filtering
- **Accessible**: Full keyboard navigation, ARIA labels, and screen reader support
- **Touch-Friendly**: ≥44px touch targets on mobile devices

## Basic Usage

```tsx
import { ModelBadges } from '@meaty/ui';

// Simple display
<ModelBadges
  models={['gpt-4', 'claude-3-opus', 'gemini-pro']}
  size="standard"
/>

// With click handler for filtering
<ModelBadges
  models={['gpt-4', 'claude-3-opus', 'gemini-pro']}
  size="standard"
  onModelClick={(model, event) => {
    // Filter prompts by model
    filterPrompts({ model });
  }}
/>
```

## Props

```typescript
interface ModelBadgesProps {
  /** Array of model names to display */
  models: string[];

  /** Card size determines how many visible */
  size?: 'compact' | 'standard' | 'xl';

  /** Optional click handler for filtering */
  onModelClick?: (model: string, event: React.MouseEvent) => void;

  /** Additional classes */
  className?: string;
}
```

## Integration with PromptCard

The ModelBadges component is designed to replace the single `model` string in PromptCard's MetaStrip section:

### Before (Single Model)
```tsx
<PromptCard
  model="gpt-4"
  onModelClick={(model) => filter(model)}
/>
```

### After (Multiple Models)
```tsx
<PromptCard
  models={['gpt-4', 'claude-3-opus', 'gemini-pro']}
  onModelClick={(model) => filter(model)}
/>
```

## Accessibility

### Keyboard Navigation
- Tab key moves focus between model badges
- Enter or Space key activates clickable badges
- All interactive elements have proper ARIA roles and labels

### Screen Readers
- Non-clickable badges are announced as text
- Clickable badges have role="button" and descriptive labels
- Overflow count is announced: "3 more models"

### Touch Targets
- All clickable badges meet ≥44px minimum touch target size
- Proper spacing prevents accidental activation

## Styling

The component uses the existing Badge component with the `secondary` variant for consistency:

```tsx
// Model badges use secondary variant
<Badge variant="secondary" size="sm">
  gpt-4
</Badge>
```

Clickable badges have hover states:
```tsx
className="hover:bg-mp-secondary/80"
```

## Event Handling

The component properly stops event propagation to prevent unwanted card clicks:

```tsx
const handleModelClick = (model: string) => (event: React.MouseEvent) => {
  event.stopPropagation(); // Prevents card onClick
  if (onModelClick) {
    onModelClick(model, event);
  }
};
```

## Data Attributes

Clickable model badges include data attributes for testing and debugging:

```tsx
<div
  data-clickable-section="model"
  data-model="gpt-4"
  role="button"
  tabIndex={0}
  aria-label="Filter by model: gpt-4"
>
  <Badge>gpt-4</Badge>
</div>
```

## Testing

Comprehensive test coverage includes:
- Rendering with different model counts
- Responsive display limits for each size
- Overflow handling and tooltip content
- Click handlers and event propagation
- Keyboard navigation and activation
- Accessibility (jest-axe)
- Edge cases (long names, special characters)

Run tests:
```bash
pnpm --filter "@meaty/ui" test ModelBadges.test.tsx
```

## Storybook

View all component variations in Storybook:
```bash
pnpm --filter "@meaty/ui" storybook
```

Navigate to: **PromptCard / Components / ModelBadges**

## Examples

### Single Model
```tsx
<ModelBadges models={['gpt-4']} size="standard" />
// Renders: [gpt-4]
```

### Multiple Models - Standard Size
```tsx
<ModelBadges
  models={['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3']}
  size="standard"
/>
// Renders: [gpt-4] [claude-3-opus] [+2 more]
```

### Compact Size
```tsx
<ModelBadges
  models={['gpt-4', 'claude-3-opus', 'gemini-pro']}
  size="compact"
/>
// Renders: [gpt-4] [+2 more]
```

### XL Size
```tsx
<ModelBadges
  models={['gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3']}
  size="xl"
/>
// Renders: [gpt-4] [claude-3-opus] [gemini-pro] [+1 more]
```

### Interactive with Click Handler
```tsx
<ModelBadges
  models={['gpt-4', 'claude-3-opus']}
  onModelClick={(model) => {
    console.log('Filter by:', model);
    // Navigate to filtered view
    router.push(`/prompts?model=${model}`);
  }}
/>
```

## Related Components

- **Badge**: Base component for model display
- **OverflowTooltip**: Handles "+X more" overflow display
- **MetaStrip**: PromptCard section where ModelBadges is used
- **PromptCard**: Parent component

## Migration Notes

When migrating from single `model` prop to `models` array:

1. Update data model to support multiple models per prompt
2. Change prop from `model?: string` to `models?: string[]`
3. Update MetaStrip to use ModelBadges component
4. Ensure onModelClick handler works with new signature
5. Update tests to cover multiple model scenarios

## Performance

- Renders only visible models in main view
- Overflow models rendered lazily in tooltip on hover
- No re-renders unless props change (React.useCallback for handlers)
- Minimal DOM nodes for optimal performance
