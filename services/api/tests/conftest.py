"""Test configuration for unit tests.

Sets up minimal environment variables required for unit test imports.
"""

import os

# Set minimal test environment variables required for Settings validation
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("DATABASE_URL_TEST", "sqlite:///:memory:")
os.environ.setdefault("CLERK_WEBHOOK_SECRET", "whsec_test_secret")
os.environ.setdefault("CLERK_JWKS_URL", "https://test.clerk.accounts.dev/.well-known/jwks.json")
os.environ.setdefault("CLERK_JWT_ISSUER", "https://test.clerk.accounts.dev")
os.environ.setdefault("ENVIRONMENT", "test")
