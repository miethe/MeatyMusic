/**
 * Edit Persona Page
 * Form for editing an existing persona entity with ChipSelector from @meaty/ui
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { PersonaEditor } from '@/components/entities/PersonaEditor';
import { usePersonaById, useUpdatePersona } from '@/hooks/api/usePersonas';
import { ROUTES } from '@/config/routes';
import type { PersonaUpdate } from '@/types/api/entities';
import { LoadingScreen } from '@meatymusic/ui';

interface EditPersonaPageProps {
  params: {
    id: string;
  };
}

export default function EditPersonaPage({ params }: EditPersonaPageProps) {
  const router = useRouter();
  const { data: persona, isLoading } = usePersonaById(params.id);
  const updatePersona = useUpdatePersona();

  const handleSave = async (updates: PersonaUpdate) => {
    try {
      await updatePersona.mutateAsync({ id: params.id, data: updates });
      router.push(ROUTES.ENTITIES.PERSONA_DETAIL(params.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to update persona:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.PERSONA_DETAIL(params.id));
  };

  if (isLoading || !persona) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Edit Persona"
        description="Update persona specification"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <PersonaEditor
          initialValue={persona}
          onSave={handleSave}
          onCancel={handleCancel}
          showLibrarySelector={false}
          className="rounded-lg border border-border-default shadow-elevation-1 bg-bg-surface"
        />
      </div>
    </div>
  );
}
