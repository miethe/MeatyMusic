/**
 * Lyrics API Client
 * API methods for Lyrics entity CRUD operations
 *
 * Backend: services/api/app/routes/lyrics.py
 */

import { apiClient } from './client';
import type {
  Lyrics,
  LyricsCreate,
  LyricsUpdate,
  PaginatedResponse,
  UUID,
} from '@/types/api';

/**
 * Lyrics list filters
 */
export interface LyricsFilters {
  q?: string; // Full-text search
  song_id?: UUID; // Filter by song
  language?: string; // Filter by language
  pov?: string; // Filter by point of view
  tense?: string; // Filter by tense
  explicit_allowed?: boolean; // Filter by explicit flag
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
}

/**
 * Lyrics API methods
 */
export const lyricsApi = {
  /**
   * List lyrics with filters and pagination
   */
  list: async (filters?: LyricsFilters): Promise<PaginatedResponse<Lyrics>> => {
    const { data } = await apiClient.get<PaginatedResponse<Lyrics>>('/lyrics', {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single lyrics by ID
   */
  get: async (id: UUID): Promise<Lyrics> => {
    const { data } = await apiClient.get<Lyrics>(`/lyrics/${id}`);
    return data;
  },

  /**
   * Create new lyrics
   */
  create: async (lyrics: LyricsCreate): Promise<Lyrics> => {
    const { data } = await apiClient.post<Lyrics>('/lyrics', lyrics);
    return data;
  },

  /**
   * Update existing lyrics
   */
  update: async (id: UUID, lyrics: LyricsUpdate): Promise<Lyrics> => {
    const { data } = await apiClient.patch<Lyrics>(`/lyrics/${id}`, lyrics);
    return data;
  },

  /**
   * Delete lyrics (soft delete)
   */
  delete: async (id: UUID): Promise<void> => {
    await apiClient.delete(`/lyrics/${id}`);
  },

  /**
   * Import lyrics from JSON file
   */
  import: async (file: File): Promise<Lyrics> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<Lyrics>('/lyrics/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
