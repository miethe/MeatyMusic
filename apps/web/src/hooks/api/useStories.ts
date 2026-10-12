import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { storiesApi } from '@/lib/api';
import type { SongStoryCreate, SongStoryPatch, SongMotifCreate, SongMotifPatch, UUID } from '@/types/api';

const keys = {
  list: (songId: UUID) => ['songs', songId, 'stories'] as const,
  detail: (songId: UUID, storyId: UUID) => ['songs', songId, 'stories', storyId] as const,
  motifs: (songId: UUID, storyId: UUID) => ['songs', songId, 'stories', storyId, 'motifs'] as const,
};
export function useSongStories(songId: UUID) {
  return useQuery({ queryKey: keys.list(songId), queryFn: () => storiesApi.list(songId), enabled: !!songId });
}
export function useStory(songId: UUID, storyId: UUID | undefined) {
  return useQuery({ queryKey: keys.detail(songId, storyId || ''), queryFn: () => storiesApi.get(songId, storyId!), enabled: !!songId && !!storyId });
}
export function useCreateStory(songId: UUID) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: SongStoryCreate) => storiesApi.create(songId, payload), onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(songId) }) });
}
export function useUpdateStory(songId: UUID) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ storyId, payload }: { storyId: UUID; payload: SongStoryPatch }) => storiesApi.update(songId, storyId, payload), onSuccess: (story) => { qc.setQueryData(keys.detail(songId, story.id), story); qc.invalidateQueries({ queryKey: keys.list(songId) }); } });
}
export function useCreateMotif(songId: UUID) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ storyId, payload }: { storyId: UUID; payload: SongMotifCreate }) => storiesApi.createMotif(songId, storyId, payload), onSuccess: (_motif, vars) => { qc.invalidateQueries({ queryKey: keys.list(songId) }); qc.invalidateQueries({ queryKey: keys.detail(songId, vars.storyId) }); qc.invalidateQueries({ queryKey: keys.motifs(songId, vars.storyId) }); } });
}
export function useUpdateMotif(songId: UUID) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ storyId, motifId, payload }: { storyId: UUID; motifId: UUID; payload: SongMotifPatch }) => storiesApi.updateMotif(songId, storyId, motifId, payload), onSuccess: (_motif, vars) => { qc.invalidateQueries({ queryKey: keys.list(songId) }); qc.invalidateQueries({ queryKey: keys.detail(songId, vars.storyId) }); qc.invalidateQueries({ queryKey: keys.motifs(songId, vars.storyId) }); } });
}
