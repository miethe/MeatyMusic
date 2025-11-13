# ContextCard Component

A specialized card component for displaying reusable context artifacts (style guides, policies, knowledge, tool schemas) in the MeatyPrompts design system.

## Overview

The ContextCard is a visual sibling to the PromptCard component, sharing the same design language and layout structure while supporting context-specific functionality. It displays context metadata, source information, usage statistics, and provides actions for managing context artifacts.

## Features

- **Context Type Badge**: Displays a Box icon with "Context" label to identify the card type
- **Source Type Indicators**: Shows where context originated (Manual, URL, File, API)
- **Usage Tracking**: Displays "Used in N prompts" to show context utilization
- **Version Management**: Shows current version with clickable badge for history
- **Access Control**: Displays private/shared/public access badges
- **Tag Support**: Shows up to 4-6 tags with overflow indicator
- **Selection Mode**: Supports bulk selection with checkboxes
- **Responsive Design**: Three size variants (compact, standard, xl)
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

## Usage

### Basic Example

```tsx
import { ContextCard, type Context } from '@meaty/ui';

const context: Context = {
  context_id: 'ctx_123',
  title: 'Brand Voice Guidelines',
  description: 'Official brand voice and tone guidelines',
  owner_id: 'user_123',
  access_control: 'private',
  current_version: {
    version: 2,
    body: '# Brand Voice\n\nBe concise, clear, and friendly...',
    tags: ['style-guide', 'brand', 'voice'],
    source_type: 'manual',
    created_at: '2024-01-15T10:30:00Z',
  },
  version_count: 3,
  usage_count: 12,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

function ContextVault() {
  return (
    <ContextCard
      context={context}
      size="standard"
      onClick={() => console.log('Card clicked')}
      onEdit={() => console.log('Edit context')}
      onDuplicate={() => console.log('Duplicate context')}
      onMenuAction={(action) => console.log('Menu action:', action)}
    />
  );
}
```

### With Selection

```tsx
const [selected, setSelected] = useState(false);

<ContextCard
  context={context}
  selectable
  selected={selected}
  onSelectionChange={(isSelected) => setSelected(isSelected)}
/>
```

### Size Variants

```tsx
// Compact (288px) - Sidebar, mobile
<ContextCard context={context} size="compact" />

// Standard (420px) - Default grid view
<ContextCard context={context} size="standard" />

// XL (560px) - Detail view, showcases
<ContextCard context={context} size="xl" />
```

### Error Handling

```tsx
<ContextCard
  context={context}
  error={{
    message: 'Failed to load context body',
    retry: () => fetchContext(),
  }}
  state="error"
/>
```

## Props

### ContextCardProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `context` | `Context` | required | Context data object |
| `size` | `'compact' \| 'standard' \| 'xl'` | `'standard'` | Card size variant |
| `state` | `'default' \| 'selected' \| 'disabled' \| 'error'` | `'default'` | Card state |
| `selectable` | `boolean` | `false` | Enable selection mode |
| `selected` | `boolean` | `false` | Current selection state |
| `hasActiveSelection` | `boolean` | `false` | Show all checkboxes when any card is selected |
| `onClick` | `() => void` | - | Card click handler |
| `onEdit` | `() => void` | - | Edit button handler |
| `onDuplicate` | `() => void` | - | Duplicate button handler |
| `onMenuAction` | `(action) => void` | - | Menu action handler |
| `onTagClick` | `(tag, event) => void` | - | Tag badge click handler |
| `onVersionClick` | `(version, event) => void` | - | Version badge click handler |
| `onSelectionChange` | `(selected, event) => void` | - | Selection change handler |
| `error` | `string \| { message, retry? }` | - | Error state with optional retry |

### Context Type

```typescript
interface Context {
  context_id: string;
  title: string;
  description?: string;
  owner_id: string;
  access_control: 'private' | 'shared' | 'public';
  current_version: {
    version: number;
    body: string;
    tags: string[];
    source_type?: 'manual' | 'url' | 'file' | 'api';
    source_ref?: string;
    created_at: string;
  };
  version_count: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}
```

## Components

### SourceTypeBadge

Displays the source type indicator with appropriate icon:

- **Manual**: Edit icon - Context created manually
- **URL**: Link icon - Context synced from external URL
- **File**: FileText icon - Context imported from file
- **API**: Code icon - Context fetched from API

```tsx
<SourceTypeBadge
  sourceType="url"
  sourceRef="https://docs.example.com/guide"
  isCompact={false}
/>
```

## States

### Default
- Standard card appearance
- Full hover effects enabled
- Cursor: pointer

### Hover
- Border color shifts to primary
- Elevation increases (shadow-3)
- Card lifts 2px
- Title color shifts to primary
- Badges scale up slightly

### Focus
- 2px outline with 3px offset
- Pulsing ring animation
- Clear keyboard focus indication

### Selected
- 2px primary border
- Subtle primary background tint
- Primary glow effect
- Checkbox visible

### Disabled
- 50% opacity
- No hover effects
- Cursor: not-allowed
- Pointer events disabled

### Error
- 4px left border in danger color
- Error banner with message
- Optional retry button
- Maintains error styling on hover

## Accessibility

### Keyboard Navigation
- **Tab**: Focus card
- **Enter/Space**: Activate primary action
- **Escape**: Close dropdown menu
- **Arrow keys**: Navigate dropdown items

### ARIA Labels
```tsx
aria-label="{title} context card, version {version}, {access} access, used in {count} prompts"
```

### Screen Reader Support
- Live region announcements for state changes
- Descriptive labels for all interactive elements
- Proper role attributes
- Focus management

### Color Contrast
- Text on surface: 4.5:1 minimum
- Interactive elements: 3:1 minimum
- Badge text: 4.5:1 minimum

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  /* All transitions and animations disabled */
}
```

## Styling

The ContextCard reuses 100% of the PromptCard CSS module (`PromptCard.module.css`), ensuring visual consistency and reducing code duplication.

### CSS Classes Used
- `.card` - Base card styles
- `.compact`, `.standard`, `.xl` - Size variants
- `.selected`, `.disabled`, `.error` - State classes
- `.headerZone`, `.metaStrip`, `.statsRow`, `.actionsRow` - Layout zones

### Design Tokens
```css
--mp-color-surface       /* Card background */
--mp-color-border        /* Card border */
--mp-color-primary       /* Accent/hover */
--mp-color-text-strong   /* Title */
--mp-color-text-muted    /* Secondary text */
--mp-elevation-1         /* Default shadow */
--mp-elevation-3         /* Hover shadow */
--mp-motion-duration-ui  /* 150ms transitions */
```

## Comparison with PromptCard

### Removed Features
- ❌ Run button and statistics
- ❌ Model badges
- ❌ Body preview section
- ❌ Complications system (Phase 1)

### Modified Features
- 🔄 Type badge: "Context" instead of "Prompt"
- 🔄 Meta strip: Source type instead of model
- 🔄 Stats: Usage count instead of run metrics
- 🔄 Actions: Edit/Duplicate instead of Run/Edit/Fork

### New Features
- ✅ Context type badge (Box icon)
- ✅ Source type indicator (Manual/URL/File/API)
- ✅ Usage count display
- ✅ Clickable usage tracking
- ✅ Modified dropdown menu items

## Storybook Stories

The component includes comprehensive Storybook stories:

### States
- Default, Compact, Standard, XL
- With Error, Selected, Disabled
- With Selection (interactive demo)

### Content Variations
- No Description, Many Tags
- High Usage, Zero Usage
- Minimal Content, Long Title

### Source Types
- Manual Source, URL Source
- File Source, API Source

### Access Control
- Private, Shared, Public

### Interactive Showcases
- All Source Types Showcase
- Interactive States Showcase
- Selection Interactive Demo

## Development

### File Structure
```
ContextCard/
├── ContextCard.tsx              # Main component
├── ContextCard.stories.tsx      # Storybook stories
├── index.ts                     # Exports
├── sections/
│   ├── Header.tsx               # Context type badge + title
│   ├── MetaStrip.tsx            # Tags + source type
│   ├── Stats.tsx                # Usage count
│   ├── Actions.tsx              # Edit/Duplicate/Menu
│   ├── ErrorBanner.tsx          # Error display
│   └── index.ts
├── components/
│   ├── SourceTypeBadge.tsx     # Source indicator
│   └── index.ts
└── hooks/
    ├── useContextCardState.ts   # State management
    └── index.ts
```

### Testing
```bash
# TypeScript compilation
pnpm tsc --noEmit

# Run Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```

## Future Enhancements

### Phase 2
- Provenance visualization (forked/derived indicators)
- Inline preview on hover
- Drag-and-drop reordering
- Context update notifications

### Phase 3
- Context dependencies graph
- Version diff preview
- Collaborative editing indicators
- Context usage analytics

## Related Components

- **PromptCard**: Primary inspiration and CSS source
- **Badge**: Used for type, version, access, tags, source
- **Button**: Used in actions row
- **DropdownMenu**: Used for menu actions
- **Checkbox**: Used in selection mode
- **Tooltip**: Used for overflow tags and source refs

## References

- Design Spec: `/docs/design/specs/ContextCard-Design-Spec.md`
- Visual Reference: `/docs/design/specs/ContextCard-Visual-Reference.md`
- Implementation Handoff: `/docs/design/specs/ContextCard-Implementation-Handoff.md`
- PRD: `/docs/project_plans/PRDs/prompt-cards/prompt-authoring-enhancements/feature-2-context-cards.md`
