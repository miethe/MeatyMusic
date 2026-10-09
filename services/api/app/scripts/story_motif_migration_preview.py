"""Read-only preview and fingerprint for the additive story/motif migration."""

import hashlib
import json

from sqlalchemy import inspect, text

from app.db.session import SessionLocal

TABLES = ["song_stories", "song_motifs", "idempotency_records"]
DOWNGRADE = [
    "DROP TABLE idempotency_records",
    "DROP TABLE song_motifs",
    "DROP TABLE song_stories",
]


def build_preview(session):
    """Describe tables to add and fingerprint protected reference tables."""
    inspector = inspect(session.bind)
    digest = hashlib.sha256()
    counts = {}
    for table in ("songs", "workflow_runs"):
        counts[table] = session.execute(
            text(f"SELECT COUNT(*) FROM {table}")
        ).scalar() or 0
        columns = [column["name"] for column in inspector.get_columns(table)]
        order = ", ".join(columns)
        rows = session.execute(
            text(f"SELECT {order} FROM {table} ORDER BY id")
        ).mappings()
        for row in rows:
            encoded = json.dumps(
                dict(row),
                sort_keys=True,
                default=str,
                ensure_ascii=False,
                separators=(",", ":"),
            )
            digest.update(encoded.encode())
            digest.update(b"\n")
    return {
        "tables_to_create": TABLES,
        "reference_counts": counts,
        "rows_modified_in_existing_tables": 0,
        "existing_rows_sha256": digest.hexdigest(),
        "reversible": True,
        "downgrade_statements": DOWNGRADE,
    }


def main():
    """Print the preview as formatted JSON."""
    with SessionLocal() as session:
        print(json.dumps(build_preview(session), indent=2))


if __name__ == "__main__":
    main()
