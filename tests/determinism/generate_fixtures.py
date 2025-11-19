#!/usr/bin/env python3
"""
SDS Fixture Generator for Determinism Tests

Generates 50 diverse Song Design Spec (SDS) JSON fixtures covering:
- 5 Pop songs (simple → complex)
- 5 Rock, 5 Hip-Hop, 5 Country, 5 Electronic, 5 R&B
- 5 Christmas, 5 Indie/Alternative
- 10 Edge cases (unusual structures, extreme BPM, etc.)

Usage:
    python generate_fixtures.py

Output:
    Creates 50 JSON files in fixtures/ directory
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List


def generate_pop_fixtures() -> List[Dict[str, Any]]:
    """Generate 5 Pop SDS fixtures with varying complexity."""
    fixtures = []

    # Pop Simple 1: Basic pop ballad
    fixtures.append({
        "title": "Summer Dreams",
        "blueprint_ref": {
            "genre": "Pop",
            "version": "2025.11"
        },
        "style": {
            "genre_detail": {
                "primary": "pop",
                "subgenres": ["synth-pop"],
                "fusions": []
            },
            "tempo_bpm": 120,
            "time_signature": "4/4",
            "key": {
                "primary": "C major",
                "modulations": []
            },
            "mood": ["upbeat", "energetic"],
            "energy": "high",
            "instrumentation": ["synth", "drums", "bass"],
            "vocal_profile": "powerful",
            "tags": ["melodic", "catchy"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["summer", "dreams", "love"],
            "rhyme_scheme": "ABAB",
            "section_order": ["intro", "verse1", "chorus1", "verse2", "chorus2", "bridge", "chorus3", "outro"],
            "constraints": {
                "explicit": False,
                "max_lines": 40
            }
        },
        "producer_notes": {
            "structure": "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro",
            "hooks": 3
        },
        "sources": [],
        "prompt_controls": {
            "positive_tags": [],
            "negative_tags": [],
            "max_style_chars": 1000,
            "max_prompt_chars": 5000
        },
        "render": {
            "engine": "none"
        },
        "seed": 42
    })

    # Pop Simple 2: Upbeat dance pop
    fixtures.append({
        "title": "Dance All Night",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "pop", "subgenres": ["dance-pop"], "fusions": []},
            "tempo_bpm": 128,
            "time_signature": "4/4",
            "key": {"primary": "G major", "modulations": []},
            "mood": ["energetic", "joyful"],
            "energy": "anthemic",
            "instrumentation": ["synth", "electronic drums", "bass"],
            "vocal_profile": "strong",
            "tags": ["uplifting", "anthemic"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["dancing", "nightlife", "freedom"],
            "rhyme_scheme": "AABB",
            "section_order": ["verse1", "chorus1", "verse2", "chorus2", "chorus3"],
            "constraints": {"explicit": False, "max_lines": 30}
        },
        "producer_notes": {"structure": "Verse-Chorus-Verse-Chorus-Chorus", "hooks": 4},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 100
    })

    # Pop Medium 3: Emotional ballad with modulation
    fixtures.append({
        "title": "Fading Light",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "pop", "subgenres": ["ballad"], "fusions": []},
            "tempo_bpm": 72,
            "time_signature": "4/4",
            "key": {"primary": "A minor", "modulations": ["C major"]},
            "mood": ["melancholic", "emotional"],
            "energy": "medium",
            "instrumentation": ["piano", "strings", "drums"],
            "vocal_profile": "emotive",
            "tags": ["emotional", "powerful"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "past",
            "themes": ["loss", "memories", "hope"],
            "rhyme_scheme": "ABCB",
            "section_order": ["verse1", "verse2", "chorus1", "verse3", "chorus2", "bridge", "chorus3"],
            "constraints": {"explicit": False, "max_lines": 35}
        },
        "producer_notes": {"structure": "Verse-Verse-Chorus-Verse-Chorus-Bridge-Chorus", "hooks": 2},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 200
    })

    # Pop Complex 4: Multi-section with tempo changes
    fixtures.append({
        "title": "Electric Dreams",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "pop", "subgenres": ["synth-pop", "electropop"], "fusions": ["electronic"]},
            "tempo_bpm": [110, 140],
            "time_signature": "4/4",
            "key": {"primary": "E major", "modulations": ["F# major"]},
            "mood": ["dreamy", "energetic", "futuristic"],
            "energy": "high",
            "instrumentation": ["synth", "electronic drums", "bass", "pads"],
            "vocal_profile": "layered",
            "tags": ["dreamy", "futuristic", "layered"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "2nd",
            "tense": "future",
            "themes": ["technology", "dreams", "future"],
            "rhyme_scheme": "AABC",
            "section_order": ["intro", "verse1", "pre-chorus1", "chorus1", "verse2", "pre-chorus2", "chorus2", "bridge", "breakdown", "chorus3", "outro"],
            "constraints": {"explicit": False, "max_lines": 50}
        },
        "producer_notes": {"structure": "Complex multi-section with tempo shift", "hooks": 5},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 300
    })

    # Pop Complex 5: Maximum complexity
    fixtures.append({
        "title": "Symphony of Colors",
        "blueprint_ref": {"genre": "Pop", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "pop", "subgenres": ["art-pop", "orchestral-pop"], "fusions": ["classical"]},
            "tempo_bpm": [90, 120, 140],
            "time_signature": "4/4",
            "key": {"primary": "D major", "modulations": ["F major", "A major"]},
            "mood": ["dramatic", "epic", "emotional"],
            "energy": "anthemic",
            "instrumentation": ["orchestra", "synth", "drums", "strings", "brass"],
            "vocal_profile": "operatic",
            "tags": ["orchestral", "dramatic", "epic", "layered"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "3rd",
            "tense": "mixed",
            "themes": ["art", "beauty", "transformation"],
            "rhyme_scheme": "Complex",
            "section_order": ["intro", "verse1", "pre-chorus1", "chorus1", "interlude1", "verse2", "pre-chorus2", "chorus2", "bridge", "interlude2", "final-chorus", "outro"],
            "constraints": {"explicit": False, "max_lines": 60}
        },
        "producer_notes": {"structure": "Orchestral pop with multiple sections and tempo changes", "hooks": 6},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 400
    })

    return fixtures


def generate_genre_fixtures(genre: str, base_seed: int) -> List[Dict[str, Any]]:
    """Generate 5 fixtures for a specific genre."""
    fixtures = []

    genre_configs = {
        "rock": {
            "bpm_range": (80, 160),
            "keys": ["E major", "A major", "D major", "G major"],
            "moods": ["rebellious", "energetic", "powerful"],
            "instrumentation": ["guitar", "bass", "drums", "vocals"],
            "tags": ["guitar-driven", "powerful", "raw"]
        },
        "hiphop": {
            "bpm_range": (70, 100),
            "keys": ["C minor", "D minor", "G minor"],
            "moods": ["confident", "aggressive", "smooth"],
            "instrumentation": ["beats", "bass", "synth"],
            "tags": ["rhythmic", "bass-heavy", "lyrical"]
        },
        "country": {
            "bpm_range": (80, 130),
            "keys": ["G major", "D major", "A major", "C major"],
            "moods": ["nostalgic", "heartfelt", "upbeat"],
            "instrumentation": ["acoustic guitar", "banjo", "fiddle", "drums"],
            "tags": ["storytelling", "twangy", "authentic"]
        },
        "electronic": {
            "bpm_range": (120, 140),
            "keys": ["A minor", "E minor", "C major"],
            "moods": ["energetic", "hypnotic", "futuristic"],
            "instrumentation": ["synth", "electronic drums", "bass"],
            "tags": ["synth-driven", "atmospheric", "rhythmic"]
        },
        "rnb": {
            "bpm_range": (70, 110),
            "keys": ["C major", "F major", "Bb major"],
            "moods": ["smooth", "sensual", "emotional"],
            "instrumentation": ["keys", "bass", "drums", "vocals"],
            "tags": ["smooth", "soulful", "groovy"]
        },
        "christmas": {
            "bpm_range": (80, 120),
            "keys": ["C major", "G major", "F major"],
            "moods": ["joyful", "festive", "warm"],
            "instrumentation": ["bells", "orchestra", "choir"],
            "tags": ["festive", "joyful", "traditional"]
        },
        "indie": {
            "bpm_range": (90, 130),
            "keys": ["C major", "G major", "D minor", "A minor"],
            "moods": ["introspective", "mellow", "authentic"],
            "instrumentation": ["guitar", "keys", "drums"],
            "tags": ["authentic", "introspective", "lo-fi"]
        }
    }

    config = genre_configs.get(genre, genre_configs["rock"])

    for i in range(5):
        seed = base_seed + i * 10
        bpm = config["bpm_range"][0] + (i * (config["bpm_range"][1] - config["bpm_range"][0]) // 4)

        fixtures.append({
            "title": f"{genre.title()} Song {i+1}",
            "blueprint_ref": {"genre": genre.title(), "version": "2025.11"},
            "style": {
                "genre_detail": {"primary": genre, "subgenres": [], "fusions": []},
                "tempo_bpm": bpm,
                "time_signature": "4/4",
                "key": {"primary": config["keys"][i % len(config["keys"])], "modulations": []},
                "mood": config["moods"][:2],
                "energy": "medium",
                "instrumentation": config["instrumentation"][:3],
                "vocal_profile": "standard",
                "tags": config["tags"][:2],
                "negative_tags": []
            },
            "lyrics": {
                "language": "en",
                "pov": "1st",
                "tense": "present",
                "themes": [genre, "life", "emotion"],
                "rhyme_scheme": "ABAB",
                "section_order": ["verse1", "chorus1", "verse2", "chorus2", "bridge", "chorus3"],
                "constraints": {"explicit": False, "max_lines": 35}
            },
            "producer_notes": {"structure": "Standard", "hooks": 2 + i},
            "sources": [],
            "prompt_controls": {},
            "render": {"engine": "none"},
            "seed": seed
        })

    return fixtures


def generate_edge_case_fixtures() -> List[Dict[str, Any]]:
    """Generate 10 edge case fixtures."""
    fixtures = []

    # Edge case 1: Extreme low BPM
    fixtures.append({
        "title": "Glacial Movement",
        "blueprint_ref": {"genre": "Experimental", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "ambient", "subgenres": [], "fusions": []},
            "tempo_bpm": 40,
            "time_signature": "4/4",
            "key": {"primary": "C minor", "modulations": []},
            "mood": ["ethereal", "slow"],
            "energy": "low",
            "instrumentation": ["pads", "drones"],
            "vocal_profile": "whisper",
            "tags": ["ambient", "slow"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["time", "space"],
            "rhyme_scheme": "Free",
            "section_order": ["verse1", "verse2", "verse3"],
            "constraints": {"explicit": False, "max_lines": 20}
        },
        "producer_notes": {"structure": "Minimal", "hooks": 0},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 9000
    })

    # Edge case 2: Extreme high BPM
    fixtures.append({
        "title": "Hyperspeed",
        "blueprint_ref": {"genre": "Electronic", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "drum and bass", "subgenres": [], "fusions": []},
            "tempo_bpm": 200,
            "time_signature": "4/4",
            "key": {"primary": "E minor", "modulations": []},
            "mood": ["frantic", "intense"],
            "energy": "anthemic",
            "instrumentation": ["electronic drums", "bass", "synth"],
            "vocal_profile": "energetic",
            "tags": ["fast", "intense"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["speed", "adrenaline"],
            "rhyme_scheme": "AAAA",
            "section_order": ["verse1", "chorus1", "verse2", "chorus2"],
            "constraints": {"explicit": False, "max_lines": 25}
        },
        "producer_notes": {"structure": "Fast-paced", "hooks": 4},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 9100
    })

    # Edge case 3: Many sections (20 sections)
    section_order = [f"section{i}" for i in range(1, 21)]
    fixtures.append({
        "title": "Epic Journey",
        "blueprint_ref": {"genre": "Progressive", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "progressive rock", "subgenres": [], "fusions": []},
            "tempo_bpm": [80, 100, 120, 140, 160],
            "time_signature": "4/4",
            "key": {"primary": "D major", "modulations": ["E major", "F# major", "A major"]},
            "mood": ["epic", "complex"],
            "energy": "high",
            "instrumentation": ["guitar", "keys", "bass", "drums"],
            "vocal_profile": "theatrical",
            "tags": ["complex", "progressive"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "3rd",
            "tense": "mixed",
            "themes": ["journey", "transformation"],
            "rhyme_scheme": "Complex",
            "section_order": section_order,
            "constraints": {"explicit": False, "max_lines": 100}
        },
        "producer_notes": {"structure": "Multi-section epic", "hooks": 10},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 9200
    })

    # Edge case 4: Unusual time signature (7/8)
    fixtures.append({
        "title": "Odd Rhythm",
        "blueprint_ref": {"genre": "Experimental", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "experimental", "subgenres": [], "fusions": []},
            "tempo_bpm": 110,
            "time_signature": "7/8",
            "key": {"primary": "F# minor", "modulations": []},
            "mood": ["unusual", "complex"],
            "energy": "medium",
            "instrumentation": ["drums", "bass", "synth"],
            "vocal_profile": "spoken",
            "tags": ["experimental", "rhythmic"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["rhythm", "mathematics"],
            "rhyme_scheme": "Free",
            "section_order": ["verse1", "verse2", "bridge"],
            "constraints": {"explicit": False, "max_lines": 20}
        },
        "producer_notes": {"structure": "Experimental", "hooks": 1},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": 9300
    })

    # Edge cases 5-10: Various other edge cases
    for i in range(5, 11):
        seed = 9000 + i * 100
        fixtures.append({
            "title": f"Edge Case {i}",
            "blueprint_ref": {"genre": "Experimental", "version": "2025.11"},
            "style": {
                "genre_detail": {"primary": "experimental", "subgenres": [], "fusions": []},
                "tempo_bpm": 60 + i * 15,
                "time_signature": "4/4",
                "key": {"primary": "C major", "modulations": []},
                "mood": ["experimental"],
                "energy": "medium",
                "instrumentation": ["synth"],
                "vocal_profile": "standard",
                "tags": ["experimental"],
                "negative_tags": []
            },
            "lyrics": {
                "language": "en",
                "pov": "1st",
                "tense": "present",
                "themes": ["abstract"],
                "rhyme_scheme": "ABAB",
                "section_order": ["verse1", "chorus1", "verse2"],
                "constraints": {"explicit": False, "max_lines": 25}
            },
            "producer_notes": {"structure": "Standard", "hooks": i % 3},
            "sources": [],
            "prompt_controls": {},
            "render": {"engine": "none"},
            "seed": seed
        })

    return fixtures


def main():
    """Generate all 50 SDS fixtures."""
    fixtures_dir = Path(__file__).parent / "fixtures"
    fixtures_dir.mkdir(exist_ok=True)

    all_fixtures = []

    # Generate Pop (5)
    print("Generating Pop fixtures...")
    pop_fixtures = generate_pop_fixtures()
    for i, fixture in enumerate(pop_fixtures, 1):
        all_fixtures.append((f"pop_complexity_{i}.json", fixture))

    # Generate other genres (5 each)
    genres = ["rock", "hiphop", "country", "electronic", "rnb", "christmas", "indie"]
    base_seeds = [1000, 2000, 3000, 4000, 5000, 6000, 7000]

    for genre, base_seed in zip(genres, base_seeds):
        print(f"Generating {genre.title()} fixtures...")
        genre_fixtures = generate_genre_fixtures(genre, base_seed)
        for i, fixture in enumerate(genre_fixtures, 1):
            all_fixtures.append((f"{genre}_song_{i:03d}.json", fixture))

    # Generate edge cases (10)
    print("Generating edge case fixtures...")
    edge_fixtures = generate_edge_case_fixtures()
    for i, fixture in enumerate(edge_fixtures, 1):
        all_fixtures.append((f"edge_case_{i:03d}.json", fixture))

    # Write all fixtures
    print(f"\nWriting {len(all_fixtures)} fixtures to {fixtures_dir}/")
    for filename, fixture in all_fixtures:
        filepath = fixtures_dir / filename
        with open(filepath, "w") as f:
            json.dump(fixture, f, indent=2)
        print(f"  ✓ {filename}")

    print(f"\n✅ Successfully generated {len(all_fixtures)} SDS fixtures!")
    print(f"📁 Location: {fixtures_dir}/")


if __name__ == "__main__":
    main()
