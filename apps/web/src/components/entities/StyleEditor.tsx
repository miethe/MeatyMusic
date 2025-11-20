'use client';

import { useState, useEffect } from 'react';
import { StyleBase, StyleCreate, Style } from '@/types/api/entities';
import { ChipSelector } from '@meatymusic/ui';
import { RangeSlider } from './common/RangeSlider';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { LibrarySelector } from './common/LibrarySelector';
import { Save, X } from 'lucide-react';
import { useStyles } from '@/hooks/api/useStyles';

export interface StyleEditorProps {
  initialValue?: Partial<StyleBase>;
  onSave: (style: StyleCreate) => void;
  onCancel: () => void;
  className?: string;
  showLibrarySelector?: boolean;
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
  showLibrarySelector = false,
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

  // Fetch library styles for selection
  const { data: stylesData } = useStyles();

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

  const handleLibrarySelect = (style: Style) => {
    // Remove id and timestamps from library item
    const { id, created_at, updated_at, ...styleData } = style;
    setFormData(styleData);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-default bg-bg-surface">
        <h2 className="text-lg font-semibold text-text-primary">Style Editor</h2>
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
                items={stylesData?.items || []}
                onSelect={handleLibrarySelect}
                renderItem={(style) => (
                  <div>
                    <div className="font-semibold text-text-primary">{style.name}</div>
                    <div className="text-xs text-text-tertiary mt-1">
                      {style.genre} • {style.bpm_min}-{style.bpm_max} BPM
                      {style.mood && style.mood.length > 0 && ` • ${style.mood.slice(0, 2).join(', ')}`}
                    </div>
                  </div>
                )}
                getItemKey={(style) => style.id}
                getItemSearchText={(style) => `${style.name} ${style.genre} ${style.mood?.join(' ')}`}
                emptyMessage="No styles in library. Create your first style below."
                label="Add from Library"
              />

              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <div className="flex-1 h-px bg-border-default" />
                <span>Or create new:</span>
                <div className="flex-1 h-px bg-border-default" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Style Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Modern Pop Ballad"
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Primary Genre <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.genre || ''}
                onChange={(e) => updateField('genre', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-default text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value="" className="bg-bg-base text-text-primary">Select genre...</option>
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre.toLowerCase()} className="bg-bg-base text-text-primary">
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
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-default text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                <option value="" className="bg-bg-base text-text-primary">Select key...</option>
                {KEY_OPTIONS.map((key) => (
                  <option key={key} value={key} className="bg-bg-base text-text-primary">
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ChipSelector
            label="Subgenres"
            selected={formData.sub_genres || []}
            onChange={(value) => updateField('sub_genres', value)}
            options={GENRE_OPTIONS.map((g) => ({ value: g.toLowerCase(), label: g }))}
            maxSelections={3}
            allowCreate
            placeholder="Add subgenres..."
            helperText="Maximum 3 subgenres recommended"
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
            helperText="Select a single value or range for tempo flexibility"
          />

          <RangeSlider
            label="Energy Level"
            min={1}
            max={10}
            value={formData.energy_level || 5}
            onChange={(value) => updateField('energy_level', typeof value === 'number' ? value : value[0])}
            allowRange={false}
            helperText="1 = Low, 10 = Anthemic"
          />

          <ChipSelector
            label="Mood"
            selected={formData.mood || []}
            onChange={(value) => updateField('mood', value)}
            options={MOOD_OPTIONS.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
            maxSelections={5}
            allowCreate
            placeholder="Add mood tags..."
            helperText="Describe the emotional tone"
          />

          <ChipSelector
            label="Instrumentation"
            selected={formData.instrumentation || []}
            onChange={(value) => updateField('instrumentation', value)}
            options={INSTRUMENTATION_OPTIONS.map((i) => ({ value: i, label: i.charAt(0).toUpperCase() + i.slice(1) }))}
            maxSelections={5}
            allowCreate
            warning={
              (formData.instrumentation?.length || 0) > 3
                ? 'More than 3 instruments may dilute the mix'
                : undefined
            }
            placeholder="Add instruments..."
            helperText="Primary instruments in the arrangement"
          />

          <div className="space-y-4">
            <ChipSelector
              label="Positive Tags"
              selected={formData.tags_positive || []}
              onChange={(value) => updateField('tags_positive', value)}
              options={[]}
              allowCreate
              placeholder="Add style tags..."
              helperText="Tags to include in the composition"
            />

            <ChipSelector
              label="Negative Tags"
              selected={formData.tags_negative || []}
              onChange={(value) => updateField('tags_negative', value)}
              options={[]}
              allowCreate
              placeholder="Add exclusion tags..."
              helperText="Tags to avoid or exclude"
            />
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
