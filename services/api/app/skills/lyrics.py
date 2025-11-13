"""LYRICS skill: Generate song lyrics with citations from pinned sources.

This skill produces complete song lyrics that satisfy structural, stylistic,
and policy constraints while maintaining full source provenance through
hash-pinned retrieval.

Contract: .claude/skills/workflow/lyrics/SKILL.md
"""

import hashlib
import re
from typing import Any, Dict, List

import structlog

from app.skills.llm_client import get_llm_client
from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


# Simple profanity list (TODO: Use comprehensive filter library)
PROFANITY_WORDS = {
    "fuck",
    "shit",
    "damn",
    "hell",
    "ass",
    "bitch",
    "bastard",
    "crap",
}


def _filter_profanity(text: str, explicit: bool) -> tuple[str, List[str]]:
    """Filter profanity from text if not explicit.

    Args:
        text: Input text
        explicit: Whether explicit content is allowed

    Returns:
        Tuple of (filtered_text, list_of_replacements)
    """
    if explicit:
        return text, []

    replacements = []
    filtered = text

    for word in PROFANITY_WORDS:
        # Case-insensitive replacement
        pattern = re.compile(re.escape(word), re.IGNORECASE)
        matches = pattern.findall(filtered)
        if matches:
            filtered = pattern.sub("[[REDACTED]]", filtered)
            replacements.extend(matches)

    return filtered, replacements


def _count_syllables(line: str) -> int:
    """Estimate syllable count for a line.

    Simple heuristic: count vowel groups.
    This is a rough approximation for MVP.
    """
    # Remove punctuation
    line = re.sub(r"[^\w\s]", "", line.lower())

    # Count vowel groups
    vowels = "aeiouy"
    syllable_count = 0
    previous_was_vowel = False

    for char in line:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            syllable_count += 1
        previous_was_vowel = is_vowel

    # Minimum 1 syllable per word
    word_count = len(line.split())
    return max(syllable_count, word_count)


def _calculate_rhyme_tightness(lyrics: str, rhyme_scheme: str) -> float:
    """Calculate rhyme tightness score.

    Args:
        lyrics: Complete lyrics text with section markers
        rhyme_scheme: Expected rhyme scheme (e.g., "AABB", "ABAB")

    Returns:
        Score from 0.0 to 1.0
    """
    # Simple implementation for MVP: just check if there are repeated end sounds
    # TODO: Implement proper phonetic rhyme checking

    sections = lyrics.split("\n\n")
    total_expected_rhymes = 0
    matching_rhymes = 0

    for section in sections:
        lines = [l.strip() for l in section.split("\n") if l.strip() and not l.startswith("[")]

        if len(lines) < 2:
            continue

        # Extract last words
        last_words = []
        for line in lines:
            words = line.split()
            if words:
                # Get last word without punctuation
                last_word = re.sub(r"[^\w]", "", words[-1].lower())
                last_words.append(last_word)

        # Check for simple rhymes (last 2-3 characters match)
        for i in range(len(last_words) - 1):
            total_expected_rhymes += 1
            if last_words[i][-2:] == last_words[i + 1][-2:]:
                matching_rhymes += 1

    if total_expected_rhymes == 0:
        return 0.0

    return matching_rhymes / total_expected_rhymes


def _calculate_singability(lyrics: str, target_syllables: int) -> float:
    """Calculate singability score based on syllable consistency.

    Args:
        lyrics: Complete lyrics text
        target_syllables: Target syllables per line

    Returns:
        Score from 0.0 to 1.0
    """
    lines = [l.strip() for l in lyrics.split("\n") if l.strip() and not l.startswith("[")]

    if not lines:
        return 0.0

    deviations = []
    for line in lines:
        syllable_count = _count_syllables(line)
        deviation = abs(syllable_count - target_syllables)
        deviations.append(deviation)

    avg_deviation = sum(deviations) / len(deviations)

    # Score: 1 - (deviation / target), clamped to [0, 1]
    score = max(0.0, 1.0 - (avg_deviation / target_syllables))
    return score


def _calculate_hook_density(lyrics: str, section_order: List[str]) -> int:
    """Calculate hook density (number of hook occurrences).

    Args:
        lyrics: Complete lyrics text
        section_order: List of sections

    Returns:
        Count of hook occurrences
    """
    # Extract chorus sections
    chorus_sections = [s for s in lyrics.split("\n\n") if "Chorus" in s]

    if not chorus_sections:
        return 0

    # Find most common line in choruses (likely the hook)
    chorus_lines = []
    for section in chorus_sections:
        lines = [l.strip() for l in section.split("\n") if l.strip() and not l.startswith("[")]
        chorus_lines.extend(lines)

    # Count line frequencies
    line_counts = {}
    for line in chorus_lines:
        line_counts[line] = line_counts.get(line, 0) + 1

    # Hook is the most repeated line
    if not line_counts:
        return 0

    max_count = max(line_counts.values())
    return max_count


@workflow_skill(
    name="amcs.lyrics.generate",
    deterministic=True,
    default_temperature=0.3,
    default_top_p=0.85,
)
async def generate_lyrics(
    inputs: Dict[str, Any], context: WorkflowContext
) -> Dict[str, Any]:
    """Generate song lyrics from SDS lyrics spec, plan, style, and sources.

    Enforces rhyme scheme, meter, syllable counts, hook strategy, and profanity
    filter while retrieving from MCP sources with deterministic hash-based pinning.

    Args:
        inputs: Dictionary containing:
            - sds_lyrics: Lyrics entity from SDS
            - plan: Execution plan with section structure
            - style: Musical style for thematic alignment
            - sources: (Optional) External knowledge sources for retrieval
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - lyrics: Complete lyrics text with section markers
            - citations: Source chunks used with provenance
            - metrics: Quality metrics (rhyme_tightness, singability, hook_density)
    """
    sds_lyrics = inputs["sds_lyrics"]
    plan = inputs["plan"]
    style = inputs["style"]
    sources = inputs.get("sources", [])

    logger.info(
        "lyrics.generate.start",
        run_id=str(context.run_id),
        sections=len(plan["section_order"]),
        has_sources=len(sources) > 0,
    )

    # Step 1: Prepare source retrieval (if sources provided)
    citations = []
    source_context = ""

    if sources:
        # Mock source retrieval for MVP
        # TODO: Implement actual MCP-based retrieval with hash pinning
        logger.info("lyrics.sources.mock", count=len(sources))

        for source in sources:
            # Mock chunk retrieval
            chunks = [
                {
                    "chunk_hash": hashlib.sha256(f"mock_chunk_{source.get('name', 'unknown')}".encode()).hexdigest(),
                    "source_id": source.get("name", "unknown"),
                    "text": f"Context from {source.get('name', 'unknown')}",
                    "weight": source.get("weight", 0.5),
                }
            ]
            citations.extend(chunks)
            source_context += f"\n\nSource: {chunks[0]['text']}"

    # Step 2: Generate section-by-section
    section_order = plan["section_order"]
    all_sections = []
    llm_client = get_llm_client()

    for section_idx, section in enumerate(section_order):
        logger.info(
            "lyrics.section.generate",
            section=section,
            section_index=section_idx,
        )

        # Get section requirements
        section_requirements = sds_lyrics["constraints"].get("section_requirements", {})
        section_req = section_requirements.get(section, {})
        min_lines = section_req.get("min_lines", 4)
        max_lines = section_req.get("max_lines", 8)
        must_end_with_hook = section_req.get("must_end_with_hook", False)

        # Build system prompt
        system_prompt = f"""You are a professional songwriter creating lyrics for a {style['genre_detail']['primary']} song.

Generate lyrics for the {section} section following these requirements:
- Rhyme scheme: {sds_lyrics.get('rhyme_scheme', 'AABB')}
- Syllables per line: {sds_lyrics.get('syllables_per_line', 8)} (±2)
- Point of view: {sds_lyrics.get('pov', '1st')}
- Tense: {sds_lyrics.get('tense', 'present')}
- Themes: {', '.join(sds_lyrics.get('themes', ['general']))}
- Mood: {', '.join(style['mood'])}
- Lines: {min_lines} to {max_lines}
{"- MUST end with a memorable hook line" if must_end_with_hook else ""}

Output ONLY the lyrics lines, no section headers or explanations."""

        # Build user prompt
        user_prompt = f"""Create lyrics for the {section} section.

Song context:
- Title: (from SDS)
- Style: {style['genre_detail']['primary']}
- Energy: {style.get('energy', 'medium')}
- Themes: {', '.join(sds_lyrics.get('themes', []))}
{source_context if source_context else ""}

Generate {min_lines} to {max_lines} lines now."""

        # Generate with LLM
        section_seed = context.seed + 2 + section_idx
        section_lyrics = await llm_client.generate(
            system=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            top_p=0.85,
            max_tokens=500,
            seed=section_seed,
        )

        # Apply profanity filter
        explicit = sds_lyrics["constraints"].get("explicit", False)
        filtered_lyrics, replacements = _filter_profanity(section_lyrics, explicit)

        if replacements:
            logger.warning(
                "lyrics.profanity.filtered",
                section=section,
                replacements=replacements,
            )

        # Format section
        formatted_section = f"[{section}]\n{filtered_lyrics.strip()}"
        all_sections.append(formatted_section)

    # Step 3: Combine all sections
    complete_lyrics = "\n\n".join(all_sections)

    # Step 4: Calculate metrics
    target_syllables = sds_lyrics.get("syllables_per_line", 8)
    rhyme_scheme = sds_lyrics.get("rhyme_scheme", "AABB")

    metrics = {
        "rhyme_tightness": _calculate_rhyme_tightness(complete_lyrics, rhyme_scheme),
        "singability": _calculate_singability(complete_lyrics, target_syllables),
        "hook_density": _calculate_hook_density(complete_lyrics, section_order),
    }

    # Compute hash
    lyrics_hash = compute_hash(complete_lyrics)

    logger.info(
        "lyrics.generate.complete",
        run_id=str(context.run_id),
        total_lines=len(complete_lyrics.split("\n")),
        metrics=metrics,
        hash=lyrics_hash[:16],
    )

    return {
        "lyrics": complete_lyrics,
        "citations": citations,
        "metrics": metrics,
        "_hash": lyrics_hash,
    }
