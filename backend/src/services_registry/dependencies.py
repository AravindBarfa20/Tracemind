from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.projects.dependencies import get_project_repository
from src.projects.repository import ProjectRepository
from src.services_registry.repository import ServiceRepository
from src.services_registry.service import ServiceRegistryService

async def get_service_repository(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> ServiceRepository:
    """Dependency injection wrapper for ServiceRepository."""
    return ServiceRepository(db)

async def get_services_registry_service(
    repo: Annotated[ServiceRepository, Depends(get_service_repository)],
    project_repo: Annotated[ProjectRepository, Depends(get_project_repository)],
) -> ServiceRegistryService:
    """Dependency injection wrapper for ServiceRegistryService."""
    return ServiceRegistryService(repo, project_repo)
