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
import { Plus, Filter } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function SongsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState<SongFilters>({
    q: '',
  });

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
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search songs..."
              className="w-full px-4 py-2 rounded-lg border bg-background"
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

        {/* Song List */}
        <SongList songs={[]} filters={filters} />
      </div>
    </div>
  );
}
