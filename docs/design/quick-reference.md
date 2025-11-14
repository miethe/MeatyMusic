# MeatyMusic Design System - Quick Reference

**Cheat Sheet for Rapid Development**

## Color Classes

### Backgrounds
```jsx
bg-base          // #0f0f1c - Body background
bg-surface       // #1a1625 - Cards, panels
bg-elevated      // #252137 - Elevated cards
bg-overlay       // #2d2742 - Hover states
```

### Text
```jsx
text-primary     // #f8f9fc - Primary text
text-secondary   // #b8bcc8 - Secondary text
text-muted       // #7c7f8c - Muted text
text-accent      // #8b87ff - Links, accents
```

### Borders
```jsx
border-default   // Default borders
border-strong    // Emphasized borders
border-subtle    // Subtle dividers
border-accent    // Focus/active borders
```

### Accents
```jsx
bg-primary-500   // #6366f1 - Main accent
bg-primary-700   // #5b4cfa - Darker accent
text-primary-500 // Accent text
border-primary-500 // Accent borders
```

### Semantic
```jsx
// Success (Green)
bg-success-500 text-success-300 border-success-500

// Warning (Orange)
bg-warning-500 text-warning-300 border-warning-500

// Error (Red)
bg-error-500 text-error-300 border-error-500

// Info (Blue)
bg-info-500 text-info-300 border-info-500
```

---

## Typography

### Headings
```jsx
// H1 - Page titles
<h1 className="text-5xl font-bold tracking-tight text-primary">

// H2 - Section headings
<h2 className="text-4xl font-bold tracking-tight text-primary">

// H3 - Subsections
<h3 className="text-3xl font-semibold tracking-tight text-primary">

// H4 - Card titles
<h4 className="text-2xl font-semibold text-primary">

// H5 - Component headers
<h5 className="text-xl font-semibold text-primary">

// H6 - Small headers
<h6 className="text-base font-semibold text-primary">
```

### Body Text
```jsx
// Large body
<p className="text-lg text-primary">

// Normal body (default)
<p className="text-base text-primary">

// Small text
<p className="text-sm text-secondary">

// Caption
<p className="text-xs text-muted">

// Overline/Label
<p className="text-xs font-semibold uppercase tracking-wider text-muted">
```

---

## Spacing

### Padding
```jsx
p-4    // 16px - Default card padding
p-6    // 24px - Standard card
p-8    // 32px - Large card
```

### Margin & Gap
```jsx
space-y-4   // 16px vertical spacing
space-y-6   // 24px section spacing
gap-4       // 16px grid gap
gap-6       // 24px larger gap
```

### Sections
```jsx
py-12   // 48px - Small section
py-16   // 64px - Medium section
py-20   // 80px - Large section
```

---

## Components

### Buttons

**Primary**
```jsx
<button className="px-6 py-3 bg-gradient-primary text-inverse font-semibold rounded-lg shadow-accent hover:shadow-xl transition-all duration-200 hover:scale-105">
  Primary Action
</button>

// Or use component:
<Button variant="primary">Primary Action</Button>
```

**Secondary**
```jsx
<button className="px-6 py-3 bg-elevated text-primary font-semibold rounded-lg border border-default hover:border-accent hover:bg-overlay transition-all duration-200">
  Secondary
</button>

// Or:
<Button variant="secondary">Secondary</Button>
```

**Ghost**
```jsx
<button className="px-6 py-3 text-primary font-medium rounded-lg hover:bg-overlay transition-all duration-200">
  Ghost
</button>

// Or:
<Button variant="ghost">Ghost</Button>
```

**Icon Button**
```jsx
<button className="p-3 text-secondary hover:text-primary hover:bg-overlay rounded-lg transition-all duration-200">
  <Icon className="w-5 h-5" />
</button>

// Or:
<Button variant="ghost" size="icon">
  <Icon className="w-5 h-5" />
</Button>
```

---

### Cards

**Standard Card**
```jsx
<div className="bg-surface border border-default rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
  {/* Content */}
</div>

// Or:
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

**Elevated Card**
```jsx
<div className="bg-elevated border border-strong rounded-xl p-8 shadow-lg hover:shadow-xl hover:border-accent transition-all duration-200">
  {/* Content */}
</div>

// Or:
<Card variant="elevated" padding="lg">
  {/* Content */}
</Card>
```

**Gradient Card**
```jsx
<div className="bg-gradient-card border border-accent/20 rounded-xl p-6 shadow-accent">
  {/* Content */}
</div>

// Or:
<Card variant="gradient">
  {/* Content */}
</Card>
```

---

### Inputs

**Text Input**
```jsx
<input
  type="text"
  className="w-full px-4 py-2.5 bg-elevated border border-default rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
  placeholder="Enter text..."
/>

// Or:
<Input placeholder="Enter text..." />
```

**With Label**
```jsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-primary">Label</label>
  <input className="input" />
</div>

// Or:
<Label htmlFor="input">Label</Label>
<Input id="input" />
```

**Error State**
```jsx
<input className="input border-error-500 focus:ring-error-500" />
<p className="text-xs text-error-300 mt-1">Error message</p>

// Or:
<Input error helperText="Error message" />
```

---

### Badges

**Status Badge**
```jsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 bg-success-bg border border-success-500/20 rounded-full text-xs font-medium text-success-300">
  <span className="w-1.5 h-1.5 bg-success-500 rounded-full"></span>
  Active
</span>

// Or:
<Badge variant="success" dot>Active</Badge>
```

**Simple Badge**
```jsx
<span className="inline-flex items-center px-2.5 py-1 bg-elevated border border-default rounded-full text-xs font-medium text-secondary">
  Tag
</span>

// Or:
<Badge>Tag</Badge>
```

---

### Navigation

**Active Nav Item**
```jsx
<a className="flex items-center gap-3 px-4 py-3 bg-overlay border-l-4 border-accent rounded-lg text-primary font-medium">
  <Icon className="w-5 h-5" />
  <span>Active</span>
</a>
```

**Inactive Nav Item**
```jsx
<a className="flex items-center gap-3 px-4 py-3 text-secondary hover:text-primary hover:bg-overlay rounded-lg transition-all duration-200">
  <Icon className="w-5 h-5" />
  <span>Inactive</span>
</a>
```

---

### Modals

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
  <div className="w-full max-w-lg bg-elevated border border-strong rounded-2xl shadow-xl p-8">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold text-primary">Title</h2>
      <button className="p-2 hover:bg-overlay rounded-lg">×</button>
    </div>

    {/* Content */}
    <div className="mb-6">
      <p className="text-base text-secondary">Content</p>
    </div>

    {/* Actions */}
    <div className="flex justify-end gap-3">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </div>
  </div>
</div>
```

---

## Layouts

### Dashboard Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stats cards */}
</div>
```

### Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### Container
```jsx
<div className="container mx-auto px-6 max-w-7xl">
  {/* Content */}
</div>
```

### Page Section
```jsx
<section className="py-16">
  <div className="max-w-7xl mx-auto px-6 space-y-8">
    {/* Section content */}
  </div>
</section>
```

---

## Shadows & Effects

### Shadows
```jsx
shadow-sm    // Subtle
shadow       // Default
shadow-md    // Medium
shadow-lg    // Large
shadow-xl    // Extra large
shadow-accent // Accent glow
```

### Border Radius
```jsx
rounded-lg   // 12px - Buttons, inputs
rounded-xl   // 16px - Cards
rounded-2xl  // 24px - Modals
rounded-full // Pills, avatars
```

### Transitions
```jsx
transition-all duration-200        // Default smooth transition
transition-shadow duration-200     // Shadow only
transition-colors duration-200     // Colors only
transition-transform duration-200  // Transform only
```

---

## States

### Hover
```jsx
hover:bg-overlay
hover:text-primary
hover:border-accent
hover:shadow-lg
hover:scale-105
```

### Focus
```jsx
focus:outline-none
focus:ring-2
focus:ring-accent
focus:border-accent
```

### Active
```jsx
active:scale-98
active:bg-overlay
```

### Disabled
```jsx
disabled:opacity-50
disabled:cursor-not-allowed
disabled:transform-none
```

---

## Loading States

### Spinner
```jsx
<div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin"></div>
```

### Skeleton
```jsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-elevated rounded w-3/4"></div>
  <div className="h-4 bg-elevated rounded w-1/2"></div>
</div>
```

### Progress Bar
```jsx
<div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
  <div className="h-full bg-gradient-primary rounded-full" style={{ width: '60%' }}></div>
</div>
```

---

## Empty States

```jsx
<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
  <Icon className="w-16 h-16 text-muted mb-4" />
  <h3 className="text-xl font-semibold text-primary mb-2">No items yet</h3>
  <p className="text-sm text-secondary mb-6 max-w-md">
    Get started by creating your first item.
  </p>
  <Button variant="primary">Create Item</Button>
</div>
```

---

## Icons

### Sizes
```jsx
w-3 h-3   // 12px - Extra small
w-4 h-4   // 16px - Small
w-5 h-5   // 20px - Medium (default)
w-6 h-6   // 24px - Large
w-8 h-8   // 32px - Extra large
```

### Colors
```jsx
text-primary     // Primary icons
text-secondary   // Secondary icons
text-muted       // Muted icons
text-accent      // Accent icons
```

### Usage
```jsx
import { HomeIcon } from '@heroicons/react/24/outline'

<HomeIcon className="w-5 h-5 text-secondary" />
```

---

## Responsive

### Breakpoints
```jsx
sm:   // 640px - Mobile landscape
md:   // 768px - Tablet
lg:   // 1024px - Desktop
xl:   // 1280px - Large desktop
2xl:  // 1536px - Extra large
```

### Examples
```jsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Responsive text
<h1 className="text-3xl md:text-4xl lg:text-5xl">

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">

// Show/hide
<div className="hidden md:block">
```

---

## Accessibility

### Focus Rings
```jsx
focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base
```

### ARIA Labels
```jsx
<button aria-label="Close modal">
  <XIcon className="w-5 h-5" />
</button>
```

### Semantic HTML
```jsx
<nav aria-label="Main navigation">
<main aria-label="Main content">
<section aria-labelledby="section-title">
```

---

## Common Patterns

### Card with Action
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <Button variant="ghost" size="sm">View All</Button>
  </CardHeader>
  <CardContent>
    {/* List items */}
  </CardContent>
</Card>
```

### List Item
```jsx
<div className="flex items-center justify-between p-4 bg-elevated rounded-lg hover:bg-overlay transition-all duration-200 cursor-pointer">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-gradient-primary rounded-lg"></div>
    <div>
      <h4 className="font-semibold text-primary">Item Title</h4>
      <p className="text-sm text-secondary">Description</p>
    </div>
  </div>
  <Badge variant="success">Status</Badge>
</div>
```

### Stat Card
```jsx
<Card variant="elevated" padding="md">
  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
    Label
  </p>
  <p className="text-3xl font-bold text-primary">142</p>
  <p className="text-sm text-success-300 mt-2">+12% this month</p>
</Card>
```

### Form Field
```jsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-primary">
    Field Label
  </label>
  <input className="input" />
  <p className="text-xs text-muted">Helper text</p>
</div>
```

---

## CSS Utilities

### Custom Gradient Text
```jsx
<h1 className="text-gradient">
  Gradient Text
</h1>

// CSS:
.text-gradient {
  @apply bg-gradient-primary bg-clip-text text-transparent;
}
```

### Custom Animations
```jsx
<div className="animate-fade-in">
<div className="animate-slide-up">
<div className="animate-scale-in">
```

---

## Debugging

### Border Colors (Visual Debugging)
```jsx
border border-red-500    // Temporary red border
border-2 border-yellow-500 // Thicker yellow border
```

### Background Colors
```jsx
bg-red-500/10    // 10% opacity red background
bg-blue-500/20   // 20% opacity blue background
```

---

## Tips

1. **Start with the base** - Begin with `bg-base` on body
2. **Layer up** - Use `bg-surface` → `bg-elevated` for depth
3. **Consistent transitions** - Always use `transition-all duration-200`
4. **Spacing rhythm** - Stick to 4px grid (4, 8, 12, 16, 24, 32, etc.)
5. **Mobile first** - Design for mobile, enhance for desktop
6. **Use components** - Prefer `<Button>` over styled `<button>`
7. **Semantic colors** - Use success/warning/error for feedback
8. **Test contrast** - Verify text is readable on backgrounds

---

**Print this page and keep it handy for quick reference!**

Last updated: 2025-11-14
