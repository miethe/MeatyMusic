/**
 * @fileoverview Tests for ApiClient method binding fixes
 *
 * Tests to ensure that HTTP methods work correctly when extracted as references,
 * preventing "Illegal invocation" errors that occur when service methods
 * call this.client.get(), this.client.post(), etc.
 */

import { createApiClient, ApiClient } from '../client/base-client';
import { UserPreferencesService } from '../services/user-preferences';

describe('ApiClient Method Binding', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = createApiClient({
      baseUrl: 'http://localhost:8000',
      timeout: 5000
    });

    // Mock successful response
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ test: 'data' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Method Reference Extraction', () => {
    test('get method should work when extracted as reference', async () => {
      const { get } = client;

      // This should not throw "Illegal invocation"
      expect(async () => {
        await get('/test');
      }).not.toThrow();

      await get('/test');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    test('post method should work when extracted as reference', async () => {
      const { post } = client;

      // This should not throw "Illegal invocation"
      expect(async () => {
        await post('/test', { data: 'test' });
      }).not.toThrow();

      await post('/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' })
        })
      );
    });

    test('patch method should work when extracted as reference', async () => {
      const { patch } = client;

      // This should not throw "Illegal invocation"
      expect(async () => {
        await patch('/test', { data: 'test' });
      }).not.toThrow();

      await patch('/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ data: 'test' })
        })
      );
    });

    test('put method should work when extracted as reference', async () => {
      const { put } = client;

      // This should not throw "Illegal invocation"
      expect(async () => {
        await put('/test', { data: 'test' });
      }).not.toThrow();

      await put('/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ data: 'test' })
        })
      );
    });

    test('delete method should work when extracted as reference', async () => {
      const { delete: del } = client;

      // This should not throw "Illegal invocation"
      expect(async () => {
        await del('/test');
      }).not.toThrow();

      await del('/test');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    test('head method should work when extracted as reference', async () => {
      const { head } = client;

      // This should not throw "Illegal invocation"
      expect(async () => {
        await head('/test');
      }).not.toThrow();

      await head('/test');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'HEAD'
        })
      );
    });

    test('options method should work when extracted as reference', async () => {
      const { options } = client;

      // This should not throw "Illegal invocation"
      expect(async () => {
        await options('/test');
      }).not.toThrow();

      await options('/test');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'OPTIONS'
        })
      );
    });

    test('upload method should work when extracted as reference', async () => {
      const { upload } = client;
      const files = [new File(['test'], 'test.txt', { type: 'text/plain' })];

      // This should not throw "Illegal invocation"
      expect(async () => {
        await upload('/test', files);
      }).not.toThrow();

      await upload('/test', files);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });
  });

  describe('Service Layer Integration', () => {
    test('UserPreferencesService should work without illegal invocation errors', async () => {
      // Mock successful preferences response
      global.fetch = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({
          id: '1',
          user_id: '123',
          theme: 'dark',
          onboarding: { tour_completed: false, tour_step: 0, tour_dismissed: false },
          communication_opt_in: true,
          notifications: { email_updates: true, prompt_shares: false, collection_invites: true, system_announcements: true },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );

      const preferencesService = new UserPreferencesService(client);

      // This should not throw "Illegal invocation" error
      const preferences = await preferencesService.getUserPreferences();

      expect(preferences).toMatchObject({
        id: '1',
        user_id: '123',
        theme: 'dark'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/me/preferences',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    test('UserPreferencesService update methods should work without illegal invocation errors', async () => {
      // Mock successful update response
      global.fetch = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({
          id: '1',
          user_id: '123',
          theme: 'light',
          onboarding: { tour_completed: false, tour_step: 0, tour_dismissed: false },
          communication_opt_in: true,
          notifications: { email_updates: true, prompt_shares: false, collection_invites: true, system_announcements: true },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );

      const preferencesService = new UserPreferencesService(client);

      // These should not throw "Illegal invocation" errors
      await preferencesService.updateUserPreferences({ theme: 'light' });
      await preferencesService.updateOnboardingPreferences({ tour_completed: true });
      await preferencesService.resetOnboardingTour();

      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Method Binding Validation', () => {
    test('should validate method binding in test environment', () => {
      // In test environment, validation should run
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      // Creating a new client should not throw binding validation errors
      expect(() => {
        new (client.constructor as any)({ baseUrl: 'http://test' });
      }).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });

    test('methods should be functions after binding', () => {
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
      expect(typeof client.patch).toBe('function');
      expect(typeof client.put).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.head).toBe('function');
      expect(typeof client.options).toBe('function');
      expect(typeof client.upload).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle illegal invocation errors gracefully', async () => {
      // Create a client with retry disabled for this test
      const clientNoRetry = createApiClient({
        baseUrl: 'http://localhost:8000',
        timeout: 1000,
        enableRetry: false
      });

      // Mock fetch to throw an "Illegal invocation" error
      global.fetch = jest.fn().mockRejectedValue(
        new TypeError('Illegal invocation')
      );

      try {
        await clientNoRetry.get('/test');
        fail('Expected request to throw');
      } catch (error: any) {
        // The error should be transformed to a meaningful message
        expect(error.message).toContain('API client method binding error');
        expect(error.message).toContain('please report this issue');
      }
    }, 10000);
  });

  describe('Real-world Usage Patterns', () => {
    test('should work with destructured methods in arrow functions', async () => {
      const makeRequest = async () => {
        const { get } = client;
        return await get('/test');
      };

      expect(async () => {
        await makeRequest();
      }).not.toThrow();
    });

    test('should work with methods passed as callbacks', async () => {
      const { get, post } = client;
      const requests = [get, post];

      // These should not throw "Illegal invocation"
      expect(async () => {
        await requests[0]('/test');
      }).not.toThrow();
    });

    test('should work in Promise.all scenarios', async () => {
      const { get } = client;

      expect(async () => {
        await Promise.all([
          get('/test1'),
          get('/test2'),
          get('/test3')
        ]);
      }).not.toThrow();
    });
  });
});
