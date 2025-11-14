/**
 * New Song Page
 * Multi-step wizard for creating a new song with support for all entity types
 */

'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Music2,
  Palette,
  FileText,
  User,
  Settings,
  Eye,
  Loader2,
  Edit,
} from 'lucide-react';

import { LyricsEditor } from '@/components/entities/LyricsEditor';
import { PersonaEditor } from '@/components/entities/PersonaEditor';
import { ProducerNotesEditor } from '@/components/entities/ProducerNotesEditor';
import { StyleEditor } from '@/components/entities/StyleEditor';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/config/routes';
import { useCreateLyrics } from '@/hooks/api/useLyrics';
import { useCreatePersona } from '@/hooks/api/usePersonas';
import { useCreateProducerNotes } from '@/hooks/api/useProducerNotes';
import { useCreateSong } from '@/hooks/api/useSongs';
import { useCreateStyle } from '@/hooks/api/useStyles';
import { songsApi } from '@/lib/api';
import { useUIStore } from '@/stores';
import { SongCreate, StyleCreate, LyricsCreate, PersonaCreate, ProducerNotesCreate, UUID } from '@/types/api/entities';


const WIZARD_STEPS = [
  { id: 'info', label: 'Song Info', icon: Music2 },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'lyrics', label: 'Lyrics', icon: FileText },
  { id: 'persona', label: 'Persona', icon: User },
  { id: 'producer', label: 'Producer Notes', icon: Settings },
  { id: 'review', label: 'Review', icon: Eye },
] as const;

/**
 * WizardFormData interface for multi-entity song creation
 * Extends basic song data with optional Style, Lyrics, Persona, and ProducerNotes
 */
interface WizardFormData {
  song: {
    title: string;
    description: string;
    genre: string;
    mood: string[];
    global_seed: number;
    sds_version: string;
  };
  style: Partial<StyleCreate> | null;
  lyrics: Partial<LyricsCreate> | null;
  persona: Partial<PersonaCreate> | null;
  producerNotes: Partial<ProducerNotesCreate> | null;
}

/**
 * Progress state for submission tracking
 */
interface SubmissionProgress {
  current: number;
  total: number;
  action: string;
}

/**
 * useWizardSubmission Hook
 * Orchestrates sequential creation of Song and all provided entities
 * Handles dependencies (Lyrics and ProducerNotes require song_id)
 *
 * Sequential order of operations:
 * 1. Create Song → get song.id
 * 2. Create Style (if provided) → get style.id
 * 3. Create Persona (if provided) → get persona.id
 * 4. Create Lyrics with song_id (if provided)
 * 5. Create ProducerNotes with song_id (if provided)
 * 6. Update Song with style_id and persona_id references
 */
function useWizardSubmission() {
  const createSong = useCreateSong();
  const createStyle = useCreateStyle();
  const createLyrics = useCreateLyrics();
  const createPersona = useCreatePersona();
  const createProducerNotes = useCreateProducerNotes();
  const { addToast } = useUIStore();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState<SubmissionProgress>({ current: 0, total: 0, action: '' });

  const submitWizard = React.useCallback(
    async (formData: WizardFormData): Promise<string> => {
      try {
        setIsSubmitting(true);

        // Calculate total steps dynamically based on what's provided
        let totalSteps = 1; // Always create song
        if (formData.style) totalSteps++;
        if (formData.persona) totalSteps++;
        if (formData.lyrics) totalSteps++;
        if (formData.producerNotes) totalSteps++;
        // Only count final update step if we have entities to link
        if (formData.style || formData.persona) totalSteps++;

        let currentStep = 1;

        // Step 1: Create Song
        setProgress({ current: currentStep, total: totalSteps, action: 'Creating song...' });
        const songData: SongCreate = {
          title: formData.song.title,
          global_seed: formData.song.global_seed,
          sds_version: formData.song.sds_version,
          extra_metadata: {
            description: formData.song.description,
            genre: formData.song.genre,
            mood: formData.song.mood,
          },
        };

        const createdSong = await createSong.mutateAsync(songData);
        const songId = createdSong.id;
        currentStep++;

        // Step 2: Create Style (if provided)
        let styleId: UUID | undefined;
        if (formData.style) {
          setProgress({ current: currentStep, total: totalSteps, action: 'Creating style...' });
          const styleData: StyleCreate = {
            ...formData.style,
            name: formData.style.name ?? 'Unnamed Style',
            genre: formData.style.genre ?? 'Unknown',
          };
          const createdStyle = await createStyle.mutateAsync(styleData);
          styleId = createdStyle.id;
          currentStep++;
        }

        // Step 3: Create Persona (if provided)
        let personaId: UUID | undefined;
        if (formData.persona) {
          setProgress({ current: currentStep, total: totalSteps, action: 'Creating persona...' });
          const personaData: PersonaCreate = {
            name: formData.persona.name || 'Unnamed Persona',
            ...formData.persona,
          };
          const createdPersona = await createPersona.mutateAsync(personaData);
          personaId = createdPersona.id;
          currentStep++;
        }

        // Step 4: Create Lyrics (if provided)
        // Critical: Lyrics require the actual created song_id, not a temporary one
        if (formData.lyrics) {
          setProgress({ current: currentStep, total: totalSteps, action: 'Creating lyrics...' });
          const lyricsData: LyricsCreate = {
            song_id: songId, // Inject the actual song ID here
            sections: formData.lyrics.sections || [],
            section_order: formData.lyrics.section_order || [],
            ...formData.lyrics,
          };
          await createLyrics.mutateAsync(lyricsData);
          currentStep++;
        }

        // Step 5: Create ProducerNotes (if provided)
        // Critical: ProducerNotes require the actual created song_id, not a temporary one
        if (formData.producerNotes) {
          setProgress({ current: currentStep, total: totalSteps, action: 'Creating producer notes...' });
          const producerNotesData: ProducerNotesCreate = {
            song_id: songId, // Inject the actual song ID here
            structure: formData.producerNotes.structure || '',
            hooks: formData.producerNotes.hooks || 1,
            ...formData.producerNotes,
          };
          await createProducerNotes.mutateAsync(producerNotesData);
          currentStep++;
        }

        // Step 6: Update Song with entity references (if any entities were created)
        // Use API directly to avoid hook call restrictions
        if (styleId || personaId) {
          setProgress({ current: currentStep, total: totalSteps, action: 'Linking entities...' });
          await songsApi.update(songId, {
            ...(styleId && { style_id: styleId }),
            ...(personaId && { persona_id: personaId }),
          });
          currentStep++;
        }

        setProgress({ current: totalSteps, total: totalSteps, action: 'Complete!' });
        addToast('Song created successfully with all entities!', 'success');

        return songId;
      } catch (error) {
        console.error('Failed to create song:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create song and entities';
        addToast(errorMessage, 'error');
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSong, createStyle, createLyrics, createPersona, createProducerNotes, addToast]
  );

  return {
    submitWizard,
    isSubmitting,
    progress,
  };
}

/**
 * SubmissionProgressModal Component
 * Displays progress during multi-entity submission
 * Shows animated progress bar, current step, and total steps
 */
function SubmissionProgressModal({
  progress,
  isOpen,
}: {
  progress: SubmissionProgress;
  isOpen: boolean;
}) {
  if (!isOpen) return null;

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <Card
        className="p-8 max-w-md w-full mx-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-title"
      >
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <h3
            id="progress-title"
            className="font-semibold text-lg text-text-strong mb-4 text-center"
          >
            Creating Song...
          </h3>
          <div className="w-full space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2" aria-live="polite">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-text-muted text-center font-mono">
                {percentage.toFixed(0)}%
              </p>
            </div>

            {/* Current Action */}
            <div className="text-center">
              <p className="text-sm font-medium text-text-base">{progress.action}</p>
              <p className="text-xs text-text-muted mt-1">
                Step {progress.current} of {progress.total}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function NewSongPage() {
  const router = useRouter();
  const { submitWizard, isSubmitting: wizardIsSubmitting, progress } = useWizardSubmission();
  const createSong = useCreateSong();

  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set([0])); // Step 0 is always completed
  const [skippedSteps, setSkippedSteps] = React.useState<Set<number>>(new Set());
  const [formData, setFormData] = React.useState<WizardFormData>({
    song: {
      title: '',
      description: '',
      genre: '',
      mood: [] as string[],
      global_seed: Date.now(), // Default to current timestamp for determinism
      sds_version: '1.0.0',
    },
    style: null,
    lyrics: null,
    persona: null,
    producerNotes: null,
  });

  /**
   * Helper function to update song data
   * Uses functional state update to avoid stale closures
   */
  const updateSongData = React.useCallback((updates: Partial<WizardFormData['song']>) => {
    setFormData((prev: WizardFormData) => ({
      ...prev,
      song: { ...prev.song, ...updates },
    }));
  }, []);

  /**
   * Helper function to update style data
   */
  const updateStyleData = React.useCallback((style: Partial<StyleCreate> | null) => {
    setFormData((prev: WizardFormData) => ({
      ...prev,
      style,
    }));
  }, []);

  /**
   * Helper function to update lyrics data
   */
  const updateLyricsData = React.useCallback((lyrics: Partial<LyricsCreate> | null) => {
    setFormData((prev: WizardFormData) => ({
      ...prev,
      lyrics,
    }));
  }, []);

  /**
   * Helper function to update persona data
   */
  const updatePersonaData = React.useCallback((persona: Partial<PersonaCreate> | null) => {
    setFormData((prev: WizardFormData) => ({
      ...prev,
      persona,
    }));
  }, []);

  /**
   * Helper function to update producer notes data
   */
  const updateProducerNotesData = React.useCallback((notes: Partial<ProducerNotesCreate> | null) => {
    setFormData((prev: WizardFormData) => ({
      ...prev,
      producerNotes: notes,
    }));
  }, []);

  /**
   * Helper function to mark a step as completed
   */
  const markStepCompleted = React.useCallback((stepIndex: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepIndex]));
    setSkippedSteps((prev) => {
      const next = new Set(prev);
      next.delete(stepIndex);
      return next;
    });
  }, []);

  /**
   * Helper function to mark a step as skipped
   */
  const markStepSkipped = React.useCallback((stepIndex: number) => {
    setSkippedSteps((prev) => new Set([...prev, stepIndex]));
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.delete(stepIndex);
      return next;
    });
  }, []);

  /**
   * Effect: Prevent browser navigation during submission
   * Warns user if they try to close tab, navigate, or reload while creating entities
   */
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (wizardIsSubmitting) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue
        return '';
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [wizardIsSubmitting]);

  /**
   * Effect: Save draft to localStorage on form data changes
   * Persists wizard state so user can resume later
   */
  React.useEffect(() => {
    if (formData.song.title || formData.song.description || formData.style || formData.lyrics || formData.persona || formData.producerNotes) {
      // Convert Sets to arrays for JSON serialization
      const draftData = {
        formData,
        currentStep,
        completedSteps: Array.from(completedSteps),
        skippedSteps: Array.from(skippedSteps),
        timestamp: new Date().toISOString(),
      };
      try {
        localStorage.setItem('song-wizard-draft', JSON.stringify(draftData));
      } catch (error) {
        // Silently fail if localStorage is full or unavailable
        console.warn('Failed to save draft to localStorage:', error);
      }
    }
  }, [formData, currentStep, completedSteps, skippedSteps]);

  /**
   * Effect: Restore draft from localStorage on component mount
   * Shows confirmation dialog if draft exists
   */
  React.useEffect(() => {
    const draft = localStorage.getItem('song-wizard-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        const draftDate = new Date(parsed.timestamp);
        const formattedDate = draftDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        if (confirm(`Resume draft from ${formattedDate}?`)) {
          // Restore form data and step tracking
          setFormData(parsed.formData);
          setCurrentStep(parsed.currentStep || 0);
          // Convert arrays back to Sets
          setCompletedSteps(new Set(parsed.completedSteps || []));
          setSkippedSteps(new Set(parsed.skippedSteps || []));
        } else {
          localStorage.removeItem('song-wizard-draft');
        }
      } catch (error) {
        // Silently fail if draft is corrupted
        console.warn('Failed to restore draft from localStorage:', error);
        localStorage.removeItem('song-wizard-draft');
      }
    }
  }, []); // Run only on mount

  /**
   * Validation logic to determine if user can progress to next step
   * Step 0: Require title
   * Steps 1-4: Optional (always allow progression)
   * Step 5: Review (always allow)
   */
  const canProgress = React.useMemo(() => {
    if (currentStep === 0) {
      // Step 0 (Song Info): Require title
      return formData.song.title.trim().length > 0;
    }
    // All other steps: optional
    return true;
  }, [currentStep, formData.song.title]);

  const handleNext = () => {
    markStepCompleted(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Handler for StyleEditor save
   */
  const handleStyleSave = (style: StyleCreate) => {
    updateStyleData(style);
    markStepCompleted(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for StyleEditor cancel/skip
   */
  const handleStyleCancel = () => {
    updateStyleData(null);
    markStepSkipped(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for LyricsEditor save
   */
  const handleLyricsSave = (lyrics: LyricsCreate) => {
    // Remove temporary song_id before storing
    const { song_id: _song_id, ...lyricsData } = lyrics;
    updateLyricsData(lyricsData as Partial<LyricsCreate>);
    markStepCompleted(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for LyricsEditor cancel/skip
   */
  const handleLyricsCancel = () => {
    updateLyricsData(null);
    markStepSkipped(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for PersonaEditor save
   */
  const handlePersonaSave = (persona: PersonaCreate) => {
    updatePersonaData(persona);
    markStepCompleted(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for PersonaEditor cancel/skip
   */
  const handlePersonaCancel = () => {
    updatePersonaData(null);
    markStepSkipped(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for ProducerNotesEditor save
   */
  const handleProducerNotesSave = (notes: ProducerNotesCreate) => {
    // Remove temporary song_id before storing
    const { song_id: _song_id, ...notesData } = notes;
    updateProducerNotesData(notesData as Partial<ProducerNotesCreate>);
    markStepCompleted(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for ProducerNotesEditor cancel/skip
   */
  const handleProducerNotesCancel = () => {
    updateProducerNotesData(null);
    markStepSkipped(currentStep);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Handler for cancel button with confirmation dialog
   * Detects if user has entered any data and prompts before navigating away
   */
  const handleCancel = () => {
    const hasData = formData.song.title ||
                    formData.song.description ||
                    formData.song.genre ||
                    formData.song.mood.length > 0 ||
                    formData.style ||
                    formData.lyrics ||
                    formData.persona ||
                    formData.producerNotes;

    if (hasData) {
      if (confirm('Are you sure? All progress will be lost. (Your draft is auto-saved and will be available when you return.)')) {
        localStorage.removeItem('song-wizard-draft');
        router.push(ROUTES.SONGS);
      }
    } else {
      router.push(ROUTES.SONGS);
    }
  };

  /**
   * Navigate back to a specific step for editing
   */
  const handleEditStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  /**
   * Handle final submission - orchestrate multi-entity creation
   * On success, clears draft and navigates to the created song's detail page
   */
  const handleSubmit = async () => {
    try {
      const songId = await submitWizard(formData);
      // Clear draft on successful submission
      localStorage.removeItem('song-wizard-draft');
      // Navigate to the created song's detail page
      router.push(ROUTES.SONG_DETAIL(songId));
    } catch (error) {
      // Error handling is done in the hook via toast notifications
      console.error('Submission failed:', error);
    }
  };

  const currentStepConfig = WIZARD_STEPS[currentStep];
  const isSubmitting = wizardIsSubmitting || createSong.isPending;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Create New Song"
        description="Follow the steps to design your song"
      />

      <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isSkipped = skippedSteps.has(index);
              const isOptional = index > 0; // Steps 1-5 are optional

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-ui ${
                        isActive
                          ? 'bg-primary shadow-lg text-primaryForeground scale-110'
                          : isCompleted
                            ? 'bg-success text-white'
                            : isSkipped
                              ? 'bg-warning/20 border-2 border-warning text-warning'
                              : 'bg-panel border-2 border-border text-text-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : isSkipped ? (
                        <span className="text-sm font-bold">⊘</span>
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-sm font-medium transition-colors duration-ui ${
                          isActive
                            ? 'text-text-strong'
                            : 'text-text-muted'
                        }`}
                      >
                        {step.label}
                      </span>
                      {isOptional && !isCompleted && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info font-medium">
                          Optional
                        </span>
                      )}
                      {isSkipped && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                          Skipped
                        </span>
                      )}
                    </div>
                  </div>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded transition-colors duration-ui ${
                        isCompleted ? 'bg-success' : 'bg-border'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 ? (
          <StyleEditor
            initialValue={formData.style || undefined}
            onSave={handleStyleSave}
            onCancel={handleStyleCancel}
            className="rounded-lg border border-border shadow-elev1 bg-surface"
          />
        ) : currentStep === 2 ? (
          <LyricsEditor
            songId="wizard-temp-id"
            initialValue={formData.lyrics || undefined}
            onSave={handleLyricsSave}
            onCancel={handleLyricsCancel}
            className="rounded-lg border border-border shadow-elev1 bg-surface"
          />
        ) : currentStep === 3 ? (
          <PersonaEditor
            initialValue={formData.persona || undefined}
            onSave={handlePersonaSave}
            onCancel={handlePersonaCancel}
            className="rounded-lg border border-border shadow-elev1 bg-surface"
          />
        ) : currentStep === 4 ? (
          <ProducerNotesEditor
            songId="wizard-temp-id"
            initialValue={formData.producerNotes || undefined}
            onSave={handleProducerNotesSave}
            onCancel={handleProducerNotesCancel}
            className="rounded-lg border border-border shadow-elev1 bg-surface"
          />
        ) : (
          <Card className="bg-surface border-border shadow-elev1 p-10 mb-6 animate-slide-up">
            <h2 className="text-2xl font-semibold text-text-strong mb-8">{currentStepConfig?.label}</h2>

            {currentStep === 0 && (
              <SongInfoStep formData={formData} updateSongData={updateSongData} />
            )}
            {currentStep === 5 && <ReviewStep formData={formData} onEditStep={handleEditStep} />}
          </Card>
        )}

        {/* Navigation */}
        {![1, 2, 3, 4].includes(currentStep) && (
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleCancel} className="px-6 py-3" disabled={isSubmitting}>
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} className="px-6 py-3" disabled={isSubmitting}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProgress || isSubmitting}
                  className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.song.title || isSubmitting}
                  className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Song
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Previous Button for Editor Steps */}
        {[1, 2, 3, 4].includes(currentStep) && currentStep > 0 && (
          <div className="flex justify-start">
            <Button variant="outline" onClick={handlePrevious} className="px-6 py-3" disabled={isSubmitting}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          </div>
        )}
      </div>

      {/* Submission Progress Modal */}
      <SubmissionProgressModal progress={progress} isOpen={isSubmitting} />
    </div>
  );
}

interface SongInfoStepProps {
  formData: WizardFormData;
  updateSongData: (updates: Partial<WizardFormData['song']>) => void;
}

function SongInfoStep({ formData, updateSongData }: SongInfoStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-text-strong mb-3">Song Title *</label>
        <input
          type="text"
          className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
          placeholder="Enter song title..."
          value={formData.song.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSongData({ title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-strong mb-3">Description</label>
        <textarea
          className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui resize-none"
          rows={5}
          placeholder="Describe your song concept..."
          value={formData.song.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSongData({ description: e.target.value })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-strong mb-3">Genre *</label>
          <select
            className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
            value={formData.song.genre}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSongData({ genre: e.target.value })}
          >
            <option value="">Select genre...</option>
            <option value="pop">Pop</option>
            <option value="rock">Rock</option>
            <option value="hip-hop">Hip Hop</option>
            <option value="electronic">Electronic</option>
            <option value="country">Country</option>
            <option value="r&b">R&B</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-strong mb-3">Mood</label>
          <input
            type="text"
            className="w-full px-5 py-3.5 rounded-lg border-2 border-border bg-panel text-text-base placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-ui"
            placeholder="e.g., upbeat, melancholic..."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Props for EntityReviewSection component
 */
interface EntityReviewSectionProps {
  title: string;
  data: Record<string, unknown> | null;
  stepIndex: number;
  onEdit: (stepIndex: number) => void;
  isRequired?: boolean;
}

/**
 * Reusable component for displaying entity data in review step
 * Shows key fields if data is present, or "Not provided" message if null
 */
function EntityReviewSection({
  title,
  data,
  stepIndex,
  onEdit,
  isRequired = false,
}: EntityReviewSectionProps) {
  const isEmpty = data === null || data === undefined;

  return (
    <div className={`bg-panel border-2 rounded-xl p-8 transition-all duration-ui ${
      isEmpty ? 'border-border' : 'border-border hover:border-primary/30'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-strong">{title}</h3>
        <Button
          variant="outline"
          onClick={() => onEdit(stepIndex)}
          className="gap-2 px-4 py-2 text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {isEmpty ? (
        <div className="text-text-muted italic py-4">
          No {title.toLowerCase()} provided{!isRequired && ' (optional)'}
        </div>
      ) : (
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {title === 'Song Information' && (
            <>
              <div>
                <dt className="text-sm font-medium text-text-muted mb-2">Title</dt>
                <dd className="font-medium text-text-base text-lg">{(data.title as string) || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-muted mb-2">Genre</dt>
                <dd className="font-medium text-text-base text-lg">{(data.genre as string) || 'Not set'}</dd>
              </div>
              {data.mood && Array.isArray(data.mood) && data.mood.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Moods</dt>
                  <dd className="font-medium text-text-base">{data.mood.join(', ')}</dd>
                </div>
              )}
              {data.description && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Description</dt>
                  <dd className="font-medium text-text-base line-clamp-2">{data.description as string}</dd>
                </div>
              )}
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-text-muted mb-2">Global Seed</dt>
                <dd className="font-medium text-text-base font-mono text-xs bg-panel p-3 rounded border border-border">{data.global_seed as number}</dd>
              </div>
            </>
          )}

          {title === 'Style' && (
            <>
              {data.genre && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Genre</dt>
                  <dd className="font-medium text-text-base">{data.genre as string}</dd>
                </div>
              )}
              {(data.bpm_min || data.bpm_max) && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">BPM Range</dt>
                  <dd className="font-medium text-text-base">{(data.bpm_min as number) || 0} - {(data.bpm_max as number) || 0}</dd>
                </div>
              )}
              {data.key && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Key</dt>
                  <dd className="font-medium text-text-base">{data.key as string}</dd>
                </div>
              )}
              {data.energy_level !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Energy Level</dt>
                  <dd className="font-medium text-text-base">{data.energy_level as number}/10</dd>
                </div>
              )}
              {data.mood && Array.isArray(data.mood) && data.mood.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Moods</dt>
                  <dd className="font-medium text-text-base">{data.mood.slice(0, 3).join(', ')}</dd>
                </div>
              )}
              {data.instrumentation && Array.isArray(data.instrumentation) && data.instrumentation.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Instrumentation</dt>
                  <dd className="font-medium text-text-base">{data.instrumentation.slice(0, 3).join(', ')}</dd>
                </div>
              )}
            </>
          )}

          {title === 'Lyrics' && (
            <>
              {data.sections && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Sections</dt>
                  <dd className="font-medium text-text-base">{Array.isArray(data.sections) ? data.sections.length : 0}</dd>
                </div>
              )}
              {data.pov && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Point of View</dt>
                  <dd className="font-medium text-text-base capitalize">{(data.pov as string).replace('-', ' ')}</dd>
                </div>
              )}
              {data.rhyme_scheme && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Rhyme Scheme</dt>
                  <dd className="font-medium text-text-base">{data.rhyme_scheme as string}</dd>
                </div>
              )}
              {data.themes && Array.isArray(data.themes) && data.themes.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Themes</dt>
                  <dd className="font-medium text-text-base">{data.themes.join(', ')}</dd>
                </div>
              )}
            </>
          )}

          {title === 'Persona' && (
            <>
              {data.name && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Name</dt>
                  <dd className="font-medium text-text-base">{data.name as string}</dd>
                </div>
              )}
              {data.vocal_range && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Vocal Range</dt>
                  <dd className="font-medium text-text-base">{data.vocal_range as string}</dd>
                </div>
              )}
              {data.influences && Array.isArray(data.influences) && data.influences.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Influences</dt>
                  <dd className="font-medium text-text-base">{data.influences.slice(0, 3).join(', ')}</dd>
                </div>
              )}
            </>
          )}

          {title === 'Producer Notes' && (
            <>
              {data.structure && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Structure</dt>
                  <dd className="font-medium text-text-base line-clamp-1">{data.structure as string}</dd>
                </div>
              )}
              {data.hooks !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Target Hook Count</dt>
                  <dd className="font-medium text-text-base">{data.hooks as number}</dd>
                </div>
              )}
              {data.instrumentation && Array.isArray(data.instrumentation) && data.instrumentation.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Instrumentation</dt>
                  <dd className="font-medium text-text-base">{data.instrumentation.slice(0, 3).join(', ')}</dd>
                </div>
              )}
            </>
          )}
        </dl>
      )}
    </div>
  );
}

interface ReviewStepProps {
  formData: WizardFormData;
  onEditStep: (stepIndex: number) => void;
}

function ReviewStep({ formData, onEditStep }: ReviewStepProps) {
  /**
   * Generate validation summary with required and optional fields
   */
  const getValidationSummary = (): { required: string[]; optional: string[] } => {
    const required: string[] = [];
    const optional: string[] = [];

    // Check required fields
    if (!formData.song.title || formData.song.title.trim().length === 0) {
      required.push('Song title');
    }

    // Check optional fields
    if (!formData.style) optional.push('Style');
    if (!formData.lyrics) optional.push('Lyrics');
    if (!formData.persona) optional.push('Persona');
    if (!formData.producerNotes) optional.push('Producer Notes');

    return { required, optional };
  };

  const summary = getValidationSummary();
  const providedCount = [
    formData.style,
    formData.lyrics,
    formData.persona,
    formData.producerNotes,
  ].filter(item => item !== null).length;

  const totalOptional = 4;

  return (
    <div className="space-y-8">
      {/* Validation Summary - Show before content */}
      {summary.required.length > 0 && (
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-6">
          <h4 className="font-semibold text-destructive mb-3">Required items missing:</h4>
          <ul className="list-disc list-inside text-sm text-text-base space-y-1">
            {summary.required.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.optional.length > 0 && (
        <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-6">
          <h4 className="font-semibold text-warning mb-3">Optional items not provided:</h4>
          <ul className="list-disc list-inside text-sm text-text-base space-y-1">
            {summary.optional.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-xs text-text-muted mt-3">
            You can add these later from the song detail page after creation.
          </p>
        </div>
      )}

      {summary.required.length === 0 && summary.optional.length === 0 && (
        <div className="bg-success/10 border-2 border-success/30 rounded-xl p-6">
          <h4 className="font-semibold text-success mb-3">All items provided:</h4>
          <p className="text-sm text-text-base">
            You have filled in all available fields. Your song is ready to create!
          </p>
        </div>
      )}

      {/* Required Song Information */}
      <EntityReviewSection
        title="Song Information"
        data={formData.song as Record<string, unknown>}
        stepIndex={0}
        onEdit={onEditStep}
        isRequired={true}
      />

      {/* Optional Entities */}
      <EntityReviewSection
        title="Style"
        data={formData.style as Record<string, unknown> | null}
        stepIndex={1}
        onEdit={onEditStep}
      />

      <EntityReviewSection
        title="Lyrics"
        data={formData.lyrics as Record<string, unknown> | null}
        stepIndex={2}
        onEdit={onEditStep}
      />

      <EntityReviewSection
        title="Persona"
        data={formData.persona as Record<string, unknown> | null}
        stepIndex={3}
        onEdit={onEditStep}
      />

      <EntityReviewSection
        title="Producer Notes"
        data={formData.producerNotes as Record<string, unknown> | null}
        stepIndex={4}
        onEdit={onEditStep}
      />

      {/* Completion Summary */}
      <div className="bg-info/10 border-2 border-info/30 rounded-xl p-6">
        <h4 className="font-semibold text-info mb-3">Completion Status</h4>
        <div className="space-y-2 text-sm text-text-base">
          <p>
            <strong>{providedCount}</strong> of <strong>{totalOptional}</strong> optional entities completed.
          </p>
          <p className="text-text-muted">
            All optional entities can be edited or added later from the song detail page.
            Click <strong>Edit</strong> on any section above to make changes before creating.
          </p>
        </div>
      </div>
    </div>
  );
}
