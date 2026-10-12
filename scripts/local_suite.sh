#!/usr/bin/env bash
set -euo pipefail

export UV_CACHE_DIR="${UV_CACHE_DIR:-${TMPDIR:-/tmp}/meatymusic-uv-cache}"

pnpm --filter web test
(
  cd services/api
  uv run --frozen pytest app/tests/test_services/ -q
  uv run --frozen pytest app/tests/test_api/ -q
  uv run --frozen pytest tests/unit/services/test_policy_guards.py -q
)
