# packages/ui Rules & Component Standards

## Component Philosophy

- Radix primitives wrapped in our components
- Never expose Radix directly to apps
- Every component needs Storybook stories + a11y documentation

## Design System Compliance

- Follow Prompt Card spec as exemplar
- Use design tokens from `@meaty/tokens`
- WCAG 2.1 AA compliance required

## Component Structure

- Props interface with clear JSDoc
- All variants and states documented in stories
- Accessibility notes in component README

## Testing Requirements

- Visual regression tests via Storybook
- jest-axe checks for a11y violations
- Keyboard navigation verification

## Interactive Badge Pattern

When making Badge components interactive (clickable), **never apply interactive props directly to the Badge**. This breaks Radix's `asChild` composition pattern used by tooltips and other wrappers.

### Correct Pattern
Wrap the Badge in a `div` that handles all interactivity:

```tsx
<div
  onClick={handleClick}
  role="button"
  tabIndex={0}
  aria-label="Descriptive action label"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer"
>
  <Badge variant="secondary">Interactive Badge</Badge>
</div>
```

### Why This Matters
- Enables tooltip composition via `TooltipTrigger asChild`
- Prevents `React.Children.only` errors
- Provides proper ARIA structure for accessibility
- Follows established ContextCard pattern

**Reference Implementation**: `/packages/ui/src/components/ContextCard/sections/Header.tsx` (lines 37-68)

---

## Controlled Components with asChild Pattern

When using controlled Radix components (Collapsible, Select, etc.) with `asChild`, **avoid providing both state AND change handlers**. This causes setState-during-render errors.

### Anti-Pattern - Competing Event Handlers
```tsx
{/* ❌ DON'T: Both onOpenChange and Button onClick manage state */}
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger asChild>
    <Button onClick={setIsOpen}>Toggle</Button>
  </CollapsibleTrigger>
</Collapsible>
```

**Problem:** Radix's Slot merges event handlers, causing setState to be called during render phase.

### Correct Pattern 1 - Fully Controlled
```tsx
{/* ✓ DO: Single source of state updates via Button onClick */}
<Collapsible open={isOpen}>
  <CollapsibleTrigger asChild>
    <Button onClick={() => setIsOpen(!isOpen)}>Toggle</Button>
  </CollapsibleTrigger>
</Collapsible>
```

### Correct Pattern 2 - Fully Uncontrolled
```tsx
{/* ✓ DO: Let Radix manage internal state */}
<Collapsible defaultOpen={false}>
  <CollapsibleTrigger asChild>
    <Button>Toggle</Button>
  </CollapsibleTrigger>
</Collapsible>
```

### Why This Matters
- Prevents "Cannot update component while rendering" errors
- Avoids cascading React.Children.only errors
- Respects React's render phase rules
- Ensures clean state update batching

**Key Rule:** When using `asChild`, choose ONE of:
- Controlled state (open prop) with explicit onClick on child, OR
- Uncontrolled state (defaultOpen) with no manual state management

**Reference Investigation**: `.claude/worknotes/prompt-authoring-enhancements/version-badge-debugging.md`

## References

- Design system: @DESIGN-GUIDE.md
- Prompt Card spec: section 10 in DESIGN-GUIDE.md
