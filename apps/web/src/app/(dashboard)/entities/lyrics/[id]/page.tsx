/**
 * Lyrics Detail Page
 * View and edit a lyrics entity
 */

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Edit, Trash2, Copy, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useLyrics, useDeleteLyrics } from '@/hooks/api/useLyrics';

export default function LyricsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lyricsId = params.id as string;

  // Fetch lyrics data from API
  const { data: lyrics, isLoading, error } = useLyrics(lyricsId);
  const deleteLyrics = useDeleteLyrics();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete these lyrics?')) {
      try {
        await deleteLyrics.mutateAsync(lyricsId);
        router.push(ROUTES.ENTITIES.LYRICS);
      } catch (error) {
        console.error('Failed to delete lyrics:', error);
      }
    }
  };

  const handleEdit = () => {
    router.push(ROUTES.ENTITIES.LYRICS_EDIT(lyricsId));
  };

  const handleClone = () => {
    // TODO: Implement clone functionality
    console.log('Clone lyrics:', lyricsId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Loading..."
          description="Lyrics specification details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading lyrics details...</p>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lyrics) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Error"
          description="Lyrics specification details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load lyrics</p>
              {error && <p className="text-sm text-text-secondary mt-2">{error.message}</p>}
            </div>
            <Button onClick={() => router.push(ROUTES.ENTITIES.LYRICS)}>
              Back to Lyrics
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const totalLines = lyrics.sections?.reduce((sum, section) => sum + (section.line_count || 0), 0) || 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        title={lyrics.name}
        description="Lyrics specification details"
        actions={
          <>
            <Button variant="outline" onClick={handleClone}>
              <Copy className="w-4 h-4 mr-2" />
              Clone
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteLyrics.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Overview</h3>
              <dl className="space-y-4">
                {lyrics.language && (
                  <div>
                    <dt className="text-sm text-text-muted">Language</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{lyrics.language}</Badge>
                    </dd>
                  </div>
                )}
                {lyrics.pov && (
                  <div>
                    <dt className="text-sm text-text-muted">Point of View</dt>
                    <dd className="mt-1">
                      <Badge variant="outline">{lyrics.pov}</Badge>
                    </dd>
                  </div>
                )}
                {totalLines > 0 && (
                  <div>
                    <dt className="text-sm text-text-muted">Total Lines</dt>
                    <dd className="mt-1 text-text-primary">{totalLines}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {lyrics.sections && lyrics.sections.length > 0 && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Sections</h3>
                <div className="space-y-4">
                  {lyrics.sections.map((section, idx) => (
                    <div key={idx} className="border border-border-default rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{section.type}</Badge>
                        {section.line_count && (
                          <span className="text-sm text-text-muted">{section.line_count} lines</span>
                        )}
                      </div>
                      {section.rhyme_scheme && (
                        <div className="mt-2">
                          <span className="text-xs text-text-muted">Rhyme: </span>
                          <span className="text-sm text-text-primary font-mono">{section.rhyme_scheme}</span>
                        </div>
                      )}
                      {section.content && (
                        <div className="mt-3 text-sm text-text-secondary whitespace-pre-wrap font-serif">
                          {section.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Usage</h3>
              <p className="text-sm text-text-secondary">
                These lyrics are not currently used in any songs.
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Metadata</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-text-muted">Created</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {new Date(lyrics.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">Last Updated</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {new Date(lyrics.updated_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">ID</dt>
                  <dd className="text-xs font-mono break-all text-text-secondary">{lyrics.id}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
