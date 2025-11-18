"""Test configuration for unit tests.

Sets up minimal environment variables required for unit test imports.
This ensures Settings validation passes during module import without requiring
actual production configuration.
"""

import os
import sys
from pathlib import Path

# Add services/api to Python path for imports
api_path = Path(__file__).parent.parent / "services" / "api"
sys.path.insert(0, str(api_path))

# Set minimal test environment variables required for Settings validation
# These must be set BEFORE any app imports that trigger Settings()
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("DATABASE_URL_TEST", "sqlite:///:memory:")
os.environ.setdefault("CLERK_WEBHOOK_SECRET", "whsec_test_secret")
os.environ.setdefault("CLERK_JWKS_URL", "https://test.clerk.accounts.dev/.well-known/jwks.json")
os.environ.setdefault("CLERK_JWT_ISSUER", "https://test.clerk.accounts.dev")
os.environ.setdefault("ENVIRONMENT", "test")
