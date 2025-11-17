/**
 * Producer Notes List Page
 * Display all producer notes entities with filters
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Plus, Filter, Settings, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useProducerNotesList } from '@/hooks/api/useProducerNotes';
import type { ProducerNotes } from '@/types/api/entities';

export default function ProducerNotesPage() {
  const [search, setSearch] = React.useState('');

  // Fetch producer notes from API
  const { data, isLoading, error } = useProducerNotesList({
    q: search || undefined,
    limit: 50,
  });

  const producerNotes = data?.items || [];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Producer Notes"
        description="Manage production arrangement and mix specifications"
        actions={
          <Link href={ROUTES.ENTITIES.PRODUCER_NOTE_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Producer Notes
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
              placeholder="Search producer notes..."
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
            <p className="text-text-secondary">Loading producer notes...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load producer notes</p>
              <p className="text-sm text-text-secondary mt-2">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && producerNotes.length === 0 && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <Settings className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {search ? 'No producer notes found' : 'No producer notes yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {search
                ? 'Try adjusting your search terms'
                : 'Define song structure, arrangement, and mix parameters'
              }
            </p>
            {!search && (
              <Link href={ROUTES.ENTITIES.PRODUCER_NOTE_NEW}>
                <Button className="bg-gradient-primary shadow-accent-glow hover:shadow-accent-glow-lg transition-all duration-ui">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Producer Notes
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Producer Notes Grid */}
        {!isLoading && !error && producerNotes.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {producerNotes.map((notes) => (
              <ProducerNotesCard key={notes.id} notes={notes} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProducerNotesCard({ notes }: { notes: ProducerNotes }) {
  return (
    <Link href={ROUTES.ENTITIES.PRODUCER_NOTE_DETAIL(notes.id)}>
      <Card className="bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-accent p-6 transition-all duration-ui cursor-pointer">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Producer Notes</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {notes.structure && (
            <Badge variant="secondary">{notes.structure}</Badge>
          )}
          {notes.hooks !== undefined && (
            <Badge variant="outline">{notes.hooks} hooks</Badge>
          )}
        </div>
        {notes.instrumentation && notes.instrumentation.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {notes.instrumentation.slice(0, 3).map((instrument) => (
              <Badge key={instrument} variant="outline" className="text-xs">
                {instrument}
              </Badge>
            ))}
            {notes.instrumentation.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{notes.instrumentation.length - 3} more
              </Badge>
            )}
          </div>
        )}
        {notes.mix && (
          <div className="mt-3 text-xs text-text-muted">
            {notes.mix.lufs && <span>LUFS: {notes.mix.lufs}</span>}
            {notes.mix.stereo_width && <span className="ml-2">Width: {notes.mix.stereo_width}</span>}
          </div>
        )}
      </Card>
    </Link>
  );
}
