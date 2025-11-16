/**
 * EntityDetailSection Component
 * Display entity properties with edit/create links for Song Detail page
 *
 * Shows key properties for each entity type with proper formatting
 * and navigation to edit/create pages.
 */

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@meatymusic/ui/components/Card/Card';
import { Button } from '@meatymusic/ui/components/Button/Button';
import { Badge } from '@meatymusic/ui/components/Badge/Badge';
import {
  Palette,
  FileText,
  User,
  Settings as SettingsIcon,
  FileCheck,
  Edit,
  Plus,
} from 'lucide-react';
import type {
  Style,
  Lyrics,
  Persona,
  Blueprint,
  ProducerNotes,
} from '@/types/api/entities';

/**
 * Entity type discriminator
 */
export type EntityType = 'style' | 'lyrics' | 'persona' | 'blueprint' | 'producer_notes';

/**
 * Union type for all possible entity data
 */
export type EntityData = Partial<Style | Lyrics | Persona | Blueprint | ProducerNotes>;

export interface EntityDetailSectionProps {
  /** Type of entity being displayed */
  entityType: EntityType;
  /** Entity ID if assigned, null if not assigned */
  entityId: string | null;
  /** Partial entity data to display (optional) */
  entityData?: EntityData;
  /** Link to edit page */
  editHref: string;
  /** Link to create page if entityId is null */
  createHref: string;
}

/**
 * Get icon component for entity type
 */
function getEntityIcon(entityType: EntityType): React.ReactNode {
  const iconMap = {
    style: <Palette className="w-5 h-5" />,
    lyrics: <FileText className="w-5 h-5" />,
    persona: <User className="w-5 h-5" />,
    blueprint: <SettingsIcon className="w-5 h-5" />,
    producer_notes: <FileCheck className="w-5 h-5" />,
  };

  return iconMap[entityType];
}

/**
 * Get display name for entity type
 */
function getEntityTypeName(entityType: EntityType): string {
  const nameMap = {
    style: 'Style',
    lyrics: 'Lyrics',
    persona: 'Persona',
    blueprint: 'Blueprint',
    producer_notes: 'Producer Notes',
  };

  return nameMap[entityType];
}

/**
 * Format field value for display
 */
function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }

  if (typeof value === 'object') {
    // Handle nested objects like key.primary
    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

/**
 * Get key properties to display for each entity type
 */
function getEntityProperties(
  entityType: EntityType,
  data?: EntityData
): Array<{ label: string; value: unknown; type?: 'badge' | 'text' }> {
  if (!data) return [];

  switch (entityType) {
    case 'style': {
      const style = data as Partial<Style>;
      return [
        { label: 'Genre', value: style.genre, type: 'badge' },
        { label: 'Tempo (BPM)', value: style.bpm_min && style.bpm_max ? `${style.bpm_min}-${style.bpm_max}` : style.bpm_min || style.bpm_max },
        { label: 'Key', value: style.key },
        { label: 'Mood', value: style.mood || [] },
        { label: 'Energy', value: style.energy_level ? `${style.energy_level}/10` : undefined },
      ];
    }

    case 'lyrics': {
      const lyrics = data as Partial<Lyrics>;
      return [
        { label: 'Language', value: lyrics.language },
        { label: 'POV', value: lyrics.pov, type: 'badge' },
        { label: 'Rhyme Scheme', value: lyrics.rhyme_scheme },
        { label: 'Sections', value: lyrics.section_order ? `${lyrics.section_order.length} sections` : undefined },
        { label: 'Hook Strategy', value: lyrics.hook_strategy },
      ];
    }

    case 'persona': {
      const persona = data as Partial<Persona>;
      return [
        { label: 'Name', value: persona.name },
        { label: 'Vocal Range', value: persona.vocal_range },
        { label: 'Delivery Style', value: persona.delivery || [] },
        { label: 'Kind', value: persona.kind, type: 'badge' },
        { label: 'Influences', value: persona.influences ? `${persona.influences.length} artists` : undefined },
      ];
    }

    case 'blueprint': {
      const blueprint = data as Partial<Blueprint>;
      return [
        { label: 'Genre', value: blueprint.genre, type: 'badge' },
        { label: 'Version', value: blueprint.version },
        { label: 'Required Sections', value: blueprint.rules?.required_sections ? `${blueprint.rules.required_sections.length} sections` : undefined },
        { label: 'Tempo Range', value: blueprint.rules?.tempo_bpm ? `${blueprint.rules.tempo_bpm[0]}-${blueprint.rules.tempo_bpm[1]} BPM` : undefined },
        { label: 'Min Score', value: blueprint.eval_rubric?.thresholds?.min_total },
      ];
    }

    case 'producer_notes': {
      const notes = data as Partial<ProducerNotes>;
      return [
        { label: 'Structure', value: notes.structure },
        { label: 'Hooks', value: notes.hooks },
        { label: 'Mix LUFS', value: notes.mix?.lufs },
        { label: 'Stereo Width', value: notes.mix?.stereo_width, type: 'badge' },
        { label: 'Instrumentation', value: notes.instrumentation ? `${notes.instrumentation.length} instruments` : undefined },
      ];
    }

    default:
      return [];
  }
}

/**
 * EntityDetailSection Component
 */
export const EntityDetailSection = React.forwardRef<HTMLDivElement, EntityDetailSectionProps>(
  ({ entityType, entityId, entityData, editHref, createHref }, ref) => {
    const typeName = getEntityTypeName(entityType);
    const icon = getEntityIcon(entityType);
    const properties = getEntityProperties(entityType, entityData);

    return (
      <Card ref={ref} className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-primary">{icon}</div>
          <h3 className="text-lg font-semibold flex-1">{typeName}</h3>
          {entityData && (
            <Badge variant="secondary" className="text-xs">
              Assigned
            </Badge>
          )}
        </div>

        {entityId ? (
          <>
            {/* Entity ID */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Entity ID</p>
              <p className="font-mono text-sm text-muted-foreground truncate" title={entityId}>
                {entityId}
              </p>
            </div>

            {/* Properties */}
            {properties.length > 0 && (
              <div className="space-y-3 mb-4">
                {properties.map(({ label, value, type }) => {
                  if (value === null || value === undefined) return null;

                  return (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground mb-1">{label}</dt>
                      <dd className="text-sm">
                        {type === 'badge' ? (
                          <Badge variant="outline" className="text-xs">
                            {formatFieldValue(value)}
                          </Badge>
                        ) : Array.isArray(value) && value.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {value.slice(0, 3).map((item, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {String(item)}
                              </Badge>
                            ))}
                            {value.length > 3 && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                +{value.length - 3} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-primary">{formatFieldValue(value)}</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Edit Button */}
            <Link href={editHref}>
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="w-3 h-3 mr-2" />
                View / Edit {typeName}
              </Button>
            </Link>
          </>
        ) : (
          <>
            {/* Not Assigned State */}
            <div className="mb-4 py-8 text-center">
              <div className="text-muted-foreground/50 mb-2">{icon}</div>
              <p className="text-sm text-muted-foreground">
                No {typeName.toLowerCase()} assigned
              </p>
            </div>

            {/* Create Button */}
            <Link href={createHref}>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-3 h-3 mr-2" />
                Create {typeName}
              </Button>
            </Link>
          </>
        )}
      </Card>
    );
  }
);

EntityDetailSection.displayName = 'EntityDetailSection';
