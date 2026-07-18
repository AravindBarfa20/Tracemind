import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ProjectCreate(BaseModel):
    """Schema for registering a new project within an organization."""
    name: str = Field(..., min_length=1, max_length=255, description="Name of the project")
    organization_id: uuid.UUID = Field(..., description="Target organization UUID")


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class ProjectResponse(BaseModel):
    """Standardized response schema containing project details."""
    id: uuid.UUID
    name: str
    slug: str
    organization_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
