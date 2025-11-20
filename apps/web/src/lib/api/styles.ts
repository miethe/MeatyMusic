/**
 * Styles API Client
 * API methods for Style entity CRUD operations
 *
 * Backend: services/api/app/routes/styles.py
 */

import { apiClient } from './client';
import { downloadBlob, getFilenameFromHeaders } from './utils';
import type {
  Style,
  StyleCreate,
  StyleUpdate,
  PaginatedResponse,
  UUID,
} from '@/types/api';

/**
 * Style list filters
 */
export interface StyleFilters {
  q?: string; // Full-text search
  genre?: string[]; // Filter by genre
  mood?: string[]; // Filter by mood
  bpm_min?: number; // Min BPM
  bpm_max?: number; // Max BPM
  energy_level_min?: number; // Min energy (1-10)
  energy_level_max?: number; // Max energy (1-10)
  blueprint_id?: UUID; // Filter by blueprint
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
}

/**
 * Styles API methods
 */
export const stylesApi = {
  /**
   * List styles with filters and pagination
   */
  list: async (filters?: StyleFilters): Promise<PaginatedResponse<Style>> => {
    const { data } = await apiClient.get<PaginatedResponse<Style>>('/styles', {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single style by ID
   */
  get: async (id: UUID): Promise<Style> => {
    const { data } = await apiClient.get<Style>(`/styles/${id}`);
    return data;
  },

  /**
   * Create a new style
   */
  create: async (style: StyleCreate): Promise<Style> => {
    const { data } = await apiClient.post<Style>('/styles', style);
    return data;
  },

  /**
   * Update an existing style
   */
  update: async (id: UUID, style: StyleUpdate): Promise<Style> => {
    const { data } = await apiClient.patch<Style>(`/styles/${id}`, style);
    return data;
  },

  /**
   * Delete a style (soft delete)
   */
  delete: async (id: UUID): Promise<void> => {
    await apiClient.delete(`/styles/${id}`);
  },

  /**
   * Import a style from JSON file
   */
  import: async (file: File): Promise<Style> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<Style>('/styles/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Export a single style as JSON
   */
  export: async (id: UUID): Promise<void> => {
    const response = await apiClient.get(`/styles/${id}/export`, {
      responseType: 'blob',
    });

    const filename = getFilenameFromHeaders(response.headers, `style-${id}.json`);
    downloadBlob(response.data, filename);
  },

  /**
   * Bulk delete styles
   */
  bulkDelete: async (ids: UUID[]): Promise<{ deleted: number; errors: string[] }> => {
    const { data } = await apiClient.post<{ deleted: number; errors: string[] }>(
      '/styles/bulk-delete',
      { ids }
    );
    return data;
  },

  /**
   * Bulk export styles as ZIP
   */
  bulkExport: async (ids: UUID[]): Promise<void> => {
    const response = await apiClient.post(
      '/styles/bulk-export',
      { ids },
      { responseType: 'blob' }
    );

    const filename = getFilenameFromHeaders(response.headers, 'styles-export.zip');
    downloadBlob(response.data, filename);
  },
};
