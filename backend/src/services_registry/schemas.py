import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, HttpUrl

class ServiceCreate(BaseModel):
    """Schema for registering a new service to monitor."""
    name: str = Field(..., min_length=1, max_length=255, description="Name of the service")
    project_id: Optional[uuid.UUID] = Field(None, description="Target project UUID")
    description: Optional[str] = Field(None, max_length=1000)
    service_type: Literal["api", "worker", "cron", "frontend"] = Field(
        ..., description="Type of service (api, worker, cron, frontend)"
    )
    environment: Literal["production", "staging", "development"] = Field(
        ..., description="Environment where service is deployed"
    )
    base_url: Optional[str] = Field(None, max_length=500)
    health_endpoint: Optional[str] = Field(None, max_length=500)
    team: Optional[str] = Field(None, max_length=255)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ServiceUpdate(BaseModel):
    """Schema for updating an existing service profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    service_type: Optional[Literal["api", "worker", "cron", "frontend"]] = None
    environment: Optional[Literal["production", "staging", "development"]] = None
    base_url: Optional[str] = Field(None, max_length=500)
    health_endpoint: Optional[str] = Field(None, max_length=500)
    team: Optional[str] = Field(None, max_length=255)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[Literal["active", "inactive", "deprecated"]] = None


class ServiceResponse(BaseModel):
    """Response payload containing service registry profile details."""
    id: uuid.UUID
    name: str
    slug: str
    project_id: uuid.UUID
    organization_id: uuid.UUID
    description: Optional[str]
    service_type: str
    environment: str
    base_url: Optional[str]
    health_endpoint: Optional[str]
    team: Optional[str]
    tags: List[str]
    metadata_: Dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_", serialization_alias="metadata")
    status: str
    owner_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class ServiceListResponse(BaseModel):
    """Paginated collection of registered services."""
    items: List[ServiceResponse]
    total: int
    page: int
    page_size: int
