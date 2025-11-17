/**
 * Create Blueprint Page
 * Form for creating a new blueprint entity
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { BlueprintEditor } from '@/components/entities/BlueprintEditor';
import { useCreateBlueprint } from '@/hooks/api/useBlueprints';
import { ROUTES } from '@/config/routes';
import type { BlueprintCreate } from '@/types/api/entities';

export default function NewBlueprintPage() {
  const router = useRouter();
  const createBlueprint = useCreateBlueprint();

  const handleSave = async (blueprint: BlueprintCreate) => {
    try {
      const created = await createBlueprint.mutateAsync(blueprint);
      router.push(ROUTES.ENTITIES.BLUEPRINT_DETAIL(created.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to create blueprint:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.BLUEPRINTS);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Blueprint"
        description="Define genre-specific composition rules and evaluation rubric"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <BlueprintEditor
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
