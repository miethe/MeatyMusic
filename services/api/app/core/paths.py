"""Filesystem locations of repo-level data (blueprints, taxonomies).

The blueprint markdown files and the tag conflict matrix live at the repository
root, outside the API package. Resolve that root from this file's location
instead of hardcoding an absolute path, so the API works from any checkout.
Set ``MEATYMUSIC_REPO_ROOT`` to point elsewhere (e.g. a container mount).
"""

from __future__ import annotations

import os
from pathlib import Path


def _resolve_repo_root() -> Path:
    override = os.environ.get("MEATYMUSIC_REPO_ROOT")
    if override:
        return Path(override)

    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "taxonomies").is_dir() and (parent / "docs").is_dir():
            return parent

    # No repo-level data found (e.g. a container holding only services/api):
    # fall back to the API root so lookups fail with a clear "not found".
    return here.parents[2]


REPO_ROOT = _resolve_repo_root()
BLUEPRINT_DIR = REPO_ROOT / "docs" / "hit_song_blueprint" / "AI"
CONFLICT_MATRIX_PATH = REPO_ROOT / "taxonomies" / "conflict_matrix.json"
