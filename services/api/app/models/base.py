"""Base model for all SQLAlchemy models."""

from sqlalchemy.orm import DeclarativeBase
from app.db.functions.uuid_v7 import UUIDv7Mixin


class Base(UUIDv7Mixin, DeclarativeBase):
    """Base class for all database models."""

    pass
