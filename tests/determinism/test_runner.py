"""
Deterministic Workflow Test Runner

This module provides mock workflow execution for determinism testing. It simulates
the AMCS workflow (PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → REVIEW)
with deterministic outputs based on input SDS and seed.

The mock workflow:
1. Uses the provided seed to generate deterministic outputs
2. Simulates all 8 workflow nodes
3. Produces realistic artifacts that mirror actual workflow outputs
4. Allows verification of seed propagation, decoder settings, and retrieval

Key Functions:
- run_workflow_deterministic(): Execute full workflow with SDS + seed
- run_node_deterministic(): Execute individual workflow node
- generate_mock_artifact(): Create deterministic mock artifact

This is NOT the actual workflow implementation - it's a test harness that produces
deterministic outputs for validation purposes.
"""

import hashlib
import json
import random
from typing import Any, Dict, List, Optional

from .conftest import (
    EXPECTED_DECODER_SETTINGS,
    WORKFLOW_NODES,
    MockWorkflowContext,
    WorkflowNodeConfig,
    hash_artifact,
)


# =============================================================================
# Deterministic Mock Artifact Generation
# =============================================================================

def _deterministic_random(seed: int, namespace: str) -> random.Random:
    """
    Create a deterministic random number generator for a specific namespace.

    Args:
        seed: Base seed
        namespace: Namespace string to create unique RNG per context

    Returns:
        random.Random instance seeded deterministically
    """
    combined = f"{seed}:{namespace}"
    hash_bytes = hashlib.sha256(combined.encode()).digest()
    seed_int = int.from_bytes(hash_bytes[:4], byteorder='big')
    rng = random.Random(seed_int)
    return rng


def generate_mock_plan(sds: Dict[str, Any], seed: int) -> Dict[str, Any]:
    """
    Generate deterministic PLAN artifact.

    Args:
        sds: Song Design Spec
        seed: Deterministic seed

    Returns:
        Plan artifact dictionary
    """
    rng = _deterministic_random(seed, "plan")

    # Extract section order from SDS lyrics
    section_order = sds.get("lyrics", {}).get("section_order", ["intro", "verse1", "chorus1", "verse2", "chorus2", "outro"])

    sections = []
    for idx, section_id in enumerate(section_order):
        section_type = section_id.rstrip("0123456789") or "verse"
        sections.append({
            "id": section_id,
            "type": section_type,
            "wordCountTarget": rng.randint(60, 120),
            "durationTarget": f"0:{rng.randint(15, 45):02d}",
            "order": idx + 1
        })

    total_word_count = sum(s["wordCountTarget"] for s in sections)

    return {
        "sections": sections,
        "evaluationTargets": {
            "hookDensity": round(0.75 + rng.random() * 0.15, 2),
            "singability": round(0.80 + rng.random() * 0.15, 2),
            "rhymeTightness": round(0.70 + rng.random() * 0.20, 2),
        },
        "totalWordCount": total_word_count,
        "sectionOrder": section_order,
    }


def generate_mock_style(sds: Dict[str, Any], plan: Dict[str, Any], seed: int) -> Dict[str, Any]:
    """
    Generate deterministic STYLE artifact.

    Args:
        sds: Song Design Spec
        plan: Plan artifact
        seed: Deterministic seed

    Returns:
        Style artifact dictionary
    """
    rng = _deterministic_random(seed, "style")

    # Use SDS style as base
    sds_style = sds.get("style", {})

    # Generate deterministic genre detail
    genre_primary = sds_style.get("genre_detail", {}).get("primary", "pop")

    # Generate BPM (use SDS if available, otherwise deterministic)
    tempo_bpm = sds_style.get("tempo_bpm", rng.randint(100, 140))

    # Generate key
    keys = ["C major", "G major", "D major", "A major", "E major", "F major", "C minor", "A minor"]
    key_primary = sds_style.get("key", {}).get("primary", rng.choice(keys))

    # Generate mood
    moods = ["upbeat", "energetic", "melancholic", "joyful", "dramatic", "chill"]
    mood = sds_style.get("mood", [rng.choice(moods), rng.choice(moods)])

    # Generate tags (deterministic selection)
    all_tags = ["melodic", "catchy", "anthemic", "uplifting", "powerful", "smooth", "dreamy"]
    num_tags = rng.randint(2, 4)
    tags = rng.sample(all_tags, num_tags)

    return {
        "genre": genre_primary,
        "bpm": tempo_bpm,
        "key": key_primary,
        "mood": mood,
        "instrumentation": ["synth", "drums", "bass"],
        "tags": tags,
        "vocalStyle": "powerful",
        "energy": "high",
    }


def generate_mock_lyrics(
    sds: Dict[str, Any],
    plan: Dict[str, Any],
    style: Dict[str, Any],
    seed: int,
    context: Optional[MockWorkflowContext] = None
) -> Dict[str, Any]:
    """
    Generate deterministic LYRICS artifact with citations.

    Args:
        sds: Song Design Spec
        plan: Plan artifact
        style: Style artifact
        seed: Deterministic seed
        context: Optional workflow context for recording retrieval

    Returns:
        Lyrics artifact dictionary with citations
    """
    rng = _deterministic_random(seed, "lyrics")

    sections = []
    citations = []

    # Generate deterministic chunk hashes for retrieval simulation
    source_chunks = []
    num_chunks = rng.randint(3, 8)
    for i in range(num_chunks):
        chunk_text = f"Source chunk {i} for seed {seed}"
        chunk_hash = hashlib.sha256(chunk_text.encode()).hexdigest()
        source_chunks.append({
            "hash": f"sha256:{chunk_hash}",
            "text": chunk_text,
            "weight": round(rng.random(), 2)
        })

    # Record retrieval hashes if context provided
    if context:
        context.record_retrieval_hashes("LYRICS", [c["hash"] for c in source_chunks])

    # Generate sections from plan
    for section_info in plan["sections"]:
        section_id = section_info["id"]
        num_lines = rng.randint(4, 8)

        lines = []
        for line_idx in range(num_lines):
            # Deterministic line generation
            words = ["summer", "night", "love", "dream", "heart", "fire", "light", "soul"]
            line_words = [rng.choice(words) for _ in range(rng.randint(4, 8))]
            line_text = " ".join(line_words).capitalize()

            # Assign citation
            citation_id = f"cite-{section_id}-{line_idx}"
            chunk = rng.choice(source_chunks)

            lines.append({
                "text": line_text,
                "citations": [citation_id]
            })

            citations.append({
                "id": citation_id,
                "chunkHash": chunk["hash"],
                "sourceId": f"source-{rng.randint(1, 3)}",
                "text": chunk["text"],
                "weight": chunk["weight"],
                "section": section_id,
            })

        sections.append({
            "id": section_id,
            "type": section_info["type"],
            "lines": lines,
            "rhymeScheme": "ABAB" if rng.random() > 0.5 else "AABB",
        })

    return {
        "lyrics": {
            "sections": sections,
        },
        "citations": citations,
    }


def generate_mock_producer_notes(
    sds: Dict[str, Any],
    plan: Dict[str, Any],
    style: Dict[str, Any],
    seed: int
) -> Dict[str, Any]:
    """
    Generate deterministic PRODUCER artifact.

    Args:
        sds: Song Design Spec
        plan: Plan artifact
        style: Style artifact
        seed: Deterministic seed

    Returns:
        Producer notes artifact dictionary
    """
    rng = _deterministic_random(seed, "producer")

    arrangement = {}
    for section in plan["sections"]:
        section_id = section["id"]
        section_type = section["type"]

        if section_type == "intro":
            arrangement[section_id] = "Sparse instrumentation, gradual build"
        elif section_type == "verse":
            arrangement[section_id] = "Full band, vocals forward"
        elif section_type == "chorus":
            arrangement[section_id] = "Maximum energy, layered vocals"
        elif section_type == "bridge":
            arrangement[section_id] = "Dynamic shift, half-time feel"
        else:
            arrangement[section_id] = "Standard arrangement"

    return {
        "producer_notes": {
            "arrangement": arrangement,
            "mixTargets": {
                "vocalLevel": rng.choice(["prominent", "balanced", "subtle"]),
                "bassPresence": rng.choice(["heavy", "medium", "light"]),
                "dynamicRange": "moderate compression",
            },
        },
        "structure": {
            "sectionOrder": plan["sectionOrder"],
            "durations": {s["id"]: s["durationTarget"] for s in plan["sections"]},
        },
    }


def generate_mock_composed_prompt(
    style: Dict[str, Any],
    lyrics: Dict[str, Any],
    producer_notes: Dict[str, Any],
    seed: int
) -> Dict[str, Any]:
    """
    Generate deterministic COMPOSED_PROMPT artifact.

    Args:
        style: Style artifact
        lyrics: Lyrics artifact (with sections)
        producer_notes: Producer notes artifact
        seed: Deterministic seed

    Returns:
        Composed prompt artifact dictionary
    """
    rng = _deterministic_random(seed, "compose")

    # Build prompt text from artifacts
    prompt_parts = []

    # Style section
    prompt_parts.append(f"Genre: {style['genre']}, BPM: {style['bpm']}, Key: {style['key']}")
    prompt_parts.append(f"Mood: {', '.join(style['mood'])}")
    prompt_parts.append(f"Tags: {', '.join(style['tags'])}")

    # Lyrics sections
    for section in lyrics.get("sections", []):
        prompt_parts.append(f"\n[{section['type'].title()}]")
        for line in section["lines"]:
            prompt_parts.append(line["text"])

    # Producer notes
    prompt_parts.append("\nProduction Notes:")
    for section_id, notes in producer_notes.get("arrangement", {}).items():
        prompt_parts.append(f"{section_id}: {notes}")

    prompt_text = "\n".join(prompt_parts)

    return {
        "composed_prompt": {
            "text": prompt_text,
            "sections": [
                {
                    "marker": f"[{s['type'].title()}]",
                    "content": "\n".join([line["text"] for line in s["lines"]])
                }
                for s in lyrics.get("sections", [])
            ],
            "metadata": {
                "genre": style["genre"],
                "bpm": style["bpm"],
                "key": style["key"],
            },
        },
        "char_count": len(prompt_text),
        "truncated": False,
    }


def generate_mock_validation_report(
    lyrics: Dict[str, Any],
    style: Dict[str, Any],
    producer_notes: Dict[str, Any],
    composed_prompt: Dict[str, Any],
    seed: int
) -> Dict[str, Any]:
    """
    Generate deterministic VALIDATION report.

    Args:
        lyrics: Lyrics artifact
        style: Style artifact
        producer_notes: Producer notes artifact
        composed_prompt: Composed prompt artifact
        seed: Deterministic seed

    Returns:
        Validation report dictionary
    """
    rng = _deterministic_random(seed, "validate")

    # Generate deterministic scores
    scores = {
        "hookDensity": round(0.75 + rng.random() * 0.20, 2),
        "singability": round(0.80 + rng.random() * 0.15, 2),
        "rhymeTightness": round(0.70 + rng.random() * 0.25, 2),
        "sectionCompleteness": round(0.85 + rng.random() * 0.15, 2),
        "profanityScore": 1.0,  # Always pass
    }

    # Weighted total
    weights = {
        "hookDensity": 0.3,
        "singability": 0.25,
        "rhymeTightness": 0.2,
        "sectionCompleteness": 0.15,
        "profanityScore": 0.1,
    }

    total_score = sum(scores[k] * weights[k] for k in scores.keys())
    passed = total_score >= 0.85

    return {
        "validation_report": {
            "timestamp": "2025-11-19T00:00:00Z",
            "rubricVersion": "test-v1.0",
            "metrics": {
                metric: {
                    "score": score,
                    "weight": weights[metric],
                    "threshold": 0.75,
                    "passed": score >= 0.75,
                    "notes": f"Deterministic score for seed {seed}"
                }
                for metric, score in scores.items()
            },
            "policyChecks": {
                "profanity": {"passed": True, "flags": []},
                "length": {"passed": True, "actualDuration": 210, "targetDuration": 210},
                "conflicts": {"passed": True, "conflicts": []},
            },
        },
        "scores": scores,
        "total_score": round(total_score, 2),
        "passed": passed,
        "issues": [] if passed else [{"metric": "total_score", "reason": "Below threshold"}],
    }


# =============================================================================
# Node Execution
# =============================================================================

def run_node_deterministic(
    node: WorkflowNodeConfig,
    sds: Dict[str, Any],
    artifacts: Dict[str, Any],
    context: MockWorkflowContext,
) -> Dict[str, Any]:
    """
    Execute a single workflow node deterministically.

    Args:
        node: Node configuration
        sds: Song Design Spec
        artifacts: Previously generated artifacts
        context: Workflow context for seed and tracking

    Returns:
        Node output artifact
    """
    node_seed = context.get_node_seed(node.index)

    # Record decoder settings for LLM nodes
    if node.requires_llm:
        context.record_decoder_settings(node.name, EXPECTED_DECODER_SETTINGS)

    # Generate artifact based on node type
    if node.name == "PLAN":
        return generate_mock_plan(sds, node_seed)

    elif node.name == "STYLE":
        plan = artifacts.get("plan", {})
        return generate_mock_style(sds, plan, node_seed)

    elif node.name == "LYRICS":
        plan = artifacts.get("plan", {})
        style = artifacts.get("style", {})
        return generate_mock_lyrics(sds, plan, style, node_seed, context)

    elif node.name == "PRODUCER":
        plan = artifacts.get("plan", {})
        style = artifacts.get("style", {})
        return generate_mock_producer_notes(sds, plan, style, node_seed)

    elif node.name == "COMPOSE":
        style = artifacts.get("style", {})
        lyrics = artifacts.get("lyrics", {})
        producer_notes = artifacts.get("producer_notes", {})
        return generate_mock_composed_prompt(style, lyrics, producer_notes, node_seed)

    elif node.name == "VALIDATE":
        lyrics = artifacts.get("lyrics", {})
        style = artifacts.get("style", {})
        producer_notes = artifacts.get("producer_notes", {})
        composed_prompt = artifacts.get("composed_prompt", {})
        return generate_mock_validation_report(lyrics, style, producer_notes, composed_prompt, node_seed)

    elif node.name == "FIX":
        # FIX node not executed in determinism tests (autofix disabled)
        return {}

    elif node.name == "REVIEW":
        # REVIEW just packages everything
        return {
            "summary": {
                "runId": context.run_id,
                "songId": context.song_id,
                "status": "success",
                "finalScore": artifacts.get("validation_report", {}).get("total_score", 0.0),
                "passed": artifacts.get("validation_report", {}).get("passed", False),
                "iterations": 0,
            },
            "provenance": {
                "artifactHashes": {
                    name: hash_artifact(artifact)
                    for name, artifact in artifacts.items()
                    if isinstance(artifact, dict) and name != "validation_report"
                },
                "seed": context.seed,
                "featureFlags": context.feature_flags,
            },
        }

    else:
        raise ValueError(f"Unknown node: {node.name}")


# =============================================================================
# Full Workflow Execution
# =============================================================================

def run_workflow_deterministic(
    sds: Dict[str, Any],
    seed: int,
    run_id: str = "test-run",
    song_id: str = "test-song",
) -> Dict[str, Any]:
    """
    Execute full AMCS workflow deterministically.

    This is a mock workflow that produces deterministic outputs for testing purposes.
    It simulates the actual workflow but uses simplified, deterministic logic.

    Args:
        sds: Song Design Spec
        seed: Base seed for deterministic generation
        run_id: Optional run ID
        song_id: Optional song ID

    Returns:
        Dictionary containing:
        - artifacts: All generated artifacts (plan, style, lyrics, etc.)
        - context: Workflow context with seed tracking
        - validation_report: Final validation report
    """
    context = MockWorkflowContext(run_id, song_id, seed)

    artifacts = {}

    # Execute nodes in order (excluding FIX for determinism)
    for node in WORKFLOW_NODES:
        if node.name == "FIX":
            continue  # Skip FIX node (autofix disabled for determinism)

        artifact = run_node_deterministic(node, sds, artifacts, context)

        # Store artifact
        if node.name == "LYRICS":
            artifacts["lyrics"] = artifact.get("lyrics", {})
            artifacts["citations"] = artifact.get("citations", [])
        elif node.name == "PRODUCER":
            artifacts["producer_notes"] = artifact.get("producer_notes", {})
            artifacts["structure"] = artifact.get("structure", {})
        elif node.name == "COMPOSE":
            artifacts["composed_prompt"] = artifact.get("composed_prompt", {})
        elif node.name == "VALIDATE":
            artifacts["validation_report"] = artifact.get("validation_report", {})
            artifacts["scores"] = artifact.get("scores", {})
            artifacts["total_score"] = artifact.get("total_score", 0.0)
            artifacts["passed"] = artifact.get("passed", False)
        elif node.name == "REVIEW":
            artifacts["summary"] = artifact.get("summary", {})
            artifacts["provenance"] = artifact.get("provenance", {})
        else:
            artifacts[node.name.lower()] = artifact

    return {
        "artifacts": artifacts,
        "context": context,
        "validation_report": artifacts.get("validation_report", {}),
    }
