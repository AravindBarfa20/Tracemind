from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.organizations.dependencies import get_organization_repository
from src.organizations.repository import OrganizationRepository
from src.projects.repository import ProjectRepository
from src.projects.service import ProjectService

async def get_project_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> ProjectRepository:
    """Dependency injection wrapper for ProjectRepository."""
    return ProjectRepository(db)

async def get_project_service(
    repo: Annotated[ProjectRepository, Depends(get_project_repository)],
    org_repo: Annotated[OrganizationRepository, Depends(get_organization_repository)],
) -> ProjectService:
    """Dependency injection wrapper for ProjectService."""
    return ProjectService(repo, org_repo)
