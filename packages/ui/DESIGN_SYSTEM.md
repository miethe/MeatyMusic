# MeatyMusic Design System

Comprehensive dark mode design system for the Agentic Music Creation System (AMCS).

## Overview

The MeatyMusic design system is built with a **dark mode first** philosophy, featuring:

- **10-level neutral color scale** optimized for dark backgrounds
- **Purple/Blue gradient accent colors** for primary interactions
- **8-level typography hierarchy** for clear information architecture
- **4px base spacing system** for consistent rhythm
- **5-level elevation/shadow system** for depth and hierarchy
- **Comprehensive component library** with all states covered

## Design Tokens

All design tokens are defined in `/packages/tokens/css/tokens.css` using CSS custom properties with the `--mm-` prefix.

### Color System

#### Primary Accent - Purple/Blue Gradient
```css
--mm-color-primary: #6366f1
--mm-color-primary-600: #7c3aed
--mm-color-ring: #5b4cfa
```

#### Neutral Gray Scale (10 levels)
```css
--mm-color-neutral-50: #fafafa   /* Lightest */
--mm-color-neutral-100: #f5f5f5
--mm-color-neutral-200: #e5e5e5
--mm-color-neutral-300: #d4d4d4
--mm-color-neutral-400: #a3a3a3
--mm-color-neutral-500: #737373
--mm-color-neutral-600: #525252
--mm-color-neutral-700: #404040
--mm-color-neutral-800: #262626
--mm-color-neutral-900: #171717
--mm-color-neutral-950: #0a0a0a   /* Darkest */
```

#### Surface Colors (Dark Mode)
```css
--mm-color-bg: #0f0f1c          /* Base background */
--mm-color-surface: #1a1625     /* Card backgrounds */
--mm-color-panel: #252137       /* Elevated panels */
--mm-color-elevated: #2d2742    /* Higher elevation */
--mm-color-overlay: #3f3a56     /* Overlays, modals */
```

#### Border Colors (Dark Mode)
```css
--mm-color-border-subtle: #1f1b2e    /* Barely visible borders */
--mm-color-border-default: #2d2742   /* Standard borders */
--mm-color-border-strong: #3f3a56    /* Emphasized borders */
--mm-color-border-accent: #5b4cfa    /* Accent borders */
```

#### Text Colors (Dark Mode)
```css
--mm-color-text-primary: #f8f9fc     /* Primary text */
--mm-color-text-secondary: #b8bcc8   /* Secondary text */
--mm-color-text-tertiary: #7c7f8c    /* Tertiary text */
--mm-color-text-disabled: #5a5d6a    /* Disabled text */
--mm-color-text-accent: #8b87ff      /* Accent text */
```

#### Semantic Colors
```css
--mm-color-success-500: #22c55e
--mm-color-warning-500: #f97316
--mm-color-error-500: #ef4444
--mm-color-info-500: #3b82f6
```

### Typography Hierarchy (8 Levels)

| Level   | Size | Line Height | Weight | Usage                    |
|---------|------|-------------|--------|--------------------------|
| Display | 48px | 56px        | 600    | Hero sections            |
| H1      | 36px | 44px        | 600    | Page titles              |
| H2      | 30px | 38px        | 600    | Section titles           |
| H3      | 24px | 32px        | 600    | Subsection titles        |
| H4      | 20px | 28px        | 600    | Card titles              |
| Body    | 16px | 24px        | 400    | Body text                |
| Small   | 14px | 20px        | 400    | Helper text, labels      |
| XS      | 12px | 16px        | 400    | Captions, fine print     |

#### Font Families
```css
--mm-font-family-ui: Inter, ui-sans-serif, system-ui, sans-serif
--mm-font-family-mono: 'JetBrains Mono', monospace
--mm-font-family-display: 'Plus Jakarta Sans', Inter, sans-serif
```

### Spacing System (4px base)

```css
--mm-spacing-xs: 4px
--mm-spacing-sm: 8px
--mm-spacing-md: 16px
--mm-spacing-lg: 24px
--mm-spacing-xl: 32px
--mm-spacing-2xl: 48px
--mm-spacing-3xl: 64px
--mm-spacing-4xl: 96px
```

### Elevation/Shadow System (5 levels)

| Level | Usage      | Shadow Value                                                    |
|-------|------------|-----------------------------------------------------------------|
| 0     | Flat       | `none`                                                          |
| 1     | Cards      | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)`         |
| 2     | Dropdowns  | `0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)` |
| 3     | Modals     | `0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.2)` |
| 4     | Tooltips   | `0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.2)` |

#### Accent Glow
```css
--mm-shadow-accent-glow: 0 0 20px rgba(91, 76, 250, 0.4)
--mm-shadow-accent-glow-lg: 0 0 32px rgba(91, 76, 250, 0.5)
```

### Motion System

#### Duration
```css
--mm-duration-fast: 150ms     /* Micro-interactions */
--mm-duration-base: 250ms     /* Standard transitions */
--mm-duration-slow: 350ms     /* Complex animations */
```

#### Easing
```css
--mm-easing-in-out: cubic-bezier(0.4, 0, 0.2, 1)  /* Standard easing */
--mm-easing-out: cubic-bezier(0, 0, 0.2, 1)       /* Enter animations */
--mm-easing-in: cubic-bezier(0.4, 0, 1, 1)        /* Exit animations */
```

### Border Radius

```css
--mm-radius-sm: 4px
--mm-radius-md: 8px
--mm-radius-lg: 12px
--mm-radius-xl: 16px
--mm-radius-full: 9999px
```

## Component Library

### Button Component

**Variants**: Primary, Secondary, Ghost, Outline
**Sizes**: sm, md, lg, icon
**States**: default, hover, active, disabled, loading

```tsx
import { Button } from '@meatymusic/ui';

// Primary (default)
<Button variant="primary">Create</Button>

// Secondary (outlined accent)
<Button variant="secondary">Cancel</Button>

// Ghost (transparent)
<Button variant="ghost">More Options</Button>

// Outline (bordered)
<Button variant="outline">Edit</Button>

// With loading state
<Button loading loadingText="Saving...">Save</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

### Card Component

**Variants**: Default, Elevated, Gradient
**Padding**: none, sm, md, lg
**States**: default, hover, focus, interactive

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@meatymusic/ui';

// Default card
<Card variant="default">
  <CardHeader>
    <CardTitle>Song Title</CardTitle>
    <CardDescription>Description here</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>

// Elevated card (with more shadow)
<Card variant="elevated">...</Card>

// Gradient card
<Card variant="gradient">...</Card>

// Interactive card (clickable)
<Card interactive>...</Card>
```

### Input Components

#### Text Input
**Variants**: default, success, error, warning
**States**: default, hover, focus, error, disabled

```tsx
import { Input } from '@meatymusic/ui';

<Input
  label="Song Name"
  placeholder="Enter song name"
  helperText="A descriptive name for your song"
/>

<Input
  error
  helperText="This field is required"
/>
```

#### Textarea
**Same variants and states as Input**

```tsx
import { Textarea } from '@meatymusic/ui';

<Textarea
  label="Lyrics"
  placeholder="Enter lyrics..."
  helperText="Write your song lyrics here"
  rows={6}
/>
```

#### Checkbox
**Variants**: default, success, error, warning
**States**: checked, unchecked, indeterminate, disabled

```tsx
import { Checkbox } from '@meatymusic/ui';

<Checkbox
  label="Enable auto-save"
  description="Automatically save changes as you type"
/>
```

#### Radio Group
**Same variants as Checkbox**

```tsx
import { RadioGroup, RadioGroupItem } from '@meatymusic/ui';

<RadioGroup defaultValue="option1">
  <RadioGroupItem value="option1" label="Option 1" />
  <RadioGroupItem value="option2" label="Option 2" />
</RadioGroup>
```

#### Switch/Toggle
**States**: on, off, disabled

```tsx
import { Switch } from '@meatymusic/ui';

<Switch />
```

### Badge Component

**Variants**: default, secondary, outline, success, warning, error, info
**Sizes**: sm, md, lg
**Shapes**: rounded, pill

```tsx
import { Badge } from '@meatymusic/ui';

<Badge variant="secondary">Genre</Badge>
<Badge variant="success">Published</Badge>
<Badge variant="outline">Draft</Badge>
```

## Usage Guidelines

### Accessibility

All components meet WCAG 2.1 AA standards:

- **Contrast Ratios**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Indicators**: Visible focus states on all interactive elements

### Performance

- **CSS Variables**: Runtime theme switching without rebuild
- **Minimal JS**: Most styling done via Tailwind CSS
- **Tree-shakeable**: Import only what you use

### Mobile First

- Components are responsive by default
- Touch targets are minimum 44x44px
- Mobile gestures supported where appropriate

## Implementation Example

```tsx
import { Card, CardContent, Button, Input, Badge } from '@meatymusic/ui';

function StyleCard({ style }) {
  return (
    <Card variant="elevated" interactive>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {style.name}
          </h3>
          <Badge variant="secondary">{style.genre}</Badge>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          {style.description}
        </p>

        <div className="flex gap-2">
          <Button size="sm" variant="primary">Edit</Button>
          <Button size="sm" variant="outline">Clone</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Migration from Legacy MP Tokens

Legacy `--mp-*` tokens are automatically mapped to new `--mm-*` tokens for backward compatibility. However, new code should use the `--mm-*` tokens directly.

```css
/* Legacy (still works) */
var(--mp-color-bg)

/* New (recommended) */
var(--mm-color-bg)
```

## Resources

- **Tokens**: `/packages/tokens/css/tokens.css`
- **Components**: `/packages/ui/src/components/`
- **Tailwind Config**: `/apps/web/tailwind.config.js`
- **Global Styles**: `/apps/web/src/app/globals.css`
