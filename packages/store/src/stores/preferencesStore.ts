import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createApiSyncMiddleware } from '../middleware/apiSyncMiddleware';
import { createLocalStorageMiddleware } from '../middleware/localStorageMiddleware';
import type { PreferencesStore } from '../types';

const creator: StateCreator<PreferencesStore> = (set) => ({
  theme: 'light',
  communicationOptIn: false,
  notifications: {
    email_updates: false,
    prompt_shares: false,
  },
  setTheme: (theme) => set({ theme }),
  updateNotifications: (partial) =>
    set((state) => ({
      notifications: { ...state.notifications, ...partial },
    })),
  toggleCommunicationOptIn: () =>
    set((state) => ({ communicationOptIn: !state.communicationOptIn })),
});

const withMiddleware = (config: StateCreator<PreferencesStore>) =>
  createApiSyncMiddleware<PreferencesStore>({
    endpoint: '/api/v1/users/me/preferences',
  })(createLocalStorageMiddleware<PreferencesStore>('preferences')(config));

export const usePreferencesStore = create<PreferencesStore>()(
  devtools(withMiddleware(creator), {
    enabled: process.env.NODE_ENV === 'development',
    name: 'preferencesStore',
  })
);
