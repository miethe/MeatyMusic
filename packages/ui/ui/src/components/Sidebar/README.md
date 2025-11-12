# Sidebar Component System

A flexible and accessible sidebar component system for React applications with responsive behavior, error boundaries, and dynamic content loading.

## Components

### Sidebar

The base sidebar component with responsive behavior, ARIA compliance, and smooth transitions.

```tsx
import { Sidebar } from '@meaty/ui';

<Sidebar
  isOpen={true}
  onOpenChange={setIsOpen}
  mobileBreakpoint={768}
  transitionDuration={150}
>
  <div>Sidebar content</div>
</Sidebar>
```

#### Props

- `isOpen` (boolean): Controls sidebar visibility
- `onOpenChange` (function): Callback when open state should change
- `mobileBreakpoint` (number): Pixel width for mobile behavior (default: 768)
- `transitionDuration` (number): Transition duration in milliseconds (default: 150)
- `position` ('left' | 'right'): Sidebar position (default: 'left')
- `width` (number): Desktop width in pixels (default: 260, per MP-SBR-SYS-004)
- `mobileWidth` (number): Mobile width in pixels (default: 320, per MP-SBR-SYS-004)
- `collapsible` (boolean): Enable collapse behavior (default: false)
- `overlay` (boolean): Show backdrop on mobile (default: true)

#### Features

- **Responsive**: Automatically switches to overlay mode on mobile
- **Accessible**: ARIA landmarks, focus trapping, keyboard navigation
- **Smooth Transitions**: CSS-based animations for performance
- **Auto-hide**: Automatically hides when empty with `aria-hidden="true"`
- **Performance**: <50ms render time with optimized CSS transforms

### SidebarContent

Wrapper component with error boundary and loading states.

```tsx
import { SidebarContent, SidebarSkeleton } from '@meaty/ui';

<SidebarContent
  loading={isLoading}
  error={hasError}
  loadingSkeleton={<SidebarSkeleton variant="filters" />}
  onError={(error, errorInfo) => console.error(error)}
>
  <YourSidebarContent />
</SidebarContent>
```

#### Props

- `loading` (boolean): Show loading skeleton
- `error` (boolean): Show error fallback
- `loadingSkeleton` (ReactNode): Custom loading component
- `fallback` (ReactNode): Custom error fallback
- `onError` (function): Error boundary callback

### SidebarSkeleton

Loading skeleton with multiple variants for different content types.

```tsx
import { SidebarSkeleton } from '@meaty/ui';

<SidebarSkeleton
  variant="filters"
  animated={true}
  lines={6}
/>
```

#### Variants

- `default`: Generic skeleton with configurable lines
- `filters`: Optimized for filter forms
- `navigation`: Optimized for navigation menus
- `content`: Optimized for text content

## Accessibility

### ARIA Compliance

- Uses `role="complementary"` for sidebar landmark
- Proper `aria-hidden` handling for empty sidebars
- `aria-label` for screen reader context
- Focus trapping on mobile when open

### Keyboard Navigation

- **Tab**: Navigate through focusable elements
- **Shift+Tab**: Navigate backwards
- **Escape**: Close sidebar on mobile
- Focus returns to trigger when closed

### Screen Reader Support

- Announces sidebar state changes
- Proper landmark navigation
- Content structure with headings
- Error state announcements

## Responsive Behavior (MP-SBR-SYS-004)

### Mobile (<768px)
- **Width**: Auto (default 320px, max 85vw)
- **Behavior**: Collapses to off-canvas overlay
- **Features**:
  - Overlay pattern with backdrop and blur
  - Full-height sliding animation
  - Touch-friendly swipe-to-close gestures
  - Escape key and click-outside-to-close
  - Focus trapping for accessibility
  - Minimum 44x44px touch targets

### Tablet (768px - 1024px)
- **Width**: 200px (fixed)
- **Behavior**: Always visible sidebar
- **Features**:
  - Persistent visibility alongside content
  - Smooth transitions during viewport changes
  - Optimized for touch and mouse interaction

### Desktop (>1024px)
- **Width**: 260px (fixed)
- **Behavior**: Always visible sidebar
- **Features**:
  - Persistent visibility alongside content
  - Optional collapsible behavior
  - Smooth width transitions
  - Optimized for keyboard and mouse interaction

## Performance Optimizations

- CSS-only animations using `transform` and `opacity`
- `will-change` property for smooth animations
- Lazy loading for sidebar content components
- Memoized calculations to prevent unnecessary re-renders
- <50ms render time target with performance monitoring

## Error Handling

### Error Boundary Features
- Automatic error catching and recovery
- User-friendly error messages
- Retry functionality
- Telemetry integration for error tracking

### Error States
- Component load failures
- Network request errors
- Invalid configuration
- Runtime exceptions

## Integration Examples

### Basic Implementation
```tsx
function MyApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      <Sidebar
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      >
        <SidebarContent>
          <MyFilters />
        </SidebarContent>
      </Sidebar>
      <main className="flex-1">
        <MyMainContent />
      </main>
    </div>
  );
}
```

### With Error Handling
```tsx
<Sidebar isOpen={isOpen}>
  <SidebarContent
    loading={isLoading}
    loadingSkeleton={<SidebarSkeleton variant="filters" />}
    onError={(error) => trackError(error)}
  >
    <Suspense fallback={<SidebarSkeleton />}>
      <LazyFilters />
    </Suspense>
  </SidebarContent>
</Sidebar>
```

## Migration Guide

### From Sheet-based Filters

1. Remove `Sheet` wrapper components
2. Create sidebar content component
3. Update trigger buttons to use sidebar state
4. Test responsive behavior

**Before:**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Filters</Button>
  </SheetTrigger>
  <SheetContent>
    <Filters />
  </SheetContent>
</Sheet>
```

**After:**
```tsx
// Filters now render automatically in sidebar
// Button removed - sidebar handles display
<Filters />
```

### From Static Sidebar

1. Replace static component with `Sidebar`
2. Add responsive props
3. Implement state management
4. Add error boundaries

## Testing

### Unit Tests
```bash
npm test Sidebar
```

### Visual Testing (Storybook)
```bash
npm run storybook
```

### E2E Testing (Playwright)
```bash
npm run test:e2e -- sidebar
```

## Troubleshooting

### Common Issues

**Sidebar not showing**
- Check `hasContent` state
- Verify route configuration
- Check console for errors

**Layout shifts**
- Ensure skeleton matches content dimensions
- Use consistent padding/margins
- Reserve space during loading

**Mobile overlay issues**
- Verify `mobileBreakpoint` setting
- Check z-index conflicts
- Test focus trapping

**Performance issues**
- Monitor render times in DevTools
- Check for unnecessary re-renders
- Verify CSS animation performance
