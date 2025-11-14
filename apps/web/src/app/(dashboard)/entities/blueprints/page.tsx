/**
 * Blueprints List Page
 */

'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Badge } from '@meatymusic/ui';
import { BookOpen } from 'lucide-react';

export default function BlueprintsPage() {
  const blueprints = [
    { id: '1', name: 'Pop Blueprint', genre: 'Pop', description: 'Contemporary pop music patterns and structures' },
    { id: '2', name: 'Rock Blueprint', genre: 'Rock', description: 'Rock music composition rules and guidelines' },
    { id: '3', name: 'Hip Hop Blueprint', genre: 'Hip Hop', description: 'Hip hop production and lyrical patterns' },
    { id: '4', name: 'Electronic Blueprint', genre: 'Electronic', description: 'Electronic music structure and progression' },
    { id: '5', name: 'Country Blueprint', genre: 'Country', description: 'Country music storytelling and arrangement' },
    { id: '6', name: 'R&B Blueprint', genre: 'R&B', description: 'R&B vocal and melodic patterns' },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Blueprints"
        description="Genre-specific composition rules and evaluation rubrics"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {blueprints.map((blueprint) => (
            <Card key={blueprint.id} className="bg-bg-surface border-border-default shadow-elevation-1 hover:shadow-elevation-2 hover:border-border-accent p-6 transition-all duration-ui cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">{blueprint.name}</h3>
              </div>
              <Badge variant="secondary" className="mb-3">{blueprint.genre}</Badge>
              <p className="text-sm text-text-secondary">{blueprint.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
