"""VALIDATE skill: Score artifacts against blueprint rubric.

This skill evaluates composed artifacts (lyrics, style, producer notes) against
the blueprint's scoring rubric to determine if the composition meets quality
thresholds before rendering.

Contract: .claude/skills/workflow/validate/SKILL.md
"""

import re
from collections import Counter
from typing import Any, Dict, List, Set, Tuple

import structlog

from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


def _count_syllables(word: str) -> int:
    """Count syllables in a word using simple vowel-based heuristic.

    Args:
        word: Input word

    Returns:
        Estimated syllable count
    """
    word = word.lower().strip()
    vowels = "aeiouy"
    syllable_count = 0
    previous_was_vowel = False

    for char in word:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            syllable_count += 1
        previous_was_vowel = is_vowel

    # Adjust for silent 'e'
    if word.endswith("e") and syllable_count > 1:
        syllable_count -= 1

    # Minimum of 1 syllable per word
    return max(1, syllable_count)


def _extract_sections(lyrics: str) -> Dict[str, List[str]]:
    """Extract sections from lyrics with section markers.

    Args:
        lyrics: Complete lyrics with section markers like [Verse], [Chorus]

    Returns:
        Dictionary mapping section names to lists of lines
    """
    sections = {}
    current_section = None
    current_lines = []

    for line in lyrics.split("\n"):
        # Check for section marker
        match = re.match(r"\[([^\]:]+)", line)
        if match:
            # Save previous section
            if current_section and current_lines:
                sections[current_section] = current_lines

            # Start new section
            current_section = match.group(1).strip()
            current_lines = []
        elif line.strip() and current_section:
            # Add line to current section
            current_lines.append(line.strip())

    # Save last section
    if current_section and current_lines:
        sections[current_section] = current_lines

    return sections


def _identify_hooks(chorus_lines: List[str], min_words: int = 3) -> Set[str]:
    """Identify hook phrases from chorus lines.

    Args:
        chorus_lines: List of chorus lines
        min_words: Minimum words for a phrase to be considered a hook

    Returns:
        Set of hook phrases
    """
    hooks = set()

    for line in chorus_lines:
        # Extract phrases of min_words or more
        words = line.lower().split()
        if len(words) >= min_words:
            # Consider full line as potential hook
            hooks.add(line.lower().strip())

            # Also consider phrases within line
            for i in range(len(words) - min_words + 1):
                phrase = " ".join(words[i : i + min_words])
                hooks.add(phrase)

    return hooks


def _evaluate_hook_density(lyrics: str, sections: Dict[str, List[str]]) -> float:
    """Evaluate hook density score.

    Measures percentage of lines containing hook phrases from chorus.
    Target: ≥ 0.7

    Args:
        lyrics: Complete lyrics text
        sections: Parsed sections dictionary

    Returns:
        Hook density score (0-1)
    """
    # Find chorus sections
    chorus_lines = []
    for section_name, lines in sections.items():
        if "chorus" in section_name.lower():
            chorus_lines.extend(lines)

    if not chorus_lines:
        logger.warning("validate.hook_density.no_chorus")
        return 0.0

    # Identify hook phrases
    hooks = _identify_hooks(chorus_lines)

    if not hooks:
        return 0.0

    # Count total lines and lines containing hooks
    total_lines = sum(len(lines) for lines in sections.values())
    hook_lines = 0

    for section_lines in sections.values():
        for line in section_lines:
            line_lower = line.lower()
            if any(hook in line_lower for hook in hooks):
                hook_lines += 1

    if total_lines == 0:
        return 0.0

    score = hook_lines / total_lines

    logger.info(
        "validate.hook_density",
        score=score,
        hooks_count=len(hooks),
        hook_lines=hook_lines,
        total_lines=total_lines,
    )

    return score


def _evaluate_singability(sections: Dict[str, List[str]]) -> float:
    """Evaluate singability score.

    Measures consistency of syllable counts across lines within sections.
    Target: ≥ 0.8

    Args:
        sections: Parsed sections dictionary

    Returns:
        Singability score (0-1)
    """
    section_scores = []

    for section_name, lines in sections.items():
        if len(lines) < 2:
            continue

        # Count syllables per line
        syllable_counts = []
        for line in lines:
            words = re.findall(r"\b\w+\b", line)
            syllables = sum(_count_syllables(word) for word in words)
            syllable_counts.append(syllables)

        if not syllable_counts:
            continue

        # Compute consistency (inverse of coefficient of variation)
        mean_syllables = sum(syllable_counts) / len(syllable_counts)
        if mean_syllables == 0:
            continue

        variance = sum((x - mean_syllables) ** 2 for x in syllable_counts) / len(
            syllable_counts
        )
        stddev = variance**0.5

        # Score based on consistency
        # Lower stddev = higher consistency = higher score
        consistency = 1.0 - min(1.0, stddev / mean_syllables)
        section_scores.append(consistency)

        logger.debug(
            "validate.singability.section",
            section=section_name,
            mean_syllables=mean_syllables,
            stddev=stddev,
            consistency=consistency,
        )

    if not section_scores:
        return 0.0

    score = sum(section_scores) / len(section_scores)

    logger.info("validate.singability", score=score, sections_evaluated=len(section_scores))

    return score


def _get_rhyme_suffix(word: str, suffix_len: int = 2) -> str:
    """Extract rhyme suffix from word.

    Args:
        word: Input word
        suffix_len: Length of suffix to extract

    Returns:
        Lowercase suffix for rhyme matching
    """
    word = re.sub(r"[^\w]", "", word).lower()
    return word[-suffix_len:] if len(word) >= suffix_len else word


def _evaluate_rhyme_tightness(
    sections: Dict[str, List[str]], rhyme_scheme: str = "ABAB"
) -> float:
    """Evaluate rhyme tightness score.

    Measures adherence to intended rhyme scheme.
    Target: ≥ 0.75

    Args:
        sections: Parsed sections dictionary
        rhyme_scheme: Expected rhyme scheme (e.g., "ABAB", "AABB")

    Returns:
        Rhyme tightness score (0-1)
    """
    # Parse rhyme scheme
    if not rhyme_scheme:
        rhyme_scheme = "ABAB"

    scheme_pattern = list(rhyme_scheme)
    scheme_length = len(scheme_pattern)

    section_scores = []

    for section_name, lines in sections.items():
        # Only check verse and chorus sections
        if not any(
            keyword in section_name.lower() for keyword in ["verse", "chorus"]
        ):
            continue

        if len(lines) < scheme_length:
            continue

        # Extract end words
        end_words = []
        for line in lines[:scheme_length]:
            words = re.findall(r"\b\w+\b", line)
            if words:
                end_words.append(words[-1])

        if len(end_words) != scheme_length:
            continue

        # Check rhymes according to scheme
        rhyme_groups = {}
        for i, letter in enumerate(scheme_pattern):
            if letter not in rhyme_groups:
                rhyme_groups[letter] = []
            rhyme_groups[letter].append(end_words[i])

        # Count matching rhymes
        matching_pairs = 0
        total_pairs = 0

        for group_words in rhyme_groups.values():
            if len(group_words) < 2:
                continue

            # Check if words in group rhyme (simple suffix matching)
            suffixes = [_get_rhyme_suffix(word) for word in group_words]

            for i in range(len(suffixes)):
                for j in range(i + 1, len(suffixes)):
                    total_pairs += 1
                    if suffixes[i] == suffixes[j]:
                        matching_pairs += 1

        if total_pairs > 0:
            section_score = matching_pairs / total_pairs
            section_scores.append(section_score)

            logger.debug(
                "validate.rhyme_tightness.section",
                section=section_name,
                scheme=rhyme_scheme,
                matching_pairs=matching_pairs,
                total_pairs=total_pairs,
                score=section_score,
            )

    if not section_scores:
        # No sections to evaluate, return neutral score
        return 0.75

    score = sum(section_scores) / len(section_scores)

    logger.info(
        "validate.rhyme_tightness",
        score=score,
        sections_evaluated=len(section_scores),
    )

    return score


def _evaluate_section_completeness(
    sections: Dict[str, List[str]], required_sections: List[str]
) -> Tuple[float, List[str]]:
    """Evaluate section completeness score.

    Checks if all required sections from blueprint are present.
    Target: 1.0

    Args:
        sections: Parsed sections dictionary
        required_sections: List of required section names from blueprint

    Returns:
        Tuple of (score, list_of_missing_sections)
    """
    if not required_sections:
        return 1.0, []

    # Normalize section names for comparison
    present_sections = {name.lower().strip() for name in sections.keys()}
    required_normalized = {name.lower().strip() for name in required_sections}

    # Check which required sections are present
    missing_sections = []
    for required in required_normalized:
        # Check if any present section matches (handles variants like "Chorus 1")
        if not any(required in present for present in present_sections):
            missing_sections.append(required)

    score = (len(required_normalized) - len(missing_sections)) / len(required_normalized)

    logger.info(
        "validate.section_completeness",
        score=score,
        required_count=len(required_normalized),
        missing_count=len(missing_sections),
        missing_sections=missing_sections,
    )

    return score, missing_sections


def _evaluate_profanity(
    lyrics: str, banned_terms: List[str], explicit_allowed: bool
) -> Tuple[float, List[str]]:
    """Evaluate profanity compliance score.

    Checks for banned terms based on explicit flag.
    Target: 1.0 for clean, 0.9 for explicit allowed

    Args:
        lyrics: Complete lyrics text
        banned_terms: List of banned terms from blueprint
        explicit_allowed: Whether explicit content is allowed

    Returns:
        Tuple of (score, list_of_found_terms)
    """
    if not banned_terms:
        return 1.0, []

    # Scan for banned terms (case-insensitive, word boundaries)
    lyrics_lower = lyrics.lower()
    found_terms = []

    for term in banned_terms:
        # Use word boundary matching
        pattern = rf"\b{re.escape(term.lower())}\b"
        if re.search(pattern, lyrics_lower):
            found_terms.append(term)

    if not found_terms:
        # Clean, no banned terms
        score = 1.0
    elif explicit_allowed:
        # Explicit allowed but noted
        score = 0.9
    else:
        # Explicit not allowed, failed
        score = 0.0

    logger.info(
        "validate.profanity",
        score=score,
        explicit_allowed=explicit_allowed,
        found_terms_count=len(found_terms),
        found_terms=found_terms,
    )

    return score, found_terms


@workflow_skill(
    name="amcs.validate.evaluate",
    deterministic=True,
)
async def evaluate_artifacts(
    inputs: Dict[str, Any], context: WorkflowContext
) -> Dict[str, Any]:
    """Evaluate artifacts against blueprint rubric.

    Scores lyrics, style, and producer notes against the blueprint's quality
    thresholds. Returns scores and issues list to determine if fix loop is needed.

    Args:
        inputs: Dictionary containing:
            - lyrics: Complete lyrics with section markers
            - style: Validated style specification
            - producer_notes: Production arrangement and mix guidance
            - blueprint: Genre-specific rules and scoring rubric
            - sds: Original SDS for constraints
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - scores: Score breakdown (total, hook_density, singability, etc.)
            - issues: List of specific failures
            - pass: Boolean indicating if validation passed
    """
    lyrics = inputs["lyrics"]
    style = inputs["style"]
    producer_notes = inputs["producer_notes"]
    blueprint = inputs["blueprint"]
    sds = inputs.get("sds", {})

    logger.info(
        "validate.evaluate.start",
        run_id=str(context.run_id),
    )

    # Extract rubric configuration
    rubric = blueprint.get("eval_rubric", {})
    weights = rubric.get("weights", {
        "hook_density": 0.25,
        "singability": 0.25,
        "rhyme_tightness": 0.20,
        "section_completeness": 0.20,
        "profanity_score": 0.10,
    })
    thresholds = rubric.get("thresholds", {"min_total": 0.85})
    min_total = thresholds["min_total"]

    # Parse lyrics into sections
    sections = _extract_sections(lyrics)

    # Evaluate each metric
    hook_density = _evaluate_hook_density(lyrics, sections)
    singability = _evaluate_singability(sections)

    # Get rhyme scheme from SDS
    rhyme_scheme = sds.get("lyrics", {}).get("constraints", {}).get("rhyme_scheme", "ABAB")
    rhyme_tightness = _evaluate_rhyme_tightness(sections, rhyme_scheme)

    # Get required sections from blueprint
    required_sections = blueprint.get("rules", {}).get("required_sections", [])
    section_completeness, missing_sections = _evaluate_section_completeness(
        sections, required_sections
    )

    # Check profanity
    banned_terms = blueprint.get("rules", {}).get("banned_terms", [])
    explicit_allowed = sds.get("constraints", {}).get("explicit", False)
    profanity_score, found_terms = _evaluate_profanity(
        lyrics, banned_terms, explicit_allowed
    )

    # Compute weighted total score
    total_score = (
        hook_density * weights.get("hook_density", 0.25)
        + singability * weights.get("singability", 0.25)
        + rhyme_tightness * weights.get("rhyme_tightness", 0.20)
        + section_completeness * weights.get("section_completeness", 0.20)
        + profanity_score * weights.get("profanity_score", 0.10)
    )

    # Build scores object
    scores = {
        "total": round(total_score, 4),
        "hook_density": round(hook_density, 4),
        "singability": round(singability, 4),
        "rhyme_tightness": round(rhyme_tightness, 4),
        "section_completeness": round(section_completeness, 4),
        "profanity_score": round(profanity_score, 4),
    }

    # Build issues list
    issues = []
    if hook_density < 0.7:
        issues.append(f"Low hook density: {hook_density:.2f} (target 0.7)")
    if singability < 0.8:
        issues.append(f"Weak singability: {singability:.2f} (target 0.8) - inconsistent syllable counts")
    if rhyme_tightness < 0.75:
        issues.append(f"Weak rhyme tightness: {rhyme_tightness:.2f} (target 0.75) - rhyme scheme not followed")
    if section_completeness < 1.0:
        issues.append(f"Missing required sections: {', '.join(missing_sections)}")
    if profanity_score < 1.0 and not explicit_allowed:
        issues.append(f"Profanity detected (explicit=false): {', '.join(found_terms)}")

    # Determine pass/fail
    pass_validation = total_score >= min_total

    # Compute hash for provenance
    scores_hash = compute_hash(str(scores))

    logger.info(
        "validate.evaluate.complete",
        run_id=str(context.run_id),
        total_score=total_score,
        pass_validation=pass_validation,
        issues_count=len(issues),
        hash=scores_hash[:16],
    )

    return {
        "scores": scores,
        "issues": issues,
        "pass": pass_validation,
        "_hash": scores_hash,
    }
