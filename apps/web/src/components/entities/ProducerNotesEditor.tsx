'use client';

import { useState, useEffect } from 'react';
import { ProducerNotesBase, ProducerNotesCreate, MixConfig, ProducerNotes } from '@/types/api/entities';
import { ChipSelector } from './common/ChipSelector';
import { SectionEditor, Section } from './common/SectionEditor';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { LibrarySelector } from './common/LibrarySelector';
import { Save, X } from 'lucide-react';
import { useProducerNotesList } from '@/hooks/api/useProducerNotes';

export interface ProducerNotesEditorProps {
  songId?: string;
  initialValue?: Partial<ProducerNotesBase>;
  onSave: (notes: ProducerNotesCreate) => void;
  onCancel: () => void;
  className?: string;
  showLibrarySelector?: boolean;
}

const STRUCTURE_TYPES = [
  { value: 'intro', label: 'Intro', color: 'bg-gray-500/20 border-gray-500/40' },
  { value: 'build', label: 'Build', color: 'bg-accent-secondary/20 border-accent-secondary/40' },
  { value: 'drop', label: 'Drop', color: 'bg-accent-music/20 border-accent-music/40' },
  { value: 'breakdown', label: 'Breakdown', color: 'bg-accent-warning/20 border-accent-warning/40' },
  { value: 'verse', label: 'Verse', color: 'bg-accent-primary/20 border-accent-primary/40' },
  { value: 'chorus', label: 'Chorus', color: 'bg-accent-success/20 border-accent-success/40' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-500/20 border-gray-500/40' },
];

const INSTRUMENTATION_OPTIONS = [
  'synth lead',
  'bass drop',
  'guitar riff',
  'piano melody',
  'drum fill',
  'vocal layer',
  'string section',
  'brass stab',
];

export function ProducerNotesEditor({
  songId,
  initialValue = {},
  onSave,
  onCancel,
  className = '',
  showLibrarySelector = false,
}: ProducerNotesEditorProps) {
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

    const saveData: ProducerNotesCreate = {
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
      mix: { ...prev.mix, [field]: value },
    }));
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

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-background-secondary">
        <h2 className="text-lg font-semibold text-text-primary">
          Producer Notes Editor
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-accent-secondary hover:text-accent-primary transition-colors md:hidden"
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border-secondary text-text-secondary hover:border-border-primary hover:text-text-primary transition-colors"
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
                <div className="flex-1 h-px bg-border-secondary" />
                <span>Or create new:</span>
                <div className="flex-1 h-px bg-border-secondary" />
              </div>
            </>
          )}

          <SectionEditor
            label="Arrangement Structure"
            sections={sections}
            onChange={setSections}
            sectionTypes={STRUCTURE_TYPES}
            showDuration
            helpText="Define the production arrangement flow"
          />

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
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Recommended: 2-4 for commercial songs
            </p>
          </div>

          <ChipSelector
            label="Additional Instrumentation"
            value={formData.instrumentation || []}
            onChange={(value) => updateField('instrumentation', value)}
            suggestions={INSTRUMENTATION_OPTIONS}
            placeholder="Add production elements..."
            helpText="Production elements beyond the style spec"
          />

          <div className="space-y-4 p-4 rounded-lg bg-background-tertiary border border-border-secondary">
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
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
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
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
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
                    className="w-4 h-4 text-accent-primary focus:ring-2 focus:ring-border-focus"
                  />
                  <span className="text-sm text-text-primary">Narrow</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="normal"
                    checked={formData.mix?.stereo_width === 'normal'}
                    onChange={(e) => updateMix('stereo_width', e.target.value as any)}
                    className="w-4 h-4 text-accent-primary focus:ring-2 focus:ring-border-focus"
                  />
                  <span className="text-sm text-text-primary">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="wide"
                    checked={formData.mix?.stereo_width === 'wide'}
                    onChange={(e) => updateMix('stereo_width', e.target.value as any)}
                    className="w-4 h-4 text-accent-primary focus:ring-2 focus:ring-border-focus"
                  />
                  <span className="text-sm text-text-primary">Wide</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="w-full md:w-96 border-l border-border-secondary bg-background-secondary">
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
