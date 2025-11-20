'use client';

import { useState } from 'react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@meatymusic/ui';
import { GripVertical, Trash2, Plus, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { ValidationError } from './EntityPreviewPanel';

export interface LyricSection {
  id: string;
  type: string;
  order: number;
  lines: string[];
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface CollapsibleSectionEditorProps {
  sections: LyricSection[];
  onChange: (sections: LyricSection[]) => void;
  validationErrors?: ValidationError[];
}

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro', color: 'bg-gray-500/20 border-gray-500/40', icon: '🎵' },
  { value: 'verse', label: 'Verse', color: 'bg-blue-500/20 border-blue-500/40', icon: '📝' },
  { value: 'prechorus', label: 'Pre-Chorus', color: 'bg-purple-500/20 border-purple-500/40', icon: '🎶' },
  { value: 'chorus', label: 'Chorus', color: 'bg-green-500/20 border-green-500/40', icon: '🎤', required: true },
  { value: 'bridge', label: 'Bridge', color: 'bg-yellow-500/20 border-yellow-500/40', icon: '🌉' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-500/20 border-gray-500/40', icon: '🎼' },
];

export function CollapsibleSectionEditor({
  sections,
  onChange,
  validationErrors = [],
}: CollapsibleSectionEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const addSection = () => {
    const newSection: LyricSection = {
      id: `section-${Date.now()}`,
      type: 'verse',
      order: sections.length + 1,
      lines: [],
      text: '',
    };
    const updatedSections = [...sections, newSection];
    onChange(updatedSections);
    setExpandedSections((prev) => new Set([...prev, newSection.id]));
  };

  const removeSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    // Reorder remaining sections
    const reordered = updatedSections.map((s, i) => ({ ...s, order: i + 1 }));
    onChange(reordered);
  };

  const updateSection = (index: number, updates: Partial<LyricSection>) => {
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
    if (removed) {
      reordered.splice(dropIndex, 0, removed);
      // Update order numbers
      const withOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
      onChange(withOrder);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getSectionType = (type: string) => {
    return SECTION_TYPES.find((st) => st.value === type) || SECTION_TYPES[1];
  };

  const getSectionStatus = (section: LyricSection) => {
    const hasLines = section.lines.length > 0 || (section.text && section.text.trim().length > 0);
    const isRequired = getSectionType(section.type).required;

    if (isRequired && !hasLines) {
      return { status: 'error', message: 'Required section is empty' };
    }
    if (hasLines) {
      return { status: 'complete', message: 'Section complete' };
    }
    return { status: 'incomplete', message: 'Section empty' };
  };

  const hasChorus = sections.some((s) => s.type === 'chorus');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary">
          Section Structure
          <span className="text-red-500 ml-1">*</span>
        </label>
        {!hasChorus && sections.length > 0 && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            At least one Chorus required
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => {
          const sectionType = getSectionType(section.type);
          const status = getSectionStatus(section);
          const isExpanded = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border transition-all ${
                draggedIndex === index
                  ? 'opacity-50 border-primary'
                  : dragOverIndex === index
                  ? 'border-primary shadow-lg'
                  : 'border-border-default hover:border-border-strong'
              } ${sectionType.color}`}
            >
              <Collapsible open={isExpanded} onOpenChange={() => toggleSection(section.id)}>
                {/* Panel Header */}
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>

                  <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{sectionType.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary">
                            {sectionType.label} {section.order}
                          </span>
                          {sectionType.required && (
                            <span className="text-xs text-red-500">Required</span>
                          )}
                        </div>
                        <div className="text-xs text-text-tertiary mt-0.5">
                          {section.lines.length || 0} lines
                          {status.status === 'complete' && (
                            <span className="text-green-500 ml-2 flex items-center gap-1 inline-flex">
                              <CheckCircle className="h-3 w-3" />
                              Complete
                            </span>
                          )}
                          {status.status === 'error' && (
                            <span className="text-red-500 ml-2 flex items-center gap-1 inline-flex">
                              <AlertCircle className="h-3 w-3" />
                              {status.message}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>

                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="p-2 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    aria-label={`Remove ${sectionType.label} section`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Panel Content */}
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-4 border-t border-border-default pt-4 mt-2">
                    {/* Section Type Selector */}
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Section Type
                      </label>
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(index, { type: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-md text-sm border border-border-default bg-bg-elevated text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        {SECTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                            {type.required ? ' (Required)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lines Textarea */}
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Lyrics (one line per line)
                      </label>
                      <textarea
                        value={section.text || section.lines.join('\n')}
                        onChange={(e) => {
                          const text = e.target.value;
                          const lines = text.split('\n');
                          updateSection(index, { text, lines });
                        }}
                        placeholder={`Enter ${sectionType.label.toLowerCase()} lyrics...\nOne line per line`}
                        rows={6}
                        className="w-full px-3 py-2 rounded-md text-sm border border-border-default bg-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono resize-y"
                      />
                      <p className="text-xs text-text-tertiary mt-1">
                        {section.lines.length} {section.lines.length === 1 ? 'line' : 'lines'}
                      </p>
                    </div>

                    {/* Order Number */}
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Order in Song
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={section.order}
                        onChange={(e) => updateSection(index, { order: parseInt(e.target.value) || 1 })}
                        className="w-24 px-3 py-1.5 rounded-md text-sm border border-border-default bg-bg-elevated text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>

      {/* Add Section Button */}
      <button
        type="button"
        onClick={addSection}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border-default text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">Add Section</span>
      </button>

      {/* Helper Text */}
      <p className="text-xs text-text-tertiary">
        Define the order and structure of lyric sections. At least one Chorus is required.
      </p>
    </div>
  );
}
