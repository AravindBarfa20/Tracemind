from typing import Annotated, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.services_registry.dependencies import get_services_registry_service
from src.services_registry.schemas import (
    ServiceCreate,
    ServiceListResponse,
    ServiceResponse,
    ServiceUpdate,
)
from src.services_registry.service import ServiceRegistryService

router = APIRouter(tags=["Services"])

@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def register_service(
    data: ServiceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Registers a new microservice under observation within the current project workspace."""
    if not data.project_id:
        data.project_id = current_user.active_project_id
    return await service.register_service(data, current_user.id)

@router.get("/services", response_model=ServiceListResponse)
async def list_services_global(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    team: Optional[str] = None,
    environment: Optional[str] = None,
    search: Optional[str] = None,
):
    """Retrieves all registered services mapped to the current active project workspace."""
    return await service.list_services(
        project_id=current_user.active_project_id,
        page=page,
        page_size=page_size,
        status=status,
        team=team,
        environment=environment,
        search=search,
    )

@router.get("/services/{slug}", response_model=ServiceResponse)
async def get_service_global(
    slug: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Fetches details of a registered service profile by slug inside current project scope."""
    return await service.get_service(current_user.active_project_id, slug)

@router.put("/services/{slug}", response_model=ServiceResponse)
async def update_service_global(
    slug: str,
    data: ServiceUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Modifies configuration details of an existing service registration."""
    return await service.update_service(current_user.active_project_id, slug, data)

@router.delete("/services/{slug}", response_model=ServiceResponse)
async def deactivate_service_global(
    slug: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Toggles service status to 'inactive' to soft-delete the registration."""
    return await service.deactivate_service(current_user.active_project_id, slug)

@router.get("/services/{slug}/health")
async def check_health_global(
    slug: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Performs an active, live health ping check of the microservice endpoint."""
    return await service.check_health(current_user.active_project_id, slug)


# ----------------------------------------------------
# Project scoped routes kept for backward compatibility
# ----------------------------------------------------

@router.get("/projects/{project_id}/services", response_model=ServiceListResponse)
async def list_services(
    project_id: uuid.UUID,
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    team: Optional[str] = None,
    environment: Optional[str] = None,
    search: Optional[str] = None,
):
    """Retrieves all registered services mapped to a project workspace."""
    return await service.list_services(
        project_id=project_id,
        page=page,
        page_size=page_size,
        status=status,
        team=team,
        environment=environment,
        search=search,
    )

@router.get("/projects/{project_id}/services/{slug}", response_model=ServiceResponse)
async def get_service(
    project_id: uuid.UUID,
    slug: str,
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Fetches details of a registered service profile by slug inside project scope."""
    return await service.get_service(project_id, slug)

@router.put("/projects/{project_id}/services/{slug}", response_model=ServiceResponse)
async def update_service(
    project_id: uuid.UUID,
    slug: str,
    data: ServiceUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Modifies configuration details of an existing service registration."""
    return await service.update_service(project_id, slug, data)

@router.delete("/projects/{project_id}/services/{slug}", response_model=ServiceResponse)
async def deactivate_service(
    project_id: uuid.UUID,
    slug: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Toggles service status to 'inactive' to soft-delete the registration."""
    return await service.deactivate_service(project_id, slug)

@router.get("/projects/{project_id}/services/{slug}/health")
async def check_health(
    project_id: uuid.UUID,
    slug: str,
    service: Annotated[ServiceRegistryService, Depends(get_services_registry_service)],
):
    """Performs an active, live health ping check of the microservice endpoint."""
    return await service.check_health(project_id, slug)
