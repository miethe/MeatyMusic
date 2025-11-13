/**
 * Create Producer Notes Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { ROUTES } from '@/config/routes';

export default function NewProducerNotesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Producer Notes"
        description="Define production arrangement and mix specifications"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-6">
            Producer notes editor coming soon. This will include structure, hooks, and mix parameters.
          </p>
          <Button variant="outline" onClick={() => router.push(ROUTES.ENTITIES.PRODUCER_NOTES)}>
            Back to Producer Notes
          </Button>
        </Card>
      </div>
    </div>
  );
}
