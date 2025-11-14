/**
 * Create Lyrics Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { ROUTES } from '@/config/routes';

export default function NewLyricsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Lyrics"
        description="Define new lyric specifications"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
        <Card className="bg-bg-surface border-border-default shadow-elevation-1 p-12 text-center">
          <p className="text-text-secondary mb-6">
            Lyrics editor coming soon. This will include section management, rhyme scheme, and structural constraints.
          </p>
          <Button variant="outline" onClick={() => router.push(ROUTES.ENTITIES.LYRICS)}>
            Back to Lyrics
          </Button>
        </Card>
      </div>
    </div>
  );
}
