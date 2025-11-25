"""User-related schemas and DTOs."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, computed_field

from app.models.enums import UserRole


class UserResponse(BaseModel):
    """Response schema for user data.

    Matches frontend User interface in apps/web/src/types/api.ts
    """

    id: str = Field(..., description="User's unique identifier")
    email: str = Field(..., description="User's email address")
    first_name: Optional[str] = Field(None, description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")
    username: Optional[str] = Field(None, description="User's username")
    role: UserRole = Field(..., description="User's role (user or admin)")
    is_active: bool = Field(..., description="Whether the user account is active")
    email_verified: bool = Field(..., description="Whether the email is verified")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_login_at: Optional[datetime] = Field(None, description="Last login timestamp")

    @computed_field
    @property
    def name(self) -> Optional[str]:
        """Computed full name from first and last name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name

    model_config = {"from_attributes": True}
