from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.incidents.dependencies import get_incident_service
from src.incidents.schemas import (
    IncidentCreate,
    IncidentResponse,
    IncidentUpdate,
)
from src.incidents.service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def trigger_incident(
    data: IncidentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[IncidentService, Depends(get_incident_service)],
):
    """Registers a new triggered incident alert state for an observed service."""
    return await service.trigger_incident(data)

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[IncidentService, Depends(get_incident_service)],
    service_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
):
    """Retrieves all triggered, acknowledged, or resolved incident alerts."""
    return await service.list_incidents(service_id, status)

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[IncidentService, Depends(get_incident_service)],
):
    """Fetches full log details for a specific incident record."""
    return await service.get_incident(incident_id)

@router.put("/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: uuid.UUID,
    data: IncidentUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[IncidentService, Depends(get_incident_service)],
):
    """Updates incident status (Acknowledge alert or Resolve problem)."""
    return await service.update_incident_status(incident_id, data)
