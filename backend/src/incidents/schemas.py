import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

class IncidentCreate(BaseModel):
    service_id: uuid.UUID = Field(..., description="Target service UUID")
    title: str = Field(..., min_length=1, max_length=255, description="Incident title")
    description: Optional[str] = Field(None, description="Description detailing context")
    severity: Literal["critical", "warning", "info"] = Field(..., description="Severity level")

class IncidentUpdate(BaseModel):
    status: Literal["triggered", "acknowledged", "resolved"] = Field(..., description="Resolving state status")

class IncidentResponse(BaseModel):
    id: uuid.UUID
    service_id: uuid.UUID
    title: str
    description: Optional[str]
    severity: str
    status: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
