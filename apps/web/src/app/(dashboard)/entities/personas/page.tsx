/**
 * Personas List Page
 * Display all persona entities with filters
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Plus, User, Loader2, Upload } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { usePersonas } from '@/hooks/api/usePersonas';
import type { Persona } from '@/types/api/entities';
import { ImportModal } from '@/components/import/ImportModal';
import { SearchInput } from '@/components/search-input';
import { PersonasFilters } from '@/components/personas-filters';
import type { PersonaFilters } from '@/lib/api/personas';

export default function PersonasPage() {
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<PersonaFilters>({});
  const [importModalOpen, setImportModalOpen] = React.useState(false);

  // Combine search query with filters
  const apiFilters = React.useMemo(() => ({
    ...filters,
    q: search || undefined,
    limit: 50,
  }), [filters, search]);

  // Fetch personas from API
  const { data, isLoading, error } = usePersonas(apiFilters);

  const personas = data?.items || [];

  const handleClearFilters = React.useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Personas"
        description="Manage artist personas and vocal characteristics"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Link href={ROUTES.ENTITIES.PERSONA_NEW}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Persona
              </Button>
            </Link>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search personas..."
            debounce={300}
          />
          <PersonasFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading personas...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load personas</p>
              <p className="text-sm text-text-secondary mt-2">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && personas.length === 0 && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <User className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {search ? 'No personas found' : 'No personas yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {search
                ? 'Try adjusting your search terms'
                : 'Define artist personas with vocal range, delivery style, and influences'
              }
            </p>
            {!search && (
              <Link href={ROUTES.ENTITIES.PERSONA_NEW}>
                <Button className="bg-gradient-primary shadow-accent-glow hover:shadow-accent-glow-lg transition-all duration-ui">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Persona
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Personas Grid */}
        {!isLoading && !error && personas.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {personas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} />
            ))}
          </div>
        )}
      </div>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        entityType="persona"
        onImportSuccess={() => {
          setImportModalOpen(false);
        }}
      />
    </div>
  );
}

function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <Link href={ROUTES.ENTITIES.PERSONA_DETAIL(persona.id)}>
      <Card className="bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-accent p-6 transition-all duration-ui cursor-pointer">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{persona.name}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {persona.vocal_range && (
            <Badge variant="secondary">{persona.vocal_range}</Badge>
          )}
          {persona.voice && (
            <Badge variant="outline">{persona.voice}</Badge>
          )}
        </div>
        {persona.delivery && persona.delivery.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {persona.delivery.slice(0, 3).map((style) => (
              <Badge key={style} variant="outline" className="text-xs">
                {style}
              </Badge>
            ))}
            {persona.delivery.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{persona.delivery.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
