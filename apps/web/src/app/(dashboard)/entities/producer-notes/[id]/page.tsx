/**
 * Producer Notes Detail Page
 * View and edit producer notes entity
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
import { useProducerNotes, useDeleteProducerNotes } from '@/hooks/api/useProducerNotes';

export default function ProducerNotesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notesId = params.id as string;

  // Fetch producer notes data from API
  const { data: notes, isLoading, error } = useProducerNotes(notesId);
  const deleteNotes = useDeleteProducerNotes();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete these producer notes?')) {
      try {
        await deleteNotes.mutateAsync(notesId);
        router.push(ROUTES.ENTITIES.PRODUCER_NOTES);
      } catch (error) {
        console.error('Failed to delete producer notes:', error);
      }
    }
  };

  const handleEdit = () => {
    router.push(ROUTES.ENTITIES.PRODUCER_NOTE_EDIT(notesId));
  };

  const handleClone = () => {
    // TODO: Implement clone functionality
    console.log('Clone producer notes:', notesId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Loading..."
          description="Producer notes details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading producer notes...</p>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !notes) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Error"
          description="Producer notes details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load producer notes</p>
              {error && <p className="text-sm text-text-secondary mt-2">{error.message}</p>}
            </div>
            <Button onClick={() => router.push(ROUTES.ENTITIES.PRODUCER_NOTES)}>
              Back to Producer Notes
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Producer Notes"
        description="Production arrangement and mix specifications"
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
              disabled={deleteNotes.isPending}
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
              <h3 className="text-lg font-semibold text-text-primary mb-4">Structure</h3>
              <dl className="space-y-4">
                {notes.structure && (
                  <div>
                    <dt className="text-sm text-text-muted">Pattern</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{notes.structure}</Badge>
                    </dd>
                  </div>
                )}
                {notes.hooks !== undefined && (
                  <div>
                    <dt className="text-sm text-text-muted">Hooks</dt>
                    <dd className="mt-1 text-text-primary">{notes.hooks}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {notes.instrumentation && notes.instrumentation.length > 0 && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Instrumentation</h3>
                <div className="flex flex-wrap gap-2">
                  {notes.instrumentation.map((instrument, idx) => (
                    <Badge key={idx} variant="secondary">
                      {instrument}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {notes.section_meta && Object.keys(notes.section_meta).length > 0 && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Section Details</h3>
                <div className="space-y-4">
                  {Object.entries(notes.section_meta).map(([section, meta]) => (
                    <div key={section} className="border border-border-default rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{section}</Badge>
                        {meta.target_duration_sec && (
                          <span className="text-sm text-text-muted">{meta.target_duration_sec}s</span>
                        )}
                      </div>
                      {meta.tags && meta.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {meta.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {notes.mix && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Mix Settings</h3>
                <dl className="space-y-3">
                  {notes.mix.lufs !== undefined && (
                    <div>
                      <dt className="text-sm text-text-muted">Target LUFS</dt>
                      <dd className="text-sm font-medium text-text-primary">{notes.mix.lufs}</dd>
                    </div>
                  )}
                  {notes.mix.space && (
                    <div>
                      <dt className="text-sm text-text-muted">Space</dt>
                      <dd className="text-sm font-medium text-text-primary">{notes.mix.space}</dd>
                    </div>
                  )}
                  {notes.mix.stereo_width && (
                    <div>
                      <dt className="text-sm text-text-muted">Stereo Width</dt>
                      <dd className="mt-1">
                        <Badge variant="outline">{notes.mix.stereo_width}</Badge>
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            )}

            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Usage</h3>
              <p className="text-sm text-text-secondary">
                These producer notes are not currently used in any songs.
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
                    {new Date(notes.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">Last Updated</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {new Date(notes.updated_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">ID</dt>
                  <dd className="text-xs font-mono break-all text-text-secondary">{notes.id}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
