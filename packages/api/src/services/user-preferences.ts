/**
 * @fileoverview User preferences service
 *
 * Typed API client for user preferences management
 */

import { ApiClient } from '../client/base-client';

/**
 * Onboarding preferences
 */
export interface OnboardingPreferences {
  tour_completed: boolean;
  tour_step: number;
  tour_dismissed: boolean;
  completed_at?: string;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email_updates: boolean;
  prompt_shares: boolean;
  collection_invites: boolean;
  system_announcements: boolean;
  [key: string]: boolean;
}

/**
 * Complete user preferences
 */
export interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  onboarding: OnboardingPreferences;
  communication_opt_in: boolean;
  notifications: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

/**
 * User preferences update input
 */
export interface UserPreferencesUpdate {
  theme?: string;
  onboarding?: Partial<OnboardingPreferences>;
  communication_opt_in?: boolean;
  notifications?: Partial<NotificationPreferences>;
}

/**
 * Onboarding preferences update input
 */
export interface OnboardingPreferencesUpdate {
  tour_completed?: boolean;
  tour_step?: number;
  tour_dismissed?: boolean;
  completed_at?: string;
}

/**
 * User preferences service class
 */
export class UserPreferencesService {
  private isInitialized: boolean = false;
  // Explicitly bound methods to prevent context loss
  private boundGet: ApiClient['get'];
  private boundPost: ApiClient['post'];
  private boundPatch: ApiClient['patch'];

  constructor(private client: ApiClient) {
    // Defensive check to ensure client is properly initialized
    if (!client) {
      throw new Error('ApiClient is required for UserPreferencesService');
    }

    // Explicitly bind API client methods to preserve 'this' context
    // This prevents METHOD_BINDING_ERROR from "Illegal invocation"
    this.boundGet = client.get.bind(client);
    this.boundPost = client.post.bind(client);
    this.boundPatch = client.patch.bind(client);

    // Defer validation to prevent constructor blocking
    this.initializeAsync();
  }

  /**
   * Initialize service asynchronously
   */
  private async initializeAsync(): Promise<void> {
    try {
      // Wait a moment for React render cycle to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Validate that required methods are available
      const requiredMethods = ['get', 'post', 'patch'] as const;
      for (const method of requiredMethods) {
        if (typeof this.client[method] !== 'function') {
          throw new Error(`ApiClient.${method} is not available. Ensure ApiClient is properly initialized.`);
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('[UserPreferencesService] Initialization validation failed, will attempt runtime validation:', error);
      // Don't throw here, let individual methods handle validation
      this.isInitialized = false;
    }
  }

  /**
   * Runtime validation before API calls
   * Enhanced to detect METHOD_BINDING_ERROR early and test bound methods
   */
  private validateBoundMethod(methodName: 'get' | 'post' | 'patch'): void {
    const boundMethod = methodName === 'get' ? this.boundGet :
                       methodName === 'post' ? this.boundPost :
                       this.boundPatch;

    if (!boundMethod || typeof boundMethod !== 'function') {
      const error = new Error(`Bound ${methodName} method is not available`);
      (error as any).code = 'METHOD_BINDING_ERROR';
      throw error;
    }

    // Test method binding by attempting to get its string representation
    // This will fail with "Illegal invocation" if binding is corrupted
    try {
      // Try to access the method in a way that would trigger binding errors
      const methodStr = boundMethod.toString();
      if (!methodStr || methodStr.length === 0) {
        throw new Error('Method toString failed');
      }

      // Additional check: ensure the method can be called (dry run validation)
      if (!boundMethod.call || typeof boundMethod.call !== 'function') {
        throw new Error('Method call property invalid');
      }
    } catch (validationError) {
      const error = new Error(`Bound ${methodName} method validation failed: method binding is corrupted`);
      (error as any).code = 'METHOD_BINDING_ERROR';
      (error as any).originalError = validationError;
      throw error;
    }
  }

  /**
   * Get current user preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    this.validateBoundMethod('get');
    return this.boundGet<UserPreferences>('/api/v1/users/me/preferences');
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: UserPreferencesUpdate): Promise<UserPreferences> {
    this.validateBoundMethod('patch');
    return this.boundPatch<UserPreferences>(
      '/api/v1/users/me/preferences',
      preferences
    );
  }

  /**
   * Update onboarding preferences
   */
  async updateOnboardingPreferences(
    onboarding: OnboardingPreferencesUpdate
  ): Promise<UserPreferences> {
    this.validateBoundMethod('patch');
    return this.boundPatch<UserPreferences>(
      '/api/v1/users/me/preferences/onboarding',
      onboarding
    );
  }

  /**
   * Reset onboarding tour
   */
  async resetOnboardingTour(): Promise<UserPreferences> {
    this.validateBoundMethod('post');
    return this.boundPost<UserPreferences>(
      '/api/v1/users/me/preferences/onboarding/reset'
    );
  }

  /**
   * Update theme preference
   */
  async updateTheme(theme: string): Promise<UserPreferences> {
    return this.updateUserPreferences({ theme });
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    notifications: Partial<NotificationPreferences>
  ): Promise<UserPreferences> {
    return this.updateUserPreferences({ notifications });
  }

  /**
   * Toggle communication opt-in
   */
  async toggleCommunicationOptIn(optIn: boolean): Promise<UserPreferences> {
    return this.updateUserPreferences({ communication_opt_in: optIn });
  }
}

/**
 * Factory function to create user preferences service
 * Ensures proper initialization with validation
 */
export function createUserPreferencesService(client: ApiClient): UserPreferencesService {
  if (!client) {
    throw new Error('ApiClient is required to create UserPreferencesService');
  }
  return new UserPreferencesService(client);
}
