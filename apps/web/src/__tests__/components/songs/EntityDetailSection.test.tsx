/**
 * EntityDetailSection Component Tests
 * Comprehensive tests for entity detail display component
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EntityDetailSection } from '@/components/songs/EntityDetailSection';
import type {
  Style,
  Lyrics,
  Persona,
  Blueprint,
  ProducerNotes,
} from '@/types/api/entities';
import { POV, HookStrategy, PersonaKind } from '@/types/api/entities';

describe('EntityDetailSection', () => {
  describe('Style Entity', () => {
    const mockStyleData: Partial<Style> = {
      genre: 'Pop',
      bpm_min: 120,
      bpm_max: 140,
      key: 'C Major',
      mood: ['upbeat', 'energetic', 'happy'],
      energy_level: 8,
    };

    it('renders style entity with all properties', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Assigned')).toBeInTheDocument();
      expect(screen.getByText('style-123')).toBeInTheDocument();
      expect(screen.getByText('Pop')).toBeInTheDocument();
      expect(screen.getByText('120-140')).toBeInTheDocument();
      expect(screen.getByText('C Major')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();
    });

    it('displays mood badges with limit of 3', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('upbeat')).toBeInTheDocument();
      expect(screen.getByText('energetic')).toBeInTheDocument();
      expect(screen.getByText('happy')).toBeInTheDocument();
    });

    it('shows edit button when entity exists', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      const editButton = screen.getByRole('link', { name: /View \/ Edit Style/i });
      expect(editButton).toHaveAttribute('href', '/entities/styles/style-123');
    });
  });

  describe('Lyrics Entity', () => {
    const mockLyricsData: Partial<Lyrics> = {
      song_id: 'song-123',
      language: 'en',
      pov: POV.FIRST_PERSON,
      rhyme_scheme: 'AABB',
      section_order: ['verse1', 'chorus', 'verse2', 'chorus', 'bridge'],
      hook_strategy: HookStrategy.CHANT,
      sections: [],
    };

    it('renders lyrics entity with all properties', () => {
      render(
        <EntityDetailSection
          entityType="lyrics"
          entityId="lyrics-456"
          entityData={mockLyricsData}
          editHref="/entities/lyrics/lyrics-456"
          createHref="/entities/lyrics/new"
        />
      );

      expect(screen.getByText('Lyrics')).toBeInTheDocument();
      expect(screen.getByText('en')).toBeInTheDocument();
      expect(screen.getByText('first-person')).toBeInTheDocument();
      expect(screen.getByText('AABB')).toBeInTheDocument();
      expect(screen.getByText('5 sections')).toBeInTheDocument();
      expect(screen.getByText('chant')).toBeInTheDocument();
    });

    it('shows create button when entity does not exist', () => {
      render(
        <EntityDetailSection
          entityType="lyrics"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/lyrics/new"
        />
      );

      expect(screen.getByText('No lyrics assigned')).toBeInTheDocument();
      const createButton = screen.getByRole('link', { name: /Create Lyrics/i });
      expect(createButton).toHaveAttribute('href', '/entities/lyrics/new');
    });
  });

  describe('Persona Entity', () => {
    const mockPersonaData: Partial<Persona> = {
      name: 'John Artist',
      vocal_range: 'Tenor',
      delivery: ['smooth', 'powerful', 'raspy'],
      kind: PersonaKind.ARTIST,
      influences: ['Artist A', 'Artist B', 'Artist C'],
    };

    it('renders persona entity with all properties', () => {
      render(
        <EntityDetailSection
          entityType="persona"
          entityId="persona-789"
          entityData={mockPersonaData}
          editHref="/entities/personas/persona-789"
          createHref="/entities/personas/new"
        />
      );

      expect(screen.getByText('Persona')).toBeInTheDocument();
      expect(screen.getByText('John Artist')).toBeInTheDocument();
      expect(screen.getByText('Tenor')).toBeInTheDocument();
      expect(screen.getByText('artist')).toBeInTheDocument();
      expect(screen.getByText('3 artists')).toBeInTheDocument();
    });

    it('displays delivery badges with limit of 3', () => {
      render(
        <EntityDetailSection
          entityType="persona"
          entityId="persona-789"
          entityData={mockPersonaData}
          editHref="/entities/personas/persona-789"
          createHref="/entities/personas/new"
        />
      );

      expect(screen.getByText('smooth')).toBeInTheDocument();
      expect(screen.getByText('powerful')).toBeInTheDocument();
      expect(screen.getByText('raspy')).toBeInTheDocument();
    });
  });

  describe('Blueprint Entity', () => {
    const mockBlueprintData: Partial<Blueprint> = {
      genre: 'Rock',
      version: '2.1',
      rules: {
        required_sections: ['verse', 'chorus', 'bridge', 'outro'],
        tempo_bpm: [100, 160],
      },
      eval_rubric: {
        thresholds: {
          min_total: 85,
        },
      },
    };

    it('renders blueprint entity with all properties', () => {
      render(
        <EntityDetailSection
          entityType="blueprint"
          entityId="blueprint-321"
          entityData={mockBlueprintData}
          editHref="/entities/blueprints/blueprint-321"
          createHref="/entities/blueprints/new"
        />
      );

      expect(screen.getByText('Blueprint')).toBeInTheDocument();
      expect(screen.getByText('Rock')).toBeInTheDocument();
      expect(screen.getByText('2.1')).toBeInTheDocument();
      expect(screen.getByText('4 sections')).toBeInTheDocument();
      expect(screen.getByText('100-160 BPM')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  describe('Producer Notes Entity', () => {
    const mockProducerNotesData: Partial<ProducerNotes> = {
      song_id: 'song-123',
      structure: 'Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro',
      hooks: 3,
      mix: {
        lufs: -14,
        stereo_width: 'wide',
      },
      instrumentation: ['guitar', 'bass', 'drums', 'synth'],
    };

    it('renders producer notes entity with all properties', () => {
      render(
        <EntityDetailSection
          entityType="producer_notes"
          entityId="notes-654"
          entityData={mockProducerNotesData}
          editHref="/entities/producer-notes/notes-654"
          createHref="/entities/producer-notes/new"
        />
      );

      expect(screen.getByText('Producer Notes')).toBeInTheDocument();
      expect(
        screen.getByText('Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro')
      ).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('-14')).toBeInTheDocument();
      expect(screen.getByText('wide')).toBeInTheDocument();
      expect(screen.getByText('4 instruments')).toBeInTheDocument();
    });
  });

  describe('Not Assigned State', () => {
    it('shows not assigned message for style', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('No style assigned')).toBeInTheDocument();
    });

    it('shows not assigned message for lyrics', () => {
      render(
        <EntityDetailSection
          entityType="lyrics"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/lyrics/new"
        />
      );

      expect(screen.getByText('No lyrics assigned')).toBeInTheDocument();
    });

    it('shows not assigned message for persona', () => {
      render(
        <EntityDetailSection
          entityType="persona"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/personas/new"
        />
      );

      expect(screen.getByText('No persona assigned')).toBeInTheDocument();
    });

    it('shows not assigned message for blueprint', () => {
      render(
        <EntityDetailSection
          entityType="blueprint"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/blueprints/new"
        />
      );

      expect(screen.getByText('No blueprint assigned')).toBeInTheDocument();
    });

    it('shows not assigned message for producer notes', () => {
      render(
        <EntityDetailSection
          entityType="producer_notes"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/producer-notes/new"
        />
      );

      expect(screen.getByText('No producer notes assigned')).toBeInTheDocument();
    });

    it('renders create button with correct href', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      const createButton = screen.getByRole('link', { name: /Create Style/i });
      expect(createButton).toHaveAttribute('href', '/entities/styles/new');
    });
  });

  describe('Icon Rendering', () => {
    it('renders style icon', () => {
      const { container } = render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      // Palette icon should be rendered (lucide-react icons have specific classes)
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders lyrics icon', () => {
      const { container } = render(
        <EntityDetailSection
          entityType="lyrics"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/lyrics/new"
        />
      );

      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Property Formatting', () => {
    it('formats array values with badges', () => {
      const mockStyleData: Partial<Style> = {
        mood: ['happy', 'upbeat', 'energetic', 'joyful'],
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Should show first 3 moods
      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.getByText('upbeat')).toBeInTheDocument();
      expect(screen.getByText('energetic')).toBeInTheDocument();
      // Should show +1 more badge
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('handles empty arrays gracefully', () => {
      const mockStyleData: Partial<Style> = {
        mood: [],
        genre: 'Pop',
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Should not crash and should render other properties
      expect(screen.getByText('Pop')).toBeInTheDocument();
    });

    it('handles null/undefined values gracefully', () => {
      const mockStyleData: Partial<Style> = {
        genre: 'Pop',
        bpm_min: undefined,
        bpm_max: undefined,
        key: undefined,
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Should only show defined properties
      expect(screen.getByText('Pop')).toBeInTheDocument();
      // Undefined fields should not be rendered
      expect(screen.queryByText('Not set')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('renders card container', () => {
      const { container } = render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={{ genre: 'Pop' }}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Card component should be rendered
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
    });
  });

  describe('Entity ID Display', () => {
    it('truncates long entity IDs', () => {
      const longId = 'very-long-entity-id-that-should-be-truncated-12345678';

      render(
        <EntityDetailSection
          entityType="style"
          entityId={longId}
          entityData={{ genre: 'Pop' }}
          editHref="/entities/styles/very-long-entity-id-that-should-be-truncated-12345678"
          createHref="/entities/styles/new"
        />
      );

      const idElement = screen.getByText(longId);
      expect(idElement).toBeInTheDocument();
      expect(idElement).toHaveAttribute('title', longId);
    });
  });

  describe('Accessibility', () => {
    it('has proper link roles for edit button', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={{ genre: 'Pop' }}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      const editLink = screen.getByRole('link', { name: /View \/ Edit Style/i });
      expect(editLink).toBeInTheDocument();
    });

    it('has proper link roles for create button', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      const createLink = screen.getByRole('link', { name: /Create Style/i });
      expect(createLink).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles boolean values in entity data', () => {
      const mockLyricsData: Partial<Lyrics> = {
        song_id: 'song-123',
        explicit_allowed: true,
        sections: [],
        section_order: [],
      };

      render(
        <EntityDetailSection
          entityType="lyrics"
          entityId="lyrics-123"
          entityData={mockLyricsData}
          editHref="/entities/lyrics/lyrics-123"
          createHref="/entities/lyrics/new"
        />
      );

      expect(screen.getByText('Lyrics')).toBeInTheDocument();
    });

    it('handles nested object values', () => {
      const mockBlueprintData: Partial<Blueprint> = {
        genre: 'Jazz',
        version: '1.5',
        extra_metadata: {
          custom_field: 'value',
        },
      };

      render(
        <EntityDetailSection
          entityType="blueprint"
          entityId="blueprint-123"
          entityData={mockBlueprintData}
          editHref="/entities/blueprints/blueprint-123"
          createHref="/entities/blueprints/new"
        />
      );

      expect(screen.getByText('Jazz')).toBeInTheDocument();
      expect(screen.getByText('1.5')).toBeInTheDocument();
    });

    it('renders producer notes with partial mix data', () => {
      const mockProducerNotesData: Partial<ProducerNotes> = {
        song_id: 'song-123',
        structure: 'AABA',
        hooks: 2,
        mix: {
          lufs: -16,
        },
      };

      render(
        <EntityDetailSection
          entityType="producer_notes"
          entityId="notes-123"
          entityData={mockProducerNotesData}
          editHref="/entities/producer-notes/notes-123"
          createHref="/entities/producer-notes/new"
        />
      );

      expect(screen.getByText('Producer Notes')).toBeInTheDocument();
      expect(screen.getByText('AABA')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('-16')).toBeInTheDocument();
    });

    it('handles style with only min tempo', () => {
      const mockStyleData: Partial<Style> = {
        genre: 'Rock',
        bpm_min: 120,
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('Rock')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('handles style with only max tempo', () => {
      const mockStyleData: Partial<Style> = {
        genre: 'Pop',
        bpm_max: 140,
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={mockStyleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('Pop')).toBeInTheDocument();
      expect(screen.getByText('140')).toBeInTheDocument();
    });
  });
});
