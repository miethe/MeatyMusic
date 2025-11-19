"""Blueprint Database Seeder Script.

This script populates the blueprints table with data parsed from
genre blueprint markdown files in docs/hit_song_blueprint/AI/.

The script is idempotent - it can be run multiple times without creating
duplicates. It will:
1. Parse all blueprint markdown files
2. Check if blueprint already exists (by genre + version)
3. Create new blueprint if not exists, or update existing
4. Report results with counts of created/updated/skipped blueprints

Usage:
    uv run --project services/api python -m scripts.seed_blueprints

    Options:
        --force: Force update all existing blueprints
        --dry-run: Parse and display data without writing to database
        --genre <name>: Seed only a specific genre
"""

import argparse
import sys
from pathlib import Path
from typing import Dict, Any, List

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import structlog

from app.services.blueprint_parser_service import BlueprintParserService

# Configure logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger(__name__)


class BlueprintSeeder:
    """Service for seeding blueprints from markdown files to database."""

    def __init__(self, db_session, force_update: bool = False):
        """Initialize seeder with database session.

        Args:
            db_session: SQLAlchemy database session
            force_update: If True, update existing blueprints even if they exist
        """
        self.db = db_session
        self.parser = BlueprintParserService()

        # Create repository with security context (use system/admin context for seeding)
        # For seeding, we use a system tenant/owner
        self.security_context = SecurityContext(
            tenant_id=None,  # System-level blueprints
            owner_id=None    # System-level blueprints
        )

        self.repository = BlueprintRepository(
            db=self.db,
            security_context=self.security_context
        )

        self.force_update = force_update

        # Track statistics
        self.stats = {
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'failed': 0,
            'total_attempted': 0
        }

    def seed_all_blueprints(self, specific_genre: str = None) -> Dict[str, Any]:
        """Seed all blueprint genres to database.

        Args:
            specific_genre: If provided, only seed this genre

        Returns:
            Dict with seeding statistics
        """
        # Get all available genres
        if specific_genre:
            genres = [specific_genre]
            logger.info("seeder.specific_genre", genre=specific_genre)
        else:
            genres = self.parser.get_all_blueprint_genres()
            logger.info("seeder.starting", genre_count=len(genres), genres=genres)

        # Process each genre
        for genre in genres:
            self.stats['total_attempted'] += 1

            try:
                self._seed_blueprint(genre)
            except Exception as e:
                self.stats['failed'] += 1
                logger.error(
                    "seeder.genre_failed",
                    genre=genre,
                    error=str(e),
                    exc_info=True
                )

        # Commit all changes
        try:
            self.db.commit()
            logger.info("seeder.committed", stats=self.stats)
        except Exception as e:
            self.db.rollback()
            logger.error("seeder.commit_failed", error=str(e), exc_info=True)
            raise

        return self.stats

    def _seed_blueprint(self, genre: str) -> None:
        """Seed a single blueprint genre.

        Args:
            genre: Genre name to seed
        """
        logger.info("seeder.processing_genre", genre=genre)

        # Parse blueprint markdown file
        try:
            blueprint_data = self.parser.parse_blueprint_file(genre)
        except Exception as e:
            logger.error(
                "seeder.parse_failed",
                genre=genre,
                error=str(e)
            )
            raise

        # Check if blueprint already exists
        existing_blueprints = self.repository.get_by_genre(genre)

        # Filter by version
        version = blueprint_data['version']
        existing_blueprint = None
        for bp in existing_blueprints:
            if bp.version == version:
                existing_blueprint = bp
                break

        if existing_blueprint:
            if self.force_update:
                # Update existing blueprint
                self._update_blueprint(existing_blueprint, blueprint_data)
                self.stats['updated'] += 1
                logger.info(
                    "seeder.updated",
                    genre=genre,
                    version=version,
                    blueprint_id=str(existing_blueprint.id)
                )
            else:
                # Skip existing blueprint
                self.stats['skipped'] += 1
                logger.info(
                    "seeder.skipped",
                    genre=genre,
                    version=version,
                    reason="already_exists"
                )
        else:
            # Create new blueprint
            self._create_blueprint(blueprint_data)
            self.stats['created'] += 1
            logger.info(
                "seeder.created",
                genre=genre,
                version=version
            )

    def _create_blueprint(self, blueprint_data: Dict[str, Any]) -> Blueprint:
        """Create a new blueprint in database.

        Args:
            blueprint_data: Parsed blueprint data

        Returns:
            Created Blueprint entity
        """
        # Use create method which handles tenant_id and owner_id via repository
        blueprint = self.repository.create(blueprint_data)

        logger.debug(
            "seeder.blueprint_created",
            genre=blueprint.genre,
            version=blueprint.version,
            blueprint_id=str(blueprint.id)
        )

        return blueprint

    def _update_blueprint(
        self,
        existing_blueprint: Blueprint,
        blueprint_data: Dict[str, Any]
    ) -> Blueprint:
        """Update an existing blueprint in database.

        Args:
            existing_blueprint: Existing blueprint entity
            blueprint_data: New blueprint data

        Returns:
            Updated Blueprint entity
        """
        # Update fields
        update_data = {
            'rules': blueprint_data['rules'],
            'eval_rubric': blueprint_data['eval_rubric'],
            'conflict_matrix': blueprint_data['conflict_matrix'],
            'tag_categories': blueprint_data['tag_categories'],
            'extra_metadata': blueprint_data['extra_metadata']
        }

        updated = self.repository.update(existing_blueprint.id, update_data)

        logger.debug(
            "seeder.blueprint_updated",
            genre=updated.genre,
            version=updated.version,
            blueprint_id=str(updated.id)
        )

        return updated


def main():
    """Main entry point for seeder script."""
    arg_parser = argparse.ArgumentParser(
        description="Seed blueprint database from markdown files"
    )
    arg_parser.add_argument(
        '--force',
        action='store_true',
        help='Force update existing blueprints'
    )
    arg_parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Parse files without writing to database'
    )
    arg_parser.add_argument(
        '--genre',
        type=str,
        help='Seed only a specific genre (e.g., "pop", "hip-hop")'
    )

    args = arg_parser.parse_args()

    logger.info(
        "seeder.started",
        force=args.force,
        dry_run=args.dry_run,
        specific_genre=args.genre
    )

    if args.dry_run:
        # Dry run mode - parse and display without database writes
        parser_service = BlueprintParserService()

        if args.genre:
            genres = [args.genre]
        else:
            genres = parser_service.get_all_blueprint_genres()

        print(f"\n=== DRY RUN MODE ===")
        print(f"Found {len(genres)} blueprint files to process\n")

        for genre in genres:
            try:
                data = parser_service.parse_blueprint_file(genre)
                print(f"✓ {genre}: version={data['version']}")
                print(f"  - Tempo: {data['rules'].get('tempo_bpm')}")
                print(f"  - Sections: {data['rules'].get('required_sections')}")
                print(f"  - Length: {data['rules'].get('length_minutes')} min")
                print()
            except Exception as e:
                print(f"✗ {genre}: FAILED - {str(e)}\n")

        print("=== DRY RUN COMPLETE (no database changes) ===\n")
        return

    # Real seeding mode - connect to database
    try:
        # Import here to avoid loading config in dry-run mode
        from app.core.config import get_settings
        from app.repositories.blueprint_repo import BlueprintRepository
        from app.models.blueprint import Blueprint
        from app.schemas.blueprint import BlueprintCreate
        from app.core.security_context import SecurityContext

        # Get database settings
        settings = get_settings()

        # Create database engine and session
        engine = create_engine(settings.database_url)
        SessionLocal = sessionmaker(bind=engine)
        db_session = SessionLocal()

        try:
            # Create seeder and run
            seeder = BlueprintSeeder(
                db_session=db_session,
                force_update=args.force
            )

            stats = seeder.seed_all_blueprints(specific_genre=args.genre)

            # Print results
            print("\n=== BLUEPRINT SEEDING COMPLETE ===")
            print(f"Total attempted: {stats['total_attempted']}")
            print(f"Created:         {stats['created']}")
            print(f"Updated:         {stats['updated']}")
            print(f"Skipped:         {stats['skipped']}")
            print(f"Failed:          {stats['failed']}")
            print()

            if stats['failed'] > 0:
                print("⚠️  Some blueprints failed - check logs for details")
                sys.exit(1)
            else:
                print("✓ All blueprints processed successfully")
                sys.exit(0)

        finally:
            db_session.close()

    except Exception as e:
        logger.error("seeder.fatal_error", error=str(e), exc_info=True)
        print(f"\n✗ FATAL ERROR: {str(e)}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
