/**
 * Edit Lyrics Page
 * Enhanced with collapsible section editor
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { LyricsEditorEnhanced } from '@/components/entities/LyricsEditorEnhanced';
import { useLyricsById, useUpdateLyrics } from '@/hooks/api/useLyrics';
import { ROUTES } from '@/config/routes';
import type { LyricsUpdate } from '@/types/api/entities';
import { LoadingScreen } from '@meatymusic/ui';

interface EditLyricsPageProps {
  params: {
    id: string;
  };
}

export default function EditLyricsPage({ params }: EditLyricsPageProps) {
  const router = useRouter();
  const { data: lyrics, isLoading } = useLyricsById(params.id);
  const updateLyrics = useUpdateLyrics(params.id);

  const handleSave = async (updates: LyricsUpdate) => {
    try {
      await updateLyrics.mutateAsync(updates);
      router.push(ROUTES.ENTITIES.LYRICS_DETAIL(params.id));
    } catch (error) {
      // Error is handled by React Query and displayed via toast
      console.error('Failed to update lyrics:', error);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ENTITIES.LYRICS_DETAIL(params.id));
  };

  if (isLoading || !lyrics) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Edit Lyrics"
        description="Update lyrics with collapsible section editor"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        <LyricsEditorEnhanced
          initialValue={lyrics}
          onSave={handleSave}
          onCancel={handleCancel}
          className="rounded-lg border border-border-default shadow-elevation-1 bg-bg-surface"
        />
      </div>
    </div>
  );
}
