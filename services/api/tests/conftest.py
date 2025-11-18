"""Test configuration for unit tests.

Sets up minimal environment variables required for unit test imports.
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import BaseModel as Base

# Set minimal test environment variables required for Settings validation
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("DATABASE_URL_TEST", "sqlite:///:memory:")
os.environ.setdefault("CLERK_WEBHOOK_SECRET", "whsec_test_secret")
os.environ.setdefault("CLERK_JWKS_URL", "https://test.clerk.accounts.dev/.well-known/jwks.json")
os.environ.setdefault("CLERK_JWT_ISSUER", "https://test.clerk.accounts.dev")
os.environ.setdefault("ENVIRONMENT", "test")


@pytest.fixture(scope="function")
def test_session():
    """Create a new database session for a test.

    Uses an in-memory SQLite database that is created fresh for each test.
    """
    # Create in-memory SQLite engine
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session factory
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create session
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Drop all tables
        Base.metadata.drop_all(bind=engine)


# =============================================================================
# AMCS Workflow Skill Test Fixtures
# =============================================================================

import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def sample_sds():
    """
    Load all sample Song Design Specs (SDSs).

    Returns a list of 10 diverse SDSs covering multiple genres:
    - pop, rock, hip-hop, country, R&B
    - electronic, indie-alternative, Christmas, CCM, K-pop

    Each SDS includes:
    - Basic metadata (id, title, genre, targetLength)
    - Style specification (bpm, key, mood, instrumentation, tags)
    - Constraints (explicit, sectionOrder, targetDuration)
    - Persona (vocalRange, vocalStyle, influences)
    - Seed for deterministic testing

    Returns:
        List[Dict[str, Any]]: List of SDS dictionaries

    Example:
        ```python
        def test_with_all_sdss(sample_sds):
            for sds in sample_sds:
                result = plan_skill.execute(PlanInput(sds=sds, ...))
                assert result.status == "success"
        ```
    """
    with open(FIXTURES_DIR / "sample_sds.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def sample_sds_pop(sample_sds):
    """
    Get pop genre SDS from sample SDSs.

    Returns:
        Dict[str, Any]: Pop SDS (id: sds-pop-001)
    """
    return next(s for s in sample_sds if s["genre"] == "pop")


@pytest.fixture(scope="session")
def sample_sds_rock(sample_sds):
    """
    Get rock genre SDS from sample SDSs.

    Returns:
        Dict[str, Any]: Rock SDS (id: sds-rock-001)
    """
    return next(s for s in sample_sds if s["genre"] == "rock")


@pytest.fixture(scope="session")
def sample_sds_hiphop(sample_sds):
    """
    Get hip-hop genre SDS from sample SDSs.

    Returns:
        Dict[str, Any]: Hip-hop SDS (id: sds-hiphop-001)
    """
    return next(s for s in sample_sds if s["genre"] == "hip-hop")


@pytest.fixture(scope="session")
def sample_sds_country(sample_sds):
    """
    Get country genre SDS from sample SDSs.

    Returns:
        Dict[str, Any]: Country SDS (id: sds-country-001)
    """
    return next(s for s in sample_sds if s["genre"] == "country")


@pytest.fixture(scope="session")
def sample_sds_rnb(sample_sds):
    """
    Get R&B genre SDS from sample SDSs.

    Returns:
        Dict[str, Any]: R&B SDS (id: sds-rnb-001)
    """
    return next(s for s in sample_sds if s["genre"] == "rnb")


@pytest.fixture(scope="session")
def pop_blueprint():
    """
    Load pop genre blueprint with rules and evaluation rubric.

    Blueprint includes:
    - Tempo/BPM ranges
    - Key preferences
    - Section structure requirements
    - Rhyme schemes
    - Style tags and conflict matrix
    - Production patterns
    - Evaluation rubric with weights and thresholds

    Returns:
        Dict[str, Any]: Pop blueprint dictionary
    """
    with open(FIXTURES_DIR / "sample_blueprints" / "pop_blueprint.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def rock_blueprint():
    """
    Load rock genre blueprint with rules and evaluation rubric.

    Returns:
        Dict[str, Any]: Rock blueprint dictionary
    """
    with open(FIXTURES_DIR / "sample_blueprints" / "rock_blueprint.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def hiphop_blueprint():
    """
    Load hip-hop genre blueprint with rules and evaluation rubric.

    Returns:
        Dict[str, Any]: Hip-hop blueprint dictionary
    """
    with open(FIXTURES_DIR / "sample_blueprints" / "hiphop_blueprint.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def country_blueprint():
    """
    Load country genre blueprint with rules and evaluation rubric.

    Returns:
        Dict[str, Any]: Country blueprint dictionary
    """
    with open(FIXTURES_DIR / "sample_blueprints" / "country_blueprint.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def rnb_blueprint():
    """
    Load R&B genre blueprint with rules and evaluation rubric.

    Returns:
        Dict[str, Any]: R&B blueprint dictionary
    """
    with open(FIXTURES_DIR / "sample_blueprints" / "rnb_blueprint.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def sample_sources():
    """
    Load all sample source collections with pre-computed chunk hashes.

    Sources include:
    - source-love-themes-001: Love song themes and imagery
    - source-urban-imagery-002: Urban and street imagery
    - source-nature-metaphors-003: Nature metaphors and imagery

    Each source contains:
    - id: Source identifier
    - title: Human-readable title
    - type: Source type (e.g., "curated")
    - description: Source description
    - chunks: List of text chunks with:
        - text: Original chunk text
        - hash: Pre-computed SHA-256 hash (for deterministic retrieval)
        - metadata: Theme, imagery, emotion tags

    Returns:
        List[Dict[str, Any]]: List of source dictionaries

    Example:
        ```python
        def test_lyrics_with_sources(sample_sources):
            result = lyrics_skill.execute(
                LyricsInput(sources=sample_sources, ...)
            )
            # Verify citations reference sample source chunks
            source_ids = {s["id"] for s in sample_sources}
            assert all(c["source_id"] in source_ids for c in result.citations)
        ```
    """
    sources = []
    sources_dir = FIXTURES_DIR / "sample_sources"
    for source_file in sorted(sources_dir.glob("*.json")):
        with open(source_file) as f:
            sources.append(json.load(f))
    return sources


@pytest.fixture(scope="session")
def love_themes_source(sample_sources):
    """
    Get love themes source from sample sources.

    Returns:
        Dict[str, Any]: Love themes source (id: source-love-themes-001)
    """
    return next(s for s in sample_sources if s["id"] == "source-love-themes-001")


@pytest.fixture(scope="session")
def urban_imagery_source(sample_sources):
    """
    Get urban imagery source from sample sources.

    Returns:
        Dict[str, Any]: Urban imagery source (id: source-urban-imagery-002)
    """
    return next(s for s in sample_sources if s["id"] == "source-urban-imagery-002")


@pytest.fixture(scope="session")
def nature_metaphors_source(sample_sources):
    """
    Get nature metaphors source from sample sources.

    Returns:
        Dict[str, Any]: Nature metaphors source (id: source-nature-metaphors-003)
    """
    return next(s for s in sample_sources if s["id"] == "source-nature-metaphors-003")
