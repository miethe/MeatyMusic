/**
 * Blueprints API Client
 * API methods for Blueprint entity CRUD operations
 *
 * Backend: services/api/app/routes/blueprints.py
 */

import { apiClient } from './client';
import { downloadBlob, getFilenameFromHeaders } from './utils';
import type {
  Blueprint,
  BlueprintCreate,
  BlueprintUpdate,
  PaginatedResponse,
  UUID,
} from '@/types/api';

/**
 * Blueprint list filters
 */
export interface BlueprintFilters {
  q?: string; // Full-text search
  genre?: string; // Filter by genre
  version?: string; // Filter by version
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
}

/**
 * Blueprints API methods
 */
export const blueprintsApi = {
  /**
   * List blueprints with filters and pagination
   */
  list: async (filters?: BlueprintFilters): Promise<PaginatedResponse<Blueprint>> => {
    const { data } = await apiClient.get<PaginatedResponse<Blueprint>>('/blueprints', {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single blueprint by ID
   */
  get: async (id: UUID): Promise<Blueprint> => {
    const { data } = await apiClient.get<Blueprint>(`/blueprints/${id}`);
    return data;
  },

  /**
   * Create a new blueprint
   */
  create: async (blueprint: BlueprintCreate): Promise<Blueprint> => {
    const { data } = await apiClient.post<Blueprint>('/blueprints', blueprint);
    return data;
  },

  /**
   * Update an existing blueprint
   */
  update: async (id: UUID, blueprint: BlueprintUpdate): Promise<Blueprint> => {
    const { data } = await apiClient.patch<Blueprint>(`/blueprints/${id}`, blueprint);
    return data;
  },

  /**
   * Delete a blueprint (soft delete)
   */
  delete: async (id: UUID): Promise<void> => {
    await apiClient.delete(`/blueprints/${id}`);
  },

  /**
   * Import a blueprint from JSON file
   */
  import: async (file: File): Promise<Blueprint> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<Blueprint>('/blueprints/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Export a single blueprint as JSON
   */
  export: async (id: UUID): Promise<void> => {
    const response = await apiClient.get(`/blueprints/${id}/export`, {
      responseType: 'blob',
    });

    const filename = getFilenameFromHeaders(response.headers, `blueprint-${id}.json`);
    downloadBlob(response.data, filename);
  },

  /**
   * Bulk delete blueprints
   */
  bulkDelete: async (ids: UUID[]): Promise<{ deleted: number; errors: string[] }> => {
    const { data } = await apiClient.post<{ deleted: number; errors: string[] }>(
      '/blueprints/bulk-delete',
      { ids }
    );
    return data;
  },

  /**
   * Bulk export blueprints as ZIP
   */
  bulkExport: async (ids: UUID[]): Promise<void> => {
    const response = await apiClient.post(
      '/blueprints/bulk-export',
      { ids },
      { responseType: 'blob' }
    );

    const filename = getFilenameFromHeaders(response.headers, 'blueprints-export.zip');
    downloadBlob(response.data, filename);
  },
};
