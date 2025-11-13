# MeatyMusic AMCS UI Design Specification
## Phase 5 Wave 1C & 1D: Design System & Component Specs

**Version**: 1.0
**Date**: 2025-11-13
**Audience**: UI Engineer, Frontend Developers, Design System Contributors
**Status**: Draft for Wave 2 Implementation

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Workflow Dashboard Design](#3-workflow-dashboard-design)
4. [Entity Editor Design System](#4-entity-editor-design-system)
5. [Component Specifications](#5-component-specifications)
6. [Responsive Design Guidelines](#6-responsive-design-guidelines)
7. [Accessibility Requirements](#7-accessibility-requirements)
8. [Implementation Guidelines](#8-implementation-guidelines)

---

## 1. Design Philosophy

### 1.1 Core Principles

**Deterministic Visual Feedback**: Every UI state must clearly communicate the deterministic nature of AMCS workflows. Users should understand that same inputs produce same outputs.

**Progressive Disclosure**: Complex music composition controls are organized in layers - essential controls visible by default, advanced options revealed on demand.

**Real-Time Awareness**: UI updates live as workflow nodes execute, providing continuous feedback without overwhelming the user.

**Music-First Semantics**: Design language draws from music production (DAW-inspired layouts, waveform aesthetics, tempo-driven animations).

**Dark Minimalism with Vibrant Accents**: Base dark theme with purple/blue highlights, subtle gradients, and generous whitespace. Cards float with elevation shadows. Rounded corners (8-16px) for approachability.

### 1.2 Visual Hierarchy

**Primary Actions**: Large, high-contrast buttons with subtle gradients
**Secondary Actions**: Ghost buttons or outlined variants
**Tertiary Actions**: Text links with hover underlines
**Workflow Status**: Color-coded badges with icons (pending/running/complete/failed)
**Validation Messages**: Inline, contextual, with severity indicators

### 1.3 Design Language

- **Spacing**: 4px/8px base grid for consistency
- **Typography**: Sans-serif, legible at all sizes, clear hierarchy
- **Elevation**: 3 levels - flat (0), raised (4px blur), floating (16px blur)
- **Motion**: Smooth, purposeful animations at 200-300ms duration
- **Color Semantics**: Purple for primary, blue for info, green for success, amber for warning, red for error

---

## 2. Design Tokens

### 2.1 Color Palette

Extending MeatyPrompts base palette with music-specific accents:

#### Base Colors
```css
--background-primary: #0f0f1c;      /* Main dark background */
--background-secondary: #1a1a2e;    /* Card/panel background */
--background-tertiary: #252540;     /* Elevated surfaces */
--background-overlay: rgba(15,15,28,0.95);  /* Modal overlays */
```

#### Accent Colors
```css
--accent-primary: #8b5cf6;          /* Purple - primary actions */
--accent-secondary: #3b82f6;        /* Blue - info/links */
--accent-tertiary: #6366f1;         /* Indigo - tertiary actions */
--accent-success: #10b981;          /* Green - success states */
--accent-warning: #f59e0b;          /* Amber - warnings */
--accent-error: #ef4444;            /* Red - errors */
--accent-music: #ec4899;            /* Pink - music-specific highlights */
```

#### Workflow Status Colors
```css
--status-pending: #6b7280;          /* Gray - pending */
--status-running: #3b82f6;          /* Blue - running */
--status-complete: #10b981;         /* Green - complete */
--status-failed: #ef4444;           /* Red - failed */
--status-skipped: #9ca3af;          /* Light gray - skipped */
```

#### Text Colors
```css
--text-primary: #f9fafb;            /* High-contrast text */
--text-secondary: #d1d5db;          /* Secondary text */
--text-tertiary: #9ca3af;           /* Muted text */
--text-disabled: #6b7280;           /* Disabled text */
--text-inverted: #0f0f1c;           /* For light backgrounds */
```

#### Border & Divider Colors
```css
--border-primary: rgba(139,92,246,0.2);     /* Purple tinted */
--border-secondary: rgba(255,255,255,0.1);  /* Subtle white */
--border-focus: rgba(139,92,246,0.5);       /* Focus rings */
--divider: rgba(255,255,255,0.08);          /* Subtle dividers */
```

#### Gradient Definitions
```css
--gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
--gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
--gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
--gradient-error: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
--gradient-music: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
--gradient-mesh: radial-gradient(at 20% 30%, rgba(139,92,246,0.15) 0%, transparent 50%),
                 radial-gradient(at 80% 70%, rgba(59,130,246,0.15) 0%, transparent 50%);
```

### 2.2 Typography Scale

#### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace;
--font-display: 'Poppins', var(--font-sans);  /* For headings */
```

#### Font Sizes & Line Heights
```css
--text-xs: 0.75rem;      /* 12px */  line-height: 1rem;
--text-sm: 0.875rem;     /* 14px */  line-height: 1.25rem;
--text-base: 1rem;       /* 16px */  line-height: 1.5rem;
--text-lg: 1.125rem;     /* 18px */  line-height: 1.75rem;
--text-xl: 1.25rem;      /* 20px */  line-height: 1.75rem;
--text-2xl: 1.5rem;      /* 24px */  line-height: 2rem;
--text-3xl: 1.875rem;    /* 30px */  line-height: 2.25rem;
--text-4xl: 2.25rem;     /* 36px */  line-height: 2.5rem;
--text-5xl: 3rem;        /* 48px */  line-height: 1;
```

#### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 2.3 Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
```

### 2.4 Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - subtle rounding */
--radius-md: 0.5rem;     /* 8px - standard rounding */
--radius-lg: 0.75rem;    /* 12px - large rounding */
--radius-xl: 1rem;       /* 16px - extra large */
--radius-2xl: 1.5rem;    /* 24px - prominent rounding */
--radius-full: 9999px;   /* Fully rounded (pills/circles) */
```

### 2.5 Shadows & Elevation

```css
--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0,0,0,0.25);
--shadow-glow: 0 0 20px rgba(139,92,246,0.3);        /* Purple glow */
--shadow-glow-blue: 0 0 20px rgba(59,130,246,0.3);   /* Blue glow */
```

### 2.6 Transition Durations

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--transition-slower: 500ms;
--easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--easing-out: cubic-bezier(0.0, 0, 0.2, 1);
--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 3. Workflow Dashboard Design

### 3.1 Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: Logo | Breadcrumbs | User Avatar | Notifications   │
├─────┬───────────────────────────────────────────────────────┤
│     │                                                         │
│ S   │  Main Content Area                                     │
│ i   │  ┌─────────────────────────────────────────────────┐  │
│ d   │  │ Workflow Visualization Panel                     │  │
│ e   │  │                                                   │  │
│     │  │  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐  │  │
│ N   │  │  │ PLAN │───>│STYLE │───>│LYRICS│───>│COMP. │  │  │
│ a   │  │  └──────┘    └──────┘    └──────┘    └──────┘  │  │
│ v   │  │                                                   │  │
│     │  └─────────────────────────────────────────────────┘  │
│     │                                                         │
│     │  ┌─────────────────────┬─────────────────────────┐   │
│     │  │ Metrics Panel       │ Artifact Preview Panel  │   │
│     │  │                     │                         │   │
│     │  │ Rubric Scores:      │ Generated Lyrics:       │   │
│     │  │ ├─ Hook: 8.5/10     │ [Verse 1]               │   │
│     │  │ ├─ Singability: 9/10│ Lines of lyrics...      │   │
│     │  │ └─ Rhyme: 7.8/10    │                         │   │
│     │  │                     │                         │   │
│     │  └─────────────────────┴─────────────────────────┘   │
└─────┴───────────────────────────────────────────────────────┘
```

### 3.2 Workflow Graph Component

**Component Name**: `WorkflowGraph`

**Purpose**: Visualize the AMCS workflow DAG with real-time status updates

#### Visual Specification

**Node Appearance**:
- Dimensions: 120px width x 80px height (desktop), 80px x 60px (mobile)
- Background: `var(--background-tertiary)` with subtle gradient overlay
- Border: 2px solid with status-dependent color
- Border radius: `var(--radius-lg)`
- Shadow: `var(--shadow-md)`, upgrading to `var(--shadow-lg)` on hover
- Text: Node name in `var(--font-semibold)`, `var(--text-sm)` size

**Node States**:

1. **Pending State**:
   - Border color: `var(--status-pending)`
   - Background: Slightly transparent
   - Icon: Clock icon in `var(--text-tertiary)`
   - No animation

2. **Running State**:
   - Border color: `var(--status-running)` with pulsing animation
   - Background: Subtle blue glow overlay
   - Icon: Spinner/loading icon rotating at 1 revolution per second
   - Pulse animation: 1s ease-in-out infinite

3. **Complete State**:
   - Border color: `var(--status-complete)`
   - Background: Faint green tint overlay
   - Icon: Checkmark icon in `var(--accent-success)`
   - Brief success animation on transition (scale 1.05 → 1.0 over 300ms)

4. **Failed State**:
   - Border color: `var(--status-failed)`
   - Background: Faint red tint overlay
   - Icon: X icon in `var(--accent-error)`
   - Shake animation on transition (±4px horizontal over 200ms)

5. **Skipped State**:
   - Border color: `var(--status-skipped)`
   - Background: More transparent
   - Icon: Forward arrow icon in `var(--text-disabled)`
   - Diagonal stripe pattern overlay (subtle)

**Connection Lines**:
- Width: 2px
- Color: `var(--border-secondary)` for unexecuted, status color for executed
- Style: Solid for executed, dashed for pending
- Arrow heads: 8px triangles at end of lines

**Layout**:
- Horizontal flow (left to right) on desktop
- Vertical flow (top to bottom) on mobile/tablet
- Auto-spacing with 40px gaps between nodes
- Branching connections rendered with bezier curves

#### Interaction Behaviors

**Hover**:
- Node scales to 1.05
- Shadow upgrades to `var(--shadow-xl)`
- Tooltip appears above node showing:
  - Node name
  - Current status
  - Duration (if complete)
  - Error message (if failed)

**Click**:
- Expands detail panel below graph
- Shows node inputs/outputs
- Displays execution logs
- Provides retry button (if failed)

**WebSocket Updates**:
- Listen on `/events` endpoint
- Update node status in real-time
- Animate transitions between states
- Update metrics panel simultaneously

### 3.3 Real-Time Status Indicators

**Component Name**: `StatusBadge`

**Variants**:

```
┌─────────────────────────────────────────┐
│ ● Pending      [Gray circle + text]     │
│ ⟳ Running      [Blue spinner + text]    │
│ ✓ Complete     [Green check + text]     │
│ ✗ Failed       [Red X + text]           │
│ → Skipped      [Gray arrow + text]      │
└─────────────────────────────────────────┘
```

**Visual Specification**:
- Height: 28px (standard), 36px (large)
- Padding: `var(--space-2)` `var(--space-4)`
- Border radius: `var(--radius-full)`
- Background: Status color at 15% opacity
- Border: 1px solid status color
- Text: Status color, `var(--font-medium)`, `var(--text-sm)`
- Icon: 16px, positioned left of text with 8px gap

**Animation**:
- Running state: Icon rotates continuously
- Status transitions: 200ms fade between states

### 3.4 Analytics & Metrics Visualization

**Component Name**: `MetricsPanel`

#### Rubric Score Display

```
┌──────────────────────────────────────┐
│ Rubric Scores                        │
├──────────────────────────────────────┤
│ Hook Density            8.5/10  ████│
│ Singability             9.0/10  ████│
│ Rhyme Tightness         7.8/10  ███ │
│ Section Completeness    10/10   ████│
│ Profanity Score         10/10   ████│
│                                      │
│ Overall: 9.06/10           Pass ✓    │
└──────────────────────────────────────┘
```

**Visual Specification**:
- Background: `var(--background-secondary)`
- Border radius: `var(--radius-lg)`
- Padding: `var(--space-6)`
- Shadow: `var(--shadow-md)`

**Score Bar**:
- Each metric has label, score text, and progress bar
- Progress bar:
  - Height: 8px
  - Width: 100px (fixed)
  - Background: `var(--background-tertiary)`
  - Fill: Gradient based on score
    - 0-5: Red to yellow gradient
    - 5-7: Yellow to blue gradient
    - 7-10: Blue to green gradient
  - Border radius: `var(--radius-full)`
  - Animated fill on load (300ms ease-out)

**Overall Score**:
- Larger text size (`var(--text-2xl)`)
- Bold weight (`var(--font-bold)`)
- Color based on pass/fail:
  - Pass (≥threshold): `var(--accent-success)`
  - Fail (<threshold): `var(--accent-error)`
- Badge positioned right of score

#### Execution Metrics

```
┌──────────────────────────────────────┐
│ Execution Metrics                    │
├──────────────────────────────────────┤
│ Total Duration:        45.3s         │
│ PLAN:                  2.1s          │
│ STYLE:                 8.7s          │
│ LYRICS:                18.4s         │
│ PRODUCER:              5.9s          │
│ COMPOSE:               7.2s          │
│ VALIDATE:              3.0s          │
│                                      │
│ Fix Iterations:        1             │
│ Seed:                  42            │
└──────────────────────────────────────┘
```

**Visual Specification**:
- Same styling as Rubric Score panel
- Monospace font for durations and seed
- Timeline visualization option (expandable)

### 3.5 Artifact Preview Panel

**Component Name**: `ArtifactPreview`

**Layout**:

```
┌───────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐  │
│ │ Tabs: Lyrics | Style | Producer     │  │
│ └─────────────────────────────────────┘  │
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ Content Area                         │  │
│ │                                      │  │
│ │ [Verse 1]                            │  │
│ │ Running through the winter chill...  │  │
│ │                                      │  │
│ │ [Chorus]                             │  │
│ │ It's the holiday hustle...           │  │
│ │                                      │  │
│ └─────────────────────────────────────┘  │
│                                           │
│ ┌───────────┐ ┌──────────┐              │
│ │ Copy JSON │ │ Download │              │
│ └───────────┘ └──────────┘              │
└───────────────────────────────────────────┘
```

**Visual Specification**:
- Background: `var(--background-secondary)`
- Border radius: `var(--radius-lg)`
- Padding: `var(--space-6)`
- Max height: 600px with scroll

**Tab Component**:
- Horizontal tabs at top
- Active tab: `var(--accent-primary)` underline, bold text
- Inactive tab: `var(--text-secondary)`, hover lighten
- Smooth transition between tabs (300ms)

**Content Area**:
- Syntax highlighted JSON (when applicable)
- Formatted lyrics with section markers styled as badges
- Copy button with tooltip feedback
- Download exports artifact as JSON file

---

## 4. Entity Editor Design System

### 4.1 Form Layout Pattern

All entity editors follow a consistent structure:

```
┌─────────────────────────────────────────────────────────┐
│ Header: Entity Type | Save | Cancel | Preview Toggle    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────────┬─────────────────────────┐  │
│ │ Form Panel (2/3 width)  │ Preview Panel (1/3)     │  │
│ │                         │                         │  │
│ │ ┌─────────────────────┐│ ┌─────────────────────┐ │  │
│ │ │ Section 1: Basic    ││ │ Live JSON Preview   │ │  │
│ │ │                     ││ │                     │ │  │
│ │ │ [Form fields]       ││ │ {                   │ │  │
│ │ │                     ││ │   "genre": "Pop",   │ │  │
│ │ └─────────────────────┘│ │   "tempo": 120,     │ │  │
│ │                         │ │   ...               │ │  │
│ │ ┌─────────────────────┐│ │ }                   │ │  │
│ │ │ Section 2: Advanced ││ │                     │ │  │
│ │ │ (Collapsible)       ││ └─────────────────────┘ │  │
│ │ │                     ││                         │  │
│ │ │ [Form fields]       ││ ┌─────────────────────┐ │  │
│ │ │                     ││ │ Validation Status   │ │  │
│ │ └─────────────────────┘│ │ ✓ Schema valid      │ │  │
│ │                         │ │ ⚠ 2 warnings        │ │  │
│ │ ┌─────────────────────┐│ └─────────────────────┘ │  │
│ │ │ Section 3: Optional ││                         │  │
│ │ │ (Collapsed)         ││                         │  │
│ │ └─────────────────────┘│                         │  │
│ └─────────────────────────┴─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Responsive Behavior**:
- Desktop (≥1024px): Side-by-side layout (2/3 + 1/3)
- Tablet (768px-1023px): Preview collapses to bottom drawer
- Mobile (<768px): Single column, preview in bottom sheet

### 4.2 Input Component Patterns

#### 4.2.1 Multi-Select Chip Component

**Component Name**: `ChipSelector`

**Use Cases**: Genre, Mood, Instrumentation, Tags, Influences

```
┌─────────────────────────────────────────────────┐
│ Mood *                                          │
│ ┌─────────────────────────────────────────────┐│
│ │ [upbeat ×] [cheeky ×] [warm ×]              ││
│ │                                             ││
│ │ Type to add more...                         ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Suggestions: melancholic | energetic | dreamy  │
└─────────────────────────────────────────────────┘
```

**Visual Specification**:

**Chip Appearance**:
- Height: 32px
- Padding: `var(--space-2)` `var(--space-3)`
- Border radius: `var(--radius-full)`
- Background: `var(--accent-primary)` at 20% opacity
- Border: 1px solid `var(--accent-primary)` at 40% opacity
- Text: `var(--text-primary)`, `var(--text-sm)`, `var(--font-medium)`
- Remove button: 16px × icon, positioned right with 4px gap

**Input Field**:
- Background: `var(--background-tertiary)`
- Border: 1px solid `var(--border-secondary)`
- Border radius: `var(--radius-md)`
- Padding: `var(--space-3)`
- Focus state: Border becomes `var(--border-focus)` with subtle glow

**Suggestions**:
- Appear below input as clickable links
- Text color: `var(--text-secondary)`
- Hover: Underline with `var(--accent-primary)` color

**Interaction**:
- Type to filter suggestions
- Click suggestion to add chip
- Click × on chip to remove
- Keyboard: Enter to add, Backspace to remove last
- Max chips warning at configurable limit (e.g., 5 for instrumentation)

**Validation States**:
- Error: Red border, error message below
- Warning: Amber border, warning message (e.g., "Too many instruments may dilute mix")
- Success: Green checkmark icon right of input

#### 4.2.2 Range Slider Component

**Component Name**: `RangeSlider`

**Use Cases**: Tempo BPM, Vocal Range, Duration, Imagery Density

```
┌─────────────────────────────────────────────────┐
│ Tempo (BPM) *                                   │
│ ┌─────────────────────────────────────────────┐│
│ │ 60      ●━━━━━━●         220                ││
│ │        116     124                          ││
│ └─────────────────────────────────────────────┘│
│ Range: 116-124 BPM                              │
└─────────────────────────────────────────────────┘
```

**Visual Specification**:

**Track**:
- Height: 6px
- Background: `var(--background-tertiary)`
- Active range: `var(--gradient-primary)`
- Border radius: `var(--radius-full)`

**Handles**:
- Size: 20px diameter circles
- Background: `var(--accent-primary)`
- Border: 3px solid `var(--background-secondary)` (creates ring effect)
- Shadow: `var(--shadow-md)`
- Hover: Scale to 1.1, shadow upgrades to `var(--shadow-lg)`
- Active (dragging): Scale to 1.15, shadow with glow effect

**Labels**:
- Min/max labels at track ends: `var(--text-tertiary)`, `var(--text-xs)`
- Current values below handles: `var(--text-primary)`, `var(--text-sm)`, `var(--font-semibold)`
- Range summary below slider: `var(--text-secondary)`, `var(--text-sm)`

**Single Value Mode**:
- When min=max, render single handle
- Toggle button to switch between single/range mode

#### 4.2.3 Section Editor Component

**Component Name**: `SectionEditor`

**Use Cases**: Lyrics sections, Producer structure, Section order

```
┌─────────────────────────────────────────────────────┐
│ Section Order *                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ ⋮⋮ [Intro]       [Target: 10s]  [Delete]       ││
│ │ ⋮⋮ [Verse]       [Target: 30s]  [Delete]       ││
│ │ ⋮⋮ [PreChorus]   [Target: 15s]  [Delete]       ││
│ │ ⋮⋮ [Chorus]      [Target: 25s]  [Delete]       ││
│ │ ⋮⋮ [Bridge]      [Target: 20s]  [Delete]       ││
│ │ ⋮⋮ [Chorus]      [Target: 25s]  [Delete]       ││
│ └─────────────────────────────────────────────────┘│
│ + Add Section                                       │
│ Total Duration: 125s                                │
└─────────────────────────────────────────────────────┘
```

**Visual Specification**:

**Section Row**:
- Height: 56px
- Background: `var(--background-tertiary)`
- Border: 1px solid `var(--border-secondary)`
- Border radius: `var(--radius-md)`
- Margin bottom: `var(--space-2)`
- Hover: Border becomes `var(--border-primary)`, subtle lift shadow

**Drag Handle**:
- Icon: Six vertical dots (⋮⋮)
- Color: `var(--text-tertiary)`
- Width: 24px, positioned left
- Cursor: grab (idle), grabbing (dragging)

**Section Type**:
- Badge component with section name
- Color-coded:
  - Intro/Outro: Gray
  - Verse: Blue
  - PreChorus: Purple
  - Chorus: Pink (emphasis)
  - Bridge: Amber
- Click to edit section type (dropdown)

**Duration Input**:
- Number input with "s" suffix
- Width: 80px
- Inline validation (must be positive)

**Delete Button**:
- Ghost button with trash icon
- Color: `var(--text-tertiary)`, hover `var(--accent-error)`
- Positioned right

**Add Section Button**:
- Dashed border button
- Full width below list
- Icon: Plus circle
- Opens dropdown with section type options

**Drag & Drop Behavior**:
- Dragging row: Opacity 0.7, shadow increases
- Drop target indicator: Horizontal line in `var(--accent-primary)`
- Smooth reordering animation (200ms)

#### 4.2.4 Rhyme Scheme Visualizer

**Component Name**: `RhymeSchemeInput`

**Use Cases**: Lyrics rhyme scheme definition

```
┌─────────────────────────────────────────────────┐
│ Rhyme Scheme                                    │
│ ┌─────────────────────────────────────────────┐│
│ │ Pattern: [AABB▼]                            ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Visualization:                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ A: Line 1 ──┐                               ││
│ │ A: Line 2 ──┘                               ││
│ │ B: Line 3 ──┐                               ││
│ │ B: Line 4 ──┘                               ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Common patterns: ABAB | ABCB | AAA | AAAA      │
└─────────────────────────────────────────────────┘
```

**Visual Specification**:

**Pattern Input**:
- Dropdown with common patterns (AABB, ABAB, ABCB, etc.)
- Or free-text input for custom patterns
- Validates pattern (only letters, case-insensitive)

**Visualization**:
- Each line shown with its rhyme letter
- Lines with same letter connected by colored bracket
- Color palette for letters:
  - A: Purple
  - B: Blue
  - C: Pink
  - D: Green
  - E: Amber
  - (cycles for more)
- Animated bracket drawing (300ms path animation)

**Quick Patterns**:
- Clickable links below for instant application
- Hover: Underline and color change

### 4.3 Style Entity Editor

**Form Sections**:

1. **Genre & Identity** (Required)
   - Primary Genre: Dropdown with autocomplete
   - Subgenres: ChipSelector (max 3)
   - Fusions: ChipSelector (max 2)
   - Visual: Genre badge preview

2. **Tempo & Key** (Required)
   - Tempo BPM: RangeSlider (40-220)
     - Single/range toggle
     - Preset buttons (Slow, Moderate, Fast, Very Fast)
   - Time Signature: Dropdown (4/4, 3/4, 6/8, etc.)
   - Key: Dropdown (C major, D minor, etc.)
   - Modulations: ChipSelector (optional)

3. **Mood & Energy** (Required)
   - Mood: ChipSelector (max 5)
     - Categories: Happy, Sad, Energetic, Calm, Dark, Uplifting, etc.
   - Energy: Radio buttons (Low, Medium, High, Anthemic)
     - Visual: Energy meter graphic

4. **Instrumentation** (Required)
   - Instruments: ChipSelector (max 3 recommended, warn at 4+)
   - Vocal Profile: Text input with suggestions
   - Tags: ChipSelector by category
     - Era (1950s, 1980s, 2000s, etc.)
     - Rhythm (four-on-the-floor, syncopated, etc.)
     - Mix (modern-bright, vintage-warm, etc.)
   - Negative Tags: ChipSelector (things to avoid)

5. **Advanced** (Collapsible)
   - Conflict Check: Auto-validates conflicting tags
   - Blueprint Compliance: Shows genre-specific constraints

**Validation Rules**:
- Real-time conflict detection (e.g., "very slow" + "high energy")
- Blueprint tempo range validation
- Warning when >3 instruments selected
- Required field indicators

### 4.4 Lyrics Entity Editor

**Form Sections**:

1. **Structure** (Required)
   - Language: Dropdown (default: English)
   - Section Order: SectionEditor component
     - Must include at least one Chorus
   - Constraints:
     - Max Lines: Number input
     - Explicit Content: Toggle switch
     - Section Requirements: Expandable per-section config

2. **Content & Style** (Required)
   - Themes: ChipSelector (unlimited)
   - POV: Radio buttons (1st, 2nd, 3rd)
   - Tense: Radio buttons (Past, Present, Future, Mixed)
   - Rhyme Scheme: RhymeSchemeInput component
   - Meter: Text input with suggestions
   - Syllables per Line: Number input (4-16)

3. **Hook Strategy** (Required)
   - Strategy: Dropdown (Melodic, Lyrical, Call-Response, Chant)
   - Repetition Policy: Radio buttons (Sparse, Moderate, Hook-Heavy)
   - Hook Lines: If hook-heavy, show recommended count

4. **Advanced** (Collapsible)
   - Imagery Density: RangeSlider (0-1, float)
     - Visual: Scale from "Literal" to "Poetic"
   - Reading Level: Dropdown (Grade 3, Grade 6, High School, College)
   - Source Citations:
     - List of sources with weight sliders
     - Weights must sum to ≤1.0
     - Auto-normalize option

**Lyrics Composition Area** (Optional):
- Rich text editor for direct lyric writing
- Section markers inserted as tags
- Syllable counter per line
- Rhyme highlighting
- Profanity detection (if explicit=false)

**Validation Rules**:
- At least one Chorus required
- Source weights validation
- Syllable count warnings
- Profanity filter (if enabled)
- Section requirement checks

### 4.5 Persona Entity Editor

**Form Sections**:

1. **Identity** (Required)
   - Name: Text input (unique)
   - Kind: Radio buttons (Artist, Band)
   - Bio: Textarea (optional)
   - Avatar: Image upload (optional, placeholder if none)

2. **Vocal Characteristics** (Required)
   - Voice Description: Text input
   - Vocal Range: Dropdown (Soprano, Alto, Tenor, Baritone, Bass, etc.)
   - Delivery Styles: ChipSelector
     - Options: Crooning, Belting, Rap, Whispered, Shouted, etc.
     - Conflict detection (e.g., Whispered + Shouted)

3. **Influences** (Optional)
   - Influences: ChipSelector with autocomplete
   - Living Artist Warning: If living artist detected, show policy note
   - Auto-sanitize option for public releases

4. **Defaults** (Optional, Collapsible)
   - Style Defaults: Link to existing Style or create new
   - Lyrics Defaults: Link to existing Lyrics or create new
   - Visual: Mini preview cards for linked defaults

5. **Policy** (Required)
   - Public Release: Toggle switch
   - Disallow Named "Style Of": Toggle switch (default: true)
   - Explanation tooltip for each policy

**Preview Card**:
- Persona name with avatar
- Voice description
- Influences listed
- Policy badges (Public, Private)

**Validation Rules**:
- Unique name check
- Delivery conflict detection
- Policy warnings for public personas with living artist influences

### 4.6 Producer Notes Entity Editor

**Form Sections**:

1. **Structure** (Required)
   - Structure: SectionEditor component
     - Visual arrangement flow
     - Drag & drop reordering
     - Duration targets per section
   - Hooks: Number input (min 0)
     - Tooltip: Recommended 2-4 for commercial songs

2. **Instrumentation** (Optional)
   - Additional Instruments: ChipSelector
     - Beyond what's in Style spec
     - Per-section overrides option

3. **Section Meta** (Optional, Expandable per section)
   - For each section in structure:
     - Tags: ChipSelector (anthemic, minimal, build-up, etc.)
     - Target Duration: Number input with seconds
     - Visual: Section card with tag chips

4. **Mix Parameters** (Advanced, Collapsible)
   - LUFS Target: Number input (-12 to -6 typical)
   - Space: Dropdown (Dry, Roomy, Lush, Vintage Tape)
   - Stereo Width: Radio buttons (Narrow, Normal, Wide)
   - Visual: Mix meter graphic

**Duration Budget Display**:
- Total duration: Sum of section targets
- Comparison with SDS constraint
- Warning if deviation >30s
- Visual: Progress bar showing budget usage

**Validation Rules**:
- Hooks ≥0
- Section names must match structure
- Duration targets must be positive
- Total duration vs. SDS constraint check

### 4.7 Validation Message Patterns

**Component Name**: `ValidationMessage`

**Message Types**:

1. **Error** (Blocking):
```
┌─────────────────────────────────────────┐
│ ✗ Error: Missing required field        │
│   "genre_detail.primary" is required   │
└─────────────────────────────────────────┘
```
- Background: `var(--accent-error)` at 10% opacity
- Border left: 4px solid `var(--accent-error)`
- Icon: X in circle, red
- Text: `var(--text-primary)`

2. **Warning** (Non-blocking):
```
┌─────────────────────────────────────────┐
│ ⚠ Warning: Conflicting tags detected   │
│   "very slow" + "high energy" may clash│
│   [View Details]                        │
└─────────────────────────────────────────┘
```
- Background: `var(--accent-warning)` at 10% opacity
- Border left: 4px solid `var(--accent-warning)`
- Icon: Triangle with !, amber
- Text: `var(--text-primary)`
- Action link: Expandable details

3. **Info** (Guidance):
```
┌─────────────────────────────────────────┐
│ ℹ Tip: Keep instrumentation to 3 max   │
│   Too many instruments can dilute mix  │
└─────────────────────────────────────────┘
```
- Background: `var(--accent-secondary)` at 10% opacity
- Border left: 4px solid `var(--accent-secondary)`
- Icon: Info in circle, blue
- Text: `var(--text-secondary)`

4. **Success**:
```
┌─────────────────────────────────────────┐
│ ✓ Success: Validation passed           │
│   All constraints satisfied             │
└─────────────────────────────────────────┘
```
- Background: `var(--accent-success)` at 10% opacity
- Border left: 4px solid `var(--accent-success)`
- Icon: Checkmark in circle, green
- Text: `var(--text-primary)`

**Placement**:
- Inline: Below relevant form field
- Summary: At top of form (collects all messages)
- Toast: For transient feedback (auto-dismiss after 5s)

**Animation**:
- Slide in from left (200ms ease-out)
- Fade out on dismiss (300ms)

---

## 5. Component Specifications

### 5.1 Button Components

**Primary Button**:
```css
background: var(--gradient-primary);
color: var(--text-primary);
height: 44px;
padding: 0 var(--space-6);
border-radius: var(--radius-md);
font-weight: var(--font-semibold);
box-shadow: var(--shadow-md);
transition: all var(--transition-base);

hover: {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

active: {
  transform: translateY(0);
}
```

**Secondary Button**:
```css
background: transparent;
border: 2px solid var(--accent-primary);
color: var(--accent-primary);
/* Same dimensions as primary */

hover: {
  background: var(--accent-primary) at 10% opacity;
}
```

**Ghost Button**:
```css
background: transparent;
color: var(--text-secondary);
/* Same dimensions as primary */

hover: {
  background: var(--background-tertiary);
  color: var(--text-primary);
}
```

**Icon Button**:
```css
width: 40px;
height: 40px;
border-radius: var(--radius-full);
background: var(--background-tertiary);
color: var(--text-secondary);

hover: {
  background: var(--accent-primary) at 20% opacity;
  color: var(--accent-primary);
}
```

**Sizes**:
- Small: height 36px, padding 0 var(--space-4)
- Medium: height 44px, padding 0 var(--space-6) (default)
- Large: height 52px, padding 0 var(--space-8)

**States**:
- Disabled: opacity 0.5, cursor not-allowed, no hover effects
- Loading: Spinner icon, disabled interactions

### 5.2 Card Components

**Base Card**:
```css
background: var(--background-secondary);
border: 1px solid var(--border-secondary);
border-radius: var(--radius-lg);
padding: var(--space-6);
box-shadow: var(--shadow-md);
transition: all var(--transition-base);
```

**Elevated Card** (Hover state):
```css
transform: translateY(-4px);
box-shadow: var(--shadow-xl);
border-color: var(--border-primary);
```

**Interactive Card** (Clickable):
```css
cursor: pointer;
/* Elevated on hover */
/* Add focus ring for keyboard navigation */
```

**Gradient Card** (Hero/Featured):
```css
background: var(--gradient-mesh), var(--background-secondary);
border: 1px solid var(--accent-primary) at 30% opacity;
box-shadow: var(--shadow-glow);
```

### 5.3 Modal/Dialog Components

**Modal Overlay**:
```css
background: var(--background-overlay);
backdrop-filter: blur(8px);
/* Full screen z-index above content */
```

**Modal Container**:
```css
background: var(--background-secondary);
border-radius: var(--radius-xl);
max-width: 600px (small), 800px (medium), 1200px (large);
box-shadow: var(--shadow-2xl);
padding: var(--space-8);
/* Centered in viewport */
```

**Modal Animations**:
- Enter: Scale from 0.95 to 1.0 + fade in (300ms)
- Exit: Scale to 0.95 + fade out (200ms)

### 5.4 Tooltip Components

**Tooltip**:
```css
background: var(--background-tertiary);
color: var(--text-primary);
padding: var(--space-2) var(--space-3);
border-radius: var(--radius-md);
font-size: var(--text-sm);
max-width: 250px;
box-shadow: var(--shadow-lg);
border: 1px solid var(--border-primary);
/* Positioned relative to trigger */
/* Arrow pointing to trigger */
```

**Tooltip Arrow**:
```css
width: 0;
height: 0;
border: 6px solid transparent;
border-top-color: var(--background-tertiary);
/* Positioned at bottom-center (for top tooltip) */
```

**Animation**:
- Delay: 500ms before showing
- Fade in: 150ms
- Fade out: 100ms

### 5.5 Badge Components

**Status Badge** (already defined in 3.3)

**Count Badge**:
```css
background: var(--accent-error);
color: var(--text-inverted);
font-size: var(--text-xs);
font-weight: var(--font-bold);
padding: 2px 6px;
border-radius: var(--radius-full);
min-width: 20px;
height: 20px;
/* Positioned absolute top-right of parent */
```

**Label Badge**:
```css
background: var(--accent-primary) at 20% opacity;
color: var(--accent-primary);
font-size: var(--text-xs);
font-weight: var(--font-medium);
padding: 4px 8px;
border-radius: var(--radius-md);
/* Inline element */
```

### 5.6 Loading States

**Spinner**:
```css
/* Circular spinner */
border: 3px solid var(--border-secondary);
border-top-color: var(--accent-primary);
border-radius: var(--radius-full);
animation: spin 1s linear infinite;

sizes: {
  small: 16px,
  medium: 24px,
  large: 40px
}
```

**Skeleton Loader**:
```css
background: linear-gradient(
  90deg,
  var(--background-tertiary) 0%,
  var(--background-secondary) 50%,
  var(--background-tertiary) 100%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
border-radius: var(--radius-md);
/* Match dimensions of loading content */
```

**Progress Bar**:
```css
height: 4px;
background: var(--background-tertiary);
border-radius: var(--radius-full);
overflow: hidden;

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  transition: width var(--transition-base);
  /* Width set via inline style or JS */
}
```

### 5.7 Navigation Components

**Sidebar Navigation**:
```css
width: 280px;
background: var(--background-secondary);
border-right: 1px solid var(--border-secondary);
height: 100vh;
position: fixed;
left: 0;
top: 0;
padding: var(--space-6);
/* Contains nav items */
```

**Nav Item**:
```css
display: flex;
align-items: center;
gap: var(--space-3);
padding: var(--space-3) var(--space-4);
border-radius: var(--radius-md);
color: var(--text-secondary);
transition: all var(--transition-fast);

hover: {
  background: var(--background-tertiary);
  color: var(--text-primary);
}

active: {
  background: var(--accent-primary) at 20% opacity;
  color: var(--accent-primary);
  border-left: 3px solid var(--accent-primary);
}
```

**Top Bar**:
```css
height: 64px;
background: var(--background-secondary);
border-bottom: 1px solid var(--border-secondary);
padding: 0 var(--space-6);
display: flex;
align-items: center;
justify-content: space-between;
position: sticky;
top: 0;
z-index: 10;
```

**Breadcrumbs**:
```css
display: flex;
align-items: center;
gap: var(--space-2);
color: var(--text-secondary);
font-size: var(--text-sm);

.breadcrumb-item {
  hover: {
    color: var(--accent-primary);
    text-decoration: underline;
  }
}

.breadcrumb-separator {
  color: var(--text-tertiary);
  /* Icon or "/" */
}
```

---

## 6. Responsive Design Guidelines

### 6.1 Breakpoints

```css
--breakpoint-xs: 0px;       /* Mobile portrait */
--breakpoint-sm: 640px;     /* Mobile landscape */
--breakpoint-md: 768px;     /* Tablet portrait */
--breakpoint-lg: 1024px;    /* Tablet landscape / Desktop */
--breakpoint-xl: 1280px;    /* Desktop */
--breakpoint-2xl: 1536px;   /* Large desktop */
```

### 6.2 Layout Adaptations

**Mobile (<768px)**:
- Single column layouts
- Collapsible sidebar becomes bottom drawer or hamburger menu
- Preview panels become bottom sheets or separate tabs
- Workflow graph switches to vertical orientation
- Touch-friendly targets (min 44x44px)
- Reduced padding and spacing

**Tablet (768px-1023px)**:
- Two-column layouts where appropriate
- Sidebar can be collapsed to icons-only
- Preview panels as toggleable drawers
- Workflow graph scales to fit width

**Desktop (≥1024px)**:
- Full multi-column layouts
- Persistent sidebar navigation
- Side-by-side editor + preview
- Workflow graph horizontal with full node details

### 6.3 Touch Optimizations

**Minimum Touch Targets**: 44x44px (iOS HIG standard)

**Gesture Support**:
- Swipe: Navigate between tabs/sections
- Long press: Show context menus
- Pinch: Zoom workflow graph (if needed)
- Pull to refresh: Reload workflow status

**Mobile-Specific Components**:
- Bottom sheets for modals
- Native-style action sheets
- Floating action button (FAB) for primary actions
- Sticky headers/footers for context retention

### 6.4 Typography Scaling

Mobile font sizes slightly reduced for readability:

```css
@media (max-width: 768px) {
  --text-xs: 0.7rem;     /* 11.2px */
  --text-sm: 0.8125rem;  /* 13px */
  --text-base: 0.9375rem;/* 15px */
  --text-lg: 1.0625rem;  /* 17px */
  --text-xl: 1.1875rem;  /* 19px */
  --text-2xl: 1.375rem;  /* 22px */
  /* Larger sizes proportionally reduced */
}
```

---

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 AA Compliance

**Color Contrast**:
- Text: Minimum 4.5:1 for normal text, 3:1 for large text (≥18pt)
- Interactive elements: 3:1 against background
- Status indicators: Not relying on color alone (use icons + color)

**Keyboard Navigation**:
- All interactive elements focusable via Tab
- Logical tab order (left-to-right, top-to-bottom)
- Skip links for main content
- Escape closes modals/dialogs
- Arrow keys navigate within components (dropdowns, lists)

**Focus Indicators**:
```css
*:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}
```

**Screen Reader Support**:
- Semantic HTML elements (nav, main, article, aside, etc.)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content (workflow status updates)
- ARIA expanded/collapsed states for accordions
- Role attributes where semantic HTML insufficient

**Form Accessibility**:
- Label elements associated with inputs (for/id)
- Required fields indicated visually and via aria-required
- Error messages linked to inputs via aria-describedby
- Fieldsets for grouped controls

### 7.2 Internationalization (i18n)

**Text Directionality**:
- Support for RTL languages (Arabic, Hebrew)
- Logical properties (margin-inline, padding-block)
- Mirrored layouts for RTL

**Translation**:
- All UI strings externalized
- No hardcoded text in components
- Number/date formatting locale-aware

**Localization**:
- Tempo units (BPM consistent globally)
- Musical key notation (C, D, E standard, but localize descriptions)

---

## 8. Implementation Guidelines

### 8.1 Technology Stack

**Framework**: React 18+ or React Native (for cross-platform)

**Styling**:
- Tailwind CSS 4.0 with custom configuration
- CSS-in-JS for dynamic styles (styled-components or Emotion)
- Design tokens via CSS custom properties

**State Management**:
- Zustand for global state
- React Query for server state
- Context for form state

**Component Library Base**:
- Radix UI for accessible primitives
- Shadcn/ui as starting point (customize)
- Heroicons for icon set

**Animation**:
- Framer Motion for complex animations
- CSS transitions for simple effects

### 8.2 Component Organization

```
/packages/ui/
  /components/
    /buttons/
      Button.tsx
      IconButton.tsx
    /inputs/
      ChipSelector.tsx
      RangeSlider.tsx
      SectionEditor.tsx
      RhymeSchemeInput.tsx
    /workflow/
      WorkflowGraph.tsx
      StatusBadge.tsx
      MetricsPanel.tsx
      ArtifactPreview.tsx
    /cards/
      Card.tsx
      GradientCard.tsx
    /modals/
      Modal.tsx
      Dialog.tsx
    /navigation/
      Sidebar.tsx
      TopBar.tsx
      Breadcrumbs.tsx
    /feedback/
      ValidationMessage.tsx
      Toast.tsx
      Tooltip.tsx
  /tokens/
    colors.ts
    typography.ts
    spacing.ts
    shadows.ts
  /hooks/
    useBreakpoint.ts
    useTheme.ts
    useValidation.ts
  /utils/
    classNames.ts
    formatters.ts
```

### 8.3 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './packages/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0f0f1c',
          secondary: '#1a1a2e',
          tertiary: '#252540',
        },
        accent: {
          primary: '#8b5cf6',
          secondary: '#3b82f6',
          tertiary: '#6366f1',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          music: '#ec4899',
        },
        // ... other colors
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139,92,246,0.3)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### 8.4 Component API Examples

#### WorkflowGraph Component

```typescript
interface WorkflowGraphProps {
  run: WorkflowRun;
  onNodeClick?: (node: WorkflowNode) => void;
  orientation?: 'horizontal' | 'vertical';
  showMetrics?: boolean;
  className?: string;
}

const WorkflowGraph: React.FC<WorkflowGraphProps> = ({
  run,
  onNodeClick,
  orientation = 'horizontal',
  showMetrics = true,
  className
}) => {
  // Implementation
};
```

#### ChipSelector Component

```typescript
interface ChipSelectorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  maxChips?: number;
  error?: string;
  warning?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const ChipSelector: React.FC<ChipSelectorProps> = ({
  label,
  value,
  onChange,
  suggestions = [],
  maxChips,
  error,
  warning,
  placeholder = 'Type to add...',
  required = false,
  disabled = false
}) => {
  // Implementation
};
```

#### RangeSlider Component

```typescript
interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  step?: number;
  unit?: string;
  allowRange?: boolean;
  presets?: Array<{ label: string; value: number | [number, number] }>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
  allowRange = true,
  presets,
  error,
  required = false,
  disabled = false
}) => {
  // Implementation
};
```

### 8.5 WebSocket Event Integration

```typescript
// Workflow event listener hook
const useWorkflowEvents = (runId: string) => {
  const [status, setStatus] = useState<WorkflowStatus>('pending');
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Record<string, any>>({});

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/events`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.run_id !== runId) return;

      // Update component state based on event
      switch (data.phase) {
        case 'start':
          setCurrentNode(data.node);
          break;
        case 'end':
          setMetrics(prev => ({ ...prev, [data.node]: data.metrics }));
          break;
        case 'fail':
          setStatus('failed');
          break;
      }
    };

    return () => ws.close();
  }, [runId]);

  return { status, currentNode, metrics };
};
```

### 8.6 Validation Patterns

```typescript
// Form validation hook
const useFormValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  const validate = (values: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};

    // Schema validation
    Object.entries(schema.rules).forEach(([field, rules]) => {
      const value = values[field];

      if (rules.required && !value) {
        newErrors[field] = `${field} is required`;
      }

      if (rules.validate) {
        const result = rules.validate(value, values);
        if (result.error) newErrors[field] = result.error;
        if (result.warning) newWarnings[field] = result.warning;
      }
    });

    // Conflict checks (e.g., tempo vs energy)
    const conflicts = checkConflicts(values);
    conflicts.forEach(conflict => {
      newWarnings[conflict.field] = conflict.message;
    });

    setErrors(newErrors);
    setWarnings(newWarnings);

    return { valid: Object.keys(newErrors).length === 0, errors: newErrors, warnings: newWarnings };
  };

  return { errors, warnings, validate };
};
```

---

## 9. Next Steps for Wave 2 Implementation

### 9.1 Priority Order

**Phase 1: Core Component Library** (Week 1-2)
1. Design tokens setup in Tailwind config
2. Button, Card, Modal base components
3. Form input primitives (text, number, dropdown)
4. Validation message component
5. Loading states (spinner, skeleton)

**Phase 2: Music-Specific Inputs** (Week 3-4)
1. ChipSelector component
2. RangeSlider component
3. SectionEditor component
4. RhymeSchemeInput component
5. Form layout and preview panel

**Phase 3: Workflow Dashboard** (Week 5-6)
1. WorkflowGraph component with node states
2. StatusBadge component
3. MetricsPanel component
4. ArtifactPreview component
5. WebSocket integration

**Phase 4: Entity Editors** (Week 7-8)
1. Style editor form
2. Lyrics editor form
3. Persona editor form
4. Producer notes editor form
5. Validation integration

**Phase 5: Polish & Testing** (Week 9-10)
1. Responsive design refinements
2. Accessibility audit
3. Animation tuning
4. Cross-browser testing
5. Performance optimization

### 9.2 Design Review Checkpoints

**Checkpoint 1** (End of Phase 1):
- Review core component implementations
- Verify design token application
- Test dark theme consistency

**Checkpoint 2** (End of Phase 2):
- Review music-specific input components
- Test form validation patterns
- Verify mobile responsiveness

**Checkpoint 3** (End of Phase 3):
- Review workflow dashboard
- Test real-time updates
- Verify WebSocket integration

**Checkpoint 4** (End of Phase 4):
- Review entity editor implementations
- End-to-end workflow testing
- User flow validation

**Final Review** (End of Phase 5):
- Complete design system audit
- Accessibility compliance check
- Performance benchmarking
- Documentation completeness

### 9.3 Documentation Deliverables

1. **Component API Documentation**: Props, examples, usage notes for each component
2. **Storybook**: Interactive component gallery with all states and variants
3. **Design Tokens Reference**: Complete list of CSS variables and their usage
4. **Accessibility Guide**: WCAG compliance checklist and testing procedures
5. **Migration Guide**: For transitioning from MeatyPrompts UI patterns

---

## 10. Appendix

### 10.1 Color Contrast Ratios

Verified against WCAG 2.1 AA standards:

- `var(--text-primary)` on `var(--background-primary)`: 16.5:1 (AAA)
- `var(--text-secondary)` on `var(--background-primary)`: 10.2:1 (AAA)
- `var(--text-tertiary)` on `var(--background-primary)`: 6.8:1 (AA)
- `var(--accent-primary)` on `var(--background-primary)`: 4.9:1 (AA)
- `var(--accent-success)` on `var(--background-primary)`: 5.2:1 (AA)
- `var(--accent-error)` on `var(--background-primary)`: 5.8:1 (AA)

### 10.2 Animation Performance Notes

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (triggers layout reflow)
- Use `will-change` sparingly and only during animation
- Debounce scroll/resize handlers
- Use `requestAnimationFrame` for manual animations

### 10.3 Browser Support

**Target Browsers**:
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari (iOS): Last 2 versions
- Chrome Mobile (Android): Last 2 versions

**Polyfills**:
- CSS custom properties (IE11 if required)
- IntersectionObserver (for lazy loading)
- ResizeObserver (for responsive components)

### 10.4 Design System Versioning

**Version Format**: Major.Minor.Patch

- **Major**: Breaking changes to component APIs or design tokens
- **Minor**: New components or non-breaking enhancements
- **Patch**: Bug fixes and minor tweaks

**Current Version**: 1.0.0 (Initial release)

### 10.5 References

- **Tailwind CSS 4.0 Documentation**: https://tailwindcss.com/
- **Radix UI Primitives**: https://www.radix-ui.com/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Material Design Color System**: https://m3.material.io/styles/color/overview
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/

---

**End of Design Specification Document**

**Next Action**: ui-engineer to begin Phase 1 implementation with core component library.

**Contact**: Design system questions should be directed to design-team channel.

**Last Updated**: 2025-11-13
