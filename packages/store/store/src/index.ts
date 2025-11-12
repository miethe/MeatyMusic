import { useOnboardingStore } from './stores/onboardingStore';
import { usePreferencesStore } from './stores/preferencesStore';
import type {
  OnboardingState,
  OnboardingStore,
  PreferencesState,
  PreferencesStore,
} from './types';

export {
  useOnboardingStore,
  usePreferencesStore,
};

export type {
  OnboardingState,
  OnboardingStore,
  PreferencesState,
  PreferencesStore,
};

export const useOnboardingState = () =>
  useOnboardingStore((state: OnboardingState) => state);
export const usePreferences = () =>
  usePreferencesStore((state: PreferencesState) => state);
export const useTheme = () =>
  usePreferencesStore((state: PreferencesState) => state.theme);
