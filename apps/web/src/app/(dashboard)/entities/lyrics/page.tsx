/**
 * Lyrics List Page
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Plus, FileText } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function LyricsPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Lyrics"
        description="Manage lyric specifications for your songs"
        actions={
          <Link href={ROUTES.ENTITIES.LYRICS_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Lyrics
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center animate-fade-in">
          <FileText className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No lyrics yet</h3>
          <p className="text-text-secondary mb-6">
            Create lyric specifications with sections, rhyme schemes, and structure
          </p>
          <Link href={ROUTES.ENTITIES.LYRICS_NEW}>
            <Button className="bg-gradient-primary shadow-accent-glow hover:shadow-accent-glow-lg transition-all duration-ui">
              <Plus className="w-4 h-4 mr-2" />
              Create First Lyrics
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
