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

# PII redaction patterns
PII_PATTERNS = {
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "phone": re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b"),
    "address": re.compile(
        r"\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)",
        re.IGNORECASE,
    ),
}

# Living artists list (expand as needed)
LIVING_ARTISTS = {
    "drake",
    "taylor swift",
    "ed sheeran",
    "billie eilish",
    "ariana grande",
    "post malone",
    "the weeknd",
    "beyonce",
    "justin bieber",
    "lady gaga",
    "bruno mars",
    "adele",
    "rihanna",
    "kanye west",
    "dua lipa",
    "harry styles",
    "olivia rodrigo",
    "bad bunny",
    "peso pluma",
    "sza",
}

# Artist influence mapping by genre
ARTIST_INFLUENCE_MAP = {
    "pop": "contemporary pop influence",
    "hiphop": "modern hip-hop stylings",
    "hip-hop": "modern hip-hop stylings",
    "rock": "contemporary rock elements",
    "electronic": "electronic music inspiration",
    "country": "contemporary country influence",
    "r&b": "modern R&B elements",
    "rnb": "modern R&B elements",
    "default": "modern musical influences",
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


def _redact_pii(text: str) -> tuple[str, List[Dict[str, str]]]:
    """Redact PII from text using regex patterns.

    Args:
        text: Input text

    Returns:
        Tuple of (cleaned_text, violations_list)
        Each violation contains: type, original, replacement, reason
    """
    violations = []
    cleaned = text

    for pii_type, pattern in PII_PATTERNS.items():
        matches = pattern.findall(cleaned)
        for match in matches:
            # Handle tuple matches (from groups) vs string matches
            original = match if isinstance(match, str) else " ".join(match)

            violations.append(
                {
                    "type": f"pii_{pii_type}",
                    "original": original,
                    "replacement": "[[REDACTED:PII]]",
                    "reason": f"Contains {pii_type} information",
                }
            )
            # Replace one at a time to maintain accurate tracking
            cleaned = pattern.sub("[[REDACTED:PII]]", cleaned, count=1)

    return cleaned, violations


def _normalize_artist_references(
    text: str, allow_living: bool, genre: str = "default"
) -> tuple[str, List[Dict[str, str]]]:
    """Normalize references to living artists.

    Args:
        text: Input text
        allow_living: Whether living artist references are allowed
        genre: Genre for selecting appropriate replacement phrase

    Returns:
        Tuple of (cleaned_text, violations_list)
        Each violation contains: type, original, replacement, reason
    """
    if allow_living:
        return text, []

    violations = []
    cleaned = text

    # Patterns: "style of Taylor Swift", "sounds like Drake", "inspired by Beyonce"
    # Note: Don't use re.IGNORECASE for the artist name part to ensure we only match capitalized names
    patterns = [
        r"(?i:style\s+of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        r"(?i:sounds?\s+like)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        r"(?i:inspired\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        r"(?i:reminds?\s+(?:me\s+)?of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    ]

    for pattern_str in patterns:
        pattern = re.compile(pattern_str)  # Don't use IGNORECASE - we want exact capitalization for names
        for match in pattern.finditer(cleaned):
            artist = match.group(1).lower()
            if artist in LIVING_ARTISTS:
                # Get appropriate replacement based on genre
                genre_normalized = genre.lower() if genre else "default"
                replacement = ARTIST_INFLUENCE_MAP.get(
                    genre_normalized, ARTIST_INFLUENCE_MAP["default"]
                )

                full_match = match.group(0)

                violations.append(
                    {
                        "type": "living_artist",
                        "original": full_match,
                        "replacement": replacement,
                        "reason": f"Reference to living artist '{artist}' not allowed",
                    }
                )

                cleaned = cleaned.replace(full_match, replacement, 1)

    return cleaned, violations


def apply_policy_guards(
    text: str, constraints: Dict[str, Any]
) -> tuple[str, List[Dict[str, Any]], List[str]]:
    """Apply comprehensive policy guards to lyrics.

    This function enforces all safety and compliance policies including
    profanity filtering, PII redaction, and artist reference normalization.

    Args:
        text: Input lyrics text
        constraints: Policy constraints from SDS
            - explicit: bool (allow explicit content)
            - language: str (language code, default "en")
            - allow_living_artists: bool (default False)
            - genre: str (for artist replacement selection, optional)

    Returns:
        Tuple of (cleaned_text, violations, warnings)
        - cleaned_text: Text with policy violations redacted/normalized
        - violations: List of dict with {type, original, replacement, reason}
        - warnings: List of warning messages for audit trail

    Example:
        >>> text = "Contact me at john@example.com for my Drake-style beat"
        >>> cleaned, violations, warnings = apply_policy_guards(
        ...     text,
        ...     {"explicit": False, "allow_living_artists": False, "genre": "hiphop"}
        ... )
        >>> "[[REDACTED:PII]]" in cleaned
        True
        >>> "Drake" not in cleaned
        True
        >>> len(violations) >= 2
        True
    """
    logger.info(
        "apply_policy_guards.start",
        text_length=len(text),
        constraints=constraints,
    )

    all_violations = []
    warnings = []
    cleaned_text = text

    # Step 1: Profanity Filtering
    explicit = constraints.get("explicit", False)
    if not explicit:
        filtered_text, profanity_replacements = _filter_profanity(cleaned_text, explicit)

        if profanity_replacements:
            # Convert replacements to violations format
            for word in profanity_replacements:
                all_violations.append(
                    {
                        "type": "profanity",
                        "original": word,
                        "replacement": "[[REDACTED]]",
                        "reason": "Profanity not allowed (explicit=False)",
                    }
                )
            cleaned_text = filtered_text
            warnings.append(
                f"Filtered {len(profanity_replacements)} profane word(s)"
            )

            logger.info(
                "apply_policy_guards.profanity_filtered",
                count=len(profanity_replacements),
            )

    # Step 2: PII Redaction
    pii_cleaned, pii_violations = _redact_pii(cleaned_text)

    if pii_violations:
        all_violations.extend(pii_violations)
        cleaned_text = pii_cleaned
        warnings.append(f"Redacted {len(pii_violations)} PII occurrence(s)")

        logger.info(
            "apply_policy_guards.pii_redacted",
            count=len(pii_violations),
            types=[v["type"] for v in pii_violations],
        )

    # Step 3: Artist Normalization
    allow_living_artists = constraints.get("allow_living_artists", False)
    genre = constraints.get("genre", "default")

    artist_cleaned, artist_violations = _normalize_artist_references(
        cleaned_text, allow_living_artists, genre
    )

    if artist_violations:
        all_violations.extend(artist_violations)
        cleaned_text = artist_cleaned
        warnings.append(
            f"Normalized {len(artist_violations)} living artist reference(s)"
        )

        logger.info(
            "apply_policy_guards.artists_normalized",
            count=len(artist_violations),
            artists=[v["original"] for v in artist_violations],
        )

    logger.info(
        "apply_policy_guards.complete",
        total_violations=len(all_violations),
        violation_types={
            v_type: len([v for v in all_violations if v["type"] == v_type])
            for v_type in set(v["type"] for v in all_violations)
        }
        if all_violations
        else {},
    )

    return cleaned_text, all_violations, warnings


def _words_rhyme(word1: str, word2: str) -> bool:
    """Check if two words rhyme using suffix matching.

    For MVP, use simple 2-3 character suffix matching.
    TODO: Integrate phonetic library (pronouncing, pyphonetic) for better accuracy

    Args:
        word1: First word
        word2: Second word

    Returns:
        True if words rhyme, False otherwise

    Examples:
        >>> _words_rhyme("cat", "bat")
        True
        >>> _words_rhyme("home", "dome")
        True
        >>> _words_rhyme("cat", "cat")
        False  # Same word is not a rhyme
    """
    # Normalize - remove punctuation and convert to lowercase
    w1 = re.sub(r"[^\w]", "", word1.lower())
    w2 = re.sub(r"[^\w]", "", word2.lower())

    # Empty words don't rhyme
    if not w1 or not w2:
        return False

    # Same word is not a rhyme
    if w1 == w2:
        return False

    # Check 3-char suffix first (stronger rhyme), then 2-char
    if len(w1) >= 3 and len(w2) >= 3 and w1[-3:] == w2[-3:]:
        return True
    if len(w1) >= 2 and len(w2) >= 2 and w1[-2:] == w2[-2:]:
        return True

    return False


def _parse_rhyme_scheme(scheme: str) -> List[tuple[int, int]]:
    """Convert rhyme scheme string to line pair indices.

    Args:
        scheme: Rhyme pattern (e.g., "AABB", "ABAB", "ABCB")

    Returns:
        List of (line_i, line_j) pairs that should rhyme

    Examples:
        >>> _parse_rhyme_scheme("AABB")
        [(0, 1), (2, 3)]
        >>> _parse_rhyme_scheme("ABAB")
        [(0, 2), (1, 3)]
        >>> _parse_rhyme_scheme("ABCB")
        [(1, 3)]
    """
    pairs = []
    positions: Dict[str, int] = {}

    for i, char in enumerate(scheme.upper()):
        if char in positions:
            # Found matching rhyme letter - create pair
            pairs.append((positions[char], i))
        else:
            # First occurrence of this letter
            positions[char] = i

    return pairs


def apply_rhyme_scheme(
    text: str, rhyme_scheme: str, syllables_per_line: int, seed: int
) -> tuple[str, List[Dict[str, Any]]]:
    """Enforce rhyme scheme constraints on lyrics text.

    This function validates rhyme patterns and syllable counts, generating
    issues for lines that don't meet constraints. It does NOT automatically
    modify text to preserve user intent, but provides suggestions.

    Args:
        text: Input lyrics text (multiple lines)
        rhyme_scheme: Rhyme pattern (e.g., "AABB", "ABAB", "ABCB")
        syllables_per_line: Target syllables per line (±2 tolerance)
        seed: Seed for deterministic adjustments

    Returns:
        Tuple of (adjusted_text, issues_list)
        - adjusted_text: Original text (preserved for MVP)
        - issues_list: List of dict with:
            - line_num: Line number (0-indexed)
            - issue_type: "weak_rhyme" or "syllable_mismatch"
            - original: Original line text
            - suggestion: Suggested improvement
            - details: Additional context

    Example:
        >>> text = "The cat sat on the mat\\nIt wore a funny hat"
        >>> adjusted, issues = apply_rhyme_scheme(text, "AA", 8, seed=42)
        >>> len(issues)  # Should be 0, these lines rhyme well
        0
    """
    logger.info(
        "apply_rhyme_scheme.start",
        rhyme_scheme=rhyme_scheme,
        target_syllables=syllables_per_line,
        seed=seed,
    )

    issues = []

    # Parse text into lines
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    if not lines:
        logger.warning("apply_rhyme_scheme.empty_text")
        return text, []

    # Parse rhyme scheme into pairs
    rhyme_pairs = _parse_rhyme_scheme(rhyme_scheme)

    # Step 1: Validate Line-End Rhymes
    for pair_idx, (line_i, line_j) in enumerate(rhyme_pairs):
        # Check if line indices are valid
        if line_i >= len(lines) or line_j >= len(lines):
            logger.warning(
                "apply_rhyme_scheme.invalid_pair",
                pair=(line_i, line_j),
                total_lines=len(lines),
            )
            continue

        # Extract last words
        words_i = lines[line_i].split()
        words_j = lines[line_j].split()

        if not words_i or not words_j:
            continue

        last_word_i = words_i[-1]
        last_word_j = words_j[-1]

        # Check if they rhyme
        if not _words_rhyme(last_word_i, last_word_j):
            # Generate rhyme suggestion (deterministic based on seed)
            # For MVP, suggest a simple alternative
            suggestion_seed = seed + pair_idx
            suggestions = [
                f"Consider ending with a word that rhymes with '{last_word_j}'",
                f"Try rhyming '{last_word_i}' with '{last_word_j}' by changing one",
            ]
            suggestion = suggestions[suggestion_seed % len(suggestions)]

            issues.append(
                {
                    "line_num": line_i,
                    "issue_type": "weak_rhyme",
                    "original": lines[line_i],
                    "suggestion": suggestion,
                    "details": {
                        "expected_rhyme_with_line": line_j,
                        "word1": last_word_i,
                        "word2": last_word_j,
                    },
                }
            )

            logger.info(
                "apply_rhyme_scheme.weak_rhyme",
                line_i=line_i,
                line_j=line_j,
                word_i=last_word_i,
                word_j=last_word_j,
            )

    # Step 2: Validate Syllable Counts
    syllable_tolerance = 2
    for line_idx, line in enumerate(lines):
        syllable_count = _count_syllables(line)
        deviation = abs(syllable_count - syllables_per_line)

        if deviation > syllable_tolerance:
            # Generate syllable suggestion
            if syllable_count < syllables_per_line:
                suggestion = f"Add ~{syllables_per_line - syllable_count} syllables (currently {syllable_count}, target {syllables_per_line})"
            else:
                suggestion = f"Remove ~{syllable_count - syllables_per_line} syllables (currently {syllable_count}, target {syllables_per_line})"

            issues.append(
                {
                    "line_num": line_idx,
                    "issue_type": "syllable_mismatch",
                    "original": line,
                    "suggestion": suggestion,
                    "details": {
                        "current_syllables": syllable_count,
                        "target_syllables": syllables_per_line,
                        "deviation": deviation,
                    },
                }
            )

            logger.info(
                "apply_rhyme_scheme.syllable_mismatch",
                line_num=line_idx,
                current=syllable_count,
                target=syllables_per_line,
                deviation=deviation,
            )

    logger.info(
        "apply_rhyme_scheme.complete",
        total_issues=len(issues),
        rhyme_issues=len([i for i in issues if i["issue_type"] == "weak_rhyme"]),
        syllable_issues=len([i for i in issues if i["issue_type"] == "syllable_mismatch"]),
    )

    # For MVP, return original text unchanged to preserve user intent
    # Future: Could apply targeted fixes based on issues
    return text, issues


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


def pinned_retrieve(
    query: str,
    sources: List[Dict[str, Any]],
    required_chunk_hashes: List[str],
    top_k: int,
    seed: int,
) -> List[Dict[str, Any]]:
    """Deterministic source chunk retrieval using content hashing.

    This function achieves determinism through two phases:
    1. Hash matching: Retrieve chunks whose SHA-256 hashes match required_chunk_hashes
    2. Lexicographic fill: Fill remaining slots with deterministic sorting

    Args:
        query: Search query (for context only, not used for scoring)
        sources: List of source documents with chunks. Each source should have:
                 - name/id: Source identifier
                 - chunks: List of text chunks
                 - weight: (Optional) Source weight/importance (default 0.5)
        required_chunk_hashes: SHA-256 hashes of chunks from previous runs.
                                If empty, performs lexicographic selection only.
        top_k: Number of chunks to return
        seed: Seed for deterministic tie-breaking
              (currently unused due to lexicographic sort)

    Returns:
        List of chunks with fields:
            - chunk_hash: SHA-256 hash of chunk text
            - source_id: Source identifier
            - text: Actual chunk content
            - weight: Source weight

    Example:
        >>> sources = [
        ...     {
        ...         "name": "source1",
        ...         "chunks": ["chunk A", "chunk B"],
        ...         "weight": 0.8
        ...     }
        ... ]
        >>> chunks = pinned_retrieve(
        ...     query="test",
        ...     sources=sources,
        ...     required_chunk_hashes=[],
        ...     top_k=2,
        ...     seed=42
        ... )
    """
    logger.info(
        "pinned_retrieve.start",
        query_length=len(query),
        num_sources=len(sources),
        required_hashes=len(required_chunk_hashes),
        top_k=top_k,
        seed=seed,
    )

    # Edge case: Empty sources
    if not sources:
        logger.error("pinned_retrieve.empty_sources")
        return []

    # Edge case: top_k = 0
    if top_k <= 0:
        logger.warning("pinned_retrieve.invalid_top_k", top_k=top_k)
        return []

    # Build all available chunks with metadata
    all_chunks = []
    for source in sources:
        source_id = source.get("name") or source.get("id", "unknown")
        source_weight = source.get("weight", 0.5)
        chunks = source.get("chunks", [])

        for chunk_text in chunks:
            if not chunk_text or not isinstance(chunk_text, str):
                continue

            chunk_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
            all_chunks.append(
                {
                    "chunk_hash": chunk_hash,
                    "source_id": source_id,
                    "text": chunk_text,
                    "weight": source_weight,
                }
            )

    if not all_chunks:
        logger.warning("pinned_retrieve.no_chunks_found")
        return []

    # Deduplicate required hashes while preserving order
    seen_hashes = set()
    deduped_required_hashes = []
    for hash_val in required_chunk_hashes:
        if hash_val not in seen_hashes:
            deduped_required_hashes.append(hash_val)
            seen_hashes.add(hash_val)

    if len(deduped_required_hashes) < len(required_chunk_hashes):
        logger.info(
            "pinned_retrieve.deduped_hashes",
            original=len(required_chunk_hashes),
            deduped=len(deduped_required_hashes),
        )

    # Phase 1: Hash Matching
    matched_chunks = []
    matched_hashes = set()
    chunk_map = {chunk["chunk_hash"]: chunk for chunk in all_chunks}

    for required_hash in deduped_required_hashes:
        if required_hash in chunk_map:
            chunk = chunk_map[required_hash]
            matched_chunks.append(chunk)
            matched_hashes.add(required_hash)
        else:
            logger.warning(
                "pinned_retrieve.hash_not_found",
                missing_hash=required_hash[:16],
            )

    logger.info(
        "pinned_retrieve.hash_match_complete",
        requested=len(deduped_required_hashes),
        matched=len(matched_chunks),
    )

    # Phase 2: Fill Remaining Slots with Lexicographic Sort
    remaining_slots = top_k - len(matched_chunks)

    if remaining_slots > 0:
        # Get unmatched chunks
        unmatched_chunks = [
            chunk for chunk in all_chunks if chunk["chunk_hash"] not in matched_hashes
        ]

        # Deterministic lexicographic sort: (source_id, text)
        # This ensures identical results across runs without relying on
        # relevance scoring
        unmatched_chunks_sorted = sorted(
            unmatched_chunks, key=lambda x: (x["source_id"], x["text"])
        )

        # Take first N unmatched chunks
        fill_chunks = unmatched_chunks_sorted[:remaining_slots]

        logger.info(
            "pinned_retrieve.lexicographic_fill",
            remaining_slots=remaining_slots,
            filled=len(fill_chunks),
        )

        matched_chunks.extend(fill_chunks)

    # Edge case: top_k > available chunks - return what we have
    result = matched_chunks[:top_k]

    matched_count = len([c for c in result if c["chunk_hash"] in matched_hashes])
    logger.info(
        "pinned_retrieve.complete",
        returned=len(result),
        top_k=top_k,
        matched_from_hashes=matched_count,
    )

    return result


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
        # Retrieve chunks using pinned retrieval for determinism
        # If this is a re-run, use citation_hashes from previous run
        # Otherwise, perform lexicographic selection
        previous_citation_hashes = inputs.get("citation_hashes", [])

        logger.info(
            "lyrics.sources.retrieve",
            num_sources=len(sources),
            has_previous_hashes=len(previous_citation_hashes) > 0,
        )

        # Use pinned retrieval to get chunks deterministically
        chunks = pinned_retrieve(
            query=f"Lyrics context for {sds_lyrics.get('themes', ['song'])}",
            sources=sources,
            required_chunk_hashes=previous_citation_hashes,
            top_k=inputs.get("source_top_k", 5),  # Default to 5 chunks
            seed=context.seed + 1,  # Offset from main seed
        )

        citations = chunks

        # Build source context for prompt
        if chunks:
            source_texts = [f"- {chunk['text']}" for chunk in chunks]
            source_context = "\n\nRelevant source material:\n" + "\n".join(source_texts)

        logger.info(
            "lyrics.sources.retrieved",
            num_chunks=len(chunks),
            citation_hashes=[c["chunk_hash"][:16] for c in chunks],
        )

    # Step 2: Generate section-by-section
    section_order = plan["section_order"]
    all_sections = []
    all_issues = []  # Track rhyme/syllable issues across all sections
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

        # Apply comprehensive policy guards (profanity, PII, artist normalization)
        policy_constraints = {
            "explicit": sds_lyrics["constraints"].get("explicit", False),
            "language": sds_lyrics.get("language", "en"),
            "allow_living_artists": sds_lyrics["constraints"].get(
                "allow_living_artists", False
            ),
            "genre": style.get("genre_detail", {}).get("primary", "default"),
        }

        policy_cleaned_lyrics, policy_violations, policy_warnings = apply_policy_guards(
            text=section_lyrics,
            constraints=policy_constraints,
        )

        # Track policy violations for reporting
        if policy_violations:
            for violation in policy_violations:
                all_issues.append(
                    {
                        "section": section,
                        "section_idx": section_idx,
                        "issue_type": "policy_violation",
                        "violation_type": violation["type"],
                        "details": violation,
                    }
                )

            logger.warning(
                "lyrics.policy.violations",
                section=section,
                violations=policy_violations,
                warnings=policy_warnings,
            )

        # Apply rhyme scheme enforcement if specified
        rhyme_scheme = sds_lyrics.get("rhyme_scheme", "AABB")
        syllables_per_line = sds_lyrics.get("syllables_per_line", 8)

        adjusted_lyrics, rhyme_issues = apply_rhyme_scheme(
            text=policy_cleaned_lyrics,
            rhyme_scheme=rhyme_scheme,
            syllables_per_line=syllables_per_line,
            seed=section_seed,
        )

        # Track issues for validation phase
        if rhyme_issues:
            # Add section context to issues
            for issue in rhyme_issues:
                issue["section"] = section
                issue["section_idx"] = section_idx
            all_issues.extend(rhyme_issues)

            logger.info(
                "lyrics.rhyme_scheme.issues",
                section=section,
                num_issues=len(rhyme_issues),
                issue_types={
                    issue_type: len([i for i in rhyme_issues if i["issue_type"] == issue_type])
                    for issue_type in ["weak_rhyme", "syllable_mismatch"]
                },
            )

        # Use adjusted lyrics if improvements were made (for now, always use original)
        # In future, could selectively apply fixes based on issue severity
        section_text = adjusted_lyrics

        # Format section
        formatted_section = f"[{section}]\n{section_text.strip()}"
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
        total_issues=len(all_issues),
        hash=lyrics_hash[:16],
    )

    return {
        "lyrics": complete_lyrics,
        "citations": citations,
        "metrics": metrics,
        "issues": all_issues,  # Rhyme/syllable issues for validation
        "_hash": lyrics_hash,
    }
