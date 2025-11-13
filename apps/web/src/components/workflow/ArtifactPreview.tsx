/**
 * ArtifactPreview Component
 * Preview generated workflow artifacts
 *
 * Displays lyrics, style specs, producer notes, and other generated outputs.
 * Supports copy and download functionality.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Tabs } from '@meatymusic/ui';

export interface ArtifactData {
  lyrics?: {
    sections: Array<{
      type: string;
      lines: string[];
    }>;
  };
  style?: Record<string, unknown>;
  producerNotes?: Record<string, unknown>;
  composedPrompt?: string;
  [key: string]: unknown;
}

export interface ArtifactPreviewProps {
  /** Artifact data to display */
  artifacts: ArtifactData;
  /** Default tab to show */
  defaultTab?: string;
  /** Additional class name */
  className?: string;
}

/**
 * Copy to clipboard helper
 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Download as file helper
 */
const downloadAsFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Lyrics Viewer Component
 */
const LyricsViewer: React.FC<{
  lyrics: ArtifactData['lyrics'];
  onCopy: () => void;
}> = ({ lyrics, onCopy }) => {
  if (!lyrics || !lyrics.sections || lyrics.sections.length === 0) {
    return (
      <div className="p-8 text-center text-text-tertiary">
        No lyrics available
      </div>
    );
  }

  const sectionTypeColors: Record<string, string> = {
    verse: 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30',
    chorus: 'bg-accent-music/20 text-accent-music border-accent-music/30',
    bridge: 'bg-accent-warning/20 text-accent-warning border-accent-warning/30',
    prechorus: 'bg-accent-primary/20 text-accent-primary border-accent-primary/30',
    intro: 'bg-status-pending/20 text-status-pending border-status-pending/30',
    outro: 'bg-status-skipped/20 text-status-skipped border-status-skipped/30',
  };

  return (
    <div className="space-y-6">
      {lyrics.sections.map((section, index) => (
        <div key={index}>
          <Badge
            className={cn(
              'mb-3',
              sectionTypeColors[section.type.toLowerCase()] || 'bg-background-tertiary/50 text-text-secondary'
            )}
          >
            [{section.type}]
          </Badge>
          <div className="space-y-2 pl-4">
            {section.lines.map((line, lineIndex) => (
              <p key={lineIndex} className="text-text-primary leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-border/10">
        <Button
          size="sm"
          variant="outline"
          onClick={onCopy}
        >
          Copy Lyrics
        </Button>
      </div>
    </div>
  );
};

/**
 * JSON Viewer Component
 */
const JSONViewer: React.FC<{
  data: Record<string, unknown>;
  title: string;
  onCopy: () => void;
  onDownload: () => void;
}> = ({ data, onCopy, onDownload }) => {
  return (
    <div className="space-y-4">
      <pre className="p-4 bg-background-tertiary rounded-lg overflow-auto max-h-96 text-xs text-text-primary font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCopy}>
          Copy JSON
        </Button>
        <Button size="sm" variant="outline" onClick={onDownload}>
          Download
        </Button>
      </div>
    </div>
  );
};

/**
 * Composed Prompt Viewer Component
 */
const ComposedPromptViewer: React.FC<{
  prompt: string;
  onCopy: () => void;
}> = ({ prompt, onCopy }) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-background-tertiary rounded-lg overflow-auto max-h-96">
        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
          {prompt}
        </p>
      </div>

      <Button size="sm" variant="outline" onClick={onCopy}>
        Copy Prompt
      </Button>
    </div>
  );
};

/**
 * Main ArtifactPreview Component
 */
export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({
  artifacts,
  defaultTab,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || 'lyrics');
  const [copySuccess, setCopySuccess] = React.useState(false);

  const handleCopy = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = (content: Record<string, unknown>, filename: string) => {
    downloadAsFile(JSON.stringify(content, null, 2), filename);
  };

  // Determine which tabs to show
  const tabs: Array<{ id: string; label: string; hasContent: boolean }> = [
    { id: 'lyrics', label: 'Lyrics', hasContent: !!artifacts.lyrics },
    { id: 'style', label: 'Style', hasContent: !!artifacts.style },
    { id: 'producer', label: 'Producer Notes', hasContent: !!artifacts.producerNotes },
    { id: 'prompt', label: 'Composed Prompt', hasContent: !!artifacts.composedPrompt },
  ];

  const availableTabs = tabs.filter(tab => tab.hasContent);

  // Set default tab to first available if current tab has no content
  React.useEffect(() => {
    const currentTabAvailable = availableTabs.some(tab => tab.id === activeTab);
    if (!currentTabAvailable && availableTabs.length > 0) {
      setActiveTab(availableTabs[0]?.id ?? '');
    }
  }, [activeTab, availableTabs]);

  if (availableTabs.length === 0) {
    return (
      <div className={cn('p-6 bg-background-secondary rounded-xl border border-border/10', className)}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Artifacts Yet</h3>
          <p className="text-sm text-text-secondary">
            Artifacts will appear here as the workflow generates them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-6 bg-background-secondary rounded-xl border border-border/10', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Generated Artifacts</h3>
        {copySuccess && (
          <Badge variant="default" className="bg-status-complete/20 text-status-complete border-status-complete/30">
            ✓ Copied!
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex gap-2 border-b border-border/10 mb-6">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-accent-primary border-b-2 border-accent-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'lyrics' && artifacts.lyrics && (
            <LyricsViewer
              lyrics={artifacts.lyrics}
              onCopy={() => {
                const text = artifacts.lyrics!.sections
                  .map(s => `[${s.type}]\n${s.lines.join('\n')}`)
                  .join('\n\n');
                handleCopy(text);
              }}
            />
          )}

          {activeTab === 'style' && artifacts.style && (
            <JSONViewer
              data={artifacts.style}
              title="Style Specification"
              onCopy={() => handleCopy(JSON.stringify(artifacts.style, null, 2))}
              onDownload={() => handleDownload(artifacts.style!, 'style.json')}
            />
          )}

          {activeTab === 'producer' && artifacts.producerNotes && (
            <JSONViewer
              data={artifacts.producerNotes}
              title="Producer Notes"
              onCopy={() => handleCopy(JSON.stringify(artifacts.producerNotes, null, 2))}
              onDownload={() => handleDownload(artifacts.producerNotes!, 'producer-notes.json')}
            />
          )}

          {activeTab === 'prompt' && artifacts.composedPrompt && (
            <ComposedPromptViewer
              prompt={artifacts.composedPrompt}
              onCopy={() => handleCopy(artifacts.composedPrompt!)}
            />
          )}
        </div>
      </Tabs>
    </div>
  );
};

ArtifactPreview.displayName = 'ArtifactPreview';
