/**
 * @fileoverview Mock API responses for testing
 */

import { CatalogModel } from '../services/catalog';
import { UserPreferences } from '../services/user-preferences';
import { Prompt, PromptRunResult } from '../services/prompts';
import { PaginatedResponse } from '../types/common';

/**
 * Mock catalog models
 */
export const mockCatalogModels: CatalogModel[] = [
  {
    id: '1',
    name: 'gpt-4',
    display_name: 'GPT-4',
    provider: 'openai',
    description: 'Most capable GPT model',
    context_length: 8192,
    pricing: {
      input_cost_per_token: 0.03,
      output_cost_per_token: 0.06
    },
    capabilities: ['text', 'chat'],
    effective: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'gpt-3.5-turbo',
    display_name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and efficient GPT model',
    context_length: 4096,
    pricing: {
      input_cost_per_token: 0.001,
      output_cost_per_token: 0.002
    },
    capabilities: ['text', 'chat'],
    effective: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

/**
 * Mock user preferences
 */
export const mockUserPreferences: UserPreferences = {
  id: 'pref-123',
  user_id: 'user-123',
  theme: 'dark',
  onboarding: {
    tour_completed: false,
    tour_step: 2,
    tour_dismissed: false
  },
  communication_opt_in: true,
  notifications: {
    email_updates: true,
    prompt_shares: true,
    collection_invites: false,
    system_announcements: true
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

/**
 * Mock prompts
 */
export const mockPrompts: Prompt[] = [
  {
    id: 'prompt-1',
    title: 'Code Review Assistant',
    content: 'Please review the following code and provide feedback: {{code}}',
    description: 'Helps review code for best practices',
    tags: ['code', 'review'],
    model_id: '1',
    version: 1,
    is_public: true,
    owner_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    runs_count: 25,
    success_rate: 0.92
  },
  {
    id: 'prompt-2',
    title: 'Email Writer',
    content: 'Write a professional email about: {{topic}}',
    description: 'Generates professional emails',
    tags: ['email', 'writing'],
    model_id: '2',
    version: 2,
    is_public: false,
    owner_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    runs_count: 10,
    success_rate: 0.80
  }
];

/**
 * Mock prompt run result
 */
export const mockPromptRunResult: PromptRunResult = {
  id: 'run-123',
  prompt_id: 'prompt-1',
  input_variables: { code: 'console.log("hello");' },
  rendered_content: 'Please review the following code and provide feedback: console.log("hello");',
  model_id: '1',
  response: 'This code looks good but consider using a more descriptive message.',
  success: true,
  tokens_used: 45,
  cost: 0.0015,
  duration_ms: 1250,
  created_at: '2024-01-01T00:00:00Z'
};

/**
 * Mock paginated response
 */
export function mockPaginatedResponse<T>(items: T[], page = 1, limit = 20): PaginatedResponse<T> {
  const start = (page - 1) * limit;
  const end = start + limit;
  const pageItems = items.slice(start, end);

  return {
    data: pageItems,
    pagination: {
      page,
      limit,
      total: items.length,
      has_next: end < items.length,
      has_previous: page > 1
    }
  };
}

/**
 * Mock error responses
 */
export const mockErrorResponses = {
  unauthorized: {
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
      correlation_id: 'req_test123'
    }
  },
  notFound: {
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      correlation_id: 'req_test456'
    }
  },
  validation: {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: {
        field: 'title',
        value: '',
        message: 'Title is required'
      },
      correlation_id: 'req_test789'
    }
  },
  serverError: {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      correlation_id: 'req_test000'
    }
  }
};

/**
 * Mock fetch responses
 */
export function mockFetchResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {}
): Promise<Response> {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Map(Object.entries({
      'content-type': 'application/json',
      'x-correlation-id': 'req_test123',
      ...headers
    })),
    json: async () => data,
    text: async () => typeof data === 'string' ? data : JSON.stringify(data)
  } as Response;

  return Promise.resolve(response);
}

/**
 * Mock fetch error (network error)
 */
export function mockFetchError(message = 'Network error'): Promise<never> {
  return Promise.reject(new TypeError(message));
}

/**
 * Mock timeout error
 */
export function mockTimeoutError(): Promise<never> {
  const error = new DOMException('The operation was aborted', 'AbortError');
  return Promise.reject(error);
}
