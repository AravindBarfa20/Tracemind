import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class OrganizationCreate(BaseModel):
    """Schema for registering a new tenant organization."""
    name: str = Field(..., min_length=1, max_length=255, description="Name of the organization")


class OrganizationUpdate(BaseModel):
    """Schema for updating an existing organization."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class OrganizationResponse(BaseModel):
    """Standardized response schema containing organization details."""
    id: uuid.UUID
    name: str
    slug: str
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
