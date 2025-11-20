#!/usr/bin/env python3
"""Blueprint seeder script.

This script parses all blueprint markdown files from docs/hit_song_blueprint/AI/
and populates the database with structured blueprint data.

Usage:
    # From services/api directory:
    uv run python -m app.scripts.seed_blueprints

    # With custom blueprint directory:
    uv run python -m app.scripts.seed_blueprints --blueprint-dir=/path/to/blueprints

    # Dry run (parse only, don't insert):
    uv run python -m app.scripts.seed_blueprints --dry-run

    # Force update existing blueprints:
    uv run python -m app.scripts.seed_blueprints --force
"""

import argparse
import logging
import sys
from pathlib import Path
from typing import List, Dict, Any
from uuid import UUID

import structlog

# System UUID for system-level blueprints (not owned by any specific tenant/user)
SYSTEM_UUID = UUID('00000000-0000-0000-0000-000000000000')

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import SessionLocal
from app.models.blueprint import Blueprint
from app.repositories.blueprint_repo import BlueprintRepository
from app.core.security import SecurityContext
from app.utils.blueprint_parser import parse_all_blueprints, BlueprintParseError

logger = structlog.get_logger(__name__)


def find_blueprint_directory() -> Path:
    """Find the blueprint directory relative to the project root.

    Returns:
        Path to blueprint directory

    Raises:
        FileNotFoundError: If directory cannot be found
    """
    # Try to find from API directory
    api_dir = Path(__file__).parent.parent.parent  # services/api
    project_root = api_dir.parent.parent  # MeatyMusic root

    blueprint_dir = project_root / "docs" / "hit_song_blueprint" / "AI"

    if not blueprint_dir.exists():
        raise FileNotFoundError(
            f"Blueprint directory not found at {blueprint_dir}. "
            "Please specify with --blueprint-dir"
        )

    return blueprint_dir


def seed_blueprint(
    db_session,
    blueprint_data: Dict[str, Any],
    force: bool = False
) -> tuple[bool, str]:
    """Insert or update a single blueprint in the database.

    Args:
        db_session: Database session
        blueprint_data: Parsed blueprint data
        force: If True, update existing blueprints

    Returns:
        Tuple of (success: bool, message: str)
    """
    genre = blueprint_data["genre"]
    version = blueprint_data["version"]

    # Create repository with system context
    # Use SYSTEM_UUID for both user_id and tenant_id to access system blueprints
    security_context = SecurityContext(user_id=SYSTEM_UUID, tenant_id=SYSTEM_UUID)
    blueprint_repo = BlueprintRepository(
        db=db_session,
        security_context=security_context
    )

    try:
        # Check if blueprint already exists
        existing_blueprints = blueprint_repo.get_by_genre(genre)

        # Filter for exact version match
        existing = None
        for bp in existing_blueprints:
            if bp.version == version:
                existing = bp
                break

        if existing and not force:
            return False, f"Blueprint '{genre}' version {version} already exists (use --force to update)"

        if existing and force:
            # Update existing blueprint
            logger.info(
                "seed_blueprints.updating",
                genre=genre,
                version=version,
                blueprint_id=str(existing.id)
            )

            # Update fields
            existing.rules = blueprint_data["rules"]
            existing.eval_rubric = blueprint_data["eval_rubric"]
            existing.conflict_matrix = blueprint_data["conflict_matrix"]
            existing.tag_categories = blueprint_data["tag_categories"]
            existing.extra_metadata = blueprint_data["extra_metadata"]

            db_session.commit()

            return True, f"Updated blueprint '{genre}' version {version}"

        else:
            # Create new blueprint
            logger.info(
                "seed_blueprints.creating",
                genre=genre,
                version=version
            )

            blueprint = Blueprint(
                genre=blueprint_data["genre"],
                version=blueprint_data["version"],
                rules=blueprint_data["rules"],
                eval_rubric=blueprint_data["eval_rubric"],
                conflict_matrix=blueprint_data["conflict_matrix"],
                tag_categories=blueprint_data["tag_categories"],
                extra_metadata=blueprint_data["extra_metadata"],
                tenant_id=SYSTEM_UUID,  # System blueprint
                owner_id=SYSTEM_UUID,   # System blueprint
            )

            db_session.add(blueprint)
            db_session.commit()

            return True, f"Created blueprint '{genre}' version {version}"

    except Exception as e:
        db_session.rollback()
        logger.error(
            "seed_blueprints.failed",
            genre=genre,
            error=str(e),
            exc_info=True
        )
        return False, f"Failed to seed '{genre}': {e}"


def main():
    """Main seeder entry point."""
    parser = argparse.ArgumentParser(
        description="Seed blueprint database from markdown files"
    )
    parser.add_argument(
        "--blueprint-dir",
        type=Path,
        help="Path to blueprint markdown directory (default: auto-detect)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse files but don't insert into database"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Update existing blueprints instead of skipping them"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    # Configure logging
    if args.verbose:
        structlog.configure(
            wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        )

    logger.info("seed_blueprints.starting", dry_run=args.dry_run, force=args.force)

    # Find blueprint directory
    try:
        if args.blueprint_dir:
            blueprint_dir = args.blueprint_dir
        else:
            blueprint_dir = find_blueprint_directory()

        logger.info("seed_blueprints.directory", path=str(blueprint_dir))

    except FileNotFoundError as e:
        logger.error("seed_blueprints.directory_not_found", error=str(e))
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    # Parse blueprint files
    try:
        blueprints = parse_all_blueprints(blueprint_dir)

        if not blueprints:
            logger.warning("seed_blueprints.no_blueprints_parsed")
            print("No blueprints were successfully parsed.", file=sys.stderr)
            sys.exit(1)

        logger.info("seed_blueprints.parsed", count=len(blueprints))

    except Exception as e:
        logger.error("seed_blueprints.parse_failed", error=str(e), exc_info=True)
        print(f"ERROR: Failed to parse blueprints: {e}", file=sys.stderr)
        sys.exit(1)

    # Dry run mode - just print what would be done
    if args.dry_run:
        print("\n=== DRY RUN MODE ===")
        print(f"Would seed {len(blueprints)} blueprints:\n")
        for bp in blueprints:
            print(f"  - {bp['genre']} (v{bp['version']})")
            print(f"    Tempo: {bp['rules']['tempo_bpm']}")
            print(f"    Sections: {', '.join(bp['rules']['required_sections'])}")
            print(f"    Keys: {', '.join(bp['rules']['key_preferences'][:3])}...")
            print()
        print("=== END DRY RUN ===")
        sys.exit(0)

    # Seed database
    db_session = SessionLocal()
    results = {
        "created": [],
        "updated": [],
        "skipped": [],
        "failed": [],
    }

    try:
        for blueprint_data in blueprints:
            success, message = seed_blueprint(db_session, blueprint_data, force=args.force)

            genre = blueprint_data["genre"]

            if success:
                if "Updated" in message:
                    results["updated"].append(genre)
                else:
                    results["created"].append(genre)
                logger.info("seed_blueprints.result", status="success", message=message)
            else:
                if "already exists" in message:
                    results["skipped"].append(genre)
                else:
                    results["failed"].append(genre)
                logger.warning("seed_blueprints.result", status="skipped", message=message)

            print(message)

    finally:
        db_session.close()

    # Print summary
    print("\n" + "=" * 60)
    print("SEEDING SUMMARY")
    print("=" * 60)
    print(f"Created:  {len(results['created'])}")
    if results['created']:
        for genre in results['created']:
            print(f"  ✓ {genre}")

    print(f"\nUpdated:  {len(results['updated'])}")
    if results['updated']:
        for genre in results['updated']:
            print(f"  ↻ {genre}")

    print(f"\nSkipped:  {len(results['skipped'])}")
    if results['skipped']:
        for genre in results['skipped']:
            print(f"  ○ {genre}")

    print(f"\nFailed:   {len(results['failed'])}")
    if results['failed']:
        for genre in results['failed']:
            print(f"  ✗ {genre}")

    print("=" * 60)

    # Exit with error code if any failed
    if results['failed']:
        sys.exit(1)
    else:
        logger.info(
            "seed_blueprints.complete",
            created=len(results['created']),
            updated=len(results['updated']),
            skipped=len(results['skipped'])
        )
        sys.exit(0)


if __name__ == "__main__":
    main()
