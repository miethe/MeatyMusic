# PromptCard Component System

## Overview

The PromptCard is the atomic UI unit of MeatyPrompts, designed to provide a consistent and accessible interface for prompt display across all application contexts. This component system implements comprehensive state management, accessibility features, and design token compliance as specified in **MP-PCARD-CMP-004**.

## Enhanced Features (MP-PCARD-CMP-004)

### State Management System

The component now includes an advanced state system with:

- **Default State**: Standard appearance with hover elevation changes
- **Running State**: Animated 2px progress bar with shimmer effects
- **Error State**: Enhanced error panel with 4px left border and retry functionality
- **Selected State**: 2px primary border without elevation change
- **Disabled State**: 50% opacity with all interactions prevented
- **Focus State**: 2px ring with proper offset using design tokens

### Accessibility Enhancements

- **ARIA Live Regions**: State changes are announced to screen readers
- **Enhanced Focus Management**: Visible focus rings with proper keyboard navigation
- **Keyboard Shortcuts**: Support for Enter, Space, Ctrl+E, Ctrl+F, and Escape
- **Screen Reader Support**: Comprehensive ARIA labels and semantic HTML
- **Reduced Motion Support**: Respects user preferences for animation

### Performance Features

- **Zero Layout Shift**: Skeleton components maintain exact dimensions
- **Efficient Rendering**: Memoized components with optimized re-render logic
- **Design Token Integration**: Consistent theming and easy customization

## Components

### PromptCard

The main component with three size variants and comprehensive state management.

```tsx
import { PromptCard } from '@meaty/ui';

<PromptCard
  title="Marketing Email Template"
  version={1}
  access="public"
  tags={['email', 'marketing']}
  model="gpt-4"
  lastRun={new Date()}
  bodyPreview="Create professional marketing emails..."
  metrics={{ runs: 89, successRate: 0.94, avgCost: 0.015 }}
  // Enhanced state props
  state="selected"
  disabled={false}
  isRunning={false}
  error="Rate limit exceeded"
  onStateChange={(change) => console.log('State changed:', change)}
  // Action handlers
  onRun={() => console.log('Running prompt')}
  onEdit={() => console.log('Editing prompt')}
  onFork={() => console.log('Forking prompt')}
/>
```

### PromptCardSkeleton

Loading skeleton composed from `LoadingSkeleton` primitives to match card dimensions with zero layout shift and optional shimmer animation.

```tsx
import { PromptCardSkeleton, PromptCardGridSkeleton } from '@meaty/ui';

// Single skeleton
<PromptCardSkeleton
  size="standard"
  shimmer={true}
/>

// Grid of skeletons
<PromptCardGridSkeleton
  count={6}
  size="standard"
  columns={3}
  shimmer={true}
/>
```

## Props Reference

### PromptCard Props

#### Core Props
- `title: string` - Prompt title (required)
- `version?: number` - Version number (default: 1)
- `access?: 'private' | 'public' | 'shared'` - Access level
- `tags?: string[]` - Tag array for categorization
- `model?: string` - AI model identifier
- `lastRun?: Date` - Last execution timestamp

#### Content Props
- `bodyPreview?: string` - Prompt content preview
- `metrics?: { runs?: number; successRate?: number; avgCost?: number; avgTime?: number }` - Analytics metrics grouped into a single object

#### State Props (Enhanced in MP-PCARD-CMP-004)
- `size?: 'compact' | 'standard' | 'xl'` - Size variant
- `state?: 'default' | 'running' | 'error' | 'disabled' | 'selected'` - Visual state
- `disabled?: boolean` - Disabled state override
- `isRunning?: boolean` - Running state override
- `error?: string | { message: string; retry?: () => void }` - Error state with optional retry

#### Event Handlers
- `onRun?: () => void` - Run button handler
- `onEdit?: () => void` - Edit button handler
- `onFork?: () => void` - Fork button handler
- `onMenuAction?: (action: string) => void` - Menu action handler
- `onStateChange?: (change: StateChange) => void` - State change callback

#### Accessibility Props
- `aria-label?: string` - Custom ARIA label
- `aria-describedby?: string` - ARIA description reference

#### XL Variant Props
- `blockChips?: BlockChipsRowProps['chips']` - Structured prompt components
- `provenance?: ProvenanceInfo` - Authorship and creation metadata
- `extendedStats?: ExtendedStatsInfo` - Performance visualizations
- `onCompare?: () => void` - Compare action (XL only)
- `onAnalytics?: () => void` - Analytics action (XL only)
- `onHistory?: () => void` - History action (XL only)

### PromptCardSkeleton Props

- `size?: 'compact' | 'standard' | 'xl'` - Size variant to match
- `shimmer?: boolean` - Enable shimmer animation (default: true)
- `className?: string` - Custom CSS classes

### PromptCardGridSkeleton Props

- `count?: number` - Number of skeletons (default: 6)
- `size?: 'compact' | 'standard' | 'xl'` - Size variant
- `shimmer?: boolean` - Enable shimmer animation
- `columns?: number` - Grid columns (1-4, default: 3)
- `className?: string` - Custom CSS classes

## State System

### State Hierarchy

States are determined in the following priority order:

1. `disabled` - Overrides all other states
2. `isRunning` - Takes precedence over error and manual state
3. `error` - Takes precedence over manual state
4. `state` - Manual state setting
5. `'default'` - Fallback state

### State Transitions

The component tracks state changes and provides callbacks:

```tsx
<PromptCard
  onStateChange={(change) => {
    console.log('State transition:', {
      from: change.from,
      to: change.to,
      timestamp: change.timestamp,
      reason: change.reason
    });
  }}
/>
```

### State Combinations

The component supports multiple state combinations:

- **Selected + Focus**: Selected state with focus ring
- **Running + Hover**: Running state prevents hover elevation
- **Error + Focus**: Error state with keyboard focus
- **Disabled**: Overrides all other visual states

## Size Variants

### Compact (`compact`)
- **Dimensions**: 288-360px width × max 220px height
- **Content**: Shows first 2 tags OR model chip (prioritizing tags)
- **Actions**: Icon-only Edit and Fork buttons
- **Hidden**: Body preview, stats row
- **Use Case**: High-density grid layouts

### Standard (`standard`)
- **Dimensions**: 360-420px width × variable height
- **Content**: Up to 4 tags + model chip, 3-line body preview
- **Actions**: Full button labels
- **Stats**: Runs, success rate, cost/time
- **Use Case**: Default card display

### XL (`xl`)
- **Dimensions**: 560px+ width × variable height
- **Content**: All features including block chips, provenance, extended stats
- **Actions**: Additional Compare, Analytics, History buttons
- **Enhanced**: 4-line body preview, sparkline visualizations
- **Use Case**: Detailed single-card view

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|---------|
| `Tab` | Focus next card |
| `Shift + Tab` | Focus previous card |
| `Enter` / `Space` | Run focused card |
| `Ctrl/Cmd + E` | Edit focused card |
| `Ctrl/Cmd + F` | Fork focused card |
| `Escape` | Remove focus from selected card |

### Screen Reader Support

- **Role**: `button` with appropriate labels
- **Live Regions**: State changes announced automatically
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Error Announcements**: Errors announced via `role="alert"`

### Focus Management

- **Visible Focus Ring**: 2px ring using `--mp-color-ring` token
- **Focus Offset**: 2px offset for better visibility
- **Focus Order**: Logical tab sequence
- **Focus Trap**: Escape key removes focus from selected cards

## Design Tokens

The component uses design tokens for consistent theming:

### Colors
- `--mp-color-ring` - Focus ring color
- `--mp-color-primary` - Primary actions and selected state
- `--mp-color-danger` - Error states and retry buttons
- `--mp-color-info` - Running state progress bar
- `--mp-color-text-strong` - Primary text
- `--mp-color-text-muted` - Secondary text

### Elevation
- `--mp-elevation-1` - Default card shadow
- `--mp-elevation-2` - Hover state shadow

### Spacing
- `--mp-spacing-2` - Small gaps
- `--mp-spacing-3` - Medium gaps
- `--mp-spacing-4` - Card padding

### Motion
- `--mp-motion-duration-ui` - Transition timing (150ms)
- `--mp-motion-easing-enter` - Entrance animation easing

### Border Radius
- `--mp-radius-sm` - Small radius for badges
- `--mp-radius-md` - Card border radius (12px)

## Error Handling

### Error Boundary

All PromptCard components are wrapped with error boundaries:

```tsx
import { PromptCardErrorBoundary } from '@meaty/ui';

<PromptCardErrorBoundary>
  <PromptCard {...props} />
</PromptCardErrorBoundary>
```

### Error States

#### String Errors
```tsx
<PromptCard error="Rate limit exceeded" />
```

#### Object Errors with Retry
```tsx
<PromptCard
  error={{
    message: "Network timeout occurred",
    retry: () => console.log("Retrying...")
  }}
/>
```

## Performance

### Metrics

- **Initial Render**: <50ms (P95)
- **Hover Interaction**: <100ms
- **Layout Shift**: CLS = 0 with skeleton
- **Memory**: Optimized with React.memo

### Optimizations

- **Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Skeleton shown during data fetching
- **Token-based Styling**: Efficient theme switching
- **GPU Acceleration**: CSS transforms for animations

## Testing

### Test Coverage

- **Unit Tests**: Component logic, state management, props
- **Integration Tests**: User interactions, keyboard navigation
- **Accessibility Tests**: WCAG 2.1 AA compliance with jest-axe
- **Visual Regression**: Chromatic snapshots for all states

### Test Files

- `PromptCard.test.tsx` - Core functionality tests
- `PromptCard.states.test.tsx` - State management tests
- `PromptCardSkeleton.test.tsx` - Skeleton component tests

## Migration Guide

### From apps/web Skeleton

The `PromptCardSkeleton` component has been moved from `apps/web/src/components/skeletons` to `packages/ui/src/components/PromptCard`. Update imports:

```tsx
// Old
import { PromptCardSkeleton } from '../components/skeletons/PromptCardSkeleton';

// New
import { PromptCardSkeleton } from '@meaty/ui';
```

### New Props in MP-PCARD-CMP-004

Enhanced props for improved functionality:

```tsx
// State management
onStateChange={(change) => trackStateChange(change)}
disabled={isDisabled}

// Enhanced error handling
error={{ message: "Error occurred", retry: handleRetry }}

// Accessibility
aria-label="Custom card label"
aria-describedby="description-id"
```

## Best Practices

### State Management

1. **Use State Callbacks**: Track state changes for analytics
2. **Handle Errors Gracefully**: Provide retry functionality when possible
3. **Respect User Preferences**: Support reduced motion and high contrast
4. **Maintain Focus**: Use proper focus management for accessibility

### Performance

1. **Use Skeletons**: Show loading states to prevent layout shift
2. **Memoize Callbacks**: Prevent unnecessary re-renders
3. **Limit Re-renders**: Use stable references for props
4. **Choose Appropriate Size**: Use compact for grids, XL for details

### Accessibility

1. **Provide Labels**: Use descriptive ARIA labels
2. **Support Keyboard**: Test all keyboard interactions
3. **Announce Changes**: Let live regions handle state announcements
4. **Test with Screen Readers**: Verify actual accessibility

## Examples

### Basic Usage

```tsx
<PromptCard
  title="Simple Prompt"
  version={1}
  access="private"
  onRun={() => executePrompt()}
/>
```

### Complete Card

```tsx
<PromptCard
  title="Advanced Marketing Campaign Generator"
  version={3}
  access="shared"
  tags={['marketing', 'campaigns']}
  model="gpt-4"
  lastRun={new Date(Date.now() - 1000 * 60 * 15)}
  bodyPreview="Generate comprehensive marketing strategies..."
  runs={156}
  successRate={0.94}
  avgCost={0.028}
  avgTime={2.3}
  size="xl"
  blockChips={{
    persona: "Marketing strategist",
    context: "Product launch campaign",
    output: "Campaign strategy document",
    instructions: "Include timeline and budget"
  }}
  provenance={{
    originalAuthor: "Sarah Chen",
    lastEditor: "Mike Johnson",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  }}
  onRun={() => executePrompt()}
  onEdit={() => openEditor()}
  onFork={() => createFork()}
  onStateChange={(change) => analytics.track('card_state_change', change)}
/>
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {prompts.map(prompt => (
    <PromptCard
      key={prompt.id}
      size="standard"
      title={prompt.title}
      {...prompt}
    />
  ))}
</div>
```

### Loading States

```tsx
{loading ? (
  <PromptCardGridSkeleton count={6} size="standard" />
) : (
  <div className="grid grid-cols-3 gap-4">
    {prompts.map(prompt => (
      <PromptCard key={prompt.id} {...prompt} />
    ))}
  </div>
)}
```

## Support

For questions or issues with the PromptCard component system:

1. Check this documentation
2. Review Storybook stories for examples
3. Check test files for usage patterns
4. Create an issue in the project repository

## Changelog

### MP-PCARD-CMP-004 (Enhanced State Management)

- ✅ Enhanced state system with hover, focus, selected, running, error, disabled
- ✅ ARIA live regions for state announcements
- ✅ Keyboard shortcuts and improved navigation
- ✅ Enhanced error handling with retry functionality
- ✅ Performance optimizations and reduced motion support
- ✅ Comprehensive test coverage and accessibility compliance
- ✅ Skeleton component moved to packages/ui
- ✅ Updated Storybook stories with all state variations
