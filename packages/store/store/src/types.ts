export interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isDismissed: boolean;
  completedAt: string | null;
}

export interface OnboardingActions {
  setOnboardingStep: (step: number, totalSteps?: number) => void;
  completeOnboarding: () => void;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;

export interface PreferencesState {
  theme: 'light' | 'dark' | 'ocean' | 'sand';
  communicationOptIn: boolean;
  notifications: {
    email_updates: boolean;
    prompt_shares: boolean;
  };
}

export interface PreferencesActions {
  setTheme: (theme: PreferencesState['theme']) => void;
  updateNotifications: (partial: Partial<PreferencesState['notifications']>) => void;
  toggleCommunicationOptIn: () => void;
}

export type PreferencesStore = PreferencesState & PreferencesActions;
