/**
 * Styles List Page
 * Display all style entities with filters
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Plus, Filter, Palette, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useStyles } from '@/hooks/api/useStyles';
import type { Style } from '@/types/api/entities';

export default function StylesPage() {
  const [search, setSearch] = React.useState('');

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
          <Link href={ROUTES.ENTITIES.STYLE_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Style
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
              placeholder="Search styles..."
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
            <p className="text-text-secondary">Loading styles...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <div className="text-destructive mb-4">
              <p className="font-medium">Failed to load styles</p>
              <p className="text-sm text-text-secondary mt-2">{error.message}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && styles.length === 0 && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <Palette className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {search ? 'No styles found' : 'No styles yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {search
                ? 'Try adjusting your search terms'
                : 'Create your first style specification to define the musical characteristics of your songs'
              }
            </p>
            {!search && (
              <Link href={ROUTES.ENTITIES.STYLE_NEW}>
                <Button className="bg-gradient-primary shadow-accent-glow hover:shadow-accent-glow-lg transition-all duration-ui">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Style
                </Button>
              </Link>
            )}
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
    </div>
  );
}

function StyleCard({ style }: { style: Style }) {
  return (
    <Link href={ROUTES.ENTITIES.STYLE_DETAIL(style.id)}>
      <Card className="bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-accent p-6 transition-all duration-ui cursor-pointer">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{style.name}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {style.genre && <Badge variant="secondary">{style.genre}</Badge>}
          {style.bpm_min && style.bpm_max && (
            <Badge variant="outline">{style.bpm_min}-{style.bpm_max} BPM</Badge>
          )}
          {style.key && <Badge variant="outline">{style.key}</Badge>}
        </div>
        {style.mood && style.mood.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {style.mood.slice(0, 3).map((moodItem) => (
              <Badge key={moodItem} variant="outline" className="text-xs">
                {moodItem}
              </Badge>
            ))}
            {style.mood.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{style.mood.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
