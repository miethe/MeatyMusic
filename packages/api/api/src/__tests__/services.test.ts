/**
 * @fileoverview Tests for service modules
 */

import { ApiClient } from '../client/base-client';
import { CatalogService, createCatalogService } from '../services/catalog';
import { UserPreferencesService, createUserPreferencesService } from '../services/user-preferences';
import { PromptsService, createPromptsService } from '../services/prompts';
import {
  mockCatalogModels,
  mockUserPreferences,
  mockPrompts,
  mockPromptRunResult,
  mockPaginatedResponse
} from '../__mocks__/responses';

describe('Service modules', () => {
  let mockClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      upload: jest.fn()
    } as any;
  });

  describe('CatalogService', () => {
    let catalogService: CatalogService;

    beforeEach(() => {
      catalogService = createCatalogService(mockClient);
    });

    it('should get all catalog models', async () => {
      mockClient.get.mockResolvedValue(mockCatalogModels);

      const result = await catalogService.getModels();

      expect(result).toEqual(mockCatalogModels);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/models', {
        query: undefined
      });
    });

    it('should get models with query parameters', async () => {
      mockClient.get.mockResolvedValue(mockCatalogModels);

      await catalogService.getModels({
        effective: true,
        provider: 'openai',
        limit: 10
      });

      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/models', {
        query: { effective: true, provider: 'openai', limit: 10 }
      });
    });

    it('should get single catalog model', async () => {
      const model = mockCatalogModels[0];
      mockClient.get.mockResolvedValue(model);

      const result = await catalogService.getModel('1');

      expect(result).toEqual(model);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/models/1');
    });

    it('should create new catalog model', async () => {
      const input = {
        name: 'new-model',
        display_name: 'New Model',
        provider: 'openai'
      };
      const createdModel = { id: '3', provider: input.provider, model_key: input.name, display_name: input.display_name };
      mockClient.post.mockResolvedValue(createdModel as any);

      const result = await catalogService.createModel(input);

      expect(result).toEqual({
        id: '3',
        name: input.name,
        display_name: input.display_name,
        provider: input.provider,
        description: undefined,
        context_length: undefined,
        pricing: undefined,
        capabilities: undefined,
        effective: undefined,
        created_at: undefined,
        updated_at: undefined,
      });
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/models', { provider: input.provider, model_key: input.name, display_name: input.display_name });
    });

    it('should update catalog model', async () => {
      const update = { display_name: 'Updated Model' };
      const updatedModel = { ...mockCatalogModels[0], ...update };
      mockClient.patch.mockResolvedValue(updatedModel);

      const result = await catalogService.updateModel('1', update);

      expect(result).toEqual(updatedModel);
      expect(mockClient.patch).toHaveBeenCalledWith('/api/v1/models/1', { display_name: update.display_name });
    });

    it('should delete catalog model', async () => {
      mockClient.delete.mockResolvedValue(undefined);

      await catalogService.deleteModel('1');

      expect(mockClient.delete).toHaveBeenCalledWith('/api/v1/models/1');
    });
  });

  describe('UserPreferencesService', () => {
    let userPrefService: UserPreferencesService;

    beforeEach(() => {
      userPrefService = createUserPreferencesService(mockClient);
    });

    it('should get user preferences', async () => {
      mockClient.get.mockResolvedValue(mockUserPreferences);

      const result = await userPrefService.getUserPreferences();

      expect(result).toEqual(mockUserPreferences);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/users/me/preferences');
    });

    it('should update user preferences', async () => {
      const update = { theme: 'light', communication_opt_in: false };
      const updated = { ...mockUserPreferences, ...update };
      mockClient.patch.mockResolvedValue(updated);

      const result = await userPrefService.updateUserPreferences(update);

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences',
        update
      );
    });

    it('should update onboarding preferences', async () => {
      const onboardingUpdate = { tour_completed: true, tour_step: 5 };
      const updated = {
        ...mockUserPreferences,
        onboarding: { ...mockUserPreferences.onboarding, ...onboardingUpdate }
      };
      mockClient.patch.mockResolvedValue(updated);

      const result = await userPrefService.updateOnboardingPreferences(onboardingUpdate);

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences/onboarding',
        onboardingUpdate
      );
    });

    it('should reset onboarding tour', async () => {
      const reset = {
        ...mockUserPreferences,
        onboarding: { tour_completed: false, tour_step: 0, tour_dismissed: false }
      };
      mockClient.post.mockResolvedValue(reset);

      const result = await userPrefService.resetOnboardingTour();

      expect(result).toEqual(reset);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences/onboarding/reset'
      );
    });

    it('should update theme', async () => {
      const updated = { ...mockUserPreferences, theme: 'ocean' };
      mockClient.patch.mockResolvedValue(updated);

      const result = await userPrefService.updateTheme('ocean');

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences',
        { theme: 'ocean' }
      );
    });
  });

  describe('PromptsService', () => {
    let promptsService: PromptsService;

    beforeEach(() => {
      promptsService = createPromptsService(mockClient);
    });

    it('should get paginated prompts', async () => {
      const paginatedResponse = mockPaginatedResponse(mockPrompts);
      mockClient.get.mockResolvedValue(paginatedResponse);

      const result = await promptsService.getPrompts();

      expect(result).toEqual(paginatedResponse);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/prompts', {
        query: undefined
      });
    });

    it('should get prompts with query parameters', async () => {
      const query = {
        page: 2,
        limit: 10,
        search: 'code',
        tags: ['review', 'code'],
        is_public: true
      };
      mockClient.get.mockResolvedValue(mockPaginatedResponse(mockPrompts));

      await promptsService.getPrompts(query);

      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/prompts', {
        query
      });
    });

    it('should get single prompt', async () => {
      const prompt = mockPrompts[0];
      mockClient.get.mockResolvedValue(prompt);

      const result = await promptsService.getPrompt('prompt-1');

      expect(result).toEqual(prompt);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/prompts/prompt-1');
    });

    it('should create new prompt', async () => {
      const input = {
        title: 'New Prompt',
        content: 'New content: {{variable}}',
        tags: ['new'],
        is_public: false
      };
      const created = { ...input, id: 'new-prompt' };
      mockClient.post.mockResolvedValue(created);

      const result = await promptsService.createPrompt(input);

      expect(result).toEqual(created);
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/prompts', input);
    });

    it('should update prompt', async () => {
      const update = { title: 'Updated Title' };
      const updated = { ...mockPrompts[0], ...update };
      mockClient.patch.mockResolvedValue(updated);

      const result = await promptsService.updatePrompt('prompt-1', update);

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith('/api/v1/prompts/prompt-1', update);
    });

    it('should delete prompt', async () => {
      mockClient.delete.mockResolvedValue(undefined);

      await promptsService.deletePrompt('prompt-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/api/v1/prompts/prompt-1');
    });

    it('should clone prompt', async () => {
      const cloned = { ...mockPrompts[0], id: 'cloned-prompt', title: 'Cloned Title' };
      mockClient.post.mockResolvedValue(cloned);

      const result = await promptsService.clonePrompt('prompt-1', 'Cloned Title');

      expect(result).toEqual(cloned);
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/prompts/prompt-1/clone', {
        title: 'Cloned Title'
      });
    });

    it('should run prompt', async () => {
      const runInput = {
        variables: { code: 'test code' },
        model_id: '1',
        temperature: 0.7
      };
      mockClient.post.mockResolvedValue(mockPromptRunResult);

      const result = await promptsService.runPrompt('prompt-1', runInput);

      expect(result).toEqual(mockPromptRunResult);
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/prompts/prompt-1/run', runInput);
    });

    it('should get prompt run history', async () => {
      const runsResponse = mockPaginatedResponse([mockPromptRunResult]);
      mockClient.get.mockResolvedValue(runsResponse);

      const result = await promptsService.getPromptRuns('prompt-1', { page: 1, limit: 10 });

      expect(result).toEqual(runsResponse);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/prompts/prompt-1/runs', {
        query: { page: 1, limit: 10 }
      });
    });

    it('should share prompt', async () => {
      const shareResponse = {
        share_token: 'abc123',
        share_url: 'https://app.com/s/abc123'
      };
      mockClient.post.mockResolvedValue(shareResponse);

      const result = await promptsService.sharePrompt('prompt-1');

      expect(result).toEqual(shareResponse);
      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/prompts/prompt-1/share');
    });

    it('should search prompts', async () => {
      const searchResults = mockPaginatedResponse(mockPrompts);
      mockClient.get.mockResolvedValue(searchResults);

      const result = await promptsService.searchPrompts('code review', {
        is_public: true,
        limit: 5
      });

      expect(result).toEqual(searchResults);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/prompts', {
        query: {
          search: 'code review',
          is_public: true,
          limit: 5
        }
      });
    });
  });
});
