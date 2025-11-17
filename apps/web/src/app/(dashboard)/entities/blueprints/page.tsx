/**
 * Blueprints List Page
 * Display all blueprint entities with filters
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Plus, Filter, BookOpen, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useBlueprints } from '@/hooks/api/useBlueprints';
import type { Blueprint } from '@/types/api/entities';

export default function BlueprintsPage() {
  const [search, setSearch] = React.useState('');

  // Fetch blueprints from API
  const { data, isLoading, error } = useBlueprints({
    q: search || undefined,
    limit: 50,
  });

  const blueprints = data?.items || [];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Blueprints"
        description="Genre-specific composition rules and evaluation rubrics"
        actions={
          <Link href={ROUTES.ENTITIES.BLUEPRINT_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Blueprint
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search blueprints..."
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-elevated text-text-primary placeholder:text-text-muted focus:border-border-accent focus:ring-2 focus:ring-primary/20 transition-all duration-ui"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading blueprints...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load blueprints</p>
              <p className="text-sm text-text-secondary mt-2">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && blueprints.length === 0 && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <BookOpen className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {search ? 'No blueprints found' : 'No blueprints yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {search
                ? 'Try adjusting your search terms'
                : 'Define genre-specific rules, rubrics, and composition constraints'
              }
            </p>
            {!search && (
              <Link href={ROUTES.ENTITIES.BLUEPRINT_NEW}>
                <Button className="bg-gradient-primary shadow-accent-glow hover:shadow-accent-glow-lg transition-all duration-ui">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Blueprint
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Blueprints Grid */}
        {!isLoading && !error && blueprints.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {blueprints.map((blueprint) => (
              <BlueprintCard key={blueprint.id} blueprint={blueprint} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlueprintCard({ blueprint }: { blueprint: Blueprint }) {
  const bpmRange = blueprint.rules?.tempo_bpm
    ? `${blueprint.rules.tempo_bpm[0]}-${blueprint.rules.tempo_bpm[1]} BPM`
    : null;

  return (
    <Link href={ROUTES.ENTITIES.BLUEPRINT_DETAIL(blueprint.id)}>
      <Card className="bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-accent p-6 transition-all duration-ui cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">{blueprint.genre}</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary">{blueprint.version}</Badge>
          {bpmRange && (
            <Badge variant="outline">{bpmRange}</Badge>
          )}
        </div>
        {blueprint.rules?.required_sections && blueprint.rules.required_sections.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {blueprint.rules.required_sections.slice(0, 3).map((section) => (
              <Badge key={section} variant="outline" className="text-xs">
                {section}
              </Badge>
            ))}
            {blueprint.rules.required_sections.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{blueprint.rules.required_sections.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
