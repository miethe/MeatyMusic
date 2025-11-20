/**
 * Lyrics List Page
 * Display all lyrics entities with filters
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Plus, FileText, Loader2, Upload } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useLyricsList } from '@/hooks/api/useLyrics';
import type { Lyrics } from '@/types/api/entities';
import { ImportModal } from '@/components/import/ImportModal';
import { SearchInput } from '@/components/search-input';
import { LyricsFilters } from '@/components/lyrics-filters';
import type { LyricsFilters as ApiLyricsFilters } from '@/lib/api/lyrics';

export default function LyricsPage() {
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<ApiLyricsFilters>({});
  const [importModalOpen, setImportModalOpen] = React.useState(false);

  // Combine search query with filters
  const apiFilters = React.useMemo(() => ({
    ...filters,
    q: search || undefined,
    limit: 50,
  }), [filters, search]);

  // Fetch lyrics from API
  const { data, isLoading, error } = useLyricsList(apiFilters);

  const lyricsList = data?.items || [];

  const handleClearFilters = React.useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Lyrics"
        description="Manage lyric specifications for your songs"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Link href={ROUTES.ENTITIES.LYRICS_NEW}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Lyrics
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
            placeholder="Search lyrics..."
            debounce={300}
          />
          <LyricsFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <Loader2 className="w-16 h-16 mx-auto text-text-muted mb-4 animate-spin" />
            <p className="text-text-secondary">Loading lyrics...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load lyrics</p>
              <p className="text-sm text-text-secondary mt-2">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && lyricsList.length === 0 && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <FileText className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {search ? 'No lyrics found' : 'No lyrics yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {search
                ? 'Try adjusting your search terms'
                : 'Create lyric specifications with sections, rhyme schemes, and structure'
              }
            </p>
            {!search && (
              <Link href={ROUTES.ENTITIES.LYRICS_NEW}>
                <Button className="bg-gradient-primary shadow-accent-glow hover:shadow-accent-glow-lg transition-all duration-ui">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Lyrics
                </Button>
              </Link>
            )}
          </Card>
        )}

        {/* Lyrics Grid */}
        {!isLoading && !error && lyricsList.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {lyricsList.map((lyrics) => (
              <LyricsCard key={lyrics.id} lyrics={lyrics} />
            ))}
          </div>
        )}
      </div>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        entityType="lyrics"
        onImportSuccess={() => {
          setImportModalOpen(false);
        }}
      />
    </div>
  );
}

function LyricsCard({ lyrics }: { lyrics: Lyrics }) {
  const totalLines = lyrics.sections?.reduce((sum: number, section) => sum + ((section.line_count as number) || 0), 0) || 0;

  // Generate title from themes or use generic title
  const title = lyrics.themes && lyrics.themes.length > 0
    ? `Lyrics: ${lyrics.themes.slice(0, 2).join(', ')}${lyrics.themes.length > 2 ? '...' : ''}`
    : 'Lyrics';

  return (
    <Link href={ROUTES.ENTITIES.LYRICS_DETAIL(lyrics.id)}>
      <Card className="bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-accent p-6 transition-all duration-ui cursor-pointer">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {lyrics.sections && lyrics.sections.length > 0 && (
            <Badge variant="secondary">{lyrics.sections.length} sections</Badge>
          )}
          {totalLines > 0 && (
            <Badge variant="outline">{totalLines} lines</Badge>
          )}
          {lyrics.language && (
            <Badge variant="outline">{lyrics.language}</Badge>
          )}
        </div>
        {lyrics.sections && lyrics.sections.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lyrics.sections.slice(0, 3).map((section, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {String(section.type || 'Section')}
              </Badge>
            ))}
            {lyrics.sections.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{lyrics.sections.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
