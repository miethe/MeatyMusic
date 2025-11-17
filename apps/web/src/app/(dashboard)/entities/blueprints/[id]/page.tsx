/**
 * Blueprint Detail Page
 * View and edit a blueprint entity
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
import { useBlueprint, useDeleteBlueprint } from '@/hooks/api/useBlueprints';

export default function BlueprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blueprintId = params.id as string;

  // Fetch blueprint data from API
  const { data: blueprint, isLoading, error } = useBlueprint(blueprintId);
  const deleteBlueprint = useDeleteBlueprint();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this blueprint?')) {
      try {
        await deleteBlueprint.mutateAsync(blueprintId);
        router.push(ROUTES.ENTITIES.BLUEPRINTS);
      } catch (error) {
        console.error('Failed to delete blueprint:', error);
      }
    }
  };

  const handleEdit = () => {
    router.push(ROUTES.ENTITIES.BLUEPRINT_EDIT(blueprintId));
  };

  const handleClone = () => {
    // TODO: Implement clone functionality
    console.log('Clone blueprint:', blueprintId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Loading..."
          description="Blueprint details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading blueprint details...</p>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !blueprint) {
    return (
      <div className="min-h-screen">
        <PageHeader
          title="Error"
          description="Blueprint details"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-12 text-center">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load blueprint</p>
              {error && <p className="text-sm text-text-secondary mt-2">{error.message}</p>}
            </div>
            <Button onClick={() => router.push(ROUTES.ENTITIES.BLUEPRINTS)}>
              Back to Blueprints
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title={`${blueprint.genre} Blueprint`}
        description="Genre-specific composition rules and evaluation rubric"
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
              disabled={deleteBlueprint.isPending}
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
                <div>
                  <dt className="text-sm text-text-muted">Genre</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">{blueprint.genre}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">Version</dt>
                  <dd className="mt-1">
                    <Badge variant="outline">{blueprint.version}</Badge>
                  </dd>
                </div>
              </dl>
            </Card>

            {blueprint.rules && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Rules</h3>
                <dl className="space-y-4">
                  {blueprint.rules.tempo_bpm && (
                    <div>
                      <dt className="text-sm text-text-muted">Tempo Range (BPM)</dt>
                      <dd className="mt-1 text-text-primary">
                        {blueprint.rules.tempo_bpm[0]} - {blueprint.rules.tempo_bpm[1]}
                      </dd>
                    </div>
                  )}
                  {blueprint.rules.required_sections && blueprint.rules.required_sections.length > 0 && (
                    <div>
                      <dt className="text-sm text-text-muted">Required Sections</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {blueprint.rules.required_sections.map((section) => (
                          <Badge key={section} variant="secondary">
                            {section}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                  {blueprint.rules.banned_terms && blueprint.rules.banned_terms.length > 0 && (
                    <div>
                      <dt className="text-sm text-text-muted">Banned Terms</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {blueprint.rules.banned_terms.map((term) => (
                          <Badge key={term} variant="outline">
                            {term}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                  {blueprint.rules.lexicon_positive && blueprint.rules.lexicon_positive.length > 0 && (
                    <div>
                      <dt className="text-sm text-text-muted">Positive Lexicon</dt>
                      <dd className="mt-1">
                        <div className="text-xs text-text-secondary">
                          {blueprint.rules.lexicon_positive.length} terms
                        </div>
                      </dd>
                    </div>
                  )}
                  {blueprint.rules.lexicon_negative && blueprint.rules.lexicon_negative.length > 0 && (
                    <div>
                      <dt className="text-sm text-text-muted">Negative Lexicon</dt>
                      <dd className="mt-1">
                        <div className="text-xs text-text-secondary">
                          {blueprint.rules.lexicon_negative.length} terms
                        </div>
                      </dd>
                    </div>
                  )}
                  {blueprint.rules.section_lines && Object.keys(blueprint.rules.section_lines).length > 0 && (
                    <div>
                      <dt className="text-sm text-text-muted">Section Line Constraints</dt>
                      <dd className="mt-2 space-y-2">
                        {Object.entries(blueprint.rules.section_lines).map(([section, constraints]) => (
                          <div key={section} className="border border-border-default rounded-lg p-3">
                            <div className="font-medium text-sm text-text-primary mb-1">{section}</div>
                            <div className="text-xs text-text-secondary">
                              {constraints.min && `Min: ${constraints.min}`}
                              {constraints.min && constraints.max && ' | '}
                              {constraints.max && `Max: ${constraints.max}`}
                            </div>
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            )}

            {blueprint.eval_rubric && (
              <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Evaluation Rubric</h3>
                <div className="space-y-4">
                  {blueprint.eval_rubric.weights && (
                    <div>
                      <dt className="text-sm text-text-muted mb-2">Weights</dt>
                      <dd className="space-y-2">
                        {Object.entries(blueprint.eval_rubric.weights).map(([metric, weight]) => (
                          <div key={metric} className="flex items-center justify-between text-sm">
                            <span className="text-text-primary capitalize">
                              {metric.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="outline">{weight}</Badge>
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {blueprint.eval_rubric.thresholds && (
                    <div className="pt-4 border-t border-border-default">
                      <dt className="text-sm text-text-muted mb-2">Thresholds</dt>
                      <dd className="space-y-2">
                        {blueprint.eval_rubric.thresholds.min_total !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-primary">Minimum Total Score</span>
                            <Badge variant="secondary">{blueprint.eval_rubric.thresholds.min_total}</Badge>
                          </div>
                        )}
                        {blueprint.eval_rubric.thresholds.max_profanity !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-primary">Maximum Profanity</span>
                            <Badge variant="secondary">{blueprint.eval_rubric.thresholds.max_profanity}</Badge>
                          </div>
                        )}
                      </dd>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6 bg-bg-surface border-border-default shadow-elevation-1">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Usage</h3>
              <p className="text-sm text-text-secondary">
                This blueprint is not currently used in any songs.
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
                    {new Date(blueprint.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">Last Updated</dt>
                  <dd className="text-sm font-medium text-text-primary">
                    {new Date(blueprint.updated_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-text-muted">ID</dt>
                  <dd className="text-xs font-mono break-all text-text-secondary">{blueprint.id}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
