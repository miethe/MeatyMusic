/**
 * Personas List Page
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Plus, User } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function PersonasPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Personas"
        description="Manage artist personas and vocal characteristics"
        actions={
          <Link href={ROUTES.ENTITIES.PERSONA_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Persona
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No personas yet</h3>
          <p className="text-muted-foreground mb-6">
            Define artist personas with vocal range, delivery style, and influences
          </p>
          <Link href={ROUTES.ENTITIES.PERSONA_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Persona
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
