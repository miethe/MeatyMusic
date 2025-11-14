/**
 * New Song Page
 * Multi-step wizard for creating a new song with support for all entity types
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@meatymusic/ui';
import { Button } from '@meatymusic/ui';
import { StyleEditor } from '@/components/entities/StyleEditor';
import { LyricsEditor } from '@/components/entities/LyricsEditor';
import { PersonaEditor } from '@/components/entities/PersonaEditor';
import { ProducerNotesEditor } from '@/components/entities/ProducerNotesEditor';
import { ROUTES } from '@/config/routes';
import { useCreateSong } from '@/hooks/api/useSongs';
import { SongCreate, StyleCreate, LyricsCreate, PersonaCreate, ProducerNotesCreate } from '@/types/api/entities';
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

export default function NewSongPage() {
  const router = useRouter();
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
    const { song_id, ...lyricsData } = lyrics;
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
    const { song_id, ...notesData } = notes;
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

  const handleCancel = () => {
    router.push(ROUTES.SONGS);
  };

  /**
   * Navigate back to a specific step for editing
   */
  const handleEditStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    try {
      const songData = {
        title: formData.song.title,
        global_seed: formData.song.global_seed,
        sds_version: formData.song.sds_version,
        extra_metadata: {
          description: formData.song.description,
          genre: formData.song.genre,
          mood: formData.song.mood,
        },
      };

      await createSong.mutateAsync(songData);
      router.push(ROUTES.SONGS);
    } catch (error) {
      console.error('Failed to create song:', error);
      // Error toast is handled by the mutation hook
    }
  };

  const currentStepConfig = WIZARD_STEPS[currentStep];

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
              const isPending = !isActive && !isCompleted && !isSkipped;

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
                        isCompleted ? 'bg-success' : isPending || isSkipped ? 'bg-border' : 'bg-border'
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
            <Button variant="outline" onClick={handleCancel} className="px-6 py-3">
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} className="px-6 py-3">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProgress}
                  className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.song.title || createSong.isPending}
                  className="bg-primary text-primaryForeground hover:opacity-90 transition-all duration-ui px-6 py-3"
                >
                  {createSong.isPending ? (
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
            <Button variant="outline" onClick={handlePrevious} className="px-6 py-3">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          </div>
        )}
      </div>
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
  data: any | null;
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
                <dd className="font-medium text-text-base text-lg">{data.title || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-muted mb-2">Genre</dt>
                <dd className="font-medium text-text-base text-lg">{data.genre || 'Not set'}</dd>
              </div>
              {data.mood && data.mood.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Moods</dt>
                  <dd className="font-medium text-text-base">{data.mood.join(', ')}</dd>
                </div>
              )}
              {data.description && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Description</dt>
                  <dd className="font-medium text-text-base line-clamp-2">{data.description}</dd>
                </div>
              )}
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-text-muted mb-2">Global Seed</dt>
                <dd className="font-medium text-text-base font-mono text-xs bg-panel p-3 rounded border border-border">{data.global_seed}</dd>
              </div>
            </>
          )}

          {title === 'Style' && (
            <>
              {data.genre && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Genre</dt>
                  <dd className="font-medium text-text-base">{data.genre}</dd>
                </div>
              )}
              {(data.bpm_min || data.bpm_max) && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">BPM Range</dt>
                  <dd className="font-medium text-text-base">{data.bpm_min || 0} - {data.bpm_max || 0}</dd>
                </div>
              )}
              {data.key && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Key</dt>
                  <dd className="font-medium text-text-base">{data.key}</dd>
                </div>
              )}
              {data.energy_level !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Energy Level</dt>
                  <dd className="font-medium text-text-base">{data.energy_level}/10</dd>
                </div>
              )}
              {data.mood && data.mood.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-text-muted mb-2">Moods</dt>
                  <dd className="font-medium text-text-base">{data.mood.slice(0, 3).join(', ')}</dd>
                </div>
              )}
              {data.instrumentation && data.instrumentation.length > 0 && (
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
                  <dd className="font-medium text-text-base capitalize">{data.pov.replace('-', ' ')}</dd>
                </div>
              )}
              {data.rhyme_scheme && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Rhyme Scheme</dt>
                  <dd className="font-medium text-text-base">{data.rhyme_scheme}</dd>
                </div>
              )}
              {data.themes && data.themes.length > 0 && (
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
                  <dd className="font-medium text-text-base">{data.name}</dd>
                </div>
              )}
              {data.vocal_range && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Vocal Range</dt>
                  <dd className="font-medium text-text-base">{data.vocal_range}</dd>
                </div>
              )}
              {data.influences && data.influences.length > 0 && (
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
                  <dd className="font-medium text-text-base line-clamp-1">{data.structure}</dd>
                </div>
              )}
              {data.hooks !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-text-muted mb-2">Target Hook Count</dt>
                  <dd className="font-medium text-text-base">{data.hooks}</dd>
                </div>
              )}
              {data.instrumentation && data.instrumentation.length > 0 && (
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
  // Count provided optional entities
  const providedCount = [
    formData.style,
    formData.lyrics,
    formData.persona,
    formData.producerNotes,
  ].filter(item => item !== null).length;

  const totalOptional = 4;

  return (
    <div className="space-y-8">
      {/* Required Song Information */}
      <EntityReviewSection
        title="Song Information"
        data={formData.song}
        stepIndex={0}
        onEdit={onEditStep}
        isRequired={true}
      />

      {/* Optional Entities */}
      <EntityReviewSection
        title="Style"
        data={formData.style}
        stepIndex={1}
        onEdit={onEditStep}
      />

      <EntityReviewSection
        title="Lyrics"
        data={formData.lyrics}
        stepIndex={2}
        onEdit={onEditStep}
      />

      <EntityReviewSection
        title="Persona"
        data={formData.persona}
        stepIndex={3}
        onEdit={onEditStep}
      />

      <EntityReviewSection
        title="Producer Notes"
        data={formData.producerNotes}
        stepIndex={4}
        onEdit={onEditStep}
      />

      {/* Validation Summary */}
      <div className="bg-info/10 border-2 border-info/30 rounded-xl p-6">
        <h4 className="font-semibold text-info mb-3">Review Summary</h4>
        <div className="space-y-2 text-sm text-text-base">
          <p>
            You have completed <strong>{providedCount}</strong> of <strong>{totalOptional}</strong> optional entities.
          </p>
          <p className="text-text-muted">
            All optional entities can be edited or added later from the song detail page.
            Click <strong>Edit</strong> on any section above to make changes.
          </p>
        </div>
      </div>
    </div>
  );
}
