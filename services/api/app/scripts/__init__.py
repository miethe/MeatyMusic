"""Database seeding and utility scripts for MeatyMusic.

Available Scripts
-----------------

seed_blueprints:
    Parse genre blueprint markdown files and populate the database.

    Usage:
        # Dry run (parse only, no database changes)
        uv run python -m app.scripts.seed_blueprints --dry-run

        # Seed database with blueprints
        uv run python -m app.scripts.seed_blueprints

        # Force update existing blueprints
        uv run python -m app.scripts.seed_blueprints --force

    See docs/blueprint_seeder.md for full documentation.
"""
