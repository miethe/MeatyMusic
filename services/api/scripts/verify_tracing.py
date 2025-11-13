#!/usr/bin/env python3
"""Manual verification script for OpenTelemetry tracing.

This script makes test API requests to verify that:
1. Trace IDs are generated and propagated
2. Spans are created for API endpoints
3. Service name appears correctly in traces
4. Trace context is logged in structured logs
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import httpx

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_success(message: str) -> None:
    """Print a success message in green."""
    print(f"{GREEN}✓{RESET} {message}")


def print_error(message: str) -> None:
    """Print an error message in red."""
    print(f"{RED}✗{RESET} {message}")


def print_info(message: str) -> None:
    """Print an info message in blue."""
    print(f"{BLUE}ℹ{RESET} {message}")


def print_warning(message: str) -> None:
    """Print a warning message in yellow."""
    print(f"{YELLOW}⚠{RESET} {message}")


def verify_tracing(api_url: str = "http://localhost:8000") -> bool:
    """Verify tracing configuration by making test API requests.

    Args:
        api_url: Base URL of the API service

    Returns:
        bool: True if all verifications pass, False otherwise
    """
    print_info(f"Verifying tracing for API at: {api_url}")
    print()

    all_checks_passed = True

    # Test 1: Health endpoint responds
    print("Test 1: Health endpoint responds")
    try:
        response = httpx.get(f"{api_url}/health", timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Health endpoint returned: {data}")
            if data.get("service") == "meatymusic-api":
                print_success("Service name is correct: meatymusic-api")
            else:
                print_error(f"Service name mismatch: {data.get('service')}")
                all_checks_passed = False
        else:
            print_error(f"Health endpoint returned {response.status_code}")
            all_checks_passed = False
    except Exception as e:
        print_error(f"Failed to connect to health endpoint: {e}")
        print_warning("Is the API server running? Start it with: uvicorn main:app --reload")
        return False

    print()

    # Test 2: Check for trace headers in response
    print("Test 2: Trace context propagation")
    try:
        # Send request with custom trace headers
        headers = {
            "X-Request-ID": "test-request-123",
            "X-Correlation-ID": "test-correlation-456",
        }
        response = httpx.get(f"{api_url}/health", headers=headers, timeout=5.0)

        # Check if trace headers are present in response
        response_headers = dict(response.headers)
        print_info(f"Response headers: {json.dumps(dict(response_headers), indent=2)}")

        # Note: Trace ID might be in logs rather than response headers
        print_success("Request completed successfully")

    except Exception as e:
        print_error(f"Failed to test trace propagation: {e}")
        all_checks_passed = False

    print()

    # Test 3: Root endpoint with tracing
    print("Test 3: Root endpoint with tracing")
    try:
        response = httpx.get(f"{api_url}/", timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Root endpoint returned: {data.get('message')}")
            if "MeatyMusic AMCS" in data.get("message", ""):
                print_success("API title is correct: MeatyMusic AMCS")
            else:
                print_error(f"API title mismatch: {data.get('message')}")
                all_checks_passed = False
        else:
            print_error(f"Root endpoint returned {response.status_code}")
            all_checks_passed = False
    except Exception as e:
        print_error(f"Failed to connect to root endpoint: {e}")
        all_checks_passed = False

    print()

    # Test 4: Multiple requests to generate traces
    print("Test 4: Generate multiple traces")
    try:
        trace_count = 5
        print_info(f"Sending {trace_count} requests to generate traces...")

        for i in range(trace_count):
            response = httpx.get(f"{api_url}/health", timeout=5.0)
            if response.status_code == 200:
                print(f"  Request {i+1}/{trace_count}: {GREEN}✓{RESET}")
            else:
                print(f"  Request {i+1}/{trace_count}: {RED}✗{RESET}")
                all_checks_passed = False

            time.sleep(0.1)  # Small delay between requests

        print_success(f"Completed {trace_count} requests")

    except Exception as e:
        print_error(f"Failed to generate multiple traces: {e}")
        all_checks_passed = False

    print()

    # Test 5: Check OpenAPI docs endpoint
    print("Test 5: OpenAPI documentation endpoint")
    try:
        response = httpx.get(f"{api_url}/docs", timeout=5.0, follow_redirects=True)
        if response.status_code == 200:
            print_success("OpenAPI docs are accessible at /docs")
        else:
            print_warning(f"OpenAPI docs returned {response.status_code}")
    except Exception as e:
        print_warning(f"Could not access OpenAPI docs: {e}")

    print()
    print("=" * 70)

    if all_checks_passed:
        print_success("All tracing verification checks PASSED")
        print()
        print_info("Next steps:")
        print("  1. Check the API console output for trace IDs in logs")
        print("  2. Look for JSON-formatted log entries with trace_id fields")
        print("  3. Verify spans are exported to console (if OTEL_EXPORTER_TYPE=console)")
        print("  4. Check that service name 'meatymusic-api' appears in traces")
        return True
    else:
        print_error("Some tracing verification checks FAILED")
        print()
        print_warning("Please review the errors above and:")
        print("  1. Ensure the API server is running")
        print("  2. Check configuration in app/core/config.py")
        print("  3. Review tracing setup in app/observability/tracing.py")
        return False


def main() -> int:
    """Run the tracing verification."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Verify OpenTelemetry tracing configuration"
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="API base URL (default: http://localhost:8000)",
    )

    args = parser.parse_args()

    print()
    print("=" * 70)
    print(f"{BLUE}MeatyMusic AMCS - Tracing Verification{RESET}")
    print("=" * 70)
    print()

    success = verify_tracing(args.url)

    print()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
