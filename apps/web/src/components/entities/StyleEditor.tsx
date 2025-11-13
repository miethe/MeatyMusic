'use client';

import { useState, useEffect } from 'react';
import { StyleBase, StyleCreate } from '@/types/api/entities';
import { ChipSelector } from './common/ChipSelector';
import { RangeSlider } from './common/RangeSlider';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { Save, X } from 'lucide-react';

export interface StyleEditorProps {
  initialValue?: Partial<StyleBase>;
  onSave: (style: StyleCreate) => void;
  onCancel: () => void;
  className?: string;
}

const GENRE_OPTIONS = [
  'Pop',
  'Rock',
  'Hip-Hop',
  'Country',
  'R&B',
  'Electronic',
  'Indie',
  'Alternative',
  'Jazz',
  'Classical',
  'Folk',
  'Metal',
  'K-Pop',
  'Latin',
  'Afrobeats',
];

const MOOD_OPTIONS = [
  'upbeat',
  'melancholic',
  'energetic',
  'calm',
  'dark',
  'uplifting',
  'romantic',
  'aggressive',
  'dreamy',
  'nostalgic',
  'triumphant',
  'introspective',
];

const INSTRUMENTATION_OPTIONS = [
  'guitar',
  'piano',
  'drums',
  'bass',
  'synth',
  'strings',
  'brass',
  'vocals',
  '808s',
  'acoustic',
];

const KEY_OPTIONS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

const BPM_PRESETS = [
  { label: 'Slow (60-80)', value: [60, 80] as [number, number] },
  { label: 'Moderate (80-120)', value: [80, 120] as [number, number] },
  { label: 'Fast (120-160)', value: [120, 160] as [number, number] },
  { label: 'Very Fast (160-220)', value: [160, 220] as [number, number] },
];

export function StyleEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
}: StyleEditorProps) {
  const [formData, setFormData] = useState<Partial<StyleBase>>({
    name: '',
    genre: '',
    sub_genres: [],
    bpm_min: 120,
    bpm_max: 120,
    key: '',
    modulations: [],
    mood: [],
    energy_level: 5,
    instrumentation: [],
    tags_positive: [],
    tags_negative: [],
    ...initialValue,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    if (!formData.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Style name is required',
        severity: 'error',
      });
    }

    if (!formData.genre?.trim()) {
      errors.push({
        field: 'genre',
        message: 'Genre is required',
        severity: 'error',
      });
    }

    if ((formData.instrumentation?.length || 0) > 3) {
      errors.push({
        field: 'instrumentation',
        message: 'More than 3 instruments may dilute the mix',
        severity: 'warning',
      });
    }

    if (formData.mood && formData.mood.length > 5) {
      errors.push({
        field: 'mood',
        message: 'Too many moods may cause conflicting directions',
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

    onSave(formData as StyleCreate);
  };

  const updateField = <K extends keyof StyleBase>(
    field: K,
    value: StyleBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-background-secondary">
        <h2 className="text-lg font-semibold text-text-primary">Style Editor</h2>
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
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Style Name <span className="text-accent-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Modern Pop Ballad"
              className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Primary Genre <span className="text-accent-error">*</span>
              </label>
              <select
                value={formData.genre || ''}
                onChange={(e) => updateField('genre', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
              >
                <option value="">Select genre...</option>
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre.toLowerCase()}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Key
              </label>
              <select
                value={formData.key || ''}
                onChange={(e) => updateField('key', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
              >
                <option value="">Select key...</option>
                {KEY_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ChipSelector
            label="Subgenres"
            value={formData.sub_genres || []}
            onChange={(value) => updateField('sub_genres', value)}
            suggestions={GENRE_OPTIONS.map((g) => g.toLowerCase())}
            maxChips={3}
            placeholder="Add subgenres..."
            helpText="Maximum 3 subgenres recommended"
          />

          <RangeSlider
            label="Tempo (BPM)"
            min={40}
            max={220}
            value={[formData.bpm_min || 120, formData.bpm_max || 120]}
            onChange={(value) => {
              const [min, max] = Array.isArray(value) ? value : [value, value];
              updateField('bpm_min', min);
              updateField('bpm_max', max);
            }}
            unit=" BPM"
            presets={BPM_PRESETS}
            required
            helpText="Select a single value or range for tempo flexibility"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Energy Level
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.energy_level || 5}
                onChange={(e) =>
                  updateField('energy_level', parseInt(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-sm font-semibold text-text-primary w-8 text-right">
                {formData.energy_level || 5}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-tertiary mt-1">
              <span>Low</span>
              <span>Anthemic</span>
            </div>
          </div>

          <ChipSelector
            label="Mood"
            value={formData.mood || []}
            onChange={(value) => updateField('mood', value)}
            suggestions={MOOD_OPTIONS}
            maxChips={5}
            placeholder="Add mood tags..."
            helpText="Describe the emotional tone"
          />

          <ChipSelector
            label="Instrumentation"
            value={formData.instrumentation || []}
            onChange={(value) => updateField('instrumentation', value)}
            suggestions={INSTRUMENTATION_OPTIONS}
            maxChips={5}
            warning={
              (formData.instrumentation?.length || 0) > 3
                ? 'More than 3 instruments may dilute the mix'
                : undefined
            }
            placeholder="Add instruments..."
            helpText="Primary instruments in the arrangement"
          />

          <div className="space-y-4">
            <ChipSelector
              label="Positive Tags"
              value={formData.tags_positive || []}
              onChange={(value) => updateField('tags_positive', value)}
              suggestions={[]}
              placeholder="Add style tags..."
              helpText="Tags to include in the composition"
            />

            <ChipSelector
              label="Negative Tags"
              value={formData.tags_negative || []}
              onChange={(value) => updateField('tags_negative', value)}
              suggestions={[]}
              placeholder="Add exclusion tags..."
              helpText="Tags to avoid or exclude"
            />
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
