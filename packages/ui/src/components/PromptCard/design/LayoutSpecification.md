# PromptCard Zone-Based Layout Design Specification

## Overview

This document outlines the comprehensive zone-based layout system designed to solve the PermissionBadge overlap issue and create a scalable, deterministic layout architecture for the PromptCard component.

## Problem Statement

The original PromptCard used a CSS Grid layout (`grid-template-columns: 1fr auto`) in the header row that caused content overlap when:
- Long titles exceeded available space
- Version badges and permission badges appeared simultaneously
- Complications occupied corner positions

## Solution: Zone-Based Architecture

### Core Principles

1. **Deterministic Layout**: Same data produces identical appearance
2. **Graceful Degradation**: Content adapts when space is constrained
3. **Component Registration**: Dynamic component management with priority resolution
4. **Space Reservation**: Complications reserve space to prevent overlap
5. **Progressive Disclosure**: Content visibility based on card size and available space

### Zone Architecture

#### Zone Types

```
┌─────────────────────────────────────────┐
│ HEADER ZONE (Core)                      │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Title Container │ │ Metadata        │ │
│ │ (flex: 1)       │ │ Container       │ │
│ │                 │ │ (max-width:35%) │ │
│ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────┤
│ DESCRIPTION ZONE (Core - Conditional)   │
├─────────────────────────────────────────┤
│ META STRIP ZONE (Meta + Overflow)       │
│ ┌───────────────────┐ ┌───────────────┐ │
│ │ Meta Zone (65%)   │ │ Overflow (35%)│ │
│ │ Tags, Model Info  │ │ Extra Items   │ │
│ └───────────────────┘ └───────────────┘ │
├─────────────────────────────────────────┤
│ BODY ZONE (Core - Scrollable)          │
│ • Body Preview                          │
│ • Extended Content (XL only)            │
│ • Statistics                           │
├─────────────────────────────────────────┤
│ ACTIONS ZONE (Core - Pinned Bottom)    │
└─────────────────────────────────────────┘
```

#### Zone Specifications

**Header Zone (Core)**
- Layout: Flex row with space-between
- Title Container: `flex: 1, min-width: 0`
- Metadata Container: `flex-shrink: 0, max-width: 35%`
- Reserved space for topRight complications

**Meta Strip Zone (Meta + Overflow)**
- Layout: Flex row with justified content
- Meta Zone: 65% width for primary content
- Overflow Zone: 35% width for secondary content
- Automatic overflow handling with indicator

**Body Zone (Core)**
- Layout: Flex column with scrollable content
- Adaptive content based on card size
- Extended zone for XL variant only

**Actions Zone (Core)**
- Layout: Pinned to bottom
- Consistent height across all variants
- Essential actions always visible

### Component Manifest System

#### Component Registration

```typescript
interface ComponentManifest {
  id: string;
  displayName: string;
  priority: number; // 1-100, higher = more important
  placement: ComponentPlacement;
  requiredSpace: ComponentDimensions;
  supportedSizes: CardSize[];
  gracefulFallback: 'hide' | 'truncate' | 'collapse' | 'relocate';
  fallbackPlacement?: ComponentPlacement;
}
```

#### Priority Hierarchy

1. **Priority 100**: Title (always visible)
2. **Priority 90**: Permission Badge
3. **Priority 80**: Version Badge
4. **Priority 70**: Description
5. **Priority 60**: Last Run Time
6. **Priority 50**: Tags
7. **Priority 40**: Model Information
8. **Priority 30**: Extended Statistics

#### Graceful Fallback Behaviors

**Hide**: Component disappears completely
- Used for: Last run time, model info in compact mode
- Triggers: Insufficient space, unsupported card size

**Truncate**: Component content is shortened
- Used for: Title, description, tags
- Implementation: CSS `text-overflow: ellipsis`

**Collapse**: Component size reduces
- Used for: Metadata badges in mobile view
- Implementation: Smaller font size, reduced padding

**Relocate**: Component moves to different zone
- Used for: Permission badge → overflow zone
- Fallback: Hide if no alternative placement

### Space Allocation Rules

#### Card Size Variants

**Compact (288px × 220px)**
- Header: Title + Version badge only
- No description zone
- Limited meta content
- Minimal complications

**Standard (420px × 280px)**
- Full header with metadata
- Description zone (if present)
- Complete meta strip
- Standard complications

**XL (560px × 320px)**
- Full feature set
- Extended content zone
- Additional complications
- Enhanced metadata display

#### Complication Space Reservation

```css
/* Dynamic CSS custom properties */
--complication-reserve-top: 0-64px;
--complication-reserve-right: 0-64px;
--complication-reserve-bottom: 0-64px;
--complication-reserve-left: 0-64px;
```

**Reservation Logic**:
- TopRight complication → reduces title container width
- TopLeft complication → adds padding-top to header
- Edge complications → reduce meta zone width
- Footer complications → add margin-bottom

### Layout Engine

#### Space Calculation Algorithm

1. **Initialize Base Dimensions**
   - Get card dimensions for size variant
   - Calculate padding and margins
   - Determine available content area

2. **Reserve Complication Space**
   - Check active complications
   - Calculate required reservations
   - Update available space accordingly

3. **Allocate Components by Priority**
   - Sort components by priority (high to low)
   - Check space requirements vs. available space
   - Apply graceful fallback if insufficient space
   - Update used space tracking

4. **Generate CSS Properties**
   - Create custom properties for dynamic spacing
   - Set zone visibility flags
   - Configure overflow indicators

#### Collision Detection

**Horizontal Conflicts**:
- Title vs. metadata container
- Meta zone vs. overflow zone
- Edge complications vs. content

**Vertical Conflicts**:
- Header vs. top complications
- Footer vs. bottom complications
- Body content vs. all zones

**Resolution Strategy**:
1. Check component dependencies
2. Identify conflicts with existing components
3. Apply fallback behavior in priority order
4. Update layout constraints

### CSS Architecture

#### Grid Replacement Strategy

**Before (Problematic)**:
```css
.headerRow {
  display: grid;
  grid-template-columns: 1fr auto; /* Causes overlap */
  gap: var(--mp-spacing-3);
}
```

**After (Zone-Based)**:
```css
.headerZone {
  display: flex;
  flex-direction: column;
  padding-top: var(--complication-reserve-top, 0);
}

.headerContent {
  display: flex;
  justify-content: space-between;
  gap: var(--mp-spacing-3);
}

.titleContainer {
  flex: 1;
  min-width: 0;
  margin-right: var(--complication-reserve-right, 0);
}

.metadataContainer {
  flex-shrink: 0;
  max-width: 35%;
}
```

#### Responsive Patterns

**Mobile (< 768px)**:
- Header content stacks vertically
- Metadata takes full width
- Meta strip stacks tags and model info
- Complications move to block flow

**Tablet (768px - 1024px)**:
- Reduced card widths
- Smaller complication sizes
- Adjusted gap spacing

**Desktop (> 1024px)**:
- Full size variants available
- Maximum complication sizes
- Enhanced spacing

### Animation & Transitions

#### Zone Transitions

```css
.layout-zone {
  transition:
    width var(--mp-motion-duration-ui),
    height var(--mp-motion-duration-ui),
    opacity var(--mp-motion-duration-ui);
}
```

#### Component Entrance/Exit

- **Entrance**: Fade in with slight scale up
- **Exit**: Fade out with scale down
- **Reflow**: Smooth width/height transitions
- **Overflow**: Indicator appears with bounce

#### Reduced Motion Support

All animations respect `prefers-reduced-motion: reduce`:
- Transitions disabled
- Instant state changes
- No scale or movement effects

### Integration with Complications

#### Existing Complication System

The zone-based layout maintains full compatibility with the existing 7-slot complication system:

- **topLeft**: Reserves header top-left space
- **topRight**: Reduces title container width
- **bottomLeft**: Reserves actions bottom-left space
- **bottomRight**: Reserves actions bottom-right space
- **edgeLeft**: Reduces overall content width
- **edgeRight**: Reduces overall content width
- **footer**: Reserves bottom space

#### Dynamic Space Calculation

```typescript
function calculateComplicationSpace(config: LayoutConfiguration) {
  const complicationSize = getComplicationMaxSize(config.cardSize);
  const { hasComplications } = config;

  return {
    top: (hasComplications.topLeft || hasComplications.topRight) ? complicationSize : 0,
    right: hasComplications.topRight ? complicationSize : 0,
    bottom: hasComplications.footer ? complicationSize : 0,
    left: hasComplications.edgeLeft ? complicationSize : 0,
  };
}
```

### Error States & Debugging

#### Development Tools

**Layout Debug Overlay**:
- Shows zone boundaries
- Displays component counts
- Highlights overflow areas
- Lists layout warnings

**Console Warnings**:
- Component conflicts
- Space constraint violations
- Fallback behavior triggers
- Performance optimization suggestions

#### Error Recovery

**Invalid Component Manifest**:
- Skip registration
- Log warning in development
- Continue with valid components

**Space Calculation Errors**:
- Fall back to default dimensions
- Apply conservative spacing
- Maintain basic functionality

**Zone Rendering Failures**:
- Hide problematic zone
- Show error boundary
- Preserve other zones

### Performance Optimizations

#### CSS Optimizations

```css
.layout-zone {
  contain: layout style;
  isolation: isolate;
}

.layout-zone-meta,
.layout-zone-overflow {
  contain: size layout style;
}
```

#### React Optimizations

- **Memoization**: Zone calculations cached by configuration
- **Lazy Loading**: Components loaded on demand
- **Change Detection**: Minimal re-renders on data changes
- **Virtualization**: Large lists in zones virtualized

#### Bundle Size Impact

- **Core System**: ~8KB compressed
- **Component Manifests**: ~2KB compressed
- **Layout Engine**: ~4KB compressed
- **Total Addition**: ~14KB compressed

### Migration Strategy

#### Phase 1: Foundation (Completed)
- ✅ Zone-based CSS architecture
- ✅ Component manifest system
- ✅ Layout engine implementation
- ✅ Layout provider components

#### Phase 2: Integration (Current)
- 🔄 Update PromptCard component
- 🔄 Migrate existing components
- 🔄 Add zone rendering system
- 🔄 Update complication integration

#### Phase 3: Enhancement (Future)
- ⏳ Add animation system
- ⏳ Implement overflow handling
- ⏳ Add debug tools
- ⏳ Performance optimization

#### Phase 4: Extension (Future)
- ⏳ Custom component registration API
- ⏳ Advanced layout algorithms
- ⏳ User preference persistence
- ⏳ A/B testing framework

### Success Metrics

#### Immediate Goals
- ✅ Eliminate overlap issues
- ✅ Maintain visual consistency
- ✅ Preserve accessibility
- ✅ Support all card variants

#### Performance Targets
- Layout calculation: < 5ms
- Zone rendering: < 16ms
- Animation smoothness: 60fps
- Bundle size increase: < 20KB

#### Quality Metrics
- Zero overlap issues
- 100% responsive coverage
- WCAG 2.1 AA compliance
- Cross-browser compatibility

### Future Enhancements

#### Advanced Features
- **Dynamic Layouts**: AI-driven component arrangement
- **User Preferences**: Customizable priority ordering
- **Context Awareness**: Layout adaptation based on usage
- **Performance Analytics**: Real-time layout metrics

#### Integration Opportunities
- **Design System**: Export layout patterns
- **Storybook**: Interactive layout playground
- **Documentation**: Auto-generated specifications
- **Testing**: Visual regression automation

This zone-based layout system provides a robust foundation for the PromptCard component that eliminates overlap issues while enabling future scalability and customization.
