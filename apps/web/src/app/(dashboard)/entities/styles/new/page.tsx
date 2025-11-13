/**
 * Create Style Page
 * Form for creating a new style entity
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { ROUTES } from '@/config/routes';

export default function NewStylePage() {
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    genre: '',
    tempo_min: 120,
    tempo_max: 140,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement style creation
    console.log('Creating style:', formData);
    router.push(ROUTES.ENTITIES.STYLES);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Style"
        description="Define a new style specification"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                  placeholder="e.g., Upbeat Pop"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                  rows={4}
                  placeholder="Describe the style characteristics..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Genre *</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  required
                >
                  <option value="">Select genre...</option>
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="hip-hop">Hip Hop</option>
                  <option value="electronic">Electronic</option>
                  <option value="country">Country</option>
                  <option value="r&b">R&B</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Tempo Min (BPM) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    value={formData.tempo_min}
                    onChange={(e) => setFormData({ ...formData, tempo_min: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tempo Max (BPM) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    value={formData.tempo_max}
                    onChange={(e) => setFormData({ ...formData, tempo_max: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Note: Additional style fields (key, mood, energy, instrumentation, tags) will be available in future updates.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTES.ENTITIES.STYLES)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Style</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
