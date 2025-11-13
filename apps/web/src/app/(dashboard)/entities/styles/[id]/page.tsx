/**
 * Style Detail Page
 * View and edit a style entity
 */

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { Edit, Trash2, Copy } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function StyleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const styleId = params.id as string;

  // TODO: Fetch style data
  const style = {
    id: styleId,
    name: 'Example Style',
    description: 'A placeholder style for demonstration',
    genre: 'Pop',
    tempo_min: 120,
    tempo_max: 140,
    created_at: new Date().toISOString(),
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this style?')) {
      console.log('Deleting style:', styleId);
      router.push(ROUTES.ENTITIES.STYLES);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title={style.name}
        description="Style specification details"
        actions={
          <>
            <Button variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Clone
            </Button>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Description</dt>
                  <dd className="mt-1">{style.description}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Genre</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">{style.genre}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tempo Range</dt>
                  <dd className="mt-1">{style.tempo_min} - {style.tempo_max} BPM</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Usage</h3>
              <p className="text-sm text-muted-foreground">
                This style is not currently used in any songs.
              </p>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Metadata</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="text-sm font-medium">
                    {new Date(style.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">ID</dt>
                  <dd className="text-xs font-mono break-all">{style.id}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
