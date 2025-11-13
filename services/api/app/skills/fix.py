"""FIX skill: Apply targeted fixes to failing artifacts.

This skill analyzes validation issues and applies minimal, surgical fixes to
improve hook density, singability, rhyme tightness, section completeness, and
profanity compliance without unnecessary rewrites.

Contract: .claude/skills/workflow/fix/SKILL.md
"""

import re
from typing import Any, Dict, List, Tuple

import structlog

from app.skills.llm_client import get_llm_client
from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


def _parse_issues(issues: List[str]) -> Dict[str, Any]:
    """Parse issues list into structured format.

    Args:
        issues: List of validation failure messages

    Returns:
        Dictionary with issue flags and extracted details
    """
    parsed = {
        "hook_density": False,
        "singability": False,
        "rhyme_tightness": False,
        "section_completeness": False,
        "profanity": False,
        "details": {},
    }

    for issue in issues:
        issue_lower = issue.lower()

        if "hook density" in issue_lower:
            parsed["hook_density"] = True
            # Extract current score
            match = re.search(r"(\d+\.\d+)", issue)
            if match:
                parsed["details"]["hook_density_score"] = float(match.group(1))

        elif "singability" in issue_lower:
            parsed["singability"] = True

        elif "rhyme" in issue_lower:
            parsed["rhyme_tightness"] = True

        elif "missing required sections" in issue_lower:
            parsed["section_completeness"] = True
            # Extract missing sections
            match = re.search(r":\s*(.+)$", issue)
            if match:
                sections_str = match.group(1).strip()
                parsed["details"]["missing_sections"] = [
                    s.strip().strip("'\"[]") for s in re.split(r"[,\[\]]", sections_str) if s.strip()
                ]

        elif "profanity" in issue_lower:
            parsed["profanity"] = True
            # Extract banned terms
            match = re.search(r":\s*(.+)$", issue)
            if match:
                terms_str = match.group(1).strip()
                parsed["details"]["banned_terms"] = [
                    s.strip() for s in terms_str.split(",") if s.strip()
                ]

    return parsed


def _prioritize_fixes(
    parsed_issues: Dict[str, Any], scores: Dict[str, float]
) -> List[str]:
    """Prioritize which fixes to apply first.

    Args:
        parsed_issues: Parsed issues dictionary
        scores: Score breakdown from validation

    Returns:
        Ordered list of issue types to fix (highest priority first)
    """
    priorities = []

    # Profanity is highest priority (blocking)
    if parsed_issues["profanity"]:
        priorities.append("profanity")

    # Section completeness (structural)
    if parsed_issues["section_completeness"]:
        priorities.append("section_completeness")

    # Sort remaining by score (lowest first)
    remaining = []
    if parsed_issues["hook_density"]:
        remaining.append(("hook_density", scores.get("hook_density", 0)))
    if parsed_issues["singability"]:
        remaining.append(("singability", scores.get("singability", 0)))
    if parsed_issues["rhyme_tightness"]:
        remaining.append(("rhyme_tightness", scores.get("rhyme_tightness", 0)))

    remaining.sort(key=lambda x: x[1])  # Lowest score first
    priorities.extend([issue for issue, _ in remaining])

    return priorities


async def _fix_hook_density(
    lyrics: str, style: Dict[str, Any], seed: int
) -> Tuple[str, Dict[str, Any], str]:
    """Fix low hook density by adding hook repetitions.

    Args:
        lyrics: Current lyrics
        style: Style specification
        seed: Determinism seed

    Returns:
        Tuple of (patched_lyrics, patched_style, fix_description)
    """
    logger.info("fix.hook_density.start")

    # Extract chorus to identify hook
    chorus_match = re.search(r"\[Chorus[^\]]*\](.*?)(?=\n\[|\Z)", lyrics, re.DOTALL)
    if not chorus_match:
        logger.warning("fix.hook_density.no_chorus")
        return lyrics, style, "No chorus found to extract hook"

    chorus_text = chorus_match.group(1).strip()

    # Use LLM to add hook repetitions
    llm = get_llm_client()

    system_prompt = """Apply MINIMAL fixes to increase hook density. Identify the primary hook phrase from the chorus and add 1-2 strategic repetitions in other sections (pre-chorus, bridge, or final chorus). Do NOT rewrite the entire song. Only add the hook where it makes sense structurally."""

    user_prompt = f"""Increase hook density. Current hook density is low (< 0.7).

Chorus (contains the main hook):
{chorus_text}

Full lyrics:
{lyrics}

Instructions:
1. Identify the most memorable hook phrase from the chorus (typically a repeated line)
2. Add this hook 1-2 times in other sections (verse, pre-chorus, or bridge)
3. Return ONLY the modified lyrics with the hook additions
4. Do NOT rewrite or change other parts of the song
5. Preserve all section markers [Section] exactly as they are"""

    try:
        patched_lyrics = await llm.generate(
            system=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            seed=seed,
        )

        logger.info("fix.hook_density.complete", added_hooks=True)
        return patched_lyrics.strip(), style, "Added hook repetitions to increase density"

    except Exception as e:
        logger.error("fix.hook_density.error", error=str(e))
        return lyrics, style, f"Failed to fix hook density: {e}"


async def _fix_singability(
    lyrics: str, seed: int
) -> Tuple[str, str]:
    """Fix weak singability by adjusting syllable consistency.

    Args:
        lyrics: Current lyrics
        seed: Determinism seed

    Returns:
        Tuple of (patched_lyrics, fix_description)
    """
    logger.info("fix.singability.start")

    llm = get_llm_client()

    system_prompt = """Apply MINIMAL fixes to improve singability. Adjust syllable counts to be consistent (within ±1 syllable of mean per section). Preserve meaning and rhyme scheme. Do NOT rewrite unaffected lines."""

    user_prompt = f"""Fix singability issues. Current syllable consistency is weak (< 0.8).

Lyrics:
{lyrics}

Instructions:
1. For each section, ensure syllable counts are consistent (±1 syllable)
2. Remove tongue-twisters or awkward phrasing
3. Maintain natural breath points
4. Preserve rhyme scheme and meaning
5. Return ONLY the modified lyrics
6. Preserve all section markers [Section] exactly as they are"""

    try:
        patched_lyrics = await llm.generate(
            system=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            seed=seed,
        )

        logger.info("fix.singability.complete", adjusted_syllables=True)
        return patched_lyrics.strip(), "Adjusted syllable counts for consistency"

    except Exception as e:
        logger.error("fix.singability.error", error=str(e))
        return lyrics, f"Failed to fix singability: {e}"


async def _fix_rhyme_tightness(
    lyrics: str, seed: int
) -> Tuple[str, str]:
    """Fix weak rhyme tightness by improving rhyme scheme adherence.

    Args:
        lyrics: Current lyrics
        seed: Determinism seed

    Returns:
        Tuple of (patched_lyrics, fix_description)
    """
    logger.info("fix.rhyme_tightness.start")

    llm = get_llm_client()

    system_prompt = """Apply MINIMAL fixes to improve rhyme scheme adherence. Replace end words that break the rhyme scheme with appropriate rhymes. Preserve line meaning and syllable count."""

    user_prompt = f"""Fix rhyme tightness issues. Current rhyme scheme adherence is weak (< 0.75).

Lyrics:
{lyrics}

Instructions:
1. Identify lines that should rhyme but don't (based on verse/chorus structure)
2. Replace end words with better rhymes
3. Preserve meaning, theme, and syllable count
4. Return ONLY the modified lyrics
5. Preserve all section markers [Section] exactly as they are"""

    try:
        patched_lyrics = await llm.generate(
            system=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            seed=seed,
        )

        logger.info("fix.rhyme_tightness.complete", improved_rhymes=True)
        return patched_lyrics.strip(), "Improved rhyme scheme adherence"

    except Exception as e:
        logger.error("fix.rhyme_tightness.error", error=str(e))
        return lyrics, f"Failed to fix rhyme tightness: {e}"


async def _fix_missing_sections(
    lyrics: str,
    producer_notes: Dict[str, Any],
    missing_sections: List[str],
    seed: int,
) -> Tuple[str, Dict[str, Any], str]:
    """Fix missing required sections by generating them.

    Args:
        lyrics: Current lyrics
        producer_notes: Producer notes to update
        missing_sections: List of missing section names
        seed: Determinism seed

    Returns:
        Tuple of (patched_lyrics, patched_producer_notes, fix_description)
    """
    logger.info("fix.missing_sections.start", missing=missing_sections)

    llm = get_llm_client()

    for section in missing_sections:
        system_prompt = f"""Generate a [{section}] section that fits the existing song theme and structure. Use the same rhyme scheme and syllable pattern as other sections. Keep it concise (4-8 lines)."""

        # Extract theme from existing lyrics
        verse_match = re.search(r"\[Verse[^\]]*\](.*?)(?=\n\[|\Z)", lyrics, re.DOTALL)
        chorus_match = re.search(r"\[Chorus[^\]]*\](.*?)(?=\n\[|\Z)", lyrics, re.DOTALL)

        context_lyrics = ""
        if verse_match:
            context_lyrics += f"Verse:\n{verse_match.group(1).strip()}\n\n"
        if chorus_match:
            context_lyrics += f"Chorus:\n{chorus_match.group(1).strip()}\n\n"

        user_prompt = f"""Generate missing [{section}] section.

Existing sections:
{context_lyrics}

Instructions:
1. Match the theme and tone of existing sections
2. Use similar syllable counts (8-9 per line)
3. Follow rhyme scheme (AABB or ABAB)
4. Keep it 4-8 lines
5. Return ONLY the new section content (no section marker)"""

        try:
            section_content = await llm.generate(
                system=system_prompt,
                user_prompt=user_prompt,
                temperature=0.2,
                seed=seed,
            )

            # Insert section in appropriate position
            # For Bridge, insert before final Chorus
            # For other sections, insert at end
            if section.lower() == "bridge":
                # Find last chorus
                last_chorus_pos = lyrics.rfind("[Chorus")
                if last_chorus_pos > 0:
                    insert_pos = last_chorus_pos
                    new_section = f"\n\n[{section}]\n{section_content.strip()}\n"
                    lyrics = lyrics[:insert_pos] + new_section + lyrics[insert_pos:]
                else:
                    # Append at end
                    lyrics += f"\n\n[{section}]\n{section_content.strip()}"
            else:
                # Append at end
                lyrics += f"\n\n[{section}]\n{section_content.strip()}"

            # Update producer notes with section metadata
            if "section_meta" not in producer_notes:
                producer_notes["section_meta"] = {}

            producer_notes["section_meta"][section] = {
                "tags": ["moderate energy", "reflective"],
            }

            logger.info("fix.missing_sections.added", section=section)

        except Exception as e:
            logger.error("fix.missing_sections.error", section=section, error=str(e))
            continue

    return (
        lyrics.strip(),
        producer_notes,
        f"Generated missing sections: {', '.join(missing_sections)}",
    )


async def _fix_profanity(
    lyrics: str, banned_terms: List[str], seed: int
) -> Tuple[str, str]:
    """Fix profanity by replacing banned terms with clean alternatives.

    Args:
        lyrics: Current lyrics
        banned_terms: List of banned terms found
        seed: Determinism seed

    Returns:
        Tuple of (patched_lyrics, fix_description)
    """
    logger.info("fix.profanity.start", banned_terms=banned_terms)

    llm = get_llm_client()

    system_prompt = """Replace profanity with clean alternatives. Preserve meaning, rhyme, and syllable count. Use creative substitutions that maintain impact."""

    user_prompt = f"""Remove profanity from lyrics.

Lyrics:
{lyrics}

Banned terms found: {', '.join(banned_terms)}

Instructions:
1. Replace each banned term with a clean alternative
2. Preserve rhyme scheme and syllable count
3. Maintain the emotional impact and meaning
4. Return ONLY the modified lyrics
5. Preserve all section markers [Section] exactly as they are"""

    try:
        patched_lyrics = await llm.generate(
            system=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            seed=seed,
        )

        logger.info("fix.profanity.complete", replaced_terms=len(banned_terms))
        return patched_lyrics.strip(), f"Removed profanity: {', '.join(banned_terms)}"

    except Exception as e:
        logger.error("fix.profanity.error", error=str(e))
        return lyrics, f"Failed to fix profanity: {e}"


def _validate_fix(
    patched_lyrics: str, original_lyrics: str, blueprint: Dict[str, Any]
) -> List[str]:
    """Validate that fix didn't introduce new problems.

    Args:
        patched_lyrics: Fixed lyrics
        original_lyrics: Original lyrics
        blueprint: Blueprint with rules

    Returns:
        List of new issues found (empty if clean)
    """
    issues = []

    # Check that required sections weren't removed
    required_sections = blueprint.get("rules", {}).get("required_sections", [])
    for section in required_sections:
        # Check for section marker (case-insensitive)
        pattern = rf"\[{re.escape(section)}"
        if not re.search(pattern, patched_lyrics, re.IGNORECASE):
            issues.append(f"Fix removed required section: {section}")

    # Check that lyrics didn't shrink drastically
    original_lines = len([line for line in original_lyrics.split("\n") if line.strip()])
    patched_lines = len([line for line in patched_lyrics.split("\n") if line.strip()])

    if patched_lines < original_lines * 0.7:
        issues.append(
            f"Fix removed too many lines: {original_lines} → {patched_lines}"
        )

    return issues


@workflow_skill(
    name="amcs.fix.apply",
    deterministic=True,
)
async def apply_fixes(
    inputs: Dict[str, Any], context: WorkflowContext
) -> Dict[str, Any]:
    """Apply targeted fixes to failing artifacts.

    Analyzes validation issues and makes minimal, surgical improvements to
    the lowest-scoring component without unnecessary rewrites.

    Args:
        inputs: Dictionary containing:
            - issues: List of validation failures
            - style: Current style specification
            - lyrics: Current lyrics
            - producer_notes: Current producer notes
            - blueprint: Blueprint with rules
            - scores: Score breakdown (optional)
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - patched_lyrics: Fixed lyrics
            - patched_style: Fixed style (if changed)
            - patched_producer_notes: Fixed producer notes (if changed)
            - fixes_applied: List of fixes applied
    """
    issues = inputs["issues"]
    style = inputs["style"]
    lyrics = inputs["lyrics"]
    producer_notes = inputs["producer_notes"]
    blueprint = inputs["blueprint"]
    scores = inputs.get("scores", {})

    logger.info(
        "fix.apply.start",
        run_id=str(context.run_id),
        issues_count=len(issues),
    )

    # Parse issues
    parsed_issues = _parse_issues(issues)

    # Prioritize fixes
    fix_priorities = _prioritize_fixes(parsed_issues, scores)

    logger.info("fix.apply.priorities", priorities=fix_priorities)

    # Apply fixes in priority order
    patched_lyrics = lyrics
    patched_style = style.copy()
    patched_producer_notes = producer_notes.copy()
    fixes_applied = []

    for issue_type in fix_priorities:
        details = parsed_issues["details"]

        if issue_type == "profanity":
            banned_terms = details.get("banned_terms", [])
            patched_lyrics, fix_desc = await _fix_profanity(
                patched_lyrics, banned_terms, context.seed
            )
            fixes_applied.append(fix_desc)

        elif issue_type == "section_completeness":
            missing_sections = details.get("missing_sections", [])
            (
                patched_lyrics,
                patched_producer_notes,
                fix_desc,
            ) = await _fix_missing_sections(
                patched_lyrics, patched_producer_notes, missing_sections, context.seed
            )
            fixes_applied.append(fix_desc)

        elif issue_type == "hook_density":
            patched_lyrics, patched_style, fix_desc = await _fix_hook_density(
                patched_lyrics, patched_style, context.seed
            )
            fixes_applied.append(fix_desc)

        elif issue_type == "singability":
            patched_lyrics, fix_desc = await _fix_singability(
                patched_lyrics, context.seed
            )
            fixes_applied.append(fix_desc)

        elif issue_type == "rhyme_tightness":
            patched_lyrics, fix_desc = await _fix_rhyme_tightness(
                patched_lyrics, context.seed
            )
            fixes_applied.append(fix_desc)

    # Validate fixes didn't introduce new issues
    validation_issues = _validate_fix(patched_lyrics, lyrics, blueprint)
    if validation_issues:
        logger.warning(
            "fix.apply.validation_issues",
            issues=validation_issues,
        )
        # Revert to original if fix broke something critical
        if any("removed required section" in issue for issue in validation_issues):
            logger.error("fix.apply.critical_error", reverting=True)
            patched_lyrics = lyrics
            patched_producer_notes = producer_notes
            fixes_applied.append("REVERTED: Fix broke required sections")

    # Compute hash for provenance
    combined = patched_lyrics + str(patched_style) + str(patched_producer_notes)
    fix_hash = compute_hash(combined)

    logger.info(
        "fix.apply.complete",
        run_id=str(context.run_id),
        fixes_count=len(fixes_applied),
        hash=fix_hash[:16],
    )

    return {
        "patched_lyrics": patched_lyrics,
        "patched_style": patched_style,
        "patched_producer_notes": patched_producer_notes,
        "fixes_applied": fixes_applied,
        "_hash": fix_hash,
    }
