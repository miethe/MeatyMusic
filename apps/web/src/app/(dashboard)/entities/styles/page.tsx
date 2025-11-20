/**
 * Styles List Page
 * Display all style entities with filters
 * Updated to use MeatyMusic Design System
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Input } from '@meatymusic/ui';
import { Plus, Filter, Palette, Loader2, Upload, Music, Clock, Key } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useStyles } from '@/hooks/api/useStyles';
import type { Style } from '@/types/api/entities';
import { ImportModal } from '@/components/import/ImportModal';

export default function StylesPage() {
  const [search, setSearch] = React.useState('');
  const [importModalOpen, setImportModalOpen] = React.useState(false);

  // Fetch styles from API
  const { data, isLoading, error } = useStyles({
    q: search || undefined,
    limit: 50,
  });

  const styles = data?.items || [];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Styles"
        description="Manage style specifications for your songs"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Link href={ROUTES.ENTITIES.STYLE_NEW}>
              <Button variant="primary">
                <Plus className="w-4 h-4" />
                Create Style
              </Button>
            </Link>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search styles by name, genre, or mood..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Palette className="w-4 h-4" />}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card variant="default" padding="lg" className="text-center animate-fade-in">
            <Loader2 className="w-16 h-16 mx-auto text-[var(--mm-color-text-tertiary)] mb-4 animate-spin" />
            <p className="text-[var(--mm-color-text-secondary)] text-sm">Loading styles...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card variant="default" padding="lg" className="text-center animate-fade-in border-[var(--mm-color-error-500)]">
            <div className="text-[var(--mm-color-error-500)] mb-4">
              <p className="font-medium">Failed to load styles</p>
              <p className="text-sm text-[var(--mm-color-text-secondary)] mt-2">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && styles.length === 0 && (
          <Card variant="gradient" padding="lg" className="text-center animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--mm-color-panel)] mb-4">
                <Palette className="w-8 h-8 text-[var(--mm-color-primary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--mm-color-text-primary)] mb-2">
                {search ? 'No styles found' : 'No styles yet'}
              </h3>
              <p className="text-[var(--mm-color-text-secondary)] mb-6 text-sm">
                {search
                  ? 'Try adjusting your search terms or clearing filters'
                  : 'Create your first style specification to define the musical characteristics of your songs'
                }
              </p>
              {!search && (
                <Link href={ROUTES.ENTITIES.STYLE_NEW}>
                  <Button variant="primary" size="lg">
                    <Plus className="w-4 h-4" />
                    Create First Style
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Styles Grid */}
        {!isLoading && !error && styles.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {styles.map((style) => (
              <StyleCard key={style.id} style={style} />
            ))}
          </div>
        )}
      </div>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        entityType="style"
        onImportSuccess={() => {
          setImportModalOpen(false);
        }}
      />
    </div>
  );
}

function StyleCard({ style }: { style: Style }) {
  return (
    <Link href={ROUTES.ENTITIES.STYLE_DETAIL(style.id)}>
      <Card
        variant="elevated"
        padding="md"
        interactive
        className="h-full"
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-[var(--mm-color-text-primary)] group-hover:text-[var(--mm-color-primary)] transition-colors">
              {style.name}
            </h3>
            {style.genre && (
              <Badge variant="secondary" size="sm">
                <Music className="w-3 h-3" />
                {style.genre}
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          {/* BPM and Key */}
          <div className="flex flex-wrap gap-2">
            {style.bpm_min && style.bpm_max && (
              <Badge variant="outline" size="sm">
                <Clock className="w-3 h-3" />
                {style.bpm_min}-{style.bpm_max} BPM
              </Badge>
            )}
            {style.key && (
              <Badge variant="outline" size="sm">
                <Key className="w-3 h-3" />
                {style.key}
              </Badge>
            )}
          </div>

          {/* Mood Tags */}
          {style.mood && style.mood.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {style.mood.slice(0, 4).map((moodItem) => (
                <Badge
                  key={moodItem}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {moodItem}
                </Badge>
              ))}
              {style.mood.length > 4 && (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  +{style.mood.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Energy Level */}
          {style.energy && (
            <div className="pt-2 border-t border-[var(--mm-color-border-subtle)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--mm-color-text-tertiary)]">Energy</span>
                <span className="text-[var(--mm-color-text-secondary)] font-medium">
                  {style.energy}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
