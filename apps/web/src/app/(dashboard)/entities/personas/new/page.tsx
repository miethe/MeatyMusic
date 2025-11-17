/**
 * Create Persona Page
 * Form for creating a new persona entity
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { PersonaEditor } from '@/components/entities/PersonaEditor';
import { useCreatePersona } from '@/hooks/api/usePersonas';
import { ROUTES } from '@/config/routes';
import type { PersonaCreate } from '@/types/api/entities';

export default function NewPersonaPage() {
  const router = useRouter();
  const createPersona = useCreatePersona();

  const handleSave = async (persona: PersonaCreate) => {
    try {
      const created = await createPersona.mutateAsync(persona);
      router.push(ROUTES.ENTITIES.PERSONA_DETAIL(created.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to create persona:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.PERSONAS);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Persona"
        description="Define new artist persona with vocal characteristics"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <PersonaEditor
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
