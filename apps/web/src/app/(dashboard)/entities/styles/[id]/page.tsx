/**
 * Style Detail Page
 * View and edit a style entity
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
import { useStyle, useDeleteStyle } from '@/hooks/api/useStyles';

export default function StyleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const styleId = params.id as string;

  // Fetch style data from API
  const { data: style, isLoading, error } = useStyle(styleId);
  const deleteStyle = useDeleteStyle();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this style?')) {
      try {
        await deleteStyle.mutateAsync(styleId);
        router.push(ROUTES.ENTITIES.STYLES);
      } catch (error) {
        console.error('Failed to delete style:', error);
      }
    }
  };

  const handleEdit = () => {
    router.push(ROUTES.ENTITIES.STYLE_EDIT(styleId));
  };

  const handleClone = () => {
    // TODO: Implement clone functionality
    console.log('Clone style:', styleId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Loading..."
          description="Style specification details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading style details...</p>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !style) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Error"
          description="Style specification details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load style</p>
              {error && <p className="text-sm text-text-secondary mt-2">{error.message}</p>}
            </div>
            <Button onClick={() => router.push(ROUTES.ENTITIES.STYLES)}>
              Back to Styles
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title={style.name}
        description="Style specification details"
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
              disabled={deleteStyle.isPending}
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
              <h3 className="text-lg font-semibold text-text-primary mb-4">Details</h3>
              <dl className="space-y-4">
                {style.genre && (
                  <div>
                    <dt className="text-sm text-text-muted">Genre</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{style.genre}</Badge>
                    </dd>
                  </div>
                )}
                {style.bpm_min && style.bpm_max && (
                  <div>
                    <dt className="text-sm text-text-muted">Tempo Range</dt>
                    <dd className="mt-1 text-text-primary">{style.bpm_min} - {style.bpm_max} BPM</dd>
                  </div>
                )}
                {style.key && (
                  <div>
                    <dt className="text-sm text-text-muted">Key</dt>
                    <dd className="mt-1">
                      <Badge variant="outline">{style.key}</Badge>
                    </dd>
                  </div>
                )}
                {style.mood && style.mood.length > 0 && (
                  <div>
                    <dt className="text-sm text-text-muted">Moods</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {style.mood.map((moodItem) => (
                        <Badge key={moodItem} variant="outline">{moodItem}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {style.energy_level && (
                  <div>
                    <dt className="text-sm text-text-muted">Energy Level</dt>
                    <dd className="mt-1 text-text-primary">{style.energy_level}/10</dd>
                  </div>
                )}
                {style.instrumentation && style.instrumentation.length > 0 && (
                  <div>
                    <dt className="text-sm text-text-muted">Instrumentation</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {style.instrumentation.map((instrument) => (
                        <Badge key={instrument} variant="outline">{instrument}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {style.tags_positive && style.tags_positive.length > 0 && (
                  <div>
                    <dt className="text-sm text-text-muted">Positive Tags</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {style.tags_positive.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {style.tags_negative && style.tags_negative.length > 0 && (
                  <div>
                    <dt className="text-sm text-text-muted">Negative Tags</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {style.tags_negative.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Usage</h3>
              <p className="text-sm text-text-secondary">
                This style is not currently used in any songs.
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
                    {new Date(style.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">Last Updated</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {new Date(style.updated_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">ID</dt>
                  <dd className="text-xs font-mono break-all text-text-secondary">{style.id}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
