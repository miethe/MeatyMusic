/**
 * @fileoverview Catalog models service
 *
 * Typed API client for catalog model management endpoints
 */

import { ApiClient } from '../client/base-client';

/**
 * Catalog model interface
 */
export interface CatalogModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  description?: string;
  context_length?: number;
  pricing?: {
    input_cost_per_token?: number;
    output_cost_per_token?: number;
  };
  capabilities?: string[];
  effective?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating new catalog model
 */
export interface CreateCatalogModelInput {
  name: string;
  display_name: string;
  provider: string;
  description?: string;
  context_length?: number;
  pricing?: {
    input_cost_per_token?: number;
    output_cost_per_token?: number;
  };
  capabilities?: string[];
  effective?: boolean;
}

/**
 * Query parameters for catalog models
 */
export interface CatalogModelsQuery {
  effective?: boolean;
  provider?: string;
  limit?: number;
  offset?: number;
}

/**
 * Catalog service class
 */
export class CatalogService {
  constructor(private client: ApiClient) {}

  /**
   * Get all catalog models
   */
  getModels = async (query?: CatalogModelsQuery): Promise<CatalogModel[]> => {
    // Use catalog endpoint for scoped model operations
    const raw = await this.client.get<any[]>('/api/v1/catalog/models', {
      query: query as Record<string, string | number | boolean | undefined>
    });
    return (raw || []).map((m: any) => ({
      id: m.id,
      name: m.name ?? m.model_key,
      display_name: m.display_name ?? (m.name ?? m.model_key),
      provider: m.provider,
      description: m.description,
      context_length: m.context_window,
      pricing: m.pricing,
      capabilities: m.capabilities,
      effective: m.effective,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));
  }

  /**
   * Get catalog model by ID
   */
  getModel = async (id: string): Promise<CatalogModel> => {
    const m = await this.client.get<any>(`/api/v1/catalog/models/${id}`);
    return {
      id: m.id,
      name: m.name ?? m.model_key,
      display_name: m.display_name ?? (m.name ?? m.model_key),
      provider: m.provider,
      description: m.description,
      context_length: m.context_window,
      pricing: m.pricing,
      capabilities: m.capabilities,
      effective: m.effective,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  }

  /**
   * Create new catalog model
   */
  createModel = async (input: CreateCatalogModelInput): Promise<CatalogModel> => {
    const payload = { provider: input.provider, model_key: input.name, display_name: input.display_name };
    const m = await this.client.post<any>('/api/v1/catalog/models', payload);
    return {
      id: m.id,
      name: m.name ?? m.model_key,
      display_name: m.display_name ?? (m.name ?? m.model_key),
      provider: m.provider,
      description: m.description,
      context_length: m.context_window,
      pricing: m.pricing,
      capabilities: m.capabilities,
      effective: undefined,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  }

  /**
   * Update catalog model
   */
  updateModel = async (id: string, input: Partial<CreateCatalogModelInput>): Promise<CatalogModel> => {
    const payload: any = {};
    if (input.provider !== undefined) payload.provider = input.provider;
    if (input.name !== undefined) payload.model_key = input.name;
    if (input.display_name !== undefined) payload.display_name = input.display_name;
    const m = await this.client.patch<any>(`/api/v1/catalog/models/${id}`, payload);
    return {
      id: m.id,
      name: m.name ?? m.model_key,
      display_name: m.display_name ?? (m.name ?? m.model_key),
      provider: m.provider,
      description: m.description,
      context_length: m.context_window,
      pricing: m.pricing,
      capabilities: m.capabilities,
      effective: undefined,
      created_at: m.created_at,
      updated_at: m.updated_at,
    };
  }

  /**
   * Delete catalog model
   */
  deleteModel = async (id: string): Promise<void> => {
    return this.client.delete<void>(`/api/v1/catalog/models/${id}`);
  }
}

/**
 * Factory function to create catalog service
 */
export function createCatalogService(client: ApiClient): CatalogService {
  return new CatalogService(client);
}
