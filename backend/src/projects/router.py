from typing import Annotated, List
from fastapi import APIRouter, Depends, status
import uuid
from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.projects.dependencies import get_project_service
from src.projects.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from src.projects.service import ProjectService

router = APIRouter(tags=["Projects"])

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
):
    """Registers a new project workspace inside an organization."""
    return await service.create_project(data)

@router.get("/organizations/{org_id}/projects", response_model=List[ProjectResponse])
async def list_projects(
    org_id: uuid.UUID,
    service: Annotated[ProjectService, Depends(get_project_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100,
):
    """Retrieves all projects associated with a given organization."""
    return await service.list_projects(org_id, skip, limit)

@router.get("/organizations/{org_id}/projects/{slug}", response_model=ProjectResponse)
async def get_project(
    org_id: uuid.UUID,
    slug: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
):
    """Fetches details of a project by organization ID and project slug."""
    return await service.get_project(org_id, slug)

@router.put("/organizations/{org_id}/projects/{slug}", response_model=ProjectResponse)
async def update_project(
    org_id: uuid.UUID,
    slug: str,
    data: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ProjectService, Depends(get_project_service)],
):
    """Modifies settings of an existing project."""
    return await service.update_project(org_id, slug, data)
