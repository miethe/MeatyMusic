/**
 * @fileoverview Integration tests for theme sync circuit breaker flow
 *
 * Tests the complete flow of theme synchronization with circuit breaker protection
 * to ensure no METHOD_BINDING_ERROR cascades occur during theme operations.
 */

import { ApiClient, createApiClient } from '../client/base-client';
import { UserPreferencesService, createUserPreferencesService } from '../services/user-preferences';
import { CircuitBreakerFactory, CircuitState, CircuitBreakerError } from '../utils/circuitBreaker';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Theme Sync Integration with Circuit Breaker', () => {
  let apiClient: ApiClient;
  let userPreferencesService: UserPreferencesService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();

    // Clear all circuit breakers before each test
    CircuitBreakerFactory.clearAll();

    // Create API client with test configuration
    apiClient = createApiClient({
      baseUrl: 'http://test-api',
      timeout: 5000,
      getAuthToken: async () => 'test-token'
    });

    userPreferencesService = createUserPreferencesService(apiClient);
  });

  afterEach(() => {
    // Reset all circuit breakers after each test
    CircuitBreakerFactory.forceResetAll();
    CircuitBreakerFactory.clearAll();
  });

  describe('Normal Theme Sync Flow', () => {
    it('should successfully sync theme when API is healthy', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'user1',
          user_id: 'user1',
          theme: 'dark',
          onboarding: { tour_completed: true, tour_step: 0, tour_dismissed: false },
          communication_opt_in: true,
          notifications: { email_updates: true, prompt_shares: false, collection_invites: true, system_announcements: true },
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await userPreferencesService.updateTheme('dark');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api/api/v1/users/me/preferences',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ theme: 'dark' })
        })
      );

      expect(result.theme).toBe('dark');
    });

    it('should handle 404 responses gracefully', async () => {
      // Mock 404 response (user has no preferences yet)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: { message: 'User preferences not found', code: 'NOT_FOUND' }
        }),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      await expect(userPreferencesService.getUserPreferences()).rejects.toThrow();

      // Circuit breaker should remain closed for 404s in normal cases
      const userPrefsBreaker = CircuitBreakerFactory.createUserPreferencesBreaker();
      expect(userPrefsBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Method Binding Error Prevention', () => {
    it('should prevent cascade when method binding fails', async () => {
      // Force method binding circuit breaker open to simulate binding issues
      const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
      methodBindingBreaker.forceOpen(5000);

      expect(methodBindingBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Attempt to use user preferences service - should be blocked by circuit breaker
      await expect(
        userPreferencesService.getUserPreferences()
      ).rejects.toThrow('API client method binding circuit breaker is open');

      // No network call should have been made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should open method binding circuit breaker on binding errors', async () => {
      const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();

      // Simulate method binding error directly through the circuit breaker
      try {
        await methodBindingBreaker.execute(async () => {
          throw new Error('METHOD_BINDING_ERROR: get method is not available');
        });
      } catch {
        // Expected to fail
      }

      // Method binding circuit breaker should now be open (failureThreshold is 1)
      expect(methodBindingBreaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(methodBindingBreaker.getMetrics().failureCount).toBe(1);
    });
  });

  describe('Theme Sync Circuit Breaker', () => {
    it('should open theme sync circuit breaker after repeated failures', async () => {
      const themeSyncBreaker = CircuitBreakerFactory.createThemeSyncBreaker();

      // Directly simulate failures to avoid network timeouts
      for (let i = 0; i < 3; i++) {
        try {
          await themeSyncBreaker.execute(async () => {
            throw new Error('Simulated theme sync error');
          });
        } catch {
          // Expected failures
        }
      }

      expect(themeSyncBreaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(themeSyncBreaker.getMetrics().failureCount).toBe(3);
    }, 10000);

    it('should prevent theme sync when circuit is open', async () => {
      const themeSyncBreaker = CircuitBreakerFactory.createThemeSyncBreaker();

      // Force circuit open
      themeSyncBreaker.forceOpen(5000);

      // Attempt to sync theme through circuit breaker
      await expect(
        themeSyncBreaker.execute(async () => {
          return userPreferencesService.updateTheme('dark');
        })
      ).rejects.toThrow(CircuitBreakerError);

      // No network call should have been made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should recover from half-open state on success', async () => {
      const themeSyncBreaker = CircuitBreakerFactory.createThemeSyncBreaker();

      // Force circuit open then manually set to half-open for testing
      themeSyncBreaker.forceOpen(0); // 0 timeout means immediate recovery attempt

      // Wait for transition to half-open (should be immediate with 0 timeout)
      await new Promise(resolve => setTimeout(resolve, 10));

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'user1',
          user_id: 'user1',
          theme: 'dark',
          onboarding: { tour_completed: true, tour_step: 0, tour_dismissed: false },
          communication_opt_in: true,
          notifications: { email_updates: true, prompt_shares: false, collection_invites: true, system_announcements: true },
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }),
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      // Successful execution should close the circuit
      const result = await themeSyncBreaker.execute(async () => {
        return userPreferencesService.updateTheme('dark');
      });

      expect(result.theme).toBe('dark');
      expect(themeSyncBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
    });
  });

  describe('User Preferences Circuit Breaker', () => {
    it('should handle user preferences failures gracefully', async () => {
      const userPrefsBreaker = CircuitBreakerFactory.createUserPreferencesBreaker();

      // Directly simulate failures to avoid network timeouts
      for (let i = 0; i < 3; i++) {
        try {
          await userPrefsBreaker.execute(async () => {
            throw new Error('Simulated server error');
          });
        } catch {
          // Expected failures
        }
      }

      expect(userPrefsBreaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(userPrefsBreaker.getMetrics().failureCount).toBe(3);
    }, 10000);

    it('should provide graceful degradation when user preferences circuit is open', async () => {
      const userPrefsBreaker = CircuitBreakerFactory.createUserPreferencesBreaker();

      // Force circuit open
      userPrefsBreaker.forceOpen(10000);

      // Circuit breaker should prevent execution
      await expect(
        userPrefsBreaker.execute(async () => {
          return userPreferencesService.getUserPreferences();
        })
      ).rejects.toThrow(CircuitBreakerError);

      // This simulates how hooks should handle the circuit breaker error
      // by returning null/default data for graceful degradation
      let preferences = null;
      try {
        preferences = await userPrefsBreaker.execute(async () => {
          return userPreferencesService.getUserPreferences();
        });
      } catch (error) {
        if (error instanceof CircuitBreakerError) {
          console.warn('User preferences circuit breaker is open, using graceful degradation');
          preferences = null; // Graceful degradation
        }
      }

      expect(preferences).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Circuit Breaker Coordination', () => {
    it('should coordinate multiple circuit breakers without interference', async () => {
      const methodBindingBreaker = CircuitBreakerFactory.createMethodBindingBreaker();
      const userPrefsBreaker = CircuitBreakerFactory.createUserPreferencesBreaker();
      const themeSyncBreaker = CircuitBreakerFactory.createThemeSyncBreaker();

      // All should start closed
      expect(methodBindingBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(userPrefsBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(themeSyncBreaker.getMetrics().state).toBe(CircuitState.CLOSED);

      // Open method binding breaker
      methodBindingBreaker.forceOpen(5000);

      // Other breakers should remain closed
      expect(methodBindingBreaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(userPrefsBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(themeSyncBreaker.getMetrics().state).toBe(CircuitState.CLOSED);

      // Each breaker should operate independently
      expect(CircuitBreakerFactory.getAllMetrics()).toHaveLength(3);
    });
  });
});
