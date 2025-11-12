# ProviderBadge Component

A complication component that displays AI provider branding on prompt cards with appropriate brand colors and responsive sizing.

## Usage

### Basic Usage

```tsx
import { PromptCard, ProviderBadge } from '@meaty/ui';

<PromptCard
  complications={{
    topLeft: {
      component: ProviderBadge,
      // ProviderBadge-specific props are spread as additional props
    }
  }}
  // ... other PromptCard props
/>
```

### As a Standalone Component

```tsx
import { ProviderBadge } from '@meaty/ui';

<ProviderBadge
  provider="anthropic"
  modelName="claude-3-5-sonnet"
  cardSize="standard"
  slot="topLeft"
  isVisible={true}
  onClick={() => console.log('Provider clicked')}
  // ... other complication props
/>
```

## Props

### ProviderBadgeProps

Extends `ComplicationProps` from the complications system.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `provider` | `Provider` | Yes | The AI provider to display |
| `modelName` | `string` | No | Optional model name shown in tooltip |
| `onClick` | `() => void` | No | Optional click handler (makes badge interactive) |
| `cardSize` | `CardSize` | Yes (from ComplicationProps) | Card size for responsive styling |
| `slot` | `SlotPosition` | Yes (from ComplicationProps) | Slot position (typically 'topLeft') |
| `isVisible` | `boolean` | Yes (from ComplicationProps) | Whether to render the badge |

### Provider Type

```tsx
type Provider = 'openai' | 'anthropic' | 'google' | 'meta' | 'cohere' | 'custom';
```

## Supported Providers

| Provider | Brand Color | Abbreviation | Full Name |
|----------|-------------|--------------|-----------|
| OpenAI | #10A37F (green) | OAI | OpenAI |
| Anthropic | #D4A373 (gold) | ANT | Anthropic |
| Google | #4285F4 (blue) | GOO | Google |
| Meta | #0668E1 (blue) | MTA | Meta |
| Cohere | #39594D (dark green) | COH | Cohere |
| Custom | Secondary color | CUS | Custom |

## Responsive Behavior

### Card Size Variations

- **Compact**: Displays provider abbreviation (e.g., "ANT")
- **Standard**: Displays full provider name (e.g., "Anthropic")
- **XL**: Displays full provider name with larger sizing

## Examples

### OpenAI with Model

```tsx
<ProviderBadge
  provider="openai"
  modelName="gpt-4"
  cardSize="standard"
  slot="topLeft"
  isVisible={true}
  {...complicationProps}
/>
```

### Interactive Anthropic Badge

```tsx
<ProviderBadge
  provider="anthropic"
  modelName="claude-3-5-sonnet"
  onClick={() => handleProviderClick()}
  cardSize="standard"
  slot="topLeft"
  isVisible={true}
  {...complicationProps}
/>
```

### Compact Mode

```tsx
<ProviderBadge
  provider="google"
  modelName="gemini-pro"
  cardSize="compact"
  slot="topLeft"
  isVisible={true}
  {...complicationProps}
/>
```

## Accessibility

- **ARIA Labels**: Automatically generated labels include provider name and model (when provided)
- **Custom Labels**: Support for custom `aria-label` prop
- **Keyboard Navigation**: Full keyboard support when interactive (onClick provided)
- **Focus Indicators**: Visible focus ring for keyboard navigation
- **Tooltips**: Accessible tooltips with provider description and model details
- **Screen Readers**: Clear announcements of provider information

## Design Guidelines

### Placement

- **Recommended Slot**: `topLeft` - Provides prominent provider visibility
- **Alternative Slots**: Can be used in other slots based on design needs

### Visual Hierarchy

- Uses bold, uppercase text with brand colors
- Stands out without overwhelming other card content
- Compact mode reduces visual weight for dense layouts

### Branding

- Each provider uses authentic brand colors
- Maintains brand recognition while staying consistent with design system
- Custom providers use secondary color to indicate non-standard providers

## Testing

Comprehensive test coverage includes:
- All provider types and their branding
- Responsive sizing across card sizes
- Interactive behaviors (click handlers, event propagation)
- Accessibility compliance (WCAG AA)
- Keyboard navigation
- Tooltip functionality
- Visibility controls

## Storybook

View all variations and interactions in Storybook:
- `PromptCard/Components/ProviderBadge`

Available stories:
- All supported providers
- Card size variations
- Interactive examples
- Accessibility examples
- Edge cases and custom styling
