/**
 * Songs List Page
 * Display all songs with filters and search
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { SongList, type SongFilters } from '@/components/songs/SongList';
import { useSongs } from '@/hooks/api/useSongs';
import { Plus, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import type { Song } from '@/types/api';
import { SearchInput } from '@/components/search-input';
import { SongsFilters } from '@/components/songs-filters';
import type { SongFilters as ApiSongFilters } from '@/lib/api/songs';

export default function SongsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState<ApiSongFilters>({});

  // Combine search query with filters
  const apiFilters = React.useMemo(() => ({
    ...filters,
    q: searchQuery || undefined,
  }), [filters, searchQuery]);

  const { data, isLoading, error } = useSongs(apiFilters);

  // Navigation handlers
  const handleSongClick = React.useCallback((song: Song) => {
    router.push(ROUTES.SONG_DETAIL(song.id));
  }, [router]);

  const handleViewWorkflow = React.useCallback((song: Song) => {
    router.push(ROUTES.SONG_WORKFLOW(song.id));
  }, [router]);

  const handleEdit = React.useCallback((song: Song) => {
    // TODO: Implement edit mode - Phase 4 feature
    console.log('Edit song:', song.id);
  }, []);

  const handleClone = React.useCallback((song: Song) => {
    // TODO: Implement clone functionality - Phase 4 feature
    console.log('Clone song:', song.id);
  }, []);

  const handleDelete = React.useCallback((song: Song) => {
    // TODO: Implement delete confirmation - Phase 4 feature
    console.log('Delete song:', song.id);
  }, []);

  const handleClearFilters = React.useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Songs"
        description="Manage your song design specs and workflows"
        actions={
          <Link href={ROUTES.SONG_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Song
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters Bar */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search songs..."
            debounce={300}
          />
          <SongsFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-6 text-center">
            <p className="text-destructive font-medium">Failed to load songs</p>
            <p className="text-text-muted text-sm mt-2">{error.message}</p>
          </div>
        )}

        {/* Song List */}
        {!isLoading && !error && (
          <SongList
            songs={data?.items || []}
            onSongClick={handleSongClick}
            onViewWorkflow={handleViewWorkflow}
            onEdit={handleEdit}
            onClone={handleClone}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
