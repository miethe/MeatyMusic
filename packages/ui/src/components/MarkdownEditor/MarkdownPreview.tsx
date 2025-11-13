/**
 * MarkdownPreview Component
 *
 * Live preview pane that renders markdown content with GFM support.
 * Uses react-markdown with rehype-sanitize for security.
 */

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '../../lib/utils';
import type { MarkdownPreviewProps } from './types';

export const MarkdownPreview = React.forwardRef<HTMLDivElement, MarkdownPreviewProps>(
  ({ value, minHeight = '400px', className, ariaLabel = 'Markdown preview' }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-auto p-4 bg-[var(--mp-color-surface)] border border-[var(--mp-color-border)]',
          'prose prose-sm max-w-none',
          'prose-headings:text-[var(--mp-color-text-strong)]',
          'prose-p:text-[var(--mp-color-text-base)]',
          'prose-a:text-[var(--mp-color-primary)] prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-[var(--mp-color-text-strong)] prose-strong:font-semibold',
          'prose-code:text-[var(--mp-color-text-base)] prose-code:bg-[var(--mp-color-panel)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
          'prose-pre:bg-[var(--mp-color-panel)] prose-pre:border prose-pre:border-[var(--mp-color-border)]',
          'prose-blockquote:border-l-[var(--mp-color-primary)] prose-blockquote:text-[var(--mp-color-text-muted)]',
          'prose-ul:text-[var(--mp-color-text-base)] prose-ol:text-[var(--mp-color-text-base)]',
          'prose-li:text-[var(--mp-color-text-base)]',
          className
        )}
        style={{ minHeight }}
        aria-label={ariaLabel}
        aria-live="polite"
        aria-atomic="false"
      >
        {value.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {value}
          </ReactMarkdown>
        ) : (
          <div className="text-[var(--mp-color-text-muted)] italic">
            Nothing to preview yet...
          </div>
        )}
      </div>
    );
  }
);

MarkdownPreview.displayName = 'MarkdownPreview';
