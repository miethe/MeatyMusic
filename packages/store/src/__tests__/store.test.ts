import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  useOnboardingStore,
  usePreferencesStore,
} from '../index';

const mockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().resetOnboarding();
  });

  it('updates step and total', () => {
    useOnboardingStore.getState().setOnboardingStep(2, 5);
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(2);
    expect(state.totalSteps).toBe(5);
  });
});

describe('preferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      theme: 'light',
      communicationOptIn: false,
      notifications: { email_updates: false, prompt_shares: false },
    });
  });

  it('updates theme', () => {
    usePreferencesStore.getState().setTheme('dark');
    expect(usePreferencesStore.getState().theme).toBe('dark');
  });

  it('persists to localStorage', () => {
    const ls = mockStorage();
    vi.stubGlobal('localStorage', ls);
    vi.stubGlobal('window', { localStorage: ls } as any);
    vi.useFakeTimers();
    usePreferencesStore.getState().setTheme('ocean');
    vi.advanceTimersByTime(300);
    expect(ls.getItem('preferences')).toContain('ocean');
    vi.useRealTimers();
  });

  it('syncs to API', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    usePreferencesStore.getState().setTheme('sand');
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
