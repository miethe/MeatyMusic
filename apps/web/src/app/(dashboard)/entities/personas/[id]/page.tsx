/**
 * Persona Detail Page
 * View and edit a persona entity
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
import { usePersona, useDeletePersona } from '@/hooks/api/usePersonas';

export default function PersonaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.id as string;

  // Fetch persona data from API
  const { data: persona, isLoading, error } = usePersona(personaId);
  const deletePersona = useDeletePersona();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this persona?')) {
      try {
        await deletePersona.mutateAsync(personaId);
        router.push(ROUTES.ENTITIES.PERSONAS);
      } catch (error) {
        console.error('Failed to delete persona:', error);
      }
    }
  };

  const handleEdit = () => {
    router.push(ROUTES.ENTITIES.PERSONA_EDIT(personaId));
  };

  const handleClone = () => {
    // TODO: Implement clone functionality
    console.log('Clone persona:', personaId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Loading..."
          description="Persona details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading persona details...</p>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !persona) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Error"
          description="Persona details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load persona</p>
              {error && <p className="text-sm text-text-secondary mt-2">{error.message}</p>}
            </div>
            <Button onClick={() => router.push(ROUTES.ENTITIES.PERSONAS)}>
              Back to Personas
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title={persona.name}
        description="Persona details"
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
              disabled={deletePersona.isPending}
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
                {persona.kind && (
                  <div>
                    <dt className="text-sm text-text-muted">Type</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{persona.kind}</Badge>
                    </dd>
                  </div>
                )}
                {persona.vocal_range && (
                  <div>
                    <dt className="text-sm text-text-muted">Vocal Range</dt>
                    <dd className="mt-1">
                      <Badge variant="outline">{persona.vocal_range}</Badge>
                    </dd>
                  </div>
                )}
                {persona.voice && (
                  <div>
                    <dt className="text-sm text-text-muted">Voice Description</dt>
                    <dd className="mt-1 text-text-primary">{persona.voice}</dd>
                  </div>
                )}
                {persona.bio && (
                  <div>
                    <dt className="text-sm text-text-muted">Biography</dt>
                    <dd className="mt-1 text-text-secondary whitespace-pre-wrap">{persona.bio}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {persona.delivery && persona.delivery.length > 0 && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Delivery Styles</h3>
                <div className="flex flex-wrap gap-2">
                  {persona.delivery.map((style, idx) => (
                    <Badge key={idx} variant="secondary">
                      {style}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {persona.influences && persona.influences.length > 0 && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Influences</h3>
                <div className="flex flex-wrap gap-2">
                  {persona.influences.map((influence, idx) => (
                    <Badge key={idx} variant="outline">
                      {influence}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Usage</h3>
              <p className="text-sm text-text-secondary">
                This persona is not currently used in any songs.
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
                    {new Date(persona.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">Last Updated</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {new Date(persona.updated_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">ID</dt>
                  <dd className="text-xs font-mono break-all text-text-secondary">{persona.id}</dd>
                </div>
              </dl>
            </Card>

            {persona.policy && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Policy</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-text-muted">Public Release</dt>
                    <dd className="text-sm font-medium text-text-primary">
                      {persona.policy.public_release ? 'Allowed' : 'Restricted'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-text-muted">Named Style Reference</dt>
                    <dd className="text-sm font-medium text-text-primary">
                      {persona.policy.disallow_named_style_of ? 'Disallowed' : 'Allowed'}
                    </dd>
                  </div>
                </dl>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
