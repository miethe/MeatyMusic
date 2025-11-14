---
title: "UI/UX Redesign - Dark Mode Design System - PRD"
description: "Comprehensive redesign of MeatyMusic web application with modern dark mode design system, enhanced visual hierarchy, and improved user experience"
audience: [ai-agents, developers]
tags: [ui, ux, design-system, dark-mode, redesign, enhancement]
created: 2025-11-14
updated: 2025-11-14
category: "product-planning"
status: published
related:
  - /docs/designs/design-system.md
  - /docs/designs/implementation-guide.md
  - /docs/designs/quick-reference.md
  - /docs/designs/migration-comparison.md
---

# UI/UX Redesign - Dark Mode Design System

## 1. Executive Summary

Transform MeatyMusic AMCS from a basic light-mode admin interface to a world-class dark mode creative application with sophisticated visual design, proper information hierarchy, and modern user experience patterns. This comprehensive redesign implements a complete design system with dark purple-gray backgrounds, vibrant accent colors, elevated cards, refined typography, and professional polish befitting a music creation platform.

**Impact**: Dramatic improvement in user perception, usability, and brand positioning as a premium creative tool.

## 2. Context & Background

### Current State Analysis

**Screenshots**: `docs/designs/screenshots/dashboard.png`, `docs/designs/screenshots/song-creation.png`

Current implementation issues:
- **Basic light mode only** - No dark mode support despite user preference
- **Flat visual design** - Minimal depth, elevation, or visual interest
- **Poor information hierarchy** - Everything has equal visual weight
- **Generic admin aesthetic** - Looks like a business dashboard, not a creative tool
- **Minimal color usage** - Primarily gray and blue, lacks vibrancy
- **Limited spacing** - Cramped layouts with insufficient breathing room
- **Basic typography** - No clear hierarchy or sophistication
- **Weak visual identity** - Doesn't convey the creative, music-focused purpose

### Design Vision Analysis

**Renderings**: `docs/designs/renderings/` directory

Target design showcases:
- **Rich dark mode interface** - Deep purple-gray backgrounds (#1a1625, #0f0f1c)
- **Vibrant accent colors** - Purple-blue gradients (#5b4cfa, #6366f1)
- **Card-based layouts** - Proper elevation with shadows and depth
- **Sophisticated typography** - Clear hierarchy with professional styling
- **Generous spacing** - Breathing room and visual comfort
- **Modern creative aesthetic** - Feels like a premium music application
- **Better iconography** - Meaningful, well-styled icons throughout
- **Visual polish** - Attention to detail in every element

### Gap Analysis

**Current vs. Target**: There is a massive gap between the current basic light interface and the sophisticated dark mode design vision. The current implementation feels like a bootstrap admin template, while the target is a polished, modern creative application.

## 3. Problem Statement

MeatyMusic AMCS currently presents as a basic administrative interface despite being a sophisticated music creation system. The visual design:
- Doesn't convey the creative, artistic nature of music composition
- Lacks the visual polish expected of modern creative tools
- Fails to provide clear information hierarchy for complex workflows
- Doesn't support user preference for dark mode interfaces
- Undermines user confidence in the platform's capabilities

**User Impact**: Users may perceive the platform as unfinished, unprofessional, or limited in capability based on the basic visual presentation, regardless of the powerful features underneath.

## 4. Goals & Success Metrics

### Primary Goals

1. **Implement complete dark mode design system** as the default and primary theme
2. **Transform visual identity** from admin tool to creative application
3. **Improve information hierarchy** for better usability and scanning
4. **Enhance user perception** of platform quality and capability
5. **Maintain or improve performance** despite visual enhancements

### Success Metrics

**Qualitative**:
- Visual design matches or exceeds rendering quality
- Clear information hierarchy throughout application
- Consistent design language across all screens
- Professional polish on all interactive elements
- Positive user feedback on new design

**Quantitative**:
- Zero accessibility regressions (maintain WCAG AA compliance)
- Page load performance maintained or improved
- Component reusability: 80%+ of UI uses design system
- Design consistency: 95%+ adherence to design tokens
- Responsive design: 100% screens work mobile through desktop

**Technical**:
- All colors from design system tokens
- All spacing from design system scale
- All typography from design system hierarchy
- All shadows from elevation system
- All animations from motion system

## 5. Requirements

### 5.1 Functional Requirements

#### FR-1: Design System Foundation

- **FR-1.1**: Implement complete color system with dark mode as default
  - Background colors: base (#0f0f1c), surface (#1a1625), panel (#252137)
  - Text colors: strong (#e2e4f5), base (#b4b7d6), muted (#8286a8)
  - Accent colors: primary gradient (#5b4cfa → #6366f1)
  - Semantic colors: success, warning, danger, info
  - State colors: hover, active, disabled, focus

- **FR-1.2**: Implement typography system with Inter font
  - 8-level hierarchy: Display (48px) to Caption (12px)
  - Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
  - Line heights: Tight (1.2) to Relaxed (1.75)
  - Letter spacing: Tight (-0.02em) to Wide (0.05em)

- **FR-1.3**: Implement spacing system with 4px base unit
  - Scale: xs(4px), sm(8px), md(12px), lg(16px), xl(20px), 2xl(24px), 3xl(32px), 4xl(48px), 5xl(64px)
  - Component padding standards
  - Layout margin standards

- **FR-1.4**: Implement elevation/shadow system
  - 5 shadow levels: elevation-1 through elevation-5
  - Accent glow effect for primary actions
  - Proper z-index layering

- **FR-1.5**: Implement motion system
  - Transition durations: micro (70ms), ui (150ms), panel (250ms), modal (300ms)
  - Easing functions: enter (ease-out), exit (ease-in)
  - Animation patterns: fade-in, slide-up, scale-in

#### FR-2: Core Component Library

- **FR-2.1**: Button components
  - Primary variant: Gradient background, accent glow on hover
  - Secondary variant: Solid background, scale on hover
  - Ghost variant: Transparent background, hover state
  - Outline variant: Border only, subtle hover
  - All variants: Icon support, loading states, disabled states

- **FR-2.2**: Card components
  - Default card: elevation-1, hover elevation-2
  - Elevated card: elevation-3, interactive hover
  - Gradient card: Border gradient for emphasis
  - All cards: Proper padding, border radius

- **FR-2.3**: Input components
  - Text inputs: Dark background, focus ring, proper sizing
  - Select dropdowns: Custom styling, proper options
  - Checkboxes/Radio: Custom styled, accessible
  - Toggles: Smooth animation, proper states
  - Chip selectors: Multi-select with badges

- **FR-2.4**: Navigation components
  - Sidebar: Dark background, active states, collapsible sections
  - Top bar: Consistent styling, action buttons
  - Breadcrumbs: Clear hierarchy, proper links
  - Tabs: Underline style, smooth transitions

- **FR-2.5**: Feedback components
  - Badges: Status dots, proper colors, sizing
  - Toasts: Semantic colors, proper positioning
  - Loading states: Skeletons, spinners, progress bars
  - Empty states: Meaningful messages, clear actions

- **FR-2.6**: Modal/Dialog components
  - Backdrop blur effect
  - Proper focus management
  - Smooth entrance/exit animations
  - Responsive sizing

#### FR-3: Layout System

- **FR-3.1**: Dashboard layout
  - Sidebar navigation with collapsible sections
  - Top bar with actions and breadcrumbs
  - Main content area with proper padding
  - Responsive grid system

- **FR-3.2**: Responsive breakpoints
  - Mobile: < 640px (single column, collapsed sidebar)
  - Tablet: 640px - 1023px (2 column grid, persistent sidebar)
  - Desktop: 1024px - 1279px (3 column grid, full layout)
  - Large: ≥ 1280px (4 column grid, spacious layout)

- **FR-3.3**: Container system
  - Max widths: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
  - Proper centering and padding
  - Responsive margins

#### FR-4: Screen Implementations

- **FR-4.1**: Dashboard screen redesign
  - Metric cards with gradient accents and icons
  - Recent songs list with rich card styling
  - Quick actions panel with elevated cards
  - System status with color-coded indicators
  - Getting started guide with numbered steps

- **FR-4.2**: Song creation workflow redesign
  - Wizard-style stepper with progress indicator
  - Form sections with clear hierarchy
  - Input groups with proper spacing
  - Action buttons with clear primary/secondary
  - Preview panels with live updates

- **FR-4.3**: Entity list pages (Styles, Lyrics, Personas, etc.)
  - Grid layout with consistent card styling
  - Hover states with elevation changes
  - Action buttons on cards
  - Empty states with clear CTAs
  - Search/filter bar with proper styling

- **FR-4.4**: Entity editor pages
  - Form layouts with clear sections
  - Input components with proper labels
  - Preview panels with live updates
  - Action buttons (save, cancel, delete)
  - Validation feedback with clear messaging

- **FR-4.5**: Workflow visualization pages
  - Node graph with styled nodes
  - Status indicators with colors
  - Metrics panels with charts
  - Artifact previews with syntax highlighting
  - Action controls with proper hierarchy

### 5.2 Non-Functional Requirements

#### NFR-1: Performance

- **NFR-1.1**: Page load times maintained or improved (< 2s first contentful paint)
- **NFR-1.2**: Smooth animations (60fps, no jank)
- **NFR-1.3**: Lazy load heavy components
- **NFR-1.4**: Optimize CSS bundle size
- **NFR-1.5**: Proper code splitting for design system

#### NFR-2: Accessibility

- **NFR-2.1**: WCAG AA compliance maintained (contrast ratios: text 15.2:1, interactive 10.5:1)
- **NFR-2.2**: Keyboard navigation support for all interactions
- **NFR-2.3**: Screen reader support with proper ARIA labels
- **NFR-2.4**: Focus indicators clearly visible
- **NFR-2.5**: Color not sole means of conveying information

#### NFR-3: Browser Support

- **NFR-3.1**: Chrome/Edge 90+ (primary)
- **NFR-3.2**: Firefox 88+ (secondary)
- **NFR-3.3**: Safari 14+ (secondary)
- **NFR-3.4**: Graceful degradation for older browsers

#### NFR-4: Maintainability

- **NFR-4.1**: All styling via design tokens (no hardcoded values)
- **NFR-4.2**: Component library documented with examples
- **NFR-4.3**: TypeScript interfaces for all component props
- **NFR-4.4**: Storybook documentation for visual reference
- **NFR-4.5**: Clear naming conventions throughout

#### NFR-5: Consistency

- **NFR-5.1**: Design system tokens used 95%+ of the time
- **NFR-5.2**: Component reuse across screens 80%+
- **NFR-5.3**: No visual inconsistencies between screens
- **NFR-5.4**: Animation timing consistent across interactions

## 6. Scope

### In Scope

**Phase 1: Foundation** (Days 1-2)
- Tailwind configuration with design tokens
- Global CSS with custom properties
- Inter font integration
- Base color system implementation
- Typography system implementation
- Spacing system implementation
- Shadow/elevation system implementation
- Motion system implementation

**Phase 2: Component Library** (Days 3-5)
- Button components (all variants)
- Card components (all variants)
- Input components (all types)
- Badge components
- Navigation components
- Modal/Dialog components
- Loading states
- Empty states

**Phase 3: Layout System** (Days 6-7)
- AppShell component with sidebar
- PageHeader component with breadcrumbs
- Grid system implementation
- Container system implementation
- Responsive breakpoint handling

**Phase 4: Screen Implementations** (Days 8-12)
- Dashboard screen redesign
- Song creation workflow redesign
- Entity list pages (Styles, Lyrics, Personas, Producer Notes, Blueprints, Sources)
- Entity editor pages (all entity types)
- Workflow visualization pages
- Settings page

**Phase 5: Polish & Testing** (Days 13-14)
- Animation refinements
- Accessibility audit and fixes
- Performance optimization
- Cross-browser testing
- Responsive testing (mobile, tablet, desktop)
- Visual regression testing

### Out of Scope

- Light mode implementation (future enhancement)
- Custom theme creator for users (future feature)
- Advanced animations beyond design system (future enhancement)
- Illustration/icon library expansion (use existing lucide-react)
- Backend API changes (pure frontend redesign)
- Data migration or schema changes

## 7. Dependencies & Assumptions

### Dependencies

**External**:
- Tailwind CSS 3.4+ (already installed)
- tailwindcss-animate plugin (already installed)
- Inter font from Google Fonts
- lucide-react icons (already installed)
- @meatymusic/ui package (internal, needs update)
- @meatymusic/tokens package (internal, needs creation/update)

**Internal**:
- No backend API changes required
- Existing component structure supports styling updates
- React 18.3+ features available
- Next.js 14.2 App Router patterns

### Assumptions

- Dark mode is preferred and default (per user request)
- Design system specs are final and approved
- No major functional changes during redesign
- Component props remain stable
- Existing state management continues to work
- Performance budget: No more than 10% increase in bundle size

### Risks

**Risk 1: Visual Design Complexity**
- Mitigation: Start with foundation, build incrementally
- Fallback: Simplify gradient effects if performance issues

**Risk 2: Accessibility Regressions**
- Mitigation: Audit early and often, automated testing
- Fallback: Adjust colors/contrasts to meet WCAG AA

**Risk 3: Browser Compatibility**
- Mitigation: Test in all target browsers regularly
- Fallback: Provide graceful degradation for older browsers

**Risk 4: Bundle Size Growth**
- Mitigation: Code split design system, lazy load components
- Fallback: Remove unnecessary animation complexity

**Risk 5: Responsive Design Issues**
- Mitigation: Mobile-first development, test all breakpoints
- Fallback: Simplified layouts for mobile if needed

## 8. Target State

### User Experience

**Before**: Users see a basic light-mode admin interface with flat design, minimal visual hierarchy, and generic aesthetics that don't inspire confidence in the platform's creative capabilities.

**After**: Users experience a polished, modern dark-mode creative application with:
- Rich visual design that conveys professionalism and creativity
- Clear information hierarchy making workflows easy to understand
- Sophisticated animations and interactions that feel responsive
- Consistent design language that builds familiarity and trust
- Visual identity aligned with music creation and artistic expression

### Technical State

**Design System**:
- Complete token-based design system in Tailwind config
- All colors, typography, spacing, shadows from tokens
- CSS custom properties for runtime flexibility
- Component library with 95%+ token usage

**Component Architecture**:
- Reusable component library in @meatymusic/ui
- TypeScript interfaces for all component props
- Storybook documentation for visual reference
- Consistent component patterns across screens

**Implementation Quality**:
- WCAG AA compliant throughout
- 60fps smooth animations
- Responsive across all breakpoints
- Code split for optimal loading
- Well-documented and maintainable

## 9. Acceptance Criteria

### Design System

- [ ] **AC-1**: All design tokens implemented in Tailwind config
- [ ] **AC-2**: All colors from design system color palette
- [ ] **AC-3**: All typography from design system hierarchy
- [ ] **AC-4**: All spacing from design system scale
- [ ] **AC-5**: All shadows from elevation system
- [ ] **AC-6**: All animations from motion system

### Component Library

- [ ] **AC-7**: Button components match design specs (all 4 variants)
- [ ] **AC-8**: Card components match design specs (all 3 variants)
- [ ] **AC-9**: Input components match design specs (all types)
- [ ] **AC-10**: Navigation components match design specs
- [ ] **AC-11**: Badge components match design specs
- [ ] **AC-12**: Modal components match design specs
- [ ] **AC-13**: All components have TypeScript interfaces
- [ ] **AC-14**: All components documented in Storybook

### Screen Implementations

- [ ] **AC-15**: Dashboard screen matches design vision
- [ ] **AC-16**: Song creation workflow matches design vision
- [ ] **AC-17**: Entity list pages match design vision
- [ ] **AC-18**: Entity editor pages match design vision
- [ ] **AC-19**: Workflow pages match design vision
- [ ] **AC-20**: All screens use design system components 80%+

### Accessibility

- [ ] **AC-21**: All text meets WCAG AA contrast (15.2:1 strong, 10.5:1 base)
- [ ] **AC-22**: All interactive elements meet contrast requirements
- [ ] **AC-23**: Keyboard navigation works for all interactions
- [ ] **AC-24**: Screen readers can navigate all content
- [ ] **AC-25**: Focus indicators clearly visible on all interactive elements
- [ ] **AC-26**: No accessibility regressions from current implementation

### Performance

- [ ] **AC-27**: First Contentful Paint < 2s
- [ ] **AC-28**: Largest Contentful Paint < 3s
- [ ] **AC-29**: All animations run at 60fps with no jank
- [ ] **AC-30**: CSS bundle size increase < 10%
- [ ] **AC-31**: JavaScript bundle size increase < 10%

### Responsiveness

- [ ] **AC-32**: All screens work on mobile (< 640px)
- [ ] **AC-33**: All screens work on tablet (640px - 1023px)
- [ ] **AC-34**: All screens work on desktop (1024px - 1279px)
- [ ] **AC-35**: All screens work on large desktop (≥ 1280px)
- [ ] **AC-36**: No horizontal scrolling on any breakpoint

### Quality

- [ ] **AC-37**: Zero hardcoded colors outside design system
- [ ] **AC-38**: Zero hardcoded spacing values outside design system
- [ ] **AC-39**: Zero TypeScript errors
- [ ] **AC-40**: Zero ESLint errors
- [ ] **AC-41**: All components have basic unit tests
- [ ] **AC-42**: Visual regression tests pass

## 10. Implementation

### Overview

Implementation follows a bottom-up approach: Foundation → Components → Layouts → Screens → Polish

**Total Effort**: 14 days (8-14 days estimated by ui-designer)
**Approach**: Phased implementation with continuous integration
**Strategy**: Build reusable foundation, then apply systematically

### Phase 1: Foundation Setup (Days 1-2, 2 days)

**Objective**: Implement design system tokens and global styles

**Tasks**:

| ID | Task | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) |
|----|------|-------------|---------------------|----------|---------------------|
| FOUND-001 | Update Tailwind Config | Implement complete design system in tailwind.config.js | All tokens defined, no hardcoded values | 4h | ui-engineer-enhanced, frontend-developer |
| FOUND-002 | Create Global CSS | Update globals.css with CSS custom properties and base styles | All CSS vars defined, dark mode as default | 3h | ui-engineer-enhanced |
| FOUND-003 | Add Inter Font | Integrate Inter font from Google Fonts with proper loading | Font loads, applied globally, no FOUT | 1h | frontend-developer |
| FOUND-004 | Create Tokens Package | Update @meatymusic/tokens with design system values | Package exports all tokens, TypeScript types | 4h | ui-engineer-enhanced, backend-architect |
| FOUND-005 | Smoke Test Foundation | Verify tokens work, test in browser, check responsive | All tokens accessible, no console errors | 2h | ui-engineer-enhanced |

**Quality Gates**:
- All design tokens accessible in Tailwind classes
- CSS custom properties work in browser
- Inter font loads correctly
- No TypeScript or build errors
- Responsive breakpoints work

**Files Modified**:
- `apps/web/tailwind.config.js`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx` (font import)
- `packages/tokens/src/index.ts`
- `packages/tokens/dist/tailwind-preset.js`

### Phase 2: Component Library (Days 3-5, 3 days)

**Objective**: Build complete component library with design system styling

**Tasks**:

| ID | Task | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) |
|----|------|-------------|---------------------|----------|---------------------|
| COMP-001 | Button Components | Implement all 4 button variants with design system styling | Primary, secondary, ghost, outline variants work | 4h | ui-engineer-enhanced |
| COMP-002 | Card Components | Implement all 3 card variants with elevation system | Default, elevated, gradient cards work | 3h | ui-engineer-enhanced |
| COMP-003 | Input Components | Implement text, select, checkbox, radio, toggle, chip selector | All input types styled correctly, accessible | 6h | ui-engineer-enhanced, web-accessibility-checker |
| COMP-004 | Badge Components | Implement status badges with colors and dots | All badge variants work, proper sizing | 2h | ui-engineer-enhanced |
| COMP-005 | Navigation Components | Sidebar, tabs, breadcrumbs with active states | Navigation styled correctly, active states work | 4h | ui-engineer-enhanced, frontend-developer |
| COMP-006 | Modal/Dialog Components | Modal with backdrop blur and animations | Modal opens/closes smoothly, focus management works | 3h | ui-engineer-enhanced |
| COMP-007 | Loading States | Skeleton loaders, spinners, progress bars | Loading states styled correctly, smooth animations | 2h | ui-engineer-enhanced |
| COMP-008 | Empty States | Empty state components with icons and CTAs | Empty states clear, actionable, styled correctly | 2h | ui-engineer-enhanced |
| COMP-009 | TypeScript Interfaces | Add/update TypeScript interfaces for all components | All components have proper types, no errors | 2h | ui-engineer-enhanced |
| COMP-010 | Component Tests | Unit tests for component logic and accessibility | Tests pass, accessibility checks pass | 4h | ui-engineer-enhanced, web-accessibility-checker |

**Quality Gates**:
- All components use design system tokens
- All components have TypeScript interfaces
- All components have basic tests
- All components meet WCAG AA contrast
- All components have proper hover/focus states

**Files Modified**:
- `packages/ui/src/components/Button.tsx`
- `packages/ui/src/components/Card.tsx`
- `packages/ui/src/components/Input.tsx`
- `packages/ui/src/components/Badge.tsx`
- `packages/ui/src/components/Navigation.tsx`
- `packages/ui/src/components/Modal.tsx`
- `packages/ui/src/components/Loading.tsx`
- `packages/ui/src/components/EmptyState.tsx`
- `packages/ui/src/components/index.ts`

### Phase 3: Layout System (Days 6-7, 2 days)

**Objective**: Implement responsive layout system with AppShell and containers

**Tasks**:

| ID | Task | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) |
|----|------|-------------|---------------------|----------|---------------------|
| LAYOUT-001 | Update AppShell | Redesign AppShell with new sidebar and dark mode styling | AppShell uses design system, responsive | 4h | ui-engineer-enhanced, frontend-developer |
| LAYOUT-002 | Update PageHeader | Redesign PageHeader with breadcrumbs and actions | PageHeader styled correctly, responsive | 2h | ui-engineer-enhanced |
| LAYOUT-003 | Grid System | Implement responsive grid system with breakpoints | Grid works at all breakpoints, proper spacing | 2h | ui-engineer-enhanced |
| LAYOUT-004 | Container System | Implement container system with max-widths | Containers center properly, responsive margins | 2h | ui-engineer-enhanced |
| LAYOUT-005 | Responsive Testing | Test layouts at all breakpoints (mobile to large desktop) | Layouts work correctly at all sizes, no scrolling issues | 3h | ui-engineer-enhanced, frontend-developer |
| LAYOUT-006 | Layout Documentation | Document layout patterns and usage | Layout docs clear, examples provided | 2h | documentation-writer |

**Quality Gates**:
- AppShell responsive at all breakpoints
- Sidebar collapsible on mobile
- PageHeader displays correctly
- Grid system works responsively
- Containers center and scale properly

**Files Modified**:
- `apps/web/src/components/layout/AppShell.tsx`
- `apps/web/src/components/layout/PageHeader.tsx`
- `apps/web/src/app/(dashboard)/layout.tsx`

### Phase 4: Screen Implementations (Days 8-12, 5 days)

**Objective**: Apply design system to all screens in the application

**Tasks**:

| ID | Task | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) |
|----|------|-------------|---------------------|----------|---------------------|
| SCREEN-001 | Dashboard Redesign | Redesign dashboard with metric cards, recent songs, quick actions | Dashboard matches design vision, fully functional | 6h | ui-engineer-enhanced, frontend-developer |
| SCREEN-002 | Song Creation Workflow | Redesign song creation wizard with stepper and form sections | Wizard styled correctly, navigation works | 6h | ui-engineer-enhanced, frontend-developer |
| SCREEN-003 | Styles List/Editor | Redesign styles list and editor pages | Styles pages match design vision | 4h | ui-engineer-enhanced |
| SCREEN-004 | Lyrics List/Editor | Redesign lyrics list and editor pages | Lyrics pages match design vision | 4h | ui-engineer-enhanced |
| SCREEN-005 | Personas List/Editor | Redesign personas list and editor pages | Personas pages match design vision | 4h | ui-engineer-enhanced |
| SCREEN-006 | Producer Notes List/Editor | Redesign producer notes list and editor pages | Producer notes pages match design vision | 4h | ui-engineer-enhanced |
| SCREEN-007 | Blueprints List | Redesign blueprints list page | Blueprints page matches design vision | 2h | ui-engineer-enhanced |
| SCREEN-008 | Sources List/Editor | Redesign sources list and editor pages | Sources pages match design vision | 4h | ui-engineer-enhanced |
| SCREEN-009 | Song Detail Page | Redesign song detail page with workflow status | Song detail matches design vision | 4h | ui-engineer-enhanced, frontend-developer |
| SCREEN-010 | Workflow Visualization | Redesign workflow visualization with node graph and metrics | Workflow viz matches design vision | 6h | ui-engineer-enhanced, frontend-developer |
| SCREEN-011 | Settings Page | Redesign settings page | Settings matches design vision | 2h | ui-engineer-enhanced |
| SCREEN-012 | Screen Testing | Test all screens for functionality and visual correctness | All screens work, look correct, responsive | 4h | ui-engineer-enhanced, frontend-developer |

**Quality Gates**:
- All screens use design system components 80%+
- All screens responsive at all breakpoints
- All screens match design vision
- No functional regressions
- All interactions work smoothly

**Files Modified**:
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/app/(dashboard)/songs/new/page.tsx`
- `apps/web/src/app/(dashboard)/entities/styles/page.tsx`
- `apps/web/src/app/(dashboard)/entities/styles/new/page.tsx`
- `apps/web/src/app/(dashboard)/entities/styles/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/entities/lyrics/page.tsx`
- `apps/web/src/app/(dashboard)/entities/lyrics/new/page.tsx`
- `apps/web/src/app/(dashboard)/entities/personas/page.tsx`
- `apps/web/src/app/(dashboard)/entities/personas/new/page.tsx`
- `apps/web/src/app/(dashboard)/entities/producer-notes/page.tsx`
- `apps/web/src/app/(dashboard)/entities/producer-notes/new/page.tsx`
- `apps/web/src/app/(dashboard)/entities/blueprints/page.tsx`
- `apps/web/src/app/(dashboard)/entities/sources/page.tsx`
- `apps/web/src/app/(dashboard)/entities/sources/new/page.tsx`
- `apps/web/src/app/(dashboard)/songs/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/songs/[id]/workflow/page.tsx`
- `apps/web/src/app/(dashboard)/settings/page.tsx`

### Phase 5: Polish & Testing (Days 13-14, 2 days)

**Objective**: Refine animations, ensure accessibility, optimize performance

**Tasks**:

| ID | Task | Description | Acceptance Criteria | Estimate | Assigned Subagent(s) |
|----|------|-------------|---------------------|----------|---------------------|
| POLISH-001 | Animation Refinements | Refine entrance animations, transitions, micro-interactions | Animations smooth, 60fps, feel polished | 3h | ui-engineer-enhanced, react-performance-optimizer |
| POLISH-002 | Accessibility Audit | Run full accessibility audit with automated tools and manual testing | All WCAG AA issues resolved | 4h | web-accessibility-checker, ui-engineer-enhanced |
| POLISH-003 | Accessibility Fixes | Fix any accessibility issues found in audit | All accessibility tests pass | 3h | web-accessibility-checker, ui-engineer-enhanced |
| POLISH-004 | Performance Optimization | Optimize CSS bundle, lazy load components, reduce JavaScript | Performance metrics met, bundle size acceptable | 4h | react-performance-optimizer, ui-engineer-enhanced |
| POLISH-005 | Cross-Browser Testing | Test in Chrome, Firefox, Safari on Mac/Windows | Works correctly in all target browsers | 3h | ui-engineer-enhanced, frontend-developer |
| POLISH-006 | Mobile Testing | Test on real mobile devices (iOS and Android) | Works correctly on mobile devices | 2h | ui-engineer-enhanced, frontend-developer |
| POLISH-007 | Visual Regression Tests | Set up and run visual regression tests | Visual tests pass, no unexpected changes | 3h | ui-engineer-enhanced |
| POLISH-008 | Final Review | Comprehensive review of all screens and components | Everything matches design specs, works correctly | 2h | ui-engineer-enhanced, ui-designer |
| POLISH-009 | Documentation Updates | Update README, component docs, design system docs | Documentation complete and accurate | 2h | documentation-writer |

**Quality Gates**:
- All animations run at 60fps
- All WCAG AA accessibility checks pass
- Performance metrics met (FCP < 2s, LCP < 3s)
- Works in all target browsers
- Works on mobile devices
- Visual regression tests pass
- Documentation complete

**Files Modified**:
- Various components for animation/performance tweaks
- Documentation files
- Test configuration files

### Success Criteria Summary

**Overall Success**:
- Design system fully implemented and consistently used
- All 42 acceptance criteria met
- Visual design matches or exceeds rendering quality
- No accessibility regressions
- No performance regressions
- All screens responsive and functional
- User feedback positive

**Phased Success**:
- **Phase 1**: Foundation working, tokens accessible
- **Phase 2**: Component library complete, tested, documented
- **Phase 3**: Layouts responsive, working correctly
- **Phase 4**: All screens redesigned and functional
- **Phase 5**: Polish complete, all tests passing

## 11. Related Documentation

- **Design System**: `/docs/designs/design-system.md` - Complete design system specification
- **Implementation Guide**: `/docs/designs/implementation-guide.md` - Step-by-step implementation instructions
- **Quick Reference**: `/docs/designs/quick-reference.md` - Developer cheat sheet
- **Migration Comparison**: `/docs/designs/migration-comparison.md` - Before/after examples
- **Design README**: `/docs/designs/README.md` - Design documentation index

## 12. Appendix

### Design System Token Reference

**Colors** (Dark Mode Default):
- Background: `#0f0f1c` (base), `#1a1625` (surface), `#252137` (panel)
- Text: `#e2e4f5` (strong), `#b4b7d6` (base), `#8286a8` (muted)
- Primary: `#5b4cfa` → `#6366f1` (gradient)
- Success: `#10b981`, Warning: `#f59e0b`, Danger: `#ef4444`, Info: `#3b82f6`

**Typography** (Inter Font):
- Display: 48px/1.2/-0.02em/700
- H1: 36px/1.25/-0.015em/700
- H2: 30px/1.3/-0.01em/600
- H3: 24px/1.35/0/600
- H4: 20px/1.4/0/600
- Body: 16px/1.5/0/400
- Small: 14px/1.5/0/400
- Caption: 12px/1.5/0.01em/400

**Spacing** (4px base):
- xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 20px, 2xl: 24px, 3xl: 32px, 4xl: 48px, 5xl: 64px

**Shadows**:
- elevation-1: `0 2px 8px rgba(0, 0, 0, 0.15)`
- elevation-2: `0 4px 16px rgba(0, 0, 0, 0.2)`
- elevation-3: `0 8px 24px rgba(0, 0, 0, 0.25)`
- elevation-4: `0 16px 32px rgba(0, 0, 0, 0.3)`
- elevation-5: `0 24px 48px rgba(0, 0, 0, 0.35)`
- accent-glow: `0 0 20px rgba(91, 76, 250, 0.4)`

**Motion**:
- Duration: micro(70ms), ui(150ms), panel(250ms), modal(300ms)
- Easing: enter(cubic-bezier(0,0,0.2,1)), exit(cubic-bezier(0.4,0,1,1))

### Component Variants Summary

**Buttons**:
- Primary: Gradient background, accent glow, scale hover
- Secondary: Solid background, scale hover
- Ghost: Transparent, subtle hover
- Outline: Border only, subtle hover

**Cards**:
- Default: elevation-1, hover elevation-2
- Elevated: elevation-3, interactive
- Gradient: Border gradient accent

**Inputs**:
- Text, Select, Checkbox, Radio, Toggle, Chip Selector
- All: Dark background, focus ring, proper sizing

### Browser Support Matrix

| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| Chrome | 90+ | Primary | Full support, tested |
| Edge | 90+ | Primary | Full support, tested |
| Firefox | 88+ | Secondary | Full support, tested |
| Safari | 14+ | Secondary | Full support, tested |
| Mobile Safari | iOS 14+ | Secondary | Touch optimized |
| Chrome Mobile | Latest | Secondary | Touch optimized |

### Accessibility Checklist

- [ ] Color contrast meets WCAG AA (text 15.2:1, interactive 10.5:1)
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (2px ring with accent color)
- [ ] ARIA labels on all interactive elements
- [ ] Alt text on all images
- [ ] Form labels associated with inputs
- [ ] Error messages clearly announced
- [ ] Skip navigation links provided
- [ ] Semantic HTML throughout
- [ ] Screen reader tested

---

**Last Updated**: 2025-11-14
**Status**: Published
**Version**: 1.0
