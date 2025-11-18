"""COMPOSE skill: Merge artifacts into render-ready composed prompt.

This skill assembles validated style specifications, lyrics, and production
notes into a single render-ready prompt that adheres to engine-specific
character limits, tag formatting, and policy constraints.

Contract: .claude/skills/workflow/compose/SKILL.md
"""

import json
import re
from pathlib import Path
from random import Random
from typing import Any, Dict, List, Set, Tuple

import structlog

from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


def _load_conflict_matrix() -> List[Dict[str, Any]]:
    """Load tag conflict matrix from file.

    Returns:
        List of conflict entries with 'tag' and 'Tags' (conflicting tags)
    """
    # Path: /home/user/MeatyMusic/services/api/app/skills/compose.py
    # Go up to /home/user/MeatyMusic/
    matrix_path = Path(__file__).parent.parent.parent.parent.parent / "taxonomies" / "conflict_matrix.json"

    if not matrix_path.exists():
        logger.warning("conflict_matrix.json not found, using empty matrix", path=str(matrix_path))
        return []

    try:
        with open(matrix_path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to load conflict matrix", error=str(e))
        return []


def _load_engine_limits(engine: str = "suno") -> Dict[str, int]:
    """Load engine-specific character limits.

    Args:
        engine: Engine name (suno, udio, default)

    Returns:
        Dict with style_max and prompt_max limits
    """
    # Path: /home/user/MeatyMusic/services/api/app/skills/compose.py
    # Go up to /home/user/MeatyMusic/
    limits_path = Path(__file__).parent.parent.parent.parent.parent / "limits" / "engine_limits.json"

    if not limits_path.exists():
        logger.warning("engine_limits.json not found, using defaults", path=str(limits_path))
        return {"style_max": 1000, "prompt_max": 3000}

    try:
        with open(limits_path, "r") as f:
            all_limits = json.load(f)

        return all_limits.get(engine, all_limits.get("default", {"style_max": 1000, "prompt_max": 3000}))
    except Exception as e:
        logger.error("Failed to load engine limits", error=str(e))
        return {"style_max": 1000, "prompt_max": 3000}


# Load conflict matrix and engine limits at module level
CONFLICT_MATRIX = _load_conflict_matrix()
ENGINE_LIMITS = _load_engine_limits()

# Mock living artist list (TODO: Load from comprehensive database)
LIVING_ARTISTS = {
    "drake",
    "taylor swift",
    "ed sheeran",
    "billie eilish",
    "ariana grande",
    "post malone",
    "the weeknd",
}

# Generic influence mapping
ARTIST_TO_GENRE = {
    "drake": "contemporary hip-hop",
    "taylor swift": "contemporary pop",
    "ed sheeran": "contemporary singer-songwriter",
    "billie eilish": "alternative pop",
    "ariana grande": "contemporary R&B pop",
    "post malone": "melodic hip-hop",
    "the weeknd": "contemporary R&B",
}


def _parse_prompt_sections(prompt_text: str) -> Dict[str, str]:
    """Parse prompt into named sections.

    Args:
        prompt_text: Complete prompt text

    Returns:
        Dictionary mapping section names to their text content
    """
    sections = {}
    lines = prompt_text.split("\n")
    current_section = "Header"
    current_text = []

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Check for section headers like "Title:", "Influences:", "Lyrics:", etc.
        # Also handle inline headers like "Title: Song Name"
        is_section_header = False
        section_name = None

        if ":" in stripped and len(stripped) < 100:
            # Check if this looks like a section header
            potential_header = stripped.split(":")[0]
            if potential_header in ["Title", "Genre/Style", "Influences", "Structure", "Vocal",
                                     "Hooks", "Lyrics", "Production Notes", "Arrangement", "Mix"]:
                section_name = potential_header
                is_section_header = True

                # Save previous section
                if current_text:
                    sections[current_section] = "\n".join(current_text)

                # Start new section with the rest of the line (if any)
                rest_of_line = ":".join(stripped.split(":")[1:]).strip()
                current_section = section_name
                current_text = [rest_of_line] if rest_of_line else []
                continue

        # Regular line - add to current section
        current_text.append(line)

    # Save last section
    if current_text:
        sections[current_section] = "\n".join(current_text)

    return sections


def enforce_char_limit(
    prompt_text: str,
    limit: int,
    priority_sections: List[str],
) -> Tuple[str, List[str]]:
    """Enforce character limit with priority-based truncation.

    Args:
        prompt_text: Full prompt text
        limit: Max characters allowed
        priority_sections: Sections in priority order (highest first)
            Example: ["Title", "Style Tags", "Structure", "Chorus", "Verses", "Bridge", "Production"]

    Returns:
        Tuple of (truncated_text, warnings)
    """
    if len(prompt_text) <= limit:
        return prompt_text, []

    warnings = []

    # Edge case: very low limit
    if limit < 500:
        warnings.append(f"WARNING: Character limit {limit} is very low, quality may suffer")

    # Parse prompt into sections
    sections = _parse_prompt_sections(prompt_text)

    # Build priority map (lower index = higher priority)
    priority_map = {section: i for i, section in enumerate(priority_sections)}

    # Sort sections by priority (ascending - keep highest priority)
    sorted_sections = sorted(
        sections.items(),
        key=lambda x: priority_map.get(x[0], 999)  # Unknown sections lowest priority
    )

    # Build truncated text by including sections until limit reached
    truncated_parts = []
    total_length = 0

    for section_name, section_text in sorted_sections:
        section_with_header = f"{section_name}:\n{section_text}" if section_name != "Header" else section_text
        section_length = len(section_with_header) + 2  # +2 for double newline

        if total_length + section_length <= limit:
            truncated_parts.append(section_with_header)
            total_length += section_length
        else:
            warnings.append(f"Removed {section_name} to fit {limit} char limit")

    return "\n\n".join(truncated_parts), warnings


def format_style_tags(
    style: Dict[str, Any],
    conflict_matrix: List[Dict[str, Any]],
    seed: int,
) -> List[str]:
    """Format style tags with category enforcement and conflict resolution.

    Args:
        style: Style object with tags
        conflict_matrix: Loaded conflict matrix from file
        seed: Seed for deterministic tag selection

    Returns:
        Alphabetically sorted list of non-conflicting tags (one per category)
    """
    rng = Random(seed)

    # Define tag categories
    CATEGORIES = {
        "era": ["vintage", "retro", "modern", "futuristic", "nostalgic"],
        "genre": ["pop", "rock", "electronic", "hiphop", "country", "rnb", "indie", "alternative"],
        "energy": ["energetic", "chill", "anthemic", "minimal", "high-energy", "low-energy", "uptempo", "downtempo"],
        "instrumentation": ["acoustic", "electronic", "full band", "stripped", "synth-heavy", "organic", "industrial"],
        "rhythm": ["driving", "syncopated", "laid-back", "fast", "slow"],
        "vocal": ["whisper", "powerful", "harmonized", "intimate", "aggressive", "stadium"],
        "production": ["dry", "lush", "lo-fi", "hi-fi", "polished", "raw", "gritty", "pristine"],
        "arrangement": ["minimal", "maximal", "sparse", "dense", "wall-of-sound"],
        "tonality": ["major", "minor", "dark", "uplifting"],
    }

    # Collect all tags from style
    all_tags = []

    # Add genre tags
    if "genre_detail" in style:
        genre_detail = style["genre_detail"]
        if "primary" in genre_detail:
            all_tags.append(genre_detail["primary"])
        if "subgenres" in genre_detail:
            all_tags.extend(genre_detail["subgenres"])
        if "fusions" in genre_detail:
            all_tags.extend(genre_detail["fusions"])

    # Add other fields
    for field in ["tags", "mood", "instrumentation", "vocal_profile", "energy"]:
        if field in style and style[field]:
            if isinstance(style[field], list):
                all_tags.extend(style[field])
            else:
                all_tags.append(style[field])

    # Bucket tags by category
    categorized = {cat: [] for cat in CATEGORIES}
    uncategorized = []

    for tag in all_tags:
        tag_lower = tag.lower()
        found_category = False

        for cat, cat_tags in CATEGORIES.items():
            if any(cat_tag in tag_lower for cat_tag in cat_tags):
                categorized[cat].append(tag)
                found_category = True
                break

        if not found_category:
            uncategorized.append(tag)

    # Select one tag per category (seed-based if multiple)
    selected_tags = []
    for cat, tags in categorized.items():
        if tags:
            selected = rng.choice(tags) if len(tags) > 1 else tags[0]
            selected_tags.append(selected)

    # Add uncategorized tags (up to 5)
    if uncategorized:
        rng.shuffle(uncategorized)
        selected_tags.extend(uncategorized[:5])

    # Resolve conflicts using matrix
    resolved, _ = _resolve_tag_conflicts(selected_tags, conflict_matrix, rng)

    # Return alphabetically sorted
    return sorted(resolved, key=str.lower)


def _normalize_living_artists(text: str, policy_strict: bool = True) -> Tuple[str, List[str]]:
    """Normalize living artist references to generic influences.

    Args:
        text: Input text potentially containing artist names
        policy_strict: Whether to enforce strict policy (public release)

    Returns:
        Tuple of (normalized_text, list_of_replacements)
    """
    if not policy_strict:
        return text, []

    normalized = text
    replacements = []

    for artist in LIVING_ARTISTS:
        # Check for "style of <artist>" or similar patterns
        patterns = [
            f"style of {artist}",
            f"like {artist}",
            f"{artist}-style",
            f"{artist} style",
        ]

        for pattern in patterns:
            if pattern in normalized.lower():
                # Replace with generic genre
                generic = ARTIST_TO_GENRE.get(artist, "contemporary artist")
                normalized = re.sub(
                    re.escape(pattern),
                    generic,
                    normalized,
                    flags=re.IGNORECASE,
                )
                replacements.append(f"{artist} → {generic}")

    return normalized, replacements


def _resolve_tag_conflicts(
    all_tags: List[str],
    conflict_matrix: List[Dict[str, Any]],
    rng: Random,
) -> Tuple[List[str], List[Tuple[str, str]]]:
    """Resolve tag conflicts using loaded conflict matrix.

    Args:
        all_tags: List of all tags from style and sections
        conflict_matrix: Loaded conflict matrix from file
        rng: Random instance for deterministic conflict resolution

    Returns:
        Tuple of (resolved_tags, list_of_conflicts)
    """
    resolved_tags = all_tags.copy()
    detected_conflicts = []

    for conflict_entry in conflict_matrix:
        primary_tag = conflict_entry.get("tag", "").lower()
        conflicting_tags = [t.lower() for t in conflict_entry.get("Tags", [])]

        # Rebuild lowercase map each iteration to reflect removals
        tag_lower_map = {tag.lower(): tag for tag in resolved_tags}

        # Check if primary tag exists (in current resolved list)
        if primary_tag not in tag_lower_map:
            continue

        # Check if any conflicting tags exist (in current resolved list)
        found_conflicts = [t for t in conflicting_tags if t in tag_lower_map]

        if found_conflicts:
            # Deterministically choose which tag to keep (seed-based)
            all_conflicting = [primary_tag] + found_conflicts
            # Make a copy for shuffling to avoid modifying original
            shuffle_list = all_conflicting.copy()
            rng.shuffle(shuffle_list)  # Shuffle with seed
            keep_tag = shuffle_list[0]

            # Remove all others
            for tag_lower in all_conflicting:
                if tag_lower != keep_tag:
                    original_tag = tag_lower_map.get(tag_lower)
                    if original_tag and original_tag in resolved_tags:
                        resolved_tags.remove(original_tag)
                        detected_conflicts.append((tag_lower_map[keep_tag], original_tag))
                        logger.warning(
                            "compose.tag_conflict",
                            kept=tag_lower_map[keep_tag],
                            dropped=original_tag,
                        )

    return resolved_tags, detected_conflicts


def _format_section_with_tags(
    section: str, lyrics: str, section_tags: List[str]
) -> str:
    """Format section with tags in the proper format.

    Args:
        section: Section name
        lyrics: Section lyrics
        section_tags: Tags for this section

    Returns:
        Formatted section string
    """
    if section_tags:
        tags_str = ", ".join(section_tags)
        header = f"[{section}: {tags_str}]"
    else:
        header = f"[{section}]"

    return f"{header}\n{lyrics}"


def _enforce_character_limits(
    prompt_text: str,
    style_section: str,
    style_max: int,
    prompt_max: int,
) -> Tuple[str, List[str]]:
    """Enforce character limits by trimming if necessary.

    Args:
        prompt_text: Complete prompt text
        style_section: Style/tags section text
        style_max: Maximum characters for style section
        prompt_max: Maximum characters for total prompt

    Returns:
        Tuple of (trimmed_prompt, list_of_issues)
    """
    issues = []

    # Check style section length
    if len(style_section) > style_max:
        exceeded = len(style_section) - style_max
        issues.append(f"Style section exceeded {style_max} chars by {exceeded}")
        logger.warning(
            "compose.style_limit_exceeded",
            actual=len(style_section),
            limit=style_max,
            exceeded=exceeded,
        )

    # Check total prompt length
    if len(prompt_text) > prompt_max:
        exceeded = len(prompt_text) - prompt_max
        issues.append(f"Total prompt exceeded {prompt_max} chars by {exceeded}")
        logger.warning(
            "compose.prompt_limit_exceeded",
            actual=len(prompt_text),
            limit=prompt_max,
            exceeded=exceeded,
        )

        # Truncate with ellipsis
        prompt_text = prompt_text[: prompt_max - 3] + "..."

    return prompt_text, issues


@workflow_skill(
    name="amcs.compose.generate",
    deterministic=True,
)
async def compose_prompt(
    inputs: Dict[str, Any], context: WorkflowContext
) -> Dict[str, Any]:
    """Compose final render-ready prompt from style, lyrics, and producer notes.

    Merges all artifacts, enforces character limits, resolves tag conflicts,
    normalizes living artist influences, and formats with section tags.

    Args:
        inputs: Dictionary containing:
            - style: Validated style specification
            - lyrics: Complete lyrics with section markers
            - producer_notes: Production arrangement and mix guidance
            - sds: Original SDS for limits and title
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - composed_prompt: Complete render-ready prompt
            - issues: List of warnings or constraint violations
    """
    style = inputs["style"]
    lyrics = inputs["lyrics"]
    producer_notes = inputs["producer_notes"]
    sds = inputs.get("sds", {})

    # Initialize Random with seed for determinism
    rng = Random(context.seed)

    logger.info(
        "compose.generate.start",
        run_id=str(context.run_id),
        seed=context.seed,
    )

    # Extract limits (use from SDS or fallback to engine defaults)
    prompt_controls = sds.get("prompt_controls", {})
    style_max = prompt_controls.get("max_style_chars", ENGINE_LIMITS.get("style_max", 1000))
    prompt_max = prompt_controls.get("max_prompt_chars", ENGINE_LIMITS.get("prompt_max", 3000))
    policy_strict = True  # TODO: Get from feature flags

    issues = []

    # Step 1: Build meta header
    title = sds.get("title", "Untitled")
    genre = style["genre_detail"]["primary"]
    tempo = style["tempo_bpm"]
    mood_list = style.get("mood", [])[:2]  # First 2 moods

    meta_header = f"""Title: {title}
Genre/Style: {genre} | BPM: {tempo} | Mood: {', '.join(mood_list)}"""

    # Step 2: Format style tags using new function with category enforcement and conflict resolution
    # First, collect all original tags to compare
    all_original_tags = []
    if "genre_detail" in style:
        genre_detail = style["genre_detail"]
        if "primary" in genre_detail:
            all_original_tags.append(genre_detail["primary"])
        if "subgenres" in genre_detail:
            all_original_tags.extend(genre_detail["subgenres"])
        if "fusions" in genre_detail:
            all_original_tags.extend(genre_detail["fusions"])

    for field in ["tags", "mood", "instrumentation", "vocal_profile", "energy"]:
        if field in style and style[field]:
            if isinstance(style[field], list):
                all_original_tags.extend(style[field])
            else:
                all_original_tags.append(style[field])

    # Format tags with conflict resolution
    style_tags = format_style_tags(style, CONFLICT_MATRIX, context.seed)

    # Report tag reductions (conflicts or category enforcement)
    tags_removed = len(all_original_tags) - len(style_tags)
    if tags_removed > 0:
        issues.append(f"Reduced {tags_removed} tags due to conflicts or category enforcement")

    # Format influences section
    influences_text = f"Influences: {', '.join(style_tags)}"

    # Normalize living artists
    influences_text, artist_replacements = _normalize_living_artists(
        influences_text, policy_strict
    )

    for replacement in artist_replacements:
        issues.append(f"Normalized artist reference: {replacement}")

    # Step 3: Format structure and vocal
    structure_text = f"""Structure: {producer_notes['structure']}
Vocal: {style.get('vocal_profile', 'default')}
Hooks: {producer_notes['hooks']}"""

    # Step 4: Embed lyrics with section tags
    section_meta = producer_notes.get("section_meta", {})

    # Parse lyrics into sections
    lyrics_sections = lyrics.split("\n\n")
    formatted_lyrics_parts = []

    for section_text in lyrics_sections:
        # Extract section name from marker
        match = re.match(r"\[([^\]]+)\]", section_text)
        if match:
            section_name = match.group(1)
            section_lyrics = section_text[len(match.group(0)) :].strip()

            # Get section tags
            section_tags = section_meta.get(section_name, {}).get("tags", [])

            # Format with tags
            formatted_section = _format_section_with_tags(
                section_name, section_lyrics, section_tags
            )
            formatted_lyrics_parts.append(formatted_section)
        else:
            formatted_lyrics_parts.append(section_text)

    lyrics_block = f"Lyrics:\n" + "\n\n".join(formatted_lyrics_parts)

    # Step 5: Add production notes
    mix_params = producer_notes.get("mix", {})
    instrumentation_list = ", ".join(producer_notes.get("instrumentation", []))

    production_notes = f"""Production Notes:
- Arrangement: {instrumentation_list}
- Mix: {mix_params.get('space', 'normal')}, {mix_params.get('stereo_width', 'normal')} stereo
- Clean = TRUE; Language = en"""

    # Step 6: Assemble complete prompt
    complete_prompt = f"""{meta_header}

{influences_text}

{structure_text}

{lyrics_block}

{production_notes}"""

    # Step 7: Enforce character limits with priority-based truncation
    priority_sections = [
        "Header",  # Title, genre, tempo
        "Influences",  # Style tags
        "Structure",  # Song structure
        "Chorus",  # Hook sections
        "Verse",  # Verses
        "Bridge",  # Bridge
        "Production Notes",  # Production guidance
    ]

    complete_prompt, limit_warnings = enforce_char_limit(
        complete_prompt, prompt_max, priority_sections
    )
    issues.extend(limit_warnings)

    # Also check style section separately
    if len(influences_text) > style_max:
        exceeded = len(influences_text) - style_max
        issues.append(f"Style section exceeded {style_max} chars by {exceeded}")
        logger.warning(
            "compose.style_limit_exceeded",
            actual=len(influences_text),
            limit=style_max,
            exceeded=exceeded,
        )

    # Step 8: Build composed prompt object
    composed_prompt = {
        "text": complete_prompt,
        "meta": {
            "title": title,
            "genre": genre,
            "tempo_bpm": tempo,
            "structure": producer_notes["structure"],
            "style_tags": style_tags,
            "negative_tags": style.get("negative_tags", []),
            "section_tags": {
                k: v.get("tags", [])
                for k, v in section_meta.items()
            },
            "model_limits": {
                "style_max": style_max,
                "prompt_max": prompt_max,
            },
        },
    }

    # Compute hash
    prompt_hash = compute_hash(complete_prompt)

    logger.info(
        "compose.generate.complete",
        run_id=str(context.run_id),
        total_chars=len(complete_prompt),
        style_chars=len(influences_text),
        issues_count=len(issues),
        hash=prompt_hash[:16],
    )

    return {
        "composed_prompt": composed_prompt,
        "issues": issues,
        "_hash": prompt_hash,
        "_char_counts": {
            "style": len(influences_text),
            "total": len(complete_prompt),
        },
    }
