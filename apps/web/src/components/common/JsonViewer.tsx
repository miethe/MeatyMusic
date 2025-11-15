/**
 * JsonViewer Component
 * Reusable JSON viewer with syntax highlighting and collapsible sections
 *
 * Features:
 * - Syntax highlighting with customizable theme
 * - Collapsible objects and arrays
 * - Optional line numbers
 * - Copy to clipboard functionality
 * - Keyboard navigation support
 * - Dark theme optimized for MeatyMusic
 *
 * Task SDS-PREVIEW-010
 */

'use client';

import * as React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Button } from '@meatymusic/ui';
import { toast } from 'sonner';

/**
 * JsonViewer Props
 */
export interface JsonViewerProps {
  /** Data to display as JSON */
  data: object;
  /** Collapsed state: true = all collapsed, false = all expanded, number = depth to collapse at */
  collapsed?: boolean | number;
  /** Theme: 'light' or 'dark' */
  theme?: 'light' | 'dark';
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Enable copy to clipboard button */
  enableClipboard?: boolean;
  /** Additional className */
  className?: string;
  /** Max height for scrolling */
  maxHeight?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Copy text to clipboard
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Custom theme for MeatyMusic dark mode
 */
const meatyMusicTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: '#1a1a2e', // bg-elevated from tailwind config
    margin: 0,
    padding: '1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    fontFamily: 'JetBrains Mono, monospace',
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: 'JetBrains Mono, monospace',
  },
  'property': {
    color: '#8b5cf6', // Purple for keys
  },
  'string': {
    color: '#22c55e', // Green for strings
  },
  'number': {
    color: '#f97316', // Orange for numbers
  },
  'boolean': {
    color: '#eab308', // Yellow for booleans
  },
  'null': {
    color: '#6b7280', // Gray for null
  },
};

/**
 * Recursively collapse JSON objects/arrays at specified depth
 */
const collapseJson = (obj: unknown, depth: number, currentDepth: number = 0): unknown => {
  if (currentDepth >= depth) {
    if (Array.isArray(obj)) {
      return obj.length > 0 ? `[${obj.length} items]` : '[]';
    } else if (obj !== null && typeof obj === 'object') {
      const keys = Object.keys(obj);
      return keys.length > 0 ? `{${keys.length} keys}` : '{}';
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => collapseJson(item, depth, currentDepth + 1));
  } else if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = collapseJson(value, depth, currentDepth + 1);
    }
    return result;
  }

  return obj;
};

/**
 * CollapsibleJsonViewer - Internal component with collapse/expand functionality
 */
const CollapsibleJsonViewer: React.FC<{
  data: object;
  initialCollapsed: boolean | number;
  theme: 'light' | 'dark';
  showLineNumbers: boolean;
  maxHeight?: string;
  testId?: string;
}> = ({ data, initialCollapsed, theme, showLineNumbers, maxHeight, testId }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(initialCollapsed === true);
  const [collapsedDepth, setCollapsedDepth] = React.useState(
    typeof initialCollapsed === 'number' ? initialCollapsed : 999
  );

  // Determine what to display based on collapsed state
  const displayData = React.useMemo(() => {
    if (isCollapsed) {
      return collapseJson(data, 0);
    } else if (typeof initialCollapsed === 'number') {
      return collapseJson(data, collapsedDepth);
    }
    return data;
  }, [data, isCollapsed, collapsedDepth, initialCollapsed]);

  const jsonString = React.useMemo(() => {
    return JSON.stringify(displayData, null, 2);
  }, [displayData]);

  const customStyle = theme === 'dark' ? meatyMusicTheme : undefined;

  return (
    <div data-testid={testId ? `${testId}-collapsible` : undefined}>
      {typeof initialCollapsed !== 'undefined' && (
        <div className="mb-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCollapsed(!isCollapsed)}
            data-testid={testId ? `${testId}-toggle` : undefined}
            aria-label={isCollapsed ? 'Expand all' : 'Collapse all'}
          >
            {isCollapsed ? 'Expand All' : 'Collapse All'}
          </Button>
          {typeof initialCollapsed === 'number' && !isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Depth:</span>
              <input
                type="number"
                min="0"
                max="10"
                value={collapsedDepth}
                onChange={(e) => setCollapsedDepth(parseInt(e.target.value, 10) || 0)}
                className="w-16 px-2 py-1 text-sm rounded border border-border-default bg-bg-surface text-text-primary"
                data-testid={testId ? `${testId}-depth-input` : undefined}
                aria-label="Collapse depth"
              />
            </div>
          )}
        </div>
      )}
      <div
        className="overflow-auto rounded-lg"
        style={{ maxHeight: maxHeight || '600px' }}
        data-testid={testId ? `${testId}-content` : undefined}
      >
        <SyntaxHighlighter
          language="json"
          style={customStyle}
          showLineNumbers={showLineNumbers}
          wrapLines
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
          }}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: '#6b7280',
            userSelect: 'none',
          }}
        >
          {jsonString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

/**
 * JsonViewer Component
 *
 * Displays JSON data with syntax highlighting, optional collapsing, line numbers,
 * and copy to clipboard functionality.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <JsonViewer data={myJsonObject} />
 *
 * // With all features
 * <JsonViewer
 *   data={sdsData}
 *   collapsed={2}
 *   theme="dark"
 *   showLineNumbers={true}
 *   enableClipboard={true}
 *   maxHeight="400px"
 * />
 * ```
 */
export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  collapsed = false,
  theme = 'dark',
  showLineNumbers = true,
  enableClipboard = true,
  className,
  maxHeight,
  testId = 'json-viewer',
}) => {
  const handleCopy = React.useCallback(async () => {
    const jsonString = JSON.stringify(data, null, 2);
    const success = await copyToClipboard(jsonString);

    if (success) {
      toast.success('JSON copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  }, [data]);

  // Keyboard shortcut: Ctrl/Cmd + C to copy
  React.useEffect(() => {
    if (!enableClipboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        // Only trigger if the JsonViewer is focused or a descendant is focused
        const container = document.querySelector(`[data-testid="${testId}"]`);
        if (container?.contains(document.activeElement)) {
          event.preventDefault();
          handleCopy();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableClipboard, handleCopy, testId]);

  return (
    <div
      className={cn(
        'relative rounded-lg border border-border-default',
        theme === 'dark' ? 'bg-bg-elevated' : 'bg-white',
        className
      )}
      data-testid={testId}
      tabIndex={0}
      role="region"
      aria-label="JSON viewer"
    >
      {/* Header with Copy Button */}
      {enableClipboard && (
        <div className="flex items-center justify-between p-3 border-b border-border-default">
          <span className="text-sm font-medium text-text-secondary">JSON</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            data-testid={`${testId}-copy-button`}
            aria-label="Copy JSON to clipboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </Button>
        </div>
      )}

      {/* JSON Content */}
      <div className="p-3">
        <CollapsibleJsonViewer
          data={data}
          initialCollapsed={collapsed}
          theme={theme}
          showLineNumbers={showLineNumbers}
          maxHeight={maxHeight}
          testId={testId}
        />
      </div>

      {/* Keyboard Hint */}
      {enableClipboard && (
        <div className="px-3 py-2 text-xs text-text-muted border-t border-border-default">
          Press <kbd className="px-1 py-0.5 rounded bg-bg-surface border border-border-default font-mono">Ctrl</kbd>
          {' + '}
          <kbd className="px-1 py-0.5 rounded bg-bg-surface border border-border-default font-mono">C</kbd>
          {' to copy'}
        </div>
      )}
    </div>
  );
};

JsonViewer.displayName = 'JsonViewer';

/**
 * Default export
 */
export default JsonViewer;
