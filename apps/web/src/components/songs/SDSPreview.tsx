/**
 * SDSPreview Component
 * Enhanced Song Design Spec preview with character counting and download features
 *
 * Features:
 * - Syntax-highlighted JSON display (via JsonViewer)
 * - Character counter for composed prompt
 * - Color-coded limit warnings based on target engine
 * - Copy to clipboard functionality
 * - Download buttons for SDS and composed prompt
 * - Visual feedback for all actions
 *
 * Task: P1.2 - SDS Preview Enhancement
 */

'use client';

import * as React from 'react';
import { Download, Copy, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { cn } from '@/lib/utils';
import { JsonViewer } from '@/components/common/JsonViewer';
import { toast } from 'sonner';

/**
 * Engine limits for character counting
 */
const ENGINE_LIMITS = {
  suno: {
    style_max: 1000,
    prompt_max: 3000,
    title_max: 100,
  },
  udio: {
    style_max: 800,
    prompt_max: 2500,
    title_max: 80,
  },
  default: {
    style_max: 1000,
    prompt_max: 5000,
    title_max: 100,
  },
} as const;

export type EngineType = keyof typeof ENGINE_LIMITS;

/**
 * SDS data structure
 */
export interface SDSData {
  song_id: string;
  title: string;
  global_seed: number;
  composed_prompt?: string;
  style?: Record<string, unknown>;
  lyrics?: Record<string, unknown>;
  persona?: Record<string, unknown>;
  producer_notes?: Record<string, unknown>;
  blueprint?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Component props
 */
export interface SDSPreviewProps {
  /** SDS data to display */
  data: SDSData;
  /** Target rendering engine (affects character limits) */
  targetEngine?: EngineType;
  /** Song title for download filename */
  songTitle?: string;
  /** Additional className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Character counter utility
 */
interface CharacterCountInfo {
  count: number;
  limit: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  statusColor: string;
  statusIcon: React.ReactNode;
}

function getCharacterCountInfo(text: string | undefined, limit: number): CharacterCountInfo {
  const count = text?.length || 0;
  const percentage = (count / limit) * 100;

  let status: CharacterCountInfo['status'] = 'safe';
  let statusColor = 'text-green-500';
  let statusIcon = <CheckCircle className="w-4 h-4" />;

  if (percentage >= 95) {
    status = 'danger';
    statusColor = 'text-red-500';
    statusIcon = <AlertCircle className="w-4 h-4" />;
  } else if (percentage >= 80) {
    status = 'warning';
    statusColor = 'text-yellow-500';
    statusIcon = <AlertTriangle className="w-4 h-4" />;
  }

  return {
    count,
    limit,
    percentage,
    status,
    statusColor,
    statusIcon,
  };
}

/**
 * Download helper
 */
function downloadFile(content: string, filename: string, type: string = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy to clipboard helper
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate filename with timestamp
 */
function generateFilename(songTitle: string, type: 'sds' | 'prompt'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const cleanTitle = songTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const extension = type === 'sds' ? 'json' : 'txt';
  return `${cleanTitle}-${type}-${timestamp}.${extension}`;
}

/**
 * Character Counter Component
 */
const CharacterCounter: React.FC<{
  info: CharacterCountInfo;
  label: string;
  testId?: string;
}> = ({ info, label, testId }) => {
  return (
    <div
      className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-border-default"
      data-testid={testId}
    >
      <div className="flex items-center gap-2">
        <div className={cn(info.statusColor, 'flex-shrink-0')}>
          {info.statusIcon}
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary">{label}</div>
          <div className="text-xs text-text-muted">
            {info.count.toLocaleString()} / {info.limit.toLocaleString()} characters
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn('text-lg font-semibold', info.statusColor)}>
          {info.percentage.toFixed(1)}%
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            info.status === 'safe' && 'border-green-500/30 text-green-500',
            info.status === 'warning' && 'border-yellow-500/30 text-yellow-500',
            info.status === 'danger' && 'border-red-500/30 text-red-500'
          )}
        >
          {info.status.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
};

/**
 * SDSPreview Component
 *
 * Displays Song Design Spec with syntax highlighting, character counter,
 * and download/copy functionality.
 *
 * @example
 * ```tsx
 * <SDSPreview
 *   data={sdsData}
 *   targetEngine="suno"
 *   songTitle="My Song"
 * />
 * ```
 */
export const SDSPreview: React.FC<SDSPreviewProps> = ({
  data,
  targetEngine = 'default',
  songTitle = 'song',
  className,
  testId = 'sds-preview',
}) => {
  const [copyStatus, setCopyStatus] = React.useState<{
    type: 'sds' | 'prompt' | null;
    success: boolean;
  }>({ type: null, success: false });

  // Get engine limits
  const limits = ENGINE_LIMITS[targetEngine];

  // Calculate character count for composed prompt
  const promptInfo = React.useMemo(() => {
    return getCharacterCountInfo(data.composed_prompt, limits.prompt_max);
  }, [data.composed_prompt, limits.prompt_max]);

  // Handle copy SDS
  const handleCopySDS = React.useCallback(async () => {
    const jsonString = JSON.stringify(data, null, 2);
    const success = await copyToClipboard(jsonString);

    if (success) {
      setCopyStatus({ type: 'sds', success: true });
      toast.success('SDS copied to clipboard');
      setTimeout(() => setCopyStatus({ type: null, success: false }), 2000);
    } else {
      toast.error('Failed to copy SDS');
    }
  }, [data]);

  // Handle copy composed prompt
  const handleCopyPrompt = React.useCallback(async () => {
    if (!data.composed_prompt) {
      toast.error('No composed prompt available');
      return;
    }

    const success = await copyToClipboard(data.composed_prompt);

    if (success) {
      setCopyStatus({ type: 'prompt', success: true });
      toast.success('Composed prompt copied to clipboard');
      setTimeout(() => setCopyStatus({ type: null, success: false }), 2000);
    } else {
      toast.error('Failed to copy prompt');
    }
  }, [data.composed_prompt]);

  // Handle download SDS
  const handleDownloadSDS = React.useCallback(() => {
    const jsonString = JSON.stringify(data, null, 2);
    const filename = generateFilename(songTitle, 'sds');
    downloadFile(jsonString, filename, 'application/json');
    toast.success('SDS downloaded');
  }, [data, songTitle]);

  // Handle download composed prompt
  const handleDownloadPrompt = React.useCallback(() => {
    if (!data.composed_prompt) {
      toast.error('No composed prompt available');
      return;
    }

    const filename = generateFilename(songTitle, 'prompt');
    downloadFile(data.composed_prompt, filename, 'text/plain');
    toast.success('Composed prompt downloaded');
  }, [data.composed_prompt, songTitle]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if container or descendant is focused
      const container = document.querySelector(`[data-testid="${testId}"]`);
      if (!container?.contains(document.activeElement)) return;

      // Ctrl/Cmd + C: Copy SDS
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !event.shiftKey) {
        event.preventDefault();
        handleCopySDS();
      }

      // Ctrl/Cmd + Shift + C: Copy prompt
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        handleCopyPrompt();
      }

      // Ctrl/Cmd + S: Download SDS
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleDownloadSDS();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopySDS, handleCopyPrompt, handleDownloadSDS, testId]);

  return (
    <div className={cn('space-y-6', className)} data-testid={testId}>
      {/* Character Counter Section */}
      {data.composed_prompt && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-primary">Composed Prompt</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPrompt}
                disabled={!data.composed_prompt}
                data-testid={`${testId}-copy-prompt`}
              >
                {copyStatus.type === 'prompt' && copyStatus.success ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Prompt
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadPrompt}
                disabled={!data.composed_prompt}
                data-testid={`${testId}-download-prompt`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Character Counter */}
          <CharacterCounter
            info={promptInfo}
            label={`${targetEngine.charAt(0).toUpperCase() + targetEngine.slice(1)} Prompt Limit`}
            testId={`${testId}-char-counter`}
          />

          {/* Warning Messages */}
          {promptInfo.status === 'danger' && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-500">
                  <strong>Prompt exceeds limit!</strong>
                  <p className="mt-1 text-xs text-red-400">
                    The composed prompt is {promptInfo.count - promptInfo.limit} characters over the {targetEngine} limit.
                    You may need to shorten it before rendering.
                  </p>
                </div>
              </div>
            </div>
          )}

          {promptInfo.status === 'warning' && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Approaching limit</strong>
                  <p className="mt-1 text-xs">
                    The composed prompt is using {promptInfo.percentage.toFixed(1)}% of the {targetEngine} character limit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Preview */}
          <div className="mt-4 p-4 bg-bg-elevated rounded-lg border border-border-default max-h-48 overflow-auto">
            <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap break-words">
              {data.composed_prompt}
            </pre>
          </div>
        </Card>
      )}

      {/* Full SDS JSON Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-text-primary">Full SDS JSON</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySDS}
              data-testid={`${testId}-copy-sds`}
            >
              {copyStatus.type === 'sds' && copyStatus.success ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copy JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadSDS}
              data-testid={`${testId}-download-sds`}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* JSON Viewer */}
        <JsonViewer
          data={data}
          collapsed={2}
          theme="dark"
          showLineNumbers={true}
          enableClipboard={false} // We handle copying with our own buttons
          maxHeight="600px"
          testId={`${testId}-json-viewer`}
        />
      </Card>

      {/* SDS Metadata Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Song ID</div>
          <div className="font-mono text-xs truncate">{data.song_id}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Title</div>
          <div className="font-semibold truncate">{data.title}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Global Seed</div>
          <div className="font-mono text-sm">{data.global_seed}</div>
        </Card>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="px-4 py-3 bg-bg-surface rounded-lg border border-border-default">
        <div className="text-xs text-text-muted">
          <strong className="text-text-secondary">Keyboard shortcuts:</strong>
          {' '}
          <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-default font-mono">Ctrl/Cmd+C</kbd>
          {' '}Copy SDS
          {' • '}
          <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-default font-mono">Ctrl/Cmd+Shift+C</kbd>
          {' '}Copy Prompt
          {' • '}
          <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-default font-mono">Ctrl/Cmd+S</kbd>
          {' '}Download SDS
        </div>
      </div>
    </div>
  );
};

SDSPreview.displayName = 'SDSPreview';

export default SDSPreview;
