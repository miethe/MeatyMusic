/**
 * Lyrics API Client
 * API methods for Lyrics entity CRUD operations
 *
 * Backend: services/api/app/routes/lyrics.py
 */

import { apiClient } from './client';
import { downloadBlob, getFilenameFromHeaders } from './utils';
import type {
  Lyrics,
  LyricsCreate,
  LyricsUpdate,
  PaginatedResponse,
  ProfanityCheckResult,
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

  /**
   * Export a single lyrics as JSON
   */
  export: async (id: UUID): Promise<void> => {
    const response = await apiClient.get(`/lyrics/${id}/export`, {
      responseType: 'blob',
    });

    const filename = getFilenameFromHeaders(response.headers, `lyrics-${id}.json`);
    downloadBlob(response.data, filename);
  },

  /**
   * Bulk delete lyrics
   */
  bulkDelete: async (ids: UUID[]): Promise<{ deleted: number; errors: string[] }> => {
    const { data } = await apiClient.post<{ deleted: number; errors: string[] }>(
      '/lyrics/bulk-delete',
      { ids }
    );
    return data;
  },

  /**
   * Bulk export lyrics as ZIP
   */
  bulkExport: async (ids: UUID[]): Promise<void> => {
    const response = await apiClient.post(
      '/lyrics/bulk-export',
      { ids },
      { responseType: 'blob' }
    );

    const filename = getFilenameFromHeaders(response.headers, 'lyrics-export.zip');
    downloadBlob(response.data, filename);
  },
    
  /**
   * Check lyrics sections for profanity
   */
  checkProfanity: async (
    sections: Array<{ type: string; lines: string[] }>,
    explicit_allowed: boolean = false
  ): Promise<ProfanityCheckResult> => {
    const { data } = await apiClient.post<ProfanityCheckResult>(
      '/lyrics/check-profanity',
      sections,
      {
        params: { explicit_allowed },
      }
    );
    return data;
  },
};
