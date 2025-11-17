/**
 * Personas API Client
 * API methods for Persona entity CRUD operations
 *
 * Backend: services/api/app/routes/personas.py
 */

import { apiClient } from './client';
import type {
  Persona,
  PersonaCreate,
  PersonaUpdate,
  PaginatedResponse,
  UUID,
} from '@/types/api';

/**
 * Persona list filters
 */
export interface PersonaFilters {
  q?: string; // Full-text search
  kind?: string; // Filter by kind (artist/band)
  vocal_range?: string; // Filter by vocal range
  limit?: number; // Page size
  cursor?: string; // Cursor for pagination
}

/**
 * Personas API methods
 */
export const personasApi = {
  /**
   * List personas with filters and pagination
   */
  list: async (filters?: PersonaFilters): Promise<PaginatedResponse<Persona>> => {
    const { data } = await apiClient.get<PaginatedResponse<Persona>>('/personas', {
      params: filters,
    });
    return data;
  },

  /**
   * Get a single persona by ID
   */
  get: async (id: UUID): Promise<Persona> => {
    const { data } = await apiClient.get<Persona>(`/personas/${id}`);
    return data;
  },

  /**
   * Create a new persona
   */
  create: async (persona: PersonaCreate): Promise<Persona> => {
    const { data } = await apiClient.post<Persona>('/personas', persona);
    return data;
  },

  /**
   * Update an existing persona
   */
  update: async (id: UUID, persona: PersonaUpdate): Promise<Persona> => {
    const { data } = await apiClient.patch<Persona>(`/personas/${id}`, persona);
    return data;
  },

  /**
   * Delete a persona (soft delete)
   */
  delete: async (id: UUID): Promise<void> => {
    await apiClient.delete(`/personas/${id}`);
  },

  /**
   * Import a persona from JSON file
   */
  import: async (file: File): Promise<Persona> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<Persona>('/personas/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
