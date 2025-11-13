# ConfirmDialog Component

A customizable confirmation dialog component that replaces browser native `confirm()` with a branded, accessible alternative.

## Overview

The ConfirmDialog component provides a consistent, accessible way to confirm user actions throughout the application. It features focus trap, keyboard navigation, and three visual variants for different use cases.

**NEVER use browser native `confirm()` - always use this component.**

## Features

- ✅ Three visual variants: default, destructive, warning
- ✅ Customizable title, description, and action labels
- ✅ Focus trap with automatic focus management
- ✅ Full keyboard navigation (Tab, Shift+Tab, Enter, Esc)
- ✅ ARIA attributes for screen reader support
- ✅ Prevents accidental dismissal (overlay clicks disabled)
- ✅ Respects `prefers-reduced-motion`
- ✅ Zero accessibility violations (jest-axe tested)

## Installation

The ConfirmDialog is part of `@meaty/ui` and can be imported directly:

```tsx
import { ConfirmDialog } from '@meaty/ui';
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { ConfirmDialog } from '@meaty/ui';

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Perform Action
      </button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        onConfirm={() => {
          // Handle confirmation
          console.log('Action confirmed');
        }}
      />
    </>
  );
}
```

### Destructive Actions

For dangerous actions like permanent deletions:

```tsx
<ConfirmDialog
  open={showDelete}
  onOpenChange={setShowDelete}
  title="Delete Item?"
  description="This action cannot be undone. This will permanently delete the item."
  variant="destructive"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={() => {
    deleteItem();
  }}
/>
```

### Warning for Data Loss

For actions that may result in data loss but aren't permanent:

```tsx
<ConfirmDialog
  open={showDiscard}
  onOpenChange={setShowDiscard}
  title="Discard unsaved changes?"
  description="You have unsaved changes. Are you sure you want to discard them?"
  variant="warning"
  confirmLabel="Discard"
  cancelLabel="Keep Editing"
  onConfirm={() => {
    discardChanges();
    closeModal();
  }}
  onCancel={() => {
    // Optional: Handle explicit cancel
    console.log('User chose to keep editing');
  }}
/>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | Required | Controls the open state of the dialog |
| `onOpenChange` | `(open: boolean) => void` | Required | Callback when the open state changes |
| `title` | `string` | Required | Dialog title text |
| `description` | `string` | Required | Dialog description/message |
| `onConfirm` | `() => void` | Required | Callback when user confirms |
| `variant` | `'default' \| 'destructive' \| 'warning'` | `'default'` | Visual variant for the dialog |
| `confirmLabel` | `string` | `'Confirm'` | Label for the confirm button |
| `cancelLabel` | `string` | `'Cancel'` | Label for the cancel button |
| `onCancel` | `() => void` | Optional | Callback when user cancels |

### Variants

#### `default`
- **Styling**: Primary blue color scheme
- **Use Case**: General confirmations, non-destructive actions
- **Focus**: Cancel button is auto-focused (safer default)
- **Example**: "Publish post?", "Send notification?"

#### `destructive`
- **Styling**: Red/danger color scheme
- **Use Case**: Permanent deletions, actions that cannot be undone
- **Focus**: Confirm button is auto-focused (requires explicit choice)
- **Example**: "Delete account?", "Remove team member?"

#### `warning`
- **Styling**: Yellow/warning color scheme
- **Use Case**: Actions that may result in data loss but aren't permanent
- **Focus**: Confirm button is auto-focused (requires caution)
- **Example**: "Discard changes?", "Revert to previous version?"

## Behavior

### Focus Management

The component automatically manages focus for safety and usability:

- **Default variant**: Cancel button is auto-focused
  - Rationale: Safer default, prevents accidental confirmations

- **Destructive/Warning variants**: Confirm button is auto-focused
  - Rationale: Forces explicit user action, makes the choice more deliberate

Focus returns to the trigger element after the dialog closes.

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate forward between buttons and close (X) |
| `Shift+Tab` | Navigate backward between buttons and close (X) |
| `Enter` | Confirm action (closes dialog) |
| `Escape` | Cancel/close dialog |

**Note**: Modifier keys (Shift, Ctrl, Meta) with Enter are ignored to prevent accidental confirmations.

### Overlay Interactions

By default, clicking the overlay (background) does **not** close the dialog. This prevents accidental dismissal during confirmations.

Users must explicitly:
- Click Cancel button
- Click Close (X) button
- Press Escape key

## Accessibility

### ARIA Support

The component includes proper ARIA attributes:

```html
<div role="dialog"
     aria-labelledby="dialog-title-id"
     aria-describedby="dialog-description-id">
  <h2 id="dialog-title-id">Title</h2>
  <p id="dialog-description-id">Description</p>
</div>
```

### Focus Trap

The dialog implements a focus trap that:
- Keeps keyboard focus within the dialog when open
- Prevents Tab navigation from escaping to background content
- Returns focus to trigger element after close
- Respects natural Tab order (Cancel → Confirm → Close)

### Screen Reader Support

- Dialog announces when opened
- Title and description are properly associated
- Button states are clear and descriptive
- Loading/busy states are announced (future enhancement)

### Motion Preferences

The dialog respects the `prefers-reduced-motion` media query:
- Animations are disabled when user prefers reduced motion
- Dialog appears/disappears instantly without fade/slide effects

## Best Practices

### 1. Use Descriptive Labels

❌ **Don't** use generic labels:
```tsx
confirmLabel="Yes"
cancelLabel="No"
```

✅ **Do** use descriptive labels:
```tsx
confirmLabel="Delete Post"
cancelLabel="Keep Post"
```

### 2. Clear Descriptions

❌ **Don't** be vague:
```tsx
description="Are you sure?"
```

✅ **Do** be specific:
```tsx
description="This will permanently delete your post and all its comments. This action cannot be undone."
```

### 3. Choose the Right Variant

- **Default**: General confirmations (publishing, sending, etc.)
- **Destructive**: Permanent deletions, account actions
- **Warning**: Data loss, discard changes, reverts

### 4. Handle Both Callbacks

While `onCancel` is optional, consider handling it explicitly:

```tsx
<ConfirmDialog
  onConfirm={() => {
    performAction();
    trackEvent('action_confirmed');
  }}
  onCancel={() => {
    trackEvent('action_cancelled');
  }}
/>
```

### 5. Close After Confirmation

The dialog automatically calls `onOpenChange(false)` after confirm/cancel, but ensure your state is updated:

```tsx
const [open, setOpen] = useState(false);

<ConfirmDialog
  open={open}
  onOpenChange={setOpen} // Automatically closes after actions
  onConfirm={() => {
    performAction();
    // Don't need to call setOpen(false) - handled automatically
  }}
/>
```

## Testing

### Unit Tests

The component includes comprehensive unit tests covering:

- ✅ Rendering with all props
- ✅ All three variants
- ✅ User interactions (click confirm/cancel)
- ✅ Keyboard navigation (Enter, Escape, Tab)
- ✅ Focus management for all variants
- ✅ Focus trap behavior
- ✅ Controlled state
- ✅ Edge cases (rapid open/close, long text, etc.)

### Accessibility Tests

All variants pass jest-axe with zero violations:

```tsx
it('has no accessibility violations', async () => {
  const { container } = render(<ConfirmDialog {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Testing in Your App

When testing components that use ConfirmDialog:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('shows confirmation dialog', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  // Trigger the action
  await user.click(screen.getByRole('button', { name: 'Delete' }));

  // Assert dialog appears
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Delete Item?')).toBeInTheDocument();

  // Confirm the action
  await user.click(screen.getByRole('button', { name: 'Delete' }));

  // Assert dialog closes and action executed
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

## Storybook

View all variants and interactive examples in Storybook:

```bash
pnpm --filter @meaty/ui storybook
```

Navigate to: **Components → ConfirmDialog**

Available stories:
- Default
- Destructive
- Warning
- Custom Labels
- Long Description
- Keyboard Navigation Demo
- Focus Management
- Multiple Dialogs
- Accessibility Test
- All Variants Comparison

## Implementation Details

### Built With

- **Radix UI Dialog**: Base dialog primitive
- **@meaty/ui Dialog**: Custom Dialog wrapper
- **@meaty/ui Button**: Consistent button styling
- **Design Tokens**: Uses `@meaty/tokens` for colors and spacing

### Browser Support

Same as Radix UI Dialog:
- Chrome/Edge (modern)
- Firefox (modern)
- Safari 12.1+
- Mobile browsers (iOS Safari, Chrome Android)

### Performance

- Dialog content is lazily rendered (only when `open={true}`)
- Focus trap uses efficient event delegation
- Animations use GPU-accelerated properties (transform, opacity)
- No layout shift during open/close transitions

## Migration from Native confirm()

### Before (Browser Native)

```tsx
function handleDelete() {
  if (confirm('Are you sure you want to delete this item?')) {
    deleteItem();
  }
}
```

### After (ConfirmDialog)

```tsx
const [showConfirm, setShowConfirm] = useState(false);

function handleDelete() {
  setShowConfirm(true);
}

return (
  <>
    <button onClick={handleDelete}>Delete</button>
    <ConfirmDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      title="Delete Item?"
      description="Are you sure you want to delete this item?"
      variant="destructive"
      confirmLabel="Delete"
      onConfirm={() => {
        deleteItem();
      }}
    />
  </>
);
```

## Related Components

- **Dialog**: Base dialog component for custom modals
- **Sheet**: Side panel for non-modal content
- **Alert**: For informational messages (no user action required)

## Support

For issues or questions:
1. Check Storybook examples
2. Review this documentation
3. Check unit tests for usage patterns
4. Consult MP architecture docs

## Changelog

### v1.0.0 (2025-10-18)
- Initial release
- Three variants (default, destructive, warning)
- Full keyboard navigation
- Focus trap and management
- Comprehensive tests and documentation
- Zero accessibility violations
