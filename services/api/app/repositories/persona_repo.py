"""Persona repository with RLS enforcement and profile queries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List, Dict, Any, Union
from uuid import UUID

from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.persona import Persona
from .base import BaseRepository


@dataclass
class PersonaRepository(BaseRepository[Persona]):
    """Data access methods for personas with RLS enforcement.

    All methods automatically enforce owner-based row-level security when
    security context is set.
    """

    model_class = Persona  # Type annotation for generic list operations

    def get_by_id(self, id: UUID) -> Optional[Persona]:
        """Get persona by ID with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.get_by_id().

        Parameters
        ----------
        id : UUID
            The persona ID to retrieve

        Returns
        -------
        Optional[Persona]
            Persona if found and accessible, None otherwise
        """
        return super().get_by_id(self.model_class, id)

    def update(self, id: UUID, data: Union[Dict[str, Any], BaseModel]) -> Optional[Persona]:
        """Update persona with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.update().

        Parameters
        ----------
        id : UUID
            The persona ID to update
        data : Union[Dict[str, Any], BaseModel]
            Update data as dictionary or Pydantic model

        Returns
        -------
        Optional[Persona]
            Updated persona if found and accessible, None otherwise
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump(exclude_unset=True)
        else:
            data_dict = data
        return super().update(self.model_class, id, data_dict)

    def delete(self, id: UUID) -> bool:
        """Delete persona with security filtering (soft delete).

        Convenience wrapper that uses self.model_class to call BaseRepository.delete().

        Parameters
        ----------
        id : UUID
            The persona ID to delete

        Returns
        -------
        bool
            True if deleted, False if not found
        """
        return super().delete(self.model_class, id)

    def create(self, data: Union[Dict[str, Any], BaseModel]) -> Persona:
        """Create persona with security filtering.

        Convenience wrapper that uses self.model_class to call BaseRepository.create().

        Parameters
        ----------
        data : Union[Dict[str, Any], BaseModel]
            Create data as dictionary or Pydantic model

        Returns
        -------
        Persona
            Created persona
        """
        # Convert Pydantic model to dict if needed
        if isinstance(data, BaseModel):
            data_dict = data.model_dump()
        else:
            data_dict = data
        return super().create(self.model_class, data_dict)

    def get_by_name(self, name: str) -> Optional[Persona]:
        """Get persona by name with security filtering.

        Parameters
        ----------
        name : str
            The persona name to search for

        Returns
        -------
        Optional[Persona]
            Persona if found and accessible, None otherwise
        """
        query = self.db.query(Persona).filter(
            Persona.name == name,
            Persona.deleted_at.is_(None)
        )

        # Apply row-level security
        guard = self.get_unified_guard(Persona)
        if guard:
            query = guard.filter_query(query)

        return query.first()

    def search_by_influences(self, influences: List[str]) -> List[Persona]:
        """Search personas by their influences.

        Parameters
        ----------
        influences : List[str]
            List of influence names to search for

        Returns
        -------
        List[Persona]
            Personas with any of the specified influences
        """
        query = self.db.query(Persona).filter(
            Persona.deleted_at.is_(None)
        )

        # PostgreSQL array overlap operator for influence search
        # influences && ARRAY['artist1', 'artist2']
        if influences:
            query = query.filter(
                Persona.influences.op('&&')(influences)
            )

        # Apply row-level security
        guard = self.get_unified_guard(Persona)
        if guard:
            query = guard.filter_query(query)

        return query.all()

    def get_by_vocal_range(
        self,
        min_range: Optional[str] = None,
        max_range: Optional[str] = None
    ) -> List[Persona]:
        """Get personas by vocal range.

        Parameters
        ----------
        min_range : Optional[str]
            Minimum vocal range (e.g., 'C3')
        max_range : Optional[str]
            Maximum vocal range (e.g., 'C6')

        Returns
        -------
        List[Persona]
            Personas within the specified vocal range
        """
        query = self.db.query(Persona).filter(
            Persona.deleted_at.is_(None)
        )

        # Filter by vocal range using JSONB operators
        if min_range:
            query = query.filter(
                Persona.vocal_profile['range']['min'].astext == min_range
            )
        if max_range:
            query = query.filter(
                Persona.vocal_profile['range']['max'].astext == max_range
            )

        # Apply row-level security
        guard = self.get_unified_guard(Persona)
        if guard:
            query = guard.filter_query(query)

        return query.all()
