'use client';

import { useState, useEffect } from 'react';
import { PersonaBase, PersonaCreate, PersonaKind, Persona } from '@/types/api/entities';
import { ChipSelector } from './common/ChipSelector';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { LibrarySelector } from './common/LibrarySelector';
import { Save, X } from 'lucide-react';
import { usePersonas } from '@/hooks/api/usePersonas';

export interface PersonaEditorProps {
  initialValue?: Partial<PersonaBase>;
  onSave: (persona: PersonaCreate) => void;
  onCancel: () => void;
  className?: string;
  showLibrarySelector?: boolean;
}

const VOCAL_RANGE_OPTIONS = [
  'Soprano',
  'Mezzo-Soprano',
  'Alto',
  'Tenor',
  'Baritone',
  'Bass',
];

const DELIVERY_OPTIONS = [
  'crooning',
  'belting',
  'rap',
  'whispered',
  'shouted',
  'melodic',
  'rhythmic',
  'smooth',
  'raspy',
  'powerful',
];

export function PersonaEditor({
  initialValue = {},
  onSave,
  onCancel,
  className = '',
  showLibrarySelector = false,
}: PersonaEditorProps) {
  const [formData, setFormData] = useState<Partial<PersonaBase>>({
    name: '',
    kind: PersonaKind.ARTIST,
    bio: '',
    voice: '',
    vocal_range: '',
    delivery: [],
    influences: [],
    policy: {
      public_release: false,
      disallow_named_style_of: true,
    },
    ...initialValue,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Fetch library personas for selection
  const { data: personasData } = usePersonas();

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    if (!formData.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Persona name is required',
        severity: 'error',
      });
    }

    if (formData.policy?.public_release && formData.influences && formData.influences.length > 0) {
      errors.push({
        field: 'influences',
        message: 'Public release with named influences may require sanitization',
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

    onSave(formData as PersonaCreate);
  };

  const updateField = <K extends keyof PersonaBase>(
    field: K,
    value: PersonaBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLibrarySelect = (persona: Persona) => {
    // Remove id and timestamps from library item
    const { id, created_at, updated_at, ...personaData } = persona;
    setFormData(personaData);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-background-secondary">
        <h2 className="text-lg font-semibold text-text-primary">Persona Editor</h2>
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
                items={personasData?.items || []}
                onSelect={handleLibrarySelect}
                renderItem={(persona) => (
                  <div>
                    <div className="font-semibold text-text-primary">{persona.name}</div>
                    <div className="text-xs text-text-tertiary mt-1">
                      {persona.kind === PersonaKind.ARTIST ? 'Artist' : 'Band'}
                      {persona.vocal_range && ` • ${persona.vocal_range}`}
                      {persona.delivery && persona.delivery.length > 0 && ` • ${persona.delivery.slice(0, 2).join(', ')}`}
                    </div>
                  </div>
                )}
                getItemKey={(persona) => persona.id}
                getItemSearchText={(persona) => `${persona.name} ${persona.vocal_range} ${persona.delivery?.join(' ')}`}
                emptyMessage="No personas in library. Create your first persona below."
                label="Add from Library"
              />

              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <div className="flex-1 h-px bg-border-secondary" />
                <span>Or create new:</span>
                <div className="flex-1 h-px bg-border-secondary" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Persona Name <span className="text-accent-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Soulful Storyteller"
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Kind
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={PersonaKind.ARTIST}
                  checked={formData.kind === PersonaKind.ARTIST}
                  onChange={(e) => updateField('kind', e.target.value as PersonaKind)}
                  className="w-4 h-4 text-accent-primary focus:ring-2 focus:ring-border-focus"
                />
                <span className="text-sm text-text-primary">Artist</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={PersonaKind.BAND}
                  checked={formData.kind === PersonaKind.BAND}
                  onChange={(e) => updateField('kind', e.target.value as PersonaKind)}
                  className="w-4 h-4 text-accent-primary focus:ring-2 focus:ring-border-focus"
                />
                <span className="text-sm text-text-primary">Band</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Brief description of the persona..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Voice Description
            </label>
            <input
              type="text"
              value={formData.voice || ''}
              onChange={(e) => updateField('voice', e.target.value)}
              placeholder="e.g., Warm and rich with subtle vibrato"
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Vocal Range
            </label>
            <select
              value={formData.vocal_range || ''}
              onChange={(e) => updateField('vocal_range', e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-background-tertiary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/20 transition-colors"
            >
              <option value="">Select range...</option>
              {VOCAL_RANGE_OPTIONS.map((range) => (
                <option key={range} value={range.toLowerCase()}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          <ChipSelector
            label="Delivery Styles"
            value={formData.delivery || []}
            onChange={(value) => updateField('delivery', value)}
            suggestions={DELIVERY_OPTIONS}
            placeholder="Add delivery styles..."
            helpText="How the persona delivers vocals"
          />

          <ChipSelector
            label="Influences"
            value={formData.influences || []}
            onChange={(value) => updateField('influences', value)}
            suggestions={[]}
            placeholder="Add influences..."
            warning={
              formData.policy?.public_release && (formData.influences?.length || 0) > 0
                ? 'Public releases may require generic influence language'
                : undefined
            }
            helpText="Musical influences and inspirations"
          />

          <div className="space-y-3 p-4 rounded-lg bg-background-tertiary border border-border-secondary">
            <h3 className="text-sm font-semibold text-text-primary">Policy Settings</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="public_release"
                checked={formData.policy?.public_release || false}
                onChange={(e) =>
                  updateField('policy', {
                    public_release: e.target.checked,
                    disallow_named_style_of: formData.policy?.disallow_named_style_of ?? true,
                  })
                }
                className="w-4 h-4 rounded border-border-secondary text-accent-primary focus:ring-2 focus:ring-border-focus"
              />
              <label
                htmlFor="public_release"
                className="text-sm font-medium text-text-primary cursor-pointer"
              >
                Allow Public Release
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="disallow_named_style_of"
                checked={formData.policy?.disallow_named_style_of ?? true}
                onChange={(e) =>
                  updateField('policy', {
                    public_release: formData.policy?.public_release ?? false,
                    disallow_named_style_of: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-border-secondary text-accent-primary focus:ring-2 focus:ring-border-focus"
              />
              <label
                htmlFor="disallow_named_style_of"
                className="text-sm font-medium text-text-primary cursor-pointer"
              >
                Disallow Named "Style Of" References
              </label>
            </div>

            <p className="text-xs text-text-tertiary">
              Enabling this will convert named influences to generic style descriptors for public
              releases.
            </p>
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
