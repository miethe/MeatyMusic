'use client';

import { useState, useEffect } from 'react';
import { LyricsBase, LyricsCreate, POV, Tense, HookStrategy, Lyrics } from '@/types/api/entities';
import { ChipSelector } from './common/ChipSelector';
import { SectionEditor, Section } from './common/SectionEditor';
import { RhymeSchemeInput } from './common/RhymeSchemeInput';
import { EntityPreviewPanel, ValidationError } from './common/EntityPreviewPanel';
import { LibrarySelector } from './common/LibrarySelector';
import { Save, X } from 'lucide-react';
import { useLyricsList } from '@/hooks/api/useLyrics';

export interface LyricsEditorProps {
  songId?: string;
  initialValue?: Partial<LyricsBase>;
  onSave: (lyrics: LyricsCreate) => void;
  onCancel: () => void;
  className?: string;
  showLibrarySelector?: boolean;
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro', color: 'bg-gray-500/20 border-gray-500/40' },
  { value: 'verse', label: 'Verse', color: 'bg-accent-secondary/20 border-accent-secondary/40' },
  { value: 'prechorus', label: 'Pre-Chorus', color: 'bg-accent-primary/20 border-accent-primary/40' },
  { value: 'chorus', label: 'Chorus', color: 'bg-accent-music/20 border-accent-music/40' },
  { value: 'bridge', label: 'Bridge', color: 'bg-accent-warning/20 border-accent-warning/40' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-500/20 border-gray-500/40' },
];

const THEME_OPTIONS = [
  'love',
  'loss',
  'celebration',
  'struggle',
  'nostalgia',
  'hope',
  'rebellion',
  'nature',
  'urban life',
  'spirituality',
];

export function LyricsEditor({
  songId,
  initialValue = {},
  onSave,
  onCancel,
  className = '',
  showLibrarySelector = false,
}: LyricsEditorProps) {
  const [formData, setFormData] = useState<Partial<LyricsBase>>({
    song_id: songId,
    sections: [],
    section_order: [],
    language: 'English',
    pov: POV.FIRST_PERSON,
    tense: Tense.PRESENT,
    rhyme_scheme: 'ABAB',
    meter: '4/4',
    syllables_per_line: 8,
    hook_strategy: HookStrategy.MELODIC,
    imagery_density: 5,
    reading_level: 50,
    themes: [],
    explicit_allowed: false,
    ...initialValue,
  });

  const [sections, setSections] = useState<Section[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Fetch library lyrics for selection
  const { data: lyricsData } = useLyricsList();

  useEffect(() => {
    if (initialValue.sections) {
      const convertedSections = (initialValue.sections as any[]).map((s, i) => ({
        id: `section-${i}`,
        type: s.type || 'verse',
        lines: s.lines || 4,
        metadata: s,
      }));
      setSections(convertedSections);
    }
  }, [initialValue.sections]);

  useEffect(() => {
    validateForm();
  }, [formData, sections]);

  const validateForm = () => {
    const errors: ValidationError[] = [];

    const hasChorus = sections.some((s) => s.type === 'chorus');
    if (!hasChorus && sections.length > 0) {
      errors.push({
        field: 'sections',
        message: 'At least one Chorus section is required',
        severity: 'error',
      });
    }

    if (!formData.rhyme_scheme?.trim()) {
      errors.push({
        field: 'rhyme_scheme',
        message: 'Rhyme scheme is required',
        severity: 'warning',
      });
    }

    if ((formData.syllables_per_line || 0) < 4 || (formData.syllables_per_line || 0) > 16) {
      errors.push({
        field: 'syllables_per_line',
        message: 'Syllables per line should be between 4 and 16',
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

    const sectionData = sections.map((s) => ({
      type: s.type,
      lines: s.lines || 4,
      ...s.metadata,
    }));

    const saveData: LyricsCreate = {
      ...formData,
      song_id: songId,
      sections: sectionData as any,
      section_order: sections.map((s) => s.type),
    } as LyricsCreate;

    onSave(saveData);
  };

  const updateField = <K extends keyof LyricsBase>(
    field: K,
    value: LyricsBase[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLibrarySelect = (lyrics: Lyrics) => {
    // Remove id, timestamps, and song_id from library item (will use current songId)
    const { id, created_at, updated_at, song_id, ...lyricsData } = lyrics;
    setFormData({ ...lyricsData, song_id: songId });

    // Convert sections to editor format
    if (lyrics.sections) {
      const convertedSections = (lyrics.sections as any[]).map((s, i) => ({
        id: `section-${i}`,
        type: s.type || 'verse',
        lines: s.lines || 4,
        metadata: s,
      }));
      setSections(convertedSections);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-background-secondary">
        <h2 className="text-lg font-semibold text-text-primary">Lyrics Editor</h2>
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
                items={lyricsData?.items || []}
                onSelect={handleLibrarySelect}
                renderItem={(lyrics) => (
                  <div>
                    <div className="font-semibold text-text-primary">
                      {lyrics.sections?.length || 0} sections • {lyrics.pov || 'N/A'} POV
                    </div>
                    <div className="text-xs text-text-tertiary mt-1">
                      {lyrics.language || 'English'}
                      {lyrics.rhyme_scheme && ` • ${lyrics.rhyme_scheme}`}
                      {lyrics.themes && lyrics.themes.length > 0 && ` • ${lyrics.themes.slice(0, 2).join(', ')}`}
                    </div>
                  </div>
                )}
                getItemKey={(lyrics) => lyrics.id}
                getItemSearchText={(lyrics) => `${lyrics.language} ${lyrics.pov} ${lyrics.themes?.join(' ')}`}
                emptyMessage="No lyrics in library. Create your first lyrics below."
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
            label="Section Structure"
            sections={sections}
            onChange={setSections}
            sectionTypes={SECTION_TYPES}
            showLines
            required
            helpText="Define the order and structure of lyric sections. At least one Chorus is required."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Language
              </label>
              <input
                type="text"
                value={formData.language || 'English'}
                onChange={(e) => updateField('language', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Meter
              </label>
              <select
                value={formData.meter || '4/4'}
                onChange={(e) => updateField('meter', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
                <option value="5/4">5/4</option>
                <option value="7/8">7/8</option>
              </select>
            </div>
          </div>

          <RhymeSchemeInput
            label="Rhyme Scheme"
            value={formData.rhyme_scheme || ''}
            onChange={(value) => updateField('rhyme_scheme', value)}
            helpText="Define the rhyme pattern for verses and sections"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Point of View
              </label>
              <select
                value={formData.pov || POV.FIRST_PERSON}
                onChange={(e) => updateField('pov', e.target.value as POV)}
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              >
                <option value={POV.FIRST_PERSON}>First Person (I, We)</option>
                <option value={POV.SECOND_PERSON}>Second Person (You)</option>
                <option value={POV.THIRD_PERSON}>Third Person (He, She, They)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Verb Tense
              </label>
              <select
                value={formData.tense || Tense.PRESENT}
                onChange={(e) => updateField('tense', e.target.value as Tense)}
                className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
              >
                <option value={Tense.PAST}>Past</option>
                <option value={Tense.PRESENT}>Present</option>
                <option value={Tense.FUTURE}>Future</option>
                <option value={Tense.MIXED}>Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Syllables per Line
            </label>
            <input
              type="number"
              min="4"
              max="16"
              value={formData.syllables_per_line || 8}
              onChange={(e) =>
                updateField('syllables_per_line', parseInt(e.target.value) || 8)
              }
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Recommended range: 4-16 syllables
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Hook Strategy
            </label>
            <select
              value={formData.hook_strategy || HookStrategy.MELODIC}
              onChange={(e) =>
                updateField('hook_strategy', e.target.value as HookStrategy)
              }
              className="w-full px-4 py-2 rounded-lg bg-bg-elevated border border-border-secondary text-text-primary focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-border-accent/20 transition-colors"
            >
              <option value={HookStrategy.MELODIC}>Melodic</option>
              <option value={HookStrategy.LYRICAL}>Lyrical</option>
              <option value={HookStrategy.CALL_RESPONSE}>Call & Response</option>
              <option value={HookStrategy.CHANT}>Chant</option>
            </select>
          </div>

          <ChipSelector
            label="Themes"
            value={formData.themes || []}
            onChange={(value) => updateField('themes', value)}
            suggestions={THEME_OPTIONS}
            placeholder="Add themes..."
            helpText="Thematic elements to explore in the lyrics"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Imagery Density
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-tertiary w-16">Literal</span>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.imagery_density || 5}
                onChange={(e) =>
                  updateField('imagery_density', parseInt(e.target.value))
                }
                className="flex-1"
              />
              <span className="text-xs text-text-tertiary w-16 text-right">Poetic</span>
              <span className="text-sm font-semibold text-text-primary w-8 text-right">
                {formData.imagery_density || 5}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="explicit_allowed"
              checked={formData.explicit_allowed || false}
              onChange={(e) => updateField('explicit_allowed', e.target.checked)}
              className="w-4 h-4 rounded border-border-secondary text-accent-primary focus:ring-2 focus:ring-border-focus"
            />
            <label
              htmlFor="explicit_allowed"
              className="text-sm font-medium text-text-primary cursor-pointer"
            >
              Allow Explicit Content
            </label>
          </div>
        </div>

        {showPreview && (
          <div className="w-full md:w-96 border-l border-border-secondary bg-background-secondary">
            <EntityPreviewPanel
              entity={{
                ...formData,
                sections: sections.map((s) => ({
                  type: s.type,
                  lines: s.lines,
                })),
              }}
              validationErrors={validationErrors}
            />
          </div>
        )}
      </div>
    </div>
  );
}
