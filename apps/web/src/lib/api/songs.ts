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
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
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
};
