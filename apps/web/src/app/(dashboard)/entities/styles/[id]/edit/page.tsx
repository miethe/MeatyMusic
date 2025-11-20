/**
 * Edit Style Page
 * Form for editing an existing style entity with ChipSelector from @meaty/ui
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { StyleEditor } from '@/components/entities/StyleEditor';
import { useStyleById, useUpdateStyle } from '@/hooks/api/useStyles';
import { ROUTES } from '@/config/routes';
import type { StyleUpdate } from '@/types/api/entities';
import { LoadingScreen } from '@meatymusic/ui';

interface EditStylePageProps {
  params: {
    id: string;
  };
}

export default function EditStylePage({ params }: EditStylePageProps) {
  const router = useRouter();
  const { data: style, isLoading } = useStyleById(params.id);
  const updateStyle = useUpdateStyle();

  const handleSave = async (updates: StyleUpdate) => {
    try {
      await updateStyle.mutateAsync({ id: params.id, data: updates });
      router.push(ROUTES.ENTITIES.STYLE_DETAIL(params.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to update style:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.STYLE_DETAIL(params.id));
  };

  if (isLoading || !style) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Edit Style"
        description="Update style specification"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <StyleEditor
          initialValue={style}
          onSave={handleSave}
          onCancel={handleCancel}
          showLibrarySelector={false}
          className="rounded-lg border border-border-default shadow-elevation-1 bg-bg-surface"
        />
      </div>
    </div>
  );
}
