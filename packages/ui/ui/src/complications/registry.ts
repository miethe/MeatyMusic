import type { ComplicationSlots, SlotConfig, SlotPosition } from './types';

/**
 * Global registry for complications. Plugins may register
 * default complications that are used when no explicit mapping
 * is provided to the {@link ComplicationProvider}.
 */
const registry: Partial<Record<SlotPosition, SlotConfig>> = {};
const defaults: Partial<Record<SlotPosition, SlotConfig>> = {};

/**
 * Internal version counter that increments whenever the registry changes.
 * Used by ComplicationProvider to detect dynamic registration changes.
 */
let registryVersion = 0;

/**
 * Register a complication for a slot. Returns a function that
 * can be called to unregister the complication.
 */
export function registerComplication(
  slot: SlotPosition,
  config: SlotConfig
): () => void {
  registry[slot] = config;
  registryVersion++;
  return () => {
    delete registry[slot];
    registryVersion++;
  };
}

/**
 * Register a default fallback complication for a slot. These
 * are used when no complication is registered for the slot.
 */
export function registerDefaultComplication(
  slot: SlotPosition,
  config: SlotConfig
): void {
  defaults[slot] = config;
  registryVersion++;
}

/**
 * Get the current registry version. Used by ComplicationProvider
 * to detect when the registry has changed and re-read complications.
 */
export function getRegistryVersion(): number {
  return registryVersion;
}

/**
 * Retrieve all registered complications merged with defaults.
 */
export function getRegisteredComplications(): ComplicationSlots {
  return { ...(defaults as ComplicationSlots), ...(registry as ComplicationSlots) };
}
