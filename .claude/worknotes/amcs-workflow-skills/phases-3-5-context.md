# Phases 3-5 Working Context

**Purpose:** Token-efficient context for resuming work across AI turns

---

## Current State

**Branch:** claude/amcs-workflow-skills-phases-3-5-012jCRQR3cm6kFYgLU8jcGAg
**Current Phase:** Phase 3-5 initialization
**Current Task:** Verifying existing implementations

---

## Key Decisions

- **Existing Implementations Found:** Skills already exist as Python modules in services/api/app/skills/
- **Validation Approach:** Will verify each implementation against phase requirements rather than starting from scratch

---

## Phase Scope

### Phase 3: LYRICS Skill
Generate lyrics with citation hashing, rhyme enforcement, and policy guards. Most complex skill with pinned retrieval for determinism.

**Key Features:**
- Pinned retrieval with content hashing
- Rhyme scheme enforcement
- Profanity filtering (if explicit=false)
- PII redaction
- Citation JSON with provenance

**Success Metric:** ≥99% determinism on 10 runs with same SDS+seed

### Phase 4: PRODUCER Skill
Generate arrangement and mix guidance aligned with style and lyrics.

**Key Features:**
- Structure planning (intro, verses, choruses, bridge, outro)
- Hook count determination
- Mix configuration (LUFS, space, stereo width)
- Section-specific tags

**Success Metric:** Structure aligns with lyrics, ≥99% reproducibility

### Phase 5: COMPOSE Skill
Merge all artifacts into final render-ready prompt with character limits.

**Key Features:**
- Prompt composition from all artifacts
- Character limit enforcement (3000 for Suno)
- Tag formatting and conflict resolution
- Section tag formatting

**Success Metric:** Prompts ≤3000 chars, ≥99% reproducibility

---

## Quick Reference

### Environment Setup
```bash
# API Tests
cd services/api
uv run pytest tests/unit/skills/test_lyrics.py -v
uv run pytest tests/unit/skills/test_producer.py -v
uv run pytest tests/unit/skills/test_compose.py -v

# Type checking
uv run mypy app/skills/

# Linting
uv run ruff check app/skills/
```

### Key Files

**Phase 3 (LYRICS):**
- Implementation: services/api/app/skills/lyrics.py
- Tests: services/api/tests/unit/skills/test_lyrics.py (missing - needs creation)
- Schema: services/api/app/schemas/lyrics.py

**Phase 4 (PRODUCER):**
- Implementation: services/api/app/skills/producer.py
- Tests: services/api/tests/unit/skills/test_producer.py (missing - needs creation)
- Schema: services/api/app/schemas/producer_notes.py

**Phase 5 (COMPOSE):**
- Implementation: services/api/app/skills/compose.py
- Tests: services/api/tests/unit/skills/test_compose.py (exists)
- Schema: services/api/app/schemas/composed_prompt.py

---

## Important Learnings

_To be populated as work progresses_

---

## Blockers/Issues

_None currently_
