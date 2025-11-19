/**
 * Edit Producer Notes Page
 * Enhanced with structure template dropdown and per-section editor
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProducerNotesEditorEnhanced } from '@/components/entities/ProducerNotesEditorEnhanced';
import { useProducerNotesById, useUpdateProducerNotes } from '@/hooks/api/useProducerNotes';
import { ROUTES } from '@/config/routes';
import type { ProducerNotesUpdate } from '@/types/api/entities';
import { LoadingScreen } from '@meatymusic/ui';

interface EditProducerNotesPageProps {
  params: {
    id: string;
  };
}

export default function EditProducerNotesPage({ params }: EditProducerNotesPageProps) {
  const router = useRouter();
  const { data: producerNotes, isLoading } = useProducerNotesById(params.id);
  const updateProducerNotes = useUpdateProducerNotes();

  const handleSave = async (updates: ProducerNotesUpdate) => {
    try {
      await updateProducerNotes.mutateAsync({ id: params.id, data: updates });
      router.push(ROUTES.ENTITIES.PRODUCER_NOTES_DETAIL(params.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to update producer notes:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.PRODUCER_NOTES_DETAIL(params.id));
  };

  if (isLoading || !producerNotes) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Edit Producer Notes"
        description="Update production notes with structure templates"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <ProducerNotesEditorEnhanced
          initialValue={producerNotes}
          onSave={handleSave}
          onCancel={handleCancel}
          className="rounded-lg border border-border-default shadow-elevation-1 bg-bg-surface"
        />
      </div>
    </div>
  );
}
