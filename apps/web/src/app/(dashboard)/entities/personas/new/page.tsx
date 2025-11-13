/**
 * Create Persona Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { ROUTES } from '@/config/routes';

export default function NewPersonaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Persona"
        description="Define a new artist persona"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-6">
            Persona editor coming soon. This will include vocal range, delivery style, and influences.
          </p>
          <Button variant="outline" onClick={() => router.push(ROUTES.ENTITIES.PERSONAS)}>
            Back to Personas
          </Button>
        </Card>
      </div>
    </div>
  );
}
