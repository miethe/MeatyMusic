/**
 * Edit Song Page
 * Simple form for editing existing song properties
 */

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/config/routes';
import { useSong, useUpdateSong } from '@/hooks/api/useSongs';
import { useUIStore } from '@/stores';
import { SongUpdate } from '@/types/api/entities';

export default function EditSongPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;

  const { data: song, isLoading, error } = useSong(songId);
  const updateSong = useUpdateSong(songId);
  const { addToast } = useUIStore();

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    genre: '',
    mood: [] as string[],
    global_seed: 0,
  });

  // Initialize form data when song loads
  React.useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || '',
        description: (song.extra_metadata?.description as string) || '',
        genre: (song.extra_metadata?.genre as string) || '',
        mood: (song.extra_metadata?.mood as string[]) || [],
        global_seed: song.global_seed || 0,
      });
    }
  }, [song]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addToast('Song title is required', 'error');
      return;
    }

    try {
      const updateData: SongUpdate = {
        title: formData.title,
        global_seed: formData.global_seed,
        extra_metadata: {
          description: formData.description,
          genre: formData.genre,
          mood: formData.mood,
        },
      };

      await updateSong.mutateAsync(updateData);
      router.push(ROUTES.SONG_DETAIL(songId));
    } catch (error) {
      console.error('Failed to update song:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update song';
      addToast(errorMessage, 'error');
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.SONG_DETAIL(songId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Error" description="Failed to load song" />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 bg-destructive/10 border-destructive/30">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Song not found'}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.SONGS)}
              className="mt-4"
            >
              Back to Songs
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title={`Edit Song: ${song.title}`}
        description="Update song information"
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
        <form onSubmit={handleSubmit}>
          <Card className="bg-surface border-border shadow-elev1 p-8 mb-6">
            <h2 className="text-2xl font-semibold text-text-strong mb-8">Song Information</h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-strong mb-2">
                  Song Title *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
                  placeholder="Enter song title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-strong mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui resize-none"
                  rows={4}
                  placeholder="Describe your song concept..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-text-strong mb-2">
                  Genre
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-panel text-text-base focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
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

              {/* Global Seed */}
              <div>
                <label className="block text-sm font-medium text-text-strong mb-2">
                  Global Seed
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-panel text-text-base font-mono focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
                  value={formData.global_seed}
                  onChange={(e) => setFormData({ ...formData, global_seed: parseInt(e.target.value, 10) || 0 })}
                />
                <p className="text-xs text-text-muted mt-2">
                  Used for deterministic music generation
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-3"
              disabled={updateSong.isPending}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!formData.title || updateSong.isPending}
              className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3"
            >
              {updateSong.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
