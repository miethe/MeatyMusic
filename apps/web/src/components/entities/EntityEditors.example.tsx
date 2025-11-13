/**
 * Entity Editors Usage Examples
 *
 * This file demonstrates how to use all entity editors in MeatyMusic AMCS.
 * Each editor follows consistent patterns with validation, preview, and save/cancel actions.
 */

import {
  StyleEditor,
  LyricsEditor,
  PersonaEditor,
  ProducerNotesEditor,
  SongEditor,
  BlueprintEditor,
} from './index';
import type {
  StyleCreate,
  LyricsCreate,
  PersonaCreate,
  ProducerNotesCreate,
  SongCreate,
  BlueprintCreate,
} from '@/types/api/entities';

// Example 1: StyleEditor - Creating a new pop style
function StyleEditorExample() {
  const handleSave = (style: StyleCreate) => {
    console.log('Saving style:', style);
    // In real usage: call API to save style
    // const response = await createStyle(style);
  };

  const handleCancel = () => {
    console.log('Cancelled style editing');
    // In real usage: navigate back or close modal
  };

  return (
    <StyleEditor
      initialValue={{
        name: 'Modern Pop Ballad',
        genre: 'pop',
        bpm_min: 80,
        bpm_max: 95,
        mood: ['romantic', 'uplifting'],
      }}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Example 2: LyricsEditor - Creating lyrics for a song
function LyricsEditorExample() {
  const songId = 'song-uuid-here';

  const handleSave = (lyrics: LyricsCreate) => {
    console.log('Saving lyrics:', lyrics);
    // In real usage: call API to save lyrics
    // const response = await createLyrics(lyrics);
  };

  const handleCancel = () => {
    console.log('Cancelled lyrics editing');
  };

  return (
    <LyricsEditor
      songId={songId}
      initialValue={{
        rhyme_scheme: 'ABAB',
        pov: 'first-person',
        themes: ['love', 'hope'],
      }}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Example 3: PersonaEditor - Creating an artist persona
function PersonaEditorExample() {
  const handleSave = (persona: PersonaCreate) => {
    console.log('Saving persona:', persona);
    // In real usage: call API to save persona
    // const response = await createPersona(persona);
  };

  const handleCancel = () => {
    console.log('Cancelled persona editing');
  };

  return (
    <PersonaEditor
      initialValue={{
        name: 'Soulful Storyteller',
        kind: 'artist',
        vocal_range: 'tenor',
        delivery: ['smooth', 'melodic'],
      }}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Example 4: ProducerNotesEditor - Creating production notes
function ProducerNotesEditorExample() {
  const songId = 'song-uuid-here';

  const handleSave = (notes: ProducerNotesCreate) => {
    console.log('Saving producer notes:', notes);
    // In real usage: call API to save producer notes
    // const response = await createProducerNotes(notes);
  };

  const handleCancel = () => {
    console.log('Cancelled producer notes editing');
  };

  return (
    <ProducerNotesEditor
      songId={songId}
      initialValue={{
        hooks: 3,
        mix: {
          lufs: -12,
          space: 'normal',
          stereo_width: 'wide',
        },
      }}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Example 5: SongEditor - Creating a new song
function SongEditorExample() {
  const handleSave = (song: SongCreate) => {
    console.log('Saving song:', song);
    // In real usage: call API to save song
    // const response = await createSong(song);
  };

  const handleCancel = () => {
    console.log('Cancelled song editing');
  };

  return (
    <SongEditor
      initialValue={{
        title: 'Holiday Hustle',
        status: 'draft',
        global_seed: 42,
      }}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Example 6: BlueprintEditor - Creating a genre blueprint
function BlueprintEditorExample() {
  const handleSave = (blueprint: BlueprintCreate) => {
    console.log('Saving blueprint:', blueprint);
    // In real usage: call API to save blueprint
    // const response = await createBlueprint(blueprint);
  };

  const handleCancel = () => {
    console.log('Cancelled blueprint editing');
  };

  return (
    <BlueprintEditor
      initialValue={{
        genre: 'pop',
        version: '1.0',
        rules: {
          tempo_bpm: [80, 140],
          required_sections: ['chorus'],
        },
      }}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Example 7: Modal Integration Pattern
import { useState } from 'react';

function ModalEditorExample() {
  const [showEditor, setShowEditor] = useState(false);

  const handleSave = (style: StyleCreate) => {
    // Save the style
    console.log('Saving:', style);
    // Close the modal
    setShowEditor(false);
  };

  const handleCancel = () => {
    setShowEditor(false);
  };

  return (
    <>
      <button onClick={() => setShowEditor(true)}>Edit Style</button>

      {showEditor && (
        <div className="fixed inset-0 bg-background-overlay z-50 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl max-h-screen bg-background-secondary rounded-xl shadow-2xl overflow-hidden">
            <StyleEditor onSave={handleSave} onCancel={handleCancel} />
          </div>
        </div>
      )}
    </>
  );
}

// Example 8: Full-page Editor Pattern
function FullPageEditorExample() {
  const handleSave = (lyrics: LyricsCreate) => {
    console.log('Saving:', lyrics);
    // Navigate back or to detail page
    // router.push('/songs');
  };

  const handleCancel = () => {
    // Navigate back
    // router.back();
  };

  return (
    <div className="h-screen bg-background-primary">
      <LyricsEditor
        songId="song-123"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

// Example 9: With API Integration (Next.js App Router)
// In a real app route: app/(app)/songs/[id]/edit-style/page.tsx
/*
'use client';

import { useParams, useRouter } from 'next/navigation';
import { StyleEditor } from '@/components/entities';
import { useSong, useUpdateStyle } from '@/hooks/queries';
import { toast } from '@/lib/toast';

export default function EditStylePage() {
  const params = useParams();
  const router = useRouter();

  const { data: song } = useSong(params.id as string);
  const { mutate: updateStyle, isPending } = useUpdateStyle();

  const handleSave = (style: StyleCreate) => {
    updateStyle(
      { id: song.style_id, data: style },
      {
        onSuccess: () => {
          toast.success('Style updated successfully');
          router.push(`/songs/${params.id}`);
        },
        onError: (error) => {
          toast.error(`Failed to update style: ${error.message}`);
        },
      }
    );
  };

  const handleCancel = () => {
    router.back();
  };

  if (!song) return <div>Loading...</div>;

  return (
    <StyleEditor
      initialValue={song.style}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
*/

// Example 10: Common Components Usage
import {
  ChipSelector,
  RangeSlider,
  SectionEditor,
  RhymeSchemeInput,
  EntityPreviewPanel,
} from './index';

function CommonComponentsExample() {
  const [moods, setMoods] = useState<string[]>(['upbeat', 'energetic']);
  const [tempo, setTempo] = useState<[number, number]>([120, 140]);
  const [sections, setSections] = useState([
    { id: '1', type: 'verse', duration: 30 },
    { id: '2', type: 'chorus', duration: 25 },
  ]);
  const [rhymeScheme, setRhymeScheme] = useState('ABAB');

  return (
    <div className="space-y-6 p-6">
      <ChipSelector
        label="Moods"
        value={moods}
        onChange={setMoods}
        suggestions={['upbeat', 'melancholic', 'energetic', 'calm']}
        maxChips={5}
      />

      <RangeSlider
        label="Tempo Range"
        min={60}
        max={180}
        value={tempo}
        onChange={setTempo as any}
        unit=" BPM"
        presets={[
          { label: 'Slow', value: [60, 80] as [number, number] },
          { label: 'Moderate', value: [80, 120] as [number, number] },
          { label: 'Fast', value: [120, 160] as [number, number] },
        ]}
      />

      <SectionEditor
        label="Song Structure"
        sections={sections}
        onChange={setSections}
        sectionTypes={[
          { value: 'verse', label: 'Verse' },
          { value: 'chorus', label: 'Chorus' },
          { value: 'bridge', label: 'Bridge' },
        ]}
        showDuration
      />

      <RhymeSchemeInput
        label="Rhyme Scheme"
        value={rhymeScheme}
        onChange={setRhymeScheme}
      />

      <EntityPreviewPanel
        entity={{ moods, tempo, sections, rhymeScheme }}
        validationErrors={[
          {
            field: 'sections',
            message: 'At least one chorus is recommended',
            severity: 'warning',
          },
        ]}
      />
    </div>
  );
}

export {
  StyleEditorExample,
  LyricsEditorExample,
  PersonaEditorExample,
  ProducerNotesEditorExample,
  SongEditorExample,
  BlueprintEditorExample,
  ModalEditorExample,
  FullPageEditorExample,
  CommonComponentsExample,
};
