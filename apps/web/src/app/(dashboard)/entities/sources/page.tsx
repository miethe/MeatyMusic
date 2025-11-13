/**
 * Sources List Page
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@meatymusic/ui';
import { Card } from '@meatymusic/ui';
import { Plus, Database } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function SourcesPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Sources"
        description="Manage external knowledge sources and references"
        actions={
          <Link href={ROUTES.ENTITIES.SOURCE_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <Database className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sources yet</h3>
          <p className="text-muted-foreground mb-6">
            Add external knowledge sources like documents, APIs, or databases
          </p>
          <Link href={ROUTES.ENTITIES.SOURCE_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add First Source
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
