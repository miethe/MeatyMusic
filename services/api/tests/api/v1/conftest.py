"""Fixtures for API v1 integration tests.

Provides common test fixtures for song, style, lyrics, producer notes,
blueprint, persona, and source entities used across API endpoint tests.
"""

from __future__ import annotations

import uuid
from typing import Dict, Any
from datetime import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.models import Song, Style, Lyrics, ProducerNotes, Blueprint, Persona, Source
from app.main import app


@pytest.fixture
async def async_client() -> AsyncClient:
    """Create async HTTP client for testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def test_tenant_id() -> uuid.UUID:
    """Generate a test tenant ID."""
    return uuid.uuid4()


@pytest.fixture
def test_owner_id() -> uuid.UUID:
    """Generate a test owner ID."""
    return uuid.uuid4()


@pytest.fixture
def test_blueprint(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID
) -> Blueprint:
    """Create a test blueprint."""
    blueprint = Blueprint(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        genre="Pop",
        version="2025.11",
        rules={
            "tempo_bpm": {"min": 80, "max": 140},
            "required_sections": ["Intro", "Verse", "Chorus", "Bridge", "Outro"],
            "section_lines": {
                "Chorus": {"min_lines": 6, "must_end_with_hook": True}
            }
        },
        eval_rubric={
            "weights": {
                "hook_density": 0.3,
                "singability": 0.25,
                "rhyme_tightness": 0.2,
                "section_completeness": 0.15,
                "profanity_score": 0.1
            },
            "thresholds": {
                "min_total": 0.7,
            }
        },
        conflict_matrix={},
        tag_categories={},
        extra_metadata={}
    )

    test_session.add(blueprint)
    test_session.commit()
    test_session.refresh(blueprint)

    return blueprint


@pytest.fixture
def test_style(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint
) -> Style:
    """Create a test style specification."""
    style = Style(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Pop Style",
        genre="Pop",
        sub_genres=["Synth Pop"],
        bpm_min=120,
        bpm_max=120,
        key="C major",
        modulations=[],
        mood=["upbeat", "energetic"],
        energy_level=8,
        instrumentation=["synth", "drums", "bass"],
        vocal_profile={"voice": "energetic", "range": "medium", "delivery": "clear"},
        tags_positive=["modern", "bright"],
        tags_negative=["muddy"],
        blueprint_id=test_blueprint.id,
        extra_metadata={}
    )

    test_session.add(style)
    test_session.commit()
    test_session.refresh(style)

    return style


@pytest.fixture
def test_lyrics(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint
) -> Lyrics:
    """Create test lyrics."""
    lyrics = Lyrics(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Test Lyrics",
        language="en",
        pov="1st",
        tense="present",
        themes=["love", "celebration"],
        rhyme_scheme="AABB",
        meter="4/4 pop",
        syllables_per_line=8,
        hook_strategy="repetition",
        repetition_rules={"hook_count": 2},
        imagery_density=6,
        section_order=["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
        reading_level=8,
        explicit_allowed=False,
        constraints={
            "explicit": False,
            "max_lines": 120,
            "section_requirements": {
                "Chorus": {"min_lines": 6, "must_end_with_hook": True}
            }
        },
        source_citations=[],
        blueprint_id=test_blueprint.id,
        extra_metadata={}
    )

    test_session.add(lyrics)
    test_session.commit()
    test_session.refresh(lyrics)

    return lyrics


@pytest.fixture
def test_producer_notes(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint
) -> ProducerNotes:
    """Create test producer notes."""
    producer_notes = ProducerNotes(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Test Producer Notes",
        structure_string="Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus",
        structure=["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
        hook_count=2,
        instrumentation_hints={"global": ["synth", "drums", "bass"]},
        section_tags={
            "Intro": ["instrumental", "low energy"],
            "Verse": ["storytelling"],
            "Chorus": ["anthemic", "hook-forward"],
            "Bridge": ["minimal"]
        },
        section_durations={
            "Intro": 10,
            "Verse": 30,
            "Chorus": 25,
            "Bridge": 20
        },
        mix_targets={
            "loudness_lufs": -12.0,
            "space": "lush",
            "stereo_width": "wide"
        },
        blueprint_id=test_blueprint.id,
        extra_metadata={}
    )

    test_session.add(producer_notes)
    test_session.commit()
    test_session.refresh(producer_notes)

    return producer_notes


@pytest.fixture
def test_persona(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID
) -> Persona:
    """Create test persona."""
    persona = Persona(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Test Artist",
        vocal_range="medium",
        delivery_style="energetic",
        influences=["Pop icons"],
        extra_metadata={}
    )

    test_session.add(persona)
    test_session.commit()
    test_session.refresh(persona)

    return persona


@pytest.fixture
def test_source(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID
) -> Source:
    """Create test source."""
    source = Source(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Test Source",
        kind="file",
        config={"path": "/test/source.txt"},
        scopes=["lyrics"],
        weight=0.8,
        allow=["*"],
        deny=[],
        provenance=True,
        mcp_server_id=None,
        extra_metadata={}
    )

    test_session.add(source)
    test_session.commit()
    test_session.refresh(source)

    return source


@pytest.fixture
def test_song_with_full_entities(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint,
    test_style: Style,
    test_lyrics: Lyrics,
    test_producer_notes: ProducerNotes,
    test_persona: Persona
) -> Song:
    """Create a song with all entities present."""
    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Complete Test Song",
        status="draft",
        global_seed=42,
        blueprint_id=test_blueprint.id,
        style_id=test_style.id,
        lyrics_id=test_lyrics.id,
        producer_notes_id=test_producer_notes.id,
        persona_id=test_persona.id,
        render_config={
            "prompt_controls": {
                "positive_tags": [],
                "negative_tags": ["muddy"],
                "max_style_chars": 1000,
                "max_prompt_chars": 5000
            },
            "render": {
                "engine": "none",
                "model": None,
                "num_variations": 2
            }
        },
        extra_metadata={}
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song


@pytest.fixture
def test_song_minimal(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint
) -> Song:
    """Create a minimal song with only blueprint (no style/lyrics/producer)."""
    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Minimal Test Song",
        status="draft",
        global_seed=100,
        blueprint_id=test_blueprint.id,
        style_id=None,
        lyrics_id=None,
        producer_notes_id=None,
        persona_id=None,
        render_config={},
        extra_metadata={}
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song


@pytest.fixture
def test_song_with_cached_sds(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint,
    test_style: Style,
    test_lyrics: Lyrics,
    test_producer_notes: ProducerNotes
) -> Song:
    """Create a song with cached compiled SDS in extra_metadata."""
    cached_sds = {
        "title": "Cached SDS Song",
        "blueprint_ref": {
            "genre": "Pop",
            "version": "2025.11"
        },
        "style": {
            "genre_detail": {"primary": "Pop", "subgenres": [], "fusions": []},
            "tempo_bpm": 120,
            "key": {"primary": "C major", "modulations": []},
            "mood": ["upbeat"],
            "instrumentation": ["synth", "drums", "bass"],
            "tags": ["modern"]
        },
        "lyrics": {
            "language": "en",
            "section_order": ["Verse", "Chorus"],
            "constraints": {"explicit": False}
        },
        "producer_notes": {
            "structure": "Verse-Chorus",
            "hooks": 2
        },
        "persona_id": None,
        "sources": [],
        "prompt_controls": {
            "positive_tags": [],
            "negative_tags": [],
            "max_style_chars": 1000,
            "max_prompt_chars": 5000
        },
        "render": {
            "engine": "none",
            "model": None,
            "num_variations": 2
        },
        "seed": 200,
        "_computed_hash": "cached123abc"
    }

    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Cached SDS Song",
        status="draft",
        global_seed=200,
        blueprint_id=test_blueprint.id,
        style_id=test_style.id,
        lyrics_id=test_lyrics.id,
        producer_notes_id=test_producer_notes.id,
        persona_id=None,
        render_config={},
        extra_metadata={"compiled_sds": cached_sds}
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song


@pytest.fixture
def test_song_with_style_only(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint,
    test_style: Style
) -> Song:
    """Create a song with only style (missing lyrics and producer notes)."""
    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Partial Song - Style Only",
        status="draft",
        global_seed=300,
        blueprint_id=test_blueprint.id,
        style_id=test_style.id,
        lyrics_id=None,
        producer_notes_id=None,
        persona_id=None,
        render_config={},
        extra_metadata={}
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song


@pytest.fixture
def test_song_with_invalid_data(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint
) -> Song:
    """Create a song with invalid data that will fail SDS validation."""
    # This is a placeholder - actual implementation would depend on
    # specific validation rules. For now, we'll create a song with
    # no blueprint which should fail.
    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Invalid Song",
        status="draft",
        global_seed=400,
        blueprint_id=None,  # Missing blueprint should cause validation failure
        style_id=None,
        lyrics_id=None,
        producer_notes_id=None,
        persona_id=None,
        render_config={},
        extra_metadata={}
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song


@pytest.fixture
def test_song_with_sources(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint,
    test_style: Style,
    test_lyrics: Lyrics,
    test_producer_notes: ProducerNotes
) -> Song:
    """Create a song with sources attached."""
    # Create multiple sources
    source1 = Source(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Source 1",
        kind="file",
        config={},
        scopes=["lyrics"],
        weight=0.6,
        allow=["*"],
        deny=[],
        provenance=True,
        mcp_server_id=None,
        extra_metadata={}
    )

    source2 = Source(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        name="Source 2",
        kind="web",
        config={},
        scopes=["style"],
        weight=0.4,
        allow=["*"],
        deny=[],
        provenance=True,
        mcp_server_id=None,
        extra_metadata={}
    )

    test_session.add_all([source1, source2])
    test_session.commit()

    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Song With Sources",
        status="draft",
        global_seed=500,
        blueprint_id=test_blueprint.id,
        style_id=test_style.id,
        lyrics_id=test_lyrics.id,
        producer_notes_id=test_producer_notes.id,
        persona_id=None,
        render_config={},
        extra_metadata={
            "source_ids": [str(source1.id), str(source2.id)]
        }
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song


@pytest.fixture
def test_song_with_persona(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint,
    test_style: Style,
    test_lyrics: Lyrics,
    test_producer_notes: ProducerNotes,
    test_persona: Persona
) -> Song:
    """Create a song with persona."""
    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Song With Persona",
        status="draft",
        global_seed=600,
        blueprint_id=test_blueprint.id,
        style_id=test_style.id,
        lyrics_id=test_lyrics.id,
        producer_notes_id=test_producer_notes.id,
        persona_id=test_persona.id,
        render_config={},
        extra_metadata={}
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song


@pytest.fixture
def test_song_without_persona(
    test_session: Session,
    test_tenant_id: uuid.UUID,
    test_owner_id: uuid.UUID,
    test_blueprint: Blueprint,
    test_style: Style,
    test_lyrics: Lyrics,
    test_producer_notes: ProducerNotes
) -> Song:
    """Create a song without persona."""
    song = Song(
        id=uuid.uuid4(),
        tenant_id=test_tenant_id,
        owner_id=test_owner_id,
        title="Song Without Persona",
        status="draft",
        global_seed=700,
        blueprint_id=test_blueprint.id,
        style_id=test_style.id,
        lyrics_id=test_lyrics.id,
        producer_notes_id=test_producer_notes.id,
        persona_id=None,
        render_config={},
        extra_metadata={}
    )

    test_session.add(song)
    test_session.commit()
    test_session.refresh(song)

    return song
