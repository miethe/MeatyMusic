#!/usr/bin/env python3
"""Validate backend infrastructure imports."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load validation environment variables
validation_env = Path(__file__).parent / ".env.validation"
if validation_env.exists():
    load_dotenv(validation_env)

# Add app to path
sys.path.insert(0, str(Path(__file__).parent / "app"))


def validate_imports():
    """Test core infrastructure imports."""
    errors = []

    try:
        print("Testing core imports...")
        # Import individual modules to avoid instantiation issues
        from core import logging, dependencies
        from core.security import security_context, repository_factory

        print("  ✓ Core imports successful")
    except Exception as e:
        errors.append(f"Core imports failed: {e}")
        print(f"  ✗ Core imports failed: {e}")

    try:
        print("Testing config import...")
        # Test config separately since it instantiates settings
        from core import config

        print("  ✓ Config import successful")
    except Exception as e:
        errors.append(f"Config import failed: {e}")
        print(f"  ✗ Config import failed: {e}")

    try:
        print("Testing observability imports...")
        from observability import tracing, log_processors

        print("  ✓ Observability imports successful")
    except Exception as e:
        errors.append(f"Observability imports failed: {e}")
        print(f"  ✗ Observability imports failed: {e}")

    try:
        print("Testing middleware imports...")
        from middleware import correlation, request_logger

        print("  ✓ Middleware imports successful")
    except Exception as e:
        errors.append(f"Middleware imports failed: {e}")
        print(f"  ✗ Middleware imports failed: {e}")

    try:
        print("Testing database imports...")
        from db import session, rls

        print("  ✓ Database imports successful")
    except Exception as e:
        errors.append(f"Database imports failed: {e}")
        print(f"  ✗ Database imports failed: {e}")

    try:
        print("Testing repository imports...")
        # Import repositories using absolute imports
        import repositories.base
        import repositories.cache_aware_base

        print("  ✓ Repository imports successful")
    except Exception as e:
        errors.append(f"Repository imports failed: {e}")
        print(f"  ✗ Repository imports failed: {e}")

    try:
        print("Testing schema imports...")
        from schemas import pagination, auth

        print("  ✓ Schema imports successful")
    except Exception as e:
        errors.append(f"Schema imports failed: {e}")
        print(f"  ✗ Schema imports failed: {e}")

    return errors


if __name__ == "__main__":
    print("=" * 60)
    print("MeatyMusic AMCS Backend Infrastructure Validation")
    print("=" * 60)

    errors = validate_imports()

    print("\n" + "=" * 60)
    if errors:
        print(f"✗ Validation FAILED with {len(errors)} error(s):")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("✓ Validation PASSED - All infrastructure imports successful")
        sys.exit(0)
