/**
 * API Hooks Index
 * Central export for all React Query API hooks
 */

// Song hooks
export {
  useSongs,
  useSong,
  useCreateSong,
  useUpdateSong,
  useDeleteSong,
} from './useSongs';

// SDS hooks
export { useSDS, isValidSDS } from './useSDS';

// Style hooks
export {
  useStyles,
  useStyle,
  useStyleById,
  useCreateStyle,
  useUpdateStyle,
  useDeleteStyle,
} from './useStyles';

// Lyrics hooks
export {
  useLyricsList,
  useLyrics,
  useLyricsById,
  useCreateLyrics,
  useUpdateLyrics,
  useDeleteLyrics,
} from './useLyrics';

// Persona hooks
export {
  usePersonas,
  usePersona,
  usePersonaById,
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
} from './usePersonas';

// ProducerNotes hooks
export {
  useProducerNotesList,
  useProducerNotes,
  useProducerNotesById,
  useCreateProducerNotes,
  useUpdateProducerNotes,
  useDeleteProducerNotes,
} from './useProducerNotes';

// Blueprint hooks
export {
  useBlueprints,
  useBlueprint,
  useCreateBlueprint,
  useUpdateBlueprint,
  useDeleteBlueprint,
} from './useBlueprints';

// Workflow hooks
export {
  useWorkflowRuns,
  useWorkflowRun,
  useWorkflowProgress,
  useWorkflowSummary,
  useStartWorkflow,
  useCancelWorkflow,
} from './useWorkflows';
