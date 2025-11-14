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
import { Plus, Filter, Palette } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function StylesPage() {
  const [search, setSearch] = React.useState('');

  // TODO: Fetch styles from API
  const styles: any[] = [];

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
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-elevated text-text-primary placeholder:text-text-muted focus:border-border-accent focus:ring-2 focus:ring-primary-500/20 transition-all duration-ui"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Empty State */}
        {styles.length === 0 && (
          <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
            <Palette className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No styles yet</h3>
            <p className="text-text-secondary mb-6">
              Create your first style specification to define the musical characteristics of your songs
            </p>
            <Link href={ROUTES.ENTITIES.STYLE_NEW}>
              <Button className="bg-gradient-primary shadow-accent-glow hover:shadow-accent-glow-lg transition-all duration-ui">
                <Plus className="w-4 h-4 mr-2" />
                Create First Style
              </Button>
            </Link>
          </Card>
        )}

        {/* Styles Grid */}
        {styles.length > 0 && (
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

function StyleCard({ style }: { style: any }) {
  return (
    <Link href={ROUTES.ENTITIES.STYLE_DETAIL(style.id)}>
      <Card className="bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-accent p-6 transition-all duration-ui">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{style.name}</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{style.genre}</Badge>
          <Badge variant="outline">{style.tempo_min}-{style.tempo_max} BPM</Badge>
        </div>
        <p className="text-sm text-text-secondary line-clamp-2">
          {style.description}
        </p>
      </Card>
    </Link>
  );
}
