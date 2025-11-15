import type { StateCreator } from 'zustand';

import { debounce } from '../utils';

export const createLocalStorageMiddleware = <T extends object>(
  key: string,
  debounceMs = 300
) => {
  return (config: StateCreator<T>): StateCreator<T> => (set, get, api) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(key);
        if (stored) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(stored);
          } catch (e) {
            console.error('store.hydrate.parse.error', { key, error: e });
            parsed = undefined;
          }
          // Validate that parsed is a plain object
          if (
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed)
          ) {
            set({ ...get(), ...(parsed as Partial<T>) }, true);
            if (process.env.NODE_ENV === 'development') {
              console.log('store.hydrate', { key });
            }
          } else {
            console.warn('store.hydrate.invalid', { key, parsed });
          }
        }
      } catch (error) {
        console.error('store.hydrate.error', { key, error });
      }
    }

    const persist = debounce((state: T) => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('middleware.sync.start', { key });
        }
        window.localStorage.setItem(key, JSON.stringify(state));
        if (process.env.NODE_ENV === 'development') {
          console.log('middleware.sync.success', { key });
        }
      } catch (error) {
        console.error('middleware.sync.error', { key, error });
      }
    }, debounceMs);

    return config(
      (state, ...args) => {
        set(state, ...args);
        persist(get());
      },
      get,
      api
    );
  };
};
