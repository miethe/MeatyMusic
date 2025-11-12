/**
 * @fileoverview Integration test specifically for the UserPreferences issue
 *
 * This test replicates the exact scenario that was failing with "Illegal invocation"
 * errors in the UserPreferencesService.getUserPreferences() method at line 74.
 */

import { createApiClient } from '../client/base-client';
import { UserPreferencesService } from '../services/user-preferences';

describe('UserPreferences Integration Fix', () => {
  test('UserPreferencesService.getUserPreferences() should work without illegal invocation', async () => {
    // Create client exactly as it would be used in the app
    const client = createApiClient({
      baseUrl: 'http://localhost:8000',
      timeout: 5000
    });

    // Mock successful preferences response
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: '1',
        user_id: '123',
        theme: 'dark',
        onboarding: {
          tour_completed: false,
          tour_step: 0,
          tour_dismissed: false
        },
        communication_opt_in: true,
        notifications: {
          email_updates: true,
          prompt_shares: false,
          collection_invites: true,
          system_announcements: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    // Create the service exactly as it would be created in the app
    const userPreferencesService = new UserPreferencesService(client);

    // This call was failing with "Illegal invocation" at line 74 in user-preferences.ts
    // The issue was that this.client.get() lost its 'this' context
    const preferences = await userPreferencesService.getUserPreferences();

    // Verify the call succeeded
    expect(preferences).toMatchObject({
      id: '1',
      user_id: '123',
      theme: 'dark'
    });

    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/users/me/preferences',
      expect.objectContaining({
        method: 'GET'
      })
    );
  });

  test('All UserPreferencesService methods should work without illegal invocation', async () => {
    const client = createApiClient({
      baseUrl: 'http://localhost:8000',
      timeout: 5000
    });

    // Mock successful response for all calls
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: '1',
        user_id: '123',
        theme: 'light',
        onboarding: { tour_completed: true, tour_step: 5, tour_dismissed: false },
        communication_opt_in: false,
        notifications: { email_updates: false, prompt_shares: true, collection_invites: false, system_announcements: true },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const userPreferencesService = new UserPreferencesService(client);

    // Test all methods that use this.client.method() calls
    await userPreferencesService.getUserPreferences(); // Line 74: this.client.get
    await userPreferencesService.updateUserPreferences({ theme: 'light' }); // Line 81: this.client.patch
    await userPreferencesService.updateOnboardingPreferences({ tour_completed: true }); // Line 93: this.client.patch
    await userPreferencesService.resetOnboardingTour(); // Line 103: this.client.post

    // All calls should succeed without throwing "Illegal invocation"
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  test('Method destructuring should work (common React pattern)', async () => {
    const client = createApiClient({
      baseUrl: 'http://localhost:8000',
      timeout: 5000
    });

    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ test: 'data' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    // This is a common pattern in React components where methods get destructured
    const { get, post, patch } = client;

    // These calls should not throw "Illegal invocation"
    await get('/api/test');
    await post('/api/test', { data: 'test' });
    await patch('/api/test', { data: 'update' });

    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
