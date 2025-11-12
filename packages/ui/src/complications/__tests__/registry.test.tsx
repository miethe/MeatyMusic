import * as React from 'react';
import {
  registerComplication,
  registerDefaultComplication,
  getRegisteredComplications,
  getRegistryVersion,
} from '../registry';
import type { SlotConfig } from '../types';

describe('complication registry', () => {
  function Dummy() {
    return <div>dummy</div>;
  }

  it('registers and unregisters complications', () => {
    const config: SlotConfig = { component: Dummy };
    const unregister = registerComplication('topLeft', config);
    expect(getRegisteredComplications().topLeft).toBe(config);
    unregister();
    expect(getRegisteredComplications().topLeft).toBeUndefined();
  });

  it('applies default fallback', () => {
    const defaultConfig: SlotConfig = { component: Dummy };
    registerDefaultComplication('topRight', defaultConfig);
    expect(getRegisteredComplications().topRight).toBe(defaultConfig);
  });

  describe('version tracking', () => {
    let initialVersion: number;

    beforeEach(() => {
      initialVersion = getRegistryVersion();
    });

    it('increments version when registering a complication', () => {
      const config: SlotConfig = { component: Dummy };
      registerComplication('bottomLeft', config);

      expect(getRegistryVersion()).toBe(initialVersion + 1);
    });

    it('increments version when unregistering a complication', () => {
      const config: SlotConfig = { component: Dummy };
      const unregister = registerComplication('bottomRight', config);

      const versionAfterRegister = getRegistryVersion();
      expect(versionAfterRegister).toBe(initialVersion + 1);

      unregister();
      expect(getRegistryVersion()).toBe(versionAfterRegister + 1);
    });

    it('increments version when registering default complications', () => {
      const config: SlotConfig = { component: Dummy };
      registerDefaultComplication('edgeLeft', config);

      expect(getRegistryVersion()).toBe(initialVersion + 1);
    });

    it('version changes are reflected in registry contents', () => {
      const config: SlotConfig = { component: Dummy };
      const initialComplications = getRegisteredComplications();

      // Register a complication
      const unregister = registerComplication('footer', config);
      expect(getRegisteredComplications()).not.toEqual(initialComplications);
      expect(getRegisteredComplications().footer).toBe(config);

      // Unregister it
      unregister();
      expect(getRegisteredComplications().footer).toBeUndefined();
    });
  });
});
