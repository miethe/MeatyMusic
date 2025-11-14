"""SDS Compiler Service - Aggregates entities into Song Design Spec.

This service transforms entity references into a complete, validated SDS JSON
following the deterministic compilation algorithm.
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
import hashlib
import json
import structlog

from app.repositories.song_repo import SongRepository
from app.repositories.style_repo import StyleRepository
from app.repositories.lyrics_repo import LyricsRepository
from app.repositories.producer_notes_repo import ProducerNotesRepository
from app.repositories.persona_repo import PersonaRepository
from app.repositories.blueprint_repo import BlueprintRepository
from app.repositories.source_repo import SourceRepository
from app.services.validation_service import ValidationService

logger = structlog.get_logger(__name__)


class SDSCompilerService:
    """Service for compiling entity references into Song Design Spec."""

    def __init__(
        self,
        song_repo: SongRepository,
        style_repo: StyleRepository,
        lyrics_repo: LyricsRepository,
        producer_notes_repo: ProducerNotesRepository,
        persona_repo: PersonaRepository,
        blueprint_repo: BlueprintRepository,
        source_repo: SourceRepository,
        validation_service: ValidationService,
    ):
        """Initialize SDS compiler with all required repositories."""
        self.song_repo = song_repo
        self.style_repo = style_repo
        self.lyrics_repo = lyrics_repo
        self.producer_notes_repo = producer_notes_repo
        self.persona_repo = persona_repo
        self.blueprint_repo = blueprint_repo
        self.source_repo = source_repo
        self.validation_service = validation_service

    def compile_sds(
        self,
        song_id: UUID,
        validate: bool = True
    ) -> Dict[str, Any]:
        """Compile SDS from song entity references.

        Args:
            song_id: Song UUID
            validate: Whether to run full validation (default: True)

        Returns:
            Complete SDS dictionary

        Raises:
            ValueError: If entity references invalid or validation fails
        """
        # 1. Fetch all entities in single query
        entities = self.song_repo.get_with_all_entities_for_sds(song_id)
        if not entities:
            raise ValueError(f"Song {song_id} not found or inaccessible")

        song = entities["song"]

        # 2. Validate all required entities exist
        self._validate_entity_references(entities)

        # 3. Build SDS structure
        sds = self._build_sds_structure(song, entities)

        # 4. Normalize source weights
        if sds["sources"]:
            sds["sources"] = self._normalize_source_weights(sds["sources"])

        # 5. Validate SDS against JSON schema
        if validate:
            is_valid, errors = self.validation_service.validate_sds(sds)
            if not is_valid:
                raise ValueError(f"SDS validation failed: {'; '.join(errors)}")

        # 6. Compute deterministic hash
        sds_hash = self._compute_sds_hash(sds)

        logger.info(
            "sds.compiled",
            song_id=str(song_id),
            sds_hash=sds_hash,
            source_count=len(sds["sources"]),
            seed=sds["seed"]
        )

        return sds

    def _validate_entity_references(self, entities: Dict[str, Any]) -> None:
        """Validate all required entity references exist."""
        required = {
            "style": "Style specification",
            "lyrics": "Lyrics",
            "producer_notes": "Producer notes",
            "blueprint": "Blueprint"
        }

        for key, name in required.items():
            if not entities.get(key):
                raise ValueError(f"{name} is required but not found")

    def _build_sds_structure(
        self,
        song: Any,
        entities: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build complete SDS structure from entities."""
        style = entities["style"]
        lyrics = entities["lyrics"]
        producer_notes = entities["producer_notes"]
        blueprint = entities["blueprint"]
        persona = entities.get("persona")
        sources = entities.get("sources", [])

        # Convert ORM models to dict representations
        style_dict = self._style_to_dict(style)
        lyrics_dict = self._lyrics_to_dict(lyrics)
        producer_notes_dict = self._producer_notes_to_dict(producer_notes)
        sources_list = [self._source_to_dict(src) for src in sources]

        # Build SDS following schema
        sds = {
            "title": song.title,
            "blueprint_ref": {
                "genre": blueprint.genre,
                "version": blueprint.version
            },
            "style": style_dict,
            "lyrics": lyrics_dict,
            "producer_notes": producer_notes_dict,
            "persona_id": str(persona.id) if persona else None,
            "sources": sources_list,
            "prompt_controls": song.render_config.get("prompt_controls", {
                "positive_tags": [],
                "negative_tags": [],
                "max_style_chars": 1000,
                "max_prompt_chars": 5000
            }) if song.render_config else {
                "positive_tags": [],
                "negative_tags": [],
                "max_style_chars": 1000,
                "max_prompt_chars": 5000
            },
            "render": song.render_config.get("render", {
                "engine": "none",
                "model": None,
                "num_variations": 2
            }) if song.render_config else {
                "engine": "none",
                "model": None,
                "num_variations": 2
            },
            "seed": song.global_seed
        }

        return sds

    def _style_to_dict(self, style: Any) -> Dict[str, Any]:
        """Convert Style ORM model to SDS style format."""
        # Build tempo_bpm (single int or range)
        if style.bpm_min and style.bpm_max:
            if style.bpm_min == style.bpm_max:
                tempo_bpm = style.bpm_min
            else:
                tempo_bpm = [style.bpm_min, style.bpm_max]
        elif style.bpm_min:
            tempo_bpm = style.bpm_min
        elif style.bpm_max:
            tempo_bpm = style.bpm_max
        else:
            # Default tempo if none specified
            tempo_bpm = 120

        # Build key structure
        key_dict = {
            "primary": style.key or "C major",
            "modulations": style.modulations or []
        }

        # Build genre detail
        genre_detail = {
            "primary": style.genre,
            "subgenres": style.sub_genres or [],
            "fusions": []  # Not in current model, can be added later
        }

        # Map energy level to energy enum
        energy_map = {
            None: None,
            1: "low", 2: "low", 3: "low",
            4: "medium", 5: "medium", 6: "medium", 7: "medium",
            8: "high", 9: "high",
            10: "anthemic"
        }
        energy = energy_map.get(style.energy_level)

        # Build vocal profile string from JSONB
        vocal_profile = None
        if style.vocal_profile and isinstance(style.vocal_profile, dict):
            # Convert vocal_profile dict to descriptive string
            parts = []
            if style.vocal_profile.get("voice"):
                parts.append(style.vocal_profile["voice"])
            if style.vocal_profile.get("range"):
                parts.append(f"({style.vocal_profile['range']})")
            if style.vocal_profile.get("delivery"):
                parts.append(style.vocal_profile["delivery"])
            vocal_profile = " ".join(parts) if parts else None

        result = {
            "genre_detail": genre_detail,
            "tempo_bpm": tempo_bpm,
            "time_signature": "4/4",  # Default, can be added to model later
            "key": key_dict,
            "mood": style.mood or ["neutral"],
            "instrumentation": (style.instrumentation or [])[:3],  # Max 3 per schema
            "tags": style.tags_positive or []
        }

        # Add optional fields only if present
        if energy:
            result["energy"] = energy
        if vocal_profile:
            result["vocal_profile"] = vocal_profile
        if style.tags_negative:
            result["negative_tags"] = style.tags_negative

        return result

    def _lyrics_to_dict(self, lyrics: Any) -> Dict[str, Any]:
        """Convert Lyrics ORM model to SDS lyrics format."""
        # Build constraints object from JSONB field and explicit_allowed
        constraints = lyrics.constraints.copy() if lyrics.constraints else {}

        # Ensure explicit field is present (from explicit_allowed boolean)
        if "explicit" not in constraints:
            constraints["explicit"] = lyrics.explicit_allowed or False

        result = {
            "language": lyrics.language or "en",
            "section_order": lyrics.section_order or [],
            "constraints": constraints
        }

        # Add optional fields only if present
        if lyrics.pov:
            result["pov"] = lyrics.pov
        if lyrics.tense:
            result["tense"] = lyrics.tense
        if lyrics.themes:
            result["themes"] = lyrics.themes
        if lyrics.rhyme_scheme:
            result["rhyme_scheme"] = lyrics.rhyme_scheme
        if lyrics.meter:
            result["meter"] = lyrics.meter
        if lyrics.syllables_per_line:
            result["syllables_per_line"] = lyrics.syllables_per_line
        if lyrics.hook_strategy:
            result["hook_strategy"] = lyrics.hook_strategy

        # Map repetition_rules JSONB to repetition_policy string
        if lyrics.repetition_rules:
            # Try to extract a policy string or default based on rules
            if isinstance(lyrics.repetition_rules, dict):
                hook_count = lyrics.repetition_rules.get("hook_count", 0)
                if hook_count >= 4:
                    result["repetition_policy"] = "hook-heavy"
                elif hook_count >= 2:
                    result["repetition_policy"] = "moderate"
                else:
                    result["repetition_policy"] = "sparse"

        if lyrics.imagery_density is not None:
            # Convert 1-10 scale to 0.0-1.0 scale
            result["imagery_density"] = lyrics.imagery_density / 10.0
        if lyrics.reading_level is not None:
            result["reading_level"] = str(lyrics.reading_level)
        if lyrics.source_citations:
            result["source_citations"] = lyrics.source_citations

        return result

    def _producer_notes_to_dict(self, producer_notes: Any) -> Dict[str, Any]:
        """Convert ProducerNotes ORM model to SDS producer notes format."""
        # Build structure string
        if producer_notes.structure_string:
            structure = producer_notes.structure_string
        elif producer_notes.structure:
            # Convert array to string
            if isinstance(producer_notes.structure, list):
                structure = "–".join(producer_notes.structure)
            else:
                structure = str(producer_notes.structure)
        else:
            structure = ""

        result = {
            "structure": structure,
            "hooks": producer_notes.hook_count or 0
        }

        # Add optional fields only if present
        if producer_notes.instrumentation_hints:
            # Extract global instrumentation if available
            hints = producer_notes.instrumentation_hints
            if isinstance(hints, dict) and hints.get("global"):
                result["instrumentation"] = hints["global"]
            elif isinstance(hints, list):
                result["instrumentation"] = hints

        # Build section_meta from section_tags and section_durations
        if producer_notes.section_tags or producer_notes.section_durations:
            section_meta = {}

            # Merge tags
            if producer_notes.section_tags:
                for section, tags in producer_notes.section_tags.items():
                    if section not in section_meta:
                        section_meta[section] = {}
                    section_meta[section]["tags"] = tags

            # Merge durations
            if producer_notes.section_durations:
                for section, duration in producer_notes.section_durations.items():
                    if section not in section_meta:
                        section_meta[section] = {}
                    section_meta[section]["target_duration_sec"] = duration

            if section_meta:
                result["section_meta"] = section_meta

        # Build mix object from mix_targets
        if producer_notes.mix_targets:
            mix = {}
            targets = producer_notes.mix_targets

            if targets.get("loudness_lufs"):
                mix["lufs"] = targets["loudness_lufs"]
            if targets.get("space"):
                mix["space"] = targets["space"]
            if targets.get("stereo_width"):
                mix["stereo_width"] = targets["stereo_width"]

            if mix:
                result["mix"] = mix

        return result

    def _source_to_dict(self, source: Any) -> Dict[str, Any]:
        """Convert Source ORM model to SDS source format."""
        return {
            "name": source.name,
            "kind": source.kind,
            "config": source.config or {},
            "scopes": source.scopes or [],
            "weight": float(source.weight) if source.weight else 0.5,
            "allow": source.allow or [],
            "deny": source.deny or [],
            "provenance": source.provenance if source.provenance is not None else True,
            "mcp_server_id": source.mcp_server_id
        }

    def _normalize_source_weights(
        self,
        sources: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Normalize source weights to sum to 1.0."""
        if not sources:
            return []

        total_weight = sum(src.get("weight", 0) for src in sources)

        if total_weight <= 0:
            # Equal weighting if all weights are 0 or negative
            equal_weight = 1.0 / len(sources)
            for src in sources:
                src["weight"] = round(equal_weight, 4)
        else:
            # Normalize to sum to 1.0
            for src in sources:
                src["weight"] = round(src.get("weight", 0) / total_weight, 4)

        logger.debug(
            "sds.weights_normalized",
            source_count=len(sources),
            total_weight=sum(src["weight"] for src in sources)
        )

        return sources

    def _compute_sds_hash(self, sds: Dict[str, Any]) -> str:
        """Compute SHA-256 hash of SDS for determinism verification.

        Excludes computed/metadata fields from hash calculation.
        """
        # Copy and remove non-deterministic fields
        sds_copy = {
            k: v for k, v in sds.items()
            if k not in ["_computed_hash", "compiled_at", "compiler_version"]
        }

        # Canonical JSON (sorted keys)
        canonical = json.dumps(sds_copy, sort_keys=True)

        return hashlib.sha256(canonical.encode()).hexdigest()
