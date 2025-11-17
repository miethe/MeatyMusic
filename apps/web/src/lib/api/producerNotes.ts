/**
 * ProducerNotes API Client
 * API methods for ProducerNotes entity CRUD operations
 *
 * Backend: services/api/app/routes/producer_notes.py
 */

import { apiClient } from './client';
import type {
  ProducerNotes,
  ProducerNotesCreate,
  ProducerNotesUpdate,
  PaginatedResponse,
  UUID,
} from '@/types/api';

/**
 * ProducerNotes list filters
 */
export interface ProducerNotesFilters {
  q?: string; // Full-text search
  song_id?: UUID; // Filter by song
  hooks_min?: number; // Min hooks count
  hooks_max?: number; // Max hooks count
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
}

/**
 * ProducerNotes API methods
 */
export const producerNotesApi = {
  /**
   * List producer notes with filters and pagination
   */
  list: async (filters?: ProducerNotesFilters): Promise<PaginatedResponse<ProducerNotes>> => {
    const { data } = await apiClient.get<PaginatedResponse<ProducerNotes>>('/producer-notes', {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single producer notes by ID
   */
  get: async (id: UUID): Promise<ProducerNotes> => {
    const { data } = await apiClient.get<ProducerNotes>(`/producer-notes/${id}`);
    return data;
  },

  /**
   * Create new producer notes
   */
  create: async (producerNotes: ProducerNotesCreate): Promise<ProducerNotes> => {
    const { data } = await apiClient.post<ProducerNotes>('/producer-notes', producerNotes);
    return data;
  },

  /**
   * Update existing producer notes
   */
  update: async (id: UUID, producerNotes: ProducerNotesUpdate): Promise<ProducerNotes> => {
    const { data } = await apiClient.patch<ProducerNotes>(`/producer-notes/${id}`, producerNotes);
    return data;
  },

  /**
   * Delete producer notes (soft delete)
   */
  delete: async (id: UUID): Promise<void> => {
    await apiClient.delete(`/producer-notes/${id}`);
  },

  /**
   * Import producer notes from JSON file
   */
  import: async (file: File): Promise<ProducerNotes> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<ProducerNotes>('/producer-notes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
