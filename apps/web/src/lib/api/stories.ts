import type { SongStory, SongMotif, SongStoryCreate, SongStoryPatch, SongMotifCreate, SongMotifPatch, UUID } from '@/types/api';

import { apiClient } from './client';

export class StoryRevisionConflictError extends Error {
  readonly current_revision: number;
  constructor(currentRevision: number) {
    super(`This story changed elsewhere (now revision ${currentRevision}). Reload to continue.`);
    this.name = 'StoryRevisionConflictError';
    this.current_revision = currentRevision;
  }
}

const pendingKeys = new Map<string, string>();
function freshKey(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch { /* jsdom may expose a restricted crypto implementation */ }
  return `mm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
function keyFor(scope: string, body: unknown): string {
  const fingerprint = `${scope}:${JSON.stringify(body)}`;
  const key = pendingKeys.get(fingerprint) ?? freshKey();
  pendingKeys.set(fingerprint, key);
  return key;
}
function conflict(error: unknown): never {
  const candidate = error as { status?: number; details?: { current_revision?: unknown } } | null;
  const currentRevision = candidate?.details?.current_revision;
  if (candidate?.status === 409 && typeof currentRevision === 'number' && Number.isInteger(currentRevision)) {
    throw new StoryRevisionConflictError(currentRevision);
  }
  throw error;
}
async function mutate<T>(scope: string, body: unknown, request: (key: string) => Promise<T>): Promise<T> {
  const fingerprint = `${scope}:${JSON.stringify(body)}`;
  const key = keyFor(scope, body);
  try {
    const result = await request(key);
    pendingKeys.delete(fingerprint);
    return result;
  } catch (error) { conflict(error); }
}

export const storiesApi = {
  list: async (songId: UUID): Promise<SongStory[]> => (await apiClient.get<SongStory[]>(`/songs/${songId}/stories`)).data,
  get: async (songId: UUID, storyId: UUID): Promise<SongStory> => (await apiClient.get<SongStory>(`/songs/${songId}/stories/${storyId}`)).data,
  create: (songId: UUID, payload: SongStoryCreate): Promise<SongStory> => mutate(`story:${songId}`, payload, async (key) => (await apiClient.post<SongStory>(`/songs/${songId}/stories`, payload, { headers: { 'Idempotency-Key': key } })).data),
  update: (songId: UUID, storyId: UUID, payload: SongStoryPatch): Promise<SongStory> => mutate(`story:${songId}:${storyId}`, payload, async (key) => {
    try { return (await apiClient.patch<SongStory>(`/songs/${songId}/stories/${storyId}`, payload, { headers: { 'Idempotency-Key': key } })).data; }
    catch (error) { conflict(error); }
  }),
  createMotif: (songId: UUID, storyId: UUID, payload: SongMotifCreate): Promise<SongMotif> => mutate(`motif:${songId}:${storyId}`, payload, async (key) => (await apiClient.post<SongMotif>(`/songs/${songId}/stories/${storyId}/motifs`, payload, { headers: { 'Idempotency-Key': key } })).data),
  listMotifs: async (songId: UUID, storyId: UUID): Promise<SongMotif[]> => (await apiClient.get<SongMotif[]>(`/songs/${songId}/stories/${storyId}/motifs`)).data,
  updateMotif: (songId: UUID, storyId: UUID, motifId: UUID, payload: SongMotifPatch): Promise<SongMotif> => mutate(`motif:${songId}:${storyId}:${motifId}`, payload, async (key) => (await apiClient.patch<SongMotif>(`/songs/${songId}/stories/${storyId}/motifs/${motifId}`, payload, { headers: { 'Idempotency-Key': key } })).data),
};
