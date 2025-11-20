/**
 * Songs API Client
 * API methods for Song entity CRUD operations
 *
 * Backend: services/api/app/routes/songs.py
 */

import { apiClient } from './client';
import type {
  Song,
  SongCreate,
  SongUpdate,
  PaginatedResponse,
  UUID,
} from '@/types/api';

/**
 * Song list filters
 */
export interface SongFilters {
  q?: string; // Full-text search
  status?: string[]; // Filter by status
  style_id?: UUID; // Filter by style
  persona_id?: UUID; // Filter by persona
  blueprint_id?: UUID; // Filter by blueprint
  created_after?: string; // ISO date
  created_before?: string; // ISO date
  hasStyle?: boolean; // Filter by presence of style
  hasLyrics?: boolean; // Filter by presence of lyrics
  hasPersona?: boolean; // Filter by presence of persona
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
}

/**
 * Song Design Spec (SDS) type
 * Represents the compiled SDS JSON structure
 */
export interface SDS {
  song_id: UUID;
  title: string;
  global_seed: number;
  composed_prompt?: string;
  style?: Record<string, unknown>;
  lyrics?: Record<string, unknown>;
  persona?: Record<string, unknown>;
  producer_notes?: Record<string, unknown>;
  blueprint?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Songs API methods
 */
export const songsApi = {
  /**
   * List songs with filters and pagination
   */
  list: async (filters?: SongFilters): Promise<PaginatedResponse<Song>> => {
    const { data } = await apiClient.get<PaginatedResponse<Song>>('/songs', {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single song by ID
   */
  get: async (id: UUID): Promise<Song> => {
    const { data } = await apiClient.get<Song>(`/songs/${id}`);
    return data;
  },

  /**
   * Create a new song
   */
  create: async (song: SongCreate): Promise<Song> => {
    const { data } = await apiClient.post<Song>('/songs', song);
    return data;
  },

  /**
   * Update an existing song
   */
  update: async (id: UUID, song: SongUpdate): Promise<Song> => {
    const { data } = await apiClient.patch<Song>(`/songs/${id}`, song);
    return data;
  },

  /**
   * Delete a song (soft delete)
   */
  delete: async (id: UUID): Promise<void> => {
    await apiClient.delete(`/songs/${id}`);
  },

  /**
   * Get Song Design Spec (SDS) for a song
   * Compiles all related entities into a single SDS JSON structure
   */
  getSDS: async (id: UUID): Promise<SDS> => {
    const { data } = await apiClient.get<SDS>(`/songs/${id}/sds`);
    return data;
  },

  /**
   * Export SDS as downloadable JSON file
   * Returns blob response with Content-Disposition header for filename
   */
  export: async (id: UUID): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get(`/songs/${id}/export`, {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `sds_${id}.json`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    return {
      blob: response.data,
      filename,
    };
  },
};
