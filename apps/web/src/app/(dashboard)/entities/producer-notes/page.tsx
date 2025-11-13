/**
 * Producer Notes List Page
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Plus, Settings } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function ProducerNotesPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Producer Notes"
        description="Manage production arrangement and mix specifications"
        actions={
          <Link href={ROUTES.ENTITIES.PRODUCER_NOTE_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Producer Notes
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No producer notes yet</h3>
          <p className="text-muted-foreground mb-6">
            Define song structure, arrangement, and mix parameters
          </p>
          <Link href={ROUTES.ENTITIES.PRODUCER_NOTE_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Producer Notes
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
