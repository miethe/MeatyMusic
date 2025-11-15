/**
 * React Query Integration Hooks for Entities
 *
 * Bridges React Query with Zustand Entities Store
 * - Generic entity CRUD operations (Style, Lyrics, Persona, etc.)
 * - Queries sync to store automatically
 * - Mutations use optimistic updates with rollback
 * - Type-safe integration with full error handling
 */

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';

import { stylesApi, type StyleFilters } from '@/lib/api/styles';
import { lyricsApi, type LyricsFilters } from '@/lib/api/lyrics';
import { personasApi, type PersonaFilters } from '@/lib/api/personas';
import type { useEntitiesStore } from '@meatymusic/store';
import type {
  Style,
  Lyrics,
  Persona,
  PaginatedResponse,
  UUID,
} from '@/types/api';

// Import store dynamically to avoid type errors during build
// eslint-disable-next-line @typescript-eslint/no-var-requires
const storeModule = require('@meatymusic/store');
const entitiesStore: typeof useEntitiesStore = storeModule.useEntitiesStore;

// ============================================================================
// Query Keys
// ============================================================================

export const entitiesKeys = {
  all: ['entities'] as const,

  // Styles
  styles: () => [...entitiesKeys.all, 'styles'] as const,
  stylesList: (filters: StyleFilters) => [...entitiesKeys.styles(), filters] as const,
  styleDetail: (id: UUID) => [...entitiesKeys.styles(), id] as const,

  // Lyrics
  lyrics: () => [...entitiesKeys.all, 'lyrics'] as const,
  lyricsList: (filters: LyricsFilters) => [...entitiesKeys.lyrics(), filters] as const,
  lyricsDetail: (id: UUID) => [...entitiesKeys.lyrics(), id] as const,

  // Personas
  personas: () => [...entitiesKeys.all, 'personas'] as const,
  personasList: (filters: PersonaFilters) => [...entitiesKeys.personas(), filters] as const,
  personaDetail: (id: UUID) => [...entitiesKeys.personas(), id] as const,
};

// ============================================================================
// Styles Query Hooks
// ============================================================================

/**
 * Fetch styles list and sync to Zustand store
 *
 * @param filters - Style filters (genre, mood, BPM range)
 * @returns React Query result with styles data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useStylesWithStore({
 *   genre: ['pop', 'rock'],
 *   bpm_min: 120,
 *   bpm_max: 140
 * });
 * ```
 */
export function useStylesWithStore(
  filters: StyleFilters = {}
): UseQueryResult<PaginatedResponse<Style>, Error> {
  const setStyles = entitiesStore((state) => state.setStyles);

  const query = useQuery({
    queryKey: entitiesKeys.stylesList(filters),
    queryFn: () => stylesApi.list(filters),
    staleTime: 60000, // 1 minute - styles are relatively stable
    refetchOnWindowFocus: false,
  });

  // Sync styles to store on success
  useEffect(() => {
    if (query.data) {
      setStyles(query.data.items);
    }
  }, [query.data, setStyles]);

  return query;
}

/**
 * Fetch single style by ID and sync to store
 *
 * @param id - Style UUID
 * @returns React Query result with style data
 *
 * @example
 * ```tsx
 * const { data: style } = useStyleWithStore(styleId);
 * ```
 */
export function useStyleWithStore(
  id: UUID
): UseQueryResult<Style, Error> {
  const addStyle = entitiesStore((state) => state.addStyle);

  const query = useQuery({
    queryKey: entitiesKeys.styleDetail(id),
    queryFn: () => stylesApi.get(id),
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Sync style to store
  useEffect(() => {
    if (query.data) {
      addStyle(query.data);
    }
  }, [query.data, addStyle]);

  return query;
}

// ============================================================================
// Styles Mutation Hooks
// ============================================================================

/**
 * Create style mutation with optimistic update
 *
 * @returns Mutation result with optimistic create
 *
 * @example
 * ```tsx
 * const createStyle = useCreateStyleMutation();
 *
 * await createStyle.mutateAsync({
 *   name: 'Energetic Pop',
 *   genre: 'pop',
 *   bpm_min: 120,
 *   bpm_max: 130
 * });
 * ```
 */
export function useCreateStyleMutation(): UseMutationResult<
  Style,
  Error,
  Parameters<typeof stylesApi.create>[0]
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (styleData) => stylesApi.create(styleData),

    onMutate: async (styleData) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.styles() });

      // Create optimistic style
      const optimisticId = `temp-${Date.now()}`;
      const optimisticStyle: Style = {
        id: optimisticId,
        tenant_id: 'temp',
        owner_id: 'temp',
        name: styleData.name,
        genre: styleData.genre,
        sub_genres: styleData.sub_genres,
        bpm_min: styleData.bpm_min,
        bpm_max: styleData.bpm_max,
        key: styleData.key,
        modulations: styleData.modulations,
        mood: styleData.mood,
        energy_level: styleData.energy_level,
        instrumentation: styleData.instrumentation,
        vocal_profile: styleData.vocal_profile,
        tags_positive: styleData.tags_positive,
        tags_negative: styleData.tags_negative,
        blueprint_id: styleData.blueprint_id,
        extra_metadata: styleData.extra_metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      entitiesStore.getState().addStyle(optimisticStyle);

      return { optimisticId };
    },

    onSuccess: (response, _, context) => {
      // Replace optimistic with real
      if (context?.optimisticId) {
        entitiesStore.getState().removeStyle(context.optimisticId);
      }
      entitiesStore.getState().addStyle(response);

      queryClient.invalidateQueries({ queryKey: entitiesKeys.styles() });
    },

    onError: (_, __, context) => {
      if (context?.optimisticId) {
        entitiesStore.getState().removeStyle(context.optimisticId);
      }
    },
  });
}

/**
 * Update style mutation with optimistic update
 *
 * @returns Mutation result with optimistic update
 *
 * @example
 * ```tsx
 * const updateStyle = useUpdateStyleMutation();
 *
 * await updateStyle.mutateAsync({
 *   id: styleId,
 *   updates: { name: 'Updated Style Name' }
 * });
 * ```
 */
export function useUpdateStyleMutation(): UseMutationResult<
  Style,
  Error,
  { id: UUID; updates: Parameters<typeof stylesApi.update>[1] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => stylesApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.styleDetail(id) });

      entitiesStore.getState().updateStyle(id, updates);

      return { id };
    },

    onSuccess: (response, { id }) => {
      entitiesStore.getState().updateStyle(id, response);

      queryClient.invalidateQueries({ queryKey: entitiesKeys.styleDetail(id) });
      queryClient.invalidateQueries({ queryKey: entitiesKeys.styles() });
    },

    onError: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.styleDetail(id) });
    },
  });
}

/**
 * Delete style mutation with optimistic removal
 *
 * @returns Mutation result with optimistic delete
 *
 * @example
 * ```tsx
 * const deleteStyle = useDeleteStyleMutation();
 *
 * await deleteStyle.mutateAsync(styleId);
 * ```
 */
export function useDeleteStyleMutation(): UseMutationResult<
  void,
  Error,
  UUID
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => stylesApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.styleDetail(id) });

      entitiesStore.getState().removeStyle(id);

      return { id };
    },

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.styles() });
      queryClient.removeQueries({ queryKey: entitiesKeys.styleDetail(id) });
    },

    onError: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.styleDetail(id) });
      queryClient.invalidateQueries({ queryKey: entitiesKeys.styles() });
    },
  });
}

// ============================================================================
// Lyrics Query Hooks
// ============================================================================

/**
 * Fetch lyrics list and sync to Zustand store
 *
 * @param filters - Lyrics filters (song_id, language, POV)
 * @returns React Query result with lyrics data
 *
 * @example
 * ```tsx
 * const { data } = useLyricsWithStore({ song_id: songId });
 * ```
 */
export function useLyricsWithStore(
  filters: LyricsFilters = {}
): UseQueryResult<PaginatedResponse<Lyrics>, Error> {
  const setLyrics = entitiesStore((state) => state.setLyrics);

  const query = useQuery({
    queryKey: entitiesKeys.lyricsList(filters),
    queryFn: () => lyricsApi.list(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      setLyrics(query.data.items);
    }
  }, [query.data, setLyrics]);

  return query;
}

/**
 * Fetch single lyrics by ID and sync to store
 *
 * @param id - Lyrics UUID
 * @returns React Query result with lyrics data
 */
export function useLyricsItemWithStore(
  id: UUID
): UseQueryResult<Lyrics, Error> {
  const addLyrics = entitiesStore((state) => state.addLyrics);

  const query = useQuery({
    queryKey: entitiesKeys.lyricsDetail(id),
    queryFn: () => lyricsApi.get(id),
    staleTime: 60000, // 1 minute
  });

  useEffect(() => {
    if (query.data) {
      addLyrics(query.data);
    }
  }, [query.data, addLyrics]);

  return query;
}

// ============================================================================
// Lyrics Mutation Hooks
// ============================================================================

/**
 * Create lyrics mutation with optimistic update
 */
export function useCreateLyricsMutation(): UseMutationResult<
  Lyrics,
  Error,
  Parameters<typeof lyricsApi.create>[0]
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lyricsData) => lyricsApi.create(lyricsData),

    onMutate: async (lyricsData) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.lyrics() });

      const optimisticId = `temp-${Date.now()}`;
      const optimisticLyrics: Lyrics = {
        id: optimisticId,
        tenant_id: 'temp',
        owner_id: 'temp',
        song_id: lyricsData.song_id,
        sections: lyricsData.sections,
        section_order: lyricsData.section_order,
        language: lyricsData.language,
        pov: lyricsData.pov,
        tense: lyricsData.tense,
        rhyme_scheme: lyricsData.rhyme_scheme,
        meter: lyricsData.meter,
        syllables_per_line: lyricsData.syllables_per_line,
        hook_strategy: lyricsData.hook_strategy,
        repetition_rules: lyricsData.repetition_rules,
        imagery_density: lyricsData.imagery_density,
        reading_level: lyricsData.reading_level,
        themes: lyricsData.themes,
        constraints: lyricsData.constraints,
        explicit_allowed: lyricsData.explicit_allowed,
        source_citations: lyricsData.source_citations,
        generated_text: lyricsData.generated_text,
        extra_metadata: lyricsData.extra_metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      entitiesStore.getState().addLyrics(optimisticLyrics);

      return { optimisticId };
    },

    onSuccess: (response, _, context) => {
      if (context?.optimisticId) {
        entitiesStore.getState().removeLyrics(context.optimisticId);
      }
      entitiesStore.getState().addLyrics(response);

      queryClient.invalidateQueries({ queryKey: entitiesKeys.lyrics() });
    },

    onError: (_, __, context) => {
      if (context?.optimisticId) {
        entitiesStore.getState().removeLyrics(context.optimisticId);
      }
    },
  });
}

/**
 * Update lyrics mutation with optimistic update
 */
export function useUpdateLyricsMutation(): UseMutationResult<
  Lyrics,
  Error,
  { id: UUID; updates: Parameters<typeof lyricsApi.update>[1] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => lyricsApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.lyricsDetail(id) });

      entitiesStore.getState().updateLyrics(id, updates);

      return { id };
    },

    onSuccess: (response, { id }) => {
      entitiesStore.getState().updateLyrics(id, response);

      queryClient.invalidateQueries({ queryKey: entitiesKeys.lyricsDetail(id) });
      queryClient.invalidateQueries({ queryKey: entitiesKeys.lyrics() });
    },

    onError: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.lyricsDetail(id) });
    },
  });
}

/**
 * Delete lyrics mutation with optimistic removal
 */
export function useDeleteLyricsMutation(): UseMutationResult<
  void,
  Error,
  UUID
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => lyricsApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.lyricsDetail(id) });

      entitiesStore.getState().removeLyrics(id);

      return { id };
    },

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.lyrics() });
      queryClient.removeQueries({ queryKey: entitiesKeys.lyricsDetail(id) });
    },

    onError: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.lyricsDetail(id) });
      queryClient.invalidateQueries({ queryKey: entitiesKeys.lyrics() });
    },
  });
}

// ============================================================================
// Personas Query Hooks
// ============================================================================

/**
 * Fetch personas list and sync to Zustand store
 *
 * @param filters - Persona filters (kind, vocal_range)
 * @returns React Query result with personas data
 *
 * @example
 * ```tsx
 * const { data } = usePersonasWithStore({ kind: 'artist' });
 * ```
 */
export function usePersonasWithStore(
  filters: PersonaFilters = {}
): UseQueryResult<PaginatedResponse<Persona>, Error> {
  const setPersonas = entitiesStore((state) => state.setPersonas);

  const query = useQuery({
    queryKey: entitiesKeys.personasList(filters),
    queryFn: () => personasApi.list(filters),
    staleTime: 120000, // 2 minutes - personas are very stable
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      setPersonas(query.data.items);
    }
  }, [query.data, setPersonas]);

  return query;
}

/**
 * Fetch single persona by ID and sync to store
 *
 * @param id - Persona UUID
 * @returns React Query result with persona data
 */
export function usePersonaWithStore(
  id: UUID
): UseQueryResult<Persona, Error> {
  const addPersona = entitiesStore((state) => state.addPersona);

  const query = useQuery({
    queryKey: entitiesKeys.personaDetail(id),
    queryFn: () => personasApi.get(id),
    staleTime: 180000, // 3 minutes
  });

  useEffect(() => {
    if (query.data) {
      addPersona(query.data);
    }
  }, [query.data, addPersona]);

  return query;
}

// ============================================================================
// Personas Mutation Hooks
// ============================================================================

/**
 * Create persona mutation with optimistic update
 */
export function useCreatePersonaMutation(): UseMutationResult<
  Persona,
  Error,
  Parameters<typeof personasApi.create>[0]
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personaData) => personasApi.create(personaData),

    onMutate: async (personaData) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.personas() });

      const optimisticId = `temp-${Date.now()}`;
      const optimisticPersona: Persona = {
        id: optimisticId,
        tenant_id: 'temp',
        owner_id: 'temp',
        name: personaData.name,
        kind: personaData.kind,
        bio: personaData.bio,
        voice: personaData.voice,
        vocal_range: personaData.vocal_range,
        delivery: personaData.delivery,
        influences: personaData.influences,
        style_defaults: personaData.style_defaults,
        lyrics_defaults: personaData.lyrics_defaults,
        policy: personaData.policy,
        extra_metadata: personaData.extra_metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      entitiesStore.getState().addPersona(optimisticPersona);

      return { optimisticId };
    },

    onSuccess: (response, _, context) => {
      if (context?.optimisticId) {
        entitiesStore.getState().removePersona(context.optimisticId);
      }
      entitiesStore.getState().addPersona(response);

      queryClient.invalidateQueries({ queryKey: entitiesKeys.personas() });
    },

    onError: (_, __, context) => {
      if (context?.optimisticId) {
        entitiesStore.getState().removePersona(context.optimisticId);
      }
    },
  });
}

/**
 * Update persona mutation with optimistic update
 */
export function useUpdatePersonaMutation(): UseMutationResult<
  Persona,
  Error,
  { id: UUID; updates: Parameters<typeof personasApi.update>[1] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => personasApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.personaDetail(id) });

      entitiesStore.getState().updatePersona(id, updates);

      return { id };
    },

    onSuccess: (response, { id }) => {
      entitiesStore.getState().updatePersona(id, response);

      queryClient.invalidateQueries({ queryKey: entitiesKeys.personaDetail(id) });
      queryClient.invalidateQueries({ queryKey: entitiesKeys.personas() });
    },

    onError: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.personaDetail(id) });
    },
  });
}

/**
 * Delete persona mutation with optimistic removal
 */
export function useDeletePersonaMutation(): UseMutationResult<
  void,
  Error,
  UUID
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => personasApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: entitiesKeys.personaDetail(id) });

      entitiesStore.getState().removePersona(id);

      return { id };
    },

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.personas() });
      queryClient.removeQueries({ queryKey: entitiesKeys.personaDetail(id) });
    },

    onError: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entitiesKeys.personaDetail(id) });
      queryClient.invalidateQueries({ queryKey: entitiesKeys.personas() });
    },
  });
}
