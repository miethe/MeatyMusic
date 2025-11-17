/**
 * Create Producer Notes Page
 * Form for creating a new producer notes entity
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProducerNotesEditor } from '@/components/entities/ProducerNotesEditor';
import { useCreateProducerNotes } from '@/hooks/api/useProducerNotes';
import { ROUTES } from '@/config/routes';
import type { ProducerNotesCreate } from '@/types/api/entities';

export default function NewProducerNotesPage() {
  const router = useRouter();
  const createProducerNotes = useCreateProducerNotes();

  const handleSave = async (notes: ProducerNotesCreate) => {
    try {
      const created = await createProducerNotes.mutateAsync(notes);
      router.push(ROUTES.ENTITIES.PRODUCER_NOTE_DETAIL(created.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to create producer notes:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.PRODUCER_NOTES);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Producer Notes"
        description="Define production arrangement and mix specifications"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <ProducerNotesEditor
          initialValue={{}}
          onSave={handleSave}
          onCancel={handleCancel}
          showLibrarySelector={false}
          className="rounded-lg border border-border-default shadow-elevation-1 bg-bg-surface"
        />
      </div>
    </div>
  );
}
