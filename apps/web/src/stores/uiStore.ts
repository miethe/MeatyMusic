/**
 * UI Store
 * Global UI state for theme, sidebar, toasts, and transient UI elements
 *
 * Manages:
 * - Theme (dark/light mode)
 * - Sidebar collapsed state
 * - Toast notifications
 * - Global loading states
 *
 * Architecture: Section 4.1 - State Management Boundaries (Zustand for Client State)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number; // ms, default 5000
}

/**
 * UI store state
 */
interface UIState {
  // Theme
  theme: 'dark' | 'light';

  // Sidebar
  sidebarCollapsed: boolean;

  // Toasts
  toasts: Toast[];

  // Global loading
  isLoading: boolean;
  loadingMessage?: string;
}

/**
 * UI store actions
 */
interface UIActions {
  // Theme
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Sidebar
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Toasts
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Loading
  setLoading: (isLoading: boolean, message?: string) => void;

  // Reset
  reset: () => void;
}

/**
 * Initial state
 */
const initialState: UIState = {
  theme: 'dark',
  sidebarCollapsed: false,
  toasts: [],
  isLoading: false,
  loadingMessage: undefined,
};

/**
 * UI store with persistence for theme and sidebar state
 */
export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Theme actions
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      // Sidebar actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      // Toast actions
      addToast: (message, type = 'info', duration = 5000) =>
        set((state) => {
          const id = crypto.randomUUID();
          const toast: Toast = { id, message, type, duration };

          // Auto-remove toast after duration
          if (duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, duration);
          }

          return {
            toasts: [...state.toasts, toast],
          };
        }),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),

      // Loading actions
      setLoading: (isLoading, message) =>
        set({
          isLoading,
          loadingMessage: isLoading ? message : undefined,
        }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'meatymusic-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist theme and sidebar state
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        // Don't persist toasts or loading states
      }),
    }
  )
);

/**
 * Helper hooks for specific UI state
 */
export const useTheme = () => useUIStore((state) => state.theme);
export const useToasts = () => useUIStore((state) => state.toasts);
export const useIsLoading = () => useUIStore((state) => state.isLoading);
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
