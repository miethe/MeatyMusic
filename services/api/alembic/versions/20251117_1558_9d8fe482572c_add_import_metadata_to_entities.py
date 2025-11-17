"""add_import_metadata_to_entities

Adds import provenance tracking columns (imported_at, import_source_filename)
to all entity tables: blueprints, personas, styles, lyrics, producer_notes.

Revision ID: 9d8fe482572c
Revises: 698242fd277f
Create Date: 2025-11-17 15:58:52.308087

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9d8fe482572c'
down_revision = '698242fd277f'
branch_labels = None
depends_on = None


def upgrade():
    """Add import metadata columns to all entity tables."""

    # List of entity tables to update
    entity_tables = ['blueprints', 'personas', 'styles', 'lyrics', 'producer_notes']

    for table_name in entity_tables:
        # Add imported_at column
        op.add_column(
            table_name,
            sa.Column('imported_at', sa.DateTime(timezone=True), nullable=True)
        )

        # Add import_source_filename column
        op.add_column(
            table_name,
            sa.Column('import_source_filename', sa.String(255), nullable=True)
        )


def downgrade():
    """Remove import metadata columns from all entity tables."""

    # List of entity tables to update
    entity_tables = ['blueprints', 'personas', 'styles', 'lyrics', 'producer_notes']

    for table_name in entity_tables:
        # Drop columns in reverse order
        op.drop_column(table_name, 'import_source_filename')
        op.drop_column(table_name, 'imported_at')
