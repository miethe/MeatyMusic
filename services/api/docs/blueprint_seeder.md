# Blueprint Seeder Documentation

## Overview

The Blueprint Seeder is a utility that parses genre blueprint markdown files from `docs/hit_song_blueprint/AI/` and populates the database with structured blueprint data. This enables the MeatyMusic AMCS workflow skills (PLAN, STYLE, VALIDATE) to use database-driven genre rules instead of hardcoded values.

## Files Created

### Core Components

1. **`app/utils/blueprint_parser.py`**
   - Parses human-readable blueprint markdown files
   - Extracts tempo ranges, key preferences, section requirements, lexicon, conflict matrix, and evaluation rubric
   - Handles format variations gracefully
   - Returns structured data matching the Blueprint model

2. **`app/scripts/seed_blueprints.py`**
   - Main seeder script
   - Finds and parses all blueprint markdown files
   - Creates or updates Blueprint records in the database
   - Supports dry-run mode and force-update mode
   - Provides detailed progress reporting

3. **`app/tests/test_blueprint_parser.py`**
   - Comprehensive unit tests for parser functions
   - Tests tempo extraction, key extraction, section extraction, genre name parsing
   - Integration tests for full file parsing
   - All 23 tests passing

### Modified Skills

Updated the following workflow skills to load blueprints from database using system UUID:

- `app/skills/plan.py` - Uses blueprint eval_rubric for evaluation targets
- `app/skills/style.py` - Uses blueprint tempo ranges and conflict matrix
- `app/skills/validate.py` - Uses blueprint rubric weights and thresholds

All skills now use `SYSTEM_UUID` (00000000-0000-0000-0000-000000000000) to access system-level blueprints.

## Usage

### Prerequisites

1. **Database Setup**
   - Ensure PostgreSQL database is running
   - Run database migrations to create the `blueprints` table:
     ```bash
     cd services/api
     uv run alembic upgrade head
     ```

### Running the Seeder

#### Dry-Run Mode (Parse Only)

Test the parser without modifying the database:

```bash
cd services/api
uv run python -m app.scripts.seed_blueprints --dry-run
```

This will:
- Parse all 15 blueprint markdown files
- Display what would be inserted
- Exit without database changes

#### Seed Database

Populate the database with blueprint data:

```bash
cd services/api
uv run python -m app.scripts.seed_blueprints
```

This will:
- Parse all blueprint files
- Create new blueprint records (skips existing by default)
- Display progress and summary

#### Force Update

Update existing blueprints with latest data:

```bash
cd services/api
uv run python -m app.scripts.seed_blueprints --force
```

This will:
- Parse all blueprint files
- Update existing blueprints instead of skipping them
- Create new blueprints for genres not yet in database

#### Custom Blueprint Directory

Specify a different blueprint directory:

```bash
cd services/api
uv run python -m app.scripts.seed_blueprints --blueprint-dir=/path/to/blueprints
```

#### Verbose Logging

Enable detailed logging:

```bash
cd services/api
uv run python -m app.scripts.seed_blueprints --verbose
```

### Example Output

```
=== DRY RUN MODE ===
Would seed 15 blueprints:

  - Pop (v2025.11)
    Tempo: [95, 130]
    Sections: Intro, Verse, Chorus, Hook, Bridge, Drop
    Keys: D major, G major, A major...

  - Hip-Hop (v2025.11)
    Tempo: [60, 100]
    Sections: Intro, Verse, Chorus, Hook, Build
    Keys: C major...

  ...

============================================================
SEEDING SUMMARY
============================================================
Created:  15
Updated:  0
Skipped:  0
Failed:   0
============================================================
```

## Blueprint Data Structure

### Database Schema

Blueprints are stored with the following structure:

```python
{
    "genre": "Pop",                    # Genre name
    "version": "2025.11",              # Blueprint version
    "rules": {
        "tempo_bpm": [100, 140],       # BPM range [min, max]
        "key_preferences": [            # Preferred keys
            "C major", "G major", "D major"
        ],
        "required_sections": [          # Required song sections
            "Verse", "Chorus", "Bridge"
        ],
        "lexicon_positive": [...],      # Preferred words/phrases
        "lexicon_negative": [...],      # Words to avoid
        "banned_terms": []              # Policy-enforced banned terms
    },
    "eval_rubric": {
        "weights": {                    # Metric weights (sum to 1.0)
            "hook_density": 0.30,
            "singability": 0.25,
            "rhyme_tightness": 0.15,
            "section_completeness": 0.15,
            "profanity_score": 0.15
        },
        "thresholds": {
            "min_total": 0.75,          # Minimum passing score
            "max_profanity": 0.15       # Maximum allowed profanity
        }
    },
    "conflict_matrix": {                # Tag conflicts
        "whisper": ["anthemic", "powerful"],
        "minimal": ["full instrumentation"]
    },
    "tag_categories": {                 # Categorized tags
        "Era": ["1970s", "1980s", ...],
        "Genre": ["Pop"],
        "Energy": ["low", "medium", "high"],
        ...
    },
    "extra_metadata": {
        "source_file": "pop_blueprint.md",
        "description": "Pop music blueprint...",
        "author": "MeatyMusic AMCS"
    }
}
```

### Supported Genres

The seeder currently processes these genre blueprints:

1. **Afrobeats** - [95-115 BPM]
2. **CCM** (Contemporary Christian Music) - [60-75 BPM]
3. **Christmas** - [100-130 BPM]
4. **Country** - [70-85 BPM]
5. **Electronic/EDM** - [120-130 BPM]
6. **Hip-Hop** - [60-100 BPM]
7. **Hyperpop** - [120-160 BPM]
8. **Indie Alternative** - [80-120 BPM]
9. **Kids** - [90-130 BPM]
10. **K-Pop** - [100-130 BPM]
11. **Latin** - [90-105 BPM]
12. **Pop** - [95-130 BPM]
13. **Pop-Punk** - [140-180 BPM]
14. **R&B** - [60-90 BPM]
15. **Rock** - [110-140 BPM]

## Parser Implementation Details

### Tempo Range Extraction

The parser handles multiple tempo format variations:

- Standard ranges: `"100-140 BPM"`, `"95–130 BPM"`
- Contextual: `"between 120–130 BPM"`, `"around 70–80 BPM"`
- Single values: `"120 BPM"` → creates ±10 BPM range

### Key Preferences

Extracts keys from various formats:

- Explicit: `"C major"`, `"A minor"`
- Lists: `"Major keys (C, G, D, A)"`
- Defaults to `"C major"` if none found

### Section Requirements

Identifies common section keywords:

- Standard: `intro`, `verse`, `chorus`, `bridge`, `outro`
- Genre-specific: `drop`, `build`, `hook`, `pre-chorus`
- Ensures minimum `Verse` + `Chorus` structure

### Evaluation Rubric

Genre-specific weights are inferred based on genre characteristics:

- **Pop/Christmas**: Emphasizes hook_density (0.30) and singability (0.25)
- **Hip-Hop**: Emphasizes rhyme_tightness (0.35)
- **Rock**: Emphasizes section_completeness (0.25)
- **R&B**: Emphasizes singability (0.30)

### Conflict Matrix

Provides common tag conflicts across all genres:

- `whisper` ↔ `anthemic`, `powerful`
- `intimate` ↔ `stadium`, `arena`
- `minimal` ↔ `full instrumentation`
- `dry mix` ↔ `lush reverb`
- `1970s` ↔ `2020s modern production`

## System UUID

System-level blueprints use the special UUID `00000000-0000-0000-0000-000000000000` for both `tenant_id` and `owner_id`. This allows the blueprint repository to access system blueprints without requiring user authentication.

All workflow skills use this `SYSTEM_UUID` when loading blueprints from the database.

## Error Handling

The seeder handles errors gracefully:

1. **Missing Blueprint Directory**: Reports clear error and exits
2. **Parse Failures**: Logs error and continues with other files
3. **Database Errors**: Rolls back transaction and reports failed genres
4. **Duplicate Blueprints**: Skips by default unless `--force` is used

## Testing

Run the parser tests:

```bash
cd services/api
uv run pytest app/tests/test_blueprint_parser.py -v
```

All 23 tests should pass:
- 5 tests for tempo extraction
- 4 tests for key extraction
- 3 tests for section extraction
- 5 tests for genre name parsing
- 4 tests for eval rubric inference
- 1 test for conflict matrix
- 3 integration tests for file parsing

## Deployment Checklist

When deploying to production:

1. ✅ Ensure PostgreSQL database is running
2. ✅ Run database migrations: `alembic upgrade head`
3. ✅ Run seeder: `uv run python -m app.scripts.seed_blueprints`
4. ✅ Verify blueprints in database: Check for 15 genres
5. ✅ Test workflow skills can load blueprints
6. ✅ Monitor logs for any blueprint loading errors

## Troubleshooting

### "no such table: blueprints"

**Solution**: Run database migrations first:
```bash
cd services/api
uv run alembic upgrade head
```

### "User context required for user-owned table 'blueprints'"

**Solution**: Ensure the seeder and skills use `SYSTEM_UUID`:
```python
security_context = SecurityContext(user_id=SYSTEM_UUID, tenant_id=SYSTEM_UUID)
```

### "Blueprint directory not found"

**Solution**: Verify the blueprint directory path:
```bash
ls -la docs/hit_song_blueprint/AI/
```

### "Failed to parse blueprint"

**Solution**: Check the markdown file format and parser logs for specific errors. The parser is designed to be lenient and will use defaults for missing fields.

## Future Enhancements

Potential improvements for future versions:

1. **Enhanced Lexicon Extraction**: Use NLP to extract more sophisticated lexicon from blueprint text
2. **Explicit Conflict Matrix**: Parse conflict matrix from dedicated markdown sections
3. **Version Management**: Support multiple blueprint versions per genre
4. **Blueprint Validation**: Add schema validation for parsed blueprints
5. **Incremental Updates**: Track which files have changed since last seed
6. **Admin UI**: Web interface for managing blueprints without command line

## References

- Blueprint Model: `services/api/app/models/blueprint.py`
- Blueprint Repository: `services/api/app/repositories/blueprint_repo.py`
- Workflow Skills: `services/api/app/skills/{plan,style,validate}.py`
- Blueprint Files: `docs/hit_song_blueprint/AI/*.md`
- PRD Reference: `docs/project_plans/PRDs/blueprint.prd.md`
