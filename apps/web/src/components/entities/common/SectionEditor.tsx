'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';

export interface Section {
  id: string;
  type: string;
  duration?: number;
  lines?: number;
  metadata?: Record<string, unknown>;
}

export interface SectionEditorProps {
  label: string;
  sections: Section[];
  onChange: (sections: Section[]) => void;
  sectionTypes: Array<{ value: string; label: string; color?: string }>;
  showDuration?: boolean;
  showLines?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
}

export function SectionEditor({
  label,
  sections,
  onChange,
  sectionTypes,
  showDuration = true,
  showLines = false,
  error,
  required = false,
  disabled = false,
  helpText,
}: SectionEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addSection = (type: string) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      ...(showDuration && { duration: 0 }),
      ...(showLines && { lines: 0 }),
    };
    onChange([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, updates: Partial<Section>) => {
    const updated = sections.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    );
    onChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...sections];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, removed);

    onChange(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getSectionColor = (type: string) => {
    const sectionType = sectionTypes.find((st) => st.value === type);
    return sectionType?.color || 'bg-accent-primary/20 border-accent-primary/40';
  };

  const totalDuration = sections.reduce(
    (sum, section) => sum + (section.duration || 0),
    0
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-accent-error ml-1">*</span>}
      </label>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 rounded-lg bg-background-tertiary border transition-all ${
              draggedIndex === index
                ? 'opacity-50 border-accent-primary'
                : dragOverIndex === index
                ? 'border-accent-primary shadow-lg'
                : 'border-border-secondary hover:border-border-primary'
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-move'}`}
          >
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-primary transition-colors"
              disabled={disabled}
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center gap-3">
              <select
                value={section.type}
                onChange={(e) => updateSection(index, { type: e.target.value })}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border ${getSectionColor(
                  section.type
                )} bg-transparent focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {sectionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {showDuration && (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Duration:</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={section.duration || 0}
                    onChange={(e) =>
                      updateSection(index, {
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={disabled}
                    className="w-20 px-2 py-1 rounded-md bg-background-primary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-text-tertiary">s</span>
                </label>
              )}

              {showLines && (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Lines:</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={section.lines || 0}
                    onChange={(e) =>
                      updateSection(index, { lines: parseInt(e.target.value) || 0 })
                    }
                    disabled={disabled}
                    className="w-16 px-2 py-1 rounded-md bg-background-primary border border-border-secondary text-text-primary focus:outline-none focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeSection(index)}
              disabled={disabled}
              className="p-2 rounded-md text-text-tertiary hover:text-accent-error hover:bg-accent-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Remove ${section.type} section`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          const firstType = sectionTypes[0]?.value || 'verse';
          addSection(firstType);
        }}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border-secondary text-text-secondary hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">Add Section</span>
      </button>

      {showDuration && sections.length > 0 && (
        <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-background-tertiary/50 text-sm">
          <span className="text-text-secondary">Total Duration:</span>
          <span className="font-semibold text-text-primary">{totalDuration}s</span>
        </div>
      )}

      {helpText && !error && (
        <p className="text-xs text-text-tertiary">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-accent-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
