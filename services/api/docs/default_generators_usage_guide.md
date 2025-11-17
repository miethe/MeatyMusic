# Default Generators Usage Guide

**Quick reference for using PersonaDefaultGenerator and ProducerDefaultGenerator**

---

## PersonaDefaultGenerator

### Basic Usage

```python
from app.services.default_generators import PersonaDefaultGenerator

generator = PersonaDefaultGenerator()

# Case 1: No persona needed (returns None)
result = generator.generate_default_persona(blueprint, None)
# Returns: None

# Case 2: Generate persona from minimal data
blueprint = {"genre": "Pop"}
partial_persona = {"name": "My Artist"}

result = generator.generate_default_persona(blueprint, partial_persona)
# Returns: {
#     "name": "My Artist",
#     "kind": "artist",
#     "vocal_range": "medium",
#     "delivery": ["melodic", "belting"],
#     "influences": [],
#     "voice": None,
#     "bio": None,
#     "policy": {
#         "public_release": False,
#         "disallow_named_style_of": True
#     }
# }
```

### Genre-Specific Examples

```python
# Hip-Hop
blueprint = {"genre": "Hip-Hop"}
partial = {"name": "MC Artist"}
result = generator.generate_default_persona(blueprint, partial)
# vocal_range: "baritone"
# delivery: ["rap", "melodic-rap"]

# Country
blueprint = {"genre": "Country"}
partial = {"name": "Country Star"}
result = generator.generate_default_persona(blueprint, partial)
# vocal_range: "baritone"
# delivery: ["storytelling", "conversational"]

# R&B
blueprint = {"genre": "R&B"}
partial = {"name": "Soul Singer"}
result = generator.generate_default_persona(blueprint, partial)
# vocal_range: "alto"
# delivery: ["soulful", "melismatic"]
```

### User Field Preservation

```python
# User provides specific fields - they are preserved
partial = {
    "name": "Custom Artist",
    "vocal_range": "soprano",
    "delivery": ["whispered", "breathy"],
    "influences": ["Billie Eilish", "Lana Del Rey"],
    "policy": {"public_release": True}
}

result = generator.generate_default_persona(blueprint, partial)
# All user fields preserved exactly as provided
```

---

## ProducerDefaultGenerator

### Basic Usage

```python
from app.services.default_generators import ProducerDefaultGenerator

generator = ProducerDefaultGenerator()

# Required inputs
blueprint = {"genre": "Pop", "version": "2025.11"}

style = {
    "genre_detail": {"primary": "Pop"},
    "tempo_bpm": [120, 128],
    "instrumentation": ["piano", "drums", "bass"]
}

lyrics = {
    "language": "en",
    "section_order": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
    "constraints": {"explicit": False}
}

# Generate producer notes
result = generator.generate_default_producer_notes(
    blueprint=blueprint,
    style=style,
    lyrics=lyrics
)

# Returns: {
#     "structure": "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus",
#     "hooks": 2,
#     "instrumentation": ["piano", "drums", "bass"],
#     "section_meta": {
#         "Intro": {"tags": ["instrumental", "build"], "target_duration_sec": 10},
#         "Verse": {"tags": ["storytelling"], "target_duration_sec": 30},
#         "Chorus": {"tags": ["anthemic", "hook-forward"], "target_duration_sec": 25},
#         "Bridge": {"tags": ["contrast", "dynamic"], "target_duration_sec": 20}
#     },
#     "mix": {
#         "lufs": -14.0,
#         "space": "balanced",
#         "stereo_width": "normal"
#     }
# }
```

### Structure Derivation

```python
# Structure is automatically derived from lyrics section_order
lyrics = {
    "section_order": ["Verse", "Chorus", "Verse", "Chorus"],
    "constraints": {}
}

result = generator.generate_default_producer_notes(blueprint, style, lyrics)
# structure: "Verse-Chorus-Verse-Chorus"

# Empty section_order uses fallback
lyrics = {"section_order": [], "constraints": {}}
result = generator.generate_default_producer_notes(blueprint, style, lyrics)
# structure: "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus" (standard pop)
```

### Section Metadata

```python
# Section metadata is automatically created for all unique sections
lyrics = {
    "section_order": ["Intro", "Verse", "PreChorus", "Chorus", "Bridge", "Chorus", "Outro"],
    "constraints": {}
}

result = generator.generate_default_producer_notes(blueprint, style, lyrics)

# section_meta will contain:
# - Intro: instrumental, build (10s)
# - Verse: storytelling (30s)
# - PreChorus: build (15s)
# - Chorus: anthemic, hook-forward (25s)
# - Bridge: contrast, dynamic (20s)
# - Outro: fade-out (10s)
```

### Partial Producer Notes

```python
# User provides partial producer notes - they are preserved
partial_producer = {
    "structure": "Custom-Structure",
    "hooks": 5,
    "mix": {"lufs": -12.0, "space": "dry"}
}

result = generator.generate_default_producer_notes(
    blueprint=blueprint,
    style=style,
    lyrics=lyrics,
    partial_producer=partial_producer
)

# User values preserved:
# - structure: "Custom-Structure" (not derived from lyrics)
# - hooks: 5 (not default 2)
# - mix.lufs: -12.0 (not default -14.0)
# - mix.space: "dry" (not default "balanced")
# - mix.stereo_width: "normal" (default, not provided by user)
```

---

## Integration Example (SDSCompilerService)

```python
from app.services.default_generators import (
    PersonaDefaultGenerator,
    ProducerDefaultGenerator
)
from app.services.blueprint_reader import BlueprintReaderService

class SDSCompilerService:
    def __init__(self):
        self.blueprint_reader = BlueprintReaderService()
        self.persona_generator = PersonaDefaultGenerator()
        self.producer_generator = ProducerDefaultGenerator()

    def compile_sds(self, user_input: dict, use_defaults: bool = True):
        # Read blueprint
        blueprint = self.blueprint_reader.read_blueprint(
            genre=user_input["genre"],
            mood=user_input.get("mood")
        )

        entities = {}

        # Generate persona (if partial data exists)
        if use_defaults:
            partial_persona = user_input.get("persona")
            persona = self.persona_generator.generate_default_persona(
                blueprint, partial_persona
            )
            if persona:  # May be None
                entities["persona"] = persona

        # Generate producer notes (always)
        if use_defaults and "style" in entities and "lyrics" in entities:
            partial_producer = user_input.get("producer_notes")
            entities["producer_notes"] = self.producer_generator.generate_default_producer_notes(
                blueprint=blueprint,
                style=entities["style"],
                lyrics=entities["lyrics"],
                partial_producer=partial_producer
            )

        return entities
```

---

## Common Patterns

### Pattern 1: Full Default Generation

```python
# User provides minimal input, generators fill in the rest
user_input = {
    "genre": "Pop",
    "persona": {"name": "Pop Star"}  # Minimal persona
}

# Persona generator fills in:
# - vocal_range: "medium"
# - delivery: ["melodic", "belting"]
# - influences: []
# - policy defaults
```

### Pattern 2: Selective Override

```python
# User provides specific values, generators use them
user_input = {
    "genre": "Rock",
    "persona": {
        "name": "Rock Band",
        "vocal_range": "tenor",  # User override
        "delivery": ["powerful", "screaming"]  # User override
    }
}

# Persona generator preserves user values, fills in:
# - kind: "artist"
# - influences: []
# - policy defaults
```

### Pattern 3: No Persona Needed

```python
# User doesn't provide persona at all
user_input = {
    "genre": "Pop",
    # No persona field
}

# Persona generator returns None
result = generator.generate_default_persona(blueprint, None)
# Returns: None
```

---

## Error Handling

### Persona Generator

```python
# Blueprint required
try:
    result = generator.generate_default_persona(None, partial)
except ValueError:
    # Handle missing blueprint
    pass

# Empty blueprint handled gracefully
result = generator.generate_default_persona({}, partial)
# Uses "Pop" defaults when genre not found
```

### Producer Generator

```python
# All inputs always provided (required by SDS structure)
result = generator.generate_default_producer_notes(
    blueprint=blueprint,
    style=style,
    lyrics=lyrics,
    partial_producer=None  # OK - will use all defaults
)

# Empty section_order uses fallback
lyrics = {"section_order": [], "constraints": {}}
result = generator.generate_default_producer_notes(blueprint, style, lyrics)
# Uses standard pop structure
```

---

## Testing

### Test Persona Generator

```python
def test_persona_generation():
    generator = PersonaDefaultGenerator()
    blueprint = {"genre": "Pop"}
    partial = {"name": "Test Artist"}

    result = generator.generate_default_persona(blueprint, partial)

    assert result["name"] == "Test Artist"
    assert result["vocal_range"] == "medium"
    assert result["delivery"] == ["melodic", "belting"]
    assert result["influences"] == []
```

### Test Producer Generator

```python
def test_producer_generation():
    generator = ProducerDefaultGenerator()

    blueprint = {"genre": "Pop"}
    style = {"instrumentation": ["piano"]}
    lyrics = {"section_order": ["Verse", "Chorus"], "constraints": {}}

    result = generator.generate_default_producer_notes(blueprint, style, lyrics)

    assert result["structure"] == "Verse-Chorus"
    assert result["hooks"] == 2
    assert result["instrumentation"] == ["piano"]
    assert "Verse" in result["section_meta"]
    assert "Chorus" in result["section_meta"]
```

### Test Determinism

```python
def test_determinism():
    generator = PersonaDefaultGenerator()
    blueprint = {"genre": "Pop"}
    partial = {"name": "Artist"}

    # Generate multiple times
    results = [
        generator.generate_default_persona(blueprint, partial)
        for _ in range(10)
    ]

    # All should be identical
    assert all(r == results[0] for r in results)
```

---

## Performance Considerations

### Stateless Generators

Both generators are stateless - safe to reuse instances:

```python
# Create once, use many times
persona_generator = PersonaDefaultGenerator()
producer_generator = ProducerDefaultGenerator()

for user_input in batch:
    persona = persona_generator.generate_default_persona(...)
    producer = producer_generator.generate_default_producer_notes(...)
```

### No I/O Operations

- No database calls
- No file reads
- No network requests
- Pure computation

**Performance:** ~0.01ms per generation

---

## Reference Tables

### Persona Vocal Ranges by Genre

| Genre | Vocal Range |
|-------|-------------|
| Pop | medium |
| Hip-Hop | baritone |
| Country | baritone |
| Rock | tenor |
| R&B | alto |
| K-Pop | medium-high |
| Jazz | medium |
| Electronic | medium |

### Section Duration Defaults

| Section | Duration (sec) |
|---------|----------------|
| Intro | 10 |
| Verse | 30 |
| PreChorus | 15 |
| Chorus | 25 |
| Bridge | 20 |
| Outro | 10 |
| Unknown | 20 |

### Mix Target Defaults

| Parameter | Default | Options |
|-----------|---------|---------|
| lufs | -14.0 | Streaming standard |
| space | balanced | dry, balanced, lush |
| stereo_width | normal | narrow, normal, wide |

---

## Questions & Support

For questions or issues:
1. Check test files for comprehensive examples
2. See implementation files for detailed docstrings
3. Refer to PRDs in `docs/project_plans/PRDs/`

---

**Last Updated:** 2025-11-17
**Version:** 1.0
