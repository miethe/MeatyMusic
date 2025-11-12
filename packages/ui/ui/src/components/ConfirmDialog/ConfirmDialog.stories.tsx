import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '../Button';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A confirmation dialog component that replaces browser native confirm(). Features focus trap, keyboard navigation, and three visual variants for different use cases.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default variant - Standard confirmation dialog with primary blue styling.
 * Use for general confirmations where the action is not destructive.
 */
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [lastAction, setLastAction] = useState<string>('');

    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Open Confirmation</Button>
        {lastAction && (
          <p className="text-sm text-text-muted">Last action: {lastAction}</p>
        )}
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Confirm Action"
          description="Are you sure you want to proceed with this action?"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          variant="default"
          onConfirm={() => {
            setLastAction('Confirmed');
            console.log('Action confirmed');
          }}
          onCancel={() => {
            setLastAction('Cancelled');
            console.log('Action cancelled');
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Default variant with primary blue styling. Cancel button is auto-focused for safety.',
      },
    },
  },
};

/**
 * Destructive variant - Red/danger styling for dangerous actions.
 * Use when confirming actions that permanently delete data or cannot be undone.
 */
export const Destructive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [deleted, setDeleted] = useState(false);

    return (
      <div className="space-y-4">
        <Button
          variant="destructive"
          onClick={() => setOpen(true)}
          disabled={deleted}
        >
          {deleted ? 'Item Deleted' : 'Delete Item'}
        </Button>
        {deleted && (
          <p className="text-sm text-mp-danger">Item has been permanently deleted</p>
        )}
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete Item?"
          description="This action cannot be undone. This will permanently delete the item and remove it from our servers."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={() => {
            setDeleted(true);
            console.log('Item deleted');
          }}
          onCancel={() => {
            console.log('Deletion cancelled');
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Destructive variant with red/danger styling. Confirm button is auto-focused to indicate the primary dangerous action.',
      },
    },
  },
};

/**
 * Warning variant - Yellow/warning styling for actions requiring caution.
 * Use when confirming actions that may have unwanted side effects but aren't destructive.
 */
export const Warning: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [discarded, setDiscarded] = useState(false);

    return (
      <div className="space-y-4">
        <Button
          variant="warning"
          onClick={() => setOpen(true)}
          disabled={discarded}
        >
          {discarded ? 'Changes Discarded' : 'Discard Changes'}
        </Button>
        {discarded && (
          <p className="text-sm text-mp-warning">Unsaved changes have been discarded</p>
        )}
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Discard unsaved changes?"
          description="You have unsaved changes. Are you sure you want to discard them?"
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          variant="warning"
          onConfirm={() => {
            setDiscarded(true);
            console.log('Changes discarded');
          }}
          onCancel={() => {
            console.log('Continue editing');
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning variant with yellow/warning styling. Confirm button is auto-focused to indicate the cautionary action.',
      },
    },
  },
};

/**
 * Custom Labels - Demonstrates customizable action button labels.
 * Use descriptive labels that clearly communicate the action being confirmed.
 */
export const CustomLabels: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [published, setPublished] = useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)} disabled={published}>
          {published ? 'Published' : 'Publish Post'}
        </Button>
        {published && (
          <p className="text-sm text-mp-success">Post has been published</p>
        )}
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Ready to publish?"
          description="Your post will be visible to all users immediately. You can unpublish it later if needed."
          confirmLabel="Publish Now"
          cancelLabel="Review Again"
          variant="default"
          onConfirm={() => {
            setPublished(true);
            console.log('Post published');
          }}
          onCancel={() => {
            console.log('Back to editing');
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom button labels that clearly describe the action. Use descriptive labels instead of generic "OK" or "Yes".',
      },
    },
  },
};

/**
 * Long Description - Handles longer confirmation messages gracefully.
 */
export const LongDescription: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>
          Revoke Access
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Revoke team access?"
          description="Revoking access will immediately remove this team member's ability to view or edit projects. They will no longer receive notifications and any pending invitations will be cancelled. This action can be reversed by re-inviting the team member, but their previous permissions will need to be reconfigured."
          confirmLabel="Revoke Access"
          cancelLabel="Keep Access"
          variant="destructive"
          onConfirm={() => {
            console.log('Access revoked');
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Handles longer descriptions with proper text wrapping and spacing.',
      },
    },
  },
};

/**
 * Keyboard Navigation Demo - Demonstrates keyboard interaction support.
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [lastKey, setLastKey] = useState<string>('');

    return (
      <div className="space-y-4">
        <div className="p-4 bg-panel rounded-md mb-4">
          <h3 className="font-semibold mb-2 text-sm">Keyboard Navigation:</h3>
          <ul className="text-sm space-y-1 text-text-muted">
            <li>• <kbd className="px-2 py-1 bg-surface border rounded text-xs">Tab</kbd> - Navigate between buttons</li>
            <li>• <kbd className="px-2 py-1 bg-surface border rounded text-xs">Shift+Tab</kbd> - Navigate backwards</li>
            <li>• <kbd className="px-2 py-1 bg-surface border rounded text-xs">Enter</kbd> - Confirm action</li>
            <li>• <kbd className="px-2 py-1 bg-surface border rounded text-xs">Esc</kbd> - Cancel/close</li>
          </ul>
        </div>
        <Button onClick={() => setOpen(true)}>
          Test Keyboard Navigation
        </Button>
        {lastKey && (
          <p className="text-sm text-text-muted">Last interaction: {lastKey}</p>
        )}
        <ConfirmDialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen && !lastKey.includes('Confirmed') && !lastKey.includes('Cancelled')) {
              setLastKey('Closed via Escape or overlay');
            }
          }}
          title="Test Keyboard Navigation"
          description="Try using Tab, Shift+Tab, Enter, and Escape keys to navigate and interact with this dialog."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          variant="default"
          onConfirm={() => {
            setLastKey('Confirmed via Enter or Click');
            console.log('Confirmed');
          }}
          onCancel={() => {
            setLastKey('Cancelled via Click');
            console.log('Cancelled');
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo of keyboard navigation. Try Tab, Shift+Tab, Enter (confirm), and Escape (cancel).',
      },
    },
  },
};

/**
 * Focus Management - Demonstrates automatic focus behavior.
 */
export const FocusManagement: Story = {
  render: () => {
    const [openDefault, setOpenDefault] = useState(false);
    const [openDestructive, setOpenDestructive] = useState(false);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-panel rounded-md mb-4">
          <h3 className="font-semibold mb-2 text-sm">Auto-Focus Behavior:</h3>
          <ul className="text-sm space-y-1 text-text-muted">
            <li>• <strong>Default variant:</strong> Cancel button is focused (safer default)</li>
            <li>• <strong>Destructive/Warning:</strong> Confirm button is focused (explicit action required)</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setOpenDefault(true)}>
            Default (Focus Cancel)
          </Button>
          <Button variant="destructive" onClick={() => setOpenDestructive(true)}>
            Destructive (Focus Confirm)
          </Button>
        </div>

        <ConfirmDialog
          open={openDefault}
          onOpenChange={setOpenDefault}
          title="Default Focus"
          description="The Cancel button is automatically focused for safety in default confirmations."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          variant="default"
          onConfirm={() => console.log('Default confirmed')}
        />

        <ConfirmDialog
          open={openDestructive}
          onOpenChange={setOpenDestructive}
          title="Destructive Focus"
          description="The Confirm button is automatically focused for destructive actions to make the user explicitly choose."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={() => console.log('Delete confirmed')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates different auto-focus behaviors based on variant. Default focuses Cancel, Destructive/Warning focus Confirm.',
      },
    },
  },
};

/**
 * Multiple Dialogs - Shows handling of multiple confirmation flows.
 */
export const MultipleDialogs: Story = {
  render: () => {
    const [openFirst, setOpenFirst] = useState(false);
    const [openSecond, setOpenSecond] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => setOpenFirst(true)}>
            First Confirmation
          </Button>
          <Button variant="destructive" onClick={() => setOpenSecond(true)}>
            Second Confirmation
          </Button>
        </div>

        <ConfirmDialog
          open={openFirst}
          onOpenChange={setOpenFirst}
          title="First Confirmation"
          description="This is the first confirmation dialog."
          confirmLabel="Proceed"
          cancelLabel="Cancel"
          variant="default"
          onConfirm={() => console.log('First confirmed')}
        />

        <ConfirmDialog
          open={openSecond}
          onOpenChange={setOpenSecond}
          title="Second Confirmation"
          description="This is a separate confirmation dialog that can be open independently."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={() => console.log('Second confirmed')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates multiple independent confirmation dialogs in the same component.',
      },
    },
  },
};

/**
 * Accessibility Test - Dialog with full ARIA support for screen readers.
 */
export const AccessibilityTest: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-panel rounded-md mb-4">
          <h3 className="font-semibold mb-2 text-sm">Accessibility Features:</h3>
          <ul className="text-sm space-y-1 text-text-muted">
            <li>• Focus trap keeps keyboard navigation within dialog</li>
            <li>• Proper ARIA labels (aria-labelledby, aria-describedby)</li>
            <li>• Screen reader announcements for dialog state</li>
            <li>• Focus returns to trigger element after close</li>
            <li>• Respects prefers-reduced-motion</li>
          </ul>
        </div>
        <Button onClick={() => setOpen(true)}>
          Test Accessibility
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Accessible Confirmation"
          description="This dialog has full ARIA support and proper focus management for screen reader users and keyboard navigation."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          variant="default"
          onConfirm={() => console.log('Accessible confirmation')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with full accessibility support including focus trap, ARIA labels, and keyboard navigation.',
      },
    },
  },
};

/**
 * All Variants Comparison - Side-by-side comparison of all three variants.
 */
export const AllVariants: Story = {
  render: () => {
    const [openDefault, setOpenDefault] = useState(false);
    const [openDestructive, setOpenDestructive] = useState(false);
    const [openWarning, setOpenWarning] = useState(false);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-panel rounded-md mb-4">
          <h3 className="font-semibold mb-2">Variant Guide</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong className="text-primary">Default:</strong>
              <span className="text-text-muted ml-2">General confirmations, non-destructive actions</span>
            </div>
            <div>
              <strong className="text-mp-danger">Destructive:</strong>
              <span className="text-text-muted ml-2">Permanent deletions, cannot be undone</span>
            </div>
            <div>
              <strong className="text-mp-warning">Warning:</strong>
              <span className="text-text-muted ml-2">Potential data loss, requires caution</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpenDefault(true)}>
            Default
          </Button>
          <Button variant="destructive" onClick={() => setOpenDestructive(true)}>
            Destructive
          </Button>
          <Button variant="warning" onClick={() => setOpenWarning(true)}>
            Warning
          </Button>
        </div>

        <ConfirmDialog
          open={openDefault}
          onOpenChange={setOpenDefault}
          title="Default Confirmation"
          description="Use the default variant for general confirmations where the action is not destructive."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          variant="default"
          onConfirm={() => console.log('Default confirmed')}
        />

        <ConfirmDialog
          open={openDestructive}
          onOpenChange={setOpenDestructive}
          title="Delete Permanently?"
          description="Use the destructive variant for actions that permanently delete data or cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={() => console.log('Destructive confirmed')}
        />

        <ConfirmDialog
          open={openWarning}
          onOpenChange={setOpenWarning}
          title="Discard Changes?"
          description="Use the warning variant for actions that may result in data loss but aren't permanent deletions."
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          variant="warning"
          onConfirm={() => console.log('Warning confirmed')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all three variants with usage guidelines.',
      },
    },
  },
};
