'use client';

import { useState, useEffect } from 'react';
import { BlueprintBase, BlueprintCreate } from '@/types/api/entities';
import { ChipSelector } from './common/ChipSelector';
import { RangeSlider } from './common/RangeSlider';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { Save, X } from 'lucide-react';

export interface BlueprintEditorProps {
  initialValue?: Partial<BlueprintBase>;
  onSave: (blueprint: BlueprintCreate) => void;
  onCancel: () => void;
  className?: string;
}

const GENRE_OPTIONS = [
  'pop',
  'rock',
  'hip-hop',
  'country',
  'r&b',
  'electronic',
  'indie',
  'alternative',
];

export function BlueprintEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
}: BlueprintEditorProps) {
  const [formData, setFormData] = useState<Partial<BlueprintBase>>({
    genre: '',
    version: '1.0',
    rules: {
      tempo_bpm: [60, 180],
      required_sections: ['chorus'],
      banned_terms: [],
      lexicon_positive: [],
      lexicon_negative: [],
      section_lines: {},
    },
    eval_rubric: {
      weights: {
        hook_density: 0.25,
        singability: 0.25,
        rhyme_tightness: 0.2,
        section_completeness: 0.2,
        profanity_score: 0.1,
      },
      thresholds: {
        min_total: 7.0,
        max_profanity: 2.0,
      },
    },
    ...initialValue,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    if (!formData.genre?.trim()) {
      errors.push({
        field: 'genre',
        message: 'Genre is required',
        severity: 'error',
      });
    }

    const weights = formData.eval_rubric?.weights;
    if (weights) {
      const sum = Object.values(weights).reduce((a, b) => (a || 0) + (b || 0), 0);
      if (Math.abs((sum || 0) - 1.0) > 0.01) {
        errors.push({
          field: 'eval_rubric.weights',
          message: `Weights must sum to 1.0 (current: ${sum?.toFixed(2)})`,
          severity: 'warning',
        });
      }
    }

    setValidationErrors(errors);
  };

  const handleSave = () => {
    const hasErrors = validationErrors.some((e) => e.severity === 'error');
    if (hasErrors) {
      return;
    }

    onSave(formData as BlueprintCreate);
  };

  const updateField = <K extends keyof BlueprintBase>(
    field: K,
    value: BlueprintBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateRuleField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      rules: { ...prev.rules, [field]: value },
    }));
  };

  const updateWeight = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      eval_rubric: {
        ...prev.eval_rubric,
        weights: { ...prev.eval_rubric?.weights, [field]: value },
      },
    }));
  };

  const updateThreshold = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      eval_rubric: {
        ...prev.eval_rubric,
        thresholds: { ...prev.eval_rubric?.thresholds, [field]: value },
      },
    }));
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-background-secondary">
        <h2 className="text-lg font-semibold text-text-primary">Blueprint Editor</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Genre <span className="text-accent-error">*</span>
              </label>
              <select
                value={formData.genre || ''}
                onChange={(e) => updateField('genre', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              >
                <option value="">Select genre...</option>
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Version
              </label>
              <input
                type="text"
                value={formData.version || '1.0'}
                onChange={(e) => updateField('version', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-background-tertiary border border-border-secondary">
            <h3 className="text-sm font-semibold text-text-primary">Rules</h3>

            <RangeSlider
              label="Tempo BPM Range"
              min={40}
              max={220}
              value={formData.rules?.tempo_bpm || [60, 180]}
              onChange={(value) => updateRuleField('tempo_bpm', value)}
              unit=" BPM"
              required
            />

            <ChipSelector
              label="Required Sections"
              value={formData.rules?.required_sections || []}
              onChange={(value) => updateRuleField('required_sections', value)}
              suggestions={['intro', 'verse', 'chorus', 'bridge', 'outro']}
              placeholder="Add required sections..."
            />

            <ChipSelector
              label="Banned Terms"
              value={formData.rules?.banned_terms || []}
              onChange={(value) => updateRuleField('banned_terms', value)}
              suggestions={[]}
              placeholder="Add banned terms..."
              helpText="Terms to avoid in generated content"
            />

            <ChipSelector
              label="Positive Lexicon"
              value={formData.rules?.lexicon_positive || []}
              onChange={(value) => updateRuleField('lexicon_positive', value)}
              suggestions={[]}
              placeholder="Add positive style tags..."
            />

            <ChipSelector
              label="Negative Lexicon"
              value={formData.rules?.lexicon_negative || []}
              onChange={(value) => updateRuleField('lexicon_negative', value)}
              suggestions={[]}
              placeholder="Add negative style tags..."
            />
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-background-tertiary border border-border-secondary">
            <h3 className="text-sm font-semibold text-text-primary">
              Evaluation Rubric Weights
            </h3>

            {Object.entries(formData.eval_rubric?.weights || {}).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={value || 0}
                  onChange={(e) =>
                    updateWeight(key, parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-background-tertiary border border-border-secondary">
            <h3 className="text-sm font-semibold text-text-primary">
              Evaluation Thresholds
            </h3>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Minimum Total Score
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.eval_rubric?.thresholds?.min_total || 7.0}
                onChange={(e) =>
                  updateThreshold('min_total', parseFloat(e.target.value) || 7.0)
                }
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Maximum Profanity Score
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.eval_rubric?.thresholds?.max_profanity || 2.0}
                onChange={(e) =>
                  updateThreshold(
                    'max_profanity',
                    parseFloat(e.target.value) || 2.0
                  )
                }
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              />
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
