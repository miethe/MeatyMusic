#!/usr/bin/env python3
"""
Synthetic Song Generator for Determinism Tests

Generates 200 diverse synthetic Song Design Specs (SDS) covering:
- All 15 genre blueprints
- Wide parameter variation (BPM, key, mood, sections)
- Edge cases (extreme values, unusual structures)
- Fixed seeds for reproducible test generation

Usage:
    # Generate all 200 fixtures
    python -m tests.fixtures.synthetic_songs

    # Generate with custom seed
    python -m tests.fixtures.synthetic_songs --seed 12345

    # Generate specific count
    python -m tests.fixtures.synthetic_songs --count 50

Author: AMCS Development Team
Created: 2025-11-20
"""

import argparse
import json
import random
from pathlib import Path
from typing import Any, Dict, List, Tuple


# Base directory for fixtures
FIXTURES_DIR = Path(__file__).parent / "test_songs"

# All 15 available genre blueprints
ALL_GENRES = [
    "pop", "country", "hiphop", "rock", "rnb", "electronic",
    "indie_alternative", "christmas", "ccm", "kpop", "latin",
    "afrobeats", "hyperpop", "pop_punk", "kids"
]

# Genre-specific configuration
GENRE_CONFIGS = {
    "pop": {
        "bpm_range": (90, 140),
        "keys": ["C major", "G major", "D major", "F major", "A major"],
        "moods": ["upbeat", "energetic", "melancholic", "joyful", "nostalgic"],
        "instrumentation": ["synth", "drums", "bass", "guitar", "keys"],
        "tags": ["melodic", "catchy", "anthemic", "uplifting", "radio-friendly"],
        "vocal_styles": ["powerful", "smooth", "breathy", "belting"],
    },
    "country": {
        "bpm_range": (80, 130),
        "keys": ["G major", "D major", "A major", "C major", "E major"],
        "moods": ["nostalgic", "heartfelt", "upbeat", "melancholic", "celebratory"],
        "instrumentation": ["acoustic guitar", "banjo", "fiddle", "drums", "steel guitar"],
        "tags": ["storytelling", "twangy", "authentic", "traditional", "americana"],
        "vocal_styles": ["twangy", "smooth", "raspy", "emotive"],
    },
    "hiphop": {
        "bpm_range": (70, 100),
        "keys": ["C minor", "D minor", "G minor", "A minor", "E minor"],
        "moods": ["confident", "aggressive", "smooth", "introspective", "dark"],
        "instrumentation": ["beats", "bass", "synth", "samples", "808s"],
        "tags": ["rhythmic", "bass-heavy", "lyrical", "hard-hitting", "groovy"],
        "vocal_styles": ["rhythmic", "melodic rap", "aggressive", "smooth"],
    },
    "rock": {
        "bpm_range": (80, 160),
        "keys": ["E major", "A major", "D major", "G major", "B minor"],
        "moods": ["rebellious", "energetic", "powerful", "angst", "triumphant"],
        "instrumentation": ["electric guitar", "bass", "drums", "vocals"],
        "tags": ["guitar-driven", "powerful", "raw", "energetic", "anthemic"],
        "vocal_styles": ["powerful", "raspy", "belting", "gritty"],
    },
    "rnb": {
        "bpm_range": (70, 110),
        "keys": ["C major", "F major", "Bb major", "Eb major", "D minor"],
        "moods": ["smooth", "sensual", "emotional", "romantic", "groovy"],
        "instrumentation": ["keys", "bass", "drums", "synth", "guitar"],
        "tags": ["smooth", "soulful", "groovy", "sultry", "melodic"],
        "vocal_styles": ["smooth", "melismatic", "soulful", "breathy"],
    },
    "electronic": {
        "bpm_range": (120, 140),
        "keys": ["A minor", "E minor", "C major", "D minor", "G minor"],
        "moods": ["energetic", "hypnotic", "futuristic", "dark", "euphoric"],
        "instrumentation": ["synth", "electronic drums", "bass", "pads", "effects"],
        "tags": ["synth-driven", "atmospheric", "rhythmic", "hypnotic", "progressive"],
        "vocal_styles": ["processed", "ethereal", "robotic", "powerful"],
    },
    "indie_alternative": {
        "bpm_range": (90, 130),
        "keys": ["C major", "G major", "D minor", "A minor", "F major"],
        "moods": ["introspective", "mellow", "authentic", "dreamy", "melancholic"],
        "instrumentation": ["guitar", "keys", "drums", "bass", "synth"],
        "tags": ["authentic", "introspective", "lo-fi", "atmospheric", "experimental"],
        "vocal_styles": ["intimate", "conversational", "emotive", "ethereal"],
    },
    "christmas": {
        "bpm_range": (80, 120),
        "keys": ["C major", "G major", "F major", "D major", "Bb major"],
        "moods": ["joyful", "festive", "warm", "nostalgic", "celebratory"],
        "instrumentation": ["bells", "orchestra", "choir", "piano", "strings"],
        "tags": ["festive", "joyful", "traditional", "warm", "uplifting"],
        "vocal_styles": ["warm", "choir-like", "powerful", "smooth"],
    },
    "ccm": {
        "bpm_range": (70, 130),
        "keys": ["C major", "G major", "D major", "A major", "E major"],
        "moods": ["uplifting", "worshipful", "hopeful", "reverent", "joyful"],
        "instrumentation": ["acoustic guitar", "keys", "drums", "bass", "choir"],
        "tags": ["worshipful", "anthemic", "uplifting", "heartfelt", "inspiring"],
        "vocal_styles": ["powerful", "emotive", "smooth", "choir-like"],
    },
    "kpop": {
        "bpm_range": (110, 150),
        "keys": ["C major", "D major", "E major", "G major", "A minor"],
        "moods": ["energetic", "bright", "playful", "dramatic", "powerful"],
        "instrumentation": ["synth", "electronic drums", "bass", "samples", "keys"],
        "tags": ["catchy", "polished", "energetic", "layered", "dynamic"],
        "vocal_styles": ["powerful", "agile", "layered", "dynamic"],
    },
    "latin": {
        "bpm_range": (90, 130),
        "keys": ["C major", "G major", "D minor", "A minor", "E major"],
        "moods": ["passionate", "rhythmic", "celebratory", "romantic", "energetic"],
        "instrumentation": ["guitar", "percussion", "brass", "bass", "keys"],
        "tags": ["rhythmic", "passionate", "danceable", "vibrant", "latin"],
        "vocal_styles": ["passionate", "smooth", "powerful", "emotive"],
    },
    "afrobeats": {
        "bpm_range": (100, 130),
        "keys": ["C major", "D minor", "E minor", "G major", "A minor"],
        "moods": ["energetic", "rhythmic", "celebratory", "groovy", "uplifting"],
        "instrumentation": ["drums", "percussion", "synth", "bass", "guitar"],
        "tags": ["rhythmic", "percussion-heavy", "groovy", "vibrant", "danceable"],
        "vocal_styles": ["rhythmic", "smooth", "melodic", "call-and-response"],
    },
    "hyperpop": {
        "bpm_range": (140, 200),
        "keys": ["C major", "E major", "G major", "A minor", "D major"],
        "moods": ["chaotic", "energetic", "experimental", "euphoric", "intense"],
        "instrumentation": ["synth", "electronic drums", "bass", "effects", "autotune"],
        "tags": ["experimental", "chaotic", "distorted", "maximalist", "glitchy"],
        "vocal_styles": ["processed", "pitched", "distorted", "layered"],
    },
    "pop_punk": {
        "bpm_range": (150, 200),
        "keys": ["E major", "A major", "D major", "G major", "B minor"],
        "moods": ["rebellious", "energetic", "angsty", "upbeat", "defiant"],
        "instrumentation": ["electric guitar", "bass", "drums", "power chords"],
        "tags": ["fast-paced", "guitar-driven", "energetic", "catchy", "rebellious"],
        "vocal_styles": ["powerful", "shouted", "melodic", "raw"],
    },
    "kids": {
        "bpm_range": (100, 140),
        "keys": ["C major", "G major", "F major", "D major", "A major"],
        "moods": ["playful", "happy", "educational", "energetic", "friendly"],
        "instrumentation": ["ukulele", "xylophone", "drums", "synth", "claps"],
        "tags": ["simple", "catchy", "repetitive", "fun", "educational"],
        "vocal_styles": ["bright", "clear", "animated", "friendly"],
    },
}


# Section templates for different song structures
SECTION_TEMPLATES = {
    "simple": ["verse1", "chorus1", "verse2", "chorus2", "outro"],
    "standard": ["intro", "verse1", "chorus1", "verse2", "chorus2", "bridge", "chorus3", "outro"],
    "complex": ["intro", "verse1", "pre-chorus1", "chorus1", "verse2", "pre-chorus2", "chorus2", "bridge", "chorus3", "outro"],
    "extended": ["intro", "verse1", "pre-chorus1", "chorus1", "verse2", "pre-chorus2", "chorus2", "interlude", "bridge", "breakdown", "chorus3", "outro"],
    "minimal": ["verse1", "chorus1", "verse2", "chorus2"],
    "progressive": ["intro", "verse1", "chorus1", "interlude1", "verse2", "chorus2", "bridge", "interlude2", "final-chorus", "outro"],
}


def generate_song(
    genre: str,
    complexity: str,
    seed: int,
    song_num: int,
) -> Dict[str, Any]:
    """
    Generate a single synthetic Song Design Spec.

    Args:
        genre: Genre identifier (e.g., "pop", "rock")
        complexity: Complexity level ("simple", "standard", "complex", "extended")
        seed: Deterministic seed for this song
        song_num: Song number for unique ID

    Returns:
        SDS dictionary
    """
    rng = random.Random(seed)
    config = GENRE_CONFIGS.get(genre, GENRE_CONFIGS["pop"])

    # Generate BPM
    bpm = rng.randint(*config["bpm_range"])

    # Generate key
    key = rng.choice(config["keys"])

    # Generate mood (2-3 moods)
    mood_count = rng.randint(2, 3)
    mood = rng.sample(config["moods"], min(mood_count, len(config["moods"])))

    # Generate instrumentation (3-5 instruments)
    inst_count = rng.randint(3, 5)
    instrumentation = rng.sample(config["instrumentation"], min(inst_count, len(config["instrumentation"])))

    # Generate tags (2-4 tags)
    tag_count = rng.randint(2, 4)
    tags = rng.sample(config["tags"], min(tag_count, len(config["tags"])))

    # Generate vocal style
    vocal_style = rng.choice(config["vocal_styles"])

    # Select section structure based on complexity
    section_order = SECTION_TEMPLATES.get(complexity, SECTION_TEMPLATES["standard"]).copy()

    # Generate constraints
    explicit = rng.choice([False, False, False, True])  # 25% chance of explicit
    max_lines = len(section_order) * rng.randint(4, 8)

    # Calculate target duration based on BPM and section count
    avg_section_duration = 20  # seconds
    target_duration = len(section_order) * avg_section_duration

    # Generate energy level
    energy_levels = ["low", "medium", "high", "anthemic"]
    energy = rng.choice(energy_levels)

    return {
        "id": f"synthetic-{genre}-{song_num:03d}",
        "title": f"{genre.title().replace('_', ' ')} Song {song_num}",
        "blueprint_ref": {
            "genre": genre.title().replace("_", " "),
            "version": "2025.11"
        },
        "style": {
            "genre_detail": {
                "primary": genre,
                "subgenres": [],
                "fusions": []
            },
            "tempo_bpm": bpm,
            "time_signature": "4/4",
            "key": {
                "primary": key,
                "modulations": []
            },
            "mood": mood,
            "energy": energy,
            "instrumentation": instrumentation,
            "vocal_profile": vocal_style,
            "tags": tags,
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": rng.choice(["1st", "2nd", "3rd"]),
            "tense": rng.choice(["present", "past", "future"]),
            "themes": [genre, rng.choice(["love", "life", "emotion", "dreams", "memories"])],
            "rhyme_scheme": rng.choice(["ABAB", "AABB", "ABCB", "AAAA", "Free"]),
            "section_order": section_order,
            "constraints": {
                "explicit": explicit,
                "max_lines": max_lines
            }
        },
        "producer_notes": {
            "structure": complexity.title(),
            "hooks": rng.randint(2, 6)
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
        "seed": seed
    }


def generate_edge_case_songs(base_seed: int, start_num: int) -> List[Dict[str, Any]]:
    """
    Generate edge case songs with unusual parameters.

    Args:
        base_seed: Base seed for edge cases
        start_num: Starting song number

    Returns:
        List of edge case SDS dictionaries
    """
    edge_cases = []
    rng = random.Random(base_seed)

    # Edge case 1: Extreme low BPM
    edge_cases.append({
        "id": f"synthetic-edge-{start_num:03d}",
        "title": "Glacial Movement",
        "blueprint_ref": {"genre": "Electronic", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "ambient", "subgenres": [], "fusions": []},
            "tempo_bpm": 40,
            "time_signature": "4/4",
            "key": {"primary": "C minor", "modulations": []},
            "mood": ["ethereal", "slow", "atmospheric"],
            "energy": "low",
            "instrumentation": ["pads", "drones", "ambient"],
            "vocal_profile": "whisper",
            "tags": ["ambient", "slow", "atmospheric"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["time", "space", "meditation"],
            "rhyme_scheme": "Free",
            "section_order": ["verse1", "verse2", "verse3"],
            "constraints": {"explicit": False, "max_lines": 20}
        },
        "producer_notes": {"structure": "Minimal", "hooks": 0},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": base_seed + start_num
    })

    # Edge case 2: Extreme high BPM
    edge_cases.append({
        "id": f"synthetic-edge-{start_num+1:03d}",
        "title": "Hyperspeed",
        "blueprint_ref": {"genre": "Electronic", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "drum and bass", "subgenres": [], "fusions": []},
            "tempo_bpm": 200,
            "time_signature": "4/4",
            "key": {"primary": "E minor", "modulations": []},
            "mood": ["frantic", "intense", "energetic"],
            "energy": "anthemic",
            "instrumentation": ["electronic drums", "bass", "synth"],
            "vocal_profile": "energetic",
            "tags": ["fast", "intense", "energetic"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["speed", "adrenaline", "chaos"],
            "rhyme_scheme": "AAAA",
            "section_order": ["verse1", "chorus1", "verse2", "chorus2"],
            "constraints": {"explicit": False, "max_lines": 25}
        },
        "producer_notes": {"structure": "Fast-paced", "hooks": 4},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": base_seed + start_num + 1
    })

    # Edge case 3: Many sections (20 sections)
    section_order = [f"section{i}" for i in range(1, 21)]
    edge_cases.append({
        "id": f"synthetic-edge-{start_num+2:03d}",
        "title": "Epic Journey",
        "blueprint_ref": {"genre": "Rock", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "progressive rock", "subgenres": [], "fusions": []},
            "tempo_bpm": [80, 100, 120, 140, 160],
            "time_signature": "4/4",
            "key": {"primary": "D major", "modulations": ["E major", "F# major", "A major"]},
            "mood": ["epic", "complex", "dramatic"],
            "energy": "high",
            "instrumentation": ["guitar", "keys", "bass", "drums"],
            "vocal_profile": "theatrical",
            "tags": ["complex", "progressive", "epic"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "3rd",
            "tense": "mixed",
            "themes": ["journey", "transformation", "adventure"],
            "rhyme_scheme": "Complex",
            "section_order": section_order,
            "constraints": {"explicit": False, "max_lines": 100}
        },
        "producer_notes": {"structure": "Multi-section epic", "hooks": 10},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": base_seed + start_num + 2
    })

    # Edge case 4: Unusual time signature (7/8)
    edge_cases.append({
        "id": f"synthetic-edge-{start_num+3:03d}",
        "title": "Odd Rhythm",
        "blueprint_ref": {"genre": "Indie Alternative", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "experimental", "subgenres": [], "fusions": []},
            "tempo_bpm": 110,
            "time_signature": "7/8",
            "key": {"primary": "F# minor", "modulations": []},
            "mood": ["unusual", "complex", "mathematical"],
            "energy": "medium",
            "instrumentation": ["drums", "bass", "synth"],
            "vocal_profile": "spoken",
            "tags": ["experimental", "rhythmic", "unusual"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["rhythm", "mathematics", "patterns"],
            "rhyme_scheme": "Free",
            "section_order": ["verse1", "verse2", "bridge"],
            "constraints": {"explicit": False, "max_lines": 20}
        },
        "producer_notes": {"structure": "Experimental", "hooks": 1},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": base_seed + start_num + 3
    })

    # Edge case 5: Minimal sections
    edge_cases.append({
        "id": f"synthetic-edge-{start_num+4:03d}",
        "title": "Minimalist",
        "blueprint_ref": {"genre": "Electronic", "version": "2025.11"},
        "style": {
            "genre_detail": {"primary": "minimal techno", "subgenres": [], "fusions": []},
            "tempo_bpm": 120,
            "time_signature": "4/4",
            "key": {"primary": "C minor", "modulations": []},
            "mood": ["hypnotic", "minimal", "repetitive"],
            "energy": "medium",
            "instrumentation": ["synth", "kick"],
            "vocal_profile": "none",
            "tags": ["minimal", "hypnotic", "repetitive"],
            "negative_tags": []
        },
        "lyrics": {
            "language": "en",
            "pov": "1st",
            "tense": "present",
            "themes": ["minimal", "rhythm"],
            "rhyme_scheme": "Free",
            "section_order": ["verse1"],
            "constraints": {"explicit": False, "max_lines": 5}
        },
        "producer_notes": {"structure": "Minimal", "hooks": 0},
        "sources": [],
        "prompt_controls": {},
        "render": {"engine": "none"},
        "seed": base_seed + start_num + 4
    })

    return edge_cases


def generate_all_songs(base_seed: int = 42, total_count: int = 200) -> List[Dict[str, Any]]:
    """
    Generate all 200 synthetic songs.

    Distribution:
    - 13-14 songs per genre for 15 genres = ~195 songs
    - 5 edge cases
    - Total = 200 songs

    Each genre gets a mix of complexity levels:
    - Simple: 3-4 songs
    - Standard: 5-6 songs
    - Complex: 3-4 songs
    - Extended: 1-2 songs

    Args:
        base_seed: Base seed for generation
        total_count: Total number of songs to generate

    Returns:
        List of 200 SDS dictionaries
    """
    all_songs = []
    song_num = 1
    rng = random.Random(base_seed)

    # Calculate songs per genre
    songs_per_genre = (total_count - 5) // len(ALL_GENRES)  # Reserve 5 for edge cases

    print(f"Generating {total_count} synthetic songs (seed={base_seed})")
    print(f"- {songs_per_genre} songs per genre × {len(ALL_GENRES)} genres")
    print(f"- 5 edge cases")
    print()

    # Generate songs for each genre
    for genre in ALL_GENRES:
        print(f"Generating {genre} songs...")

        # Complexity distribution for this genre
        complexities = (
            ["simple"] * 3 +
            ["standard"] * 5 +
            ["complex"] * 3 +
            ["extended"] * 2
        )

        # Shuffle complexities deterministically
        genre_rng = random.Random(base_seed + hash(genre))
        genre_rng.shuffle(complexities)

        # Generate songs
        for i in range(songs_per_genre):
            complexity = complexities[i % len(complexities)]
            seed = base_seed + song_num * 100

            song = generate_song(genre, complexity, seed, song_num)
            all_songs.append(song)
            song_num += 1

    # Generate edge cases
    print("Generating edge case songs...")
    edge_cases = generate_edge_case_songs(base_seed + 90000, song_num)
    all_songs.extend(edge_cases)

    print(f"\nGenerated {len(all_songs)} total songs")
    return all_songs


def save_songs(songs: List[Dict[str, Any]], output_dir: Path) -> None:
    """
    Save songs as individual JSON files.

    Args:
        songs: List of SDS dictionaries
        output_dir: Output directory for JSON files
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nWriting songs to {output_dir}/")

    for song in songs:
        filename = f"{song['id']}.json"
        filepath = output_dir / filename

        with open(filepath, "w") as f:
            json.dump(song, f, indent=2)

    print(f"✓ Wrote {len(songs)} songs")


def save_manifest(songs: List[Dict[str, Any]], output_dir: Path) -> None:
    """
    Save manifest file with song metadata.

    Args:
        songs: List of SDS dictionaries
        output_dir: Output directory
    """
    manifest = {
        "total_songs": len(songs),
        "genres": {},
        "complexities": {},
        "songs": []
    }

    # Collect stats
    for song in songs:
        genre = song["style"]["genre_detail"]["primary"]
        complexity = song["producer_notes"]["structure"]

        # Genre count
        manifest["genres"][genre] = manifest["genres"].get(genre, 0) + 1

        # Complexity count
        manifest["complexities"][complexity] = manifest["complexities"].get(complexity, 0) + 1

        # Song entry
        manifest["songs"].append({
            "id": song["id"],
            "title": song["title"],
            "genre": genre,
            "bpm": song["style"]["tempo_bpm"],
            "complexity": complexity,
            "seed": song["seed"]
        })

    # Save manifest
    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"✓ Wrote manifest: {manifest_path}")


def main():
    """Main entry point for synthetic song generation."""
    parser = argparse.ArgumentParser(
        description="Generate synthetic songs for determinism tests"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Base seed for generation (default: 42)"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=200,
        help="Number of songs to generate (default: 200)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=FIXTURES_DIR,
        help=f"Output directory (default: {FIXTURES_DIR})"
    )

    args = parser.parse_args()

    # Generate songs
    songs = generate_all_songs(base_seed=args.seed, total_count=args.count)

    # Save songs
    save_songs(songs, args.output)
    save_manifest(songs, args.output)

    print("\n✅ Synthetic song generation complete!")
    print(f"📁 Location: {args.output}/")
    print(f"\nTo run determinism tests:")
    print(f"  uv run --project services/api pytest tests/test_determinism.py -v")


if __name__ == "__main__":
    main()
