/**
 * EntityDetailSection Component Tests
 * Comprehensive tests for entity detail display sections
 *
 * Task SDS-PREVIEW-009
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { EntityDetailSection } from '../EntityDetailSection';
import type { PersonaKind } from '@/types/api/entities';

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock UI components
jest.mock('@meatymusic/ui', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

describe('EntityDetailSection', () => {
  describe('Style Entity', () => {
    it('should render style entity with data', () => {
      const styleData = {
        genre: 'Pop',
        bpm_min: 120,
        bpm_max: 140,
        key: 'C Major',
        mood: ['upbeat', 'energetic', 'happy'],
        energy_level: 8,
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={styleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Check title
      expect(screen.getByText('Style')).toBeInTheDocument();

      // Check that key properties are displayed
      expect(screen.getByText('Genre')).toBeInTheDocument();
      expect(screen.getByText('Pop')).toBeInTheDocument();
      expect(screen.getByText('Tempo (BPM)')).toBeInTheDocument();
      expect(screen.getByText('120-140')).toBeInTheDocument();
      expect(screen.getByText('Key')).toBeInTheDocument();
      expect(screen.getByText('C Major')).toBeInTheDocument();
      expect(screen.getByText('Energy')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();

      // Check edit button
      const editButton = screen.getByText(/View \/ Edit Style/i);
      expect(editButton).toBeInTheDocument();
      expect(editButton.closest('a')).toHaveAttribute('href', '/entities/styles/style-123');
    });

    it('should render style entity without data (not assigned)', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      // Check title
      expect(screen.getByText('Style')).toBeInTheDocument();

      // Check not assigned state
      expect(screen.getByText('No style assigned')).toBeInTheDocument();

      // Check create button
      const createButton = screen.getByText(/Create Style/i);
      expect(createButton).toBeInTheDocument();
      expect(createButton.closest('a')).toHaveAttribute('href', '/entities/styles/new');
    });

    it('should display mood badges for style', () => {
      const styleData = {
        genre: 'Rock',
        mood: ['energetic', 'rebellious', 'intense'],
        bpm_min: 140,
        bpm_max: 160,
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={styleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Check mood badges (should show first 3)
      expect(screen.getByText('energetic')).toBeInTheDocument();
      expect(screen.getByText('rebellious')).toBeInTheDocument();
      expect(screen.getByText('intense')).toBeInTheDocument();
    });
  });

  describe('Lyrics Entity', () => {
    it('should render lyrics entity with data', () => {
      const lyricsData = {
        language: 'English',
        pov: 'first-person',
        rhyme_scheme: 'AABB',
        section_order: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
        hook_strategy: 'repetitive',
      };

      render(
        <EntityDetailSection
          entityType="lyrics"
          entityId="lyrics-456"
          entityData={lyricsData}
          editHref="/entities/lyrics/lyrics-456"
          createHref="/entities/lyrics/new"
        />
      );

      // Check title
      expect(screen.getByText('Lyrics')).toBeInTheDocument();

      // Check properties
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('POV')).toBeInTheDocument();
      expect(screen.getByText('first-person')).toBeInTheDocument();
      expect(screen.getByText('Rhyme Scheme')).toBeInTheDocument();
      expect(screen.getByText('AABB')).toBeInTheDocument();
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.getByText('6 sections')).toBeInTheDocument();
    });

    it('should render lyrics entity without data (not assigned)', () => {
      render(
        <EntityDetailSection
          entityType="lyrics"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/lyrics/new"
        />
      );

      expect(screen.getByText('Lyrics')).toBeInTheDocument();
      expect(screen.getByText('No lyrics assigned')).toBeInTheDocument();
      expect(screen.getByText(/Create Lyrics/i)).toBeInTheDocument();
    });
  });

  describe('Persona Entity', () => {
    it('should render persona entity with data', () => {
      const personaData = {
        name: 'John Doe',
        vocal_range: 'Tenor',
        delivery: ['smooth', 'powerful', 'emotional'],
        kind: 'artist' as PersonaKind,
        influences: ['Artist A', 'Artist B', 'Artist C'],
      };

      render(
        <EntityDetailSection
          entityType="persona"
          entityId="persona-789"
          entityData={personaData}
          editHref="/entities/personas/persona-789"
          createHref="/entities/personas/new"
        />
      );

      // Check title
      expect(screen.getByText('Persona')).toBeInTheDocument();

      // Check properties
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Vocal Range')).toBeInTheDocument();
      expect(screen.getByText('Tenor')).toBeInTheDocument();
      expect(screen.getByText('Kind')).toBeInTheDocument();
      expect(screen.getByText('artist')).toBeInTheDocument();
      expect(screen.getByText('Influences')).toBeInTheDocument();
      expect(screen.getByText('3 artists')).toBeInTheDocument();
    });

    it('should display delivery style badges', () => {
      const personaData = {
        name: 'Jane Smith',
        delivery: ['raspy', 'passionate'],
        vocal_range: 'Alto',
      };

      render(
        <EntityDetailSection
          entityType="persona"
          entityId="persona-789"
          entityData={personaData}
          editHref="/entities/personas/persona-789"
          createHref="/entities/personas/new"
        />
      );

      expect(screen.getByText('raspy')).toBeInTheDocument();
      expect(screen.getByText('passionate')).toBeInTheDocument();
    });
  });

  describe('Blueprint Entity', () => {
    it('should render blueprint entity with data', () => {
      const blueprintData = {
        genre: 'Pop',
        version: '2025.11',
        rules: {
          required_sections: ['verse', 'chorus', 'bridge'],
          tempo_bpm: [100, 160],
        },
        eval_rubric: {
          thresholds: {
            min_total: 85,
          },
        },
      };

      render(
        <EntityDetailSection
          entityType="blueprint"
          entityId="blueprint-101"
          entityData={blueprintData}
          editHref="/entities/blueprints/blueprint-101"
          createHref="/entities/blueprints/new"
        />
      );

      // Check title
      expect(screen.getByText('Blueprint')).toBeInTheDocument();

      // Check properties
      expect(screen.getByText('Genre')).toBeInTheDocument();
      expect(screen.getByText('Pop')).toBeInTheDocument();
      expect(screen.getByText('Version')).toBeInTheDocument();
      expect(screen.getByText('2025.11')).toBeInTheDocument();
      expect(screen.getByText('Required Sections')).toBeInTheDocument();
      expect(screen.getByText('3 sections')).toBeInTheDocument();
      expect(screen.getByText('Tempo Range')).toBeInTheDocument();
      expect(screen.getByText('100-160 BPM')).toBeInTheDocument();
      expect(screen.getByText('Min Score')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  describe('Producer Notes Entity', () => {
    it('should render producer notes entity with data', () => {
      const producerData = {
        structure: 'verse-chorus-verse-chorus-bridge-chorus',
        hooks: 'repetitive melody in chorus',
        mix: {
          lufs: -14,
          stereo_width: 'wide',
        },
        instrumentation: ['drums', 'bass', 'synth', 'vocals', 'guitar'],
      };

      render(
        <EntityDetailSection
          entityType="producer_notes"
          entityId="producer-202"
          entityData={producerData}
          editHref="/entities/producer-notes/producer-202"
          createHref="/entities/producer-notes/new"
        />
      );

      // Check title
      expect(screen.getByText('Producer Notes')).toBeInTheDocument();

      // Check properties
      expect(screen.getByText('Structure')).toBeInTheDocument();
      expect(screen.getByText('verse-chorus-verse-chorus-bridge-chorus')).toBeInTheDocument();
      expect(screen.getByText('Hooks')).toBeInTheDocument();
      expect(screen.getByText('repetitive melody in chorus')).toBeInTheDocument();
      expect(screen.getByText('Mix LUFS')).toBeInTheDocument();
      expect(screen.getByText('-14')).toBeInTheDocument();
      expect(screen.getByText('Stereo Width')).toBeInTheDocument();
      expect(screen.getByText('wide')).toBeInTheDocument();
      expect(screen.getByText('Instrumentation')).toBeInTheDocument();
      expect(screen.getByText('5 instruments')).toBeInTheDocument();
    });
  });

  describe('Entity Icons', () => {
    it('should display correct icon for each entity type', () => {
      const entities: Array<'style' | 'lyrics' | 'persona' | 'blueprint' | 'producer_notes'> = [
        'style',
        'lyrics',
        'persona',
        'blueprint',
        'producer_notes',
      ];

      entities.forEach((entityType) => {
        const { container } = render(
          <EntityDetailSection
            entityType={entityType}
            entityId={`${entityType}-123`}
            entityData={{}}
            editHref={`/entities/${entityType}/${entityType}-123`}
            createHref={`/entities/${entityType}/new`}
          />
        );

        // Each entity should have an icon (svg element)
        const icons = container.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Assigned Badge', () => {
    it('should show "Assigned" badge when entity has data', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={{ genre: 'Pop' }}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('Assigned')).toBeInTheDocument();
    });

    it('should not show "Assigned" badge when entity has no data', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.queryByText('Assigned')).not.toBeInTheDocument();
    });
  });

  describe('Entity ID Display', () => {
    it('should display entity ID when assigned', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-abc-123"
          entityData={{ genre: 'Pop' }}
          editHref="/entities/styles/style-abc-123"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('Entity ID')).toBeInTheDocument();
      expect(screen.getByText('style-abc-123')).toBeInTheDocument();
    });

    it('should not display entity ID when not assigned', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.queryByText('Entity ID')).not.toBeInTheDocument();
    });
  });

  describe('Array Value Truncation', () => {
    it('should show "+N more" badge when array has more than 3 items', () => {
      const styleData = {
        mood: ['happy', 'energetic', 'upbeat', 'positive', 'bright'],
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={styleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Should show first 3 items
      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.getByText('energetic')).toBeInTheDocument();
      expect(screen.getByText('upbeat')).toBeInTheDocument();

      // Should show "+2 more" badge
      expect(screen.getByText('+2 more')).toBeInTheDocument();

      // Should not show remaining items
      expect(screen.queryByText('positive')).not.toBeInTheDocument();
      expect(screen.queryByText('bright')).not.toBeInTheDocument();
    });

    it('should show all items when array has 3 or fewer items', () => {
      const styleData = {
        mood: ['happy', 'energetic', 'upbeat'],
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={styleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      expect(screen.getByText('happy')).toBeInTheDocument();
      expect(screen.getByText('energetic')).toBeInTheDocument();
      expect(screen.getByText('upbeat')).toBeInTheDocument();
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render properly in grid layout (component renders correctly)', () => {
      render(
        <div className="grid md:grid-cols-2 gap-6">
          <EntityDetailSection
            entityType="style"
            entityId="style-123"
            entityData={{ genre: 'Pop' }}
            editHref="/entities/styles/style-123"
            createHref="/entities/styles/new"
          />
          <EntityDetailSection
            entityType="lyrics"
            entityId="lyrics-456"
            entityData={{ language: 'English' }}
            editHref="/entities/lyrics/lyrics-456"
            createHref="/entities/lyrics/new"
          />
        </div>
      );

      // Both components should render
      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Lyrics')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', () => {
      const styleData = {
        genre: 'Pop',
        key: null,
        mood: null,
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={styleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Genre should be displayed
      expect(screen.getByText('Genre')).toBeInTheDocument();
      expect(screen.getByText('Pop')).toBeInTheDocument();

      // Null values should not be displayed
      expect(screen.queryByText('Key')).not.toBeInTheDocument();
      expect(screen.queryByText('Mood')).not.toBeInTheDocument();
    });

    it('should handle undefined values gracefully', () => {
      const styleData = {
        genre: 'Pop',
        key: undefined,
        mood: undefined,
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={styleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Genre should be displayed
      expect(screen.getByText('Genre')).toBeInTheDocument();
      expect(screen.getByText('Pop')).toBeInTheDocument();

      // Undefined values should not be displayed
      expect(screen.queryByText('Key')).not.toBeInTheDocument();
      expect(screen.queryByText('Mood')).not.toBeInTheDocument();
    });

    it('should handle empty arrays', () => {
      const styleData = {
        genre: 'Pop',
        mood: [],
      };

      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={styleData}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      // Genre should be displayed
      expect(screen.getByText('Genre')).toBeInTheDocument();

      // Empty arrays should not be displayed
      expect(screen.queryByText('Mood')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons with descriptive text', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId="style-123"
          entityData={{ genre: 'Pop' }}
          editHref="/entities/styles/style-123"
          createHref="/entities/styles/new"
        />
      );

      const button = screen.getByText(/View \/ Edit Style/i);
      expect(button).toBeInTheDocument();
      expect(button.closest('a')).toHaveAttribute('href', '/entities/styles/style-123');
    });

    it('should have accessible create button', () => {
      render(
        <EntityDetailSection
          entityType="style"
          entityId={null}
          entityData={undefined}
          editHref="#"
          createHref="/entities/styles/new"
        />
      );

      const button = screen.getByText(/Create Style/i);
      expect(button).toBeInTheDocument();
      expect(button.closest('a')).toHaveAttribute('href', '/entities/styles/new');
    });
  });
});
