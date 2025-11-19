# Entity Pages Design System Migration Checklist

Quick reference for updating entity CRUD pages to use the MeatyMusic design system.

## Pages to Update

- [ ] `/apps/web/src/app/(dashboard)/entities/songs/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/lyrics/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/personas/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/producer-notes/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/blueprints/page.tsx`
- [ ] `/apps/web/src/app/(dashboard)/entities/sources/page.tsx`
- [x] `/apps/web/src/app/(dashboard)/entities/styles/page.tsx` (Complete - use as reference)

## Component Replacements

### 1. Search Input
**Before:**
```tsx
<input
  type="search"
  className="w-full px-4 py-2 rounded-lg border..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

**After:**
```tsx
<Input
  type="search"
  placeholder="Search [entity]..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  icon={<EntityIcon className="w-4 h-4" />}
/>
```

### 2. Buttons
**Before:**
```tsx
<Button>Create Style</Button>
```

**After:**
```tsx
<Button variant="primary">
  <Plus className="w-4 h-4" />
  Create Style
</Button>

<Button variant="outline">
  <Filter className="w-4 h-4" />
  Filters
</Button>
```

### 3. Cards
**Before:**
```tsx
<Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12">
  <Loader2 className="w-16 h-16" />
  <p>Loading...</p>
</Card>
```

**After:**
```tsx
{/* Loading State */}
<Card variant="default" padding="lg" className="text-center">
  <Loader2 className="w-16 h-16 mx-auto text-[var(--mm-color-text-tertiary)] mb-4 animate-spin" />
  <p className="text-[var(--mm-color-text-secondary)] text-sm">Loading...</p>
</Card>

{/* Empty State */}
<Card variant="gradient" padding="lg" className="text-center">
  <div className="max-w-md mx-auto">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--mm-color-panel)] mb-4">
      <EntityIcon className="w-8 h-8 text-[var(--mm-color-primary)]" />
    </div>
    <h3 className="text-lg font-semibold text-[var(--mm-color-text-primary)] mb-2">
      No items yet
    </h3>
    <p className="text-[var(--mm-color-text-secondary)] mb-6 text-sm">
      Create your first item to get started
    </p>
    <Button variant="primary" size="lg">
      <Plus className="w-4 h-4" />
      Create First Item
    </Button>
  </div>
</Card>

{/* Item Cards */}
<Card variant="elevated" padding="md" interactive className="h-full">
  {/* Content */}
</Card>
```

### 4. Typography
**Before:**
```tsx
<h3 className="text-lg font-medium text-text-primary mb-2">
```

**After:**
```tsx
<h3 className="text-lg font-semibold text-[var(--mm-color-text-primary)] group-hover:text-[var(--mm-color-primary)] transition-colors mb-2">
```

### 5. Badges
**Before:**
```tsx
<Badge variant="secondary">{genre}</Badge>
```

**After:**
```tsx
<Badge variant="secondary" size="sm">
  <Icon className="w-3 h-3" />
  {genre}
</Badge>
```

## Page Structure Template

```tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Badge, Input } from '@meatymusic/ui';
import { Plus, Filter, EntityIcon, Loader2, Upload } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useEntities } from '@/hooks/api/useEntities';

export default function EntitiesPage() {
  const [search, setSearch] = React.useState('');
  const { data, isLoading, error } = useEntities({ q: search || undefined });
  const entities = data?.items || [];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Entities"
        description="Manage your entities"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Link href={ROUTES.ENTITIES.NEW}>
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                Create Entity
              </Button>
            </Link>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search entities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<EntityIcon className="w-4 h-4" />}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* States */}
        {isLoading && (
          <Card variant="default" padding="lg" className="text-center">
            <Loader2 className="w-16 h-16 mx-auto text-[var(--mm-color-text-tertiary)] mb-4 animate-spin" />
            <p className="text-[var(--mm-color-text-secondary)] text-sm">Loading...</p>
          </Card>
        )}

        {error && (
          <Card variant="default" padding="lg" className="text-center border-[var(--mm-color-error-500)]">
            <p className="font-medium text-[var(--mm-color-error-500)]">Error</p>
            <p className="text-sm text-[var(--mm-color-text-secondary)] mt-2">{error.message}</p>
          </Card>
        )}

        {!isLoading && !error && entities.length === 0 && (
          <Card variant="gradient" padding="lg" className="text-center">
            {/* Empty state content */}
          </Card>
        )}

        {!isLoading && !error && entities.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map(entity => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Design Token Usage

### Colors
```tsx
// Text
text-[var(--mm-color-text-primary)]
text-[var(--mm-color-text-secondary)]
text-[var(--mm-color-text-tertiary)]

// Backgrounds
bg-[var(--mm-color-surface)]
bg-[var(--mm-color-panel)]
bg-[var(--mm-color-elevated)]

// Borders
border-[var(--mm-color-border-default)]
border-[var(--mm-color-border-strong)]
border-[var(--mm-color-border-accent)]

// Semantic
text-[var(--mm-color-error-500)]
text-[var(--mm-color-success-500)]
text-[var(--mm-color-warning-500)]
```

### Spacing
```tsx
gap-2      // 8px (mm-spacing-sm)
gap-4      // 16px (mm-spacing-md)
gap-6      // 24px (mm-spacing-lg)
p-4        // padding sm
p-6        // padding md
p-8        // padding lg
```

### Typography
```tsx
text-xs    // 12px
text-sm    // 14px
text-base  // 16px
text-lg    // 18px
text-xl    // 20px
text-2xl   // 24px
```

## Checklist Per Page

For each entity page:

- [ ] Replace search input with Input component with icon
- [ ] Update all Button components to use variants (primary, outline, ghost)
- [ ] Replace Card usage with proper variants:
  - [ ] Loading state: variant="default" with centered content
  - [ ] Error state: variant="default" with error border
  - [ ] Empty state: variant="gradient" with icon and CTA
  - [ ] Item cards: variant="elevated" with interactive prop
- [ ] Update Typography to use design tokens
- [ ] Update Badges to use sizes and icons
- [ ] Apply consistent spacing using design system
- [ ] Add hover effects on interactive elements
- [ ] Ensure all states are styled (loading, error, empty, populated)
- [ ] Test keyboard navigation
- [ ] Verify contrast ratios

## Common Patterns

### Icon in Badge
```tsx
<Badge variant="secondary" size="sm">
  <Music className="w-3 h-3" />
  {text}
</Badge>
```

### Card Hover Effect
```tsx
<Card variant="elevated" interactive>
  <h3 className="group-hover:text-[var(--mm-color-primary)] transition-colors">
    Title
  </h3>
</Card>
```

### Empty State Icon Container
```tsx
<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--mm-color-panel)] mb-4">
  <Icon className="w-8 h-8 text-[var(--mm-color-primary)]" />
</div>
```

## Reference Files

- **Example Implementation**: `/apps/web/src/app/(dashboard)/entities/styles/page.tsx`
- **Design System Docs**: `/packages/ui/DESIGN_SYSTEM.md`
- **Component Source**: `/packages/ui/src/components/`
- **Tokens**: `/packages/tokens/css/tokens.css`

## Testing After Migration

1. Visual check in browser
2. Test all states (loading, error, empty, populated)
3. Test keyboard navigation
4. Verify hover effects
5. Check responsive layout (mobile, tablet, desktop)
6. Run accessibility audit (axe DevTools)

## Tips

- Copy-paste patterns from the Styles page
- Use component variants instead of custom CSS
- Leverage design tokens for colors and spacing
- Add icons to badges for visual interest
- Include hover states on interactive cards
- Use the Card padding prop instead of manual padding
- Group related badges and buttons with consistent gap spacing
