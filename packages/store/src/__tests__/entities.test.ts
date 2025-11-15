import { describe, it, expect, beforeEach } from 'vitest';

import { useEntitiesStore } from '../stores/entitiesStore';
import type { Style, Lyrics, Persona } from '../types';

// ============================================================================
// Test Helpers
// ============================================================================

const mockStyle = (id: string, overrides?: Partial<Style>): Style => ({
  id,
  tenant_id: 'tenant-1',
  owner_id: 'owner-1',
  name: `Style ${id}`,
  genre: 'pop',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const mockLyrics = (id: string, overrides?: Partial<Lyrics>): Lyrics => ({
  id,
  tenant_id: 'tenant-1',
  owner_id: 'owner-1',
  song_id: 'song-1',
  sections: [],
  section_order: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const mockPersona = (id: string, overrides?: Partial<Persona>): Persona => ({
  id,
  tenant_id: 'tenant-1',
  owner_id: 'owner-1',
  name: `Persona ${id}`,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

// ============================================================================
// Style Operations Tests
// ============================================================================

describe('EntitiesStore - Style Operations', () => {
  beforeEach(() => {
    useEntitiesStore.getState().clearCache();
  });

  describe('setStyles', () => {
    it('should set styles and update cache', () => {
      const styles = [mockStyle('style-1'), mockStyle('style-2')];

      useEntitiesStore.getState().setStyles(styles);

      const state = useEntitiesStore.getState();
      expect(state.styles.items.get('style-1')).toEqual(styles[0]);
      expect(state.styles.items.get('style-2')).toEqual(styles[1]);
      expect(state.styles.allIds).toEqual(['style-1', 'style-2']);
    });

    it('should update cache metadata', () => {
      const beforeTime = Date.now();

      useEntitiesStore.getState().setStyles([mockStyle('style-1')]);

      const state = useEntitiesStore.getState();
      expect(state.styles.metadata.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
      expect(state.styles.metadata.version).toBe('1.0.0');
    });
  });

  describe('addStyle', () => {
    it('should add style to cache', () => {
      const style = mockStyle('style-1');

      useEntitiesStore.getState().addStyle(style);

      const state = useEntitiesStore.getState();
      expect(state.styles.items.get('style-1')).toEqual(style);
      expect(state.styles.allIds).toContain('style-1');
    });

    it('should not duplicate ID in allIds', () => {
      const style = mockStyle('style-1');

      useEntitiesStore.getState().addStyle(style);
      useEntitiesStore.getState().addStyle({ ...style, name: 'Updated' });

      const state = useEntitiesStore.getState();
      const count = state.styles.allIds.filter((id) => id === 'style-1').length;
      expect(count).toBe(1);
    });
  });

  describe('updateStyle', () => {
    it('should update existing style', () => {
      const style = mockStyle('style-1');

      useEntitiesStore.getState().addStyle(style);
      useEntitiesStore.getState().updateStyle('style-1', { name: 'Updated Style' });

      const state = useEntitiesStore.getState();
      expect(state.styles.items.get('style-1')?.name).toBe('Updated Style');
    });

    it('should not modify cache for non-existent style', () => {
      const initialState = useEntitiesStore.getState();

      useEntitiesStore.getState().updateStyle('non-existent', { name: 'Test' });

      const newState = useEntitiesStore.getState();
      expect(newState.styles).toEqual(initialState.styles);
    });
  });

  describe('removeStyle', () => {
    it('should remove style from cache', () => {
      const style = mockStyle('style-1');

      useEntitiesStore.getState().addStyle(style);
      useEntitiesStore.getState().removeStyle('style-1');

      const state = useEntitiesStore.getState();
      expect(state.styles.items.has('style-1')).toBe(false);
      expect(state.styles.allIds).not.toContain('style-1');
    });

    it('should clear selection when removing selected style', () => {
      const style = mockStyle('style-1');

      useEntitiesStore.getState().addStyle(style);
      useEntitiesStore.getState().selectStyle('style-1');
      useEntitiesStore.getState().removeStyle('style-1');

      expect(useEntitiesStore.getState().selectedStyleId).toBe(null);
    });
  });

  describe('selectStyle', () => {
    it('should set selected style ID', () => {
      useEntitiesStore.getState().selectStyle('style-1');
      expect(useEntitiesStore.getState().selectedStyleId).toBe('style-1');
    });

    it('should record entity access when selecting', () => {
      const style = mockStyle('style-1');

      useEntitiesStore.getState().addStyle(style);
      useEntitiesStore.getState().selectStyle('style-1');

      const state = useEntitiesStore.getState();
      expect(state.recentEntities.styleIds).toContain('style-1');
    });
  });
});

// ============================================================================
// Lyrics Operations Tests
// ============================================================================

describe('EntitiesStore - Lyrics Operations', () => {
  beforeEach(() => {
    useEntitiesStore.getState().clearCache();
  });

  describe('setLyrics', () => {
    it('should set lyrics and update cache', () => {
      const lyrics = [mockLyrics('lyrics-1'), mockLyrics('lyrics-2')];

      useEntitiesStore.getState().setLyrics(lyrics);

      const state = useEntitiesStore.getState();
      expect(state.lyrics.items.size).toBe(2);
      expect(state.lyrics.allIds).toEqual(['lyrics-1', 'lyrics-2']);
    });
  });

  describe('addLyrics', () => {
    it('should add lyrics to cache', () => {
      const lyrics = mockLyrics('lyrics-1');

      useEntitiesStore.getState().addLyrics(lyrics);

      const state = useEntitiesStore.getState();
      expect(state.lyrics.items.get('lyrics-1')).toEqual(lyrics);
    });
  });

  describe('updateLyrics', () => {
    it('should update existing lyrics', () => {
      const lyrics = mockLyrics('lyrics-1');

      useEntitiesStore.getState().addLyrics(lyrics);
      useEntitiesStore.getState().updateLyrics('lyrics-1', { language: 'es' });

      const state = useEntitiesStore.getState();
      expect(state.lyrics.items.get('lyrics-1')?.language).toBe('es');
    });
  });
});

// ============================================================================
// Persona Operations Tests
// ============================================================================

describe('EntitiesStore - Persona Operations', () => {
  beforeEach(() => {
    useEntitiesStore.getState().clearCache();
  });

  describe('setPersonas', () => {
    it('should set personas and update cache', () => {
      const personas = [mockPersona('persona-1'), mockPersona('persona-2')];

      useEntitiesStore.getState().setPersonas(personas);

      const state = useEntitiesStore.getState();
      expect(state.personas.items.size).toBe(2);
      expect(state.personas.allIds).toEqual(['persona-1', 'persona-2']);
    });
  });

  describe('addPersona', () => {
    it('should add persona to cache', () => {
      const persona = mockPersona('persona-1');

      useEntitiesStore.getState().addPersona(persona);

      const state = useEntitiesStore.getState();
      expect(state.personas.items.get('persona-1')).toEqual(persona);
    });
  });

  describe('selectPersona', () => {
    it('should set selected persona ID', () => {
      useEntitiesStore.getState().selectPersona('persona-1');
      expect(useEntitiesStore.getState().selectedPersonaId).toBe('persona-1');
    });

    it('should record entity access', () => {
      const persona = mockPersona('persona-1');

      useEntitiesStore.getState().addPersona(persona);
      useEntitiesStore.getState().selectPersona('persona-1');

      const state = useEntitiesStore.getState();
      expect(state.recentEntities.personaIds).toContain('persona-1');
    });
  });
});

// ============================================================================
// Generic Operations Tests
// ============================================================================

describe('EntitiesStore - Generic Operations', () => {
  beforeEach(() => {
    useEntitiesStore.getState().clearCache();
  });

  describe('setEntityCache', () => {
    it('should set style cache via generic method', () => {
      const styles = [mockStyle('style-1')];

      useEntitiesStore.getState().setEntityCache('style', styles);

      const state = useEntitiesStore.getState();
      expect(state.styles.items.size).toBe(1);
    });

    it('should set lyrics cache via generic method', () => {
      const lyrics = [mockLyrics('lyrics-1')];

      useEntitiesStore.getState().setEntityCache('lyrics', lyrics);

      const state = useEntitiesStore.getState();
      expect(state.lyrics.items.size).toBe(1);
    });

    it('should set persona cache via generic method', () => {
      const personas = [mockPersona('persona-1')];

      useEntitiesStore.getState().setEntityCache('persona', personas);

      const state = useEntitiesStore.getState();
      expect(state.personas.items.size).toBe(1);
    });
  });

  describe('invalidateEntityType', () => {
    it('should invalidate style cache', () => {
      useEntitiesStore.getState().setStyles([mockStyle('style-1')]);
      useEntitiesStore.getState().invalidateEntityType('style');

      const state = useEntitiesStore.getState();
      expect(state.styles.metadata.lastUpdated).toBe(0);
    });

    it('should invalidate lyrics cache', () => {
      useEntitiesStore.getState().setLyrics([mockLyrics('lyrics-1')]);
      useEntitiesStore.getState().invalidateEntityType('lyrics');

      const state = useEntitiesStore.getState();
      expect(state.lyrics.metadata.lastUpdated).toBe(0);
    });
  });

  describe('invalidateAll', () => {
    it('should invalidate all caches', () => {
      useEntitiesStore.getState().setStyles([mockStyle('style-1')]);
      useEntitiesStore.getState().setLyrics([mockLyrics('lyrics-1')]);
      useEntitiesStore.getState().invalidateAll();

      const state = useEntitiesStore.getState();
      expect(state.styles.metadata.lastUpdated).toBe(0);
      expect(state.lyrics.metadata.lastUpdated).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all caches and reset state', () => {
      useEntitiesStore.getState().setStyles([mockStyle('style-1')]);
      useEntitiesStore.getState().setLyrics([mockLyrics('lyrics-1')]);
      useEntitiesStore.getState().selectStyle('style-1');
      useEntitiesStore.getState().clearCache();

      const state = useEntitiesStore.getState();
      expect(state.styles.items.size).toBe(0);
      expect(state.lyrics.items.size).toBe(0);
      expect(state.selectedStyleId).toBe(null);
      expect(state.recentEntities.styleIds).toEqual([]);
    });
  });
});

// ============================================================================
// Recent Access Tracking Tests
// ============================================================================

describe('EntitiesStore - Recent Access Tracking', () => {
  beforeEach(() => {
    useEntitiesStore.getState().clearCache();
  });

  describe('recordEntityAccess', () => {
    it('should add entity to front of recent list', () => {
      useEntitiesStore.getState().recordEntityAccess('style', 'style-1');

      const state = useEntitiesStore.getState();
      expect(state.recentEntities.styleIds[0]).toBe('style-1');
    });

    it('should move existing entity to front', () => {
      useEntitiesStore.getState().recordEntityAccess('style', 'style-1');
      useEntitiesStore.getState().recordEntityAccess('style', 'style-2');
      useEntitiesStore.getState().recordEntityAccess('style', 'style-1');

      const state = useEntitiesStore.getState();
      expect(state.recentEntities.styleIds).toEqual(['style-1', 'style-2']);
    });

    it('should limit recent entities to max 20', () => {
      for (let i = 1; i <= 25; i++) {
        useEntitiesStore.getState().recordEntityAccess('style', `style-${i}`);
      }

      const state = useEntitiesStore.getState();
      expect(state.recentEntities.styleIds).toHaveLength(20);
      expect(state.recentEntities.styleIds[0]).toBe('style-25');
      expect(state.recentEntities.styleIds[19]).toBe('style-6');
    });
  });

  describe('getRecentEntities', () => {
    it('should return recent styles with default limit', () => {
      const styles = Array.from({ length: 15 }, (_, i) => mockStyle(`style-${i + 1}`));

      useEntitiesStore.getState().setStyles(styles);
      styles.forEach((style) => {
        useEntitiesStore.getState().recordEntityAccess('style', style.id);
      });

      const recentStyles = useEntitiesStore.getState().getRecentEntities('style');
      expect(recentStyles).toHaveLength(10);
    });

    it('should return recent styles with custom limit', () => {
      const styles = Array.from({ length: 15 }, (_, i) => mockStyle(`style-${i + 1}`));

      useEntitiesStore.getState().setStyles(styles);
      styles.forEach((style) => {
        useEntitiesStore.getState().recordEntityAccess('style', style.id);
      });

      const recentStyles = useEntitiesStore.getState().getRecentEntities('style', 5);
      expect(recentStyles).toHaveLength(5);
    });
  });
});
