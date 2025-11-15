import type { StateCreator } from 'zustand';

import { sleep } from '../utils';

interface ApiSyncOptions {
  endpoint: string;
  debounceMs?: number;
  retries?: number;
}

export const createApiSyncMiddleware = <T extends object>({
  endpoint,
  debounceMs = 1000,
  retries = 3,
}: ApiSyncOptions) => {
  return (config: StateCreator<T>): StateCreator<T> => (set, get, api) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = async (state: T) => {
      const correlationId = generateCorrelationId();
      if (process.env.NODE_ENV === 'development') {
        console.log('middleware.sync.start', { endpoint, correlationId });
      }
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-correlation-id': correlationId,
            },
            body: JSON.stringify(state),
          });
          if (!res.ok) throw new Error(`API ${res.status}`);
          if (process.env.NODE_ENV === 'development') {
            console.log('middleware.sync.success', { endpoint, correlationId });
          }
          return;
        } catch (error) {
          console.error('middleware.sync.error', {
            endpoint,
            correlationId,
            attempt,
            error,
          });
          if (attempt < retries - 1) {
            await sleep(Math.pow(2, attempt) * 1000);
          }
        }
      }
    };

    return config(
      (state, ...args) => {
        set(state, ...args);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          sync(get());
        }, debounceMs);
      },
      get,
      api
    );
  };
};

/**
 * Generate a unique correlation ID for tracking requests.
 * Uses crypto.randomUUID in supported environments, falls back to a random string.
 */
function generateCorrelationId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}
