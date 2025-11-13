/**
 * MarkdownToolbar Component
 *
 * Formatting toolbar with buttons for applying markdown syntax.
 * Follows @meaty/ui button patterns with proper accessibility.
 */

import * as React from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Link,
  Code,
  List,
  ListOrdered,
  Eye,
  EyeOff,
  Edit3,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button/Button';
import type { MarkdownToolbarProps, FormatAction, MarkdownEditorLayout } from './types';

/**
 * Format actions configuration
 */
const formatActions: FormatAction[] = [
  {
    type: 'bold',
    before: '**',
    after: '**',
    label: 'Bold',
    ariaLabel: 'Bold (Cmd+B)',
    icon: <Bold className="h-4 w-4" />,
    shortcut: 'Cmd+B',
  },
  {
    type: 'italic',
    before: '*',
    after: '*',
    label: 'Italic',
    ariaLabel: 'Italic (Cmd+I)',
    icon: <Italic className="h-4 w-4" />,
    shortcut: 'Cmd+I',
  },
  {
    type: 'heading',
    before: '# ',
    after: '',
    label: 'Heading',
    ariaLabel: 'Heading',
    icon: <Heading1 className="h-4 w-4" />,
  },
  {
    type: 'link',
    before: '[',
    after: '](url)',
    label: 'Link',
    ariaLabel: 'Link (Cmd+K)',
    icon: <Link className="h-4 w-4" />,
    shortcut: 'Cmd+K',
  },
  {
    type: 'code',
    before: '`',
    after: '`',
    label: 'Code',
    ariaLabel: 'Inline code',
    icon: <Code className="h-4 w-4" />,
  },
  {
    type: 'ul',
    before: '- ',
    after: '',
    label: 'Bullet List',
    ariaLabel: 'Bullet list',
    icon: <List className="h-4 w-4" />,
  },
  {
    type: 'ol',
    before: '1. ',
    after: '',
    label: 'Numbered List',
    ariaLabel: 'Numbered list',
    icon: <ListOrdered className="h-4 w-4" />,
  },
];

/**
 * Apply markdown formatting to the current selection in CodeMirror
 */
const applyFormat = (
  editorRef: React.RefObject<any>,
  before: string,
  after: string
): void => {
  const view = editorRef.current?.view;
  if (!view) return;

  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);

  view.dispatch({
    changes: { from, to, insert: `${before}${selected}${after}` },
    selection: {
      anchor: from + before.length,
      head: from + before.length + selected.length,
    },
  });

  view.focus();
};

/**
 * Get icon for layout toggle button
 */
const getLayoutIcon = (layout: MarkdownEditorLayout): React.ReactNode => {
  switch (layout) {
    case 'split':
      return <Eye className="h-4 w-4" />;
    case 'editor':
      return <Edit3 className="h-4 w-4" />;
    case 'preview':
      return <EyeOff className="h-4 w-4" />;
  }
};

/**
 * Get next layout mode for toggle button
 */
const getNextLayout = (current: MarkdownEditorLayout): MarkdownEditorLayout => {
  switch (current) {
    case 'split':
      return 'editor';
    case 'editor':
      return 'preview';
    case 'preview':
      return 'split';
  }
};

/**
 * Get label for layout toggle button
 */
const getLayoutLabel = (layout: MarkdownEditorLayout): string => {
  switch (layout) {
    case 'split':
      return 'Split view';
    case 'editor':
      return 'Editor only';
    case 'preview':
      return 'Preview only';
  }
};

export const MarkdownToolbar = React.forwardRef<HTMLDivElement, MarkdownToolbarProps>(
  ({ editorRef, isDirty, readOnly = false, layout, onLayoutChange }, ref) => {
    const handleFormatClick = React.useCallback(
      (action: FormatAction) => {
        applyFormat(editorRef, action.before, action.after);
      },
      [editorRef]
    );

    const handleLayoutToggle = React.useCallback(() => {
      const next = getNextLayout(layout);
      onLayoutChange(next);
    }, [layout, onLayoutChange]);

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1 p-2 bg-[var(--mp-color-panel)] border-b border-[var(--mp-color-border)]',
          'transition-colors duration-[var(--mp-motion-duration-ui)]'
        )}
        role="toolbar"
        aria-label="Markdown formatting toolbar"
      >
        {/* Format buttons */}
        <div className="flex items-center gap-1">
          {formatActions.map((action) => (
            <Button
              key={action.type}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleFormatClick(action)}
              disabled={readOnly}
              aria-label={action.ariaLabel}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
              className="h-8 w-8"
            >
              {action.icon}
            </Button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-[var(--mp-color-border)] mx-1" role="separator" />

        {/* Layout toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleLayoutToggle}
          aria-label={`Toggle layout: ${getLayoutLabel(layout)}`}
          title={`Current: ${getLayoutLabel(layout)} (Cmd+/)`}
          className="h-8 w-8"
        >
          {getLayoutIcon(layout)}
        </Button>

        {/* Dirty state indicator */}
        <div className="ml-auto flex items-center gap-2">
          {isDirty ? (
            <span className="text-xs text-[var(--mp-color-text-muted)] flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--mp-color-warning)]" />
              Unsaved changes
            </span>
          ) : (
            <span className="text-xs text-[var(--mp-color-text-muted)] flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--mp-color-success)]" />
              Saved
            </span>
          )}
        </div>
      </div>
    );
  }
);

MarkdownToolbar.displayName = 'MarkdownToolbar';
