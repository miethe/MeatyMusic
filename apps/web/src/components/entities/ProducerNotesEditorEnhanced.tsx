'use client';

import { useState, useEffect } from 'react';
import { ProducerNotesBase, ProducerNotesCreate, ProducerNotesUpdate, MixConfig, ProducerNotes } from '@/types/api/entities';
import { ChipSelector } from '@meatymusic/ui';
import { SectionEditor, Section } from './common/SectionEditor';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { LibrarySelector } from './common/LibrarySelector';
import { Save, X, Lightbulb } from 'lucide-react';
import { useProducerNotesList } from '@/hooks/api/useProducerNotes';

export interface ProducerNotesEditorEnhancedProps {
  songId?: string;
  initialValue?: Partial<ProducerNotesBase>;
  onSave: (notes: ProducerNotesCreate | ProducerNotesUpdate) => void;
  onCancel: () => void;
  className?: string;
  showLibrarySelector?: boolean;
}

const STRUCTURE_TYPES = [
  { value: 'intro', label: 'Intro', color: 'bg-gray-500/20 border-gray-500/40' },
  { value: 'build', label: 'Build', color: 'bg-blue-500/20 border-blue-500/40' },
  { value: 'drop', label: 'Drop', color: 'bg-green-500/20 border-green-500/40' },
  { value: 'breakdown', label: 'Breakdown', color: 'bg-yellow-500/20 border-yellow-500/40' },
  { value: 'verse', label: 'Verse', color: 'bg-purple-500/20 border-purple-500/40' },
  { value: 'chorus', label: 'Chorus', color: 'bg-pink-500/20 border-pink-500/40' },
  { value: 'bridge', label: 'Bridge', color: 'bg-orange-500/20 border-orange-500/40' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-500/20 border-gray-500/40' },
];

// Structure Template Presets
const STRUCTURE_TEMPLATES = [
  {
    name: 'ABAB (Classic Pop)',
    value: 'verse-chorus-verse-chorus',
    description: 'Traditional verse-chorus structure',
    sections: ['verse', 'chorus', 'verse', 'chorus'],
    estimatedDuration: 180, // seconds
  },
  {
    name: 'ABABCBB (Pop Hit)',
    value: 'verse-chorus-verse-chorus-bridge-chorus-chorus',
    description: 'Extended pop structure with bridge and double chorus finale',
    sections: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'chorus'],
    estimatedDuration: 210,
  },
  {
    name: 'ABACABA (Symmetrical)',
    value: 'verse-chorus-verse-bridge-verse-chorus-verse',
    description: 'Symmetrical structure with central bridge',
    sections: ['verse', 'chorus', 'verse', 'bridge', 'verse', 'chorus', 'verse'],
    estimatedDuration: 240,
  },
  {
    name: 'EDM Build-Drop',
    value: 'intro-build-drop-breakdown-build-drop-outro',
    description: 'Electronic music structure with build-up and drop',
    sections: ['intro', 'build', 'drop', 'breakdown', 'build', 'drop', 'outro'],
    estimatedDuration: 200,
  },
  {
    name: 'Hip-Hop Flow',
    value: 'intro-verse-chorus-verse-chorus-bridge-chorus-outro',
    description: 'Hip-hop structure with extended verses',
    sections: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    estimatedDuration: 195,
  },
  {
    name: 'Custom',
    value: 'custom',
    description: 'Build your own structure manually',
    sections: [],
    estimatedDuration: 0,
  },
];

const INSTRUMENTATION_OPTIONS = [
  { value: 'synth-lead', label: 'Synth Lead' },
  { value: 'bass-drop', label: 'Bass Drop' },
  { value: 'guitar-riff', label: 'Guitar Riff' },
  { value: 'piano-melody', label: 'Piano Melody' },
  { value: 'drum-fill', label: 'Drum Fill' },
  { value: 'vocal-layer', label: 'Vocal Layer' },
  { value: 'string-section', label: 'String Section' },
  { value: 'brass-stab', label: 'Brass Stab' },
];

export function ProducerNotesEditorEnhanced({
  songId,
  initialValue = {},
  onSave,
  onCancel,
  className = '',
  showLibrarySelector = false,
}: ProducerNotesEditorEnhancedProps) {
  const [formData, setFormData] = useState<Partial<ProducerNotesBase>>({
    song_id: songId,
    structure: '',
    hooks: 0,
    instrumentation: [],
    section_meta: {},
    mix: {
      lufs: -12,
      space: 'normal',
      stereo_width: 'normal',
    },
    ...initialValue,
  });

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Fetch library producer notes for selection
  const { data: producerNotesData } = useProducerNotesList();

  useEffect(() => {
    if (initialValue.structure) {
      const sectionNames = (initialValue.structure as string).split('-');
      const convertedSections = sectionNames.map((name, i) => ({
        id: `section-${i}`,
        type: name.toLowerCase(),
        duration: 0,
      }));
      setSections(convertedSections);
    }
  }, [initialValue.structure]);

  useEffect(() => {
    validateForm();
  }, [formData, sections]);

  useEffect(() => {
    const structureString = sections.map((s) => s.type).join('-');
    setFormData((prev) => ({ ...prev, structure: structureString }));
  }, [sections]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    if ((formData.hooks || 0) < 0) {
      errors.push({
        field: 'hooks',
        message: 'Hooks count cannot be negative',
        severity: 'error',
      });
    }

    if ((formData.hooks || 0) > 8) {
      errors.push({
        field: 'hooks',
        message: 'More than 8 hooks may overwhelm the arrangement',
        severity: 'warning',
      });
    }

    setValidationErrors(errors);
  };

  const handleSave = () => {
    const hasErrors = validationErrors.some((e) => e.severity === 'error');
    if (hasErrors) {
      return;
    }

    const saveData: ProducerNotesCreate | ProducerNotesUpdate = {
      ...formData,
      song_id: songId,
    } as ProducerNotesCreate;

    onSave(saveData);
  };

  const updateField = <K extends keyof ProducerNotesBase>(
    field: K,
    value: ProducerNotesBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateMix = <K extends keyof MixConfig>(field: K, value: MixConfig[K]) => {
    setFormData((prev) => ({
      ...prev,
      mix: { ...prev.mix, [field]: value } as MixConfig,
    }));
  };

  const handleTemplateSelect = (templateValue: string) => {
    setSelectedTemplate(templateValue);

    if (templateValue === 'custom') {
      // Keep current sections
      return;
    }

    const template = STRUCTURE_TEMPLATES.find((t) => t.value === templateValue);
    if (template && template.sections.length > 0) {
      const newSections = template.sections.map((type, i) => ({
        id: `section-${Date.now()}-${i}`,
        type,
        duration: Math.floor(template.estimatedDuration / template.sections.length),
      }));
      setSections(newSections);
    }
  };

  const handleLibrarySelect = (notes: ProducerNotes) => {
    // Remove id, timestamps, and song_id from library item (will use current songId)
    const { id, created_at, updated_at, song_id, ...notesData } = notes;
    setFormData({ ...notesData, song_id: songId });

    // Convert structure to sections
    if (notes.structure) {
      const sectionNames = notes.structure.split('-');
      const convertedSections = sectionNames.map((name, i) => ({
        id: `section-${i}`,
        type: name.toLowerCase(),
        duration: 0,
      }));
      setSections(convertedSections);
    }
  };

  const totalDuration = sections.reduce((sum, s) => sum + (s.duration || 0), 0);
  const selectedTemplateData = STRUCTURE_TEMPLATES.find((t) => t.value === selectedTemplate);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-surface">
        <h2 className="text-lg font-semibold text-text-primary">
          Producer Notes Editor
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-text-secondary hover:text-primary transition-colors md:hidden"
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:border-primary hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={validationErrors.some((e) => e.severity === 'error')}
            className="px-4 py-2 rounded-lg bg-gradient-primary text-text-primary font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showLibrarySelector && (
            <>
              <LibrarySelector
                items={producerNotesData?.items || []}
                onSelect={handleLibrarySelect}
                renderItem={(notes) => (
                  <div>
                    <div className="font-semibold text-text-primary">
                      {notes.structure || 'No structure'} • {notes.hooks} hooks
                    </div>
                    <div className="text-xs text-text-tertiary mt-1">
                      {notes.mix?.lufs && `LUFS: ${notes.mix.lufs}`}
                      {notes.mix?.space && ` • ${notes.mix.space}`}
                      {notes.instrumentation && notes.instrumentation.length > 0 && ` • ${notes.instrumentation.slice(0, 2).join(', ')}`}
                    </div>
                  </div>
                )}
                getItemKey={(notes) => notes.id}
                getItemSearchText={(notes) => `${notes.structure} ${notes.instrumentation?.join(' ')}`}
                emptyMessage="No producer notes in library. Create your first producer notes below."
                label="Add from Library"
              />

              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <div className="flex-1 h-px bg-border-default" />
                <span>Or create new:</span>
                <div className="flex-1 h-px bg-border-default" />
              </div>
            </>
          )}

          {/* Structure Template Selector */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Structure Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-default text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    {STRUCTURE_TEMPLATES.map((template) => (
                      <option key={template.value} value={template.value}>
                        {template.name}
                        {template.estimatedDuration > 0 && ` (≈${Math.floor(template.estimatedDuration / 60)}:${(template.estimatedDuration % 60).toString().padStart(2, '0')})`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplateData && selectedTemplateData.value !== 'custom' && (
                  <div className="text-xs text-text-secondary">
                    <p className="font-medium">{selectedTemplateData.description}</p>
                    <p className="mt-1">
                      Sections: {selectedTemplateData.sections.join(' → ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Per-Section Editor */}
          <SectionEditor
            label="Arrangement Structure"
            sections={sections}
            onChange={setSections}
            sectionTypes={STRUCTURE_TYPES}
            showDuration
            helperText="Define the production arrangement flow. Durations are in seconds."
          />

          {/* Duration Budget */}
          {sections.length > 0 && (
            <div className="p-4 rounded-lg bg-bg-elevated border border-border-default">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-primary">
                  Total Duration
                </span>
                <span className="text-lg font-bold text-text-primary">
                  {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              {selectedTemplateData && selectedTemplateData.estimatedDuration > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Template target: {Math.floor(selectedTemplateData.estimatedDuration / 60)}:{(selectedTemplateData.estimatedDuration % 60).toString().padStart(2, '0')}</span>
                    <span>
                      {totalDuration > selectedTemplateData.estimatedDuration ? '+' : ''}
                      {totalDuration - selectedTemplateData.estimatedDuration}s
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        totalDuration <= selectedTemplateData.estimatedDuration
                          ? 'bg-green-500'
                          : totalDuration <= selectedTemplateData.estimatedDuration * 1.1
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (totalDuration / selectedTemplateData.estimatedDuration) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hook Count */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Hook Count
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.hooks || 0}
              onChange={(e) => updateField('hooks', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-default text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Recommended: 2-4 for commercial songs
            </p>
          </div>

          {/* Additional Instrumentation */}
          <ChipSelector
            options={INSTRUMENTATION_OPTIONS}
            selected={formData.instrumentation || []}
            onChange={(value) => updateField('instrumentation', value)}
            label="Additional Instrumentation"
            helperText="Production elements beyond the style spec"
            placeholder="Add production elements..."
          />

          {/* Mix Parameters */}
          <div className="space-y-4 p-4 rounded-lg bg-bg-elevated border border-border-default">
            <h3 className="text-sm font-semibold text-text-primary">
              Mix Parameters
            </h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                LUFS Target
              </label>
              <input
                type="number"
                min="-24"
                max="0"
                step="0.1"
                value={formData.mix?.lufs || -12}
                onChange={(e) =>
                  updateMix('lufs', parseFloat(e.target.value) || -12)
                }
                className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-default text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <p className="text-xs text-text-tertiary mt-1">
                Typical range: -12 to -6 LUFS
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Space
              </label>
              <select
                value={formData.mix?.space || 'normal'}
                onChange={(e) => updateMix('space', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-default text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value="dry">Dry</option>
                <option value="normal">Normal</option>
                <option value="roomy">Roomy</option>
                <option value="lush">Lush</option>
                <option value="vintage-tape">Vintage Tape</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Stereo Width
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="narrow"
                    checked={formData.mix?.stereo_width === 'narrow'}
                    onChange={(e) => updateMix('stereo_width', e.target.value as any)}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Narrow</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="normal"
                    checked={formData.mix?.stereo_width === 'normal'}
                    onChange={(e) => updateMix('stereo_width', e.target.value as any)}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="wide"
                    checked={formData.mix?.stereo_width === 'wide'}
                    onChange={(e) => updateMix('stereo_width', e.target.value as any)}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">Wide</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="w-full md:w-96 border-l border-border-default bg-bg-surface">
            <EntityPreviewPanel
              entity={formData as Record<string, unknown>}
              validationErrors={validationErrors}
            />
          </div>
        )}
      </div>
    </div>
  );
}
