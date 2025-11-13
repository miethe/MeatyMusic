'use client';

import { useState, useEffect } from 'react';
import { SongBase, SongCreate, SongStatus } from '@/types/api/entities';
import { ChipSelector } from './common/ChipSelector';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { Save, X } from 'lucide-react';

export interface SongEditorProps {
  initialValue?: Partial<SongBase>;
  onSave: (song: SongCreate) => void;
  onCancel: () => void;
  className?: string;
}

export function SongEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
}: SongEditorProps) {
  const [formData, setFormData] = useState<Partial<SongBase>>({
    title: '',
    sds_version: '1.0',
    global_seed: Math.floor(Math.random() * 1000000),
    status: SongStatus.DRAFT,
    feature_flags: {},
    render_config: {},
    ...initialValue,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    if (!formData.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Song title is required',
        severity: 'error',
      });
    }

    setValidationErrors(errors);
  };

  const handleSave = () => {
    const hasErrors = validationErrors.some((e) => e.severity === 'error');
    if (hasErrors) {
      return;
    }

    onSave(formData as SongCreate);
  };

  const updateField = <K extends keyof SongBase>(
    field: K,
    value: SongBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-background-secondary">
        <h2 className="text-lg font-semibold text-text-primary">Song Editor</h2>
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
              Song Title <span className="text-accent-error">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., Holiday Hustle"
              className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Status
            </label>
            <select
              value={formData.status || SongStatus.DRAFT}
              onChange={(e) => updateField('status', e.target.value as SongStatus)}
              className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
            >
              <option value={SongStatus.DRAFT}>Draft</option>
              <option value={SongStatus.VALIDATED}>Validated</option>
              <option value={SongStatus.RENDERING}>Rendering</option>
              <option value={SongStatus.RENDERED}>Rendered</option>
              <option value={SongStatus.FAILED}>Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Global Seed
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={formData.global_seed || 0}
                onChange={(e) =>
                  updateField('global_seed', parseInt(e.target.value) || 0)
                }
                className="flex-1 px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
              />
              <button
                type="button"
                onClick={() =>
                  updateField('global_seed', Math.floor(Math.random() * 1000000))
                }
                className="px-4 py-2 rounded-lg border border-border-secondary text-text-secondary hover:border-border-primary hover:text-text-primary transition-colors"
              >
                Randomize
              </button>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Same seed produces identical outputs (determinism)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              SDS Version
            </label>
            <input
              type="text"
              value={formData.sds_version || '1.0'}
              onChange={(e) => updateField('sds_version', e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
            />
          </div>

          <div className="space-y-4 p-4 rounded-lg bg-background-tertiary border border-border-secondary">
            <h3 className="text-sm font-semibold text-text-primary">
              Entity Links
            </h3>
            <p className="text-xs text-text-tertiary">
              Link existing entities to this song or create them in the workflow wizard
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Style ID
                </label>
                <input
                  type="text"
                  value={formData.style_id || ''}
                  onChange={(e) => updateField('style_id', e.target.value)}
                  placeholder="UUID"
                  className="w-full px-3 py-2 rounded-lg bg-background-primary border border-border-secondary text-text-primary text-xs font-mono focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Persona ID
                </label>
                <input
                  type="text"
                  value={formData.persona_id || ''}
                  onChange={(e) => updateField('persona_id', e.target.value)}
                  placeholder="UUID"
                  className="w-full px-3 py-2 rounded-lg bg-background-primary border border-border-secondary text-text-primary text-xs font-mono focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Blueprint ID
                </label>
                <input
                  type="text"
                  value={formData.blueprint_id || ''}
                  onChange={(e) => updateField('blueprint_id', e.target.value)}
                  placeholder="UUID"
                  className="w-full px-3 py-2 rounded-lg bg-background-primary border border-border-secondary text-text-primary text-xs font-mono focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
                />
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
