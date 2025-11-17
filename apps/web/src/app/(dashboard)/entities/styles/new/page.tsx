/**
 * Create Style Page
 * Form for creating a new style entity
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { StyleEditor } from '@/components/entities/StyleEditor';
import { useCreateStyle } from '@/hooks/api/useStyles';
import { ROUTES } from '@/config/routes';
import type { StyleCreate } from '@/types/api/entities';

export default function NewStylePage() {
  const router = useRouter();
  const createStyle = useCreateStyle();

  const handleSave = async (style: StyleCreate) => {
    try {
      const created = await createStyle.mutateAsync(style);
      router.push(ROUTES.ENTITIES.STYLE_DETAIL(created.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to create style:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.STYLES);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create Style"
        description="Define a new style specification"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <StyleEditor
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
