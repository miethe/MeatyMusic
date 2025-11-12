/**
 * @fileoverview Prompts service
 *
 * Typed API client for prompt management endpoints
 */

import { ApiClient } from '../client/base-client';
import { PaginatedResponse } from '../types/common';

/**
 * Prompt interface
 */
export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  model_id?: string;
  version: number;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
  runs_count: number;
  success_rate: number;
}

/**
 * Input for creating new prompt
 */
export interface CreatePromptInput {
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  model_id?: string;
  is_public?: boolean;
}

/**
 * Input for updating prompt
 */
export interface UpdatePromptInput {
  title?: string;
  content?: string;
  description?: string;
  tags?: string[];
  model_id?: string;
  is_public?: boolean;
}

/**
 * Query parameters for prompts listing
 */
export interface PromptsQuery {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  model_id?: string;
  is_public?: boolean;
  owner_id?: string;
  sort?: 'created_at' | 'updated_at' | 'title' | 'runs_count' | 'success_rate';
  order?: 'asc' | 'desc';
}

/**
 * Prompt run input
 */
export interface RunPromptInput {
  variables?: Record<string, any>;
  model_id?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Prompt run result
 */
export interface PromptRunResult {
  id: string;
  prompt_id: string;
  input_variables: Record<string, any>;
  rendered_content: string;
  model_id: string;
  response: string;
  success: boolean;
  error?: string;
  tokens_used: number;
  cost: number;
  duration_ms: number;
  created_at: string;
}

/**
 * Prompts service class
 */
export class PromptsService {
  constructor(private client: ApiClient) {}

  /**
   * Get paginated list of prompts
   */
  async getPrompts(query?: PromptsQuery): Promise<PaginatedResponse<Prompt>> {
    return this.client.get<PaginatedResponse<Prompt>>('/api/v1/prompts', {
      query: query as Record<string, string | number | boolean | undefined>
    });
  }

  /**
   * Get prompt by ID
   */
  async getPrompt(id: string): Promise<Prompt> {
    return this.client.get<Prompt>(`/api/v1/prompts/${id}`);
  }

  /**
   * Create new prompt
   */
  async createPrompt(input: CreatePromptInput): Promise<Prompt> {
    return this.client.post<Prompt>('/api/v1/prompts', input);
  }

  /**
   * Update prompt
   */
  async updatePrompt(id: string, input: UpdatePromptInput): Promise<Prompt> {
    return this.client.patch<Prompt>(`/api/v1/prompts/${id}`, input);
  }

  /**
   * Delete prompt
   */
  async deletePrompt(id: string): Promise<void> {
    return this.client.delete<void>(`/api/v1/prompts/${id}`);
  }

  /**
   * Clone/duplicate prompt
   */
  async clonePrompt(id: string, title?: string): Promise<Prompt> {
    return this.client.post<Prompt>(`/api/v1/prompts/${id}/clone`, {
      title: title || undefined
    });
  }

  /**
   * Run prompt with variables
   */
  async runPrompt(id: string, input: RunPromptInput): Promise<PromptRunResult> {
    return this.client.post<PromptRunResult>(`/api/v1/prompts/${id}/run`, input);
  }

  /**
   * Get prompt run history
   */
  async getPromptRuns(
    id: string,
    query?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<PromptRunResult>> {
    return this.client.get<PaginatedResponse<PromptRunResult>>(
      `/api/v1/prompts/${id}/runs`,
      {
        query: query as Record<string, string | number | boolean | undefined>
      }
    );
  }

  /**
   * Share prompt (get shareable link)
   */
  async sharePrompt(id: string): Promise<{ share_token: string; share_url: string }> {
    return this.client.post<{ share_token: string; share_url: string }>(
      `/api/v1/prompts/${id}/share`
    );
  }

  /**
   * Search prompts
   */
  async searchPrompts(query: string, filters?: Omit<PromptsQuery, 'search'>): Promise<PaginatedResponse<Prompt>> {
    return this.getPrompts({
      search: query,
      ...filters
    });
  }
}

/**
 * Factory function to create prompts service
 */
export function createPromptsService(client: ApiClient): PromptsService {
  return new PromptsService(client);
}
