# Dashboard Visual Layout Reference

## Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DASHBOARD                                                    [Create Song]│
│ Welcome to MeatyMusic AMCS - Your music creation workspace              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│ │ Total Songs │ │ In Progress │ │  Completed  │ │   Failed    │      │
│ │     42      │ │      3      │ │     15      │ │      2      │      │
│ │   Active    │ │ 3 active... │ │ 88% success │ │ 2 need att..│      │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                                          │
│ ┌─────────────────────────────────────────┐ ┌─────────────────────────┐│
│ │ Recent Songs                  [View All]│ │ Recent Activity         ││
│ ├─────────────────────────────────────────┤ ├─────────────────────────┤│
│ │                                         │ │ ● Running               ││
│ │ ♪ Summer Vibes                [draft]  │ │   STYLE node            ││
│ │   2 hours ago                           │ │   5 minutes ago         ││
│ │                                         │ │                         ││
│ │ ♪ Midnight Drive            [validated]│ │ ● Completed             ││
│ │   1 day ago                             │ │   Full workflow         ││
│ │                                         │ │   2 hours ago           ││
│ │ ♪ Dance Floor Heat         [rendering] │ │                         ││
│ │   3 days ago                            │ │ ● Failed                ││
│ │                                         │ │   VALIDATE node         ││
│ │ ♪ Acoustic Dreams           [rendered] │ │   1 day ago             ││
│ │   1 week ago                            │ │                         ││
│ │                                         │ ├─────────────────────────┤│
│ │ ♪ Rock Anthem                 [failed] │ │ Library Stats           ││
│ │   2 weeks ago                           │ ├─────────────────────────┤│
│ │                                         │ │ ⚙ Styles           12  ││
│ └─────────────────────────────────────────┘ │ ⎙ Lyrics           8   ││
│                                              │ ⚉ Personas         5   ││
│                                              │ ♫ Producer Notes   6   ││
│                                              │ ⚐ Blueprints       4   ││
│                                              ├─────────────────────────┤│
│                                              │ Quick Actions          ││
│                                              ├─────────────────────────┤│
│                                              │ [+ New Song]           ││
│                                              │ [Browse Styles]        ││
│                                              │ [Browse Lyrics]        ││
│                                              │ [Browse Personas]      ││
│                                              ├─────────────────────────┤│
│                                              │ System Status          ││
│                                              ├─────────────────────────┤│
│                                              │ API          ● OK      ││
│                                              │ Workflow     ● OK      ││
│                                              │ Database     ● OK      ││
│                                              └─────────────────────────┘│
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Getting Started                                                    │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ ① Create a Song          ② Design Entities      ③ Run Workflow   │ │
│ │   Start with basic        Define style,          Execute the      │ │
│ │   song information        lyrics, persona,       AMCS workflow    │ │
│ │   and creative           and producer notes                       │ │
│ │   direction                                                        │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout (320px-768px)

```
┌─────────────────────────┐
│ DASHBOARD               │
│ Welcome to MeatyMusic...│
│ [Create Song]           │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │   Total Songs       │ │
│ │        42           │ │
│ │      Active         │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │   In Progress       │ │
│ │         3           │ │
│ │   3 active...       │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │   Completed         │ │
│ │        15           │ │
│ │   88% success       │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │    Failed           │ │
│ │         2           │ │
│ │   2 need att...     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Recent Songs        │ │
│ │          [View All] │ │
│ ├─────────────────────┤ │
│ │ ♪ Summer Vibes      │ │
│ │   2 hours ago       │ │
│ │            [draft]  │ │
│ ├─────────────────────┤ │
│ │ ♪ Midnight Drive    │ │
│ │   1 day ago         │ │
│ │        [validated]  │ │
│ ├─────────────────────┤ │
│ │ ♪ Dance Floor Heat  │ │
│ │   3 days ago        │ │
│ │        [rendering]  │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Recent Activity     │ │
│ ├─────────────────────┤ │
│ │ ● Running           │ │
│ │   STYLE node        │ │
│ │   5 minutes ago     │ │
│ ├─────────────────────┤ │
│ │ ● Completed         │ │
│ │   Full workflow     │ │
│ │   2 hours ago       │ │
│ └─────────────────────┘ │
│                         │
│ ... (continues)         │
└─────────────────────────┘
```

## Component Visual Breakdown

### Metric Card (Top Row)
```
┌─────────────────────────┐
│ Total Songs         [♪] │  ← Label + Icon (top right)
│                         │
│      42                 │  ← Large number (main value)
│                         │
│ ▲ Active                │  ← Trend indicator + text
└─────────────────────────┘
```

**States:**
- **Normal**: White background, primary icon
- **Loading**: Skeleton with pulse animation
- **Hover**: Elevated shadow (elev1 → elev2)

### Song List Item
```
┌─────────────────────────────────────┐
│ [♪]  Summer Vibes          [draft]  │  ← Icon + Title + Status badge
│      2 hours ago                    │  ← Relative timestamp
└─────────────────────────────────────┘
   ↑                            ↑
   Icon                         Status badge
```

**Status Badge Colors:**
- `draft`: Gray/muted
- `validated`: Blue (info)
- `rendering`: Yellow/orange (warning)
- `rendered`: Green (success)
- `failed`: Red (danger)

**Interactions:**
- **Hover**: Background changes to panel color
- **Click**: Navigates to song detail page

### Activity Item
```
┌─────────────────────────┐
│ ● Running               │  ← Status badge with icon
│   STYLE node            │  ← Current node/description
│   5 minutes ago         │  ← Relative timestamp
└─────────────────────────┘
```

**Status Colors:**
- Running: Blue (info) with Clock icon
- Completed: Green (success) with CheckCircle icon
- Failed: Red (danger) with AlertCircle icon
- Cancelled: Gray (muted) with AlertCircle icon

### Entity Stat Item
```
┌─────────────────────────┐
│ ⚙  Styles           12  │  ← Icon + Label + Count
└─────────────────────────┘
```

**Interactions:**
- **Hover**: Text and icon change to primary color
- **Click**: Navigates to entity list page

### Loading Skeleton
```
┌─────────────────────────┐
│ ████████        ▮▮▮▮▮   │  ← Shimmer animation
│                         │
│ ████████████            │
│                         │
│ ████████                │
└─────────────────────────┘
```

**Animation:** 1.5s shimmer from left to right

### Empty State (No Songs)
```
┌─────────────────────────────────┐
│                                 │
│           ┌─────┐               │
│           │  ♪  │               │  ← Large icon
│           └─────┘               │
│                                 │
│        No songs yet             │  ← Heading
│                                 │
│   Create your first song to     │  ← Description
│   get started with MeatyMusic   │
│                                 │
│   [+ Create Your First Song]    │  ← CTA button
│                                 │
└─────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────┐
│                                 │
│              ⚠️                  │  ← Warning icon
│                                 │
│      Loading Failed             │  ← Title
│                                 │
│   This content failed to load.  │  ← Description
│   This might be a temporary     │
│   issue.                        │
│                                 │
│   [Try Again]  [Reload Page]    │  ← Action buttons
│                                 │
└─────────────────────────────────┘
```

## Color Scheme

### Text Colors
- `text-text-strong`: Primary headings and important numbers
- `text-text-base`: Body text and labels
- `text-text-muted`: Secondary text and timestamps

### Background Colors
- `bg-surface`: Card backgrounds
- `bg-panel`: Hover states and nested panels
- `bg-primary`: Icon backgrounds and badges

### Status Colors
- `bg-success/text-success`: Completed, operational, rendered
- `bg-info/text-info`: Running, validated, in-progress
- `bg-warning/text-warning`: Rendering, degraded, attention
- `bg-danger/text-danger`: Failed, error, critical

### Border Colors
- `border-border`: Default card borders
- `border-primary`: Hover borders (on quick actions)

## Spacing System

### Card Padding
- Large cards: `p-8` (2rem)
- Compact items: `p-3` or `p-4` (0.75-1rem)

### Gap Between Elements
- Grid columns: `gap-6` or `gap-8` (1.5-2rem)
- List items: `space-y-3` or `space-y-4` (0.75-1rem)

### Icon Sizes
- Metric card icons: `w-5 h-5` (1.25rem)
- List item icons: `w-4 h-4` or `w-3 h-3` (0.75-1rem)
- Large empty state icons: `w-10 h-10` (2.5rem)

## Animations

### Fade In (Page Load)
```css
.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}
```

### Slide Up (Staggered)
```css
.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}
.animation-delay-100 {
  animation-delay: 100ms;
}
```

### Shimmer (Loading)
```css
.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
  background-size: 200% 100%;
}
```

### Transitions
- Hover states: `transition-all duration-ui` (200ms)
- Color changes: `transition-colors`

## Responsive Breakpoints

### Grid Layouts
- Mobile (default): `grid-cols-1`
- Tablet (md: 768px): `md:grid-cols-2`
- Desktop (lg: 1024px): `lg:grid-cols-3` or `lg:grid-cols-4`

### Main Content Split
- Mobile: Full width stacked
- Desktop: `lg:col-span-2` (songs) + `1` (sidebar)

## Accessibility Features

### ARIA Labels
- Icons have descriptive text labels
- Status badges include both color and text

### Keyboard Navigation
- All interactive elements are focusable
- Link components handle keyboard events

### Screen Readers
- Semantic HTML structure (`h2`, `nav`, `section`)
- Proper heading hierarchy
- Status information in text form

## Print Styles (Future)
Dashboard is optimized for screen only. Print styles could include:
- Hide sidebar and quick actions
- Show only metrics and recent songs
- Grayscale for better printing

---

## Visual States Summary

| Element | Loading | Empty | Error | Data |
|---------|---------|-------|-------|------|
| Metrics | Skeleton | N/A | N/A | Numbers + trends |
| Songs | 3x skeleton | Large empty state | N/A | List of songs |
| Activity | 3x skeleton | "No activity" text | N/A | List of workflows |
| Stats | N/A | Shows 0 | N/A | Entity counts |
| Page | Full page skeleton | N/A | Error fallback | Full dashboard |

---

**Layout Type**: Dashboard / Overview
**Design System**: MeatyMusic AMCS (based on Tailwind + custom tokens)
**Responsive**: Mobile-first, 3 breakpoints
**Dark Mode**: Supported via theme tokens
**Last Updated**: 2025-11-17
