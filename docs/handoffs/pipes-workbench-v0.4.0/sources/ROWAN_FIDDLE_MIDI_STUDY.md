# Rowan Reach - fiddle transcription v0.1

## Grounded inventory
- User-supplied Basic Pitch MIDI and original Suno WAV were inspected.
- 434 raw note events, from 25.36 s to 188.02 s; original song is 194.8 s.
- Range F#3-B5. Common pitch classes B, D, A, F#, E, C#.
- MIDI contains default 120 BPM and no key or time-signature metadata. This is NOT a measured musical tempo.
- Program 4 = Electric Piano 1 is MIDI playback metadata, not accurate instrument classification.
- Overlapping notes, small fragments, and transcribed velocities should not be interpreted as a hand-notated solo fiddle score.
- No exact consecutive occurrence of the *prompt-requested* D4-F#4-A4-B4-A4-F#4 motif was found in raw chronological events. It may be transformed, or segmentation may obscure it; the note-level data does not prove its absence from the performance.

## Passage near 1:30-1:45
An especially interesting high-register passage runs from approximately 98.46 s to 106.84 s. In the raw note detections, a prominent thread is
E5 -> G5 -> E5 -> F#5 (long) -> A5 -> B5 (at 102.52 s) -> A5 -> F#5 (long).
This is a provisional transcription hypothesis, not yet ear-confirmed as the exact instrument/ornamentation responsible for the user's favorite phrase.

## Files
- basic_pitch_note_events.csv: every raw note with original timing and velocity.
- rowan_fiddle_piano_roll_025_055.png: early cello/fiddle-era entrance visualization.
- rowan_fiddle_piano_roll_090_107.png: expanded highlighted passage.
- basic_pitch_with_violin_patch.mid: all notes and absolute timing intact; changes only GM playback instrument from Electric Piano 1 to Violin.
- fiddle_highlight_090_107_raw.mid: unedited events intersecting 1:30-1:47, moved to start at 0 for audition.
- original_audio_090_107.wav: synchronized 17-second WAV excerpt for A/B.
- study_manifest.json: analysis in machine-readable form.

## Next composition action
In a DAW, align original MIDI to the original audio without shifting the full song by 25 seconds. Compare the 90-107-s raw notes with the matched WAV excerpt. Correct false-onsets and octave/polyphonic artifacts manually. Store a separately curated melody under a distinct filename and motif ID before assigning it canonical status.
