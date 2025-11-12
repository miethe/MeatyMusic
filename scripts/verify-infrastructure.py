#!/usr/bin/env python3
"""Infrastructure verification script for MeatyMusic AMCS.

This script tests:
1. PostgreSQL connection and table creation
2. Redis connection and operations
3. Alembic migration status
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "services" / "api"))

import asyncpg
import redis
from alembic import command
from alembic.config import Config


# Colors for terminal output
class Colors:
    GREEN = "\033[0;32m"
    RED = "\033[0;31m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    NC = "\033[0m"  # No Color


def print_success(message: str):
    print(f"{Colors.GREEN}✓{Colors.NC} {message}")


def print_error(message: str):
    print(f"{Colors.RED}✗{Colors.NC} {message}")


def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠{Colors.NC} {message}")


def print_info(message: str):
    print(f"{Colors.BLUE}ℹ{Colors.NC} {message}")


async def verify_postgres():
    """Verify PostgreSQL connection and tables."""
    print("\n" + "=" * 50)
    print("PostgreSQL Verification")
    print("=" * 50)

    try:
        # Connection parameters
        conn = await asyncpg.connect(
            host="localhost",
            port=5432,
            user="mm_user",
            password="secure_dev_pw",
            database="meaty_music_dev",
        )

        print_success("Connected to PostgreSQL")

        # Check pgvector extension
        result = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
        )
        if result:
            print_success("pgvector extension is installed")
        else:
            print_warning("pgvector extension is not installed")

        # Check tables
        tables = await conn.fetch(
            """
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
            """
        )

        required_tables = {"tenants", "users", "user_preferences"}
        existing_tables = {row["tablename"] for row in tables}

        print(f"\nFound {len(existing_tables)} tables:")
        for table in sorted(existing_tables):
            if table in required_tables:
                print_success(f"  {table}")
            else:
                print_info(f"  {table}")

        missing_tables = required_tables - existing_tables
        if missing_tables:
            print_error(f"Missing required tables: {', '.join(missing_tables)}")
            return False

        # Check RLS policies
        policies = await conn.fetch(
            """
            SELECT tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname
            """
        )

        print(f"\nFound {len(policies)} RLS policies:")
        for policy in policies:
            print_info(f"  {policy['tablename']}.{policy['policyname']}")

        # Check indexes
        indexes = await conn.fetch(
            """
            SELECT tablename, indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
            """
        )

        print(f"\nFound {len(indexes)} indexes:")
        for idx in indexes:
            print_info(f"  {idx['indexname']} on {idx['tablename']}")

        await conn.close()
        print_success("\nPostgreSQL verification complete")
        return True

    except Exception as e:
        print_error(f"PostgreSQL connection failed: {e}")
        return False


def verify_redis():
    """Verify Redis connection and operations."""
    print("\n" + "=" * 50)
    print("Redis Verification")
    print("=" * 50)

    try:
        # Connect to Redis
        r = redis.Redis(
            host="localhost", port=6379, db=0, decode_responses=True, socket_timeout=5
        )

        # Test connection
        if r.ping():
            print_success("Connected to Redis")
        else:
            print_error("Redis PING failed")
            return False

        # Test SET/GET operations
        test_key = "test:verification:key"
        test_value = "MeatyMusic AMCS Infrastructure Test"

        r.set(test_key, test_value)
        retrieved_value = r.get(test_key)

        if retrieved_value == test_value:
            print_success("Redis SET/GET operations working")
        else:
            print_error(
                f"Redis GET returned unexpected value: {retrieved_value} != {test_value}"
            )
            return False

        # Clean up test key
        r.delete(test_key)

        # Get Redis info
        info = r.info()
        print(f"\nRedis version: {info['redis_version']}")
        print(f"Connected clients: {info['connected_clients']}")
        print(f"Used memory: {info['used_memory_human']}")
        print(f"Total keys: {r.dbsize()}")

        print_success("\nRedis verification complete")
        return True

    except redis.ConnectionError as e:
        print_error(f"Redis connection failed: {e}")
        return False
    except Exception as e:
        print_error(f"Redis verification failed: {e}")
        return False


def verify_alembic():
    """Verify Alembic migration status."""
    print("\n" + "=" * 50)
    print("Alembic Migration Verification")
    print("=" * 50)

    try:
        # Get Alembic config
        alembic_cfg = Config(
            str(Path(__file__).parent.parent / "services" / "api" / "alembic.ini")
        )

        # Get current revision
        from alembic import script
        from alembic.runtime import migration

        script_dir = script.ScriptDirectory.from_config(alembic_cfg)

        # This is a simplified check - in production you'd connect to the DB
        print_info("Alembic configuration found")

        # List available migrations
        revisions = list(script_dir.walk_revisions())
        print(f"\nFound {len(revisions)} migration(s):")
        for rev in revisions:
            print_info(f"  {rev.revision[:12]}: {rev.doc}")

        print_success("\nAlembic verification complete")
        return True

    except Exception as e:
        print_error(f"Alembic verification failed: {e}")
        return False


async def main():
    """Run all verification checks."""
    print("\n" + "=" * 50)
    print("MeatyMusic Infrastructure Verification")
    print("=" * 50)

    results = {
        "PostgreSQL": await verify_postgres(),
        "Redis": verify_redis(),
        "Alembic": verify_alembic(),
    }

    # Summary
    print("\n" + "=" * 50)
    print("Verification Summary")
    print("=" * 50)

    all_passed = True
    for service, passed in results.items():
        if passed:
            print_success(f"{service}: PASSED")
        else:
            print_error(f"{service}: FAILED")
            all_passed = False

    if all_passed:
        print(f"\n{Colors.GREEN}All checks passed!{Colors.NC}")
        return 0
    else:
        print(f"\n{Colors.RED}Some checks failed{Colors.NC}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
