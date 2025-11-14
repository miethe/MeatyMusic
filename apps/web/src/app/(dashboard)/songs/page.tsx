/**
 * Songs List Page
 * Display all songs with filters and search
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { SongList, type SongFilters } from '@/components/songs/SongList';
import { useSongs } from '@/hooks/api/useSongs';
import { Plus, Filter, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function SongsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState<SongFilters>({
    q: '',
  });

  const { data, isLoading, error } = useSongs(filters);

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
        {/* Filters Bar */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search songs..."
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-elevated text-text-primary placeholder:text-text-muted focus:border-border-accent focus:ring-2 focus:ring-primary/20 transition-all duration-ui"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFilters({ ...filters, q: e.target.value });
              }}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
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
          <SongList songs={data?.items || []} filters={filters} />
        )}
      </div>
    </div>
  );
}
