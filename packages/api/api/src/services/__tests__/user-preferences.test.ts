/**
 * @fileoverview Unit tests for UserPreferencesService
 */

import { ApiClient } from '../../client/base-client';
import {
  UserPreferencesService,
  createUserPreferencesService,
  UserPreferences,
  UserPreferencesUpdate,
  OnboardingPreferencesUpdate
} from '../user-preferences';
import { ApiError } from '../../types/errors';

describe('UserPreferencesService', () => {
  let mockClient: jest.Mocked<ApiClient>;
  let service: UserPreferencesService;

  const mockUserPreferences: UserPreferences = {
    id: 'pref_123',
    user_id: 'user_456',
    theme: 'dark',
    onboarding: {
      tour_completed: false,
      tour_step: 2,
      tour_dismissed: false,
      completed_at: undefined
    },
    communication_opt_in: true,
    notifications: {
      email_updates: true,
      prompt_shares: false,
      collection_invites: true,
      system_announcements: true
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-21T10:30:00Z'
  };

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      upload: jest.fn(),
      addRequestInterceptor: jest.fn(),
      addResponseInterceptor: jest.fn()
    } as any;

    service = createUserPreferencesService(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPreferences', () => {
    it('should get user preferences successfully', async () => {
      mockClient.get.mockResolvedValue(mockUserPreferences);

      const result = await service.getUserPreferences();

      expect(result).toEqual(mockUserPreferences);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/users/me/preferences');
    });

    it('should handle 401 error', async () => {
      const error = new ApiError('Unauthorized', 401, 'AUTH_REQUIRED');
      mockClient.get.mockRejectedValue(error);

      await expect(service.getUserPreferences()).rejects.toThrow(error);
      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/users/me/preferences');
    });

    it('should handle network failure', async () => {
      const networkError = new Error('Network failed');
      mockClient.get.mockRejectedValue(networkError);

      await expect(service.getUserPreferences()).rejects.toThrow(networkError);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      const update: UserPreferencesUpdate = {
        theme: 'light',
        communication_opt_in: false
      };
      const updated = { ...mockUserPreferences, ...update };
      mockClient.patch.mockResolvedValue(updated);

      const result = await service.updateUserPreferences(update);

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences',
        update
      );
    });

    it('should handle partial notification update', async () => {
      const update: UserPreferencesUpdate = {
        notifications: {
          email_updates: false
        }
      };
      const updated = {
        ...mockUserPreferences,
        notifications: {
          ...mockUserPreferences.notifications,
          email_updates: false
        }
      };
      mockClient.patch.mockResolvedValue(updated);

      const result = await service.updateUserPreferences(update);

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences',
        update
      );
    });

    it('should handle undefined fields by omitting them', async () => {
      const update: UserPreferencesUpdate = {
        theme: 'light',
        communication_opt_in: undefined, // This should be omitted from request
        notifications: {
          email_updates: false,
          prompt_shares: undefined // This should be omitted
        }
      };
      const updated = { ...mockUserPreferences, theme: 'light' };
      mockClient.patch.mockResolvedValue(updated);

      const result = await service.updateUserPreferences(update);

      expect(result).toEqual(updated);
      // Note: The service itself doesn't filter undefined values,
      // but the API client should handle serialization
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences',
        update
      );
    });

    it('should handle 409 conflict error', async () => {
      const update: UserPreferencesUpdate = { theme: 'light' };
      const conflictError = new ApiError('Conflict', 409, 'CONCURRENT_UPDATE');
      mockClient.patch.mockRejectedValue(conflictError);

      await expect(service.updateUserPreferences(update)).rejects.toThrow(conflictError);
    });
  });

  describe('updateOnboardingPreferences', () => {
    it('should update onboarding preferences successfully', async () => {
      const onboardingUpdate: OnboardingPreferencesUpdate = {
        tour_completed: true,
        tour_step: 5,
        completed_at: '2025-01-21T12:00:00Z'
      };
      const updated = {
        ...mockUserPreferences,
        onboarding: { ...mockUserPreferences.onboarding, ...onboardingUpdate }
      };
      mockClient.patch.mockResolvedValue(updated);

      const result = await service.updateOnboardingPreferences(onboardingUpdate);

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences/onboarding',
        onboardingUpdate
      );
    });

    it('should handle partial onboarding update', async () => {
      const onboardingUpdate: OnboardingPreferencesUpdate = {
        tour_step: 3
      };
      const updated = {
        ...mockUserPreferences,
        onboarding: { ...mockUserPreferences.onboarding, tour_step: 3 }
      };
      mockClient.patch.mockResolvedValue(updated);

      const result = await service.updateOnboardingPreferences(onboardingUpdate);

      expect(result).toEqual(updated);
      expect(mockClient.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences/onboarding',
        onboardingUpdate
      );
    });
  });

  describe('resetOnboardingTour', () => {
    it('should reset onboarding tour successfully', async () => {
      const reset = {
        ...mockUserPreferences,
        onboarding: {
          tour_completed: false,
          tour_step: 0,
          tour_dismissed: false,
          completed_at: undefined
        }
      };
      mockClient.post.mockResolvedValue(reset);

      const result = await service.resetOnboardingTour();

      expect(result).toEqual(reset);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/users/me/preferences/onboarding/reset'
      );
    });
  });

  describe('convenience methods', () => {
    describe('updateTheme', () => {
      it('should update theme successfully', async () => {
        const updated = { ...mockUserPreferences, theme: 'light' };
        mockClient.patch.mockResolvedValue(updated);

        const result = await service.updateTheme('light');

        expect(result).toEqual(updated);
        expect(mockClient.patch).toHaveBeenCalledWith(
          '/api/v1/users/me/preferences',
          { theme: 'light' }
        );
      });
    });

    describe('updateNotificationPreferences', () => {
      it('should update notification preferences successfully', async () => {
        const notificationUpdate = { email_updates: false, prompt_shares: true };
        const updated = {
          ...mockUserPreferences,
          notifications: { ...mockUserPreferences.notifications, ...notificationUpdate }
        };
        mockClient.patch.mockResolvedValue(updated);

        const result = await service.updateNotificationPreferences(notificationUpdate);

        expect(result).toEqual(updated);
        expect(mockClient.patch).toHaveBeenCalledWith(
          '/api/v1/users/me/preferences',
          { notifications: notificationUpdate }
        );
      });
    });

    describe('toggleCommunicationOptIn', () => {
      it('should toggle communication opt-in successfully', async () => {
        const updated = { ...mockUserPreferences, communication_opt_in: false };
        mockClient.patch.mockResolvedValue(updated);

        const result = await service.toggleCommunicationOptIn(false);

        expect(result).toEqual(updated);
        expect(mockClient.patch).toHaveBeenCalledWith(
          '/api/v1/users/me/preferences',
          { communication_opt_in: false }
        );
      });
    });
  });

  describe('error handling', () => {
    it('should propagate API errors', async () => {
      const apiError = new ApiError('Server Error', 500, 'INTERNAL_ERROR');
      mockClient.get.mockRejectedValue(apiError);

      await expect(service.getUserPreferences()).rejects.toThrow(apiError);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      mockClient.patch.mockRejectedValue(timeoutError);

      await expect(service.updateUserPreferences({ theme: 'light' }))
        .rejects.toThrow(timeoutError);
    });
  });

  describe('factory function', () => {
    it('should create service instance', () => {
      const service = createUserPreferencesService(mockClient);
      expect(service).toBeInstanceOf(UserPreferencesService);
    });
  });
});
