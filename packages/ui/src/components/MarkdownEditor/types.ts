/**
 * MarkdownEditor Component Types
 *
 * Type definitions for the MarkdownEditor component following MP architecture patterns.
 */

import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';

/**
 * Layout modes for the MarkdownEditor
 * - split: Editor and preview side-by-side (default)
 * - editor: Editor only
 * - preview: Preview only
 */
export type MarkdownEditorLayout = 'split' | 'editor' | 'preview';

/**
 * Format type for toolbar buttons
 */
export type FormatType = 'bold' | 'italic' | 'heading' | 'link' | 'code' | 'ol' | 'ul';

/**
 * Props for the MarkdownEditor component
 */
export interface MarkdownEditorProps {
  /** Current markdown value */
  value: string;

  /** Change handler called on every edit */
  onChange: (value: string) => void;

  /** Save callback triggered by Cmd+S or autosave */
  onSave?: (value: string) => void;

  /** Placeholder text for empty editor */
  placeholder?: string;

  /** Read-only mode */
  readOnly?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Auto-focus the editor on mount */
  autoFocus?: boolean;

  /** Minimum height of the editor (default: '400px') */
  minHeight?: string;

  /** Enable autosave (default: true) */
  autosave?: boolean;

  /** Autosave delay in milliseconds (default: 1500) */
  autosaveDelay?: number;

  /** Layout mode (default: 'split') */
  layout?: MarkdownEditorLayout;

  /** Show formatting toolbar (default: true) */
  showToolbar?: boolean;

  /** ARIA label for accessibility */
  ariaLabel?: string;

  /** Whether the editor is in a dirty state (externally controlled) */
  isDirty?: boolean;

  /** Callback when dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Props for the MarkdownToolbar component
 */
export interface MarkdownToolbarProps {
  /** CodeMirror editor reference */
  editorRef: React.RefObject<ReactCodeMirrorRef>;

  /** Whether the editor is in a dirty state */
  isDirty: boolean;

  /** Whether the editor is read-only */
  readOnly?: boolean;

  /** Current layout mode */
  layout: MarkdownEditorLayout;

  /** Layout mode change handler */
  onLayoutChange: (layout: MarkdownEditorLayout) => void;
}

/**
 * Props for the MarkdownPreview component
 */
export interface MarkdownPreviewProps {
  /** Markdown content to render */
  value: string;

  /** Minimum height of the preview (default: '400px') */
  minHeight?: string;

  /** Additional CSS classes */
  className?: string;

  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * Format action for applying markdown syntax
 */
export interface FormatAction {
  /** Type of format to apply */
  type: FormatType;

  /** Text to insert before selection */
  before: string;

  /** Text to insert after selection */
  after: string;

  /** Label for the button */
  label: string;

  /** ARIA label for accessibility */
  ariaLabel: string;

  /** Icon or text to display in the button */
  icon: React.ReactNode;

  /** Keyboard shortcut (for display only) */
  shortcut?: string;
}
