/**
 * Auto-save Hook
 * Automatically saves form data to localStorage at regular intervals
 *
 * Features:
 * - Auto-save every N seconds when data changes
 * - Debounced to avoid excessive writes
 * - Restore data from localStorage on mount
 * - Clear localStorage on manual save/submit
 * - Track save status and timestamp
 *
 * @example
 * ```tsx
 * const { isSaved, isSaving, lastSaved, clearSaved } = useAutoSave(
 *   'song-new',
 *   formData,
 *   30000 // 30 seconds
 * );
 *
 * // Clear auto-saved data after successful submit
 * const handleSubmit = async () => {
 *   await saveToAPI(formData);
 *   clearSaved();
 * };
 * ```
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Auto-save state
 */
export interface AutoSaveState {
  /** Whether the data is currently saved */
  isSaved: boolean;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Timestamp of last save */
  lastSaved: Date | null;
  /** Clear saved data from localStorage */
  clearSaved: () => void;
  /** Manually trigger a save */
  save: () => void;
  /** Get saved data from localStorage */
  getSaved: <T>() => T | null;
}

/**
 * Auto-save hook options
 */
export interface UseAutoSaveOptions {
  /** Auto-save interval in milliseconds (default: 30000 = 30s) */
  interval?: number;
  /** Debounce delay before saving (default: 1000ms) */
  debounceDelay?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when data is saved */
  onSave?: () => void;
  /** Callback when data is loaded from localStorage */
  onLoad?: <T>(data: T) => void;
}

/**
 * Generate localStorage key with namespace
 */
function getStorageKey(key: string): string {
  return `meaty-autosave-${key}`;
}

/**
 * Auto-save hook
 *
 * @param key - Unique key for localStorage (e.g., 'song-new', 'style-edit-123')
 * @param data - Data to auto-save
 * @param options - Auto-save options
 * @returns Auto-save state and controls
 */
export function useAutoSave<T>(
  key: string,
  data: T,
  options: UseAutoSaveOptions = {}
): AutoSaveState {
  const {
    interval = 30000, // 30 seconds
    debounceDelay = 1000, // 1 second
    enabled = true,
    onSave,
    onLoad,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounce the data to avoid excessive saves
  const debouncedData = useDebounce(data, debounceDelay);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const storageKey = getStorageKey(key);

  /**
   * Save data to localStorage
   */
  const save = () => {
    if (!enabled) return;

    try {
      setIsSaving(true);

      const serialized = JSON.stringify({
        data: debouncedData,
        timestamp: new Date().toISOString(),
      });

      localStorage.setItem(storageKey, serialized);

      const now = new Date();
      setLastSaved(now);
      setIsSaved(true);
      setIsSaving(false);

      onSave?.();
    } catch (error) {
      console.error('Failed to auto-save:', error);
      setIsSaving(false);
      setIsSaved(false);
    }
  };

  /**
   * Clear saved data from localStorage
   */
  const clearSaved = () => {
    try {
      localStorage.removeItem(storageKey);
      setIsSaved(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear auto-save:', error);
    }
  };

  /**
   * Get saved data from localStorage
   */
  const getSaved = <T,>(): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return parsed.data as T;
    } catch (error) {
      console.error('Failed to get saved data:', error);
      return null;
    }
  };

  /**
   * Load saved data on mount
   */
  useEffect(() => {
    if (!enabled) return;

    const saved = getSaved<T>();
    if (saved && onLoad) {
      onLoad(saved);
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Auto-save when debounced data changes
   */
  useEffect(() => {
    // Skip initial mount to avoid saving default/empty values
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!enabled) return;

    // Mark as not saved when data changes
    setIsSaved(false);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set up new auto-save timeout
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedData, enabled, interval]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isSaved,
    isSaving,
    lastSaved,
    clearSaved,
    save,
    getSaved,
  };
}
