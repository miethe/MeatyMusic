/**
 * Add Source Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { ROUTES } from '@/config/routes';

export default function NewSourcePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Add Source"
        description="Register a new external knowledge source"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-6">
            Source management coming soon. This will support files, APIs, and database connections.
          </p>
          <Button variant="outline" onClick={() => router.push(ROUTES.ENTITIES.SOURCES)}>
            Back to Sources
          </Button>
        </Card>
      </div>
    </div>
  );
}
