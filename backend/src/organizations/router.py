from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.organizations.dependencies import get_organization_service
from src.organizations.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from src.organizations.service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
):
    """Registers a new organization tenant."""
    return await service.create_organization(data, current_user.id)

@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    service: Annotated[OrganizationService, Depends(get_organization_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100,
):
    """Lists all registered organizations."""
    return await service.list_organizations(skip, limit)

@router.get("/{slug}", response_model=OrganizationResponse)
async def get_organization(
    slug: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
):
    """Fetches details of an organization by its slug."""
    return await service.get_organization(slug)

@router.put("/{slug}", response_model=OrganizationResponse)
async def update_organization(
    slug: str,
    data: OrganizationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[OrganizationService, Depends(get_organization_service)],
):
    """Modifies the name or metadata of an organization."""
    # Note: Ownership/RBAC check will be added in Phase 3
    return await service.update_organization(slug, data)
