import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createApiSyncMiddleware } from '../middleware/apiSyncMiddleware';
import { createLocalStorageMiddleware } from '../middleware/localStorageMiddleware';
import type { OnboardingStore } from '../types';

const creator: StateCreator<OnboardingStore> = (set) => ({
  isActive: false,
  currentStep: 0,
  totalSteps: 0,
  isCompleted: false,
  isDismissed: false,
  completedAt: null,
  setOnboardingStep: (step, totalSteps) =>
    set((state) => {
      const newTotalSteps = typeof totalSteps === 'number' && totalSteps > 0 ? totalSteps : state.totalSteps;
      const clampedStep = Math.max(0, Math.min(step, newTotalSteps));
      return {
        currentStep: clampedStep,
        totalSteps: newTotalSteps,
        isActive: true,
      };
    }),
  completeOnboarding: () =>
    set({ isActive: false, isCompleted: true, completedAt: new Date().toISOString() }),
  dismissOnboarding: () => set({ isActive: false, isDismissed: true }),
  resetOnboarding: () =>
    set({
      isActive: false,
      currentStep: 0,
      totalSteps: 0,
      isCompleted: false,
      isDismissed: false,
      completedAt: null,
    }),
});

const withMiddleware = (config: StateCreator<OnboardingStore>) =>
  createApiSyncMiddleware<OnboardingStore>({
    endpoint: '/api/v1/users/me/onboarding',
  })(createLocalStorageMiddleware<OnboardingStore>('onboarding')(config));

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(withMiddleware(creator), {
    enabled: process.env.NODE_ENV === 'development',
    name: 'onboardingStore',
  })
);
