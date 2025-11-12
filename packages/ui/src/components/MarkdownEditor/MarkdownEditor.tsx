/**
 * MarkdownEditor Component
 *
 * Rich markdown editor with split-view layout, live preview, formatting toolbar,
 * autosave, and keyboard shortcuts. Built on CodeMirror 6 with full accessibility.
 *
 * Features:
 * - Split-view layout (editor + preview)
 * - CodeMirror 6 with markdown syntax highlighting
 * - Live preview with GitHub Flavored Markdown
 * - Formatting toolbar (Bold, Italic, Heading, Link, Code, Lists)
 * - Autosave with 1.5s debounce
 * - Keyboard shortcuts (Cmd+S, Cmd+/, Esc)
 * - Dirty state tracking
 * - Responsive (stacks vertically on mobile)
 * - WCAG 2.1 AA compliant
 */

import * as React from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { cn } from '../../lib/utils';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import type { MarkdownEditorProps, MarkdownEditorLayout } from './types';

export const MarkdownEditor = React.forwardRef<ReactCodeMirrorRef, MarkdownEditorProps>(
  (
    {
      value,
      onChange,
      onSave,
      placeholder = 'Enter your markdown here...',
      readOnly = false,
      className,
      autoFocus = false,
      minHeight = '400px',
      autosave = true,
      autosaveDelay = 1500,
      layout: layoutProp = 'split',
      showToolbar = true,
      ariaLabel = 'Markdown editor',
      isDirty: externalIsDirty,
      onDirtyChange,
    },
    ref
  ) => {
    const editorRef = React.useRef<ReactCodeMirrorRef>(null);
    const [layout, setLayout] = React.useState<MarkdownEditorLayout>(layoutProp);
    const [internalIsDirty, setInternalIsDirty] = React.useState(false);
    const autosaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialValueRef = React.useRef(value);

    // Use external dirty state if provided, otherwise use internal
    const isDirty = externalIsDirty !== undefined ? externalIsDirty : internalIsDirty;

    // Sync layout prop changes
    React.useEffect(() => {
      setLayout(layoutProp);
    }, [layoutProp]);

    // Expose editor ref to parent
    React.useImperativeHandle(ref, () => editorRef.current as ReactCodeMirrorRef);

    /**
     * Save handler (called by Cmd+S or autosave)
     */
    const handleSave = React.useCallback(() => {
      if (onSave) {
        onSave(value);
      }
      setInternalIsDirty(false);
      if (onDirtyChange) {
        onDirtyChange(false);
      }
    }, [value, onSave, onDirtyChange]);

    /**
     * Handle value changes with autosave
     */
    const handleChange = React.useCallback(
      (newValue: string) => {
        onChange(newValue);

        // Mark as dirty if value changed from initial
        const nowDirty = newValue !== initialValueRef.current;
        if (nowDirty !== internalIsDirty) {
          setInternalIsDirty(nowDirty);
          if (onDirtyChange) {
            onDirtyChange(nowDirty);
          }
        }

        // Clear existing autosave timeout
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
        }

        // Schedule autosave if enabled
        if (autosave && onSave && nowDirty) {
          autosaveTimeoutRef.current = setTimeout(() => {
            handleSave();
          }, autosaveDelay);
        }
      },
      [onChange, onSave, autosave, autosaveDelay, handleSave, internalIsDirty, onDirtyChange]
    );

    /**
     * Keyboard shortcuts handler
     */
    const handleKeyDown = React.useCallback(
      (e: KeyboardEvent) => {
        // Cmd+S / Ctrl+S: Save
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }

        // Cmd+/ : Toggle layout
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
          e.preventDefault();
          const nextLayout: MarkdownEditorLayout =
            layout === 'split' ? 'editor' : layout === 'editor' ? 'preview' : 'split';
          setLayout(nextLayout);
        }

        // Esc: Blur editor
        if (e.key === 'Escape') {
          const target = e.target as HTMLElement;
          if (target.classList.contains('cm-content')) {
            target.blur();
          }
        }
      },
      [handleSave, layout]
    );

    /**
     * Register keyboard shortcuts
     */
    React.useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    /**
     * Cleanup autosave timeout on unmount
     */
    React.useEffect(() => {
      return () => {
        if (autosaveTimeoutRef.current) {
          clearTimeout(autosaveTimeoutRef.current);
        }
      };
    }, []);

    const showEditor = layout === 'split' || layout === 'editor';
    const showPreview = layout === 'split' || layout === 'preview';

    return (
      <div
        className={cn(
          'flex flex-col border border-[var(--mp-color-border)] rounded-md overflow-hidden',
          'bg-[var(--mp-color-surface)] shadow-sm',
          className
        )}
        role="group"
        aria-label={ariaLabel}
      >
        {/* Toolbar */}
        {showToolbar && (
          <MarkdownToolbar
            editorRef={editorRef}
            isDirty={isDirty}
            readOnly={readOnly}
            layout={layout}
            onLayoutChange={setLayout}
          />
        )}

        {/* Editor and Preview Panes */}
        <div
          className={cn(
            'flex',
            layout === 'split' ? 'flex-row' : 'flex-col',
            // Responsive: stack vertically on mobile
            'max-sm:flex-col'
          )}
        >
          {/* Editor Pane */}
          {showEditor && (
            <div
              className={cn(
                'flex-1',
                layout === 'split' && 'border-r border-[var(--mp-color-border)]',
                'max-sm:border-r-0 max-sm:border-b max-sm:border-[var(--mp-color-border)]'
              )}
              aria-label="Editor pane"
            >
              <CodeMirror
                ref={editorRef}
                value={value}
                height={minHeight}
                extensions={[markdown()]}
                onChange={handleChange}
                placeholder={placeholder}
                readOnly={readOnly}
                autoFocus={autoFocus}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightActiveLine: true,
                  foldGutter: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  crosshairCursor: true,
                  highlightSelectionMatches: true,
                  closeBracketsKeymap: true,
                  searchKeymap: true,
                  foldKeymap: true,
                  completionKeymap: true,
                  lintKeymap: true,
                }}
                className={cn(
                  '[&_.cm-editor]:bg-[var(--mp-color-surface)]',
                  '[&_.cm-content]:text-[var(--mp-color-text-base)]',
                  '[&_.cm-gutters]:bg-[var(--mp-color-panel)]',
                  '[&_.cm-gutters]:border-r-[var(--mp-color-border)]',
                  '[&_.cm-activeLineGutter]:bg-[var(--mp-color-primary)]/10',
                  '[&_.cm-activeLine]:bg-[var(--mp-color-primary)]/5',
                  '[&_.cm-cursor]:border-l-[var(--mp-color-primary)]',
                  '[&_.cm-selectionBackground]:bg-[var(--mp-color-primary)]/20',
                  '[&_.cm-focused]:outline-none',
                  '[&_.cm-focused]:ring-2',
                  '[&_.cm-focused]:ring-[var(--mp-color-ring)]',
                  '[&_.cm-focused]:ring-inset'
                )}
              />
            </div>
          )}

          {/* Preview Pane */}
          {showPreview && (
            <div
              className={cn('flex-1', layout === 'preview' && 'w-full')}
              aria-label="Preview pane"
            >
              <MarkdownPreview value={value} minHeight={minHeight} />
            </div>
          )}
        </div>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';
